/**
 * GET  /api/admin/veille — Abonnés, avis collectés, état de WhatsApp
 * POST /api/admin/veille — activer | suspendre | ajouter_avis | supprimer_avis | lancer | tester_whatsapp
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isSafe } from "@/lib/validation";
import { sendVeilleStatutClient } from "@/lib/email";
import { envoyer } from "@/lib/prestations";
import { MODELES_WHATSAPP, envoyerModele, whatsappAutomatique } from "@/lib/whatsapp";
import { SECTEUR_VEILLE, TYPES_VEILLE } from "@/lib/veille/criteres";
import { dateFr, distribuer, executerVeille, tablesAbsentes } from "@/lib/veille/moteur";
import { enregistrerAvis } from "@/lib/veille/sources";

export const maxDuration = 60;

async function admin() {
  const s = await getServerSession(authOptions);
  return s?.user?.id && ["ADMIN", "DEVELOPER"].includes(s.user.role as string) ? s : null;
}
const txt = (min: number, max: number) => z.string().trim().min(min).max(max).refine(isSafe, "Contenu non autorisé détecté.");

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("activer"), abonnementId: z.string().min(1), jusquau: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date de fin invalide.") }),
  z.object({ action: z.literal("suspendre"), abonnementId: z.string().min(1) }),
  z.object({
    action: z.literal("ajouter_avis"), reference: txt(2, 150), objet: txt(5, 1000), autorite: txt(2, 200).optional().nullable(),
    typeMarche: z.enum(TYPES_VEILLE).optional().nullable(), dateLimite: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Date limite invalide."),
    lien: z.string().url().max(500).optional().nullable().or(z.literal("")), financement: txt(0, 200).optional().nullable(),
  }),
  z.object({ action: z.literal("supprimer_avis"), id: z.string().min(1) }),
  z.object({ action: z.literal("lancer") }),
  z.object({ action: z.literal("tester_whatsapp"), numero: z.string().min(8).max(30) }),
]);

const indisponible = () => NextResponse.json({ error: "Tables de la veille absentes : exécutez le script prisma/sql/2026-10_veille_whatsapp.sql dans Supabase.", indisponible: true }, { status: 503 });

export async function GET(req: NextRequest) {
  if (!(await admin())) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const whatsapp = { automatique: whatsappAutomatique(), alertesEquipe: Boolean(process.env.ADMIN_WHATSAPP), modeles: MODELES_WHATSAPP };
  try {
    const now = new Date();
    const [abonnements, parSource, ouverts, dernier, avis] = await Promise.all([
      prisma.abonnementVeille.findMany({
        include: { user: { select: { id: true, name: true, email: true, phone: true } }, _count: { select: { alertes: true } } },
        orderBy: [{ statut: "asc" }, { updatedAt: "desc" }],
      }),
      prisma.avisMarche.groupBy({ by: ["source"], _count: { _all: true } }),
      prisma.avisMarche.count({ where: { OR: [{ dateLimite: { gt: now } }, { dateLimite: null, datePublication: { gte: new Date(now.getTime() - 30 * 86_400_000) } }] } }),
      prisma.avisMarche.findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
      prisma.avisMarche.findMany({
        where: { AND: [
          { OR: [{ dateLimite: { gt: now } }, { dateLimite: null, datePublication: { gte: new Date(now.getTime() - 30 * 86_400_000) } }] },
          ...(q ? [{ OR: [{ objet: { contains: q, mode: "insensitive" as const } }, { reference: { contains: q, mode: "insensitive" as const } }, { autorite: { contains: q, mode: "insensitive" as const } }] }] : []),
        ] },
        orderBy: { createdAt: "desc" }, take: 100,
      }),
    ]);
    // Prestation « abonnement » liée (devis / paiement)
    const prestations = await prisma.prestation.findMany({
      where: { sector: SECTEUR_VEILLE, clientId: { in: abonnements.map((a) => a.userId) } },
      select: { id: true, clientId: true, status: true, amount: true, amountPaid: true, createdAt: true }, orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({
      abonnements: abonnements.map((a) => ({ ...a, prestation: prestations.find((p) => p.clientId === a.userId) ?? null })),
      stats: { parSource: Object.fromEntries(parSource.map((s) => [s.source, s._count._all])), ouverts, derniereCollecte: dernier?.updatedAt ?? null },
      avis, whatsapp,
    });
  } catch (e) {
    if (tablesAbsentes(e)) return NextResponse.json({ indisponible: true, whatsapp, abonnements: [], avis: [], stats: null });
    console.error("GET /api/admin/veille", e);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await admin();
  if (!session) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides." }, { status: 422 });
  const a = parsed.data;

  if (a.action === "tester_whatsapp") {
    const r = await envoyerModele(a.numero, "shiftup_alerte_equipe", ["Test", "votre configuration WhatsApp fonctionne", "https://www.shiftup.bj/dashboard/admin"]);
    return r.ok ? NextResponse.json({ ok: true, message: "Message de test envoyé." }) : NextResponse.json({ error: `Échec : ${r.ignore ?? r.erreur}` }, { status: 502 });
  }

  try {
    switch (a.action) {
      case "activer": {
        const jusquau = new Date(`${a.jusquau}T23:59:00+01:00`);
        if (jusquau.getTime() < Date.now()) return NextResponse.json({ error: "La date de fin est déjà passée." }, { status: 422 });
        const ab = await prisma.abonnementVeille.update({ where: { id: a.abonnementId }, data: { statut: "ACTIF", actifJusquau: jusquau }, include: { user: { select: { name: true, email: true } } } });
        await envoyer("veille activée", ab.user.email ? [sendVeilleStatutClient({ to: ab.user.email, name: ab.user.name ?? "", statut: "ACTIF", jusquau: dateFr(jusquau)?.replace(/ à .*$/, "") })] : []);
        const bilan = await distribuer(new Date());
        await prisma.auditLog.create({ data: { userId: session.user.id, action: "VEILLE_ACTIVEE", entity: "AbonnementVeille", entityId: ab.id, details: { jusquau: a.jusquau } } });
        return NextResponse.json({ ok: true, message: `Veille activée jusqu'au ${a.jusquau.split("-").reverse().join("/")}.${bilan.courriels ? ` ${bilan.alertes} avis déjà envoyés.` : ""}` });
      }
      case "suspendre": {
        const ab = await prisma.abonnementVeille.update({ where: { id: a.abonnementId }, data: { statut: "SUSPENDU" }, include: { user: { select: { name: true, email: true } } } });
        await envoyer("veille suspendue", ab.user.email ? [sendVeilleStatutClient({ to: ab.user.email, name: ab.user.name ?? "", statut: "SUSPENDU" })] : []);
        await prisma.auditLog.create({ data: { userId: session.user.id, action: "VEILLE_SUSPENDUE", entity: "AbonnementVeille", entityId: ab.id } });
        return NextResponse.json({ ok: true, message: "Veille suspendue." });
      }
      case "ajouter_avis": {
        const n = await enregistrerAvis([{
          source: "MANUEL", reference: a.reference, objet: a.objet, autorite: a.autorite ?? null, typeMarche: a.typeMarche ?? null,
          financement: a.financement || null, dateLimite: new Date(`${a.dateLimite}:00+01:00`), datePublication: new Date(), lien: a.lien || null,
        }]);
        const bilan = await distribuer(new Date());
        return NextResponse.json({ ok: true, message: `${n ? "Avis ajouté" : "Avis mis à jour"}${bilan.alertes ? ` — signalé à ${bilan.courriels} abonné(s)` : ""}.` });
      }
      case "supprimer_avis": {
        await prisma.avisMarche.delete({ where: { id: a.id } });
        return NextResponse.json({ ok: true, message: "Avis supprimé." });
      }
      case "lancer": {
        const r = await executerVeille();
        const c = "collecte" in r ? r.collecte : null;
        const d = "distribution" in r ? r.distribution : null;
        const lus = c ? Object.values(c.parSource).reduce((x, y) => x + y, 0) : 0;
        return NextResponse.json({
          ok: !r.erreurs.length || Boolean(c),
          message: c && d ? `${lus} avis lus sur ${Object.keys(c.parSource).length} sources, ${c.nouveaux} nouveau(x) ; ${d.alertes} avis signalé(s) à ${d.courriels} abonné(s).` : "Veille non exécutée.",
          erreurs: r.erreurs,
        });
      }
    }
  } catch (e) {
    if (tablesAbsentes(e)) return indisponible();
    console.error("POST /api/admin/veille", e);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
