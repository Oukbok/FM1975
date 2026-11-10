// Textmodus: Ziehen & Ablegen in der Live-Aufstellung (Wechsel + Positionstausch)
// und im Wechsel-Bildschirm (Liste → Liste, Liste → Spielfeld).
//   node tests/match-dnd.mjs [ausgabeordner]
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { startNewGame } from './newgame-flow.mjs';
import { pickOption, optionsOf, valueOf } from './select3.mjs';

const outDir = process.argv[2] || 'test-output/match-dnd';
await mkdir(outDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(join('dist', path))); }
  catch { res.writeHead(404).end(); }
}).listen(0);
const url = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errors = [];
page.on('pageerror', (e) => errors.push('JS-Fehler: ' + e.message));
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
await page.goto(url);
await startNewGame(page);
await page.waitForTimeout(800);

const closeModals = async () => {
  for (const sel of ['button:has-text("Überspringen")', 'button:has-text("Fortsetzen")', 'button:has-text("Schließen")', 'button:has-text("OK")', '.modal-close']) {
    const b = page.locator(sel).first();
    if (await b.isVisible().catch(() => false)) await b.click().catch(() => {});
  }
};
async function untilMatchDue() {
  for (let i = 0; i < 120; i++) {
    // Vorschau „Nächstes Spiel“ geschlossen → Kopfknopf öffnet sie wieder.
    { const pn = page.locator('.hd-continue.pm-next'); if (await pn.isVisible().catch(() => false)) { await pn.click().catch(() => {}); await page.waitForTimeout(600); } }
    if (await page.locator('button:has-text("Textmodus")').isVisible().catch(() => false)) return true;
    await closeModals();
    const w = page.getByRole('button', { name: /weiter/i }).first();
    if (await w.isVisible().catch(() => false)) await w.click().catch(() => {});
    await page.waitForTimeout(700);
  }
  return false;
}

if (!(await untilMatchDue())) { console.log('Kein eigenes Spiel erreicht'); process.exit(1); }
await page.click('button:has-text("Textmodus")');
await page.waitForTimeout(2500);
const fail = (m) => { console.log('FEHLER: ' + m); errors.push(m); };
const dragTo = async (from, to) => {
  const a = await from.boundingBox(), b = await to.boundingBox();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  const ax = a.x + a.width / 2, ay = a.y + a.height / 2, bx = b.x + b.width / 2, by = b.y + b.height / 2;
  for (let i = 1; i <= 8; i++) await page.mouse.move(ax + (bx - ax) * i / 8, ay + (by - ay) * i / 8);
  await page.screenshot({ path: `${outDir}/drag_${Date.now() % 100000}.png` });
  await page.mouse.up();
  await page.waitForTimeout(400);
};
// Pause, damit der Ticker nicht weiterläuft
await page.click('.tm-rbtn').catch(() => {});
await page.waitForTimeout(300);
const fieldRows = page.locator('.tm-lt-body .tm-lt-row.dnd:not(.bench)');
const benchRows = page.locator('.tm-lt-body .tm-lt-row.bench.dnd');
const n0 = await benchRows.count();
const name = async (l) => (await l.locator('.tm-name').innerText()).trim();
const p1 = await name(fieldRows.nth(9)), p2 = await name(fieldRows.nth(10));
await dragTo(fieldRows.nth(9), fieldRows.nth(10));
const posAfter = await page.locator('.tm-lt-foot').innerText();
if (!/Positionen getauscht/.test(posAfter)) fail('Positionstausch per Ziehen: ' + posAfter);
const b1 = await name(benchRows.nth(0));
await dragTo(benchRows.nth(0), fieldRows.nth(10));
const foot = await page.locator('.tm-lt-foot').innerText();
if (!/Wechsel:/.test(foot)) fail('Wechsel per Ziehen: ' + foot);
const fieldNames = await page.locator('.tm-lt-body .tm-lt-row.dnd:not(.bench) .tm-name').allInnerTexts();
if (!fieldNames.some((x) => x.includes(b1))) fail(`eingewechselter ${b1} nicht auf dem Feld`);
console.log(`Live: ${p1}↔${p2}, ${b1} eingewechselt (${foot.split('\n')[0]})`);
await page.screenshot({ path: `${outDir}/01_live.png` });
// Wechsel-Bildschirm: Bankzeile der Liste auf einen Feldspieler-Slot ziehen
await page.click('button:has-text("Wechsel / Taktik")');
await page.waitForTimeout(800);
{
  const step = async (label) => { await page.locator('.tm-cs-row.field').nth(6).click(); console.log(label, 'sel=', await page.locator('.tm-cs-row.sel').count()); await page.locator('.tm-cs-row.field').nth(6).click(); };
  await step('frisch');
  const s1 = page.locator('.tm-sys-slot').nth(9), s2 = page.locator('.tm-sys-slot').nth(10);
  const b1 = await s1.boundingBox(), b2 = await s2.boundingBox();
  await page.mouse.move(b1.x + b1.width / 2, b1.y + b1.height / 2); await page.mouse.down();
  await page.mouse.move(b1.x + 40, b1.y + 30, { steps: 4 });
  await page.mouse.move(b2.x + b2.width / 2, b2.y + b2.height / 2, { steps: 8 });
  await page.mouse.up();
  await step('nach Slot-Tausch');
  const bench = await page.locator('.tm-sys-bench').boundingBox();
  const b3 = await page.locator('.tm-sys-slot').nth(5).boundingBox();
  await page.mouse.move(b3.x + b3.width / 2, b3.y + b3.height / 2); await page.mouse.down();
  await page.mouse.move(b3.x + 40, b3.y + 30, { steps: 4 });
  await page.mouse.move(bench.x + bench.width / 2, bench.y + bench.height - 6, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(150);
  await step('nach Bankfläche');
  await page.mouse.move(b3.x + b3.width / 2, b3.y + b3.height / 2); await page.mouse.down();
  await page.mouse.move(b3.x + 60, b3.y + 40, { steps: 4 });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(100);
  await page.mouse.up();
  await step('nach Escape');
}
await page.locator('.tm-cs-row.field').nth(6).click();
console.log('nach Klick 1: sel=', await page.locator('.tm-cs-row.sel').count());
await page.locator('.tm-cs-row.bench').nth(0).click();
console.log('nach Klick 2: rein=', await page.locator('.tm-tag.rein').count());
await page.click('button:has-text("Zurücksetzen")');
const lb = page.locator('.tm-cs-row.bench').first();
const lbn = await lb.locator('.tm-name').innerText();
await dragTo(lb, page.locator('.tm-sys-slot').nth(10));
if (!(await page.locator('.tm-cs-row.field.rein').count())) fail('Liste → Spielfeld: kein „rein“');
await dragTo(page.locator('.tm-cs-row.field').nth(1), page.locator('.tm-cs-row.field').nth(2));
await page.screenshot({ path: `${outDir}/02_changes.png` });
console.log(`Wechsel-Bildschirm: ${lbn} gezogen, rein=${await page.locator('.tm-cs-row.field.rein').count()}`);
console.log(errors.length ? errors.join('\n') : 'Ziehen im Textmodus: alles in Ordnung.');
await browser.close(); server.close();
process.exit(errors.length ? 1 : 0);
