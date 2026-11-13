// Screenshots aller Seiten mit Tabellen/Listen (Listenstil „Paarungen“, 28-rows.css).
//   npm run build && node tests/rows-shots.mjs [ordner]
//   Standard-Spielstand: Vorlage „Test 3 Jahre“ (public/saves/test-3-jahre.txt); anderer mit SAVE=…
// Meldet Seiten, die scrollen, und JS-Fehler.
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const outDir = process.argv[2] || 'test-output/rows';
await mkdir(outDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.txt': 'text/plain' };
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
  await page.waitForTimeout(300);
  const scroll = await page.evaluate(() => { const m = document.querySelector('.app-main'); return m ? m.scrollHeight - m.clientHeight : 0; });
  if (scroll > 2) errors.push(`${n}: Seite scrollt (${scroll}px)`);
  await page.screenshot({ path: `${outDir}/${n}.png` });
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
  ['Zentrale', null, 'zentrale'], ['Zentrale', 'Nachrichten', 'nachrichten'],
  ['Aufstellung', 'Gegner', 'gegner'], ['Aufstellung', 'Aufstellung', 'aufstellung'], ['Aufstellung', 'Spielplan', 'spielplan'],
  ['Kader', null, 'kader'], ['Kader', 'Übersicht', 'kader_uebersicht'], ['Kader', 'Verträge', 'vertraege'], ['Kader', 'Kabine', 'kabine'],
  ['Training', 'Trainerteam', 'trainerteam'],
  ['Jugend', null, 'jugend'], ['Jugend', 'Mannschaften', 'jugend_mannschaften'], ['Jugend', 'Jugendwettbewerbe', 'jugendwettbewerbe'],
  ['Transfers', null, 'transfers'], ['Transfers', 'Transfermarkt', 'transfermarkt'], ['Transfers', 'Beobachtung', 'beobachtung'],
  ['Verein', 'Ruhmeshalle', 'ruhmeshalle'], ['Verein', 'Mitarbeiter', 'mitarbeiter'],
  ['Statistiken', null, 'statistiken'], ['Statistiken', 'Liga', 'liga'], ['Statistiken', 'Pokal', 'pokal'],
  ['Statistiken', 'International', 'international'], ['Statistiken', 'Halle', 'halle'],
];
for (const [m, s, n] of PAGES) {
  try { await nav(m, s); await shot(n); } catch (e) { errors.push(`${n}: ${e.message.split('\n')[0]}`); }
}
// Pokal: Rundenansicht
try {
  await nav('Statistiken', 'Pokal');
  const b = page.locator('.cmp-main .cmp-chips button:has-text("Runden")');
  if (await b.count()) { await b.first().click(); await shot('pokal_runden'); }
} catch (e) { errors.push('pokal_runden: ' + e.message.split('\n')[0]); }
// Vereinsprofil (Kader + Historie) aus der Tabelle
try {
  await nav('Statistiken', 'Liga');
  await page.locator('.dtable tbody tr.clickable, .dtable tbody tr .club-link').nth(2).click();
  await page.waitForTimeout(500);
  if (await page.locator('.cmx-modal').count()) {
    await shot('verein_profil');
    for (const t of ['Kader', 'Historie']) {
      const tab = page.locator(`.cmx-modal button:has-text("${t}")`);
      if (await tab.count()) { await tab.first().click(); await shot(`verein_${t.toLowerCase()}`); }
    }
    await page.keyboard.press('Escape');
  }
} catch (e) { errors.push('verein: ' + e.message.split('\n')[0]); }
// Spielerprofil Statistik
try {
  await nav('Kader', 'Übersicht');
  await page.locator('.dtable tbody tr').first().click();
  await page.waitForTimeout(500);
  for (const t of ['Saison', 'Entwicklung']) {
    const tab = page.locator(`.pp-tabs button:has-text("${t}"), .modal button:has-text("${t}")`);
    if (await tab.count()) { await tab.first().click(); await shot(`spieler_${t.toLowerCase()}`); }
  }
} catch (e) { errors.push('spieler: ' + e.message.split('\n')[0]); }

console.log(errors.length ? errors.join('\n') : 'ok – keine Fehler');
await browser.close(); server.close();
