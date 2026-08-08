/**
 * app/api/admin/users/route.ts — Gestion des utilisateurs (admin)
 *
 * GET   /api/admin/users          → Liste paginée avec filtres
 * PATCH /api/admin/users          → Active / désactive un compte (body: { userId, isActive })
 *
 * Accès réservé ADMIN / DEVELOPER.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
  userId:   z.string(),
  isActive: z.boolean().optional(),
  role:     z.enum(["CLIENT","APPORTEUR","ETUDIANT","ADMIN","DEVELOPER"]).optional(),
  stars:    z.number().min(0).max(5).optional(),
});

// ── Guard admin ───────────────────────────────────────────────────────────────
async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  if (session.user.role !== "ADMIN" && session.user.role !== "DEVELOPER") return null;
  return session;
}

// ── GET — Liste des utilisateurs avec pagination et filtres ──────────────────
export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page   = Number(searchParams.get("page")  ?? "1");
  const limit  = Number(searchParams.get("limit") ?? "20");
  const role   = searchParams.get("role")   as any ?? undefined;
  const search = searchParams.get("search") ?? undefined;

  try {
    const where = {
      ...(role ? { role } : {}),
      ...(search ? {
        OR: [
          { name:  { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      } : {}),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, name: true, email: true, phone: true,
          role: true, isActive: true, stars: true,
          affiliationCode: true, createdAt: true,
          _count: { select: { prestations: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/admin/users error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

// ── PATCH — Modifie isActive, role ou stars d'un utilisateur ─────────────────
export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  try {
    const body = await req.json();
    const { userId, ...data } = patchSchema.parse(body);

    // Personne ne peut modifier son propre compte depuis cette interface —
    // empêche notamment un DEVELOPER de s'auto-promouvoir ADMIN, et évite
    // tout auto-verrouillage (isActive: false sur soi-même).
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas modifier votre propre compte depuis cette interface." },
        { status: 403 }
      );
    }

    // Seul un ADMIN peut changer un rôle (un DEVELOPER ne doit pas pouvoir
    // s'octroyer ni octroyer à quiconque des droits ADMIN).
    if (data.role !== undefined && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Seul un administrateur peut modifier les rôles." },
        { status: 403 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, name: true, email: true, role: true, isActive: true, stars: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "ADMIN_USER_UPDATED",
        entity: "User",
        entityId: userId,
        details: data,
      },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides." }, { status: 422 });
    }
    console.error("PATCH /api/admin/users error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
