// Screenshots Kalender Dezember/Januar (Winterpause + Hallenturniere), 1920×1080.
//   npm run build && node tests/winterhalle-shots.mjs [ordner] [präfix]   (SAVE=…, Standard Vorlage „Test 3 Jahre“)
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const outDir = process.argv[2] || 'test-output/winterhalle';
const prefix = process.argv[3] || 'kal';
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
const raw = await readFile(process.env.SAVE || 'public/saves/test-3-jahre.txt', 'utf8');
const [w, h] = (process.env.VIEW || '1920x1080').split('x').map(Number);
const page = await browser.newPage({ viewport: { width: w, height: h } });
page.on('pageerror', (e) => errors.push('JS-Fehler: ' + e.message));
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
await page.goto(`http://127.0.0.1:${server.address().port}/`);
await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
await page.reload();
await page.click('text=Spiel laden');
await page.click('button:has-text("Laden") >> nth=0');
await page.waitForTimeout(1500);
for (let i = 0; i < 3; i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(300); }
for (let i = 0; i < 6; i++) {
  const b = page.locator('button:has-text("Überspringen"), .bf-continue, button:has-text("Schließen"), button:has-text("OK"), button:not(.hd-continue):text-is("Weiter")').first();
  if (!await b.count()) break;
  await b.click({ timeout: 2000 }).catch(() => {}); await page.waitForTimeout(400);
}
try {
  await page.locator('.hd-nav-item:has-text("Zentrale")').first().click();
  await page.waitForTimeout(250);
  await page.locator('.tn-sub-item:has-text("Kalender")').first().click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${outDir}/${prefix}_dez_${w}.png` });
  await page.locator('button:has-text("Folgemonat")').first().click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${outDir}/${prefix}_jan_${w}.png` });
  await page.locator('.hd-nav-item:has-text("Zentrale")').first().click();
  await page.waitForTimeout(250);
  await page.locator('.tn-sub-item:has-text("Nachrichten"), .tn-sub-item:has-text("Zentrale")').first().click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${outDir}/${prefix}_zentrale_${w}.png` });
} catch (e) { errors.push(e.message.split('\n')[0]); }
await browser.close();
server.close();
if (errors.length) { console.log(errors.join('\n')); process.exit(1); }
console.log('Screenshots in', outDir);
