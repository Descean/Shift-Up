import type { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !["ADMIN", "DEVELOPER"].includes(session.user.role)) return null;
  return session;
}

export const STATUTS = ["NOUVELLE", "EN_REVUE", "PRESELECTIONNEE", "RETENUE", "NON_RETENUE"] as const;

export function buildWhere(sp: URLSearchParams): Prisma.CandidatureWhereInput {
  const where: Prisma.CandidatureWhereInput = {};
  const offre = sp.get("offre");
  const statut = sp.get("statut");
  const q = sp.get("q")?.trim();
  if (offre) where.offreCode = offre;
  if (statut && (STATUTS as readonly string[]).includes(statut)) where.statut = statut as (typeof STATUTS)[number];
  if (q) {
    where.OR = ["nom", "prenoms", "email", "reference", "diplome", "telephone"].map((k) => ({ [k]: { contains: q, mode: "insensitive" } }));
  }
  return where;
}

