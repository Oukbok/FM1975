// Screenshots der Trainerkarriere: Zentrale › Karriere (mit Angeboten), Trainer-Kachel im
// Vereinsprofil (KI-Verein und eigener Verein), Sofortwechsel per „Annehmen“.
//   npm run build && node scripts/run-ts.mjs tests/career-prep.ts public/saves/test-3-jahre.txt <stand.txt>
//   SAVE=<stand.txt> node tests/career-shots.mjs [ordner]      (1920×1080 und 1366×768)
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const outDir = process.argv[2] || 'test-output/career';
await mkdir(outDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.txt': 'text/plain', '.webp': 'image/webp' };
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
  for (let i = 0; i < 3 && await page.locator('.bf-continue').count(); i++) { await page.locator('.bf-continue').click(); await page.waitForTimeout(200); }
  for (let i = 0; i < 3 && await page.locator('.bm-close, button:has-text("Budget bestätigen")').count(); i++) { await page.locator('.bm-close, button:has-text("Budget bestätigen")').first().click().catch(() => {}); await page.waitForTimeout(200); }
  const shot = async (n) => {
    await page.waitForTimeout(400);
    const scroll = await page.evaluate(() => { const m = document.querySelector('.app-main'); return m ? m.scrollHeight - m.clientHeight : 0; });
    if (scroll > 2) errors.push(`${w} ${n}: Seite scrollt (${scroll}px)`);
    await page.screenshot({ path: `${outDir}/${w}_${n}.png` });
  };
  const nav = async (main, sub) => {
    await page.locator(`.hd-nav-item:has-text("${main}")`).first().click();
    await page.waitForTimeout(250);
    if (sub) { await page.locator(`.tn-sub-item:has-text("${sub}")`).first().click(); await page.waitForTimeout(350); }
  };
  try {
    await nav('Zentrale', 'Karriere'); await shot('karriere');
    // Vereinsprofil eines KI-Vereins (Trainer-Kachel)
    await nav('Statistiken', 'Liga');
    await page.locator('.dtable tbody tr .club-link').nth(1).click();
    await page.waitForTimeout(600);
    await shot('profil_ki');
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    if (w === 1920) {
      // Sofort-Angebot annehmen
      await nav('Zentrale', 'Karriere');
      await page.locator('.car-offer .btn-primary').first().click();
      await page.waitForTimeout(600);
      await shot('budget_neuer_verein');
      await page.locator('button:has-text("Budget bestätigen")').first().click().catch(() => {});
      await page.waitForTimeout(400);
      await shot('karriere_nach_wechsel');
      await nav('Statistiken', 'Liga');
      await page.locator('.dtable tbody tr.me .club-link, .dtable tbody tr.mine .club-link').first().click({ timeout: 4000 }).catch(() => {});
      await page.waitForTimeout(600);
      await shot('profil_eigen');
      await page.keyboard.press('Escape');
      await nav('Zentrale', null); await shot('zentrale_nach_wechsel');
    }
  } catch (e) { errors.push(`${w}: ${e.message.split('\n')[0]}`); }
  await page.close();
}
await browser.close(); server.close();
console.log(errors.length ? errors.join('\n') : 'keine Fehler');
