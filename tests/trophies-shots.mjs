// Screenshots Verein › Erfolge (Vereinspokale + Ruhmeshalle) und Vereinsprofil › Erfolge.
//   npm run build && node tests/trophies-shots.mjs [ordner] [präfix]
//   Standard-Spielstand: Vorlage „Test 3 Jahre“; späterer mit SAVE=… (z. B. aus
//   `CLUB=muc DUMP=… node scripts/sim.mjs 20`). VIEW=1366x768 für kleine Bildschirme.
//   PROFILE=<Vereinsname> öffnet zusätzlich das Profil dieses Vereins (Standard: Spitzenreiter-Profil über die Tabelle).
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const outDir = process.argv[2] || 'test-output/trophies';
const prefix = process.argv[3] || 'tro';
await mkdir(outDir, { recursive: true });
const [vw, vh] = (process.env.VIEW || '1920x1080').split('x').map(Number);
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
const raw = await readFile(process.env.SAVE || 'public/saves/test-3-jahre.txt', 'utf8');
await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
await page.reload();
await page.click('text=Spiel laden');
await page.click('button:has-text("Laden") >> nth=0');
await page.waitForTimeout(1500);
for (let i = 0; i < 4 && await page.locator('.bf-continue').count(); i++) { await page.locator('.bf-continue').click(); await page.waitForTimeout(200); }
for (let i = 0; i < 3 && await page.locator('.modal-close').count(); i++) { await page.locator('.modal-close').first().click().catch(() => {}); await page.waitForTimeout(150); }

const shot = async (n) => {
  await page.waitForTimeout(700);
  const scroll = await page.evaluate(() => { const m = document.querySelector('.app-main'); return m ? m.scrollHeight - m.clientHeight : 0; });
  if (scroll > 2) errors.push(`${n}: Seite scrollt (${scroll}px)`);
  await page.screenshot({ path: `${outDir}/${prefix}_${vw}_${n}.png` });
};

await page.locator('.hd-nav-item:has-text("Verein")').first().click();
await page.waitForTimeout(250);
await page.locator('.tn-sub-item:has-text("Erfolge")').first().click();
await page.waitForSelector('.tro-cab');
await shot('pokale');
const cats = await page.locator('.tro-cat').count();
for (let i = 0; i < cats; i++) {
  const c = page.locator('.tro-cat').nth(i);
  const label = (await c.innerText()).trim().split(/\s+/)[0].toLowerCase();
  await c.click();
  const rows = await page.locator('.tro-row').count();
  if (rows > 1) await page.locator('.tro-row').nth(1).click();
  await shot(`kat_${label}`);
}
// Alle gezeichneten Formen einmal (Seite mit allen Trophäen-Arten über das DOM tauschen geht nicht – daher je Kategorie)
await page.locator('.tro-tabs .tab:has-text("Ruhmeshalle")').click();
await shot('ruhmeshalle');
await page.locator('.tro-tabs .tab:has-text("Vereinspokale")').click();

// Vereinsprofil eines anderen Vereins (Rekordmeister aus der Ruhmeshalle bzw. Tabellenführer)
await page.locator('.hd-nav-item:has-text("Statistiken")').first().click();
await page.waitForTimeout(250);
await page.locator('.tn-sub-item:has-text("Liga")').first().click();
await page.waitForTimeout(500);
const link = page.locator('.club-link').first();
if (await link.count()) {
  await link.click();
  await page.waitForSelector('.cmx-modal');
  await page.locator('.cmx-tabs .tab:has-text("Erfolge")').click();
  await page.waitForSelector('.cmx-modal .tro-cab');
  await shot('profil');
} else errors.push('Kein Vereinslink auf Statistiken › Liga gefunden');

await browser.close(); server.close();
console.log(errors.length ? errors.join('\n') : 'OK – keine Fehler');
process.exit(errors.length ? 1 : 0);
