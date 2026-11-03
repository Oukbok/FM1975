// Screenshots „Erstes Training“ (Versprechen-Popup) + Kader › Kabine › Versprechen,
// je 1920×1080 und 1366×768, mit Prüfung auf Überlauf.
//   npm run build && node tests/promises-shots.mjs [ordner]
//   ohne SAVE: neues Spiel (1975/76). Mit SAVE=popup.txt (Popup fällig) und/oder
//   STAND=stand.txt (Versprechen gegeben) aus tests/promises-prep.ts.
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { startNewGame } from './newgame-flow.mjs';

const outDir = process.argv[2] || 'test-output/promises';
await mkdir(outDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { const buf = await readFile(join('dist', path)); res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(buf); }
  catch { res.writeHead(404).end(); }
}).listen(0);
const browser = await chromium.launch();
const errors = [];

async function openPage(w, h) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  page.on('pageerror', (e) => errors.push(`JS-Fehler (${w}): ${e.message}`));
  await page.addInitScript(() => { window.__FM_PROMISES__ = true; });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  return page;
}
async function loadSave(page, file) {
  const raw = await readFile(file, 'utf8');
  await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
  await page.reload();
  await page.click('text=Spiel laden');
  await page.click('button:has-text("Laden") >> nth=0');
  await page.waitForTimeout(1500);
}
async function check(page, name, tag) {
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${outDir}/${tag}_${name}.png` });
  const rep = await page.evaluate(() => {
    const out = [];
    const m = document.querySelector('.ft-modal');
    if (m) {
      const r = m.getBoundingClientRect();
      if (r.bottom > window.innerHeight + 1 || r.right > window.innerWidth + 1) out.push('Fenster ragt aus dem Bild');
      const body = m.querySelector('.mx-body');
      if (body && body.scrollWidth > body.clientWidth + 2) out.push('waagerechter Überlauf');
      if (body && body.scrollHeight > body.clientHeight + 2) out.push(`Fenster scrollt intern (${body.scrollHeight - body.clientHeight}px)`);
      for (const el of m.querySelectorAll('.ft-card-label, .ft-face-name')) if (el.scrollWidth > el.clientWidth + 2) out.push(`abgeschnitten: ${el.textContent}`);
    }
    return out;
  });
  console.log(`${tag}_${name}: ${rep.length ? rep.join('; ') : 'ok'}`);
}
async function popupRun(w, h, tag, save) {
  const page = await openPage(w, h);
  if (save) await loadSave(page, save);
  else {
    await startNewGame(page);
    for (let i = 0; i < 6 && !(await page.locator('.ft-modal').count()); i++) {
      const go = page.locator('.hd-continue').first();
      if (await go.isVisible().catch(() => false)) await go.click().catch(() => {});
      await page.waitForTimeout(1200);
    }
  }
  await page.locator('.ft-modal').waitFor({ timeout: 15000 });
  await check(page, '1_leer', tag);
  for (const id of ['meister', 'rotation', 'jugend', 'disziplin']) await page.locator(`.ft-card[data-sp="${id}"]:not([disabled])`).click().catch(() => {});
  await check(page, '2_auswahl', tag);
  await page.locator('.ft-go').click();
  await page.waitForTimeout(400);
  await page.locator('.hd-nav-item:has-text("Kader")').click();
  await page.locator('.tn-sub-item:has-text("Kabine")').click();
  await page.locator('.dchip:has-text("Versprechen")').click();
  await check(page, '3_kabine', tag);
  await page.close();
}
async function standRun(w, h, tag, save) {
  const page = await openPage(w, h);
  await loadSave(page, save);
  await page.locator('.hd-nav-item:has-text("Kader")').click();
  await page.locator('.tn-sub-item:has-text("Kabine")').click();
  await page.locator('.dchip:has-text("Versprechen")').click();
  await check(page, 'stand', tag);
  await page.close();
}

for (const [w, h] of [[1920, 1080], [1366, 768]]) {
  await popupRun(w, h, `neu_${w}`);
  if (process.env.SAVE) await popupRun(w, h, `save_${w}`, process.env.SAVE);
  if (process.env.STAND) await standRun(w, h, `save_${w}`, process.env.STAND);
}
console.log(errors.length ? errors.join('\n') : 'keine JS-Fehler');
await browser.close();
server.close();
process.exit(errors.length ? 1 : 0);
