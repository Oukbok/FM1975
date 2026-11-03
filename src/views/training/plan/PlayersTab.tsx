// =============================================================================
// Training › Trainingsplan › Individuelle Spieler (Vorbild EA FM): je Spieler das
// aktuelle Trainingsziel (Mannschaftstraining oder eine Zusatzposition), der
// Fortschritt dorthin (Vertrautheit bis zur Trainingsgrenze 85), Fitness/Frische
// und Förderspieler. Logik: engine/positionSkill.ts (Positionstraining),
// game/staffGame.ts (Förderspieler) – hier nur Anzeige und Auswahl.
// =============================================================================
import { useState } from 'react';
import PlayerModal from '../../../components/PlayerModal';
import { PlayerFitness, PlayerFreshness } from '../../../components/status';
import { POSITION_GROUPS, Player, Position, PositionGroup } from '../../../types';
import { positionSuitability, POSITION_NAMES_DE } from '../../../engine/positions';
import { rankedPositions, setTrainingPosition, skillOf, skillTier, TIER_DE, TRAIN_CAP } from '../../../engine/positionSkill';
import { Game } from '../../../game/state';
import { MAX_FOERDER, setFoerder } from '../../../game/staffGame';
import { trainingTargets } from '../../../components/player/profileData';
import { ATTR_DE } from '../../../components/player/shared';
import { DashBox, DashPage } from '../../../ui/DashPage';
import { InfoTip } from '../../../ui/InfoTip';
import { ScoutStars, squadOf } from '../../shared';
import Icon from '../../../components/Icon';
import { byPosition } from './model';
import PosBadge from '../../../components/PosBadge';

const GROUPS: { id: PositionGroup | 'all'; label: string }[] = [
  { id: 'all', label: 'Alle Spieler' }, { id: 'GK', label: 'Torhüter' }, { id: 'DEF', label: 'Abwehr' },
  { id: 'MID', label: 'Mittelfeld' }, { id: 'ATT', label: 'Angriff' },
];
let lastGroup: PositionGroup | 'all' = 'all';

