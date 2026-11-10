// =============================================================================
// STADION — eine große Szene, direkt bedienbar:
//   • Block anklicken → Bau-Popover am Block (Ränge, Platzkategorien, Dach, VIP,
//     Logen) mit Geister-Vorschau in der Szene und Vorher → Nachher.
//   • Buden, Fanshop, Parkplatz, Hospitality … rund ums Stadion anklicken →
//     dieselben Ausbau-Ansichten wie auf dem Vereinsgelände (GroundsDetail).
//   • Kassenhäuschen oder „Kartenverkauf“ → Seite Verein › Kartenverkauf (Preise je
//     Tribüne, Preiskategorie je Spiel, Prognose-Spannen; views/verein/TicketsView.tsx).
//   • Leiste unten filtert, was anklickbar ist (Tribünen, Gastronomie, Handel …).
// Kamera und Ausschnitt sind fest (StadiumScene): nur die Tribünen wachsen.
// =============================================================================
import { useRef, useState } from 'react';
import { yearOf } from '../../engine/economy';
import { expectedSale, saleRevenue } from '../../engine/seating';
import { BLOCK_NAME, migrateBlocks, roofShare, seatedCapacity } from '../../engine/stadiumBlocks';
import { ensureClubGrounds } from '../../game/groundsGame';
import { ensureStadiumBlocks, projectName, sideTargets } from '../../game/stadiumGame';
import { Game } from '../../game/state';
import { BlockId, FacilityKey, StadiumBlock } from '../../types';
import type { GroundsModuleKey } from '../../types/grounds';
import { fmtDM } from '../../ui/format';
import { FacilityDetail, ModuleDetail } from './grounds/GroundsDetail';
import { BlockConfigurator, perMatch } from './stadium/BlockConfigurator';
import { StadiumScene } from './stadium/StadiumScene';
import { VENUE_GROUPS, Venue, VenueGroup, venuesOf } from './stadium/StadiumSurround';
import { InfoTip } from '../../ui/InfoTip';
import { LOCATIONS } from '../../data/groundsCatalog';

type Mode = 'alles' | 'tribuenen' | VenueGroup;
interface Anchor { x: number; y: number }
const lum = (hex: string) => { const n = parseInt((hex || '#888888').slice(1), 16); return (0.3 * ((n >> 16) & 255) + 0.59 * ((n >> 8) & 255) + 0.11 * (n & 255)) / 255; };
const fmtD = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;
const POP_W = 420;

