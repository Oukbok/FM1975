// =============================================================================
// ROLLEN EINZELNER SPIELER (Wunsch Pascal: Manndecker, Vorstopper, Spielmacher …)
// -----------------------------------------------------------------------------
// Jede Position hat eine Grundrolle (ohne Wirkung) und ein bis drei Spezialrollen.
// Eine Rolle verschiebt,
//  - WER an welcher Aktion beteiligt ist (Gewichte `rf` für Angriff, Abwehr, Pass,
//    Flügel, Flügelabwehr, Luft, Luftabwehr – genutzt in engine/match/attack.ts),
//  - wie stark der Spieler zu Angriff/Kontrolle/Abwehr der Mannschaft zählt (`ru`,
//    engine/match/team.ts computeUnits) und
//  - wie viel Kraft er verbraucht (`rd`).
// Wie gut eine Rolle zum Spieler passt (`roleFit`: Schlüsselattribute gegen seine
// Stärke auf der Position), gibt bis +2,5 % bzw. −4 % auf seine Leistung.
// Rollen hängen an den Plätzen der Formation (`Tactics.roles`: Slot-ID → Rolle);
// KI-Vereine wählen je Spiel die passendste Rolle (`autoRole`).
// =============================================================================
import type { Player, Position } from '../types';

export type RoleId = string;
/** Beteiligungs-Gewichte: Angriff, Abwehr, Pass, Flügel, Flügelabwehr, Luft, Luftabwehr. */
export type RoleWeights = readonly [number, number, number, number, number, number, number];
export const RF = { att: 0, def: 1, pass: 2, wide: 3, wideDef: 4, air: 5, airDef: 6 } as const;
export const NEUTRAL_RF: RoleWeights = [1, 1, 1, 1, 1, 1, 1];
export const NEUTRAL_RU: readonly [number, number, number] = [1, 1, 1];

type Attr = keyof Player['attributes'];
export interface RoleDef {
  id: RoleId;
  label: string;
  positions: Position[];
  /** Grundrolle der Position (keine Wirkung). */
  base?: boolean;
  /** Wählbar ab Saison-Startjahr. */
  from?: number;
  /** Danach aus der Mode (wählbar, die KI nutzt sie nicht mehr). */
  until?: number;
  text: string;
  /** Schlüsselattribute mit Gewicht (für die Eignung). */
  keys: Partial<Record<Attr, number>>;
  rf?: Partial<Record<keyof typeof RF, number>>;
  /** Faktoren auf den Anteil an Angriff / Kontrolle / Abwehr der Mannschaft. */
  ru?: [number, number, number];
  /** Kraftverbrauch. */
  rd?: number;
  /** Torwart läuft Steilpässe ab (Logit-Vorteil im Laufduell). */
  sweep?: number;
}

const WIDE_DEF: Position[] = ['RV', 'LV'], WIDE_MID: Position[] = ['RM', 'LM'], WINGS: Position[] = ['RA', 'LA'];

