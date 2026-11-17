// Screenshots Leihen (Wunsch Pascal): Transfers › Leihen (drei Reiter), Verhandlungstisch
// Leihe vor/nach einer Runde, Spielerprofil mit Leihknopf, Rechtsklick-Menü.
//   npm run build && node tests/loan-shots.mjs [ordner]     (SAVE=…, VIEW=1366x768)
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { serveDist, loadSave, closeAll } from './popup-probe.mjs';

const outDir = process.argv[2] || 'test-output/loans';
await mkdir(outDir, { recursive: true });
const { server, url } = serveDist();
const SAVE = process.env.SAVE || 'public/saves/test-3-jahre.txt';
const [W, H] = (process.env.VIEW || '1920x1080').split('x').map(Number);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
await loadSave(page, url(), SAVE);
await closeAll(page);
const shot = (n) => page.screenshot({ path: `${outDir}/${W}_${n}.png` });
const nav = async (main, sub) => {
  await closeAll(page);
  await page.locator(`.hd-nav-item:has-text("${main}")`).first().click();
  await page.waitForTimeout(250);
  if (sub) { await page.locator(`.tn-sub-item:has-text("${sub}")`).first().click(); await page.waitForTimeout(500); }
};
await nav('Transfers', 'Leihen');
await shot('1-ausgeliehen');
await page.locator('.app-main button:has-text("Leihe anfragen"):not([disabled])').first().click();
await page.waitForSelector('.vt-root', { timeout: 4000 });
await page.waitForTimeout(400);
await shot('2-tisch');
await page.locator('.vt-root .vt-send').click();
await page.waitForTimeout(400);
await shot('3-tisch-runde');
for (let i = 0; i < 6; i++) {
  const adopt = page.locator('.vt-root button:has-text("Gegenvorschlag übernehmen")');
  if (!(await adopt.count())) break;
  await adopt.click(); await page.waitForTimeout(150);
  await page.locator('.vt-root .vt-send').click(); await page.waitForTimeout(300);
}
await shot('4-tisch-ende');
await closeAll(page);
// eigenen Spieler zur Leihe anbieten (Rechtsklick)
await nav('Kader', 'Übersicht');
await page.locator('.app-main tbody tr[data-pid]').nth(18).click({ button: 'right' });
await page.waitForTimeout(300);
await shot('5-kontextmenue');
await page.locator('.pcm-item:has-text("Zur Leihe anbieten")').first().click().catch(() => {});
await nav('Transfers', 'Leihen');
await page.locator('.sub3-tabs button:has-text("Verliehen"), .sub3 button:has-text("Verliehen")').first().click().catch(() => {});
await page.waitForTimeout(400);
await shot('6-verliehen');
await page.locator('.sub3-tabs button:has-text("Angebote"), .sub3 button:has-text("Angebote")').first().click().catch(() => {});
await page.waitForTimeout(400);
await shot('7-angebote');
// Profil eines fremden Spielers mit Leihknopf
await nav('Transfers', 'Leihen');
await page.locator('.sub3-tabs button:has-text("Ausgeliehen"), .sub3 button:has-text("Ausgeliehen")').first().click().catch(() => {});
await page.waitForTimeout(300);
await page.locator('.app-main .player-link').nth(2).click().catch(() => {});
await page.waitForTimeout(600);
await page.locator('.pp3-act[aria-label*="Leihe"]').first().hover().catch(() => {});
await page.waitForTimeout(300);
await shot('8-profil');
console.log(errors.length ? `JS-Fehler:\n${errors.join('\n')}` : 'keine JS-Fehler');
await browser.close();
server.close();
