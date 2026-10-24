/**
 * GET /api/fichiers/<bucket>/<chemin>[?dl=1]  → redirection vers un lien Supabase valable 5 min.
 * Accès : lien signé valide (?exp=&sig=) ou utilisateur connecté autorisé (voir peutLire).
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { BUCKET_DOCS, BUCKET_ANCIEN, lienLecture, peutLire, signatureValide } from "@/lib/fichiers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ chemin: string[] }> }) {
  const [bucket, ...reste] = (await params).chemin.map((s) => decodeURIComponent(s));
  const path = reste.join("/");
  if (![BUCKET_DOCS, BUCKET_ANCIEN].includes(bucket) || !path || path.includes("..")) {
    return NextResponse.json({ error: "Fichier introuvable." }, { status: 404 });
  }
  const sp = req.nextUrl.searchParams;
  let autorise = signatureValide(`${bucket}/${path}`, sp.get("exp"), sp.get("sig"));
  if (!autorise) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      const login = new URL("/connexion", req.url);
      login.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
      return NextResponse.redirect(login, 302);
    }
    autorise = await peutLire({ id: session.user.id, email: session.user.email, role: session.user.role }, bucket, path);
  }
  if (!autorise) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  const url = await lienLecture(bucket, path, 300, sp.get("dl") === "1" ? path.split("/").pop() : undefined);
  if (!url) return NextResponse.json({ error: "Fichier introuvable." }, { status: 404 });
  return NextResponse.redirect(url, 302);
}
