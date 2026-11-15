// =============================================================================
// Sponsoring › Hauptsponsor (Wunsch Pascal: übersichtlich, ganze Seite nutzen):
//   links oben    Einnahmen dieser Saison je Art, Chronik
//   links unten   Marke & Reichweite, Pflichtreisen
//   rechts oben   Trikot-Partner: Trikot (mit Vorschau) + Brust | Ausrüster | Ärmel
//   rechts unten  Offene Angebote für das Trikot als Vergleichstabelle mit
//                 „Unterschreiben“ und „Verhandeln“ (Verhandlungstisch); Zeiger auf
//                 einer Zeile zeigt das Logo auf dem Trikot.
// Feste Boxgrößen, Inhalt scrollt intern.
// =============================================================================
import { useState } from 'react';
import { campDestination } from '../../../data/campDestinations';
import { SLOT_BY_ID } from '../../../data/sponsorCatalog';
import { commercialMultiplier, ensureBrand } from '../../../engine/clubEconomy';
import { economyScale } from '../../../engine/economy';
import { computeMonthly } from '../../../engine/finances';
import { slotMarketValue, slotOpen, tvPresence } from '../../../engine/sponsorship';
import type { Screen } from '../../../shell/navigation';
import type { SponsorDeal, SponsorDealOffer, SponsorSlotId } from '../../../types/sponsor';
import { DashBox, DashPage, KV, Meter } from '../../../ui/DashPage';
import { fmtDM } from '../../../ui/format';
import Seg from '../../../ui/Seg';
import { OfferTable } from './OfferTable';
import { ClauseList, partnerMeta, yearly } from './parts';
import { SponsorJersey } from './SponsorJersey';
import { SponsorLogo } from './SponsorLogo';
import { SHIRT_SLOTS, incomeRows, untilSeason, type SpCtx, type SpTab } from './model';
import type { SponsorUi } from './useSponsorUi';

type Filter = 'alle' | SponsorSlotId;

