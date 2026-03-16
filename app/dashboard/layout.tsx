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
        {/* Desktop header only */}
        <div className="hidden lg:block">
          <DashboardHeader user={session.user} />
        </div>
        {/* Mobile top-bar spacer (the bar itself is fixed in DashboardSidebar) */}
        <div className="lg:hidden h-14 flex-shrink-0" />
        <main className="flex-1 p-4 lg:p-6 overflow-auto pb-20 lg:pb-6">{children}</main>
      </div>
    </div>
  );
}
