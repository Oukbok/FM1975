// Screenshots beliebiger Seiten aus einem Spielstand + Maße aller DashBoxen.
//   npm run build && SAVE=public/saves/test-30-jahre.txt PAGES="Verein:Verein,Finanzen:Bilanz" node tests/page-shots.mjs [ordner]
//   VIEW=1366x768 (Standard 1920x1080), CLICK="Text|Text" klickt nach dem Öffnen jeder Seite nacheinander (optional)
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const outDir = process.argv[2] || 'test-output/pages';
await mkdir(outDir, { recursive: true });
const [W, H] = (process.env.VIEW || '1920x1080').split('x').map(Number);
const PAGES = (process.env.PAGES || 'Zentrale:Zentrale').split(',').map((x) => x.split(':'));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.txt': 'text/plain' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(join('dist', path))); }
  catch { res.writeHead(404).end(); }
}).listen(0);
const url = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
page.on('pageerror', (e) => errors.push(`JS-Fehler: ${e.message}`));
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
await page.goto(url);
const raw = await readFile(process.env.SAVE || 'public/saves/test-3-jahre.txt', 'utf8');
await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
await page.goto(url);
await page.click('text=Spiel laden');
await page.click('button:has-text("Laden") >> nth=0');
await page.waitForTimeout(1800);
for (let i = 0; i < 4 && await page.locator('.bf-continue').count(); i++) { await page.locator('.bf-continue').click(); await page.waitForTimeout(250); }
for (const [main, sub] of PAGES) {
  await page.locator(`.hd-nav-item:has-text("${main}")`).first().click();
  await page.waitForTimeout(250);
  if (sub && sub !== main) await page.locator(`.tn-sub-item:has-text("${sub}")`).first().click();
  await page.waitForTimeout(500);
  // CLICKSEL=".css-selector|…": nacheinander das erste passende Element klicken.
  for (const c of (process.env.CLICKSEL ? process.env.CLICKSEL.split('|') : [])) {
    await page.locator(c).first().click({ timeout: 3000 }).catch(() => errors.push(`Klick nicht möglich: ${c}`));
    await page.waitForTimeout(500);
  }
  // CLICK="a|b|c": nacheinander je den ersten Knopf/Text klicken (z. B. Aktion + Bestätigung).
  for (const c of (process.env.CLICK ? process.env.CLICK.split('|') : [])) {
    const btn = page.locator('button:visible', { hasText: c }).first();
    const target = (await btn.count()) ? btn : page.getByText(c).first();
    await target.click({ timeout: 3000 }).catch(() => errors.push(`Klick nicht möglich: ${c}`));
    await page.waitForTimeout(350);
  }
  const name = `${main}-${sub || main}`.toLowerCase().replace(/[^a-z0-9äöü-]+/g, '_');
  await page.screenshot({ path: `${outDir}/${name}.png` });
  const boxes = await page.evaluate(() => [...document.querySelectorAll('.dbox')].map((b) => { const r = b.getBoundingClientRect(); return `${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}×${Math.round(r.height)} ${(b.querySelector('.dbox-title, .dbox-head')?.textContent ?? '').trim().slice(0, 30)}`; }));
  console.log(`== ${main} › ${sub}\n  ${boxes.join('\n  ')}`);
}
await browser.close();
server.close();
if (errors.length) { console.log(errors.join('\n')); process.exit(1); }
