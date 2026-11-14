// Screenshots der Mitarbeiter-Seiten (Training › Trainerteam, Verein › Mitarbeiter): Stellenplan, Wirkung,
// Arbeitsmarkt mit Filter, Profil einer Person, Verhandlungsfenster – und Prüfung: Seite scrollt nicht.
//   node tests/staff-shots.mjs [ausgabeordner] [präfix]   (SAVE=… lädt einen Spielstand; VIEW=1366x768)
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { startNewGame } from './newgame-flow.mjs';
import { pickOption } from './select3.mjs';

const outDir = process.argv[2] || 'test-output/staff';
const tag = process.argv[3] || (process.env.SAVE ? 'late' : 'new');
await mkdir(outDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(join('dist', path))); }
  catch { res.writeHead(404).end(); }
}).listen(0);
const browser = await chromium.launch();
const [vw, vh] = (process.env.VIEW || '1920x1080').split('x').map(Number);
const page = await browser.newPage({ viewport: { width: vw, height: vh } });
const errors = [];
page.on('pageerror', (e) => errors.push('JS-Fehler: ' + e.message));
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
await page.goto(`http://127.0.0.1:${server.address().port}/`);
if (process.env.SAVE) {
  const raw = await readFile(process.env.SAVE, 'utf8');
  await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
  await page.reload();
  await page.click('text=Spiel laden');
  await page.click('button:has-text("Laden") >> nth=0');
  await page.waitForTimeout(1800);
  for (let i = 0; i < 3 && await page.locator('.bf-continue').count(); i++) { await page.locator('.bf-continue').click(); await page.waitForTimeout(200); }
  for (let k = 0; k < 8; k++) {
    if (await page.locator('.gb-root').count()) { await page.keyboard.press('Escape'); await page.waitForTimeout(300); continue; }
    const x = page.locator('.modal-overlay .modal-close, .modal-overlay button:has-text("Schließen"), .modal-overlay button:has-text("OK")').first();
    if (await page.locator('.modal-overlay').count() && await x.isVisible().catch(() => false)) { await x.click().catch(() => {}); await page.waitForTimeout(300); continue; }
    break;
  }
} else { await startNewGame(page); await page.waitForTimeout(800); }

const shot = (name) => page.screenshot({ path: `${outDir}/${tag}_${name}.png` });
const noScroll = async (name) => {
  const s = await page.evaluate(() => { const m = document.querySelector('.app-main'); return m ? m.scrollHeight - m.clientHeight : 0; });
  if (s > 2) errors.push(`${name} scrollt (${s}px)`);
};

// ---- Training › Trainerteam ----
await page.locator('.hd-nav-item:has-text("Training")').first().click();
await page.locator('.tn-sub-item:has-text("Trainerteam")').first().click();
await page.waitForTimeout(600);
await shot('1_team'); await noScroll('Trainerteam');
if (!(await page.locator('.sf-slot').count())) errors.push('Stellenplan leer');
if (!(await page.locator('.sf-table tbody tr').count())) errors.push('Arbeitsmarkt leer');
// Wirkung
await page.locator('.sf-headr button:has-text("Wirkung")').click();
await page.waitForTimeout(300);
await shot('2_wirkung');
await page.locator('.sf-headr button:has-text("Stellen")').click();
// Eigene Person wählen
await page.locator('.sf-slot:not(.vacant)').first().click();
await page.waitForTimeout(300);
await shot('3_eigener');
// Arbeitsmarkt: Stelle Co-Trainer, Fähigkeit Taktik ab 70, Person wählen
await pickOption(page, page.locator('.sf-filters .sel3').nth(0), 'cotrainer');
await page.waitForTimeout(200);
await pickOption(page, page.locator('.sf-filters .sel3').nth(1), 'taktik');
await page.waitForTimeout(300);
await shot('4_filter');
await pickOption(page, page.locator('.sf-filters .sel3').nth(1), { label: 'egal' });
await page.locator('.sf-table tbody tr').first().click();
await page.waitForTimeout(300);
await shot('5_profil'); await noScroll('Trainerteam mit Profil');
// Verhandlung
await page.locator('.sf-prof-btns button:has-text("Verhandeln")').click();
await page.waitForTimeout(400);
await shot('6_verhandlung');
const box = await page.locator('.sf-hire').boundingBox();
await page.locator('.sf-hire input[type=range]').fill('70');
await page.locator('.sf-hire-btns button:has-text("Angebot machen")').click();
await page.waitForTimeout(300);
const box2 = await page.locator('.sf-hire').boundingBox();
if (box && box2 && (Math.abs(box.width - box2.width) > 1 || Math.abs(box.height - box2.height) > 1)) errors.push(`Verhandlungsfenster ändert die Größe: ${JSON.stringify(box)} → ${JSON.stringify(box2)}`);
await shot('7_absage');
await page.locator('.sf-hire input[type=range]').fill('105');
await page.locator('.sf-hire-btns button:has-text("Angebot machen")').click();
await page.waitForTimeout(500);
if (await page.locator('.sf-hire').count()) errors.push('Anstellung zum vollen Angebot hat nicht geklappt');
await shot('8_eingestellt');

// ---- Verein › Mitarbeiter ----
await page.locator('.hd-nav-item:has-text("Verein")').first().click();
await page.locator('.tn-sub-item:has-text("Mitarbeiter")').first().click();
await page.waitForTimeout(600);
await shot('9_verein'); await noScroll('Mitarbeiter');
await page.locator('.sf-slot.vacant button:has-text("Suchen")').first().click();
await page.waitForTimeout(300);
await page.locator('.sf-table tbody tr').first().click();
await page.waitForTimeout(300);
await shot('10_verein_suche');
await page.locator('.sf-headr button:has-text("Wirkung")').click();
await page.waitForTimeout(300);
await shot('11_verein_wirkung');

console.log(errors.length ? errors.join('\n') : 'Mitarbeiter-Seiten: keine Fehler');
await browser.close(); server.close();
process.exit(errors.length ? 1 : 0);
