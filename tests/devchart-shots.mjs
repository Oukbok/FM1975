// Screenshots Spielerentwicklung (Spielerprofil › Statistiken): Hover mit Alter, Ereignis-Marker
// mit Ursachen-Karte, schraffierte Zeit bei anderen Vereinen.
//   npm run build && SAVE=public/saves/test-20-jahre.txt PLAYERS="Hans-Georg Kinzel,Torben Rehder" node tests/devchart-shots.mjs [ordner]
// Je 1920×1080 und 1366×768 (VIEW=… nur eine Größe). Meldet JS-Fehler, fehlende Marker und Überlauf der Karte.
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const outDir = process.argv[2] || 'test-output/devchart';
await mkdir(outDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.txt': 'text/plain' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { const body = await readFile(join('dist', path)); res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(body); }
  catch { res.writeHead(404).end(); }
}).listen(0);

const raw = await readFile(process.env.SAVE || 'public/saves/test-20-jahre.txt', 'utf8');
const PLAYERS = (process.env.PLAYERS || 'Hans-Georg Kinzel,Torben Rehder').split(',');
const browser = await chromium.launch();
const errors = [];
const VIEWS = process.env.VIEW ? [process.env.VIEW.split('x').map(Number)] : [[1920, 1080], [1366, 768]];
for (const [w, h] of VIEWS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${w}: JS-Fehler: ${e.message}`));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.evaluate((r) => { localStorage.clear(); localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
  await page.reload();
  await page.waitForTimeout(2500);
  await page.waitForTimeout(5000); // Umzug localStorage → IndexedDB (initSaveStore) abwarten
  await page.click('text=Spiel laden', { timeout: 60000 });
  await page.click('.card:has(button:has-text("Löschen")) button:has-text("Laden") >> nth=0', { timeout: 60000 });
  await page.locator('.hd-nav-item').first().waitFor({ timeout: 60000 });
  await page.waitForTimeout(1500);
  for (let i = 0; i < 3 && await page.locator('.bf-continue').count(); i++) { await page.locator('.bf-continue').click(); await page.waitForTimeout(200); }
  for (let i = 0; i < 3 && await page.locator('.bm-close, button:has-text("Budget bestätigen")').count(); i++) { await page.locator('.bm-close, button:has-text("Budget bestätigen")').first().click().catch(() => {}); await page.waitForTimeout(200); }
  for (let i = 0; i < 3; i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(150); }

  for (const name of PLAYERS) {
    const slug = name.split(' ').pop().toLowerCase();
    await page.locator('.hd-nav-item:has-text("Kader")').first().click(); await page.waitForTimeout(300);
    await page.locator('.tn-sub-item:has-text("Kader")').first().click(); await page.waitForTimeout(400);
    const row = page.locator(`.dtable tbody tr:has-text("${name.split(' ').pop()}")`).first();
    if (!await row.count()) { errors.push(`${w}: ${name} nicht im Kader`); continue; }
    await row.click(); await page.waitForTimeout(500);
    await page.locator('.pp-modal .pp-tabs button:has-text("Statistik")').first().click(); await page.waitForTimeout(300);
    const chart = page.locator('.pp-modal .pp3-chart');
    for (const r of ['1 J.', 'Max']) {
      const b = chart.locator(`.rseg button:has-text("${r}")`).first();
      if (await b.count() && !(await b.isDisabled())) { await b.click(); await page.waitForTimeout(250); }
      const tag = r === 'Max' ? 'max' : '1j';
      const plot = chart.locator('.pp3-chart-plot');
      const pb = await plot.boundingBox();
      await page.mouse.move(pb.x + pb.width * 0.35, pb.y + pb.height * 0.5); await page.waitForTimeout(200);
      await page.screenshot({ path: `${outDir}/${slug}_${tag}_linie_${w}.png` });
      const n = await chart.locator('.pp3-ev').count();
      const away = await chart.locator('.pp3-away').count();
      console.log(`${w} ${name} ${r}: ${n} Marker, ${away} fremde Abschnitte, Hover: ${(await chart.locator('.pp3-tip').innerText().catch(() => '–')).replace(/\n/g, ' | ')}`);
      if (n) {
        // größter Sprung: Marker mit der längsten Karte – hier einfach der letzte
        const m = chart.locator('.pp3-ev').nth(n - 1);
        await m.hover(); await page.waitForTimeout(250);
        await page.screenshot({ path: `${outDir}/${slug}_${tag}_marker_${w}.png` });
        await m.click(); await page.waitForTimeout(200);
        const cb = await page.locator('.pp3-evcard').boundingBox();
        const mb = { x: 0, y: 0, width: w, height: h };
        if (cb && mb && (cb.x < mb.x || cb.y < mb.y || cb.x + cb.width > mb.x + mb.width || cb.y + cb.height > mb.y + mb.height)) errors.push(`${w} ${name} ${r}: Karte ragt aus dem Bild`);
        console.log('   Karte:', (await page.locator('.pp3-evcard').innerText()).replace(/\n/g, ' | ').slice(0, 400));
        await page.keyboard.press('Escape'); await page.waitForTimeout(150); // schließt nur die angeheftete Karte
        if (await page.locator('.pp3-evcard.pinned').count()) errors.push(`${w} ${name} ${r}: Esc schließt die Karte nicht`);
        if (!await page.locator('.pp-modal').count()) errors.push(`${w} ${name} ${r}: Esc hat das Profil geschlossen`);
        await page.mouse.move(5, 5);
      }
      if (away) {
        await chart.locator('.pp3-away-lbl .info-tip, .pp3-away-lbl button').first().hover().catch(() => {}); await page.waitForTimeout(400);
        await page.screenshot({ path: `${outDir}/${slug}_${tag}_fremd_${w}.png` });
      }
    }
    await page.mouse.move(5, 5);
    for (let i = 0; i < 4 && await page.locator('.modal-overlay').count(); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(300); }
  }
  await ctx.close();
}
console.log(errors.length ? errors.join('\n') : 'Spielerentwicklung ohne Fehler');
server.close();
await browser.close();
