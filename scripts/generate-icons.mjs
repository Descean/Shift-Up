/**
 * scripts/generate-icons.mjs — Génération des icônes PWA SHIFT UP
 *
 * Utilise sharp pour redimensionner le logo source en toutes les tailles
 * requises par le manifest.json PWA.
 *
 * Usage : node scripts/generate-icons.mjs
 * (ajouter dans package.json : "icons": "node scripts/generate-icons.mjs")
 *
 * Sortie : /public/icons/icon-{size}x{size}.png
 */

import sharp from "sharp";
import { existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = resolve(__dirname, "..");

// ── Source : logo carré sans texte ────────────────────────────────────────────
// "Shift Up logo.png" est l'icône carrée (flèche dans carré arrondi)
const SOURCE = resolve(ROOT, "Shift Up logo.png");

// ── Répertoire de sortie ───────────────────────────────────────────────────────
const OUT_DIR = resolve(ROOT, "public", "icons");
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

// ── Tailles requises (manifest.json + Apple Touch) ────────────────────────────
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// ── Couleur de fond (navy SHIFT UP) pour icône maskable ──────────────────────
const NAVY = { r: 10, g: 37, b: 51, alpha: 1 };

async function generateIcons() {
  console.log("🎨 SHIFT UP — Génération des icônes PWA\n");
  console.log(`   Source : ${SOURCE}`);
  console.log(`   Sortie : ${OUT_DIR}\n`);

  if (!existsSync(SOURCE)) {
    console.error("❌ Fichier source introuvable : " + SOURCE);
    console.error("   Assurez-vous que 'Shift Up logo.png' est à la racine du projet.");
    process.exit(1);
  }

  for (const size of SIZES) {
    const outFile = resolve(OUT_DIR, `icon-${size}x${size}.png`);

    // Padding pour icône maskable (20% de marge sur fond navy)
    const padding = Math.round(size * 0.15);
    const innerSize = size - padding * 2;

    await sharp(SOURCE)
      .resize(innerSize, innerSize, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .toBuffer()
      .then((logoBuffer) =>
        sharp({
          create: {
            width: size,
            height: size,
            channels: 4,
            background: NAVY,
          },
        })
          .composite([
            { input: logoBuffer, gravity: "center", blend: "over" },
          ])
          // Teinture du logo en blanc pour qu'il ressorte sur fond navy
          .png()
          .toFile(outFile)
      );

    console.log(`   ✅  icon-${size}x${size}.png`);
  }

  // ── Copie en tant qu'apple-touch-icon.png (152×152 = bonne taille Apple) ──
  const appleSrc  = resolve(OUT_DIR, "icon-152x152.png");
  const appleDest = resolve(ROOT, "public", "apple-touch-icon.png");
  await sharp(appleSrc).resize(180, 180).toFile(appleDest);
  console.log("\n   ✅  apple-touch-icon.png (180×180)");

  // ── favicon.ico (32×32, icône légère pour les anciens navigateurs) ─────────
  const faviconDest = resolve(ROOT, "public", "favicon.ico");
  await sharp(SOURCE)
    .resize(32, 32, { fit: "contain", background: { r: 10, g: 37, b: 51, alpha: 1 } })
    .flatten({ background: NAVY })
    .toFile(faviconDest);
  console.log("   ✅  favicon.ico (32×32)");

  // ── og-image.png pour les Open Graph (1200×630) ────────────────────────────
  const ogDest = resolve(ROOT, "public", "assets", "og-image.png");
  const logoForOg = await sharp(SOURCE)
    .resize(200, 200, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 4,
      background: { r: 10, g: 37, b: 51, alpha: 1 },
    },
  })
    .composite([{ input: logoForOg, gravity: "center" }])
    .png()
    .toFile(ogDest);
  console.log("   ✅  assets/og-image.png (1200×630)");

  console.log("\n🎉 Toutes les icônes ont été générées avec succès !\n");
}

generateIcons().catch((err) => {
  console.error("❌ Erreur :", err.message);
  process.exit(1);
});
