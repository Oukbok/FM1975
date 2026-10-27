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
  slots: FormationSlot[];
}

const S = (id: string, position: Position, x: number, y: number): FormationSlot => ({ id, position, x, y });

export const FORMATIONS: Formation[] = [
  // ------------------------------------------------------------------ Klassisch
  {
    id: '4-4-2', label: '4-4-2', libero: false,
    desc: 'Der Klassiker: kompakte Viererkette, zwei Sturmspitzen. Ausgewogen und stabil.',
    slots: [
      S('s1', 'TW', 50, 90),
      S('s2', 'AV', 16, 70), S('s3', 'VS', 38, 72), S('s4', 'VS', 62, 72), S('s5', 'AV', 84, 70),
      S('s6', 'FL', 15, 48), S('s7', 'ZM', 40, 50), S('s8', 'ZM', 60, 50), S('s9', 'FL', 85, 48),
      S('s10', 'MS', 38, 24), S('s11', 'MS', 62, 24),
    ],
  },
  {
    id: '4-3-3', label: '4-3-3', libero: false,
    desc: 'Offensiv mit drei Angreifern und breiten Flügeln. Braucht laufstarke Mittelfeldspieler.',
    slots: [
      S('s1', 'TW', 50, 90),
      S('s2', 'AV', 16, 70), S('s3', 'VS', 38, 72), S('s4', 'VS', 62, 72), S('s5', 'AV', 84, 70),
      S('s6', 'DM', 50, 58), S('s7', 'ZM', 34, 48), S('s8', 'ZM', 66, 48),
      S('s9', 'FL', 16, 26), S('s10', 'MS', 50, 20), S('s11', 'FL', 84, 26),
    ],
  },
  {
    id: '3-5-2', label: '3-5-2', libero: false,
    desc: 'Fünf im Mittelfeld sorgen für Überzahl, die Außen schieben mit. Kraftraubend.',
    slots: [
      S('s1', 'TW', 50, 90),
      S('s2', 'VS', 30, 72), S('s3', 'VS', 50, 74), S('s4', 'VS', 70, 72),
      S('s5', 'FL', 12, 52), S('s6', 'ZM', 36, 52), S('s7', 'OM', 50, 44), S('s8', 'ZM', 64, 52), S('s9', 'FL', 88, 52),
      S('s10', 'MS', 40, 22), S('s11', 'MS', 60, 22),
    ],
  },
  {
    id: '4-2-3-1', label: '4-2-3-1', libero: false,
    desc: 'Modern gedacht: Doppel-Sechs sichert ab, dahinter ein Spielmacher hinter der Spitze.',
    slots: [
      S('s1', 'TW', 50, 90),
      S('s2', 'AV', 16, 70), S('s3', 'VS', 38, 72), S('s4', 'VS', 62, 72), S('s5', 'AV', 84, 70),
      S('s6', 'DM', 38, 56), S('s7', 'DM', 62, 56),
      S('s8', 'FL', 18, 38), S('s9', 'OM', 50, 40), S('s10', 'FL', 82, 38),
      S('s11', 'MS', 50, 20),
    ],
  },
  {
    id: '5-3-2', label: '5-3-2', libero: false,
    desc: 'Fünferkette mit offensiven Außenverteidigern. Sehr defensivsicher, kontert gefährlich.',
    slots: [
      S('s1', 'TW', 50, 90),
      S('s2', 'AV', 12, 68), S('s3', 'VS', 32, 72), S('s4', 'VS', 50, 74), S('s5', 'VS', 68, 72), S('s6', 'AV', 88, 68),
      S('s7', 'ZM', 32, 50), S('s8', 'ZM', 50, 48), S('s9', 'ZM', 68, 50),
      S('s10', 'MS', 40, 22), S('s11', 'MS', 60, 22),
    ],
  },
  {
    id: '3-4-3', label: '3-4-3', libero: false,
    desc: 'Volles Offensivrisiko mit Dreierkette und drei Angreifern. Für mutige Trainer.',
    slots: [
      S('s1', 'TW', 50, 90),
      S('s2', 'VS', 30, 72), S('s3', 'VS', 50, 74), S('s4', 'VS', 70, 72),
      S('s5', 'FL', 14, 50), S('s6', 'ZM', 38, 50), S('s7', 'ZM', 62, 50), S('s8', 'FL', 86, 50),
      S('s9', 'FL', 20, 24), S('s10', 'MS', 50, 20), S('s11', 'FL', 80, 24),
    ],
  },
  // -------------------------------------------------------------- Libero-Systeme
  {
    id: 'libero-1-4-3-2', label: 'Libero 1-4-3-2', libero: true,
    desc: '80er-Standard: freier Libero hinter der Viererkette, kreatives Mittelfeld, zwei Spitzen.',
    slots: [
      S('s1', 'TW', 50, 92),
      S('s2', 'LIB', 50, 80),
      S('s3', 'AV', 16, 70), S('s4', 'VS', 38, 72), S('s5', 'VS', 62, 72), S('s6', 'AV', 84, 70),
      S('s7', 'DM', 50, 56), S('s8', 'ZM', 34, 48), S('s9', 'OM', 66, 44),
      S('s10', 'MS', 40, 22), S('s11', 'HS', 62, 26),
    ],
  },
  {
    id: 'libero-1-3-4-2', label: 'Libero 1-3-4-2', libero: true,
    desc: 'Libero mit Dreier-Manndeckung davor und breitem Mittelfeld — flexibel und offensiv.',
    slots: [
      S('s1', 'TW', 50, 92),
      S('s2', 'LIB', 50, 80),
      S('s3', 'VS', 30, 72), S('s4', 'VS', 50, 73), S('s5', 'VS', 70, 72),
      S('s6', 'FL', 14, 52), S('s7', 'ZM', 38, 50), S('s8', 'ZM', 62, 50), S('s9', 'FL', 86, 52),
      S('s10', 'MS', 40, 24), S('s11', 'HS', 60, 26),
    ],
  },
  {
    id: 'libero-1-4-4-1', label: 'Libero 1-4-4-1 (Catenaccio)', libero: true,
    desc: 'Beton-Variante: Libero plus Viererkette, dichtes Mittelfeld, einzelne Spitze. Extrem stabil.',
    slots: [
      S('s1', 'TW', 50, 92),
      S('s2', 'LIB', 50, 80),
      S('s3', 'AV', 16, 70), S('s4', 'VS', 38, 72), S('s5', 'VS', 62, 72), S('s6', 'AV', 84, 70),
      S('s7', 'FL', 18, 50), S('s8', 'ZM', 38, 48), S('s9', 'ZM', 62, 48), S('s10', 'FL', 82, 50),
      S('s11', 'MS', 50, 22),
    ],
  },
];

/** Formation per ID finden (Fallback: Standard 4-4-2). */
export function getFormation(id: string | undefined): Formation {
  return FORMATIONS.find((f) => f.id === id) ?? FORMATIONS[0];
}

/** Default-Formation des Spiels (Libero-System, passend zur 80er-Ära). */
export const DEFAULT_FORMATION_ID = 'libero-1-4-3-2';
