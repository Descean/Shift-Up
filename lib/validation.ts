/**
 * lib/validation.ts — Validation sécurisée centralisée SHIFT UP
 *
 * Couvre :
 *  - Sanitisation anti-XSS / injection
 *  - Téléphones des 17 pays OHADA
 *  - Adresses email
 *  - Noms / prénoms
 *  - Numéros IFU / NIF / TVA par pays OHADA
 *  - Mots de passe forts
 */

import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// SANITISATION — Protection XSS et injection
// ─────────────────────────────────────────────────────────────────────────────

/** Détecte une tentative d'injection : balises HTML, scripts, templates, SQL */
const INJECTION_PATTERN =
  /<[^>]*>|javascript:|data:|vbscript:|on\w+\s*=|<script|<\/script|SELECT\s+.*\s+FROM|INSERT\s+INTO|DROP\s+TABLE|UNION\s+SELECT|--\s|\/\*|\*\/|\{\{|\}\}/i;

/** Caractères de contrôle invisibles (hors espace/tabulation/saut de ligne normaux) */
const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/;

/**
 * Vérifie qu'une chaîne ne contient pas d'injection.
 * Retourne true si la chaîne est saine.
 */
export function isSafe(value: string): boolean {
  return !INJECTION_PATTERN.test(value) && !CONTROL_CHARS.test(value);
}

/** Sanitise en supprimant les balises HTML et les espaces superflus */
export function sanitize(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")         // supprime balises HTML
    .replace(/&[a-z]+;/gi, " ")      // decode entités HTML → espace
    .replace(/\s+/g, " ")            // normalise espaces
    .trim();
}

// Transformateur Zod réutilisable : sanitise ET vérifie
const safeTrim = z.string().transform((v) => v.trim()).refine(isSafe, {
  message: "Contenu non autorisé détecté.",
});

// ─────────────────────────────────────────────────────────────────────────────
// NOM / PRÉNOM
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Nom ou prénom valide : lettres (latin étendu), espaces, tirets, apostrophes.
 * Refuse les chiffres, symboles, et injections.
 */
