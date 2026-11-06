// =============================================================================
// ZENTRALE – rechte Spalte (Wunsch Pascal, ersetzt Übersicht + Vereinsnachrichten):
// Nächstes Spiel · Teamstatus · Unsere Besten · Zeitgeist (wechselt jedes Halbjahr).
// Zeitgeist füllt den Rest der Spalte, damit sie bündig mit dem Newscenter endet.
// =============================================================================
import { ClubLink } from '../../../components/club/ClubLink';
import FaceThumb from '../../../components/FaceThumb';
import PosBadge from '../../../components/PosBadge';
import { PlayerLink } from '../../../components/playerMenu/PlayerLink';
import { briefingFor } from '../../../data/briefings';
import { eraFor } from '../../../data/briefings/eraTips';
import type { Game } from '../../../game/state';
import type { Screen } from '../../../shell/navigation';
import { fmtDateFull } from '../../../ui/format';
import type { Player } from '../../../types';
import { Crest, clubShort } from '../presse/parts';
import { ownGames } from './data';
import { TeamWidget, Widget } from './LeftWidgets';

type Go = (s: Screen) => void;
const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();
const COMP_LABEL = { Liga: 'Liga', Pokal: 'Landespokal', Europa: 'Europapokal' } as const;

// ------------------------------------------------------------- Nächstes Spiel
type Res = 'W' | 'D' | 'L';
function formOf(g: Game, clubId: string, n = 5): Res[] {
  const out: { d: string; r: Res }[] = [];
  for (const m of g.fixtures) {
    if (!m.result || (m.homeClubId !== clubId && m.awayClubId !== clubId)) continue;
    const home = m.homeClubId === clubId;
    const f = home ? m.result.homeGoals : m.result.awayGoals, a = home ? m.result.awayGoals : m.result.homeGoals;
    out.push({ d: m.date, r: f > a ? 'W' : f < a ? 'L' : 'D' });
  }
  return out.sort((x, y) => x.d.localeCompare(y.d)).slice(-n).map((x) => x.r);
}
function Form({ list }: { list: Res[] }) {
  if (!list.length) return <span className="dz-dim">–</span>;
  return <span className="dz-form">{list.map((r, i) => <i key={i} className={`dz-fr dz-fr-${r}`} title={{ W: 'Sieg', D: 'Remis', L: 'Niederlage' }[r]}>{{ W: 'S', D: 'U', L: 'N' }[r]}</i>)}</span>;
}

function NextMatchWidget({ g, onGoto }: { g: Game; onGoto: Go }) {
  const today = g.calendar.currentDate;
  const next = ownGames(g).find((x) => x.gf == null && x.date >= today);
  const me = g.managedClubId;
  const pos = (id: string) => g.table.rows.find((r) => r.clubId === id)?.position;
  return (
    <Widget title="Nächstes Spiel" to="fixtures" onGoto={onGoto} right={next ? COMP_LABEL[next.comp] : undefined} className="dz-next">
      {!next ? <div className="dz-empty">Kein Spiel angesetzt.</div> : (
        <>
          <div className="dz-nm">
            <span className="dz-nm-crest" onClick={stop}><Crest g={g} id={next.opp} size={64} /></span>
            <div className="dz-nm-main">
              <div className="dz-nm-teams" onClick={stop}>
                {next.home
                  ? <><span className="me">{clubShort(g, me)}</span> – <ClubLink id={next.opp}>{clubShort(g, next.opp)}</ClubLink></>
                  : <><ClubLink id={next.opp}>{clubShort(g, next.opp)}</ClubLink> – <span className="me">{clubShort(g, me)}</span></>}
              </div>
              <div className="dz-nm-date">{fmtDateFull(next.date)}</div>
              <div className="dz-dim">{next.home ? 'Heimspiel' : 'Auswärtsspiel'}</div>
            </div>
          </div>
          <div className="dz-nm-cmp">
            <span />
            <span className="dz-th">Wir</span>
            <span className="dz-th">Gegner</span>
            {next.comp === 'Liga' && <>
              <span className="dz-dim">Tabelle</span>
              <b>{pos(me) ? `${pos(me)}.` : '–'}</b>
              <b>{pos(next.opp) ? `${pos(next.opp)}.` : '–'}</b>
            </>}
            <span className="dz-dim">Form</span>
            <Form list={formOf(g, me)} />
            <Form list={formOf(g, next.opp)} />
          </div>
        </>
      )}
    </Widget>
  );
}

