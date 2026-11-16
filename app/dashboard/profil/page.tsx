/**
 * /dashboard/profil — Redirection vers la page profil du rôle connecté
 */
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function ProfilRedirectPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/connexion");

  const role = session.user?.role;
  if (role === "ADMIN" || role === "DEVELOPER") redirect("/dashboard/admin");
  if (role === "MONTEUR") redirect("/dashboard/equipe");
  redirect("/dashboard/client/profil");
}
