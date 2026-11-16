"use client";

/** Ouverture de session depuis le lien de connexion reçu par e-mail. */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { cheminRetour } from "@/lib/retour";

export default function LienConnexion() {
  const router = useRouter();
  const [erreur, setErreur] = useState(false);
  const fait = useRef(false);

  useEffect(() => {
    if (fait.current) return;
    fait.current = true;
    const q = new URLSearchParams(window.location.search);
    const jeton = q.get("jeton") ?? "";
    signIn("lien", { jeton, redirect: false }).then((r) => {
      if (r?.error) setErreur(true);
      else router.replace(cheminRetour(q.get("suite"), "/dashboard"));
    });
  }, [router]);

  return (
    <div className="text-center">
      {erreur ? (
        <>
          <h1 className="text-2xl font-bold text-su-nuit">Lien expiré ou déjà utilisé</h1>
          <p className="mt-3 text-[15px] text-[#4B5563]">Demandez un nouveau lien : il arrive en quelques secondes.</p>
          <Link href="/connexion" className="mt-6 inline-flex rounded-xl bg-su-nuit px-6 py-3 text-sm font-semibold text-white">Recevoir un nouveau lien</Link>
        </>
      ) : (
        <>
          <span className="mx-auto block h-10 w-10 animate-spin rounded-full border-2 border-su-bleu border-t-transparent" />
          <p className="mt-4 text-[15px] text-[#4B5563]">Ouverture de votre espace…</p>
        </>
      )}
    </div>
  );
}
