// =============================================================================
// <CountryCups>: Spalte „Pokale des Landes“ neben der Pyramide (Statistiken › Ligensystem).
// Je Pokal Trophäe (Foto oder Zeichnung über <TrophyImage>), Name, Format kurz, Stand und
// Sieger; darunter der Platz des Landes in der Fünfjahreswertung mit den Startplätzen der
// Folgesaison. Daten: game/countryCups.ts, game/coefficients.ts.
// =============================================================================
import type { Game } from '../../game/state';
import type { CountryCup } from '../../game/countryCups';
import { fmtCoef, type CoefRow, type CoefTable } from '../../game/coefficients';
import { TrophyImage } from '../../views/club/trophies/TrophyImage';
import { TeamName } from '../../views/stats/competition/parts';

export function CountryCups({ g, cups, coef, row, past, onCoef, missing }: {
  g: Game; cups: CountryCup[];
  coef: CoefTable | null; row: CoefRow | null;
  /** Früherer Zeitraum: Fünfjahreswertung nur für die laufende Saison. */
  past?: boolean;
  onCoef?: () => void;
  /** Hinweis, wenn das Land nicht in der Wertung steht (z. B. DDR zählt bei Deutschland mit). */
  missing?: string;
}) {
  const fresh = !!row && row.seasons.every((v) => v == null);
  return (
    <aside className="lp-cups">
      <div className="lp-cups-title">Pokale des Landes</div>
      <div className="lp-cups-list">
        {cups.length ? cups.map((c) => (
          <div key={c.key} className="lp-cup" data-cup={c.key}>
            <span className="lp-cup-tro"><TrophyImage shape={c.shape} title={c.name} /></span>
            <div className="lp-cup-main">
              <b className="lp-cup-name">{c.name}</b>
              <span className="lp-cup-fmt">{c.format}</span>
              {c.state && <span className="lp-cup-state">{c.state}</span>}
              <span className="lp-cup-holder">
                {c.holder ? <><small>{c.holder.current ? `Sieger ${c.holder.season}` : `Zuletzt ${c.holder.season}`}</small><TeamName g={g} id={c.holder.id} season={c.holder.season} size={15} /></>
                  : <small>Noch kein Sieger bekannt</small>}
              </span>
              {c.note && <span className="lp-cup-note">{c.note}</span>}
            </div>
          </div>
        )) : <div className="lp-empty">Für dieses Land kennt das Spiel keine Pokale.</div>}
      </div>
      <div className="lp-coef">
        <div className="lp-coef-head">
          <span>Fünfjahreswertung</span>
          {onCoef && coef && <button type="button" className="b3 lp-coef-go" onClick={onCoef}>Ganze Wertung</button>}
        </div>
        {past ? <div className="lp-coef-note">Gilt nur für die laufende Saison – wähle oben den aktuellen Zeitraum.</div>
          : row && coef ? <>
            <div className="lp-coef-rank"><b>{row.rank}.</b> von {coef.rows.length}<span>{fresh ? 'noch keine Saison gewertet' : `${fmtCoef(row.total)} Punkte`}</span></div>
            <div className="lp-coef-sub">Startplätze {coef.next}</div>
            <div className="lp-coef-slots">
              {coef.comps.map((c) => (
                <span key={c.id} className={`lp-slot ${row.slots[c.id] ? '' : 'none'}`} title={c.id === coef.cupTo ? 'Einer davon ist der Landespokalsieger' : undefined}>
                  <b>{row.slots[c.id]}</b>{c.name}
                </span>
              ))}
            </div>
          </> : <div className="lp-coef-note">{missing ?? 'Dieses Land steht in dieser Saison nicht in der Wertung.'}</div>}
      </div>
    </aside>
  );
}
