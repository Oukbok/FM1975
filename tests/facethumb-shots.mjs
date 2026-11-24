// Vergrößerte Screenshots der Gesichts-Miniaturen (vorher/nachher) + Prüfung der Anzeigegrößen.
//   npm run build && node tests/facethumb-shots.mjs [ordner=test-output/facethumbs]
//   DIST=…  anderer Build (z. B. vorher), SAVE=… Spielstand, SCALE=2 Pixeldichte (Retina)
//   SWEEP=1  zusätzlich jede Unterseite öffnen und melden: Miniatur breiter als 64 px angezeigt
//            (zu unscharf) bzw. Original-Gesicht ≤ 64 px (Miniatur wäre möglich).
// Je Seite (Zentrale „Unsere Besten“, Kader › Kader, Statistiken › Liga Bestenlisten, Transfermarkt):
// Ausschnitt mit den Köpfen in SCALE-facher Auflösung, dazu `<seite>-rects.json` = Lage/Größe jeder
// Gesichts-Box (vorher/nachher müssen gleich sein).
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const OUTDIR = process.argv[2] || 'test-output/facethumbs';
const DIST = process.env.DIST || 'dist';
const SCALE = Number(process.env.SCALE || 2);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.txt': 'text/plain', '.wav': 'audio/wav' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(join(DIST, path))); }
  catch { res.writeHead(404).end(); }
}).listen(0);
const base = `http://127.0.0.1:${server.address().port}/`;
const raw = await readFile(process.env.SAVE || 'public/saves/test-3-jahre.txt', 'utf8');
await mkdir(OUTDIR, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: SCALE });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
await page.goto(base);
await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
await page.reload();
await page.click('text=Spiel laden');
await page.click('.card:has(button:has-text("Löschen")) button:has-text("Laden") >> nth=0');
await page.waitForSelector('.app-shell'); await page.waitForTimeout(1500);
for (let i = 0; i < 3 && await page.locator('.bf-continue').count(); i++) { await page.locator('.bf-continue').click(); await page.waitForTimeout(200); }
for (let i = 0; i < 3; i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(150); }

const sub = (label) => page.locator('.tn-sub-item').filter({ hasText: new RegExp(`^\\s*${label}\\s*$`, 'i') }).first();
const settle = () => page.evaluate(async () => {
  const t0 = performance.now();
  while (performance.now() - t0 < 6000) {
    const open = [...document.querySelectorAll('.pa-photo')].filter((f) => !f.classList.contains('loaded'));
    if (!open.length) break;
    await new Promise((r) => setTimeout(r, 50));
  }
  await new Promise((r) => setTimeout(r, 300));
});
const rects = () => page.evaluate(() => [...document.querySelectorAll('.app-main .pa-photo')].map((f) => {
  const r = f.getBoundingClientRect(); const i = f.querySelector('img');
  const ir = i?.getBoundingClientRect();
  return { pid: f.dataset.pid, x: +r.x.toFixed(2), y: +r.y.toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2), iy: ir && +ir.y.toFixed(2), ih: ir && +ir.height.toFixed(2), thumb: /faces-sm\//.test(i?.src || '') };
}));
// Ausschnitt: Box (`.dbox`) um die ersten Gesichter, sonst Umriss der ersten 12 Köpfe.
async function shot(name, boxSel) {
  await settle();
  const r = await rects();
  await writeFile(join(OUTDIR, `${name}-rects.json`), JSON.stringify(r, null, 0));
  const box = boxSel ? page.locator(boxSel).first() : null;
  if (box && await box.count()) await box.screenshot({ path: join(OUTDIR, `${name}.png`) });
  else if (r.length) {
    const top = r.slice(0, 12);
    const x = Math.max(0, Math.min(...top.map((q) => q.x)) - 10), y = Math.max(0, Math.min(...top.map((q) => q.y)) - 10);
    await page.screenshot({ path: join(OUTDIR, `${name}.png`), clip: { x, y, width: 520, height: Math.max(...top.map((q) => q.y + q.h)) - y + 10 } });
  }
  console.log(`${name}: ${r.length} Gesichter (${r.filter((q) => q.thumb).length} Miniaturen)`);
}

await page.locator('.hd-nav-item:has-text("Zentrale")').first().click(); await page.waitForTimeout(600);
await shot('zentrale', '.dbox:has(.fthumb)');
await page.locator('.hd-nav-item:has-text("Kader")').first().click(); await page.waitForTimeout(300);
await page.locator('.dbox.clickable').first().click(); await page.waitForSelector('.sq-legend');
await shot('kader', null);
await page.locator('.hd-nav-item:has-text("Statistiken")').first().click(); await page.waitForTimeout(300);
await sub('Liga').click(); await page.waitForSelector('.cmp-pname', { timeout: 15000 }).catch(() => {});
await shot('statistik', '.dbox:has(.cmp-pname)');
await page.locator('.hd-nav-item:has-text("Transfers")').first().click(); await page.waitForTimeout(300);
await sub('Transfermarkt').click(); await page.waitForSelector('.tm-name', { timeout: 15000 }).catch(() => {});
await shot('transfermarkt', null);

if (process.env.SWEEP) {
  const found = [];
  const mains = await page.locator('.hd-nav-item').count();
  for (let m = 0; m < mains; m++) {
    const ml = (await page.locator('.hd-nav-item').nth(m).innerText()).trim();
    await page.locator('.hd-nav-item').nth(m).click(); await page.waitForTimeout(300);
    const subs = await page.locator('.tn-sub-item').count();
    for (let s = 0; s < subs; s++) {
      const item = page.locator('.tn-sub-item').nth(s);
      const sl = (await item.innerText()).trim();
      await item.click().catch(() => {}); await page.waitForTimeout(500);
      for (let i = 0; i < 2; i++) await page.keyboard.press('Escape');
      const bad = await page.evaluate(() => {
        const out = [];
        for (const i of document.querySelectorAll('.pa-photo img')) {
          const w = i.getBoundingClientRect().width;
          if (!w) continue;
          const thumb = /faces-sm\//.test(i.src), face = /assets\/faces\//.test(i.src);
          if (thumb && w > 64.5) out.push(`Miniatur ${Math.round(w)} px`);
          if (face && w <= 64) out.push(`Original ${Math.round(w)} px`);
        }
        return [...new Set(out)];
      });
      if (bad.length) found.push(`${ml} › ${sl}: ${bad.join(', ')}`);
    }
  }
  console.log(found.length ? `Größen-Auffälligkeiten:\n  ${found.join('\n  ')}` : 'Größen: alle Miniaturen ≤ 64 px, kein Original ≤ 64 px');
}
if (errors.length) console.log('JS-Fehler:', errors.slice(0, 5).join(' | '));
await browser.close(); server.close();
