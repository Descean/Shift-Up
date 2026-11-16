/**
 * Réglages de la Direction : tarifs planchers par nature de marché, prix de la livraison physique,
 * majoration « Express » et part de l'acompte. Stockés dans la table Reglage (clé « tarifs ») ;
 * valeurs par défaut tant que rien n'est enregistré (ou si le script SQL n'a pas encore été exécuté).
 */
import prisma from "@/lib/prisma";

export * from "@/lib/tarifs-montage";
import { TARIFS_DEFAUT, type Tarifs } from "@/lib/tarifs-montage";

export async function lireTarifs(): Promise<Tarifs> {
  try {
    const r = await prisma.reglage.findUnique({ where: { cle: "tarifs" } });
    const v = (r?.valeur ?? {}) as Partial<Tarifs>;
    return {
      planchers: { ...TARIFS_DEFAUT.planchers, ...(v.planchers ?? {}) },
      livraisonPhysique: v.livraisonPhysique ?? TARIFS_DEFAUT.livraisonPhysique,
      majorationExpress: v.majorationExpress ?? TARIFS_DEFAUT.majorationExpress,
      acompte: v.acompte ?? TARIFS_DEFAUT.acompte,
      commissionMonteurs: v.commissionMonteurs ?? TARIFS_DEFAUT.commissionMonteurs,
    };
  } catch {
    return TARIFS_DEFAUT;
  }
}

export async function enregistrerTarifs(t: Tarifs) {
  await prisma.reglage.upsert({ where: { cle: "tarifs" }, update: { valeur: t }, create: { cle: "tarifs", valeur: t } });
}

