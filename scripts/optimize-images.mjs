// Große Bilder für das Spiel verkleinern / nach WebP umwandeln (Wunsch Pascal: keine Ladezeiten).
//   node scripts/optimize-images.mjs            -> alle Einträge aus JOBS neu erzeugen
//   node scripts/optimize-images.mjs --check    -> nur Größen/Maße zeigen, nichts schreiben
// Das Original bleibt in images/ liegen (Referenz); das Spiel nutzt die erzeugte Datei. Originale, die
// im Spiel nicht mehr gebraucht werden, kopiert scripts/build.mjs nicht nach dist (`NOT_SHIPPED`).
// Kodiert wird mit Chromium aus Playwright (schon für die Tests da, keine neue Abhängigkeit):
// Bild laden → auf höchstens `maxW` Pixel Breite skalieren → canvas.toDataURL('image/webp', q).
// Neue Einträge: Ergebnis vor dem Einchecken ansehen (Qualität), Adressen im Code/CSS umstellen.
import { readFile, writeFile, stat } from 'node:fs/promises';
import { extname } from 'node:path';
import { chromium } from 'playwright';

export const JOBS = [
  // Hauptmenü + Assistent „Neues Spiel“ (Vollbild-Hintergrund, abgedunkelt): JPEG 471 KB → WebP.
  { src: 'images/start-grandstand.jpg', out: 'images/start-grandstand.webp', maxW: 2048, q: 0.8 },
];

const check = process.argv.includes('--check');
const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
const browser = await chromium.launch();
const page = await browser.newPage();
for (const j of JOBS) {
  const buf = await readFile(j.src);
  const url = `data:${MIME[extname(j.src).toLowerCase()]};base64,${buf.toString('base64')}`;
  const r = await page.evaluate(async ({ url, maxW, q }) => {
    const img = new Image(); img.src = url; await img.decode();
    const s = Math.min(1, maxW / img.naturalWidth);
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
    const x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
    x.drawImage(img, 0, 0, c.width, c.height);
    return { w0: img.naturalWidth, h0: img.naturalHeight, w: c.width, h: c.height, data: c.toDataURL('image/webp', q) };
  }, { url, maxW: j.maxW, q: j.q });
  const out = Buffer.from(r.data.split(',')[1], 'base64');
  if (!check) await writeFile(j.out, out);
  const before = (await stat(j.src)).size;
  console.log(`${j.src} ${r.w0}×${r.h0} ${(before / 1024).toFixed(0)} KB → ${j.out} ${r.w}×${r.h} ${(out.length / 1024).toFixed(0)} KB (q ${j.q})${check ? ' [nur Prüfung]' : ''}`);
}
await browser.close();
