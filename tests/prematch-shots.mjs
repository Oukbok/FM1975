// Screenshots der Vorschau „Nächstes Spiel“ (screens/prematch/) bei 1920×1080 und 1366×768.
//   npm run build && node tests/prematch-shots.mjs [ordner] [präfix]
//   Standard: Vorlage „Test 3 Jahre“ (Liga heim/auswärts, Pokal, Europapokal 1978/79); SAVE=… für spätere Epochen.
//   MAX=… = höchstens so viele eigene Spiele durchlaufen (Standard 14).
// Prüft: kein Überlauf/Scrollen im Fenster, Knöpfe sichtbar, Simulieren startet den Spielbericht, JS-Fehler.
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const outDir = process.argv[2] || 'test-output/prematch';
const prefix = process.argv[3] || 'pm';
const MAX = Number(process.env.MAX || 14);
await mkdir(outDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.txt': 'text/plain' };
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
const raw = await readFile(process.env.SAVE || 'public/saves/test-3-jahre.txt', 'utf8');
await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
await page.reload();
await page.click('text=Spiel laden');
await page.click('button:has-text("Laden") >> nth=0');
await page.waitForTimeout(1500);

/** Überläufe im Fenster melden (Bereiche, die abgeschnitten werden oder scrollen müssten). */
async function check(name) {
  const rep = await page.evaluate(() => {
    const out = [];
    const root = document.querySelector('.pm-root');
    if (!root) return ['Fenster fehlt'];
    const rr = root.getBoundingClientRect();
    for (const el of root.querySelectorAll('.pm-card, .pm-side, .pm-sec:not(.pm-about), .pm-frow, .pm-bar-side, .pm-go-btn, .pm-quick, .pm-info')) {
      const r = el.getBoundingClientRect();
      if (el.scrollHeight > el.clientHeight + 2) out.push(`${el.className.split(' ').join('.')}: senkrechter Überlauf ${el.scrollHeight - el.clientHeight}px`);
      if (el.scrollWidth > el.clientWidth + 2) out.push(`${el.className.split(' ').join('.')}: waagerechter Überlauf ${el.scrollWidth - el.clientWidth}px`);
      if (r.bottom > rr.bottom + 1 || r.right > rr.right + 1) out.push(`${el.className.split(' ')[0]} ragt aus dem Fenster`);
    }
    const about = root.querySelector('.pm-about');
    if (about && about.scrollHeight > about.clientHeight + 2) out.push(`Hinweis: „Über die Stadt“ scrollt intern (${about.scrollHeight - about.clientHeight}px)`);
    return out;
  });
  console.log(`${name}: ${rep.length ? rep.join('; ') : 'ok'}`);
  for (const r of rep) if (!r.startsWith('Hinweis')) errors.push(`${name}: ${r}`);
}

async function shoot(name) {
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${outDir}/${prefix}_${name}.png` });
  await check(name);
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${outDir}/${prefix}_${name}_1366.png` });
  await check(`${name}@1366`);
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.waitForTimeout(300);
}

const seen = new Set();
let matches = 0;
const t0 = Date.now();
while (matches < MAX && Date.now() - t0 < 8 * 60_000) {
  if (await page.locator('.pm-root').isVisible().catch(() => false)) {
    const comp = (await page.locator('.pm-comp').innerText()).trim();
    const home = await page.locator('.pm-bar-side.home.mine').count();
    const kind = (/^Pokal/.test(comp) ? 'pokal' : /^Liga/.test(comp) ? 'liga' : 'europa') + (home ? '_heim' : '_auswaerts');
    matches++;
    console.log(`Spiel ${matches}: ${comp} · ${(await page.locator(".pm-bar").innerText()).replace(/\s+/g, " ")} → ${kind}`);
    if (!seen.has(kind)) { seen.add(kind); await shoot(kind); }
    if (matches === 1) {
      // Schnelle Aufstellung, Schließen und Wiederöffnen über die Kopfleiste
      await page.keyboard.press('Escape'); await page.waitForTimeout(300);
      if (await page.locator('.pm-root').count()) errors.push('Esc schließt das Fenster nicht');
      await page.click('.hd-continue.pm-next'); await page.waitForTimeout(300);
      if (!(await page.locator('.pm-root').count())) errors.push('Knopf „Nächstes Spiel“ öffnet das Fenster nicht');
    }
    await page.click('.pm-go-btn:has-text("Simulieren")');
    await page.waitForTimeout(900);
    if (!(await page.locator('.modal-overlay').count())) errors.push(`${kind}: nach „Simulieren“ kein Spielbericht`);
    if (seen.size >= 6) break;
  }
  for (const sel of ['button:has-text("Zum Spielbericht")', '.dr-root button:has-text("Ergebnis sofort zeigen")', '.dr-root button:has-text("Bis zum Ende springen")', '.dr-root button:has-text("Schließen")', 'button:has-text("Schließen")', '.modal-overlay .modal-close']) {
    const b = page.locator(sel).first();
    if (await b.isVisible().catch(() => false)) await b.click().catch(() => {});
  }
  if (!(await page.locator('.pm-root').count())) {
    const w = page.locator('button.hd-continue').filter({ hasText: /^\s*Weiter\s*$/i }).first();
    if (await w.isVisible().catch(() => false)) await w.click().catch(() => {});
    await page.waitForSelector('.pm-root, .modal-overlay, .dr-root', { timeout: 20_000 }).catch(() => {});
  }
  await page.waitForTimeout(300);
}
console.log(`Gesehen: ${[...seen].join(', ') || '–'}`);
console.log(errors.length ? errors.join('\n') : 'Keine Fehler.');
await browser.close();
server.close();
process.exit(errors.length ? 1 : 0);
