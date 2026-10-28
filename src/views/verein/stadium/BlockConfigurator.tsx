// =============================================================================
// BLOCK-KONFIGURATOR (Panel rechts auf der Stadionseite): Ränge, Sitzart je
// Rang, Reihen, Dach, VIP-Bereich, Logen, Anzeigetafel – mit Kosten,
// Kapazitätsänderung, Bauzeit, Stimmungs- und Erlösprognose und Finanzierung.
// =============================================================================
import { useState } from 'react';
import { revenueScale, yearOf } from '../../../engine/economy';
import { expectedAttendance } from '../../../engine/finances';
import { vipIncome } from '../../../engine/clubBusiness';
import {
  BLOCK_NAME, BLOCK_SIDE, MAX_LOUNGES, ROOF_NAME, SEAT_NAME, SIDE_NAME, TIER_NAME, blockCapacity, blocksCapacity, loungesAvailable,
  scoreboardAllowed, seatAvailable, sideBlocks, ticketFactor, tierCapacity, videoWall, vipAllowed, vipAvailable,
} from '../../../engine/stadiumBlocks';
import { groupPlanFor, sideTargets, startBlockBuild } from '../../../game/stadiumGame';
import type { Game } from '../../../game/state';
import type { Club, RoofType, SeatType, StadiumBlock } from '../../../types';
import { KV } from '../../../ui/DashPage';
import { fmtDM } from '../../../ui/format';

const SEATS: SeatType[] = ['steh', 'bank', 'schale', 'komfort', 'business'];
const ROOFS: RoofType[] = ['none', 'partial', 'full'];
const sign = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '±') + Math.abs(n).toLocaleString('de-DE');

