// Screenshots Länderprofil (components/country/): Flagge klicken, alle Reiter, mehrere Länder
// (Heimatland, Ausland mit Liga, DDR, Land ohne Liga). Prüft feste Fenstergröße je Reiter,
// leere Boxen ohne „keine Daten“ und JS-Fehler.
//   npm run build && node tests/country-shots.mjs [ordner] [präfix]
//   SAVE=… (Standard public/saves/test-20-jahre.txt), VIEW=1366x768 für nur eine Größe,
//   LAND=England,Brasilien für eigene Länder (Flaggen-Schlüssel aus data/countryFlags.ts).
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { serveDist, loadSave, closeAll } from './popup-probe.mjs';

const outDir = process.argv[2] || 'test-output/country';
const prefix = process.argv[3] || 'land';
await mkdir(outDir, { recursive: true });
const SAVE = process.env.SAVE || 'public/saves/test-20-jahre.txt';
const VIEWS = process.env.VIEW ? [process.env.VIEW] : ['1920x1080', '1366x768'];
const LANDS = process.env.LAND ? process.env.LAND.split(',') : ['Deutschland', 'England', 'DDR', 'Brasilien', 'Sowjetunion'];
const TABS = ['Übersicht', 'Länderspiele', 'Nationalkader', 'Ligen', 'Ligensystem'];
const { server, url } = serveDist();
const browser = await chromium.launch();
const errors = [];

for (const view of VIEWS) {
  const [W, H] = view.split('x').map(Number);
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  page.on('pageerror', (e) => errors.push(`${view} JS-Fehler: ${e.message}`));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await loadSave(page, url(), SAVE);
  await closeAll(page);

  // 1) Echte Flagge: Statistiken › Nationalteams, Rangliste → dritte Flagge.
  await page.locator('.hd-nav-item:has-text("Statistiken")').first().click();
  await page.locator('.tn-sub-item:has-text("Nationalteams")').first().click();
  await page.waitForTimeout(500);
  await page.locator('.app-main .dchip:has-text("Rangliste")').first().click().catch(() => {});
  await page.waitForTimeout(200);
  const flag = page.locator('.app-main .nt-prow .cflag[data-country]').nth(2);
  if (await flag.count()) {
    await flag.click();
    await page.waitForSelector('.cnx-modal', { timeout: 5000 }).catch(() => errors.push(`${view}: Flagge in der Rangliste öffnet kein Länderprofil`));
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${outDir}/${prefix}_${W}_flagge.png` });
    // Klick auf eine Flagge im Profil (Länderspiele: Gegner) stapelt ein weiteres Land.
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  } else errors.push(`${view}: keine Flagge in der Rangliste gefunden`);
  if (await page.locator('.cnx-modal').count()) errors.push(`${view}: Escape schließt das Länderprofil nicht`);

  // 2) Länder über eine eingefügte Flagge öffnen (gleicher Weg wie jede Flagge im Spiel).
  for (const land of LANDS) {
    await page.evaluate((k) => {
      const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      s.setAttribute('class', 'cflag'); s.setAttribute('data-country', k); s.setAttribute('width', '30'); s.setAttribute('height', '20');
      s.style.cssText = 'position:fixed;left:0;top:0;z-index:5';
      s.id = 'probe-flag';
      document.body.appendChild(s);
    }, land);
    await page.locator('#probe-flag').click({ force: true });
    await page.evaluate(() => document.getElementById('probe-flag')?.remove());
    const ok = await page.waitForSelector('.cnx-modal', { timeout: 5000 }).then(() => true).catch(() => false);
    if (!ok) { errors.push(`${view} ${land}: Länderprofil öffnet nicht`); continue; }
    let base = null;
    for (const t of TABS) {
      await page.locator(`.cnx-modal .cmx-tabs .tab:has-text("${t}")`).first().click();
      await page.waitForTimeout(350);
      const r = await page.evaluate(() => { const m = document.querySelector('.cnx-modal').getBoundingClientRect(); return `${Math.round(m.width)}×${Math.round(m.height)}`; });
      base ??= r;
      if (r !== base) errors.push(`${view} ${land} › ${t}: Fenster ${r} statt ${base}`);
      // Boxen dürfen nicht über das Fenster hinausragen; leere Boxen brauchen einen Hinweis.
      const bad = await page.evaluate(() => {
        const body = document.querySelector('.cnx-modal .mx-body').getBoundingClientRect();
        return [...document.querySelectorAll('.cnx-modal .dbox')].flatMap((b) => {
          const r = b.getBoundingClientRect();
          const out = [];
          if (r.bottom > body.bottom + 1 || r.right > body.right + 1) out.push(`Box „${b.querySelector('.dxh, .dbox-title, h3')?.textContent?.trim()}“ ragt hinaus`);
          if (!b.textContent.trim()) out.push('leere Box');
          return out;
        });
      });
      for (const b of bad) errors.push(`${view} ${land} › ${t}: ${b}`);
      await page.screenshot({ path: `${outDir}/${prefix}_${W}_${land}_${TABS.indexOf(t) + 1}.png` });
    }
    await page.locator('.cnx-modal .modal-close').click();
    await page.waitForTimeout(200);
  }
  await page.close();
}

await browser.close();
server.close();
if (errors.length) { console.log(errors.join('\n')); process.exit(1); }
console.log('Länderprofil ok');
