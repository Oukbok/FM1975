// Gemeinsame Bausteine des Spielerprofils (Beschriftungen, Kategorien, Mini-Komponenten).
import { Player, PlayerAttributes, Position, PlayerMorale, PlayerAvailability, InjuryType, InjurySeverity } from '../../types';
import { vColor } from '../../ui/format';
import { POSITION_WEIGHTS } from '../../engine/positions';

export type AttrKey = keyof PlayerAttributes;

export const ATTR_DE: Record<AttrKey, string> = {
  fitness: 'Fitness', stamina: 'Ausdauer', speed: 'Schnelligkeit', acceleration: 'Antritt',
  strength: 'Robustheit', jumping: 'Sprungkraft', agility: 'Beweglichkeit', balance: 'Balance',
  technique: 'Technik', firstTouch: 'Ballannahme', shooting: 'Torriecher', shotPower: 'Schusskraft',
  longShots: 'Fernschüsse', passing: 'Passspiel', longPassing: 'Lange Pässe', crossing: 'Flanken',
  dribbling: 'Dribbling', ballControl: 'Ballkontrolle', heading: 'Kopfball', tackling: 'Tackling',
  marking: 'Manndeckung', positioning: 'Stellungsspiel', interceptions: 'Abfangen', experience: 'Erfahrung',
  vision: 'Kreativität', composure: 'Ruhe', concentration: 'Konzentration', decisions: 'Entscheidungen',
  leadership: 'Führungsqualitäten', workRate: 'Lauffreudigkeit', aggression: 'Aggressivität', teamwork: 'Teamwork',
  flair: 'Genius', reflexes: 'Reflexe', handling: 'Fangsicherheit', kicking: 'Abschlag',
  aerialReach: 'Strafraumbeherrschung', oneOnOnes: 'Eins-gegen-Eins', communication: 'Kommunikation',
  penalties: 'Elfmeter', freeKicks: 'Freistöße', corners: 'Ecken',
};

/** Kategorien nach Spielsituation; Fitness steht als Zustandswert im Kopf. */
export const GROUPS: { title: string; short: string; keys: AttrKey[] }[] = [
  { title: 'Ballbehandlung', short: 'Ball', keys: ['ballControl', 'crossing', 'dribbling', 'firstTouch', 'longPassing', 'passing', 'technique'] },
  { title: 'Abschluss', short: 'Abschluss', keys: ['heading', 'longShots', 'shooting', 'shotPower'] },
  { title: 'Defensive', short: 'Defensive', keys: ['interceptions', 'marking', 'positioning', 'tackling'] },
  { title: 'Standards', short: 'Standards', keys: ['corners', 'freeKicks', 'penalties'] },
  { title: 'Mental', short: 'Mental', keys: ['aggression', 'composure', 'concentration', 'decisions', 'experience', 'flair', 'leadership', 'teamwork', 'vision', 'workRate'] },
  { title: 'Physis', short: 'Physis', keys: ['acceleration', 'agility', 'balance', 'jumping', 'speed', 'stamina', 'strength'] },
];
export const GK_GROUP = { title: 'Torwart', short: 'Torwart', keys: ['aerialReach', 'communication', 'handling', 'kicking', 'oneOnOnes', 'reflexes'] as AttrKey[] };

export const groupsFor = (p: Player) => (p.naturalPosition === 'TW' ? [GK_GROUP, ...GROUPS] : GROUPS);
export const sortedKeys = (keys: AttrKey[]) => [...keys].sort((a, b) => ATTR_DE[a].localeCompare(ATTR_DE[b], 'de'));
export const groupAvg = (p: Player, keys: AttrKey[]) => Math.round(keys.reduce((s, k) => s + p.attributes[k], 0) / keys.length);

/** Für die Position wichtige Attribute (nach Gewicht absteigend). */
export function keyAttributes(pos: Position): AttrKey[] {
  const w = POSITION_WEIGHTS[pos] as Partial<Record<AttrKey, number>>;
  return (Object.keys(w) as AttrKey[]).filter((k) => k in ATTR_DE && k !== 'fitness').sort((a, b) => (w[b] ?? 0) - (w[a] ?? 0));
}

