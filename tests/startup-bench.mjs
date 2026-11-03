// Ladezeit-Messung (Code-Splitting): Zeit bis zum Hauptmenü und bis zum laufenden Spiel
// (Vorlage „Test 3 Jahre“), dazu übertragene JS-Bytes beim Start.
//   npm run build && node tests/startup-bench.mjs [läufe=5]
//   THROTTLE=4 → CPU-Drosselung (schwacher Rechner), Standard 1
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const runs = Number(process.argv[2] ?? 5);
const throttle = Number(process.env.THROTTLE ?? 1);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.txt': 'text/plain', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(join('dist', path))); }
  catch { res.writeHead(404).end(); }
}).listen(0);
const url = `http://127.0.0.1:${server.address().port}/`;
const raw = await readFile('public/saves/test-3-jahre.txt', 'utf8');

const browser = await chromium.launch();
const menu = [], game = [], jsBytes = [];
for (let i = 0; i < runs; i++) {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await ctx.newPage();
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const cdp = await ctx.newCDPSession(page);
  if (throttle > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
  let bytes = 0;
  page.on('response', async (r) => { if (r.url().endsWith('.js')) { try { bytes += (await r.body()).length; } catch { /* */ } } });
  // Spielstand vorab hinterlegen (gleicher Ursprung).
  await page.goto(url + 'saves/index.json');
  await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
  const t0 = Date.now();
  await page.goto(url);
  await page.waitForSelector('.st-btn.primary', { state: 'visible' });
  menu.push(Date.now() - t0);
  const startBytes = bytes;
  await page.click('text=Spiel laden');
  const t1 = Date.now();
  await page.click('button:has-text("Laden") >> nth=0');
  await page.waitForSelector('.hd-bar', { state: 'visible', timeout: 30000 });
  game.push(Date.now() - t1);
  jsBytes.push(startBytes);
  await ctx.close();
}
await browser.close();
server.close();
const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
console.log(`Läufe ${runs}, CPU-Drosselung ${throttle}x`);
console.log(`Hauptmenü sichtbar:   Median ${med(menu)} ms  (${menu.join(', ')})`);
console.log(`Spiel geladen (Shell): Median ${med(game)} ms  (${game.join(', ')})`);
console.log(`JS beim Start: ${(med(jsBytes) / 1024).toFixed(0)} KiB`);
