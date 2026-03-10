import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/connexion");

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DashboardSidebar role={session.user?.role as string} />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader user={session.user} />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
