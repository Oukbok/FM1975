// Screenshots Scouting 2.0 (Wunsch Pascal): Transfers › Scouting (Aufträge, Software & Abos,
// Scouts im Ausland) und Jugend › Jugendcamps – nach Abo/Kauf, Reise und Camp-Bau.
// Prüft Seiten-Überlauf (Seite scrollt nie) und JS-Fehler.
//   npm run build && node tests/scouting-shots.mjs [ordner]     (SAVE=…, VIEW=1366x768, PREFIX=…)
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { serveDist, loadSave, closeAll } from './popup-probe.mjs';
import { pickOption } from './select3.mjs';

const outDir = process.argv[2] || 'test-output/scouting';
await mkdir(outDir, { recursive: true });
const { server, url } = serveDist();
const SAVE = process.env.SAVE || 'public/saves/liga1-2025.txt';
const PREFIX = process.env.PREFIX || '';
const [W, H] = (process.env.VIEW || '1920x1080').split('x').map(Number);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
await loadSave(page, url(), SAVE);
await closeAll(page);
const shot = (n) => page.screenshot({ path: `${outDir}/${PREFIX}${W}_${n}.png` });
const nav = async (main, sub) => {
  await closeAll(page);
  await page.locator(`.hd-nav-item:has-text("${main}")`).first().click();
  await page.waitForTimeout(250);
  if (sub) { await page.locator(`.tn-sub-item:has-text("${sub}")`).first().click(); await page.waitForTimeout(600); }
};
const tab = async (label) => { await page.locator(`.sub3-tabs button:has-text("${label}")`).first().click(); await page.waitForTimeout(400); };
/** Überlauf: Seite darf nicht scrollen, Boxen nicht über den Hauptbereich ragen. */
const overflow = async (name) => {
  const r = await page.evaluate(() => {
    const main = document.querySelector('.app-main');
    if (!main) return 'kein .app-main';
    const mb = main.getBoundingClientRect();
    const bad = [...main.querySelectorAll('.dbox')].filter((b) => { const r = b.getBoundingClientRect(); return r.bottom > mb.bottom + 2 || r.right > mb.right + 2; }).length;
    const doc = document.scrollingElement;
    return `${bad ? `${bad} Box(en) ragen hinaus` : ''}${doc && doc.scrollHeight > doc.clientHeight + 2 ? ' Seite scrollt' : ''}`.trim();
  });
  if (r) errors.push(`${name}: ${r}`);
};

await nav('Transfermarkt', 'Scouting');
await tab('Software');
await shot('1-software');
await overflow('software');
for (const label of ['Abonnieren', 'Kaufen']) {
  const b = page.locator(`.app-main button:has-text("${label}"):not([disabled])`).first();
  if (await b.count()) { await b.click(); await page.waitForTimeout(300); }
}
await shot('2-software-gekauft');
await overflow('software-gekauft');
await tab('Ausland');
await shot('3-ausland');
const go = page.locator('.app-main button:has-text("Reise starten"):not([disabled])');
if (await go.count()) { await go.click(); await page.waitForTimeout(300); }
await shot('4-ausland-reise');
await overflow('ausland');
await page.locator('.app-main .sel3').first().click().catch(() => {});
await page.waitForTimeout(300);
await shot('5-ausland-laender');
await page.keyboard.press('Escape');
await tab('Aufträge');
await shot('6-auftraege');
await overflow('auftraege');

await nav('Jugend', 'Jugendcamps');
await shot('7-camps');
await overflow('camps');
const site = page.locator('.ycm-site.open .ycm-dot').nth(2);
if (await site.count()) { await site.click(); await page.waitForTimeout(300); }
const build = page.locator('.app-main button:has-text("Bauen"):not([disabled])').first();
if (await build.count()) { await build.click(); await page.waitForTimeout(300); }
await shot('8-camps-bau');
await overflow('camps-bau');
void pickOption;
console.log(errors.length ? `Fehler:\n${errors.join('\n')}` : 'keine JS-Fehler, kein Überlauf');
await browser.close();
server.close();
