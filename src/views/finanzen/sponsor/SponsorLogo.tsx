// =============================================================================
// Sponsoring — generierte Firmenlogos (SVG) aus Name, Branche und Epoche.
// Keine echten Marken: Farben je Branche, Zeichen je Branche, Aufbau und Schrift
// aus dem Namen (fest über einen Hash) und dem Jahrzehnt des Auftritts:
//   bis 1985  klassisch  – Serifenschrift, Großbuchstaben, Doppelrahmen
//   1986–2004 kräftig    – schmale Groteske, kursiv, Schwung
//   ab 2005   flach      – moderne Groteske, ruhige Fläche, Zeichen im Kreis
// Varianten: 'tile' (Kachel 1:1), 'banner' (Bande 6:1), 'chest' (Druck auf dem
// Trikot, ohne Fläche, Farbe gegen die Trikotfarbe), 'mark' (nur Zeichen).
// Bild-Slot: ist für die Firma ein Logo in data/sponsorLogos.ts eingetragen
// (`public/assets/sponsor/logos/<slug>.webp`, 600×300 transparent), zeigt jede Variante
// das Bild im selben viewBox (feste Box, kein Springen); bei Ladefehler wieder die Zeichnung.
// =============================================================================
import { useState } from 'react';
import type { SponsorIndustry } from '../../../types/sponsor';
import { sponsorLogoImage } from '../../../data/sponsorLogos';

export type LogoVariant = 'tile' | 'banner' | 'chest' | 'mark';
export type LogoEra = 'classic' | 'bold' | 'flat';

