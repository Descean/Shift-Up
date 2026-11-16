/** POST /api/admin/prestations/[id]/analyse — Relance la lecture du dossier et le devis automatique. */
import { estEquipe } from "@/lib/roles";
import { exigerDossierEquipe } from "@/lib/dossier-serveur";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { analyserEtChiffrer, iaAnalyseDisponible } from "@/lib/ia-devis";

export const maxDuration = 300;

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !estEquipe(session.user.role as string)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }
  if (!iaAnalyseDisponible()) return NextResponse.json({ error: "IA non configurée : ajoutez ANTHROPIC_API_KEY dans Vercel." }, { status: 409 });
  const { id } = await params;
  { const acces = await exigerDossierEquipe(id); if ("erreur" in acces) return acces.erreur; }
  const p = await prisma.prestation.findUnique({ where: { id }, select: { status: true, quote: true } });
  if (!p) return NextResponse.json({ error: "Prestation introuvable." }, { status: 404 });
  if (p.status !== "EN_ATTENTE" || p.quote) return NextResponse.json({ error: "Un devis existe déjà : modifiez-le dans l'onglet Devis." }, { status: 409 });
  const r = await analyserEtChiffrer(id);
  return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: `Analyse impossible : ${r.raison ?? "erreur"}` }, { status: 502 });
}

/** GET — l'IA est-elle configurée ? (affiché dans l'admin) */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !estEquipe(session.user.role as string)) return NextResponse.json({}, { status: 403 });
  return NextResponse.json({ ia: iaAnalyseDisponible(), modele: process.env.IA_MODELE_ANALYSE ?? "claude-sonnet-5-5" });
}
