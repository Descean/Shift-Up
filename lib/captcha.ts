/**
 * Vérifie un token hCaptcha côté serveur.
 * Si HCAPTCHA_SECRET_KEY n'est pas configurée (dev local), la vérification est ignorée.
 */
export async function verifyCaptcha(token: string | undefined | null): Promise<boolean> {
  if (!process.env.HCAPTCHA_SECRET_KEY) return true; // skip en dev
  if (!token) return false;

  try {
    const res = await fetch("https://hcaptcha.com/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: process.env.HCAPTCHA_SECRET_KEY,
        response: token,
      }),
    });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}
