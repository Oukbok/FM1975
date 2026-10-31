// =============================================================================
// TICKETS & NACHFRAGE (Leiste unten auf der Stadionseite): je Platzkategorie
// Kontingent, Preis (einstellbar, mit Richtpreis), GESCHÄTZTE Nachfrage als
// Spanne, Auslastung der letzten Heimspiele und Erlös je Spiel bzw. Saison.
// Die echte Nachfrage bleibt verborgen (game/seatingGame.ts: demandEstimate).
// =============================================================================
import { useState } from 'react';
import { SEAT_CATS } from '../../../data/seatingCatalog';
import { DM_PER_EUR, currencyForYear, formatMoney, yearOf } from '../../../engine/economy';
import { catAvailable, ensureSeating, fanPriceIndex, priceOf, refPrice, seatPriceScale } from '../../../engine/seating';
import { demandEstimate, forecastStaff, ownCaps, resetSeatPrices, setSeatPrice } from '../../../game/seatingGame';
import type { Game } from '../../../game/state';
import type { SeatCat } from '../../../types';

const n0 = (v: number) => Math.round(v).toLocaleString('de-DE');

/** Ticketpreis in Anzeige-Währung (kleine Beträge mit Nachkommastellen). */
export function fmtTicket(nominalDM: number, year: number): string {
  const eur = currencyForYear(year) === 'EUR';
  const v = eur ? nominalDM / DM_PER_EUR : nominalDM;
  if (v >= 1000) return formatMoney(nominalDM, year);
  return `${v.toLocaleString('de-DE', { minimumFractionDigits: v < 100 ? 2 : 0, maximumFractionDigits: v < 100 ? 2 : 0 })} ${eur ? '€' : 'DM'}`;
}
const stepOf = (disp: number) => (disp < 30 ? 0.5 : disp < 100 ? 1 : disp < 1000 ? 10 : 250);

