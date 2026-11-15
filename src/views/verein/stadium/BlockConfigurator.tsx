// =============================================================================
// BAU-POPOVER EINES BLOCKS im Planungsmodus „Stadion ausbauen“ (Wunsch Pascal):
// Ränge mit Platzkategorie und Reihen, Dach, VIP-Bereich, Logen, Anzeigetafel,
// Bauweise – jede Änderung landet sofort im Entwurf, die Szene zeigt das Ergebnis.
// Unten die Wirkung dieses Blocks (bzw. der Seite); gebaut und bezahlt wird erst
// über die Entwurfs-Box (PlanPanel.tsx) – alle geplanten Blöcke in einem Schritt.
// Rechnung: engine/stadiumBlocks.ts über groupPlanFor (game/stadiumGame.ts).
// =============================================================================
import { yearOf } from '../../../engine/economy';
import {
  BLOCK_NAME, BLOCK_SIDE, ROOF_NAME, SIDE_NAME, TIER_NAME, blockCapacity, loungesAvailable,
  scoreboardAllowed, seatAvailable, sideBlocks, tierCapacity, videoWall, vipAllowed, vipAvailable,
} from '../../../engine/stadiumBlocks';
import { groupPlanFor } from '../../../game/stadiumGame';
import { LOOKS, blockLook, lookOf, lookYear, loungeLimit, stadiumLook } from '../../../engine/stadiumStandard';
import type { Game } from '../../../game/state';
import type { RoofType, SeatType, StadiumBlock } from '../../../types';
import { fmtDM } from '../../../ui/format';
import { InfoTip } from '../../../ui/InfoTip';

const SEATS: SeatType[] = ['steh', 'bank', 'schale', 'komfort', 'business'];
/** Platzart → Kategorie, wie sie verkauft wird. */
const SEAT_LABEL: Record<SeatType, string> = { steh: 'Steh', bank: 'Bank', schale: 'Sitz', komfort: 'Premium', business: 'Business' };
const ROOFS: RoofType[] = ['none', 'partial', 'full'];
const sign = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '±') + Math.abs(n).toLocaleString('de-DE');

