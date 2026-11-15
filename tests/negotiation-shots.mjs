// Screenshots des Verhandlungstischs (screens/negotiation/, screens/contract/) für alle vier Gespräche:
//   Spieler (Vertragsverlängerung), Transfer (Verein → Spieler → Abschluss), Mitarbeiter (Einstellung),
//   Sponsor (Angebot aus Finanzen › Sponsoring; neues Spiel 1975, dort liegen Angebote vor).
// Je Gespräch: Start, Hinweis unter dem Zeiger, nach einer abgelehnten Runde (Gegenvorschlag, Verlauf),
// „nicht verhandelbar“, Abschluss mit Stempel (Einigung) und ein gescheitertes Gespräch.
// Prüft feste Größen (Spalten/Karten ändern sich beim Bedienen nicht), Überläufe und JS-Fehler.
//   npm run build && node tests/negotiation-shots.mjs [ordner]
//   VIEW=1366x768 für kleine Bildschirme, ONLY=renew|transfer|staff|sponsor, SAVE=… (Standard: Vorlage „Test 3 Jahre“).
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import LZ from 'lz-string';
import { startNewGame } from './newgame-flow.mjs';

/** Vorstand großzügiger stellen, damit Einigungen nicht am Budget scheitern (ROOM=0 schaltet ab). */
function withRoom(raw) {
  if (process.env.ROOM === '0' || !raw.startsWith('LZ1:')) return raw;
  const o = JSON.parse(LZ.decompressFromUTF16(raw.slice(4)));
  const g = o.game ?? o;
  const c = g.clubs?.[g.managedClubId];
  if (c?.finances) { c.finances.wageBudget = Math.round((c.finances.wageBudget || 1) * 1.6); c.finances.transferBudget = Math.max(c.finances.transferBudget, 3_000_000); }
  if (process.env.DATE) g.calendar.currentDate = process.env.DATE;
  return 'LZ1:' + LZ.compressToUTF16(JSON.stringify(o));
}

const outDir = process.argv[2] || 'test-output/negotiation';
await mkdir(outDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.txt': 'text/plain', '.webp': 'image/webp' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(join('dist', path))); }
  catch { res.writeHead(404).end(); }
}).listen(0);
const [vw, vh] = (process.env.VIEW || '1920x1080').split('x').map(Number);
const only = process.env.ONLY;
const browser = await chromium.launch();
const errors = [];
const tag = String(vw);

async function open() {
  const raw = withRoom(await readFile(process.env.SAVE || 'public/saves/test-3-jahre.txt', 'utf8'));
  const page = await browser.newPage({ viewport: { width: vw, height: vh } });
  page.on('pageerror', (e) => errors.push(`JS-Fehler: ${e.message}`));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.evaluate((r) => {
    localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim']));
    localStorage.setItem('fm1980_settings', JSON.stringify({ indoorShow: 'aus', drawShow: 'aus', awardsShow: 'aus', ratingShow: 'aus', transferWindowShow: false, matchReport: 'nie' }));
  }, raw);
  await page.reload();
  await page.click('text=Spiel laden');
  await page.click('.card:has(button:has-text("Löschen")) button:has-text("Laden") >> nth=0');
  await page.waitForTimeout(1500);
  for (let i = 0; i < 3 && await page.locator('.bf-continue').count(); i++) { await page.locator('.bf-continue').click(); await page.waitForTimeout(200); }
  for (let k = 0; k < 6 && await page.locator('.modal-overlay, .bm-root, .bud-root').count(); k++) {
    const x = page.locator('.modal-close, button:has-text("Schließen"), button:has-text("Bestätigen"), button:has-text("OK"), button:has-text("Weiter")').first();
    if (await x.isVisible().catch(() => false)) await x.click().catch(() => {}); else break;
    await page.waitForTimeout(250);
  }
  return page;
}
const nav = async (page, main, sub) => {
  await page.locator(`.hd-nav-item:has-text("${main}")`).first().click();
  await page.waitForTimeout(250);
  if (sub) { await page.locator(`.tn-sub-item:has-text("${sub}")`).first().click(); await page.waitForTimeout(500); }
};

