import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminDashboard from "@/components/dashboard/AdminDashboard";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "DEVELOPER")) {
    redirect("/dashboard/client");
  }

  return <AdminDashboard />;
}
