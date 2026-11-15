import { redirect } from "next/navigation";

/** Le suivi est désormais dans la fiche de chaque demande (« Mes demandes »). */
export default function ClientSuiviPage() {
  redirect("/dashboard/client/prestations");
}
