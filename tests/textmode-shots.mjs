// Screenshots des Textmodus (Ereignisliste, Chancen-Meter, Reiter, Wechsel-Bildschirm,
// Halbzeit) aus einem Spielstand; prüft waagerechte Überläufe bei 1920×1080 und 1366×768.
//   npm run build && node tests/textmode-shots.mjs [ausgabeordner] [präfix]
//   SAVE=… (Standard: public/saves/test-3-jahre.txt, Vorlage „Test 3 Jahre“)
//   späte Epoche: CLUB=fra DUMP=<pfad> UNTIL=2012-09-01 node scripts/sim.mjs 37 → SAVE=<pfad>
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { closeBriefing } from './newgame-flow.mjs';

const outDir = process.argv[2] || 'test-output/textmode';
const prefix = process.argv[3] || 'tm';
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
await page.click('button:has-text("Laden") >> nth=0');
await page.waitForTimeout(1500);
await closeBriefing(page);

async function shot(name) {
  await page.screenshot({ path: `${outDir}/${prefix}_${name}.png` });
  const rep = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('.tm-root .ms-panel, .tm-stage, .tm-tk-body, .tm-lt-body, .tm-cs-table, .tm-cs-right, .tm-actions, .tm-cs-lfoot, .tm-cs-top')) {
      if (el.scrollWidth > el.clientWidth + 2) out.push(`${el.className.split(' ').slice(0, 2).join('.')}: waagerechter Überlauf ${el.scrollWidth - el.clientWidth}px`);
    }
    const root = document.querySelector('.tm-root');
    if (root && root.scrollHeight > root.clientHeight + 2) out.push(`Seite höher als Bildschirm (${root.scrollHeight - root.clientHeight}px)`);
    return out;
  });
  console.log(`${name}: ${rep.length ? rep.join('; ') : 'ok'}`);
}
const closeModals = async () => {
  for (const sel of ['button:has-text("Überspringen")', 'button:has-text("Fortsetzen")', 'button:has-text("Schließen")', 'button:has-text("OK")', '.modal-close', '.dr-root button:has-text("Ergebnis sofort zeigen")']) {
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
// bis ~30. Minute laufen lassen, Meter abfangen
let meter = false;
for (let i = 0; i < 900; i++) {
  if (!meter && await page.locator('.tm-meter.lvl-3').isVisible().catch(() => false)) { await shot('01_grosschance'); meter = true; }
  if ((await confirmStop()) === 'halbzeit') break;
  const min = await page.locator('.tm-clock-txt b').innerText().catch(() => '0');
  if (parseInt(min, 10) >= 32 && meter) break;
  await page.waitForTimeout(80);
}
await page.click('.tm-rbtn >> nth=0').catch(() => {});
await shot('02_spiel');
for (const tab of ['Gegner', 'Live', 'Statistik', 'Taktik']) {
  await page.click(`.tm-rpanel .tm-tabs >> text=${tab}`).catch(() => {});
  await page.waitForTimeout(150);
  await page.locator('.tm-right').screenshot({ path: `${outDir}/${prefix}_03_${tab.toLowerCase()}.png` }).catch(() => {});
}
await page.click('.tm-rpanel .tm-tabs >> text=Team');
await page.click('.tm-change-btn');
await page.waitForTimeout(500);
await shot('04_wechsel');
await page.click('.tm-cs-lfoot >> text=Taktik öffnen');
await shot('05_spieltaktik');
await page.click('.tm-cs-ok');
await page.click('.tm-rbtn >> nth=0').catch(() => {});
for (let i = 0; i < 40; i++) {
  if ((await confirmStop()) === 'halbzeit') break;
  await page.locator('.tm-rbtn >> nth=1').click({ timeout: 1000 }).catch(() => {});
  await page.waitForTimeout(400);
}
await shot('06_halbzeit');
await page.setViewportSize({ width: 1366, height: 768 });
await page.waitForTimeout(300);
await shot('07_halbzeit_1366');
await page.click('.tm-cs-ok').catch(() => {});
await page.waitForTimeout(800);
await shot('08_spiel_1366');
console.log(errors.length ? errors.join('\n') : 'Keine JS-Fehler.');
await browser.close();
server.close();
