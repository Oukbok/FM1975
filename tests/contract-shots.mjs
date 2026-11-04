// Screenshots des Verhandlungstischs (screens/contract/): Start, nach einer abgelehnten Runde
// (Gegenangebot, Verlauf), Hinweis unter dem Zeiger, Einigung; 1920×1080 + 1366×768, dazu ein
// heller Style. Prüft feste Größen (Spalten/Tabelle ändern sich nicht), Überläufe und JS-Fehler.
//   npm run build && node tests/contract-shots.mjs [ordner]
//   Standard-Spielstand: Vorlage „Test 3 Jahre“; andere mit SAVE=a.txt[,b.txt] (PREFIX je Datei = Dateiname).
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import { chromium } from 'playwright';
import LZ from 'lz-string';

/** Vorstand großzügiger stellen (Gehaltsbudget +60 %), damit auch eine Einigung zu sehen ist (ROOM=0 schaltet ab). */
function withRoom(raw) {
  if (process.env.ROOM === '0' || !raw.startsWith('LZ1:')) return raw;
  const o = JSON.parse(LZ.decompressFromUTF16(raw.slice(4)));
  const g = o.game ?? o;
  const c = g.clubs?.[g.managedClubId];
  if (c?.finances) { c.finances.wageBudget = Math.round((c.finances.wageBudget || 1) * 1.6); c.finances.transferBudget = Math.max(c.finances.transferBudget, 2_000_000); }
  return 'LZ1:' + LZ.compressToUTF16(JSON.stringify(o));
}

const outDir = process.argv[2] || 'test-output/contract';
await mkdir(outDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.txt': 'text/plain', '.webp': 'image/webp' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(join('dist', path))); }
  catch { res.writeHead(404).end(); }
}).listen(0);
const saves = (process.env.SAVE || 'public/saves/test-3-jahre.txt').split(',');
const browser = await chromium.launch();
const errors = [];

async function open(raw, w, h, theme) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  page.on('pageerror', (e) => errors.push(`${w}: JS-Fehler: ${e.message}`));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.evaluate(([r, t]) => {
    localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim']));
    localStorage.setItem('fm1980_settings', JSON.stringify({ indoorShow: 'aus', drawShow: 'aus', awardsShow: 'aus', ratingShow: 'aus', transferWindowShow: false, matchReport: 'nie', ...(t ? { theme: t } : {}) }));
  }, [raw, theme]);
  await page.reload();
  await page.click('text=Spiel laden');
  await page.click('button:has-text("Laden") >> nth=0');
  await page.waitForTimeout(1500);
  for (let i = 0; i < 3 && await page.locator('.bf-continue').count(); i++) { await page.locator('.bf-continue').click(); await page.waitForTimeout(200); }
  for (let k = 0; k < 6 && await page.locator('.modal-overlay, .bm-root, .bud-root').count(); k++) {
    const x = page.locator('.modal-close, button:has-text("Schließen"), button:has-text("Bestätigen"), button:has-text("OK"), button:has-text("Weiter")').first();
    if (await x.isVisible().catch(() => false)) await x.click().catch(() => {}); else break;
    await page.waitForTimeout(250);
  }
  await page.locator('.hd-nav-item:has-text("Kader")').first().click();
  await page.waitForTimeout(250);
  await page.locator('.tn-sub-item:has-text("Verträge")').first().click();
  await page.waitForTimeout(500);
  return page;
}

/** Größen der festen Teile + Überläufe. */
async function measure(page) {
  return page.evaluate(() => {
    const box = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; };
    const sizes = Object.fromEntries(['.ct-root', '.ct-player', '.ct-mid', '.ct-side', '.ct-rows', '.ct-log', '.ct-foot', '.ct-hint', '.ct-notice'].map((s) => [s, box(s)]));
    const over = [];
    for (const el of document.querySelectorAll('.ct-kv > span, .ct-lab, .ct-name, .ct-title, .ct-thead > span, .ct-chip, .ct-actions button')) {
      if (el.scrollWidth > el.clientWidth + 2) over.push(`${el.className || el.tagName}: „${el.textContent.slice(0, 30)}“ +${el.scrollWidth - el.clientWidth}px`);
    }
    const root = document.querySelector('.ct-root')?.getBoundingClientRect();
    if (root && (root.right > innerWidth + 1 || root.bottom > innerHeight + 1)) over.push('Bildschirm ragt aus dem Fenster');
    return { sizes, over };
  });
}

let base = null;
async function shot(page, name) {
  await page.waitForTimeout(250);
  const m = await measure(page);
  if (!base) base = m.sizes;
  const diff = Object.entries(m.sizes).filter(([k, v]) => base[k] && v && (Math.abs(v[0] - base[k][0]) > 1 || Math.abs(v[1] - base[k][1]) > 1)).map(([k, v]) => `${k} ${base[k].join('×')} → ${v.join('×')}`);
  const rep = [...m.over, ...diff];
  console.log(`${name}: ${rep.length ? rep.join('; ') : 'ok'}`);
  if (rep.length) errors.push(`${name}: ${rep.join('; ')}`);
  await page.screenshot({ path: `${outDir}/${name}.png` });
}