export function StadiumView({ g, onChange, onGoto }: { g: Game; onChange: () => void; onGoto?: (s: 'stadium' | 'marketing' | 'akademie' | 'kartenverkauf') => void }) {
  useState(() => ensureStadiumBlocks(g)); // ältere Spielstände: Blöcke sofort anlegen
  const club = g.clubs[g.managedClubId];
  const st = club.stadium;
  const today = g.calendar.currentDate;
  const year = yearOf(today);
  const month = Number(today.slice(5, 7));
  const wrap = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>('alles');
  const [sel, setSel] = useState<BlockId | null>(null);
  const [venue, setVenue] = useState<Venue['key'] | null>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [hover, setHover] = useState<BlockId | null>(null);
  const [draft, setDraft] = useState<StadiumBlock | null>(null);
  const [whole, setWhole] = useState(false);
  const blocks = st.blocks?.length ? st.blocks : migrateBlocks(club, year); // altes Projekt läuft: nur Vorschau
  const editable = !!st.blocks?.length;
  const planned = draft ? sideTargets(blocks, draft, whole) : [];
  const changed = planned.filter((t) => JSON.stringify(t) !== JSON.stringify(blocks.find((b) => b.id === t.id)));
  const shown = blocks.map((b) => planned.find((t) => t.id === b.id) ?? b);
  const gr = ensureClubGrounds(club, today);
  const venues = venuesOf(club, year);

  const place = (e?: { clientX: number; clientY: number }) => {
    const r = wrap.current?.getBoundingClientRect();
    setAnchor(r && e ? { x: e.clientX - r.left, y: e.clientY - r.top } : null);
  };
  const close = () => { setSel(null); setVenue(null); setDraft(null); setWhole(false); };
  const selectBlock = (id: BlockId | null, e?: { clientX: number; clientY: number }) => {
    setVenue(null); setWhole(false); setSel(id); place(e);
    const b = id ? blocks.find((x) => x.id === id) : null;
    setDraft(b && editable ? JSON.parse(JSON.stringify(b)) : null);
  };
  const selectVenue = (v: Venue, e: { clientX: number; clientY: number }) => {
    if (v.kind === 'tickets') { close(); onGoto?.('kartenverkauf'); return; }
    setSel(null); setDraft(null); setVenue(v.key); place(e);
  };
  const blocksActive = mode === 'alles' || mode === 'tribuenen' || mode === 'vip';
  const venueActive = (v: Venue) => mode === 'alles' || v.group === mode || (v.group === 'tickets' && mode !== 'tribuenen');

  // Kennzahlen
  const cap = st.capacity;
  const seated = seatedCapacity(blocks);
  const exp = expectedSale(club, year);
  const expRev = Object.values(saleRevenue(club, exp.sold, year)).reduce((a, v) => a + (v ?? 0), 0);
  const log = (st.seating?.log ?? []).slice(0, 8);
  const avgAtt = log.length ? Math.round(log.reduce((a, e) => a + Object.entries(e.sold).reduce((s, [k, v]) => s + (k === 'loge' ? (v ?? 0) * 11 : v ?? 0), 0), 0) / log.length) : 0;
  const bp = st.blockProject, old = club.stadiumProject;
  const primary = lum(club.colors?.primary ?? '') < 0.18 ? (club.colors?.secondary ?? '#c0392b') : (club.colors?.primary ?? '#c0392b');
  const secondary = club.colors?.secondary ?? '#ffffff';
  const preview = changed.length && draft ? perMatch(club, shown, year) : null;

  // Popover-Lage: Tribünen-Popover an den Rand gegenüber dem Block (die Vorschau bleibt sichtbar),
  // Umfeld-Popover direkt neben dem Gebäude; eine Führungslinie zeigt aufs Objekt.
  const W = wrap.current?.clientWidth ?? 1600, H = wrap.current?.clientHeight ?? 800;
  const popLeft = anchor ? (sel ? (anchor.x < W / 2 ? W - POP_W - 16 : 16)
    : (anchor.x + 28 + POP_W < W - 12 ? anchor.x + 28 : Math.max(12, anchor.x - 28 - POP_W))) : W - POP_W - 16;
  const popTop = sel ? 64 : Math.max(64, Math.min((anchor?.y ?? 64) - 140, H - 520));
  // Feste Größe (Wunsch Pascal): Planen/Umschalten im Popover darf es nicht wachsen lassen – Inhalt scrollt intern.
  const popH = sel ? H - popTop - 70 : Math.min(H - popTop - 70, 620);
  const popStyle = { left: popLeft, top: popTop, width: POP_W, height: popH, maxHeight: H - popTop - 70 };
  const lead = anchor && (sel || venue) ? (() => {
    const edgeX = popLeft > anchor.x ? popLeft : popLeft + POP_W;
    const y = Math.max(popTop + 24, Math.min(anchor.y, popTop + 260));
    return { x1: anchor.x, y1: anchor.y, x2: edgeX, y2: y };
  })() : null;
  const vdef = venue ? venues.find((v) => v.key === venue) : null;
  const common = { g, club, gr, year, onChange, onClose: close };

  return (
    // Szenen-Seite: kein Rahmen, kein Kalender – Stadion und Umfeld füllen die Fläche (shell-scene in GameShell).
    <div className="scene-page">
        <div className="gr-wrap st-wrap sv-wrap" ref={wrap} onClick={() => close()}>
          <StadiumScene blocks={shown} colors={{ primary, secondary }} year={year} month={month} plazaExtra={Math.min(6, Math.max(0, gr.area - LOCATIONS[gr.location].area) * 0.25)}
            selected={sel} hover={hover} building={bp?.blockId ?? null} group={planned.map((t) => t.id)} ghost={changed.map((t) => t.id)}
            blocksActive={blocksActive} venues={venues} venueActive={venueActive} selectedVenue={venue}
            onSelect={selectBlock} onHover={setHover} onVenue={selectVenue} />

          <div className="sv-kpis" onClick={(e) => e.stopPropagation()}>
            <div className="sv-kpi-name"><b>{st.name}<InfoTip k="stadionBloecke" /></b><span>Kontostand {fmtDM(club.finances.balance)}</span></div>
            <div><b className="num">{cap.toLocaleString('de-DE')}</b><span>Plätze</span></div>
            <div><b className="num">{cap ? Math.round((seated / cap) * 100) : 0} %</b><span>Sitzplätze</span></div>
            <div><b className="num">{Math.round(roofShare(blocks) * 100)} %</b><span>überdacht<InfoTip k="ueberdacht" /></span></div>
            <div><b className="num">{(avgAtt || exp.attendance).toLocaleString('de-DE')}</b><span>{avgAtt ? 'Ø Zuschauer zuletzt' : 'Zuschauer erwartet'}</span></div>
            <div><b className="num">{fmtDM(expRev)}</b><span>Eintritt je Spiel</span></div>
            {preview && <div className="sv-kpi-plan"><b className="num">{fmtDM(preview.rev)}</b><span>nach Umbau</span></div>}
            {(bp || old) && <div className="sv-kpi-build"><b>{bp ? projectName(bp) : `Ausbau Stufe ${old!.targetLevel}`}</b><span>im Bau bis {fmtD(bp ? bp.finishDate : old!.finishDate)}{bp ? ` · ${bp.capacityLoss.toLocaleString('de-DE')} Plätze gesperrt` : ''}</span></div>}
          </div>

          {lead && (sel || vdef) && (
            <svg className="sv-lead" width={W} height={H}>
              <line x1={lead.x1} y1={lead.y1} x2={lead.x2} y2={lead.y2} />
              <circle cx={lead.x1} cy={lead.y1} r={4} />
            </svg>
          )}
          {(sel || vdef) && (
            <div className="sv-pop" style={popStyle} onClick={(e) => e.stopPropagation()}>
              {sel && draft && editable && <BlockConfigurator key={sel} g={g} draft={draft} setDraft={setDraft} whole={whole} setWhole={setWhole} onClose={close} onDone={onChange} />}
              {sel && !editable && <div className="sv-pop-body">
                <div className="sv-pop-head"><b>{BLOCK_NAME[sel]}</b><button className="modal-close sv-x" onClick={close}>×</button></div>
                <div className="sv-note">Der laufende Stadionausbau muss erst fertig werden. Danach kannst du jeden Block einzeln umbauen.</div>
              </div>}
              {vdef && vdef.kind === 'grounds' && <ModuleDetail key={vdef.key} {...common} k={vdef.key as GroundsModuleKey} />}
              {vdef && vdef.kind === 'facility' && <FacilityDetail key={vdef.key} {...common} k={vdef.key as FacilityKey} onGoto={onGoto} />}
            </div>
          )}

          <div className="sv-bar" onClick={(e) => e.stopPropagation()}>
            <div className="sv-seg sv-modes">
              {([['alles', 'Alles'], ['tribuenen', 'Tribünen'], ...VENUE_GROUPS.map((v) => [v.key, v.name])] as [Mode, string][]).map(([k, n]) => (
                <button key={k} className={mode === k ? 'on' : ''} onClick={() => { setMode(k); close(); }}>{n}</button>
              ))}
            </div>
            <button className="btn btn-sm" onClick={() => onGoto?.('kartenverkauf')}>Kartenverkauf</button>
            <span className="sv-hint">{sel || vdef ? 'Außerhalb klicken schließt die Planung.' : mode === 'tribuenen' ? 'Block anklicken: Ränge, Platzarten, Dach, Logen planen.' : 'Block oder Gebäude anklicken zum Ausbauen – das Kassenhäuschen öffnet den Kartenverkauf.'}</span>
          </div>
        </div>
    </div>
  );
}
