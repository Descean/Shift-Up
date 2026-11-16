import ChoixService from "@/components/espace/client/ChoixService";
import DemandeMontage from "@/components/espace/client/DemandeMontage";
import DemandeService from "@/components/espace/client/DemandeService";
import { trouverDomaine } from "@/lib/catalogue";

/**
 * Nouvelle demande : liste des services ; le montage de dossiers d'appels d'offres a son formulaire
 * en 3 étapes, les autres services suivent le même modèle.
 */
export default async function NouvelleDemande({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = await searchParams;
  const domaine = trouverDomaine(q.domaine ?? q.secteur ?? q.sector ?? null);
  if (q.nature || q.avis || q.entreprise || domaine?.id === "marches-publics") return <DemandeMontage />;
  if (domaine) return <DemandeService domaineId={domaine.id} />;
  return <ChoixService />;
}
