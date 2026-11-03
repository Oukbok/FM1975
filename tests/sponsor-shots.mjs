// Screenshots Sponsoring (Finanzen › Sponsoring: Reiter Hauptsponsor, Namensrechte,
// Sponsoren-Pyramide, Bandenwerbung; Karteikarte, Kontextmenü, Verhandlung) bei
// 1920×1080 und 1366×768 – zu Spielbeginn 1975 oder aus einem Spielstand.
//   npm run build && node tests/sponsor-shots.mjs [ausgabeordner] [präfix]
//   Vorlage 1978:  SAVE=public/saves/test-3-jahre.txt node tests/sponsor-shots.mjs test-output/sponsor y1978
//   Später:        HUMAN=1 DUMP=test-output/sponsor/s1995.txt node scripts/sim.mjs 20   (… 40 für 2015)
//                  SAVE=test-output/sponsor/s1995.txt node tests/sponsor-shots.mjs test-output/sponsor y1995
//   VIEWS=1920x1080 nur eine Größe.
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { startNewGame } from './newgame-flow.mjs';

const outDir = process.argv[2] || 'test-output/sponsor';
const prefix = process.argv[3] || (process.env.SAVE ? 'spaet' : 'y1975');
const views = (process.env.VIEWS || '1920x1080,1366x768').split(',').map((v) => v.split('x').map(Number));
await mkdir(outDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.txt': 'text/plain', '.webp': 'image/webp' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(join('dist', path))); }
  catch { res.writeHead(404).end(); }
}).listen(0);

const browser = await chromium.launch();
const errors = [];

for (const [W, H] of views) {
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  page.on('pageerror', (e) => errors.push(`${W}: JS-Fehler: ${e.message}`));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  const tag = `${prefix}_${W}`;
  const shot = (n) => page.screenshot({ path: `${outDir}/${tag}_${n}.png` });

  if (process.env.SAVE) {
    const raw = await readFile(process.env.SAVE, 'utf8');
    await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
    await page.reload();
    await page.click('text=Spiel laden');
    await page.click('button:has-text("Laden") >> nth=0');
    await page.waitForTimeout(1500);
    for (const sel of ['.bf-continue', '.aw-close', '.modal-close']) if (await page.locator(sel).count()) await page.locator(sel).first().click().catch(() => {});
  } else {
    await startNewGame(page);
  }

  const noScroll = async (what) => {
    const s = await page.evaluate(() => { const m = document.querySelector('.app-main'); return m ? m.scrollHeight - m.clientHeight : 0; });
    if (s > 2) errors.push(`${W} ${what}: Seite scrollt (${s}px)`);
  };
  await page.locator('.hd-nav-item:has-text("Finanzen")').click();
  await page.waitForTimeout(200);
  await page.locator('.tn-sub-item:has-text("Sponsoring")').first().click();
  await page.waitForTimeout(500);

  const tabs = [['haupt', 'Hauptsponsor'], ['namen', 'Namensrechte'], ['pyramide', 'Sponsoren-Pyramide'], ['banden', 'Bandenwerbung']];
  for (const [id, label] of tabs) {
    await page.locator(`.sp3-tabs .tab:has-text("${label}")`).click();
    await page.waitForTimeout(400);
    await noScroll(label);
    await shot(`${id}`);
    if (W !== views[0][0]) continue;
    // Linksklick: Karteikarte des ersten Vertrags/Angebots/Felds
    const first = page.locator('.sp3-dpage [data-sp^="deal:"], .sp3-dpage [data-sp^="offer:"], .sp3-dpage [data-sp^="st:"]').first();
    if (await first.count()) {
      await first.click();
      await page.waitForTimeout(300);
      await shot(`${id}_karte`);
      await page.locator('.sp3-card .modal-close').click();
      await page.waitForTimeout(150);
      // Rechtsklick: Kontextmenü
      await first.click({ button: 'right' });
      await page.waitForTimeout(200);
      if (!(await page.locator('.sp3-menu').count())) errors.push(`${label}: kein Kontextmenü`);
      await shot(`${id}_menu`);
      await page.keyboard.press('Escape');
      await page.mouse.click(5, H - 5);
      await page.waitForTimeout(150);
    }
    const free = page.locator('.sp3-dpage [data-sp^="free:"]').first();
    if (id === 'pyramide' && await free.count()) {
      await free.click();
      await page.waitForTimeout(300);
      await shot(`${id}_frei`);
      await page.locator('.sp3-card .modal-close').click();
    }
  }
  // Verhandlung über das Kontextmenü eines Angebots
  if (W === views[0][0]) {
    for (const [, label] of tabs) {
      await page.locator(`.sp3-tabs .tab:has-text("${label}")`).click();
      await page.waitForTimeout(250);
      const offer = page.locator('.sp3-dpage [data-sp^="offer:"]').first();
      if (!(await offer.count())) continue;
      await offer.click({ button: 'right' });
      await page.locator('.sp3-menu .pcm-item:has-text("Verhandeln")').click();
      await page.waitForTimeout(300);
      await shot('verhandlung');
      await page.locator('.modal button:has-text("Gegenangebot senden")').click();
      await page.waitForTimeout(300);
      await shot('verhandlung_antwort');
      await page.locator('.modal-close').first().click().catch(() => {});
      break;
    }
  }
  await page.close();
}

console.log(errors.length ? errors.join('\n') : `Sponsoring-Screenshots (${prefix}) ohne Fehler`);
await browser.close();
server.close();
process.exit(errors.length ? 1 : 0);
