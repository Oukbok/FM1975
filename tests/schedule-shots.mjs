// Screenshots Spielplan & Termine (Nachholspiele/Verlegungen, Kalender, Presse, Wiki):
//   npm run build && node tests/schedule-shots.mjs [ordner]
//   SAVE=… (z. B. TESTSAVE=1 DUMP=test-output/schedule/sch_1976.txt UNTIL=1976-02-12 node scripts/sim.mjs 0)
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const outDir = process.argv[2] || 'test-output/schedule';
await mkdir(outDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.txt': 'text/plain', '.webp': 'image/webp' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(join('dist', path))); }
  catch { res.writeHead(404).end(); }
}).listen(0);
const browser = await chromium.launch();
const errors = [];
const raw = await readFile(process.env.SAVE || 'test-output/schedule/sch_1976.txt', 'utf8');
for (const [w, h] of [[1920, 1080], [1366, 768]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  page.on('pageerror', (e) => errors.push('JS-Fehler: ' + e.message));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
  await page.reload();
  await page.click('text=Spiel laden');
  await page.click('button:has-text("Laden") >> nth=0');
  await page.waitForTimeout(1500);
  // Offene Fenster aus der Simulation schließen (Gala, Briefing, Bewertungsrunde …).
  for (let i = 0; i < 3; i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(300); }
  for (let i = 0; i < 6; i++) {
    const b = page.locator('button:has-text("Überspringen"), .bf-continue, button:has-text("Schließen"), button:has-text("OK"), button:not(.hd-continue):text-is("Weiter")').first();
    if (!await b.count()) break;
    await b.click({ timeout: 2000 }).catch(() => {}); await page.waitForTimeout(400);
  }
  await page.screenshot({ path: `${outDir}/start_${w}.png` });
  const nav = async (main, sub) => {
    await page.locator(`.hd-nav-item:has-text("${main}")`).first().click();
    await page.waitForTimeout(250);
    if (sub) { await page.locator(`.tn-sub-item:has-text("${sub}")`).first().click(); await page.waitForTimeout(400); }
  };
  const shot = async (n) => { await page.waitForTimeout(300); await page.screenshot({ path: `${outDir}/${n}_${w}.png` }); };
  for (const [m, s, n] of [['Spieltag', 'Spielplan', 'spielplan'], ['Zentrale', 'Kalender', 'kalender'], ['Zentrale', 'Presse', 'presse'], ['Zentrale', 'Nachrichten', 'nachrichten']]) {
    try { await nav(m, s); await shot(n); } catch (e) { errors.push(`${n}: ${e.message.split('\n')[0]}`); }
  }
  // i-Hilfe am Spielplan
  try {
    await nav('Spieltag', 'Spielplan');
    const tip = page.locator('.info-tip, .itip, [data-info]').first();
    if (await tip.count()) { await tip.hover(); await shot('spielplan_info'); }
  } catch (e) { errors.push('info: ' + e.message.split('\n')[0]); }
  await page.close();
}
await browser.close();
server.close();
if (errors.length) { console.log(errors.join('\n')); process.exit(1); }
console.log('Screenshots in', outDir);
