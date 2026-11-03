// Screenshots Transferbilanz (Top-Transfers + Bilanz nach Fensterschluss) und Spielersuche.
//   npm run build && node tests/transfer3-shots.mjs [ordner]
//   SAVE=… Spielstand kurz VOR dem Tag nach Fensterschluss (z. B. `CLUB=fra DUMP=… UNTIL=1979-09-01 node scripts/sim.mjs 4`),
//   ohne SAVE: Vorlage „Test 3 Jahre“ (Bilanz nur nachträglich aus dem Transfermarkt).
//   PREFIX=… Dateinamen-Präfix. Je Bild 1920×1080 und 1366×768; meldet Überläufe und JS-Fehler.
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const outDir = process.argv[2] || 'test-output/transfer3';
const prefix = process.env.PREFIX || '';
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

for (const [w, h] of [[1920, 1080], [1366, 768]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  page.on('pageerror', (e) => errors.push(`${w}: JS-Fehler: ${e.message}`));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
  await page.reload();
  await page.click('text=Spiel laden');
  await page.click('button:has-text("Laden") >> nth=0');
  await page.waitForTimeout(1500);
  for (let i = 0; i < 3 && await page.locator('.bf-continue').count(); i++) { await page.locator('.bf-continue').click(); await page.waitForTimeout(250); }

  const tag = `${prefix}${w}`;
  const shot = async (n, sel) => {
    await page.waitForTimeout(350);
    const over = await page.evaluate((s) => {
      const out = [];
      const root = document.querySelector(s);
      if (!root) return ['fehlt: ' + s];
      const r = root.getBoundingClientRect();
      if (r.right > innerWidth + 1 || r.bottom > innerHeight + 1 || r.left < -1 || r.top < -1) out.push(`Panel ragt aus dem Bild (${Math.round(r.width)}×${Math.round(r.height)})`);
      for (const el of root.querySelectorAll('*')) {
        const cs = getComputedStyle(el);
        if (el.scrollWidth > el.clientWidth + 2 && cs.overflowX !== 'visible' && cs.overflowX !== 'hidden' && el.clientWidth > 0 && !el.matches('select, input')) out.push(`waagrechter Scroll: ${el.className}`);
      }
      if (root.scrollWidth > root.clientWidth + 2) out.push('Panel breiter als sein Rahmen');
      return out;
    }, sel);
    for (const o of over) errors.push(`${tag}_${n}: ${o}`);
    await page.screenshot({ path: `${outDir}/${tag}_${n}.png` });
  };

  // 1) Weiter → Tag nach dem Fensterschluss → Top-Transfers + Bilanz
  if (process.env.SAVE) {
    // Tag nach dem Schluss: „Weiter“ bzw. „Schnell simulieren“ (Spieltag), Spielbericht schließen …
    for (let i = 0; i < 12 && !(await page.locator('.tw-panel').count()); i++) {
      const close = page.locator('.modal-overlay .modal-close, .modal-overlay button:has-text("Schließen"), .modal-overlay button:has-text("Weiter")').first();
      if (await close.count()) await close.click();
      else if (await page.locator('.hd-continue').count()) await page.locator('.hd-continue').first().click();
      else { await page.screenshot({ path: `${outDir}/${tag}_weiter_${i}.png` }); await page.keyboard.press('Escape'); }
      await page.waitForTimeout(1500);
    }
    try {
      await page.waitForSelector('.tw-panel', { timeout: 20000 });
      await shot('1_top', '.tw-panel');
      await page.locator('.tw-foot button:has-text("OK")').click();
      await shot('2_bilanz', '.tw-panel');
      for (const [t, n] of [['Verträge', '3_vertraege'], ['Gerüchteküche', '4_geruechte'], ['Trainerkarussell', '5_trainer']]) {
        await page.locator(`.tw-tab:has-text("${t}")`).click();
        await shot(n, '.tw-panel');
      }
      await page.locator('.tw-tab:has-text("Transfers")').first().click();
      const opts = await page.locator('.tw-foot select option').count();
      if (opts > 3) { await page.locator('.tw-foot select').selectOption({ index: 3 }); await shot('6_verein', '.tw-panel'); }
      await page.locator('.tw-foot button:has-text("Schließen")').click();
      await page.waitForTimeout(300);
    } catch (e) { errors.push(`${tag}: kein Transferbilanz-Popup nach Fensterschluss (${e.message.split('\n')[0]})`); }
  }

  // 2) Transfermarkt: Spielersuche + Bilanz nachträglich
  try {
  await page.locator('.hd-nav-item:has-text("Transfers")').first().click();
  await page.waitForTimeout(250);
  await page.locator('.tn-sub-item:has-text("Transfermarkt")').first().click();
  await page.waitForTimeout(400);
  await page.locator('.dchip:has-text("Spieler suchen")').click();
  await page.waitForSelector('.ps-panel');
  await shot('7_suche', '.ps-panel');
  await page.locator('.ps-row:has-text("Position") select').first().selectOption('DEF');
  await page.locator('.ps-attr select').first().selectOption('heading');
  await page.locator('.ps-row:has-text("Alter") input').nth(1).fill('28');
  await shot('8_suche_vorgaben', '.ps-panel');
  await page.locator('.ps-foot button:has-text("Suchen")').click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${outDir}/${tag}_9_ergebnis.png` });
  await page.locator('.dchip:has-text("Transferbilanz")').click();
  await page.waitForSelector('.tw-panel');
  await shot('10_bilanz_markt', '.tw-panel');
  await page.locator('.tw-head .dchip:has-text("Top-Transfers")').click();
  await shot('11_top_markt', '.tw-panel');
  } catch (e) { errors.push(`${tag}: Transfermarkt (${e.message.split('\n')[0]})`); await page.screenshot({ path: `${outDir}/${tag}_fehler.png` }); }
  await page.close();
}
await browser.close();
server.close();
console.log(errors.length ? errors.join('\n') : 'Keine Fehler/Überläufe.');
console.log(`Screenshots in ${outDir}/`);
process.exit(errors.some((e) => e.includes('JS-Fehler')) ? 1 : 0);
