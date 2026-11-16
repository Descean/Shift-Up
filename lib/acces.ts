/** Jetons de connexion par lien (e-mail seul), consommés par le fournisseur « lien » de lib/auth.ts. */
import { randomBytes } from "crypto";
import prisma from "@/lib/prisma";

export const ROLES_LIEN = ["CLIENT", "MONTEUR"];

export async function jetonAcces(userId: string, minutes: number) {
  const token = randomBytes(32).toString("hex");
  await prisma.verificationToken.deleteMany({ where: { identifier: `acces:${userId}`, expires: { lt: new Date() } } }).catch(() => {});
  await prisma.verificationToken.create({ data: { identifier: `acces:${userId}`, token, expires: new Date(Date.now() + minutes * 60 * 1000) } });
  return token;
}

export const baseUrl = () => (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://www.shiftup.bj").replace(/\/$/, "");

/** Lien de connexion directe (usage unique), qui mène ensuite à `suite`. */
export async function lienAcces(userId: string, suite = "/dashboard", minutes = 30) {
  return `${baseUrl()}/connexion/lien?jeton=${await jetonAcces(userId, minutes)}&suite=${encodeURIComponent(suite)}`;
}
