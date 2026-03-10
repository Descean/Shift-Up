import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ClientDashboard from "@/components/dashboard/ClientDashboard";

export default async function ClientDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/connexion");

  return <ClientDashboard user={session.user} />;
}
