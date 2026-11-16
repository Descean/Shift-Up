import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import CadreEspace from "@/components/espace/CadreEspace";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mon espace", robots: { index: false, follow: false } };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/connexion");
  const role = (session.user?.role as string) ?? "CLIENT";

  return (
    <CadreEspace
      role={role}
      nom={session.user?.name ?? session.user?.email ?? ""}
      barreLaterale={<DashboardSidebar role={role} />}
      enTeteBureau={<DashboardHeader user={session.user} />}
    >
      {children}
    </CadreEspace>
  );
}
