/**
 * GET /m/<code> — Lien d'un monteur indépendant à partager avec ses clients. Retient le monteur
 * (cookie 30 jours) : la prochaine demande du client lui est confiée. Mène ensuite à la demande.
 */
import { NextRequest, NextResponse } from "next/server";
import { monteurParCode } from "@/lib/monteurs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const m = await monteurParCode(code);
  const r = NextResponse.redirect(new URL("/services/souscrire", req.url));
  if (m) r.cookies.set("su_monteur", code, { maxAge: 30 * 24 * 3600, path: "/", sameSite: "lax", httpOnly: true, secure: process.env.NODE_ENV === "production" });
  return r;
}
