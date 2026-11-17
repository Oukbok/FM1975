// Oberflächentest Datensatz-Bibliothek + Spielerbilder (Wunsch Pascal):
// Editor-Startseite „Datensätze“ → Neu → Spielerbild hochladen/zuschneiden (Spieler + Legende)
// → Speichern → Im Spiel verwenden → Exportieren → Löschen → Importieren (auch Doppel + kaputte
// Datei) → im Spiel aktiv (Hauptmenü › Datensätze, Assistent vorausgewählt) → Spielstand mit
// diesem Datensatz laden: Spielerbild im Kader und im Spielerprofil.
//   npm run build && node scripts/run-ts.mjs tests/portrait-prep.ts test-output/portrait-prep.json
//   node tests/dataset-lib.mjs [ordner]
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const outDir = process.argv[2] || 'test-output/datasets';
await mkdir(outDir, { recursive: true });
const PREP = process.env.PREP || 'test-output/portrait-prep.json';
if (!existsSync(PREP)) spawnSync(process.execPath, ['scripts/run-ts.mjs', 'tests/portrait-prep.ts', PREP], { stdio: 'inherit' });
const prep = JSON.parse(await readFile(PREP, 'utf8'));

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.webp': 'image/webp', '.wav': 'audio/wav' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(join('dist', path))); }
  catch { res.writeHead(404).end(); }
}).listen(0);
const base = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 950 }, acceptDownloads: true });
const page = await ctx.newPage();
const errors = [];
const fail = (m) => errors.push(m);
page.on('pageerror', (e) => fail('JS-Fehler (Editor): ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.|Failed to load resource/.test(m.text())) fail('Konsole: ' + m.text()); });
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
const photo = await readFile('bilder/presse/1975/vertrag.webp');
const photo2 = await readFile('bilder/presse/1975/training.webp');
const step = async (name, fn) => { try { await fn(); } catch (e) { fail(`${name}: ${e.message.split('\n')[0]}`); } };

// --- 1) Editor: Startseite, Neu -------------------------------------------------------------
await page.goto(base + 'editor/');
await page.waitForSelector('.ed-home');
await page.screenshot({ path: `${outDir}/1_start.png` });
await step('Neu', async () => {
  await page.click('[data-act="home-new"]');
  await page.locator('.ed-dlg input').fill('Bildtest');
  await page.click('[data-act="dlg-ok"]');
  await page.waitForSelector('.ed-lib tr[data-lib="bildtest"]', { timeout: 4000 });
  if (!(await page.locator('.ed-ds-name').innerText()).includes('Bildtest')) fail('Neu: Arbeitskopie heißt nicht „Bildtest“');
});

// --- 2) Spielerbild für einen Spieler (Bereich Spielerbilder & Fotos) -----------------------------
const upload = async (scope, buf) => {
  const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.locator(`${scope} [data-act="portrait-add"]`).first().click()]);
  await fc.setFiles({ name: 'bild.webp', mimeType: 'image/webp', buffer: buf });
  await page.waitForSelector(`${scope} .ed-portrait-frame.crop`, { timeout: 4000 });
};
await step('Spielerbild Spieler', async () => {
  await page.click('.ed-nav-item[data-sec="photos"]');
  await page.locator('.ed-table-bar button:has-text("Hinzufügen")').click();
  const side = page.locator('.ed-photo-side');
  await side.locator('.ed-field:has-text("Spieler (voller Name)") input').fill(prep.player);
  await upload('.ed-photo-side', photo);
  await side.locator('.ed-portrait-zoom').fill('1.6');
  const box = await side.locator('.ed-portrait-frame').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 30, box.y + box.height / 2 + 20, { steps: 5 });
  await page.mouse.up();
  await side.screenshot({ path: `${outDir}/2_portrait_zuschnitt.png` });
  await side.locator('[data-act="portrait-apply"]').click();
  await page.waitForSelector('.ed-photo-side .ed-portrait-img');
  const r = await side.locator('.ed-portrait-img').evaluate((img) => ({ w: img.naturalWidth, h: img.naturalHeight, src: img.src.slice(0, 30) }));
  if (r.w !== 512 || r.h !== 600) fail(`Spielerbild: ${r.w}×${r.h} statt 512×600`);
  if (!/^data:image\/(webp|jpeg);base64,/.test(r.src)) fail(`Spielerbild: Format ${r.src}`);
  await side.screenshot({ path: `${outDir}/3_portrait_fertig.png` });
});
await step('Ungespeichert-Anzeige', async () => {
  if (!await page.locator('.ed-top [data-state="dirty"]').count()) fail('Ungespeicherte Änderungen werden nicht angezeigt');
});

