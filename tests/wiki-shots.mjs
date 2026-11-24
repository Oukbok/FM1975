// Screenshots Wiki (Kapitel-Akkordeon + einheitliche Artikel-Typografie): Kalender & Aktivitäten,
// Europapokal, Suche, Verweis aus der Chronik; prüft Seiten-/Box-Überlauf. 1920×1080 + 1366×768.
//   npm run build && node tests/wiki-shots.mjs [ordner]   (SAVE=…, Standard Vorlage „Test 3 Jahre“)
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { serveDist, loadSave } from './popup-probe.mjs';

const outDir = process.argv[2] || 'test-output/wiki';
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
  const shot = async (n) => { await page.waitForTimeout(300); await page.screenshot({ path: `${outDir}/${w}_${n}.png` }); };
  const check = async (n) => {
    const r = await page.evaluate(() => {
      const nav = document.querySelector('.wk-acc'), body = document.querySelector('.wk-article .dbox-body');
      const page = document.querySelector('.wk-page');
      const p = document.querySelector('.wk-article .wiki-p');
      return {
        navScroll: nav ? nav.scrollHeight > nav.clientHeight + 1 && getComputedStyle(nav).overflowY : null,
        pageOver: page ? page.scrollHeight > page.clientHeight + 2 : null,
        pFont: p ? getComputedStyle(p).fontSize : null,
        open: [...document.querySelectorAll('.wk-cat.open .wk-cat-title')].map((e) => e.textContent),
        sel: document.querySelector('.wk-art.sel')?.textContent ?? null,
        bodyScroll: body ? getComputedStyle(body).overflowY : null,
      };
    });
    console.log(`${w} ${n}:`, JSON.stringify(r));
    if (r.pageOver) errors.push(`${w} ${n}: Seite läuft über`);
    return r;
  };
  await page.locator('.hd-gear').click();
  await page.locator('.menu-dd-item:has-text("Wiki")').click();
  await page.waitForSelector('.wk-acc');
  await shot('1_start'); await check('start');

  await page.locator('.wk-cat-head:has-text("Kalender & Aktivitäten")').click();
  await page.locator('.wk-art:has-text("Kalender & planbare Aktivitäten")').click();
  await shot('2_kalender'); await check('kalender');

  await page.locator('.wk-cat-head:has-text("Europapokal")').click();
  await page.locator('.wk-art:has-text("Europapokal — Die Wettbewerbe")').click();
  await shot('3_europapokal'); await check('europapokal');

  // Viele Kapitel offen → Liste muss in der Box scrollen
  for (const t of ['Grundlagen', 'Kader & Spieler', 'Finanzen', 'Match-Engine']) await page.locator(`.wk-cat-head:has-text("${t}")`).first().click();
  await shot('4_viele_offen');
  const r = await check('viele offen');
  if (r.navScroll !== 'auto') errors.push(`${w}: Kapitelliste scrollt nicht (${r.navScroll})`);

  await page.fill('.wiki-search-d', 'Auswärtstor');
  await shot('5_suche'); await check('suche');
  if (!(await page.locator('.wk-cat.open').count())) errors.push(`${w}: Suche klappt kein Kapitel auf`);

  // Verweis aus der Chronik öffnet den Artikel samt Kapitel
  await page.fill('.wiki-search-d', 'Bosman');
  await page.locator('.wk-art:has-text("Chronik der Epochen")').first().click();
  await page.waitForSelector('.chw');
  const link = page.locator('.chw-link').first();
  if (await link.count()) {
    const t = (await link.innerText()).trim();
    await link.click();
    const v = await check('verweis');
    if (!v.sel) errors.push(`${w}: Verweis „${t}“ markiert keinen Artikel links`);
    await shot('6_verweis');
  } else errors.push(`${w}: kein Wiki-Verweis beim Bosman-Urteil`);
  await page.close();
}
await browser.close();
server.close();
console.log(errors.length ? errors.join('\n') : 'Keine Fehler.');
process.exit(errors.length ? 1 : 0);
