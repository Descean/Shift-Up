/** Nom lisible d'une prestation (service du catalogue, intitulé libre ou domaine). */
export function nomService(p: { service?: { title: string } | null; customService?: string | null; sector?: string | null }) {
  return p.service?.title ?? p.customService ?? p.sector ?? "Prestation";
}
