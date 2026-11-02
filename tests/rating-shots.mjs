// Screenshots der Bewertungs-Show: Startbildschirm, Aufruf, Zählen, Ergebnis mit
// Begründung, Pause, Bilanz, Rückblick auf einen Spieler, danach Spielerprofil ›
// Entwicklung mit den Gründen. Spult per Zeitlauf bis zur nächsten Bewertungsrunde
// (Herbst 3.11., Winter 2.1., Saisonende −14 Tage).
//   npm run build && node tests/rating-shots.mjs [ausgabeordner] [präfix]
//   SAVE=… (Standard: public/saves/test-3-jahre.txt, Stand 10.12.1978 → Winter-Bewertung 2.1.1979)
//   SPEED=schnell|normal|langsam
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { closeBriefing } from './newgame-flow.mjs';

const outDir = process.argv[2] || 'test-output/rating';
const prefix = process.argv[3] || 'rt';
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
await page.evaluate(({ r, speed }) => {
  localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim']));
  try { const k = Object.keys(localStorage).find((x) => /settings/i.test(x)); const s = k ? JSON.parse(localStorage.getItem(k)) : null; if (s && speed) { s.ratingSpeed = speed; localStorage.setItem(k, JSON.stringify(s)); } } catch { /* egal */ }
}, { r: raw, speed: process.env.SPEED || '' });
await page.reload();
await page.click('text=Spiel laden');
await page.click('button:has-text("Laden") >> nth=0');
await page.waitForTimeout(1500);
await closeBriefing(page);

async function shot(name) {
  await page.screenshot({ path: `${outDir}/${prefix}_${name}.png` });
  const rep = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('.rt-root .rt-card, .rt-root .rt-summary, .rt-root .rt-intro, .rt-lrows, .rt-live-body, .dr-now')) {
      if (el.scrollWidth > el.clientWidth + 2) out.push(`${el.className.split(' ')[0]}: waagerechter Überlauf ${el.scrollWidth - el.clientWidth}px`);
    }
    const st = document.querySelector('.rt-stage');
    const inner = st?.querySelector('.rt-card, .rt-summary, .rt-intro');
    if (st && inner) { const a = st.getBoundingClientRect(), b = inner.getBoundingClientRect(); if (b.top < a.top - 1 || b.bottom > a.bottom + 1) out.push(`Bühne abgeschnitten (${Math.round(b.height)} > ${Math.round(a.height)})`); }
    return out;
  });
  console.log(`${name}: ${rep.length ? rep.join('; ') : 'ok'}`);
}

// Zeitlauf bis zur Show
const t0 = Date.now();
let last = '';
while (!(await page.locator('.rt-root').count()) && Date.now() - t0 < 6 * 60_000) {
  for (const sel of ['button:has-text("Schnell simulieren")', 'button:has-text("Zum Spielbericht")', '.dr-root:not(.rt-root) button:has-text("Ergebnis sofort zeigen")', '.dr-root:not(.rt-root) button:has-text("Schließen")', 'button:has-text("Schließen")', '.modal-overlay .modal-close']) {
    const b = page.locator(sel).first();
    if (await b.isVisible().catch(() => false)) await b.click().catch(() => {});
  }
  if (await page.locator('.rt-root').count()) break;
  const w = page.locator('button').filter({ hasText: /^\s*Weiter\s*$/i }).first();
  if (await w.isVisible().catch(() => false)) await w.click().catch(() => {});
  await page.waitForTimeout(1500);
  const d = await page.locator('body').innerText().then((t) => t.match(/\w+, \d{1,2}\. \w+ (19|20)\d\d/)?.[0]).catch(() => '?');
  if (d !== last) { console.log(`  Zeitlauf: ${d}`); last = d; }
}
if (!(await page.locator('.rt-root').count())) { console.log('Bewertungs-Show nicht erschienen.'); await page.screenshot({ path: `${outDir}/${prefix}_debug.png` }); process.exit(1); }

await page.waitForTimeout(700);
await shot('01_start');
await page.click('.rt-root button:has-text("Starten")');
await page.waitForTimeout(900); await shot('02_aufruf');
await page.waitForTimeout(1300); await shot('03_zaehlen');
await page.waitForTimeout(1700); await shot('04_ergebnis');
// Weitere Spieler, bis eine Auf- oder Abwertung mit Begründung zu sehen ist.
let n = 0;
for (let k = 0; k < 40 && n < 3; k++) {
  await page.waitForTimeout(500);
  const v = await page.locator('.rt-card.up, .rt-card.down').count();
  if (v && (await page.locator('.rt-reasons li').count()) >= 2) { await page.waitForTimeout(900); n++; await shot(`05_begruendung_${n}`); await page.waitForTimeout(3000); }
}
await page.click('.rt-root button:has-text("Pause")'); await page.waitForTimeout(400); await shot('06_pause');
await page.click('.rt-root button:has-text("Fortsetzen")');
await page.click('.rt-root button:has-text("Bis zum Ende springen")'); await page.waitForTimeout(900); await shot('07_bilanz');
await page.locator('.rt-lrow').nth(2).click(); await page.waitForTimeout(700); await shot('08_rueckblick');
await page.keyboard.press('Escape'); await page.waitForTimeout(600);
// Spielerprofil › Entwicklung
for (let k = 0; k < 4 && await page.locator('.modal-overlay').count(); k++) { await page.locator('.modal-overlay .modal-close, .modal-overlay button:has-text("Schließen")').first().click().catch(() => {}); await page.waitForTimeout(300); }
await page.locator('.hd-nav-item:has-text("Kader")').first().click(); await page.waitForTimeout(300);
await page.locator('.tn-sub-item:has-text("Übersicht")').first().click().catch(() => {}); await page.waitForTimeout(500);
await page.locator('.app-main tbody tr').nth(4).click().catch(() => {});
await page.waitForTimeout(500);
if (await page.locator('.pp-modal').count()) {
  await page.locator('.pp-tabs .tab:has-text("Entwicklung")').click(); await page.waitForTimeout(400);
  await page.screenshot({ path: `${outDir}/${prefix}_09_profil_entwicklung.png` });
  console.log('09_profil_entwicklung: ok');
} else console.log('Spielerprofil nicht geöffnet.');
console.log(errors.length ? errors.join('\n') : 'Keine JS-Fehler.');
await browser.close();
server.close();
