import { timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

/** Vérifie l'en-tête « Authorization: Bearer <TENDO_API_KEY> » envoyé par Tendo. */
export function tendoAutorise(req: NextRequest): boolean {
  const cle = process.env.TENDO_API_KEY ?? "";
  if (cle.length < 32) return false;
  const recu = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(recu);
  const b = Buffer.from(cle);
  return a.length === b.length && timingSafeEqual(a, b);
}