/** Spielergespräch beim Transfer am Verhandlungstisch: Vereinsgespräch mit Höchstgebot, dann „Am Verhandlungstisch“. */
async function transferShots(page, tag) {
  await page.locator('.hd-nav-item:has-text("Transfers")').first().click();
  await page.waitForTimeout(250);
  await page.locator('.tn-sub-item:has-text("Transfermarkt")').first().click();
  await page.waitForTimeout(500);
  const rows = page.locator('.app-main tr[data-pid], .app-main .rl-row[data-pid]');
  for (let i = 1; i < Math.min(8, await rows.count()); i++) {
    await rows.nth(i).click({ button: 'right' });
    const item = page.locator('.pcm-item:has-text("Transferverhandlung")').first();
    if (!(await item.count())) { await page.keyboard.press('Escape'); continue; }
    await item.click();
    await page.waitForTimeout(400);
    if (!(await page.locator('.modal .talk-form').count())) { await page.keyboard.press('Escape'); await page.waitForTimeout(150); continue; }
    for (let k = 0; k < 3 && await page.locator('.modal button:has-text("Angebot abgeben")').count(); k++) {
      await page.locator('.modal .talk-form input[type=range]').first().evaluate((el) => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, el.max);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await page.locator('.modal button:has-text("Angebot abgeben")').click();
      await page.waitForTimeout(300);
    }
    const btn = page.locator('.modal button:has-text("Am Verhandlungstisch")');
    if (!(await btn.count())) { await page.keyboard.press('Escape'); await page.waitForTimeout(150); continue; }
    await btn.click();
    await page.waitForSelector('.ct-root', { timeout: 4000 });
    base = null;
    await shot(page, `${tag}_6_transfer_start`);
    await page.locator('button:has-text("Forderung übernehmen")').click();
    await page.locator('.ct-send').click();
    await shot(page, `${tag}_7_transfer_ergebnis`);
    await page.keyboard.press('Escape');
    return;
  }
  console.log(`${tag}: kein Transfer bis zum Spielergespräch gekommen (übersprungen)`);
}

for (const file of saves) {
  const raw = withRoom(await readFile(file, 'utf8'));
  const pre = saves.length > 1 || process.env.SAVE ? basename(file).replace(/\.\w+$/, '') + '_' : '';
  for (const [w, h, theme] of [[1920, 1080], [1366, 768], [1920, 1080, 'papier']]) {
    base = null;
    const tag = `${pre}${w}${theme ? '_' + theme : ''}`;
    const page = await open(raw, w, h, theme);
    // Spieler mit dem frühesten Vertragsende (Tabelle ist danach sortiert) – Gespräch offen.
    const pids = await page.locator('.dtable tbody tr[data-pid]').evaluateAll((rows) => rows.map((r) => r.getAttribute('data-pid')));
    if (!pids.length) { errors.push(`${tag}: keine Spieler in Kader › Verträge`); await page.close(); continue; }
    let opened = false;
    for (const pid of pids.slice(0, 8)) {
      await page.evaluate((id) => window.dispatchEvent(new CustomEvent('fm:contract-screen', { detail: { kind: 'renew', pid: id } })), pid);
      await page.waitForSelector('.ct-root', { timeout: 5000 });
      await page.waitForTimeout(300);
      if (await page.locator('.ct-table').count()) { opened = true; break; }
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
    }
    if (!opened) { errors.push(`${tag}: kein Spieler verhandlungsbereit`); await page.close(); continue; }
    await shot(page, `${tag}_1_start`);
    await page.locator('.ct-row-signing').hover();
    await shot(page, `${tag}_2_hinweis`);
    await page.locator('.ct-send').click();
    await shot(page, `${tag}_3_runde1`);
    await page.locator('button:has-text("Forderung übernehmen")').click();
    await page.waitForTimeout(150);
    await shot(page, `${tag}_4_forderung`);
    await page.locator('.ct-send').click();
    await shot(page, `${tag}_5_ergebnis`);
    if (!(await page.locator('.ct-banner.good').count()) && (process.env.ROOM === '0' ? !(await page.locator('.ct-notice.bad').count()) : true)) errors.push(`${tag}: Forderung übernommen, aber keine Einigung`);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    if (await page.locator('.ct-root').count()) errors.push(`${tag}: Esc schließt den Tisch nicht`);
    if (!theme && process.env.TRANSFER !== '0') await transferShots(page, tag);
    await page.close();
  }
}
await browser.close();
server.close();
if (errors.length) { console.error('FEHLER:\n' + errors.join('\n')); process.exit(1); }
console.log(`OK – Screenshots in ${outDir}`);
