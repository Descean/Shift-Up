import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

const roleRedirect: Record<string, string> = {
  CLIENT: "/dashboard/client",
  APPORTEUR: "/dashboard/apporteur",
  ETUDIANT: "/dashboard/etudiant",
  ADMIN: "/dashboard/admin",
  DEVELOPER: "/dashboard/admin",
};

export default async function DashboardRootPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/connexion");
  const role = (session.user as { role?: string })?.role || "CLIENT";
  redirect(roleRedirect[role] || "/dashboard/client");
}
