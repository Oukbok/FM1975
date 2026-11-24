// Screenshots Länderwahl (Statistiken › Liga/Nationale Pokale), Masters-Wertung (Statistiken › Halle)
// und Statistiken › International (je Europapokal ein Reiter, Europäischer Gipfelpokal, Welt,
// Fünfjahreswertung mit Seitenpanel je Verein und Sortierung; Wunsch Pascal).
//   npm run build && SAVE=… node tests/statsland-shots.mjs [ordner] [präfix]
//   VIEW=1366x768 für kleine Bildschirme; HALLE=1 nur die Hallen-Seite; LIGA=1 nur die Ligen;
//   INTL=1 nur Nationale Pokale + International + Sprung aus dem Ligensystem.
//   Hallen-Winter: DUMP=… UNTIL=1990-12-19 node scripts/sim.mjs 15
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { startNewGame } from './newgame-flow.mjs';
import { pickOption, optionsOf } from './select3.mjs';

const outDir = process.argv[2] || 'test-output/statsland';
const prefix = process.argv[3] || 'land';
const [vw, vh] = (process.env.VIEW || '1920x1080').split('x').map(Number);
await mkdir(outDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(join('dist', path))); }
  catch { res.writeHead(404).end(); }
}).listen(0);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: vw, height: vh } });
const errors = [];
page.on('pageerror', (e) => errors.push('JS-Fehler: ' + e.message));
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
await page.goto(`http://127.0.0.1:${server.address().port}/`);
const tag = `${prefix}_${vw}`;
const baseSizes = {};
const shot = async (n) => {
  await page.waitForTimeout(300);
  // Kopfleiste der Hauptbox darf nicht überlaufen.
  const over = await page.evaluate(() => {
    const h = document.querySelector('.cmp-main .dxh');
    if (!h) return 0;
    const r = h.getBoundingClientRect();
    return Math.max(0, ...[...h.querySelectorAll('*')].map((e) => e.getBoundingClientRect().right - r.right));
  });
  if (over > 1) errors.push(`${n}: Kopfleiste läuft ${Math.round(over)} px über`);
  // Feste Box-Größen: Länder-/Saisonwechsel darf keine Box wachsen lassen.
  // Verglichen wird je Raster (mit/ohne Box „Begegnungen“) die sortierte Liste – die Reihenfolge im DOM
  // hängt von der Art der Bestenlisten ab (Spieler- oder Vereinswerte), nicht von der Größe.
  const { layout, sizes } = await page.evaluate(() => ({
    layout: document.querySelector('.cmp-page.cmp-mdpage') ? 'md' : 'std',
    sizes: [...document.querySelectorAll('.app-main .dbox')].map((b) => { const r = b.getBoundingClientRect(); return `${Math.round(r.width)}×${Math.round(r.height)}`; }).sort().join(' '),
  }));
  if (n.startsWith('liga') || n.startsWith('pokal')) { baseSizes[layout] ??= sizes; if (sizes !== baseSizes[layout]) errors.push(`${n}: Boxgrößen ${sizes} statt ${baseSizes[layout]}`); }
  await page.screenshot({ path: `${outDir}/${tag}_${n}.png` });
  console.log('Bild', `${outDir}/${tag}_${n}.png`);
};

if (process.env.SAVE) {
  const raw = await readFile(process.env.SAVE, 'utf8');
  await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
  await page.reload();
  await page.click('text=Spiel laden');
  await page.click('.card:has(button:has-text("Löschen")) button:has-text("Laden") >> nth=0');
  await page.waitForTimeout(1800);
  for (let i = 0; i < 3 && await page.locator('.bf-continue').count(); i++) { await page.locator('.bf-continue').click(); await page.waitForTimeout(200); }
  // Offene Fenster (Gala, Auszeichnungen, Budget …) schließen.
  for (let k = 0; k < 8; k++) {
    if (await page.locator('.gb-root').count()) { await page.keyboard.press('Escape'); await page.waitForTimeout(300); continue; }
    const x = page.locator('.modal-overlay .modal-close, .modal-overlay button:has-text("Schließen"), .modal-overlay button:has-text("OK")').first();
    if (await page.locator('.modal-overlay').count() && await x.isVisible().catch(() => false)) { await x.click().catch(() => {}); await page.waitForTimeout(300); continue; }
    break;
  }
} else {
  await startNewGame(page);
}

