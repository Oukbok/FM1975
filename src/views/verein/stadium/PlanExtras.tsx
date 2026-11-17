// =============================================================================
// AUSSTATTUNG im Planungsmodus (Wunsch Pascal: ordentliche Kategorien mit schönen
// Auswahl-Kacheln statt kleiner Knöpfe). Vier Karten untereinander:
//   Anzeigetafel – Kacheln je Art der Epoche (Bild, Name, Zeitraum, Preis),
//   Standort     – Stadionplan von oben, Orte direkt anklicken (bis 2; Würfel = Mitte),
//   Banden       – Kacheln je Bandenart mit Werbefaktor,
//   Laufbahn     – zwei Kacheln mit/ohne.
// Jede Wahl landet im Entwurf; gebaut wird mit „Bauen“. Regeln/Kosten:
// engine/stadiumExtras.ts. CSS `.spx-*` in 28-stadium.css.
// =============================================================================
import type { ReactNode } from 'react';
import {
  ADS_KINDS, BOARD_KINDS, MAX_SPOTS, SPOT_NAME, TRACK_ADD_COST, TRACK_REMOVE_COST, adsKindsFor, boardKindsFor, cubeAllowed,
  type AdsKind, type BoardKind, type BoardSpot, type StadiumExtras,
} from '../../../engine/stadiumExtras';
import { nominalCost } from '../../../game/stadiumGame';
import type { StadiumBlock } from '../../../types';
import Icon from '../../../components/Icon';
import { fmtDM } from '../../../ui/format';
import { InfoTip } from '../../../ui/InfoTip';

const span = (from: number, until?: number) => (until ? `${from || 'bis'}${from ? '–' : ' '}${until}` : from ? `ab ${from}` : 'immer');

/** Kleine Bilder je Auswahl (nur Linien in currentColor + Akzent über CSS). */
const BOARD_ART: Record<BoardKind | 'none', ReactNode> = {
  none: <><rect x="6" y="8" width="36" height="18" rx="2" className="ln dash" /></>,
  hand: <><rect x="6" y="6" width="36" height="20" rx="2" className="ln" /><rect x="10" y="10" width="7" height="12" className="fl" /><rect x="19" y="10" width="7" height="12" className="fl" /><rect x="31" y="10" width="7" height="12" className="fl" /><line x1="24" y1="26" x2="24" y2="31" className="ln" /></>,
  elektro: <><rect x="6" y="6" width="36" height="20" rx="2" className="ln" />{[0, 1, 2].map((r) => [0, 1, 2, 3, 4, 5, 6].map((c) => <circle key={`${r}${c}`} cx={11 + c * 4.3} cy={11 + r * 5} r="1.3" className="ac" />))}<line x1="24" y1="26" x2="24" y2="31" className="ln" /></>,
  video: <><rect x="4" y="5" width="40" height="22" rx="2" className="ln" /><path d="M8 23 L18 14 L25 19 L31 12 L40 23 Z" className="fl" /><line x1="24" y1="27" x2="24" y2="31" className="ln" /></>,
  led: <><rect x="4" y="5" width="40" height="22" rx="2" className="fl2" /><path d="M8 23 L18 14 L25 19 L31 12 L40 23 Z" className="ac" /><circle cx="36" cy="10" r="2.5" className="ac" /></>,
  cube: <><path d="M24 4 L38 10 L38 24 L24 30 L10 24 L10 10 Z" className="ln" /><path d="M10 10 L24 16 L38 10 M24 16 L24 30" className="ln" /><path d="M12 13 L22 17.5 L22 26 L12 21.5 Z" className="ac" /><path d="M26 17.5 L36 13 L36 21.5 L26 26 Z" className="fl" /></>,
};
const ADS_ART: Record<AdsKind, ReactNode> = {
  holz: <><rect x="4" y="12" width="40" height="10" className="ln" />{[12, 20, 28, 36].map((x) => <line key={x} x1={x} y1="12" x2={x} y2="22" className="ln" />)}<line x1="6" y1="17" x2="42" y2="17" className="ln dash" /></>,
  druck: <><rect x="4" y="12" width="40" height="10" rx="1" className="ln" /><rect x="8" y="14.5" width="14" height="5" className="fl" /><rect x="26" y="14.5" width="14" height="5" className="ac" /></>,
  prisma: <>{[4, 15, 26, 37].map((x, i) => <path key={x} d={`M${x} 22 L${x + 3.5} 12 L${x + 7} 22 Z`} className={i % 2 ? 'ac' : 'fl'} />)}<line x1="3" y1="22" x2="45" y2="22" className="ln" /></>,
  led: <><rect x="4" y="12" width="40" height="10" rx="1" className="fl2" /><rect x="8" y="14.5" width="32" height="5" className="ac" /><line x1="4" y1="26" x2="44" y2="26" className="ln dash" /></>,
};
const TRACK_ART = (on: boolean) => (
  <>{on && <rect x="3" y="4" width="42" height="26" rx="11" className="fl" />}<rect x={on ? 10 : 6} y={on ? 9 : 6} width={on ? 28 : 36} height={on ? 16 : 22} className="pitch" /><line x1="24" y1={on ? 9 : 6} x2="24" y2={on ? 25 : 28} className="ln" />{on && <rect x="3" y="4" width="42" height="26" rx="11" className="ln" />}</>
);

