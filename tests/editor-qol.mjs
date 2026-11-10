// Oberflächentest der Editor-Komfortfunktionen (Wunsch Pascal: QoL für Modder):
// Rückgängig/Wiederholen, globale Suche mit Sprung, Änderungen gegenüber dem
// Standard (mit Zurücksetzen), CSV-Export/-Import, Mehrfachbearbeitung,
// Duplizieren, Sprung von Prüffehlern zum Eintrag.
//   node tests/editor-qol.mjs [ausgabeordner]      (Voraussetzung: npm run build)
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const outDir = process.argv[2] || 'test-output/editor-qol';
await mkdir(outDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' };
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
const fail = (m) => { errors.push(m); console.log('  FEHLER: ' + m); };
page.on('pageerror', (e) => fail('JS-Fehler: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.|Failed to load resource/.test(m.text())) fail('Konsole: ' + m.text()); });
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
await page.goto(base + 'editor/');
await page.waitForSelector('.ed-nav-item');
const nav = async (s) => { await page.click(`.ed-nav-item[data-sec="${s}"]`); await page.waitForTimeout(150); };
const rows = () => page.locator('.ed-content .ed-table tbody tr');
const search = async (q) => {
  await page.fill('[data-act="global-search"]', q);
  await page.waitForTimeout(350);
  await page.press('[data-act="global-search"]', 'Enter');
  await page.waitForTimeout(500);
};
const activeSec = () => page.locator('.ed-nav-item.on').getAttribute('data-sec');

// 1) Rückgängig / Wiederholen
await nav('clubs');
const cell = () => rows().first().locator('td').nth(2).locator('input');
const orig = await cell().inputValue();
await cell().fill('Undohausen');
await page.waitForTimeout(700);
await page.click('[data-act="undo"]');
await page.waitForTimeout(200);
if (await cell().inputValue() !== orig) fail(`Rückgängig: Name ist „${await cell().inputValue()}“ statt „${orig}“`);
await page.click('[data-act="redo"]');
await page.waitForTimeout(200);
if (await cell().inputValue() !== 'Undohausen') fail('Wiederholen stellt die Änderung nicht her');
await page.click('.ed-head h1');
await page.keyboard.press('Control+z');
await page.waitForTimeout(200);
if (await cell().inputValue() !== orig) fail('Strg+Z wirkt nicht');
await page.keyboard.press('Control+y');
await page.waitForTimeout(200);

// 2) Änderungen gegenüber dem Standard
await nav('changes');
const chg = page.locator('.ed-changes tbody tr');
if (!(await chg.count())) fail('Änderungen: keine Zeile trotz Umbenennung');
else if (!(await chg.first().innerText()).includes('Undohausen')) fail(`Änderungen: erste Zeile ohne neuen Namen: ${await chg.first().innerText()}`);
await page.screenshot({ path: `${outDir}/changes.png` });
await chg.first().locator('button:has-text("Zeigen")').click();
await page.waitForTimeout(500);
if (await activeSec() !== 'clubs') fail('Änderungen › Zeigen springt nicht zu „Vereine“');
await nav('changes');
await page.locator('[data-act="chg-revert"]').first().click();
await page.waitForTimeout(200);
if (await chg.count()) fail(`Zurücksetzen: noch ${await chg.count()} Änderung(en): ${(await chg.allInnerTexts()).join(" / ")}`);

// 3) Globale Suche: Legende und Auslandsverein
await nav('legends');
await rows().nth(9).click();
const lname = await rows().nth(9).locator('td').nth(2).locator('input').inputValue();
await nav('general');
await search(lname);
if (await activeSec() !== 'legends') fail(`Suche „${lname}“ landet in ${await activeSec()}`);
else if (!(await page.locator('.ed-content tr.sel').count()) || !(await page.locator('.ed-content tr.sel').innerText().catch(() => '')).length) fail('Suche: Legenden-Zeile nicht ausgewählt');
const selName = await page.locator('.ed-content tr.sel td').nth(2).locator('input').inputValue().catch(() => '');
if (selName !== lname) fail(`Suche: ausgewählt „${selName}“ statt „${lname}“`);
await page.screenshot({ path: `${outDir}/search-legend.png` });

await nav('world');
await page.click('[data-cc="eng"]');
await page.waitForTimeout(200);
const wid = await rows().nth(4).locator('td').nth(1).locator('input').inputValue();
await nav('general');
await page.fill('[data-act="global-search"]', wid);
await page.waitForTimeout(350);
await page.screenshot({ path: `${outDir}/search-results.png` });
await page.press('[data-act="global-search"]', 'Enter');
await page.waitForTimeout(600);
if (await activeSec() !== 'clubs') fail(`Suche „${wid}“ landet in ${await activeSec()}`);
const ccSel = await page.locator('[data-act="club-country"]').inputValue().catch(() => '');
if (ccSel !== 'eng') fail(`Suche: Land ${ccSel} statt eng`);
if (!(await page.locator(`.ed-content tr[data-rowid="${wid}"].sel`).count())) fail('Suche: Auslandsverein nicht ausgewählt');

// 4) CSV-Export und -Import (Amateur-Pool)
await nav('pool');
const n0 = await rows().count();
const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-act="csv-export"]')]);
const csv = (await readFile(await dl.path(), 'utf8')).replace(/^﻿/, '');
const lines = csv.trim().split(/\r?\n/);
if (lines[0] !== 'town;group') fail(`CSV-Kopf: ${lines[0]}`);
if (lines.length !== n0 + 1) fail(`CSV: ${lines.length - 1} Zeilen statt ${n0}`);
const [t1] = lines[1].split(';');
const edited = [lines[0], `${t1};nordost`, 'Testheim;sued', 'Fehlstadt;mond'].join('\n');
const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click('[data-act="csv-import"]')]);
await fc.setFiles({ name: 'pool.csv', mimeType: 'text/csv', buffer: Buffer.from(edited) });
await page.waitForTimeout(300);
const note = await page.locator('.ed-note').innerText().catch(() => '');
if (!/1 geändert, 2 neu/.test(note) || !/ungültig/.test(note)) fail(`CSV-Import-Meldung: ${note}`);
if (await rows().count() !== n0 + 2) fail(`CSV-Import: ${await rows().count()} statt ${n0 + 2} Zeilen`);
await page.screenshot({ path: `${outDir}/csv-import.png` });

