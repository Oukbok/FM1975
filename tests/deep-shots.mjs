// Screenshots Assistent mit den tieferen Auslandsligen (Wunsch Pascal): Ligaliste, Vereinsliste der 4. Ebene,
// Ligensystem vor dem Start. Voraussetzung: npm run build.  node tests/deep-shots.mjs [ordner] (LAND=eng JAHR=1995 EBENE=4)
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const out = process.argv[2] || 'test-output/deep';
const cc = process.env.LAND || 'eng', year = process.env.JAHR || '1995', tier = process.env.EBENE || '4';
await mkdir(out, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[extname(p)] || 'application/octet-stream' }).end(await readFile(join('dist', p))); } catch { res.writeHead(404).end(); }
}).listen(0);
const [W, H] = (process.env.VIEW || '1920x1080').split('x').map(Number);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
await page.goto(`http://127.0.0.1:${server.address().port}/`);
const shot = async (n) => { await page.waitForTimeout(400); await page.screenshot({ path: `${out}/assistent_${cc}${year}_${n}.png` }); console.log('Bild', n); };
const next = () => page.click('.ng-foot button:has-text("Weiter")');
await page.click('text=Neues Spiel');
await page.waitForSelector('.ng-root');
await page.fill('.ng-field input[placeholder*="Max"]', 'Tief');
await page.fill('.ng-field input[placeholder*="Mustermann"]', 'Tester');
await next();
await page.waitForSelector('.ng-modes');
await next();
await page.waitForSelector('.ng-ctable');
await page.locator('.ng-year-range').fill(year);
await next();
await page.waitForSelector('.ng-countries');
await page.click(`.ng-countries [data-cc="${cc}"]`);
await page.waitForSelector('.ng-league');
await shot('1_ligen');
const rows = await page.locator('.ng-league').allTextContents();
console.log('Ligen:', rows.join(' | '));
const want = page.locator(`.ng-league:has-text("${tier}. Ebene")`).first();
if (!await want.count()) errors.push(`keine wählbare Liga der ${tier}. Ebene`);
else { await want.click(); await page.waitForSelector('.ng-club'); await shot('2_vereine'); await page.click('.ng-club >> nth=5'); }
await next();
await page.waitForSelector('.lp-levels', { timeout: 30000 });
await shot('3_ligensystem');
await browser.close();
server.close();
console.log(errors.length ? 'Fehler:\n' + errors.join('\n') : 'Keine Fehler.');
process.exit(errors.length ? 1 : 0);