async function go(label) {
  await page.locator('.hd-nav-item:has-text("Statistiken")').first().click();
  await page.locator(`.tn-sub-item:has-text("${label}")`).first().click();
  await page.waitForTimeout(500);
}
const countrySel = () => page.locator('.cmp-select .sel3').nth(0);
const compSel = () => page.locator('.cmp-select .sel3').nth(1);
const seasonSel = () => page.locator('.cmp-select .sel3').nth(2);

if (!process.env.HALLE && !process.env.INTL) {
  await go('Liga');
  await shot('liga_heim');
  // Alle Ligen des Heimatlandes (nach Ebene gruppiert): tiefste Spielklasse mit Tabelle + Unterbau.
  const homeComps = (await optionsOf(page, compSel())).map((o) => o.value);
  console.log('Wettbewerbe Heimat:', homeComps.join(' '));
  await compSel().click(); await shot('liga_heim_wahl'); await page.keyboard.press('Escape');
  const deepest = homeComps.filter((v) => /^tier\d/.test(v)).sort().at(-1);
  if (deepest && deepest !== homeComps[0]) {
    await pickOption(page, compSel(), deepest); await shot('liga_heim_tief');
    if (!await page.locator('.cmp-mdbox .md-row').count()) errors.push(`${deepest}: Box „Begegnungen“ ohne Spiele`);
  }
  if (homeComps.includes('pool')) { await pickOption(page, compSel(), 'pool'); await shot('liga_heim_unterbau'); }
  else errors.push('Heimat: kein Unterbau (Amateurligen) wählbar');
  await pickOption(page, compSel(), homeComps[0]);
  const countries = (await optionsOf(page, countrySel())).map((o) => o.value);
  console.log('Länder:', countries.join(' '));
  // DDR zuletzt: ihre letzte Saison (1990/91) würde sonst für die übrigen Länder mitgewählt.
  for (const cc of ['eng', 'esp', 'gdr']) {
    if (!countries.includes(cc)) continue;
    await pickOption(page, countrySel(), cc);
    await shot(`liga_${cc}`);
    if (cc === 'esp') {
      // Auslandsliga Spieltag für Spieltag: Heimtabelle, 2. Liga, Vorsaison, Saison vor Spielbeginn, Pokal
      const ss = await optionsOf(page, seasonSel());
      // Die Saison bleibt beim Länderwechsel stehen (z. B. 1990/91 nach der DDR) – laufende Saison wählen.
      if (await seasonSel().getAttribute('data-value') !== ss.at(-1).value) { await pickOption(page, seasonSel(), ss.at(-1).value); await shot('liga_esp_laufend'); }
      await page.locator('.cmp-toolbar button:has-text("Heim")').click(); await shot('liga_esp_heim');
      await page.locator('.cmp-toolbar button:has-text("Gesamt")').click();
      if (!await page.locator('.cmp-mdbox .md-row').count()) errors.push('esp: Box „Begegnungen“ ohne Spiele');
      const comps = (await optionsOf(page, compSel())).map((o) => o.value);
      console.log('Wettbewerbe esp:', comps.join(' '), '· Saisons:', ss.map((x) => x.value).join(' '));
      if (comps.includes('r2')) { await pickOption(page, compSel(), 'r2'); await shot('liga_esp_2liga'); await pickOption(page, compSel(), 'r1'); }
      // Torschützenliste der Auslandsliga (aus dem Spielerpool) und Landespokal mit Runden
      if (!await page.locator('.cmp-st-goals .cmp-stat').count()) errors.push('esp: Box „Torschützen“ fehlt oder ist leer');
      // Wie bei der Heimatliga: sechs Wertungen mit Gesicht, keine Vereinswerte-Boxen, keine Zeile über der Tabelle
      for (const c of ['assists', 'scorer', 'yellow', 'clean']) if (!await page.locator(`.cmp-st-${c} .cmp-stat`).count()) errors.push(`esp: Box ${c} fehlt oder ist leer`);
      if (await page.locator('.cmp-statbox').count() !== 6) errors.push(`esp: ${await page.locator('.cmp-statbox').count()} Statistik-Boxen statt 6`);
      if (await page.locator('.cmp-caption').count()) errors.push('esp: Zeile über der Tabelle der laufenden Saison');
      await pickOption(page, compSel(), 'xcup');
      await shot('pokal_esp_laufend');
      if (!await page.locator('.cmp-st-goals .cmp-stat').count()) errors.push('esp: Pokal ohne Torschützen');
      await page.locator('.cmp-main button:has-text("Runden")').click(); await shot('pokal_esp_runden');
      await page.locator('.cmp-main button:has-text("Turnierbaum")').click();
      if (!await page.locator('.cmp-main .rb-tie').count()) errors.push('esp: Pokal ohne Runden');
      await pickOption(page, compSel(), comps.includes('r1') ? 'r1' : comps[0]); // laufend bzw. abgeschlossen (w1)
      const prev = ss.filter((x) => !x.label.includes('vor Spielbeginn')).at(-2);
      if (prev) {
        await pickOption(page, seasonSel(), prev.value); await shot('liga_esp_vorsaison');
        await pickOption(page, compSel(), 'xcup'); await shot('pokal_esp_vorsaison');
        await pickOption(page, compSel(), (await optionsOf(page, compSel())).map((o) => o.value).find((v) => v === 'w1' || v === 'r1') ?? 'w1');
      }
      await pickOption(page, seasonSel(), ss[0].value);
      await shot('liga_esp_vorher');
      await pickOption(page, compSel(), 'xcup');
      await shot('pokal_esp');
    }
  }
  // Mehrere Staffeln der 2. Ebene (Frankreich bis 1992/93, Portugal bis 1989/90): jede Staffel eine eigene Liga.
  for (const cc of (process.env.MULTI ?? 'fra,por').split(',').filter(Boolean)) {
    if (!countries.includes(cc)) continue;
    await pickOption(page, countrySel(), cc);
    const ss = await optionsOf(page, seasonSel());
    if (await seasonSel().getAttribute('data-value') !== ss.at(-1).value) await pickOption(page, seasonSel(), ss.at(-1).value);
    const comps = (await optionsOf(page, compSel()));
    const groups = comps.filter((o) => /^r2(:\d+)?$/.test(o.value));
    console.log(`Wettbewerbe ${cc}:`, comps.map((o) => `${o.value}=${o.label}`).join(' | '));
    if (groups.length > 1) {
      await compSel().click(); await shot(`liga_${cc}_wahl`); await page.keyboard.press('Escape');
      for (const o of groups) {
        await pickOption(page, compSel(), o.value); await shot(`liga_${cc}_${o.value.replace(':', '_')}`);
        if (!await page.locator('.cmp-mdbox .md-row').count()) errors.push(`${cc} ${o.value}: Box „Begegnungen“ ohne Spiele`);
        if (!await page.locator('.cmp-st-goals .cmp-stat').count()) errors.push(`${cc} ${o.value}: Torschützen fehlen`);
      }
    }
    await pickOption(page, compSel(), comps[0].value);
  }
  // Vorauswahl von außen bei offener Seite: Länderprofil › Ligen › „Statistiken › Liga öffnen“
  // muss das Land auch dann übernehmen, wenn Statistiken › Liga schon angezeigt wird.
  await go('Liga');
  await pickOption(page, countrySel(), countries[0]);
  for (const [land, cc] of [['England', 'eng'], ['Spanien', 'esp']]) {
    if (!countries.includes(cc)) continue;
    await page.evaluate((k) => {
      const f = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      f.setAttribute('class', 'cflag'); f.setAttribute('data-country', k); f.setAttribute('width', '30'); f.setAttribute('height', '20');
      f.style.cssText = 'position:fixed;left:0;top:0;z-index:5'; f.id = 'probe-flag';
      document.body.appendChild(f);
    }, land);
    await page.locator('#probe-flag').click({ force: true });
    await page.evaluate(() => document.getElementById('probe-flag')?.remove());
    if (!await page.waitForSelector('.cnx-modal', { timeout: 5000 }).then(() => true).catch(() => false)) { errors.push(`${land}: Länderprofil öffnet nicht`); continue; }
    await page.locator('.cnx-modal .tab:has-text("Ligen")').first().click();
    const goBtn = page.locator('.cnx-modal .cnx-goto');
    if (!await goBtn.count()) { errors.push(`${land}: Knopf „Statistiken › Liga öffnen“ fehlt`); await page.keyboard.press('Escape'); continue; }
    await goBtn.click();
    await page.waitForTimeout(500);
    if (await page.locator('.cnx-modal').count()) { await page.keyboard.press('Escape'); await page.waitForTimeout(200); }
    const now = await countrySel().getAttribute('data-value');
    if (now !== cc) errors.push(`Vorauswahl bei offener Seite: Land ${now} statt ${cc}`);
    await shot(`liga_vorauswahl_${cc}`);
  }
  await go('Pokal');
  await shot('pokal_heim');
}
if (!process.env.HALLE && !process.env.LIGA) await intlShots();
if (!process.env.LIGA && !process.env.INTL) {
  await go('Halle');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${outDir}/${tag}_halle.png` });
  console.log('Bild', `${outDir}/${tag}_halle.png`);
  const past = page.locator('.mst-box .sel3');
  if (await past.count()) {
    const o = await optionsOf(page, past.first());
    if (o.length > 1) { await pickOption(page, past.first(), o[1].value); await page.screenshot({ path: `${outDir}/${tag}_halle_vorjahr.png` }); console.log("Bild", `${outDir}/${tag}_halle_vorjahr.png`); }
  }
}

// Statistiken › Nationale Pokale (Landespokal | Gipfelpokal) und International (je Europapokal ein
// Reiter, Europäischer Gipfelpokal, Welt, Fünfjahreswertung).
async function intlShots() {
  const tab = (label) => page.locator(`.app-main .sub3-tabs .tab:has-text("${label}")`).first();
  const tabs = async () => (await page.locator('.app-main .sub3-tabs .tab').allTextContents()).map((t) => t.trim());
  const plain = async (n) => { await page.waitForTimeout(300); await page.screenshot({ path: `${outDir}/${tag}_${n}.png` }); console.log('Bild', `${outDir}/${tag}_${n}.png`); };
  const pageScroll = async (n) => {
    const over = await page.evaluate(() => { const m = document.querySelector('.app-main'); return m ? Math.max(m.scrollWidth - m.clientWidth, document.documentElement.scrollWidth - innerWidth) : 0; });
    if (over > 1) errors.push(`${n}: waagerechter Überlauf ${over} px`);
  };
  await go('Nationale Pokale');
  await page.waitForSelector('.app-main .sub3-tabs .tab', { timeout: 5000 }).catch(() => {});
  const cupTabs = await tabs();
  console.log('Reiter Nationale Pokale:', cupTabs.join(' | '));
  if (cupTabs.length < 2) errors.push('Nationale Pokale: weniger als zwei Reiter');
  if (await page.locator('.tn-sub-item:has-text("Gipfelpokal")').count()) errors.push('Menüpunkt „Gipfelpokal“ gibt es noch');
  await plain('npokal_landespokal');
  await page.locator('.app-main .sub3-tabs .tab').nth(1).click();
  await plain('npokal_gipfel');
  await go('International');
  await page.waitForSelector('.app-main .sub3-tabs .tab', { timeout: 5000 }).catch(() => {});
  const it = await tabs();
  console.log('Reiter International:', it.join(' | '));
  if (it.at(-1) !== 'Fünfjahreswertung') errors.push(`International: letzter Reiter „${it.at(-1)}“ statt Fünfjahreswertung`);
  if (!it.includes('Welt')) errors.push('International: Reiter Welt fehlt');
  for (const [i, label] of it.entries()) {
    if (label === 'Fünfjahreswertung') continue;
    await page.locator('.app-main .sub3-tabs .tab').nth(i).click();
    await plain(`intl_${i}_${label.replace(/[^A-Za-zÄÖÜäöüß]+/g, '').slice(0, 18)}`);
    await pageScroll(`International › ${label}`);
  }
  // Ältere Saison im ersten Europapokal-Reiter: Reiter folgen den Wettbewerben der Saison.
  await page.locator('.app-main .sub3-tabs .tab').first().click();
  const ss = page.locator('.cmp-select .sel3');
  if (await ss.count()) {
    const opts = await optionsOf(page, ss.first());
    const old = opts.find((o) => /^19[78]\d/.test(o.value)) ?? opts[0];
    if (old) { await pickOption(page, ss.first(), old.value); console.log(`Reiter ${old.value}:`, (await tabs()).join(' | ')); await plain('intl_alt'); await pickOption(page, ss.first(), opts.at(-1).value); }
  }
  await tab('Fünfjahreswertung').click();
  await page.waitForSelector('.cfx-row:not(.cfx-head)', { timeout: 5000 }).catch(() => errors.push('Fünfjahreswertung: keine Zeilen'));
  await plain('coef');
  await pageScroll('Fünfjahreswertung');
  const fit = await page.evaluate(() => {
    const l = document.querySelector('.cfx-list'), h = document.querySelector('.cfx-head');
    const box = document.querySelector('.cfx-box')?.getBoundingClientRect();
    const rows = [...document.querySelectorAll('.cfx-row')].map((r) => r.scrollWidth - r.clientWidth);
    return { hx: l ? l.scrollWidth - l.clientWidth : -1, vscroll: l ? l.scrollHeight > l.clientHeight : false, rowOver: Math.max(0, ...rows), headTop: h?.getBoundingClientRect().top, boxBottom: box?.bottom, vh: innerHeight };
  });
  if (fit.hx > 1 || fit.rowOver > 1) errors.push(`Fünfjahreswertung: waagerecht zu breit (${fit.hx}/${fit.rowOver} px)`);
  if (fit.boxBottom > fit.vh + 1) errors.push('Fünfjahreswertung: Box ragt unten aus dem Fenster');
  // Liste ans Ende scrollen: Kopf bleibt stehen.
  await page.evaluate(() => { const l = document.querySelector('.cfx-list'); if (l) l.scrollTop = l.scrollHeight; });
  const headAfter = await page.evaluate(() => document.querySelector('.cfx-head')?.getBoundingClientRect().top);
  if (Math.abs(headAfter - fit.headTop) > 1) errors.push('Fünfjahreswertung: Kopf scrollt mit');
  await plain('coef_ende');
  await page.evaluate(() => { const l = document.querySelector('.cfx-list'); if (l) l.scrollTop = 0; });
  // Sortierung nach laufender Saison.
  await page.locator('.cfx-head .cfx-live').click();
  await plain('coef_sort_live');
  await page.locator('.cfx-head .cfx-sum').click();
  // Seitenpanel: laufende Saison des eigenen Landes, dann eine ältere Saison (falls im Archiv).
  const live = page.locator('.cfx-row.me button.cfx-season.cfx-live');
  if (await live.count()) {
    await live.click(); await plain('coef_panel_live');
    if (!await page.locator('.cfx-panel .cfx-prow:not(.cfx-phead)').count()) errors.push('Panel: keine Vereine (laufende Saison)');
  } else console.log('Laufende Saison ohne Europapokale des eigenen Landes');
  const past = page.locator('.cfx-list button.cfx-season:not(.cfx-live)').first();
  if (await past.count()) { await past.click(); await plain('coef_panel_alt'); }
  else console.log('Keine ältere Saison mit Punkten je Verein im Archiv');
  const counts = await page.evaluate(() => ({ live: document.querySelectorAll('.cfx-list button.cfx-season.cfx-live').length, past: document.querySelectorAll('.cfx-list button.cfx-season:not(.cfx-live)').length, plain: document.querySelectorAll('.cfx-list span.cfx-season:not(.cfx-live)').length }));
  console.log('Zellen mit Aufschlüsselung:', JSON.stringify(counts));
  await page.keyboard.press('Escape');
  if (await page.locator('.cfx-panel').count()) errors.push('Panel: Escape schließt nicht');
  // Klick auf das Land → Länderprofil.
  await page.locator('.cfx-list .cfx-row .cfx-land .cflag-link').first().click();
  if (!await page.waitForSelector('.cnx-modal', { timeout: 4000 }).then(() => true).catch(() => false)) errors.push('Klick auf Land öffnet kein Länderprofil');
  else { await page.keyboard.press('Escape'); await page.waitForTimeout(250); }
  // Ligensystem: Reiter Fünfjahreswertung entfällt, „Ganze Wertung“ springt hierher.
  await go('Ligensystem');
  if ((await tabs()).includes('Fünfjahreswertung')) errors.push('Ligensystem: Reiter Fünfjahreswertung gibt es noch');
  const goBtn = page.locator('.app-main .lp-coef-go');
  if (await goBtn.count()) {
    await goBtn.click(); await page.waitForTimeout(500);
    if (!await page.locator('.cfx-box').count()) errors.push('„Ganze Wertung“ führt nicht zur Fünfjahreswertung');
  } else errors.push('Ligensystem: Knopf „Ganze Wertung“ fehlt');
}

console.log(errors.length ? errors.join('\n') : 'keine Fehler');
await browser.close();
server.close();
process.exit(errors.length ? 1 : 0);
