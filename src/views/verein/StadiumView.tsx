// =============================================================================
// STADION — eine große Szene, direkt bedienbar:
//   • „Stadion ausbauen“ (Wunsch Pascal) bzw. Klick auf einen Block öffnet den
//     Planungsmodus: Blöcke nacheinander umplanen (Bau-Popover rechts: Ränge,
//     Platzkategorien, Dach, VIP, Logen, Bauweise), die Szene zeigt sofort das
//     Stadion nach allen Umbauten (geplante Blöcke gestrichelt umrandet), die
//     Entwurfs-Box links Summe, Prüfung und „Bauen“/„Verwerfen“ (stadium/PlanPanel).
//     Gebaut wird erst dort – alle Blöcke in einem Projekt.
//   • Buden, Fanshop, Parkplatz, Hospitality … rund ums Stadion anklicken →
//     dieselben Ausbau-Ansichten wie auf dem Vereinsgelände (GroundsDetail).
//   • Kassenhäuschen oder „Kartenverkauf“ → Seite Verein › Kartenverkauf (Preise je
//     Tribüne, Preiskategorie je Spiel, Prognose-Spannen; views/verein/TicketsView.tsx).
//   • Leiste unten filtert, was anklickbar ist (Tribünen, Gastronomie, Handel …).
// Das Gelände liegt fest außerhalb der größtmöglichen Tribünen: beim Ausbau wachsen nur
// die Tribünen. Linke Maustaste verschiebt die Szene, das Mausrad zoomt (StadiumScene).
// =============================================================================
import { useRef, useState } from 'react';
import { yearOf } from '../../engine/economy';
import { expectedSale, saleRevenue } from '../../engine/seating';
import { BLOCK_NAME, BLOCK_SIDE, migrateBlocks, roofShare, seatedCapacity } from '../../engine/stadiumBlocks';
import { ensureClubGrounds } from '../../game/groundsGame';
import { ensureStadiumBlocks, projectName } from '../../game/stadiumGame';
import { Game } from '../../game/state';
import { BlockId, FacilityKey, StadiumBlock } from '../../types';
import type { GroundsModuleKey } from '../../types/grounds';
import { fmtDM } from '../../ui/format';
import { FacilityDetail, ModuleDetail } from './grounds/GroundsDetail';
import { BlockConfigurator } from './stadium/BlockConfigurator';
import { PlanPanel } from './stadium/PlanPanel';
import { perMatch } from './stadium/planModel';
import { usePlanDraft } from './stadium/usePlanDraft';
import { RebuildPanel } from './stadium/RebuildPanel';
import { stadiumComfort } from '../../engine/stadiumStandard';
import { StadiumScene } from './stadium/StadiumScene';
import { VENUE_GROUPS, Venue, VenueGroup, venuesOf } from './stadium/StadiumSurround';
import { InfoTip } from '../../ui/InfoTip';

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
  const [planOn, setPlanOn] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [oldSel, setOldSel] = useState<BlockId | null>(null); // altes Ausbauprojekt läuft: nur Hinweis
  const [venue, setVenue] = useState<Venue['key'] | null>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [hover, setHover] = useState<BlockId | null>(null);
  // Bausubstanz/Neubau (Popover rechts) und Vorschau des geplanten Neubaus in der Szene
  const [rebuild, setRebuild] = useState(false);
  const [rbPreview, setRbPreview] = useState<StadiumBlock[] | null>(null);
  const [crowd, setCrowd] = useState(() => { try { return localStorage.getItem('fm_stadium_crowd') !== '0'; } catch { return true; } });
  const toggleCrowd = () => setCrowd((v) => { try { localStorage.setItem('fm_stadium_crowd', v ? '0' : '1'); } catch { /* ohne Speicher */ } return !v; });
  const blocks = st.blocks?.length ? st.blocks : migrateBlocks(club, year); // altes Projekt läuft: nur Vorschau
  const editable = !!st.blocks?.length;
  const pd = usePlanDraft(g, blocks, editable);
  const sel = planOn ? pd.sel : null;
  const shown = rbPreview ?? (planOn ? pd.applied : blocks);
  const gr = ensureClubGrounds(club, today);
  const venues = venuesOf(club, year);

  const place = (e?: { clientX: number; clientY: number }) => {
    const r = wrap.current?.getBoundingClientRect();
    setAnchor(r && e ? { x: e.clientX - r.left, y: e.clientY - r.top } : null);
  };
  // Klick ins Leere schließt nur das Block-Popover; der Planungsmodus bleibt offen.
  const close = () => { pd.select(null); setOldSel(null); setVenue(null); setRebuild(false); setRbPreview(null); };
  const exitPlan = () => { pd.select(null); setPlanOn(false); };
  const openPlan = () => { close(); setNotice(null); setMode('alles'); setPlanOn(true); };
  // Einzelumbau führt in den Planungsmodus: ein Weg zum Bauen, ein Block = ein Entwurf mit einem Block.
  const selectBlock = (id: BlockId | null, e?: { clientX: number; clientY: number }) => {
    setVenue(null); setRebuild(false); setRbPreview(null); place(e);
    if (id && editable && !planOn) { setNotice(null); setPlanOn(true); }
    pd.select(editable ? id : null);
    if (!editable) setOldSel(id);
  };
  const selectVenue = (v: Venue, e: { clientX: number; clientY: number }) => {
    if (v.kind === 'tickets') { close(); onGoto?.('kartenverkauf'); return; }
    pd.select(null); setRebuild(false); setRbPreview(null); setVenue(v.key); place(e);
  };
  const blocksActive = planOn || mode === 'alles' || mode === 'tribuenen' || mode === 'vip';
  const venueActive = (v: Venue) => !planOn && (mode === 'alles' || v.group === mode || (v.group === 'tickets' && mode !== 'tribuenen'));

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
  const preview = planOn && pd.list.length && !rbPreview ? perMatch(club, shown, year) : null;
  const comfort = stadiumComfort(club, year);

  // Popover-Lage: Tribünen-Popover an den Rand gegenüber dem Block (die Vorschau bleibt sichtbar),
  // Umfeld-Popover direkt neben dem Gebäude; eine Führungslinie zeigt aufs Objekt.
  const W = wrap.current?.clientWidth ?? 1600, H = wrap.current?.clientHeight ?? 800;
  // Planungsmodus: Entwurfs-Box links, Block-Popover immer rechts.
  const popLeft = rebuild || planOn ? W - POP_W - 16 : anchor ? (oldSel ? (anchor.x < W / 2 ? W - POP_W - 16 : 16)
    : (anchor.x + 28 + POP_W < W - 12 ? anchor.x + 28 : Math.max(12, anchor.x - 28 - POP_W))) : W - POP_W - 16;
  const popTop = sel || oldSel || rebuild ? 64 : Math.max(64, Math.min((anchor?.y ?? 64) - 140, H - 520));
  // Feste Größe (Wunsch Pascal): Planen/Umschalten im Popover darf es nicht wachsen lassen – Inhalt scrollt intern.
  const popH = sel || oldSel || rebuild ? H - popTop - 70 : Math.min(H - popTop - 70, 620);
  const popStyle = { left: popLeft, top: popTop, width: POP_W, height: popH, maxHeight: H - popTop - 70 };
  const lead = anchor && (sel || oldSel || venue) ? (() => {
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
          <StadiumScene blocks={shown} built={st.built} crowd={crowd ? Math.max(0.35, Math.min(0.97, st.averageAttendanceRate ?? 0.6)) : 0} colors={{ primary, secondary }} year={year} month={month} land={gr.plots ? gr.plots.length : gr.landBought} onView={() => setAnchor(null)}
            selected={sel ?? oldSel} hover={hover} building={bp ? (bp.rebuild ? [bp.blockId] : [bp.blockId, ...(bp.more ?? []).map((t) => t.id)]) : null} buildingAll={!!bp?.rebuild}
            group={sel && pd.whole ? blocks.filter((b) => BLOCK_SIDE[b.id] === BLOCK_SIDE[sel]).map((b) => b.id) : []} ghost={rbPreview ? rbPreview.map((t) => t.id) : planOn ? pd.list.map((t) => t.id) : []}
            blocksActive={blocksActive} venues={venues} venueActive={venueActive} selectedVenue={venue}
            onSelect={selectBlock} onHover={setHover} onVenue={selectVenue} />

          <div className="sv-kpis" onClick={(e) => e.stopPropagation()}>
            <div className="sv-kpi-name"><b>{st.name}<InfoTip k="stadionBloecke" /></b><span>Kontostand {fmtDM(club.finances.balance)}</span></div>
            <div><b className="num">{cap.toLocaleString('de-DE')}</b><span>Plätze</span></div>
            <div><b className="num">{cap ? Math.round((seated / cap) * 100) : 0} %</b><span>Sitzplätze</span></div>
            <div><b className="num">{Math.round(roofShare(blocks) * 100)} %</b><span>überdacht<InfoTip k="ueberdacht" /></span></div>
            <div><b className="num">{(avgAtt || exp.attendance).toLocaleString('de-DE')}</b><span>{avgAtt ? 'Ø Zuschauer zuletzt' : 'Zuschauer erwartet'}</span></div>
            <div><b className="num">{fmtDM(expRev)}</b><span>Eintritt je Spiel</span></div>
            {comfort && <div className="sv-kpi-comfort" onClick={() => { close(); setRebuild(true); }} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') { close(); setRebuild(true); } }}>
              <b className={`num ${comfort.comfort < comfort.expect - 1 ? 'neg' : ''}`}>{Math.round(comfort.comfort)}<small> / {Math.round(comfort.expect)}</small></b><span>Komfort / Anspruch<InfoTip k="stadionKomfort" /></span></div>}
            {preview && <div className="sv-kpi-plan"><b className="num">{fmtDM(preview.rev)}</b><span>nach Umbau</span></div>}
            {(bp || old) && <div className="sv-kpi-build"><b>{bp ? projectName(bp) : `Ausbau Stufe ${old!.targetLevel}`}</b><span>im Bau bis {fmtD(bp ? bp.finishDate : old!.finishDate)}{bp ? ` · ${bp.capacityLoss.toLocaleString('de-DE')} Plätze gesperrt` : ''}</span></div>}
          </div>

          {planOn && <PlanPanel g={g} blocks={blocks} plan={pd.plan} selected={sel} onPick={(id) => { setAnchor(null); pd.select(id); }} onRemove={pd.remove}
            onClose={exitPlan} onDiscard={() => { pd.discard(); exitPlan(); }} onBuilt={(t) => { pd.discard(); exitPlan(); setNotice(t); onChange(); }} />}

          {lead && (sel || oldSel || vdef) && (
            <svg className="sv-lead" width={W} height={H}>
              <line x1={lead.x1} y1={lead.y1} x2={lead.x2} y2={lead.y2} />
              <circle cx={lead.x1} cy={lead.y1} r={4} />
            </svg>
          )}
          {(sel || oldSel || vdef || rebuild) && (
            <div className="sv-pop" style={popStyle} onClick={(e) => e.stopPropagation()}>
              {rebuild && <RebuildPanel g={g} onClose={close} onDone={() => { setRbPreview(null); onChange(); }} onPreview={setRbPreview} />}
              {sel && pd.draft && <BlockConfigurator key={sel} g={g} draft={pd.draft} setDraft={pd.setDraft} targets={pd.targets} whole={pd.whole} setWhole={pd.setWhole} onClose={close} onReset={pd.reset} />}
              {oldSel && !editable && <div className="sv-pop-body">
                <div className="sv-pop-head"><b>{BLOCK_NAME[oldSel]}</b><button className="modal-close sv-x" onClick={() => { close(); setOldSel(null); }}>×</button></div>
                <div className="sv-note">Der laufende Stadionausbau muss erst fertig werden. Danach kannst du jeden Block einzeln umbauen.</div>
              </div>}
              {vdef && vdef.kind === 'grounds' && <ModuleDetail key={vdef.key} {...common} k={vdef.key as GroundsModuleKey} />}
              {vdef && vdef.kind === 'facility' && <FacilityDetail key={vdef.key} {...common} k={vdef.key as FacilityKey} onGoto={onGoto} />}
            </div>
          )}

          <div className="sv-bar" onClick={(e) => e.stopPropagation()}>
            {editable && <button className={`b3 b3-s sv-plan-btn ${planOn ? 'on' : 'b3-primary'}`} aria-pressed={planOn} onClick={() => (planOn ? exitPlan() : openPlan())}>
              {planOn ? 'Planung schließen' : 'Stadion ausbauen'}{!planOn && pd.list.length > 0 && <em>{pd.list.length}</em>}
            </button>}
            <div className="sv-seg sv-modes">
              {([['alles', 'Alles'], ['tribuenen', 'Tribünen'], ...VENUE_GROUPS.map((v) => [v.key, v.name])] as [Mode, string][]).map(([k, n]) => (
                <button key={k} className={mode === k && !planOn ? 'on' : ''} onClick={() => { exitPlan(); setMode(k); close(); }}>{n}</button>
              ))}
            </div>
            <button className="btn btn-sm" onClick={() => onGoto?.('kartenverkauf')}>Kartenverkauf</button>
            {editable && <button className={`btn btn-sm sv-rebuild ${rebuild ? 'on' : ''}`} onClick={() => { const o = !rebuild; close(); exitPlan(); setRebuild(o); }}>Neubau</button>}
            <button className={`btn btn-sm sv-crowd ${crowd ? 'on' : ''}`} aria-pressed={crowd} onClick={toggleCrowd} title="Zuschauer im Stadion zeigen">Zuschauer</button>
            <span className={`sv-hint ${notice ? 'acc' : ''}`}>{notice ?? (planOn ? (sel ? 'Weitere Blöcke anklicken und umplanen – gebaut wird erst mit „Bauen“.' : 'Planungsmodus: Blöcke anklicken und umplanen – die Szene zeigt das Ergebnis.')
              : vdef || rebuild ? 'Außerhalb klicken schließt das Fenster.' : 'Block oder Gebäude anklicken zum Ausbauen – das Kassenhäuschen öffnet den Kartenverkauf.')}</span>
          </div>
        </div>
    </div>
  );
}
