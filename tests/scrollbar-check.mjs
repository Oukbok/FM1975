// Bildlaufleisten außerhalb des Inhalts (Wunsch Pascal): prüft auf allen Seiten und einigen
// Fenstern jeden internen Scroll-Bereich.
//   npm run build && node tests/scrollbar-check.mjs [ordner]
//   SAVE=… (Standard Vorlage Test 20 Jahre), VIEW=1366x768, DIST=… (anderer Build, z. B. zum Vergleich),
//   JSON=datei.json schreibt die Messwerte, BASE=datei.json vergleicht die Inhaltsbreite mit einem
//   früheren Lauf (Breite ohne Leiste vorher = Breite jetzt).
// Gemeldet wird: Bereich ohne `scrollbar-gutter: stable` (Inhalt würde springen), Leiste von einem
// Elternteil abgeschnitten (nicht bedienbar), waagrechter Überlauf, Seite scrollt.
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const outDir = process.argv[2] || 'test-output/scrollbar';
await mkdir(outDir, { recursive: true });
const dist = process.env.DIST || 'dist';
const [vw, vh] = (process.env.VIEW || '1920x1080').split('x').map(Number);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.txt': 'text/plain', '.webp': 'image/webp' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { const body = await readFile(join(dist, path)); res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(body); }
  catch { res.writeHead(404).end(); }
}).listen(0);

const raw = await readFile(process.env.SAVE || 'public/saves/test-20-jahre.txt', 'utf8');
const browser = await chromium.launch({ ignoreDefaultArgs: ['--hide-scrollbars'] }); // Leisten zeigen (Playwright blendet sie sonst aus)
const page = await browser.newPage({ viewport: { width: vw, height: vh } });
const errors = [];
page.on('pageerror', (e) => errors.push(`JS-Fehler: ${e.message}`));
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
await page.goto(`http://127.0.0.1:${server.address().port}/`);
await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
await page.reload();
await page.click('text=Spiel laden');
await page.click('button:has-text("Laden") >> nth=0');
await page.waitForTimeout(1500);
for (let i = 0; i < 3 && await page.locator('.bf-continue').count(); i++) { await page.locator('.bf-continue').click(); await page.waitForTimeout(200); }
for (let i = 0; i < 4; i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(150); }

/** Misst alle sichtbaren Scroll-Bereiche (senkrecht) der Seite. */
const measure = () => page.evaluate(() => {
  const name = (el) => {
    const parts = [];
    for (let e = el; e && parts.length < 3 && e !== document.body; e = e.parentElement) {
      const c = [...e.classList].filter((x) => !/^(on|open|active|sel|me|mine|unread|hover)$/.test(x)).slice(0, 2).join('.');
      parts.unshift(c ? `${e.tagName.toLowerCase()}.${c}` : e.tagName.toLowerCase());
    }
    return parts.join(' > ');
  };
  const out = [];
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (!/(auto|scroll)/.test(cs.overflowY)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 40 || r.height < 40 || cs.visibility === 'hidden' || cs.display === 'none') continue;
    const bl = parseFloat(cs.borderLeftWidth) || 0, br = parseFloat(cs.borderRightWidth) || 0;
    const sb = Math.round(el.offsetWidth - el.clientWidth - bl - br);
    const scrolls = el.scrollHeight > el.clientHeight + 1;
    // Abgeschnitten? Rechte Kante der Leiste gegen den Innenbereich jedes clippenden Elternteils.
    // Das Spiel skaliert die Oberfläche (DisplayFrame): Rechtecke in Bildschirm-, Breiten in CSS-Pixeln.
    let clip = 0;
    const k = r.width / (el.offsetWidth || 1);
    const sbRight = r.right - br * k;
    for (let a = el.parentElement; a && a !== document.documentElement; a = a.parentElement) {
      const as = getComputedStyle(a);
      if (as.overflowX === 'visible' && as.overflowY === 'visible') continue;
      const ar = a.getBoundingClientRect();
      const ka = ar.width / (a.offsetWidth || 1);
      const right = ar.left + (a.clientLeft + a.clientWidth) * ka;
      if (sbRight > right + 0.5) clip = Math.max(clip, Math.round((sbRight - right) / k));
    }
    if (sbRight > window.innerWidth + 0.5) clip = Math.max(clip, Math.round((sbRight - window.innerWidth) / k));
    out.push({
      name: name(el), cw: Math.round(el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)), sb, scrolls, gutter: cs.scrollbarGutter,
      mode: parseFloat(cs.marginRight) < 0 && !el.matches('.dbox-body.flush') ? 'out' : 'keep',
      hx: /(hidden|clip)/.test(cs.overflowX) ? 0 : Math.max(0, el.scrollWidth - el.clientWidth),
      clip,
    });
  }
  const m = document.querySelector('.app-main');
  return { list: out, pageScroll: m ? m.scrollHeight - m.clientHeight : 0 };
});

