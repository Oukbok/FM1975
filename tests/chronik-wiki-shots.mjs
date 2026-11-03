// Screenshots Chronik im Wiki: Kapitel „Chronik der Epochen“, Suche über Meilensteine, Verweis
// „Im Wiki:“, Sprung ins große Fenster und zurück; 1920×1080 + 1366×768.
//   npm run build && node tests/chronik-wiki-shots.mjs [ordner]   (SAVE=…, Standard Vorlage „Test 3 Jahre“)
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { serveDist, loadSave } from './popup-probe.mjs';

const outDir = process.argv[2] || 'test-output/chronik-wiki';
await mkdir(outDir, { recursive: true });
const { server, url } = serveDist();
const browser = await chromium.launch();
const errors = [];
for (const [w, h] of [[1920, 1080], [1366, 768]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  page.on('pageerror', (e) => errors.push(`${w}: JS-Fehler: ${e.message}`));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await loadSave(page, url(), process.env.SAVE || 'public/saves/test-3-jahre.txt');
  for (let i = 0; i < 3 && await page.locator('.bf-continue').count(); i++) { await page.locator('.bf-continue').click(); await page.waitForTimeout(200); }
  const shot = async (n) => { await page.waitForTimeout(350); await page.screenshot({ path: `${outDir}/${w}_${n}.png` }); };
  await page.locator('.hd-gear').click();
  await page.locator('.menu-dd-item:has-text("Wiki")').click();
  await page.waitForSelector('.wiki-search-d');
  await page.locator('.dchip:has-text("Chronik")').first().click();
  await page.locator('.dmsg:has-text("Chronik der Epochen")').first().click();
  await page.waitForSelector('.chw');
  await shot('1_kapitel');
  await page.fill('.wiki-search-d', 'Bosman');
  await page.locator('.dmsg:has-text("Chronik der Epochen")').first().click();
  await shot('2_suche_bosman');
  const n = await page.locator('.chw .chm-row').count();
  if (n < 1) errors.push(`${w}: Suche „Bosman“ findet keinen Meilenstein`);
  const link = page.locator('.chw-link').first();
  if (await link.count()) {
    const t = await link.innerText();
    await link.click();
    await page.waitForTimeout(300);
    const title = await page.locator('.dbox-title, .dbox h3, .dbox-head').nth(1).innerText().catch(() => '');
    console.log(`${w}: Verweis „${t}“ → Artikel „${title.split('\n')[0]}“`);
    await shot('3_verweis');
  } else errors.push(`${w}: kein Wiki-Verweis beim Bosman-Urteil`);
  await page.fill('.wiki-search-d', '');
  await page.locator('.dmsg:has-text("Chronik der Epochen")').first().click();
  await page.locator('.chw .dchip:has-text("Große Chronik")').click();
  await page.waitForSelector('.chm-modal');
  await shot('4_fenster');
  await page.locator('.chm-modal .dchip:has-text("Im Wiki")').click();
  await page.waitForTimeout(400);
  if (await page.locator('.chm-modal').count()) errors.push(`${w}: Fenster bleibt nach „Im Wiki“ offen`);
  if (!(await page.locator('.chw').count())) errors.push(`${w}: „Im Wiki“ öffnet das Kapitel nicht`);
  await shot('5_zurueck_im_wiki');
  await page.close();
}
await browser.close();
server.close();
console.log(errors.length ? errors.join('\n') : 'Keine Fehler.');
process.exit(errors.length ? 1 : 0);
