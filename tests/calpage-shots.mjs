// Screenshots der Kalenderseite (Zentrale › Kalender): Raster und Liste, aktueller Monat
// und Folgemonate, 1920×1080 + 1366×768; prüft Klick → Seite und dass die Box nicht wächst.
//   npm run build && node tests/calpage-shots.mjs [ordner] [präfix]   (SAVE=…, Standard Vorlage „Test 3 Jahre“)
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { serveDist, loadSave } from './popup-probe.mjs';

const outDir = process.argv[2] || 'test-output/kalender';
const prefix = process.argv[3] || 'kal';
await mkdir(outDir, { recursive: true });
const { server, url } = serveDist();
const browser = await chromium.launch();
const errors = [];
for (const [w, h] of [[1920, 1080], [1366, 768]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  page.on('pageerror', (e) => errors.push(`${w}: JS-Fehler: ${e.message}`));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.addInitScript(() => { try { localStorage.removeItem('fm1975.calendarMode'); } catch { /* */ } });
  await loadSave(page, url(), process.env.SAVE || 'public/saves/test-3-jahre.txt');
  for (let i = 0; i < 3 && await page.locator('.bf-continue').count(); i++) { await page.locator('.bf-continue').click(); await page.waitForTimeout(200); }
  await page.locator('.hd-nav-item:has-text("Zentrale")').first().click();
  await page.locator('.tn-sub-item:has-text("Kalender")').first().click();
  await page.waitForSelector('.calm-grid');
  const box = () => page.evaluate(() => { const b = document.querySelector('.app-main .dbox'); const r = b?.getBoundingClientRect(); return r ? `${Math.round(r.width)}×${Math.round(r.height)}` : ''; });
  const size0 = await box();
  const shot = async (n) => { await page.waitForTimeout(250); await page.screenshot({ path: `${outDir}/${prefix}_${w}_${n}.png` }); };
  await shot('raster');
  await page.locator('.dchip:has-text("Liste")').click();
  await page.waitForSelector('.calm-list, .dbox .empty, .dempty', { timeout: 3000 }).catch(() => {});
  if (await box() !== size0) errors.push(`${w}: Box ändert die Größe Raster → Liste (${size0} → ${await box()})`);
  await shot('liste');
  for (let m = 1; m <= 2; m++) { await page.locator('.dchip:has-text("Folgemonat")').click(); await shot(`liste_plus${m}`); }
  await page.locator('.dchip:has-text("Raster")').click();
  await shot('raster_plus2');
  // Klick auf einen Termin → Seite
  await page.locator('.dchip:has-text("Heute")').click();
  await page.locator('.dchip:has-text("Liste")').click();
  const row = page.locator('.calm-row.clickable').first();
  if (await row.count()) {
    const label = (await row.innerText()).replace(/\s+/g, ' ').slice(0, 60);
    await row.click();
    await page.waitForTimeout(400);
    const active = await page.locator('.tn-sub-item.active').first().innerText().catch(() => '?');
    console.log(`${w}: Klick „${label}“ → ${active}`);
    if (await page.locator('.calm-list').count()) errors.push(`${w}: Klick auf Termin bleibt auf dem Kalender`);
  }
  await page.close();
}
await browser.close();
server.close();
console.log(errors.length ? errors.join('\n') : 'Keine Fehler.');
process.exit(errors.length ? 1 : 0);
