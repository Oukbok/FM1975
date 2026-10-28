// Oberflächentest des Datensatz-Editors (/editor/): jeden Bereich öffnen, einen
// Verein umbenennen, Wappen-/Trikotfeld prüfen, „Prüfen“, Export auslösen,
// „Ins Spiel übernehmen“ und im Spiel nachsehen, ob der Datensatz auftaucht.
//   node tests/editor-ui.mjs [ausgabeordner]
// Voraussetzung: `npm run build` (dist/) und Playwright.
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const outDir = process.argv[2] || 'test-output/editor';
await mkdir(outDir, { recursive: true });

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try {
    const body = await readFile(join('dist', path));
    res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(body);
  } catch { res.writeHead(404).end(); }
}).listen(0);
const base = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 950 }, acceptDownloads: true });
const page = await ctx.newPage();
const errors = [];
const fail = (m) => errors.push(m);
page.on('pageerror', (e) => fail('JS-Fehler: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.|Failed to load resource/.test(m.text())) fail('Konsole: ' + m.text()); });
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());

await page.goto(base + 'editor/');
await page.waitForSelector('.ed-nav-item');

// Jeder Bereich (und jeder Reiter darin) einmal.
const secs = await page.locator('.ed-nav-item').evaluateAll((els) => els.map((e) => e.getAttribute('data-sec')));
for (const s of secs) {
  await page.click(`.ed-nav-item[data-sec="${s}"]`);
  await page.waitForTimeout(150);
  await page.screenshot({ path: `${outDir}/${s}.png` });
  const tabs = await page.locator('.ed-tab').count();
  for (let t = 1; t < tabs; t++) {
    await page.locator('.ed-tab').nth(t).click();
    await page.waitForTimeout(120);
    await page.screenshot({ path: `${outDir}/${s}-tab${t}.png` });
  }
}

// Verein umbenennen (erste Zeile, Namensspalte) und Trikot ändern.
await page.click('.ed-nav-item[data-sec="clubs"]');
const nameCell = page.locator('.ed-table tbody tr').first().locator('td').nth(2).locator('input');
await nameCell.fill('Testhausen 75');
await page.locator('.ed-kit select').first().selectOption('hoops');
const title = await page.locator('.ed-side-title').innerText();
if (title !== 'Testhausen 75') fail(`Umbenennen nicht in der Vorschau: ${title}`);
await page.screenshot({ path: `${outDir}/clubs-edited.png` });

// Meta-ID setzen, prüfen, exportieren.
await page.click('.ed-nav-item[data-sec="general"]');
await page.locator('.ed-field').first().locator('input').fill('testsatz');
await page.locator('.ed-field').nth(1).locator('input').fill('Testsatz');
await page.click('.ed-tools >> text=Prüfen');
await page.waitForTimeout(150);
const nErr = await page.locator('.ed-issue.error').count();
if (nErr) fail(`Prüfen meldet ${nErr} Fehler: ${await page.locator('.ed-issue.error').first().innerText()}`);
await page.screenshot({ path: `${outDir}/check.png` });

const [dl] = await Promise.all([page.waitForEvent('download'), page.click('.ed-tools >> text=Exportieren')]);
const file = await dl.path();
const json = JSON.parse(await readFile(file, 'utf8'));
if (dl.suggestedFilename() !== 'testsatz.fm1975.json') fail(`Dateiname: ${dl.suggestedFilename()}`);
if (json.clubs.tier1[0].name !== 'Testhausen 75') fail('Export enthält die Umbenennung nicht');
const kit = json.kits?.[json.clubs.tier1[0].id];
if (!kit?.home || !kit?.away || kit.home.pattern !== 'hoops') fail('Export enthält das Trikot nicht vollständig');

// Ins Spiel übernehmen.
await page.click('.ed-tools >> text=Ins Spiel übernehmen');
await page.waitForSelector('.ed-msg.ok', { timeout: 3000 }).catch(() => fail('Übernehmen ohne Erfolgsmeldung'));

// Autosave: neu laden, Arbeitskopie muss bleiben.
await page.waitForTimeout(800);
await page.reload();
await page.waitForSelector('.ed-ds-name');
if (!(await page.locator('.ed-ds-name').innerText()).includes('Testsatz')) fail('Arbeitskopie nach dem Neuladen verloren');

// Im Spiel sichtbar? (gleiche Herkunft → gleiche IndexedDB)
const game = await ctx.newPage();
game.on('pageerror', (e) => fail('JS-Fehler (Spiel): ' + e.message));
await game.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
await game.goto(base);
await game.waitForTimeout(600);
const html = await game.content();
const found = await game.locator('text=Datensätze').count();
if (found) {
  await game.locator('text=Datensätze').first().click();
  await game.waitForTimeout(300);
  if (!(await game.locator('text=Testsatz').count())) fail('Datensatz erscheint im Spiel nicht unter „Datensätze“');
  await game.screenshot({ path: `${outDir}/game-datasets.png` });
} else if (!html.includes('Testsatz')) {
  console.log('Hinweis: kein Menüpunkt „Datensätze“ im Hauptmenü gefunden – Spielseite nicht geprüft.');
}

await browser.close();
server.close();
console.log(`Bereiche: ${secs.length}, Screenshots in ${outDir}`);
if (errors.length) { console.log('FEHLER:\n' + errors.join('\n')); process.exit(1); }
console.log('Editor-Test bestanden.');
