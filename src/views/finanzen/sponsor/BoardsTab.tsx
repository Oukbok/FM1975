// =============================================================================
// Sponsoring › Bandenwerbung: oben der Spielfeldrand der Epoche (bemalte
// Holzbanden → bedruckte Kunststoffbanden → Prismenwender → LED mit wechselnden
// Motiven), darunter die Liste der Bandenverträge (Banden + Wettpartner, Topf
// „Werbung“) und rechts Angebote, freie Flächen, Fernsehen der Epoche.
// Bild-Slot sponsor/bande-<epoche>.webp siehe docs/bilder/BILDER.md.
// =============================================================================
import { useEffect, useState } from 'react';
import { LED_YEAR, SLOT_BY_ID } from '../../../data/sponsorCatalog';
import { bandenFactor, tvEraText, tvPresence } from '../../../engine/sponsorship';
import type { SponsorDeal } from '../../../types/sponsor';
import { DashBox, DashPage, KV } from '../../../ui/DashPage';
import { fmtDM } from '../../../ui/format';
import { partnerMeta, yearly } from './parts';
import { SponsorLogo, logoSpec } from './SponsorLogo';
import { BOARD_SLOTS, sumDeals, tilesFor, untilSeason, yearsText, type SpCtx, type Tile } from './model';
import type { SponsorUi } from './useSponsorUi';

export type BoardEra = 'holz' | 'druck' | 'prisma' | 'led';
export function boardEra(year: number): BoardEra {
  return year < 1988 ? 'holz' : year < 1995 ? 'druck' : year < LED_YEAR ? 'prisma' : 'led';
}
const ERA_TEXT: Record<BoardEra, { name: string; text: string }> = {
  holz: { name: 'Holzbanden', text: 'Von Hand bemalte Holztafeln, fest verschraubt. Ein Motiv steht die ganze Saison – im Fernsehen sieht man es nur in der Zusammenfassung.' },
  druck: { name: 'Kunststoffbanden', text: 'Bedruckte Kunststoff- und Planenbanden lösen das Holz ab: schneller gewechselt, sauberer im Fernsehbild.' },
  prisma: { name: 'Prismenwender', text: 'Drehende Lamellen zeigen mehrere Motive im Wechsel – eine Bande, mehrere Partner. Mit den Live-Übertragungen steigt ihr Wert.' },
  led: { name: 'LED-Banden', text: 'Leuchtbanden mit wechselnden Motiven im Minutentakt: mehr Werbezeit je Spiel, weltweit im Bild. Die Rechnung zählt dafür 20 % mehr.' },
};

/** Eine Bande im Stil der Epoche. */
function Board({ d, era, year, ui, idx, tick }: { d: SponsorDeal[]; era: BoardEra; year: number; ui: SponsorUi; idx: number; tick: number }) {
  const rot = era === 'led' || era === 'prisma';
  const deal = d.length ? d[(idx + (rot ? tick : 0)) % d.length] : null;
  if (!deal) {
    const t = { kind: 'free' as const, slot: 'banden' as const };
    return (
      <div className={`sp3-board ${era} free`} {...ui.bind(t, 'Bandenfläche frei')}>
        <span className="sp3-board-free">{era === 'holz' ? 'Hier könnte Ihre Werbung stehen' : 'Werbefläche frei'}</span>
      </div>
    );
  }
  const s = logoSpec(deal.partner, deal.industry, Number(deal.since.slice(0, 4)));
  const t = { kind: 'deal' as const, id: deal.id };
  return (
    <div className={`sp3-board ${era} ${ui.isOpen(t) ? 'on' : ''}`} style={{ background: era === 'led' ? undefined : s.bg }} {...ui.bind(t, deal.partner)}>
      <div key={`${deal.id}-${tick}`} className="sp3-board-face" style={era === 'led' ? { background: s.bg } : undefined}>
        <SponsorLogo name={deal.partner} industry={deal.industry} year={Number(deal.since.slice(0, 4))} variant="banner" className="sp3-board-logo" />
      </div>
    </div>
  );
}

function BannerCell({ tile, ctx }: { tile: Tile; ctx: SpCtx }) {
  if (tile.kind !== 'deal') return <span className="sp3-banner blank">{tile.kind === 'free' ? 'frei' : tile.why}</span>;
  const d = tile.deal;
  const s = logoSpec(d.partner, d.industry, Number(d.since.slice(0, 4)));
  return <span className="sp3-banner" style={{ background: s.bg }}><SponsorLogo name={d.partner} industry={d.industry} year={Number(d.since.slice(0, 4))} variant="banner" /></span>;
}

