// Bildfolge der Saison-Auftakt-Animation + Inhaltsbereiche des Briefing-Fensters.
//   npm run build && node tests/intro-shots.mjs [ausgabeordner]
//   Spielbeginn 1975 (Neues Spiel). Mit SAVE=… einen Spielstand am Saisonende laden
//   und „Neue Saison“ klicken (Saisonwechsel mit Animation):
//     DUMP=test-output/intro/save.txt UNTIL=2100-01-01 node scripts/sim.mjs 19   (→ 1995/96)
//     SAVE=test-output/intro/save.txt PREFIX=s1995 node tests/intro-shots.mjs
// Die Animation wird über die Web-Animation-API angehalten und auf feste Zeitpunkte
// gesetzt; die Uhr der Seite (setTimeout) steuert Playwright (page.clock).
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { startNewGame } from './newgame-flow.mjs';

const outDir = process.argv[2] || 'test-output/intro';
const prefix = process.env.PREFIX || (process.env.SAVE ? 'wechsel' : 'start');
await mkdir(outDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
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
await page.clock.install({ time: new Date("2026-01-01T10:00:00Z") });
await page.goto(`http://127.0.0.1:${server.address().port}/`);
const shot = (n) => page.screenshot({ path: `${outDir}/${prefix}_${n}.png` });

if (process.env.SAVE) {
  const raw = await readFile(process.env.SAVE, 'utf8');
  await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
  await page.reload();
  await page.click('text=Spiel laden');
  await page.click('button:has-text("Laden") >> nth=0');
  await page.waitForSelector('.app-main');
  if (await page.locator('.si-root').count()) errors.push('Briefing beim Laden geöffnet');
  // Bis zum Saisonende weiterlaufen lassen, dann „Neue Saison“.
  // Popups unterwegs (Saison-Bewertung, Spielberichte) schließen, eigene Spiele schnell simulieren.
  for (let i = 0; i < 240 && !(await page.locator('.hd-continue.season').count()); i++) {
    const quick = page.locator('.pm-go-btn:has-text("Simulieren"), .hd-match-btns button').first();
    if (await quick.count()) { await quick.click().catch(() => {}); await page.waitForTimeout(300); }
    const close = page.locator('.modal-close, .rc-close, button:has-text("Schließen")').first();
    if (await close.count()) await close.click().catch(() => {});
    if (await quick.count()) await quick.click().catch(() => {});
    else if (!(await page.locator('.hd-continue.running').count())) await page.locator('.hd-continue').first().click().catch(() => {});
    await page.waitForTimeout(500);
  }
  await page.locator('.hd-continue.season').click();
} else {
  await startNewGame(page, { keepBriefing: true });
}

// 1) Bildfolge der Animation
await page.waitForSelector('.si-stage');
// Uhr der Seite anhalten, damit der automatische Übergang (setTimeout) nicht dazwischenkommt.
await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 50);
await page.waitForTimeout(300); // alle CSS-Animationen angelegt
for (const t of [250, 700, 1200, 1800, 2400, 3100, 3700, 4600]) {
  await page.evaluate((ms) => { for (const a of document.getAnimations()) { a.pause(); a.currentTime = ms; } }, t);
  await page.waitForTimeout(60);
  await shot(`anim_${String(t).padStart(4, '0')}`);
}
// Übergang: Uhr bis zum automatischen Ende laufen lassen.
await page.evaluate(() => { for (const a of document.getAnimations()) a.finish(); });
await page.clock.runFor(6300);
await page.waitForTimeout(50);
await page.evaluate(() => { for (const a of document.getAnimations()) { a.pause(); a.currentTime = 200; } });
await shot('anim_9_uebergang');
await page.clock.runFor(600);
await page.evaluate(() => { for (const a of document.getAnimations()) a.finish(); });
await page.waitForSelector('.si-window .bf-continue');
if (await page.locator('.si-stage').count()) errors.push(`${prefix}: Bühne nach Ablauf noch da`);

// 2) Inhalt: alle Reiter
const n = await page.locator('.si-window .bf-tabs .tab').count();
for (let i = 0; i < n; i++) {
  await page.locator('.si-window .bf-tabs .tab').nth(i).click();
  await page.evaluate(() => { for (const a of document.getAnimations()) a.finish(); });
  const label = (await page.locator('.si-window .bf-tabs .tab').nth(i).innerText()).replace(/\d+/g, '').trim().replace(/[^A-Za-zÄÖÜäöü]+/g, '_');
  await shot(`tab_${i}_${label}`);
}
const over = await page.evaluate(() => { const b = document.querySelector('.si-body'); return b ? b.scrollWidth - b.clientWidth : 0; });
if (over > 2) errors.push(`${prefix}: waagerechter Überlauf ${over}px`);

// 3) Leertaste darf die Zeit nicht starten; Direktsprung aus einer Aufgabe
await page.keyboard.press('Space');
if (!(await page.locator('.si-window').count())) errors.push(`${prefix}: Leertaste schließt das Fenster`);
await page.locator('.si-window .bf-tabs .tab').first().click();
const jump = page.locator('.si-ov-tasks .si-jump').first();
if (await jump.count()) {
  const where = await jump.innerText();
  await jump.click();
  await page.waitForTimeout(200);
  if (await page.locator('.si-root').count()) errors.push(`${prefix}: Sprung „${where}“ schließt das Fenster nicht`);
  await shot('sprung_ziel');
} else {
  await page.locator('.si-window .bf-continue').click();
}
console.log(errors.length ? errors.join('\n') : `Auftakt-Screenshots (${prefix}) ohne Fehler`);
await browser.close();
server.close();
process.exit(errors.length ? 1 : 0);
