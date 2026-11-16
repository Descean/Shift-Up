/** GET /api/tarifs-montage — Majoration Express et prix de la livraison physique, affichés dans la demande. */
import { NextResponse } from "next/server";
import { lireTarifs } from "@/lib/reglages";

export async function GET() {
  const t = await lireTarifs();
  return NextResponse.json({ majorationExpress: t.majorationExpress, livraisonPhysique: t.livraisonPhysique, commissionMonteurs: t.commissionMonteurs, planchers: t.planchers });
}
