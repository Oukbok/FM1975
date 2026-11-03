// Fanartikel › Allgemein: Sortiment & Vorräte, Übersicht, Artikel (Preis/Rabatt/Einkauf), Lager, Nachfrage.
import { useState } from 'react';
import type { Club } from '../../../types';
import type { MerchItemId, MerchShop } from '../../../types/merch';
import { Game } from '../../../game/state';
import { MERCH_BY_ID, MERCH_ITEMS, merchAvailable, merchUpcoming, FLOCK_YEAR, newKitSeason } from '../../../data/merchCatalog';
import {
  DISPOSE_RATE, orderCost, salePriceBase, stalePriceBase, seasonTotals, storeCapacity, storeUsed, storeValue, volumeDiscount, weekTotals,
} from '../../../engine/merch';
import {
  disposeMerch, freeUnits, orderAllWeeks, orderMerch, refillPlan, setMerchAuto, setMerchDiscount, setMerchPrice, setMerchStaleDiscount,
  stockWeeks, weeklyPotential, weeklyUnits,
} from '../../../game/merchGame';
import { commercialMultiplier } from '../../../engine/clubEconomy';
import { computeMonthly, expectedAttendance } from '../../../engine/finances';
import { economyScale } from '../../../engine/economy';
import { DashBox, KV, Meter } from '../../../ui/DashPage';
import { fmtDM, fmtDMfull } from '../../../ui/format';
import { MerchImage, MerchTabs, Signed, Stepper, money, n0, unitPrice, type MerchTab } from './parts';

interface Props { g: Game; club: Club; shop: MerchShop; year: number; tab: MerchTab; setTab: (t: MerchTab) => void; onChange: () => void }

/** Artikel, die gezeigt werden: im Sortiment oder mit Restbestand. */
export function shownItems(shop: MerchShop, year: number) {
  return MERCH_ITEMS.filter((d) => merchAvailable(d, year) || ((shop.items[d.id]?.stock ?? 0) + (shop.items[d.id]?.stale ?? 0)) > 0);
}

export function MerchGeneral(p: Props) {
  const { shop, year } = p;
  const items = shownItems(shop, year);
  const [sel, setSel] = useState<MerchItemId>(items.find((d) => d.id === 'trikot')?.id ?? items[0]?.id ?? 'schal');
  return (
    <>
      <StockBox {...p} sel={sel} setSel={setSel} />
      <OverviewBox {...p} />
      <ItemBox {...p} sel={sel} />
      <StoreBox {...p} />
      <DemandBox {...p} />
    </>
  );
}

