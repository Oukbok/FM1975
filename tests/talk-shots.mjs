// Screenshots des Spielergesprächs (views/kader/talk/): vor/nach dem Gespräch,
// verschiedene Spieler (müde, unzufrieden, Star), 1920×1080 und 1366×768.
// Prüft Überläufe im Buch und JS-Fehler.
//   npm run build && node tests/talk-shots.mjs [ordner]
//   Standard-Spielstand: Vorlage „Test 3 Jahre“; anderer mit SAVE=…
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const outDir = process.argv[2] || 'test-output/talk';
await mkdir(outDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.txt': 'text/plain' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(join('dist', path))); }
  catch { res.writeHead(404).end(); }
}).listen(0);
const raw = await readFile(process.env.SAVE || 'public/saves/test-3-jahre.txt', 'utf8');
const browser = await chromium.launch();
const errors = [];

async function open(w, h) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  page.on('pageerror', (e) => errors.push(`${w}: JS-Fehler: ${e.message}`));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
  await page.reload();
  await page.click('text=Spiel laden');
  await page.click('button:has-text("Laden") >> nth=0');
  await page.waitForTimeout(1500);
  for (let i = 0; i < 3 && await page.locator('.bf-continue').count(); i++) { await page.locator('.bf-continue').click(); await page.waitForTimeout(200); }
  for (let k = 0; k < 5 && await page.locator('.modal-overlay').count(); k++) {
    const x = page.locator('.modal-close, button:has-text("Schließen"), button:has-text("OK"), button:has-text("Weiter")').first();
    if (await x.isVisible().catch(() => false)) await x.click().catch(() => {}); else break;
    await page.waitForTimeout(250);
  }
  await page.locator('.hd-nav-item:has-text("Kader")').first().click();
  await page.waitForTimeout(250);
  await page.locator('.tn-sub-item:has-text("Übersicht")').first().click();
  await page.waitForTimeout(400);
  return page;
}

async function check(page, name) {
  const rep = await page.evaluate(() => {
    const out = [];
    const book = document.querySelector('.ptk-book');
    if (!book) return ['kein Buch'];
    const r = book.getBoundingClientRect();
    if (r.right > innerWidth + 1 || r.bottom > innerHeight + 1 || r.left < -1 || r.top < -1) out.push(`Buch ragt aus dem Fenster (${Math.round(r.width)}×${Math.round(r.height)})`);
    for (const el of book.querySelectorAll('.ptk-page, .ptk-row, .ptk-topic, .ptk-act, .ptk-name, .ptk-week, .ptk-perf, .ptk-card')) {
      if (el.scrollWidth > el.clientWidth + 2) out.push(`${el.className.split(' ')[0]}: waagerecht ${el.scrollWidth - el.clientWidth}px`);
      if (el.classList.contains('ptk-page') && el.scrollHeight > el.clientHeight + 2) out.push(`Seite: senkrecht ${el.scrollHeight - el.clientHeight}px`);
    }
    const sc = book.querySelector('.ptk-scene');
    if (sc && sc.getBoundingClientRect().height < 50) out.push(`Szene zu klein (${Math.round(sc.getBoundingClientRect().height)}px)`);
    return out;
  });
  console.log(`${name}: ${rep.length ? rep.join('; ') : 'ok'}`);
  if (rep.length) errors.push(`${name}: ${rep.join('; ')}`);
  await page.screenshot({ path: `${outDir}/${name}.png` });
}

async function talkTo(page, sortHeader, row, name, topicIdx = 0) {
  await page.locator(`.dtable th:has-text("${sortHeader}")`).first().click();
  await page.waitForTimeout(200);
  const rows = page.locator('.dtable tbody tr');
  const n = await rows.count();
  const r = rows.nth(row < 0 ? n + row : row);
  await r.locator('.ptk-open').click();
  await page.waitForTimeout(400);
  await check(page, `${name}_vorher`);
  const topics = page.locator('.ptk-topic');
  if (await topics.count()) {
    await topics.nth(Math.min(topicIdx, (await topics.count()) - 1)).click();
    await page.waitForTimeout(150);
    await check(page, `${name}_auswahl`);
    const say = page.locator('.ptk-act.main');
    if (await say.isEnabled()) { await say.click(); await page.waitForTimeout(1300); await check(page, `${name}_nachher`); }
  }
  await page.locator('.ptk-act:has-text("Schließen"), .ptk-act:has-text("Abbrechen")').first().click();
  await page.waitForTimeout(250);
}

{
  const page = await open(1920, 1080);
  await page.screenshot({ path: `${outDir}/kader_uebersicht.png` });
  await talkTo(page, 'Frische', 0, 'muede', 2);       // wenig Frische zuerst → Pause gönnen
  await talkTo(page, 'Moral', -1, 'unzufrieden', 99); // niedrigste Moral → letztes Thema
  await talkTo(page, 'Stärke', 0, 'star', 0);          // Stärkster → erstes Thema
  // Wochenlimit erreicht
  await page.locator('.dtable tbody tr').nth(4).locator('.ptk-open').click();
  await page.waitForTimeout(300);
  await check(page, 'limit');
  await page.locator('.ptk-round[aria-label="Nächster Spieler"]').click();
  await page.waitForTimeout(200);
  await page.locator('.ptk-x').click();
  await page.waitForTimeout(200);
  // Einstieg Kabine
  await page.locator('.tn-sub-item:has-text("Kabine")').first().click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${outDir}/kabine.png` });
  await page.locator('.kb-talk-open').click();
  await page.waitForTimeout(300);
  await check(page, 'kabine_popup');
  await page.close();
}
{
  const page = await open(1366, 768);
  await talkTo(page, 'Frische', 0, 'k1366_muede', 2);
  await talkTo(page, 'Stärke', 0, 'k1366_star', 0);
  await page.close();
}
await browser.close();
server.close();
if (errors.length) { console.log('\nPROBLEME:\n' + errors.join('\n')); process.exit(1); }
console.log('\nalles ok');