// 5) Mehrfachbearbeitung (Europa › Länder: Niveau +5) und Duplizieren (Chronik)
await nav('europe');
const before = [];
for (let i = 0; i < 3; i++) before.push(+(await rows().nth(i).locator('td').nth(3).locator('input').inputValue()));
await rows().nth(0).locator('.ed-row-act input[type=checkbox]').click();
await rows().nth(2).locator('.ed-row-act input[type=checkbox]').click({ modifiers: ['Shift'] });
const marked = await page.locator('.ed-content tr.marked').count();
if (marked !== 3) fail(`Umschalt-Klick markiert ${marked} statt 3 Zeilen`);
await page.selectOption('.ed-bulk select', 'base');
await page.fill('.ed-bulk-val', '+5');
await page.click('[data-act="bulk-set"]');
await page.waitForTimeout(150);
for (let i = 0; i < 3; i++) {
  const v = +(await rows().nth(i).locator('td').nth(3).locator('input').inputValue());
  if (v !== before[i] + 5) fail(`Mehrfach +5: Zeile ${i + 1} ${before[i]} → ${v}`);
}
await page.screenshot({ path: `${outDir}/bulk.png` });

await nav('timeline');
const tl0 = await rows().count();
const tid = await rows().first().getAttribute('data-rowid');
await rows().first().locator('[data-act="row-dup"]').click();
await page.waitForTimeout(150);
const tid2 = await rows().nth(1).getAttribute('data-rowid');
if (await rows().count() !== tl0 + 1) fail('Duplizieren: keine neue Zeile');
if (tid2 !== `${tid.replace(/-\d+$/, '')}-2`) fail(`Duplizieren: neue ID „${tid2}“ (aus „${tid}“)`);

// 6) Prüffehler → Sprung zum Eintrag
await nav('clubs');
const idCell = rows().nth(3).locator('td').nth(1).locator('input');
await idCell.fill('Kaputte ID');
await page.click('.ed-tools >> text=Prüfen');
await page.waitForTimeout(200);
const issue = page.locator('[data-act="issue-jump"]:has-text("Kaputte ID")').first();
if (!(await issue.count())) fail('Prüfen meldet die kaputte ID nicht');
else {
  await issue.click();
  await page.waitForTimeout(600);
  if (await activeSec() !== 'clubs') fail('Prüffehler springt nicht zu „Vereine“');
  if (!(await page.locator('.ed-content tr[data-rowid="Kaputte ID"].sel').count())) fail('Prüffehler: Zeile nicht ausgewählt');
  await page.screenshot({ path: `${outDir}/issue-jump.png` });
}

await browser.close();
server.close();
if (errors.length) { console.log('FEHLER:\n' + errors.join('\n')); process.exit(1); }
console.log('Editor-Komfort-Test bestanden.');
