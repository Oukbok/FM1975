// =============================================================================
// FOOTBALL MANAGER 1980 — Formationen (Aufstellungs-Raster)
// =============================================================================
// Jede Formation besteht aus genau 11 Positions-Slots mit Koordinaten in
// Prozent des Spielfelds. Das Feld wird HOCHKANT gezeichnet:
//   y =  8  → gegnerisches Tor (vorne / Angriff)
//   y = 92  → eigenes Tor (hinten / TW)
//   x =  0  → links,  x = 100 → rechts
//
// Enthält klassische Systeme (4-4-2, 4-3-3, …) UND die für die frühen 1980er
// typischen Libero-Varianten (mit dediziertem LIB hinter der Kette).
// =============================================================================

import type { Position } from '../types';

/** Ein einzelner Positions-Slot auf dem Feld. */
export interface FormationSlot {
  /** Stabile Slot-ID innerhalb der Formation (z.B. "s1"). */
  id: string;
  /** Ideale Position dieses Slots. */
  position: Position;
  /** X-Koordinate in % (0=links … 100=rechts). */
  x: number;
  /** Y-Koordinate in % (8=vorne/Angriff … 92=hinten/TW). */
  y: number;
}

/** Eine Formation mit Bezeichnung und 11 Slots. */
export interface Formation {
  id: string;
  label: string;
  /** Kurzbeschreibung (deutsch, du-Form). */
  desc: string;
  /** true = klassisches Kettensystem der 80er mit freiem Libero. */
  libero: boolean;
  /**
   * Jahrzehnte, in denen das System typisch war (1970 = 1975–79, 1980, … 2030 = ab 2030).
   * Grundlage für „Typisch für die Zeit“ in der Aufstellung und die Wahl der KI-Trainer;
   * im Datensatz-Editor änderbar (`formationEras`, data/dataset/apply.ts).
   */
  eras: number[];
  slots: FormationSlot[];
}

const S = (id: string, position: Position, x: number, y: number): FormationSlot => ({ id, position, x, y });

