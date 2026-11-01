// Screenshots Jugend › Jugendwettbewerbe (Tabelle, Endrunde als Baum/Runden, Gruppen,
// Bestenlisten, Vorsaison) und Kategorie-Übersicht Jugend.
//   npm run build && node tests/youthcomp-shots.mjs [ordner] [präfix]
//   Mit Spielstand: DUMP=test-output/yc/save76.txt UNTIL=1976-06-25 node scripts/sim.mjs 0
//                   SAVE=test-output/yc/save76.txt node tests/youthcomp-shots.mjs test-output/yc 76
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { startNewGame } from './newgame-flow.mjs';

const outDir = process.argv[2] || 'test-output/yc';
const prefix = process.argv[3] || 'neu';
await mkdir(outDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(join('dist', path))); }
  catch { res.writeHead(404).end(); }
}).listen(0);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errors = [];
page.on('pageerror', (e) => errors.push('JS-Fehler: ' + e.message));
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
await page.goto(`http://127.0.0.1:${server.address().port}/`);
const shot = async (n) => {
  await page.waitForTimeout(250);
  const scroll = await page.evaluate(() => { const m = document.querySelector('.app-main'); return m ? m.scrollHeight - m.clientHeight : 0; });
  if (scroll > 2) errors.push(`${n}: Seite scrollt (${scroll}px)`);
  await page.screenshot({ path: `${outDir}/${prefix}_${n}.png` });
};

if (process.env.SAVE) {
  const raw = await readFile(process.env.SAVE, 'utf8');
  await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
  await page.reload();
  await page.click('text=Spiel laden');
  await page.click('button:has-text("Laden") >> nth=0');
  await page.waitForTimeout(1500);
  for (let i = 0; i < 3 && await page.locator('.bf-continue').count(); i++) { await page.locator('.bf-continue').click(); await page.waitForTimeout(200); }
} else {
  await startNewGame(page);
}

await page.locator('.hd-nav-item:has-text("Jugend")').first().click();
await page.waitForTimeout(400);
await shot('jugend_uebersicht');
await page.locator('.tn-sub-item:has-text("Jugendwettbewerbe")').first().click();
await page.waitForTimeout(500);
await shot('yc_liga');
const compSel = () => page.locator('.cmp-select select').nth(1);
const seasonSel = () => page.locator('.cmp-select select').nth(0);
const opts = await compSel().locator('option').allTextContents();
console.log('Optionen:', opts.join(' | '));
for (const [want, n] of [['A-Jugendmeisterschaft – Endrunde', 'yc_endrunde'], ['A-Junioren-Bundesliga – Endrunde', 'yc_endrunde'], ['Nachwuchsliga U19 – Endrunde', 'yc_endrunde'],
  ['UEFA Youth League – Gruppenphase', 'yc_uyl_gruppen'], ['UEFA Youth League – K.-o.-Runde', 'yc_uyl_ko'], ['DFB-J', 'yc_pokal'], ['DDR-', 'yc_ddr'], ['Staffel West', 'yc_staffel_west']]) {
  const o = opts.find((t) => t.includes(want));
  if (!o) continue;
  await compSel().selectOption({ label: o });
  await shot(n);
  const runden = page.locator('.cmp-main .dchip:has-text("Runden")');
  if (n.endsWith('endrunde') && await runden.count()) { await runden.first().click(); await shot(`${n}_runden`); }
}
for (const [label, n] of [['Vorlagen', 'stat_vorlagen'], ['Weiße Weste', 'stat_weste']]) {
  const b = page.locator(`.cmp-stats .dchip:has-text("${label}")`);
  if (await b.count()) { await b.first().click(); await shot(n); }
}
const so = await seasonSel().locator('option').allTextContents();
if (so.length > 1) { await seasonSel().selectOption({ index: so.length - 2 }); await shot('yc_vorsaison'); }
// Spielerprofil aus der Bestenliste
const clickable = page.locator('.cmp-stat.clickable').first();
if (await clickable.count()) { await clickable.click(); await page.waitForTimeout(400); await shot('yc_spieler'); }
console.log(errors.length ? errors.join('\n') : 'keine Fehler');
await browser.close();
server.close();
process.exit(errors.length ? 1 : 0);