export const ROLES: RoleDef[] = [
  // --- Torwart ---
  { id: 'tw', label: 'Linientorwart', positions: ['TW'], base: true, text: 'Bleibt auf der Linie und im Strafraum. Die klassische Rolle.', keys: {} },
  { id: 'tw_mit', label: 'Mitspielender Torwart', positions: ['TW'], from: 1992, sweep: 0.12, ru: [1, 1.6, 1],
    text: 'Rückt weit heraus, läuft Steilpässe ab und spielt im Aufbau mit. Braucht Ruhe am Ball und gutes Herauslaufen – sonst wird es gefährlich.',
    keys: { oneOnOnes: 1, positioning: 0.8, decisions: 0.8, passing: 0.6, composure: 0.6, speed: 0.4, ballControl: 0.4 } },
  // --- Libero ---
  { id: 'lib', label: 'Ausputzer', positions: ['LIB'], base: true, text: 'Letzter Mann hinter der Abwehr: sichert ab und klärt.', keys: {} },
  { id: 'lib_frei', label: 'Freier Mann', positions: ['LIB'], rf: { pass: 1.5, att: 2.2, def: 0.85 }, ru: [2.4, 1.3, 0.88],
    text: 'Schaltet sich ins Mittelfeld und in den Angriff ein. Die Abwehr verliert dafür ihre Absicherung.',
    keys: { passing: 1, vision: 0.9, longPassing: 0.7, technique: 0.6, positioning: 0.6, dribbling: 0.5 } },
  // --- Innenverteidiger ---
  { id: 'iv', label: 'Innenverteidiger', positions: ['IV'], base: true, text: 'Verteidigt im Verbund, ohne besondere Aufgabe.', keys: {} },
  { id: 'iv_mann', label: 'Manndecker', positions: ['IV'], until: 2000, rf: { def: 1.2, pass: 0.6, airDef: 1.1 }, ru: [0.6, 0.75, 1.07],
    text: 'Nimmt den gegnerischen Stürmer in Sonderbewachung. Stark im Zweikampf, am Aufbau kaum beteiligt.',
    keys: { marking: 1, tackling: 1, concentration: 0.6, strength: 0.5, speed: 0.4 } },
  { id: 'iv_vor', label: 'Vorstopper', positions: ['IV'], until: 2000, rf: { def: 1.1, airDef: 1.35, pass: 0.7 }, ru: [0.8, 0.85, 1.05],
    text: 'Geht früh und hart in die Zweikämpfe vor der Abwehr und räumt in der Luft ab.',
    keys: { heading: 1, tackling: 0.9, strength: 0.9, jumping: 0.7, aggression: 0.6 } },
  { id: 'iv_spiel', label: 'Spielender Verteidiger', positions: ['IV'], from: 1990, rf: { pass: 1.6, def: 0.92 }, ru: [1.2, 1.35, 0.95],
    text: 'Eröffnet das Spiel von hinten. Bringt Ballsicherheit, ist im Zweikampf aber weniger kompromisslos.',
    keys: { passing: 1, longPassing: 0.8, composure: 0.8, positioning: 0.7, vision: 0.5, tackling: 0.5 } },
  // --- Außenverteidiger ---
  { id: 'av', label: 'Außenverteidiger', positions: WIDE_DEF, base: true, text: 'Verteidigt seine Seite und rückt gelegentlich mit auf.', keys: {} },
  { id: 'av_def', label: 'Defensiver Außenverteidiger', positions: WIDE_DEF, rf: { wideDef: 1.2, wide: 0.55, att: 0.5 }, ru: [0.55, 0.9, 1.07],
    text: 'Bleibt hinten und macht seine Seite dicht. Nach vorn kommt von ihm wenig.',
    keys: { tackling: 1, marking: 0.9, positioning: 0.8, speed: 0.5, concentration: 0.5 } },
  { id: 'av_off', label: 'Offensiver Außenverteidiger', positions: WIDE_DEF, rf: { wide: 1.5, att: 1.6, wideDef: 0.82 }, ru: [1.5, 1.05, 0.9], rd: 1.08,
    text: 'Läuft die Linie rauf und runter und flankt. Kostet Kraft und öffnet seine Seite für Konter.',
    keys: { crossing: 1, speed: 0.9, stamina: 0.9, workRate: 0.6, dribbling: 0.5 } },
  // --- Defensives Mittelfeld ---
  { id: 'dm', label: 'Sechser', positions: ['DM'], base: true, text: 'Hält die Mitte vor der Abwehr.', keys: {} },
  { id: 'dm_ab', label: 'Abräumer', positions: ['DM'], rf: { def: 1.25, pass: 0.7, att: 0.6 }, ru: [0.6, 0.9, 1.12],
    text: 'Gewinnt Bälle und stopft Löcher. Den Aufbau überlässt er anderen.',
    keys: { tackling: 1, interceptions: 0.9, workRate: 0.7, strength: 0.6, positioning: 0.6, aggression: 0.5 } },
  { id: 'dm_takt', label: 'Taktgeber', positions: ['DM'], rf: { pass: 1.5, def: 0.85 }, ru: [1.1, 1.12, 0.88],
    text: 'Verteilt die Bälle aus der Tiefe und bestimmt den Rhythmus. Weniger Zweikämpfe vor der Abwehr.',
    keys: { passing: 1, vision: 0.9, composure: 0.8, decisions: 0.8, longPassing: 0.6, positioning: 0.4 } },
  // --- Zentrales Mittelfeld ---
  { id: 'zm', label: 'Achter', positions: ['ZM'], base: true, text: 'Verbindet Abwehr und Angriff.', keys: {} },
  { id: 'zm_spiel', label: 'Spielmacher', positions: ['ZM'], rf: { pass: 1.6, def: 0.75, att: 0.9 }, ru: [1, 1.12, 0.75],
    text: 'Über ihn läuft das Spiel. Seine Pässe prägen jeden Angriff – nach hinten arbeitet er wenig.',
    keys: { passing: 1, vision: 1, technique: 0.7, decisions: 0.7, composure: 0.5 } },
  { id: 'zm_antr', label: 'Antreiber', positions: ['ZM'], rf: { att: 1.3, def: 1.2 }, ru: [1.15, 0.95, 1.15], rd: 1.12,
    text: 'Von Strafraum zu Strafraum: hilft hinten und stößt vorn nach. Verbraucht sehr viel Kraft.',
    keys: { stamina: 1, workRate: 1, tackling: 0.5, passing: 0.5, shooting: 0.4, strength: 0.4 } },
  { id: 'zm_wasser', label: 'Wasserträger', positions: ['ZM'], rf: { def: 1.3, att: 0.55, pass: 0.85 }, ru: [0.6, 0.95, 1.3],
    text: 'Läuft und arbeitet für die Künstler neben ihm. Vor dem Tor taucht er selten auf.',
    keys: { workRate: 1, tackling: 0.9, stamina: 0.8, positioning: 0.7, teamwork: 0.7 } },
  // --- Mittelfeld außen ---
  { id: 'am', label: 'Außenläufer', positions: WIDE_MID, base: true, text: 'Besetzt die Außenbahn in beide Richtungen.', keys: {} },
  { id: 'am_flanke', label: 'Flankengeber', positions: WIDE_MID, rf: { wide: 1.35, att: 0.85 }, ru: [1, 0.95, 1],
    text: 'Geht bis zur Grundlinie und bringt den Ball in den Strafraum.',
    keys: { crossing: 1, speed: 0.7, dribbling: 0.5, stamina: 0.5 } },
  { id: 'am_ein', label: 'Einrückender Flügel', positions: WIDE_MID, from: 1998, rf: { wide: 0.55, att: 1.3, pass: 1.2 }, ru: [1.06, 1.12, 0.95],
    text: 'Zieht in die Mitte, kombiniert und sucht den Abschluss. Flanken kommen von ihm kaum.',
    keys: { passing: 0.8, dribbling: 0.8, vision: 0.7, technique: 0.7, shooting: 0.6 } },
  // --- Offensives Mittelfeld ---
  { id: 'om', label: 'Zehner', positions: ['OM'], base: true, text: 'Spielt hinter den Spitzen.', keys: {} },
  { id: 'om_spiel', label: 'Spielmacher', positions: ['OM'], rf: { pass: 1.5, att: 0.85 }, ru: [0.94, 1.12, 1],
    text: 'Der Regisseur hinter den Spitzen: Fast jeder Angriff läuft über ihn.',
    keys: { vision: 1, passing: 1, technique: 0.7, decisions: 0.6, flair: 0.5 } },
  { id: 'om_schatten', label: 'Schattenstürmer', positions: ['OM'], rf: { att: 1.4, pass: 0.75, air: 1.2 }, ru: [1.1, 0.82, 1],
    text: 'Stößt aus der Tiefe in den Strafraum und sucht selbst den Abschluss.',
    keys: { shooting: 1, firstTouch: 0.7, composure: 0.7, acceleration: 0.6, decisions: 0.5 } },
  // --- Flügelstürmer ---
  { id: 'fl', label: 'Flügelstürmer', positions: WINGS, base: true, text: 'Kommt über außen: Flanke oder Zug zum Tor.', keys: {} },
  { id: 'fl_dribbler', label: 'Dribbler', positions: WINGS, rf: { att: 1.15, wide: 0.9 }, ru: [1.03, 0.95, 1],
    text: 'Sucht das Duell Mann gegen Mann. Viele Dribblings, weniger Flanken.',
    keys: { dribbling: 1, acceleration: 0.8, agility: 0.7, flair: 0.7, ballControl: 0.7 } },
  { id: 'fl_inv', label: 'Inverser Flügel', positions: WINGS, from: 2004, rf: { wide: 0.5, att: 1.35 }, ru: [1.08, 1, 1],
    text: 'Zieht auf den starken Fuß nach innen und schießt. Flanken von der Grundlinie fallen weg.',
    keys: { shooting: 1, dribbling: 0.8, longShots: 0.6, technique: 0.6, acceleration: 0.6 } },
  // --- Hängende Spitze ---
  { id: 'hs', label: 'Hängende Spitze', positions: ['HS'], base: true, text: 'Lässt sich fallen und verbindet Mittelfeld und Sturm.', keys: {} },
  { id: 'hs_zwei', label: 'Zweite Spitze', positions: ['HS'], rf: { att: 1.2, pass: 0.7, air: 1.2 }, ru: [1.05, 0.75, 1],
    text: 'Spielt auf einer Höhe mit dem Mittelstürmer und sucht den Abschluss.',
    keys: { shooting: 1, acceleration: 0.7, firstTouch: 0.6, composure: 0.6, heading: 0.4 } },
  // --- Mittelstürmer ---
  { id: 'ms', label: 'Mittelstürmer', positions: ['MS'], base: true, text: 'Vorderste Spitze ohne besondere Vorgabe.', keys: {} },
  { id: 'ms_box', label: 'Strafraumstürmer', positions: ['MS'], rf: { att: 1.2, pass: 0.5, wide: 0.5 }, ru: [1.04, 0.6, 0.8],
    text: 'Lauert im Strafraum auf seine Chance. Am Spiel nimmt er sonst kaum teil.',
    keys: { shooting: 1, composure: 0.8, positioning: 0.7, firstTouch: 0.7, heading: 0.5 } },
  { id: 'ms_wand', label: 'Wandspieler', positions: ['MS'], rf: { air: 1.5, att: 0.82, pass: 1.4 }, ru: [0.97, 1.6, 1],
    text: 'Macht hohe Bälle fest und legt für die Mitspieler ab. Selbst kommt er seltener zum Abschluss.',
    keys: { strength: 1, heading: 1, jumping: 0.7, ballControl: 0.6, teamwork: 0.5 } },
  { id: 'ms_konter', label: 'Konterstürmer', positions: ['MS'], rf: { att: 1.1, air: 0.5 }, ru: [1.02, 0.8, 1],
    text: 'Lauert an der letzten Linie auf den Steilpass. In der Luft und im Kombinationsspiel bringt er wenig.',
    keys: { speed: 1, acceleration: 1, shooting: 0.7, composure: 0.5, dribbling: 0.5 } },
];

