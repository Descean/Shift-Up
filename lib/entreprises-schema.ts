/** Validation des fiches « Mes entreprises » et des pièces du coffre (partagée par les routes API). */
import { z } from "zod";
import { isSafe } from "@/lib/validation";

const txt = (max: number) => z.string().trim().max(max).refine(isSafe, "Contenu non autorisé.");
const opt = (max: number) => txt(max).optional().nullable().transform((v) => v || null);

export const schemaEntreprise = z.object({
  nom: txt(200).pipe(z.string().min(2, "Indiquez le nom de l'entreprise.")),
  formeJuridique: opt(80),
  rccm: opt(80),
  ifu: opt(40),
  representant: opt(150),
  telephone: opt(40),
  email: z.string().trim().max(200).email("Adresse e-mail invalide.").optional().nullable().or(z.literal("")).transform((v) => v || null),
  adresse: opt(300),
});

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable().or(z.literal("")).transform((v) => (v ? new Date(`${v}T12:00:00+01:00`) : null));

export const schemaPiece = z.object({
  type: z.string().trim().min(2).max(40).regex(/^[a-zA-Z_]+$/),
  libelle: txt(200).pipe(z.string().min(2, "Indiquez le nom de la pièce.")),
  url: z.string().url().max(500),
  nomFichier: txt(200).pipe(z.string().min(1)),
  dateDelivrance: date,
  dateExpiration: date,
});
