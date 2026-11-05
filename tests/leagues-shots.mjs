// Screenshots der Wettbewerbs-Seiten (Statistiken › Liga / Pokal / International):
// Liga 1975/76, Formtabelle, Saisonwahl 1968/69 (Historie), DDR-Oberliga, 2. Liga,
// Landespokal als Baum und Rundenliste, Europapokal, Historie-Pokal 1969/70.
//   npm run build && node tests/leagues-shots.mjs [ordner]
//   Mit Spielstand (Saison läuft, Bestenlisten gefüllt):
//     DUMP=test-output/leagues/save76.txt UNTIL=1976-04-10 node scripts/sim.mjs 0
//     SAVE=test-output/leagues/save76.txt node tests/leagues-shots.mjs test-output/leagues 76
//   Späte Epoche: DUMP=… UNTIL=1996-04-10 node scripts/sim.mjs 20, dann SAVE=… … 96
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { startNewGame } from './newgame-flow.mjs';
import { pickOption, optionsOf } from './select3.mjs';

const outDir = process.argv[2] || 'test-output/leagues';
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

async function go(label) {
  await page.locator('.hd-nav-item:has-text("Statistiken")').first().click();
  await page.locator(`.tn-sub-item:has-text("${label}")`).first().click();
  await page.waitForTimeout(400);
}
// Kopf: Land | Saison | Wettbewerb (Länderwahl: competition/CountryParts.tsx)
const countrySel = () => page.locator('.cmp-select .sel3').nth(0);
const seasonSel = () => page.locator('.cmp-select .sel3').nth(1);
const compSel = () => page.locator('.cmp-select .sel3').nth(2);

await go('Liga');
await shot('liga');
for (const [label, n] of [['Heim', 'liga_heim'], ['Form', 'liga_form']]) {
  const b = page.locator(`.cmp-main .cmp-chips button:has-text("${label}")`);
  if (await b.count()) { await b.first().click(); await shot(n); }
}
// Statistik-Reiter
for (const [label, n] of [['Vorlagen', 'stat_vorlagen'], ['Rot', 'stat_rot'], ['Weiße Weste', 'stat_weste']]) {
  const b = page.locator(`.cmp-stats .dchip:has-text("${label}")`);
  if (await b.count()) { await b.first().click(); await shot(n); }
}
// Weitere Ligen der laufenden Saison
const opts = (await optionsOf(page, compSel())).map((o) => o.label);
for (const want of ['2. Liga Nord', 'Regionalliga Nord', '3. Liga']) {
  const o = opts.find((t) => t.startsWith(want));
  if (o) { await pickOption(page, compSel(), { label: o }); await shot(`liga_${want.replace(/\W+/g, '_')}`); }
}
// Historie
await pickOption(page, seasonSel(), '1968/69');
await pickOption(page, compSel(), 'tier1');
await shot('hist_1968_liga');
await pickOption(page, countrySel(), 'gdr');
await pickOption(page, compSel(), 'ddr-oberliga');
await shot('hist_1968_ddr');
await pickOption(page, countrySel(), 'ger');
await pickOption(page, seasonSel(), '1974/75');
await pickOption(page, compSel(), 'tier2-sued');
await shot('hist_1974_2liga_sued');
await pickOption(page, seasonSel(), '1969/70');
await pickOption(page, compSel(), 'cup');
await shot('hist_1969_pokal');

// Pokal laufend
await go('Pokal');
await shot('pokal_baum');
const runden = page.locator('.cmp-main .cmp-chips button:has-text("Runden")');
if (await runden.count()) { await runden.first().click(); await shot('pokal_runden'); }
const firstRound = page.locator('.cmp-toolbar .cmp-chips').nth(1).locator('button').first();
if (await firstRound.count()) { await firstRound.click(); await shot('pokal_runde1'); }

await go('International');
await shot('international');
const euroOpts = (await optionsOf(page, compSel())).map((o) => o.label);
const uefa = euroOpts.find((t) => t.startsWith('Europa-Pokal'));
if (uefa) { await pickOption(page, compSel(), { label: uefa }); await shot('international_uefa'); }
// Archiv-Saison (falls vorhanden): vorletzte Saison
const seasons = (await optionsOf(page, seasonSel())).map((o) => o.label);
const archived = seasons.filter((s) => !/laufend|vor Spielbeginn/.test(s));
if (archived.length) {
  await pickOption(page, seasonSel(), archived[archived.length - 1].slice(0, 7));
  await pickOption(page, compSel(), 'cup');
  await shot('archiv_pokal');
  await pickOption(page, compSel(), 'tier1');
  await shot('archiv_liga');
  // Erster Eintrag der Gruppe „Ausland“ (Gruppenüberschrift in der offenen Liste)
  await compSel().click();
  const auslandOpt = page.locator('.sel3-pop .sel3-group:text-is("Ausland") + [role=option]').first();
  if (await auslandOpt.count()) { await auslandOpt.click(); await shot('archiv_ausland'); } else await page.keyboard.press('Escape');
}

await browser.close();
server.close();
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('Screenshots in', outDir);
