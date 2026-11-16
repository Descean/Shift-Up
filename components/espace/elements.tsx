"use client";

/** Éléments communs des fiches dossier (client, monteur, Direction), d'après la maquette. */
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { ETATS, type EtatDossier } from "@/lib/dossier";
import { televerser } from "@/lib/televerser";

export const fcfa = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} FCFA`;
export const dateFr = (iso?: string | null) => (iso ? new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—");

export function BadgeEtat({ etat, petit = false }: { etat: EtatDossier; petit?: boolean }) {
  const e = ETATS[etat];
  return <span className={`inline-flex items-center rounded-full border font-bold uppercase tracking-wide ${petit ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-1 text-[10px]"} ${e.classe}`}>{e.label}</span>;
}

/** Jours restants avant la date limite de dépôt (AAAA-MM-JJ). */
export function joursAvant(dateLimite?: string | null) {
  if (!dateLimite) return null;
  const fin = new Date(`${dateLimite}T23:59:59+01:00`).getTime();
  return Math.ceil((fin - Date.now()) / 86_400_000);
}

export function CompteRebours({ dateLimite }: { dateLimite?: string | null }) {
  const j = joursAvant(dateLimite);
  if (j === null) return <span className="text-gray-400">Non précisée</span>;
  const texte = j < 0 ? "Clôturé" : j === 0 ? "Aujourd'hui" : `J-${j}`;
  return (
    <span className={`inline-flex items-center gap-1.5 font-bold ${j <= 3 ? "text-red-600" : "text-su-nuit"}`}>
      <i className="far fa-clock" />{dateFr(dateLimite)}<span className="text-[11px] font-semibold opacity-80">· {texte}</span>
    </span>
  );
}

/** En-tête de la fiche : retour, statut, titre, référence, livraison, clôture du marché. */
export function EnTeteFiche({ retour, etat, titre, sousTitre, dateLimite, extra }: {
  retour: () => void; etat: EtatDossier; titre: string; sousTitre: string; dateLimite?: string | null; extra?: React.ReactNode;
}) {
  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <button type="button" onClick={retour} className="text-sm font-medium text-gray-500 hover:text-su-nuit"><i className="fas fa-arrow-left mr-2" />Retour</button>
        <BadgeEtat etat={etat} />
      </div>
      <div className="flex flex-col gap-4 border-b border-su-lavande bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-su-nuit">{titre}</h1>
          <p className="mt-0.5 text-sm text-gray-500">{sousTitre}</p>
          {extra}
        </div>
        <div className="self-start rounded-xl border border-su-lavande px-4 py-2 sm:self-auto">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Clôture du marché</p>
          <div className="text-sm"><CompteRebours dateLimite={dateLimite} /></div>
        </div>
      </div>
    </>
  );
}

export function Carte({ titre, sousTitre, children, className = "" }: { titre?: string; sousTitre?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-su-lavande bg-white p-5 shadow-sm ${className}`}>
      {titre && <h2 className="font-bold text-su-nuit">{titre}</h2>}
      {sousTitre && <p className="mt-0.5 text-xs text-gray-500">{sousTitre}</p>}
      {(titre || sousTitre) && <div className="mb-3 mt-3 border-b border-su-lavande" />}
      {children}
    </div>
  );
}

type Msg = { id: string; content: string; date: string; deMoi: boolean; auteur: string; equipe: boolean; systeme?: boolean; pieces?: { url: string; nom: string }[] };

/** Fil de discussion attaché au dossier (messages du système au centre). */
export function FilDiscussion({ prestationId, pieceJointe = false, signal = 0 }: { prestationId: string; pieceJointe?: boolean; signal?: number }) {
  const [messages, setMessages] = useState<Msg[] | null>(null);
  const [texte, setTexte] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const fin = useRef<HTMLDivElement>(null);
  const fichier = useRef<HTMLInputElement>(null);

  const charger = useCallback(async () => {
    const r = await fetch(`/api/prestations/${prestationId}/messages`).catch(() => null);
    const d = r?.ok ? await r.json() : { messages: [] };
    setMessages(d.messages ?? []);
  }, [prestationId]);

  useEffect(() => {
    void charger();
    const t = setInterval(() => void charger(), 15_000);
    return () => clearInterval(t);
  }, [charger, signal]);
  useEffect(() => { fin.current?.scrollIntoView({ block: "nearest" }); }, [messages?.length]);

  async function envoyer(corps: { content?: string; pieces?: { url: string; nom: string }[] }) {
    setEnvoi(true);
    try {
      const r = await fetch(`/api/prestations/${prestationId}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { toast.error(d.error ?? "Envoi impossible."); return false; }
      await charger();
      return true;
    } finally { setEnvoi(false); }
  }

  async function joindre(liste: FileList | null) {
    if (!liste?.length) return;
    setEnvoi(true);
    try {
      const pieces = [];
      for (const f of Array.from(liste).slice(0, 5)) { const r = await televerser(f); pieces.push({ url: r.url, nom: f.name }); }
      await envoyer({ content: texte.trim(), pieces });
      setTexte("");
    } catch (e) { toast.error((e as Error).message || "Envoi impossible."); setEnvoi(false); }
  }

  return (
    <div className="flex h-[520px] flex-col rounded-2xl border border-su-lavande bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-su-lavande px-4 py-3">
        <p className="text-sm font-bold text-su-nuit"><i className="far fa-comments mr-2 text-su-bleu" />Fil de discussion</p>
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages === null && <p className="text-center text-xs text-gray-400">Chargement…</p>}
        {messages?.length === 0 && <p className="text-center text-xs text-gray-400">Aucun message pour l&apos;instant.</p>}
        {messages?.map((m) => m.systeme ? (
          <p key={m.id} className="mx-auto max-w-[90%] rounded-lg bg-su-brume px-3 py-2 text-center text-xs italic text-gray-600">
            <i className="fas fa-circle-info mr-1.5 text-su-bleu" />{m.content}
          </p>
        ) : (
          <div key={m.id} className={`flex ${m.deMoi ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${m.deMoi ? "rounded-br-sm bg-su-nuit text-white" : "rounded-bl-sm bg-gray-100 text-gray-800"}`}>
              {!m.deMoi && <p className="mb-0.5 text-[10px] font-semibold opacity-60">{m.auteur}</p>}
              <p className="whitespace-pre-wrap break-words">{m.content}</p>
              {m.pieces?.map((p) => (
                <a key={p.url} href={p.url} target="_blank" rel="noreferrer" className={`mt-1.5 flex items-center gap-1.5 text-xs underline ${m.deMoi ? "text-su-ciel" : "text-su-bleu"}`}>
                  <i className="fas fa-paperclip" />{p.nom}
                </a>
              ))}
              <p className="mt-1 text-[10px] opacity-60">{new Date(m.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          </div>
        ))}
        <div ref={fin} />
      </div>
      <form onSubmit={async (e) => { e.preventDefault(); if (!texte.trim()) return; if (await envoyer({ content: texte.trim() })) setTexte(""); }}
        className="flex items-center gap-2 border-t border-su-lavande p-3">
        {pieceJointe && (
          <>
            <input ref={fichier} type="file" multiple className="hidden" onChange={(e) => { void joindre(e.target.files); e.target.value = ""; }} />
            <button type="button" onClick={() => fichier.current?.click()} disabled={envoi} title="Joindre un document" className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-su-brume"><i className="fas fa-paperclip" /></button>
          </>
        )}
        <input value={texte} onChange={(e) => setTexte(e.target.value)} placeholder="Votre message…" className="min-w-0 flex-1 rounded-lg border border-su-lavande bg-su-brume/40 px-3 py-2.5 text-sm focus:border-su-bleu focus:outline-none" />
        <button type="submit" disabled={envoi || !texte.trim()} className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-su-nuit text-white disabled:opacity-50"><i className="fas fa-paper-plane" /></button>
      </form>
    </div>
  );
}