export function BlockConfigurator({ g, draft, setDraft, targets, whole, setWhole, onClose, onReset }: {
  g: Game;
  /** Geplanter Zustand des angeklickten Blocks (Entwurf oder Bestand). */
  draft: StadiumBlock; setDraft: (b: StadiumBlock) => void;
  /** Alle Blöcke, die diese Bearbeitung plant (Block bzw. ganze Seite). */
  targets: StadiumBlock[];
  whole: boolean; setWhole: (w: boolean) => void; onClose: () => void; onReset: () => void;
}) {
  const club = g.clubs[g.managedClubId];
  const year = yearOf(g.calendar.currentDate);
  const blocks = club.stadium.blocks!;
  const cur = blocks.find((b) => b.id === draft.id)!;
  const { plan, cost } = groupPlanFor(g, targets);
  const side = BLOCK_SIDE[draft.id];
  const sideN = sideBlocks(side).length;
  const upd = (patch: Partial<StadiumBlock>) => setDraft({ ...draft, ...patch });
  const setTier = (i: number, patch: Partial<StadiumBlock['tiers'][number]>) =>
    upd({ tiers: draft.tiers.map((t, k) => (k === i ? { ...t, ...patch } : t)) });
  const maxL = loungeLimit(draft.id, club.stadium.built);
  // Bauweise: wie der Bestand, wie bisher oder im aktuellen Look (engine/stadiumStandard.ts)
  const st = club.stadium;
  const lkCur = blockLook(cur, st), lkAll = stadiumLook(st), lkNow = lookOf(year), lkDraft = blockLook(draft, st);
  const lookChoices = [...new Set([lkAll, lkCur, lkNow])];
  const setLook = (i: number) => upd({ look: i === lkCur ? cur.look : i === lkNow ? year : lookYear(i, st) });
  const straight = side === 'main' || side === 'opposite';
  const capNow = blockCapacity(cur);

  return (
    <div className="bc">
      <header className="bc-head">
        <div className="bc-title">
          <b>{BLOCK_NAME[draft.id]}</b>
          <span>{capNow.toLocaleString('de-DE')} Plätze · {cur.tiers.length} {cur.tiers.length === 1 ? 'Rang' : 'Ränge'} · {ROOF_NAME[cur.roof]}</span>
        </div>
        <button className="bc-x" onClick={onClose} aria-label="Schließen">×</button>
      </header>
      {sideN > 1 && (
        <div className="bc-scope" role="radiogroup" aria-label="Umfang">
          <button className={!whole ? 'on' : ''} onClick={() => setWhole(false)}>Nur dieser Block</button>
          <button className={whole ? 'on' : ''} onClick={() => setWhole(true)}>
            {side === 'curve' ? 'Alle 4 Kurven' : `Ganze ${SIDE_NAME[side]} (${sideN})`}{side !== 'curve' && <em>−5 %</em>}
          </button>
        </div>
      )}

      <div className="bc-scroll">
        <section className="bc-sec">
          <div className="bc-sec-h">
            <span>Ränge<InfoTip k="platzarten" /></span>
            <span className="bc-sec-acts">
              <button className="bc-mini" disabled={draft.tiers.length <= 1} title="Obersten Rang abreißen" onClick={() => upd({ tiers: draft.tiers.slice(0, -1) })}>− Rang</button>
              <button className="bc-mini" disabled={draft.tiers.length >= 3} title="Rang aufstocken" onClick={() => upd({ tiers: [...draft.tiers, { seat: year >= 1998 ? 'schale' : draft.tiers[draft.tiers.length - 1].seat, rows: 14 }] })}>+ Rang</button>
            </span>
          </div>
          {[...draft.tiers].map((t, i) => ({ t, i })).reverse().map(({ t, i }) => (
            <div key={i} className="bc-tier">
              <div className="bc-tier-top">
                <span className="bc-tier-name">{TIER_NAME[i]}</span>
                <span className="bc-tier-cap">{tierCapacity(draft.id, t).toLocaleString('de-DE')}<small> Plätze</small></span>
              </div>
              <div className="bc-chips">
                {SEATS.filter((s) => seatAvailable(s, year) || cur.tiers[i]?.seat === s).filter((s) => s !== 'business' || straight || t.seat === s).map((s) => (
                  <button key={s} className={t.seat === s ? 'on' : ''} onClick={() => setTier(i, { seat: s })}>{SEAT_LABEL[s]}</button>
                ))}
              </div>
              <div className="bc-range">
                <span>Reihen</span>
                <input type="range" min={3} max={36} step={1} value={t.rows} onChange={(e) => setTier(i, { rows: Number(e.target.value) })} />
                <b>{t.rows}</b>
              </div>
            </div>
          ))}
        </section>

        <section className="bc-sec">
          <div className="bc-sec-h"><span>Dach<InfoTip k="ueberdacht" /></span></div>
          <div className="bc-roofs">
            {ROOFS.map((r) => (
              <button key={r} className={draft.roof === r ? 'on' : ''} onClick={() => upd({ roof: r })}>
                <svg viewBox="0 0 48 28" aria-hidden="true">
                  <path d="M6 26 L6 18 L42 12 L42 26 Z" className="bc-roof-stand" />
                  {r !== 'none' && <path d={r === 'full' ? 'M3 9 L45 3 L45 6 L3 12 Z' : 'M24 6 L45 3 L45 6 L24 9 Z'} className="bc-roof-top" />}
                  {r !== 'none' && <path d={r === 'full' ? 'M5 11 L5 18 M43 6 L43 12' : 'M43 6 L43 12 M26 9 L26 15'} className="bc-roof-post" />}
                </svg>
                <span>{ROOF_NAME[r]}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="bc-sec">
          <div className="bc-sec-h"><span>Ausstattung</span></div>
          {vipAllowed(draft.id) && (
            <label className={`bc-opt ${!vipAvailable(year) && !draft.vip ? 'off' : ''}`}>
              <span><b>VIP-Bereich</b><small>{vipAvailable(year) ? 'Business-Plätze mit Bewirtung' : 'ab 1980'}</small></span>
              <button className={`toggle ${draft.vip ? 'on' : ''}`} disabled={!vipAvailable(year) && !draft.vip} onClick={() => upd({ vip: !draft.vip })} aria-label="VIP-Bereich" />
            </label>
          )}
          {(scoreboardAllowed(draft.id) || draft.scoreboard) && (
            <label className="bc-opt">
              <span><b>{videoWall(year) ? 'Videowand' : 'Anzeigetafel'}</b><small>Ergebnis und Spielzeit für alle Ränge</small></span>
              <button className={`toggle ${draft.scoreboard ? 'on' : ''}`} onClick={() => upd({ scoreboard: !draft.scoreboard })} aria-label="Anzeigetafel" />
            </label>
          )}
          <div className={`bc-opt ${!loungesAvailable(year) ? 'off' : ''}`}>
            <span><b>Logen</b><small>{loungesAvailable(year) ? `höchstens ${maxL} in diesem Block` : 'ab 1985'}</small></span>
            <span className="bc-step">
              <button disabled={draft.lounges <= 0} onClick={() => upd({ lounges: draft.lounges - 1 })} aria-label="Weniger Logen">−</button>
              <b>{draft.lounges}</b>
              <button disabled={!loungesAvailable(year) || draft.lounges >= maxL} onClick={() => upd({ lounges: draft.lounges + 1 })} aria-label="Mehr Logen">+</button>
            </span>
          </div>
        </section>

        <section className="bc-sec">
          <div className="bc-sec-h"><span>Bauweise<InfoTip k="stadionBauweise" /></span></div>
          <div className="bc-chips bc-look">
            {lookChoices.map((i) => (
              <button key={i} className={lkDraft === i ? 'on' : ''} onClick={() => setLook(i)}>
                {LOOKS[i].name}{i === lkAll ? ' · Bestand' : i === lkNow ? ' · aktuell' : ''}
              </button>
            ))}
            <small>{LOOKS[lkDraft].text}{lkDraft !== lkAll ? ' – passt nicht zum übrigen Stadion.' : '.'}</small>
          </div>
        </section>

        {plan.changed && <>
          {plan.notes.map((n) => <div key={n} className="bc-note">{n}</div>)}
          {plan.errors.map((e) => <div key={e} className="bc-note neg">{e}</div>)}
        </>}
      </div>

      <footer className="bc-foot">
        {!plan.changed ? (
          <div className="bc-idle">Passe Ränge, Dach oder Ausstattung an – die Szene zeigt sofort das Ergebnis. Gebaut und bezahlt wird erst mit „Bauen“ im Entwurf.</div>
        ) : (
          <div className="bc-cost bc-cost4">
            <div><span>{targets.length > 1 ? `${targets.length} Blöcke` : 'Kapazität'}</span><b className={plan.addCapacity > 0 ? 'pos' : plan.addCapacity < 0 ? 'neg' : ''}>{sign(plan.addCapacity)}</b></div>
            <div><span>Kosten</span><b>{fmtDM(cost)}</b></div>
            <div><span>Bauzeit</span><b>{plan.months} Mon.</b></div>
            <div><span>Fans</span><b className={plan.mood < 0 ? 'neg' : plan.mood > 0 ? 'pos' : ''}>{plan.mood ? `${plan.mood > 0 ? '+' : ''}${plan.mood}` : '±0'}</b></div>
          </div>
        )}
        <div className="bc-go">
          <button className="bc-reset" disabled={!plan.changed} onClick={onReset}>{targets.length > 1 ? 'Seite zurücksetzen' : 'Block zurücksetzen'}</button>
          <button className="b3 b3-s bc-done" onClick={onClose}>Fertig</button>
        </div>
      </footer>
    </div>
  );
}
