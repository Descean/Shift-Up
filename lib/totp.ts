/**
 * TOTP (RFC 6238) — implémentation native Node.js, zéro dépendance externe.
 * Algorithme : HMAC-SHA1, période 30s, 6 chiffres.
 */
import crypto from "crypto";

const B32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Decode(input: string): Buffer {
  const s = input.replace(/=+$/, "").toUpperCase();
  const result: number[] = [];
  let bits = 0, value = 0;
  for (const ch of s) {
    const idx = B32_ALPHABET.indexOf(ch);
    if (idx === -1) throw new Error(`Caractère base32 invalide : ${ch}`);
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) { result.push((value >>> (bits - 8)) & 0xff); bits -= 8; }
  }
  return Buffer.from(result);
}

function base32Encode(buf: Buffer): string {
  let result = "", bits = 0, value = 0;
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) { result += B32_ALPHABET[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) result += B32_ALPHABET[(value << (5 - bits)) & 31];
  return result;
}

/** Génère un secret TOTP (20 octets, base32) */
export function generateTOTPSecret(): string {
  return base32Encode(crypto.randomBytes(20));
}

/** Génère le code à 6 chiffres pour un instant donné (défaut : maintenant) */
export function generateTOTPCode(secret: string, epochSeconds?: number): string {
  const T = Math.floor((epochSeconds ?? Date.now() / 1000) / 30);
  const counter = Buffer.alloc(8);
  counter.writeBigInt64BE(BigInt(T));
  const hmac = crypto.createHmac("sha1", base32Decode(secret)).update(counter).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = (
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
     (hmac[offset + 3] & 0xff)
  ) % 1_000_000;
  return code.toString().padStart(6, "0");
}

/** Vérifie un token TOTP avec une fenêtre de ±1 période (90s) */
export function verifyTOTPCode(token: string, secret: string, window = 1): boolean {
  const now = Math.floor(Date.now() / 1000);
  for (let i = -window; i <= window; i++) {
    if (crypto.timingSafeEqual(
      Buffer.from(generateTOTPCode(secret, now + i * 30)),
      Buffer.from(token.replace(/\s/g, ""))
    )) return true;
  }
  return false;
}

/** Génère l'URI otpauth:// pour le QR code */
export function generateTOTPKeyURI(email: string, issuer: string, secret: string): string {
  return (
    `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}` +
    `?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`
  );
}
