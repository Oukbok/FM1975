// Messung: Wie lange dauert es, bis die Bilder einer Seite fertig geladen UND dekodiert sind?
// (Wunsch Pascal: keine sichtbaren Ladezeiten bei Hintergründen, Pressefotos, Gesichtern.)
//   npm run build && node tests/image-load-probe.mjs
//   CPU=4      Prozessor 4× gedrosselt (schwächerer Rechner, z. B. Steam Deck)
//   RUNS=3     Wiederholungen (Median), SAVE=…  anderer Spielstand, DIST=…  anderer Build (vorher/nachher)
// Ablauf je Lauf in einem frischen Browser-Kontext (leerer Cache), lokaler Server wie die
// Desktop-Fassung (kein Netz): Hauptmenü (1,5 s verweilen) → Spielstand laden → Zentrale →
// Kader → Zentrale → 8 Nachrichten mit Pressefoto durchklicken.
// Gemessen wird ab dem Erscheinen der Seite (bzw. ab dem Klick auf eine Nachricht), bis jedes
// Bild der Seite (img + CSS-Hintergründe/Masken inkl. ::before/::after) per decode() bereit ist.
// Die Liste der CSS-Bilder je Seite wird vorab in einem eigenen Kontext ermittelt, damit das
// Einsammeln nicht in die Messung fällt.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const CPU = Number(process.env.CPU || 1);
const RUNS = Number(process.env.RUNS || 3);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.txt': 'text/plain', '.wav': 'audio/wav' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(join(process.env.DIST || 'dist', path))); }
  catch { res.writeHead(404).end(); }
}).listen(0);
const base = `http://127.0.0.1:${server.address().port}/`;
const raw = await readFile(process.env.SAVE || 'public/saves/test-3-jahre.txt', 'utf8');
const browser = await chromium.launch();

async function openGame() {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await ctx.newPage();
  if (CPU > 1) { const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU }); }
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto(base);
  await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
  // Frischer Cache für die eigentliche Messung: Speicher-Cache leeren, dann neu laden.
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable'); await cdp.send('Network.clearBrowserCache');
  await page.addInitScript(() => {
    // Wartet, bis `sel` da ist, und dann, bis alle Bilder (img im Element + übergebene CSS-URLs) dekodiert sind.
    // Misst ab Erscheinen von `sel` 3 s lang je Bild-Frame: Wann war das letzte sichtbare Bild noch nicht
    // fertig (img nicht geladen, Gesicht ohne .loaded), wann wechselte zuletzt ein Bild seine Quelle
    // (z. B. Wappen → zentrierte Fassung), wann kam zuletzt eine CSS-Textur der Seite vom Server?
    // Ergebnis `afterAppear` = Zeit bis zum endgültigen Bild (0 = alles schon im ersten Frame da).
    window.__watch = (sel, css, t0) => new Promise((done) => {
      const start = t0 ?? performance.now();
      const short = (u) => (u.startsWith('data:') ? 'data:…' : u.replace(/^.*\/assets\//, ''));
      let appear = null, last = 0;
      const ev = [];
      const mark = (t, what) => { if (t > last) last = t; ev.push([Math.round(t), what]); };
      const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth; };
      let changed = null; // erste Änderung in `sel` (z. B. neue Nachricht gerendert)
      const mo = new MutationObserver((ms) => {
        if (changed == null && ms.some((m) => m.target instanceof Node && document.querySelector(sel)?.contains(m.target))) changed = performance.now() - appear;
        for (const m of ms) if (m.target instanceof HTMLImageElement && m.oldValue && m.target.closest(sel) && vis(m.target)) mark(performance.now() - appear, 'Quelle ' + short(m.target.src));
      });
      const po = new PerformanceObserver((l) => {
        for (const e of l.getEntries()) if (appear != null && css.includes(e.name) && e.responseEnd > appear) mark(e.responseEnd - appear, 'CSS ' + short(e.name));
      });
      po.observe({ type: 'resource' });
      const frame = () => {
        const now = performance.now() - appear;
        const root = document.querySelector(sel);
        if (root) {
          for (const i of root.querySelectorAll('img')) if (!(i.complete && i.naturalWidth) && vis(i)) { mark(now, short(i.currentSrc || i.src)); }
          for (const f of root.querySelectorAll('.pa-photo:not(.loaded)')) if (vis(f)) mark(now, 'Gesicht ' + (f.dataset.face || ''));
        }
        if (now < 3000) requestAnimationFrame(frame);
        else {
          mo.disconnect(); po.disconnect();
          const n = root ? root.querySelectorAll('img').length : 0;
          const top = [...new Map(ev.map(([t, w]) => [w, t])).entries()].sort((x, y) => y[1] - x[1]).slice(0, 5).map(([w, t]) => [t, w]);
          done({ appear: appear - start, afterAppear: last, afterChange: changed == null ? 0 : Math.max(0, last - changed), ready: appear - start + last, n, slow: top });
        }
      };
      const wait = () => {
        if (!document.querySelector(sel)) { requestAnimationFrame(wait); return; }
        appear = performance.now();
        mo.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['src'], attributeOldValue: true });
        frame();
      };
      wait();
    });
  });
  await page.reload();
  return { ctx, page };
}

