import { redirect } from "next/navigation";
import FicheDossier from "@/components/espace/client/FicheDossier";

export default async function FichePrestation({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  if (!id) redirect("/dashboard/client");
  return <FicheDossier id={id} />;
}
