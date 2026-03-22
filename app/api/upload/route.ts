/**
 * POST /api/upload — Upload un fichier vers Supabase Storage
 * Retourne l'URL publique du fichier uploadé.
 * Bucket attendu : "prestations" (créer dans Supabase Dashboard > Storage)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf",
  "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip", "application/x-zip-compressed",
  "text/plain",
  // Audio (notes vocales)
  "audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/wav",
  // Video livrables
  "video/mp4", "video/webm", "video/quicktime",
  // Design files
  "application/octet-stream",
];

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "Aucun fichier fourni." }, { status: 400 });
    if (file.size > MAX_SIZE) return NextResponse.json({ error: "Fichier trop volumineux (max 10 MB)." }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: "Type de fichier non autorisé." }, { status: 400 });

    const ext = file.name.split(".").pop() ?? "bin";
    const path = `${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("prestations")
      .upload(path, buffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json({ error: "Erreur lors de l'upload." }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage.from("prestations").getPublicUrl(path);

    return NextResponse.json({ url: publicUrl, name: file.name, size: file.size });
  } catch (error) {
    console.error("POST /api/upload error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
