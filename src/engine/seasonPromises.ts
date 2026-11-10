// =============================================================================
// VERSPRECHEN ZUM ERSTEN TRAINING — Katalog und Rechnung (ohne Spielstand)
// -----------------------------------------------------------------------------
// Beim ersten Training jeder Saison gibst du der Mannschaft bis zu
// MAX_SEASON_PROMISES Versprechen (Saisonziele, Team, Infrastruktur). Jedes ist
// messbar (Prüfung in game/seasonPromisesGame.ts). Hier stehen:
//   • der Katalog mit Kategorie, Text, Prüfregel (Anzeige),
//   • wie glaubhaft ein Saisonziel ist (`realismOf`, aus Saisonziel des Vorstands),
//   • die Reaktion eines Spielers je nach Persönlichkeit (`reactionOf`):
//     Ehrgeizige mögen große Ziele, glauben sie aber nur, wenn sie realistisch
//     sind oder deine Glaubwürdigkeit hoch ist; Stammspieler mögen keine
//     Rotation, Ergänzungsspieler schon; Junge mögen die Jugend-Zusage, Routiniers
//     die Zusage an die Erfahrenen; Profis mögen Disziplin und Leistungsprinzip.
// =============================================================================
import type { PlayerPersona } from './persona';

export type SeasonPromiseId =
  | 'meister' | 'pokal' | 'international' | 'aufstieg' | 'klassenerhalt' | 'zielPlus' | 'ziel' | 'europaNext'
  | 'fitness' | 'leistung' | 'rotation' | 'disziplin' | 'stimmung' | 'jugend' | 'erfahrung'
  | 'stadion' | 'boerse' | 'treue' | 'scouting' | 'trainingsanlagen' | 'nachwuchs';

export type SeasonPromiseCat = 'ziele' | 'team' | 'infra';
export const SP_CAT_LABEL: Record<SeasonPromiseCat, string> = { ziele: 'Saisonziele', team: 'Team', infra: 'Infrastruktur' };
export const SP_CATS: SeasonPromiseCat[] = ['ziele', 'team', 'infra'];

/** Höchstzahl an Versprechen je Saison. */
export const MAX_SEASON_PROMISES = 5;

/** Grenzwerte der Prüfung (auch für Anzeige/Wiki). */
export const SP_LIMITS = {
  /** Startelf-Einsätze mit Frische unter diesem Wert verstoßen gegen „Wer nicht fit ist, spielt nicht“. */
  fitFresh: 55,
  /** Erlaubte Verstöße (Frische). */
  fitAllowed: 3,
  /** Note ab der ein Spieler als „schlecht“ gilt (deutsches Notensystem). */
  badGrade: 5,
  /** Erlaubte Fälle „schlecht gespielt und trotzdem wieder in der Startelf“. */
  badAllowed: 2,
  /** Durchschnittliche neue Startelf-Spieler je Ligaspiel für „viel rotieren“. */
  rotation: 2,
  /** Höchstens so viele Platzverweise bei „Disziplin“. */
  reds: 2,
  /** Teamstimmung am Saisonende für „tolle Stimmung“. */
  mood: 60,
  /** Anteil der Startelf-Einsätze von Spielern bis 21 Jahre. */
  youthShare: 0.12,
  /** Startelf-Anteil, den erfahrene Leistungsträger (ab 31) bekommen müssen. */
  vetShare: 0.4,
};

export interface SeasonPromiseDef {
  id: SeasonPromiseId;
  cat: SeasonPromiseCat;
  label: string;
  /** Wie geprüft wird (ein Satz, „du“). */
  check: string;
  /** Saisonziel des Vereins (Vorstand/Fans hören mit). */
  public?: boolean;
}

