// =============================================================================
// WETTBEWERBE – Verzeichnis für den Editor (Wunsch Pascal: jeder Wettbewerb
// editierbar, mit Perioden gleichen Reglements)
// -----------------------------------------------------------------------------
// Keine zweite Wahrheit: die Standardwerte jeder Saison kommen aus den
// eingebauten Funktionen (euroFormatBase, euroCompNameBase, accessSlotsBase,
// cupReplayBase, superEraBase, icPlansFor, leagueNameBase, compLabelBase …).
// Die Standard-Perioden entstehen, indem diese Werte Saison für Saison
// verglichen werden – ändert sich etwas, beginnt eine neue Periode.
// Der Datensatz (Feld `competitions`, data/competitions/overrides.ts) speichert
// je Wettbewerb seine Perioden und darin nur die geänderten Felder.
// =============================================================================
import type { TrophyShape } from '../../game/trophyCabinet';
import { accessSlotsBase, cupReplayBase, euroCompNameBase, euroFormatBase, type EuroFormat } from '../euroFormats';
import type { EuroCompId } from '../europe';
import { leagueCompId, leagueNameBase, LEAGUE_NAME_CCS } from '../leagueNames';
import { SUPER_CUPS, superEraBase, UEFA_SUPER, type SuperEra } from '../superCups';
import { compLabelBase, uylFormat } from '../youthCompetitions';
import { COUNTRY_BY_CC, COUNTRY_BY_KEY } from '../world/countries';
import { IC_FORMAT_DE, IC_NAMES, icPlansFor, type IcKey } from '../world/continents/intercontinental';
import { compPeriod, type CompPeriod } from './overrides';

export const COMP_FIRST = 1960;
export const COMP_LAST = 2100;
export const OPEN_END = 9999;

export type CompKind = 'league' | 'cup' | 'super' | 'uefasuper' | 'euro' | 'ic' | 'halle' | 'youth' | 'nat';
export type CompGroup = 'Ligen' | 'Pokale' | 'Supercups' | 'Europapokale' | 'Weltpokal' | 'Halle & Jugend' | 'Nationalteams';
export const COMP_GROUPS: CompGroup[] = ['Europapokale', 'Pokale', 'Supercups', 'Weltpokal', 'Ligen', 'Halle & Jugend', 'Nationalteams'];

export interface CompDef {
  id: string;
  kind: CompKind;
  group: CompGroup;
  /** Fester Titel in der Liste (der Name kann sich je Periode ändern). */
  label: string;
  /** Zusatz in der Liste (Land, Ebene). */
  sub?: string;
  /** Felder, die das Spiel wirklich liest (Rest wird im Editor als „nur Anzeige“ gezeigt). */
  edits: CompEdit[];
}
export type CompEdit = 'name' | 'short' | 'trophy' | 'held' | 'slots' | 'cupTo' | 'replay' | 'euroFormat' | 'superFormat';

/** Gezeichnete Trophäen (views/club/trophies/TrophyArt.tsx) zur Auswahl. */
export const TROPHY_SHAPES: { key: TrophyShape; label: string }[] = [
  { key: 'schale', label: 'Meisterschale' }, { key: 'ddr', label: 'Meisterpokal (DDR)' }, { key: 'teller', label: 'Teller (Staffelsieg)' },
  { key: 'pokal', label: 'Pokal' }, { key: 'henkel', label: 'Henkelpokal' }, { key: 'cwc', label: 'Pokalsieger-Pokal' },
  { key: 'konferenz', label: 'Schlanker Pokal' }, { key: 'uefa', label: 'Europa-Pokal' }, { key: 'welt', label: 'Weltkugel' },
  { key: 'halle', label: 'Hallenpokal' }, { key: 'jugend', label: 'Jugendpokal' }, { key: 'uyl', label: 'Jugend-Meisterliga' },
];

