// =============================================================================
// HALLE – Ansicht „Turniere im Ausland“ der Box Masters-Siegerliste | Hallenkönige
// (Statistiken › Halle): Turnierwahl (nach Land, mit Flagge), dann Sieger/Zweiter je
// Winter aus dem Archiv (`IndoorHistoryEntry.abroad`) plus laufender Winter, dein Platz.
// Stammdaten data/indoorAbroad.ts, Spielablauf game/indoorAbroad.ts.
// =============================================================================
import { ClubLink } from '../../../components/club/ClubLink';
import { CountryFlag } from '../../../components/competition/CountryFlag';
import { ABROAD_BY_ID, ABROAD_TOURNAMENTS, abroadGroupName, abroadGroupOf } from '../../../data/indoorAbroad';
import { indoorShort } from '../../../game/indoorGame';
import { countryName } from '../../../game/worldPool';
import type { Game } from '../../../game/state';
import type { IndoorState } from '../../../game/winterShared';
import { IndoorFlag } from '../../../screens/indoor/IndoorFlag';
import Select from '../../../ui/Select';

/** Turnier-Gruppen in fester Reihenfolge (Schweizer Vorrunden zählen zur Meisterschaft). */
export const ABROAD_GROUPS: string[] = [...new Set(ABROAD_TOURNAMENTS.map((d) => abroadGroupOf(d.id)))];

function groupDef(group: string) {
  return ABROAD_TOURNAMENTS.find((d) => abroadGroupOf(d.id) === group)!;
}

/** Turnier, das den Sieger einer Gruppe stellt (Serie: das Finale). */
const winnerAid = (group: string) => ABROAD_TOURNAMENTS.find((d) => abroadGroupOf(d.id) === group && d.stage !== 'q')?.id ?? group;

export function AbroadPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select size="s" width={300} value={value} onChange={onChange} title="Turnier" aria-label="Turnier"
      options={ABROAD_GROUPS.map((gr) => {
        const d = groupDef(gr);
        return { value: gr, text: abroadGroupName(gr), label: <span className="hk-opt"><CountryFlag country={d.country} height={11} noLink /> {abroadGroupName(gr)}</span> };
      })} />
  );
}

export function AbroadList({ g, st, group, onGroup }: { g: Game; st: IndoorState; group: string; onGroup: (v: string) => void }) {
  const d = groupDef(group);
  const aid = winnerAid(group);
  const mid = g.managedClubId;
  const rows: { year: number; w: string; ru: string; own: number }[] = [];
  for (const h of st.history) for (const a of h.abroad ?? []) if (a[0] === aid) rows.push({ year: h.year, w: a[1], ru: a[2], own: a[3] });
  const cur = st.current?.season === g.season ? st.current : undefined;
  for (const t of cur?.abroad ?? []) {
    if (t.aid !== aid || !t.done || !t.result || rows.some((r) => r.year === cur!.winterYear)) continue;
    rows.push({ year: cur!.winterYear, w: t.result.ranking[0], ru: t.result.ranking[1] ?? '', own: t.result.ranking.indexOf(mid) + 1 });
  }
  rows.sort((a, b) => b.year - a.year);
  // Dein Abschneiden in allen Turnieren der Gruppe (auch Vorrunden).
  const ownBest = new Map<number, number>();
  for (const h of st.history) for (const a of h.abroad ?? []) if (abroadGroupOf(a[0]) === group && a[3] > 0) ownBest.set(h.year, Math.min(ownBest.get(h.year) ?? 99, a[3]));
  const venue = d.venues.map((v) => `${v.hall}, ${v.city}`).join(' / ');
  return (
    <div className="hk-scroll">
      <div className="hk-pick"><AbroadPicker value={group} onChange={onGroup} /></div>
      <div className="dnote hk-abroad-note">
        <CountryFlag country={d.country} height={11} noLink /> {countryName(d.country)} · {venue} · im Spiel {d.from}–{d.until}
        {ABROAD_BY_ID[aid]?.series ? ' · Finale der Besten aus den Vorrunden' : ''}
      </div>
      {rows.length ? <div className="dsec">In deinem Spiel</div> : null}
      {rows.map((r) => (
        <div key={r.year} className={`dlist-row ${r.w === mid ? 'win-me' : ''}`}>
          <span className="meta" style={{ minWidth: 40 }}>{r.year}</span>
          <span className="grow"><IndoorFlag g={g} id={r.w} /><b><ClubLink id={r.w}>{indoorShort(g, r.w)}</ClubLink></b>
            {r.ru && <span className="muted"> vor <IndoorFlag g={g} id={r.ru} /><ClubLink id={r.ru}>{indoorShort(g, r.ru)}</ClubLink></span>}</span>
          {(r.own > 0 || ownBest.has(r.year)) && <span className="meta">ihr: {r.own || ownBest.get(r.year)}.</span>}
        </div>
      ))}
      {!rows.length && <div className="dnote">Noch kein {abroadGroupName(group)} in deinem Spiel – das Turnier läuft im Spiel von {d.from} bis {d.until}.</div>}
    </div>
  );
}
