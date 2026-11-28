// Screenshots + Prüfung der Spieler-Infokarte (components/playerCard/):
//   Hover auf den Info-Knopf in der Kaderliste der Aufstellung (Torwart + Feldspieler),
//   2 s Hover auf eine Karte auf dem Feld und der Bank, Ziehen öffnet nie, Kader › Übersicht.
//   Prüft: Karte ganz im Bildschirm, feste Größe, Zoom 1,75, Köpfe auf dem Feld ohne Spalt zur Box, keine JS-Fehler. 1920×1080, 1366×768 und 1280×800.
//   npm run build && node tests/playercard-shots.mjs [ordner]   (SAVE=… Standard public/saves/ddr-1980.txt)
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const outDir = process.argv[2] || 'test-output/playercard';
const SAVE = process.env.SAVE || 'public/saves/ddr-1980.txt';
await mkdir(outDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(join('dist', path))); }
  catch { res.writeHead(404).end(); }
}).listen(0);
const url = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch();
const errors = [];
const fails = [];
const check = (ok, msg) => { if (!ok) fails.push(msg); console.log(`${ok ? 'ok  ' : 'FEHL'} ${msg}`); };

async function setup(vp) {
  const page = await browser.newPage({ viewport: vp });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto(url);
  const raw = await readFile(SAVE, 'utf8');
  await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
  await page.reload();
  await page.click('text=Spiel laden');
  await page.click('.card:has(button:has-text("Löschen")) button:has-text("Laden") >> nth=0');
  await page.waitForTimeout(1800);
  // Vorschau „Nächstes Spiel“ / Briefing o. ä. schließen
  for (let k = 0; k < 4; k++) {
    if (await page.locator('.pm-root').isVisible().catch(() => false)) { await page.keyboard.press('Escape'); await page.waitForTimeout(400); continue; }
    const bf = page.locator('.bf-modal .bf-continue');
    if (await bf.isVisible().catch(() => false)) { await bf.click(); await page.waitForTimeout(400); continue; }
    break;
  }
  return page;
}
async function goto(page, cat, sub) {
  await page.locator(`.hd-nav-item:has-text("${cat}")`).click();
  await page.waitForTimeout(200);
  await page.locator(`.tn-sub-item:has-text("${sub}")`).first().click();
  await page.waitForTimeout(600);
}
/** Lage der Karte: ganz im Bildschirm? */
async function cardBox(page) {
  const loc = page.locator('.pc-float');
  if (!(await loc.count())) return null;
  return page.evaluate(() => {
    const r = document.querySelector('.pc-float').getBoundingClientRect();
    const c = document.querySelector('.pc-card');
    const content = document.querySelector('.display-content'), inner = document.querySelector('.display-inner');
    const t = inner ? getComputedStyle(inner).transform : 'none';
    const s = (content ? parseFloat(getComputedStyle(content).zoom || '1') || 1 : 1) * (t && t !== 'none' ? new DOMMatrix(t).a : 1);
    return { s, x: r.x, y: r.y, w: r.width, h: r.height, vw: innerWidth, vh: innerHeight, ow: c.offsetWidth, oh: c.offsetHeight,
      over: [...document.querySelectorAll('.pc-card *')].filter((e) => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow === 'hidden' && !e.matches('.pc-fact > b, .pc-club, .pc-name, .pc-arow > span, .pc-fk > b')).length };
  });
}
function inside(b, tag) {
  check(!!b, `${tag}: Karte offen`);
  if (!b) return;
  check(b.x >= 0 && b.y >= 0 && b.x + b.w <= b.vw + 0.5 && b.y + b.h <= b.vh + 0.5, `${tag}: Karte im Bildschirm (${Math.round(b.x)},${Math.round(b.y)} ${Math.round(b.w)}×${Math.round(b.h)})`);
  check(b.ow === 900 && b.oh === 560, `${tag}: feste Größe 900×560 (${b.ow}×${b.oh})`);
  // Anzeige 1,75 × UI-Skalierung, bei kleinem Fenster so groß wie möglich (eine Seite füllt das Fenster)
  const full = b.w >= b.vw - 16 - 1 || b.h >= b.vh - 16 - 1;
  check(Math.abs(b.w / b.ow - b.s * 1.75) < 0.02 || full, `${tag}: Zoom 1,75 × UI ${b.s.toFixed(2)} oder fensterfüllend (${(b.w / b.ow).toFixed(2)})`);
}

