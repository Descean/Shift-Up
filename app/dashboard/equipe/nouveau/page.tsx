import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { estEquipe } from "@/lib/roles";
import { competencesPartenaire, contexteEquipe } from "@/lib/monteurs";
import DossierClient from "@/components/espace/equipe/DossierClient";

/**
 * Un partenaire ouvre la demande d'un de ses clients. Seuls les services de ses compétences
 * (cochées à l'inscription) sont proposés ; la Direction et l'équipe interne voient tout le catalogue.
 */
export default async function NouveauDossierClient() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !estEquipe(session.user.role as string)) redirect("/connexion");
  const ctx = await contexteEquipe(session.user.id, session.user.role as string);
  if (!ctx.actif) redirect("/dashboard/equipe");
  return <DossierClient competences={await competencesPartenaire(ctx)} />;
}