/** Standardwerte einer Saison (alles, was der Editor anzeigt). */
export interface CompValues {
  held: boolean;
  name: string;
  short: string;
  trophy: TrophyShape | null;
  slots?: [number, number][];
  cupTo?: 'cwc' | 'uefa' | 'none';
  replayRounds?: boolean;
  replayFinal?: boolean;
  euro?: EuroFormat | null;
  superEra?: SuperEra | null;
  /** Nur Anzeige: Format in Worten (nicht editierbar). */
  info: string[];
}

// -----------------------------------------------------------------------------
// Verzeichnis
// -----------------------------------------------------------------------------
const EURO: { id: EuroCompId; label: string }[] = [
  { id: 'ec', label: 'Pokal der Landesmeister / Meisterliga' },
  { id: 'cwc', label: 'Pokal der Pokalsieger / Europa-Trophäe' },
  { id: 'uefa', label: 'Messepokal / Europa-Pokal / Kontinental-Liga' },
];
const YOUTH: { key: 'u19' | 'u17' | 'pokal' | 'ddr' | 'uyl'; label: string }[] = [
  { key: 'u19', label: 'A-Jugend-Meisterschaft' }, { key: 'u17', label: 'B-Jugend-Meisterschaft' },
  { key: 'pokal', label: 'Junioren-Pokal' }, { key: 'ddr', label: 'DDR-Juniorenliga' }, { key: 'uyl', label: 'Jugend-Meisterliga' },
];
const IC: { id: string; keys: IcKey[]; label: string }[] = [
  { id: 'weltpokal', keys: ['wp'], label: 'Transatlantik-Pokal' },
  { id: 'klubwm', keys: ['cwc', 'big'], label: 'Klub-Weltturnier' },
  { id: 'intercup', keys: ['icup'], label: 'Kontinentalsieger-Pokal' },
];
const countryName = (cc: string) => COUNTRY_BY_CC[cc]?.name ?? cc.toUpperCase();

let defs: CompDef[] | null = null;
export function competitionDefs(): CompDef[] {
  if (defs) return defs;
  const out: CompDef[] = [];
  for (const e of EURO) out.push({ id: e.id, kind: 'euro', group: 'Europapokale', label: e.label, edits: ['name', 'short', 'trophy', 'slots', 'euroFormat'] });
  out.push({ id: 'uefasuper', kind: 'uefasuper', group: 'Supercups', label: UEFA_SUPER.name, sub: 'Europa', edits: ['name', 'short', 'trophy'] });
  out.push({ id: 'cup', kind: 'cup', group: 'Pokale', label: 'Landespokal', sub: 'Heimatland', edits: ['name', 'short', 'trophy', 'replay', 'cupTo'] });
  for (const key of Object.keys(SUPER_CUPS)) {
    out.push({ id: `super:${key}`, kind: 'super', group: 'Supercups', label: 'Gipfelpokal', sub: COUNTRY_BY_KEY[key]?.name ?? key, edits: ['name', 'short', 'trophy', 'held', 'superFormat'] });
  }
  for (const ic of IC) out.push({ id: ic.id, kind: 'ic', group: 'Weltpokal', label: ic.label, edits: ['name', 'short', 'trophy'] });
  const ccs = ['ger', 'gdr', ...LEAGUE_NAME_CCS().filter((c) => c !== 'ger' && COUNTRY_BY_CC[c])];
  for (const cc of ccs) for (const tier of [1, 2]) {
    const id = leagueCompId(cc, tier);
    const champ = tier === 1 && (cc === 'ger' || cc === 'gdr');
    out.push({ id, kind: 'league', group: 'Ligen', label: `${tier}. Ebene`, sub: countryName(cc), edits: champ ? ['name', 'trophy'] : ['name'] });
  }
  out.push({ id: 'halle', kind: 'halle', group: 'Halle & Jugend', label: 'Hallenfinale', edits: ['name', 'trophy'] });
  for (const y of YOUTH) out.push({ id: `youth:${y.key}`, kind: 'youth', group: 'Halle & Jugend', label: y.label, edits: ['name', 'trophy'] });
  out.push({ id: 'nat:wm', kind: 'nat', group: 'Nationalteams', label: 'Weltmeisterschaft', edits: ['name'] });
  out.push({ id: 'nat:em', kind: 'nat', group: 'Nationalteams', label: 'Europameisterschaft', edits: ['name'] });
  defs = out;
  return out;
}
export const compDef = (id: string): CompDef | undefined => competitionDefs().find((d) => d.id === id);

