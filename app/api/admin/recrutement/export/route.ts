/** GET /api/admin/recrutement/export?offre=&statut=&q=  → CSV (séparateur « ; », UTF-8 BOM pour Excel) */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin, buildWhere } from "../_lib";

const cell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  const safe = /^(=|@|[+\-](?![\d\s]))/.test(s) ? "'" + s : s; // évite l'injection de formules (les numéros +229… restent intacts)
  return `"${safe.replace(/"/g, '""')}"`;
};

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  const rows = await prisma.candidature.findMany({ where: buildWhere(req.nextUrl.searchParams), orderBy: [{ offreCode: "asc" }, { createdAt: "asc" }] });
  const head = ["Référence", "Date", "Poste", "Nom", "Prénoms", "E-mail", "Téléphone", "Ville", "Nationalité", "Diplôme", "Année diplôme", "Années d'expérience", "Projets similaires", "Disponibilité", "Source", "Statut", "Nb pièces", "Note interne"];
  const lines = rows.map((c) => [
    c.reference, c.createdAt.toLocaleString("fr-FR", { timeZone: "Africa/Porto-Novo" }), c.offreTitre, c.nom, c.prenoms, c.email, c.telephone,
    c.ville, c.nationalite, c.diplome, c.anneeDiplome, c.anneesExperience, c.nbProjetsSimilaires, c.disponibilite, c.source,
    c.statut, Array.isArray(c.fichiers) ? c.fichiers.length : 0, c.noteInterne,
  ].map(cell).join(";"));
  const csv = "﻿" + [head.map(cell).join(";"), ...lines].join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="candidatures-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
