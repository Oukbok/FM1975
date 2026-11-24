// =============================================================================
// NEUTRALE VERBANDS-/WETTBEWERBSNAMEN IN ALTEN SPIELSTÄNDEN (Wunsch Pascal: „Verbände und
// Wettbewerbe müssen neutral heißen“, Schema data/neutralNames.ts). Gespeicherte Anzeigetexte –
// Nachrichten (Betreff/Text/Absender), Divisionsnamen („NOFV-Oberliga“), Liga-Archiv, Vereins-
// Historie, Buchungstexte („DFB-Geldstrafe“), Umfeld-/Hallen-Protokolle, Stufen der Länderspiele
// („Nations League“) – werden einmal beim Laden umgeschrieben. IDs und interne Schlüssel bleiben
// ('UEFA' als Kontinent, 'uefa' als Wettbewerb: `neutralText` lässt reine Schlüssel stehen).
// Stufe 2 (namesV 2): Weltpokal → Transatlantik-Pokal, Klub-WM → Klub-Weltturnier, Supercup →
// Gipfelpokal, Hallen-Masters → Hallenfinale, Goldener Ball → Goldener Stern u. a. (Tabelle CLAUDE.md).
// Stufe 3 (namesV 3): gespeicherte „Europa-Liga“ → „Kontinental-Liga“, „Konferenz-Liga“ → „Europa-Trophäe“.
// Stufe 4 (namesV 4): „Goldener Ball“/„Goldener Stern“ in allen Fällen → „Kristallstern“ (Fußballer des Jahres).
// Idempotent (kein neuer Name enthält einen alten); Markierung `game.namesV`.
// =============================================================================
import { neutralText } from '../data/neutralNames';
import type { Game } from './state';

/** 1 = Verbände/Ligen/Europapokale · 2 = Weltpokal, Klub-WM, Supercup, Ligapokal, Hallen-Masters,
 *  Goldener Ball/Schuh u. a. + „Erstligist“ geglättet (Regeln `RULES_V2` in data/neutralNames.ts) ·
 *  3 = „Europa-Liga“ → „Kontinental-Liga“, „Konferenz-Liga“ → „Europa-Trophäe“ (`RULES_V3`) ·
 *  4 = „Goldener Ball“/„Goldener Stern“ → „Kristallstern“ (`RULES_V4`). */
export const NEUTRAL_NAMES_V = 4;

/** Objektschlüssel, unter denen nie Anzeigetexte stehen (Kennungen, Zahlenreihen). */
const SKIP_KEYS = new Set(['id', 'ids', 'clubId', 'playerId', 'managedClubId', 'relatedId', 'matchId', 'key', 'cc', 'code', 'conf',
  // Personennamen (z. B. englischer Familienname „Masters“) bleiben unangetastet.
  'firstName', 'lastName', 'fullName']);

/** Ersetzt alle Zeichenketten im Baum; gibt die Zahl der Änderungen zurück. */
export function neutralizeTree(root: unknown): number {
  let n = 0;
  const stack: unknown[] = [root];
  while (stack.length) {
    const o = stack.pop();
    if (!o || typeof o !== 'object') continue;
    if (Array.isArray(o)) {
      for (let i = 0; i < o.length; i++) {
        const v = o[i];
        if (typeof v === 'string') { const t = neutralText(v); if (t !== v) { o[i] = t; n++; } }
        else if (v && typeof v === 'object') stack.push(v);
      }
      continue;
    }
    const rec = o as Record<string, unknown>;
    for (const k of Object.keys(rec)) {
      if (SKIP_KEYS.has(k)) continue;
      const v = rec[k];
      if (typeof v === 'string') { const t = neutralText(v); if (t !== v) { rec[k] = t; n++; } }
      else if (v && typeof v === 'object') stack.push(v);
    }
  }
  return n;
}

export function migrateNeutralNames(g: Game): void {
  if ((g.namesV ?? 0) >= NEUTRAL_NAMES_V) return;
  neutralizeTree(g);
  g.namesV = NEUTRAL_NAMES_V;
}
