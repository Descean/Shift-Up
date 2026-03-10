import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import EtudiantDashboard from "@/components/dashboard/EtudiantDashboard";

export default async function EtudiantDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/connexion");
  return <EtudiantDashboard user={session.user} />;
}
