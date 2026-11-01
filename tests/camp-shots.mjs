// Screenshots Trainingslager: Seite, Planer (Zeitraum, Karte je Kontinent, Ort mit
// Vor-/Nachteilen, Reisegruppe), Buchung, Zeitlauf bis zur Rückkehr und die animierte
// Zusammenfassung (mehrere Bilder), danach das Archiv. Prüft Überlauf/Seiten-Scroll.
//   npm run build && node tests/camp-shots.mjs [ausgabeordner] [präfix]
//   spätere Epoche: SAVE=… (z. B. HUMAN=1 DUMP=save.txt UNTIL=2015-07-06 node scripts/sim.mjs 40)
//   NORUN=1 überspringt Zeitlauf/Zusammenfassung.
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { startNewGame, closeBriefing } from './newgame-flow.mjs';

const outDir = process.argv[2] || 'test-output/camps';
const prefix = process.argv[3] || (process.env.SAVE ? 'save' : 'neu');
await mkdir(outDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(join('dist', path))); }
  catch { res.writeHead(404).end(); }
}).listen(0);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errors = [];
page.on('pageerror', (e) => errors.push('JS-Fehler: ' + e.message));
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
await page.goto(`http://127.0.0.1:${server.address().port}/`);
if (process.env.SAVE) {
  const raw = await readFile(process.env.SAVE, 'utf8');
  await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
  await page.reload();
  await page.click('text=Spiel laden');
  await page.click('button:has-text("Laden") >> nth=0');
  await page.waitForTimeout(1500);
  await closeBriefing(page);
} else {
  await startNewGame(page);
  await page.waitForTimeout(800);
}
async function closeModals() {
  for (let k = 0; k < 8 && await page.locator('.modal-overlay').count(); k++) {
    const x = page.locator('.modal-close, button:has-text("Schließen"), button:has-text("OK")').first();
    if (await x.isVisible().catch(() => false)) await x.click().catch(() => {}); else break;
    await page.waitForTimeout(300);
  }
}
await closeModals();
async function shot(name, scope = '.app-main') {
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${outDir}/${prefix}_${name}.png` });
  const rep = await page.evaluate((sc) => {
    const out = [];
    const main = document.querySelector('.app-main');
    if (sc === '.app-main' && main && main.scrollHeight > main.clientHeight + 2) out.push(`Seite scrollt (${main.scrollHeight - main.clientHeight}px)`);
    for (const b of document.querySelectorAll('.app-main .dbox')) {
      const body = b.querySelector('.dbox-body');
      const title = b.querySelector('.dxh-title')?.textContent;
      if (body && body.scrollWidth > body.clientWidth + 2) out.push(`${title}: waagerechter Überlauf ${body.scrollWidth - body.clientWidth}px`);
    }
    for (const el of document.querySelectorAll('.cp-main, .cp-side, .cp-dest, .cp-months, .cp-squad')) {
      if (el.scrollWidth > el.clientWidth + 2) out.push(`${el.className}: waagerechter Überlauf ${el.scrollWidth - el.clientWidth}px`);
    }
    const m = document.querySelector('.cp-main');
    if (m && m.scrollHeight > m.clientHeight + 2) out.push(`Planer-Inhalt abgeschnitten (${m.scrollHeight - m.clientHeight}px)`);
    return out;
  }, scope);
  console.log(`${name}: ${rep.length ? rep.join('; ') : 'ok'}`);
}
async function openCampPage() {
  // Seite kann (paralleler Strang) unter „Kader“ oder „Training“ hängen.
  for (const top of ['Training', 'Kader']) {
    const nav = page.locator(`.hd-nav-item:has-text("${top}")`).first();
    if (!(await nav.count())) continue;
    await nav.click();
    await page.waitForTimeout(250);
    const sub = page.locator('.tn-sub-item:has-text("Trainingslager")').first();
    if (await sub.count()) { await sub.click(); return; }
  }
  throw new Error('Seite Trainingslager nicht gefunden');
}
await openCampPage();
await shot('1_seite');
const planBtn = page.locator('.cp-plan-btn');
if (await planBtn.isDisabled()) { console.log('Planen gesperrt – keine freien Fenster.'); }
else {
  await planBtn.click();
  await shot('2_zeitraum', 'modal');
  await page.locator('.cp-foot button:has-text("Weiter")').click();
  await shot('3_karte', 'modal');
  // Ort mit Vor-/Nachteilen: ein buchbares Ziel der Startansicht, dann je Kontinent.
  const pins = page.locator('.cp-pin.ok');
  if (await pins.count()) { await pins.nth(Math.min(2, (await pins.count()) - 1)).click(); await shot('4_ort', 'modal'); }
  const tabs = page.locator('.cp-map-tab:not([disabled])');
  const nt = await tabs.count();
  for (let i = 1; i < nt; i++) {
    await tabs.nth(i).click();
    const label = (await tabs.nth(i).innerText()).split('\n')[0].replace(/[^A-Za-z]+/g, '_');
    const p = page.locator('.cp-pin.ok');
    if (await p.count()) await p.first().click();
    await shot(`5_karte_${i}_${label}`, 'modal');
  }
  // Zurück zu einem günstigen Ziel in der Nähe (erste Ansicht), Unterkunft wählen
  await tabs.first().click();
  await page.locator('.cp-pin.ok').first().click();
  const lods = page.locator('.cp-lodging:not([disabled])');
  if (await lods.count() > 1) await lods.last().click();
  await page.locator('.cp-foot button:has-text("Weiter")').click();
  await page.locator('.cp-focus .dchip:has-text("Kondition")').click();
  // Einen Profi daheim lassen, einen Jugendspieler einladen
  const rows = page.locator('.cp-squad-main .cp-pl:not(.head)');
  if (await rows.count() > 20) await rows.last().click();
  const yr = page.locator('.cp-squad-side .cp-pl');
  if (await yr.count()) await yr.first().click();
  await shot('6_reisegruppe', 'modal');
  const book = page.locator('.cp-foot .btn-primary');
  if (await book.isEnabled()) { await book.click(); await shot('7_gebucht'); }
  else console.log('Buchen nicht möglich:', await page.locator('.cp-foot-msg').innerText());
}
await closeModals();
if (!process.env.NORUN) {
  // Zeit laufen lassen, bis die Zusammenfassung erscheint (eigene Spiele schnell simulieren).
  let seen = false;
  const t0 = Date.now();
  let last = '', stuck = 0;
  while (!seen && Date.now() - t0 < 8 * 60_000) {
    if (await page.locator('.cr-root').count()) { seen = true; break; }
    for (const sel of ['button:has-text("Schnell simulieren")', 'button:has-text("Zum Spielbericht")', 'button:has-text("Überspringen")', 'button:has-text("Schließen")', '.modal-overlay .modal-close']) {
      const b = page.locator(sel).first();
      if (await b.isVisible().catch(() => false)) await b.click().catch(() => {});
    }
    const w = page.locator('button').filter({ hasText: /^\s*Weiter\s*$/i }).first();
    if (await w.isVisible().catch(() => false)) await w.click().catch(() => {});
    await page.waitForTimeout(2000);
    const d = await page.locator('body').innerText().then((t) => t.match(/\w+, \d{1,2}\. \w+ (19|20)\d\d/)?.[0]).catch(() => '?');
    if (d !== last) { console.log(`  Zeitlauf: ${d}`); last = d; stuck = 0; }
    else if (++stuck === 4) await page.screenshot({ path: `${outDir}/${prefix}_debug_haengt.png` });
  }
  if (seen) {
    await page.waitForTimeout(1200); await page.screenshot({ path: `${outDir}/${prefix}_8_bilanz_a.png` });
    await page.waitForTimeout(3300); await page.screenshot({ path: `${outDir}/${prefix}_8_bilanz_b.png` });
    await page.waitForTimeout(5500); await page.screenshot({ path: `${outDir}/${prefix}_8_bilanz_c.png` });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    await closeModals();
    await openCampPage();
    await shot('9_archiv');
  } else console.log('Zusammenfassung nicht erschienen.');
}
console.log(errors.length ? errors.join('\n') : 'Keine JS-Fehler.');
await browser.close();
server.close();