// CSS-Bilder der sichtbaren Seite einsammeln (nur für die Kalibrierung).
const collectCss = (page) => page.evaluate(() => {
  const out = new Set();
  const els = [document.documentElement, ...document.querySelectorAll('*')];
  for (const el of els) for (const ps of [null, '::before', '::after']) {
    const cs = getComputedStyle(el, ps);
    for (const v of [cs.backgroundImage, cs.maskImage, cs.webkitMaskImage]) {
      for (const m of (v || '').matchAll(/url\("([^"]+)"\)/g)) if (!m[1].startsWith('data:')) out.add(m[1]);
    }
  }
  return [...out];
});

async function closePopups(page) {
  for (let i = 0; i < 3 && await page.locator('.bf-continue').count(); i++) { await page.locator('.bf-continue').click(); await page.waitForTimeout(200); }
  for (let i = 0; i < 3; i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(150); }
}

// --- Kalibrierung: welche CSS-Bilder zeigen Hauptmenü, Zentrale, Kader? ---------------------
const cal = {};
{
  const { ctx, page } = await openGame();
  await page.waitForSelector('.st-start'); await page.waitForTimeout(500);
  cal.menu = await collectCss(page);
  await page.click('text=Spiel laden');
  await page.click('.card:has(button:has-text("Löschen")) button:has-text("Laden") >> nth=0');
  await page.waitForSelector('.app-shell'); await page.waitForTimeout(1500); await closePopups(page);
  await page.locator('.hd-nav-item:has-text("Zentrale")').first().click(); await page.waitForSelector('.dz'); await page.waitForTimeout(800);
  cal.zentrale = await collectCss(page);
  await page.locator('.hd-nav-item:has-text("Kader")').first().click(); await page.waitForSelector('.dbox.clickable');
  await page.locator('.dbox.clickable').first().click(); await page.waitForSelector('.sq-legend'); await page.waitForTimeout(1200);
  cal.kader = await collectCss(page);
  await ctx.close();
}

// --- Messläufe ------------------------------------------------------------------------------
const results = [];
for (let run = 0; run < RUNS; run++) {
  const { ctx, page } = await openGame();
  const r = {};
  const bytes = { n: 0, enc: 0 };
  page.on('response', async (res) => {
    if (!/\/assets\//.test(res.url())) return;
    try { const b = await res.body(); bytes.n++; bytes.enc += b.length; } catch { /* abgebrochen */ }
  });
  const log = (x) => process.stderr.write(`[${run}] ${x}\n`);
  log('menu');
  r.menu = await page.evaluate((css) => window.__watch('.st-start', css, 0), cal.menu);
  await page.waitForTimeout(1500); // im Hauptmenü verweilen (Zeit für Vorladen)
  await page.click('text=Spiel laden');
  await page.evaluate((css) => { window.__p = window.__watch('.dz', css); }, cal.zentrale);
  await page.click('.card:has(button:has-text("Löschen")) button:has-text("Laden") >> nth=0');
  r.zentrale1 = await page.evaluate(() => window.__p); log('zentrale1');
  await page.waitForTimeout(1500); await closePopups(page);
  // Kader › Kader (Liste mit 26-px-Gesichtern): Zeit ab Klick auf die Kader-Box.
  await page.locator('.hd-nav-item:has-text("Kader")').first().click(); await page.waitForSelector('.dbox.clickable');
  await page.waitForTimeout(300);
  await page.evaluate((css) => { window.__p = window.__watch('.app-main:has(.sq-legend)', css); }, cal.kader);
  await page.locator('.dbox.clickable').first().click();
  r.kader = await page.evaluate(() => window.__p); log('kader');
  await page.waitForTimeout(400);
  await page.evaluate((css) => { window.__p = window.__watch('.dz', css); }, cal.zentrale);
  await page.locator('.hd-nav-item:has-text("Zentrale")').first().click();
  r.zentrale2 = await page.evaluate(() => window.__p); log('zentrale2');
  // Nachrichten durchklicken: Zeit vom Klick bis Pressefoto/Gesichter des Lesebereichs dekodiert.
  const rows = page.locator('.dz-msg');
  const n = Math.min(await rows.count(), 12);
  const msgs = [];
  for (let i = 1; i < n && msgs.length < 8; i++) {
    await page.waitForTimeout(250); // kurz lesen
    // Beobachtung läuft schon vor dem Klick: Ergebnis = letzter Frame mit noch fehlendem Bild (0 = sofort da).
    await page.evaluate(() => { window.__p = window.__watch('.dz-read', []); });
    await rows.nth(i).click();
    const r = await page.evaluate(() => window.__p);
    if (!await page.locator('.dz-read .dz-rphoto, .dz-read .pa-photo').count()) continue;
    msgs.push({ ...r, ready: r.afterChange });
  }
  r.msgs = msgs;
  r.bytes = bytes;
  r.mem = await page.evaluate(() => (performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null));
  results.push(r);
  await ctx.close();
}
await browser.close(); server.close();

const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? Math.round(s[Math.floor(s.length / 2)]) : null; };
const msgAll = results.flatMap((r) => r.msgs.map((m) => m.ready));
const row = (k) => `${k.padEnd(10)} erscheint ${String(med(results.map((r) => r[k].appear))).padStart(5)} ms · Bilder fertig ${String(med(results.map((r) => r[k].ready))).padStart(5)} ms · Verzögerung nach Erscheinen ${String(med(results.map((r) => r[k].afterAppear))).padStart(5)} ms (${results[0][k].n} Bilder)`;
console.log(`Bild-Ladeprobe · CPU-Drossel ${CPU}× · ${RUNS} Läufe (Median)`);
console.log(`CSS-Bilder: Hauptmenü ${cal.menu.length}, Zentrale ${cal.zentrale.length}, Kader ${cal.kader.length}`);
for (const k of ['menu', 'zentrale1', 'kader', 'zentrale2']) console.log(row(k));
console.log(`Nachricht  neu gezeichnet → letztes Foto/Gesicht sichtbar: Median ${med(msgAll)} ms, max ${Math.round(Math.max(...msgAll))} ms (${msgAll.length} Nachrichten)`);
console.log(`Geladene Bilddaten im Lauf: ${med(results.map((r) => r.bytes.n))} Dateien, ${(med(results.map((r) => r.bytes.enc)) / 1048576).toFixed(1)} MB`);
if (process.env.JSON) console.log(JSON.stringify({ cal, results }, null, 1));
else {
  for (const m of results[0].msgs.slice(0, 4)) console.log(`  Nachricht ${Math.round(m.ready)} ms: ${m.slow.map(([t, u]) => `${u} ${t} ms`).join(' · ')}`);
  for (const k of ['zentrale1', 'kader', 'zentrale2']) console.log(`langsamste ${k} (Lauf 1): ${results[0][k].slow.map(([t, u]) => `${u} ${t} ms`).join(' · ')}`);
}