/** Erlös je Heimspiel (Eintritt + Logen/VIP) für einen hypothetischen Blockzustand. */
function perMatch(club: Club, blocks: StadiumBlock[], year: number): { ticket: number; vip: number; visitors: number } {
  const md = revenueScale('matchday', year);
  const st = { ...club.stadium, blocks, capacity: blocksCapacity(blocks), vipBoxes: blocks.reduce((s, b) => s + b.lounges, 0) };
  const c = { ...club, stadium: st } as Club;
  const visitors = expectedAttendance(c);
  return { ticket: Math.round(visitors * st.ticketPrice * ticketFactor(c) * md), vip: vipIncome(c, md, year), visitors };
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
  const before = perMatch(club, blocks, year);
  const after = perMatch(club, planned, year);
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

  return (
    <div className="gr-panel st-panel">
      <div className="gr-panel-head"><b>{BLOCK_NAME[draft.id]}</b><button className="modal-close" onClick={onClose}>×</button></div>
      <KV k="Heute" v={`${blockCapacity(cur).toLocaleString('de-DE')} Plätze · ${cur.tiers.length} ${cur.tiers.length === 1 ? 'Rang' : 'Ränge'} · ${ROOF_NAME[cur.roof]}`} />
      {sideN > 1 && (
        <div className="dbtnrow">
          <button className={`dchip ${!whole ? 'on' : ''}`} onClick={() => { setConfirm(null); setWhole(false); }}>Nur dieser Block</button>
          <button className={`dchip ${whole ? 'on' : ''}`} onClick={() => { setConfirm(null); setWhole(true); }}>{side === 'curve' ? 'Alle 4 Kurven' : `Ganze ${SIDE_NAME[side]} (${sideN} Blöcke)`}</button>
        </div>
      )}
      {whole && <div className="dnote">Ränge und Dach gelten für alle {sideN} Blöcke; VIP, Logen und Anzeigetafel nur für diesen Block. Gemeinsam gebaut ist es 5 % günstiger.</div>}
      {busy && <div className="dnote" style={{ color: 'var(--orange)' }}>Im Stadion wird gerade gebaut. Den nächsten Umbau kannst du danach beauftragen – planen geht schon.</div>}

      <div className="st-sec">Ränge</div>
      {draft.tiers.map((t, i) => (
        <div key={i} className="st-tier">
          <div className="st-tier-head"><b>{TIER_NAME[i]}</b><span>{tierCapacity(draft.id, t).toLocaleString('de-DE')} Plätze</span></div>
          <div className="dbtnrow">
            {SEATS.filter((s) => seatAvailable(s, year) || cur.tiers[i]?.seat === s).map((s) => (
              <button key={s} className={`dchip ${t.seat === s ? 'on' : ''}`} onClick={() => setTier(i, { seat: s })}>{SEAT_NAME[s]}</button>
            ))}
          </div>
          <div className="st-rows">
            <span>Reihen</span>
            <input type="range" min={3} max={36} step={1} value={t.rows} onChange={(e) => setTier(i, { rows: Number(e.target.value) })} />
            <b>{t.rows}</b>
          </div>
        </div>
      ))}
      <div className="dbtnrow">
        <button className="dchip" disabled={draft.tiers.length >= 3} onClick={() => upd({ tiers: [...draft.tiers, { seat: year >= 1998 ? 'schale' : draft.tiers[draft.tiers.length - 1].seat, rows: 14 }] })}>+ Rang aufstocken</button>
        <button className="dchip" disabled={draft.tiers.length <= 1} onClick={() => upd({ tiers: draft.tiers.slice(0, -1) })}>Obersten Rang abreißen</button>
      </div>

      <div className="st-sec">Dach</div>
      <div className="dbtnrow">
        {ROOFS.map((r) => <button key={r} className={`dchip ${draft.roof === r ? 'on' : ''}`} onClick={() => upd({ roof: r })}>{ROOF_NAME[r]}</button>)}
      </div>

      <div className="st-sec">Ausstattung</div>
      <div className="dbtnrow">
        {vipAllowed(draft.id) && <button className={`dchip ${draft.vip ? 'on' : ''}`} disabled={!vipAvailable(year) && !draft.vip} onClick={() => upd({ vip: !draft.vip })}>VIP-Tribüne</button>}
        {(scoreboardAllowed(draft.id) || draft.scoreboard) && <button className={`dchip ${draft.scoreboard ? 'on' : ''}`} onClick={() => upd({ scoreboard: !draft.scoreboard })}>{videoWall(year) ? 'Videowand' : 'Anzeigetafel'}</button>}
      </div>
      <div className="st-rows">
        <span>Logen</span>
        <button className="dchip" disabled={draft.lounges <= 0} onClick={() => upd({ lounges: draft.lounges - 1 })}>−</button>
        <b style={{ minWidth: 34, textAlign: 'center' }}>{draft.lounges}</b>
        <button className="dchip" disabled={!loungesAvailable(year) || draft.lounges >= maxL} onClick={() => upd({ lounges: draft.lounges + 1 })}>+</button>
        <span className="dnote">max. {maxL}{!loungesAvailable(year) ? ' · ab 1985' : ''}</span>
      </div>

      {plan.changed && <>
        <div className="st-sec">Planung</div>
        <KV k="Kapazität" v={`${blocksCapacity(blocks).toLocaleString('de-DE')} → ${blocksCapacity(planned).toLocaleString('de-DE')} (${sign(plan.addCapacity)})`} color={plan.addCapacity >= 0 ? 'var(--green)' : 'var(--red)'} />
        <KV k="Kosten" v={fmtDM(cost)} color="var(--red)" strong />
        <KV k="Bauzeit" v={`${plan.months} Monate · ${all.length > 1 ? 'je Block die Hälfte' : 'halber Block'} gesperrt`} />
        <KV k="Fanstimmung" v={plan.mood ? `${plan.mood > 0 ? '+' : ''}${plan.mood.toLocaleString('de-DE')}` : 'neutral'} color={plan.mood < 0 ? 'var(--red)' : plan.mood > 0 ? 'var(--green)' : undefined} />
        <KV k="Eintritt je Heimspiel" v={`${fmtDM(before.ticket)} → ${fmtDM(after.ticket)}`} color={after.ticket >= before.ticket ? 'var(--green)' : 'var(--red)'} />
        {(before.vip > 0 || after.vip > 0) && <KV k="Logen & VIP je Heimspiel" v={`${fmtDM(before.vip)} → ${fmtDM(after.vip)}`} />}
        {plan.notes.map((n) => <div key={n} className="dnote">{n}</div>)}
        {plan.errors.map((e) => <div key={e} className="dnote" style={{ color: 'var(--red)' }}>{e}</div>)}
        {plan.ok && !busy && <>
          <div className="dbtnrow mt8">
            <button className={`dchip ${confirm === 'cash' ? 'on' : ''}`} disabled={club.finances.balance < cost} onClick={() => build('cash', 'cash', 0)}>
              {confirm === 'cash' ? 'Ja, bar bezahlen' : 'Bar bezahlen'}
            </button>
            {[10, 15, 20].map((y) => (
              <button key={y} className={`dchip ${confirm === `l${y}` ? 'on' : ''}`} onClick={() => build(`l${y}`, 'loan', y)}>
                {confirm === `l${y}` ? `Ja, Kredit ${y} J.` : `Kredit ${y} J. · ${fmtDM(monthly(y))}/Mon.`}
              </button>
            ))}
          </div>
          <div className="dnote">Zins derzeit {(rate * 100).toFixed(1)} % p. a. Die Bank prüft, ob die Raten zum Umsatz passen.</div>
        </>}
        <button className="dchip" onClick={() => { setWhole(false); upd({ ...JSON.parse(JSON.stringify(cur)) }); }}>Planung verwerfen</button>
      </>}
      {msg && <div className="dnote" style={{ color: 'var(--accent)', fontWeight: 700 }}>{msg}</div>}
    </div>
  );
}