// ------------------------------------------------------------- Unsere Besten
function BestWidget({ g, onGoto }: { g: Game; onGoto: Go }) {
  const club = g.clubs[g.managedClubId];
  const squad = club.playerIds.map((id) => g.players[id]).filter((p): p is Player => !!p);
  const rated = squad.filter((p) => (p.seasonStats?.ratedMatches ?? 0) >= 3);
  const byNote = rated.length >= 3;
  const top = byNote
    ? [...rated].sort((a, b) => a.seasonStats.averageRating - b.seasonStats.averageRating).slice(0, 3)
    : [...squad].sort((a, b) => b.overall - a.overall).slice(0, 3);
  const scorer = [...squad].sort((a, b) => (b.seasonStats?.goals ?? 0) - (a.seasonStats?.goals ?? 0))[0];
  const fmtN = (v: number) => v.toFixed(2).replace('.', ',');
  return (
    <Widget title="Unsere Besten" to="squad" onGoto={onGoto} right={byNote ? 'nach Saisonnote' : 'nach Stärke'} className="dz-best">
      {top.map((p, i) => (
        <div key={p.id} className="dz-bp" data-pid={p.id} onClick={stop}>
          <span className="dz-bp-rank">{i + 1}</span>
          <FaceThumb p={p} club={club} size={34} />
          <span className="dz-bp-name"><PlayerLink id={p.id}>{p.fullName}</PlayerLink><PosBadge p={p} single compact /></span>
          <span className="dz-bp-val">
            {byNote ? <><b>{fmtN(p.seasonStats.averageRating)}</b><small>{p.seasonStats.goals} T · {p.seasonStats.assists} V</small></>
              : <><b>{p.overall}</b><small>Stärke</small></>}
          </span>
        </div>
      ))}
      {scorer && (scorer.seasonStats?.goals ?? 0) > 0 && (
        <div className="dz-kv dz-best-scorer" onClick={stop}><span>Torjäger</span><b><PlayerLink id={scorer.id}>{scorer.fullName}</PlayerLink> · {scorer.seasonStats.goals} Tore</b></div>
      )}
    </Widget>
  );
}

// ------------------------------------------------------------- Zeitgeist
/** Halbjahr der Saison: Juli–Dezember = 0, Januar–Juni = 1. */
function halfOf(iso: string) { return +iso.slice(5, 7) >= 7 ? 0 : 1; }

function ZeitgeistWidget({ g, onGoto }: { g: Game; onGoto: Go }) {
  const today = g.calendar.currentDate;
  const half = halfOf(today);
  const year = +today.slice(0, 4);
  const startYear = Number(g.season.slice(0, 4));
  const items = briefingFor(g.season)?.society ?? [];
  // je Halbjahr zwei andere Punkte des Saison-Briefings (Abschnitt Gesellschaft)
  const pick = items.length ? [items[(half * 2) % items.length], items[(half * 2 + 1) % items.length]].filter((x, i, a) => a.indexOf(x) === i) : [];
  const era = eraFor(startYear);
  return (
    <Widget title="Zeitgeist" to="briefing" onGoto={onGoto} right={`${half === 0 ? '2. Halbjahr' : '1. Halbjahr'} ${year}`} className="dz-zg">
      <div className="dz-zg-era">{era.label}</div>
      {pick.length === 0
        ? <p className="dz-zg-text">{era.tips[0]?.text}</p>
        : pick.map((it) => (
          <div key={it.title} className="dz-zg-item">
            <div className="dz-zg-title">{it.title}</div>
            <p className="dz-zg-text">{it.text}</p>
          </div>
        ))}
    </Widget>
  );
}

export function RightColumn({ g, onGoto }: { g: Game; onGoto: Go }) {
  return (
    <div className="dz-col dz-right">
      <NextMatchWidget g={g} onGoto={onGoto} />
      <TeamWidget g={g} onGoto={onGoto} />
      <BestWidget g={g} onGoto={onGoto} />
      <ZeitgeistWidget g={g} onGoto={onGoto} />
    </div>
  );
}
