// Gemeinsame Helfer für Fenster-Prüfungen (tests/popup-size.mjs, tests/season-walk.mjs).
// Fenster haben eine feste Größe (Wunsch Pascal): Reiter, Auswahl, Häkchen, Regler und
// Hover dürfen Breite/Höhe/Lage des Fensterrahmens nicht ändern (Toleranz 1 px).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.txt': 'text/plain' };

/** Kleiner Server für dist/. */
export function serveDist() {
  const server = createServer(async (req, res) => {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (path.endsWith('/')) path += 'index.html';
    let body = null;
    try { body = await readFile(join('dist', path)); } catch { /* fehlt */ }
    try {
      if (body) res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(body);
      else res.writeHead(404).end();
    } catch { /* Verbindung schon zu */ }
  }).listen(0);
  return { server, url: () => `http://127.0.0.1:${server.address().port}/` };
}

/** Spielstand (Speicherformat) in den localStorage legen und über „Spiel laden“ öffnen. */
export async function loadSave(page, url, file) {
  const raw = await readFile(file, 'utf8');
  await page.goto(url);
  await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
  await page.reload();
  await page.click('text=Spiel laden');
  await page.click('button:has-text("Laden") >> nth=0');
  await page.waitForTimeout(1200);
}

/** Rahmen-Selektoren: das jeweils oberste sichtbare Fenster. Reihenfolge = Vorrang. */
export const FRAME_SEL = [
  '.pcm', '.itip-pop', '.sv-pop', '.ms-dialog', '.tm-cs',
  '.ptk-book', '.ps-panel', '.tw-panel', '.si-window', '.rb2-panel', '.gb-stage', '.cr-root .cr-card',
  '.modal', '.dr-root', '.pm-root', '.cr-root', '.gb-root', '.reveal-overlay > *',
];

/** Rechteck des Elements (gerundet) oder null. */
export async function rectOf(page, sel) {
  return page.evaluate((s) => {
    const els = [...document.querySelectorAll(s)].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
    const el = els[els.length - 1];
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
  }, sel);
}

/** Welche Fenster sind gerade offen? (Klassen der sichtbaren Rahmen) */
export async function openWindows(page) {
  return page.evaluate((sels) => {
    const out = [];
    for (const s of sels) {
      for (const e of document.querySelectorAll(s)) {
        const r = e.getBoundingClientRect();
        if (r.width > 0 && r.height > 0 && !out.some((o) => o.el.contains(e) || e.contains(o.el))) out.push({ el: e, s });
      }
    }
    return out.map((o) => o.s + ' [' + (o.el.getAttribute('aria-label') || o.el.className.toString().split(' ').slice(0, 3).join('.')) + ']');
  }, ['.modal', '.ptk-book', '.ps-panel', '.tw-panel', '.si-root', '.rb2-overlay', '.gb-root', '.cr-root', '.dr-root', '.pm-root', '.tm-root, .ms-root', '.reveal-overlay']);
}

const diff = (a, b) => !a || !b || Math.abs(a.w - b.w) > 1 || Math.abs(a.h - b.h) > 1 || Math.abs(a.x - b.x) > 1 || Math.abs(a.y - b.y) > 1;
const fmt = (r) => (r ? `${r.w}×${r.h} @${r.x},${r.y}` : 'weg');

/** Knöpfe, die das Fenster verlassen oder etwas Endgültiges auslösen – nicht anklicken. */
const DANGER = /schlie|abbrech|bestätig|unterschreib|annehm|ablehn|kaufen|verkauf|entlass|^ok$|fertig|weiter|übernehm|speicher|laden|lösch|zurück|verlass|start|simulier|textmodus|auflös|kündig|anbiet|send|abschick|buch|storn|einstell|ende|überspring|springen|archiv|alle jahrg|aufstellung|verein|profil|vertrag|verhand|transferliste|gespräch|neu|zufall|wechsel|bestät|go|los|anpfiff|planen|bericht|spieler vor|nächst|vorig|^‹|^›|^<|^>|×|✕/i;

/** Interaktive Ziele im Fenster (Reiter, Chips, Segmente, Häkchen, Regler, Auswahllisten, Zeilen). */
const TARGETS = [
  '[role=tab]', '.tab', '[class$="-tab"]', '[class*="-tab "]', '.dchip', '.seg-btn', '.seg3 > button', '.chip', '[class$="-seg"] > button', '[class*="-seg "] > button',
  'input[type=checkbox]', 'input[type=range]', 'select', '.sel3', '.toggle',
  'tr.clickable', '.rl-row.clickable', '[class$="-row"][role=button]', 'button.ft-card', '.pp-preset', '.cp-step',
].join(', ');

/**
 * Fenster prüfen: Größe messen, Ziele nacheinander bedienen, nach jedem Schritt neu messen.
 * `open` öffnet das Fenster (wird nach versehentlichem Schließen erneut aufgerufen).
 * Rückgabe: { name, base, issues: [..] }.
 */
