// Prüfungen für den Seiten-Check (tests/audit.mjs, Prüfliste docs/checklist.md).
// `pageChecks` läuft im Browser (page.evaluate) und liefert Funde { k: Art, d: Beschreibung }.
// `scanColors` liest die CSS-Dateien und meldet feste Farben außerhalb der Token-Dateien.
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

/** Arten mit Kurztitel; `hard` = lässt den Test scheitern. */
export const KINDS = {
  js: { t: 'JS-Fehler / Konsole', hard: true },
  net: { t: 'Bild/Datei fehlt (404)', hard: true },
  text: { t: 'undefined/NaN/[object im Text', hard: true },
  scroll: { t: 'Seite scrollt / abgeschnitten', hard: true },
  select: { t: 'Natives <select>', hard: true },
  emoji: { t: 'Emoji im Text', hard: true },
  box: { t: 'Box läuft über / wächst', hard: false },
  clip: { t: 'Inhalt waagerecht abgeschnitten', hard: false },
  hscroll: { t: 'Waagerechte Bildlaufleiste', hard: false },
  squeeze: { t: 'Tabelle zusammengeschoben (Spalten-Wichtigkeit data-pri ergänzen)', hard: false },
  ellipsis: { t: 'Text mit … gekürzt', hard: false },
  empty: { t: 'Leere Box ohne Leertext', hard: false },
  outside: { t: 'Element außerhalb des Fensters', hard: false },
  overlap: { t: 'Boxen überlappen', hard: false },
  font: { t: 'Schrift < 11 px (effektiv)', hard: false },
  color: { t: 'Textfarbe ohne Token (berechnet)', hard: false },
  nav: { t: 'Seite/Fenster nicht erreichbar', hard: true },
  menu: { t: 'Menü passt nicht (Einträge verdeckt)', hard: true },
};

