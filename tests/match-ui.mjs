// Oberflächentest Textmodus + Spielbericht: spielt bis zum ersten eigenen Spiel,
// verfolgt es im Textmodus (inkl. Spannungsmoment, Halbzeit, Wechsel, Taktik),
// simuliert das nächste Spiel schnell und öffnet den Bericht.
//   node tests/match-ui.mjs [ausgabeordner]
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { startNewGame } from './newgame-flow.mjs';

const outDir = process.argv[2] || 'test-output/match';
await mkdir(outDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(join('dist', path))); }
  catch { res.writeHead(404).end(); }
}).listen(0);
const url = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errors = [];
page.on('pageerror', (e) => errors.push('JS-Fehler: ' + e.message));
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
await page.goto(url);
await startNewGame(page);
await page.waitForTimeout(800);

const closeModals = async () => {
  for (const sel of ['button:has-text("Überspringen")', 'button:has-text("Fortsetzen")', 'button:has-text("Schließen")', 'button:has-text("OK")', '.modal-close']) {
    const b = page.locator(sel).first();
    if (await b.isVisible().catch(() => false)) await b.click().catch(() => {});
  }
};
async function untilMatchDue() {
  for (let i = 0; i < 120; i++) {
    if (await page.locator('button:has-text("Textmodus")').isVisible().catch(() => false)) return true;
    await closeModals();
    const w = page.getByRole('button', { name: /weiter/i }).first();
    if (await w.isVisible().catch(() => false)) await w.click().catch(() => {});
    await page.waitForTimeout(700);
  }
  return false;
}

if (!(await untilMatchDue())) { console.log('Kein eigenes Spiel erreicht'); process.exit(1); }
await page.screenshot({ path: `${outDir}/01_kopf_knoepfe.png` });
await page.click('button:has-text("Textmodus")');
await page.waitForTimeout(2500);
await page.screenshot({ path: `${outDir}/02_textmodus_start.png` });
const fail = (m) => { console.log('FEHLER: ' + m); errors.push(m); };

// Einstellungen: Tempo „Rasant“, Optionen-Kasten
await page.click('.tm-act-grid >> text=Einstellungen');
await page.locator('.tm-speed input[type=range]').fill('3');
await page.waitForTimeout(300);
await page.screenshot({ path: `${outDir}/03_optionen.png` });
await page.click('.tm-act-grid >> text=Einstellungen');

// Wechsel-Bildschirm schließen, falls eine Option angehalten hat
const confirmStop = async () => {
  if (await page.locator('.tm-cs').isVisible().catch(() => false)) {
    if (await page.locator('.tm-cs-tabs >> text=Halbzeitansprache').isVisible().catch(() => false)) return 'halbzeit';
    await page.click('.tm-cs-ok'); await page.waitForTimeout(300); return 'stop';
  }
  return null;
};

// Spannungsmoment im Block abfangen (Chancen-Meter gleichzeitig sichtbar)
let caught = false, meter = false;
for (let i = 0; i < 1500 && !caught; i++) {
  if (!meter && await page.locator('.tm-meter.lvl-3, .tm-meter.lvl-2').isVisible().catch(() => false)) {
    await page.locator('.tm-stage').screenshot({ path: `${outDir}/04_meter.png` }).catch(() => {}); meter = true;
  }
  if (await page.locator('.tm-tk-susp.rolling').isVisible().catch(() => false)) {
    await page.screenshot({ path: `${outDir}/04_spannung.png` });
    await page.locator('.tm-tk-susp.rolling').waitFor({ state: 'detached', timeout: 4000 }).catch(() => {});
    await page.screenshot({ path: `${outDir}/05_aufloesung.png` });
    caught = true;
  }
  if ((await confirmStop()) === 'halbzeit') break;
  await page.waitForTimeout(80);
}
if (!caught) console.log('Hinweis: kein Spannungsmoment vor der Pause erwischt.');

// Pause, Aufwärmen, Reiter (vorher einen offenen Stopp bestätigen)
let sawHalf = false;
if ((await confirmStop()) === 'halbzeit') { sawHalf = true; await page.screenshot({ path: `${outDir}/17_halbzeit.png` }); await page.click('.tm-cs-ok'); await page.waitForTimeout(300); }
await page.click('.tm-rbtn >> nth=0');
await confirmStop();
await page.locator('.tm-warm >> nth=0').click().catch(() => fail('Aufwärmen nicht klickbar'));
await page.waitForTimeout(300);
if (!(await page.locator('.tm-warm.on').count())) fail('Aufwärmen ohne Wirkung');
await page.screenshot({ path: `${outDir}/06_aufwaermen.png` });
for (const [tab, f] of [['Taktik', '07_taktik'], ['Statistik', '07_statistik'], ['Gegner', '07_gegner'], ['Live', '07_live'], ['Tabelle', '07_tabelle']]) {
  await page.click(`.tm-rpanel .tm-tabs >> text=${tab}`);
  await page.waitForTimeout(200);
  await page.locator('.tm-right').screenshot({ path: `${outDir}/${f}.png` });
}
await page.click('.tm-rpanel .tm-tabs >> text=Team');
for (const [tab, f] of [['Tore', '08_tore'], ['Wechsel', '08_wechselfilter'], ['Alles', '08_alles']]) {
  await page.click(`.tm-ticker .tm-tabs >> text=${tab}`);
  await page.waitForTimeout(150);
}

