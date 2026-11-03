// =============================================================================
// Eintrittspreise festlegen: Tribüne × Platzkategorie (Steh, Sitz, Tribüne,
// Premium, Business, Logen – nur freigeschaltete mit Plätzen), Zeile „Alle
// Tribünen“ setzt den Preis einer Kategorie überall, Gästeblock als eigene Zeile.
// Je Feld: Preis mit −/+, Plätze und – für das gewählte Spiel – die Prognose-
// Spanne der Tribüne. Rechts: Einnahmen bei ausverkaufter Tribüne.
// =============================================================================
import { STANDS, STAND_CATS } from '../../../data/seatingCatalog';
import { catAvailable, priceOf, refPrice, seatPriceScale, standPrice } from '../../../engine/seating';
import { formatMoney } from '../../../engine/economy';
import { setCategoryPrice, setStandPrice, standWindow, type GameForecast } from '../../../game/ticketsGame';
import type { Game } from '../../../game/state';
import type { Club, SeatCat, SeatNums, StandId } from '../../../types';
import { InfoTip } from '../../../ui/InfoTip';
import { fmtTicket, n0, priceScale, span } from './ticketFmt';

interface Props {
  g: Game; club: Club; year: number;
  caps: SeatNums; stands: Record<StandId, SeatNums>;
  fc: GameForecast | null; sel: StandId | null; onSel: (s: StandId | null) => void; onChange: () => void;
}

const COL: Partial<Record<SeatCat, string>> = { steh: 'Stehplätze', sitz: 'Sitz offen', dach: 'Sitz überdacht', premium: 'Premium', business: 'Business', loge: 'Logen' };

export function PriceTable({ g, club, year, caps, stands, fc, sel, onSel, onChange }: Props) {
  const sc = seatPriceScale(club, year);
  const ps = priceScale(sc, year);
  const cats = STAND_CATS.filter((k) => catAvailable(k, year) && (caps[k] ?? 0) > 0);
  const gast = catAvailable('gast', year) && (caps.gast ?? 0) > 0;
  const unit = (k: SeatCat) => (k === 'loge' ? 'Logen' : 'Plätze');
  const full = (s: StandId) => cats.reduce((a, k) => a + (stands[s][k] ?? 0) * standPrice(club, s, k, year) * sc, 0);
  const gastFull = gast ? (caps.gast ?? 0) * priceOf(club, 'gast', year) * sc : 0;
  const total = STANDS.reduce((a, s) => a + full(s.id), 0) + gastFull;
  const dev = (k: SeatCat) => { const d = priceOf(club, k, year) / refPrice(club, k, year) - 1; return Math.abs(d) > 0.02 ? ` · ${d > 0 ? '+' : '−'}${Math.round(Math.abs(d) * 100)} %` : ''; };
  const people = (s: StandId) => cats.reduce((a, k) => a + (stands[s][k] ?? 0), 0);

  const Step = ({ base, onSet, own }: { base: number; onSet: (v: number) => void; own?: boolean }) => {
    return (
      <span className={`tk-step ${own ? 'own' : ''}`} title={own ? 'eigener Preis dieser Tribüne' : undefined}>
        <button onClick={(e) => { e.stopPropagation(); onSet(ps.bump(base, -1)); onChange(); }} aria-label="günstiger">−</button>
        <b className="num">{fmtTicket(base * sc, year)}</b>
        <button onClick={(e) => { e.stopPropagation(); onSet(ps.bump(base, 1)); onChange(); }} aria-label="teurer">+</button>
      </span>
    );
  };

  return (
    <div className="tk-prices">
      <table className="tk-ptab">
        <thead>
          <tr>
            <th>Tribüne<InfoTip k="tribuenen" /></th>
            {cats.map((k) => <th key={k} className="c">{COL[k]}{k === 'loge' ? <span className="tk-unit"> je Loge</span> : null}</th>)}
            <th className="r">Gesamt</th>
          </tr>
        </thead>
        <tbody>
          <tr className="tk-all">
            <td><div className="tk-sname">Alle Tribünen</div><div className="tk-ssub">setzt die Kategorie überall · Richtpreis = 100 %</div></td>
            {cats.map((k) => (
              <td key={k} className="c">
                <Step base={priceOf(club, k, year)} onSet={(v) => setCategoryPrice(g, k, v)} />
                <div className="tk-cell-sub">Richtpreis {fmtTicket(refPrice(club, k, year) * sc, year)}{dev(k)}</div>
              </td>
            ))}
            <td className="r tk-muted">{n0((caps.steh ?? 0) + (caps.sitz ?? 0) + (caps.dach ?? 0) + (caps.premium ?? 0) + (caps.business ?? 0))} Plätze</td>
          </tr>
          {STANDS.map((s) => {
            const n = people(s.id);
            return (
              <tr key={s.id} className={`${sel === s.id ? 'sel' : ''} ${n <= 0 ? 'none' : ''}`} onClick={() => onSel(sel === s.id ? null : s.id)}>
                <td><div className="tk-sname">{s.name}</div><div className="tk-ssub">{s.sub} · {n0(n)} Plätze</div></td>
                {cats.map((k) => {
                  const cap = stands[s.id][k] ?? 0;
                  if (cap <= 0) return <td key={k} className="c tk-muted">–</td>;
                  const w = fc ? standWindow(club, fc, s.id, k, year) : null;
                  return (
                    <td key={k} className="c">
                      <Step base={standPrice(club, s.id, k, year)} own={club.stadium.seating?.tickets?.stand?.[s.id]?.[k] != null} onSet={(v) => setStandPrice(g, s.id, k, v)} />
                      <div className="tk-cell-sub">{n0(cap)} {unit(k)}{fc ? <> · <span className="tk-fc">{w ? (w[0] === w[1] && w[1] >= cap ? 'ausverkauft' : span(w)) : '–'}</span></> : null}</div>
                    </td>
                  );
                })}
                <td className="r num">{full(s.id) > 0 ? formatMoney(full(s.id), year, true) : '–'}</td>
              </tr>
            );
          })}
          {gast && (
            <tr className="tk-gast">
              <td><div className="tk-sname">Gästeblock</div><div className="tk-ssub">Pflichtkontingent · {n0(caps.gast ?? 0)} Plätze</div></td>
              <td className="c" colSpan={Math.max(1, cats.length)}>
                <Step base={priceOf(club, 'gast', year)} onSet={(v) => setCategoryPrice(g, 'gast', v)} />
                <div className="tk-cell-sub">Richtpreis {fmtTicket(refPrice(club, 'gast', year) * sc, year)}{dev('gast')}{fc?.fc.gast ? <> · Prognose <span className="tk-fc">{span(fc.fc.gast)}</span></> : null}</div>
              </td>
              <td className="r num">{formatMoney(gastFull, year, true)}</td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={cats.length + 1}>Tageseinnahmen bei ausverkauftem Stadion{fc && fc.mult !== 1 ? <span className="tk-muted"> (ohne Zuschlag/Rabatt des Spiels)</span> : null}</td>
            <td className="r num tk-strong">{formatMoney(total, year, true)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
