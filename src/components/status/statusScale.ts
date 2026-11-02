// =============================================================================
// Zustands-Skala für die Anzeige (Frische, Form, Moral, Fitness) — nur Darstellung
// =============================================================================
// Alle drei Werte werden für die Oberfläche auf 0–100 gebracht; der Spielstand
// bleibt unverändert:
//   Frische  `Player.frische`  0–100 (100 = voll erholt, fehlt → 100)
//   Form     `Player.form`     0–100 (50 = Durchschnitt; driftet zur Mitte)
//   Moral    `Player.morale`   5 Stufen (very_low … excellent) → 10/30/50/70/90
//   Fitness  `Player.attributes.fitness` 0–100 (Grundkondition, Hantel)
//   Kraft    `MPlayer.energy`  0–100 im Textmodus (wie Frische angezeigt)
// Daraus folgt eine von 5 Stufen (1 = schlecht/rot … 5 = sehr gut/dunkelgrün),
// Farbe über die Tokens `--st-1 … --st-5` in `styles/00-base.css`. Form ist die
// Ausnahme: Daumen immer hoch, nur Grünstufen `--fg-1 … --fg-5` (kein Rot).
// =============================================================================
import type { Player, PlayerMorale } from '../../types';

export type StatusKind = 'frische' | 'form' | 'moral' | 'kraft' | 'fitness';
export type StatusLevel = 1 | 2 | 3 | 4 | 5;

/** Moral-Stufe → Anzeigewert 0–100. */
export const MORALE_100: Record<PlayerMorale, number> = { very_low: 10, low: 30, okay: 50, good: 70, excellent: 90 };

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

export const freshness100 = (p: Pick<Player, 'frische'>) => clamp(typeof p.frische === 'number' ? p.frische : 100);
export const form100 = (p: Pick<Player, 'form'>) => clamp(typeof p.form === 'number' ? p.form : 50);
export const fitness100 = (p: Pick<Player, 'attributes'>) => clamp(p.attributes?.fitness ?? 90);
export const morale100 = (m: PlayerMorale | undefined) => MORALE_100[m ?? 'okay'] ?? 50;
/** Moral 0–100 eines Spielers: echter Wert aus der Kabine (`moraleScore`), sonst aus der Stufe. */
export const playerMorale100 = (p: Pick<Player, 'morale' | 'moraleScore'>) => Math.round(p.moraleScore ?? morale100(p.morale));

/**
 * Stufe aus dem 0–100-Wert. Frische: ab 90 voll erholt, unter 60 müde. Form: 50 ist
 * Durchschnitt (gelb), darüber grün, darunter orange/rot. Moral: je Stufe.
 */
export function statusLevel(kind: StatusKind, v: number): StatusLevel {
  if (kind === 'frische') return v >= 90 ? 5 : v >= 75 ? 4 : v >= 60 ? 3 : v >= 45 ? 2 : 1;
  // Kraft im Spiel startet bei 85–100 und fällt bis Schlusspfiff meist auf 55–75
  if (kind === 'kraft') return v >= 85 ? 5 : v >= 70 ? 4 : v >= 55 ? 3 : v >= 40 ? 2 : 1;
  if (kind === 'form') return v >= 68 ? 5 : v >= 56 ? 4 : v >= 44 ? 3 : v >= 32 ? 2 : 1;
  // Fitness: neu erzeugte Spieler 88–100, ein Spiel kostet 14–22, Training baut wieder auf
  if (kind === 'fitness') return v >= 88 ? 5 : v >= 75 ? 4 : v >= 62 ? 3 : v >= 48 ? 2 : 1;
  return v >= 85 ? 5 : v >= 65 ? 4 : v >= 45 ? 3 : v >= 25 ? 2 : 1;
}

export const STATUS_TITLE: Record<StatusKind, string> = { frische: 'Frische', form: 'Form', moral: 'Moral', kraft: 'Kraft', fitness: 'Fitness' };

const WORDS: Record<StatusKind, [string, string, string, string, string]> = {
  frische: ['erschöpft', 'müde', 'leicht müde', 'gut erholt', 'voll erholt'],
  kraft: ['am Ende', 'müde', 'lässt nach', 'frisch', 'voll da'],
  form: ['Formtief', 'schwache Form', 'durchschnittlich', 'gute Form', 'Topform'],
  moral: ['sehr unzufrieden', 'unzufrieden', 'neutral', 'zufrieden', 'sehr glücklich'],
  fitness: ['kaum belastbar', 'Trainingsrückstand', 'ordentlich', 'fit', 'topfit'],
};

/** Ausführlichere Worte im Hover (wo das Kurzwort zu knapp ist). */
const TIP_WORDS: Partial<Record<StatusKind, [string, string, string, string, string]>> = {
  form: ['kommt im System nicht zurecht', 'tut sich im System schwer', 'kommt im System zurecht', 'kommt gut im System zurecht', 'blüht im System auf'],
};
/** Erklärsatz unter dem Wert im Hover. */
export const STATUS_NOTE: Partial<Record<StatusKind, string>> = {
  form: 'Form zeigt, wie gut ein Spieler im System zurechtkommt.',
};

export const statusWord = (kind: StatusKind, level: StatusLevel) => WORDS[kind][level - 1];
export const statusTipWord = (kind: StatusKind, level: StatusLevel) => (TIP_WORDS[kind] ?? WORDS[kind])[level - 1];
export const statusColor = (level: StatusLevel, kind?: StatusKind) => (kind === 'form' ? `var(--fg-${level})` : `var(--st-${level})`);
/** Hover-Text, z. B. „Frische 83/100 – gut erholt“. */
export const statusText = (kind: StatusKind, v: number) => `${STATUS_TITLE[kind]} ${v}/100 – ${statusTipWord(kind, statusLevel(kind, v))}`;
