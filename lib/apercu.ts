/**
 * lib/apercu.ts — Aperçu protégé des livrables (côté serveur).
 *
 * Avant le solde, le client ne reçoit que des images des pages, marquées « APERÇU — SHIFT UP » :
 * le fichier d'origine ne quitte pas le serveur. PDF → images page par page ; image → image filigranée ;
 * Word (.docx) → texte mis en forme, filigrané à l'affichage. Les autres formats n'ont pas d'aperçu.
 */
import path from "path";
import { createCanvas, loadImage, Path2D, DOMMatrix, ImageData } from "@napi-rs/canvas";

export const PAGES_MAX_APERCU = 40;
type Genre = "pdf" | "image" | "word" | "autre";

export function genreFichier(nom: string, type = ""): Genre {
  const n = nom.toLowerCase();
  if (type.includes("pdf") || n.endsWith(".pdf")) return "pdf";
  if (type.startsWith("image/") || /\.(jpe?g|png|webp)$/.test(n)) return "image";
  if (n.endsWith(".docx") || type.includes("wordprocessingml")) return "word";
  return "autre";
}

// pdf.js en Node a besoin des objets de dessin de @napi-rs/canvas
const g = globalThis as Record<string, unknown>;
g.Path2D ??= Path2D; g.DOMMatrix ??= DOMMatrix; g.ImageData ??= ImageData;

const DOSSIER_PDFJS = path.join(process.cwd(), "node_modules", "pdfjs-dist");

async function ouvrirPdf(octets: Buffer) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  return pdfjs.getDocument({
    data: new Uint8Array(octets),
    disableFontFace: true, useSystemFonts: false, isEvalSupported: false,
    standardFontDataUrl: path.join(DOSSIER_PDFJS, "standard_fonts") + path.sep,
    cMapUrl: path.join(DOSSIER_PDFJS, "cmaps") + path.sep, cMapPacked: true,
  }).promise;
}

function filigrane(ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>, l: number, h: number) {
  ctx.save();
  ctx.translate(l / 2, h / 2);
  ctx.rotate(-Math.PI / 6);
  const taille = Math.max(22, Math.round(l / 18));
  ctx.font = `bold ${taille}px sans-serif`;
  ctx.fillStyle = "rgba(49,72,122,0.16)";
  ctx.textAlign = "center";
  const pasY = taille * 4, pasX = taille * 14;
  for (let y = -h; y <= h; y += pasY) {
    for (let x = -l; x <= l; x += pasX) ctx.fillText("APERÇU — SHIFT UP", x + ((y / pasY) % 2 ? pasX / 2 : 0), y);
  }
  ctx.restore();
}

/** Nombre de pages d'aperçu disponibles pour ce fichier. */
export async function compterPages(octets: Buffer, genre: Genre): Promise<number> {
  if (genre === "image") return 1;
  if (genre !== "pdf") return 0;
  const doc = await ouvrirPdf(octets);
  const n = Math.min(doc.numPages, PAGES_MAX_APERCU);
  await doc.destroy();
  return n;
}

/** Image JPEG filigranée d'une page (numérotée à partir de 1). */
export async function imagePage(octets: Buffer, genre: Genre, page: number): Promise<Buffer | null> {
  if (genre === "image") {
    const img = await loadImage(octets);
    const echelle = Math.min(1, 1400 / Math.max(img.width, img.height));
    const l = Math.round(img.width * echelle), h = Math.round(img.height * echelle);
    const cv = createCanvas(l, h);
    const ctx = cv.getContext("2d");
    ctx.drawImage(img, 0, 0, l, h);
    filigrane(ctx, l, h);
    return cv.encode("jpeg", 70);
  }
  if (genre !== "pdf") return null;
  const doc = await ouvrirPdf(octets);
  try {
    if (page < 1 || page > Math.min(doc.numPages, PAGES_MAX_APERCU)) return null;
    const p = await doc.getPage(page);
    const base = p.getViewport({ scale: 1 });
    const vp = p.getViewport({ scale: Math.min(1.6, 1300 / Math.max(base.width, base.height)) });
    const cv = createCanvas(Math.ceil(vp.width), Math.ceil(vp.height));
    const ctx = cv.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, cv.width, cv.height);
    // @ts-expect-error — le contexte de @napi-rs/canvas est compatible avec celui attendu par pdf.js
    await p.render({ canvasContext: ctx, viewport: vp }).promise;
    filigrane(ctx, cv.width, cv.height);
    return await cv.encode("jpeg", 70);
  } finally {
    await doc.destroy();
  }
}

/** Texte d'un document Word, en HTML simple (titres, paragraphes, listes, tableaux). */
export async function htmlWord(octets: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const r = await mammoth.convertToHtml({ buffer: octets }, { ignoreEmptyParagraphs: true });
  // Aucune image ni lien dans l'aperçu
  return r.value.replace(/<img[^>]*>/gi, "").replace(/<a [^>]*>(.*?)<\/a>/gi, "$1");
}

/** Texte brut d'un PDF (pour l'analyse IA) ; vide si le PDF est scanné. */
export async function textePdf(octets: Buffer, maxPages = 80, maxCaracteres = 120_000): Promise<{ texte: string; pages: number }> {
  const doc = await ouvrirPdf(octets);
  try {
    let texte = "";
    const n = Math.min(doc.numPages, maxPages);
    for (let i = 1; i <= n && texte.length < maxCaracteres; i++) {
      const c = await (await doc.getPage(i)).getTextContent();
      texte += `\n--- page ${i} ---\n` + c.items.map((x) => ("str" in x ? x.str : "")).join(" ");
    }
    return { texte: texte.slice(0, maxCaracteres), pages: doc.numPages };
  } finally {
    await doc.destroy();
  }
}

export async function texteWord(octets: Buffer, maxCaracteres = 120_000): Promise<string> {
  const mammoth = await import("mammoth");
  return (await mammoth.extractRawText({ buffer: octets })).value.slice(0, maxCaracteres);
}
