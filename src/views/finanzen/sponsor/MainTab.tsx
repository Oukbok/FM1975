// =============================================================================
// Sponsoring › Hauptsponsor: links Einnahmen dieser Saison je Art, Marke &
// Reichweite, Pflichten und Chronik; rechts Brustsponsor mit Vertrag und das
// Trikot in Vereinsfarben mit Brust-, Ausrüster- und Ärmel-Logo.
// =============================================================================
import { campDestination } from '../../../data/campDestinations';
import { SLOT_BY_ID } from '../../../data/sponsorCatalog';
import { commercialMultiplier, ensureBrand } from '../../../engine/clubEconomy';
import { economyScale } from '../../../engine/economy';
import { computeMonthly } from '../../../engine/finances';
import { slotOpen, tvPresence } from '../../../engine/sponsorship';
import type { Screen } from '../../../shell/navigation';
import type { SponsorDeal } from '../../../types/sponsor';
import { DashBox, DashPage, KV, Meter } from '../../../ui/DashPage';
import { fmtDM } from '../../../ui/format';
import { ClauseList, bonusText, partnerMeta, yearly } from './parts';
import { SponsorJersey } from './SponsorJersey';
import { SponsorLogo } from './SponsorLogo';
import { SHIRT_SLOTS, incomeRows, untilSeason, yearsText, type SpCtx, type SpTab } from './model';
import type { SponsorUi } from './useSponsorUi';

export function MainTab({ ctx, ui, onTab, onGoto }: { ctx: SpCtx; ui: SponsorUi; onTab: (t: SpTab) => void; onGoto: (s: Screen) => void }) {
  const { g, club, year, deals, offers } = ctx;
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
  const brustOffers = offers.filter((o) => o.slot === 'brust' && !o.renewal);
  // Übrige Trikot-Angebote (Ausrüster, Ärmel, Verlängerungen); freie Brust steht schon oben.
  const shirtOffers = offers.filter((o) => SHIRT_SLOTS.includes(o.slot) && !(o.slot === 'brust' && !brust && !o.renewal));
  const obligations = (club.commerce?.campObligations ?? []).filter((o) => o.season === g.season);
  const log = (club.commerce?.sponsorLog ?? []).slice(0, 4);
  const tv = tvPresence(club, year);

  return (
    <DashPage className="sp3-dpage">
      <DashBox title="Einnahmen dieser Saison" icon="finances" info="partnerPyramide" rows={2}>
        <div className="sp3-income">
          {rows.map((r) => (
            <button key={r.label} className="sp3-inc-row" onClick={() => r.tab && onTab(r.tab)}>
              <span>{r.label}</span><b>{r.value ? fmtDM(r.value) : '–'}</b>
            </button>
          ))}
          <div className="sp3-inc-row total"><span>Sponsoring gesamt</span><b>{fmtDM(sponsorTotal)}</b></div>
          {extra.map((r) => <div key={r.label} className="sp3-inc-row sub"><span>{r.label}</span><b>{fmtDM(r.value)}</b></div>)}
        </div>
        <div className="dsec">Marke & Reichweite</div>
        <Meter label="TV-Präsenz" info="reichweite" value={tv * 100} text={Math.round(tv * 100)} />
        <Meter label="Regional" value={brand.regional} text={Math.round(brand.regional)} />
        <Meter label="National" value={brand.national} text={Math.round(brand.national)} />
        <Meter label="International" value={brand.international} text={Math.round(brand.international)} />
        <KV k="Markenfaktor" info="markenfaktor" v={commercialMultiplier(club, year).toFixed(2)} />
        <div className="dsec">Pflichten</div>
        {obligations.length ? obligations.map((o, i) => (
          <KV key={i} k={`${o.window === 'winter' ? 'Winterlager' : 'Sommerreise'}: ${campDestination(o.destId)?.name ?? o.destId}`}
            v={o.status === 'done' ? 'erfüllt' : o.status === 'missed' ? 'verpasst' : `für ${o.partner}`}
            color={o.status === 'missed' ? 'var(--red)' : o.status === 'done' ? 'var(--green)' : undefined} />
        )) : <div className="dnote">Keine Pflichtreisen in dieser Saison.</div>}
        {obligations.some((o) => o.status === 'open') && <button className="dchip mt8" onClick={() => onGoto('trainingslager')}>Zum Trainingslager</button>}
        {log.length > 0 && <div className="dsec">Zuletzt</div>}
        {log.map((l, i) => <div key={i} className="dnote sp3-log">{l.date.split('-').reverse().join('.')} · {l.text}</div>)}
      </DashBox>

      <DashBox title="Hauptsponsor" icon="sponsoring" info="sponsorKlauseln" span={2} rows={2}
        right={<span className="sp3-hint">Linksklick: Details · Rechtsklick: Aktionen</span>}>
        <div className="sp3-main">
          <div className="sp3-main-info">
            {brust ? <DealSheet d={brust} ctx={ctx} ui={ui} /> : (
              <>
                <div className="sp3-empty-title">Trikotbrust frei</div>
                <div className="dnote">Ohne Brustsponsor fehlt die wichtigste Einnahme der Vermarktung. {brustOffers.length ? 'Diese Firmen wollen auf die Brust:' : 'Interessenten melden sich zum Saisonwechsel und im Lauf der Saison.'}</div>
                <div className="sp3-offer-list">
                  {brustOffers.map((o) => (
                    <div key={o.id} className={`sp3-orow ${ui.isOpen({ kind: 'offer', id: o.id }) ? 'on' : ''}`} {...ui.bind({ kind: 'offer', id: o.id }, o.partner)}>
                      <SponsorLogo name={o.partner} industry={o.industry} year={year} variant="mark" className="sp3-orow-logo" />
                      <span className="sp3-orow-name"><b>{o.partner}</b><span>{partnerMeta(o)} · {yearsText(o.years)}</span></span>
                      <b className="sp3-orow-val">{fmtDM(yearly(o.annualValue, year))}</b>
                    </div>
                  ))}
                </div>
              </>
            )}
            {ui.note && <div className="sp-warn mt8">{ui.note}</div>}
            <div className="dsec">Weitere Trikot-Partner</div>
            <div className="sp3-partners">
              <PartnerChip ctx={ctx} ui={ui} slot="ausruester" d={ausr} />
              {(aermel || slotOpen(SLOT_BY_ID.aermel, year, ctx.tier)) ? <PartnerChip ctx={ctx} ui={ui} slot="aermel" d={aermel} />
                : <div className="sp3-pchip locked"><span className="sp3-pchip-lbl">Ärmel</span><span className="dnote">ab 2017/18 vom Verein vermarktet</span></div>}
            </div>
            {shirtOffers.length > 0 && <div className="dsec">Angebote für das Trikot</div>}
            <div className="sp3-offer-list">
              {shirtOffers.map((o) => (
                <div key={o.id} className={`sp3-orow ${ui.isOpen({ kind: 'offer', id: o.id }) ? 'on' : ''}`} {...ui.bind({ kind: 'offer', id: o.id }, o.partner)}>
                  <SponsorLogo name={o.partner} industry={o.industry} year={year} variant="mark" className="sp3-orow-logo" />
                  <span className="sp3-orow-name"><b>{o.partner}</b><span>{SLOT_BY_ID[o.slot].short}{o.renewal ? ' · Verlängerung' : ''} · {partnerMeta(o)} · {yearsText(o.years)}</span></span>
                  <b className="sp3-orow-val">{fmtDM(yearly(o.annualValue, year))}</b>
                </div>
              ))}
            </div>
          </div>
          <div className="sp3-main-shirt">
            <SponsorJersey club={club} brust={brust} ausruester={ausr} aermel={aermel} year={year} ui={ui}
              aermelOpen={slotOpen(SLOT_BY_ID.aermel, year, ctx.tier)} />
            <div className="sp3-shirt-cap">Heimtrikot {g.season}</div>
          </div>
        </div>
      </DashBox>
    </DashPage>
  );
}

