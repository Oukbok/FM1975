// =============================================================================
// BAU-POPOVER EINES BLOCKS (am angeklickten Block in der Szene): Ränge mit
// Platzkategorie und Reihen, Dach, VIP-Bereich, Logen, Anzeigetafel – mit
// Vorschau (Geister-Tribüne in der Szene) und Vorher → Nachher für Kapazität,
// Plätze je Kategorie und erwarteten Erlös je Heimspiel, dazu Kosten, Bauzeit,
// Fanstimmung und Finanzierung. Rechnung: engine/stadiumBlocks.ts + engine/seating.ts.
// =============================================================================
import { useState } from 'react';
import { yearOf } from '../../../engine/economy';
import { expectedSale, saleRevenue } from '../../../engine/seating';
import {
  BLOCK_NAME, BLOCK_SIDE, MAX_LOUNGES, ROOF_NAME, SIDE_NAME, TIER_NAME, blockCapacity, blocksCapacity, loungesAvailable,
  scoreboardAllowed, seatAvailable, sideBlocks, tierCapacity, videoWall, vipAllowed, vipAvailable,
} from '../../../engine/stadiumBlocks';
import { groupPlanFor, sideTargets, startBlockBuild } from '../../../game/stadiumGame';
import type { Game } from '../../../game/state';
import type { Club, RoofType, SeatType, StadiumBlock } from '../../../types';
import { fmtDM } from '../../../ui/format';
import { InfoTip } from '../../../ui/InfoTip';

const SEATS: SeatType[] = ['steh', 'bank', 'schale', 'komfort', 'business'];
/** Platzart → Kategorie, wie sie verkauft wird. */
const SEAT_LABEL: Record<SeatType, string> = { steh: 'Steh', bank: 'Bank', schale: 'Sitz', komfort: 'Premium', business: 'Business' };
const ROOFS: RoofType[] = ['none', 'partial', 'full'];
const sign = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '±') + Math.abs(n).toLocaleString('de-DE');

/** Erwarteter Eintritt je Heimspiel (alle Kategorien, nominal) und Zuschauer für einen Blockzustand. */
export function perMatch(club: Club, blocks: StadiumBlock[], year: number): { rev: number; visitors: number } {
  const st = { ...club.stadium, blocks, capacity: blocksCapacity(blocks) };
  const c = { ...club, stadium: st } as Club;
  const sale = expectedSale(c, year);
  return { rev: Object.values(saleRevenue(c, sale.sold, year)).reduce((a, v) => a + (v ?? 0), 0), visitors: sale.attendance };
}

