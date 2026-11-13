// Screenshots „Moderne Knöpfe“: Newscenter, Nachrichten, Kalender, Stadion-Bau, Filter-/Segment-Knöpfe, Zurück/Vorwärts.
//   npm run build && node tests/ui3style-shots.mjs [ordner]
//   Standard-Spielstand: Vorlage „Test 3 Jahre“; anderer mit SAVE=…; VIEW=1366x768 für kleine Auflösung.
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const outDir = process.argv[2] || 'test-output/ui3style';
await mkdir(outDir, { recursive: true });
const [vw, vh] = (process.env.VIEW || '1920x1080').split('x').map(Number);
const pre = process.env.PREFIX || `${vw}_`;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.txt': 'text/plain' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { const buf = await readFile(join('dist', path)); res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(buf); }
  catch { res.writeHead(404).end(); }
}).listen(0);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: vw, height: vh } });
const errors = [];
page.on('pageerror', (e) => errors.push('JS-Fehler: ' + e.message));
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
await page.goto(`http://127.0.0.1:${server.address().port}/`);
const shot = async (n) => {
  await page.waitForTimeout(350);
  const scroll = await page.evaluate(() => { const m = document.querySelector('.app-main'); return m ? m.scrollHeight - m.clientHeight : 0; });
  if (scroll > 2) errors.push(`${n}: Seite scrollt (${scroll}px)`);
  await page.screenshot({ path: `${outDir}/${pre}${n}.png` });
};

const raw = await readFile(process.env.SAVE || 'public/saves/test-3-jahre.txt', 'utf8');
await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
await page.reload();
await page.click('text=Spiel laden');
await page.click('button:has-text("Laden") >> nth=0');
await page.waitForTimeout(1500);
for (let i = 0; i < 3 && await page.locator('.bf-continue').count(); i++) { await page.locator('.bf-continue').click(); await page.waitForTimeout(200); }

const nav = async (main, sub) => {
  await page.locator(`.hd-nav-item:has-text("${main}")`).first().click();
  await page.waitForTimeout(250);
  if (sub) { await page.locator(`.tn-sub-item:has-text("${sub}")`).first().click(); await page.waitForTimeout(350); }
};
const PAGES = [
  ['Zentrale', null, 'zentrale'], ['Zentrale', 'Nachrichten', 'nachrichten'], ['Zentrale', 'Kalender', 'kalender'],
  ['Zentrale', 'Presse', 'presse'], ['Aufstellung', 'Aufstellung', 'aufstellung'], ['Aufstellung', 'Taktik', 'taktik'],
  ['Kader', 'Übersicht', 'kader'], ['Kader', 'Kabine', 'kabine'], ['Training', 'Trainingsplan', 'training'],
  ['Transfers', 'Transfermarkt', 'transfermarkt'], ['Finanzen', 'Bilanz', 'bilanz'], ['Finanzen', 'Fanartikel', 'fanartikel'],
  ['Verein', 'Vereinsgelände', 'gelaende'], ['Verein', 'Stadion', 'stadion'], ['Verein', 'Kartenverkauf', 'karten'],
  ['Statistiken', 'Liga', 'liga'], ['Statistiken', 'Pokal', 'pokal'],
];
for (const [m, s, n] of PAGES) {
  try { await nav(m, s); await shot(n); } catch (e) { errors.push(`${n}: ${e.message.split('\n')[0]}`); }
}
// Auswahlliste (ui/Select) geöffnet: Statistiken › Liga, Saison
try {
  await nav('Statistiken', 'Liga');
  await page.locator('.cmp-select .sel3').nth(2).click(); await shot('liga_auswahl_offen');
  await page.keyboard.press('Escape');
} catch (e) { errors.push('liga_auswahl: ' + e.message.split('\n')[0]); }
// Stadion: Bau-Popover eines Blocks
try {
  await nav('Verein', 'Stadion');
  const blk = page.locator('.gr-svg g.gr-obj:not(.sv-venue)');
  const nb = await blk.count();
  if (nb) { await blk.nth(nb - 1).click({ force: true }); await shot('stadion_bau'); }
} catch (e) { errors.push('stadion_bau: ' + e.message.split('\n')[0]); }
// Nachrichten mit Entscheidung (erste Nachricht mit Auswahl öffnen)
try {
  await nav('Zentrale', null);
  const choice = page.locator('.dz-nh-act');
  if (await choice.count()) await shot('zentrale_entscheidung');
} catch (e) { errors.push('entscheidung: ' + e.message.split('\n')[0]); }
// Zurück/Vorwärts in der Kopfzeile
try {
  await nav('Kader', 'Übersicht'); await nav('Finanzen', 'Bilanz');
  await page.locator('.tn-back').first().click(); await page.waitForTimeout(300);
  await shot('zurueck_vorwaerts');
  await page.screenshot({ path: `${outDir}/${pre}kopf_ausschnitt.png`, clip: { x: 0, y: 0, width: Math.min(vw, 900), height: 170 } });
} catch (e) { errors.push('zurueck: ' + e.message.split('\n')[0]); }

console.log(errors.length ? errors.join('\n') : 'ok – keine Fehler');
await browser.close();
server.close();