const NAME_PATTERN = /^[\p{L}\p{M}'\- ]{2,80}$/u;

export const nameSchema = safeTrim.pipe(
  z.string()
    .min(2, "Minimum 2 caractères.")
    .max(80, "Maximum 80 caractères.")
    .regex(NAME_PATTERN, "Nom invalide : lettres, espaces, tirets et apostrophes uniquement.")
);

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL
// ─────────────────────────────────────────────────────────────────────────────

export const emailSchema = safeTrim.pipe(
  z.string()
    .email("Adresse email invalide.")
    .max(254, "Email trop long.")
    .toLowerCase()
    .refine(
      (v) => /^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/.test(v),
      "Format email invalide."
    )
);

// ─────────────────────────────────────────────────────────────────────────────
// TÉLÉPHONE — 17 pays OHADA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formats téléphoniques reconnus par pays OHADA.
 * Source : ARCEP / ARTP / régulateurs nationaux (format E.164).
 *
 * Chaque entrée : { code pays, indicatif, regex sur les chiffres après indicatif }
 */
export const OHADA_PHONE_CONFIGS = [
  // Bénin (+229) — réforme Jan 2024 : 10 chiffres (01XXXXXXXX fixe, 09/097 mobile…)
  { country: "Bénin",             dialCode: "229", pattern: /^(01[0-9]{8}|0[4-9][0-9]{7}|[4-9][0-9]{7})$/ },
  // Burkina Faso (+226) — 8 chiffres
  { country: "Burkina Faso",      dialCode: "226", pattern: /^[267][0-9]{7}$/ },
  // Cameroun (+237) — 9 chiffres
  { country: "Cameroun",          dialCode: "237", pattern: /^[26][0-9]{8}$/ },
  // Centrafrique (+236) — 8 chiffres
  { country: "Centrafrique",      dialCode: "236", pattern: /^[27][0-9]{7}$/ },
  // Comores (+269) — 7 chiffres
  { country: "Comores",           dialCode: "269", pattern: /^[37][0-9]{6}$/ },
  // Congo (+242) — 9 chiffres
  { country: "Congo",             dialCode: "242", pattern: /^[06][0-9]{8}$/ },
  // Côte d'Ivoire (+225) — 10 chiffres
  { country: "Côte d'Ivoire",     dialCode: "225", pattern: /^0[57][0-9]{8}$/ },
  // Gabon (+241) — 7-8 chiffres
  { country: "Gabon",             dialCode: "241", pattern: /^0[0-9]{7,8}$/ },
  // Guinée (+224) — 9 chiffres
  { country: "Guinée",            dialCode: "224", pattern: /^[67][0-9]{8}$/ },
  // Guinée-Bissau (+245) — 9 chiffres
  { country: "Guinée-Bissau",     dialCode: "245", pattern: /^[459][0-9]{8}$/ },
  // Guinée Équatoriale (+240) — 9 chiffres
  { country: "Guinée Équatoriale", dialCode: "240", pattern: /^[23][0-9]{8}$/ },
  // Mali (+223) — 8 chiffres
  { country: "Mali",              dialCode: "223", pattern: /^[67][0-9]{7}$/ },
  // Niger (+227) — 8 chiffres
  { country: "Niger",             dialCode: "227", pattern: /^[789][0-9]{7}$/ },
  // RDC (+243) — 9 chiffres
  { country: "RDC",               dialCode: "243", pattern: /^[89][0-9]{8}$/ },
  // Sénégal (+221) — 9 chiffres
  { country: "Sénégal",           dialCode: "221", pattern: /^[37][0-9]{8}$/ },
  // Tchad (+235) — 8 chiffres
  { country: "Tchad",             dialCode: "235", pattern: /^[679][0-9]{7}$/ },
  // Togo (+228) — 8 chiffres
  { country: "Togo",              dialCode: "228", pattern: /^[79][0-9]{7}$/ },
] as const;

/** Normalise un numéro en retirant espaces, tirets, parenthèses */
function normalizePhone(raw: string): string {
  return raw.replace(/[\s\-().+]/g, "");
}

/**
 * Valide un numéro de téléphone OHADA.
 * Accepte les formats : +229XXXXXXXX, 229XXXXXXXX, 0XXXXXXXXX (local).
 * Retourne le pays détecté ou null si invalide.
 */
export function validateOhadaPhone(raw: string): { valid: boolean; country?: string; e164?: string } {
  const digits = normalizePhone(raw);

  for (const cfg of OHADA_PHONE_CONFIGS) {
    // Format E.164 avec indicatif
    if (digits.startsWith(cfg.dialCode)) {
      const local = digits.slice(cfg.dialCode.length);
      if (cfg.pattern.test(local)) {
        return { valid: true, country: cfg.country, e164: `+${cfg.dialCode}${local}` };
      }
    }
    // Format local (commence par 0) — on retire le 0 et on essaie
    if (digits.startsWith("0")) {
      const local = digits.slice(1);
      if (cfg.pattern.test("0" + local) || cfg.pattern.test(local)) {
        // Ambiguïté : sans indicatif on ne peut pas certifier le pays
        // On accepte mais on marque "local"
        return { valid: true, country: cfg.country + " (local)", e164: `+${cfg.dialCode}${local}` };
      }
    }
  }

  return { valid: false };
}

export const phoneSchema = safeTrim.pipe(
  z.string()
    .min(6, "Numéro trop court.")
    .max(20, "Numéro trop long.")
    .refine(
      (v) => validateOhadaPhone(v).valid,
      "Numéro de téléphone invalide. Formats acceptés : pays OHADA (+229, +225, +237…)."
    )
);

export const phoneOptionalSchema = z.string().optional().refine(
  (v) => !v || v.trim() === "" || validateOhadaPhone(v).valid,
  "Numéro de téléphone invalide. Formats acceptés : pays OHADA."
);

// ─────────────────────────────────────────────────────────────────────────────
// IFU / NIF / TVA par pays OHADA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formats IFU/NIF connus par pays.
 * Ces formats sont indicatifs — les administrations fiscales évoluent.
 */
export const OHADA_IFU_PATTERNS: Record<string, { label: string; pattern: RegExp; example: string }> = {
  "229": { label: "IFU Bénin",             pattern: /^[A-Z0-9]{6,15}$/,     example: "1234567890" },
  "226": { label: "IFU Burkina Faso",       pattern: /^[0-9A-Z]{6,15}$/,     example: "BF-123456789" },
  "237": { label: "NIU Cameroun",           pattern: /^M[0-9]{9}[A-Z]$/,     example: "M123456789A" },
  "236": { label: "NIF Centrafrique",       pattern: /^[0-9]{8,12}$/,        example: "12345678" },
  "269": { label: "NIF Comores",            pattern: /^[0-9]{6,10}$/,        example: "123456" },
  "242": { label: "NIF Congo",              pattern: /^[0-9]{6,12}$/,        example: "123456789" },
  "225": { label: "DGI CI",                 pattern: /^[0-9]{7}[A-Z]$/,      example: "1234567A" },
  "241": { label: "NIF Gabon",              pattern: /^[0-9]{7}[A-Z]$/,      example: "1234567A" },
  "224": { label: "NIF Guinée",             pattern: /^[0-9]{3}-[0-9]{3}-[0-9]{3}$/, example: "123-456-789" },
  "245": { label: "NIF Guinée-Bissau",      pattern: /^[0-9]{7,12}$/,        example: "1234567" },
  "240": { label: "NIF Guinée Éq.",         pattern: /^[0-9]{7,12}$/,        example: "1234567" },
  "223": { label: "NIF Mali",               pattern: /^[0-9]{7,12}$/,        example: "1234567890" },
  "227": { label: "NIF Niger",              pattern: /^[0-9]{8,12}$/,        example: "12345678" },
  "243": { label: "NIF RDC",                pattern: /^[A-Z0-9]{7,15}$/,     example: "1234567890" },
  "221": { label: "NINEA Sénégal",          pattern: /^[0-9]{7}[A-Z]{1,2}[0-9]{2}$/, example: "1234567A12" },
  "235": { label: "NIF Tchad",              pattern: /^[0-9]{7,12}$/,        example: "1234567" },
  "228": { label: "IFU Togo",               pattern: /^[0-9]{6,15}$/,        example: "123456789" },
};

/**
 * Valide un numéro IFU/NIF selon le pays (indicatif dial code).
 * dialCode exemple : "229" pour Bénin.
 */
export function validateIfu(value: string, dialCode = "229"): boolean {
  if (!value.trim()) return false;
  const cfg = OHADA_IFU_PATTERNS[dialCode];
  if (!cfg) return /^[A-Z0-9\-]{4,20}$/i.test(value.trim()); // fallback générique
  return cfg.pattern.test(value.trim().toUpperCase());
}

/** Schéma Zod IFU générique (Bénin par défaut) */
export const ifuSchema = safeTrim.pipe(
  z.string()
    .min(4, "IFU trop court.")
    .max(20, "IFU trop long.")
    .refine(isSafe, "Caractères non autorisés.")
);

export const ifuOptionalSchema = z.string().optional().refine(
  (v) => !v || v.trim() === "" || isSafe(v),
  "Caractères non autorisés dans l'IFU."
);

// ─────────────────────────────────────────────────────────────────────────────
// MOT DE PASSE
// ─────────────────────────────────────────────────────────────────────────────

export const passwordSchema = z.string()
  .min(8, "Minimum 8 caractères.")
  .max(128, "Maximum 128 caractères.")
  .refine(
    (v) => /[A-Z]/.test(v) || /[a-z]/.test(v),
    "Le mot de passe doit contenir au moins une lettre."
  )
  .refine(
    (v) => /[0-9]/.test(v),
    "Le mot de passe doit contenir au moins un chiffre."
  )
  .refine(isSafe, "Caractères non autorisés dans le mot de passe.");

// ─────────────────────────────────────────────────────────────────────────────
// TEXTE LIBRE (description, message, etc.)
// ─────────────────────────────────────────────────────────────────────────────

export function freeTextSchema(min = 1, max = 2000) {
  return z.string()
    .min(min, `Minimum ${min} caractère(s).`)
    .max(max, `Maximum ${max} caractères.`)
    .refine(isSafe, "Contenu non autorisé détecté.")
    .transform((v) => v.trim());
}

// ─────────────────────────────────────────────────────────────────────────────
// CODE D'AFFILIATION
// ─────────────────────────────────────────────────────────────────────────────

export const affiliationCodeSchema = z.string()
  .regex(/^[A-Z0-9]{6,12}$/, "Code d'affiliation invalide (6-12 caractères alphanumériques).")
  .optional()
  .or(z.literal(""));

// ─────────────────────────────────────────────────────────────────────────────
// SCHÉMA INSCRIPTION COMPLET
// ─────────────────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  name:            nameSchema,
  email:           emailSchema,
  phone:           phoneOptionalSchema,
  password:        passwordSchema,
  confirmPassword: z.string(),
  role:            z.enum(["CLIENT", "APPORTEUR", "ETUDIANT"]),
  affiliationCode: affiliationCodeSchema,
  ifu:             ifuOptionalSchema,
  acceptTerms:     z.boolean().refine((v) => v === true, "Vous devez accepter les conditions d'utilisation."),
}).refine(
  (d) => d.password === d.confirmPassword,
  { message: "Les mots de passe ne correspondent pas.", path: ["confirmPassword"] }
);

// ─────────────────────────────────────────────────────────────────────────────
// SCHÉMA CONNEXION
// ─────────────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email:    emailSchema,
  password: z.string().min(1, "Mot de passe requis.").max(128).refine(isSafe, "Caractères non autorisés."),
});

// ─────────────────────────────────────────────────────────────────────────────
// SCHÉMA CONTACT
// ─────────────────────────────────────────────────────────────────────────────

export const contactSchema = z.object({
  name:    nameSchema,
  email:   emailSchema,
  phone:   phoneOptionalSchema,
  subject: freeTextSchema(2, 100),
  message: freeTextSchema(10, 2000),
});