const L = SP_LIMITS;
export const SEASON_PROMISES: SeasonPromiseDef[] = [
  { id: 'meister', cat: 'ziele', label: 'Wir werden Meister!', check: 'Platz 1 am Saisonende.', public: true },
  { id: 'pokal', cat: 'ziele', label: 'Wir holen den Pokal!', check: 'Sieg im Landespokal. Mit dem Ausscheiden ist es gebrochen.', public: true },
  { id: 'international', cat: 'ziele', label: 'Wir gewinnen den Europapokal!', check: 'Titel im Europapokal. Mit dem Ausscheiden ist es gebrochen.', public: true },
  { id: 'aufstieg', cat: 'ziele', label: 'Wir steigen diese Saison auf!', check: 'Aufstieg in die höhere Spielklasse.', public: true },
  { id: 'klassenerhalt', cat: 'ziele', label: 'Wir steigen nicht ab!', check: 'Kein Abstieg am Saisonende.', public: true },
  { id: 'zielPlus', cat: 'ziele', label: 'Wir übertreffen unser Saisonziel!', check: 'Besser als der Platz, den das Saisonziel verlangt.', public: true },
  { id: 'ziel', cat: 'ziele', label: 'Wir erreichen unser Saisonziel.', check: 'Mindestens der Platz, den das Saisonziel verlangt.', public: true },
  { id: 'europaNext', cat: 'ziele', label: 'Nächstes Jahr spielen wir international!', check: 'Startplatz im Europapokal für die nächste Saison (Liga oder Pokalsieg).', public: true },
  { id: 'fitness', cat: 'team', label: 'Wer nicht fit ist, spielt nicht.', check: `Höchstens ${L.fitAllowed} Startelf-Einsätze mit Frische unter ${L.fitFresh}.` },
  { id: 'leistung', cat: 'team', label: 'Wer schlecht spielt, ist draußen.', check: `Wer in der Liga Note ${L.badGrade.toFixed(1).replace('.', ',')} oder schlechter bekommt, sitzt im nächsten Ligaspiel draußen (${L.badAllowed} Ausnahmen).` },
  { id: 'rotation', cat: 'team', label: 'Wir werden viel rotieren.', check: `Im Schnitt mindestens ${L.rotation} neue Spieler in der Startelf je Ligaspiel.` },
  { id: 'disziplin', cat: 'team', label: 'Ich fordere Disziplin.', check: `Höchstens ${L.reds} Platzverweise und nicht mehr Gelbe Karten als der Ligaschnitt.` },
  { id: 'stimmung', cat: 'team', label: 'Wir werden eine tolle Stimmung haben.', check: `Teamstimmung mindestens ${L.mood} am Saisonende.` },
  { id: 'jugend', cat: 'team', label: 'Ich setze verstärkt auf die Jugend.', check: `Mindestens ${Math.round(L.youthShare * 100)} % der Startelf-Einsätze in der Liga für Spieler bis 21 Jahre.` },
  { id: 'erfahrung', cat: 'team', label: 'Es gibt keine alten Spieler, nur gute und schlechte.', check: `Deine erfahrenen Leistungsträger (ab 31) stehen in mindestens ${Math.round(L.vetShare * 100)} % der Ligaspiele in der Startelf.` },
  { id: 'stadion', cat: 'infra', label: 'Wir bauen das Stadion aus.', check: 'Mehr Plätze am Saisonende oder ein neu begonnener Stadionumbau.', public: true },
  { id: 'boerse', cat: 'infra', label: 'Wir gehen an die Börse.', check: 'Verkauf von Anteilen an einen Investor in dieser Saison (Verein › Verein).', public: true },
  { id: 'treue', cat: 'infra', label: 'Ich bleibe dem Verein treu, egal was passiert.', check: 'Du bist am Saisonende noch Trainer dieses Vereins.' },
  { id: 'scouting', cat: 'infra', label: 'Wir verbessern unser Scouting.', check: 'Stärkere Scoutabteilung oder Datenzentrum am Saisonende als heute.' },
  { id: 'trainingsanlagen', cat: 'infra', label: 'Wir verbessern unsere Trainingsanlagen.', check: 'Trainingszentrum oder Leistungszentrum am Saisonende ausgebaut.', public: true },
  { id: 'nachwuchs', cat: 'infra', label: 'Wir bauen die Nachwuchsarbeit aus.', check: 'Mindestens ein Ausbau der Jugendakademie in dieser Saison.' },
];
export const SP_DEF: Record<SeasonPromiseId, SeasonPromiseDef> = Object.fromEntries(SEASON_PROMISES.map((d) => [d.id, d])) as Record<SeasonPromiseId, SeasonPromiseDef>;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// -----------------------------------------------------------------------------
// Wie glaubhaft ist ein Saisonziel? (0 = abwegig … 1 = sicher erreichbar)
// -----------------------------------------------------------------------------
export interface RealismCtx {
  /** Platz, den das Saisonziel verlangt. */
  expected: number;
  size: number;
  /** Ebene der Liga (1 = höchste). */
  level: number;
}
export function realismOf(id: SeasonPromiseId, c: RealismCtx): number {
  const E = c.expected;
  // Abgeglichen mit der Langzeit-Messung (tests/simPromises.ts, PROMISES=aware): Selbst der
  // stärkste Kader wird nur etwa jede dritte Saison Meister; ein Saisonziel „Meisterschaft“
  // ist deshalb ehrgeizig, „Klassenerhalt“ oder ein Mittelfeldplatz dagegen meist erreichbar.
  const keep = E >= c.size - 3;
  switch (id) {
    case 'meister': return E <= 1 ? 0.35 : E <= 2 ? 0.2 : E <= 4 ? 0.1 : E <= 7 ? 0.04 : 0.02;
    case 'pokal': return c.level > 1 ? 0.05 : E <= 2 ? 0.25 : E <= 5 ? 0.12 : 0.06;
    case 'international': return E <= 1 ? 0.15 : E <= 4 ? 0.08 : 0.03;
    case 'aufstieg': return E <= 2 ? 0.45 : E <= 5 ? 0.25 : 0.08;
    case 'europaNext': return E <= 4 ? 0.7 : E <= 7 ? 0.4 : E <= 10 ? 0.2 : 0.06;
    case 'klassenerhalt': return keep ? 0.6 : 0.95;
    case 'zielPlus': return E <= 2 ? 0.15 : keep ? 0.55 : 0.35;
    case 'ziel': return E <= 1 ? 0.35 : E <= 2 ? 0.45 : keep ? 0.65 : 0.55;
    default: return 0.8;
  }
}
/** Wort für die Karte: wie kühn ist das Ziel? */
export function realismWord(r: number): string | undefined {
  if (r < 0.15) return 'tollkühn';
  if (r < 0.35) return 'gewagt';
  if (r < 0.6) return 'ehrgeizig';
  return undefined;
}