/** Läuft im Browser. `o.minFont` = kleinste erlaubte Schrift in Bildschirm-Pixeln. */
export function pageChecks(o) {
  const out = [];
  const add = (k, d) => out.push({ k, d: String(d).replace(/\s+/g, ' ').slice(0, 160) });
  const cls = (el) => {
    if (!el || !el.tagName) return '?';
    const c = (typeof el.className === 'string' ? el.className : el.className?.baseVal || '').trim().split(/\s+/).filter(Boolean).slice(0, 2).join('.');
    return el.tagName.toLowerCase() + (c ? '.' + c : '');
  };
  const path = (el) => { const a = []; for (let e = el, i = 0; e && i < 3 && e !== document.body; e = e.parentElement, i++) a.unshift(cls(e)); return a.join(' > '); };
  const csOf = new Map();
  const cs = (el) => { let s = csOf.get(el); if (!s) { s = getComputedStyle(el); csOf.set(el, s); } return s; };
  const vis = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    const s = cs(el);
    return s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0.02;
  };
  const W = innerWidth, H = innerHeight;
  o.autoTitles = document.documentElement.dataset.ellipsisTitles === '1';
  const inner = document.querySelector('.display-inner');
  const content = document.querySelector('.display-content');
  const frame = inner ? inner.getBoundingClientRect() : { left: 0, top: 0, right: W, bottom: H };
  // Effektiver Maßstab: Bildschirm-Pixel je CSS-Pixel (Einpassen × zoom).
  const fit = inner ? inner.getBoundingClientRect().width / inner.offsetWidth : 1;
  const zoom = content ? Number(cs(content).zoom) || 1 : 1;
  const eff = fit * zoom;

  // ---- Texte: Platzhalter, Emojis, Schriftgröße, Farbe
  const tokenColors = new Set(o.tokens ?? []);
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let nText = 0, nSmall = 0, minSeen = 99;
  const smallBy = new Map(), colorBy = new Map();
  const seenEl = new Set();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const t = n.textContent;
    if (!t || !t.trim()) continue;
    const el = n.parentElement;
    if (!el || el.closest('script, style, noscript, .audit-skip')) continue;
    if (!vis(el)) continue;
    const m = t.match(/\bundefined\b|\bNaN\b|\[object [A-Za-z]+\]|(?<![Zz]u[ -])\bnull\b|-?\bInfinity\b/);
    if (m) add('text', `„${m[0]}“ in ${path(el)}: ${t.trim().slice(0, 60)}`);
    if (/\p{Emoji_Presentation}|️/u.test(t)) add('emoji', `${path(el)}: ${t.trim().slice(0, 40)}`);
    if (seenEl.has(el)) continue;
    seenEl.add(el);
    if (el.closest('svg')) continue;
    nText++;
    const px = parseFloat(cs(el).fontSize) * eff;
    if (px < minSeen) minSeen = px;
    if (px < o.minFont - 0.05) { nSmall++; const k = cls(el); smallBy.set(k, Math.min(smallBy.get(k) ?? 99, px)); }
    if (tokenColors.size) {
      const c = cs(el).color;
      if (/^rgba?\(/.test(c) && !tokenColors.has(c) && !/^rgba\(\d+, \d+, \d+, 0\)$/.test(c)) colorBy.set(cls(el) + ' ' + c, (colorBy.get(cls(el) + ' ' + c) ?? 0) + 1);
    }
  }
  if (nSmall && o.minFont) {
    const top = [...smallBy.entries()].sort((a, b) => a[1] - b[1]).slice(0, 4).map(([k, v]) => `${k} ${v.toFixed(1)}`).join(', ');
    add('font', `${nSmall}/${nText} Textstellen < ${o.minFont} px (Maßstab ${eff.toFixed(2)}, kleinste ${minSeen.toFixed(1)} px): ${top}`);
  }
  for (const [k, v] of [...colorBy.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)) add('color', `${k} (${v}×)`);

  // ---- Seite scrollt / Hauptbereich abgeschnitten
  const se = document.scrollingElement;
  if (se && se.scrollHeight > se.clientHeight + 1) add('scroll', `Dokument ${se.scrollHeight} > ${se.clientHeight}`);
  if (inner && inner.scrollHeight > inner.clientHeight + 1) add('scroll', `Rahmen .display-inner ${inner.scrollHeight} > ${inner.clientHeight}`);
  if (inner && inner.scrollWidth > inner.clientWidth + 1) add('scroll', `Rahmen .display-inner waagerecht ${inner.scrollWidth} > ${inner.clientWidth}`);
  const main = document.querySelector('.app-main');
  if (main && vis(main)) {
    const ov = cs(main).overflowY;
    if (main.scrollHeight > main.clientHeight + 2) add('scroll', `.app-main ${ov === 'hidden' || ov === 'clip' ? 'abgeschnitten' : 'scrollt'} ${main.scrollHeight} > ${main.clientHeight} (${cls(main.firstElementChild)})`);
  }

  // ---- Kopfleiste und Untermenü: alle Einträge sichtbar
  for (const el of document.querySelectorAll('.hd-nav, .tn-sub, .sub3-tabs')) {
    if (vis(el) && el.scrollWidth > el.clientWidth + 2) add('menu', `${cls(el)} ${el.scrollWidth} > ${el.clientWidth}`);
  }

  // ---- Boxen: überlaufen, leer, überlappen, ragen hinaus
  const boxes = [...document.querySelectorAll('.dbox')].filter(vis);
  const mainR = main?.getBoundingClientRect();
  for (const b of boxes) {
    const title = b.querySelector('.dxh-title')?.firstChild?.textContent?.trim() || cls(b);
    if (b.scrollHeight > b.clientHeight + 2) add('box', `Box „${title}“ Inhalt ${b.scrollHeight} > ${b.clientHeight}`);
    const r = b.getBoundingClientRect();
    if (mainR && !b.closest('.modal, .mx-body') && r.bottom > mainR.bottom + 2 * eff) add('box', `Box „${title}“ ragt ${Math.round((r.bottom - mainR.bottom) / eff)} px unter die Seite`);
    const body = b.querySelector('.dbox-body');
    if (body && !body.innerText.trim() && !body.querySelector('svg, img, canvas, input, button, .sel3, [style*="background-image"]')) add('empty', `Box „${title}“ ohne Inhalt/Leertext`);
  }
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      if (boxes[i].parentElement !== boxes[j].parentElement) continue;
      const a = boxes[i].getBoundingClientRect(), c = boxes[j].getBoundingClientRect();
      const w = Math.min(a.right, c.right) - Math.max(a.left, c.left), h = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top);
      if (w > 2 && h > 2) add('overlap', `„${boxes[i].querySelector('.dxh-title')?.firstChild?.textContent?.trim()}“ × „${boxes[j].querySelector('.dxh-title')?.firstChild?.textContent?.trim()}“ (${Math.round(w / eff)}×${Math.round(h / eff)} px)`);
    }
  }

  // ---- Überlauf einzelner Elemente, abgeschnittener Text
  const scrolls = (s) => s === 'auto' || s === 'scroll';
  const titled = (el) => { for (let e = el, i = 0; e && i < 4; e = e.parentElement, i++) if (e.title || e.getAttribute?.('aria-label') || e.dataset?.tip) return true; return false; };
  const all = document.querySelectorAll('.app-shell *, .modal *, .display-content > * *');
  let clipN = 0, ellN = 0, hsN = 0;
  for (const el of all) {
    if (el instanceof SVGElement || el.tagName === 'IMG' || el.tagName === 'CANVAS') continue;
    const sw = el.scrollWidth, w = el.clientWidth;
    if (!w || sw <= w + 1) continue;
    if (!vis(el)) continue;
    const s = cs(el);
    if (s.textOverflow === 'ellipsis' && (s.overflowX === 'hidden' || s.overflowX === 'clip')) {
      // Mit ui/ellipsisTitle.ts bekommt jeder gekürzte Text beim Zeigen den vollen Text als title.
      if (sw > w + 2 && el.textContent.trim() && (o.autoTitles || !titled(el)) && ellN++ < 25) add('ellipsis', `${path(el)}: „${el.textContent.trim().slice(0, 40)}“`);
      continue;
    }
    if (el.matches('.hd-nav, .tn-sub, .sub3-tabs')) continue;
    if (scrolls(s.overflowX)) { if (sw > w + 3 && hsN++ < 15) add('hscroll', `${path(el)} ${Math.round(sw / 1)} > ${w}`); continue; }
    if ((s.overflowX === 'hidden' || s.overflowX === 'clip') && sw > w + 3 && el.textContent.trim() && !el.querySelector('svg, canvas') && clipN++ < 25) {
      // Nur melden, wenn ein Kind mit Text wirklich über den Rand hinausreicht.
      const r = el.getBoundingClientRect();
      const kid = [...el.querySelectorAll('*')].find((k) => { if (!k.childNodes.length || ![...k.childNodes].some((x) => x.nodeType === 3 && x.textContent.trim())) return false; const kr = k.getBoundingClientRect(); return kr.width > 0 && (kr.right > r.right + 2 || kr.left < r.left - 2); });
      if (kid) add('clip', `${path(el)}: „${kid.textContent.trim().slice(0, 40)}“ (${sw} > ${w})`);
    }
  }

  // ---- Tabellen, die ui/stableTables.ts nur noch durch Zusammenschieben einpassen konnte
  for (const t of document.querySelectorAll('table[data-fit="squeeze"]')) {
    if (!vis(t)) continue;
    const heads = [...(t.tHead?.rows[0]?.cells ?? [])].filter((c) => c.offsetWidth).map((c) => (c.querySelector('.th-short') ?? c).textContent.trim() || '·').join(' | ');
    add('squeeze', `${path(t)}: ${heads}`);
  }

  // ---- Fenster/Popover außerhalb des Fensters
  for (const el of document.querySelectorAll('.modal, .pc-float, .itip-pop, .pcm, .sel3-pop, .vt-root, .dbox, .app-header, .app-footer, [role=dialog]')) {
    if (!vis(el)) continue;
    const r = el.getBoundingClientRect();
    const lim = { l: Math.max(0, frame.left), t: Math.max(0, frame.top), r: Math.min(W, frame.right), b: Math.min(H, frame.bottom) };
    if (r.left < lim.l - 2 || r.top < lim.t - 2 || r.right > lim.r + 2 || r.bottom > lim.b + 2) add('outside', `${cls(el)} ${Math.round(r.left)},${Math.round(r.top)}–${Math.round(r.right)},${Math.round(r.bottom)} (Fenster ${Math.round(lim.r)}×${Math.round(lim.b)})`);
  }

  // ---- Native Auswahllisten, Bilder
  for (const s of document.querySelectorAll('select')) if (vis(s)) add('select', path(s));
  for (const img of document.querySelectorAll('img')) {
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src') && vis(img)) add('net', `Bild lädt nicht: ${img.getAttribute('src').slice(0, 80)}`);
  }
  return { out, eff };
}

