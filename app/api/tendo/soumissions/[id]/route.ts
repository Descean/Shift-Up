/**
 * POST /api/tendo/soumissions/:id — Tendo signale le résultat trouvé dans un PV d'attribution.
 * Corps : { resultat: "GAGNE" | "NON_RETENU", attributaire, montantAttribue?, preuveUrl? }
 * Un résultat déjà saisi à la main (GAGNE / NON_RETENU) n'est jamais écrasé.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { appliquerResultat } from "@/lib/soumissions";
import { tendoAutorise } from "../auth";

const schema = z.object({
  resultat: z.enum(["GAGNE", "NON_RETENU"]),
  attributaire: z.string().trim().min(2).max(300),
  montantAttribue: z.number().positive().max(1e13).optional().nullable(),
  preuveUrl: z.string().url().max(1000).optional().nullable(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!tendoAutorise(req)) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  const { id } = await params;
  const corps = schema.safeParse(await req.json().catch(() => null));
  if (!corps.success) return NextResponse.json({ error: corps.error.issues[0]?.message ?? "Données invalides." }, { status: 400 });

  const actuelle = await prisma.soumission.findUnique({ where: { id }, select: { resultat: true } });
  if (!actuelle) return NextResponse.json({ error: "Soumission introuvable." }, { status: 404 });
  if (actuelle.resultat === "GAGNE" || actuelle.resultat === "NON_RETENU") {
    return NextResponse.json({ ok: true, ignore: "résultat déjà enregistré" });
  }
  await appliquerResultat(id, { ...corps.data, detecteParTendo: true });
  return NextResponse.json({ ok: true });
}
