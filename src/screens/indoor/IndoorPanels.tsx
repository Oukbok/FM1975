// =============================================================================
// Hallen-Show: Seitenteile – Gruppentabellen (live), Spielplan mit Ergebnissen,
// Teilnehmer und Hallenkader (Startseite). Listenstil „Paarungen“ (28-rows.css),
// eigener Verein Bernstein. CSS 28-indoor.css (.ix-*).
// =============================================================================
import { ClubLink } from '../../components/club/ClubLink';
import { indoorSkill, type IndoorMatch } from '../../engine/indoor';
import { liveTables, type IndoorLive, type LiveSlot } from '../../engine/indoorLive';
import type { Game } from '../../game/state';
import type { Player } from '../../types';
import { vColor } from '../../ui/format';
import { AnyCrest } from '../../views/transfers/window/parts';
import { STAGE_LABEL, indoorName, indoorShort } from './indoorScript';
import PosBadge from '../../components/PosBadge';

export function IxClub({ g, id, size = 26, short }: { g: Game; id: string | null; size?: number; short?: boolean }) {
  if (!id) return <span className="ix-club open"><span className="ix-crest" style={{ width: size, height: size }} /><span className="ix-name">offen</span></span>;
  return (
    <ClubLink id={id}>
      <span className={`ix-club ${id === g.managedClubId ? 'me' : ''}`}>
        <span className="ix-crest" style={{ width: size, height: size }}><AnyCrest g={g} id={id} size={size} /></span>
        <span className="ix-name">{short ? indoorShort(g, id) : indoorName(g, id)}</span>
      </span>
    </ClubLink>
  );
}

export function scoreText(m: IndoorMatch, flip = false): string {
  const [a, b] = flip ? [m.gb, m.ga] : [m.ga, m.gb];
  const so = m.pa != null ? ` (${flip ? m.pb : m.pa}:${flip ? m.pa : m.pb} n. N.)` : '';
  return `${a}:${b}${so}`;
}

/** Zwei Gruppentabellen; die ersten zwei erreichen das Halbfinale. */
export function GroupTablesPanel({ g, live }: { g: Game; live: IndoorLive }) {
  const tables = liveTables(live);
  const mid = g.managedClubId;
  return (
    <div className="ix-groups">
      {tables.map((rows, gi) => (
        <section key={gi} className="ix-group">
          <h3 className="ix-h">Gruppe {gi === 0 ? 'A' : 'B'}<span className="ix-h-note">Sp · Tore · Pkt</span></h3>
          <div className="rl rl-sm">
            {rows.map((r, i) => (
              <div key={r.id} className={`rl-row ix-trow ${r.id === mid ? 'me' : ''}`}>
                <span className={`rl-rank rl-z ${i < 2 ? 'zone-cl' : ''}`}>{i + 1}</span>
                <IxClub g={g} id={r.id} size={24} />
                <span className="rl-num ix-dim">{r.p}</span>
                <span className="rl-num ix-dim">{r.gf}:{r.ga}</span>
                <span className="rl-num rl-main">{r.pts}</span>
              </div>
            ))}
          </div>
        </section>
      ))}
      <p className="ix-foot">Die ersten zwei jeder Gruppe spielen über Kreuz im Halbfinale.</p>
    </div>
  );
}

/** Spielplan: alle Spiele mit Ergebnis, aktuelles Spiel markiert. */
export function SchedulePanel({ g, live, current, fresh }: { g: Game; live: IndoorLive; current?: LiveSlot; fresh?: number }) {
  const mid = g.managedClubId;
  let lastStage = '';
  return (
    <div className="ix-sched">
      {live.slots.map((s) => {
        const head = s.stage === 'A' || s.stage === 'B' ? 'Vorrunde' : STAGE_LABEL[s.stage];
        const showHead = head !== lastStage;
        lastStage = head;
        const own = s.a === mid || s.b === mid;
        return (
          <div key={s.no}>
            {showHead && <h3 className="ix-h">{head}</h3>}
            <div className={`ix-srow ${own ? 'me' : ''} ${current?.no === s.no ? 'cur' : ''} ${fresh === s.no ? 'fresh' : ''}`}>
              <span className="ix-sno">{s.no}</span>
              <span className="ix-stg">{s.stage === 'A' || s.stage === 'B' ? s.stage : ''}</span>
              <span className="ix-steam l"><IxClub g={g} id={s.a} size={22} short /></span>
              <span className="ix-sres">{s.match ? scoreText(s.match) : '–:–'}</span>
              <span className="ix-steam r"><IxClub g={g} id={s.b} size={22} short /></span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Teilnehmer nach Hallenstärke (Startseite). */
export function EntrantsPanel({ g, live }: { g: Game; live: IndoorLive }) {
  const mid = g.managedClubId;
  const ids = Object.keys(live.strength).sort((a, b) => live.strength[b] - live.strength[a]);
  const grp = (id: string) => (live.groups[0].includes(id) ? 'A' : 'B');
  return (
    <div className="rl rl-sm ix-entrants">
      {ids.map((id, i) => (
        <div key={id} className={`rl-row ix-erow ${id === mid ? 'me' : ''}`}>
          <span className="rl-rank">{i + 1}</span>
          <IxClub g={g} id={id} size={26} />
          <span className="ix-dim">Gruppe {grp(id)}</span>
          <span className="rl-num rl-main" style={{ color: vColor(live.strength[id]) }}>{Math.round(live.strength[id])}</span>
        </div>
      ))}
    </div>
  );
}

/** Dein Hallenkader: Torwart + Feldspieler, die besten fünf = erster Block. */
export function SquadPanel({ squad }: { squad: Player[] }) {
  const tw = squad.filter((p) => p.naturalPosition === 'TW');
  const field = squad.filter((p) => p.naturalPosition !== 'TW').sort((a, b) => indoorSkill(b) - indoorSkill(a));
  const row = (p: Player, tag: string) => (
    <div key={p.id} className="rl-row ix-prow" data-pid={p.id}>
      <PosBadge p={p} compact />
      <span className="rl-name">{p.fullName}</span>
      <span className="ix-dim">{tag}</span>
      <span className="rl-num rl-main" style={{ color: vColor(indoorSkill(p)) }}>{Math.round(indoorSkill(p))}</span>
    </div>
  );
  return (
    <div className="rl rl-sm rl-players ix-squad">
      {tw.map((p) => row(p, 'Torwart'))}
      {field.map((p, i) => row(p, i < 5 ? '1. Block' : 'Wechsel'))}
      {!squad.length && <p className="ix-dim">Kein Hallenkader verfügbar.</p>}
    </div>
  );
}