function Tile({ on, disabled, title, art, name, sub, note, onClick }: { on: boolean; disabled?: boolean; title?: string; art: ReactNode; name: string; sub: string; note?: string; onClick: () => void }) {
  return (
    <button className={`spx-tile ${on ? 'on' : ''}`} disabled={disabled} title={title} aria-pressed={on} onClick={onClick}>
      {on && <span className="spx-check"><Icon name="check" size={12} /></span>}
      <svg viewBox="0 0 48 34" className="spx-art" aria-hidden="true">{art}</svg>
      <b>{name}</b>
      <small>{sub}</small>
      {note && <em>{note}</em>}
    </button>
  );
}

/** Standort-Plan: Spielfeld von oben, Tafel-Orte zum Anklicken. Norden links (wie in der Szene). */
const SPOT_POS: Record<BoardSpot, [number, number]> = { north: [18, 60], south: [222, 60], nw: [30, 106], ne: [30, 14], sw: [210, 106], se: [210, 14], center: [120, 60] };
const SPOT_SHORT: Record<BoardSpot, string> = { north: 'N', south: 'S', nw: 'NW', ne: 'NO', sw: 'SW', se: 'SO', center: '' };
function SpotMap({ x, onToggle }: { x: StadiumExtras; onToggle: (s: BoardSpot) => void }) {
  const cube = x.board === 'cube';
  const spots: BoardSpot[] = cube ? ['center'] : ['north', 'south', 'nw', 'ne', 'sw', 'se'];
  return (
    <svg viewBox="0 0 240 120" className="spx-map" role="group" aria-label="Standort der Anzeigetafel">
      <rect x="4" y="4" width="232" height="112" rx="26" className="stand" />
      <rect x="44" y="22" width="152" height="76" className="pitch" />
      <line x1="120" y1="22" x2="120" y2="98" className="line" />
      <circle cx="120" cy="60" r="12" className="line" />
      <rect x="44" y="44" width="16" height="32" className="line" /><rect x="180" y="44" width="16" height="32" className="line" />
      <text x="120" y="114" className="cap">Haupttribüne</text>
      <text x="120" y="13" className="cap">Gegengerade</text>
      {spots.map((s) => {
        const on = x.spots.includes(s);
        const [cx, cy] = SPOT_POS[s];
        return (
          <g key={s} className={`spot ${on ? 'on' : ''}`} role="button" tabIndex={0} aria-pressed={on} aria-label={SPOT_NAME[s]}
            onClick={() => onToggle(s)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(s); } }}>
            <title>{SPOT_NAME[s]}</title>
            {s === 'center' ? <rect x={cx - 11} y={cy - 11} width="22" height="22" rx="3" /> : <rect x={cx - 13} y={cy - 9} width="26" height="18" rx="4" />}
            {SPOT_SHORT[s] && <text x={cx} y={cy + 4}>{SPOT_SHORT[s]}</text>}
          </g>
        );
      })}
    </svg>
  );
}

function Cat({ title, value, info, children }: { title: string; value: string; info?: ReactNode; children: ReactNode }) {
  return (
    <div className="spx-cat">
      <div className="spx-cat-h"><span>{title}{info}</span><b>{value}</b></div>
      {children}
    </div>
  );
}

