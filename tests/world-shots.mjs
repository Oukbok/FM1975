// Screenshots Weltdaten: Assistent mit Startjahr + Länderwahl (Spielwelt, Verein, Ligensystem) mit den eingebauten Weltdaten
// und ein Spiel in England (Zentrale, Tabelle, Ligensystem). Voraussetzung: npm run build.
//   node tests/world-shots.mjs [ordner]   (VIEW=1366x768)
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { closeBriefing } from './newgame-flow.mjs';

const out = process.argv[2] || 'test-output/world';
await mkdir(out, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[extname(p)] || 'application/octet-stream' }).end(await readFile(join('dist', p))); } catch { res.writeHead(404).end(); }
}).listen(0);
const url = `http://127.0.0.1:${server.address().port}/`;
const [W, H] = (process.env.VIEW || '1920x1080').split('x').map(Number);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
await page.goto(url);
const shot = async (n) => { await page.waitForTimeout(400); await page.screenshot({ path: `${out}/${W}x${H}_${n}.png` }); };
const next = () => page.click('.ng-foot button:has-text("Weiter")');

await page.click('text=Neues Spiel');
await page.waitForSelector('.ng-root');
await page.fill('.ng-field input[placeholder*="Max"]', 'Welt');
await page.fill('.ng-field input[placeholder*="Mustermann"]', 'Tester');
await next();
await page.waitForSelector('.ng-modes');
await page.locator('.ng-speed input[type=range]').fill('300');
await next();
// Spielwelt: Standard 1975 zeigen, dann Datensatz + Startjahr 1985.
await page.waitForSelector('.ng-ctable');
await shot('1_spielwelt_1975');
await page.click('.ng-year-stops button:has-text("1985")');
await page.click('.ng-crow[data-cc="ita"] .ng-seg button:has-text("Spiel für Spiel")').catch(() => {});
await shot('2_spielwelt_1985');
await next();
// Verein: England wählen
await page.waitForSelector('.ng-countries');
await shot('3_verein_deutschland_1985');
await page.click('.ng-countries [data-cc="eng"]');
await page.click('.ng-club >> nth=4');
await shot('4_verein_england');
await next();
await page.waitForSelector('.lp-levels', { timeout: 20000 });
await shot('5_ligensystem');
await next();
await page.waitForSelector('.ng-welcome-hero', { timeout: 20000 });
await shot('6_willkommen');
await page.click('.ng-foot button:has-text("Karriere starten")');
await closeBriefing(page);
await page.waitForTimeout(800);
await shot('7_zentrale');
await page.click('.hd-nav-item:has-text("Statistiken"), .tn-cat:has-text("Statistiken")').catch(() => {});
await page.waitForTimeout(500);
await shot('8_statistiken');
await page.click('.tn-sub-item:has-text("Ligensystem")').catch(() => {});
await page.waitForSelector('.lp-levels', { timeout: 5000 }).catch(() => {});
await shot('9_ligensystem');
await browser.close();
server.close();
console.log(errors.length ? 'JS-Fehler:\n' + errors.join('\n') : 'Keine JS-Fehler.');
process.exit(errors.length ? 1 : 0);
