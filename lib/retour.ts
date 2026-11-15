/**
 * lib/retour.ts — Adresse de retour après connexion ou inscription.
 *
 * Ne garde que les chemins internes au site (« /… », jamais « //… » ni une URL complète),
 * pour éviter toute redirection vers un site extérieur. Par défaut : /dashboard,
 * qui envoie chacun vers l'espace de son rôle.
 */
export function cheminRetour(brut: string | null | undefined, defaut = "/dashboard"): string {
  if (!brut) return defaut;
  let v = brut.trim();
  try {
    // callbackUrl peut arriver sous forme d'URL complète du même site (NextAuth)
    if (/^https?:\/\//i.test(v)) {
      const u = new URL(v);
      if (typeof window !== "undefined" && u.origin !== window.location.origin) return defaut;
      v = u.pathname + u.search + u.hash;
    }
  } catch {
    return defaut;
  }
  if (!v.startsWith("/") || v.startsWith("//") || v.startsWith("/\\")) return defaut;
  if (v.startsWith("/connexion") || v.startsWith("/inscription")) return defaut;
  return v;
}

/** Lit ?callbackUrl= dans l'adresse de la page courante (côté navigateur). */
export function retourDepuisAdresse(defaut = "/dashboard"): string {
  if (typeof window === "undefined") return defaut;
  return cheminRetour(new URLSearchParams(window.location.search).get("callbackUrl"), defaut);
}
