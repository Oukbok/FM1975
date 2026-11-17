// Screenshots Statistiken › Ligensystem (Pyramide + „Ligen der Welt“) und Länderwahl.
//   npm run build && SAVE=public/saves/test-3-jahre.txt node tests/ligsys-shots.mjs [ordner] [präfix]
//   LAND=England,Spanien,Italien,Frankreich,DDR – zusätzlich gewählte Länder; VIEW=1366x768.
// Prüft: Länderliste alphabetisch ohne Gruppen, Heimatland vorgewählt, Seite scrollt nicht.
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { startNewGame } from './newgame-flow.mjs';
import { pickOption, optionsOf } from './select3.mjs';

const outDir = process.argv[2] || 'test-output/ligsys';
const prefix = process.argv[3] || 'ls';
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
const shot = async (n) => {
  await page.waitForTimeout(300);
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
} else {
  await startNewGame(page);
}

async function go(label) {
  await page.locator('.hd-nav-item:has-text("Statistiken")').first().click();
  await page.locator(`.tn-sub-item:has-text("${label}")`).first().click();
  await page.waitForTimeout(500);
}

const checkList = (where, list) => {
  const names = list.map((o) => o.label.replace(/\s*\(Archiv\)$/, ''));
  const sorted = [...names].sort((a, b) => a.localeCompare(b, 'de'));
  if (names.join('|') !== sorted.join('|')) errors.push(`${where}: Länder nicht alphabetisch: ${names.join(', ')}`);
  console.log(`${where}: ${list.length} Länder, Archiv: ${list.filter((o) => /\(Archiv\)/.test(o.label)).map((o) => o.label).join(', ') || '–'}`);
};

// --- Ligensystem ---------------------------------------------------------------------------
await go('Ligensystem');
const lpSel = page.locator('.lp-country-sel').first();
console.log('Ligensystem vorgewählt:', (await lpSel.textContent())?.trim());
checkList('Ligensystem', await optionsOf(page, lpSel));
await shot('heim');
for (const land of (process.env.LAND || 'England,Spanien,Italien,Frankreich,DDR').split(',')) {
  try { await pickOption(page, lpSel, { label: land }); await shot(`land_${land}`); } catch (e) { errors.push(String(e)); }
}
// Klick auf eine Zeile „Ligen der Welt“ öffnet Statistiken › Liga
const row = page.locator('.lsv-list .lsv-row').first();
if (await row.count()) {
  const name = (await row.locator('.lsv-name').textContent())?.trim();
  await row.click();
  await page.waitForTimeout(600);
  const now = (await page.locator('.cmp-select .sel3').nth(0).textContent())?.trim();
  console.log(`Klick „${name}“ → Statistiken › Liga mit Land „${now}“`);
  if (!now?.startsWith(name ?? '§')) errors.push(`Klick auf ${name} öffnet ${now}`);
  await shot('klick_liga');
}

// --- Statistiken › Liga: Länderwahl ---------------------------------------------------------
await go('Liga');
const cSel = page.locator('.cmp-select .sel3').nth(0);
console.log('Liga vorgewählt:', (await cSel.textContent())?.trim());
checkList('Liga', await optionsOf(page, cSel));
await cSel.click();
await page.waitForTimeout(200);
await shot('liga_laender');
await page.keyboard.press('Escape');

console.log(errors.length ? errors.join('\n') : 'Keine Fehler.');
await browser.close();
server.close();
process.exit(errors.length ? 1 : 0);