// -----------------------------------------------------------------------------
// Reaktion eines Spielers
// -----------------------------------------------------------------------------
export interface ReactorIn {
  persona: PlayerPersona;
  /** Professionalität 0–100. */
  prof: number;
  age: number;
  /** Rang im Kader nach Stärke (1 = bester). */
  rank: number;
  /** Ausdauer-Attribut (Fitness) 0–100. */
  stamina: number;
  /** Eigengewächs. */
  homegrown: boolean;
}
export interface ReactionPart { id: SeasonPromiseId; v: number }
export interface Reaction { total: number; parts: ReactionPart[] }

const BIG: SeasonPromiseId[] = ['meister', 'pokal', 'international', 'aufstieg', 'europaNext', 'zielPlus'];

/** Reaktion eines Spielers auf eine Auswahl (−4 … +4). `trust` = Glaubwürdigkeit 0–100. */
export function reactionOf(x: ReactorIn, picks: SeasonPromiseId[], realism: (id: SeasonPromiseId) => number, trust: number): Reaction {
  const pe = x.persona;
  const amb = (pe.ehrgeiz - 50) / 25;
  const prof = (x.prof - 50) / 25;
  const star = x.rank <= 11;
  const parts: ReactionPart[] = [];
  for (const id of picks) {
    let v = 0;
    if (BIG.includes(id)) {
      const believe = realism(id) * 0.65 + (trust / 100) * 0.35;
      v = (0.6 + amb * 0.7 + (pe.rampenlicht - 50) / 60) * believe;
      if (believe < 0.4) v -= (0.4 - believe) * (3 + Math.max(0, prof) * 1.5);
    } else switch (id) {
      case 'ziel': v = 0.5 - (pe.ehrgeiz >= 72 ? 0.6 : 0); break;
      case 'klassenerhalt': v = realism(id) < 0.7 ? 0.7 : 0.2 - Math.max(0, amb) * 0.8; break;
      case 'fitness': v = prof * 0.5 + (x.stamina < 55 ? -0.8 : 0.2); break;
      case 'leistung': v = prof * 0.35 + (x.rank > 14 ? 0.8 : star && pe.rampenlicht > 60 ? -0.5 : 0); break;
      case 'rotation': v = star ? -0.6 - Math.max(0, amb) * 0.5 : x.rank > 13 ? 1.3 : 0.4; break;
      case 'disziplin': v = prof * 0.5 - (pe.geld > 65 || pe.rampenlicht > 70 ? 0.4 : 0); break;
      case 'stimmung': v = 0.5 + (pe.familie - 50) / 80; break;
      case 'jugend': v = x.age <= 21 ? 1.5 : x.age >= 29 && x.rank <= 14 ? -1 : 0; break;
      case 'erfahrung': v = x.age >= 30 ? 1.5 : x.age <= 21 ? -0.7 : 0; break;
      case 'stadion': v = 0.3 + (pe.ehrgeiz - 50) / 80 + (pe.heimat - 50) / 80; break;
      case 'boerse': v = (pe.geld - 50) / 40 - (pe.heimat - 50) / 40 - (pe.loyalitaet - 50) / 60 - (x.homegrown ? 0.5 : 0); break;
      case 'treue': v = 0.3 + (pe.loyalitaet - 50) / 30 + (pe.heimat - 50) / 60; break;
      case 'scouting': v = (pe.ehrgeiz - 50) / 60 - (star ? 0.25 : 0) + (x.rank > 16 ? -0.3 : 0); break;
      case 'trainingsanlagen': v = 0.5 + prof * 0.3; break;
      case 'nachwuchs': v = x.age <= 21 ? 0.9 : (pe.heimat - 50) / 80 + (x.homegrown ? 0.4 : 0); break;
      default: break;
    }
    parts.push({ id, v: Math.round(v * 100) / 100 });
  }
  let total = parts.reduce((a, p) => a + p.v, 0);
  // Viele Versprechen auf einmal wirken wie leeres Gerede – besonders auf Profis.
  if (picks.length >= 4) total -= (picks.length - 3) * 0.35 * (0.5 + x.prof / 100);
  return { total: Math.round(clamp(total, -4, 4) * 100) / 100, parts };
}