export function PlanExtras({ x, cur, year, blocks, onChange }: {
  x: StadiumExtras; cur: StadiumExtras; year: number; blocks: StadiumBlock[]; onChange: (x: StadiumExtras) => void;
}) {
  const kinds = boardKindsFor(year, cur.board === 'none' ? undefined : cur.board);
  const ads = adsKindsFor(year, cur.ads);
  const cube = x.board === 'cube';
  const cubeOk = cubeAllowed(blocks);
  const price = (base: number) => fmtDM(nominalCost(base, year));
  const setBoard = (k: BoardKind | 'none') => {
    if (k === 'cube') onChange({ ...x, board: k, spots: ['center'] });
    else if (k === 'none') onChange({ ...x, board: k, spots: [] });
    else onChange({ ...x, board: k, spots: cube || !x.spots.length ? ['north'] : x.spots.filter((s) => s !== 'center') });
  };
  const toggleSpot = (s: BoardSpot) => {
    if (cube) return;
    const on = x.spots.includes(s);
    if (on && x.spots.length === 1) return;
    onChange({ ...x, spots: on ? x.spots.filter((v) => v !== s) : [...x.spots, s].slice(-MAX_SPOTS) });
  };
  const boardName = x.board === 'none' ? 'Keine' : BOARD_KINDS.find((k) => k.id === x.board)!.name;
  const adsName = ADS_KINDS.find((a) => a.id === x.ads)!.name;
  const bestand = (same: boolean) => (same ? 'Bestand' : undefined);
  return (
    <section className="bc-sec">
      <div className="bc-sec-h"><span>Ausstattung<InfoTip k="stadionAusstattung" /></span></div>
      <div className="spx">
        <Cat title="Anzeigetafel" value={boardName}>
          <div className="spx-tiles">
            <Tile on={x.board === 'none'} art={BOARD_ART.none} name="Keine" sub="ohne Tafel" note={bestand(cur.board === 'none')} onClick={() => setBoard('none')} />
            {kinds.map((k) => (
              <Tile key={k.id} on={x.board === k.id} disabled={k.id === 'cube' && !cubeOk && x.board !== 'cube'} title={k.id === 'cube' && !cubeOk ? 'Braucht ein volles Dach über beiden Geraden' : k.text}
                art={BOARD_ART[k.id]} name={k.name} sub={`${span(k.from, k.until)} · ${price(k.cost)}${k.id === 'cube' ? '' : ' je Ort'}`}
                note={bestand(cur.board === k.id) ?? (k.id === 'cube' && !cubeOk ? 'volles Dach nötig' : undefined)} onClick={() => setBoard(k.id)} />
            ))}
          </div>
        </Cat>

        {x.board !== 'none' && (
          <Cat title="Standort" value={x.spots.map((s) => SPOT_NAME[s]).join(' · ')}>
            <div className="spx-where">
              <SpotMap x={x} onToggle={toggleSpot} />
              <small className="spx-note">{cube ? 'Der Videowürfel hängt über dem Mittelkreis – jeder Platz sieht ein Bild.' : `Klicke bis zu ${MAX_SPOTS} Orte an. Zwei Tafeln sehen alle Ränge – voller Komfortwert; eine Tafel zählt drei Viertel.`}</small>
            </div>
          </Cat>
        )}

        <Cat title="Banden" value={adsName}>
          <div className="spx-tiles">
            {ads.map((a) => (
              <Tile key={a.id} on={x.ads === a.id} title={a.text} art={ADS_ART[a.id]} name={a.name}
                sub={`${span(a.from, a.until)} · ${price(a.cost)}`} note={bestand(cur.ads === a.id) ?? `Werbung ×${a.value.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`} onClick={() => onChange({ ...x, ads: a.id })} />
            ))}
          </div>
        </Cat>

        <Cat title="Laufbahn" value={x.track ? 'mit Laufbahn' : 'ohne Laufbahn'}>
          <div className="spx-tiles two">
            <Tile on={!x.track} art={TRACK_ART(false)} name="Ohne Laufbahn" sub={cur.track ? `Rückbau ${price(TRACK_REMOVE_COST)}` : 'Fans nah am Feld'} note={bestand(!cur.track) ?? 'Stimmung +2'} onClick={() => onChange({ ...x, track: false })} />
            <Tile on={x.track} art={TRACK_ART(true)} name="Mit Laufbahn" sub={cur.track ? 'Zuschauer weiter weg' : `Bau ${price(TRACK_ADD_COST)}`} note={bestand(cur.track) ?? 'Komfort und Stimmung −'} onClick={() => onChange({ ...x, track: true })} />
          </div>
        </Cat>
      </div>
    </section>
  );
}
