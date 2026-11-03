// =============================================================================
// Spiele dieser Saison: alle Heimspiele (Liga, Pokal, Europapokal) mit Preis-
// kategorie (Klick schaltet: automatisch → Normal → Top → Rabatt), erwarteten
// Zuschauern als Spanne, möglichen Verkäufen und – nach dem Spiel – dem Ist-Wert.
// Darunter: Prognose gegen Ist je Platzkategorie für das gewählte Spiel.
// =============================================================================
import ClubCrest from '../../../components/ClubCrest';
import { ClubLink } from '../../../components/club/ClubLink';
import { CAT_KEYS, LOGE_GUESTS, SEAT_CAT } from '../../../data/seatingCatalog';
import { capacityOf, cycleMatchCat, totalOf, type GameForecast, type HomeGame } from '../../../game/ticketsGame';
import type { Game } from '../../../game/state';
import type { SeatCat, TicketPriceCat, TicketSettings } from '../../../types';
import { InfoTip } from '../../../ui/InfoTip';
import { n0, span } from './ticketFmt';

const fmtD = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.`;
const KIND: Record<HomeGame['kind'], string> = { Liga: 'Liga', Pokal: 'Pokal', Europapokal: 'Europa' };
const persons = (k: SeatCat, v: number) => (k === 'loge' ? v * LOGE_GUESTS : v);

export function catLabel(c: TicketPriceCat, t: TicketSettings): string {
  return c === 'top' ? `Top +${t.topPct} %` : c === 'rabatt' ? `Rabatt −${t.rabattPct} %` : 'Normal';
}

/** Ist-Wert gegen Spanne: Lage als kurzer Text. */
function where(v: number, w: [number, number]): { t: string; out: boolean } {
  if (w[0] === w[1] && v >= w[1]) return { t: 'ausverkauft', out: false };
  if (v < w[0]) return { t: 'unter der Spanne', out: true };
  if (v > w[1]) return { t: 'über der Spanne', out: true };
  const p = w[1] > w[0] ? (v - w[0]) / (w[1] - w[0]) : 0.5;
  return { t: p < 0.25 ? 'unteres Ende' : p > 0.75 ? 'oberes Ende' : 'mittig', out: false };
}

interface Props {
  g: Game; games: HomeGame[]; fcs: Map<string, GameForecast | null>; t: TicketSettings;
  sel: HomeGame | null; onSel: (key: string) => void; onChange: () => void;
}

export function GamesBox({ g, games, fcs, t, sel, onSel, onChange }: Props) {
  const actual = (hg: HomeGame) => (hg.log ? CAT_KEYS.reduce((a, k) => a + persons(k, hg.log!.sold[k] ?? 0), 0) : null);
  const selFc = sel ? fcs.get(sel.key) ?? null : null;
  const detailFc = sel?.log?.fc ?? selFc?.fc ?? null;
  return (
    <div className="tk-games">
      <div className="tk-gscroll">
        <table className="dtable tk-gtab">
          <thead>
            <tr><th>Datum</th><th>Gegner</th><th>Art</th><th className="c">Kat.<InfoTip k="preiskategorie" /></th><th className="r">Erw. Zuschauer<InfoTip k="prognoseSpanne" /></th><th className="r">Mögl. Verk.</th><th className="r">Ist</th></tr>
          </thead>
          <tbody>
            {games.map((hg) => {
              const f = fcs.get(hg.key) ?? null;
              const opp = g.clubs[hg.awayId];
              const win: [number, number] | null = hg.log?.fc ? totalOf(hg.log.fc) : f ? f.total : null;
              const cap = hg.log ? capacityOf(hg.log.cap) : f ? f.capacity : null;
              const ist = actual(hg);
              const cat = hg.log?.priceCat ?? f?.priceCat ?? 'normal';
              const manual = !!t.match?.[hg.key];
              return (
                <tr key={hg.key} className={`${sel?.key === hg.key ? 'sel' : ''} ${hg.played ? 'done' : ''}`} onClick={() => onSel(hg.key)}>
                  <td className="tk-muted num">{fmtD(hg.date)}</td>
                  <td><span className="tk-opp">{opp && <ClubCrest club={opp} size={24} />}<ClubLink id={hg.awayId}><span className="rl-name">{opp?.name ?? hg.awayId}</span></ClubLink></span></td>
                  <td className="tk-muted" title={hg.label}>{KIND[hg.kind]}</td>
                  <td className="c">
                    {hg.played ? <span className={`tk-cat tk-cat-${cat}`}>{catLabel(cat, t)}</span>
                      : <button className={`tk-cat tk-cat-${cat} ${manual ? 'set' : ''}`} onClick={(e) => { e.stopPropagation(); cycleMatchCat(g, hg.key); onChange(); }}>
                        {catLabel(cat, t)}{!manual && <i>auto</i>}
                      </button>}
                  </td>
                  <td className="r num">{span(win)}</td>
                  <td className="r num tk-muted">{cap != null ? n0(cap) : '–'}</td>
                  <td className="r num">{ist != null ? n0(ist) : hg.played ? '–' : ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {sel && (
        <div className="tk-detail">
          <div className="tk-detail-h">
            <b>{g.clubs[sel.awayId]?.name ?? sel.awayId}</b>
            <span>{fmtD(sel.date)}{sel.date.slice(0, 4)} · {sel.kind} · {sel.label}</span>
            {!sel.played && selFc?.reasons.length ? <span className="tk-muted">Unsicher: {selFc.reasons.join(', ')}</span> : null}
          </div>
          {detailFc ? (
            <div className="tk-chips">
              {CAT_KEYS.filter((k) => detailFc[k]).map((k) => {
                const w = detailFc[k]!;
                const v = sel.log?.sold[k];
                const pos = v != null ? where(v, w) : null;
                return (
                  <div key={k} className={`tk-chip ${pos?.out ? 'out' : ''}`}>
                    <span className="tk-chip-k">{SEAT_CAT[k].short}</span>
                    <span className="num">{w[0] === w[1] ? `ausverkauft (${n0(w[1])})` : span(w)}</span>
                    {v != null && <span className="tk-chip-ist">Ist <b className="num">{n0(v)}</b> · {pos!.t}</span>}
                  </div>
                );
              })}
            </div>
          ) : <div className="tk-muted">{sel.played ? 'Für dieses Spiel gibt es keine gespeicherte Prognose.' : 'Gegner noch nicht bekannt.'}</div>}
        </div>
      )}
    </div>
  );
}
