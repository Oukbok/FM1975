// Screenshots aller Seiten mit Tabellen/Listen (Listenstil „Paarungen“, 28-rows.css).
//   npm run build && node tests/rows-shots.mjs [ordner]
//   Standard-Spielstand: Vorlage „Test 3 Jahre“ (public/saves/test-3-jahre.txt); anderer mit SAVE=…
// Meldet Seiten, die scrollen, und JS-Fehler.
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const outDir = process.argv[2] || 'test-output/ctxmenu';
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
// Rechtsklick-Menü für Spieler + farbige Startelf/Bank (Kader-Übersicht, Aufstellung)
const errs2 = [];
page.on('pageerror', (e) => errs2.push(e.message));
await nav('Kader', 'Übersicht');
await page.locator('.app-main tbody tr[data-pid]').nth(3).click({ button: 'right' });
await page.waitForTimeout(300);
await shot('kader_rechtsklick');
await page.keyboard.press('Escape'); await page.mouse.click(5, 5); await page.waitForTimeout(200);
await page.locator('.app-main tbody tr[data-pid]').nth(3).click({ button: 'right' });
await page.locator('.pcm-item:has-text("Vertrag")').click(); await page.waitForTimeout(500);
await shot('kader_vertrag');
await page.locator('.pp2-close').click(); await page.waitForTimeout(200);
await nav('Aufstellung', 'Aufstellung');
await shot('aufstellung');
await page.locator('.lu-row[data-pid]').nth(2).click({ button: 'right' }); await page.waitForTimeout(300);
await shot('aufstellung_rechtsklick');
await page.mouse.click(5, 5);
// fremder Spieler: Vereinsprofil → Kader
await nav('Statistiken', 'Liga');
await page.locator('.dtable tbody tr .club-link').nth(1).click(); await page.waitForTimeout(500);
const tab = page.locator('.cmx-tabs .tab:has-text("Kader"), .tabs .tab:has-text("Kader")').first();
if (await tab.count()) { await tab.click(); await page.waitForTimeout(400); }
const fr = page.locator('.modal-overlay [data-pid]').nth(4);
if (await fr.count()) { await fr.click({ button: 'right' }); await page.waitForTimeout(300); await shot('fremd_rechtsklick'); }
console.log(errs2.length ? 'JS-Fehler: ' + errs2.join(' | ') : 'Keine JS-Fehler.');
await browser.close(); server.close();
