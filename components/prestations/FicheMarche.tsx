"use client";
/**
 * Fiche de l'appel d'offres pour une demande de montage de dossier.
 * Composant contrôlé : utilisé par la page publique, l'espace client et l'administration.
 */
import { MODES_DEPOT, PRESTATIONS_MONTAGE, TYPES_MARCHE, type DossierSaisie } from "@/lib/montage";

const champ = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent bg-white";
const etiquette = "block text-sm font-medium text-gray-700 mb-1.5";

export function ficheComplete(d: DossierSaisie) {
  return Boolean(d.referenceAvis?.trim() && d.intitule?.trim() && d.autorite?.trim() && d.dateLimite && d.soumissionnaire?.trim() && (d.prestations?.length ?? 0) > 0);
}

export default function FicheMarche({ valeur, onChange, prefixe = "fm" }: { valeur: DossierSaisie; onChange: (d: DossierSaisie) => void; prefixe?: string }) {
  const maj = <K extends keyof DossierSaisie>(k: K, v: DossierSaisie[K]) => onChange({ ...valeur, [k]: v });
  const prestations = valeur.prestations ?? [];
  const basculer = (x: (typeof PRESTATIONS_MONTAGE)[number]) =>
    maj("prestations", prestations.includes(x) ? prestations.filter((y) => y !== x) : [...prestations, x]);
  const id = (n: string) => `${prefixe}-${n}`;

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor={id("ref")} className={etiquette}>Référence de l&apos;avis <span className="text-red-500">*</span></label>
          <input id={id("ref")} value={valeur.referenceAvis} onChange={(e) => maj("referenceAvis", e.target.value)} className={champ} placeholder="Ex : AAON N°045/2026/MEF/PRMP ou T_ABC_123456" />
        </div>
        <div>
          <label htmlFor={id("aut")} className={etiquette}>Autorité contractante <span className="text-red-500">*</span></label>
          <input id={id("aut")} value={valeur.autorite} onChange={(e) => maj("autorite", e.target.value)} className={champ} placeholder="Ministère, mairie, agence, projet…" />
        </div>
      </div>

      <div>
        <label htmlFor={id("obj")} className={etiquette}>Objet du marché <span className="text-red-500">*</span></label>
        <input id={id("obj")} value={valeur.intitule} onChange={(e) => maj("intitule", e.target.value)} className={champ} placeholder="Ex : Travaux de réhabilitation de pistes rurales dans le Zou" />
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor={id("type")} className={etiquette}>Type de marché</label>
          <select id={id("type")} value={valeur.typeMarche} onChange={(e) => maj("typeMarche", e.target.value as DossierSaisie["typeMarche"])} className={champ}>
            {TYPES_MARCHE.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor={id("lots")} className={etiquette}>Lot(s) visé(s)</label>
          <input id={id("lots")} value={valeur.lots ?? ""} onChange={(e) => maj("lots", e.target.value)} className={champ} placeholder="Ex : Lots 1 et 3" />
        </div>
        <div>
          <label htmlFor={id("fin")} className={etiquette}>Financement</label>
          <input id={id("fin")} value={valeur.financement ?? ""} onChange={(e) => maj("financement", e.target.value)} className={champ} placeholder="Budget national, BM, AFD…" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor={id("date")} className={etiquette}>Date et heure limite de dépôt <span className="text-red-500">*</span></label>
          <input id={id("date")} type="datetime-local" value={valeur.dateLimite} onChange={(e) => maj("dateLimite", e.target.value)} className={champ} />
          <p className="text-xs text-gray-400 mt-1">Heure du Bénin, telle qu&apos;indiquée dans l&apos;avis.</p>
        </div>
        <div>
          <label htmlFor={id("mode")} className={etiquette}>Mode de dépôt</label>
          <select id={id("mode")} value={valeur.modeDepot} onChange={(e) => maj("modeDepot", e.target.value as DossierSaisie["modeDepot"])} className={champ}>
            {Object.entries(MODES_DEPOT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      {valeur.modeDepot !== "EN_LIGNE" && (
        <div>
          <label htmlFor={id("lieu")} className={etiquette}>Lieu de dépôt</label>
          <input id={id("lieu")} value={valeur.lieuDepot ?? ""} onChange={(e) => maj("lieuDepot", e.target.value)} className={champ} placeholder="Ex : Secrétariat de la PRMP, 2e étage" />
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor={id("soum")} className={etiquette}>Entreprise qui soumissionne <span className="text-red-500">*</span></label>
          <input id={id("soum")} value={valeur.soumissionnaire} onChange={(e) => maj("soumissionnaire", e.target.value)} className={champ} placeholder="Raison sociale" />
        </div>
        <div>
          <label htmlFor={id("proc")} className={etiquette}>Procédure</label>
          <input id={id("proc")} value={valeur.procedure ?? ""} onChange={(e) => maj("procedure", e.target.value)} className={champ} placeholder="AAO, DRP, DC, AMI, AOI…" />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
        <input type="checkbox" checked={Boolean(valeur.groupement)} onChange={(e) => maj("groupement", e.target.checked)} className="w-4 h-4 accent-[#0A2533]" />
        La soumission se fait en groupement d&apos;entreprises
      </label>
      {valeur.groupement && (
        <input aria-label="Membres du groupement" value={valeur.membresGroupement ?? ""} onChange={(e) => maj("membresGroupement", e.target.value)} className={champ} placeholder="Membres du groupement (chef de file en premier)" />
      )}

      <fieldset>
        <legend className={etiquette}>Ce que vous attendez de nous <span className="text-red-500">*</span></legend>
        <div className="grid sm:grid-cols-2 gap-2">
          {PRESTATIONS_MONTAGE.map((x) => (
            <label key={x} className={`flex items-center gap-2 text-sm rounded-xl border px-3 py-2 cursor-pointer transition-colors ${prestations.includes(x) ? "border-accent bg-accent/5 text-primary" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
              <input type="checkbox" checked={prestations.includes(x)} onChange={() => basculer(x)} className="w-4 h-4 flex-shrink-0 accent-[#0A2533]" />
              {x}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
