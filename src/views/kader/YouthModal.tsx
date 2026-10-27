import { scoutRange, scoutRangeText } from '../../engine/scouting';
import PlayerAvatar from '../../components/PlayerAvatar';
import { makeMessage, pushMessage } from '../../engine/messages';
import { promoteYouth } from '../../engine/youth';
import { Game } from '../../game/state';
import { ATTRIBUTE_LABELS_DE, Club, Player, YOUTH_AGE_CLASS_LABEL, YOUTH_AGE_CLASS_RANGE, youthAgeClass } from '../../types';
import { fmtPrice, vColor } from '../../ui/format';
import { yearOf } from '../../engine/economy';
import { minYouthMoveAge, protectionAvailable, protectionCost, youthCompensation } from '../../engine/youthScouting';
import { approachForeignYouth, approachedThisSeason, protectOwnYouth } from '../../game/youthMarket';
import { type IconName } from '../../components/Icon';
import { DashBox, KV, Kpi, Meter } from '../../ui/DashPage';
import { useState } from 'react';

export const YOUTH_ATTR_GROUPS: { title: string; keys: (keyof Player['attributes'])[] }[] = [
  { title: 'Technisch', keys: ['technique', 'firstTouch', 'shooting', 'shotPower', 'longShots', 'passing', 'longPassing', 'crossing', 'dribbling', 'ballControl', 'heading'] },
  { title: 'Defensiv', keys: ['tackling', 'marking', 'positioning', 'interceptions'] },
  { title: 'Physisch', keys: ['stamina', 'speed', 'acceleration', 'strength', 'jumping', 'agility', 'balance'] },
  { title: 'Mental', keys: ['vision', 'composure', 'concentration', 'decisions', 'workRate', 'teamwork', 'flair'] },
];

export const YOUTH_GK_GROUP: { title: string; keys: (keyof Player['attributes'])[] } =
  { title: 'Torwart', keys: ['reflexes', 'handling', 'kicking', 'aerialReach', 'oneOnOnes', 'communication'] };