export function MainTab({ ctx, ui, onTab, onGoto }: { ctx: SpCtx; ui: SponsorUi; onTab: (t: SpTab) => void; onGoto: (s: Screen) => void }) {
  const { g, club, year, deals, offers } = ctx;
  const [filter, setFilter] = useState<Filter>('alle');
  const [hover, setHover] = useState<SponsorDealOffer | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const m = computeMonthly(club, g.players, g.table, economyScale(year), year);
  const brand = ensureBrand(club);
  const rows = incomeRows(ctx);
  const sponsorTotal = rows.reduce((a, r) => a + r.value, 0);
  const extra = [
    { label: 'Lizenzen & Vermarktung', value: club.finances.commercialAnnual ?? 0 },
    ...(m.merchGlobal > 0 ? [{ label: 'Fanartikel weltweit', value: m.merchGlobal * 12 }] : []),
  ];
  const brust = deals.find((d) => d.slot === 'brust');
  const ausr = deals.find((d) => d.slot === 'ausruester');
  const aermel = deals.find((d) => d.slot === 'aermel');
  const aermelOpen = slotOpen(SLOT_BY_ID.aermel, year, ctx.tier);
  const shirtOffers = offers.filter((o) => SHIRT_SLOTS.includes(o.slot));
  const shown = filter === 'alle' ? shirtOffers : shirtOffers.filter((o) => o.slot === filter);
  const count = (s: SponsorSlotId) => shirtOffers.filter((o) => o.slot === s).length;
  const preview = hover ?? shirtOffers.find((o) => o.id === pinned) ?? null;
  const obligations = (club.commerce?.campObligations ?? []).filter((o) => o.season === g.season);
  const log = (club.commerce?.sponsorLog ?? []).slice(0, 3);
  const tv = tvPresence(club, year);
  const showOffers = (s: SponsorSlotId) => { setFilter(s); setPinned(null); };

  return (
    <DashPage className="sp3-dpage sp3-hp">
      <DashBox title="Einnahmen dieser Saison" icon="finances" info="partnerPyramide">
        <div className="sp3-income">
          {rows.map((r) => (
            <button key={r.label} className="sp3-inc-row" onClick={() => r.tab && onTab(r.tab)}>
              <span>{r.label}</span><b>{r.value ? fmtDM(r.value) : '–'}</b>
            </button>
          ))}
          <div className="sp3-inc-row total"><span>Sponsoring gesamt</span><b>{fmtDM(sponsorTotal)}</b></div>
          {extra.map((r) => <div key={r.label} className="sp3-inc-row sub"><span>{r.label}</span><b>{fmtDM(r.value)}</b></div>)}
        </div>
        <div className="dsec">Zuletzt</div>
        {log.length ? log.map((l, i) => <div key={i} className="dnote sp3-log">{l.date.split('-').reverse().join('.')} · {l.text}</div>)
          : <div className="dnote">Noch keine Abschlüsse in dieser Saison.</div>}
      </DashBox>

      <DashBox title="Trikot-Partner" icon="sponsoring" info="sponsorKlauseln" span={2}
        right={<span className="sp3-hint">Linksklick: Details · Rechtsklick: Aktionen</span>}>
        <div className="sp3-hp-top">
          <div className="sp3-hp-shirt">
            <SponsorJersey club={club} brust={brust} ausruester={ausr} aermel={aermel} year={year} ui={ui} aermelOpen={aermelOpen} preview={preview} />
            <div className="sp3-shirt-cap">{preview ? <>Vorschau: <b>{preview.partner}</b> · {SLOT_BY_ID[preview.slot].short}</> : `Heimtrikot ${g.season}`}</div>
          </div>
          <div className="sp3-hp-cards">
            <SlotCard ctx={ctx} ui={ui} slot="brust" d={brust} n={count('brust')} onOffers={showOffers} big />
            <SlotCard ctx={ctx} ui={ui} slot="ausruester" d={ausr} n={count('ausruester')} onOffers={showOffers} />
            {aermel || aermelOpen ? <SlotCard ctx={ctx} ui={ui} slot="aermel" d={aermel} n={count('aermel')} onOffers={showOffers} />
              : <div className="sp3-scard locked"><span className="sp3-scard-lbl">Ärmel</span><b>noch Liga-Fläche</b><span className="dnote">Ab 2017/18 vermarktet der Verein den Ärmel selbst.</span></div>}
          </div>
        </div>
      </DashBox>

      <DashBox title="Marke & Pflichten" icon="dashVerein" info="reichweite">
        <Meter label="TV-Präsenz" info="reichweite" value={tv * 100} text={Math.round(tv * 100)} />
        <Meter label="Regional" value={brand.regional} text={Math.round(brand.regional)} />
        <Meter label="National" value={brand.national} text={Math.round(brand.national)} />
        <Meter label="International" value={brand.international} text={Math.round(brand.international)} />
        <KV k="Markenfaktor" info="markenfaktor" v={commercialMultiplier(club, year).toFixed(2)} />
        <div className="dsec">Pflichtreisen</div>
        {obligations.length ? obligations.map((o, i) => (
          <KV key={i} k={`${o.window === 'winter' ? 'Winterlager' : 'Sommerreise'}: ${campDestination(o.destId)?.name ?? o.destId}`}
            v={o.status === 'done' ? 'erfüllt' : o.status === 'missed' ? 'verpasst' : `für ${o.partner}`}
            color={o.status === 'missed' ? 'var(--red)' : o.status === 'done' ? 'var(--green)' : undefined} />
        )) : <div className="dnote">Keine Pflichtreisen in dieser Saison.</div>}
        {obligations.some((o) => o.status === 'open') && <button className="dchip mt8" onClick={() => onGoto('trainingslager')}>Zum Trainingslager</button>}
      </DashBox>

      <DashBox title="Offene Angebote für das Trikot" icon="negotiations" info="sponsorVerhandlung" span={2} flush
        right={<span className="sp3-hint">Zeiger auf ein Angebot: Vorschau auf dem Trikot</span>}>
        <div className="sp3-hp-offers">
          <div className="sp3-hp-bar">
            <Seg<Filter> size="s" value={filter} onChange={(f) => { setFilter(f); setPinned(null); }} aria-label="Fläche"
              options={[{ v: 'alle', label: `Alle (${shirtOffers.length})` }, { v: 'brust', label: `Brust (${count('brust')})` },
                { v: 'ausruester', label: `Ausrüster (${count('ausruester')})` }, ...(aermelOpen ? [{ v: 'aermel' as Filter, label: `Ärmel (${count('aermel')})` }] : [])]} />
            {ui.note ? <span className="sp-warn">{ui.note}</span> : <span className="dnote">Unterschreiben zu diesen Bedingungen oder am Verhandlungstisch nachverhandeln.</span>}
          </div>
          <div className="sp3-hp-scroll">
            {shown.length ? <OfferTable ctx={ctx} ui={ui} offers={shown} preview={pinned} showSlot={filter === 'alle'}
              onPreview={(o, pin) => { if (pin && o) setPinned(o.id); else setHover(o); }} />
              : <div className="sp3-hp-empty">
                <b>{filter === 'alle' ? 'Keine offenen Angebote für das Trikot.' : `Kein Angebot für „${SLOT_BY_ID[filter].name}“.`}</b>
                <span className="dnote">Interessenten melden sich zum Saisonwechsel, im Lauf der Saison für freie Flächen und im Januar für auslaufende Verträge.</span>
              </div>}
          </div>
        </div>
      </DashBox>
    </DashPage>
  );
}

