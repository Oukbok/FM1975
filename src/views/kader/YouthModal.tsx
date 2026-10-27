import PlayerAvatar from '../../components/PlayerAvatar';
import { makeMessage, pushMessage } from '../../engine/messages';
import { promoteYouth } from '../../engine/youth';
import { Game } from '../../game/state';
import { ATTRIBUTE_LABELS_DE, Club, Player, YOUTH_AGE_CLASS_LABEL, YOUTH_AGE_CLASS_RANGE, renderStars, starsToPotential, youthAgeClass } from '../../types';
import { vColor } from '../../ui/format';
import { ScoutRange } from './YouthView';
import { useState } from 'react';

export const YOUTH_ATTR_GROUPS: { title: string; keys: (keyof Player['attributes'])[] }[] = [
  { title: 'Technisch', keys: ['technique', 'firstTouch', 'shooting', 'shotPower', 'longShots', 'passing', 'longPassing', 'crossing', 'dribbling', 'ballControl', 'heading'] },
  { title: 'Defensiv', keys: ['tackling', 'marking', 'positioning', 'interceptions'] },
  { title: 'Physisch', keys: ['stamina', 'speed', 'acceleration', 'strength', 'jumping', 'agility', 'balance'] },
  { title: 'Mental', keys: ['vision', 'composure', 'concentration', 'decisions', 'workRate', 'teamwork', 'flair'] },
];

export const YOUTH_GK_GROUP: { title: string; keys: (keyof Player['attributes'])[] } =
  { title: 'Torwart', keys: ['reflexes', 'handling', 'kicking', 'aerialReach', 'oneOnOnes', 'communication'] };

export function YouthModal({ g, player, club, onClose, onChange }: {
  g: Game; player: Player; club: Club; onClose: () => void; onChange: () => void;
}) {
  const [msg, setMsg] = useState<string | null>(null);
  const p = player;
  const groups = p.naturalPosition === 'TW' ? [YOUTH_GK_GROUP, ...YOUTH_ATTR_GROUPS] : YOUTH_ATTR_GROUPS;
  const squadFull = club.playerIds.length >= 26;

  const doPromote = () => {
    const res = promoteYouth(club, p.id, g.players, g.youthPlayers, 26);
    if (res.ok) {
      pushMessage(g.messages, makeMessage({
        date: g.calendar.currentDate, category: 'training', from: 'Leiter Jugendakademie',
        subject: `${p.fullName} in den Profikader hochgezogen`,
        shortText: `${p.fullName} ist jetzt Teil der A-Mannschaft.`,
        bodyText: `${p.fullName} (${p.naturalPosition}, ${p.age} Jahre) wurde aus der Jugendakademie in den Profikader hochgezogen. `
          + `Das endgültige Potenzial steht nun fest: ${renderStars(p.potentialStars)} (max. Gesamtstärke ${starsToPotential(p.potentialStars)}).`,
      }));
      onChange();
      onClose();
    } else {
      setMsg(res.reason ?? 'Hochziehen nicht möglich');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', gap: 18, padding: 20, borderBottom: '1px solid var(--border)',
          background: `linear-gradient(120deg, ${club.colors.primary}22, transparent)` }}>
          <div style={{ flexShrink: 0 }}>
            <PlayerAvatar player={p} club={club} size="large" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="row" style={{ alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: 24 }}>{p.fullName}</h2>
                <div className="dim mt8" style={{ fontSize: 14 }}>
                  {(() => { const cls = youthAgeClass(p.age); return cls ? `${YOUTH_AGE_CLASS_LABEL[cls]} (${YOUTH_AGE_CLASS_RANGE[cls]})` : 'Jungtalent'; })()}
                  {' '}&middot; {p.naturalPosition} &middot; {p.age} Jahre &middot; {p.nationality}
                </div>
                <div className="mt8" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span className="pill" style={{ color: vColor(p.overall) }}>OVR <b style={{ marginLeft: 4 }}>{p.overall}</b></span>
                  <span className="pill">Potenzial (Scouting): <span style={{ marginLeft: 6 }}><ScoutRange p={p} /></span></span>
                  <span className="pill">{p.height} cm · {p.weight} kg</span>
                </div>
              </div>
              <button className="modal-close" onClick={onClose}>×</button>
            </div>
          </div>
        </div>

        <div style={{ padding: '14px 20px 22px', overflowY: 'auto' }}>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="dim mini">
              🔎 <b>Verstecktes Potenzial:</b> Die Scouts schätzen das Potenzial dieses Talents auf eine Spanne
              von <b>{(p.scoutedPotentialMin ?? p.potentialStars).toFixed(2)}</b> bis
              <b> {(p.scoutedPotentialMax ?? p.potentialStars).toFixed(2)}</b> Sternen. Je länger das Talent gefördert wird
              (und je besser die Akademie), desto genauer wird diese Einschätzung – bis der wahre Wert feststeht.
            </div>
          </div>

          {groups.map((grp) => (
            <div key={grp.title} style={{ marginBottom: 12 }}>
              <div className="section-title" style={{ fontSize: 13, marginBottom: 6 }}>{grp.title}</div>
              <div className="youth-attr-grid">
                {grp.keys.map((k) => {
                  const val = p.attributes[k] as number;
                  return (
                    <div key={k} className="youth-attr-row">
                      <span className="youth-attr-label">{ATTRIBUTE_LABELS_DE[k]}</span>
                      <span className="attr-bar" style={{ flex: 1 }}>
                        <span className="attr-bar-fill" style={{ width: `${val}%`, background: vColor(val), display: 'block', height: '100%' }} />
                      </span>
                      <b style={{ color: vColor(val), width: 24, textAlign: 'right' }}>{val}</b>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="card" style={{ marginTop: 8 }}>
            <div className="row" style={{ alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700 }}>Hochziehen in den Profikader</div>
                <div className="dim mini">
                  {squadFull
                    ? 'Der Profikader ist voll (max. 26 Spieler). Gib zuerst einen Spieler ab.'
                    : 'Übernimmt das Talent in die A-Mannschaft. Das Potenzial wird dabei offengelegt.'}
                </div>
                {msg && <div className="red mini mt8">{msg}</div>}
              </div>
              <button className="btn" disabled={squadFull} onClick={doPromote} style={{ marginLeft: 'auto' }}>
                ⬆ Hochziehen
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
