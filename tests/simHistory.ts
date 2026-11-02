// =============================================================================
// Sim-Bericht „Entwicklung der anderen Vereine“ (HIST=aus|mittel|stark node scripts/sim.mjs 50)
// Je Saison: Meister der 1. Liga (voll oder simuliert), Endplatz der historisch
// starken Vereine (Kurve ≥ 1,15 im Jahr) gegen die übrigen, Europapokalsieger,
// Auslandsmeister mit Kurve. Zusammenfassung je Jahrzehnt am Ende.
// =============================================================================
import { Game } from '../src/game/state';
import { finalOrder } from '../src/game/season';
import { foreignFactor, germanFactor } from '../src/data/historicStrength';
import type { HistoryMode } from '../src/game/historicSteer';

export function histModeFromEnv(v: string | undefined): HistoryMode | null {
  if (!v) return null;
  const k = v.toLowerCase();
  return k === 'stark' || k === 'strong' ? 'strong' : k === 'mittel' || k === 'medium' ? 'medium' : 'off';
}

interface Row {
  y: number; champ: string; champF: number; bigRanks: number[]; restRanks: number[]; bigTop4: number; top4: number;
  ec: string; ecF: number; abroad: number; abroadBig: number; muc: number | null; dor: number | null;
}
const rows: Row[] = [];
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

function nameOf(g: Game, id: string): string {
  return g.clubs[id]?.shortName ?? g.simClubs?.[id]?.shortName ?? g.euroClubs?.[id]?.shortName ?? id;
}
function factorOf(g: Game, id: string, y: number): number {
  const sim = g.simClubs?.[id];
  const f = germanFactor(sim?.canonicalId ?? id, y);
  if (f != null) return f;
  const e = g.euroClubs?.[id];
  return e ? foreignFactor(e.country, e.name, y) ?? 1 : 1;
}

/** Am Saisonende (vor startNextSeason) aufrufen. */
export function histTrack(g: Game): void {
  const y = Number(g.season.slice(0, 4));
  const pd = g.leagues.playerDivision;
  const divId = pd.tier === 1 ? pd.id : g.leagues.otherDivisions.find((d) => d.tier === 1)?.id;
  if (!divId) return;
  const order = finalOrder(g, divId);
  const n = order.length;
  const big = (id: string) => id !== g.managedClubId && factorOf(g, id, y) >= 1.15;
  const bigRanks: number[] = [], restRanks: number[] = [];
  order.forEach((id, i) => { if (id === g.managedClubId) return; (big(id) ? bigRanks : restRanks).push((i + 1) / n); });
  const ecId = g.euroCups?.ec?.winnerClubId ?? '';
  // Auslandsmeister der abgelaufenen Saison (engine/world.ts, Stand vor dem Saisonwechsel = Vorjahr).
  const champs = g.world?.history?.[g.world.history.length - 1]?.champions ?? {};
  const watched = ['England', 'Spanien', 'Italien', 'Frankreich', 'Niederlande', 'Portugal', 'Schottland', 'Belgien'];
  const ab = watched.map((c) => champs[c]).filter(Boolean);
  const pos = (id: string) => { const i = order.indexOf(id); return i >= 0 ? i + 1 : null; };
  rows.push({
    y, champ: order[0], champF: factorOf(g, order[0], y), bigRanks, restRanks,
    bigTop4: order.slice(0, 4).filter(big).length, top4: Math.min(4, n),
    ec: ecId, ecF: ecId ? factorOf(g, ecId, y) : 1,
    abroad: ab.length, abroadBig: ab.filter((id) => factorOf(g, id, y - 1) >= 1.15).length,
    muc: pos('muc'), dor: pos('n_dor'),
  });
  console.log(`   HIST Meister ${nameOf(g, order[0])} (Kurve ${factorOf(g, order[0], y).toFixed(2)}) | Großklubs Ø Platz ${(avg(bigRanks) * n).toFixed(1)} (${bigRanks.length}) übrige ${(avg(restRanks) * n).toFixed(1)} | Top 4 davon groß ${rows[rows.length - 1].bigTop4} | MÜR ${pos('muc') ?? '-'} DOR ${pos('n_dor') ?? '-'} | EC ${ecId ? nameOf(g, ecId) : '-'} | Auslandsmeister (Vorsaison) groß ${ab.filter((id) => factorOf(g, id, y - 1) >= 1.15).length}/${ab.length}`);
}

export function histSummary(g: Game, mode: HistoryMode): void {
  console.log(`HIST Modus ${mode}, eigener Verein ${g.managedClubId} (ohne Kurve)`);
  for (const [a, b] of [[1975, 1985], [1985, 1995], [1995, 2005], [2005, 2015], [2015, 2030]]) {
    const r = rows.filter((x) => x.y >= a && x.y < b);
    if (!r.length) continue;
    const big = r.filter((x) => x.champF >= 1.15).length;
    const ecBig = r.filter((x) => x.ec && x.ecF >= 1.15).length;
    const ab = r.reduce((s, x) => s + x.abroad, 0), abBig = r.reduce((s, x) => s + x.abroadBig, 0);
    console.log(`HIST ${a}–${b - 1}: Meister ${r.map((x) => nameOf(g, x.champ)).join(' ')} | Meister mit Kurve ≥1,15: ${big}/${r.length}`
      + ` | Endplatz-Mittel (0 = oben, 1 = unten) groß ${avg(r.flatMap((x) => x.bigRanks)).toFixed(2)} übrige ${avg(r.flatMap((x) => x.restRanks)).toFixed(2)}`
      + ` | Top-4-Anteil groß ${(avg(r.map((x) => x.bigTop4 / x.top4)) * 100).toFixed(0)} %`
      + ` | EC ${r.map((x) => (x.ec ? nameOf(g, x.ec) : '-')).join(' ')} (groß ${ecBig}) | Auslandsmeister groß ${abBig}/${ab}`);
  }
  const m12 = rows.filter((x) => x.y >= 2012);
  if (m12.length) console.log(`HIST ab 2012: München Rot Meister ${m12.filter((x) => x.champ === 'muc').length}/${m12.length}, Ø Platz ${avg(m12.map((x) => x.muc ?? 0).filter(Boolean)).toFixed(1)}; Dortmund Ø Platz ${avg(m12.map((x) => x.dor ?? 0).filter(Boolean)).toFixed(1)}`);
  const all = rows.filter((x) => x.champ);
  console.log(`HIST gesamt: Meister mit Kurve ≥1,15 ${all.filter((x) => x.champF >= 1.15).length}/${all.length}, Endplatz-Mittel groß ${avg(all.flatMap((x) => x.bigRanks)).toFixed(2)} übrige ${avg(all.flatMap((x) => x.restRanks)).toFixed(2)}, EC-Sieger groß ${all.filter((x) => x.ec && x.ecF >= 1.15).length}/${all.filter((x) => x.ec).length}, Auslandsmeister groß ${all.reduce((s, x) => s + x.abroadBig, 0)}/${all.reduce((s, x) => s + x.abroad, 0)}`);
}