export function YouthModal({ g, player, club, onClose, onChange, foreign = false }: {
  g: Game; player: Player; club: Club; onClose: () => void; onChange: () => void;
  /** Talent eines anderen Vereins (aus dem Scouting): Ansprechen statt Hochziehen. */
  foreign?: boolean;
}) {
  const [msg, setMsg] = useState<string | null>(null);
  const year = yearOf(g.calendar.currentDate);
  const protectedNow = (p0: Player) => (p0.development.protectedUntil ?? 0) > (Number(g.calendar.currentDate.slice(5, 7)) >= 7 ? year : year - 1);
  const p = player;
  const squadFull = club.playerIds.length >= 26;

  const doPromote = () => {
    const res = promoteYouth(club, p.id, g.players, g.youthPlayers, 26);
    if (res.ok) {
      pushMessage(g.messages, makeMessage({
        date: g.calendar.currentDate, category: 'training', from: 'Leiter Jugendakademie',
        subject: `${p.fullName} in den Profikader hochgezogen`,
        shortText: `${p.fullName} ist jetzt Teil der A-Mannschaft.`,
        bodyText: `${p.fullName} (${p.naturalPosition}, ${p.age} Jahre) wurde aus der Jugendakademie in den Profikader hochgezogen. `
          + `Die Scouts schätzen sein Potenzial auf ${scoutRangeText(p)}.`,
      }));
      onChange();
      onClose();
    } else {
      setMsg(res.reason ?? 'Hochziehen nicht möglich');
    }
  };

  const cls = youthAgeClass(p.age);
  const [smin, smax] = scoutRange(p);
  const AttrBox = ({ title, icon, sets }: { title: string; icon: IconName; sets: typeof YOUTH_ATTR_GROUPS }) => (
    <DashBox title={title} icon={icon}>
      {sets.map((grp) => (
        <div key={grp.title}>
          {sets.length > 1 && <div className="dsec">{grp.title}</div>}
          {[...grp.keys].sort((a, b) => ATTRIBUTE_LABELS_DE[a].localeCompare(ATTRIBUTE_LABELS_DE[b], 'de')).map((k) => {
            const val = p.attributes[k] as number;
            return <Meter key={k} label={ATTRIBUTE_LABELS_DE[k]} value={val} color={vColor(val)} text={val} />;
          })}
        </div>
      ))}
    </DashBox>
  );
  const [tech, def, phys, ment] = YOUTH_ATTR_GROUPS;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mx-head" style={{ background: `linear-gradient(120deg, ${club.colors.primary}22, transparent 70%)` }}>
          <PlayerAvatar player={p} club={club} size="large" />
          <div>
            <div className="mx-sub">{cls ? `${YOUTH_AGE_CLASS_LABEL[cls]} · ${YOUTH_AGE_CLASS_RANGE[cls]}` : 'Jungtalent'} · Jugendakademie {club.name}{foreign ? ' · Scouting-Bericht' : ''}</div>
            <h2>{p.fullName}</h2>
          </div>
          <div className="mx-kpis">
            <Kpi value={p.overall} label="Stärke" color={vColor(p.overall)} />
            <Kpi value={scoutRangeText(p)} label="Potenzial (Scouting)" color="var(--yellow)" />
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="mx-body mx-grid">
          <DashBox title="Steckbrief" icon="youth">
            <KV k="Position" v={p.naturalPosition} strong />
            <KV k="Alter" v={`${p.age} Jahre`} />
            <KV k="Herkunft" v={p.nationality} />
            <KV k="Größe · Gewicht" v={`${p.height} cm · ${p.weight} kg`} />
            <div className="dsec">Scouting</div>
            <Meter label="Spanne" value={smax - smin} max={2} text={`${smin.toLocaleString('de-DE')}–${smax.toLocaleString('de-DE')}`} color="var(--yellow)" />
            <div className="dnote">Das wahre Potenzial ist verborgen. Mit zunehmendem Alter und besserer Akademie wird die Spanne enger.</div>
          </DashBox>

          <AttrBox title="Technik" icon="matchball" sets={[tech]} />
          <AttrBox title="Physis" icon="training" sets={[phys]} />

          {foreign ? (
            <DashBox title="Ansprechen" icon="negotiations">
              <KV k="Verein" v={club.name} strong />
              <KV k="Ausbildungsentschädigung" v={fmtPrice(youthCompensation(p, year))} />
              <KV k="Mindestalter für Wechsel" v={`${minYouthMoveAge(year)} Jahre`} />
              <div className="dnote mt8">Vereine geben ihre größten Talente ungern frei, und nicht jeder Jugendliche will umziehen. Pro Saison hast du einen Versuch.</div>
              {msg && <div className="dnote mt8" style={{ color: 'var(--accent)' }}>{msg}</div>}
              <button className="dchip on mt8" disabled={approachedThisSeason(g, p.id)} onClick={() => { setMsg(approachForeignYouth(g, p.id)); onChange(); }}>
                {approachedThisSeason(g, p.id) ? 'Diese Saison schon angesprochen' : 'Talent ansprechen'}
              </button>
            </DashBox>
          ) : (
            <DashBox title="Hochziehen & Schutz" icon="squad">
              <KV k="Profikader" v={`${club.playerIds.length} / 26`} color={squadFull ? 'var(--red)' : undefined} />
              <div className="dnote mt8">{squadFull
                ? 'Der Profikader ist voll (max. 26 Spieler). Gib zuerst einen Spieler ab.'
                : 'Übernimmt das Talent in die A-Mannschaft. Die Scout-Einschätzung bleibt eine Spanne.'}</div>
              {msg && <div className="dnote mt8" style={{ color: 'var(--accent)' }}>{msg}</div>}
              <button className="dchip on mt8" disabled={squadFull} onClick={doPromote}>In den Profikader hochziehen</button>
              {protectionAvailable(year) && (
                <>
                  <div className="dsec">Fördervertrag</div>
                  <KV k="Status" v={protectedNow(p) ? `geschützt bis ${p.development.protectedUntil! + 1}` : 'ungeschützt'} color={protectedNow(p) ? 'var(--green)' : undefined} />
                  <KV k="Kosten / Jahr" v={fmtPrice(protectionCost(p))} />
                  <button className="dchip mt8" disabled={protectedNow(p)} onClick={() => { setMsg(protectOwnYouth(g, p.id)); onChange(); }}>Fördervertrag anbieten</button>
                </>
              )}
            </DashBox>
          )}

          <AttrBox title={p.naturalPosition === 'TW' ? 'Torwart & Abwehr' : 'Abwehr'} icon="tactics" sets={p.naturalPosition === 'TW' ? [YOUTH_GK_GROUP, def] : [def]} />
          <AttrBox title="Mental" icon="stats" sets={[ment]} />
        </div>
      </div>
    </div>
  );
}