// -----------------------------------------------------------------------------
function StockBox({ g, club, shop, year, tab, setTab, sel, setSel }: Props & { sel: MerchItemId; setSel: (id: MerchItemId) => void }) {
  const today = g.calendar.currentDate;
  const items = shownItems(shop, year);
  return (
    <DashBox title="Sortiment & Vorräte" info="merchSortiment" icon="merch" span={2} right={<MerchTabs tab={tab} setTab={setTab} />} flush>
      <table className="dtable rl-sm mc-table">
        <thead><tr>
          <th>Artikel</th><th className="num">Einkauf</th><th className="num">Preis</th><th className="num">Bestand</th>
          <th className="num">Verkauft</th><th className="num">Gewinn</th><th className="num">Rabatt</th><th className="num">Vorrat</th>
        </tr></thead>
        <tbody>
          {items.map((d) => {
            const st = shop.items[d.id];
            const sold = st?.season.sold ?? 0;
            const profit = (st?.season.rev ?? 0) - (st?.season.cost ?? 0);
            const wk = st ? stockWeeks(club, shop, d.id, today) : 0;
            const gone = !merchAvailable(d, year);
            return (
              <tr key={d.id} className={sel === d.id ? 'mc-sel' : ''} onClick={() => setSel(d.id)}>
                <td className="rl-name">{d.name}{(st?.stale ?? 0) > 0 && <span className="mc-tag">{n0(st!.stale)} Ladenhüter</span>}{gone && <span className="mc-tag">ausgelaufen</span>}</td>
                <td className="num muted">{unitPrice(d, d.cost, year)}</td>
                <td className="num">{st ? unitPrice(d, d.price * st.pf, year) : '–'}</td>
                <td className="num">{n0(st?.stock ?? 0)}</td>
                <td className="num">{n0(sold)}</td>
                <td className="num"><Signed v={profit} fmt={money} /></td>
                <td className="num">{st?.disc ? `${Math.round(st.disc * 100)} %` : '–'}</td>
                <td className="num" style={{ color: !gone && wk < 2 ? 'var(--neg)' : undefined }}>{gone ? '–' : wk >= 20 ? '> 20 Wo.' : `${wk.toFixed(1).replace('.', ',')} Wo.`}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </DashBox>
  );
}

// -----------------------------------------------------------------------------
function OverviewBox({ g, shop, onChange }: Props) {
  const t = seasonTotals(shop);
  const w = weekTotals(shop);
  const last = shop.weeks[shop.weeks.length - 1];
  const [weeks, setWeeks] = useState(6);
  const [note, setNote] = useState<string | null>(null);
  const plan = refillPlan(g.clubs[g.managedClubId], shop, weeks, g.calendar.currentDate);
  const planCost = plan.reduce((a, x) => a + x.cost, 0);
  return (
    <DashBox title="Übersicht" icon="finances" right={shop.season}>
      <KV k="Einnahmen letzte Woche" v={fmtDMfull(last?.rev ?? 0)} />
      <KV k="Ausgaben diese Woche" v={fmtDMfull(w.cost)} />
      <KV k="Umsatz der Saison" v={fmtDMfull(t.rev)} />
      <KV k="Einkauf der Saison" v={fmtDMfull(t.cost)} />
      <KV k="Saisongewinn" v={<Signed v={t.rev - t.cost} fmt={fmtDMfull} pos />} strong />
      <KV k="Kontostand" v={fmtDMfull(g.clubs[g.managedClubId].finances.balance)} />
      <label className="mc-auto">
        <input type="checkbox" checked={shop.auto} onChange={(e) => { setMerchAuto(g, e.target.checked); onChange(); }} />
        <span>Assistent kümmert sich um Einkauf und Ladenhüter</span>
      </label>
      {!shop.auto && (
        <div className="mc-refill">
          <span className="dkv-k">Alle Artikel auffüllen auf</span>
          <Stepper value={weeks} onChange={setWeeks} step={1} min={2} max={16} label="Wochen Vorrat" fmt={(v) => `${v} Wochen`} />
          <button className="btn btn-sm" disabled={!plan.length} onClick={() => { setNote(orderAllWeeks(g, weeks).text); onChange(); }}>
            {plan.length ? `Bestellen · ${fmtDM(planCost)}` : 'Vorrat reicht'}
          </button>
        </div>
      )}
      {note && <div className="dnote mt8">{note}</div>}
    </DashBox>
  );
}

// -----------------------------------------------------------------------------
function ItemBox({ g, club, shop, year, sel, onChange }: Props & { sel: MerchItemId }) {
  const d = MERCH_BY_ID[sel];
  const st = shop.items[sel];
  const today = g.calendar.currentDate;
  const avail = merchAvailable(d, year);
  const wk = st ? weeklyUnits(club, shop, sel, today) : 0;
  const free = freeUnits(club, shop, sel, year);
  const suggest = Math.max(0, Math.min(free, Math.ceil(wk * 4)));
  const [qty, setQty] = useState<number | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const q = Math.min(qty ?? suggest, free);
  const step = niceStep(Math.max(free, 10));
  const sale = st ? salePriceBase(d, st) : d.price;
  return (
    <DashBox title={d.name} info="merchArtikel" icon="merch" right={avail ? `${n0(wk)} Stück/Woche` : 'ausgelaufen'}>
      <div className="mc-item-head">
        <MerchImage name={d.img} alt={d.name} />
        <div className="mc-item-desc">
          <div>{d.desc}</div>
          <div className="dnote">Richtpreis {unitPrice(d, d.price, year)} · Einkauf {unitPrice(d, d.cost, year)}{d.model ? ` · neues Modell ${year >= 1990 ? 'jede Saison' : 'alle zwei Jahre'}` : ''}</div>
        </div>
      </div>
      {st && avail && <>
        <div className="mc-ctl"><span className="dkv-k">Verkaufspreis</span>
          <Stepper label="Verkaufspreis" value={st.pf} step={0.05} min={0.5} max={2} onChange={(v) => { setMerchPrice(g, sel, v); onChange(); }}
            fmt={(v) => <>{unitPrice(d, d.price * v, year)} <span className="muted">({Math.round(v * 100)} %)</span></>} />
        </div>
        <div className="mc-ctl"><span className="dkv-k">Rabatt</span>
          <Stepper label="Rabatt" value={st.disc} step={0.05} min={0} max={0.5} onChange={(v) => { setMerchDiscount(g, sel, v); onChange(); }}
            fmt={(v) => v ? `${Math.round(v * 100)} % → ${unitPrice(d, sale, year)}` : 'kein'} />
        </div>
        {st.stale > 0 && <div className="mc-ctl"><span className="dkv-k">Ladenhüter ({n0(st.stale)})</span>
          <Stepper label="Rabatt Ladenhüter" value={st.sdisc ?? 0} step={0.05} min={0} max={0.7} onChange={(v) => { setMerchStaleDiscount(g, sel, v); onChange(); }}
            fmt={(v) => `${Math.round(v * 100)} % → ${unitPrice(d, stalePriceBase(d, st), year)}`} />
        </div>}
        <div className="dsec">Nachbestellen</div>
        <div className="mc-order">
          <input type="range" min={0} max={Math.max(step, free)} step={step} value={q} onChange={(e) => setQty(Number(e.target.value))} aria-label="Menge" />
          <span className="mc-order-n">{n0(q)} Stück</span>
        </div>
        <KV k={`Mengenrabatt ${volumeDiscount(q) ? `${Math.round(volumeDiscount(q) * 100)} %` : ''}`} v={fmtDMfull(orderCost(d, q, year))} />
        <div className="dbtnrow mt8">
          <button className="btn btn-primary btn-sm" disabled={q <= 0} onClick={() => { setNote(orderMerch(g, sel, q).text); setQty(null); onChange(); }}>Artikel kaufen</button>
          <button className="btn btn-ghost btn-sm" disabled={!(st.stale > 0)} onClick={() => { setNote(disposeMerch(g, sel).text); onChange(); }}>Ladenhüter entsorgen</button>
        </div>
      </>}
      {st && !avail && (st.stock + st.stale) > 0 && (
        <button className="btn btn-sm mt8" onClick={() => { setNote(disposeMerch(g, sel).text); onChange(); }}>Restbestand an Restpostenhändler ({Math.round(DISPOSE_RATE * 100)} %)</button>
      )}
      {note && <div className="dnote mt8">{note}</div>}
    </DashBox>
  );
}

function niceStep(max: number): number {
  const raw = max / 60;
  const pow = Math.pow(10, Math.floor(Math.log10(Math.max(1, raw))));
  return [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? pow * 10;
}

// -----------------------------------------------------------------------------
function StoreBox({ club, shop, year }: Props) {
  const cap = storeCapacity(club, year);
  const used = storeUsed(shop);
  const lvl = Math.round(club.infrastructure?.merchandising ?? 1);
  const mega = club.grounds?.modules?.megastore?.level ?? 0;
  const stale = Object.values(shop.items).reduce((a, s) => a + (s?.stale ?? 0), 0);
  const pct = cap ? Math.round(used / cap * 100) : 0;
  return (
    <DashBox title="Lager" info="merchLager" icon="facilities" right={`${pct} % belegt`}>
      <div className="mc-store">
        <div className="mc-store-kv">
          <KV k="Gebäude" v={`Fanshop Stufe ${lvl}${mega ? ` + Megastore ${mega}` : ''}`} />
          <KV k="Lagerplätze" v={n0(cap)} />
          <Meter label="Belegt" value={used} max={cap} text={n0(used)} />
          <KV k="Wert des Lagers" v={fmtDMfull(storeValue(shop))} />
          <KV k="Ladenhüter" v={stale ? `${n0(stale)} Stück` : 'keine'} />
        </div>
        <MerchImage name="lager" alt="Fanartikel-Lager" icon="facilities" className="mc-img-store" />
      </div>
      <div className="dnote mt8">Mehr Platz bringt der Ausbau des Fanshops (Verein › Vereinsgelände) und ab 1990 ein Megastore im Umfeld.</div>
    </DashBox>
  );
}

// -----------------------------------------------------------------------------
function DemandBox({ g, club, shop, year }: Props) {
  const today = g.calendar.currentDate;
  const att = expectedAttendance(club, undefined, year);
  const pot = weeklyPotential(club, today);
  const startYear = Number(shop.season.slice(0, 4));
  const coming = merchUpcoming(year).slice(0, 3);
  const m = computeMonthly(club, g.players, g.table, economyScale(year), year);
  return (
    <DashBox title="Nachfrage" info="merchNachfrage" icon="fans">
      <KV k="Zuschauer je Heimspiel" v={n0(att)} />
      <KV k="Marke & Reichweite" info="merchMarke" v={`× ${commercialMultiplier(club, year).toFixed(2).replace('.', ',')}`} />
      <KV k={year >= FLOCK_YEAR ? 'Zugkraft der Stars (Trikots)' : 'Zugkraft der Stars (Poster)'} v={`× ${(shop.boost ?? 1).toFixed(2).replace('.', ',')}`} />
      <KV k="Umsatz zum Richtpreis / Woche" v={fmtDM(pot)} />
      {year >= 1978 && <KV k="Trikotmodell" v={newKitSeason(startYear) ? 'neu in dieser Saison' : 'aus der Vorsaison'} />}
      {m.merchGlobal > 0 && <KV k="Lizenzen & Versand weltweit / Jahr" info="merchLizenzen" v={fmtDM(m.merchGlobal * 12)} />}
      {coming.length > 0 && <>
        <div className="dsec">Bald im Sortiment</div>
        {coming.map((d) => <KV key={d.id} k={d.name} v={`ab ${d.from}`} />)}
      </>}
    </DashBox>
  );
}