/** Größen der festen Teile + Überläufe. */
async function measure(page) {
  return page.evaluate(() => {
    const box = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; };
    const sizes = Object.fromEntries(['.vt-root', '.vt-left', '.vt-mid', '.vt-side', '.vt-poscard', '.vt-tablecard', '.vt-rows', '.vt-moodcard', '.vt-logcard', '.vt-impact', '.vt-foot', '.vt-hint', '.vt-notice', '.vt-sheet'].map((s) => [s, box(s)]));
    const over = [];
    for (const el of document.querySelectorAll('.vt-kv > span, .vt-lab, .vt-title, .vt-thead > span, .vt-chip, .vt-actions button, .vt-pos-num > b, .vt-step-l, .vt-pill')) {
      if (el.scrollWidth > el.clientWidth + 2) over.push(`${el.className || el.tagName}: „${el.textContent.slice(0, 30)}“ +${el.scrollWidth - el.clientWidth}px`);
    }
    const root = document.querySelector('.vt-root')?.getBoundingClientRect();
    if (root && (root.right > innerWidth + 1 || root.bottom > innerHeight + 1)) over.push('Bildschirm ragt aus dem Fenster');
    // Karten dürfen nicht über die Spalte hinausragen, Knöpfe nicht aus dem Fuß.
    for (const s of ['.vt-left', '.vt-mid', '.vt-side']) {
      const col = document.querySelector(s); if (!col) continue;
      const cr = col.getBoundingClientRect();
      for (const c of col.children) { const r = c.getBoundingClientRect(); if (r.bottom > cr.bottom + 1.5 || r.right > cr.right + 1.5) over.push(`${s}: Karte ragt hinaus`); }
    }
    const foot = document.querySelector('.vt-foot')?.getBoundingClientRect();
    for (const b of document.querySelectorAll('.vt-actions button')) { const r = b.getBoundingClientRect(); if (foot && r.left < foot.left - 1) over.push('Knopf ragt links aus dem Fuß'); }
    return { sizes, over };
  });
}
let base = null;
async function shot(page, name, { fresh = false } = {}) {
  await page.waitForTimeout(700);
  const m = await measure(page);
  if (fresh || !base) base = m.sizes;
  const diff = Object.entries(m.sizes).filter(([k, v]) => base[k] && v && (Math.abs(v[0] - base[k][0]) > 1 || Math.abs(v[1] - base[k][1]) > 1)).map(([k, v]) => `${k} ${base[k].join('×')} → ${v.join('×')}`);
  const rep = [...new Set([...m.over, ...diff])];
  console.log(`${name}: ${rep.length ? rep.join('; ') : 'ok'}`);
  if (rep.length) errors.push(`${name}: ${rep.join('; ')}`);
  await page.screenshot({ path: `${outDir}/${tag}_${name}.png` });
}
const setRange = (loc, f) => loc.evaluate((el, frac) => {
  const v = Number(el.min) + (Number(el.max) - Number(el.min)) * frac;
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, String(v));
  el.dispatchEvent(new Event('input', { bubbles: true }));
}, f);
const outcome = (page) => page.locator('.vt-out').getAttribute('data-outcome').catch(() => null);
const closeTable = async (page) => { await page.keyboard.press('Escape'); await page.waitForTimeout(250); if (await page.locator('.vt-root').count()) errors.push('Esc schließt den Tisch nicht'); };

// ---------------------------------------------------------------- Spieler: Vertragsverlängerung
if (!only || only === 'renew') {
  const page = await open();
  await nav(page, 'Kader', 'Verträge');
  const pids = await page.locator('.dtable tbody tr[data-pid]').evaluateAll((rows) => rows.map((r) => r.getAttribute('data-pid')));
  let n = 0;
  for (const pid of pids.slice(0, 10)) {
    await page.evaluate((id) => window.dispatchEvent(new CustomEvent('fm:contract-screen', { detail: { kind: 'renew', pid: id } })), pid);
    await page.waitForSelector('.vt-root', { timeout: 5000 });
    await page.waitForTimeout(300);
    if (!(await page.locator('.vt-table').count())) { await page.keyboard.press('Escape'); await page.waitForTimeout(200); continue; }
    n++;
    if (n === 1) {
      await shot(page, 'spieler_1_start', { fresh: true });
      await page.locator('.vt-row[data-key="signing"]').hover();
      await shot(page, 'spieler_2_hinweis');
      await page.locator('.vt-send').click();
      await shot(page, 'spieler_3_runde1');
      await page.locator('.vt-row[data-key="wage"] .vt-lockbtn').click();
      await shot(page, 'spieler_4_gesperrt');
      await page.locator('.vt-row[data-key="wage"] .vt-lockbtn').click();
      await page.locator('button:has-text("Forderung übernehmen")').click();
      await page.locator('.vt-send').click();
      await shot(page, 'spieler_5_einigung');
      if (await outcome(page) !== 'agreed') errors.push('Spieler: Forderung übernommen, aber keine Einigung');
      await closeTable(page);
    } else {
      // Gescheitert: dreiste Angebote, bis er abbricht.
      for (let k = 0; k < 8 && await page.locator('.vt-table').count(); k++) {
        await setRange(page.locator('.vt-row[data-key="wage"] input[type=range]'), 0);
        await page.locator('.vt-send').click();
        await page.waitForTimeout(200);
      }
      await shot(page, 'spieler_6_gescheitert');
      if (await outcome(page) !== 'failed') errors.push('Spieler: dreiste Angebote, aber kein Abbruch');
      await closeTable(page);
      break;
    }
  }
  if (n < 2) errors.push(`Spieler: nur ${n} verhandlungsbereit`);
  await page.close();
}