for (const vp of [{ width: 1920, height: 1080 }, { width: 1366, height: 768 }, { width: 1280, height: 800 }]) {
  const tag = `${vp.width}`;
  const page = await setup(vp);
  await goto(page, 'Aufstellung', 'Aufstellung');

  // 1) Info-Knopf in der Kaderliste: Torwart (erste Zeile) und ein Feldspieler
  for (const [n, who] of [[0, 'tw'], [6, 'feld']]) {
    const btn = page.locator('.lu-row .pc-ibtn').nth(n);
    await btn.hover();
    await page.waitForTimeout(350);
    inside(await cardBox(page), `${tag} Liste ${who}`);
    await page.screenshot({ path: `${outDir}/${tag}_liste_${who}.png` });
    await page.mouse.move(5, vp.height - 5);
    await page.waitForTimeout(150);
    check(!(await page.locator('.pc-float').count()), `${tag} Liste ${who}: schließt beim Verlassen`);
  }

  // Köpfe auf dem Feld liegen direkt auf der Namensbox (kein Spalt)
  const gaps = await page.evaluate(() => [...document.querySelectorAll('.lu-slot .lu-card-head')].map((h) => {
    const img = h.querySelector('img'); const card = h.closest('.lu-card');
    if (!img || !card || !img.naturalHeight) return null;
    // unterste deckende Bildzeile messen
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    let low = -1;
    try { const d = x.getImageData(0, 0, c.width, c.height).data;
      for (let y = c.height - 1; y >= 0 && low < 0; y--) for (let i = 0; i < c.width; i++) if (d[(y * c.width + i) * 4 + 3] > 40) { low = y; break; } } catch { return null; }
    const ir = img.getBoundingClientRect(), cr = card.getBoundingClientRect();
    return Math.round(cr.top - (ir.top + (low + 1) / c.height * ir.height));
  }).filter((v) => v != null));
  check(gaps.length > 0 && gaps.every((g) => g <= 0), `${tag} Feld: Köpfe berühren die Box (Spalt ${gaps.join(',')})`);
  const fb = await page.locator('.lu-field').boundingBox();
  await page.screenshot({ path: `${outDir}/${tag}_koepfe.png`, clip: fb });

  // 2) 2 s Hover auf einer Feldkarte (Mittelfeld) – vorher nicht offen
  const slot = page.locator('.lu-slot:not([data-pid=""])').nth(6);
  await slot.hover();
  await page.waitForTimeout(1000);
  check(!(await page.locator('.pc-float').count()), `${tag} Feld: nach 1 s noch zu`);
  await page.waitForTimeout(1300);
  inside(await cardBox(page), `${tag} Feld`);
  await page.screenshot({ path: `${outDir}/${tag}_feld.png` });
  // Drücken schließt sofort, Ziehen öffnet nie
  const b = await slot.boundingBox();
  await page.mouse.down();
  await page.waitForTimeout(100);
  check(!(await page.locator('.pc-float').count()), `${tag} Feld: Drücken schließt`);
  await page.mouse.move(b.x + b.width / 2 + 30, b.y + b.height / 2 + 20, { steps: 4 });
  await page.waitForTimeout(2300);
  check(!(await page.locator('.pc-float').count()), `${tag} Feld: beim Ziehen zu`);
  await page.keyboard.press('Escape');
  await page.mouse.up();
  await page.mouse.move(5, vp.height - 5);
  await page.waitForTimeout(300);

  // 3) Ersatzbank
  const bench = page.locator('.lu-bslot[data-pid]').first();
  if (await bench.count()) {
    await bench.hover();
    await page.waitForTimeout(2300);
    inside(await cardBox(page), `${tag} Bank`);
    await page.screenshot({ path: `${outDir}/${tag}_bank.png` });
    await page.mouse.move(5, vp.height - 5);
    await page.waitForTimeout(200);
  }

  // 4) Kader › Übersicht
  await goto(page, 'Kader', 'Kader');
  const kb = page.locator('tr[data-pid] .pc-ibtn').nth(3);
  await kb.hover();
  await page.waitForTimeout(350);
  inside(await cardBox(page), `${tag} Kader`);
  await page.screenshot({ path: `${outDir}/${tag}_kader.png` });
  await page.close();
}

console.log(errors.length ? `JS-Fehler:\n${errors.join('\n')}` : 'keine JS-Fehler');
console.log(fails.length ? `${fails.length} Fehler` : 'alles ok');
await browser.close();
server.close();
process.exit(fails.length || errors.length ? 1 : 0);