export type ReactionMood = 'begeistert' | 'angetan' | 'abwartend' | 'skeptisch' | 'verärgert';
export function reactionMood(total: number): ReactionMood {
  if (total >= 2) return 'begeistert';
  if (total >= 0.7) return 'angetan';
  if (total > -0.7) return 'abwartend';
  if (total > -2) return 'skeptisch';
  return 'verärgert';
}
/** Für das Smiley-Symbol (Skala Moral 0–100). */
export function reactionScale(total: number): number { return Math.round(clamp(55 + total * 11, 8, 96)); }

/** Sofortiger Moral-Sprung aus der Reaktion. */
export function reactionJolt(total: number): number {
  if (Math.abs(total) < 0.7) return 0;
  return Math.round(clamp(total * 1.6, -6, 6));
}

// Kurze Sätze für die stärkste Einzelreaktion (positiv / negativ).
const SAY: Record<SeasonPromiseId, [string, string]> = {
  meister: ['Meister – dafür bin ich hier.', 'Meister? Mit diesem Kader?'],
  pokal: ['Ein Pokalfinale, das wär’s.', 'Pokalsieg? Große Worte.'],
  international: ['Endlich ein Titel in Europa!', 'Europapokal gewinnen? Bleiben wir auf dem Teppich.'],
  aufstieg: ['Rauf in die höhere Klasse – ich bin dabei.', 'Aufstieg? Das sagt jeder Trainer.'],
  klassenerhalt: ['Klare Ansage, realistisch.', 'Nicht absteigen – ist das unser Anspruch?'],
  zielPlus: ['Mehr als erwartet – gefällt mir.', 'Mehr als das Ziel? Erst mal das Ziel.'],
  ziel: ['Ein klares Ziel, gut so.', 'Nur das Saisonziel? Ich will mehr.'],
  europaNext: ['Europa nächstes Jahr – das zieht.', 'Europa? Da fehlt noch einiges.'],
  fitness: ['Fitness zählt – richtig so.', 'Heißt das, ich sitze bald draußen?'],
  leistung: ['Leistung muss sich lohnen.', 'Ein schlechtes Spiel und ich bin raus?'],
  rotation: ['Dann bekomme ich meine Chance.', 'Rotation? Ich will jedes Spiel machen.'],
  disziplin: ['Klare Regeln – endlich.', 'Wir sind doch keine Schulklasse.'],
  stimmung: ['Gute Stimmung, gute Spiele.', 'Stimmung macht man nicht per Ansage.'],
  jugend: ['Die Jungen bekommen ihre Chance!', 'Und wir Älteren? Abstellgleis?'],
  erfahrung: ['Erfahrung zählt – danke, Trainer.', 'Also spielen weiter die Alten.'],
  stadion: ['Ein größeres Stadion – Gänsehaut.', 'Erst mal auf dem Platz liefern.'],
  boerse: ['Geld für neue Spieler – gut.', 'Börse? Das ist nicht mehr unser Verein.'],
  treue: ['Ein Trainer, der bleibt – stark.', 'Das sagen sie alle.'],
  scouting: ['Bessere Spieler machen uns besser.', 'Noch mehr Konkurrenz auf meiner Position?'],
  trainingsanlagen: ['Bessere Plätze, besseres Training.', 'Plätze schießen keine Tore.'],
  nachwuchs: ['Gut für die Talente hier.', 'Geld für die Jugend statt für uns.'],
};
/** Ein Satz zur stärksten Einzelreaktion (oder zur Anzahl der Versprechen). */
export function reactionLine(r: Reaction, picks: number): string {
  if (!r.parts.length) return 'Wartet ab, was du sagst.';
  const top = [...r.parts].sort((a, b) => Math.abs(b.v) - Math.abs(a.v))[0];
  if (Math.abs(top.v) < 0.3) return picks >= 4 ? 'Viele Versprechen – mal sehen, was davon bleibt.' : 'Hört aufmerksam zu.';
  return `„${SAY[top.id][top.v > 0 ? 0 : 1]}“`;
}
