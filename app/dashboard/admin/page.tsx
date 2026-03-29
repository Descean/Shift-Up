import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Script from "next/script";
import AdminDashboard from "@/components/dashboard/AdminDashboard";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "DEVELOPER")) {
    redirect("/dashboard/client");
  }

  return (
    <>
      <Script id="brevo-conversations" strategy="beforeInteractive">
        {`(function(d, w, c) {
            w.BrevoConversationsID = '69bb801f07c2d3849602a48b';
            w[c] = w[c] || function() {
                (w[c].q = w[c].q || []).push(arguments);
            };
            var s = d.createElement('script');
            s.async = true;
            s.src = 'https://conversations-widget.brevo.com/brevo-conversations.js';
            if (d.head) d.head.appendChild(s);
        })(document, window, 'BrevoConversations');`}
      </Script>
      <AdminDashboard />
    </>
  );
}
