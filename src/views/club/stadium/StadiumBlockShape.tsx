// =============================================================================
// EIN STADIONBLOCK als detailreiches Modell (Wunsch Pascal): Stufen mit Setz-
// stufen, Sitzreihen je Sitzart (einzelne Schalen als gestrichelte Reihen),
// Treppenaufgänge, Mundlöcher, Wellenbrecher auf Stehrängen, Zuschauer als
// bunte Punkte je Reihe (`crowd` = Auslastung), VIP-Bereich, Logenband,
// Stirnwände, Anzeigetafel/Videowand. Fassade und Dach folgen der BAUWEISE des
// Blocks (`look` 0–3, engine/stadiumStandard.ts): Betonschüssel mit Klinker-
// sockel und Stahlrohrdach auf Stützen · Stahl & Farbe mit Fensterband und
// Kragdach an Pylonen · Arena mit Glasfassade und Lichtband · Moderne Arena mit
// Lamellen, Membrandach, Solarfeldern und LED-Band. Gerade Blöcke und gebogene
// Kurven teilen denselben Bauplan: entlang u wird bei Kurven in Segmente zerlegt.
// =============================================================================
import { memo, type ReactNode } from 'react';
import type { BoardKind } from '../../../engine/stadiumExtras';
import type { SeatType, StadiumBlock } from '../../../types';
import { shade } from '../grounds/isoKit';
import { SC, SCREEN_DEPTH, V3, VIEW, depth, dot, face, isNear, mapper, neg, proj, pts, roofGeo, seg, tierGeometry } from './geo';

export interface SceneColors { primary: string; secondary: string }

function seatColor(seat: SeatType, c: SceneColors): string {
  switch (seat) {
    case 'steh': return '#8d939a';
    case 'bank': return '#a07a4e';
    case 'schale': return c.primary;
    case 'komfort': return shade(c.primary, 0.78);
    case 'business': return '#30353d';
  }
}
const DASH: Record<SeatType, string | undefined> = { steh: undefined, bank: undefined, schale: '2.1 0.8', komfort: '2.8 1', business: '3.4 1.2' };
const UP: V3 = [0, 0, 1];
/** Farben je Bauweise. */
const PAL = [
  { conc: '#9d9b95', facade: '#8e8a83', roof: '#737a82', steel: '#4b5159' },
  { conc: '#b3b6b8', facade: '#a9aeb3', roof: '#cdd2d6', steel: '#5d656f' },
  { conc: '#c8ccce', facade: '#e0e3e6', roof: '#f0f2f4', steel: '#e3e7ea' },
  { conc: '#d0d3d4', facade: '#c9a87c', roof: '#f7f8f9', steel: '#eef1f3' },
];
/** Kleidung der Zuschauer neben den Vereinsfarben. */
const FANS = ['#ece7df', '#d9c9b4', '#c9a27e', '#8b939c', '#e9dfc4', '#4a5670', '#b98f6c', '#3a3f47'];
const hsh = (n: number) => { const x = Math.sin(n * 91.7 + 13.3) * 43758.5453; return x - Math.floor(x); };
const scale = (a: V3, f: number): V3 => [a[0] * f, a[1] * f, a[2] * f];
const poly = (vs: V3[]) => vs.map((v) => proj(v).map((n) => n.toFixed(1)).join(',')).join(' ');

/** Stirnseite verdeckt? Ein Nachbarblock schließt bündig an und ist mindestens so hoch und tief –
 *  dann liegt die Wand im Inneren und würde sonst über den Nachbarn gemalt (Wunsch Pascal). */
function endHidden(b: StadiumBlock, u: number, others: StadiumBlock[] | undefined, vMax: number, zPar: number): boolean {
  if (!others) return false;
  const F = mapper(b);
  const p0 = F.at(u, 0, 0), p1 = F.at(u, vMax, 0);
  const near = (a: V3, c: V3) => Math.hypot(a[0] - c[0], a[1] - c[1]) < 0.6;
  for (const o of others) {
    if (o.id === b.id) continue;
    const G = mapper(o);
    for (const uo of [0, G.len]) {
      if (!near(G.at(uo, 0, 0), p0)) continue;
      const g = tierGeometry(o), last = g[g.length - 1];
      const ov = last.v1, oz = last.zt + 0.35;
      // Gleich tief (oder tiefer) und gleich hoch (oder höher): verdeckt.
      if (ov >= vMax - 0.3 && oz >= zPar - 0.3) return true;
      // Flacher, aber Fußpunkt hinten gleich: Wand nur, wenn sie sichtbar herausragt.
      if (near(G.at(uo, ov, 0), p1) && oz >= zPar - 0.3) return true;
    }
  }
  return false;
}