// ---------------------------------------------------------------- Transfer: Verein → Spieler → Abschluss
if (!only || only === 'transfer') {
  const page = await open();
  await nav(page, 'Transfers', 'Transfermarkt');
  const rows = page.locator('.app-main tr[data-pid], .app-main .rl-row[data-pid]');
  let done = false, failedShot = false;
  for (let i = 1; i < Math.min(14, await rows.count()) && !(done && failedShot); i++) {
    await rows.nth(i).click({ button: 'right' });
    const item = page.locator('.pcm-item:has-text("Transferverhandlung")').first();
    if (!(await item.count())) { await page.keyboard.press('Escape'); continue; }
    await item.click();
    await page.waitForTimeout(500);
    if (!(await page.locator('.vt-root[data-kind="club"] .vt-table').count())) { await page.keyboard.press('Escape'); await page.waitForTimeout(150); continue; }
    if (!done) {
      await shot(page, 'verein_1_start', { fresh: true });
      await page.locator('.vt-row[data-key="sellOn"]').hover();
      await shot(page, 'verein_2_hinweis');
      await page.locator('.vt-send').click();
      await shot(page, 'verein_3_runde1');
      if (!(await page.locator('button:has-text("Gegenvorschlag übernehmen")').count())) { await closeTable(page); continue; }
      await page.locator('.vt-row[data-key="fee"] .vt-lockbtn').click();
      await page.locator('.vt-send').click();
      await shot(page, 'verein_4_abloese_fest');
      if (await page.locator('button:has-text("Gegenvorschlag übernehmen")').count()) {
        await page.locator('button:has-text("Gegenvorschlag übernehmen")').click();
        await page.locator('.vt-send').click();
      }
      await shot(page, 'verein_5_einigung');
      if (await outcome(page) !== 'agreed') { errors.push('Verein: Gegenvorschlag übernommen, aber keine Einigung'); await closeTable(page); continue; }
      await page.locator('button:has-text("Weiter zum Spielergespräch")').click();
      await page.waitForTimeout(400);
      if (!(await page.locator('.vt-root[data-kind="player"] .vt-table').count())) { errors.push('Transfer: kein Spielergespräch nach der Einigung'); await closeTable(page); continue; }
      await shot(page, 'transfer_6_spieler_start', { fresh: true });
      await page.locator('.vt-send').click();
      await shot(page, 'transfer_7_spieler_runde1');
      if (await page.locator('button:has-text("Forderung übernehmen")').count()) {
        await page.locator('button:has-text("Forderung übernehmen")').click();
        await page.locator('.vt-send').click();
      }
      await shot(page, 'transfer_8_abschluss');
      if (await outcome(page) !== 'agreed') errors.push('Transfer: Forderung des Spielers übernommen, aber keine Einigung');
      done = true;
      await closeTable(page);
    } else {
      // Gescheitert: dreiste Angebote, bis der Verein abbricht.
      for (let k = 0; k < 8 && await page.locator('.vt-table').count(); k++) {
        await setRange(page.locator('.vt-row[data-key="fee"] input[type=range]'), 0);
        await page.locator('.vt-send').click();
        await page.waitForTimeout(200);
      }
      await shot(page, 'verein_9_gescheitert');
      if (await outcome(page) !== 'failed') errors.push('Verein: dreiste Angebote, aber kein Abbruch');
      failedShot = true;
      await closeTable(page);
    }
  }
  if (!done) errors.push('Transfer: kein Gespräch bis zum Abschluss gekommen');
  await page.close();
}