/** Karte je Trikotfläche: laufender Vertrag mit den wichtigsten Werten bzw. frei mit Marktwert und Angeboten. */
function SlotCard({ ctx, ui, slot, d, n, onOffers, big }: {
  ctx: SpCtx; ui: SponsorUi; slot: 'brust' | 'ausruester' | 'aermel'; d?: SponsorDeal; n: number; onOffers: (s: SponsorSlotId) => void; big?: boolean;
}) {
  const { g, year, club, tier } = ctx;
  const def = SLOT_BY_ID[slot];
  const s = economyScale(year);
  if (!d) {
    const market = slotMarketValue(club, slot, year, tier);
    const best = ctx.offers.filter((o) => o.slot === slot && !o.renewal).sort((x, y) => y.annualValue - x.annualValue)[0];
    return (
      <div className={`sp3-scard free ${ui.isOpen({ kind: 'free', slot }) ? 'on' : ''}`} {...ui.bind({ kind: 'free', slot }, def.name)}>
        <span className="sp3-scard-lbl">{def.short}</span>
        <b className="sp3-scard-name">frei</b>
        <span className="dnote">Marktwert ≈ {fmtDM(market)} pro Jahr</span>
        <span className="sp3-scard-desc">{def.desc}</span>
        {best && <span className="sp3-scard-best"><span>Bestes Angebot</span><b>{best.partner} · {fmtDM(yearly(best.annualValue, year))}</b></span>}
        <button type="button" className="b3 b3-s mt8" disabled={!n} onClick={(e) => { e.stopPropagation(); onOffers(slot); }}>
          {n ? `${n} Angebot${n === 1 ? '' : 'e'} vergleichen` : 'kein Angebot'}
        </button>
      </div>
    );
  }
  const b = d.bonuses;
  const renew = ctx.offers.find((o) => o.renewal && o.partner === d.partner);
  return (
    <div className={`sp3-scard ${big ? 'big' : ''} ${ui.isOpen({ kind: 'deal', id: d.id }) ? 'on' : ''}`} {...ui.bind({ kind: 'deal', id: d.id }, d.partner)}>
      <span className="sp3-scard-lbl">{def.short}</span>
      <span className="sp3-scard-head">
        <SponsorLogo name={d.partner} industry={d.industry} year={Number(d.since.slice(0, 4))} variant="mark" className="sp3-scard-logo" />
        <span className="sp3-orow-name"><b>{d.partner}</b><span>{partnerMeta(d)}</span></span>
      </span>
      <span className="sp3-scard-kv"><span>Pro Jahr</span><b>{fmtDM(yearly(d.annualValue, year, d.cut))}</b></span>
      <span className="sp3-scard-kv"><span>Bis</span><b className={d.yearsLeft <= 1 ? 'warn' : ''}>{untilSeason(g.season, d.yearsLeft)}</b></span>
      {big && <span className="sp3-scard-kv"><span>Prämien</span><b>{[b.title && `Meister ${fmtDM(b.title * s)}`, b.cup && `Pokal ${fmtDM(b.cup * s)}`, b.euro && `Europa ${fmtDM(b.euro * s)}`].filter(Boolean).join(' · ') || '–'}</b></span>}
      {d.next && <span className="sp3-scard-kv"><span>Ab nächster Saison</span><b>{fmtDM(yearly(d.next.annualValue, year))}</b></span>}
      <span className="sp3-scard-cl"><ClauseList clauses={d.clauses} compact /></span>
      {renew && <button type="button" className="b3 b3-s mt8" onClick={(e) => { e.stopPropagation(); onOffers(slot); }}>Verlängerungsangebot</button>}
    </div>
  );
}