export const ROLE_BY_ID: Record<RoleId, RoleDef> = Object.fromEntries(ROLES.map((r) => [r.id, r]));
const BY_POS = new Map<Position, RoleDef[]>();
for (const r of ROLES) for (const p of r.positions) { const l = BY_POS.get(p) ?? []; l.push(r); BY_POS.set(p, l); }

/** Grundrolle der Position. */
export const baseRole = (pos: Position): RoleDef => (BY_POS.get(pos) ?? []).find((r) => r.base) ?? ROLES[0];
/** Rollen einer Position; `year` blendet noch nicht bekannte aus. */
export const rolesFor = (pos: Position, year?: number): RoleDef[] =>
  (BY_POS.get(pos) ?? []).filter((r) => year == null || !r.from || year >= r.from);
/** Gültige Rolle für Position und Jahr (sonst die Grundrolle). */
export function roleFor(id: RoleId | undefined, pos: Position, year: number): RoleDef {
  const r = id ? ROLE_BY_ID[id] : undefined;
  return r && r.positions.includes(pos) && (!r.from || year >= r.from) ? r : baseRole(pos);
}

/** Eignung des Spielers für die Rolle aus den Schlüsselattributen (0–100); Grundrolle = null. */
export function roleFit(p: Player, role: RoleDef): number | null {
  let sum = 0, w = 0;
  const a = p.attributes as unknown as Record<string, number | undefined>;
  for (const [k, g] of Object.entries(role.keys)) { sum += (a[k] ?? 50) * (g as number); w += g as number; }
  return w ? sum / w : null;
}