// -----------------------------------------------------------------------------
// Standardwerte je Saison
// -----------------------------------------------------------------------------
/** Startplätze je Rang 1–60 als Bänder [bis Rang, Plätze]. */
function slotBands(y: number, comp: EuroCompId): [number, number][] {
  const out: [number, number][] = [];
  let prev = -1;
  for (let r = 1; r <= 60; r++) {
    const n = accessSlotsBase(y, r)[comp];
    if (prev >= 0 && n !== prev) out.push([r - 1, prev]);
    prev = n;
  }
  out.push([99, prev]);
  return out;
}

const EURO_SHORT: Record<EuroCompId, (y: number) => string> = {
  ec: (y) => (y >= 1992 ? 'Meisterliga' : 'Landesmeister'),
  cwc: (y) => (y >= 2021 ? 'Europa-Trophäe' : 'Pokalsieger'),
  uefa: (y) => (y < 1971 ? 'Messepokal' : y >= 2009 ? 'Kontinental-Liga' : 'Europa-Pokal'),
};
const IC_SHORT: Record<string, string> = { weltpokal: 'Transatlantik', klubwm: 'Klub-Weltturnier', intercup: 'Kontinentalsieger' };

export function baseValues(def: CompDef, y: number): CompValues {
  switch (def.kind) {
    case 'euro': {
      const comp = def.id as EuroCompId;
      const f = euroFormatBase(comp, y);
      return {
        held: !!f, name: euroCompNameBase(comp, y), short: EURO_SHORT[comp](y),
        trophy: comp === 'ec' ? 'henkel' : comp === 'cwc' ? (y >= 2021 ? 'konferenz' : 'cwc') : 'uefa',
        slots: slotBands(y, comp), euro: f, info: f ? [f.note] : ['In dieser Saison nicht ausgetragen.'],
      };
    }
    case 'cup': return {
      held: true, name: 'Landespokal', short: 'Pokal', trophy: 'pokal',
      replayRounds: cupReplayBase(y, false), replayFinal: cupReplayBase(y, true), cupTo: accessSlotsBase(y, 1).cupTo,
      info: ['K.-o.-System mit einem Spiel je Runde, Freilose und Amateure laut Ligasystem.'],
    };
    case 'super': {
      const key = def.id.slice(6);
      const era = superEraBase(key, y);
      return { held: !!era, name: era?.name ?? 'Gipfelpokal', short: era?.name ?? 'Gipfelpokal', trophy: 'pokal', superEra: era, info: [] };
    }
    case 'uefasuper': return { held: y >= UEFA_SUPER.from, name: UEFA_SUPER.name, short: 'Europ. Gipfelpokal', trophy: 'pokal', info: ['Landesmeister-Sieger gegen Pokalsieger- bzw. ab 2000 Europa-Pokal-Sieger, ein Spiel Ende August.'] };
    case 'ic': {
      const ic = IC.find((x) => x.id === def.id)!;
      const plans = icPlansFor(y).filter((p) => ic.keys.includes(p.key));
      return { held: plans.length > 0, name: IC_NAMES[ic.keys[0]], short: IC_SHORT[def.id], trophy: 'welt', info: plans.map((p) => IC_FORMAT_DE[p.format]) };
    }
    case 'league': {
      const [, cc, t] = def.id.split(':');
      const tier = Number(t);
      return { held: true, name: leagueNameBase(cc, tier, y), short: leagueNameBase(cc, tier, y), trophy: tier === 1 ? (cc === 'ger' ? 'schale' : cc === 'gdr' ? 'ddr' : null) : null, info: [] };
    }
    case 'halle': return { held: y >= 1988 && y <= 2001, name: 'Hallenfinale', short: 'Hallenfinale', trophy: 'halle', info: ['Endrunde der Hallentour (Hallenturniere 1976–2004).'] };
    case 'youth': {
      const key = def.id.slice(6) as (typeof YOUTH)[number]['key'];
      const held = key === 'uyl' ? !!uylFormat(y) : key === 'ddr' ? y <= 1990 : true;
      return { held, name: compLabelBase(key, y), short: compLabelBase(key, y), trophy: key === 'uyl' ? 'uyl' : 'jugend', info: [] };
    }
    case 'nat': return { held: true, name: def.id === 'nat:wm' ? 'Weltmeisterschaft' : 'Europameisterschaft', short: def.label, trophy: null, info: ['Jahr = Turnierjahr (Sommer).'] };
  }
}

