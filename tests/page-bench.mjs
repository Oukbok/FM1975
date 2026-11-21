// Rechenzeit beim Öffnen der Seiten im Browser (Wunsch Pascal: lange Karrieren, Steam).
// Lädt einen fortgeschrittenen Spielstand und öffnet jede Unterseite zweimal (kalt = erster
// Besuch inkl. Nachladen, warm = zweiter Besuch). Gemessen wird im Browser vom Klick bis
// zum ersten Bild nach dem Rendern (kein „Lädt …“ mehr), dazu die längste Aufgabe (Long Task).
//   npm run build && SAVE=… node tests/page-bench.mjs [läufe=1]
//   (Spielstand z. B. aus `DUMP=test-output/save20.txt node scripts/sim.mjs 20`)
//   DIST=ordner (Standard dist) · THROTTLE=4 → CPU-Drosselung, TOP=15 → so viele schwerste Seiten ausgeben, OUT=datei.json
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const runs = Number(process.argv[2] ?? 1);
const throttle = Number(process.env.THROTTLE ?? 1);
const TOPN = Number(process.env.TOP ?? 15);
if (!process.env.SAVE) { console.error('SAVE=… fehlt'); process.exit(2); }
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.txt': 'text/plain', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { const body = await readFile(join(process.env.DIST ?? 'dist', path)); res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(body); }
  catch { res.writeHead(404).end(); }
}).listen(0);
const url = `http://127.0.0.1:${server.address().port}/`;
const raw = await readFile(process.env.SAVE, 'utf8');

const browser = await chromium.launch();
const results = {}; // Seite → { cold: [], warm: [], lt: [] }
let loadMs = [];
for (let run = 0; run < runs; run++) {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.addInitScript(() => {
    // Längste Aufgabe seit dem letzten Abruf (PerformanceObserver „longtask“).
    window.__lt = 0;
    try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt = Math.max(window.__lt, e.duration); }).observe({ type: 'longtask', buffered: true }); } catch { /* ohne Long-Task-API */ }
  });
  const cdp = await ctx.newCDPSession(page);
  await page.goto(url + 'saves/index.json');
  await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
  await page.goto(url);
  await page.click('text=Spiel laden');
  if (throttle > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
  const t0 = Date.now();
  await page.click('.card:has(button:has-text("Löschen")) button:has-text("Laden") >> nth=0');
  await page.waitForSelector('.hd-bar', { state: 'visible', timeout: 120000 });
  loadMs.push(Date.now() - t0);
  // Fenster der Fensterkette (Briefing, Budget …) schließen, dann im Leerlauf vorladen lassen.
  for (let i = 0; i < 6; i++) {
    for (const sel of ['button:has-text("Schließen")', 'button:has-text("Weiter zum")', 'button:has-text("Bestätigen")', 'button:has-text("OK")', '.modal-close']) {
      const b = page.locator(sel).first();
      if (await b.isVisible().catch(() => false)) await b.click().catch(() => {});
    }
    await page.waitForTimeout(300);
  }
  await page.waitForTimeout(3000);
  // Öffnet eine Seite per Klick und misst bis zum ersten Bild ohne Platzhalter.
  const measure = (sel, idx) => page.evaluate(async ([sel, idx]) => {
    const el = document.querySelectorAll(sel)[idx];
    if (!el) return null;
    window.__lt = 0;
    const frame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
    const t0 = performance.now();
    el.click();
    await frame();
    const limit = t0 + 20000;
    while (document.querySelector('.lazy-page, .lazy-overlay') && performance.now() < limit) await frame();
    const ms = performance.now() - t0;
    await new Promise((r) => setTimeout(r, 50));
    return { ms, lt: window.__lt, label: el.textContent.trim() };
  }, [sel, idx]);
  const mains = await page.locator('.hd-nav-item').count();
  for (let pass = 0; pass < 2; pass++) {
    for (let m = 0; m < mains; m++) {
      const main = await measure('.hd-nav-item', m);
      const mainLabel = main?.label ?? String(m);
      const subs = await page.locator('.tn-sub-item').count();
      for (let s = 0; s < subs; s++) {
        const r = await measure('.tn-sub-item', s);
        if (!r) continue;
        const key = `${mainLabel} › ${r.label}`;
        const e = (results[key] ??= { cold: [], warm: [], lt: [] });
        (pass === 0 ? e.cold : e.warm).push(r.ms);
        if (pass === 1) e.lt.push(r.lt);
        // Fenster, die beim Seitenwechsel aufgehen, schließen.
        const c = page.locator('.modal-close').first();
        if (await c.isVisible().catch(() => false)) await c.click().catch(() => {});
      }
    }
  }
  if (errors.length) console.log('JS-Fehler:', errors.slice(0, 5).join(' | '));
  await ctx.close();
}
await browser.close();
server.close();
const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] ?? 0;
const rows = Object.entries(results).map(([k, e]) => ({ k, cold: med(e.cold), warm: med(e.warm), lt: med(e.lt) })).sort((a, b) => b.warm - a.warm);
console.log(`Spielstand ${process.env.SAVE} · Läufe ${runs} · CPU-Drosselung ${throttle}x · Laden bis Shell Median ${med(loadMs)} ms`);
console.log(`Seiten ${rows.length}: Summe warm ${rows.reduce((a, r) => a + r.warm, 0).toFixed(0)} ms, kalt ${rows.reduce((a, r) => a + r.cold, 0).toFixed(0)} ms`);
for (const r of rows.slice(0, TOPN)) console.log(`  ${r.k.padEnd(44)} warm ${r.warm.toFixed(0).padStart(5)} ms  kalt ${r.cold.toFixed(0).padStart(5)} ms  längste Aufgabe ${r.lt.toFixed(0)} ms`);
if (process.env.OUT) await writeFile(process.env.OUT, JSON.stringify({ load: loadMs, rows }, null, 1));