export function BoardsTab({ ctx, ui }: { ctx: SpCtx; ui: SponsorUi }) {
  const { g, club, year, offers } = ctx;
  const era = boardEra(year);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (era !== 'led' && era !== 'prisma') return;
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || (typeof navigator !== 'undefined' && navigator.webdriver)) return;
    const id = window.setInterval(() => setTick((x) => x + 1), era === 'led' ? 4000 : 6000);
    return () => clearInterval(id);
  }, [era]);
  const tiles = tilesFor(ctx, BOARD_SLOTS);
  const boardDeals = tiles.flatMap((t) => (t.kind === 'deal' ? [t.deal] : []));
  const free = tiles.filter((t) => t.kind === 'free').length;
  const bOffers = offers.filter((o) => BOARD_SLOTS.includes(o.slot));
  const N = 6;
  const total = sumDeals(ctx, BOARD_SLOTS);
  // Freie Flächen tauchen am Spielfeldrand als leere Bande auf.
  const seq = boardDeals.length ? Array.from({ length: N }, (_, i) => (free > 0 && i % 3 === 2 ? null : i)) : Array(N).fill(null);
  const tv = tvPresence(club, year);
  const info = ERA_TEXT[era];

  return (
    <DashPage className="sp3-dpage">
      <DashBox title={`Spielfeldrand · ${info.name}`} icon="stadium" span={3} right={<span className="sp3-hint">Linksklick: Details · Rechtsklick: Aktionen</span>}>
        <div className={`sp3-pitchside ${era}`}>
          <div className="sp3-crowd" aria-hidden="true" />
          <div className="sp3-boards">
            {seq.map((v, i) => <Board key={i} d={v == null ? [] : boardDeals} era={era} year={year} ui={ui} idx={v ?? 0} tick={tick} />)}
          </div>
          <div className="sp3-grass" aria-hidden="true" />
        </div>
      </DashBox>

      <DashBox title="Bandenwerbung" icon="sponsoring" info="partnerPyramide" span={2} flush>
        <table className="dtable sp3-btable">
          <thead><tr><th>Name</th><th>Fläche</th><th className="r">Laufzeit</th><th className="r">Summe</th></tr></thead>
          <tbody>
            {tiles.map((t) => {
              const target = t.kind === 'deal' ? { kind: 'deal' as const, id: t.deal.id } : { kind: t.kind, slot: t.slot } as const;
              return (
                <tr key={t.key} className={`sp3-trow ${t.kind !== 'deal' ? 'muted' : ''} ${ui.isOpen(target) ? 'on' : ''}`} {...ui.bind(target, SLOT_BY_ID[t.slot].name)}>
                  <td><BannerCell tile={t} ctx={ctx} /></td>
                  <td>{t.kind === 'deal' ? <><b>{t.deal.partner}</b><div className="sp-meta">{SLOT_BY_ID[t.slot].name} · {partnerMeta(t.deal)}</div></> : <span className="sp-meta">{SLOT_BY_ID[t.slot].name}{t.kind === 'free' && t.offers ? ` · ${t.offers} Angebot${t.offers === 1 ? '' : 'e'}` : ''}</span>}</td>
                  <td className="r">{t.kind === 'deal' ? <>{yearsText(t.deal.yearsTotal)}<div className="sp-meta">bis {untilSeason(g.season, t.deal.yearsLeft)}</div></> : '–'}</td>
                  <td className="r">{t.kind === 'deal' ? <b>{fmtDM(yearly(t.deal.annualValue, year, t.deal.cut))}</b> : '–'}</td>
                </tr>
              );
            })}
            <tr className="sp3-trow total"><td colSpan={3}>Gesamt pro Jahr</td><td className="r"><b>{fmtDM(total)}</b></td></tr>
          </tbody>
        </table>
      </DashBox>

      <DashBox title="Sponsorenangebote" icon="negotiations" info="verhandeln" right={free ? `${free} frei` : undefined}>
        {ui.note && <div className="sp-warn">{ui.note}</div>}
        <div className="sp3-offer-list">
          {bOffers.map((o) => (
            <div key={o.id} className={`sp3-orow ${ui.isOpen({ kind: 'offer', id: o.id }) ? 'on' : ''}`} {...ui.bind({ kind: 'offer', id: o.id }, o.partner)}>
              <SponsorLogo name={o.partner} industry={o.industry} year={year} variant="mark" className="sp3-orow-logo" />
              <span className="sp3-orow-name"><b>{o.partner}</b><span>{SLOT_BY_ID[o.slot].short}{o.renewal ? ' · Verlängerung' : ''} · {yearsText(o.years)}</span></span>
              <b className="sp3-orow-val">{fmtDM(yearly(o.annualValue, year))}</b>
            </div>
          ))}
        </div>
        {!bOffers.length && <div className="dnote">{free ? 'Für die freien Flächen liegt gerade kein Angebot vor.' : 'Alle Bandenflächen sind vergeben.'}</div>}
        {free > 0 && <div className="sp3-freenote">Noch {free} freie Bandenfläche{free === 1 ? '' : 'n'}.</div>}
        <div className="dsec">Banden in dieser Epoche</div>
        <div className="dnote">{info.text}</div>
        <KV k="TV-Präsenz" info="reichweite" v={Math.round(tv * 100)} />
        <KV k="Bandenwert (Zuschauer × TV)" v={`× ${bandenFactor(club, year).toFixed(2)}`} />
        <div className="dnote mt8">{tvEraText(year)}</div>
      </DashBox>
    </DashPage>
  );
}
