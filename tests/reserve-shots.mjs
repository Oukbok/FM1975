// Screenshots Jugend › 2. Mannschaft (Liga, Tabelle mit Zonen, Hinweis „Aufstieg gesperrt“, Kader) und
// Statistiken › Ligensystem/Liga mit den zweiten Mannschaften.
//   node tests/reserve-shots.mjs [ordner] [präfix]   (SAVE=… z. B. aus tests/reserve-prep.ts; VIEW=1366x768)
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { startNewGame } from './newgame-flow.mjs';
import { pickOption, optionsOf } from './select3.mjs';

const outDir = process.argv[2] || 'test-output/reserve';
const prefix = process.argv[3] || (process.env.SAVE ? 'save' : 'neu');
const [vw, vh] = (process.env.VIEW || '1920x1080').split('x').map(Number);
await mkdir(outDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
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
const shot = async (n) => {
  await page.waitForTimeout(400);
  const scroll = await page.evaluate(() => { const m = document.querySelector('.app-main'); return m ? m.scrollHeight - m.clientHeight : 0; });
  if (scroll > 2) errors.push(`${n}: Seite scrollt (${scroll}px)`);
  await page.screenshot({ path: `${outDir}/${prefix}_${n}.png` });
};
if (process.env.SAVE) {
  const raw = await readFile(process.env.SAVE, 'utf8');
  await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
  await page.reload();
  await page.click('text=Spiel laden');
  await page.click('.card:has(button:has-text("Löschen")) button:has-text("Laden") >> nth=0');
  await page.waitForTimeout(1500);
  for (let i = 0; i < 3 && await page.locator('.bf-continue').count(); i++) { await page.locator('.bf-continue').click(); await page.waitForTimeout(200); }
} else { await startNewGame(page); await page.waitForTimeout(800); }
const go = async (cat, label) => {
  await page.locator(`.hd-nav-item:has-text("${cat}")`).first().click();
  await page.waitForTimeout(200);
  await page.locator(`.tn-sub-item:has-text("${label}")`).first().click();
  await page.waitForTimeout(300);
};
await go('Jugend', '2. Mannschaft');
await shot('1_uebersicht');
const kader = page.locator('.sub3-tabs [role=tab]:has-text("Kader")').first();
if (await kader.count()) { await kader.click(); await shot('2_kader'); }
await go('Statistiken', 'Ligensystem');
await shot('3_ligensystem');
// Amateurligen mit den KI-Amateuren (game/amateurLeagues.ts) unter Statistiken › Liga.
await go('Statistiken', 'Liga');
const comp = page.locator('.cmp-select .sel3').nth(1);
const am = (await optionsOf(page, comp)).map((o) => o.value).filter((v) => v.startsWith('am:'));
if (am.length) { await pickOption(page, comp, am[Math.min(3, am.length - 1)]); await shot('4_amateurliga'); }
else errors.push('Keine Amateurliga in der Wettbewerbswahl');
const nol = page.locator('.cmp-select .sel3').nth(0);
const lands = (await optionsOf(page, nol)).map((o) => o.value);
if (lands.includes('gdr')) {
  await pickOption(page, nol, 'gdr');
  const d = (await optionsOf(page, comp)).map((o) => o.value).find((v) => v === 'am:ddr-nol');
  if (d) { await pickOption(page, comp, d); await shot('5_nachwuchsoberliga'); }
}
console.log(errors.length ? 'FEHLER:\n' + errors.join('\n') : 'ok, keine JS-Fehler');
await browser.close(); server.close();
process.exit(errors.length ? 1 : 0);
