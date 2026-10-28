// =============================================================================
// EIN STADIONBLOCK (leer, ohne Zuschauer): Stufen mit Setzstufen, Sitzreihen
// je Sitzart (einzelne Schalen als gestrichelte Reihen, Aufgänge, Mundlöcher),
// Wellenbrecher auf Stehrängen, VIP-Bereich, Logenband, Außenfassade je
// Epoche, Stirnwände, Dach mit Rippen/Stützen bzw. Kragträgern, Lichtband,
// Anzeigetafel/Videowand. Zeichenreihenfolge über die Kameratiefe.
// =============================================================================
import type { ReactNode } from 'react';
import type { SeatType, StadiumBlock } from '../../../types';
import { shade } from '../grounds/isoKit';
import { SC, SCREEN_DEPTH, V3, depth, face, isNear, mapper, neg, proj, pts, roofGeo, seg, tierGeometry } from './geo';

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

export function StadiumBlockShape({ b, colors, era, year }: { b: StadiumBlock; colors: SceneColors; era: number; year: number }) {
  const { len, at, ud, vd } = mapper(b.id);
  const id = b.id;
  const geo = tierGeometry(b);
  const last = geo[geo.length - 1];
  const vMax = last.v1, zTop = last.zt, zPar = zTop + 0.35;
  const near = isNear(id);
  const toPitch = neg(vd);
  const conc = era === 0 ? '#9a9da0' : era === 1 ? '#b1b6ba' : '#c6cacd';
  const sections = Math.max(2, Math.round(len / 3.6));
  const secLen = len / sections;
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
        n: face(`${id}cc${i}`, [at(0, prevV1, prevTop), at(len, prevV1, prevTop), at(len, g.v0, prevTop), at(0, g.v0, prevTop)], UP, shade(conc, 0.9)) });
    }
    for (let r = 0; r < nv; r++) {
      const va = g.v0 + r * dr, vb = va + dr, z = g.zb + (r + 1) * rise;
      const z0 = r === 0 ? (i === 0 ? 0 : prevTop) : z - rise;
      const els: ReactNode[] = [];
      const riserCol = r === 0 ? (i === 0 ? '#5a616b' : era === 0 ? shade(conc, 0.9) : colors.primary) : shade(conc, 1.1);
      els.push(face(`${id}${i}rs${r}`, [at(0, va, z0), at(len, va, z0), at(len, va, z), at(0, va, z)], toPitch, riserCol));
      const treadCol = t.seat === 'steh' ? shade(conc, r % 2 ? 0.9 : 1) : shade(conc, 0.8);
      els.push(face(`${id}${i}tr${r}`, [at(0, va, z), at(len, va, z), at(len, vb, z), at(0, vb, z)], UP, treadCol));
      // Logenband in der Stirnseite des zweiten Rangs (Spielfeldseite)
      if (r === 0 && i === 1 && b.lounges > 0 && !near) {
        const zl = prevTop + 0.12, zh = g.zb - 0.06;
        for (let k = 0; k < b.lounges; k++) {
          const u0 = len * (0.06 + (0.88 * k) / b.lounges) + 0.1, u1 = len * (0.06 + (0.88 * (k + 1)) / b.lounges) - 0.1;
          els.push(<polygon key={`${id}lg${k}`} points={pts([at(u0, va - 0.01, zl), at(u1, va - 0.01, zl), at(u1, va - 0.01, zh), at(u0, va - 0.01, zh)])} fill="#a9dcef" opacity={0.92} />);
          els.push(<polygon key={`${id}lh${k}`} points={pts([at(u0, va - 0.012, zl + (zh - zl) * 0.55), at(u1, va - 0.012, zl + (zh - zl) * 0.55), at(u1, va - 0.012, zh), at(u0, va - 0.012, zh)])} fill="#e6f6fc" opacity={0.5} />);
        }
      }
      if (t.seat === 'steh') {
        // Wellenbrecher mit Pfosten
        if (r % 3 === 2 && r < nv - 1) {
          const vv = va + dr * 0.3;
          els.push(seg(`${id}${i}wb${r}`, at(0.3, vv, z + 0.26), at(len - 0.3, vv, z + 0.26), '#4f555d', 1.5));
          for (let u = secLen / 2; u < len; u += secLen / 2) els.push(seg(`${id}${i}wp${r}${u.toFixed(1)}`, at(u, vv, z), at(u, vv, z + 0.26), '#5e646c', 0.9));
        }
      } else {
        const vs = va + dr * 0.58, zs = z + 0.06 + rise * 0.3;
        const w = Math.max(1.1, dr * SC * SCREEN_DEPTH * 0.72);
        for (let s = 0; s < sections; s++) {
          const u0 = s * secLen + 0.17, u1 = (s + 1) * secLen - 0.17;
          const mid = (s + 0.5) / sections;
          const vip = i === 0 && b.vip && mid > 0.33 && mid < 0.67;
          let col = vip ? '#2b3038' : r === stripeRow ? colors.secondary : sc;
          if (!vip && t.seat === 'schale' && s % 2 === 1) col = shade(col, 0.93);
          col = shade(col, near ? 0.8 : 1);
          const [x1, y1] = proj(at(u0, vs, zs)), [x2, y2] = proj(at(u1, vs, zs));
          els.push(<line key={`${id}${i}s${r}_${s}`} x1={x1.toFixed(1)} y1={y1.toFixed(1)} x2={x2.toFixed(1)} y2={y2.toFixed(1)}
            stroke={col} strokeWidth={vip ? w * 1.15 : w} strokeDasharray={vip ? DASH.business : DASH[t.seat]} />);
        }
      }
      rows.push({ k: depth(at(len / 2, (va + vb) / 2, z)), n: <g key={`${id}${i}r${r}`}>{els}</g> });
    }
    // VIP-Bereich: goldene Einfassung
    if (i === 0 && b.vip) {
      const a0 = len * 0.335, a1 = len * 0.665;
      rows.push({ k: depth(at(len / 2, g.v1, g.zt)) + 0.02, n: <g key={`${id}vipb`}>
        {seg(`${id}vip1`, at(a0, g.v0, g.zb + rise), at(a0, g.v1, g.zt), '#d9b45a', 1.2)}
        {seg(`${id}vip2`, at(a1, g.v0, g.zb + rise), at(a1, g.v1, g.zt), '#d9b45a', 1.2)}
        {seg(`${id}vip3`, at(a0, g.v0, g.zb + rise + 0.02), at(a1, g.v0, g.zb + rise + 0.02), '#d9b45a', 1.4)}
      </g> });
    }
    // Mundlöcher (Zugänge mitten im Rang)
    if (nv >= 7) {
      const rv = Math.floor(nv * 0.42);
      for (let s = 0; s < sections; s += 2) {
        const uc = (s + 0.5) * secLen;
        if (i === 0 && b.vip && uc > len * 0.33 && uc < len * 0.67) continue;
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
  out.push(face(`${id}par`, [at(0, vMax, zTop), at(len, vMax, zTop), at(len, vMax, zPar), at(0, vMax, zPar)], toPitch, shade(conc, 1.05)));

  // Außenfassade (nur sichtbar, wenn die Tribüne der Kamera den Rücken zeigt)
  if (near) {
    const fv = vMax + 0.005;
    const fCol = era === 0 ? '#8c9094' : era === 1 ? '#a6acb2' : '#dde1e4';
    out.push(face(`${id}fa`, [at(0, fv, 0), at(len, fv, 0), at(len, fv, zPar), at(0, fv, zPar)], vd, fCol));
    const q = (u0: number, u1: number, z0: number, z1: number, fill: string, key: string, op?: number) =>
      <polygon key={key} points={pts([at(u0, fv + 0.01, z0), at(u1, fv + 0.01, z0), at(u1, fv + 0.01, z1), at(u0, fv + 0.01, z1)])} fill={fill} opacity={op} />;
    if (era === 2 && zPar > 2) out.push(q(0.2, len - 0.2, 0.4, Math.min(zPar - 1.2, zPar * 0.55), '#7fa9bf', `${id}fg`, 0.85));
    for (let u = 1.6; u < len - 0.5; u += 2.4) out.push(seg(`${id}fr${u.toFixed(1)}`, at(u, fv + 0.01, 0), at(u, fv + 0.01, zPar), shade(fCol, era === 2 ? 0.88 : 0.78), era === 0 ? 1.4 : 1));
    if (era >= 1 && zPar > 1.4) out.push(q(0, len, zPar - 0.75, zPar - 0.4, colors.primary, `${id}fs`));
    if (b.lounges > 0 && zPar > 2.4) {
      const zl = zPar - 1.75, zh = zPar - 0.95;
      for (let k = 0; k < b.lounges; k++) {
        const u0 = len * (0.08 + (0.84 * k) / b.lounges) + 0.12, u1 = len * (0.08 + (0.84 * (k + 1)) / b.lounges) - 0.12;
        out.push(q(u0, u1, zl, zh, '#a9dcef', `${id}fl${k}`, 0.9));
      }
    }
    for (let u = len / 6; u < len; u += len / 3) out.push(q(u - 0.55, u + 0.55, 0, 0.9, '#3a3f46', `${id}gt${u.toFixed(1)}`));
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
  for (const [u, n] of [[0, neg(ud)], [len, ud]] as [number, V3][]) {
    out.push(face(`${id}ew${u}`, prof.map(([v, z]) => at(u, v, z)), n, shade(conc, 0.96)));
  }

  // Dach
  const rg = roofGeo(b);
  if (rg) {
    const { vS, vB, zB, zF } = rg;
    const th = 0.28;
    const roofCol = era === 0 ? '#7a8087' : era === 1 ? '#c4cace' : '#eef1f3';
    const op = near ? 0.16 : 1;
    const edge = near ? '#e9eef2' : undefined;
    const zAt = (v: number) => zF + (zB - zF) * ((v - vS) / (vB - vS));
    // Stützen (70er/80er: Pfeiler vor dem Dach)
    if (era === 0) {
      const vc = Math.max(0.4, vS + 0.35);
      const tierAt = geo.find((g) => vc >= g.v0 && vc <= g.v1) ?? geo[0];
      const zs = tierAt.zb + ((vc - tierAt.v0) / Math.max(0.01, tierAt.v1 - tierAt.v0)) * (tierAt.zt - tierAt.zb);
      for (let u = secLen; u < len - 0.5; u += secLen * 1.5) out.push(seg(`${id}col${u.toFixed(1)}`, at(u, vc, zs), at(u, vc, zAt(vc) - th), '#4b5159', 2));
    }
    // Dachfläche (vorne ab 2010 als Glasstreifen)
    const vg = era === 2 ? vS + (vB - vS) * 0.28 : vS;
    if (near) out.push(<polygon key={`${id}rfo`} points={pts([at(-0.15, vS, zF), at(len + 0.15, vS, zF), at(len + 0.15, vB, zB), at(-0.15, vB, zB)])} fill="none" stroke={edge} strokeWidth={1.2} opacity={0.5} />);
    out.push(<g key={`${id}roof`} opacity={op}>
      {face(`${id}rft`, [at(-0.15, vg, zAt(vg)), at(len + 0.15, vg, zAt(vg)), at(len + 0.15, vB, zB), at(-0.15, vB, zB)], UP, roofCol)}
      {era === 2 && <polygon points={pts([at(-0.15, vS, zF), at(len + 0.15, vS, zF), at(len + 0.15, vg, zAt(vg)), at(-0.15, vg, zAt(vg))])} fill="#cfe9f4" opacity={0.55} />}
      {Array.from({ length: Math.floor((len + 0.3) / (era === 0 ? 0.7 : 1.5)) }, (_, k) => {
        const u = -0.15 + (k + 0.5) * (era === 0 ? 0.7 : 1.5);
        return seg(`${id}rr${k}`, at(u, vg, zAt(vg) + 0.01), at(u, vB, zB + 0.01), shade(roofCol, 0.84), era === 0 ? 0.9 : 0.7);
      })}
      {face(`${id}rff`, [at(-0.15, vS, zF - th), at(len + 0.15, vS, zF - th), at(len + 0.15, vS, zF), at(-0.15, vS, zF)], toPitch, era === 0 ? '#4e545c' : colors.primary)}
      {face(`${id}rfb`, [at(-0.15, vB, zB - th), at(len + 0.15, vB, zB - th), at(len + 0.15, vB, zB), at(-0.15, vB, zB)], vd, shade(roofCol, 0.8))}
      {face(`${id}rs0`, [at(-0.15, vS, zF - th), at(-0.15, vB, zB - th), at(-0.15, vB, zB), at(-0.15, vS, zF)], neg(ud), shade(roofCol, 0.85))}
      {face(`${id}rs1`, [at(len + 0.15, vS, zF - th), at(len + 0.15, vB, zB - th), at(len + 0.15, vB, zB), at(len + 0.15, vS, zF)], ud, shade(roofCol, 0.85))}
    </g>);
    // Kragträger mit Pylonen (ab 1990)
    if (era >= 1) {
      const us = len > 25 ? [0.17, 0.5, 0.83] : [0.25, 0.75];
      const tc = era === 2 ? '#e3e7ea' : '#5d656f';
      for (const f of us) {
        const u = len * f, top: V3 = at(u, vB, zB + 2.6);
        out.push(seg(`${id}py${f}`, at(u, vB, zB), top, tc, 2.2));
        out.push(seg(`${id}ca${f}`, top, at(u, vS + 0.3, zF), tc, 1.1));
        out.push(seg(`${id}cm${f}`, top, at(u, (vS + vB) / 2, zAt((vS + vB) / 2)), tc, 1.1));
      }
    }
    // Lichtband unter der Dachkante
    if (era === 2 || (era === 1 && b.roof === 'full')) {
      out.push(seg(`${id}lb0`, at(0.4, vS - 0.02, zF - th - 0.04), at(len - 0.4, vS - 0.02, zF - th - 0.04), '#fff3c0', 4, { opacity: 0.22 }));
      out.push(seg(`${id}lb1`, at(0.4, vS - 0.02, zF - th - 0.04), at(len - 0.4, vS - 0.02, zF - th - 0.04), '#fff7d8', 1.6, { dash: '5 3' }));
    }
  }

  // Anzeigetafel bzw. Videowand (Kurven)
  if (b.scoreboard) {
    const big = year >= 1994;
    const u0 = len * (big ? 0.3 : 0.36), u1 = len * (big ? 0.7 : 0.64);
    const v = vMax - 0.5;
    const base = rg ? rg.zB + (rg.zF - rg.zB) * ((v - rg.vS) / (rg.vB - rg.vS)) : zTop + 0.2;
    const z0 = base + 0.5, z1 = z0 + (big ? 2.3 : 1.5);
    out.push(seg(`${id}sl0`, at(u0 + 0.5, v, base), at(u0 + 0.5, v, z0), '#4b5159', 2));
    out.push(seg(`${id}sl1`, at(u1 - 0.5, v, base), at(u1 - 0.5, v, z0), '#4b5159', 2));
    const sq = [at(u0, v, z0), at(u1, v, z0), at(u1, v, z1), at(u0, v, z1)];
    const front = face(`${id}sbf`, sq, toPitch, '#1a1e24', { stroke: '#59616b', sw: 1.2 });
    if (front) {
      out.push(front);
      const vi = v - 0.02;
      if (big) {
        out.push(<polygon key={`${id}sbs`} points={pts([at(u0 + 0.3, vi, z0 + 0.25), at(u1 - 0.3, vi, z0 + 0.25), at(u1 - 0.3, vi, z1 - 0.25), at(u0 + 0.3, vi, z1 - 0.25)])} fill="#1f6d95" />);
        out.push(<polygon key={`${id}sbh`} points={pts([at(u0 + 0.3, vi, z1 - 0.9), at(u1 - 0.3, vi, z1 - 0.9), at(u1 - 0.3, vi, z1 - 0.25), at(u0 + 0.3, vi, z1 - 0.25)])} fill="#3d9cc9" opacity={0.6} />);
      } else {
        const dots: ReactNode[] = [];
        for (let rr = 0; rr < 3; rr++) for (let c = 0; c < 14; c++) {
          if ((c === 6 || c === 7) && rr !== 1) continue;
          const [x, y] = proj(at(u0 + 0.35 + (c / 13) * (u1 - u0 - 0.7), vi, z0 + 0.35 + rr * 0.4));
          dots.push(<circle key={`${rr}_${c}`} cx={x.toFixed(1)} cy={y.toFixed(1)} r={1.3} fill={(c + rr) % 4 === 0 ? '#4a3a1a' : '#f2b640'} />);
        }
        out.push(<g key={`${id}sbd`}>{dots}</g>);
      }
    } else {
      out.push(face(`${id}sbb`, sq, vd, '#4b5159'));
    }
  }
  return <>{out}</>;
}

/** Bodenschatten eines Blocks (Hülle aus Grundriss und Oberkante/Dach). */
export function blockShadowPoints(b: StadiumBlock): [number, number][] {
  const { len, at } = mapper(b.id);
  const geo = tierGeometry(b), last = geo[geo.length - 1];
  const rg = roofGeo(b);
  const ps: V3[] = [at(0, 0, 0), at(len, 0, 0), at(len, last.v1, 0), at(0, last.v1, 0), at(0, last.v1, last.zt + 0.35), at(len, last.v1, last.zt + 0.35), at(0, 0, 0.4), at(len, 0, 0.4)];
  if (rg) ps.push(at(0, rg.vS, rg.zF), at(len, rg.vS, rg.zF), at(0, rg.vB, rg.zB), at(len, rg.vB, rg.zB));
  return ps.map(([x, y, z]) => proj([x + z * 0.3, y - z * 0.35, 0]));
}
