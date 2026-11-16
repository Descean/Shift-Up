/**
 * GET  /api/admin/soumissions — Offres déposées et leur résultat (+ listes pour les menus)
 * POST /api/admin/soumissions — Enregistrer une offre déposée, que Tendo suivra
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isSafe } from "@/lib/validation";
import { marquerEchues } from "@/lib/soumissions";

async function admin() {
  const s = await getServerSession(authOptions);
  return s?.user?.id && ["ADMIN", "DEVELOPER"].includes(s.user.role as string) ? s : null;
}
const txt = (min: number, max: number) => z.string().trim().min(min).max(max).refine(isSafe, "Contenu non autorisé détecté.");
const opt = (max: number) => txt(0, max).optional().nullable().transform((v) => v || null);

const schemaSoumission = z.object({
  entrepriseNom: txt(2, 200),
  entrepriseSigle: opt(60),
  entrepriseId: z.string().optional().nullable().transform((v) => v || null),
  prestationId: z.string().optional().nullable().transform((v) => v || null),
  reference: opt(150),
  autorite: txt(2, 250),
  objet: txt(5, 1000),
  lots: opt(200),
  dateDepot: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date de dépôt invalide."),
  validiteJours: z.coerce.number().int().min(15, "Validité minimale : 15 jours.").max(365),
  montantOffre: z.coerce.number().min(0).max(1e13).optional().nullable(),
  note: opt(1000),
});

const indisponible = () =>
  NextResponse.json({ error: "Table absente : exécutez prisma/sql/2026-11_resultats_dossiers.sql dans Supabase.", indisponible: true }, { status: 503 });

export async function GET() {
  if (!(await admin())) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  try {
    await marquerEchues();
    const [soumissions, entreprises, prestations] = await Promise.all([
      prisma.soumission.findMany({ orderBy: [{ dateDepot: "desc" }], take: 500 }),
      prisma.entreprise.findMany({ select: { id: true, nom: true }, orderBy: { nom: "asc" }, take: 500 }),
      prisma.prestation.findMany({
        where: { service: { is: { domain: "Dossiers" } } },
        select: { id: true, customService: true, company: true, service: { select: { title: true } }, client: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
    ]);
    return NextResponse.json({ soumissions, entreprises, prestations });
  } catch (e) {
    console.error("[admin/soumissions]", e);
    return indisponible();
  }
}

export async function POST(req: NextRequest) {
  if (!(await admin())) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  const corps = schemaSoumission.safeParse(await req.json().catch(() => null));
  if (!corps.success) return NextResponse.json({ error: corps.error.issues[0]?.message ?? "Données invalides." }, { status: 400 });
  const { dateDepot, montantOffre, ...reste } = corps.data;
  try {
    const s = await prisma.soumission.create({
      data: { ...reste, montantOffre: montantOffre || null, dateDepot: new Date(`${dateDepot}T12:00:00Z`) },
    });
    return NextResponse.json({ ok: true, id: s.id, message: "Offre enregistrée : Tendo suivra son résultat." });
  } catch (e) {
    console.error("[admin/soumissions] création", e);
    return indisponible();
  }
}
