import { scoutRange, scoutRangeText } from '../../engine/scouting';
import PlayerModal from '../../components/PlayerModal';
import { createPortal } from 'react-dom';
import { makeMessage, pushMessage } from '../../engine/messages';
import { promoteYouth } from '../../engine/youth';
import { Game } from '../../game/state';
import { Club, Player, YOUTH_AGE_CLASS_LABEL, YOUTH_AGE_CLASS_RANGE, youthAgeClass } from '../../types';
import { fmtPrice } from '../../ui/format';
import { yearOf } from '../../engine/economy';
import { minYouthMoveAge, protectionAvailable, protectionCost, youthCompensation } from '../../engine/youthScouting';
import { approachForeignYouth, approachedThisSeason, protectOwnYouth } from '../../game/youthMarket';
import { DashBox, KV, Meter } from '../../ui/DashPage';
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
    const res = promoteYouth(club, p.id, g.players, g.youthPlayers, 26, g.calendar.currentDate);
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
  const squad = club.youthPlayerIds.map((id) => g.youthPlayers[id]).filter(Boolean) as Player[];

  // Gleiches Profil wie Profis (PlayerModal); Jugend-Aktionen im ersten Reiter „Akademie“.
  const academy = (
    <div className="mx-grid pp-youth-grid">
      <DashBox title="Jugend" icon="youth">
        <KV k="Altersklasse" v={cls ? `${YOUTH_AGE_CLASS_LABEL[cls]} · ${YOUTH_AGE_CLASS_RANGE[cls]}` : 'Jungtalent'} strong />
        <KV k="Verein" v={club.name} />
        <div className="dsec">Scouting</div>
        <Meter label="Potenzial-Spanne" value={smax - smin} max={2} text={`${smin.toLocaleString('de-DE')}–${smax.toLocaleString('de-DE')}`} />
        <div className="dnote">Das wahre Potenzial ist verborgen. Mit zunehmendem Alter und besserer Akademie wird die Spanne enger.</div>
      </DashBox>
      {foreign ? (
        <DashBox title="Ansprechen" icon="negotiations">
          <KV k="Ausbildungsentschädigung" v={fmtPrice(youthCompensation(p, year))} />
          <KV k="Mindestalter für Wechsel" v={`${minYouthMoveAge(year)} Jahre`} />
          <div className="dnote mt8">Vereine geben ihre größten Talente ungern frei, und nicht jeder Jugendliche will umziehen. Pro Saison hast du einen Versuch.</div>
          {msg && <div className="dnote mt8" style={{ color: 'var(--accent)' }}>{msg}</div>}
          <button className="btn btn-primary mt8" disabled={approachedThisSeason(g, p.id)} onClick={() => { setMsg(approachForeignYouth(g, p.id)); onChange(); }}>
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
          <button className="btn btn-primary mt8" disabled={squadFull} onClick={doPromote}>In den Profikader hochziehen</button>
          {protectionAvailable(year) && (
            <>
              <div className="dsec">Fördervertrag</div>
              <KV k="Status" v={protectedNow(p) ? `geschützt bis ${p.development.protectedUntil! + 1}` : 'ungeschützt'} color={protectedNow(p) ? 'var(--green)' : undefined} />
              <KV k="Kosten / Jahr" v={fmtPrice(protectionCost(p))} />
              <button className="btn mt8" disabled={protectedNow(p)} onClick={() => { setMsg(protectOwnYouth(g, p.id)); onChange(); }}>Fördervertrag anbieten</button>
            </>
          )}
        </DashBox>
      )}
    </div>
  );

  return createPortal(
    <PlayerModal player={p} club={club} squad={squad} today={g.calendar.currentDate} season={g.season} onClose={onClose}
      tag={cls ? YOUTH_AGE_CLASS_LABEL[cls] : 'Jugend'}
      extraTab={{ label: foreign ? 'Scouting' : 'Akademie', content: academy }} />,
    document.body,
  );
}
