// Screenshots Länderprofil (components/country/): Flagge klicken, alle Reiter, mehrere Länder
// (Heimatland, Ausland mit Liga, DDR, Land ohne Liga). Prüft feste Fenstergröße je Reiter,
// leere Boxen ohne „keine Daten“ und JS-Fehler. Weltrangliste: Hover auf dem Rangverlauf (Seite und
// Länderprofil, Bilder `…_hover_*.png`), Einzug der Platzzahl neben der Markierung, Achsenzahlen ohne
// Überlappung (Wunsch Pascal).
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
  // Offene Vorschau „Nächstes Spiel“ (Spielstand am Spieltag) mit Escape schließen.
  for (let k = 0; k < 3 && await page.locator('.pm-root').count(); k++) { await page.keyboard.press('Escape'); await page.waitForTimeout(250); }

  // 1) Echte Flagge: Statistiken › Nationalteams › Weltrangliste → dritte Flagge.
  await page.locator('.hd-nav-item:has-text("Statistiken")').first().click();
  await page.locator('.tn-sub-item:has-text("Nationalteams")').first().click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${outDir}/${prefix}_${W}_nationalteams.png` });
  await page.locator('.app-main .sub3-tabs .tab:has-text("Weltrangliste")').first().click().catch(() => {});
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${outDir}/${prefix}_${W}_weltrangliste.png` });
  await sparkChecks(page, `${view} Weltrangliste`, `${outDir}/${prefix}_${W}_hover_seite`);
  const flag = page.locator('.app-main .wr-trow .cflag[data-country]').nth(2);
  if (await flag.count()) {
    await flag.click();
    await page.waitForSelector('.cnx-modal', { timeout: 5000 }).catch(() => errors.push(`${view}: Flagge in der Weltrangliste öffnet kein Länderprofil`));
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${outDir}/${prefix}_${W}_flagge.png` });
    // Klick auf eine Flagge im Profil (Länderspiele: Gegner) stapelt ein weiteres Land.
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  } else errors.push(`${view}: keine Flagge in der Weltrangliste gefunden`);
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
      if (t === 'Übersicht' && land === LANDS[0]) await sparkChecks(page, `${view} ${land}`, `${outDir}/${prefix}_${W}_hover_${land}`);
    }
    await page.locator('.cnx-modal .modal-close').click();
    await page.waitForTimeout(200);
  }
  await page.close();
}

/** Rangverlauf: Hover zeigt Kärtchen + Fadenkreuz, Achsenzahlen überlappen nicht; markierte Zeile mit Einzug. */
async function sparkChecks(page, n, file) {
  const wrap = page.locator('.wr-spark-wrap').last();
  if (!await wrap.count()) { console.log(`${n}: kein Rangverlauf`); return; }
  const ax = await wrap.evaluate((w) => {
    const t = [...w.querySelectorAll('text.wr-ax')].filter((e) => Number(e.getAttribute('y')) > w.clientHeight - 12).map((e) => e.getBoundingClientRect()).sort((a, b) => a.left - b.left);
    let over = 0;
    for (let i = 1; i < t.length; i++) over = Math.max(over, t[i - 1].right - t[i].left);
    return over;
  });
  if (ax > 0) errors.push(`${n}: Jahreszahlen der Achse überlappen (${Math.round(ax)} px)`);
  const b = await wrap.boundingBox();
  for (const [k, fx] of [['ende', 0.99], ['mitte', 0.5]]) {
    await page.mouse.move(b.x + b.width * fx, b.y + b.height / 2);
    await page.waitForTimeout(150);
    if (!await page.locator('.wr-spark-wrap .lc-tip').count()) errors.push(`${n}: kein Hover-Kärtchen (${k})`);
    if (!await page.locator('.wr-spark .wr-guide').count()) errors.push(`${n}: kein Fadenkreuz (${k})`);
    await page.screenshot({ path: `${file}_${k}.png` });
  }
  await page.mouse.move(2, 2);
  const pad = await page.evaluate(() => {
    const r = document.querySelector('.wr-row.me, .wr-trow.me');
    if (!r) return null;
    const rank = r.querySelector('.rl-rank');
    const range = document.createRange(); range.selectNodeContents(rank);
    return range.getBoundingClientRect().left - r.getBoundingClientRect().left;
  });
  if (pad != null && pad < 8) errors.push(`${n}: Platzzahl klebt an der Markierung (${pad.toFixed(1)} px)`);
}

await browser.close();
server.close();
if (errors.length) { console.log(errors.join('\n')); process.exit(1); }
console.log('Länderprofil ok');
