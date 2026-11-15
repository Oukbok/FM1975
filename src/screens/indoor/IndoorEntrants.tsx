// =============================================================================
// Hallen-Show, Startseite: Teilnehmer nach Hallenstärke – Klick auf einen Teilnehmer
// zeigt seinen Hallenkader (Torwart + Feldspieler mit Hallenwert) und die Kaderwahl
// der KI (Stammkräfte/Gemischt/Nachwuchs, `aiSquad` in game/indoorGame.ts) als
// Etikett. Hallenspezialisten (game/indoorRecords.ts) tragen ein kleines Etikett.
// Die Box behält ihre Größe, Liste und Kader scrollen intern. CSS 28-indoor.css.
// =============================================================================
import { useState } from 'react';
import { PlayerLink } from '../../components/playerMenu/PlayerLink';
import PosBadge from '../../components/PosBadge';
import Icon from '../../components/Icon';
import { INDOOR_SQUAD_LABEL, indoorSkill } from '../../engine/indoor';
import type { IndoorLive } from '../../engine/indoorLive';
import { hallRufOf, hallSpecialistAt } from '../../game/indoorRecords';
import type { Game } from '../../game/state';
import type { IndoorTournament } from '../../game/winterShared';
import type { Player } from '../../types';
import { vColor } from '../../ui/format';
import { AnyCrest } from '../../views/transfers/window/parts';
import { indoorName } from './indoorScript';

/** Kleines Etikett „Hallenspezialist“ (Hallenruf ab der Schwelle der Epoche, `hallSpecialistAt`). */
export function HallTag({ g, pid }: { g: Game; pid: string }) {
  const ruf = hallRufOf(g, pid);
  const at = hallSpecialistAt(g);
  if (ruf < at) return null;
  return <span className="ix-hs" title={`Hallenruf ${ruf} (Spezialist derzeit ab ${at}): viele Hallentore und Turniersiege über die Jahre`}>Hallenspezialist</span>;
}

function squadLabel(g: Game, t: IndoorTournament, id: string): string {
  if (id === g.managedClubId) return t.ownIds?.length ? 'Deine Auswahl' : `Deine Wahl: ${INDOOR_SQUAD_LABEL[t.squads[id] ?? (t.own && t.own !== 'decline' ? t.own : 'mix')]}`;
  const k = t.squads[id];
  return k ? INDOOR_SQUAD_LABEL[k] : 'Stammkräfte';
}

function EntrantSquad({ g, id, squad, strength }: { g: Game; id: string; squad?: Player[]; strength: number }) {
  if (!squad?.length) {
    return (
      <div className="ix-esq-empty ix-dim">
        Ohne vollen Kader (Ausland, Amateure, untere Ligen): Der Verein tritt mit seiner Vereinsstärke an – Hallenstärke {Math.round(strength)}.
      </div>
    );
  }
  const tw = squad.filter((p) => p.naturalPosition === 'TW');
  const field = squad.filter((p) => p.naturalPosition !== 'TW').sort((a, b) => indoorSkill(b) - indoorSkill(a));
  const row = (p: Player) => (
    <div key={p.id} className="rl-row ix-esq-row" data-pid={p.id}>
      <PosBadge p={p} compact />
      <span className="rl-name ix-esq-name"><PlayerLink id={p.id}>{p.fullName}</PlayerLink><HallTag g={g} pid={p.id} /></span>
      <span className="rl-num rl-main" style={{ color: vColor(indoorSkill(p)) }} title={`Hallenwert · Stärke draußen ${p.overall}`}>{Math.round(indoorSkill(p))}</span>
    </div>
  );
  const part = (title: string, list: Player[]) => list.length > 0 && (
    <><div className="ix-esq-sub"><span>{title}</span>{title === 'Torwart' && <span>Halle</span>}</div>{list.map(row)}</>
  );
  return (
    <div className="rl rl-sm rl-players ix-esq">
      {part('Torwart', tw)}
      {part('1. Block', field.slice(0, 5))}
      {part('Wechsel', field.slice(5))}
      {id !== g.managedClubId && <p className="ix-esq-note ix-dim">Die Kaderwahl trifft der Trainer nach Vereinsgröße, Epoche und Philosophie.</p>}
    </div>
  );
}

/** Abschnitt „Teilnehmer“ der Startseite: Liste ↔ Hallenkader eines Teilnehmers. */
export function EntrantsSection({ g, t, live, squads }: { g: Game; t: IndoorTournament; live: IndoorLive; squads: Map<string, Player[]> }) {
  const [sel, setSel] = useState<string | null>(null);
  const mid = g.managedClubId;
  const ids = Object.keys(live.strength).sort((a, b) => live.strength[b] - live.strength[a]);
  const grp = (id: string) => (live.groups[0].includes(id) ? 'A' : 'B');
  if (sel) {
    return (
      <section className="ix-sec ix-esec ix-esec-detail">
        <h3 className="ix-h ix-esq-title">
          <button type="button" className="ix-back" onClick={() => setSel(null)} title="Zurück zu allen Teilnehmern" aria-label="Zurück zu allen Teilnehmern"><Icon name="navPrev" size={18} /></button>
          <span className="ix-crest" style={{ width: 26, height: 26 }}><AnyCrest g={g} id={sel} size={26} /></span>
          <span className="ix-esq-club">{indoorName(g, sel)}</span>
        </h3>
        <div className="ix-esq-meta">
          <span className="ix-sq-tag" title="Kaderwahl für dieses Turnier">{squads.get(sel)?.length ? squadLabel(g, t, sel) : 'Vereinsauswahl'}</span>
          <span className="ix-dim">Hallenstärke <b>{Math.round(live.strength[sel])}</b> · Gruppe {grp(sel)}</span>
        </div>
        <div className="ix-scroll"><EntrantSquad g={g} id={sel} squad={squads.get(sel)} strength={live.strength[sel]} /></div>
      </section>
    );
  }
  return (
    <section className="ix-sec ix-esec">
      <h3 className="ix-h">Teilnehmer<span className="ix-h-note">Klick zeigt den Hallenkader</span></h3>
      <div className="ix-scroll">
        <div className="rl rl-sm ix-entrants">
          {ids.map((id, i) => (
            <button type="button" key={id} className={`rl-row ix-erow ix-epick ${id === mid ? 'me' : ''}`} onClick={() => setSel(id)} data-entrant={id}>
              <span className="rl-rank">{i + 1}</span>
              <span className={`ix-club ${id === mid ? 'me' : ''}`}>
                <span className="ix-crest" style={{ width: 26, height: 26 }}><AnyCrest g={g} id={id} size={26} /></span>
                <span className="ix-name">{indoorName(g, id)}</span>
              </span>
              <span className="ix-dim">Gruppe {grp(id)}</span>
              <span className="rl-num rl-main" style={{ color: vColor(live.strength[id]) }}>{Math.round(live.strength[id])}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
