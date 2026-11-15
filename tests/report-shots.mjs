// Screenshots Spielbericht im Textmodus-Look (views/spieltag/report/TickerReport.tsx):
// bis zum nächsten eigenen Spiel, „Simulieren“, Bericht in 1920×1080 und 1366×768
// (Reiter Statistik/Aufstellungen/Einzelwerte, Ticker-Reiter Highlights/Tore),
// danach ein älteres Spiel aus Aufstellung › Spielplan (Rückfall = bisheriges Layout).
//   npm run build && node tests/report-shots.mjs [ordner]   (SAVE=… Standard: neues Spiel)
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { serveDist, loadSave } from './popup-probe.mjs';
import { startNewGame } from './newgame-flow.mjs';
import { walkToPrematch } from './prematch-walk.mjs';

const outDir = process.argv[2] || 'test-output/report';
await mkdir(outDir, { recursive: true });
const { server, url } = serveDist();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.setDefaultTimeout(8000);
const errors = [];
page.on('pageerror', (e) => errors.push('JS-Fehler: ' + e.message));
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
if (process.env.SAVE) await loadSave(page, url(), process.env.SAVE);
else { await page.goto(url()); await startNewGame(page); }

const shot = (n) => page.screenshot({ path: `${outDir}/${n}.png` });
const size = async () => page.locator('.mr-modal').first().evaluate((el) => `${Math.round(el.getBoundingClientRect().width)}×${Math.round(el.getBoundingClientRect().height)}`);
/** Bericht eines gespielten Spiels aus Aufstellung › Spielplan öffnen (nth = welcher „Bericht“). */
async function fromFixtures(name, nth = 0) {
  await page.keyboard.press('Escape').catch(() => {});
  await page.locator('.hd-nav-item:has-text("Aufstellung")').click();
  await page.locator('.tn-sub-item:has-text("Spielplan")').click();
  await page.waitForTimeout(600);
  const all = page.locator('.app-main .dchip:has-text("Bericht")');
  const b = nth < 0 ? all.last() : all.nth(nth);
  if (!(await b.isVisible().catch(() => false))) { console.log(`${name}: kein Bericht im Spielplan`); return; }
  await b.click();
  await page.waitForSelector('.mr-modal', { timeout: 8000 });
  await page.waitForTimeout(500);
  console.log(`${name}: ${(await page.locator('.mr2').isVisible()) ? 'Ticker-Bericht' : 'bisheriges Layout'}, Flaggen ${await page.locator('.mr-modal .cflag').count()}`);
  await shot(name);
  await page.locator('.mr-modal .modal-close').first().click();
  await page.waitForTimeout(300);
}
if (process.env.SAVE) await fromFixtures('00_alt_spielplan');
// COMP=Europa|Pokal: so lange eigene Spiele simulieren (höchstens 15), bis der Wettbewerb passt.
const want = process.env.COMP ? new RegExp(process.env.COMP, 'i') : null;
for (let n = 0; ; n++) {
  await walkToPrematch(page, 'Nächstes eigenes Spiel', 200);
  await page.click('.pm-go-btn:has-text("Simulieren")');
  await page.waitForSelector('.mr-modal', { timeout: 15000 });
  await page.waitForTimeout(700);
  const comp = await page.locator('.mr-modal .tm-comp, .mr-modal .mr-comp').first().innerText().catch(() => '');
  if (!want || want.test(comp) || n >= 14) { console.log(`Bericht: ${comp.replace(/\s+/g, ' ')}`); break; }
  await page.locator('.mr-modal .modal-close').first().click();
  await page.waitForTimeout(300);
}
const isNew = await page.locator('.mr2').isVisible();
console.log(isNew ? 'Neuer Bericht (Ticker)' : 'Bisheriges Layout');
const sizes = [await size()];
await shot('01_bericht');
if (isNew) {
  const lines = await page.locator('.mr2 .tm-tk-row').count();
  console.log(`Ticker-Szenen: ${lines}, Flaggen: ${await page.locator('.mr2 .cflag').count()}`);
  await page.click('.mr2-side .tm-tabs button:has-text("Aufstellungen")');
  sizes.push(await size());
  await page.click('.mr2 .tm-ticker .tm-tabs button:has-text("Highlights")');
  await page.waitForTimeout(300);
  await shot('02_aufstellungen_highlights');
  await page.click('.mr2-side .tm-tabs button:has-text("Einzelwerte")').catch(() => {});
  await page.click('.mr2 .tm-ticker .tm-tabs button:has-text("Tore")');
  sizes.push(await size());
  await page.waitForTimeout(300);
  await shot('03_einzelwerte_tore');
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.click('.mr2-side .tm-tabs button:has-text("Statistik")');
  await page.click('.mr2 .tm-ticker .tm-tabs button:has-text("Alles")');
  await page.waitForTimeout(500);
  await shot('04_bericht_1366');
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.waitForTimeout(300);
}
// Danach aus dem Spielplan: das eben simulierte Spiel hat den Ticker gespeichert
await page.locator('.mr-modal .modal-close').first().click().catch(() => {});
await page.waitForTimeout(400);
await fromFixtures('05_spielplan_letztes', -1);
console.log(`Fenstergröße je Reiter: ${sizes.join(', ')}${new Set(sizes).size > 1 ? ' – ÄNDERT SICH' : ' (fest)'}`);
console.log(errors.length ? errors.join('\n') : 'Keine Fehler.');
await browser.close();
server.close();
process.exit(errors.length ? 1 : 0);