/**
 * Leistungsfaktor aus der Passung: Schlüsselattribute gegen die Stärke auf der Position
 * (gemessen: die beste Spezialrolle liegt meist zwischen −3 und +3 Punkten um die Stärke).
 * Spezialist in seiner Rolle bis +2,5 %, Fehlbesetzung bis −4 %, Grundrolle 1.
 */
export function roleFitFactor(p: Player, role: RoleDef, posRating: number): number {
  const fit = roleFit(p, role);
  if (fit == null) return 1;
  const d = (fit - posRating) * 0.006;
  return 1 + (d > 0.025 ? 0.025 : d < -0.04 ? -0.04 : d);
}

/** Vergleichswert für die Passung: Stärke auf der Position, mindestens knapp unter der Gesamtstärke (kein Bonus fürs Fehlbesetzen). */
export const roleRef = (p: Player, posRating: number): number => Math.max(posRating, p.overall - 3);

/** Sterne-Stufe 1–5 für die Anzeige (Eignung gegen die Stärke auf der Position). */
export function roleStars(p: Player, role: RoleDef, posRating: number): number {
  const fit = roleFit(p, role);
  if (fit == null) return 3;
  const d = fit - posRating;
  return d >= 3 ? 5 : d >= 1 ? 4 : d >= -1.5 ? 3 : d >= -4 ? 2 : 1;
}

/** KI: passendste Rolle – eine Spezialrolle nur, wenn sie dem Spieler klar liegt. */
export function autoRole(p: Player, pos: Position, year: number, posRating: number): RoleDef {
  let best = baseRole(pos), bv = posRating + 0.5;
  for (const r of rolesFor(pos, year)) {
    if (r.base || (r.until && year > r.until)) continue;
    const f = roleFit(p, r);
    if (f != null && f > bv) { bv = f; best = r; }
  }
  return best;
}

/** Beteiligungs-Gewichte der Rolle als festes Feld (für die Engine). */
const RF_CACHE = new Map<RoleId, RoleWeights>();
export function roleWeights(role: RoleDef): RoleWeights {
  if (!role.rf) return NEUTRAL_RF;
  let w = RF_CACHE.get(role.id);
  if (!w) {
    const a = [1, 1, 1, 1, 1, 1, 1];
    for (const [k, v] of Object.entries(role.rf)) a[RF[k as keyof typeof RF]] = v as number;
    w = a as unknown as RoleWeights;
    RF_CACHE.set(role.id, w);
  }
  return w;
}
