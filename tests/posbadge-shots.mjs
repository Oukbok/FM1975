// Screenshots der farbigen Positionsetiketten (components/PosBadge.tsx):
// Kader-Übersicht (+ Einblendung beim Überfahren), Aufstellung, Transfermarkt/Suchergebnis,
// Spielerprofil, Kabine, Zentrale, Textmodus – je 1920×1080 und 1366×768.
//   npm run build && node tests/posbadge-shots.mjs [ordner]   (SAVE=…, VIEWS=1920x1080,1366x768, TEXT=0 ohne Textmodus)
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const outDir = process.argv[2] || 'test-output/posbadge';
await mkdir(outDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.txt': 'text/plain' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(join('dist', path))); }
  catch { res.writeHead(404).end(); }
}).listen(0);
const raw = await readFile(process.env.SAVE || 'public/saves/test-3-jahre.txt', 'utf8');
const views = (process.env.VIEWS || '1920x1080,1366x768').split(',').map((v) => v.split('x').map(Number));
const browser = await chromium.launch();
const errors = [];

for (const [w, h] of views) {
  const pre = `${w}`;
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  page.on('pageerror', (e) => errors.push(`${pre} JS-Fehler: ${e.message}`));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
  await page.reload();
  await page.click('text=Spiel laden');
  await page.click('button:has-text("Laden") >> nth=0');
  await page.waitForTimeout(1500);
  for (let i = 0; i < 3 && await page.locator('.bf-continue').count(); i++) { await page.locator('.bf-continue').click(); await page.waitForTimeout(200); }
  const shot = async (n) => { await page.waitForTimeout(300); await page.screenshot({ path: `${outDir}/${pre}_${n}.png` }); };
  const nav = async (main, sub) => {
    await page.locator(`.hd-nav-item:has-text("${main}")`).first().click();
    await page.waitForTimeout(250);
    if (sub) { await page.locator(`.tn-sub-item:has-text("${sub}")`).first().click(); await page.waitForTimeout(350); }
  };
  const step = async (n, fn) => { try { await fn(); } catch (e) { errors.push(`${pre} ${n}: ${e.message.split('\n')[0]}`); } };

  await step('kader', async () => {
    await nav('Kader', 'Übersicht'); await shot('01_kader');
    const plus = page.locator('.posb:has(.pb-more)').first();
    await plus.hover(); await page.waitForTimeout(250); await shot('02_kader_hover');
    await page.mouse.move(5, 5);
  });
  await step('profil', async () => {
    await page.locator('tr[data-pid]').first().click(); await page.waitForTimeout(600); await shot('03_profil');
    await page.keyboard.press('Escape'); await page.waitForTimeout(200);
    if (await page.locator('.modal-close').first().isVisible().catch(() => false)) await page.locator('.modal-close').first().click();
  });
  await step('vertraege', async () => { await nav('Kader', 'Verträge'); await shot('04_vertraege'); });
  await step('kabine', async () => { await nav('Kader', 'Kabine'); await shot('05_kabine'); });
  await step('aufstellung', async () => { await nav('Aufstellung', 'Aufstellung'); await shot('06_aufstellung'); });
  await step('transfermarkt', async () => { await nav('Transfers', 'Transfermarkt'); await shot('07_transfermarkt'); });
  await step('suche', async () => {
    await page.locator('.dchip:has-text("Spieler suchen")').first().click(); await page.waitForTimeout(400);
    await shot('08_suche');
    const go = page.locator('.modal button:has-text("Suchen"), .modal button:has-text("Suche starten")').last();
    if (await go.isVisible().catch(() => false)) { await go.click(); await page.waitForTimeout(500); await shot('09_suchergebnis'); }
    else await page.keyboard.press('Escape');
  });
  await step('zentrale', async () => { await nav('Zentrale', null); await shot('10_zentrale'); });
  await step('training', async () => { await nav('Training', 'Trainingsplan'); await page.locator('text=Spieler').first().click().catch(() => {}); await shot('11_training'); });

  if (process.env.TEXT !== '0') await step('textmodus', async () => {
    for (let i = 0; i < 160; i++) {
      if (await page.locator('button:has-text("Textmodus")').isVisible().catch(() => false)) break;
      for (const sel of ['button:has-text("Überspringen")', 'button:has-text("Fortsetzen")', 'button:has-text("Schließen")', 'button:has-text("OK")', '.modal-close', '.dr-root button:has-text("Ergebnis sofort zeigen")']) {
        const b = page.locator(sel).first();
        if (await b.isVisible().catch(() => false)) await b.click().catch(() => {});
      }
      const wb = page.getByRole('button', { name: /weiter/i }).first();
      if (await wb.isVisible().catch(() => false)) await wb.click().catch(() => {});
      await page.waitForTimeout(600);
    }
    await page.click('button:has-text("Textmodus")');
    await page.waitForTimeout(2500);
    await page.click('.tm-rbtn >> nth=0').catch(() => {});
    await shot('12_textmodus');
    await page.click('.tm-change-btn').catch(() => {});
    await page.waitForTimeout(600);
    await shot('13_wechsel');
  });
  await page.close();
}
await browser.close();
server.close();
console.log(errors.length ? errors.join('\n') : 'ohne Fehler');
