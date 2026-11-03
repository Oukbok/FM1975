// =============================================================================
// Sponsoring › Sponsoren-Pyramide: links Summen je Ebene und offene Angebote,
// rechts die Pyramide (Premium oben, Nebensponsoren, lokale Sponsoren unten)
// mit Logo-Kacheln je Platz – frei (gestrichelt, Zahl der Angebote) oder noch
// gesperrt (Freischaltjahr). Linksklick Karteikarte, Rechtsklick Aktionen.
// =============================================================================
import { SLOT_BY_ID } from '../../../data/sponsorCatalog';
import { upcomingSlots } from '../../../engine/sponsorship';
import { DashBox, DashPage, KV } from '../../../ui/DashPage';
import { fmtDM } from '../../../ui/format';
import { partnerMeta, yearly } from './parts';
import { SponsorLogo } from './SponsorLogo';
import { PYRAMID, SHIRT_SLOTS, BOARD_SLOTS, sumDeals, tilesFor, yearsText, type SpCtx, type Tile } from './model';
import type { SponsorUi } from './useSponsorUi';

export function TileView({ tile, ctx, ui }: { tile: Tile; ctx: SpCtx; ui: SponsorUi }) {
  const def = SLOT_BY_ID[tile.slot];
  if (tile.kind === 'deal') {
    const d = tile.deal;
    const t = { kind: 'deal' as const, id: d.id };
    return (
      <div className={`sp3-tile ${ui.isOpen(t) ? 'on' : ''} ${d.yearsLeft <= 1 ? 'ending' : ''}`} {...ui.bind(t, `${def.short}: ${d.partner}`)}>
        <SponsorLogo name={d.partner} industry={d.industry} year={Number(d.since.slice(0, 4))} className="sp3-tile-logo" />
        <span className="sp3-tile-cap"><b>{d.partner}</b><span>{def.short} · {fmtDM(yearly(d.annualValue, ctx.year, d.cut))}</span></span>
      </div>
    );
  }
  if (tile.kind === 'free') {
    const t = { kind: 'free' as const, slot: tile.slot };
    return (
      <div className={`sp3-tile free ${ui.isOpen(t) ? 'on' : ''}`} {...ui.bind(t, `${def.short}: frei`)}>
        <span className="sp3-tile-logo blank">{tile.offers > 0 && <span className="sp3-badge">{tile.offers}</span>}</span>
        <span className="sp3-tile-cap"><b>frei</b><span>{def.short}</span></span>
      </div>
    );
  }
  const t = { kind: 'locked' as const, slot: tile.slot };
  return (
    <div className="sp3-tile locked" {...ui.bind(t, `${def.short}: ${tile.why}`)}>
      <span className="sp3-tile-logo blank"><span className="sp3-lock">{tile.why}</span></span>
      <span className="sp3-tile-cap"><b>{def.short}</b><span>gesperrt</span></span>
    </div>
  );
}

export function PyramidTab({ ctx, ui }: { ctx: SpCtx; ui: SponsorUi }) {
  const { year, tier, offers } = ctx;
  const mine = new Set(PYRAMID.flatMap((l) => l.slots));
  const pOffers = offers.filter((o) => mine.has(o.slot));
  const levels = PYRAMID.map((l) => ({ ...l, tiles: tilesFor(ctx, l.slots), sum: sumDeals(ctx, l.slots) }));
  const total = levels.reduce((a, l) => a + l.sum, 0);
  const coming = upcomingSlots(year, tier).filter((s) => mine.has(s.id) || SHIRT_SLOTS.includes(s.id) || BOARD_SLOTS.includes(s.id)).slice(0, 4);
  return (
    <DashPage className="sp3-dpage">
      <DashBox title="Sponsoren-Pyramide" icon="sponsoring" info="partnerPyramide" rows={2}>
        {levels.map((l) => <KV key={l.id} k={l.name} v={l.sum ? fmtDM(l.sum) : '–'} />)}
        <KV k="Gesamt" v={fmtDM(total)} strong />
        <div className="dsec">Sponsorenangebote</div>
        {ui.note && <div className="sp-warn">{ui.note}</div>}
        <div className="sp3-offer-list">
          {pOffers.length ? pOffers.map((o) => (
            <div key={o.id} className={`sp3-orow ${ui.isOpen({ kind: 'offer', id: o.id }) ? 'on' : ''}`} {...ui.bind({ kind: 'offer', id: o.id }, o.partner)}>
              <SponsorLogo name={o.partner} industry={o.industry} year={year} variant="mark" className="sp3-orow-logo" />
              <span className="sp3-orow-name"><b>{o.partner}</b><span>{SLOT_BY_ID[o.slot].short}{o.renewal ? ' · Verlängerung' : ''} · {partnerMeta(o)} · {yearsText(o.years)}</span></span>
              <b className="sp3-orow-val">{fmtDM(yearly(o.annualValue, year))}</b>
            </div>
          )) : <div className="dnote">Keine offenen Angebote für die Pyramide. Neue Interessenten melden sich zum Saisonwechsel, im Lauf der Saison für freie Plätze und im Januar für auslaufende Verträge.</div>}
        </div>
        {coming.length > 0 && <div className="dsec">Kommt in den nächsten Jahren</div>}
        {coming.map((s) => <KV key={s.id} k={s.name} v={`ab ${s.unlock}/${String(s.unlock + 1).slice(2)}`} />)}
      </DashBox>

      <DashBox title="Partner" icon="dashVerein" span={2} rows={2} right={<span className="sp3-hint">Linksklick: Details · Rechtsklick: Aktionen</span>}>
        <div className="sp3-pyr">
          <svg className="sp3-pyr-bg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M50 2 L98 98 L2 98 Z" /></svg>
          {levels.map((l, i) => (
            <div key={l.id} className={`sp3-level lv${i}`}>
              <div className="sp3-level-lbl"><span>{l.short}</span><b>{l.sum ? fmtDM(l.sum) : '–'}</b></div>
              <div className="sp3-level-tiles">
                {l.tiles.length ? l.tiles.map((t) => <TileView key={t.key} tile={t} ctx={ctx} ui={ui} />)
                  : <div className="dnote">In deiner Liga gibt es auf dieser Ebene noch keine Partner.</div>}
              </div>
            </div>
          ))}
        </div>
      </DashBox>
    </DashPage>
  );
}
