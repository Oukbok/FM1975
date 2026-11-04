// Screenshots aller Seiten mit drittem Menü (ui/SubTabs.tsx, 28-subtabs.css), jeder Reiter,
// 1920×1080 und 1366×768. Prüft: Boxen enden bündig mit der Leiste (± 1 px), Seite scrollt nicht.
//   npm run build && node tests/subtabs-shots.mjs [ordner]      (SAVE=… anderer Spielstand)
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const outDir = process.argv[2] || 'test-output/subtabs';
await mkdir(outDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.txt': 'text/plain' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { const body = await readFile(join('dist', path)); res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(body); }
  catch { res.writeHead(404).end(); }
}).listen(0);

const PAGES = [
  ['Zentrale', 'Presse', 'presse'],
  ['Kader', 'Übersicht', 'kader'],
  ['Training', 'Trainingsplan', 'trainingsplan'],
  ['Jugend', 'Mannschaften', 'jugend'],
  ['Jugend', 'Jugendwettbewerbe', 'jugendwettbewerbe'],
  ['Transfers', 'Transfermarkt', 'transfermarkt'],
  ['Transfers', 'Beobachtung', 'beobachtung'],
  ['Finanzen', 'Sponsoring', 'sponsoring'],
  ['Finanzen', 'Fanartikel', 'fanartikel'],
  ['Verein', 'Erfolge', 'erfolge'],
];
const errors = [];
const raw = await readFile(process.env.SAVE || 'public/saves/test-3-jahre.txt', 'utf8');
const browser = await chromium.launch();
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
  for (const sel of ['.bud-modal .btn-primary', '.modal .btn-primary:has-text("Übernehmen")']) {
    if (await page.locator(sel).count()) { await page.locator(sel).first().click().catch(() => {}); await page.waitForTimeout(200); }
  }
  const nav = async (main, sub) => {
    await page.locator(`.hd-nav-item:has-text("${main}")`).first().click();
    await page.waitForTimeout(250);
    await page.locator(`.tn-sub-item:has-text("${sub}")`).first().click(); await page.waitForTimeout(400);
  };
  for (const [m, s, n] of PAGES) {
    try {
      await nav(m, s);
      const tabs = page.locator('.sub3-tabs .tab');
      const cnt = await tabs.count();
      if (!cnt) { errors.push(`${w} ${n}: keine Reiterleiste`); continue; }
      for (let i = 0; i < cnt; i++) {
        if (await tabs.nth(i).isDisabled()) continue;
        await tabs.nth(i).click(); await page.waitForTimeout(350);
        const r = await page.evaluate(() => {
          const bar = document.querySelector('.sub3-tabs')?.getBoundingClientRect();
          const boxes = [...document.querySelectorAll('.sub3-page > .dpage > .dbox, .sub3-page > .tro-cab-page')].map((b) => b.getBoundingClientRect()).filter((b) => b.width > 0);
          const m = document.querySelector('.app-main');
          const tabRow = document.querySelector('.sub3-tabs');
          return {
            bl: bar?.left, br: bar?.right,
            l: Math.min(...boxes.map((b) => b.left)), r: Math.max(...boxes.map((b) => b.right)),
            scroll: m ? m.scrollHeight - m.clientHeight : 0,
            wrap: tabRow ? tabRow.scrollHeight > 60 : false,
          };
        });
        const tag = `${w} ${n} Reiter ${i + 1}`;
        if (Math.abs(r.l - r.bl) > 1 || Math.abs(r.r - r.br) > 1) errors.push(`${tag}: Boxen ${r.l.toFixed(0)}–${r.r.toFixed(0)} vs. Leiste ${r.bl.toFixed(0)}–${r.br.toFixed(0)}`);
        if (r.scroll > 2) errors.push(`${tag}: Seite scrollt (${r.scroll}px)`);
        if (r.wrap) errors.push(`${tag}: Reiterleiste bricht um`);
        await page.screenshot({ path: `${outDir}/${n}_${i + 1}_${w}.png` });
      }
    } catch (e) { errors.push(`${w} ${n}: ${e.message.split('\n')[0]}`); }
  }
  await page.close();
}
console.log(errors.length ? errors.join('\n') : 'ok – keine Fehler');
await browser.close(); server.close();
