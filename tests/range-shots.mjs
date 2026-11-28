// Screenshots der Zeitraum-Wahl 1 J. / 3 J. / 5 J. / 10 J. / Max (ui/RangeSeg.tsx) an allen Verlaufsdiagrammen.
//   npm run build && SAVE=public/saves/test-20-jahre.txt node tests/range-shots.mjs [ordner] [präfix]   (VIEW=1366x768 nur eine Größe)
// Je 1920×1080 und 1366×768: Finanzen (Kassenstand), Bilanz (Kontostand), Kabine (Stimmung),
// Fanartikel › Statistiken, Privat › Karriere (Ansehen), Vereinsprofil › Historie (Platzierungen),
// Spielerprofil › Statistiken. Meldet JS-Fehler, Seiten-Scroll und Größenänderungen der Box beim Umschalten.
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const outDir = process.argv[2] || 'test-output/range';
const prefix = process.argv[3] ? process.argv[3] + '_' : '';
await mkdir(outDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.txt': 'text/plain' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { const body = await readFile(join('dist', path)); res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(body); }
  catch { res.writeHead(404).end(); }
}).listen(0);

const raw = await readFile(process.env.SAVE || 'public/saves/test-20-jahre.txt', 'utf8');
const browser = await chromium.launch();
const errors = [];

const VIEWS = process.env.VIEW ? [process.env.VIEW.split('x').map(Number)] : [[1920, 1080], [1366, 768]];
for (const [w, h] of VIEWS) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  page.on('pageerror', (e) => errors.push(`${w}: JS-Fehler: ${e.message}`));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.evaluate((r) => { localStorage.clear(); localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
  await page.reload();
  await page.waitForTimeout(2500); // Umzug localStorage → IndexedDB (initSaveStore) abwarten
  await page.click('text=Spiel laden');
  await page.waitForTimeout(1000);
  await page.click('.card:has(button:has-text("Löschen")) button:has-text("Laden") >> nth=0');
  await page.waitForTimeout(2500);
  console.log(`${w}: geladen – ${(await page.locator('.hd-date, .tn-date').first().innerText().catch(() => '?')).trim()}`);
  for (let i = 0; i < 3 && await page.locator('.bf-continue').count(); i++) { await page.locator('.bf-continue').click(); await page.waitForTimeout(200); }
  for (let i = 0; i < 3 && await page.locator('.bm-close, button:has-text("Budget bestätigen")').count(); i++) { await page.locator('.bm-close, button:has-text("Budget bestätigen")').first().click().catch(() => {}); await page.waitForTimeout(200); }
  for (let i = 0; i < 3; i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(150); }

  const nav = async (main, sub) => {
    await page.locator(`.hd-nav-item:has-text("${main}")`).first().click();
    await page.waitForTimeout(300);
    if (sub) { await page.locator(`.tn-sub-item:has-text("${sub}")`).first().click(); await page.waitForTimeout(400); }
  };
  const shot = async (n) => {
    await page.waitForTimeout(300);
    const scroll = await page.evaluate(() => { const m = document.querySelector('.app-main'); return m ? m.scrollHeight - m.clientHeight : 0; });
    if (scroll > 2) errors.push(`${w} ${n}: Seite scrollt (${scroll}px)`);
    await page.screenshot({ path: `${outDir}/${prefix}${n}_${w}.png` });
  };
  /** Klickt alle freien Zeiträume der n-ten Wahl, prüft feste Boxgröße, Screenshot bei 1 J. und Max. */
  const cycle = async (name, scope = '', idx = 0) => {
    const seg = page.locator(`${scope} .rseg`).nth(idx);
    if (!await seg.count()) { errors.push(`${w} ${name}: keine Zeitraum-Wahl gefunden`); return; }
    const box = seg.locator('xpath=ancestor::*[contains(@class,"dbox") or contains(@class,"pp3-chart") or contains(@class,"bnd-chart")][1]');
    const size0 = await box.boundingBox().catch(() => null);
    const labels = await seg.locator('button').allInnerTexts();
    const states = [];
    for (let i = 0; i < labels.length; i++) {
      const b = seg.locator('button').nth(i);
      const off = await b.isDisabled();
      states.push(`${labels[i]}${off ? ' (gesperrt)' : ''}`);
      if (off) continue;
      await b.click(); await page.waitForTimeout(200);
      const s = await box.boundingBox().catch(() => null);
      if (size0 && s && (Math.abs(s.width - size0.width) > 1 || Math.abs(s.height - size0.height) > 1)) errors.push(`${w} ${name} ${labels[i]}: Boxgröße ändert sich`);
      const t = labels[i].replace(/[^0-9A-Za-z]/g, '');
      if (t === '1J' || t === 'Max' || t === '10J') {
        const plot = page.locator(`${scope} .lc, ${scope} .car-chart, ${scope} .cmx-chart, ${scope} .mc-chart-plot, ${scope} .pp3-chart-plot`).first();
        const pb = await plot.boundingBox().catch(() => null);
        if (pb) await page.mouse.move(pb.x + pb.width * 0.6, pb.y + pb.height * 0.5);
        await shot(`${name}_${t}`);
      }
    }
    console.log(`${w} ${name}: ${states.join(' · ')}`);
  };

  await nav('Finanzen'); await cycle('finanzen');
  await nav('Finanzen', 'Bilanz'); await cycle('bilanz');
  await nav('Kader', 'Kabine'); await cycle('kabine');
  await nav('Finanzen', 'Fanartikel');
  await page.locator('.sub3-tabs .tab:has-text("Statistiken")').first().click(); await page.waitForTimeout(300);
  await cycle('fanartikel');
  await nav('Privat', 'Karriere'); await cycle('karriere');
  // Vereinsprofil des eigenen Vereins über Verein › Verein (Wappen) bzw. die Tabelle der Zentrale
  await nav('Zentrale');
  const own = page.locator('.dz [data-club].me, .dz .me [data-club], .dz .mine [data-club]').first();
  if (await own.count()) {
    await own.click(); await page.waitForTimeout(500);
    await page.locator('.cmx-tabs .tab:has-text("Historie")').click(); await page.waitForTimeout(300);
    await cycle('verein', '.cmx-modal');
    await page.locator('.cmx-modal > .mx-head > .modal-close').click().catch(() => page.keyboard.press('Escape')); await page.waitForTimeout(250);
  } else errors.push(`${w}: eigener Verein in der Zentrale nicht gefunden`);
  await nav('Kader', 'Kader');
  await page.locator('.dtable tbody tr').nth(3).click(); await page.waitForTimeout(500);
  await page.locator('.pp-modal .pp-tabs button:has-text("Statistik")').first().click(); await page.waitForTimeout(300);
  await cycle('spieler', '.pp-modal');
  await page.close();
}

console.log(errors.length ? errors.join('\n') : 'Zeitraum-Screenshots ohne Fehler');
server.close();
await browser.close();
