// =============================================================================
// JUGENDWETTBEWERBE — Tabellen aus den Spielen einer Staffel/Gruppe
// =============================================================================
import type { TableRowLite } from '../competitionView';
import type { YcFix, YcLeague } from './types';

export function leagueTable(l: YcLeague, ptsWin: number, filter?: (f: YcFix) => boolean, side?: 'home' | 'away'): TableRowLite[] {
  const rows = new Map(l.clubs.map((id) => [id, { clubId: id, pos: 0, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, form: [] as ('W' | 'D' | 'L')[] }]));
  const played = l.fx.filter((f) => f[3] >= 0 && (!filter || filter(f))).sort((a, b) => a[0].localeCompare(b[0]));
  for (const [, h, a, hg, ag] of played) {
    for (const [id, f, c, s] of [[h, hg, ag, 'home'], [a, ag, hg, 'away']] as [string, number, number, string][]) {
      if (side && side !== s) continue;
      const r = rows.get(id);
      if (!r) continue;
      r.p++; r.gf += f; r.ga += c;
      if (f > c) { r.w++; r.pts += ptsWin; r.form.push('W'); } else if (f === c) { r.d++; r.pts++; r.form.push('D'); } else { r.l++; r.form.push('L'); }
    }
  }
  return [...rows.values()]
    .sort((x, y) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf || x.clubId.localeCompare(y.clubId))
    .map((r, i) => ({ ...r, pos: i + 1, form: r.form.slice(-5) }));
}

export const leagueDone = (l: YcLeague) => l.fx.every((f) => f[3] >= 0);
