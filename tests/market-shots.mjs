// Screenshots Transfers › Transfermarkt + Beobachtung (Spielertabelle nach EA-Vorbild, Wunsch Pascal).
//   npm run build && node tests/market-shots.mjs [ordner]   (SAVE=…, VIEW=1366x768)
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const outDir = process.argv[2] || 'test-output/market';
await mkdir(outDir, { recursive: true });
const [vw, vh] = (process.env.VIEW || '1920x1080').split('x').map(Number);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.txt': 'text/plain', '.wav': 'audio/wav' };
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
for (let i = 0; i < 3 && await page.locator('.bf-continue').count(); i++) { await page.locator('.bf-continue').click(); await page.waitForTimeout(200); }
const nav = async (main, sub) => {
  await page.locator(`.hd-nav-item:has-text("${main}")`).first().click();
  await page.waitForTimeout(250);
  if (sub) { await page.locator(`.tn-sub-item:has-text("${sub}")`).first().click(); await page.waitForTimeout(500); }
};
await nav('Transfers', 'Transfermarkt');
await page.screenshot({ path: `${outDir}/transfermarkt.png` });
const star = page.locator('.mk-stars').nth(3);
if (await star.count()) { await star.hover(); await page.waitForTimeout(250); await page.screenshot({ path: `${outDir}/transfermarkt_hover.png` }); }
const kn = page.locator('.mk-know').nth(2);
if (await kn.count()) { await kn.hover(); await page.waitForTimeout(250); await page.screenshot({ path: `${outDir}/transfermarkt_kenntnis.png` }); }
const tg = page.locator('.mk-only');
if (await tg.count()) { await tg.click(); await page.waitForTimeout(300); await page.screenshot({ path: `${outDir}/transfermarkt_gescoutet.png` }); }
await nav('Transfers', 'Beobachtung');
await page.screenshot({ path: `${outDir}/beobachtung.png` });
console.log(errors.length ? errors.join('\n') : 'Keine JS-Fehler.');
await browser.close(); server.close();
