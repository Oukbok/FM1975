// Screenshots Saisonbudget: Fenster nach dem Briefing (Spielbeginn), Regler, Seite Finanzen › Budget,
// Vorlage „Test 3 Jahre“ (Plan aus altem Spielstand). Je 1920×1080 und 1366×768.
//   npm run build && node tests/budget-shots.mjs [ordner]
//   SAVE=… (anderer Spielstand für Seite + Fenster, z. B. aus DUMP=… node scripts/sim.mjs 25), PREFIX=…
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { startNewGame, skipIntro } from './newgame-flow.mjs';

const outDir = process.argv[2] || 'test-output/budget';
const PREFIX = process.env.PREFIX || '';
await mkdir(outDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.txt': 'text/plain' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(join('dist', path))); }
  catch { res.writeHead(404).end(); }
}).listen(0);
const url = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch();
const errors = [];

async function run(w, h) {
  const tag = `${PREFIX}${w}`;
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  page.on('pageerror', (e) => errors.push(`${w}: JS-Fehler: ${e.message}`));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const shot = async (n) => { await page.waitForTimeout(350); await page.screenshot({ path: `${outDir}/${tag}_${n}.png` }); };
  const nav = async (main, sub) => {
    await page.locator(`.hd-nav-item:has-text("${main}")`).first().click();
    await page.waitForTimeout(250);
    await page.locator(`.tn-sub-item:has-text("${sub}")`).first().click();
    await page.waitForTimeout(400);
  };
  await page.goto(url);

  if (!process.env.SAVE) {
    // 1) Neues Spiel: Briefing schließen → Budget öffnet sich.
    await startNewGame(page, { keepBriefing: true });
    await skipIntro(page);
    await page.locator('.bf-modal .bf-continue').click();
    await page.locator('.bud-modal').waitFor({ state: 'visible', timeout: 5000 });
    await shot('1_fenster');
    // 2) Transfers erhöhen, Reserve wählen.
    for (let i = 0; i < 12; i++) await page.locator('button[aria-label="Transfers erhöhen"]').click();
    await page.locator('.bud-colf-name:has-text("Reserve")').click();
    await shot('2_mehr_transfers');
    await page.locator('.bud-colf-name:has-text("Infrastr.")').click();
    await page.locator('.bud-range').fill('0');
    await shot('3_infra');
    await page.locator('.bud-confirm').click();
    await page.locator('.bud-modal').waitFor({ state: 'detached', timeout: 4000 });
    await nav('Finanzen', 'Budget');
    await shot('4_seite');
  }

  // 3) Spielstand (Vorlage oder SAVE): Plan aus altem Spielstand, Seite + Fenster.
  const raw = await readFile(process.env.SAVE || 'public/saves/test-3-jahre.txt', 'utf8');
  await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
  await page.goto(url);
  await page.click('text=Spiel laden');
  await page.click('button:has-text("Laden") >> nth=0');
  await page.waitForTimeout(1500);
  for (let i = 0; i < 3 && await page.locator('.bf-continue').count(); i++) { await page.locator('.bf-continue').click(); await page.waitForTimeout(200); }
  if (await page.locator('.bud-modal').count()) errors.push(`${w}: Budget-Fenster öffnet beim Laden`);
  await nav('Finanzen', 'Budget');
  const scroll = await page.evaluate(() => { const m = document.querySelector('.app-main'); return m ? m.scrollHeight - m.clientHeight : 0; });
  if (scroll > 2) errors.push(`${w}: Seite Budget scrollt (${scroll}px)`);
  await shot('5_seite_spielstand');
  await page.locator('.dchip:has-text("Vorjahre")').click();
  await shot('6_vorjahre');
  await page.locator('.dchip:has-text("Budget anpassen")').click();
  await page.locator('.bud-modal').waitFor({ state: 'visible', timeout: 4000 });
  await shot('7_fenster_spielstand');
  const over = await page.evaluate(() => { const b = document.querySelector('.bud-body'); return b ? b.scrollHeight - b.clientHeight : 0; });
  if (over > 2) errors.push(`${w}: Budget-Fenster scrollt (${over}px)`);
  await page.close();
}

try {
  await run(1920, 1080);
  await run(1366, 768);
} catch (e) { errors.push(e.message.split('\n')[0]); }
await browser.close();
server.close();
if (errors.length) { console.log(errors.join('\n')); process.exit(1); }
console.log(`Screenshots in ${outDir}/`);