type ShapeProps = { b: StadiumBlock; colors: SceneColors; look: number; year: number; others?: StadiumBlock[]; crowd?: number; /** Anzeigetafel auf diesem Block (engine/stadiumExtras.ts); fehlt = `b.scoreboard`. */ board?: BoardKind | 'none' };
/** Neu gezeichnet nur bei echter Änderung (Überfahren anderer Blöcke zeichnet nichts neu). */
export const StadiumBlockShape = memo(StadiumBlockShapeRaw, (a: ShapeProps, c: ShapeProps) =>
  a.b === c.b && a.look === c.look && a.board === c.board && a.crowd === c.crowd && a.year === c.year && a.colors.primary === c.colors.primary && a.colors.secondary === c.colors.secondary
  && (a.others === c.others || (a.others?.length === c.others?.length && !!a.others?.every((x, i) => x === c.others![i]))));
function StadiumBlockShapeRaw({ b, colors, look, year, others, crowd = 0, board }: ShapeProps) {
  const era = Math.min(2, look); // Alt-Verzweigungen (0 Beton · 1 Stahl · 2 Arena und neuer)
  const P = PAL[look] ?? PAL[0];
  let seedN = 0; for (const ch of b.id) seedN = seedN * 7 + ch.charCodeAt(0);
  const F = mapper(b);
  const { len, at } = F;
  const id = b.id;
  const geo = tierGeometry(b);
  const last = geo[geo.length - 1];
  const vMax = last.v1, zTop = last.zt, zPar = zTop + 0.35;
  const near = isNear(b);
  const conc = P.conc;
  const sections = Math.max(1, Math.round(len / 3.6));
  const secLen = len / sections;
  const N = F.curve ? Math.max(5, Math.ceil(len / 0.6)) : 1;
  /** Stützstellen entlang u (Kurven: mehrere Segmente). */
  const us = (u0: number, u1: number): number[] => {
    const n = F.curve ? Math.max(1, Math.ceil(((u1 - u0) / len) * N)) : 1;
    return Array.from({ length: n + 1 }, (_, k) => u0 + ((u1 - u0) * k) / n);
  };
  const along = (u0: number, u1: number, v: number, z: number) => us(u0, u1).map((u) => at(u, v, z));
  /** Waagerechte (bzw. schräge) Fläche zwischen zwei Kanten. */
  const hband = (v0: number, z0: number, v1: number, z1: number, u0 = 0, u1 = len): V3[] => [...along(u0, u1, v0, z0), ...along(u0, u1, v1, z1).reverse()];
  /** Senkrechte Wand bei v (out = +1 nach außen, −1 zum Feld). */
  const vwall = (key: string, v: number, z0: number, z1: number, out: number, color: string, u0 = 0, u1 = len, o?: Parameters<typeof face>[4]): ReactNode[] => {
    const a = us(u0, u1);
    return a.slice(0, -1).map((u, k) => face(`${key}_${k}`, [at(u, v, z0), at(a[k + 1], v, z0), at(a[k + 1], v, z1), at(u, v, z1)], scale(F.vd((u + a[k + 1]) / 2), out), color, o));
  };
  const visibleAt = (u: number, out: number) => dot(scale(F.vd(u), out), VIEW) > 0.02;
  /** Senkrechter Streifen auf einer Wand, nur sichtbare Segmente. */
  const strip = (key: string, v: number, z0: number, z1: number, out: number, fill: string, u0: number, u1: number, op?: number): ReactNode[] => {
    const a = us(u0, u1);
    const res: ReactNode[] = [];
    for (let k = 0; k < a.length - 1; k++) {
      if (!visibleAt((a[k] + a[k + 1]) / 2, out)) continue;
      res.push(<polygon key={`${key}_${k}`} points={poly([at(a[k], v, z0), at(a[k + 1], v, z0), at(a[k + 1], v, z1), at(a[k], v, z1)])} fill={fill} opacity={op} />);
    }
    return res;
  };
  const pline = (key: string, ps: V3[], stroke: string, w: number, dash?: string) =>
    <polyline key={key} points={poly(ps)} fill="none" stroke={stroke} strokeWidth={w} strokeDasharray={dash} strokeLinejoin="round" />;

  const rows: { k: number; n: ReactNode }[] = [];
  let prevTop = 0, prevV1 = 0;

  geo.forEach((g, i) => {
    const t = b.tiers[i];
    const dep = g.v1 - g.v0;
    const nv = Math.max(2, Math.min(32, Math.round(dep / 0.42)));
    const dr = dep / nv, rise = (g.zt - g.zb) / nv;
    const sc = seatColor(t.seat, colors);
    const stripeRow = era >= 1 && t.seat === 'schale' && nv >= 6 ? Math.round(nv * 0.55) : -1;
    if (i > 0) {
      rows.push({ k: depth(at(len / 2, (prevV1 + g.v0) / 2, prevTop)) - 0.01,
        n: face(`${id}cc${i}`, hband(prevV1, prevTop, g.v0, prevTop), UP, shade(conc, 0.9)) });
    }
    for (let r = 0; r < nv; r++) {
      const va = g.v0 + r * dr, vb = va + dr, z = g.zb + (r + 1) * rise;
      const z0 = r === 0 ? (i === 0 ? 0 : prevTop) : z - rise;
      const els: ReactNode[] = [];
      const riserCol = r === 0 ? (i === 0 ? (look === 0 ? '#5a616b' : shade(colors.primary, 0.82)) : era === 0 ? shade(conc, 0.9) : colors.primary) : shade(conc, 1.1);
      els.push(...vwall(`${id}${i}rs${r}`, va, z0, z, -1, riserCol));
      if (r === 0 && !near) {
        // Oberkante der Brüstung; Oberränge moderner Arenen tragen ein LED-Band
        els.push(pline(`${id}${i}rk`, along(0, len, va - 0.012, z + 0.01), look === 0 ? '#c9ccce' : '#f4f6f7', 0.9));
        if (look === 3 && i > 0) {
          const lp = along(0.2, len - 0.2, va - 0.014, z0 + (z - z0) * 0.5);
          els.push(pline(`${id}${i}led0`, lp, colors.secondary, 2.2));
          els.push(pline(`${id}${i}led1`, lp, '#ffffff', 1.1, '7 5'));
        }
      }
      const treadCol = t.seat === 'steh' ? shade(conc, r % 2 ? 0.9 : 1) : shade(conc, 0.8);
      els.push(face(`${id}${i}tr${r}`, hband(va, z, vb, z), UP, treadCol));
      // Logenband in der Stirnseite des zweiten Rangs (Spielfeldseite)
      if (r === 0 && i === 1 && b.lounges > 0 && !near) {
        const zl = prevTop + 0.12, zh = g.zb - 0.06;
        for (let k = 0; k < b.lounges; k++) {
          const u0 = len * (0.06 + (0.88 * k) / b.lounges) + 0.1, u1 = len * (0.06 + (0.88 * (k + 1)) / b.lounges) - 0.1;
          els.push(...strip(`${id}lg${k}`, va - 0.01, zl, zh, -1, '#a9dcef', u0, u1, 0.92));
          els.push(...strip(`${id}lh${k}`, va - 0.012, zl + (zh - zl) * 0.55, zh, -1, '#e6f6fc', u0, u1, 0.5));
        }
      }
      const rowW = Math.max(1.1, dr * SC * SCREEN_DEPTH * 0.72);
      /** Zuschauer einer Reihe: zwei gestrichelte Lagen (Vereinsfarbe + gemischte Kleidung), Lücken nach Auslastung. */
      const people = (key: string, ps: V3[], occ: number, wd: number) => {
        if (occ <= 0.02) return;
        const unit = Math.max(1.3, wd * 0.95);
        const h1 = hsh(seedN + i * 31 + r * 7 + key.length), h2 = hsh(seedN * 3 + i * 17 + r * 13 + key.charCodeAt(key.length - 1));
        const gap = (share: number) => unit * (1 / Math.max(0.05, Math.min(0.96, occ * share)) - 1);
        const cA = h1 < 0.78 ? colors.primary : shade(colors.secondary, 0.94);
        const cB = FANS[Math.floor(h2 * FANS.length)];
        els.push(<polyline key={`${key}a`} points={poly(ps)} fill="none" stroke={shade(cA, near ? 0.82 : 1)} strokeWidth={wd} strokeDasharray={`${unit.toFixed(1)} ${gap(0.58).toFixed(1)}`} strokeDashoffset={(h1 * 9).toFixed(1)} />);
        els.push(<polyline key={`${key}b`} points={poly(ps)} fill="none" stroke={shade(cB, near ? 0.82 : 1)} strokeWidth={wd} strokeDasharray={`${unit.toFixed(1)} ${gap(0.42).toFixed(1)}`} strokeDashoffset={(h2 * 11 + unit).toFixed(1)} />);
      };
      // Auslastung: unten und in der Mitte voller, VIP fast voll.
      const occRow = crowd * (0.72 + 0.4 * (1 - r / nv)) * (i === 0 ? 1.05 : i === 1 ? 0.95 : 0.82);
      if (t.seat === 'steh') {
        if (crowd > 0) people(`${id}${i}pc${r}`, along(0.25, len - 0.25, va + dr * 0.5, z + 0.16), Math.min(1, occRow * 1.15), rowW * 1.25);
        if (r % 3 === 2 && r < nv - 1) {
          const vv = va + dr * 0.3;
          els.push(pline(`${id}${i}wb${r}`, along(0.3, len - 0.3, vv, z + 0.26), '#4f555d', 1.5));
          for (let u = secLen / 2; u < len - 0.2; u += secLen / 2) els.push(seg(`${id}${i}wp${r}${u.toFixed(1)}`, at(u, vv, z), at(u, vv, z + 0.26), '#5e646c', 0.9));
        }
      } else {
        const vs = va + dr * 0.58, zs = z + 0.06 + rise * 0.3;
        const w = Math.max(1.1, dr * SC * SCREEN_DEPTH * 0.72);
        for (let s = 0; s < sections; s++) {
          const u0 = s * secLen + 0.17, u1 = (s + 1) * secLen - 0.17;
          const mid = (s + 0.5) / sections;
          const vip = i === 0 && b.vip && (sections < 3 || (mid > 0.33 && mid < 0.67));
          let col = vip ? '#2b3038' : r === stripeRow ? colors.secondary : sc;
          if (!vip && t.seat === 'schale' && s % 2 === 1) col = shade(col, 0.93);
          col = shade(col, near ? 0.8 : 1);
          els.push(<polyline key={`${id}${i}s${r}_${s}`} points={poly(along(u0, u1, vs, zs))} fill="none"
            stroke={col} strokeWidth={vip ? w * 1.15 : w} strokeDasharray={vip ? DASH.business : DASH[t.seat]} />);
          if (crowd > 0) people(`${id}${i}p${r}_${s}`, along(u0, u1, vs, zs + 0.1), Math.min(1, occRow * (vip ? 1.15 : 1)), w * 1.05);
        }
      }
      // Treppenaufgänge zwischen den Abschnitten (helle Stufen mit Markierung an der Kante)
      for (let s = 1; s < sections; s++) {
        const u = s * secLen;
        els.push(seg(`${id}${i}st${r}_${s}`, at(u, va, z + 0.02), at(u, vb, z + 0.02), shade(conc, 1.22), Math.max(1.6, 0.3 * SC * 0.55)));
        if (look >= 1 && r % 2 === 0) els.push(seg(`${id}${i}sn${r}_${s}`, at(u - 0.13, va + 0.02, z + 0.03), at(u + 0.13, va + 0.02, z + 0.03), '#e8c33f', 0.9));
      }
      rows.push({ k: depth(at(len / 2, (va + vb) / 2, z)), n: <g key={`${id}${i}r${r}`}>{els}</g> });
    }
    // VIP-Bereich: goldene Einfassung
    if (i === 0 && b.vip) {
      const a0 = sections < 3 ? 0.15 : len * 0.335, a1 = sections < 3 ? len - 0.15 : len * 0.665;
      rows.push({ k: depth(at(len / 2, g.v1, g.zt)) + 0.02, n: <g key={`${id}vipb`}>
        {seg(`${id}vip1`, at(a0, g.v0, g.zb + rise), at(a0, g.v1, g.zt), '#d9b45a', 1.2)}
        {seg(`${id}vip2`, at(a1, g.v0, g.zb + rise), at(a1, g.v1, g.zt), '#d9b45a', 1.2)}
        {pline(`${id}vip3`, along(a0, a1, g.v0, g.zb + rise + 0.02), '#d9b45a', 1.4)}
      </g> });
    }
    // Mundlöcher (Zugänge mitten im Rang)
    if (nv >= 7 && !(i === 0 && b.vip)) {
      const rv = Math.floor(nv * 0.42);
      for (let s = 0; s < sections; s += 2) {
        const uc = (s + 0.5) * secLen;
        const q: V3[] = [at(uc - 0.45, g.v0 + rv * dr, g.zb + rv * rise + 0.03), at(uc + 0.45, g.v0 + rv * dr, g.zb + rv * rise + 0.03),
          at(uc + 0.45, g.v0 + (rv + 2) * dr, g.zb + (rv + 2) * rise + 0.03), at(uc - 0.45, g.v0 + (rv + 2) * dr, g.zb + (rv + 2) * rise + 0.03)];
        rows.push({ k: depth(at(len / 2, g.v0 + (rv + 1.5) * dr, g.zb + (rv + 2) * rise)) + 0.005, n: <polygon key={`${id}${i}mu${s}`} points={pts(q)} fill="#262a30" /> });
      }
    }
    prevTop = g.zt; prevV1 = g.v1;
  });
  rows.sort((a, c) => a.k - c.k);

  const out: ReactNode[] = rows.map((r) => r.n);
  // Brüstung hinten (Innenseite)
  out.push(...vwall(`${id}par`, vMax, zTop, zPar, -1, shade(conc, 1.05)));

  // Außenfassade je Bauweise (nur sichtbare Segmente)
  {
    const fv = vMax + 0.005, fo = fv + 0.01, fo2 = fv + 0.02;
    const fCol = P.facade;
    out.push(...vwall(`${id}fa`, fv, 0, zPar, 1, look === 3 ? '#3b4149' : fCol));
    const stripes = (key: string, step: number, z0: number, z1: number, col: string, wd: number) => {
      for (let u = step / 2; u < len - 0.1; u += step) if (visibleAt(u, 1)) out.push(seg(`${key}${u.toFixed(2)}`, at(u, fo2, z0), at(u, fo2, z1), col, wd));
    };
    if (look === 0) {
      // Klinkersockel, Betonpfeiler, schmales Fensterband unter der Brüstung
      out.push(...strip(`${id}fb`, fo, 0, Math.min(0.95, zPar * 0.4), 1, '#8b6756', 0, len));
      stripes(`${id}fr`, 2.4, 0, zPar, shade(fCol, 0.76), 1.5);
      if (zPar > 2.2) out.push(...strip(`${id}fw`, fo, zPar - 0.85, zPar - 0.55, 1, '#3f4750', 0.3, len - 0.3, 0.85));
    } else if (look === 1) {
      // Putz/Blech mit Fensterband und Farbstreifen
      stripes(`${id}fr`, 2.4, 0, zPar, shade(fCol, 0.82), 1);
      if (zPar > 2.4) out.push(...strip(`${id}fw`, fo, zPar * 0.42, zPar * 0.42 + 0.5, 1, '#5d7b8f', 0.3, len - 0.3, 0.9));
      if (zPar > 1.4) out.push(...strip(`${id}fs`, fo, zPar - 0.75, zPar - 0.4, 1, colors.primary, 0, len));
    } else if (look === 2) {
      // Glasfassade mit Pfosten, Farbband, heller Sockel
      if (zPar > 2) out.push(...strip(`${id}fg`, fo, 0.5, Math.max(1.2, zPar - 1.1), 1, '#86b3c8', 0.15, len - 0.15, 0.92));
      if (zPar > 2) out.push(...strip(`${id}fh`, fo2, Math.max(0.9, zPar - 1.9), Math.max(1.2, zPar - 1.1), 1, '#d3eaf3', 0.15, len - 0.15, 0.4));
      stripes(`${id}fr`, 1.2, 0.5, Math.max(1.2, zPar - 1.1), '#e8ecef', 0.7);
      if (zPar > 1.4) out.push(...strip(`${id}fs`, fo, zPar - 0.75, zPar - 0.38, 1, colors.primary, 0, len));
    } else {
      // Lamellenfassade über dunklem Sockel, verglaster Umgang, LED-Band unter der Dachkante
      out.push(...strip(`${id}fl0`, fo, 0.95, Math.max(1.3, zPar - 0.55), 1, fCol, 0, len));
      out.push(...strip(`${id}fgl`, fo, 0.3, 0.9, 1, '#9fd0e3', 0.2, len - 0.2, 0.85));
      stripes(`${id}fr`, 0.55, 0.95, Math.max(1.3, zPar - 0.55), shade(fCol, 0.72), 1.1);
      if (zPar > 1.6) {
        out.push(...strip(`${id}fs`, fo2, zPar - 0.5, zPar - 0.16, 1, colors.primary, 0, len));
        out.push(...strip(`${id}fsg`, fo2 + 0.01, zPar - 0.42, zPar - 0.26, 1, '#ffffff', 0, len, 0.55));
      }
    }
    if (b.lounges > 0 && zPar > 2.4) {
      for (let k = 0; k < b.lounges; k++) {
        const u0 = len * (0.08 + (0.84 * k) / b.lounges) + 0.12, u1 = len * (0.08 + (0.84 * (k + 1)) / b.lounges) - 0.12;
        out.push(...strip(`${id}flg${k}`, fo2, zPar - 1.75, zPar - 0.95, 1, '#a9dcef', u0, u1, 0.9));
      }
    }
    // Eingänge: dunkle Tore, ab „Stahl & Farbe“ mit Vordach in Vereinsfarbe
    for (let u = len / 4; u < len; u += len / 2) {
      out.push(...strip(`${id}gt${u.toFixed(1)}`, fo2, 0, 0.9, 1, '#2f343b', u - 0.5, u + 0.5));
      if (look >= 1 && visibleAt(u, 1)) out.push(seg(`${id}gc${u.toFixed(1)}`, at(u - 0.7, fo2 + 0.25, 1.0), at(u + 0.7, fo2 + 0.25, 1.0), look === 3 ? '#f1f3f4' : colors.primary, 2.4));
    }
  }
  // Stirnwände (Profil der Ränge)
  const prof: [number, number][] = [[0, 0]];
  let pt = 0;
  geo.forEach((g, i) => {
    if (i > 0) prof.push([g.v0, pt]);
    prof.push([g.v0, g.zb + (g.zt - g.zb) / Math.max(2, Math.round((g.v1 - g.v0) / 0.42))]);
    prof.push([g.v1, g.zt]);
    pt = g.zt;
  });
  prof.push([vMax, zPar], [vMax, 0]);
  if (!endHidden(b, 0, others, vMax, zPar)) out.push(face(`${id}ew0`, prof.map(([v, z]) => at(0, v, z)), neg(F.ud(0)), shade(conc, 0.96)));
  if (!endHidden(b, len, others, vMax, zPar)) out.push(face(`${id}ew1`, prof.map(([v, z]) => at(len, v, z)), F.ud(len), shade(conc, 0.96)));

  // Dach
  const rg = roofGeo(b);
  if (rg) {
    const { vS, vB, zB, zF } = rg;
    const th = 0.28;
    const roofCol = P.roof;
    const zAt = (v: number) => zF + (zB - zF) * ((v - vS) / (vB - vS));
    const ue0 = F.curve ? 0 : -0.15, ue1 = F.curve ? len : len + 0.15;
    if (era === 0) {
      const vc = Math.max(0.4, vS + 0.35);
      const tierAt = geo.find((g) => vc >= g.v0 && vc <= g.v1) ?? geo[0];
      const zs = tierAt.zb + ((vc - tierAt.v0) / Math.max(0.01, tierAt.v1 - tierAt.v0)) * (tierAt.zt - tierAt.zb);
      for (let u = secLen / 2; u < len - 0.3; u += secLen) out.push(seg(`${id}col${u.toFixed(1)}`, at(u, vc, zs), at(u, vc, zAt(vc) - th), '#4b5159', 2));
    }
    // Durchscheinender Vorderteil: Arena 28 %, moderne Arena 42 % (Membran)
    const vg = look === 3 ? vS + (vB - vS) * 0.42 : era === 2 ? vS + (vB - vS) * 0.28 : vS;
    if (near) out.push(<polygon key={`${id}rfo`} points={poly(hband(vS, zF, vB, zB, ue0, ue1))} fill="none" stroke="#e9eef2" strokeWidth={1.2} opacity={0.5} pointerEvents="none" />);
    const step = era === 0 ? 0.7 : 1.5;
    // Nahes Dach ist fast durchsichtig – Klicks gehen durch (sonst trifft man beim Zielen auf die
    // Gegenseite die vordere Tribüne, Wunsch Pascal).
    out.push(<g key={`${id}roof`} opacity={near ? 0.16 : 1} pointerEvents={near ? 'none' : undefined}>
      {face(`${id}rft`, hband(vg, zAt(vg), vB, zB, ue0, ue1), UP, roofCol)}
      {era === 2 && <polygon points={poly(hband(vS, zF, vg, zAt(vg), ue0, ue1))} fill={look === 3 ? '#e9f5fa' : '#cfe9f4'} opacity={look === 3 ? 0.62 : 0.55} />}
      {look === 3 && (() => {
        // Solarfelder auf dem hinteren Dachdrittel
        const v0 = vB - (vB - vS) * 0.3, v1 = vB - (vB - vS) * 0.06;
        return <g key="sol">
          <polygon points={poly(hband(v0, zAt(v0) + 0.012, v1, zAt(v1) + 0.012, ue0 + 0.3, ue1 - 0.3))} fill="#2c4766" opacity={0.92} />
          <polyline points={poly(along(Math.max(0, ue0 + 0.3), Math.min(len, ue1 - 0.3), (v0 + v1) / 2, zAt((v0 + v1) / 2) + 0.02))} fill="none" stroke="#5f84ab" strokeWidth={0.7} />
        </g>;
      })()}
      {look === 0 && <polyline points={poly(along(Math.max(0, ue0), Math.min(len, ue1), (vg + vB) / 2, zAt((vg + vB) / 2) + 0.012))} fill="none" stroke={shade(roofCol, 0.8)} strokeWidth={1.1} />}
      {Array.from({ length: Math.max(1, Math.floor((ue1 - ue0) / step)) }, (_, k) => {
        const u = ue0 + (k + 0.5) * step;
        return seg(`${id}rr${k}`, at(u, vg, zAt(vg) + 0.01), at(u, vB, zB + 0.01), shade(roofCol, 0.84), era === 0 ? 0.9 : 0.7);
      })}
      {vwall(`${id}rff`, vS, zF - th, zF, -1, look === 0 ? '#4e545c' : look === 3 ? '#f4f6f7' : colors.primary, ue0, ue1)}
      {vwall(`${id}rfb`, vB, zB - th, zB, 1, shade(roofCol, 0.8), ue0, ue1)}
      {face(`${id}rs0`, [at(ue0, vS, zF - th), at(ue0, vB, zB - th), at(ue0, vB, zB), at(ue0, vS, zF)], neg(F.ud(0)), shade(roofCol, 0.85))}
      {face(`${id}rs1`, [at(ue1, vS, zF - th), at(ue1, vB, zB - th), at(ue1, vB, zB), at(ue1, vS, zF)], F.ud(len), shade(roofCol, 0.85))}
    </g>);
    if (look === 1 || look === 2) {
      const tc = P.steel;
      for (const f of len > 8 ? [0.25, 0.75] : [0.5]) {
        const u = len * f, top: V3 = at(u, vB, zB + 2.6);
        out.push(seg(`${id}py${f}`, at(u, vB, zB), top, tc, 2.2));
        out.push(seg(`${id}ca${f}`, top, at(u, vS + 0.3, zF), tc, 1.1));
        out.push(seg(`${id}cm${f}`, top, at(u, (vS + vB) / 2, zAt((vS + vB) / 2)), tc, 1.1));
      }
    }
    if (era === 2 || (era === 1 && b.roof === 'full')) {
      const lp = along(0.3, len - 0.3, vS - 0.02, zF - th - 0.04);
      out.push(<g key={`${id}lb`} opacity={near ? 0.6 : 1}>{pline(`${id}lb0`, lp, 'rgba(255,243,192,0.22)', 4)}{pline(`${id}lb1`, lp, '#fff7d8', 1.6, look === 3 ? undefined : '5 3')}</g>);
    }
    if (look === 3) {
      // Tragring: schlanke Stützen hinten statt Pylonen, LED-Band an der Dachkante
      for (let u = secLen / 2; u < len; u += secLen) out.push(seg(`${id}rg${u.toFixed(1)}`, at(u, vB, zPar), at(u, vB, zB - th), P.steel, 1.3));
      const le = along(Math.max(0, ue0), Math.min(len, ue1), vB + 0.02, zB - th * 0.5);
      out.push(<g key={`${id}le`} opacity={near ? 0.5 : 1}>{pline(`${id}le0`, le, colors.primary, 2.2)}</g>);
    }
  }

  // Anzeigetafel bzw. Videowand (Art aus der Ausstattung; ohne Angabe: Epoche)
  const kind = board ?? (b.scoreboard ? (year >= 1994 ? 'video' : 'elektro') : 'none');
  if (kind !== 'none' && kind !== 'cube') {
    const big = kind === 'video' || kind === 'led';
    const hw = big ? Math.min(2.4, len * 0.26) : Math.min(1.6, len * 0.18);
    const v = vMax - 0.5;
    const base = rg ? rg.zB + (rg.zF - rg.zB) * ((v - rg.vS) / (rg.vB - rg.vS)) : zTop + 0.2;
    const z0 = base + 0.5, z1 = z0 + (big ? 2.3 : 1.5);
    const A = at(len / 2 - hw, v, 0), B = at(len / 2 + hw, v, 0);
    const P = (f: number, z: number): V3 => [A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f, z];
    const toPitch = neg(F.vd(len / 2));
    const off = (p: V3): V3 => [p[0] + toPitch[0] * 0.02, p[1] + toPitch[1] * 0.02, p[2]];
    out.push(seg(`${id}sl0`, P(0.12, base), P(0.12, z0), '#4b5159', 2));
    out.push(seg(`${id}sl1`, P(0.88, base), P(0.88, z0), '#4b5159', 2));
    const sq = [P(0, z0), P(1, z0), P(1, z1), P(0, z1)];
    const front = face(`${id}sbf`, sq, toPitch, '#1a1e24', { stroke: '#59616b', sw: 1.2 });
    if (front) {
      out.push(front);
      const q = (f0: number, f1: number, za: number, zb: number) => pts([off(P(f0, za)), off(P(f1, za)), off(P(f1, zb)), off(P(f0, zb))]);
      if (big) {
        out.push(<polygon key={`${id}sbs`} points={q(0.06, 0.94, z0 + 0.25, z1 - 0.25)} fill={kind === 'led' ? '#2a7fb0' : '#1f6d95'} />);
        out.push(<polygon key={`${id}sbh`} points={q(0.06, 0.94, z1 - 0.9, z1 - 0.25)} fill={kind === 'led' ? '#7cc6ea' : '#3d9cc9'} opacity={0.6} />);
      } else if (kind === 'hand') {
        out.push(<polygon key={`${id}sbs`} points={q(0.06, 0.94, z0 + 0.2, z1 - 0.2)} fill="#24412f" />);
        for (const f of [0.18, 0.34, 0.62, 0.78]) out.push(<polygon key={`${id}sbn${f}`} points={q(f, f + 0.1, z0 + 0.4, z1 - 0.4)} fill="#e9ecef" />);
      } else {
        const dots: ReactNode[] = [];
        for (let rr = 0; rr < 3; rr++) for (let c = 0; c < 14; c++) {
          if ((c === 6 || c === 7) && rr !== 1) continue;
          const [x, y] = proj(off(P(0.08 + (c / 13) * 0.84, z0 + 0.35 + rr * 0.4)));
          dots.push(<circle key={`${rr}_${c}`} cx={x.toFixed(1)} cy={y.toFixed(1)} r={1.3} fill={(c + rr) % 4 === 0 ? '#4a3a1a' : '#f2b640'} />);
        }
        out.push(<g key={`${id}sbd`}>{dots}</g>);
      }
    } else {
      out.push(face(`${id}sbb`, sq, neg(toPitch), '#4b5159'));
    }
  }
  return <>{out}</>;
}

