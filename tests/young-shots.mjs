// Screenshots „Junger Manager“ (Wunsch Pascal #47): Spielmodus mit Hintergrundgeschichte,
// Spielstart, Privat-Seiten (Übersicht, Karriere, Familie, Freizeit, Vermögen).
//   npm run build && node tests/young-shots.mjs [ordner]   (VIEW=1366x768 möglich)
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { startNewGame } from './newgame-flow.mjs';

const out = process.argv[2] || 'test-output/young';
await mkdir(out, { recursive: true });
const [W, H] = (process.env.VIEW || '1920x1080').split('x').map(Number);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[extname(p)] || 'application/octet-stream' }).end(await readFile(join('dist', p))); } catch { res.writeHead(404).end(); }
}).listen(0);
const url = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
await page.goto(url);
await startNewGame(page, { young: true, shots: (n) => (n.startsWith('2') || n.startsWith('1') ? page.screenshot({ path: `${out}/${W}x${H}_${n}.png` }) : null) });
await page.waitForTimeout(800);
for (const sub of ['Privat', 'Karriere', 'Familie', 'Freizeit', 'Vermögen']) {
  await page.click('.hd-nav-item:has-text("Privat")');
  await page.click(`.tn-sub-item:has-text("${sub}")`);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/${W}x${H}_p_${sub.toLowerCase()}.png` });
}
// Plan ändern (Stufen-Knopf) und Hobby wählen.
await page.click('.tn-sub-item:has-text("Freizeit")');
await page.click('.pv-plan-row >> nth=0 >> .pv-step-btn >> nth=1');
await page.click('.pv-choice:has-text("Golf")');
await page.waitForTimeout(300);
const plan = await page.locator('.pv-plan-row >> nth=0 >> .pv-dots i.on').count();
console.log(`Erholung nach Klick: ${plan} Punkte; Golf gewählt: ${await page.locator('.pv-choice.on:has-text("Golf")').count()}`);
// Story im Posteingang
await page.click('.hd-nav-item:has-text("Zentrale")');
const story = await page.locator('text=Deine Geschichte').count();
console.log(`Geschichte im Posteingang: ${story ? 'ja' : 'nein'}`);
console.log(errors.length ? `JS-Fehler:\n${errors.join('\n')}` : 'Keine JS-Fehler.');
await browser.close();
server.close();
process.exit(errors.length ? 1 : 0);
