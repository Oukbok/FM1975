// Screenshots Transfer 2.0: Verhandlungsdialog (Vereins- und Spielergespräch,
// „Was ihm wichtig ist“) und Reiter „Wünsche“ im Spielerprofil (fremder und
// eigener Spieler). Mit SAVE=… (z. B. aus DUMP=… node scripts/sim.mjs 24)
// eine spätere Epoche (Berater, Klauseln, Leihe).
//   npm run build && node tests/transfer-shots.mjs [ausgabeordner]
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { startNewGame } from './newgame-flow.mjs';

const outDir = process.argv[2] || 'test-output/transfer';
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
const shot = (n) => page.screenshot({ path: `${outDir}/${n}.png` });
const nav = async (cat, sub) => {
  await page.locator(`.hd-nav-item:has-text("${cat}")`).first().click();
  await page.locator(`.tn-sub-item:has-text("${sub}")`).first().click();
  await page.waitForTimeout(300);
};

if (process.env.SAVE) {
  const raw = await readFile(process.env.SAVE, 'utf8');
  await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
  await page.reload();
  await page.click('text=Spiel laden');
  await page.click('button:has-text("Laden") >> nth=0');
  await page.waitForTimeout(1500);
  const bf = page.locator('.bf-modal .bf-continue');
  if (await bf.count()) await bf.click();
} else {
  await startNewGame(page);
}
const pre = process.env.SAVE ? 'spaet' : 'start';

// 1) Fremder Spieler: Profil-Reiter „Wünsche“ (Beobachtung › Verstärkung)
await nav('Transfers', 'Beobachtung');
await page.locator('.dtable tbody tr').first().click();
await page.waitForSelector('.pp-modal');
await page.locator('.pp-tabs .tab:has-text("Wünsche")').click();
await page.waitForTimeout(250);
await shot(`${pre}_1_wuensche_fremd`);
await page.locator('.pp-modal .modal-close').click();

// 2) Verhandlung starten: Vereinsgespräch
await page.locator('.dtable tbody tr >> nth=1').locator('button:has-text("Verhandeln")').click();
await page.waitForSelector('.modal-xl');
await page.waitForTimeout(250);
await shot(`${pre}_2_verhandlung_verein`);
// Mehrere Angebote mit steigender Ablöse, bis der Verein einschlägt.
for (let i = 0; i < 8; i++) {
  if (!(await page.locator('.modal-xl button:has-text("Angebot abgeben")').count())) break;
  const r = page.locator('.modal-xl .talk-form input[type=range]').first();
  const max = Number(await r.getAttribute('max'));
  const min = Number(await r.getAttribute('min'));
  await r.fill(String(Math.round((min + (max - min) * (0.55 + i * 0.07)) / 5000) * 5000));
  await page.locator('.modal-xl button:has-text("Angebot abgeben")').click();
  await page.waitForTimeout(150);
}
await shot(`${pre}_3_verhandlung_spieler`);
// Spielergespräch: ein Versprechen anhaken und einen Vorschlag machen.
if (await page.locator('.talk-checklist li').count()) {
  await page.locator('.talk-checklist li').first().click();
  await page.locator('.modal-xl button:has-text("Vorschlag machen")').click();
  await page.waitForTimeout(200);
  await shot(`${pre}_4_verhandlung_antwort`);
}
const over = await page.evaluate(() => [...document.querySelectorAll('.modal-xl .dbox-body')].some((b) => b.scrollWidth - b.clientWidth > 2));
if (over) errors.push('Verhandlung: waagerechter Überlauf in einer Box');
await page.locator('.modal-xl .modal-close').click();

// 3) Eigener Spieler: Bindung, Klauseln
await nav('Kader', 'Kader');
const row = page.locator('.dtable tbody tr, .sq-row').first();
if (await row.count()) {
  await row.click();
  await page.waitForSelector('.pp-modal', { timeout: 4000 }).catch(() => errors.push('Eigenes Spielerprofil öffnet nicht'));
  if (await page.locator('.pp-modal').count()) {
    await page.locator('.pp-tabs .tab:has-text("Wünsche")').click();
    await page.waitForTimeout(250);
    await shot(`${pre}_5_wuensche_eigen`);
  }
}
console.log(errors.length ? errors.join('\n') : `Transfer-Screenshots ohne Fehler (${outDir})`);
await browser.close();
server.close();
process.exit(errors.length ? 1 : 0);