/** Farben aller Tokens (berechnet, rgb-Form) – im Browser. */
export function tokenColors() {
  const names = new Set();
  for (const sh of document.styleSheets) {
    let rules; try { rules = sh.cssRules; } catch { continue; }
    for (const r of rules) {
      if (r.selectorText && /:root|\.app-shell|\[data-/.test(r.selectorText)) for (const p of r.style) if (p.startsWith('--')) names.add(p);
    }
  }
  const el = document.createElement('span');
  document.body.appendChild(el);
  const set = new Set();
  for (const n of names) {
    el.style.color = '';
    el.style.color = `var(${n})`;
    const c = getComputedStyle(el).color;
    if (c) set.add(c);
  }
  // Eigene Vereinsfarbe & Co. stehen inline an der Shell
  for (const e of document.querySelectorAll('[style*="--"]')) {
    for (const p of e.style) if (p.startsWith('--')) { el.style.color = `var(${p})`; set.add(getComputedStyle(el).color); }
  }
  el.remove();
  return [...set];
}

/** Feste Farben in den CSS-Dateien außerhalb der Token-Blöcke. */
export async function scanColors(dir = 'src/styles') {
  const TOKEN_FILES = new Set(['00-base.css', '25-theme.css', '30-theme.css']);
  const res = [];
  for (const f of (await readdir(dir)).filter((x) => x.endsWith('.css')).sort()) {
    if (TOKEN_FILES.has(f)) continue;
    const src = (await readFile(join(dir, f), 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '');
    let n = 0;
    // Blöcke, die nur Tokens setzen (--x: …), zählen nicht.
    for (const m of src.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      for (const decl of m[2].split(';')) {
        const [prop, ...v] = decl.split(':');
        if (!prop || prop.trim().startsWith('--')) continue;
        const val = v.join(':');
        const lits = val.replace(/var\([^()]*(\([^()]*\))*[^()]*\)/g, '').match(/#[0-9a-fA-F]{3,8}\b|rgba?\(\s*\d+[^)]*\)|hsla?\([^)]*\)/g);
        if (lits) n += lits.filter((x) => !/^rgba?\(\s*0,\s*0,\s*0,\s*0\s*\)$/.test(x)).length;
      }
    }
    if (n) res.push({ f, n });
  }
  return res;
}