/** Paiement sécurisé : Mobile Money (FedaPay) ou carte bancaire (Stripe). */
export function ModalePaiement({ prestationId, montant, libelle, onFermer }: { prestationId: string; montant: number; libelle: string; onFermer: () => void }) {
  const [moyen, setMoyen] = useState<"MOBILE_MONEY" | "CARD">("MOBILE_MONEY");
  const [tel, setTel] = useState("");
  const [envoi, setEnvoi] = useState(false);

  async function valider() {
    if (moyen === "MOBILE_MONEY" && !/^(\+?229)?01\d{8}$/.test(tel.replace(/[\s.-]/g, ""))) { toast.error("Numéro Mobile Money à 10 chiffres, commençant par 01."); return; }
    setEnvoi(true);
    try {
      const r = await fetch("/api/payments/create", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(moyen === "MOBILE_MONEY" ? { prestationId, method: "MOBILE_MONEY", provider: "FEDAPAY", phone: tel } : { prestationId, method: "CARD", provider: "STRIPE" }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.checkoutUrl) { toast.error(d.error ?? "Paiement impossible pour le moment."); return; }
      window.location.href = d.checkoutUrl;
    } finally { setEnvoi(false); }
  }

  const option = (id: "MOBILE_MONEY" | "CARD", titre: string, icone: string) => (
    <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${moyen === id ? "border-su-bleu bg-su-brume" : "border-su-lavande"}`}>
      <input type="radio" checked={moyen === id} onChange={() => setMoyen(id)} className="accent-[#31487A]" />
      <i className={`fas ${icone} w-5 text-center text-su-bleu`} /><span className="text-sm font-semibold text-su-nuit">{titre}</span>
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-su-nuit/60 p-4" onClick={onFermer}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-su-nuit"><i className="fas fa-lock mr-2 text-su-bleu" />Paiement sécurisé</h3>
        <div className="my-5 rounded-xl bg-su-brume p-4 text-center">
          <p className="text-xs text-gray-500">{libelle}</p>
          <p className="text-2xl font-extrabold text-su-nuit">{fcfa(montant)}</p>
        </div>
        <div className="space-y-2">
          {option("MOBILE_MONEY", "Mobile Money (MTN / Moov)", "fa-mobile-screen")}
          {moyen === "MOBILE_MONEY" && (
            <input value={tel} onChange={(e) => setTel(e.target.value)} type="tel" placeholder="Numéro Mobile Money (01 …)" className="w-full rounded-xl border border-su-lavande px-4 py-3 text-sm focus:border-su-bleu focus:outline-none" />
          )}
          {option("CARD", "Carte bancaire (Visa / Mastercard)", "fa-credit-card")}
        </div>
        <button type="button" onClick={valider} disabled={envoi} className="mt-5 w-full rounded-xl bg-su-nuit py-3.5 text-sm font-bold text-white hover:bg-su-cadet disabled:opacity-60">
          {envoi ? "Redirection…" : "Valider la transaction"}
        </button>
        <button type="button" onClick={onFermer} className="mt-2 w-full py-2 text-sm text-gray-500">Annuler</button>
        <p className="mt-2 text-center text-[11px] text-gray-400"><i className="fas fa-shield-halved mr-1" />Paiement crypté de bout en bout</p>
      </div>
    </div>
  );
}