export async function probeWindow(page, name, frameSel, open, opts = {}) {
  const issues = [];
  const max = opts.max ?? 40;
  if (open) await open();
  await page.waitForTimeout(opts.settle ?? 500);
  const base = await rectOf(page, frameSel);
  if (!base) return { name, base: null, issues: ['nicht geöffnet'] };
  const check = async (what) => {
    await page.waitForTimeout(140);
    const r = await rectOf(page, frameSel);
    if (r && diff(base, r)) { issues.push(`${what}: ${fmt(base)} → ${fmt(r)}`); return r; }
    return r;
  };
  const root = () => page.locator(frameSel).last();
  // Eigene Schritte zuerst
  for (const [label, fn] of opts.steps ?? []) {
    try { await fn(); await check(label); } catch (e) { issues.push(`${label}: Fehler ${e.message.split('\n')[0]}`); }
  }
  let reopen = 0;
  let acted = 0;
  for (let i = 0; i < max; i++) {
    try {
      // Ziel i im Fenster suchen und direkt im Browser bedienen (schnell, ohne Wartezeiten).
      const before = await page.locator('.modal-overlay, .pcm-layer').count();
      const info = await page.evaluate(({ fs, ts, i, danger, safe }) => {
        const frames = [...document.querySelectorAll(fs)].filter((e) => e.getBoundingClientRect().width > 0);
        const fr = frames[frames.length - 1];
        if (!fr) return { end: true };
        const all = [...fr.querySelectorAll(ts)];
        if (i >= all.length) return { end: true };
        const e = all[i];
        const r = e.getBoundingClientRect();
        const txt = (e.innerText || e.getAttribute('aria-label') || e.className || '').toString().trim().replace(/\s+/g, ' ').slice(0, 30);
        const res = { tag: e.tagName, type: e.getAttribute('type'), txt };
        if (r.width === 0 || r.height === 0 || e.disabled) return { ...res, skip: true };
        const isSel3 = e.classList.contains('sel3'); // eigene Auswahlliste (ui/Select.tsx)
        if (e.tagName !== 'INPUT' && e.tagName !== 'SELECT' && !isSel3 && new RegExp(danger, 'i').test(txt)) return { ...res, skip: true };
        // Schalter, die Einstellungen ändern („nicht mehr zeigen“ …), nie bedienen; im sicheren Modus gar keine Eingaben.
        const lbl = (e.closest('label')?.innerText || e.parentElement?.innerText || '').toString();
        if ((e.tagName === 'INPUT' || e.classList.contains('toggle')) && /nicht (mehr|wieder)|anzeigen|zeigen|automatisch|einzeln/i.test(lbl)) return { ...res, skip: true };
        if (safe && (e.tagName === 'INPUT' || e.tagName === 'SELECT' || isSel3 || e.classList.contains('toggle'))) return { ...res, skip: true };
        const fire = (el, v) => {
          const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
          Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
          el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
        };
        if (e.tagName === 'SELECT') { if (e.options.length > 1) fire(e, e.options[e.options.length - 1].value); }
        else if (isSel3) {
          // Öffnen (React rendert die Liste beim Klick synchron), letzten freien Eintrag wählen
          e.click();
          const opts = [...document.querySelectorAll('.sel3-pop [role=option]:not([aria-disabled])')];
          if (opts.length) opts[opts.length - 1].click(); else e.click();
        }
        else if (e.type === 'range') fire(e, e.max || '100');
        else { e.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })); e.click(); }
        return res;
      }, { fs: frameSel, ts: TARGETS, i, danger: DANGER.source, safe: !!opts.safe });
      if (info.end) break;
      if (info.skip) continue;
      const label = `${info.tag.toLowerCase()}${info.type ? ':' + info.type : ''} „${info.txt}“`;
      acted++;
      const r = await check(label);
      // Neues Fenster darüber? (Profil aus einer Zeile o. Ä.) → schließen
      const after = await page.locator('.modal-overlay, .pcm-layer').count();
      if (after > before) { await page.keyboard.press('Escape'); await page.waitForTimeout(150); if (await page.locator('.modal-overlay, .pcm-layer').count() > before) await page.mouse.click(3, 3); await page.waitForTimeout(150); }
      if (!r || !(await rectOf(page, frameSel))) {
        if (!open || ++reopen > 3) { issues.push(`${label}: Fenster geschlossen – Prüfung beendet`); break; }
        await open(); await page.waitForTimeout(400);
      }
    } catch (e) { /* Ziel nicht bedienbar – weiter */ }
  }
  // Hover über die ersten Zeilen/Listenpunkte
  try {
    const rows = root().locator('tr, li, .rl-row');
    const n = Math.min(await rows.count(), 6);
    for (let i = 0; i < n; i++) { await rows.nth(i).hover({ timeout: 400, force: true }).catch(() => {}); }
    await check('Hover über Zeilen');
  } catch { /* egal */ }
  return { name, base, issues, acted };
}

/** Alle offenen Fenster/Overlays schließen (Escape, Schließen-Knöpfe). */
export async function closeAll(page) {
  for (let k = 0; k < 8; k++) {
    const n = await page.locator('.modal-overlay, .pcm-layer, .tw-panel, .si-root, .gb-root, .cr-root, .dr-root, .rb2-overlay').count();
    if (!n) return;
    await page.keyboard.press('Escape'); await page.waitForTimeout(150);
    const x = page.locator('.modal-close, .pp2-close, .ptk-x, .sp3-x, button:has-text("Schließen"), .bf-continue, .tw-foot button:has-text("OK"), .aw-close').last();
    if (await x.isVisible().catch(() => false)) await x.click({ timeout: 800 }).catch(() => {});
    else await page.mouse.click(3, 3);
    await page.waitForTimeout(200);
  }
}
