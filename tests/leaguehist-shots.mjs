// Screenshots Statistiken › Ligensystem mit Zeiträumen (Wunsch Pascal): aktueller Zeitraum, erster
// Zeitraum (1975er), archivierte Liga (DDR, aufgelöste Staaten) mit Stempel „Archiviert“; Pokale des
// Landes neben der Pyramide (Trophäe + Auf/Ab je Liga), Reiter Ligen der Welt (die Fünfjahreswertung
// steht unter Statistiken › International – Screenshots dort: INTL=1 node tests/statsland-shots.mjs).
//   npm run build && SAVE=public/saves/test-60-jahre.txt node tests/leaguehist-shots.mjs [ordner] [präfix]
//   VIEW=1366x768 für kleine Bildschirme. Prüft Kopf-Überlauf, feste Boxgröße und JS-Fehler.
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { startNewGame } from './newgame-flow.mjs';
import { pickOption, optionsOf } from './select3.mjs';

const outDir = process.argv[2] || 'test-output/leaguehist';
const prefix = process.argv[3] || 'lh';
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
let baseSize = '';
const shot = async (n) => {
  await page.waitForTimeout(700);
  const { over, size, scroll, boxOut, markOut, cupsOut, cupsN, tro } = await page.evaluate(() => {
    const box = document.querySelector('.lp-box-page');
    const h = box?.querySelector('.dxh');
    const r = h?.getBoundingClientRect();
    const b = box?.getBoundingClientRect();
    // Pyramiden-Kästen dürfen nicht aus der Bühne ragen, Marken nicht aus ihrem Kasten, die Pokal-Spalte nicht aus der Box.
    const stage = box?.querySelector('.lp-stage')?.getBoundingClientRect();
    const boxOut = stage ? [...box.querySelectorAll('.lp-box')].filter((x) => { const q = x.getBoundingClientRect(); return q.left < stage.left - 1 || q.right > stage.right + 1; }).length : 0;
    const markOut = [...(box?.querySelectorAll('.lp-box') ?? [])].filter((x) => { const q = x.getBoundingClientRect(); return [...x.querySelectorAll('.lp-mv, .lp-box-head')].some((m) => { const z = m.getBoundingClientRect(); return z.left < q.left - 1 || z.right > q.right + 1; }); }).length;
    const cups = box?.querySelector('.lp-cups')?.getBoundingClientRect();
    const cupsOut = cups && b ? cups.bottom > b.bottom + 1 || cups.right > b.right + 1 : false;
    return {
      over: r ? Math.max(0, ...[...h.querySelectorAll('*')].map((e) => e.getBoundingClientRect().right - r.right)) : 0,
      size: b ? `${Math.round(b.width)}x${Math.round(b.height)}` : '',
      scroll: document.scrollingElement.scrollHeight > window.innerHeight + 2,
      boxOut, markOut, cupsOut, cupsN: box?.querySelectorAll('.lp-cup').length ?? 0, tro: box?.querySelectorAll('.lp-box-tro').length ?? 0,
    };
  });
  if (boxOut) errors.push(`${n}: ${boxOut} Liga-Kästen ragen aus der Pyramide`);
  if (markOut) errors.push(`${n}: ${markOut} Kästen mit überlaufenden Marken`);
  if (cupsOut) errors.push(`${n}: Pokal-Spalte ragt aus der Box`);
  if (!tro) errors.push(`${n}: keine Trophäe in den Liga-Kästen`);
  console.log(`${n}: ${cupsN} Pokale, ${tro} Trophäen`);
  if (over > 1) errors.push(`${n}: Kopfleiste läuft ${Math.round(over)} px über`);
  baseSize ||= size; if (size !== baseSize) errors.push(`${n}: Box ${size} statt ${baseSize}`);
  if (scroll) errors.push(`${n}: Seite scrollt`);
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

await page.locator('.hd-nav-item:has-text("Statistiken")').first().click();
await page.locator('.tn-sub-item:has-text("Ligensystem")').first().click();
await page.waitForTimeout(800);
const periodSel = () => page.locator('.lp-period-nav .sel3').first();
const countrySel = () => page.locator('.lp-country-sel').first();
const periods = await optionsOf(page, periodSel());
console.log('Zeiträume Heimat:', periods.map((p) => p.label).join(' · '));
await shot('heim_aktuell');
await pickOption(page, periodSel(), { index: 0 });
await shot('heim_erster');
if (await page.locator('.lp-period-nav button[aria-label="Späterer Zeitraum"]').isEnabled()) {
  await page.locator('.lp-period-nav button[aria-label="Späterer Zeitraum"]').click();
  await shot('heim_zweiter');
}
await periodSel().click(); await page.waitForTimeout(200); await shot('heim_liste'); await page.keyboard.press('Escape');
const countries = await optionsOf(page, countrySel());
console.log('Länder:', countries.map((c) => c.label).join(' · '));
for (const [v, n] of [['ddr', 'ddr'], ['a:Sowjetunion', 'urs'], ['a:Tschechoslowakei', 'tch'], ['a:England', 'eng']]) {
  if (!countries.some((c) => c.value === v)) continue;
  await pickOption(page, countrySel(), v);
  const ps = await optionsOf(page, periodSel());
  console.log(`Zeiträume ${n}:`, ps.map((p) => p.label).join(' · '), '| Stempel:', await page.locator('.lp-stamp').count());
  await shot(n);
  if (n === 'eng' && ps.length > 2) { await pickOption(page, periodSel(), { index: 0 }); await shot('eng_erster'); }
}
// Reiter Ligen der Welt (drittes Menü).
const tabShot = async (label, n, sel) => {
  await page.locator(`.app-main .sub3-tabs .tab:has-text("${label}")`).first().click();
  await page.waitForTimeout(700);
  const r = await page.evaluate((s) => {
    const rows = document.querySelectorAll(s).length;
    const bad = [...document.querySelectorAll('.app-main .dbox')].filter((b) => b.scrollHeight > b.clientHeight + 2 && !b.querySelector('.lsv-list')).length;
    return { rows, bad, scroll: document.scrollingElement.scrollHeight > window.innerHeight + 2, me: 0 };
  }, sel);
  if (!r.rows) errors.push(`${n}: keine Zeilen`);
  if (r.scroll) errors.push(`${n}: Seite scrollt`);
  console.log(`${n}: ${r.rows} Zeilen`);
  await page.screenshot({ path: `${outDir}/${tag}_${n}.png` });
  console.log('Bild', `${outDir}/${tag}_${n}.png`);
};
await tabShot('Ligen der Welt', 'welt', '.lsv-list .lsv-row');
await page.locator('.app-main .sub3-tabs .tab:has-text("Ligensystem")').first().click();
console.log(errors.length ? errors.join('\n') : 'Keine Fehler.');
await browser.close();
server.close();
process.exit(errors.length ? 1 : 0);
