// Screenshots Kalender-Overlay (src/shell/CalendarOverlay.tsx):
//   node tests/calendar-shots.mjs [ordner]   (mit SAVE=… für spätere Epochen)
// Seiten ohne Streifen (Zentrale, Kader, Tabelle, Stadion), Overlay mitten im Zeitlauf,
// Bildfolge (frames/) + Video des Weitergleitens, Zustand nach dem Stopp, Spieltag mit Wappen.
import { createServer } from 'node:http';
import { readFile, mkdir, rm, rename } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { startNewGame } from './newgame-flow.mjs';

const outDir = process.argv[2] || 'test-output/calendar';
await rm(`${outDir}/frames`, { recursive: true, force: true });
await mkdir(`${outDir}/frames`, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(join('dist', path))); }
  catch { res.writeHead(404).end(); }
}).listen(0);
const url = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch();
// Video des Zeitlaufs (webm) nach `${outDir}/zeitlauf.webm`.
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, recordVideo: { dir: `${outDir}/video`, size: { width: 960, height: 540 } } });
const page = await context.newPage();
await page.addInitScript(() => {
  let a = 1975;
  Math.random = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
});
const errors = [];
page.on('pageerror', (e) => errors.push('JS-Fehler: ' + e.message));
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
await page.goto(url);
if (process.env.SAVE) {
  const raw = await readFile(process.env.SAVE, 'utf8');
  await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
  await page.reload();
  await page.click('text=Spiel laden');
  await page.click('button:has-text("Laden") >> nth=0');
  await page.waitForTimeout(1500);
} else {
  await startNewGame(page, { speed: process.env.SPEED || '700' });
  await page.waitForTimeout(800);
}
const shot = (n) => page.screenshot({ path: `${outDir}/${n}.png` });
const go = async (cat, sub) => {
  await page.locator('.hd-nav-item', { hasText: cat }).first().click();
  if (sub) await page.locator('.tn-sub-item', { hasText: sub }).first().click();
  await page.waitForTimeout(350);
};

// 1) Seiten ohne Streifen
await go('Zentrale'); await shot('01_zentrale');
await go('Kader'); await shot('02_kader');
await go('Statistiken', 'Liga'); await shot('03_tabelle');
await go('Verein', 'Stadion'); await shot('04_stadion');
if (await page.locator('.kbstrip').count()) errors.push('Kalenderstreifen noch sichtbar');

// 2) Zeit laufen lassen: Overlay mitten im Zeitlauf, Pause über den Knopf (liegt über dem Overlay)
await go('Zentrale');
const btn = page.locator('.hd-continue').first();
await btn.click();
await page.waitForSelector('.co-root.is-on', { timeout: 4000 });
await page.waitForTimeout(500);
const label = await btn.innerText();
await shot('05_zeitlauf');
let pausedByBtn = false;
for (let k = 0; k < 3 && !pausedByBtn; k++) {
  if (!(await page.locator('.co-root.is-on').count())) {
    await page.keyboard.press('Space');
    await page.waitForSelector('.co-root.is-on', { timeout: 3000 }).catch(() => {});
  }
  if (await page.locator('.co-root.is-on').count()) {
    // Knopf muss oben liegen (nicht vom Overlay verdeckt); Klick ohne Stabilitätsprüfung,
    // weil Chromium ohne GPU während des Zeitlaufs nur wenige Bilder je Sekunde zeichnet.
    const onTop = await btn.evaluate((el) => { const r = el.getBoundingClientRect(); const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return !!hit && el.contains(hit); });
    if (!onTop) errors.push('Weiter/Pause-Knopf ist vom Overlay verdeckt');
    pausedByBtn = onTop && await btn.click({ force: true, timeout: 3000 }).then(() => true, () => false);
  }
}
await page.waitForTimeout(600);
await shot('06_nach_stopp');
const left = await page.locator('.co-root').count();

// 3) Leertaste startet, Bildfolge des Weitergleitens (volle Aufnahmen; das Video zeigt es flüssiger),
//    Klick auf den Hintergrund hält an.
await page.keyboard.press('Space');
await page.waitForSelector('.co-root.is-on', { timeout: 4000 }).catch(() => {});
for (let i = 0; i < 6; i++) {
  if (!(await page.locator('.co-root.is-on').count())) break;
  await page.screenshot({ path: `${outDir}/frames/f${String(i).padStart(2, '0')}.jpg`, type: 'jpeg', quality: 70 });
}
if (await page.locator('.co-root.is-on').count()) await page.mouse.click(960, 950);
await page.waitForTimeout(600);
const afterClick = await page.locator('.co-root').count();
await shot('07_nach_klick');

// 5) Weiterlaufen, bis ein eigenes Spiel im Streifen steht (Wappen, Heim/Auswärts),
//    danach bis ein gespieltes Spiel links mit Ergebnis erscheint.
const advanceUntil = async (sel, name, maxMs) => {
  const until = Date.now() + maxMs;
  while (Date.now() < until) {
    if (await page.locator(sel).count()) { await page.waitForTimeout(700); await shot(name); return true; }
    const lbl = (await btn.innerText().catch(() => '')).trim().toLowerCase();
    if (await page.locator('.hd-match-btns').count()) { await page.click('.hd-match-btns button:has-text("Schnell simulieren")'); await page.waitForTimeout(300); }
    for (const sel2 of ['.modal-close', 'button:has-text("Schließen")', 'button:has-text("Weiter zum")', 'button:has-text("OK")']) {
      const b = page.locator(sel2).first();
      if (await b.isVisible().catch(() => false)) await b.click().catch(() => {});
    }
    await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
    if (lbl === 'weiter' && !(await page.locator('.co-root').count())) await btn.click().catch(() => {});
    await page.waitForTimeout(400);
  }
  return false;
};
const sawMatch = await advanceUntil('.co-root.is-on .co-card[data-off="2"] .co-match', '08_spiel_im_streifen', 90000);
const sawResult = await advanceUntil('.co-root.is-on .co-card[data-off="-1"] .co-res', '09_ergebnis_links', 90000);
const label2 = (await btn.innerText()).trim();
if (label2 === 'PAUSE' || label2.toLowerCase() === 'pause') await btn.click();

const video = page.video();
await context.close();
if (video) await rename(await video.path(), `${outDir}/zeitlauf.webm`).catch(() => {});
console.log(`Knopf im Lauf: ${label.trim()} · per Knopf angehalten: ${pausedByBtn} · Overlay nach Pause: ${left} · nach Klick: ${afterClick} · Spiel im Streifen: ${sawMatch} · Ergebnis: ${sawResult}`);
console.log(errors.length ? errors.join('\n') : 'Keine JS-Fehler.');
await browser.close();
server.close();
process.exit(errors.length || left || afterClick || !pausedByBtn ? 1 : 0);
