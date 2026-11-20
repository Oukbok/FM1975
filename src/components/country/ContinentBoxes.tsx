// Länderprofil für Länder der Hintergrund-Kontinente (Südamerika, Nord-/Mittelamerika,
// Afrika, Asien, Ozeanien): keine Ligen im Spiel, sondern je Saison Meister/Platzierung
// und Kontinentalpokal (game/continents.ts, Anzeigedaten game/continentProfile.ts).
import { useMemo } from 'react';
import { continentProfile, type CtProfile } from '../../game/continentProfile';
import type { Game } from '../../game/state';
import { DashBox, Empty, KV } from '../../ui/DashPage';
import { vColor } from '../../ui/format';
import { TeamName } from '../../views/statistiken/competition/parts';
import type { CountryTabProps } from './parts';

const yrSeason = (y: number) => `${y}/${String((y + 1) % 100).padStart(2, '0')}`;

function useProfile(g: Game, key: string): CtProfile | null {
  return useMemo(() => continentProfile(g, key), [g, key, g.season]); // eslint-disable-line react-hooks/exhaustive-deps
}

/** Ersetzt „Ligaruf international“: Kontinent und Kontinentalpokal. */
export function CtCupBox({ g, c }: CountryTabProps) {
  const p = useProfile(g, c.key);
  if (!p) return null;
  return (
    <DashBox title="Kontinentalpokal" info="weltpokal" right={p.confName}>
      <KV k="Wettbewerb" v={p.cupName ?? 'in dieser Saison keiner'} strong />
      <KV k="Titel des Landes" v={p.cupWins.length ? `${p.cupWins.length}×` : 'keine'} />
      {p.cupWins[0] && <KV k={`Zuletzt ${p.cupWins[0].year}`} v={<TeamName g={g} id={p.cupWins[0].id} season={yrSeason(p.cupWins[0].year)} size={16} />} />}
      <div className="dnote mt8">{c.name} läuft nur im Hintergrund: je Saison werden Meister und Kontinentalpokal ausgelost (Stärke der Epoche + Form + Zufall). Spielbar ist hier nichts – du triffst die Besten im Weltpokal bzw. bei der Klub-WM.</div>
    </DashBox>
  );
}

/** Ersetzt „Meister & Pokal“. */
export function CtChampBox({ g, c }: CountryTabProps) {
  const p = useProfile(g, c.key);
  const last = p?.seasons[0];
  return (
    <DashBox title="Meister" right={last ? String(last.year) : undefined}>
      {last ? <>
        {last.ids.map((id, i) => <KV key={id} k={i === 0 ? `Meister ${last.year}` : `${i + 1}. Platz`} v={<TeamName g={g} id={id} season={yrSeason(last.year)} size={i ? 16 : 18} />} strong={i === 0} />)}
        <div className="dsec">Meiste Titel (seit deinem Start)</div>
        {p!.clubs.filter((x) => x.titles).sort((a, b) => b.titles - a.titles).slice(0, 3).map((x) => <KV key={x.id} k={<TeamName g={g} id={x.id} season={yrSeason(last.year)} size={16} />} v={`${x.titles}×`} />)}
      </> : <Empty icon="trophy">Noch kein Meister ausgespielt.</Empty>}
    </DashBox>
  );
}

/** Ersetzt „Beste Vereine“: alle Vereine der Daten mit Stärke. */
export function CtClubsBox({ g, c }: CountryTabProps) {
  const p = useProfile(g, c.key);
  return (
    <DashBox title="Vereine" right={p?.clubs.length ? 'Stärke' : undefined}>
      {p?.clubs.length ? (
        <div className="cnx-list">
          {p.clubs.map((x, i) => (
            <div key={x.id} className="cnx-crow">
              <span className="rl-rank">{i + 1}</span>
              <span className="cnx-cname"><TeamName g={g} id={x.id} season={g.season} size={20} /></span>
              <b style={{ color: vColor(x.strength) }}>{Math.round(x.strength)}</b>
            </div>
          ))}
        </div>
      ) : <Empty icon="dashVerein">Keine Vereine in dieser Saison.</Empty>}
    </DashBox>
  );
}

/** Reiter „Ligen“: Meister je Jahr, Vereine mit Titeln, Kontinentalpokal-Sieger. */
export function ContinentLeagues({ g, c }: CountryTabProps) {
  const p = useProfile(g, c.key);
  if (!p) return null;
  return (
    <>
      <DashBox title="Meister je Saison" span={2} rows={2} flush right={p.seasons.length ? `${p.seasons.length} Jahre` : undefined}>
        {p.seasons.length ? (
          <div className="cnx-scroll">
            <table className="dtable cnx-table cnx-holders">
              <thead><tr><th>Jahr</th><th>Meister</th><th>Zweiter</th></tr></thead>
              <tbody>
                {p.seasons.map((s) => (
                  <tr key={s.year}>
                    <td className="cnx-season">{s.year}</td>
                    {[0, 1].map((i) => <td key={i} className="cnx-team">{s.ids[i] ? <TeamName g={g} id={s.ids[i]} season={yrSeason(s.year)} size={16} /> : '–'}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <Empty icon="trophy">Noch kein Meister ausgespielt.</Empty>}
      </DashBox>
      <DashBox title="Titel der Vereine">
        {p.clubs.map((x) => <KV key={x.id} k={<TeamName g={g} id={x.id} season={g.season} size={16} />} v={`${x.titles}× Meister${x.cups ? ` · ${x.cups}× Kontinent` : ''}${x.world ? ` · ${x.world}× Welt` : ''}`} />)}
      </DashBox>
      <DashBox title="Kontinentalpokal" right={p.cupWins.length ? `${p.cupWins.length}× · ${p.confName}` : p.confName}>
        {p.cupName && <KV k="Wettbewerb" v={p.cupName} strong />}
        {p.cupWins.length ? p.cupWins.map((w) => <KV key={w.year} k={<span className={w.pre ? 'cnx-pre' : ''}>{w.year}</span>} v={<TeamName g={g} id={w.id} season={yrSeason(w.year)} size={16} />} />)
          : <div className="dnote">Noch kein Titel für {c.name}.</div>}
        <div className="dnote mt8">Grau: echte Sieger vor deinem Spielstart.</div>
      </DashBox>
    </>
  );
}
