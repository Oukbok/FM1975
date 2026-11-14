// =============================================================================
// Wirkung: Trainerteam → Niveau, Trainingsqualität und was das für einzelne
// Spieler heißt (Decke des Potenzials, Lerntempo); übriger Stab → Verletzungen,
// Reha, Regeneration, Scouting, Reichweite, Spielstärke.
// =============================================================================
import { STAFF_CAPS } from '../../data/staff';
import { memberLevel, NO_HEAD_PENALTY, MISSING_ASSIST_PENALTY } from '../../engine/coaching';
import { yearOf } from '../../engine/economy';
import { coachingOutlook, type OutlookRow } from '../../game/coachingGame';
import type { Game } from '../../game/state';
import { staffEffectsOf, staffStrengthOf } from '../../game/staffGame';
import { PlayerLink } from '../../components/playerMenu/PlayerLink';
import { Meter } from '../../ui/DashPage';
import { Level, type StaffScope } from './staffUi';

const pct = (v: number) => `${v >= 0 ? '+' : '−'}${Math.abs(Math.round(v * 100))} %`;

function PlayerRows({ rows, text }: { rows: OutlookRow[]; text: (r: OutlookRow) => string }) {
  return (
    <>
      {rows.slice(0, 5).map((r) => (
        <div key={r.p.id} className="sf-fx-row" data-pid={r.p.id}>
          <span className="sf-fx-name"><PlayerLink id={r.p.id}>{r.p.fullName}</PlayerLink></span>
          <span className="sf-fx-ov">{r.p.overall}</span>
          <span className="sf-fx-txt">{text(r)}</span>
        </div>
      ))}
      {rows.length > 5 && <div className="sf-fx-more">und {rows.length - 5} weitere</div>}
    </>
  );
}

export function StaffEffectsPanel({ g, scope }: { g: Game; scope: StaffScope }) {
  if (scope === 'club') {
    const fx = staffEffectsOf(g);
    const ss = staffStrengthOf(g);
    const p = (ss.factor - 1) * 100;
    return (
      <div className="sf-fx">
        <div className="sf-sg-h">Wirkung des Stabs</div>
        <Meter label="Spielstärke" info="stabSpielstaerke" value={Math.min(1, ss.coverage)} max={1}
          text={`${p >= 0 ? '+' : '−'}${Math.abs(p).toLocaleString('de-DE', { maximumFractionDigits: 1, minimumFractionDigits: 1 })} %`} color={p < -1.5 ? 'var(--orange)' : undefined} />
        <Meter label="Verletzungsrisiko" value={fx.injuryReduction} max={STAFF_CAPS.injuryReduction} text={`−${Math.round(fx.injuryReduction * 100)} %`} />
        <Meter label="Ausfallzeit" value={fx.rehabReduction} max={STAFF_CAPS.rehabReduction} text={`−${Math.round(fx.rehabReduction * 100)} %`} />
        <Meter label="Regeneration" value={fx.recovery} max={STAFF_CAPS.recovery} text={`+${fx.recovery.toFixed(1)}/Tag`} />
        <Meter label="Scouting" value={fx.scouting} max={STAFF_CAPS.scouting} text={`+${Math.round(fx.scouting * 100)} %`} />
        <Meter label="Reichweite" info="reichweite" value={fx.reach} max={STAFF_CAPS.reach} text={`+${Math.round(fx.reach * 100)} %`} />
        <p className="sf-fx-note">Je besser jemand für seine Stelle geeignet ist, desto mehr trägt er bei – die Wirkungen sind nach oben begrenzt. Ärzte, Physiotherapeuten und Scouts findest du wie alle anderen auf dem Arbeitsmarkt: Stelle wählen, die Liste ordnet sich nach Eignung.</p>
      </div>
    );
  }
  const year = yearOf(g.calendar.currentDate);
  const o = coachingOutlook(g);
  const t = o.team;
  return (
    <div className="sf-fx">
      <div className="sf-sg-h">Niveau des Trainerteams</div>
      <div className="sf-fx-line"><span>Cheftrainer{t.head ? ` · ${t.head.name}` : ''}</span><i>zählt 65 %</i><Level v={t.head ? Math.round(t.headLevel) : null} /></div>
      <div className="sf-fx-line"><span>Co-Trainer · {t.assistants.length} von {t.need} gebraucht</span><i>zählt 35 %</i><Level v={t.assistants.length ? Math.round(t.assistLevel) : null} /></div>
      <div className="sf-fx-line sum"><span>Niveau für Feldspieler</span><i>{o.rank}. von {o.of} in der Liga</i><Level v={Math.round(t.level)} /></div>
      <div className="sf-fx-line"><span>Torhüter{t.gkCoach ? ` · ${t.gkCoach.name}` : year < 1980 ? ' · noch ohne Torwarttrainer' : ' · kein Torwarttrainer'}</span><i>{t.gkCoach ? `Torwarttrainer ${Math.round(memberLevel(t.gkCoach, year))}` : ''}</i><Level v={Math.round(t.gkLevel)} /></div>

      <div className="sf-sg-h">Trainingsqualität</div>
      <div className="sf-fx-line"><span>Güte der Trainer</span><i>Chef-, Co-, Fitness-, Torwarttrainer</i><b>{pct(t.quality)}</b></div>
      <div className={`sf-fx-line ${t.penalty < 0 ? 'neg' : ''}`}><span>Besetzung</span>
        <i>{!t.head ? `kein Cheftrainer (${pct(-NO_HEAD_PENALTY)})` : ''}{!t.head && t.missing ? ', ' : ''}{t.missing ? `${t.missing} Co-Trainer ${t.missing === 1 ? 'fehlt' : 'fehlen'} (${pct(-t.missing * MISSING_ASSIST_PENALTY)})` : ''}{t.head && !t.missing ? 'vollständig' : ''}</i>
        <b>{pct(t.penalty)}</b></div>

      <div className="sf-sg-h">Gebremst <span>· Potenzial über dem Niveau der Trainer</span></div>
      {o.limited.length
        ? <PlayerRows rows={o.limited} text={(r) => `bräuchte ${Math.round(r.need)} · etwa ${Math.max(1, Math.round(r.cut))} ${Math.round(r.cut) <= 1 ? 'Punkt bleibt' : 'Punkte bleiben'} liegen`} />
        : <div className="sf-fx-none">Niemand – das Trainerteam reicht für das Potenzial des ganzen Kaders.</div>}

      <div className="sf-sg-h">Lernen viel <span>· Trainer klar über ihrem Niveau</span></div>
      {o.learners.length
        ? <PlayerRows rows={o.learners} text={(r) => `Lerntempo ${pct(r.teach - 1)}`} />
        : <div className="sf-fx-none">Kein Spieler profitiert besonders.</div>}

      {o.stalled.length > 0 && <>
        <div className="sf-sg-h">Unterfordert <span>· über dem Niveau der Trainer</span></div>
        <PlayerRows rows={o.stalled} text={(r) => `Lerntempo ${pct(r.teach - 1)}`} />
      </>}
      <p className="sf-fx-note">Gerechnet mit deiner Einschätzung des Potenzials (Sterne) – das wahre Potenzial kennt niemand genau.</p>
    </div>
  );
}