export function PlayersTab({ g, refresh }: { g: Game; refresh: () => void }) {
  const [grp, setGrpState] = useState<PositionGroup | 'all'>(lastGroup);
  const [sel, setSel] = useState<string | null>(null);
  const setGrp = (v: PositionGroup | 'all') => { lastGroup = v; setGrpState(v); };
  const today = g.calendar.currentDate;
  const squad = squadOf(g).filter((p) => grp === 'all' || POSITION_GROUPS[p.naturalPosition] === grp).sort(byPosition);
  const all = squadOf(g);
  const foerder = g.foerderSpieler ?? [];
  const training = all.filter((p) => p.positionSkill?.train);
  const focus = all[0] ? [...trainingTargets(g, all.find((p) => p.naturalPosition !== 'TW') ?? all[0])].slice(0, 6).map((k) => ATTR_DE[k]) : [];

  const setTarget = (p: Player, v: string) => { setTrainingPosition(p, v ? (v as Position) : null, today); refresh(); };
  const toggleFoerder = (id: string) => {
    setFoerder(g, foerder.includes(id) ? foerder.filter((x) => x !== id) : [...foerder, id]);
    refresh();
  };
  const stopAll = () => { for (const p of training) setTrainingPosition(p, null, today); refresh(); };
  const selP = sel ? g.players[sel] : null;

  return (
    <DashPage rows={1} className="tr3-players">
      <DashBox title="Individuelle Spieler" icon="squad" span={3} flush info="positionstraining"
        right={<span className="tp-weeknav">
          <select className="tt-select" value={grp} onChange={(e) => setGrp(e.target.value as PositionGroup | 'all')}>
            {GROUPS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
          </select>
        </span>}>
        <div className="tr3-tablewrap">
          <table className="dtable rl-players tr3-ptable">
            <thead>
              <tr>
                <th>Pos.</th><th>Name</th><th className="r">Alter</th><th className="r">Stärke</th><th>Talent</th>
                <th title="Förderspieler">Förderung<InfoTip k="foerderspieler" /></th>
                <th>Aktuelles Trainingsziel</th><th>Fortschritt</th>
                <th className="c">Fitness</th><th className="c">Frische</th>
              </tr>
            </thead>
            <tbody>
              {squad.map((p) => {
                const t = p.positionSkill?.train ?? null;
                const v = t ? skillOf(p, t) : 0;
                const pct = t ? Math.min(100, Math.round((v / TRAIN_CAP) * 100)) : 0;
                const isF = foerder.includes(p.id);
                const options = rankedPositions(p, positionSuitability).map((r) => r.pos).filter((pos) => pos !== p.naturalPosition);
                return (
                  <tr key={p.id} data-pid={p.id} className={p.injury ? 'tr3-inj' : ''}>
                    <td><PosBadge p={p} /></td>
                    <td className="rl-name"><button className="tr3-namebtn" onClick={() => setSel(p.id)}>{p.fullName}</button></td>
                    <td className="r muted">{p.age}</td>
                    <td className="r">{Math.round(p.overall)}</td>
                    <td><ScoutStars p={p} /></td>
                    <td>
                      <button className={`tr3-star ${isF ? 'on' : ''}`} disabled={!isF && foerder.length >= MAX_FOERDER}
                        onClick={() => toggleFoerder(p.id)} title={isF ? 'Förderung beenden' : 'Als Förderspieler wählen'}>
                        <Icon name="trendUp" size={16} />{isF ? 'Gefördert' : 'Fördern'}
                      </button>
                    </td>
                    <td>
                      {p.injury ? <span className="tr3-injtxt">verletzt · noch {p.injury.daysRemaining} Tage</span> : (
                        <select className="tt-select tr3-target" value={t ?? ''} onChange={(e) => setTarget(p, e.target.value)}>
                          <option value="">Mannschaftstraining</option>
                          {options.map((pos) => <option key={pos} value={pos}>{POSITION_NAMES_DE[pos]} ({Math.round(skillOf(p, pos))})</option>)}
                        </select>
                      )}
                    </td>
                    <td>
                      {t ? (
                        <span className="tr3-prog" title={`Vertrautheit als ${POSITION_NAMES_DE[t]}: ${Math.round(v)} – Training allein bis ${TRAIN_CAP}`}>
                          <span className="tr3-prog-bar"><i style={{ width: `${pct}%` }} /></span>
                          <span className="tr3-prog-txt">{pct} % · {TIER_DE[skillTier(v)]}</span>
                        </span>
                      ) : <span className="muted">Wochenplan</span>}
                    </td>
                    <td className="c"><PlayerFitness p={p} showValue /></td>
                    <td className="c"><PlayerFreshness p={p} showValue /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="tr3-pfoot">
          <div className="tr3-pfoot-col">
            <span className="tr3-sec">Trainingsziele</span>
            <span className="tr3-ptext">{training.length ? `${training.length === 1 ? 'Ein Spieler lernt' : `${training.length} Spieler lernen`} eine Zusatzposition.` : 'Niemand trainiert eine Zusatzposition.'} Training allein bringt die Vertrautheit bis {TRAIN_CAP}, den Rest holt sich der Spieler mit Einsätzen.</span>
            <button className="tr3-btn" disabled={!training.length} onClick={stopAll}>Positionstraining für alle beenden</button>
          </div>
          <div className="tr3-pfoot-col">
            <span className="tr3-sec">Förderspieler {foerder.length}/{MAX_FOERDER}</span>
            <span className="tr3-ptext">Bekommen +25 % Entwicklungstempo, der übrige Kader etwas weniger Aufmerksamkeit (−3 %).</span>
          </div>
          <div className="tr3-pfoot-col">
            <span className="tr3-sec">Mannschaftstraining fördert diese Woche</span>
            <span className="tr3-ptext">{focus.length ? focus.join(', ') : '—'}</span>
          </div>
        </div>
      </DashBox>
      {selP && <PlayerModal player={selP} club={g.clubs[g.managedClubId]} squad={all} today={today} season={g.season} onClose={() => { setSel(null); refresh(); }} />}
    </DashPage>
  );
}