// ---------------------------------------------------------------- Mitarbeiter: Einstellung
if (!only || only === 'staff') {
  const page = await open();
  await nav(page, 'Training', 'Trainerteam');
  const btns = page.locator('.sf-table tbody tr button:has-text("Verhandeln")');
  let agreed = false, failed = false;
  for (let i = 0; i < Math.min(6, await btns.count()) && !(agreed && failed); i++) {
    await page.locator('.sf-table tbody tr button:has-text("Verhandeln")').nth(agreed ? 0 : i).click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(500);
    if (!(await page.locator('.vt-root[data-kind="staff"] .vt-table').count())) { if (await page.locator('.vt-root').count()) { await shot(page, `mitarbeiter_0_gesperrt_${i}`, { fresh: true }); await closeTable(page); } continue; }
    if (!agreed) {
      await shot(page, 'mitarbeiter_1_start', { fresh: true });
      await page.locator('.vt-row[data-key="severance"]').hover();
      await shot(page, 'mitarbeiter_2_hinweis');
      await page.locator('.vt-send').click();
      await shot(page, 'mitarbeiter_3_runde1');
      if (await page.locator('button:has-text("Forderung übernehmen")').count()) {
        await page.locator('button:has-text("Forderung übernehmen")').click();
        await page.locator('.vt-send').click();
      }
      await shot(page, 'mitarbeiter_4_einigung');
      if (await outcome(page) !== 'agreed') errors.push('Mitarbeiter: Forderung übernommen, aber keine Einigung');
      agreed = true;
      await closeTable(page);
    } else {
      for (let k = 0; k < 8 && await page.locator('.vt-table').count(); k++) {
        await setRange(page.locator('.vt-row[data-key="wage"] input[type=range]'), 0);
        await page.locator('.vt-send').click();
        await page.waitForTimeout(200);
      }
      await shot(page, 'mitarbeiter_5_gescheitert');
      if (await outcome(page) !== 'failed') errors.push('Mitarbeiter: dreiste Angebote, aber kein Abbruch');
      failed = true;
      await closeTable(page);
    }
  }
  if (!agreed) errors.push('Mitarbeiter: kein Gespräch bis zur Einigung gekommen');
  await page.screenshot({ path: `${outDir}/${tag}_mitarbeiter_6_seite_danach.png` });
  await page.close();
}

// ---------------------------------------------------------------- Sponsor: Angebot aus Finanzen › Sponsoring
if (!only || only === 'sponsor') {
  const page = await browser.newPage({ viewport: { width: vw, height: vh } });
  page.on('pageerror', (e) => errors.push(`JS-Fehler: ${e.message}`));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await startNewGame(page);
  await nav(page, 'Finanzen', 'Sponsoring');
  const talk = async (n) => {
    await page.locator('.sp3-otable tbody tr button:has-text("Verhandeln")').nth(n).click({ timeout: 3000 });
    await page.waitForSelector('.vt-root[data-kind="sponsor"]', { timeout: 4000 });
  };
  await talk(0);
  await shot(page, 'sponsor_1_start', { fresh: true });
  const clause = page.locator('.vt-row[data-key^="c"]').first();
  if (await clause.count()) { await clause.hover(); await shot(page, 'sponsor_2_hinweis'); }
  await setRange(page.locator('.vt-row[data-key="value"] input[type=range]'), 1);
  await page.locator('.vt-row[data-key="years"] .vt-lockbtn').click();
  await page.locator('.vt-send').click();
  await shot(page, 'sponsor_3_runde1');
  if (await page.locator('.vt-table').count()) {
    await page.locator('button:has-text("Angebot übernehmen")').click();
    await page.locator('.vt-send').click();
  }
  await shot(page, 'sponsor_4_einigung');
  if (await outcome(page) !== 'agreed') errors.push('Sponsor: Angebot übernommen, aber keine Einigung');
  await closeTable(page);
  await page.screenshot({ path: `${outDir}/${tag}_sponsor_5_seite_danach.png` });
  // Zweites Angebot: dreiste Forderungen bis zum Rückzug.
  if (await page.locator('.sp3-otable tbody tr button:has-text("Verhandeln")').count()) {
    await talk(0);
    for (let k = 0; k < 8 && await page.locator('.vt-table').count(); k++) {
      await setRange(page.locator('.vt-row[data-key="value"] input[type=range]'), 1);
      await page.locator('.vt-send').click();
      await page.waitForTimeout(200);
    }
    await shot(page, 'sponsor_6_gescheitert');
    if (await outcome(page) !== 'failed') errors.push('Sponsor: dreiste Forderungen, aber kein Abbruch');
    await closeTable(page);
  } else errors.push('Sponsor: kein zweites Angebot');
  await page.close();
}

await browser.close();
server.close();
if (errors.length) { console.error('FEHLER:\n' + errors.join('\n')); process.exit(1); }
console.log(`OK – Screenshots in ${outDir}`);