/** Werte der Saison mit den Änderungen einer Periode (Vorschau im Editor). */
export function mergedValues(def: CompDef, y: number, p: CompPeriod | null | undefined): CompValues {
  const b = baseValues(def, y);
  if (!p) return b;
  return {
    ...b,
    held: p.held ?? b.held, name: p.name ?? b.name, short: p.short ?? b.short,
    trophy: (p.trophy as TrophyShape | undefined) ?? b.trophy, slots: p.slots ?? b.slots, cupTo: p.cupTo ?? b.cupTo,
    replayRounds: p.replayRounds ?? b.replayRounds, replayFinal: p.replayFinal ?? b.replayFinal,
  };
}

/** Kennung der Standardwerte einer Saison (Grenzen der Standard-Perioden). */
function signature(def: CompDef, y: number): string {
  const v = baseValues(def, y);
  const f = v.euro;
  const fmt = f ? [f.field, f.awayGoals, f.winPts, f.tiebreak, f.stages.map((s) => `${s.key}${s.legs ?? ''}${s.groups ?? ''}${s.name}`).join()] : null;
  return JSON.stringify([v.held, v.name, v.short, v.trophy, v.slots, v.cupTo, v.replayRounds, v.replayFinal, fmt, v.superEra && { ...v.superEra, from: 0, to: 0 }, v.info]);
}

const periodMemo = new Map<string, { from: number; to: number }[]>();
/** Standard-Perioden aus den eingebauten Daten (letzte offen bis 9999). */
export function defaultPeriods(def: CompDef): { from: number; to: number }[] {
  const hit = periodMemo.get(def.id);
  if (hit) return hit;
  const out: { from: number; to: number }[] = [];
  let start = COMP_FIRST;
  let sig = signature(def, COMP_FIRST);
  for (let y = COMP_FIRST + 1; y <= COMP_LAST; y++) {
    const s = signature(def, y);
    if (s !== sig) { out.push({ from: start, to: y - 1 }); start = y; sig = s; }
  }
  out.push({ from: start, to: OPEN_END });
  periodMemo.set(def.id, out);
  return out;
}

/** Name des Wettbewerbs in einer Saison (aktiver Datensatz). */
export function compNameAt(id: string, y: number): string {
  const def = compDef(id);
  const p = compPeriod(id, y);
  if (p?.name) return p.name;
  return def ? baseValues(def, y).name : id;
}
/** Kurzname (Kalender) in einer Saison (aktiver Datensatz). */
export function compShortAt(id: string, y: number): string {
  const p = compPeriod(id, y);
  if (p?.short) return p.short;
  const def = compDef(id);
  return def ? baseValues(def, y).short : id;
}
/** Trophäe (Form + eigenes Bild) in einer Saison (aktiver Datensatz); null = Standard. */
export function compTrophyAt(id: string, y: number): { shape?: TrophyShape; img?: string } | null {
  const p = compPeriod(id, y);
  if (!p || (!p.trophy && !p.trophyImg)) return null;
  return { shape: p.trophy as TrophyShape | undefined, img: p.trophyImg };
}
