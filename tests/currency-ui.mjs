// Währungs-Rundgang (Wunsch Pascal): In einem Spiel im Ausland darf nirgends „DM“ oder „€“
// stehen. Lädt Vorlagen aus public/saves (Standard England 1992 und Italien 1985), öffnet
// jede Seite des Menüs samt drittem Menü, dazu das Briefing-Fenster (ohne Zeitgeschichte),
// und sucht im sichtbaren Text nach Beträgen in D-Mark/Euro bzw. den Wörtern D-Mark/Euro.
//   npm run build && node tests/currency-ui.mjs        (SAVES=england-1992,italien-1985)
// Erwartete Einheit je Vorlage in UNIT; mindestens 20 Seiten müssen sie zeigen. Exit 1 bei Funden.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const UNIT = { 'england-1992': '£', 'italien-1985': 'Lire', 'england3-1995': '£', 'frankreich-2000': 'FF', 'ddr-1980': 'M' };
const SAVES = (process.env.SAVES || 'england-1992,italien-1985').split(',');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.txt': 'text/plain' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(join('dist', path))); }
  catch { res.writeHead(404).end(); }
}).listen(0);
const url = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch();
// Betrag in D-Mark/Euro oder die Währung beim Namen (Zeitgeschichte im Briefing-Fenster wird nicht geöffnet).
const BAD = /(\d|Mio\.|Tsd\.|Mrd\.)[ \u00a0]?(DM|€|EUR)(?![\wäöü])|\bD-Mark\b|\bEuro\b/;
const finds = [], errors = [];

for (const save of SAVES) {
  const unit = UNIT[save];
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', (e) => errors.push(`${save}: JS-Fehler: ${e.message}`));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto(url);
  const raw = await readFile(`public/saves/${save}.txt`, 'utf8');
  await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
  await page.goto(url);
  await page.click('text=Spiel laden');
  await page.click('.card:has(button:has-text("Löschen")) button:has-text("Laden") >> nth=0');
  await page.waitForTimeout(1800);
  for (let i = 0; i < 3 && await page.locator('.bf-continue').count(); i++) { await page.locator('.bf-continue').click(); await page.waitForTimeout(200); }

  let pages = 0, withUnit = 0;
  const scan = async (where) => {
    await page.waitForTimeout(350);
    const text = await page.evaluate(() => document.body.innerText);
    pages++;
    if (unit && text.includes(` ${unit}`)) withUnit++;
    for (const line of text.split('\n')) {
      const m = BAD.exec(line);
      if (m) { finds.push(`${save} · ${where}: „${line.slice(Math.max(0, m.index - 60), m.index + 40).trim()}“`); break; }
    }
  };
  const mains = await page.locator('.hd-nav-item').count();
  for (let m = 0; m < mains; m++) {
    await page.locator('.hd-nav-item').nth(m).click();
    await page.waitForTimeout(250);
    const mainName = (await page.locator('.hd-nav-item').nth(m).innerText()).trim();
    const subs = await page.locator('.tn-sub-item').count();
    for (let s = 0; s < Math.max(1, subs); s++) {
      let subName = '';
      if (subs) {
        const it = page.locator('.tn-sub-item').nth(s);
        subName = (await it.innerText()).trim();
        await it.click();
      }
      await scan(`${mainName} › ${subName}`);
      // Drittes Menü (Reiter der Seite)
      const tabs = await page.locator('.sub3-tabs .tab').count().catch(() => 0);
      for (let t = 1; t < Math.min(tabs, 10); t++) {
        const tab = page.locator('.sub3-tabs .tab').nth(t);
        if (!(await tab.isVisible().catch(() => false)) || await tab.isDisabled().catch(() => true)) continue;
        const tabName = (await tab.innerText().catch(() => '')).trim();
        await tab.click().catch(() => {});
        await scan(`${mainName} › ${subName} › ${tabName}`);
        // Fenster, das ein Reiter geöffnet hat, wieder schließen
        if (await page.locator('.modal-backdrop, .modal').count()) await page.keyboard.press('Escape');
      }
    }
  }
  // Briefing-Fenster (Überblick, Aufgaben & Tipps, Fußball) – ohne die Reiter der Zeitgeschichte.
  await page.locator('.hd-nav-item').first().click();
  const brief = page.locator('.tn-sub-item:has-text("Briefing")').first();
  if (await brief.count()) {
    await brief.click(); await page.waitForTimeout(300);
    const whole = page.locator('button:has-text("Ganzes Briefing")').first();
    if (await whole.count()) {
      await whole.click(); await page.waitForTimeout(500);
      const n = await page.locator('.bf-modal .bf-tabs .tab').count();
      for (let t = 0; t < n; t++) {
        const tab = page.locator('.bf-modal .bf-tabs .tab').nth(t);
        const name = (await tab.innerText()).trim();
        if (/Gesellschaft|Politik|Alltag|Kultur/.test(name)) continue;
        await tab.click();
        await scan(`Briefing-Fenster › ${name}`);
      }
      await page.keyboard.press('Escape');
    }
  }
  console.log(`${save}: ${pages} Ansichten geprüft, ${withUnit} mit „${unit}“`);
  if (unit && withUnit < 20) errors.push(`${save}: nur ${withUnit} Ansichten zeigen „${unit}“`);
  await page.close();
}
for (const f of finds) console.log('FUND: ' + f);
for (const e of errors) console.log('FEHLER: ' + e);
console.log(finds.length || errors.length ? `${finds.length} Funde, ${errors.length} Fehler` : 'Keine DM/€ in den geprüften Ansichten.');
await browser.close(); server.close();
process.exit(finds.length || errors.length ? 1 : 0);