export const FORMATIONS: Formation[] = [
  // ------------------------------------------------------------------ Klassisch
  {
    id: '4-4-2', label: '4-4-2', libero: false, eras: [1970, 1980, 1990, 2000, 2010],
    desc: 'Der Klassiker: kompakte Viererkette, zwei Sturmspitzen. Ausgewogen und stabil.',
    slots: [
      S('s1', 'TW', 50, 90),
      S('s2', 'LV', 16, 70), S('s3', 'IV', 38, 72), S('s4', 'IV', 62, 72), S('s5', 'RV', 84, 70),
      S('s6', 'LM', 15, 48), S('s7', 'ZM', 40, 50), S('s8', 'ZM', 60, 50), S('s9', 'RM', 85, 48),
      S('s10', 'MS', 38, 24), S('s11', 'MS', 62, 24),
    ],
  },
  {
    id: '4-3-3', label: '4-3-3', libero: false, eras: [1970, 2010, 2020, 2030],
    desc: 'Offensiv mit drei Angreifern und breiten Flügeln. Braucht laufstarke Mittelfeldspieler.',
    slots: [
      S('s1', 'TW', 50, 90),
      S('s2', 'LV', 16, 70), S('s3', 'IV', 38, 72), S('s4', 'IV', 62, 72), S('s5', 'RV', 84, 70),
      S('s6', 'DM', 50, 58), S('s7', 'ZM', 34, 48), S('s8', 'ZM', 66, 48),
      S('s9', 'LA', 16, 26), S('s10', 'MS', 50, 20), S('s11', 'RA', 84, 26),
    ],
  },
  {
    id: '3-5-2', label: '3-5-2', libero: false, eras: [1990, 2000, 2010],
    desc: 'Fünf im Mittelfeld sorgen für Überzahl, die Außen schieben mit. Kraftraubend.',
    slots: [
      S('s1', 'TW', 50, 90),
      S('s2', 'IV', 30, 72), S('s3', 'IV', 50, 74), S('s4', 'IV', 70, 72),
      S('s5', 'LM', 12, 52), S('s6', 'ZM', 36, 52), S('s7', 'OM', 50, 44), S('s8', 'ZM', 64, 52), S('s9', 'RM', 88, 52),
      S('s10', 'MS', 40, 22), S('s11', 'MS', 60, 22),
    ],
  },
  {
    id: '4-2-3-1', label: '4-2-3-1', libero: false, eras: [2000, 2010, 2020, 2030],
    desc: 'Modern gedacht: Doppel-Sechs sichert ab, dahinter ein Spielmacher hinter der Spitze.',
    slots: [
      S('s1', 'TW', 50, 90),
      S('s2', 'LV', 16, 70), S('s3', 'IV', 38, 72), S('s4', 'IV', 62, 72), S('s5', 'RV', 84, 70),
      S('s6', 'DM', 38, 56), S('s7', 'DM', 62, 56),
      S('s8', 'LA', 18, 38), S('s9', 'OM', 50, 40), S('s10', 'RA', 82, 38),
      S('s11', 'MS', 50, 20),
    ],
  },
  {
    id: '5-3-2', label: '5-3-2', libero: false, eras: [1990, 2010],
    desc: 'Fünferkette mit offensiven Außenverteidigern. Sehr defensivsicher, kontert gefährlich.',
    slots: [
      S('s1', 'TW', 50, 90),
      S('s2', 'LV', 12, 68), S('s3', 'IV', 32, 72), S('s4', 'IV', 50, 74), S('s5', 'IV', 68, 72), S('s6', 'RV', 88, 68),
      S('s7', 'ZM', 32, 50), S('s8', 'ZM', 50, 48), S('s9', 'ZM', 68, 50),
      S('s10', 'MS', 40, 22), S('s11', 'MS', 60, 22),
    ],
  },
  {
    id: '3-4-3', label: '3-4-3', libero: false, eras: [2010, 2020, 2030],
    desc: 'Volles Offensivrisiko mit Dreierkette und drei Angreifern. Für mutige Trainer.',
    slots: [
      S('s1', 'TW', 50, 90),
      S('s2', 'IV', 30, 72), S('s3', 'IV', 50, 74), S('s4', 'IV', 70, 72),
      S('s5', 'LM', 14, 50), S('s6', 'ZM', 38, 50), S('s7', 'ZM', 62, 50), S('s8', 'RM', 86, 50),
      S('s9', 'LA', 20, 24), S('s10', 'MS', 50, 20), S('s11', 'RA', 80, 24),
    ],
  },
  // -------------------------------------------------------------- Libero-Systeme
  {
    id: 'libero-1-4-3-2', label: 'Libero 1-4-3-2', libero: true, eras: [1970, 1980],
    desc: '80er-Standard: freier Libero hinter der Viererkette, kreatives Mittelfeld, zwei Spitzen.',
    slots: [
      S('s1', 'TW', 50, 92),
      S('s2', 'LIB', 50, 80),
      S('s3', 'LV', 16, 70), S('s4', 'IV', 38, 72), S('s5', 'IV', 62, 72), S('s6', 'RV', 84, 70),
      S('s7', 'DM', 50, 56), S('s8', 'ZM', 34, 48), S('s9', 'OM', 66, 44),
      S('s10', 'MS', 40, 22), S('s11', 'HS', 62, 26),
    ],
  },
  {
    id: 'libero-1-3-4-2', label: 'Libero 1-3-4-2', libero: true, eras: [1980, 1990],
    desc: 'Libero mit Dreier-Manndeckung davor und breitem Mittelfeld — flexibel und offensiv.',
    slots: [
      S('s1', 'TW', 50, 92),
      S('s2', 'LIB', 50, 80),
      S('s3', 'IV', 30, 72), S('s4', 'IV', 50, 73), S('s5', 'IV', 70, 72),
      S('s6', 'LM', 14, 52), S('s7', 'ZM', 38, 50), S('s8', 'ZM', 62, 50), S('s9', 'RM', 86, 52),
      S('s10', 'MS', 40, 24), S('s11', 'HS', 60, 26),
    ],
  },
  {
    id: 'libero-1-4-4-1', label: 'Libero 1-4-4-1 (Catenaccio)', libero: true, eras: [1970],
    desc: 'Beton-Variante: Libero plus Viererkette, dichtes Mittelfeld, einzelne Spitze. Extrem stabil.',
    slots: [
      S('s1', 'TW', 50, 92),
      S('s2', 'LIB', 50, 80),
      S('s3', 'LV', 16, 70), S('s4', 'IV', 38, 72), S('s5', 'IV', 62, 72), S('s6', 'RV', 84, 70),
      S('s7', 'LM', 18, 50), S('s8', 'ZM', 38, 48), S('s9', 'ZM', 62, 48), S('s10', 'RM', 82, 50),
      S('s11', 'MS', 50, 22),
    ],
  },
  // ------------------------------------------------------- weitere Systeme (Wunsch Pascal)
  {
    id: '4-4-2-raute', label: '4-4-2 Raute', libero: false, eras: [1990, 2000],
    desc: 'Mittelfeld als Raute: Sechser, zwei Halbe, Zehner hinter zwei Spitzen. Stark durch die Mitte, schmal auf den Flügeln.',
    slots: [
      S('s1', 'TW', 50, 90),
      S('s2', 'LV', 16, 70), S('s3', 'IV', 38, 72), S('s4', 'IV', 62, 72), S('s5', 'RV', 84, 70),
      S('s6', 'DM', 50, 58), S('s7', 'ZM', 30, 48), S('s8', 'ZM', 70, 48), S('s9', 'OM', 50, 38),
      S('s10', 'MS', 38, 22), S('s11', 'MS', 62, 22),
    ],
  },
  {
    id: '4-4-1-1', label: '4-4-1-1', libero: false, eras: [1990, 2000],
    desc: 'Flache Vier im Mittelfeld, dahinter eine hängende Spitze. Kompakt, mit einer Anspielstation zwischen den Linien.',
    slots: [
      S('s1', 'TW', 50, 90),
      S('s2', 'LV', 16, 70), S('s3', 'IV', 38, 72), S('s4', 'IV', 62, 72), S('s5', 'RV', 84, 70),
      S('s6', 'LM', 15, 50), S('s7', 'ZM', 40, 52), S('s8', 'ZM', 60, 52), S('s9', 'RM', 85, 50),
      S('s10', 'HS', 50, 32), S('s11', 'MS', 50, 20),
    ],
  },
  {
    id: '4-5-1', label: '4-5-1', libero: false, eras: [2000],
    desc: 'Fünf im Mittelfeld, eine Spitze. Viel Kontrolle, auswärts beliebt.',
    slots: [
      S('s1', 'TW', 50, 90),
      S('s2', 'LV', 16, 70), S('s3', 'IV', 38, 72), S('s4', 'IV', 62, 72), S('s5', 'RV', 84, 70),
      S('s6', 'LM', 14, 48), S('s7', 'ZM', 34, 52), S('s8', 'DM', 50, 56), S('s9', 'ZM', 66, 52), S('s10', 'RM', 86, 48),
      S('s11', 'MS', 50, 22),
    ],
  },
  {
    id: '4-1-4-1', label: '4-1-4-1', libero: false, eras: [2010, 2020],
    desc: 'Ein Sechser vor der Kette, vier davor, eine Spitze. Gut im Pressing, schwer auszuspielen.',
    slots: [
      S('s1', 'TW', 50, 90),
      S('s2', 'LV', 16, 70), S('s3', 'IV', 38, 72), S('s4', 'IV', 62, 72), S('s5', 'RV', 84, 70),
      S('s6', 'DM', 50, 58),
      S('s7', 'LM', 16, 44), S('s8', 'ZM', 38, 46), S('s9', 'ZM', 62, 46), S('s10', 'RM', 84, 44),
      S('s11', 'MS', 50, 20),
    ],
  },
  {
    id: '4-3-2-1', label: '4-3-2-1 (Tannenbaum)', libero: false, eras: [2000],
    desc: 'Drei Mittelfeldspieler, zwei Zehner hinter einer Spitze. Eng und spielstark durchs Zentrum.',
    slots: [
      S('s1', 'TW', 50, 90),
      S('s2', 'LV', 16, 70), S('s3', 'IV', 38, 72), S('s4', 'IV', 62, 72), S('s5', 'RV', 84, 70),
      S('s6', 'ZM', 30, 52), S('s7', 'DM', 50, 56), S('s8', 'ZM', 70, 52),
      S('s9', 'OM', 36, 36), S('s10', 'OM', 64, 36),
      S('s11', 'MS', 50, 20),
    ],
  },
  {
    id: '4-3-1-2', label: '4-3-1-2', libero: false, eras: [1990, 2000],
    desc: 'Drei zentrale Mittelfeldspieler, ein Spielmacher hinter zwei Stürmern. Die Breite kommt von den Außenverteidigern.',
    slots: [
      S('s1', 'TW', 50, 90),
      S('s2', 'LV', 16, 68), S('s3', 'IV', 38, 72), S('s4', 'IV', 62, 72), S('s5', 'RV', 84, 68),
      S('s6', 'ZM', 30, 52), S('s7', 'DM', 50, 56), S('s8', 'ZM', 70, 52), S('s9', 'OM', 50, 38),
      S('s10', 'MS', 38, 22), S('s11', 'MS', 62, 22),
    ],
  },
  {
    id: '3-4-2-1', label: '3-4-2-1', libero: false, eras: [2010, 2020, 2030],
    desc: 'Dreierkette, zwei Schienenspieler, zwei Zehner hinter der Spitze. Modern und flexibel.',
    slots: [
      S('s1', 'TW', 50, 90),
      S('s2', 'IV', 30, 72), S('s3', 'IV', 50, 74), S('s4', 'IV', 70, 72),
      S('s5', 'LM', 12, 52), S('s6', 'DM', 38, 54), S('s7', 'DM', 62, 54), S('s8', 'RM', 88, 52),
      S('s9', 'OM', 36, 34), S('s10', 'OM', 64, 34),
      S('s11', 'MS', 50, 20),
    ],
  },
  {
    id: '5-4-1', label: '5-4-1', libero: false, eras: [2010, 2020],
    desc: 'Fünferkette und Vierermittelfeld: der Bus vor dem Tor. Für Spiele gegen klar Stärkere.',
    slots: [
      S('s1', 'TW', 50, 90),
      S('s2', 'LV', 12, 66), S('s3', 'IV', 32, 72), S('s4', 'IV', 50, 74), S('s5', 'IV', 68, 72), S('s6', 'RV', 88, 66),
      S('s7', 'LM', 18, 48), S('s8', 'ZM', 40, 50), S('s9', 'ZM', 60, 50), S('s10', 'RM', 82, 48),
      S('s11', 'MS', 50, 22),
    ],
  },
  {
    id: '4-2-4', label: '4-2-4', libero: false, eras: [1970],
    desc: 'Altes Angriffssystem: zwei im Zentrum, vier vorne. Viel Druck, wenig Absicherung.',
    slots: [
      S('s1', 'TW', 50, 90),
      S('s2', 'LV', 16, 70), S('s3', 'IV', 38, 72), S('s4', 'IV', 62, 72), S('s5', 'RV', 84, 70),
      S('s6', 'ZM', 38, 50), S('s7', 'ZM', 62, 50),
      S('s8', 'LA', 14, 26), S('s9', 'MS', 40, 20), S('s10', 'MS', 60, 20), S('s11', 'RA', 86, 26),
    ],
  },
  {
    id: 'libero-1-3-3-3', label: 'Libero 1-3-3-3', libero: true, eras: [1970],
    desc: 'Libero mit drei Manndeckern, drei im Mittelfeld und drei echten Stürmern – offensiv wie in den frühen Siebzigern.',
    slots: [
      S('s1', 'TW', 50, 92),
      S('s2', 'LIB', 50, 80),
      S('s3', 'IV', 30, 72), S('s4', 'IV', 50, 73), S('s5', 'IV', 70, 72),
      S('s6', 'ZM', 32, 50), S('s7', 'DM', 50, 54), S('s8', 'OM', 68, 46),
      S('s9', 'LA', 16, 26), S('s10', 'MS', 50, 20), S('s11', 'RA', 84, 26),
    ],
  },
  {
    id: 'libero-1-2-5-2', label: 'Libero 1-2-5-2', libero: true, eras: [1980, 1990],
    desc: 'Das System von 1990: Libero, zwei Manndecker, Außen auf den Seiten, drei im Zentrum, zwei Spitzen.',
    slots: [
      S('s1', 'TW', 50, 92),
      S('s2', 'LIB', 50, 80),
      S('s3', 'IV', 36, 72), S('s4', 'IV', 64, 72),
      S('s5', 'LM', 12, 54), S('s6', 'ZM', 34, 50), S('s7', 'DM', 50, 56), S('s8', 'OM', 66, 46), S('s9', 'RM', 88, 54),
      S('s10', 'MS', 40, 22), S('s11', 'HS', 62, 26),
    ],
  },
];

