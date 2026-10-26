"use client";
/**
 * Administration — Veille des appels d'offres (abonnés, avis collectés) et configuration WhatsApp.
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { TYPES_VEILLE } from "@/lib/veille/criteres";
import { lienWhatsApp } from "@/lib/whatsapp-lien";

type Abonnement = {
  id: string; statut: string; actifJusquau: string | null; secteurs: string[]; motsCles: string[]; zones: string[]; typesMarche: string[]; dernierEnvoi: string | null;
  user: { id: string; name: string | null; email: string; phone: string | null }; _count: { alertes: number };
  prestation: { id: string; status: string; amount: number; amountPaid: number } | null;
};
type Avis = { id: string; source: string; reference: string; objet: string; autorite: string | null; typeMarche: string | null; dateLimite: string | null; lien: string | null; createdAt: string };
type Donnees = {
  indisponible?: boolean; abonnements: Abonnement[]; avis: Avis[];
  stats: { parSource: Record<string, number>; ouverts: number; derniereCollecte: string | null } | null;
  whatsapp: { automatique: boolean; alertesEquipe: boolean; modeles: Record<string, { variables: readonly string[]; texte: string }> };
};

const SOURCES: Record<string, string> = { SIGMAP: "Portail national", BANQUE_MONDIALE: "Banque mondiale", MANUEL: "Saisie SHIFT UP" };
const STATUTS: Record<string, string> = { EN_ATTENTE: "bg-amber-100 text-amber-800", ACTIF: "bg-green-100 text-green-700", SUSPENDU: "bg-gray-200 text-gray-600", EXPIRE: "bg-red-100 text-red-700" };
const LIB_STATUTS: Record<string, string> = { EN_ATTENTE: "En attente", ACTIF: "Active", SUSPENDU: "Suspendue", EXPIRE: "Échue" };
const dateFr = (d: string | null, heure = false) => d ? new Date(d).toLocaleString("fr-FR", { timeZone: "Africa/Porto-Novo", day: "2-digit", month: "2-digit", year: "numeric", ...(heure ? { hour: "2-digit", minute: "2-digit" } : {}) }) : "—";
const dansMois = (m: number) => { const d = new Date(); d.setMonth(d.getMonth() + m); return d.toISOString().slice(0, 10); };
const champ = "w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent bg-white";

export default function AdminVeillePage() {
  const [d, setD] = useState<Donnees | null>(null);
  const [q, setQ] = useState("");
  const [occupe, setOccupe] = useState(false);
  const [fins, setFins] = useState<Record<string, string>>({});
  const [ajout, setAjout] = useState(false);
  const [nv, setNv] = useState({ reference: "", objet: "", autorite: "", typeMarche: "Travaux", dateLimite: "", lien: "", financement: "" });
  const [test, setTest] = useState("");

  const charger = useCallback(() => {
    fetch(`/api/admin/veille${q ? `?q=${encodeURIComponent(q)}` : ""}`).then((r) => r.json()).then(setD).catch(() => toast.error("Chargement impossible."));
  }, [q]);
  useEffect(() => { const t = setTimeout(charger, 300); return () => clearTimeout(t); }, [charger]);

  async function agir(corps: Record<string, unknown>) {
    setOccupe(true);
    try {
      const r = await fetch("/api/admin/veille", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps) });
      const x = await r.json().catch(() => ({}));
      if (!r.ok) { toast.error(x.error ?? "Action impossible."); return false; }
      toast.success(x.message ?? "C'est fait.", { duration: 6000 });
      if (x.erreurs?.length) toast.error(`Source en erreur : ${x.erreurs.join(" ; ")}`, { duration: 8000 });
      charger();
      return true;
    } catch { toast.error("Erreur réseau."); return false; }
    finally { setOccupe(false); }
  }

  if (!d) return <div className="flex items-center justify-center h-64"><span className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="font-syne font-black text-2xl text-primary">Veille des appels d&apos;offres</h1>
          <p className="text-gray-500 text-sm">Collecte chaque matin vers 7 h : portail national des marchés publics et Banque mondiale. Les abonnés actifs reçoivent les avis qui correspondent à leurs critères.</p>
        </div>
        {!d.indisponible && (
          <button disabled={occupe} onClick={() => agir({ action: "lancer" })} className="bg-primary text-white rounded-xl px-4 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex-shrink-0">
            {occupe ? <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 align-middle" /> : <i className="fas fa-rotate mr-2" />}Lancer la veille maintenant
          </button>
        )}
      </div>

      {d.indisponible ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm text-amber-900">
          <p className="font-semibold mb-1"><i className="fas fa-database mr-2" />Une étape reste à faire</p>
          <p>Exécutez une fois le script <code className="bg-white px-1.5 py-0.5 rounded">prisma/sql/2026-10_veille_whatsapp.sql</code> dans Supabase (SQL Editor). La veille et les préférences WhatsApp s&apos;activeront aussitôt.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              ["Avis ouverts", String(d.stats?.ouverts ?? 0), "fa-folder-open"],
              ["Portail national", String(d.stats?.parSource.SIGMAP ?? 0), "fa-landmark"],
              ["Banque mondiale", String(d.stats?.parSource.BANQUE_MONDIALE ?? 0), "fa-globe-africa"],
              ["Abonnés actifs", String(d.abonnements.filter((a) => a.statut === "ACTIF").length), "fa-user-check"],
              ["Dernière collecte", dateFr(d.stats?.derniereCollecte ?? null, true), "fa-clock"],
            ].map(([l, v, ic]) => (
              <div key={l} className="bg-white rounded-2xl shadow-card px-4 py-3">
                <p className="text-[11px] text-gray-500"><i className={`fas ${ic} mr-1.5 text-accent`} />{l}</p>
                <p className="font-syne font-black text-primary text-lg mt-0.5 truncate">{v}</p>
              </div>
            ))}
          </div>

          {/* Abonnés */}
          <section className="bg-white rounded-2xl shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100"><h2 className="font-syne font-bold text-primary text-sm">Abonnés ({d.abonnements.length})</h2></div>
            {d.abonnements.length === 0 ? <p className="p-6 text-sm text-gray-400 text-center">Aucune demande d&apos;abonnement pour l&apos;instant.</p> : (
              <div className="divide-y divide-gray-50">
                {d.abonnements.map((a) => (
                  <div key={a.id} className="px-5 py-4 grid lg:grid-cols-[1.3fr_1.5fr_1.2fr] gap-3 items-start">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-primary truncate">{a.user.name ?? a.user.email}</p>
                      <p className="text-xs text-gray-400 truncate">{a.user.email}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-[11px] font-bold rounded-full px-2 py-0.5 ${STATUTS[a.statut] ?? "bg-gray-100"}`}>{LIB_STATUTS[a.statut] ?? a.statut}</span>
                        {a.actifJusquau && <span className="text-[11px] text-gray-500">jusqu&apos;au {dateFr(a.actifJusquau)}</span>}
                      </div>
                      {a.prestation && (
                        <p className="text-[11px] text-gray-500 mt-1">
                          <Link href="/dashboard/admin/prestations" className="text-accent hover:underline">Prestation abonnement</Link> : {a.prestation.amount ? `${a.prestation.amountPaid.toLocaleString("fr-FR")} / ${a.prestation.amount.toLocaleString("fr-FR")} F payés` : "devis à envoyer"}
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 space-y-0.5">
                      {a.secteurs.length > 0 && <p><span className="text-gray-400">Secteurs : </span>{a.secteurs.join(", ")}</p>}
                      {a.motsCles.length > 0 && <p><span className="text-gray-400">Mots-clés : </span>{a.motsCles.join(", ")}</p>}
                      <p><span className="text-gray-400">Zones : </span>{a.zones.join(", ") || "tout le Bénin"}{a.typesMarche.length ? ` · ${a.typesMarche.join(", ")}` : ""}</p>
                      <p className="text-gray-400">{a._count.alertes} avis signalé(s){a.dernierEnvoi ? ` · dernier envoi le ${dateFr(a.dernierEnvoi)}` : ""}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex gap-1.5 flex-wrap">
                        {[["Essai 14 j", 0.5], ["1 mois", 1], ["3 mois", 3], ["6 mois", 6], ["12 mois", 12]].map(([l, m]) => (
                          <button key={l as string} onClick={() => setFins({ ...fins, [a.id]: m === 0.5 ? new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10) : dansMois(m as number) })}
                            className="text-[11px] border border-gray-200 rounded-lg px-2 py-1 text-gray-600 hover:bg-gray-50">{l as string}</button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input type="date" aria-label="Fin de l'abonnement" value={fins[a.id] ?? a.actifJusquau?.slice(0, 10) ?? ""} onChange={(e) => setFins({ ...fins, [a.id]: e.target.value })} className={champ} />
                        <button disabled={occupe || !(fins[a.id] ?? a.actifJusquau)} onClick={() => agir({ action: "activer", abonnementId: a.id, jusquau: fins[a.id] ?? a.actifJusquau?.slice(0, 10) })}
                          className="bg-green-600 text-white rounded-lg px-3 text-xs font-semibold hover:bg-green-700 disabled:opacity-50 whitespace-nowrap">{a.statut === "ACTIF" ? "Prolonger" : "Activer"}</button>
                      </div>
                      <div className="flex gap-2">
                        {a.statut === "ACTIF" && <button disabled={occupe} onClick={() => agir({ action: "suspendre", abonnementId: a.id })} className="text-[11px] text-gray-500 hover:text-red-600">Suspendre</button>}
                        {a.user.phone && (
                          <a href={lienWhatsApp(a.user.phone, `Bonjour ${a.user.name ?? ""}, c'est SHIFT UP au sujet de votre veille des appels d'offres.`)} target="_blank" rel="noopener noreferrer" className="text-[11px] text-green-700 hover:underline">
                            <i className="fab fa-whatsapp mr-1" />Écrire sur WhatsApp
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Avis */}
          <section className="bg-white rounded-2xl shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <h2 className="font-syne font-bold text-primary text-sm">Avis ouverts</h2>
              <div className="flex gap-2">
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher (objet, référence, autorité)…" aria-label="Rechercher un avis" className="border border-gray-200 rounded-xl px-3 py-2 text-xs w-64 focus:outline-none focus:border-accent" />
                <button onClick={() => setAjout(!ajout)} className="border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 whitespace-nowrap"><i className="fas fa-plus mr-1" />Ajouter un avis</button>
              </div>
            </div>
            {ajout && (
              <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 grid sm:grid-cols-3 gap-2">
                <input aria-label="Référence" placeholder="Référence *" value={nv.reference} onChange={(e) => setNv({ ...nv, reference: e.target.value })} className={champ} />
                <input aria-label="Autorité contractante" placeholder="Autorité contractante" value={nv.autorite} onChange={(e) => setNv({ ...nv, autorite: e.target.value })} className={champ} />
                <select aria-label="Type de marché" value={nv.typeMarche} onChange={(e) => setNv({ ...nv, typeMarche: e.target.value })} className={champ}>{TYPES_VEILLE.map((t) => <option key={t}>{t}</option>)}</select>
                <textarea aria-label="Objet" placeholder="Objet du marché *" rows={2} value={nv.objet} onChange={(e) => setNv({ ...nv, objet: e.target.value })} className={`${champ} sm:col-span-3 resize-none`} />
                <input aria-label="Date limite" type="datetime-local" value={nv.dateLimite} onChange={(e) => setNv({ ...nv, dateLimite: e.target.value })} className={champ} />
                <input aria-label="Lien de l'avis" placeholder="Lien de l'avis (https://…)" value={nv.lien} onChange={(e) => setNv({ ...nv, lien: e.target.value })} className={champ} />
                <input aria-label="Financement" placeholder="Financement (BAD, AFD, budget national…)" value={nv.financement} onChange={(e) => setNv({ ...nv, financement: e.target.value })} className={champ} />
                <button disabled={occupe || nv.reference.length < 2 || nv.objet.length < 5 || !nv.dateLimite} onClick={async () => { if (await agir({ action: "ajouter_avis", ...nv })) { setNv({ reference: "", objet: "", autorite: "", typeMarche: "Travaux", dateLimite: "", lien: "", financement: "" }); setAjout(false); } }}
                  className="sm:col-span-3 bg-primary text-white rounded-lg py-2 text-xs font-semibold disabled:opacity-50">Enregistrer et signaler aux abonnés concernés</button>
              </div>
            )}
            <div className="divide-y divide-gray-50 max-h-[640px] overflow-y-auto">
              {d.avis.length === 0 ? <p className="p-6 text-sm text-gray-400 text-center">Aucun avis ouvert{q ? " pour cette recherche" : " : lancez la veille pour collecter les avis"}.</p> : d.avis.map((a) => (
                <div key={a.id} className="px-5 py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-primary leading-snug">{a.objet}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{a.reference}{a.autorite ? ` — ${a.autorite}` : ""}{a.typeMarche ? ` · ${a.typeMarche}` : ""} · {SOURCES[a.source] ?? a.source}</p>
                  </div>
                  <div className="text-right flex-shrink-0 space-y-1">
                    <p className="text-[11px] font-semibold text-primary whitespace-nowrap">{dateFr(a.dateLimite, true)}</p>
                    <div className="flex gap-2 justify-end">
                      {a.lien && <a href={a.lien} target="_blank" rel="noopener noreferrer" className="text-[11px] text-accent hover:underline">Avis</a>}
                      {a.source === "MANUEL" && <button disabled={occupe} onClick={() => agir({ action: "supprimer_avis", id: a.id })} className="text-[11px] text-gray-400 hover:text-red-600">Supprimer</button>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* WhatsApp */}
      <section className="bg-white rounded-2xl shadow-card p-5 space-y-4" id="whatsapp">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-syne font-bold text-primary text-sm"><i className="fab fa-whatsapp text-green-600 mr-1.5" />Notifications WhatsApp</h2>
            <p className="text-xs text-gray-500 mt-1">Les boutons « Écrire sur WhatsApp » (gratuits) sont déjà actifs. Les envois automatiques démarrent dès que le compte WhatsApp Business est relié au site.</p>
          </div>
          <span className={`text-[11px] font-bold rounded-full px-2.5 py-1 whitespace-nowrap ${d.whatsapp.automatique ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
            {d.whatsapp.automatique ? "Envoi automatique actif" : "Envoi automatique non relié"}
          </span>
        </div>
        {!d.whatsapp.automatique && (
          <ol className="text-xs text-gray-600 space-y-1.5 list-decimal pl-5">
            <li>Créez un compte Meta Business et ajoutez WhatsApp (business.facebook.com), avec un numéro qui n&apos;est pas déjà utilisé sur l&apos;application WhatsApp.</li>
            <li>Dans le Gestionnaire WhatsApp, créez les modèles ci-dessous (catégorie « Utilité », langue « Français »), avec exactement ces noms et ces textes.</li>
            <li>Ajoutez un moyen de paiement au compte WhatsApp (Meta facture chaque message de modèle envoyé).</li>
            <li>Créez un jeton d&apos;accès permanent (utilisateur système) et notez l&apos;identifiant du numéro.</li>
            <li>Dans Vercel, ajoutez <code>WHATSAPP_TOKEN</code>, <code>WHATSAPP_PHONE_NUMBER_ID</code> et <code>ADMIN_WHATSAPP</code> (vos numéros pour les alertes, ex. +2290195035099), puis redéployez.</li>
          </ol>
        )}
        <details className="text-xs">
          <summary className="cursor-pointer font-semibold text-primary">Modèles de messages à créer ({Object.keys(d.whatsapp.modeles).length})</summary>
          <div className="mt-3 space-y-2">
            {Object.entries(d.whatsapp.modeles).map(([nom, m]) => (
              <div key={nom} className="border border-gray-100 rounded-xl p-3">
                <p className="font-mono text-[11px] text-accent">{nom}</p>
                <p className="text-gray-700 mt-1">{m.texte}</p>
                <p className="text-gray-400 mt-1">Exemples des variables : {m.variables.map((v, i) => `{{${i + 1}}} = ${v}`).join(", ")}</p>
              </div>
            ))}
          </div>
        </details>
        {d.whatsapp.automatique && (
          <div className="flex gap-2 max-w-md">
            <input value={test} onChange={(e) => setTest(e.target.value)} placeholder="Votre numéro WhatsApp" aria-label="Numéro de test" className={champ} />
            <button disabled={occupe || test.length < 8} onClick={() => agir({ action: "tester_whatsapp", numero: test })} className="bg-green-600 text-white rounded-lg px-3 text-xs font-semibold disabled:opacity-50 whitespace-nowrap">Envoyer un test</button>
          </div>
        )}
      </section>
    </div>
  );
}