function DealSheet({ d, ctx, ui }: { d: SponsorDeal; ctx: SpCtx; ui: SponsorUi }) {
  const { year, g } = ctx;
  const s = economyScale(year);
  const b = d.bonuses;
  return (
    <div className="sp3-sheet">
      <div className={`sp3-sheet-head ${ui.isOpen({ kind: 'deal', id: d.id }) ? 'on' : ''}`} {...ui.bind({ kind: 'deal', id: d.id }, d.partner)}>
        <SponsorLogo name={d.partner} industry={d.industry} year={Number(d.since.slice(0, 4))} className="sp3-sheet-logo" />
        <div><div className="sp3-sheet-name">{d.partner}</div><div className="sp-meta">{partnerMeta(d)}</div></div>
      </div>
      <KV k="Summe pro Jahr" v={fmtDM(yearly(d.annualValue, year, d.cut))} strong />
      <KV k="Laufzeit" v={`${yearsText(d.yearsTotal)} (bis ${untilSeason(g.season, d.yearsLeft)})`} color={d.yearsLeft <= 1 ? 'var(--orange)' : undefined} />
      <KV k="Meisterschaft" v={b.title ? fmtDM(b.title * s) : '–'} />
      <KV k="Pokalsieg" v={b.cup ? fmtDM(b.cup * s) : '–'} />
      <KV k="Europapokal" v={b.euro ? fmtDM(b.euro * s) : '–'} />
      {b.survive ? <KV k="Klassenerhalt" v={fmtDM(b.survive * s)} /> : null}
      {d.next && <KV k="Ab nächster Saison" v={fmtDM(yearly(d.next.annualValue, year))} />}
      <div className="dsec">Klauseln</div>
      <ClauseList clauses={d.clauses} />
      {!bonusText(b, year) && <div className="dnote mt8">Keine Erfolgsprämien vereinbart.</div>}
    </div>
  );
}

function PartnerChip({ ctx, ui, slot, d }: { ctx: SpCtx; ui: SponsorUi; slot: 'ausruester' | 'aermel'; d?: SponsorDeal }) {
  const t = d ? { kind: 'deal' as const, id: d.id } : { kind: 'free' as const, slot };
  const n = ctx.offers.filter((o) => o.slot === slot && !o.renewal).length;
  return (
    <div className={`sp3-pchip ${d ? '' : 'free'} ${ui.isOpen(t) ? 'on' : ''}`} {...ui.bind(t, SLOT_BY_ID[slot].name)}>
      {d ? <SponsorLogo name={d.partner} industry={d.industry} year={Number(d.since.slice(0, 4))} variant="mark" className="sp3-pchip-logo" /> : <span className="sp3-pchip-logo blank" />}
      <span className="sp3-pchip-txt">
        <span className="sp3-pchip-lbl">{SLOT_BY_ID[slot].short}</span>
        <b>{d ? d.partner : 'frei'}</b>
        <span className="dnote">{d ? `${fmtDM(yearly(d.annualValue, ctx.year, d.cut))} · bis ${untilSeason(ctx.g.season, d.yearsLeft)}` : n ? `${n} Angebot${n === 1 ? '' : 'e'}` : 'kein Angebot'}</span>
      </span>
    </div>
  );
}
