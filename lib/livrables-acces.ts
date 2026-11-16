/** Accès d'un utilisateur à un livrable : client propriétaire (livrable visible), équipe ou chargé du dossier. */
import { estEquipe } from "@/lib/roles";
import { contexteEquipe, peutTraiter } from "@/lib/monteurs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { soldeRegle } from "@/lib/prestations";

export async function accesLivrable(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const l = await prisma.livrable.findUnique({
    where: { id },
    select: { id: true, title: true, url: true, type: true, isAvailable: true, viewedAt: true,
      prestation: { select: { id: true, clientId: true, assignedToId: true, amount: true, amountPaid: true } } },
  });
  if (!l || !l.url) return null;
  const role = session.user.role as string;
  const equipe = l.prestation.assignedToId === session.user.id
    || (estEquipe(role) && await peutTraiter(await contexteEquipe(session.user.id, role), l.prestation.assignedToId));
  const client = l.prestation.clientId === session.user.id && l.isAvailable;
  if (!equipe && !client) return null;
  return { livrable: l, client: client && !equipe, solde: soldeRegle(l.prestation) };
}
