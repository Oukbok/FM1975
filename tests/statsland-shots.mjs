// Screenshots Länderwahl (Statistiken › Liga/Pokal) und Masters-Wertung (Statistiken › Halle).
//   npm run build && SAVE=… node tests/statsland-shots.mjs [ordner] [präfix]
//   VIEW=1366x768 für kleine Bildschirme; HALLE=1 nur die Hallen-Seite; LIGA=1 nur die Ligen.
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
  await page.click('button:has-text("Laden") >> nth=0');
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

if (!process.env.HALLE) {
  await go('Liga');
  await shot('liga_heim');
  const countries = (await optionsOf(page, countrySel())).map((o) => o.value);
  console.log('Länder:', countries.join(' '));
  for (const cc of ['gdr', 'eng', 'esp']) {
    if (!countries.includes(cc)) continue;
    await pickOption(page, countrySel(), cc);
    await shot(`liga_${cc}`);
    if (cc === 'esp') {
      // Auslandsliga Spieltag für Spieltag: Heimtabelle, 2. Liga, Vorsaison, Saison vor Spielbeginn, Pokal
      const ss = await optionsOf(page, seasonSel());
      await page.locator('.cmp-toolbar button:has-text("Heim")').click(); await shot('liga_esp_heim');
      await page.locator('.cmp-toolbar button:has-text("Gesamt")').click();
      if (!await page.locator('.cmp-mdbox .md-row').count()) errors.push('esp: Box „Begegnungen“ ohne Spiele');
      const comps = (await optionsOf(page, compSel())).map((o) => o.value);
      if (comps.includes('r2')) { await pickOption(page, compSel(), 'r2'); await shot('liga_esp_2liga'); await pickOption(page, compSel(), 'r1'); }
      // Torschützenliste der Auslandsliga (aus dem Spielerpool) und Landespokal mit Runden
      if (!await page.locator('.cmp-st-goals .cmp-stat').count()) errors.push('esp: Box „Torschützen“ fehlt oder ist leer');
      await pickOption(page, compSel(), 'xcup');
      await shot('pokal_esp_laufend');
      if (!await page.locator('.cmp-st-goals .cmp-stat').count()) errors.push('esp: Pokal ohne Torschützen');
      await page.locator('.cmp-main button:has-text("Runden")').click(); await shot('pokal_esp_runden');
      await page.locator('.cmp-main button:has-text("Turnierbaum")').click();
      if (!await page.locator('.cmp-main .rb-tie').count()) errors.push('esp: Pokal ohne Runden');
      await pickOption(page, compSel(), 'r1');
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
  await go('Pokal');
  await shot('pokal_heim');
}
if (!process.env.LIGA) {
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

console.log(errors.length ? errors.join('\n') : 'keine Fehler');
await browser.close();
server.close();
process.exit(errors.length ? 1 : 0);
