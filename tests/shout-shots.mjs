// Screenshots der Zuruf-Laufzeit im Textmodus (Wunsch Pascal): aktiver Zuruf mit Ring/Restminuten,
// danach die Pause bis zum nächsten Zuruf, Etikett „Wiederholung: −30 %“, Zuruf-Spanne in der Zeitleiste;
// je 1920×1080 und 1280×800, prüft Überläufe.
//   npm run build && node tests/shout-shots.mjs [ausgabeordner] [präfix]
//   SAVE=… (Standard: public/saves/test-3-jahre.txt, Vorlage „Test 3 Jahre“)
//   späte Epoche: CLUB=fra DUMP=<pfad> UNTIL=2012-09-01 node scripts/sim.mjs 37 → SAVE=<pfad>
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { closeBriefing } from './newgame-flow.mjs';

const outDir = process.argv[2] || 'test-output/shouts';
const prefix = process.argv[3] || 'zuruf';
const savePath = process.env.SAVE || 'public/saves/test-3-jahre.txt';
await mkdir(outDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.txt': 'text/plain' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(join('dist', path))); }
  catch { res.writeHead(404).end(); }
}).listen(0);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errors = [];
page.on('pageerror', (e) => errors.push('JS-Fehler: ' + e.message));
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
await page.goto(`http://127.0.0.1:${server.address().port}/`);
const raw = await readFile(savePath, 'utf8');
await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
await page.reload();
await page.click('text=Spiel laden');
await page.click('.card:has(button:has-text("Löschen")) button:has-text("Laden") >> nth=0');
await page.waitForTimeout(1500);
await closeBriefing(page);

async function shot(name) {
  await page.screenshot({ path: `${outDir}/${prefix}_${name}.png` });
  const rep = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('.tm-root .ms-panel, .ms-tactics, .ms-stimer, .ms-shout, .ms-top, .tm-stage, .tm-tk-body, .tm-lt-body, .tm-cs-table, .tm-cs-right, .tm-actions, .tm-cs-lfoot, .tm-cs-top')) {
      if (el.scrollWidth > el.clientWidth + 2) out.push(`${el.className.split(' ').slice(0, 2).join('.')}: waagerechter Überlauf ${el.scrollWidth - el.clientWidth}px`);
    }
    const root = document.querySelector('.tm-root');
    if (root && root.scrollHeight > root.clientHeight + 2) out.push(`Seite höher als Bildschirm (${root.scrollHeight - root.clientHeight}px)`);
    return out;
  });
  console.log(`${name}: ${rep.length ? rep.join('; ') : 'ok'}`);
}
const closeModals = async () => {
  for (const sel of ['button:has-text("Überspringen")', 'button:has-text("Fortsetzen")', 'button:has-text("Schließen")', 'button:has-text("OK")', '.modal-close', '.dr-root:not(.rt-root) .dg-skip', '.dr-root:not(.rt-root) .dg-go:has-text("Weiter")']) {
    const b = page.locator(sel).first();
    if (await b.isVisible().catch(() => false)) await b.click().catch(() => {});
  }
};
for (let i = 0; i < 160; i++) {
  if (await page.locator('button:has-text("Textmodus")').isVisible().catch(() => false)) break;
  await closeModals();
  const w = page.getByRole('button', { name: /weiter/i }).first();
  if (await w.isVisible().catch(() => false)) await w.click().catch(() => {});
  await page.waitForTimeout(700);
}
await page.click('button:has-text("Textmodus")');
await page.waitForTimeout(1200);
// Tempo rasant
await page.click('.tm-act-grid >> text=Einstellungen');
await page.locator('.tm-speed input[type=range]').fill('3');
await page.click('.tm-act-grid >> text=Einstellungen');
const confirmStop = async () => {
  if (!(await page.locator('.tm-cs').isVisible().catch(() => false))) return null;
  if (await page.locator('.tm-cs-tabs >> text=Halbzeitansprache').isVisible().catch(() => false)) return 'halbzeit';
  await page.click('.tm-cs-ok'); return 'stop';
};

const clock = async () => parseInt(await page.locator('.tm-clock-txt b').innerText().catch(() => '0'), 10) || 0;
const pause = async () => { if (!(await page.locator('.ms-pill:has-text("Pause")').isVisible().catch(() => false))) await page.click('.tm-rbtn >> nth=0'); };
const play = async () => { if (await page.locator('.ms-pill:has-text("Pause")').isVisible().catch(() => false)) await page.click('.tm-rbtn >> nth=0'); };
async function runTo(min) {
  await play();
  for (let i = 0; i < 1200; i++) {
    if ((await confirmStop()) === 'halbzeit') await page.click('.tm-cs-ok').catch(() => {});
    if (await clock() >= min) break;
    await page.waitForTimeout(60);
  }
  await pause();
  await page.waitForTimeout(400);
}
async function both(name) {
  await page.setViewportSize({ width: 1920, height: 1080 }); await page.waitForTimeout(350);
  await shot(`${name}_1920`);
  await page.setViewportSize({ width: 1280, height: 800 }); await page.waitForTimeout(350);
  await shot(`${name}_1280`);
  const ui = await page.evaluate(() => document.querySelector('[data-ui]')?.getAttribute('data-ui') ?? '-');
  console.log(`  data-ui bei 1280×800: ${ui}`);
  await page.setViewportSize({ width: 1920, height: 1080 }); await page.waitForTimeout(250);
}
await runTo(8);
await page.click('.tm-rpanel .tm-tabs >> text=Taktik');
await both('01_bereit');
await page.click('.ms-shout:has-text("Mehr Druck!")');
await runTo(14);
await both('02_aktiv');
const m1 = await page.locator('.ms-stimer b').first().innerText();
console.log(`  aktiv: ${m1}`);
// Pause nach Ende der Wirkung (Zuruf + 15 … + 21)
const until = parseInt((await page.locator('.ms-stimer span').first().innerText()).match(/(\d+)\./)?.[1] ?? '0', 10);
await runTo(until + 2);
await both('03_pause');
console.log(`  Pause: ${await page.locator('.ms-stimer b').first().innerText()}`);
// nach der Pause: derselbe Zuruf zeigt den Abschlag vor dem Klick
const ready = parseInt((await page.locator('.ms-stimer b').first().innerText()).match(/(\d+)\./)?.[1] ?? '0', 10);
await runTo(ready);
await page.locator('.ms-shout:has-text("Mehr Druck!")').hover();
await both('04_wiederholung');
console.log(`  Etikett: ${await page.locator('.ms-shout:has-text("Mehr Druck!") .ms-shout-tag').innerText()}`);
await page.click('.ms-shout:has-text("Mehr Druck!")');
await runTo(ready + 4);
await page.click('.tm-rpanel .tm-tabs >> text=Team');
await both('05_kopfzeile_zeitleiste');
await page.locator('.tm-tl').screenshot({ path: `${outDir}/${prefix}_06_zeitleiste.png` });
console.log(errors.length ? errors.join('\n') : 'Keine JS-Fehler.');
await browser.close();
server.close();