/** Eingebaute Zuordnung Formation → Jahrzehnte (für den Editor: Standard/Änderungen). */
export const BUILTIN_FORMATION_ERAS: Record<string, number[]> = Object.fromEntries(FORMATIONS.map((f) => [f.id, [...f.eras]]));

/** Jahrzehnte für Editor und Anzeige (1970 = 1975–79, 2030 = ab 2030). */
export const FORMATION_DECADES = [1970, 1980, 1990, 2000, 2010, 2020, 2030];
export const decadeLabel = (d: number) => (d === 1970 ? '1975–79' : d === 2030 ? 'ab 2030' : `${d}er`);
export const decadeOf = (year: number) => Math.max(1970, Math.min(2030, Math.floor(year / 10) * 10));

/**
 * Libero ausgestorben (Wunsch Pascal): ab der Saison 2000/01 spielt niemand mehr mit
 * freiem Mann – kein Trainer wählt ein Libero-System, die Jugend bildet keine Liberos
 * mehr aus. Lernen kann man die Position weiter (Positionstraining), nur nutzt sie keiner.
 */
export const LIBERO_END = 2000;
export const liberoOut = (year: number) => year >= LIBERO_END;

/** Jahr für die automatische Formationswahl ohne Jahresangabe (Kadererzeugung, lineupAI). */
let formationYear = 1975;
export const setFormationYear = (y: number) => { formationYear = y; };
export const currentFormationYear = () => formationYear;

/** Typisch für ein Jahr (Datensatz-Zuordnung, ohne Libero nach LIBERO_END). */
export function typicalFormations(year: number): Formation[] {
  const d = decadeOf(year);
  return FORMATIONS.filter((f) => f.eras.includes(d) && !(f.libero && liberoOut(year)));
}

/** Datensatz: Jahrzehnte je Formation überschreiben (fehlende IDs = eingebaut). */
export function applyFormationEras(map: Record<string, number[]> | undefined): void {
  for (const f of FORMATIONS) f.eras = [...(map?.[f.id] ?? BUILTIN_FORMATION_ERAS[f.id] ?? [])];
}

/** Formation per ID finden (Fallback: Standard 4-4-2). */
export function getFormation(id: string | undefined): Formation {
  return FORMATIONS.find((f) => f.id === id) ?? FORMATIONS[0];
}

/** Default-Formation des Spiels (Libero-System, passend zur 80er-Ära). */
export const DEFAULT_FORMATION_ID = 'libero-1-4-3-2';
