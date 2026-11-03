// =============================================================================
// Rechte Spalte des Textmodus: Schiedsrichter-Kasten (nur Anzeige, aus dem
// Spielverlauf abgeleitet) und Tabelle vor dem Spiel bzw. live mit dem
// aktuellen Spielstand.
// =============================================================================
import ClubCrest from '../../../components/ClubCrest';
import type { MatchSim } from '../../../engine/match/sim';
import type { Game } from '../../../game/state';
import type { OwnMatchInfo } from '../../../game/ownMatch';
import type { LeagueTableRow } from '../../../types';
import { InfoTip } from '../../../ui/InfoTip';

const REF_FIRST = ['Walter', 'Heinz', 'Volker', 'Peter', 'Bernd', 'Jürgen', 'Markus', 'Felix', 'Frank', 'Tobias', 'Daniel', 'Hans-Joachim', 'Dieter', 'Lutz'];
const REF_LAST = ['Eschweiler', 'Brandhorst', 'Kempter', 'Ahlers', 'Wendt', 'Rothkegel', 'Prinzler', 'Siebert', 'Haverkamp', 'Lindemeyer', 'Osterkamp', 'Dreesen', 'Bruckner', 'Voss'];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Schiedsrichter: Name (erfunden, je Spiel fest), Linie und Stimmung aus Fouls/Karten dieses Spiels. */
export function RefereeBox({ sim, info }: { sim: MatchSim; info: OwnMatchInfo }) {
  const h = hash(`${info.matchId}|${info.date}`);
  const name = `${REF_FIRST[h % REF_FIRST.length]} ${REF_LAST[(h >>> 8) % REF_LAST.length]}`;
  const H = sim.home.stats, A = sim.away.stats;
  const fouls = H.fouls + A.fouls, cards = H.yellow + A.yellow + (H.red + A.red) * 2;
  const ratio = fouls >= 6 ? cards / fouls / Math.max(0.02, sim.era.yellowPerFoul) : 1;
  const line = fouls < 10 ? 'noch unauffällig' : ratio > 1.35 ? 'pfeift kleinlich' : ratio < 0.7 ? 'lässt viel laufen' : 'pfeift normal';
  const played = Math.max(1, sim.minute);
  // ≈ 30 Fouls je Spiel sind normal; erst darüber und mit Karten wird es hitzig
  const heat = Math.max(0, Math.min(100, Math.round(((fouls / played) * 90 - 18) * 2.5 + cards * 8 + (sim.derby ? 10 : 0))));
  const mood = heat < 30 ? 'Gelassen' : heat < 55 ? 'Aufmerksam' : heat < 75 ? 'Angespannt' : 'Genervt';
  return (
    <div className="ms-panel tm-ref">
      <div className="tm-box-head"><span>Schiedsrichter <InfoTip k="schiedsrichter" /></span></div>
      <div className="tm-ref-grid">
        <span>Name</span><b>{name}</b>
        <span>Linie</span><b>{line}</b>
        <span>Stimmung</span>
        <div className="tm-ref-bar"><i style={{ width: `${Math.max(6, heat)}%` }} /><em>{mood}</em></div>
      </div>
    </div>
  );
}

/** Tabelle vor dem Anpfiff oder live (aktueller Spielstand eingerechnet). */
export function TablePanel({ g, sim, info, live }: { g: Game; sim: MatchSim; info: OwnMatchInfo; live: boolean }) {
  if (info.kind !== 'liga') return <div className="tm-ev-empty">Keine Tabelle – dies ist ein {info.competition}spiel.</div>;
  const three = g.table.pointSystem === '3-point';
  let rows: LeagueTableRow[] = g.table.rows.map((r) => ({ ...r }));
  if (live) {
    const [hs, as] = sim.score();
    const add = (id: string, f: number, a: number) => {
      const r = rows.find((x) => x.clubId === id);
      if (!r) return;
      r.played++; r.goalsFor += f; r.goalsAgainst += a; r.goalDifference = r.goalsFor - r.goalsAgainst;
      r.points += f > a ? (three ? 3 : 2) : f === a ? 1 : 0;
    };
    add(sim.home.club.id, hs, as); add(sim.away.club.id, as, hs);
    rows = rows.sort((x, y) => y.points - x.points || y.goalDifference - x.goalDifference || y.goalsFor - x.goalsFor);
  } else rows.sort((x, y) => x.position - y.position);
  const mine = g.managedClubId, opp = info.side === 'home' ? sim.away.club.id : sim.home.club.id;
  return (
    <div className="tm-table">
      <div className="tm-tb-row head"><span>Pl.</span><span /><span>Verein</span><span>Sp</span><span>Tore</span><span>Diff</span><span>Pkt</span></div>
      {rows.map((r, i) => {
        const c = g.clubs[r.clubId];
        const moved = live ? r.position - (i + 1) : 0;
        return (
          <div key={r.clubId} className={`tm-tb-row ${r.clubId === mine ? 'me' : ''} ${r.clubId === opp ? 'opp' : ''}`}>
            <span className="tm-tb-pl">{i + 1}{moved > 0 ? <em className="up">+{moved}</em> : moved < 0 ? <em className="dn">{moved}</em> : null}</span>
            <span>{c && <ClubCrest club={c} size={24} />}</span>
            <span className="tm-tb-name">{c?.name ?? r.clubId}</span>
            <span>{r.played}</span><span>{r.goalsFor}:{r.goalsAgainst}</span>
            <span>{r.goalDifference > 0 ? `+${r.goalDifference}` : r.goalDifference}</span><b>{r.points}</b>
          </div>
        );
      })}
    </div>
  );
}