export const POS_DE: Record<string, string> = {
  TW: 'Torwart', LIB: 'Libero', VS: 'Vorstopper', AV: 'Außenverteidiger',
  DM: 'Defensives Mittelfeld', ZM: 'Zentrales Mittelfeld', OM: 'Offensives Mittelfeld',
  FL: 'Flügel', MS: 'Mittelstürmer', HS: 'Hängende Spitze',
};
export const PLAYER_TYPE: Record<string, string> = {
  TW: 'Torhüter', LIB: 'Ausputzer', VS: 'Innenverteidiger', AV: 'Außenverteidiger',
  DM: 'Abräumer', ZM: 'Spielmacher', OM: 'Zehner', FL: 'Flügelflitzer',
  MS: 'Strafraumstürmer', HS: 'Hängende Spitze',
};
export const MORALE_DE: Record<PlayerMorale, string> = {
  very_low: 'Sehr niedrig', low: 'Niedrig', okay: 'Neutral', good: 'Gut', excellent: 'Ausgezeichnet',
};
export const MORALE_VAL: Record<PlayerMorale, number> = { very_low: 20, low: 40, okay: 55, good: 75, excellent: 92 };
export const AVAIL_DE: Record<PlayerAvailability, string> = {
  available: 'Einsatzfähig', injured: 'Verletzt', suspended: 'Gesperrt', ill: 'Krank', international: 'Abgestellt',
};
export const INJURY_TYPE_DE: Record<InjuryType, string> = {
  muscle: 'Muskelverletzung', ligament: 'Bänderverletzung', bone: 'Knochenbruch', bruise: 'Prellung',
  concussion: 'Gehirnerschütterung', fatigue: 'Überlastung', illness: 'Krankheit',
};
export const INJURY_SEV_DE: Record<InjurySeverity, string> = {
  minor: 'Leicht', moderate: 'Mittel', severe: 'Schwer', critical: 'Sehr schwer',
};

export const PITCH_POS: Record<Position, { x: number; y: number }> = {
  TW: { x: 50, y: 90 }, LIB: { x: 50, y: 76 }, VS: { x: 37, y: 72 }, AV: { x: 16, y: 66 },
  DM: { x: 50, y: 58 }, ZM: { x: 35, y: 48 }, OM: { x: 50, y: 36 }, FL: { x: 17, y: 30 },
  MS: { x: 50, y: 14 }, HS: { x: 62, y: 24 },
};

export const utcDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('de-DE', { timeZone: 'UTC' }) : '—');
export const footLabel = (p: Player) => (p.preferredFoot === 'left' ? 'Links' : p.preferredFoot === 'right' ? 'Rechts' : 'Beidfüßig');
export const ratingFor = (p: Player, pos: Position) => Math.round(p.positionRatings[pos] ?? (pos === p.naturalPosition ? p.overall : 0));
export const positionsOf = (p: Player) => Array.from(new Set([p.naturalPosition, ...p.secondaryPositions]));
export const frischeOf = (p: Player) => (typeof p.frische === 'number' ? Math.round(p.frische) : 100);

// ---------------------------------------------------------------------------
// Mini-Komponenten
// ---------------------------------------------------------------------------
export function Section({ title, icon, children, right }: { title: string; icon?: React.ReactNode; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className="pp-section">
      <div className="pp-section-title">{icon}{title}{right && <span className="pp-section-right">{right}</span>}</div>
      {children}
    </section>
  );
}

export function Line({ label, value, strong, color }: { label: string; value: React.ReactNode; strong?: boolean; color?: string }) {
  return (
    <div className="pp-line">
      <span className="pp-line-lbl">{label}</span>
      <span style={{ fontWeight: strong ? 800 : 700, color: color ?? 'var(--text)' }}>{value}</span>
    </div>
  );
}

export function Bar({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="pp-bar-row">
      <span className="pp-bar-lbl">{label}</span>
      <div className="pp-bar-track"><div className="pp-bar-fill" style={{ width: `${pct}%`, background: vColor(value) }} /></div>
      <span className="pp-bar-val" style={{ color: vColor(value) }}>{value}</span>
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="pp-stat">
      <div className="pp-stat-num">{value}</div>
      <div className="pp-stat-lbl">{label}</div>
      {sub && <div className="pp-stat-sub">{sub}</div>}
    </div>
  );
}

export function AttrRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="pp-attr-row">
      <span className="pp-attr-lbl">{label}</span>
      <span className="pp-attr-val" style={{ color: vColor(value) }}>{value}</span>
    </div>
  );
}
