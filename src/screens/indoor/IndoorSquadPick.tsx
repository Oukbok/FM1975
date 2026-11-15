// =============================================================================
// Hallen-Show, Startseite: Hallenkader selbst wählen (Wunsch Pascal) – ein Torwart
// und 5–7 Feldspieler aus den einsatzfähigen Profis. Gezeigt werden die Werte, die
// in der Halle mehr zählen als draußen: der Hallenwert (engine/indoor.ts
// `indoorSkill` = 45 % Stärke + 55 % Ballgefühl/Technik/Wendigkeit) und seine
// Bausteine Technik, Ballannahme, Ballkontrolle, Dribbling, Wendigkeit, Antritt,
// Schuss, dazu die Frische. Vorlagen Stammkräfte/Gemischt/Nachwuchs wie bei der Zusage.
// Gespeichert als `IndoorTournament.ownIds` (game/indoorGame.ts `ownIndoorSquad`).
// Etikett „Hallenspezialist“ (Hallenruf, game/indoorRecords.ts), Hallenform aus dem Hallentraining.
// =============================================================================
import { PlayerLink } from '../../components/playerMenu/PlayerLink';
import PosBadge from '../../components/PosBadge';
import { INDOOR_SQUAD_LABEL, indoorSkill, indoorStrength, pickIndoorSquad, type IndoorSquad } from '../../engine/indoor';
import { INDOOR_PICK } from '../../game/indoorGame';
import type { Game } from '../../game/state';
import { HallTag } from './IndoorEntrants';
import type { Player, PlayerAttributes } from '../../types';
import { vColor } from '../../ui/format';

const COLS: [keyof PlayerAttributes, string, string][] = [
  ['technique', 'Tec', 'Technik'], ['firstTouch', 'Ann', 'Ballannahme'], ['ballControl', 'Bal', 'Ballkontrolle'],
  ['dribbling', 'Dri', 'Dribbling'], ['agility', 'Wen', 'Wendigkeit'], ['acceleration', 'Ant', 'Antritt'], ['shooting', 'Sch', 'Schuss'],
];

export function IndoorSquadPick({ g, cands, sel, onChange, drill = 0 }: { g: Game; cands: Player[]; sel: Player[]; onChange: (ids: string[]) => void; drill?: number }) {
  const ids = new Set(sel.map((p) => p.id));
  const tw = sel.filter((p) => p.naturalPosition === 'TW'), fp = sel.filter((p) => p.naturalPosition !== 'TW');
  const keepers = cands.filter((p) => p.naturalPosition === 'TW').sort((a, b) => b.overall - a.overall);
  const field = cands.filter((p) => p.naturalPosition !== 'TW').sort((a, b) => indoorSkill(b) - indoorSkill(a));
  const toggle = (p: Player) => {
    if (p.naturalPosition === 'TW') { onChange([p.id, ...fp.map((x) => x.id)]); return; }
    if (ids.has(p.id)) { if (fp.length > INDOOR_PICK.fieldMin) onChange(sel.filter((x) => x.id !== p.id).map((x) => x.id)); return; }
    if (fp.length < INDOOR_PICK.fieldMax) onChange([...sel.map((x) => x.id), p.id]);
  };
  const preset = (k: IndoorSquad) => onChange(pickIndoorSquad(cands, k).map((p) => p.id));
  const strength = Math.round(indoorStrength(sel) + drill);
  const row = (p: Player) => {
    const on = ids.has(p.id);
    const isTw = p.naturalPosition === 'TW';
    const locked = !on && !isTw && fp.length >= INDOOR_PICK.fieldMax;
    const sk = indoorSkill(p);
    return (
      <tr key={p.id} className={`${on ? 'on' : ''} ${locked ? 'locked' : ''}`} onClick={() => toggle(p)}
        title={on ? (isTw ? 'Torwart im Hallenkader' : fp.length <= INDOOR_PICK.fieldMin ? `Mindestens ${INDOOR_PICK.fieldMin} Feldspieler` : 'Aus dem Hallenkader nehmen') : locked ? `Höchstens ${INDOOR_PICK.fieldMax} Feldspieler` : 'In den Hallenkader nehmen'}>
        <td><span className={`ix-pick-box ${isTw ? 'radio' : ''}`} aria-hidden="true" /></td>
        <td><PosBadge p={p} compact /></td>
        <td className="ix-pick-name"><PlayerLink id={p.id}>{p.fullName}</PlayerLink><HallTag g={g} pid={p.id} /></td>
        <td className="num">{p.age}</td>
        <td className="num dim">{p.overall}</td>
        <td className="num ix-pick-hall" style={{ color: vColor(sk) }}>{Math.round(sk)}</td>
        {COLS.map(([k]) => <td key={k} className="num" style={{ color: isTw ? undefined : vColor(p.attributes[k] as number) }}>{isTw ? '–' : p.attributes[k] as number}</td>)}
        <td className="num dim">{Math.round(p.attributes.fitness)}</td>
      </tr>
    );
  };
  return (
    <div className="ix-pick">
      <div className="ix-pick-bar">
        <span className="ix-pick-count"><b>{tw.length}</b> Torwart · <b>{fp.length}</b> Feldspieler <span className="ix-dim">(1 + {INDOOR_PICK.fieldMin}–{INDOOR_PICK.fieldMax})</span></span>
        <span className="ix-pick-str">Hallenstärke <b style={{ color: vColor(strength) }}>{strength}</b>
          {drill > 0 && <span className="ix-dim ix-pick-drill" title="Hallentraining der letzten 14 Tage (Trainingsplan): je Einheit +0,5, höchstens +2"> inkl. +{drill.toLocaleString('de-DE')} Hallentraining</span>}</span>
        <span className="seg-group ix-pick-pre">
          {(['stars', 'mix', 'youth'] as IndoorSquad[]).map((k) => <button key={k} type="button" className="seg-btn" onClick={() => preset(k)}>{INDOOR_SQUAD_LABEL[k]}</button>)}
        </span>
      </div>
      <div className="ix-scroll">
        <table className="ix-pick-t">
          <thead><tr>
            <th /><th>Pos.</th><th>Spieler</th><th className="num">Alter</th><th className="num" title="Stärke draußen">Stä.</th>
            <th className="num" title="Hallenwert: 45 % Stärke + 55 % Technik, Ballgefühl, Wendigkeit, Antritt und Schuss">Halle</th>
            {COLS.map(([k, s, l]) => <th key={k} className="num" title={l}>{s}</th>)}
            <th className="num" title="Frische">Fri.</th>
          </tr></thead>
          <tbody>
            {keepers.map(row)}
            <tr className="ix-pick-gap"><td colSpan={6 + COLS.length} /></tr>
            {field.map(row)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
