// =============================================================================
// Sponsoring › Namensrechte: links Stadion (Name, Laufzeit, Summe), Tribünen
// (Einteilung STANDS aus data/seatingCatalog.ts mit Plätzen) und Angebote für
// den Stadionnamen (ab 2000, game/clubBusiness.ts); rechts die Draufsicht des
// Stadions mit acht Tribünen-Feldern, Namensschild in der Mitte und dem
// Bandenring in den Farben der Bandenpartner.
// =============================================================================
import { LOGE_GUESTS, STANDS } from '../../../data/seatingCatalog';
import { NAMING_RIGHTS_YEAR, namingAnnualNominal } from '../../../engine/clubBusiness';
import { rawStandCaps } from '../../../engine/seating';
import { currentNamingOffers } from '../../../game/clubBusiness';
import { standAnnualNominal, standLabel } from '../../../game/standNames';
import type { StandId } from '../../../types';
import { DashBox, DashPage } from '../../../ui/DashPage';
import { fmtDM } from '../../../ui/format';
import { SponsorLogo, logoSpec } from './SponsorLogo';
import { BOARD_SLOTS, namingIndustry, type SpCtx } from './model';
import type { SponsorUi } from './useSponsorUi';

// Draufsicht im viewBox 0 0 620 400: Spielfeld innen, Tribünen als Achteck außen.
const IN = { x0: 188, x1: 432, y0: 118, y1: 282 };
const OUT = { x0: 30, x1: 590, y0: 30, y1: 370, cut: 70 };
const SHAPES: Record<StandId, { pts: string; cx: number; cy: number; corner?: boolean }> = (() => {
  const { x0, x1, y0, y1 } = IN, o = OUT, c = o.cut;
  const P = (...p: number[][]) => p.map(([x, y]) => `${x},${y}`).join(' ');
  return {
    haupt: { pts: P([x0, y1], [x1, y1], [x1, o.y1], [x0, o.y1]), cx: (x0 + x1) / 2, cy: (y1 + o.y1) / 2 },
    gegen: { pts: P([x0, o.y0], [x1, o.y0], [x1, y0], [x0, y0]), cx: (x0 + x1) / 2, cy: (o.y0 + y0) / 2 },
    tor1: { pts: P([o.x0, y0], [x0, y0], [x0, y1], [o.x0, y1]), cx: (o.x0 + x0) / 2, cy: (y0 + y1) / 2 },
    tor2: { pts: P([x1, y0], [o.x1, y0], [o.x1, y1], [x1, y1]), cx: (x1 + o.x1) / 2, cy: (y0 + y1) / 2 },
    ecke1: { pts: P([o.x0, y1], [x0, y1], [x0, o.y1], [o.x0 + c, o.y1], [o.x0, o.y1 - c]), cx: 120, cy: 328, corner: true },
    ecke2: { pts: P([o.x0, y0], [o.x0, o.y0 + c], [o.x0 + c, o.y0], [x0, o.y0], [x0, y0]), cx: 120, cy: 72, corner: true },
    ecke3: { pts: P([x1, o.y0], [o.x1 - c, o.y0], [o.x1, o.y0 + c], [o.x1, y0], [x1, y0]), cx: 500, cy: 72, corner: true },
    ecke4: { pts: P([x1, y1], [o.x1, y1], [o.x1, o.y1 - c], [o.x1 - c, o.y1], [x1, o.y1]), cx: 500, cy: 328, corner: true },
  };
})();

const n0 = (v: number) => Math.round(v).toLocaleString('de-DE');

