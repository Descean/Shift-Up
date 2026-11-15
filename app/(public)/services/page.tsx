"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BandeauTitre, TitrePoints, titreFont } from "@/components/site/Gabarit";
import { Icone } from "@/components/home/icones";
import { SECTORS, ICONES_DOMAINES as ICONES, type Sector, type ServiceItem } from "@/lib/catalogue";
import Link from "next/link";
import { useSession } from "next-auth/react";

/* ─── Composant carte service ────────────────────────────────────────────── */
function ServiceCard({ service, sectorId, index }: { service: ServiceItem; sectorId: string; index: number }) {
  const { data: session } = useSession();
  const href = session
    ? `/dashboard/client/nouvelle-demande/formulaire?sector=${encodeURIComponent(sectorId)}&service=${encodeURIComponent(service.title)}`
    : `/services/souscrire?secteur=${encodeURIComponent(sectorId)}&offre=${encodeURIComponent(service.title)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`relative flex flex-col gap-3 rounded-2xl bg-white p-6 transition-shadow hover:shadow-[0_12px_30px_rgba(30,46,79,0.12)] ${
        service.isPopular ? "border-2 border-su-bleu" : "border border-su-lavande"
      }`}
    >
      {service.isPopular && (
        <span className="absolute -top-3 left-6 rounded-full bg-su-bleu px-3.5 py-1 text-xs font-bold text-white">Le plus demandé</span>
      )}
      <h3 className={`${titreFont} m-0 text-lg font-bold leading-snug text-su-nuit`}>{service.title}</h3>
      <p className="m-0 flex-1 text-sm leading-relaxed text-[#4B5563]">{service.description}</p>
      <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
        {service.features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm text-[#374151]">
            <span className="text-su-bleu"><Icone nom="coche" taille={15} epaisseur={2.2} /></span>{f}
          </li>
        ))}
      </ul>
      <div className="mt-1 flex items-end justify-between gap-3 border-t border-su-lavande pt-4">
        <div className="flex flex-col">
          {service.priceLabel && <span className="text-xs text-[#6B7280]">{service.priceLabel}</span>}
          <span className={`${titreFont} text-lg font-extrabold text-su-nuit`}>{service.price || "Sur devis"}</span>
        </div>
        {service.duration && (
          <span className="flex items-center gap-1.5 text-[13px] text-[#4B5563]"><span className="text-su-bleu"><Icone nom="horloge" taille={16} /></span>{service.duration}</span>
        )}
      </div>
      <Link href={href}
        className={`inline-flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold transition-colors ${
          service.isPopular ? "bg-su-bleu text-white hover:bg-su-cadet" : "border border-su-clair text-su-bleu hover:border-su-bleu"
        }`}>
        Souscrire <Icone nom="fleche" taille={16} epaisseur={2} />
      </Link>
    </motion.div>
  );
}

function BoutonDomaine({ s, actif, onClick }: { s: Sector; actif: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-current={actif ? "true" : undefined}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${actif ? "bg-su-bleu text-white" : "text-su-nuit hover:bg-su-brume"}`}>
      <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-lg ${actif ? "bg-white/15 text-white" : "bg-su-brume text-su-bleu"}`}>
        <Icone nom={ICONES[s.id] ?? "conseil"} taille={19} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{s.label}</span>
        <span className={`block text-[11px] ${actif ? "text-su-lavande" : "text-[#6B7280]"}`}>{s.services.length} offres</span>
      </span>
    </button>
  );
}

/* ─── Page principale ────────────────────────────────────────────────────── */
export default function ServicesPage() {
  const { data: session } = useSession();
  const [activeSector, setActiveSector] = useState<string>(SECTORS[0].id);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);

  const sector = SECTORS.find((s) => s.id === activeSector) ?? SECTORS[0];

  const filtered = search.trim()
    ? SECTORS.filter((s) =>
        s.label.toLowerCase().includes(search.toLowerCase()) ||
        s.registreRef.toLowerCase().includes(search.toLowerCase())
      )
    : SECTORS;

  // Ouvre directement le service demandé dans l'URL (ex. /services#numerique, depuis l'accueil ou le menu)
  useEffect(() => {
    const ALIAS: Record<string, string> = { dossiers: "marches-publics" };
    const lireAncre = () => {
      const brut = decodeURIComponent(window.location.hash.replace("#", "")).trim();
      const id = ALIAS[brut] ?? brut;
      if (id && SECTORS.some((s) => s.id === id)) {
        setActiveSector(id);
        setTimeout(() => contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
      }
    };
    lireAncre();
    window.addEventListener("hashchange", lireAncre);
    return () => window.removeEventListener("hashchange", lireAncre);
  }, []);

  function selectSector(id: string) {
    setActiveSector(id);
    setSidebarOpen(false);
    setTimeout(() => contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }

  // Ouvre l'assistant (widget de discussion) avec un message prérempli
  function openChatbot(prefill: string) {
    window.dispatchEvent(new CustomEvent("shiftup:open-chat", { detail: { message: prefill } }));
  }

  const nbOffres = SECTORS.reduce((a, s) => a + s.services.length, 0);

  return (
    <div className="min-h-screen bg-white">
      <BandeauTitre titre="Nos domaines" accent="d'intervention."
        texte={`${SECTORS.length} domaines et ${nbOffres} offres, du dossier d'appel d'offres au tableau de bord. Choisissez un domaine pour voir les prix et les délais ; chaque devis est envoyé sous 48 heures ouvrées.`} />

      <div className="mx-auto max-w-[1200px] px-6 py-14">
        <div className="flex flex-col items-start gap-8 lg:flex-row">

          {/* Domaines (ordinateur) */}
          <aside className="sticky top-28 hidden max-h-[calc(100vh-8rem)] w-[290px] flex-none flex-col overflow-hidden rounded-[20px] border border-su-lavande bg-white lg:flex">
            <div className="border-b border-su-lavande p-4">
              <label className="relative block">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]"><Icone nom="loupe" taille={16} /></span>
                <input value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Rechercher un domaine"
                  className="w-full rounded-full border border-su-lavande py-2.5 pl-9 pr-3 text-sm focus:border-su-bleu focus:outline-none" placeholder="Rechercher un domaine" />
              </label>
            </div>
            <nav aria-label="Domaines" className="flex flex-1 flex-col gap-1 overflow-y-auto p-2.5">
              {filtered.length === 0
                ? <p className="py-6 text-center text-sm text-[#6B7280]">Aucun résultat</p>
                : filtered.map((s) => <BoutonDomaine key={s.id} s={s} actif={activeSector === s.id} onClick={() => selectSector(s.id)} />)}
            </nav>
          </aside>

          {/* Domaines (mobile) */}
          <div className="w-full lg:hidden">
            <button type="button" onClick={() => setSidebarOpen(true)}
              className="flex w-full items-center justify-between rounded-2xl border border-su-lavande bg-white px-5 py-4">
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-su-brume text-su-bleu"><Icone nom={ICONES[sector.id] ?? "conseil"} taille={20} /></span>
                <span className="text-left">
                  <span className={`${titreFont} block text-sm font-bold text-su-nuit`}>{sector.label}</span>
                  <span className="block text-xs text-[#6B7280]">{sector.services.length} offres</span>
                </span>
              </span>
              <span className="text-sm font-semibold text-su-bleu">Changer</span>
            </button>
            <AnimatePresence>
              {sidebarOpen && (
                <>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-su-nuit/60" />
                  <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed bottom-0 left-0 top-0 z-50 flex w-80 flex-col bg-white shadow-2xl">
                    <div className="flex items-center justify-between border-b border-su-lavande p-4">
                      <span className={`${titreFont} font-bold text-su-nuit`}>Domaines</span>
                      <button type="button" onClick={() => setSidebarOpen(false)} aria-label="Fermer" className="p-2 text-su-bleu"><Icone nom="plus" taille={20} /></button>
                    </div>
                    <nav aria-label="Domaines" className="flex flex-1 flex-col gap-1 overflow-y-auto p-2.5">
                      {SECTORS.map((s) => <BoutonDomaine key={s.id} s={s} actif={activeSector === s.id} onClick={() => selectSector(s.id)} />)}
                    </nav>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Contenu du domaine */}
          <div ref={contentRef} className="min-w-0 flex-1 scroll-mt-28">
            <AnimatePresence mode="wait">
              <motion.div key={sector.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.3 }}
                className="flex flex-col gap-6">
                <div className="relative flex flex-col gap-4 overflow-hidden rounded-[20px] bg-su-nuit p-7 sm:flex-row sm:items-center sm:gap-6 sm:p-9">
                  <span aria-hidden="true" className="absolute right-[-100px] top-[-140px] h-[340px] w-[340px] rounded-full border-[36px] border-su-cadet" />
                  <span className="relative flex h-16 w-16 flex-none items-center justify-center rounded-2xl bg-su-bleu text-white"><Icone nom={ICONES[sector.id] ?? "conseil"} taille={32} epaisseur={1.6} /></span>
                  <div className="relative flex flex-col gap-2">
                    <h2 className={`${titreFont} m-0 text-[26px] font-extrabold leading-tight text-white sm:text-[30px]`}>{sector.label}</h2>
                    <p className="m-0 text-[15px] leading-relaxed text-su-lavande">{sector.intro}</p>
                    <p className="m-0 text-xs text-su-ciel">{sector.registreRef}</p>
                  </div>
                </div>

                <div className="grid gap-5 pt-2 md:grid-cols-2">
                  {sector.services.map((service, i) => (
                    <ServiceCard key={service.title} service={service} sectorId={sector.id} index={i} />
                  ))}
                </div>

                <div className="flex flex-col gap-5 rounded-[20px] border border-su-lavande bg-su-brume p-7 sm:p-8">
                  <div className="flex flex-col gap-2">
                    <TitrePoints taille="text-2xl">Votre besoin n&apos;est pas dans la liste ?</TitrePoints>
                    <p className="m-0 text-[15px] leading-relaxed text-[#4B5563]">
                      Décrivez-le en quelques mots : nous vous orientons vers la bonne offre ou vous envoyons un devis sous 48 heures ouvrées. Un acompte de 60 % est demandé au démarrage.
                    </p>
                  </div>
                  <textarea value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} rows={3} aria-label="Décrivez votre besoin"
                    className="w-full resize-none rounded-xl border border-su-lavande bg-white px-4 py-3 text-[15px] focus:border-su-bleu focus:outline-none"
                    placeholder={`Ex. : j'ai besoin d'aide pour ${sector.services[0]?.title.toLowerCase()}…`} />
                  <div className="flex flex-wrap gap-3">
                    <Link href={session ? `/dashboard/client/nouvelle-demande/formulaire?sector=${sector.id}` : `/services/souscrire?secteur=${sector.id}`}
                      className="inline-flex items-center gap-2 rounded-full bg-su-bleu px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-su-cadet">
                      Demander un devis <Icone nom="fleche" taille={16} epaisseur={2} />
                    </Link>
                    <button type="button" onClick={() => openChatbot(chatMessage || `Bonjour, je cherche un service dans le domaine « ${sector.label} »`)}
                      className="rounded-full border border-su-clair bg-white px-6 py-3 text-sm font-semibold text-su-bleu transition-colors hover:border-su-bleu">
                      Parler à l&apos;assistant
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
