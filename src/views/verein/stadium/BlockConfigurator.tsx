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

  return (
    <div className="sv-pop-body">
      <div className="sv-pop-head">
        <div><b>{BLOCK_NAME[draft.id]}</b><div className="sv-sub">{blockCapacity(cur).toLocaleString('de-DE')} Plätze · {cur.tiers.length} {cur.tiers.length === 1 ? 'Rang' : 'Ränge'} · {ROOF_NAME[cur.roof]}</div></div>
        <button className="modal-close sv-x" onClick={onClose} aria-label="Schließen">×</button>
      </div>
      {sideN > 1 && (
        <label className="sv-check">
          <input type="checkbox" checked={whole} onChange={(e) => { setConfirm(null); setWhole(e.target.checked); }} />
          {side === 'curve' ? 'Alle 4 Kurven gleich umbauen' : `Ganze ${SIDE_NAME[side]} (${sideN} Blöcke) – 5 % günstiger`}
        </label>
      )}

      <div className="sv-sec">Ränge</div>
      {draft.tiers.map((t, i) => (
        <div key={i} className="sv-tier">
          <div className="sv-tier-h"><span>{TIER_NAME[i]}</span><span className="num">{tierCapacity(draft.id, t).toLocaleString('de-DE')} Plätze</span></div>
          <div className="sv-seg">
            {SEATS.filter((s) => seatAvailable(s, year) || cur.tiers[i]?.seat === s).filter((s) => s !== 'business' || straight || t.seat === s).map((s) => (
              <button key={s} className={t.seat === s ? 'on' : ''} onClick={() => setTier(i, { seat: s })}>{SEAT_LABEL[s]}</button>
            ))}
          </div>
          <div className="sv-rows">
            <span>Reihen</span>
            <input type="range" min={3} max={36} step={1} value={t.rows} onChange={(e) => setTier(i, { rows: Number(e.target.value) })} />
            <b className="num">{t.rows}</b>
          </div>
        </div>
      ))}
      <div className="sv-btns">
        <button className="dchip" disabled={draft.tiers.length >= 3} onClick={() => upd({ tiers: [...draft.tiers, { seat: year >= 1998 ? 'schale' : draft.tiers[draft.tiers.length - 1].seat, rows: 14 }] })}>Rang aufstocken</button>
        <button className="dchip" disabled={draft.tiers.length <= 1} onClick={() => upd({ tiers: draft.tiers.slice(0, -1) })}>Obersten Rang abreißen</button>
      </div>

      <div className="sv-sec">Dach &amp; Ausstattung</div>
      <div className="sv-seg">
        {ROOFS.map((r) => <button key={r} className={draft.roof === r ? 'on' : ''} onClick={() => upd({ roof: r })}>{ROOF_NAME[r]}</button>)}
      </div>
      <div className="sv-btns">
        {vipAllowed(draft.id) && <button className={`dchip ${draft.vip ? 'on' : ''}`} disabled={!vipAvailable(year) && !draft.vip} onClick={() => upd({ vip: !draft.vip })}>VIP-Bereich{!vipAvailable(year) ? ' ab 1980' : ''}</button>}
        {(scoreboardAllowed(draft.id) || draft.scoreboard) && <button className={`dchip ${draft.scoreboard ? 'on' : ''}`} onClick={() => upd({ scoreboard: !draft.scoreboard })}>{videoWall(year) ? 'Videowand' : 'Anzeigetafel'}</button>}
        <span className="sv-rows sv-inline">
          <span>Logen</span>
          <button className="sv-step" disabled={draft.lounges <= 0} onClick={() => upd({ lounges: draft.lounges - 1 })}>−</button>
          <b className="num">{draft.lounges}</b>
          <button className="sv-step" disabled={!loungesAvailable(year) || draft.lounges >= maxL} onClick={() => upd({ lounges: draft.lounges + 1 })}>+</button>
          <span className="sv-sub">max. {maxL}{!loungesAvailable(year) ? ' · ab 1985' : ''}</span>
        </span>
      </div>

      {plan.changed && before && after && <>
        <div className="sv-sec">Vorher → nachher</div>
        <div className="sv-cmp">
          <span>Kapazität</span><span className="num">{blocksCapacity(blocks).toLocaleString('de-DE')} → {blocksCapacity(planned).toLocaleString('de-DE')}</span><span className={`num ${plan.addCapacity > 0 ? 'pos' : plan.addCapacity < 0 ? 'neg' : ''}`}>{sign(plan.addCapacity)}</span>
          <span>Zuschauer erwartet</span><span className="num">{before.visitors.toLocaleString('de-DE')} → {after.visitors.toLocaleString('de-DE')}</span><span className={`num ${after.visitors > before.visitors ? 'pos' : after.visitors < before.visitors ? 'neg' : ''}`}>{sign(after.visitors - before.visitors)}</span>
          <span>Eintritt je Spiel</span><span className="num">{fmtDM(before.rev)} → {fmtDM(after.rev)}</span><span className={`num ${Math.abs(after.rev - before.rev) < 500 ? '' : after.rev > before.rev ? 'pos' : 'neg'}`}>{Math.abs(after.rev - before.rev) < 500 ? '±0' : `${after.rev > before.rev ? '+' : '−'}${fmtDM(Math.abs(after.rev - before.rev))}`}</span>
        </div>
        <div className="sv-cmp sv-cmp2">
          <span>Kosten</span><b className="num">{fmtDM(cost)}</b>
          <span>Bauzeit</span><span>{plan.months} Monate · {all.length > 1 ? 'je Block die Hälfte' : 'halber Block'} gesperrt</span>
          <span>Fanstimmung</span><span className={plan.mood < 0 ? 'neg' : plan.mood > 0 ? 'pos' : ''}>{plan.mood ? `${plan.mood > 0 ? '+' : ''}${plan.mood.toLocaleString('de-DE')}` : 'neutral'}</span>
        </div>
        {plan.notes.map((n) => <div key={n} className="sv-note">{n}</div>)}
        <div className="sv-note">Die Nachfrage ist geschätzt: Ob neue Kategorien wirklich voll werden, zeigt erst die Saison.</div>
        {plan.errors.map((e) => <div key={e} className="sv-note neg">{e}</div>)}
        {busy && <div className="sv-note">Im Stadion wird gerade gebaut – den nächsten Umbau kannst du danach beauftragen.</div>}
        {plan.ok && !busy && <>
          <div className="sv-btns">
            <button className={`btn btn-primary btn-sm ${confirm === 'cash' ? 'on' : ''}`} disabled={club.finances.balance < cost} onClick={() => build('cash', 'cash', 0)}>
              {confirm === 'cash' ? 'Ja, bar bezahlen' : 'Bar bezahlen'}
            </button>
            {[10, 20].map((y) => (
              <button key={y} className={`dchip ${confirm === `l${y}` ? 'on' : ''}`} onClick={() => build(`l${y}`, 'loan', y)}>
                {confirm === `l${y}` ? `Ja, Kredit ${y} J.` : `Kredit ${y} J. · ${fmtDM(monthly(y))}/Mon.`}
              </button>
            ))}
          </div>
          <div className="sv-sub">Zins derzeit {(rate * 100).toFixed(1).replace('.', ',')} % p. a. Die Bank prüft, ob die Raten zum Umsatz passen.</div>
        </>}
        <button className="sv-link" onClick={() => { setWhole(false); upd({ ...JSON.parse(JSON.stringify(cur)) }); }}>Planung verwerfen</button>
      </>}
      {msg && <div className="sv-note acc">{msg}</div>}
    </div>
  );
}