export function BlockConfigurator({ g, draft, setDraft, whole, setWhole, onClose, onDone }: {
  g: Game; draft: StadiumBlock; setDraft: (b: StadiumBlock) => void; whole: boolean; setWhole: (w: boolean) => void; onClose: () => void; onDone: () => void;
}) {
  const club = g.clubs[g.managedClubId];
  const year = yearOf(g.calendar.currentDate);
  const blocks = club.stadium.blocks!;
  const cur = blocks.find((b) => b.id === draft.id)!;
  const busy = !!club.stadium.blockProject || !!club.stadiumProject;
  const [confirm, setConfirm] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const all = sideTargets(blocks, draft, whole);
  const { plan, cost, rate, monthly } = groupPlanFor(g, all);
  const planned = blocks.map((b) => all.find((t) => t.id === b.id) ?? b);
  const side = BLOCK_SIDE[draft.id];
  const sideN = sideBlocks(side).length;
  const upd = (patch: Partial<StadiumBlock>) => { setConfirm(null); setMsg(null); setDraft({ ...draft, ...patch }); };
  const setTier = (i: number, patch: Partial<StadiumBlock['tiers'][number]>) =>
    upd({ tiers: draft.tiers.map((t, k) => (k === i ? { ...t, ...patch } : t)) });
  const build = (key: string, financing: 'cash' | 'loan', years: number) => {
    if (confirm !== key) { setConfirm(key); return; }
    const r = startBlockBuild(g, all, financing, years);
    setMsg(r.text);
    setConfirm(null);
    if (r.ok) onDone();
  };
  const maxL = MAX_LOUNGES[draft.id];
  const straight = side === 'main' || side === 'opposite';
  const before = plan.changed ? perMatch(club, blocks, year) : null;
  const after = plan.changed ? perMatch(club, planned, year) : null;

  const [fin, setFin] = useState<'cash' | 10 | 20>('cash');
  const capNow = blockCapacity(cur);
  const revDiff = before && after ? after.rev - before.rev : 0;
  const canCash = club.finances.balance >= cost;
  const f = fin === 'cash' && !canCash ? 10 : fin; // Konto reicht nicht → Kredit vorwählen
  const finKey = f === 'cash' ? 'cash' : `l${f}`;
  const go = () => build(finKey, f === 'cash' ? 'cash' : 'loan', f === 'cash' ? 0 : f);

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
          <button className={!whole ? 'on' : ''} onClick={() => { setConfirm(null); setWhole(false); }}>Nur dieser Block</button>
          <button className={whole ? 'on' : ''} onClick={() => { setConfirm(null); setWhole(true); }}>
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

        {plan.changed && <>
          {plan.notes.map((n) => <div key={n} className="bc-note">{n}</div>)}
          {plan.errors.map((e) => <div key={e} className="bc-note neg">{e}</div>)}
          {busy && <div className="bc-note">Im Stadion wird gerade gebaut – den nächsten Umbau kannst du danach beauftragen.</div>}
        </>}
      </div>

      <footer className="bc-foot">
        {!plan.changed || !before || !after ? (
          <div className="bc-idle">Passe Ränge, Dach oder Ausstattung an – hier siehst du dann Wirkung, Kosten und Bauzeit.</div>
        ) : <>
          <div className="bc-kpis">
            <div><span>Kapazität</span><b className={plan.addCapacity > 0 ? 'pos' : plan.addCapacity < 0 ? 'neg' : ''}>{sign(plan.addCapacity)}</b><small>{blocksCapacity(planned).toLocaleString('de-DE')} gesamt</small></div>
            <div><span>Zuschauer</span><b className={after.visitors > before.visitors ? 'pos' : after.visitors < before.visitors ? 'neg' : ''}>{sign(after.visitors - before.visitors)}</b><small>{after.visitors.toLocaleString('de-DE')} erwartet</small></div>
            <div><span>Eintritt / Spiel</span><b className={Math.abs(revDiff) < 500 ? '' : revDiff > 0 ? 'pos' : 'neg'}>{Math.abs(revDiff) < 500 ? '±0' : `${revDiff > 0 ? '+' : '−'}${fmtDM(Math.abs(revDiff))}`}</b><small>{fmtDM(after.rev)}</small></div>
          </div>
          <div className="bc-cost">
            <div><span>Kosten</span><b>{fmtDM(cost)}</b></div>
            <div><span>Bauzeit</span><b>{plan.months} Mon.</b></div>
            <div><span>Fans</span><b className={plan.mood < 0 ? 'neg' : plan.mood > 0 ? 'pos' : ''}>{plan.mood ? `${plan.mood > 0 ? '+' : ''}${plan.mood}` : '±0'}</b></div>
          </div>
          {plan.ok && !busy && <>
            <div className="bc-fin" role="radiogroup" aria-label="Finanzierung">
              <button className={f === 'cash' ? 'on' : ''} disabled={!canCash} onClick={() => { setConfirm(null); setFin('cash'); }}><b>Bar</b><small>{canCash ? 'aus dem Kontostand' : 'Konto reicht nicht'}</small></button>
              {([10, 20] as const).map((y) => (
                <button key={y} className={f === y ? 'on' : ''} onClick={() => { setConfirm(null); setFin(y); }}><b>Kredit {y} J.</b><small>{fmtDM(monthly(y))}/Mon.</small></button>
              ))}
            </div>
            <div className="bc-go">
              <button className="bc-reset" onClick={() => { setWhole(false); setConfirm(null); upd({ ...JSON.parse(JSON.stringify(cur)) }); }}>Verwerfen</button>
              <button className={`b3 b3-primary bc-build ${confirm === finKey ? 'on' : ''}`} onClick={go}>
                {confirm === finKey ? 'Ja, Bau beauftragen' : 'Bau beauftragen'}
              </button>
            </div>
            <div className="bc-fine">Zins derzeit {(rate * 100).toFixed(1).replace('.', ',')} % p. a. · {all.length > 1 ? 'je Block die Hälfte' : 'halber Block'} während des Baus gesperrt · Nachfrage geschätzt</div>
          </>}
          {(!plan.ok || busy) && <div className="bc-go"><button className="bc-reset" onClick={() => { setWhole(false); upd({ ...JSON.parse(JSON.stringify(cur)) }); }}>Verwerfen</button></div>}
        </>}
        {msg && <div className="bc-note acc">{msg}</div>}
      </footer>
    </div>
  );
}