/** Bodenschatten eines Blocks (Hülle aus Grundriss und Oberkante/Dach). */
export function blockShadowPoints(b: StadiumBlock): [number, number][] {
  const F = mapper(b);
  const geo = tierGeometry(b), last = geo[geo.length - 1];
  const rg = roofGeo(b);
  const ps: V3[] = [];
  const n = F.curve ? 8 : 1;
  for (let k = 0; k <= n; k++) {
    const u = (F.len * k) / n;
    ps.push(F.at(u, 0, 0), F.at(u, last.v1, 0), F.at(u, last.v1, last.zt + 0.35), F.at(u, 0, 0.4));
    if (rg) ps.push(F.at(u, rg.vS, rg.zF), F.at(u, rg.vB, rg.zB));
  }
  return ps.map(([x, y, z]) => proj([x + z * 0.3, y - z * 0.35, 0]));
}

/**
 * Umriss eines Blocks als Drahtmodell in seiner echten Form (Wunsch Pascal: die
 * gestrichelte Vorschau beim Umbau folgt der Tribüne statt einer Hülle): beide
 * Stirnseiten (Querschnitt Ränge + Dach) und die Längskanten vorne unten, hinten oben,
 * hinten unten und an der Dachkante. Kurven folgen dem Bogen.
 */
