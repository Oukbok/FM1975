// Screenshots Kartenverkauf (Verein › Kartenverkauf): Seite, Hover auf einer Tribüne,
// gespieltes Spiel mit Prognose gegen Ist, Preiskategorie gesetzt – je Spielstand in
// 1920×1080 und 1366×768. Meldet JS-Fehler und Seiten, die scrollen.
//   npm run build && node tests/tickets-shots.mjs [ordner]
//   Spielstände: SAVES=a.txt,b.txt (Standard: Vorlage „Test 3 Jahre“), z. B. aus
//   CLUB=fra DUMP=… UNTIL=1995-11-01 node scripts/sim.mjs 21
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import { chromium } from 'playwright';

const outDir = process.argv[2] || 'test-output/tickets';
await mkdir(outDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.txt': 'text/plain' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { const body = await readFile(join('dist', path)); res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(body); }
  catch { res.writeHead(404).end(); }
}).listen(0);

const saves = (process.env.SAVES || 'public/saves/test-3-jahre.txt').split(',').filter(Boolean);
const browser = await chromium.launch();
const errors = [];
for (const file of saves) {
  const tag = basename(file).replace(/\.txt$/, '').replace(/^tk_/, '');
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', (e) => errors.push(`${tag}: JS-Fehler: ${e.message}`));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  const raw = await readFile(file, 'utf8');
  await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
  await page.reload();
  await page.click('text=Spiel laden');
  await page.click('button:has-text("Laden") >> nth=0');
  await page.waitForTimeout(1500);
  for (let i = 0; i < 3 && await page.locator('.bf-continue').count(); i++) { await page.locator('.bf-continue').click(); await page.waitForTimeout(200); }
  await page.keyboard.press('Escape').catch(() => {});
  await page.locator('.hd-nav-item:has-text("Verein")').first().click();
  await page.waitForTimeout(250);
  await page.locator('.tn-sub-item:has-text("Kartenverkauf")').first().click();
  await page.waitForTimeout(500);
  const shot = async (n) => {
    await page.waitForTimeout(250);
    const scroll = await page.evaluate(() => { const m = document.querySelector('.app-main'); return m ? m.scrollHeight - m.clientHeight : 0; });
    if (scroll > 2) errors.push(`${tag}/${n}: Seite scrollt (${scroll}px)`);
    await page.screenshot({ path: `${outDir}/${tag}_${n}.png` });
  };
  for (const [w, h] of [[1920, 1080], [1366, 768]]) {
    await page.setViewportSize({ width: w, height: h });
    const v = `${w}`;
    await shot(`${v}_1_seite`);
    // Hover auf der Haupttribüne (erste Tribüne in der Draufsicht)
    const stand = page.locator('.tk-map .tk-stand').first();
    if (await stand.count()) { await stand.hover({ force: true }); await shot(`${v}_2_hover`); await stand.click({ force: true }); }
    // Gespieltes Spiel: Prognose gegen Ist
    const done = page.locator('.tk-gtab tbody tr.done');
    if (await done.count()) { await done.last().click(); await shot(`${v}_3_ist`); }
    // Kommendes Spiel: Preiskategorie auf Top schalten
    const btn = page.locator('.tk-gtab button.tk-cat').first();
    if (await btn.count()) {
      await page.locator('.tk-gtab tbody tr:not(.done) td:first-child').first().click();
      for (let i = 0; i < 4 && !(await btn.innerText()).startsWith('Top'); i++) await btn.click();
      await shot(`${v}_4_top`);
      for (let i = 0; i < 4 && !(await btn.innerText()).toLowerCase().includes('auto'); i++) await btn.click(); // zurück auf automatisch
    }
  }
  if (!(await page.locator('.tk-ptab').count())) errors.push(`${tag}: Preistabelle fehlt`);
  await page.close();
}
await browser.close();
server.close();
console.log(errors.length ? errors.join('\n') : `Screenshots ohne Fehler in ${outDir}`);
process.exit(errors.length ? 1 : 0);