// Wechsel-Bildschirm: Ziehen (Positionstausch), Wechsel per Klick, Formation, Taktik
if (!sawHalf && (await confirmStop()) !== 'halbzeit') {
  await page.click('.tm-change-btn');
  await page.waitForSelector('.tm-cs');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${outDir}/09_wechselscreen.png` });
  const s1 = page.locator('.tm-sys-slot').nth(9), s2 = page.locator('.tm-sys-slot').nth(10);
  const b1 = await s1.boundingBox(), b2 = await s2.boundingBox();
  if (b1 && b2) {
    await page.mouse.move(b1.x + b1.width / 2, b1.y + b1.height / 2); await page.mouse.down();
    await page.mouse.move(b1.x + 40, b1.y + 30, { steps: 4 });
    await page.mouse.move(b2.x + b2.width / 2, b2.y + b2.height / 2, { steps: 8 });
    await page.screenshot({ path: `${outDir}/10_ziehen.png` });
    await page.mouse.up();
  }
  await page.locator('.tm-cs-row.field').nth(6).click();
  await page.locator('.tm-cs-row.bench').nth(0).click();
  await page.waitForTimeout(200);
  if (!(await page.locator('.tm-tag.rein').count())) fail('Geplanter Wechsel nicht markiert');
  await page.screenshot({ path: `${outDir}/11_wechsel_geplant.png` });
  await page.locator('.tm-sys-head select').selectOption({ index: 1 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${outDir}/12_formation.png` });
  await page.click('.tm-cs-lfoot >> text=Taktik öffnen');
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${outDir}/13_spieltaktik.png` });
  await page.click('.tm-cs-tabs >> text=Spielergespräche');
  await page.locator('.tm-pt-row .tm-chip >> nth=0').click();
  await page.screenshot({ path: `${outDir}/14_gespraeche.png` });
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.click('.tm-cs-tabs >> text=Aufstellung');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${outDir}/15_wechselscreen_1366.png` });
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.click('.tm-cs-ok');
  await page.waitForTimeout(400);
  await page.click('.tm-ticker .tm-tabs >> text=Wechsel');
  await page.waitForTimeout(200);
  if (!(await page.locator('.tm-tk-row').count())) fail('Wechsel nicht in der Ereignisliste');
  await page.screenshot({ path: `${outDir}/16_nach_wechsel.png` });
  await page.click('.tm-ticker .tm-tabs >> text=Alles');
  await page.click('.tm-rbtn >> nth=0'); // weiter
}

// Bis zur Halbzeit (Stopps bestätigen)
let ht = false;
for (let i = 0; i < 40 && !ht && !sawHalf; i++) {
  const st = await confirmStop();
  if (st === 'halbzeit') { ht = true; break; }
  await page.locator('.tm-rbtn >> nth=1').click({ timeout: 1000 }).catch(() => {});
  await page.waitForTimeout(500);
}
if (!ht && !sawHalf) fail('Halbzeit-Stopp fehlt');
else if (!ht) console.log('Halbzeit früh erreicht (Stopp gesehen).');
else {
  await page.screenshot({ path: `${outDir}/17_halbzeit.png` });
  await page.click('.tm-cs-tabs >> text=Halbzeitansprache');
  await page.locator('.tm-talk-opt >> nth=1').click();
  await page.screenshot({ path: `${outDir}/18_ansprache.png` });
  await page.click('.tm-cs-ok');
  await page.waitForTimeout(800);
}
await page.setViewportSize({ width: 1366, height: 768 });
await page.waitForTimeout(400);
await page.screenshot({ path: `${outDir}/19_zweite_halbzeit_1366.png` });
await page.setViewportSize({ width: 1920, height: 1080 });

// Automatische Auswechslungen an, bis zum Ende
await page.click('.tm-act-grid >> text=Einstellungen');
await page.click('.tm-check:has-text("Automatische Auswechslungen")');
await page.click('.tm-act-grid >> text=Einstellungen');
for (let i = 0; i < 60; i++) {
  if (await page.locator('.ms-continue').isVisible().catch(() => false)) break;
  await confirmStop();
  await page.locator('.tm-rbtn >> nth=1').click({ timeout: 1000 }).catch(() => {});
  await page.waitForTimeout(500);
}
await page.screenshot({ path: `${outDir}/20_ende.png` });
await page.click('.ms-continue');
await page.waitForTimeout(800);
await page.screenshot({ path: `${outDir}/21_zurueck.png` });

// Nächstes Spiel schnell simulieren → Spielbericht
if (await untilMatchDue()) {
  await page.click('button:has-text("Schnell simulieren")');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${outDir}/12_bericht.png` });
}
console.log(errors.length ? errors.join('\n') : 'Keine JS-Fehler.');
await browser.close();
server.close();
