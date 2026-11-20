// Screenshots DDR als Heimatland (game/ddrHome.ts): Assistent mit DDR (Spielwelt, Land/Liga/Verein, Ligensystem,
// Willkommen) und ein Spiel in der DDR-Oberliga (Zentrale, Statistiken › Liga, Ligensystem, Finanzen, Transfers).
// Voraussetzung: npm run build.   node tests/ddr-shots.mjs [ordner]   (VIEW=1366x768, YEAR=1982, LEAGUE=DDR-Liga)
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { startNewGame } from './newgame-flow.mjs';

const out = process.argv[2] || 'test-output/ddr';
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

await startNewGame(page, { name: 'Ost', country: 'gdr', year: Number(process.env.YEAR ?? 1982), league: process.env.LEAGUE, clubIndex: 2, shots: (n) => shot(`a${n}`) });
await page.waitForTimeout(800);
await shot('b1_zentrale');
const menu = async (cat, sub, n) => {
  await page.click(`.hd-nav-item:has-text("${cat}"), .tn-cat:has-text("${cat}")`).catch(() => {});
  await page.waitForTimeout(300);
  if (sub) await page.click(`.tn-sub-item:has-text("${sub}")`).catch(() => {});
  await page.waitForTimeout(700);
  await shot(n);
};
await menu('Statistiken', 'Liga', 'b2_liga');
await menu('Statistiken', 'Ligensystem', 'b3_ligensystem');
await menu('Finanzen', null, 'b4_finanzen');
await menu('Transfers', null, 'b5_transfers');
await browser.close();
server.close();
console.log(errors.length ? 'JS-Fehler:\n' + errors.join('\n') : 'Keine JS-Fehler.');
process.exit(errors.length ? 1 : 0);
