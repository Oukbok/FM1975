// Screenshots Weltpokal/Klub-WM und andere Kontinente (Wunsch Pascal):
//   node scripts/run-ts.mjs tests/continents-prep.ts test-output/continents && npm run build && node tests/continents-shots.mjs [ordner]
//   1) Statistiken › International › Welt (Klub-WM 2009/10 mit deinem Verein, Weltpokal, Südamerika-Pokal)
//   2) Länderprofil Brasilien (Übersicht + Ligen)
//   3) Vorschau „Nächstes Spiel“ Weltpokal 1985 gegen den Sieger Südamerikas
//   VIEW=1366x768 für eine andere Größe. Prüft JS-Fehler und Boxen, die aus der Seite ragen.
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { serveDist, loadSave, closeAll } from './popup-probe.mjs';
import { walkToPrematch } from './prematch-walk.mjs';
import { pickOption } from './select3.mjs';

const outDir = process.argv[2] || 'test-output/continents';
await mkdir(outDir, { recursive: true });
const [W, H] = (process.env.VIEW || '1920x1080').split('x').map(Number);
const { server, url } = serveDist();
const browser = await chromium.launch();
const errors = [];
const page = await browser.newPage({ viewport: { width: W, height: H } });
page.on('pageerror', (e) => errors.push(`JS-Fehler: ${e.message}`));
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());

async function overflow(name) {
  const bad = await page.evaluate(() => [...document.querySelectorAll('.app-main .dbox')].filter((b) => {
    const r = b.getBoundingClientRect();
    return r.bottom > window.innerHeight + 1 || r.right > window.innerWidth + 1;
  }).map((b) => b.querySelector('.dxh-title')?.textContent ?? '?'));
  for (const b of bad) errors.push(`${name}: Box „${b}“ ragt aus der Seite`);
}

// 1) Statistiken › International › Welt
await loadSave(page, url(), `${outDir}/cwc-2009.txt`);
await closeAll(page);
await page.locator('.hd-nav-item:has-text("Statistiken")').first().click();
await page.locator('.tn-sub-item:has-text("International")').first().click();
await page.waitForTimeout(500);
await page.locator('.sub3-tabs .tab:has-text("Welt")').first().click();
await page.waitForTimeout(600);
await page.screenshot({ path: `${outDir}/welt_${W}_klubwm.png` });
await overflow('Klub-WM');
for (const [label, file] of [['wp', 'weltpokal'], ['sa', 'suedamerika'], ['af', 'afrika']]) {
  await pickOption(page, page.locator('.wcx-comp').first(), label).catch((e) => errors.push(`Wettbewerb ${label}: ${e.message}`));
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${outDir}/welt_${W}_${file}.png` });
  await overflow(label);
}

// 2) Länderprofil Brasilien
await page.evaluate(() => {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('class', 'cflag'); s.setAttribute('data-country', 'Brasilien'); s.setAttribute('width', '30'); s.setAttribute('height', '20');
  s.style.cssText = 'position:fixed;left:0;top:0;z-index:5'; s.id = 'probe-flag';
  document.body.appendChild(s);
});
await page.locator('#probe-flag').click({ force: true });
await page.evaluate(() => document.getElementById('probe-flag')?.remove());
if (await page.waitForSelector('.cnx-modal', { timeout: 5000 }).then(() => true).catch(() => false)) {
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${outDir}/land_${W}_brasilien_1.png` });
  await page.locator('.cnx-modal .cmx-tabs .tab:has-text("Ligen")').first().click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${outDir}/land_${W}_brasilien_2.png` });
  await page.keyboard.press('Escape');
} else errors.push('Länderprofil Brasilien öffnet nicht');

// 3) Vorschau Weltpokal 1985
await loadSave(page, url(), `${outDir}/wp-1985.txt`);
await walkToPrematch(page, 'Weltpokal 1985', 120, async (m) => { errors.push(m); });
if (await page.locator('.pm-root').first().isVisible().catch(() => false)) {
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${outDir}/vorschau_${W}_weltpokal.png` });
  const txt = await page.locator('.pm-root').innerText();
  if (!/Weltpokal/.test(txt)) errors.push('Vorschau: „Weltpokal“ fehlt');
} else errors.push('Vorschau Weltpokal nicht erreicht');

await browser.close();
server.close();
console.log(errors.length ? `\n${errors.length} Fehler:\n${errors.join('\n')}` : '\nScreenshots ohne Fehler.');
process.exit(errors.length ? 1 : 0);