const result = {};
const record = async (label) => {
  await page.waitForTimeout(300);
  const r = await measure();
  result[label] = r.list;
  if (r.pageScroll > 2) errors.push(`${label}: Seite scrollt (${r.pageScroll}px)`);
  for (const x of r.list) {
    if (x.scrolls && x.gutter !== 'stable') errors.push(`${label}: ${x.name} – ohne scrollbar-gutter (Inhalt springt)`);
    if (x.scrolls && x.clip > 1) errors.push(`${label}: ${x.name} – Leiste ${x.clip}px abgeschnitten`);
    if (x.hx > 2) errors.push(`${label}: ${x.name} – waagrechter Überlauf ${x.hx}px`);
  }
};

const mains = await page.locator('.hd-nav-item').count();
for (let m = 0; m < mains; m++) {
  await page.locator('.hd-nav-item').nth(m).click();
  await page.waitForTimeout(250);
  const subs = await page.locator('.tn-sub-item').count();
  for (let s = 0; s < subs; s++) {
    const item = page.locator('.tn-sub-item').nth(s);
    const label = `${m}${String(s).padStart(2, '0')}_${(await item.innerText()).trim().replace(/[^A-Za-z0-9]+/g, '_')}`;
    await item.click();
    await record(label);
    if (process.env.SHOTS) await page.screenshot({ path: `${outDir}/${label}_${vw}.png` });
  }
}

// Fenster: Spielerprofil (alle Reiter), Wiki, Vereinsprofil.
const step = async (n, fn) => { try { await fn(); } catch (e) { errors.push(`${n}: ${e.message.split('\n')[0]}`); } };
await step('profil', async () => {
  await page.locator('.hd-nav-item:has-text("Kader")').first().click();
  await page.waitForTimeout(300);
  await page.locator('.tn-sub-item:has-text("Übersicht")').first().click();
  await page.waitForTimeout(400);
  await page.locator('.dtable tbody tr').nth(4).click();
  await page.waitForSelector('.pp2-tabs', { timeout: 5000 });
  await page.waitForTimeout(600);
  const tabs = page.locator('.pp2-tabs button');
  const n = await tabs.count();
  for (let i = 0; i < n; i++) {
    await tabs.nth(i).click().catch(() => {});
    await record(`profil_${i}`);
    await page.screenshot({ path: `${outDir}/profil_${i}_${vw}.png` });
  }
  await page.keyboard.press('Escape');
});
await step('wiki', async () => {
  await page.locator('.hd-gear').click();
  await page.locator('.menu-dd-item:has-text("Wiki")').click();
  await page.waitForTimeout(600);
  await record('wiki');
  await page.screenshot({ path: `${outDir}/wiki_${vw}.png` });
  const arts = page.locator('.dmsg');
  if (await arts.count() > 3) { await arts.nth(3).click(); await record('wiki_artikel'); await page.screenshot({ path: `${outDir}/wiki_artikel_${vw}.png` }); }
  await page.keyboard.press('Escape');
});

if (process.env.JSON) await writeFile(process.env.JSON, JSON.stringify(result, null, 1));
if (process.env.BASE) {
  // Vergleich: Inhaltsbreite (ohne Innenabstand) jetzt = Breite vorher ohne Leiste.
  const base = JSON.parse(await readFile(process.env.BASE, 'utf8'));
  for (const [label, list] of Object.entries(result)) {
    const before = base[label] || [];
    const seen = {};
    for (const x of list) {
      const k = seen[x.name] = (seen[x.name] || 0) + 1;
      const b = before.filter((y) => y.name === x.name)[k - 1];
      if (!b) continue;
      const free = b.cw + (b.scrolls && b.gutter !== 'stable' ? b.sb : 0);
      // Fest reserviert (C): Inhalt bleibt gleich breit, nur um die Leiste schmaler als früher ohne Leiste.
      const kept = x.mode === 'keep' && free - x.cw > 0 && free - x.cw <= x.sb + 1;
      if (Math.abs(free - x.cw) > 1 && !kept) errors.push(`${label}: ${x.name} – Inhaltsbreite ${x.cw}px statt ${free}px wie vorher ohne Leiste`);
    }
  }
}

await browser.close();
server.close();
console.log(errors.length ? [...new Set(errors)].join('\n') : 'Keine Fehler.');
