/** POST /api/equipe/dossiers/[id]/pause { pause: boolean, motif? } — « Pièce manquante » : met le dossier en pause et alerte le client. */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { exigerDossierEquipe } from "@/lib/dossier-serveur";
import { avertirClient } from "@/lib/notifications";
import { messageSysteme } from "@/lib/fil";
import { isSafe } from "@/lib/validation";

const schema = z.object({ pause: z.boolean(), motif: z.string().trim().max(500).refine(isSafe).optional() });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await exigerDossierEquipe(id);
  if ("erreur" in a) return a.erreur;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide." }, { status: 422 });
  const p = await prisma.prestation.findUnique({ where: { id }, select: { status: true, customFields: true } });
  if (!p) return NextResponse.json({ error: "Dossier introuvable." }, { status: 404 });
  if (!["EN_COURS", "REVISION"].includes(p.status)) return NextResponse.json({ error: "Seul un dossier en production peut être mis en pause." }, { status: 409 });

  const cf = { ...((p.customFields ?? {}) as Record<string, unknown>) };
  if (parsed.data.pause) {
    const motif = parsed.data.motif || "Une pièce est manquante.";
    cf.pause = { motif, depuis: new Date().toISOString(), par: a.session.user.id };
    await prisma.prestation.update({ where: { id }, data: { customFields: cf as Prisma.InputJsonValue } });
    await messageSysteme(id, `Dossier en pause : ${motif} Merci de transmettre le document depuis votre espace.`, a.session.user.id);
    await avertirClient(id, "PIECES", "Action requise de votre part", `Une pièce est manquante : ${motif}`);
  } else {
    delete cf.pause;
    await prisma.prestation.update({ where: { id }, data: { customFields: cf as Prisma.InputJsonValue } });
    await messageSysteme(id, "Le montage reprend.", a.session.user.id);
    await avertirClient(id, "ETAPE", "Le montage reprend", "Merci, nous avons ce qu'il faut : le travail continue.", { courriel: false });
  }
  return NextResponse.json({ ok: true });
}
