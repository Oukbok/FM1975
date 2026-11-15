// =============================================================================
// Sponsoring — offene Angebote zum Vergleichen (Wunsch Pascal: übersichtlich, mit
// klarem „Verhandeln“ bzw. „Unterschreiben“). Breite Tabelle `OfferTable`
// (Partner, Fläche, Image, pro Jahr, Laufzeit, Gesamt, Prämien, Klauseln, Knöpfe)
// und eine kompakte Zeile `OfferRow` für schmale Boxen. Linksklick auf die Zeile =
// Karteikarte, Rechtsklick = Kontextmenü (useSponsorUi); „Verhandeln“ öffnet den
// Verhandlungstisch (screens/negotiation/SponsorTalk.tsx).
// =============================================================================
import type { MouseEvent } from 'react';
import { SLOT_BY_ID, industryImage } from '../../../data/sponsorCatalog';
import { clauseLabel } from '../../../engine/sponsorship';
import { signSponsorOffer } from '../../../game/sponsorGame';
import type { SponsorDealOffer } from '../../../types/sponsor';
import { fmtDM } from '../../../ui/format';
import { SponsorLogo } from './SponsorLogo';
import { partnerMeta, yearly } from './parts';
import { yearsText, type SpCtx } from './model';
import type { SponsorUi } from './useSponsorUi';

const IMAGE = ['–', 'leicht umstritten', 'umstritten', 'hoch umstritten'];
const bonusMax = (o: SponsorDealOffer) => (o.bonuses.title ?? 0) + (o.bonuses.cup ?? 0) + (o.bonuses.euro ?? 0) + (o.bonuses.survive ?? 0);

function Actions({ ctx, ui, o }: { ctx: SpCtx; ui: SponsorUi; o: SponsorDealOffer }) {
  const stop = (f: () => void) => (e: MouseEvent) => { e.stopPropagation(); f(); };
  return (
    <span className="sp3-oact" onContextMenu={(e) => e.stopPropagation()}>
      <button type="button" className="b3 b3-s b3-primary" onClick={stop(() => ui.act(signSponsorOffer(ctx.g, o.id)))}
        title={o.renewal ? 'Verlängerung zu diesen Bedingungen annehmen' : 'Zu diesen Bedingungen unterschreiben'}>{o.renewal ? 'Verlängern' : 'Unterschreiben'}</button>
      <button type="button" className="b3 b3-s" onClick={stop(() => ui.talk(o.id))} title="Am Verhandlungstisch nachverhandeln">Verhandeln</button>
    </span>
  );
}

/** Breite Vergleichstabelle (Hauptsponsor). `onPreview` zeigt das Logo auf dem Trikot. */
export function OfferTable({ ctx, ui, offers, onPreview, preview, showSlot = true }: {
  ctx: SpCtx; ui: SponsorUi; offers: SponsorDealOffer[]; onPreview?: (o: SponsorDealOffer | null, pin?: boolean) => void; preview?: string | null; showSlot?: boolean;
}) {
  const { year } = ctx;
  return (
    <table className="dtable sp3-otable" onMouseLeave={() => onPreview?.(null)}>
      <colgroup>
        <col className="c-partner" />{showSlot && <col className="c-slot" />}<col className="c-img" /><col className="c-num" /><col className="c-years" /><col className="c-num" /><col className="c-num" /><col className="c-cl" /><col className="c-act" />
      </colgroup>
      <thead>
        <tr><th>Partner</th>{showSlot && <th>Fläche</th>}<th>Image</th><th className="r">Pro Jahr</th><th className="r">Laufzeit</th><th className="r">Gesamt</th><th className="r">Prämien bis</th><th>Klauseln</th><th /></tr>
      </thead>
      <tbody>
        {offers.map((o) => {
          const b = ui.bind({ kind: 'offer', id: o.id }, o.partner);
          const img = industryImage(o.industry, year, o.country);
          const per = yearly(o.annualValue, year);
          const cl = o.clauses.map(clauseLabel);
          return (
            <tr key={o.id} {...b} className={`sp3-orow2 ${ui.isOpen({ kind: 'offer', id: o.id }) || preview === o.id ? 'on' : ''}`}
              onMouseEnter={() => onPreview?.(o)} onFocus={() => onPreview?.(o)}
              onClick={(e) => { onPreview?.(o, true); b.onClick(e); }}>
              <td>
                <span className="sp3-ocell">
                  <SponsorLogo name={o.partner} industry={o.industry} year={year} variant="mark" className="sp3-orow-logo" />
                  <span className="sp3-orow-name"><b>{o.partner}</b><span>{partnerMeta(o)}{o.renewal ? ' · Verlängerung' : ''}</span></span>
                </span>
              </td>
              {showSlot && <td>{SLOT_BY_ID[o.slot].short}</td>}
              <td className={img ? 'sp3-img-bad' : 'sp3-img-ok'}>{IMAGE[Math.min(3, img)]}</td>
              <td className="r"><b>{fmtDM(per)}</b></td>
              <td className="r">{yearsText(o.years)}</td>
              <td className="r">{fmtDM(per * o.years)}</td>
              <td className="r">{bonusMax(o) ? fmtDM(yearly(bonusMax(o), year)) : '–'}</td>
              <td className="sp3-ocl" title={cl.join(' · ')}>{cl.length ? <><b>{cl.length}</b> {cl[0]}{cl.length > 1 ? ' …' : ''}</> : <span className="sp-none">keine</span>}</td>
              <td className="r"><Actions ctx={ctx} ui={ui} o={o} /></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** Kompakte Zeile für schmale Boxen (Pyramide, Banden). */
export function OfferRow({ ctx, ui, o }: { ctx: SpCtx; ui: SponsorUi; o: SponsorDealOffer }) {
  const { year } = ctx;
  const per = yearly(o.annualValue, year);
  return (
    <div className={`sp3-orow with-act ${ui.isOpen({ kind: 'offer', id: o.id }) ? 'on' : ''}`} {...ui.bind({ kind: 'offer', id: o.id }, o.partner)}>
      <SponsorLogo name={o.partner} industry={o.industry} year={year} variant="mark" className="sp3-orow-logo" />
      <span className="sp3-orow-name"><b>{o.partner}</b><span>{SLOT_BY_ID[o.slot].short}{o.renewal ? ' · Verlängerung' : ''} · {yearsText(o.years)} · gesamt {fmtDM(per * o.years)}</span></span>
      <b className="sp3-orow-val">{fmtDM(per)}</b>
      <Actions ctx={ctx} ui={ui} o={o} />
    </div>
  );
}
