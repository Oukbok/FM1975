// Gesichts-Miniaturen (Wunsch Pascal: kleine Köpfe in Listen nicht als 512×600 dekodieren).
//   node scripts/face-thumbs.mjs           -> fehlende/veraltete Miniaturen erzeugen, verwaiste löschen
//   node scripts/face-thumbs.mjs --all     -> alle neu erzeugen
//   node scripts/face-thumbs.mjs --check   -> nur prüfen (wie `npm run test:images`), nichts schreiben
// Quelle images/faces/<ordner>/<epoche>/<datei>.webp (512 × 600, freigestellt) → gleiche Pfade unter
// images/faces-sm/ in 128 × 150 (¼, gleicher Ausschnitt, Transparenz bleibt), WebP Qualität 0,9.
// Die Miniaturen liegen im Repo (der Build auf Cloudflare/GitHub hat kein Chromium/PIL); welche Quelle
// eine Miniatur hatte, steht in images/faces-sm/manifest.json (SHA-1 der Quelle, 12 Zeichen) – nur
// geänderte Quellen werden neu kodiert. Kodiert mit Chromium aus Playwright (wie optimize-images.mjs):
// in zwei Halbierungsschritten (512 → 256 → 128, `imageSmoothingQuality: high`), damit die Verkleinerung
// sauber mittelt. Im Spiel: `thumbSrc` in components/PlayerAvatar.tsx (Anzeige ≤ THUMB_MAX_PX).
import { readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join, relative } from 'node:path';

export const SRC = 'images/faces';
export const OUT = 'images/faces-sm';
export const MANIFEST = `${OUT}/manifest.json`;
export const THUMB_W = 128;
export const THUMB_H = 150;
const Q = 0.9;

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p));
    else if (e.name.endsWith('.webp')) out.push(p);
  }
  return out;
}

export const sha = (buf) => createHash('sha1').update(buf).digest('hex').slice(0, 12);

/** Vergleich Quellen ↔ Manifest/Miniaturen. Liefert, was fehlt/veraltet/verwaist ist. */
export async function faceThumbStatus() {
  const srcs = (await walk(SRC)).map((p) => relative(SRC, p).replaceAll('\\', '/')).sort();
  let manifest = {};
  try { manifest = JSON.parse(await readFile(MANIFEST, 'utf8')); } catch { /* fehlt */ }
  const have = new Set((await walk(OUT).catch(() => [])).map((p) => relative(OUT, p).replaceAll('\\', '/')));
  const stale = [], missing = [], hashes = {};
  for (const rel of srcs) {
    const h = sha(await readFile(join(SRC, rel)));
    hashes[rel] = h;
    if (!have.has(rel)) missing.push(rel);
    else if (manifest[rel] !== h) stale.push(rel);
  }
  const srcSet = new Set(srcs);
  const orphans = [...have].filter((r) => !srcSet.has(r));
  return { srcs, hashes, manifest, missing, stale, orphans };
}

async function main() {
  const check = process.argv.includes('--check');
  const all = process.argv.includes('--all');
  const st = await faceThumbStatus();
  const todo = all ? st.srcs : [...st.missing, ...st.stale];
  if (check) {
    console.log(`Gesichter ${st.srcs.length} · fehlend ${st.missing.length} · veraltet ${st.stale.length} · verwaist ${st.orphans.length}`);
    process.exit(st.missing.length + st.stale.length + st.orphans.length ? 1 : 0);
  }
  for (const r of st.orphans) await rm(join(OUT, r));
  const manifest = Object.fromEntries(Object.entries(st.manifest).filter(([k]) => k in st.hashes));
  if (todo.length) {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch();
    const page = await browser.newPage();
    let bytesIn = 0, bytesOut = 0;
    for (let i = 0; i < todo.length; i += 24) {
      const batch = todo.slice(i, i + 24);
      const urls = await Promise.all(batch.map(async (rel) => {
        const buf = await readFile(join(SRC, rel)); bytesIn += buf.length;
        return `data:image/webp;base64,${buf.toString('base64')}`;
      }));
      const res = await page.evaluate(async ({ urls, W, H, q }) => Promise.all(urls.map(async (url) => {
        const img = new Image(); img.src = url; await img.decode();
        // Halbieren bis zur Zielgröße (512 → 256 → 128): jede Stufe mittelt 2 × 2 Pixel.
        let src = img, w = img.naturalWidth, h = img.naturalHeight;
        while (w / 2 >= W) {
          const c = document.createElement('canvas');
          c.width = Math.round(w / 2); c.height = Math.round(h / 2);
          const x = c.getContext('2d'); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
          x.drawImage(src, 0, 0, c.width, c.height);
          src = c; w = c.width; h = c.height;
        }
        const c = document.createElement('canvas'); c.width = W; c.height = H;
        const x = c.getContext('2d'); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
        x.drawImage(src, 0, 0, W, H);
        return { w0: img.naturalWidth, h0: img.naturalHeight, data: c.toDataURL('image/webp', q) };
      })), { urls, W: THUMB_W, H: THUMB_H, q: Q });
      for (let k = 0; k < batch.length; k++) {
        const rel = batch[k], r = res[k];
        if (r.w0 !== 512 || r.h0 !== 600) console.warn(`  Hinweis: ${rel} ist ${r.w0}×${r.h0} statt 512×600`);
        const out = Buffer.from(r.data.split(',')[1], 'base64'); bytesOut += out.length;
        await mkdir(dirname(join(OUT, rel)), { recursive: true });
        await writeFile(join(OUT, rel), out);
        manifest[rel] = st.hashes[rel];
      }
      process.stdout.write(`\r  ${Math.min(i + 24, todo.length)}/${todo.length}`);
    }
    await browser.close();
    console.log(`\nMiniaturen neu: ${todo.length} (${(bytesIn / 1048576).toFixed(1)} MB → ${(bytesOut / 1048576).toFixed(1)} MB)`);
  }
  const sorted = Object.fromEntries(Object.keys(manifest).sort().map((k) => [k, manifest[k]]));
  await mkdir(OUT, { recursive: true });
  await writeFile(MANIFEST, JSON.stringify(sorted, null, 0).replaceAll('","', '",\n"').replace('{"', '{\n"').replace(/"}$/, '"\n}') + '\n');
  console.log(`Gesichter ${st.srcs.length} · neu ${todo.length} · gelöscht ${st.orphans.length} · aktuell ${st.srcs.length - todo.length}`);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('face-thumbs.mjs')) await main();
