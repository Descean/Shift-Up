/** GET /api/client/dossiers/[id] — Fiche d'un dossier du client (liens des fichiers seulement après le solde). */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { chargerDossier } from "@/lib/dossier-serveur";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const { id } = await params;
  const r = await chargerDossier(id, "client");
  if (!r || r.p.clientId !== session.user.id) return NextResponse.json({ error: "Dossier introuvable." }, { status: 404 });
  return NextResponse.json({ dossier: r.dossier });
}
