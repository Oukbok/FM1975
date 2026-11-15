// =============================================================================
// Statistiken › Auszeichnungen, oben: Goldener Ball des Jahres (Wunsch Pascal:
// standardmäßig oben zu sehen). Plätze 1–3 als Karten im Stil der Besten der
// Saison, darunter die Plätze 4–10 und „Gala ansehen“. Daten: game.goldenBall
// (game/goldenBallGame.ts), CSS 28-awards.css (.aw-*, .gbt-*).
// =============================================================================
import type { CSSProperties } from 'react';
import { ClubLink } from '../../../components/club/ClubLink';
import PosBadge from '../../../components/PosBadge';
import { NatFlag } from '../../../components/competition/CountryFlag';
import type { GBYear } from '../../../game/goldenBallGame';
import type { Game } from '../../../game/state';
import FaceThumb from '../../../components/FaceThumb';
import { AwardFace, AwardName, awardPerson, fmtGrade } from './AwardParts';

export function GoldenBallTop({ g, y, onGala }: { g: Game; y: GBYear; onGala: () => void }) {
  const mine = y.mine ?? g.managedClubId;
  return (
    <div className="aw-page-top">
      <div className="gbt-sub">
        <span>{y.title} {y.year} · Gala in {y.venue}</span>
        <span className="gbt-rule">{y.rule}</span>
        <button type="button" className="b3 b3-s" onClick={onGala}>Gala ansehen</button>
      </div>
      <div className="aw-grid compact gbt-grid">
        {y.top.slice(0, 3).map((e, i) => (
          <article key={e.p} className={`aw-card compact ${e.c === mine ? 'mine' : ''} ${i === 0 ? 'gbt-first' : ''}`} style={{ '--k': i } as CSSProperties}>
            <div className="aw-cat"><span>Platz {i + 1}</span>{e.est ? <span className="aw-tag" title="Spieler eines Auslandsvereins: Note aus Toren, Vorlagen und Stärke geschätzt">geschätzt</span> : null}</div>
            <div className="aw-hero">
              <AwardFace g={g} e={e} size={88} />
              <div className="aw-who">
                <AwardName e={e} />
                <div className="aw-meta"><NatFlag nat={e.nat} height={15} /><PosBadge pos={e.pos} /><span>{e.a} Jahre</span></div>
                <ClubLink id={e.c} className="aw-club"><span className="aw-club-name">{e.cn}</span></ClubLink>
              </div>
            </div>
            <div className="aw-kpis">
              {[['Spiele', String(e.ap)], ['Note', fmtGrade(e.g)], ['Tore', String(e.gl)], ['Vorlagen', String(e.as)]].map(([k, v]) => (
                <div key={k} className="aw-kpi"><b>{v}</b><span>{k}</span></div>
              ))}
            </div>
            {e.why && <p className="aw-why">{e.why}</p>}
          </article>
        ))}
        <div className="aw-card compact gbt-rest" style={{ '--k': 3 } as CSSProperties}>
          <div className="aw-cat"><span>Plätze 4 bis 10</span></div>
          <ol className="aw-rest" start={4}>
            {y.top.slice(3, 10).map((e, i) => (
              <li key={e.p} className={`aw-rest-face ${e.c === mine ? 'mine' : ''}`}>
                <span className="aw-rk">{i + 4}</span>
                <span className="aw-rest-who"><FaceThumb p={awardPerson(g, e.p)} size={24} /><AwardName e={e} cls="aw-rest-name" /></span>
                <span className="aw-rest-club">{e.cn}</span>
                <span className="aw-rest-val">{e.gl} T</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
