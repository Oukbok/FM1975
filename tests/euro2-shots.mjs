// =============================================================================
// Screenshots Europapokal 2.0 (1920×1080):
//   MODE=draw   SAVE=… node tests/euro2-shots.mjs [ordner] [präfix]   Gruppenauslosung (Regeln, Ziehung, Gruppe, alle Gruppen)
//   MODE=groups SAVE=… node tests/euro2-shots.mjs [ordner] [präfix]   Statistiken › International: Gruppen, Baum, Runden
//   MODE=match  SAVE=… node tests/euro2-shots.mjs [ordner] [präfix]   Textmodus im Rückspiel mit Gesamtstand
// Spielstände: DUMP=… UNTIL=… node scripts/sim.mjs n (z. B. CLUB=muc DUMP=…/save2005.txt UNTIL=2005-08-25 … 30).
// =============================================================================
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { pickOption, optionsOf, valueOf } from './select3.mjs';

const outDir = process.argv[2] || 'test-output/euro2';
const prefix = process.argv[3] || 'e2';
const mode = process.env.MODE || 'draw';
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
await page.evaluate(() => localStorage.setItem('fm1980_settings', JSON.stringify({ speedMs: 200, drawShow: 'immer', drawSpeed: 'schnell', briefingAuto: false })));
await page.reload();
const raw = await readFile(process.env.SAVE, 'utf8');
await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
await page.reload();
await page.click('text=Spiel laden');
await page.click('button:has-text("Laden") >> nth=0');
await page.waitForTimeout(1500);
for (const sel of ['.bf-modal .bf-continue', '.modal-close']) {
  const b = page.locator(sel).first();
  if (await b.isVisible().catch(() => false)) await b.click().catch(() => {});
}
const shot = async (name) => { const p = `${outDir}/${prefix}_${name}.png`; await page.screenshot({ path: p }); console.log('  ', p); };
const visible = (sel) => page.locator(sel).first().isVisible().catch(() => false);
const closeModals = async () => {
  for (const sel of ['.bf-modal .bf-continue', '.modal-close']) {
    const b = page.locator(sel).first();
    if (await b.isVisible().catch(() => false)) await b.click().catch(() => {});
  }
};

if (mode === 'draw') {
  let found = false;
  for (let i = 0; i < 300 && !found; i++) {
    if (await visible('.dr-root')) {
      const facts = await page.locator('.dr-intro-facts').innerText().catch(() => '');
      if (/Gruppen|Ligaphase/.test(facts)) { found = true; break; }
      await page.keyboard.press('Escape'); await page.waitForTimeout(250); await page.keyboard.press('Escape'); await page.waitForTimeout(250);
      continue;
    }
    await closeModals();
    const w = page.locator('.hd-continue:not(.running)').first();
    if (await w.isVisible().catch(() => false)) await w.click({ timeout: 1500 }).catch(() => {});
    await page.waitForTimeout(350);
  }
  if (!found) { console.log('Keine Gruppenauslosung erreicht'); process.exit(1); }
  console.log('Ziehung', (await page.locator('.dr-comp').innerText()).trim());
  await page.waitForTimeout(800);
  await shot('01_regeln');
  await page.click('button:has-text("Mit der Auslosung beginnen")');
  await page.waitForTimeout(9000);
  await shot('02_ziehung');
  const mine = page.locator('button:has-text("Bis zu meiner Ziehung")');
  if (await mine.isVisible().catch(() => false)) { await mine.click(); await page.waitForTimeout(2500); await shot('03_eigene_kugel'); }
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1200);
  await shot('04_gruppe');
  await page.click('.dr-tabs button:nth-child(2)');
  await page.waitForTimeout(600);
  await shot('05_alle_gruppen');
  await page.click('.dr-top-r button:has-text("Schließen")');
  await page.waitForTimeout(400);
}

if (mode === 'groups') {
  await page.click('.hd-nav-item:has-text("Statistiken")');
  await page.waitForTimeout(300);
  await page.click('.tn-sub-item:has-text("International")').catch(() => {});
  await page.waitForTimeout(700);
  const grp = page.locator('.cmp-toolbar button:has-text("Gruppen"), .cmp-toolbar button:has-text("Ligaphase")').first();
  if (await grp.isVisible().catch(() => false)) { await grp.click(); await page.waitForTimeout(400); }
  await shot('01_gruppen');
  const tree = page.locator('.cmp-toolbar button:has-text("Turnierbaum")');
  if (await tree.isVisible().catch(() => false)) { await tree.click(); await page.waitForTimeout(500); await shot('02_baum'); }
  const list = page.locator('.cmp-toolbar button:has-text("Runden")');
  if (await list.isVisible().catch(() => false)) {
    await list.click(); await page.waitForTimeout(400);
    await shot('03_runden');
    const gr = page.locator('.cmp-toolbar button:has-text("Gruppenphase")').first();
    if (await gr.isVisible().catch(() => false)) { await gr.click(); await page.waitForTimeout(400); await shot('04_spieltage'); }
  }
  // Andere Wettbewerbe der Saison (Europa-Pokal mit Gruppendritten)
  const sel = page.locator('.cmp-select .sel3').nth(2); // Land | Saison | Wettbewerb
  const opts = (await optionsOf(page, sel)).map((o) => o.label);
  const other = opts.find((o) => /Europa-Pokal|Europa-Liga/.test(o));
  if (other) {
    await pickOption(page, sel, { label: other }); await page.waitForTimeout(600); await shot('05_europapokal');
    const t2 = page.locator('.cmp-toolbar button:has-text("Turnierbaum")');
    if (await t2.isVisible().catch(() => false)) { await t2.click(); await page.waitForTimeout(500); await shot('06_europapokal_baum'); }
  }
}

if (mode === 'match') {
  let due = false;
  for (let i = 0; i < 200 && !due; i++) {
    if (await visible('button:has-text("Textmodus")')) { due = true; break; }
    if (await visible('.dr-root')) { await page.keyboard.press('Escape'); await page.waitForTimeout(250); await page.keyboard.press('Escape'); }
    await closeModals();
    const w = page.locator('.hd-continue:not(.running)').first();
    if (await w.isVisible().catch(() => false)) await w.click({ timeout: 1500 }).catch(() => {});
    await page.waitForTimeout(350);
  }
  if (!due) { console.log('Kein eigenes Spiel erreicht'); process.exit(1); }
  await page.click('button:has-text("Textmodus")');
  await page.waitForTimeout(1500);
  await page.click('.ms-speed >> text=Schnell').catch(() => {});
  await shot('01_anpfiff');
  const skip = page.locator('.ms-top-r button:has-text("Bis zur Pause")');
  if (await skip.isVisible().catch(() => false)) { await skip.click(); await page.waitForTimeout(4000); }
  await shot('02_halbzeit');
  console.log('Kopf:', (await page.locator('.ms-top-l').innerText().catch(() => '')).replace(/\s+/g, ' '));
  console.log('Gesamt:', (await page.locator('.ms-agg').innerText().catch(() => '–')).replace(/\s+/g, ' '));
}

console.log(errors.length ? errors.join('\n') : 'Keine JS-Fehler.');
await browser.close();
server.close();
process.exit(errors.length ? 1 : 0);