export function TicketSheet({ g, onChange, onClose }: { g: Game; onChange: () => void; onClose: () => void }) {
  const [, force] = useState(0);
  const club = g.clubs[g.managedClubId];
  const year = yearOf(g.calendar.currentDate);
  const seating = ensureSeating(club, year);
  const { caps, wheelchair } = ownCaps(g);
  const sc = seatPriceScale(club, year);
  const eur = currencyForYear(year) === 'EUR';
  const toDisp = (base: number) => base * sc / (eur ? DM_PER_EUR : 1);
  const fromDisp = (d: number) => d * (eur ? DM_PER_EUR : 1) / sc;
  const staff = forecastStaff(g);
  const log = seating.log ?? [];
  const season = seating.season;
  const bump = (k: SeatCat, dir: number) => {
    const d = toDisp(priceOf(club, k, year));
    const s = stepOf(d);
    setSeatPrice(g, k, fromDisp(Math.max(s, Math.round(d / s) * s + dir * s)));
    force((x) => x + 1); onChange();
  };
  const idx = fanPriceIndex(club, year);
  let perMatch = 0;
  const rows = SEAT_CATS.map((def) => {
    const k = def.key;
    const cap = caps[k] ?? 0;
    const open = catAvailable(k, year);
    const est = open && cap > 0 ? demandEstimate(g, k) : null;
    const price = priceOf(club, k, year), ref = refPrice(club, k, year);
    const expSold = est ? Math.min(cap, est.mid) : 0;
    const rev = expSold * price * sc;
    perMatch += rev;
    const last = log.slice(0, 6).reverse().map((e) => ((e.cap[k] ?? 0) > 0 ? (e.sold[k] ?? 0) / (e.cap[k] ?? 1) : null));
    return { def, k, cap, open, est, price, ref, rev, last, seasonRev: season?.rev[k] ?? 0 };
  });

  return (
    <div className="sv-sheet" onClick={(e) => e.stopPropagation()}>
      <div className="sv-sheet-head">
        <b>Tickets &amp; Nachfrage</b>
        <span className="sv-muted">Nachfrage geschätzt für das nächste Heimspiel gegen einen durchschnittlichen Gegner</span>
        <span className="sv-grow" />
        <button className="dchip" onClick={() => { resetSeatPrices(g); force((x) => x + 1); onChange(); }}>Richtpreise übernehmen</button>
        <button className="modal-close sv-x" onClick={onClose} aria-label="Schließen">×</button>
      </div>
      <table className="sv-table">
        <thead>
          <tr><th>Kategorie</th><th className="r">Kontingent</th><th className="c">Preis je Spiel</th><th>Geschätzte Nachfrage</th><th className="c">Letzte Heimspiele</th><th className="r">Erlös je Spiel</th><th className="r">Saison {season?.id ?? ''}</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.k} className={!r.open ? 'off' : r.cap <= 0 ? 'none' : ''}>
              <td><div className="sv-cat">{r.def.name}</div><div className="sv-sub">{!r.open ? `ab ${r.def.unlock}` : r.k === 'loge' ? 'je Loge (≈ 11 Gäste)' : r.k === 'business' ? 'je Platz inkl. Bewirtung' : r.k === 'gast' ? 'Pflichtkontingent 10 %' : ''}</div></td>
              <td className="r num">{r.open ? `${n0(r.cap)}${r.k === 'loge' ? ' Logen' : ''}` : '–'}</td>
              <td className="c">
                {r.open ? <div className="sv-price">
                  <button className="sv-step" onClick={() => bump(r.k, -1)} aria-label="günstiger">−</button>
                  <span className="num">{fmtTicket(r.price * sc, year)}</span>
                  <button className="sv-step" onClick={() => bump(r.k, 1)} aria-label="teurer">+</button>
                </div> : '–'}
                {r.open && <div className="sv-sub">Richtpreis {fmtTicket(r.ref * sc, year)}{Math.abs(r.price / r.ref - 1) > 0.02 ? ` · ${r.price > r.ref ? '+' : '−'}${Math.round(Math.abs(r.price / r.ref - 1) * 100)} %` : ''}</div>}
              </td>
              <td>{r.est && r.cap > 0 ? <DemandBar lo={r.est.lo} hi={r.est.hi} cap={r.cap} soldOut={r.est.soldOut} unit={r.k === 'loge' ? 'Logen' : ''} /> : <span className="sv-muted">{r.open ? 'kein Kontingent' : ''}</span>}</td>
              <td className="c"><Spark vals={r.last} /></td>
              <td className="r num">{r.rev > 0 ? formatMoney(r.rev, year, true) : '–'}</td>
              <td className="r num">{r.seasonRev > 0 ? formatMoney(r.seasonRev, year, true) : '–'}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr><td colSpan={5} className="sv-muted">
            Preisniveau der Fanplätze {Math.round(idx * 100)} % des Richtpreises{idx > 1.12 ? ' – die Kurve murrt' : idx < 0.9 ? ' – die Fans freut es' : ''}.
            {' '}Schätzung ±{Math.round((rows.find((r) => r.k === 'steh')?.est?.fog ?? 0.16) * 100)} %{staff.names.length ? ` (genauer durch ${staff.names.length === 1 ? staff.names[0] : `${staff.names.length} Mitarbeiter`})` : ' – Kaufmännischer Leiter, Marketing- oder Eventmanager machen sie genauer'}.
            {wheelchair ? ` ${n0(wheelchair)} Rollstuhlplätze (Pflicht seit 2002).` : ''}
          </td><td className="r num strong">{formatMoney(perMatch, year, true)}</td><td className="r num strong">{season ? formatMoney(Object.values(season.rev).reduce((a, v) => a + (v ?? 0), 0), year, true) : '–'}</td></tr>
        </tfoot>
      </table>
    </div>
  );
}

/** Spanne der geschätzten Nachfrage gegen das Kontingent. */
function DemandBar({ lo, hi, cap, soldOut, unit }: { lo: number; hi: number; cap: number; soldOut: boolean; unit: string }) {
  const max = Math.max(cap, hi) * 1.08 || 1;
  const p = (v: number) => `${Math.min(100, (v / max) * 100)}%`;
  const over = lo >= cap;
  return (
    <div className="sv-dem">
      <div className="sv-dem-track">
        <span className="sv-dem-band" style={{ left: p(lo), width: `calc(${p(hi)} - ${p(lo)})` }} />
        <span className="sv-dem-cap" style={{ left: p(cap) }} />
      </div>
      <div className="sv-dem-txt">
        <span className="num">{n0(lo)}–{n0(hi)}{unit ? ` ${unit}` : ''}</span>
        <span className={over ? 'pos' : hi < cap * 0.8 ? 'neg' : ''}>{soldOut ? 'zuletzt ausverkauft' : over ? 'mehr als Plätze' : hi < cap * 0.8 ? 'Plätze bleiben frei' : 'etwa ausgelastet'}</span>
      </div>
    </div>
  );
}

function Spark({ vals }: { vals: (number | null)[] }) {
  if (!vals.some((v) => v != null)) return <span className="sv-muted">–</span>;
  return (
    <span className="sv-spark" title="Auslastung der letzten Heimspiele">
      {vals.map((v, i) => <i key={i} style={{ height: `${v == null ? 0 : Math.max(8, v * 100)}%` }} className={v != null && v >= 0.97 ? 'full' : ''} />)}
    </span>
  );
}
