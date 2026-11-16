/**
 * GET /api/tendo/soumissions — Offres déposées dont Tendo doit chercher le résultat.
 * Réservé à Tendo : en-tête « Authorization: Bearer <TENDO_API_KEY> ».
 * Au passage, les offres dont le délai de suivi est écoulé passent en « À vérifier ».
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { marquerEchues } from "@/lib/soumissions";
import { tendoAutorise } from "./auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!tendoAutorise(req)) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  try {
    const echues = await marquerEchues();
    const soumissions = await prisma.soumission.findMany({
      where: { resultat: "EN_ATTENTE" },
      select: {
        id: true, reference: true, autorite: true, objet: true, lots: true,
        entrepriseNom: true, entrepriseSigle: true, dateDepot: true, validiteJours: true,
      },
      orderBy: { dateDepot: "asc" },
    });
    if (soumissions.length) {
      await prisma.soumission.updateMany({
        where: { id: { in: soumissions.map((s) => s.id) } },
        data: { derniereVerification: new Date() },
      });
    }
    return NextResponse.json({ soumissions, echues });
  } catch (e) {
    console.error("[tendo/soumissions]", e);
    return NextResponse.json({ error: "Table Soumission absente : exécutez prisma/sql/2026-11_resultats_dossiers.sql." }, { status: 503 });
  }
}