// --- 3) Spielerbild für eine Legende (Formular „Ausnahmetalente“) --------------------------------
await step('Spielerbild Legende', async () => {
  await page.click('.ed-nav-item[data-sec="legends"]');
  await page.locator('.ed-table tbody tr').nth(3).click();
  await upload('.ed-legend', photo2);
  await page.locator('.ed-legend [data-act="portrait-center"]').click();
  await page.locator('.ed-legend [data-act="portrait-apply"]').click();
  await page.waitForSelector('.ed-legend .ed-portrait-img');
  await page.locator('.ed-legend .ed-portrait').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${outDir}/4_legende_portrait.png` });
  await page.click('.ed-nav-item[data-sec="photos"]');
  if (await page.locator('.ed-table tbody tr').count() !== 2) fail('Legenden-Spielerbild fehlt in der Liste der Spielerbilder');
});

// --- 4) Speichern, Im Spiel verwenden, Kennzahlen -------------------------------------------
await step('Speichern', async () => {
  await page.click('.ed-tools [data-act="save"]');
  await page.waitForSelector('.ed-msg.ok', { timeout: 4000 });
  if (await page.locator('.ed-top [data-state="dirty"]').count()) fail('Nach dem Speichern noch „ungespeichert“');
  await page.click('.ed-tools [data-act="datasets"]');
  await page.waitForSelector('.ed-home [data-state="saved"]');
  await page.locator('.ed-lib tr[data-lib="bildtest"] [data-act="lib-use"]').click();
  await page.waitForSelector('.ed-lib tr[data-lib="bildtest"] .ed-badge.good');
  if ((await page.locator('[data-active-name]').innerText()).trim() !== 'Bildtest') fail('Karte „Im Spiel aktiv“ zeigt nicht Bildtest');
  await page.waitForFunction(() => !document.querySelector('.ed-lib tr[data-lib="bildtest"]')?.textContent?.includes('…'), null, { timeout: 8000 });
  const imgs = await page.locator('.ed-lib tr[data-lib="bildtest"] td.num').nth(2).innerText();
  if (Number(imgs) !== 2) fail(`Bibliothek: ${imgs} Bilder statt 2`);
  await page.screenshot({ path: `${outDir}/5_startseite.png` });
});

// --- 5) Export → Löschen → Import ------------------------------------------------------------
let file = null;
await step('Export', async () => {
  const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('.ed-lib tr[data-lib="bildtest"] [data-act="lib-export"]').click()]);
  if (dl.suggestedFilename() !== 'bildtest.fm1975') fail(`Dateiname: ${dl.suggestedFilename()}`);
  file = await dl.path();
  const json = JSON.parse(await readFile(file, 'utf8'));
  const ports = (json.playerPhotos ?? []).filter((x) => x.portrait);
  if (ports.length !== 2 || !ports.some((x) => x.name === prep.player) || !ports.some((x) => x.legendId)) fail(`Export: Spielerbilder ${JSON.stringify((json.playerPhotos ?? []).map((x) => [x.name, x.legendId, !!x.portrait]))}`);
});
await step('Löschen', async () => {
  await page.locator('.ed-lib tr[data-lib="bildtest"] [data-act="lib-del"]').click();
  await page.click('[data-act="confirm-delete"]');
  await page.waitForSelector('.ed-lib tr[data-lib="bildtest"]', { state: 'detached', timeout: 4000 });
  if (!(await page.locator('[data-active-name]').innerText()).includes('Standard')) fail('Nach dem Löschen ist nicht wieder der Standard aktiv');
  if (!await page.locator('.ed-home [data-card="work"] [data-state="dirty"], .ed-home [data-card="work"] [data-state="new"]').count()) fail('Gelöschter geöffneter Datensatz nicht als ungespeichert markiert');
});
const importFile = async (f) => {
  const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click('[data-act="home-import"]')]);
  await fc.setFiles(f);
};
await step('Import', async () => {
  await importFile(file);
  await page.waitForSelector('.ed-lib tr[data-lib="bildtest"]', { timeout: 6000 });
  await importFile(file);
  await page.click('[data-act="import-copy"]');
  await page.waitForSelector('.ed-lib tr[data-lib="bildtest-2"]', { timeout: 6000 });
  await page.locator('.ed-lib tr[data-lib="bildtest-2"] [data-act="lib-del"]').click();
  await page.click('[data-act="confirm-delete"]');
  await importFile({ name: 'kaputt.fm1975', mimeType: 'application/json', buffer: Buffer.from('{"format":"fm1975-dataset", kaputt') });
  await page.waitForSelector('[data-import-err]', { timeout: 4000 });
  if (!(await page.locator('[data-import-err]').innerText()).includes('keine Datensatz-Datei')) fail('Kaputte Datei: Fehlermeldung unklar');
  await page.screenshot({ path: `${outDir}/6_import_fehler.png` });
  await importFile({ name: 'falsch.json', mimeType: 'application/json', buffer: Buffer.from('{"format":"fm1975-dataset","version":1,"meta":{"id":"x","name":"X"},"clubs":{"tier1":[]}}') });
  await page.waitForFunction(() => document.querySelector('[data-import-err]')?.textContent?.includes('mindestens 6 Vereine'), null, { timeout: 4000 });
  // Laden mit ungespeicherten Änderungen → Rückfrage → Verwerfen und laden
  await page.locator('.ed-lib tr[data-lib="bildtest"] [data-act="lib-load"]').click();
  if (await page.locator('[data-act="discard"]').count()) await page.click('[data-act="discard"]');
  await page.waitForSelector('.ed-home [data-card="work"] [data-state="saved"]', { timeout: 4000 });
  await page.locator('.ed-lib tr[data-lib="bildtest"] [data-act="lib-use"]').click();
  await page.waitForSelector('.ed-lib tr[data-lib="bildtest"] .ed-badge.good');
  await page.screenshot({ path: `${outDir}/7_nach_import.png` });
});

// --- 6) Spiel: aktiver Datensatz + Spielerbild im Spielstand ---------------------------------
const game = await ctx.newPage();
game.on('pageerror', (e) => fail('JS-Fehler (Spiel): ' + e.message));
await game.goto(base);
await game.evaluate(({ save }) => {
  localStorage.setItem('fm1980_save_sim', save);
  localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim']));
}, { save: prep.save });
await game.reload();
await game.waitForTimeout(800);
await step('Hauptmenü › Datensätze', async () => {
  await game.click('text=Datensätze & Editor');
  await game.waitForTimeout(300);
  if (!await game.locator('[data-active="1"]').count()) fail('Hauptmenü › Datensätze: kein aktiver Datensatz markiert');
  if (!(await game.locator('.row:has([data-active="1"])').innerText()).includes('Bildtest')) fail('Hauptmenü › Datensätze: Bildtest nicht aktiv');
  await game.screenshot({ path: `${outDir}/8_spiel_datensaetze.png` });
  await game.click('button:has-text("Zurück")');
});
await step('Assistent: Datensatz vorausgewählt', async () => {
  await game.click('text=Neues Spiel');
  await game.waitForSelector('.ng-root');
  await game.fill('.ng-field input[placeholder*="Max"]', 'Test');
  await game.fill('.ng-field input[placeholder*="Mustermann"]', 'Tester');
  await game.click('.ng-foot button:has-text("Weiter")');
  await game.waitForSelector('.ng-modes');
  await game.click('.ng-foot button:has-text("Weiter")');
  await game.waitForSelector('.ng-ctable');
  const on = await game.locator('.ng-optlist .ng-opt.on').innerText();
  if (!on.includes('Bildtest')) fail(`Assistent: vorausgewählt „${on.split('\n')[0]}“ statt Bildtest`);
  await game.screenshot({ path: `${outDir}/9_assistent.png` });
});
await step('Spielstand laden', async () => {
  await game.reload();
  await game.waitForTimeout(800);
  await game.click('text=Spiel laden');
  await game.click('.card:has(button:has-text("Löschen")) button:has-text("Laden") >> nth=0');
  await game.waitForTimeout(1500);
  for (let i = 0; i < 3 && await game.locator('.bf-continue').count(); i++) { await game.locator('.bf-continue').click(); await game.waitForTimeout(200); }
  for (let i = 0; i < 4; i++) { await game.keyboard.press('Escape'); await game.waitForTimeout(150); }
  for (let k = 0; k < 6 && await game.locator('.modal-overlay').count(); k++) {
    const x = game.locator('.modal-close, button:has-text("Schließen"), button:has-text("OK"), button:has-text("Weiter")').first();
    if (await x.isVisible().catch(() => false)) await x.click().catch(() => {}); else break;
    await game.waitForTimeout(300);
  }
});
await step('Kader + Spielerprofil', async () => {
  await game.locator('.hd-nav-item:has-text("Kader")').first().click();
  await game.waitForTimeout(300);
  await game.locator('.tn-sub-item:has-text("Übersicht")').first().click();
  await game.waitForTimeout(600);
  const row = game.locator(`.dtable tbody tr:has-text("${prep.player}")`).first();
  await row.scrollIntoViewIfNeeded();
  await game.waitForTimeout(400);
  if (!await row.locator('.pa-photo.own').count()) fail('Kaderliste: Spielerbild nicht in der Miniatur');
  await game.screenshot({ path: `${outDir}/10_kader.png` });
  await row.click();
  await game.waitForSelector('.pp-modal', { timeout: 4000 });
  await game.waitForTimeout(600);
  const src = await game.locator('.pp2-face .pa-photo.own img').getAttribute('src').catch(() => null);
  if (!/^data:image\/(webp|jpeg)/.test(src ?? '')) fail(`Spielerprofil: kein hochgeladenes Spielerbild (${(src ?? 'keins').slice(0, 30)})`);
  await game.screenshot({ path: `${outDir}/11_profil.png` });
});

await browser.close();
server.close();
if (errors.length) { console.log('FEHLER:\n' + errors.join('\n')); process.exit(1); }
console.log(`Datensatz-Bibliothek + Spielerbilder geprüft (${prep.player}), Screenshots in ${outDir}`);