export function blockOutline(b: StadiumBlock): string[] {
  const F = mapper(b);
  const geo = tierGeometry(b), last = geo[geo.length - 1];
  const vMax = last.v1, zPar = last.zt + 0.35;
  const rg = roofGeo(b);
  const n = F.curve ? Math.max(6, Math.ceil(F.len / 0.6)) : 1;
  const us = Array.from({ length: n + 1 }, (_, k) => (F.len * k) / n);
  const ln = (v: number, z: number) => poly(us.map((u) => F.at(u, v, z)));
  const prof: [number, number][] = [[0, 0], [0, geo[0].zb], ...geo.map((g) => [g.v1, g.zt] as [number, number]), [vMax, zPar], [vMax, 0]];
  const cap = (u: number) => poly([...prof.map(([v, z]) => F.at(u, v, z)), F.at(u, 0, 0)]);
  const out = [cap(0), cap(F.len), ln(0, 0), ln(0, geo[0].zb), ln(vMax, zPar), ln(vMax, 0)];
  if (rg) {
    const roofCap = (u: number) => poly([F.at(u, rg.vS, rg.zF), F.at(u, rg.vB, rg.zB), F.at(u, rg.vB, zPar)]);
    out.push(ln(rg.vS, rg.zF), ln(rg.vB, rg.zB), roofCap(0), roofCap(F.len));
  }
  return out;
}
