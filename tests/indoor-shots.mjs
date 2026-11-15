// Screenshots der Hallen-Show (screens/indoor/) bei 1920×1080 und 1366×768:
// Startseite, Nächstes Spiel mit Entscheidung, kurzer Textmodus (laufend + Abpfiff),
// Übersicht nach fremden Spielen, Siegerehrung; dazu Klick auf einen Teilnehmer
// (Hallenkader + Kaderwahl), danach Statistiken › Halle (Masters-Wertung, Hallenkönige).
// Prüft feste Größe der Mittelkarte, waagerechten Überlauf und JS-Fehler.
//   npm run build
//   DUMP=test-output/indoor/save1990.txt UNTIL=1990-12-19 node scripts/sim.mjs 15
//   SAVE=test-output/indoor/save1990.txt node tests/indoor-shots.mjs [ordner]
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { pickOption } from './select3.mjs';

const outDir = process.argv[2] || 'test-output/indoor';
const SAVE = process.env.SAVE || 'test-output/indoor/save1990.txt';
await mkdir(outDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(join('dist', path))); }
  catch { res.writeHead(404).end(); }
}).listen(0);

const browser = await chromium.launch();
const errors = [];
const raw = await readFile(SAVE, 'utf8');

async function run(width, height) {
  const tag = `${width}`;
  const page = await browser.newPage({ viewport: { width, height } });
  page.on('pageerror', (e) => errors.push(`[${tag}] JS-Fehler: ${e.message}`));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
  await page.reload();
  await page.click('text=Spiel laden');
  await page.click('.card:has(button:has-text("Löschen")) button:has-text("Laden") >> nth=0');
  await page.waitForTimeout(1500);

  // Zeit laufen lassen, bis die Hallen-Show erscheint (andere Fenster schließen).
  const t0 = Date.now();
  for (let k = 0; k < 80 && !(await page.locator('.ix-root').count()); k++) {
    if (await page.locator('.gb-root').count()) { await page.keyboard.press('Escape'); await page.waitForTimeout(300); continue; }
    if (await page.locator('.dr-root').count()) { await page.keyboard.press('Escape'); await page.waitForTimeout(200); await page.keyboard.press('Escape'); continue; }
    const close = page.locator('.modal-overlay .modal-close, .modal-overlay button:has-text("Schließen")').first();
    if (await close.isVisible().catch(() => false)) { await close.click().catch(() => {}); await page.waitForTimeout(300); continue; }
    const btn = page.locator('.hd-continue').first();
    const txt = (await btn.textContent().catch(() => '')) || '';
    if (!/Pause/.test(txt)) await btn.click().catch(() => {});
    await page.waitForTimeout(700);
  }
  if (!(await page.locator('.ix-root').count())) { errors.push(`[${tag}] Hallen-Show nicht erschienen`); await page.screenshot({ path: `${outDir}/${tag}_fehlt.png` }); await page.close(); return; }
  console.log(`[${tag}] Show nach ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  const size = () => page.evaluate(() => { const r = document.querySelector('.ix-center')?.getBoundingClientRect(); return r ? `${Math.round(r.width)}×${Math.round(r.height)}` : '-'; });
  const overflow = () => page.evaluate(() => {
    const out = [];
    const root = document.querySelector('.ix-root');
    if (root && (root.scrollWidth > root.clientWidth + 1 || root.scrollHeight > root.clientHeight + 1)) out.push('Fenster läuft über');
    for (const el of document.querySelectorAll('.ix-panel, .ix-ticker, .ix-scroll, .ix-groups')) if (el.scrollWidth > el.clientWidth + 2) out.push(`${el.className}: waagerecht ${el.scrollWidth - el.clientWidth}px`);
    return out;
  });
  const sizes = [];
  const shot = async (name) => {
    await page.waitForTimeout(350);
    await page.screenshot({ path: `${outDir}/${tag}_${name}.png` });
    sizes.push(`${name} ${await size()}`);
    const o = await overflow();
    if (o.length) errors.push(`[${tag}] ${name}: ${o.join('; ')}`);
  };
  await shot('1_start');
  // Teilnehmer anklicken: Hallenkader + Kaderwahl, Größe bleibt, zurück zur Liste.
  const startSize = await size();
  const other = page.locator('.ix-epick:not(.me)').first();
  if (await other.count()) {
    const name = await other.locator('.ix-name').innerText();
    await other.click();
    await shot('1b_teilnehmer_kader');
    const sqTag = await page.locator('.ix-sq-tag').innerText().catch(() => '');
    const rows = await page.locator('.ix-esq-row').count();
    console.log(`[${width}] Teilnehmer ${name}: ${sqTag}, ${rows} Spieler, ${await page.locator('.ix-esq .ix-hs').count()} Hallenspezialisten`);
    if (!sqTag) errors.push(`[${width}] Teilnehmer-Kader ohne Kaderwahl-Etikett`);
    if ((await size()) !== startSize) errors.push(`[${width}] Mittelkarte ändert die Größe beim Teilnehmer-Kader (${startSize} → ${await size()})`);
    await page.click('.ix-back');
    await page.waitForTimeout(200);
    if (!(await page.locator('.ix-epick').count())) errors.push(`[${width}] Zurück zur Teilnehmerliste fehlt`);
  } else errors.push(`[${width}] keine Teilnehmer zum Anklicken`);
  // Hallenkader wählen: einen gewählten Feldspieler abwählen, einen anderen dazunehmen.
  const strBefore = await page.locator('.ix-pick-str').innerText();
  await page.locator('.ix-pick-t tbody tr.on:not(:has(.radio))').last().click();
  await page.locator('.ix-pick-t tbody tr:not(.on):not(.locked):not(.ix-pick-gap):not(:has(.radio))').first().click();
  const picked = await page.locator('.ix-pick-t tbody tr.on').count();
  console.log(`[${tag}] Hallenkader: ${strBefore} → ${await page.locator('.ix-pick-str').innerText()}, gewählt ${picked}`);
  if (picked < 7 || picked > 8) errors.push(`[${tag}] Hallenkader: ${picked} gewählt`);
  await page.click('.ix-root button:has-text("Turnier beginnen")');
  // Bis zum eigenen Spiel (fremde Spiele laufen durch).
  for (let k = 0; k < 20 && !(await page.locator('.ix-root button:has-text("Kurzer Textmodus")').count()); k++) {
    const go = page.locator('.ix-root button:has-text("Weiter bis"), .ix-root button:has-text("zu Ende spielen")').first();
    if (await go.count()) await go.click().catch(() => {});
    await page.waitForTimeout(900);
  }
  await page.click('.ix-root button:has-text("Offensiv")');
  await page.click('.ix-root button:has-text("Stammfünf")');
  await shot('2_naechstes_spiel');
  await page.click('.ix-root button:has-text("Kurzer Textmodus")');
  await page.waitForTimeout(3500);
  await shot('3_textmodus');
  for (let k = 0; k < 6; k++) { await page.keyboard.press('Space'); await page.waitForTimeout(150); }
  await page.click('.ix-root button:has-text("Zum Abpfiff")').catch(() => {});
  await shot('4_abpfiff');
  await page.click('.ix-root button:has-text("Weiter")');
  // Nächstes eigenes Spiel als Ergebnis, dann fremde Spiele.
  for (let k = 0; k < 20; k++) {
    if (await page.locator('.ix-cer').count()) break;
    if (await page.locator('.ix-root button:has-text("Nur Ergebnis")').count()) { await shot('5_uebersicht'); await page.click('.ix-root button:has-text("Nur Ergebnis")'); await page.waitForTimeout(500); break; }
    const go = page.locator('.ix-root button:has-text("Weiter bis"), .ix-root button:has-text("zu Ende spielen")').first();
    if (await go.count()) await go.click().catch(() => {});
    await page.waitForTimeout(900);
  }
  if (!(await page.locator('.ix-cer').count())) await page.click('.ix-root button:has-text("Alles simulieren")');
  await page.waitForTimeout(1200);
  await shot('6_siegerehrung');
  console.log(`[${tag}] Mittelkarte: ${sizes.join(' | ')}`);
  console.log(`[${tag}] ${await page.locator('.ix-cer-facts').innerText().catch(() => '')}`.replace(/\n+/g, ' · '));
  await page.click('.ix-root button:has-text("Schließen")');
  await page.waitForTimeout(500);
  if (await page.locator('.ix-root').count()) {
    // Am selben Wochenende kann ein zweites Turnier folgen (eigene Show).
    console.log(`[${tag}] weitere Show folgt: ${await page.locator('.ix-title').innerText()}`);
  }
  // Statistiken › Halle zeigt das Ergebnis, die Masters-Wertung und die Hallenkönige.
  for (let k = 0; k < 6 && (await page.locator('.ix-root').count()); k++) {
    await page.click('.ix-root button:has-text("Alles simulieren")').catch(() => {});
    await page.waitForTimeout(800);
    await page.click('.ix-root button:has-text("Schließen")').catch(() => {});
    await page.waitForTimeout(500);
  }
  const pause = page.locator('.hd-continue:has-text("Pause")');
  if (await pause.count()) await pause.click().catch(() => {});
  await page.locator('.hd-nav-item:has-text("Statistiken")').click();
  await page.waitForTimeout(250);
  await page.locator('.tn-sub-item:has-text("Halle")').first().click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${outDir}/${tag}_7_statistik_halle.png` });
  console.log(`[${tag}] Masters-Hinweis: ${(await page.locator('.mst-hint').innerText().catch(() => '-')).slice(0, 90)}`);
  await pickOption(page, page.locator('.hk-box .sel3').first(), 'kings');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${outDir}/${tag}_8_hallenkoenige.png` });
  const kings = await page.locator('.hk-table tbody tr').count();
  console.log(`[${tag}] Hallenkönige: ${kings} Zeilen`);
  if (!kings) errors.push(`[${tag}] Hallenkönige leer`);
  const ovf = await page.evaluate(() => [...document.querySelectorAll('.dbox, .hk-scroll, .mst-scroll')].filter((el) => el.scrollWidth > el.clientWidth + 2).map((el) => el.className));
  if (ovf.length) errors.push(`[${tag}] Statistik Halle läuft waagerecht über: ${ovf.join(', ')}`);
  await page.close();
}

await run(1920, 1080);
await run(1366, 768);
console.log(errors.length ? errors.join('\n') : 'Keine JS-Fehler, kein Überlauf.');
await browser.close();
server.close();
process.exit(errors.length ? 1 : 0);
