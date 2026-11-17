// Screenshots der Taktik-Seite (Wunsch Pascal: vier Boxen – Tafel „In Ballbesitz“ + Anweisungen,
// Tafel „Defensive“ + Anweisungen; Zeichnung folgt nur aus den Anweisungen). Prüft außerdem,
// dass ein Klick auf einen Magneten die Rollenwahl öffnet und den Magneten nicht verschiebt.
//   node tests/tactics-shots.mjs [ordner]      (VIEW=1366x768, SAVE=… für spätere Epochen)
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { startNewGame } from './newgame-flow.mjs';

const out = process.argv[2] || 'test-output/tactics';
await mkdir(out, { recursive: true });
const [vw, vh] = (process.env.VIEW || '1920x1080').split('x').map(Number);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.json': 'application/json', '.txt': 'text/plain' };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[extname(p)] || 'application/octet-stream' }).end(await readFile(join('dist', p))); } catch { res.writeHead(404).end(); }
}).listen(0);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: vw, height: vh } });
const errors = [], fails = [];
const check = (ok, msg) => { if (!ok) fails.push(msg); console.log(`${ok ? 'ok  ' : 'FEHL'} ${msg}`); };
page.on('pageerror', (e) => errors.push(e.message));
await page.route(/fonts\.(googleapis|gstatic)\.com/, (x) => x.abort());
await page.goto(`http://127.0.0.1:${server.address().port}/`);
await startNewGame(page, {});
await page.locator('.hd-nav-item:has-text("Aufstellung")').click();
await page.waitForTimeout(200);
await page.locator('.tn-sub-item:has-text("Taktik")').click();
await page.waitForTimeout(900);
await page.screenshot({ path: `${out}/taktik_${vw}.png` });
check(await page.locator('.txb-land').count() === 2, 'zwei liegende Tafeln');
// Klick auf einen Magneten: Rollenwahl geht auf, Magnet bleibt an seinem Platz.
const mag = page.locator('.tx-ball-board .txb-mag').nth(4);
const before = await mag.boundingBox();
await page.mouse.move(before.x + before.width / 2, before.y + 12);
await page.mouse.down();
const pressed = await mag.boundingBox();
await page.mouse.up();
await page.waitForTimeout(300);
check(Math.abs(pressed.x - before.x) < 2 && Math.abs(pressed.y - before.y) < 3, `Magnet verschiebt sich beim Drücken nicht (dx ${Math.round(pressed.x - before.x)}, dy ${Math.round(pressed.y - before.y)})`);
check(await page.locator('.tx-ball-board .txr').count() === 1, 'Klick öffnet die Rollenwahl');
await page.screenshot({ path: `${out}/taktik_rolle_${vw}.png` });
await page.keyboard.press('Escape');
// Anweisungen wechseln: Aufbau lang, Breite Flügel + hohe Flanken, Gegenpressing aus/Abseitsfalle an
const step = async (k, i) => { const b = page.locator(`.txi-row[data-instr="${k}"] .txi-step`).nth(i); if (!(await b.getAttribute('aria-disabled'))) await b.click(); await page.waitForTimeout(150); };
await step('buildup', 1); await step('width', 4); await step('cross', 2); await step('tempo', 4); await step('style', 2);
await step('pressing', 3); await step('line', 3); await step('trap', 1);
await page.waitForTimeout(700);
await page.screenshot({ path: `${out}/taktik_lang_fluegel_${vw}.png` });
check(await page.locator('.tx-ball-board path.txb-arrow.long').count() === 1 && await page.locator('.tx-ball-board path.txb-arrow.short').count() === 0, 'Aufbau lang: ein langer Ball, keine Kurzpasskette');
check(await page.locator('.tx-ball-board path.txb-arrow.cross').count() >= 2, 'Flügelspiel: Flanken auf beiden Seiten');
await step('width', 0); await step('buildup', 0);
await page.waitForTimeout(500);
check(await page.locator('.tx-ball-board path.txb-arrow.cross').count() === 0, 'Spiel durch die Mitte: keine Flanken');
check(await page.locator('.tx-ball-board path.txb-arrow.short').count() >= 2, 'Aufbau kurz: Kurzpasskette');
await page.screenshot({ path: `${out}/taktik_kurz_mitte_${vw}.png` });
await browser.close();
server.close();
console.log(errors.length ? `JS-Fehler:\n${errors.join('\n')}` : 'Keine JS-Fehler.');
if (fails.length) process.exitCode = 1;
