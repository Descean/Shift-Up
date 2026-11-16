/**
 * GET /api/chiffres — Chiffres clés publics de SHIFT UP (dossiers montés, entreprises accompagnées,
 * dossiers gagnés). Lu par la page d'accueil de Tendo (tendo.shiftup.bj). Mis en cache une heure.
 */
import { NextResponse } from "next/server";
import { getChiffresAccueil } from "@/lib/accueil";

export const revalidate = 3600;

export async function GET() {
  const chiffres = await getChiffresAccueil();
  return NextResponse.json(chiffres, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
