// Screenshots der Trainings- und Jugendseiten (Training › Übersicht/Trainingsplan/Trainerteam,
// Jugend › Übersicht/Jugendwettbewerbe) + Ziehen eines Bausteins + Kopfleiste ohne Überlauf.
//   node tests/training-shots.mjs [ausgabeordner]   (SAVE=… lädt einen Spielstand, z. B. aus DUMP=… node scripts/sim.mjs 30)
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { startNewGame } from './newgame-flow.mjs';

const outDir = process.argv[2] || 'test-output/training';
await mkdir(outDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(join('dist', path))); }
  catch { res.writeHead(404).end(); }
}).listen(0);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(process.env.W || 1920), height: Number(process.env.H || 1080) } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
await page.goto(`http://127.0.0.1:${server.address().port}/`);
const tag = process.env.SAVE ? 'late' : 'new';
if (process.env.SAVE) {
  const raw = await readFile(process.env.SAVE, 'utf8');
  await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
  await page.reload();
  await page.click('text=Spiel laden');
  await page.click('button:has-text("Laden") >> nth=0');
  await page.waitForTimeout(1500);
  const close = page.locator('.modal-close');
  if (await close.count()) await close.first().click().catch(() => {});
} else { await startNewGame(page); await page.waitForTimeout(800); }

// Kopfleiste: Hauptmenü darf nicht überlaufen und nicht in den rechten Block ragen.
const head = await page.evaluate(() => {
  const nav = document.querySelector('.hd-nav'); const right = document.querySelector('.hd-right');
  const items = [...document.querySelectorAll('.hd-nav-item')].map((e) => e.getBoundingClientRect());
  return { over: nav.scrollWidth - nav.clientWidth, lastRight: items[items.length - 1].right, rightLeft: right.getBoundingClientRect().left, n: items.length };
});
if (head.over > 1 || head.lastRight > head.rightLeft) errors.push(`Kopfleiste läuft über: ${JSON.stringify(head)}`);
console.log('Kopfleiste', JSON.stringify(head));

const noScroll = async (name) => {
  const s = await page.evaluate(() => { const m = document.querySelector('.app-main'); return m ? m.scrollHeight - m.clientHeight : 0; });
  if (s > 2) errors.push(`${name} scrollt (${s}px)`);
};
await page.locator('.hd-nav-item:has-text("Training")').click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${outDir}/${tag}_1_uebersicht.png` });
await noScroll('Training-Übersicht');
await page.locator('.tn-sub-item:has-text("Trainingsplan")').click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${outDir}/${tag}_2_plan.png` });
await noScroll('Trainingsplan');
// Ziehen: „Torschuss“ aus der Leiste in das erste leere oder gefüllte Feld am Montag (Abend).
const tile = page.locator('.tp-tile:has-text("Torschuss")');
const target = page.locator('.tp-cell[data-day="0"][data-slot="extra"]');
if (await tile.count() && await target.count()) {
  const a = await tile.boundingBox(), b = await target.boundingBox();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(a.x + 40, a.y + 40, { steps: 4 });
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 });
  await page.screenshot({ path: `${outDir}/${tag}_3_ziehen.png` });
  await page.mouse.up();
  await page.waitForTimeout(200);
  const txt = await target.innerText();
  if (!txt.includes('Torschuss')) errors.push(`Ziehen hat das Feld nicht belegt (${txt})`);
}
await page.locator('.tp-tpls .dchip:has-text("Vorbereitung")').click();
await page.waitForTimeout(200);
await page.screenshot({ path: `${outDir}/${tag}_4_vorlage.png` });
await page.locator('.tn-sub-item:has-text("Trainerteam")').click();
await page.waitForTimeout(400);
await page.locator('.tt-table tbody tr').first().click();
await page.waitForTimeout(200);
await page.screenshot({ path: `${outDir}/${tag}_5_trainerteam.png` });
await noScroll('Trainerteam');
await page.locator('.tt-table tbody tr .dchip').first().click();
await page.waitForTimeout(300);
await page.screenshot({ path: `${outDir}/${tag}_6_verhandlung.png` });
await page.locator('.tt-neg .btn-primary').click();
await page.waitForTimeout(300);
await page.screenshot({ path: `${outDir}/${tag}_7_antwort.png` });
if (await page.locator('.modal-close').count()) await page.locator('.modal-close').first().click();
await page.locator('.hd-nav-item:has-text("Jugend")').click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${outDir}/${tag}_8_jugend.png` });
await noScroll('Jugend-Übersicht');
await page.locator('.tn-sub-item:has-text("Jugendwettbewerbe")').click();
await page.waitForTimeout(300);
await page.screenshot({ path: `${outDir}/${tag}_9_wettbewerbe.png` });
console.log(errors.length ? 'FEHLER:\n' + errors.join('\n') : 'ok, keine JS-Fehler');
await browser.close(); server.close();
process.exit(errors.length ? 1 : 0);
