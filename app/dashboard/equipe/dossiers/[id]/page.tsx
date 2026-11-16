import FicheEquipe from "@/components/espace/equipe/FicheEquipe";

export default async function FicheDossierEquipe({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FicheEquipe id={id} />;
}
