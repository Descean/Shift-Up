import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !["ADMIN", "DEVELOPER"].includes(session.user.role)) {
    return null;
  }
  return session;
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const formationSlug = searchParams.get("slug") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const search = searchParams.get("search") ?? undefined;

  const where: Record<string, unknown> = {};
  if (formationSlug) where.formation = { slug: formationSlug };
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { prenom: { contains: search, mode: "insensitive" } },
      { nom: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { structure: { contains: search, mode: "insensitive" } },
      { reference: { contains: search, mode: "insensitive" } },
    ];
  }

  const [inscriptions, total, formations] = await Promise.all([
    prisma.formationInscription.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { formation: { select: { titre: true, slug: true, prixFCFA: true } } },
    }),
    prisma.formationInscription.count({ where }),
    prisma.formation.findMany({ select: { slug: true, titre: true }, orderBy: { createdAt: "desc" } }),
  ]);

  return NextResponse.json({ inscriptions, total, formations });
}
