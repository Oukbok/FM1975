// =============================================================================
// <Select> — eigene Auswahlliste statt nativem <select> (Wunsch Pascal)
// =============================================================================
// Die geöffnete Liste eines nativen <select> zeichnet der Browser selbst: sie
// ignoriert UI-Skalierung, Schrift und Tokens. Diese Liste liegt per Portal an
// <body>, wächst über `ui/floating.ts` mit der UI-Skalierung, nutzt Barlow und
// die Auswahl-Tokens (`--sel-*`).
//
// Bedienung: Maus/Touch (Tippen öffnet, Tippen wählt), Tastatur am Knopf
// (↑/↓/Pos1/Ende/Bild↑/Bild↓ bewegen, Enter/Leertaste wählt, Esc/Tab schließt,
// Buchstaben springen zum ersten passenden Eintrag). Gruppen (Überschrift),
// Trenner und gesperrte Einträge. Die Liste scrollt intern und springt beim
// Öffnen zur gewählten Zeile.
//
// Einträge entweder über `options` oder wie beim nativen Element als Kinder
// <option value>…</option> / <optgroup label>…</optgroup> (Umstellung ohne
// Umbau der Aufrufer). `onChange` bekommt den Wert als String.
//
// Für Oberflächentests: Knopf `.sel3` mit `data-value`; offene Liste
// `.sel3-pop`, Einträge `[role=option][data-value]` (Helfer tests/select3.mjs).
// =============================================================================
import {
  Children, Fragment, isValidElement, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState,
  type CSSProperties, type KeyboardEvent as RKeyboardEvent, type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import Icon from '../components/Icon';
import { uiScale } from './floating';

export interface SelectOption {
  value: string | number;
  label: ReactNode;
  /** Text für die Tipp-Suche (Standard: label, falls Text). */
  text?: string;
  disabled?: boolean;
  /** Überschrift einer Gruppe (vor diesem Eintrag). */
  group?: string;
  /** Trennlinie vor diesem Eintrag. */
  divider?: boolean;
}

type Row = { kind: 'opt'; o: SelectOption; i: number } | { kind: 'group'; label: string } | { kind: 'div' };

function textOf(n: ReactNode): string {
  if (n == null || typeof n === 'boolean') return '';
  if (typeof n === 'string' || typeof n === 'number') return String(n);
  if (Array.isArray(n)) return n.map(textOf).join('');
  if (isValidElement(n)) return textOf((n.props as { children?: ReactNode }).children);
  return '';
}

/** <option>/<optgroup>-Kinder in Einträge übersetzen (Fragmente/Arrays/Bedingungen erlaubt). */
function optionsFromChildren(children: ReactNode, group?: string, out: SelectOption[] = []): SelectOption[] {
  let first = true;
  Children.forEach(children, (c) => {
    if (!isValidElement(c)) return;
    const props = c.props as { value?: string | number; children?: ReactNode; disabled?: boolean; label?: string };
    if (c.type === Fragment) { optionsFromChildren(props.children, group, out); return; }
    if (c.type === 'optgroup') {
      const before = out.length;
      optionsFromChildren(props.children, props.label ?? '', out);
      if (out.length > before) out[before] = { ...out[before], group: props.label ?? '' };
      return;
    }
    if (c.type === 'option') {
      const label = props.children;
      const t = textOf(label);
      out.push({
        value: props.value ?? t, label, text: t, disabled: props.disabled,
        group: first && group !== undefined ? group : undefined,
      });
      first = false;
    }
  });
  return out;
}

const MAX_H = 340;   // Höhe der offenen Liste (UI-Pixel), danach Scroll
const ROW_H = 38;

export default function Select({
  value, onChange, options, children, className, style, disabled, title, placeholder,
  size = 'm', width, popWidth, align = 'left', ...rest
}: {
  value: string | number | undefined | null;
  onChange: (v: string) => void;
  options?: SelectOption[];
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
  title?: string;
  placeholder?: string;
  /** s = 32 px (in Tabellen/engen Köpfen), m = 40 px (Standard), l = 48 px. */
  size?: 's' | 'm' | 'l';
  /** Feste Breite des Knopfs (px oder CSS). Ohne Angabe: Breite aus CSS/Klasse. */
  width?: number | string;
  /** Breite der offenen Liste in UI-Pixeln (Standard: Knopfbreite, mind. 180). */
  popWidth?: number;
  align?: 'left' | 'right';
  'aria-label'?: string;
  'data-role'?: string;
  id?: string;
}) {
  const opts = useMemo(() => options ?? optionsFromChildren(children), [options, children]);
  const rows = useMemo(() => {
    const r: Row[] = [];
    opts.forEach((o, i) => {
      if (o.divider && r.length) r.push({ kind: 'div' });
      if (o.group) r.push({ kind: 'group', label: o.group });
      r.push({ kind: 'opt', o, i });
    });
    return r;
  }, [opts]);
  const selIdx = opts.findIndex((o) => String(o.value) === String(value ?? ''));
  const cur = selIdx >= 0 ? opts[selIdx] : undefined;

  const uid = useId();
  const btn = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [pos, setPos] = useState<{ left: number; top: number; w: number; s: number; up: boolean } | null>(null);
  const typed = useRef({ buf: '', t: 0 });

  const enabled = useCallback((i: number) => i >= 0 && i < opts.length && !opts[i].disabled, [opts]);
  const step = useCallback((from: number, dir: 1 | -1) => {
    for (let k = 1; k <= opts.length; k++) {
      const i = from + dir * k;
      if (i < 0 || i >= opts.length) break;
      if (enabled(i)) return i;
    }
    return from;
  }, [opts, enabled]);

  const close = useCallback((refocus = true) => {
    setOpen(false); setPos(null);
    if (refocus) btn.current?.focus();
  }, []);
  const openList = () => {
    if (disabled) return;
    setActive(selIdx >= 0 ? selIdx : step(-1, 1));
    setOpen(true);
  };
  const pick = (i: number) => {
    if (!enabled(i)) return;
    close();
    if (String(opts[i].value) !== String(value ?? '')) onChange(String(opts[i].value));
  };

  // Lage: unter dem Knopf, bei Platzmangel darüber; Größe folgt der UI-Skalierung
  useLayoutEffect(() => {
    if (!open || !btn.current) return;
    const s = uiScale();
    const r = btn.current.getBoundingClientRect();
    const w = Math.max(popWidth ?? r.width / s, 180);
    const h = Math.min(MAX_H, (pop.current?.scrollHeight ?? MAX_H)) * s;
    const vw = window.innerWidth, vh = window.innerHeight, gap = 8;
    let left = align === 'right' ? r.right - w * s : r.left;
    left = Math.max(gap, Math.min(vw - w * s - gap, left));
    let top = r.bottom + 4;
    let up = false;
    if (top + h > vh - gap && r.top - h - 4 > gap) { top = r.top - h - 4; up = true; }
    setPos((p) => (p && p.left === left && p.top === top && p.w === w && p.s === s ? p : { left, top, w, s, up }));
  }, [open, popWidth, align, rows.length]);

  // Beim Öffnen zur gewählten Zeile springen (mittig), danach aktive Zeile sichtbar halten
  const jumped = useRef(false);
  useEffect(() => { if (!open) jumped.current = false; }, [open]);
  useLayoutEffect(() => {
    if (!open || !pos || !list.current) return;
    const el = list.current.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    if (!el) return;
    const box = list.current;
    if (!jumped.current) {
      box.scrollTop = Math.max(0, el.offsetTop - box.clientHeight / 2 + el.offsetHeight / 2);
      jumped.current = true;
    } else if (el.offsetTop < box.scrollTop) box.scrollTop = el.offsetTop;
    else if (el.offsetTop + el.offsetHeight > box.scrollTop + box.clientHeight) box.scrollTop = el.offsetTop + el.offsetHeight - box.clientHeight;
  }, [open, pos, active]);

  // Schließen: Klick daneben, Scrollen außerhalb, Größenänderung
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (btn.current?.contains(t) || pop.current?.contains(t)) return;
      close(false);
    };
    const onScroll = (e: Event) => { if (!pop.current?.contains(e.target as Node)) close(false); };
    const onResize = () => close(false);
    window.addEventListener('pointerdown', onDown, true);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open, close]);

  const typeAhead = (ch: string) => {
    const now = Date.now();
    const t = typed.current;
    t.buf = now - t.t > 700 ? ch : t.buf + ch;
    t.t = now;
    const q = t.buf.toLocaleLowerCase('de');
    const start = open ? active : selIdx;
    const order = opts.map((_, k) => (Math.max(0, start) + (t.buf.length === 1 ? 1 : 0) + k) % opts.length);
    const hit = order.find((i) => enabled(i) && (opts[i].text ?? textOf(opts[i].label)).toLocaleLowerCase('de').trim().startsWith(q));
    if (hit === undefined) return;
    if (open) setActive(hit);
    else if (String(opts[hit].value) !== String(value ?? '')) onChange(String(opts[hit].value));
  };

  const onKey = (e: RKeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    const k = e.key;
    if (!open) {
      if (k === 'ArrowDown' || k === 'ArrowUp' || k === 'Enter' || k === ' ' || (k === 'ArrowDown' && e.altKey)) { e.preventDefault(); openList(); return; }
      if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); typeAhead(k); }
      return;
    }
    const page = Math.max(1, Math.floor(MAX_H / ROW_H) - 1);
    if (k === 'ArrowDown') { e.preventDefault(); setActive((a) => step(a, 1)); }
    else if (k === 'ArrowUp') { e.preventDefault(); setActive((a) => step(a, -1)); }
    else if (k === 'Home') { e.preventDefault(); setActive(step(-1, 1)); }
    else if (k === 'End') { e.preventDefault(); setActive(step(opts.length, -1)); }
    else if (k === 'PageDown') { e.preventDefault(); setActive((a) => { let x = a; for (let n = 0; n < page; n++) x = step(x, 1); return x; }); }
    else if (k === 'PageUp') { e.preventDefault(); setActive((a) => { let x = a; for (let n = 0; n < page; n++) x = step(x, -1); return x; }); }
    else if (k === 'Enter' || k === ' ') { e.preventDefault(); pick(active); }
    else if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
    else if (k === 'Tab') close(false);
    else if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); typeAhead(k); }
  };

  const listId = `${uid}-list`;
  const optId = (i: number) => `${uid}-o${i}`;
  const btnStyle: CSSProperties = { ...style, ...(width !== undefined ? { width, minWidth: width, maxWidth: width } : {}) };

  return (
    <>
      <button
        type="button"
        ref={btn}
        id={rest.id}
        className={`sel3 sel3-${size}${open ? ' open' : ''}${className ? ` ${className}` : ''}`}
        style={btnStyle}
        disabled={disabled}
        title={title}
        data-value={cur ? String(cur.value) : ''}
        data-role={rest['data-role']}
        aria-label={rest['aria-label']}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && active >= 0 ? optId(active) : undefined}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onKey}
      >
        <span className={`sel3-val${cur ? '' : ' ph'}`}>{cur ? cur.label : (placeholder ?? '–')}</span>
        <Icon name="navDown" size={16} className="sel3-chev" />
      </button>
      {open && createPortal(
        <div
          ref={pop}
          className={`sel3-pop${pos?.up ? ' up' : ''}`}
          style={{
            left: pos?.left ?? -9999, top: pos?.top ?? -9999, width: pos?.w ?? 200,
            transform: pos && pos.s !== 1 ? `scale(${pos.s})` : undefined,
            visibility: pos ? 'visible' : 'hidden',
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <div ref={list} className="sel3-list" role="listbox" id={listId} style={{ maxHeight: MAX_H }}>
            {rows.map((r, k) => {
              if (r.kind === 'div') return <div key={`d${k}`} className="sel3-div" role="separator" />;
              if (r.kind === 'group') return <div key={`g${k}`} className="sel3-group" role="presentation">{r.label}</div>;
              const { o, i } = r;
              const sel = i === selIdx;
              return (
                <div
                  key={`o${i}`}
                  id={optId(i)}
                  data-idx={i}
                  data-value={String(o.value)}
                  role="option"
                  aria-selected={sel}
                  aria-disabled={o.disabled || undefined}
                  className={`sel3-opt${sel ? ' sel' : ''}${i === active ? ' act' : ''}${o.disabled ? ' off' : ''}`}
                  onPointerEnter={() => { if (!o.disabled) setActive(i); }}
                  onClick={() => pick(i)}
                >
                  <span className="sel3-opt-lbl">{o.label}</span>
                  {sel && <Icon name="check" size={16} className="sel3-check" />}
                </div>
              );
            })}
            {!rows.length && <div className="sel3-empty">Keine Einträge</div>}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
