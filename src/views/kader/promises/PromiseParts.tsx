// Erstes Training: Bausteine (Szene, Zuhörer-Karte, Versprechen-Karte, Stand-Zeile).
import { useState } from 'react';
import PlayerAvatar from '../../../components/PlayerAvatar';
import { MoraleIcon } from '../../../components/status';
import { SP_DEF, reactionLine, reactionMood, reactionScale, realismWord, type Reaction, type SeasonPromiseDef } from '../../../engine/seasonPromises';
import { SP_WORD, type Listener, type SPStatus, type SeasonPromisePick } from '../../../game/seasonPromisesGame';
import type { Club } from '../../../types';

/** Einleitung je Epoche (Ort und Stimmung des ersten Trainings). */
export function eraIntro(year: number): string {
  if (year < 1980) return 'Aschenplatz, Hütchen, eine Trillerpfeife: Die Spieler stehen im Halbkreis vor dir, einige blinzeln noch aus dem Urlaub. Viele neue Gesichter – und alle warten, was der Trainer zu sagen hat.';
  if (year < 1990) return 'Rasenplatz am Vereinsgelände, ein paar Kiebitze am Zaun und die Lokalpresse mit Notizblock. Die Mannschaft steht vor dir. Was gibst du ihr für die neue Saison mit auf den Weg?';
  if (year < 2000) return 'Trainingsauftakt vor Hunderten Fans, Kameras des Regionalfernsehens am Rand. Die Spieler sind zurück aus dem Urlaub und hören dir zu – jedes Wort steht morgen in der Zeitung.';
  if (year < 2012) return 'Leistungsdiagnostik ist erledigt, der Platz ist frisch gemäht, die Pressestelle filmt mit. Die Mannschaft versammelt sich um dich. Welche Ansage machst du zum Saisonstart?';
  return 'Trainingszentrum, Pulsgurte, Drohnenkamera – und der Livestream läuft. Die Spieler stehen vor dir, jeder Satz landet in Minuten in den sozialen Medien. Was versprichst du für die Saison?';
}

/** Bild-Slot `public/assets/promises/erstes-training.webp`; ohne Datei eine gezeichnete Szene. */
export function TrainingScene({ year }: { year: number }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="ft-scene" aria-hidden>
      {!failed ? <img src="assets/promises/erstes-training.webp" alt="" draggable={false} onError={() => setFailed(true)} /> : (
        <svg viewBox="0 0 400 120" preserveAspectRatio="xMidYMid slice">
          <rect width="400" height="120" className="ft-sc-sky" />
          <path d="M0 70 L400 58 L400 120 L0 120 Z" className={year < 1980 ? 'ft-sc-ash' : 'ft-sc-turf'} />
          <path d="M0 96 L400 82" className="ft-sc-line" />
          <path d="M120 120 L170 64 M300 120 L262 60" className="ft-sc-line" />
          {[60, 110, 160, 210, 260, 310].map((x, i) => <path key={x} d={`M${x} ${92 - i * 2} l5 -9 l5 9 Z`} className="ft-sc-cone" />)}
          <rect x="330" y="34" width="46" height="26" className="ft-sc-goal" />
          <path d="M20 60 L20 30 L80 30 L80 58" className="ft-sc-fence" />
        </svg>
      )}
    </div>
  );
}

export function ListenerCard({ l, r, picks, club, k }: { l: Listener; r: Reaction; picks: number; club: Club; k: number }) {
  const mood = reactionMood(r.total);
  const quiet = picks === 0;
  return (
    <div className={`ft-face ${quiet ? 'quiet' : `m-${mood}`}`} style={{ ['--k' as string]: k }} data-pid={l.p.id}>
      <div className="ft-face-img"><PlayerAvatar player={l.p} club={club} size={64} /></div>
      <div className="ft-face-name">{l.p.lastName}</div>
      <div className="ft-face-role">{l.role}</div>
      <div className="ft-face-react">
        {quiet ? <span className="ft-face-word">hört zu</span> : <>
          <MoraleIcon value={reactionScale(r.total)} size={18} />
          <span className="ft-face-word">{mood}</span>
        </>}
      </div>
      {!quiet && <div className="ft-face-say">{reactionLine(r, picks)}</div>}
    </div>
  );
}

export function PromiseCard({ def, on, why, realism, disabled, onToggle }: {
  def: SeasonPromiseDef; on: boolean; why?: string; realism: number; disabled: boolean; onToggle: () => void;
}) {
  const word = def.cat === 'ziele' ? realismWord(realism) : undefined;
  const blocked = !!why;
  return (
    <button type="button" role="checkbox" aria-checked={on} disabled={blocked || (disabled && !on)}
      className={`ft-card ${on ? 'on' : ''} ${blocked ? 'blocked' : ''}`} onClick={onToggle} data-sp={def.id}>
      <span className="ft-box" aria-hidden />
      <span className="ft-card-main">
        <span className="ft-card-label">{def.label}{word && <span className="ft-tag">{word}</span>}</span>
        <span className="ft-card-check">{why ?? def.check}</span>
      </span>
    </button>
  );
}

/** Eine Zeile „Versprechen – Stand“ (Kabine, Archiv). */
export function PromiseLine({ pick, st }: { pick: SeasonPromisePick; st: SPStatus }) {
  return (
    <div className={`ft-line s-${st.s}`}>
      <span className="ft-line-dot" aria-hidden />
      <span className="ft-line-main">
        <span className="ft-line-label">{SP_DEF[pick.id].label}</span>
        {st.text && <span className="ft-line-text">{st.text}</span>}
      </span>
      <span className="ft-line-state">{SP_WORD[st.s]}</span>
    </div>
  );
}
