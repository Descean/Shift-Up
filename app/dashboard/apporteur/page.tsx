import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ApporteurDashboard from "@/components/dashboard/ApporteurDashboard";

export default async function ApporteurDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/connexion");
  return <ApporteurDashboard user={session.user} />;
}