export function logoEra(year: number): LogoEra {
  return year < 1986 ? 'classic' : year < 2005 ? 'bold' : 'flat';
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Grund, Schrift, Zweitfarbe je Branche (gedämpft, wie gedruckte Markenfarben). */
const PALETTE: Record<SponsorIndustry, [string, string, string]> = {
  spirituosen: ['#1f3a2b', '#efe3bd', '#c39a3f'],
  brauerei: ['#7b2121', '#f5ead0', '#d6a647'],
  tabak: ['#1d1d1f', '#ebe4d2', '#b53a2e'],
  versicherung: ['#173f6c', '#ffffff', '#5aa6d8'],
  bank: ['#11305a', '#ffffff', '#cf3b31'],
  auto: ['#2a2e35', '#eef1f5', '#9aa6b4'],
  elektronik: ['#111214', '#ffffff', '#3a7fdc'],
  handel: ['#c9442c', '#ffffff', '#f6cf4a'],
  bau: ['#e8b015', '#1e1e1e', '#1e1e1e'],
  chemie: ['#215f97', '#ffffff', '#7dbf47'],
  lebensmittel: ['#b5182f', '#ffffff', '#f2c24a'],
  pharma: ['#f4f6f6', '#0c6b5a', '#47ad94'],
  sportartikel: ['#141414', '#ffffff', '#d9412f'],
  logistik: ['#f2c400', '#b5182f', '#b5182f'],
  telekom: ['#58206f', '#ffffff', '#d8197a'],
  energie: ['#11643a', '#ffffff', '#9acb4c'],
  tech: ['#101a2c', '#ffffff', '#44b6e8'],
  online: ['#e8641c', '#ffffff', '#1f1f1f'],
  airline: ['#6a213b', '#f4ecdb', '#c8a35f'],
  staatsfonds: ['#771732', '#ffffff', '#c8a35f'],
  wetten: ['#0e3c2f', '#ffffff', '#efc22a'],
  krypto: ['#151515', '#f3a03a', '#f3a03a'],
};

/** Zeichen je Branche (Linienzeichnung im 24er-Raster). */
const GLYPH: Record<SponsorIndustry, string> = {
  spirituosen: 'M10 2h4v4l2 3v13H8V9l2-3z M8 14h8',
  brauerei: 'M5 6h10v15H5z M15 9h3a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-3 M5 9h10',
  tabak: 'M4 20C4 10 10 4 20 4c0 10-6 16-16 16z M4 20L14 10',
  versicherung: 'M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z M9 12l2 2 4-4',
  bank: 'M3 9l9-6 9 6z M5 9v10 M9.5 9v10 M14.5 9v10 M19 9v10 M3 21h18',
  auto: 'M3 15l2.5-5h13l2.5 5v4H3z M7 19v2 M17 19v2 M6.5 15h2 M15.5 15h2',
  elektronik: 'M3 5h18v11H3z M8 20h8 M12 16v4',
  handel: 'M5 8h14l-1 13H6z M9 8V6a3 3 0 0 1 6 0v2',
  bau: 'M3 21V10l9-7 9 7v11z M9 21v-6h6v6',
  chemie: 'M9 3h6 M10 3v6l-5 10a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-10V3 M7 16h10',
  lebensmittel: 'M12 22V8 M12 8c-3 0-5-2-5-5 3 0 5 2 5 5z M12 8c3 0 5-2 5-5-3 0-5 2-5 5z M12 14c-3 0-5-2-5-5 3 0 5 2 5 5z M12 14c3 0 5-2 5-5-3 0-5 2-5 5z',
  pharma: 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6z',
  sportartikel: 'M3 18c7 0 13-4 18-13 M3 12.5c5 0 9-2 13-7',
  logistik: 'M3 7l9-4 9 4v10l-9 4-9-4z M3 7l9 4 9-4 M12 11v10',
  telekom: 'M12 21v-7 M8.5 10.5a5 5 0 0 1 7 0 M5.5 7.5a9 9 0 0 1 13 0 M12 13.2a.8.8 0 1 0 .01 0',
  energie: 'M13 2L4 14h7l-1 8 9-12h-7z',
  tech: 'M7 7h10v10H7z M10 3v4 M14 3v4 M10 17v4 M14 17v4 M3 10h4 M3 14h4 M17 10h4 M17 14h4',
  online: 'M3 4h3l3 11h10l2-8H7 M10 20a1 1 0 1 0 .01 0 M18 20a1 1 0 1 0 .01 0',
  airline: 'M3 11l18-8-6 18-3-7z M12 14l9-11',
  staatsfonds: 'M12 3l2.6 5.6 6 .7-4.5 4.1 1.3 6L12 16.5l-5.4 2.9 1.3-6-4.5-4.1 6-.7z',
  wetten: 'M12 3a9 9 0 1 0 .01 0 M12 7.5l4 3-1.5 4.7h-5L8 10.5z',
  krypto: 'M12 2l9 5v10l-9 5-9-5V7z M9.5 8h3.5a2 2 0 0 1 0 4H9.5z M9.5 12h4a2 2 0 0 1 0 4h-4z M9.5 8v8',
};

const FONT: Record<LogoEra, string> = {
  classic: 'Georgia, "Times New Roman", serif',
  bold: 'Oswald, "Arial Narrow", sans-serif',
  flat: 'Barlow, "Helvetica Neue", Arial, sans-serif',
};
/** Breite je Zeichen relativ zur Schriftgröße (Schätzung für das Einpassen). */
const WIDTH: Record<LogoEra, number> = { classic: 0.68, bold: 0.5, flat: 0.56 };

export interface LogoSpec {
  bg: string; fg: string; ac: string;
  era: LogoEra;
  /** 0 Zeichen + Wortmarke, 1 nur Wortmarke, 2 Monogramm-Feld */
  layout: 0 | 1 | 2;
  main: string; sub: string;
  glyph: string;
}

/** Aufbau eines Logos (fest je Name). */
export function logoSpec(name: string, industry: SponsorIndustry, year: number): LogoSpec {
  const h = hash(name);
  const era = logoEra(year);
  let [bg, fg, ac] = PALETTE[industry] ?? ['#2a2e35', '#ffffff', '#9aa6b4'];
  if (h % 5 === 0 && industry !== 'krypto') [bg, fg] = [fg, bg];
  const words = name.replace(/\.de$/, '.de').split(/\s+/);
  // Hauptwort: das prägnanteste (kürzeste sinnvolle) unter den ersten beiden.
  let main = words[0], sub = words.slice(1).join(' ');
  if (words.length > 1 && words[0].length > 11 && words[1].length <= 10) { main = words[1]; sub = words[0] + (words.length > 2 ? ' ' + words.slice(2).join(' ') : ''); }
  if (era === 'classic') { main = main.toUpperCase(); sub = sub.toUpperCase(); }
  if (era === 'bold') main = main.toUpperCase();
  if (era === 'flat' && h % 3 === 0) main = main.toLowerCase();
  return { bg, fg, ac, era, layout: (h >>> 3) % 3 as 0 | 1 | 2, main, sub, glyph: GLYPH[industry] ?? GLYPH.handel };
}

/** Text so setzen, dass er in `w` passt (Größe fällt, notfalls gestaucht). */
function Fit({ x, y, w, size, text, era, fill, anchor = 'middle', weight = 700, spacing = 0 }: {
  x: number; y: number; w: number; size: number; text: string; era: LogoEra; fill: string; anchor?: 'middle' | 'start'; weight?: number; spacing?: number;
}) {
  const est = text.length * size * WIDTH[era] + spacing * text.length;
  const fs = est > w ? Math.max(size * 0.62, size * w / est) : size;
  const squeeze = text.length * fs * WIDTH[era] + spacing * text.length > w;
  return (
    <text x={x} y={y} textAnchor={anchor} fontFamily={FONT[era]} fontSize={fs} fontWeight={weight} fill={fill}
      letterSpacing={spacing} fontStyle={era === 'bold' ? 'italic' : undefined}
      {...(squeeze ? { textLength: w, lengthAdjust: 'spacingAndGlyphs' } : {})}>{text}</text>
  );
}

function Glyph({ d, x, y, s, color, sw = 2 }: { d: string; x: number; y: number; s: number; color: string; sw?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s / 24})`}>
      <path d={d} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

/** Monogramm aus den Anfangsbuchstaben. */
function initials(name: string): string {
  const w = name.replace(/[^A-Za-zÄÖÜäöü\s-]/g, '').split(/[\s-]+/).filter(Boolean);
  return (w.length > 1 ? w[0][0] + w[1][0] : (w[0] ?? '?').slice(0, 2)).toUpperCase();
}

export function SponsorLogo({ name, industry, year, variant = 'tile', ink, className }: {
  name: string; industry: SponsorIndustry; year: number; variant?: LogoVariant;
  /** Nur 'chest': Druckfarbe (Kontrast zum Trikot). */
  ink?: string;
  className?: string;
}) {
  const s = logoSpec(name, industry, year);
  const label = `Logo ${name}`;
  const src = sponsorLogoImage(name);
  const [broken, setBroken] = useState<string | null>(null);
  if (src && broken !== src) {
    const box = variant === 'mark' ? [40, 40] : variant === 'chest' ? [120, 50] : variant === 'banner' ? [300, 50] : [100, 100];
    const pad = variant === 'chest' ? 0 : variant === 'mark' ? 3 : 6;
    const r = s.era === 'flat' ? 10 : s.era === 'bold' ? 6 : 2;
    return (
      <svg viewBox={`0 0 ${box[0]} ${box[1]}`} className={className} role="img" aria-label={label} preserveAspectRatio="xMidYMid meet">
        {(variant === 'tile' || variant === 'mark') && <rect width={box[0]} height={box[1]} rx={variant === 'mark' ? 6 : r} fill={s.bg} />}
        <image href={src} x={pad} y={pad} width={box[0] - pad * 2} height={box[1] - pad * 2} preserveAspectRatio="xMidYMid meet"
          onError={() => setBroken(src)} />
      </svg>
    );
  }
  if (variant === 'mark') {
    return (
      <svg viewBox="0 0 40 40" className={className} role="img" aria-label={label}>
        <rect width="40" height="40" rx={s.era === 'flat' ? 20 : s.era === 'bold' ? 6 : 3} fill={s.bg} />
        <Glyph d={s.glyph} x={8} y={8} s={24} color={s.fg} />
      </svg>
    );
  }
  if (variant === 'chest') {
    const c = ink ?? s.fg;
    return (
      <svg viewBox="0 0 120 50" className={className} role="img" aria-label={label}>
        {s.layout === 2 && <rect x="2" y="4" width="116" height="42" rx={s.era === 'flat' ? 21 : 4} fill="none" stroke={c} strokeWidth="2.4" />}
        {s.layout !== 1 && <Glyph d={s.glyph} x={s.layout === 2 ? 10 : 4} y={12} s={26} color={c} sw={2.4} />}
        <Fit x={s.layout === 1 ? 60 : 72} y={s.sub && s.layout === 1 ? 28 : 33} w={s.layout === 1 ? 112 : 78} size={26} text={s.main} era={s.era} fill={c} />
        {s.sub && s.layout === 1 && <Fit x={60} y={44} w={100} size={11} text={s.sub} era={s.era} fill={c} weight={500} spacing={1} />}
      </svg>
    );
  }
  if (variant === 'banner') {
    return (
      <svg viewBox="0 0 300 50" className={className} role="img" aria-label={label} preserveAspectRatio="xMidYMid meet">
        {s.layout !== 1 && <Glyph d={s.glyph} x={10} y={9} s={32} color={s.ac === s.fg ? s.fg : s.ac} sw={2.2} />}
        <Fit x={s.layout === 1 ? 150 : 172} y={s.sub ? 29 : 35} w={s.layout === 1 ? 270 : 230} size={30} text={s.main} era={s.era} fill={s.fg} spacing={s.era === 'classic' ? 2 : 0.5} />
        {s.sub && <Fit x={s.layout === 1 ? 150 : 172} y={44} w={s.layout === 1 ? 240 : 210} size={11} text={s.sub} era={s.era} fill={s.fg} weight={500} spacing={1.5} />}
      </svg>
    );
  }
  // Kachel
  const r = s.era === 'flat' ? 10 : s.era === 'bold' ? 6 : 2;
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label={label}>
      <rect width="100" height="100" rx={r} fill={s.bg} />
      {s.era === 'classic' && <rect x="5" y="5" width="90" height="90" rx="1" fill="none" stroke={s.ac} strokeWidth="1.6" />}
      {s.layout === 2 ? (
        <>
          <rect x="26" y="14" width="48" height="48" rx={s.era === 'flat' ? 24 : 4} fill={s.ac === s.fg ? 'none' : s.ac} stroke={s.fg} strokeWidth={s.ac === s.fg ? 2.5 : 0} />
          <text x="50" y="47" textAnchor="middle" fontFamily={FONT[s.era]} fontSize="24" fontWeight="800" fill={s.fg} fontStyle={s.era === 'bold' ? 'italic' : undefined}>{initials(s.main + ' ' + s.sub)}</text>
        </>
      ) : s.layout === 0 ? (
        s.era === 'flat'
          ? <><circle cx="50" cy="36" r="20" fill={s.ac} /><Glyph d={s.glyph} x={37} y={23} s={26} color={s.bg} sw={2.2} /></>
          : <Glyph d={s.glyph} x={33} y={16} s={34} color={s.ac === s.bg ? s.fg : s.ac} sw={2} />
      ) : (
        s.era === 'bold'
          ? <path d="M16 58 Q50 40 86 30" fill="none" stroke={s.ac} strokeWidth="5" strokeLinecap="round" />
          : <rect x="20" y="58" width="60" height="3" fill={s.ac} />
      )}
      <Fit x={50} y={s.layout === 1 ? 50 : 78} w={84} size={s.layout === 1 ? 22 : 17} text={s.main} era={s.era} fill={s.fg} spacing={s.era === 'classic' ? 1 : 0} />
      {s.sub && <Fit x={50} y={s.layout === 1 ? 76 : 91} w={80} size={9} text={s.sub} era={s.era} fill={s.fg} weight={500} spacing={0.8} />}
    </svg>
  );
}
