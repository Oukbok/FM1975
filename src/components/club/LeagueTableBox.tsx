// Box „Tabelle“ im Vereinsprofil eines Auslandsvereins (Wunsch Pascal: statt der Trainer-Box, deren
// Trainer im Ausland unbekannt ist): laufende Tabelle seiner Liga, der Verein hervorgehoben.
import { useEffect, useRef } from 'react';
import { DashBox, Empty } from '../../ui/DashPage';
import { TeamName } from '../../views/statistiken/competition/parts';
import type { ClubProfileData } from '../../game/clubProfile';
import type { Game } from '../../game/state';

export function LeagueTableBox({ g, d }: { g: Game; d: ClubProfileData }) {
  const rows = d.leagueRows ?? [];
  const ref = useRef<HTMLDivElement>(null);
  // Eigene Zeile in die Mitte scrollen (lange Ligen scrollen intern).
  useEffect(() => {
    const el = ref.current?.querySelector('.cmx-lt-row.me') as HTMLElement | null;
    if (el && ref.current) ref.current.scrollTop = el.offsetTop - ref.current.clientHeight / 2 + el.clientHeight / 2;
  }, [d.clubId]);
  const started = rows.some((r) => r.p > 0);
  return (
    <DashBox title="Tabelle" icon="dashTabelle" right={d.tablePosition != null ? `${d.tablePosition}. von ${d.tableSize}` : undefined}>
      {!rows.length ? <Empty icon="dashTabelle">Der Verein spielt in dieser Saison in keiner simulierten Liga.</Empty> : (
        <div className="cmx-lt-wrap">
          <div className="cmx-lt-cap">{d.divisionLabel}{started ? '' : ' · noch kein Spieltag'}</div>
          <div className="cmx-lt" ref={ref}>
          <div className="cmx-lt-row head"><span>Pl.</span><span>Verein</span><span>Sp.</span><span>Tore</span><span>Pkt.</span></div>
          {rows.map((r, i) => (
            <div key={r.clubId} className={`cmx-lt-row${r.clubId === d.clubId ? ' me' : ''}`}>
              <span>{started ? r.pos : i + 1}.</span>
              <span className="cmx-lt-team"><TeamName g={g} id={r.clubId} season={g.season} size={16} /></span>
              <span>{r.p}</span><span>{r.gf}:{r.ga}</span><b>{r.pts}</b>
            </div>
          ))}
          </div>
        </div>
      )}
    </DashBox>
  );
}
