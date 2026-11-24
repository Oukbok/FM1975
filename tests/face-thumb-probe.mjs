// Messung Gesichts-Miniaturen (Wunsch Pascal: kleine Köpfe in Listen nicht als 512×600 dekodieren).
//   npm run build && node tests/face-thumb-probe.mjs
//   DIST=…  anderer Build (vorher/nachher), RUNS=3 Wiederholungen (Median), SAVE=… Spielstand,
//   SHOTS=ordner  vergrößerte Screenshots je Seite (Ausschnitt mit Gesichtern, 2×),
//   JSON=1  Rohdaten.
// Ablauf je Lauf in frischem Browser-Kontext (leerer Cache, lokaler Server wie die Desktop-Fassung):
// Spielstand laden → Zentrale → Kader › Kader → Statistiken › Liga → Transfers › Transfermarkt →
// Jugend › Jugendkader (falls da). Je Seite: Zeit vom Klick, bis jedes sichtbare Gesicht im Hauptbereich
// geladen UND dekodiert ist (`.pa-photo.loaded`, img.complete) – ab Klick und ab dem ersten Bild mit
// Gesichts-Boxen (= reine Bildzeit ohne Rechenzeit der Seite) –, Zahl der Gesichter (davon Miniaturen).
// Danach Speicher über Chromium-Speicherabzug (Tracing „memory-infra“, wie chrome://tracing):
// Bildspeicher des Renderers (dekodierte Bilder: cc/image_memory, discardable, skia, web_cache) und
// private Speicher aller Chromium-Prozesse; dazu JS-Heap und geladene Gesichts-Bytes.
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const RUNS = Number(process.env.RUNS || 3);
const DIST = process.env.DIST || 'dist';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.txt': 'text/plain', '.wav': 'audio/wav' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(join(DIST, path))); }
  catch { res.writeHead(404).end(); }
}).listen(0);
const base = `http://127.0.0.1:${server.address().port}/`;
const raw = await readFile(process.env.SAVE || 'public/saves/test-3-jahre.txt', 'utf8');
const browser = await chromium.launch({ args: ['--enable-precise-memory-info'] });

const PAGES = [
  { key: 'zentrale', main: 'Zentrale', wait: '.dz' },
  { key: 'kader', main: 'Kader', box: '.dbox.clickable', wait: '.sq-legend' },
  { key: 'statistik', main: 'Statistiken', sub: 'Liga', wait: '.cmp-pname, .fthumb' },
  { key: 'transfermarkt', main: 'Transfers', sub: 'Transfermarkt', wait: '.tm-name' },
];

async function memoryDump(page) {
  const cdp = await page.context().browser().newBrowserCDPSession();
  const chunks = [];
  const done = new Promise((r) => cdp.on('Tracing.tracingComplete', r));
  cdp.on('Tracing.dataCollected', (e) => chunks.push(...e.value));
  await cdp.send('Tracing.start', { traceConfig: { includedCategories: ['disabled-by-default-memory-infra'], memoryDumpConfig: { triggers: [] } } });
  await new Promise((r) => setTimeout(r, 300));
  await cdp.send('Tracing.requestMemoryDump', { levelOfDetail: 'detailed' });
  await cdp.send('Tracing.end');
  await done;
  await cdp.detach();
  const out = { image: 0, parts: {}, privateMB: 0 };
  const big = (v) => (v ? parseInt(v, 16) : 0);
  for (const ev of chunks) {
    if (ev.ph !== 'v' || !ev.args?.dumps) continue;
    const d = ev.args.dumps;
    const pf = big(d.process_totals?.private_footprint_bytes);
    out.privateMB += pf;
    const al = d.allocators || {};
    for (const [name, a] of Object.entries(al)) {
      // Oberste Ebene der Bild-Speicher (keine Unterknoten doppelt zählen).
      if (!['cc/image_memory', 'discardable', 'skia/sk_resource_cache', 'web_cache/Image_resources', 'gpu/gl', 'skia/gpu_resources'].includes(name)) continue;
      const v = big(a.attrs?.size?.value);
      out.parts[name] = (out.parts[name] || 0) + v;
    }
  }
  for (const k of Object.keys(out.parts)) out.parts[k] = +(out.parts[k] / 1048576).toFixed(1);
  out.image = +(['cc/image_memory', 'discardable', 'skia/sk_resource_cache'].reduce((s, k) => s + (out.parts[k] || 0), 0)).toFixed(1);
  out.privateMB = +(out.privateMB / 1048576).toFixed(1);
  return out;
}

async function closePopups(page) {
  for (let i = 0; i < 3 && await page.locator('.bf-continue').count(); i++) { await page.locator('.bf-continue').click(); await page.waitForTimeout(200); }
  for (let i = 0; i < 3; i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(150); }
}

