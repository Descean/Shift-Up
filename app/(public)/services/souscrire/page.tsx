"use client";

/**
 * Demander un montage : comme dans l'espace client, l'accès se fait avec l'adresse e-mail seule
 * (compte créé à la volée), puis la demande se fait en 3 étapes dans l'espace.
 */
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SouscrirePage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    const suite = `/dashboard/client/nouvelle-demande${window.location.search}`;
    router.replace(status === "authenticated" ? suite : `/connexion?callbackUrl=${encodeURIComponent(suite)}`);
  }, [status, router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-su-bleu border-t-transparent" />
    </div>
  );
}
