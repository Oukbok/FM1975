// Screenshots der Relegation (Statistiken › Liga mit Zone + Ergebnissen, Ausland, Ligensystem, Kalender).
//   node scripts/run-ts.mjs tests/relegation2-prep.ts test-output/relegation2
//   npm run build && SAVE=test-output/relegation2/rel-nach.txt node tests/relegation2-shots.mjs [ordner]
//   VIEW=1366x768 für kleine Bildschirme. Vorschau „Nächstes Spiel“: SAVE=…/rel-vor.txt MAX=1 node tests/prematch-shots.mjs …
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { pickOption, optionsOf } from './select3.mjs';

const outDir = process.argv[2] || 'test-output/relegation2';
const [vw, vh] = (process.env.VIEW || '1920x1080').split('x').map(Number);
await mkdir(outDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(join('dist', path))); }
  catch { res.writeHead(404).end(); }
}).listen(0);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: vw, height: vh } });
const errors = [];
page.on('pageerror', (e) => errors.push('JS-Fehler: ' + e.message));
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
await page.goto(`http://127.0.0.1:${server.address().port}/`);
const raw = await readFile(process.env.SAVE || 'test-output/relegation2/rel-nach.txt', 'utf8');
await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
await page.reload();
await page.click('text=Spiel laden');
await page.click('.card:has(button:has-text("Löschen")) button:has-text("Laden") >> nth=0');
await page.waitForTimeout(1800);
for (let k = 0; k < 8; k++) {
  if (await page.locator('.gb-root').count()) { await page.keyboard.press('Escape'); await page.waitForTimeout(300); continue; }
  const x = page.locator('.modal-overlay .modal-close, .modal-overlay button:has-text("Schließen"), .modal-overlay button:has-text("OK")').first();
  if (await page.locator('.modal-overlay').count() && await x.isVisible().catch(() => false)) { await x.click().catch(() => {}); await page.waitForTimeout(300); continue; }
  break;
}
const tag = `rel_${vw}`;
const shot = async (n) => {
  await page.waitForTimeout(400);
  const info = await page.evaluate(() => ({
    rg: document.querySelectorAll('.rl-z.zone-rg').length,
    blocks: document.querySelectorAll('.rgx-block').length,
    legs: document.querySelectorAll('.rgx-leg').length,
    over: (() => { const h = document.querySelector('.cmp-main .dxh'); if (!h) return 0; const r = h.getBoundingClientRect(); return Math.max(0, ...[...h.querySelectorAll('*')].map((e) => e.getBoundingClientRect().right - r.right)); })(),
    body: document.documentElement.scrollHeight > window.innerHeight + 2,
  }));
  if (info.over > 1) errors.push(`${n}: Kopfleiste läuft über (${Math.round(info.over)} px)`);
  if (info.body) errors.push(`${n}: Seite scrollt`);
  await page.screenshot({ path: `${outDir}/${tag}_${n}.png` });
  console.log('Bild', `${outDir}/${tag}_${n}.png`, JSON.stringify(info));
  return info;
};
async function go(label) {
  await page.locator('.hd-nav-item:has-text("Statistiken")').first().click();
  await page.locator(`.tn-sub-item:has-text("${label}")`).first().click();
  await page.waitForTimeout(600);
}
const countrySel = () => page.locator('.cmp-select .sel3').nth(0);
const compSel = () => page.locator('.cmp-select .sel3').nth(1);
// Eigene Liga (2. Liga): Relegation 1./2. und 2./3. Liga unter der Tabelle.
await go('Liga');
const scrollDown = async () => page.evaluate(() => { const s = document.querySelector('.cmp-main .cmp-scroll'); if (s) s.scrollTop = s.scrollHeight; });
let i = await shot('liga_heim');
if (!i.rg || !i.blocks) errors.push('eigene Liga: Relegationszone oder -block fehlt');
await scrollDown(); await shot('liga_heim_unten');
const comps = (await optionsOf(page, compSel())).map((o) => o.value);
await pickOption(page, compSel(), comps[0]); await scrollDown(); i = await shot('liga_1liga');
if (!i.rg) errors.push('1. Liga: Relegationszone fehlt');
// England: Play-offs der 2. Ebene.
await pickOption(page, countrySel(), 'eng');
const ec = (await optionsOf(page, compSel())).map((o) => o.value);
if (ec.includes('r2')) { await pickOption(page, compSel(), 'r2'); await scrollDown(); i = await shot('liga_england_2'); if (!i.blocks) errors.push('England 2. Ebene: Play-offs fehlen'); }
await pickOption(page, countrySel(), 'ned');
await pickOption(page, compSel(), 'r1'); await scrollDown(); await shot('liga_niederlande_1');
// Ligensystem: Marken an den Kästen.
await go('Ligensystem');
await page.waitForTimeout(500);
const marks = await page.locator('.lp-mv.rel').count();
if (!marks) errors.push('Ligensystem: keine Relegationsmarke');
await page.locator('.lp-mv.rel').first().hover().catch(() => {});
await shot('ligensystem');
// Kalender
await page.locator('.hd-nav-item:has-text("Zentrale")').first().click();
await page.locator('.tn-sub-item:has-text("Kalender")').first().click().catch(() => {});
await page.waitForTimeout(600);
await shot('kalender');
console.log(errors.length ? errors.join('\n') : 'Keine Fehler.');
await browser.close();
server.close();
process.exit(errors.length ? 1 : 0);