// Wartet ab Klick, bis alle sichtbaren Gesichter im Hauptbereich geladen sind (max. 6 s).
const facesReady = (page, t0) => page.evaluate(async (t0) => {
  const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth; };
  const frame = () => new Promise((r) => requestAnimationFrame(() => r()));
  let first = null; // erstes Bild, auf dem Gesichts-Boxen stehen (Seite gerendert)
  for (;;) {
    const root = document.querySelector('.app-main') || document.body;
    const faces = [...root.querySelectorAll('.pa-photo')].filter(vis);
    if (first == null && faces.length) first = performance.now();
    const open = faces.filter((f) => { const i = f.querySelector('img'); return !f.classList.contains('loaded') || !(i && i.complete && i.naturalWidth); });
    if ((faces.length && !open.length) || performance.now() - t0 > 6000) {
      const imgs = faces.map((f) => f.querySelector('img')).filter(Boolean);
      const sizes = imgs.map((i) => Math.round(i.getBoundingClientRect().width));
      return {
        ms: Math.round(performance.now() - t0), after: first == null ? null : Math.round(performance.now() - first), faces: faces.length, open: open.length,
        thumbs: imgs.filter((i) => /faces-sm\//.test(i.src) || i.dataset.thumb === '1').length,
        maxThumbPx: Math.max(0, ...imgs.filter((i) => /faces-sm\//.test(i.src)).map((i) => i.getBoundingClientRect().width)),
        sizes: [...new Set(sizes)].sort((a, b) => a - b),
      };
    }
    await frame();
  }
}, t0);

async function openPage(page, p) {
  await page.locator(`.hd-nav-item:has-text("${p.main}")`).first().click();
  await page.waitForTimeout(250);
  let t0;
  if (p.sub) {
    const sub = page.locator('.tn-sub-item').filter({ hasText: new RegExp(`^\\s*${p.sub}\\s*$`, 'i') }).first();
    if (!await sub.count()) return null;
    t0 = await page.evaluate(() => performance.now());
    await sub.click();
  } else if (p.box) {
    await page.waitForSelector(p.box);
    t0 = await page.evaluate(() => performance.now());
    await page.locator(p.box).first().click();
  } else t0 = await page.evaluate(() => performance.now());
  await page.waitForSelector(p.wait, { timeout: 15000 }).catch(() => {});
  return facesReady(page, t0);
}

const results = [];
for (let run = 0; run < RUNS; run++) {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const faceBytes = { n: 0, b: 0, sm: 0 };
  page.on('response', async (res) => {
    if (!/\/assets\/faces(-sm)?\//.test(res.url())) return;
    try { const b = await res.body(); faceBytes.n++; faceBytes.b += b.length; if (/faces-sm\//.test(res.url())) faceBytes.sm++; } catch { /* abgebrochen */ }
  });
  await page.goto(base);
  await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
  await page.reload();
  await page.click('text=Spiel laden');
  await page.click('.card:has(button:has-text("Löschen")) button:has-text("Laden") >> nth=0');
  await page.waitForSelector('.app-shell'); await page.waitForTimeout(1500); await closePopups(page);
  const memStart = await memoryDump(page);
  const r = { pages: {} };
  for (const p of PAGES) {
    r.pages[p.key] = await openPage(page, p);
    process.stderr.write(`[${run}] ${p.key} ${JSON.stringify(r.pages[p.key])}\n`);
    if (process.env.SHOTS && run === 0) {
      await mkdir(process.env.SHOTS, { recursive: true });
      await page.waitForTimeout(400);
      await page.screenshot({ path: join(process.env.SHOTS, `${p.key}.png`) });
    }
    await page.waitForTimeout(600);
  }
  await page.waitForTimeout(1000);
  r.memStart = memStart;
  r.mem = await memoryDump(page);
  r.heap = await page.evaluate(() => (performance.memory ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(1) : null));
  r.faceBytes = faceBytes;
  results.push(r);
  await ctx.close();
}
await browser.close(); server.close();

const med = (a) => { const s = a.filter((x) => x != null).sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };
console.log(`Gesichts-Probe · ${DIST} · ${RUNS} Läufe (Median)`);
for (const p of PAGES) {
  const rs = results.map((r) => r.pages[p.key]).filter(Boolean);
  if (!rs.length) { console.log(`  ${p.key.padEnd(14)} –`); continue; }
  console.log(`  ${p.key.padEnd(14)} Gesichter fertig ${String(med(rs.map((x) => x.ms))).padStart(5)} ms ab Klick, ${String(med(rs.map((x) => x.after))).padStart(4)} ms nach Erscheinen der Seite · ${rs[0].faces} Gesichter (${rs[0].thumbs} Miniaturen, größte Miniatur ${rs[0].maxThumbPx} px) · Breiten ${rs[0].sizes.join('/')} px${rs.some((x) => x.open) ? ` · offen ${rs.map((x) => x.open).join('/')}` : ''}`);
}
const m = (f) => med(results.map(f));
console.log(`  Bildspeicher Renderer (cc/image_memory + discardable + skia) nach dem Spielladen ${m((r) => r.memStart.image)} MB → nach allen Seiten ${m((r) => r.mem.image)} MB`);
console.log(`  Teile nach allen Seiten: ${Object.keys(results[0].mem.parts).map((k) => `${k} ${m((r) => r.mem.parts[k] ?? 0)}`).join(' · ')} MB`);
console.log(`  Privater Speicher alle Chromium-Prozesse ${m((r) => r.mem.privateMB)} MB · JS-Heap ${m((r) => r.heap)} MB`);
console.log(`  Gesichtsdateien geladen ${m((r) => r.faceBytes.n)} (${m((r) => r.faceBytes.sm)} Miniaturen), ${(m((r) => r.faceBytes.b) / 1024).toFixed(0)} KB`);
if (process.env.JSON) console.log(JSON.stringify(results, null, 1));