export function NamingTab({ ctx, ui }: { ctx: SpCtx; ui: SponsorUi }) {
  const { g, club, year, deals } = ctx;
  const nr = club.namingRights;
  const offers = currentNamingOffers(g);
  const caps = rawStandCaps(club);
  const people = Object.fromEntries(STANDS.map((s) => {
    const c = caps?.[s.id];
    return [s.id, c ? Object.entries(c).reduce((a, [k, v]) => a + (k === 'loge' ? v * LOGE_GUESTS : v), 0) : 0];
  })) as Record<StandId, number>;
  const totalPeople = caps ? Object.values(people).reduce((a, b) => a + b, 0) : club.stadium.capacity;
  const value = nr ? namingAnnualNominal(nr, club, year) : 0;
  const standTotal = STANDS.reduce((a, s) => { const n = club.standNames?.[s.id]; return a + (n?.kind === 'sponsor' ? standAnnualNominal(n, club, year) : 0); }, 0);
  const boards = deals.filter((d) => BOARD_SLOTS.includes(d.slot));
  const ringColors = boards.length ? boards.map((d) => logoSpec(d.partner, d.industry, Number(d.since.slice(0, 4))).bg) : [];
  const nt = { kind: 'naming' as const };

  // Bandenring: Segmente rund ums Feld, abwechselnd in den Farben der Partner (frei = grau).
  const ring: JSX.Element[] = [];
  const { x0, x1, y0, y1 } = IN;
  const seg = (k: string, x: number, y: number, w: number, h: number, i: number) =>
    ring.push(<rect key={k} x={x} y={y} width={w} height={h} fill={ringColors.length ? ringColors[i % ringColors.length] : undefined} className={ringColors.length ? 'sp3-ring' : 'sp3-ring free'} />);
  const n = 8, w = (x1 - x0 - 24) / n, h = (y1 - y0 - 24) / 5;
  for (let i = 0; i < n; i++) { seg(`t${i}`, x0 + 12 + i * w + 1, y0 + 6, w - 2, 5, i); seg(`b${i}`, x0 + 12 + i * w + 1, y1 - 11, w - 2, 5, i + 1); }
  for (let i = 0; i < 5; i++) { seg(`l${i}`, x0 + 6, y0 + 12 + i * h + 1, 5, h - 2, i); seg(`r${i}`, x1 - 11, y0 + 12 + i * h + 1, 5, h - 2, i + 1); }
  const P = { x0: x0 + 16, x1: x1 - 16, y0: y0 + 16, y1: y1 - 16 };
  const mx = (P.x0 + P.x1) / 2, my = (P.y0 + P.y1) / 2;

  return (
    <DashPage className="sp3-dpage">
      <DashBox title="Stadion" icon="stadium" info="namensrechte" rows={2}>
        <table className="dtable sp3-ntable">
          <thead><tr><th>Name</th><th className="r">Laufzeit</th><th className="r">Summe</th></tr></thead>
          <tbody>
            <tr className={`sp3-trow ${ui.isOpen(nt) ? 'on' : ''}`} {...ui.bind(nt, club.stadium.name)}>
              <td><b>{club.stadium.name}</b>{nr && <div className="sp-meta">Partner {nr.sponsor}</div>}</td>
              <td className="r">{nr ? `bis ${nr.untilYear}` : '–'}</td>
              <td className="r">{nr ? fmtDM(value) : '–'}</td>
            </tr>
          </tbody>
        </table>
        <div className="dsec">Tribünen</div>
        <table className="dtable sp3-ntable">
          <thead><tr><th>Name</th><th className="r">Plätze</th><th className="r">Summe</th></tr></thead>
          <tbody>
            {STANDS.map((s) => {
              const t = { kind: 'stand' as const, id: s.id };
              return (
                <tr key={s.id} className={`sp3-trow ${ui.isOpen(t) ? 'on' : ''}`} {...ui.bind(t, s.name)}>
                  <td>{standLabel(club, s.id)} <span className="sp-meta">{club.standNames?.[s.id] ? s.name : s.sub}</span></td>
                  <td className="r">{caps ? (people[s.id] ? n0(people[s.id]) : '–') : '–'}</td>
                  <td className="r sp3-dim">{(() => { const n = club.standNames?.[s.id]; return n?.kind === 'sponsor' ? fmtDM(standAnnualNominal(n, club, year)) : n?.kind === 'legend' ? 'Legende' : '–'; })()}</td>
                </tr>
              );
            })}
            <tr className="sp3-trow total"><td>Gesamt</td><td className="r">{n0(totalPeople)}</td><td className="r">{value + standTotal ? fmtDM(value + standTotal) : '–'}</td></tr>
          </tbody>
        </table>
        <div className="dsec">Angebote für den Stadionnamen</div>
        {ui.note && <div className="sp-warn">{ui.note}</div>}
        {offers.length ? offers.map((o, i) => {
          const t = { kind: 'namingOffer' as const, idx: i };
          return (
            <div key={o.sponsor + i} className={`sp3-orow ${ui.isOpen(t) ? 'on' : ''}`} {...ui.bind(t, o.sponsor)}>
              <SponsorLogo name={o.sponsor} industry={namingIndustry(o.sponsor)} year={year} variant="mark" className="sp3-orow-logo" />
              <span className="sp3-orow-name"><b>{o.sponsor}</b><span>„{o.arenaName}“ · bis {o.untilYear}</span></span>
              <b className="sp3-orow-val">{fmtDM(namingAnnualNominal(o, club, year))}</b>
            </div>
          );
        }) : <div className="dnote">{year < NAMING_RIGHTS_YEAR
          ? `Stadionnamen werden erst ab ${NAMING_RIGHTS_YEAR} verkauft – bis dahin trägt das Stadion seinen eigenen Namen.`
          : nr ? `Der Vertrag läuft bis ${nr.untilYear}. Ein Jahr vor dem Ende melden sich Interessenten.` : 'Im Moment keine Interessenten.'}</div>}
      </DashBox>

      <DashBox title="Namensrechte" icon="stadium" span={2} rows={2} right={<span className="sp3-hint">Linksklick: Details · Rechtsklick: Aktionen</span>}>
        <div className="sp3-stadium">
          <svg viewBox="0 0 620 400" role="img" aria-label="Stadion von oben">
            <defs>
              <pattern id="sp3-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="7" height="7" className="sp3-hatch-bg" /><line x1="0" y1="0" x2="0" y2="7" className="sp3-hatch-ln" />
              </pattern>
            </defs>
            {STANDS.map((s) => {
              const sh = SHAPES[s.id];
              const t = { kind: 'stand' as const, id: s.id };
              const empty = !!caps && people[s.id] <= 0;
              const tw = sh.corner ? 84 : 112, th = sh.corner ? 34 : 38;
              return (
                <g key={s.id} className={`sp3-stand ${ui.isOpen(t) ? 'on' : ''} ${empty ? 'empty' : ''}`} {...ui.bind(t, s.name)}>
                  <polygon points={sh.pts} fill="url(#sp3-hatch)" />
                  <rect x={sh.cx - tw / 2} y={sh.cy - th / 2} width={tw} height={th} rx="5" className="sp3-stand-plate" />
                  <text x={sh.cx} y={sh.cy - 2} textAnchor="middle" className="sp3-stand-name">{(() => { let l = standLabel(club, s.id); const max = sh.corner ? 11 : 14; if (l.length > max && l.includes('-')) l = l.split('-').slice(-2).join('-'); return l.length > max ? l.slice(0, max - 1) + '…' : l; })()}</text>
                  <text x={sh.cx} y={sh.cy + 11} textAnchor="middle" className="sp3-stand-sub">
                    {caps ? (people[s.id] ? `${n0(people[s.id])} Plätze` : 'nicht ausgebaut') : s.sub}
                  </text>
                </g>
              );
            })}
            <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} className="sp3-apron" />
            {ring}
            <rect x={P.x0} y={P.y0} width={P.x1 - P.x0} height={P.y1 - P.y0} className="sp3-turf" />
            {Array.from({ length: 10 }, (_, i) => i % 2 ? <rect key={i} x={P.x0 + i * (P.x1 - P.x0) / 10} y={P.y0} width={(P.x1 - P.x0) / 10} height={P.y1 - P.y0} className="sp3-turf-stripe" /> : null)}
            <g className="sp3-lines">
              <rect x={P.x0 + 4} y={P.y0 + 4} width={P.x1 - P.x0 - 8} height={P.y1 - P.y0 - 8} />
              <line x1={mx} y1={P.y0 + 4} x2={mx} y2={P.y1 - 4} />
              <circle cx={mx} cy={my} r="18" />
              <rect x={P.x0 + 4} y={my - 30} width="26" height="60" />
              <rect x={P.x1 - 30} y={my - 30} width="26" height="60" />
            </g>
            <g className={`sp3-nameplate ${ui.isOpen(nt) ? 'on' : ''} ${nr ? 'sold' : ''}`} {...ui.bind(nt, club.stadium.name)}>
              <rect x={mx - 92} y={my - 30} width="184" height="60" rx="6" />
              {nr && <svg x={mx - 84} y={my - 20} width="40" height="40" viewBox="0 0 40 40"><SponsorLogo name={nr.sponsor} industry={namingIndustry(nr.sponsor)} year={nr.fromYear} variant="mark" /></svg>}
              <text x={nr ? mx + 22 : mx} y={my - 2} textAnchor="middle" className="sp3-np-name">{club.stadium.name.length > 22 ? club.stadium.name.slice(0, 21) + '…' : club.stadium.name}</text>
              <text x={nr ? mx + 22 : mx} y={my + 16} textAnchor="middle" className="sp3-np-sub">
                {nr ? `bis ${nr.untilYear} · ${fmtDM(value)}` : year < NAMING_RIGHTS_YEAR ? `Namensrechte ab ${NAMING_RIGHTS_YEAR}` : offers.length ? `${offers.length} Angebote` : 'Name frei'}
              </text>
            </g>
          </svg>
        </div>
        <div className="sp3-legend">
          <span><i className="sp3-lg ring" />Bandenring in den Farben der Bandenpartner</span>
          <span>Tribünen nach der Einteilung im Kartenverkauf</span>
        </div>
      </DashBox>
    </DashPage>
  );
}
