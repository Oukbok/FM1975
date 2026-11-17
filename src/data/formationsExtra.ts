// =============================================================================
// Weitere Spielsysteme (Wunsch Pascal: größere Auswahl in der Aufstellung)
// -----------------------------------------------------------------------------
// Wird in data/formations.ts an FORMATIONS angehängt. Koordinaten wie dort
// (x 0 = links … 100 = rechts, y 8 = Angriff … 92 = eigenes Tor) und auf Punkten
// des Rasters in data/pitchGrid.ts, damit „Fest einrasten“ sie trifft.
// `eras` = Jahrzehnte, in denen das System typisch war (leer = nur historisch/frei wählbar).
// =============================================================================
import type { Position } from '../types';
import type { Formation, FormationSlot } from './formations';

const S = (id: string, position: Position, x: number, y: number): FormationSlot => ({ id, position, x, y });
const TW = S('s1', 'TW', 50, 90);
const BACK4 = [S('s2', 'LV', 14, 71), S('s3', 'IV', 38, 72), S('s4', 'IV', 62, 72), S('s5', 'RV', 86, 71)];
const BACK3 = [S('s2', 'IV', 32, 72), S('s3', 'IV', 50, 73), S('s4', 'IV', 68, 72)];
const BACK5 = [S('s2', 'LV', 12, 59), S('s3', 'IV', 32, 72), S('s4', 'IV', 50, 73), S('s5', 'IV', 68, 72), S('s6', 'RV', 88, 59)];

export const EXTRA_FORMATIONS: Formation[] = [
  {
    id: '4-2-2-2', label: '4-2-2-2 (Magisches Viereck)', libero: false, eras: [1990, 2000],
    desc: 'Zwei Sechser, zwei Zehner im Halbraum, zwei Spitzen: viel Druck durch die Mitte, die Breite kommt von den Außenverteidigern.',
    slots: [TW, ...BACK4, S('s6', 'DM', 41, 60.5), S('s7', 'DM', 59, 60.5), S('s8', 'OM', 34, 38), S('s9', 'OM', 66, 38), S('s10', 'MS', 34, 20), S('s11', 'MS', 66, 20)],
  },
  {
    id: '4-1-3-2', label: '4-1-3-2', libero: false, eras: [1990],
    desc: 'Ein Abräumer vor der Kette, eine breite Dreierreihe dahinter und zwei Spitzen – direkt und flügelstark.',
    slots: [TW, ...BACK4, S('s6', 'DM', 50, 61), S('s7', 'LM', 13, 48), S('s8', 'ZM', 50, 49), S('s9', 'RM', 87, 48), S('s10', 'MS', 34, 20), S('s11', 'MS', 66, 20)],
  },
  {
    id: '4-2-1-3', label: '4-2-1-3', libero: false, eras: [2010, 2020],
    desc: 'Doppelsechs, ein Spielmacher und drei Angreifer: offensiv, aber mit sicherer Absicherung im Zentrum.',
    slots: [TW, ...BACK4, S('s6', 'DM', 41, 60.5), S('s7', 'DM', 59, 60.5), S('s8', 'OM', 50, 38), S('s9', 'LA', 16, 28), S('s10', 'MS', 50, 19), S('s11', 'RA', 84, 28)],
  },
  {
    id: '4-3-3-f9', label: '4-3-3 (falsche Neun)', libero: false, eras: [2010, 2020, 2030],
    desc: 'Statt Mittelstürmer lässt sich eine hängende Spitze fallen – Überzahl im Mittelfeld, die Flügel stoßen in die Lücken.',
    slots: [TW, ...BACK4, S('s6', 'DM', 50, 61), S('s7', 'ZM', 33, 49), S('s8', 'ZM', 67, 49), S('s9', 'LA', 16, 28), S('s10', 'HS', 50, 29), S('s11', 'RA', 84, 28)],
  },
  {
    id: '3-4-1-2', label: '3-4-1-2', libero: false, eras: [2000, 2010],
    desc: 'Dreierkette, breites Mittelfeld, ein Zehner hinter zwei Spitzen. Die Außen müssen die ganze Linie laufen.',
    slots: [TW, ...BACK3, S('s5', 'LM', 13, 48), S('s6', 'ZM', 41.5, 49), S('s7', 'ZM', 58.5, 49), S('s8', 'RM', 87, 48), S('s9', 'OM', 50, 38), S('s10', 'MS', 34, 20), S('s11', 'MS', 66, 20)],
  },
  {
    id: '3-1-4-2', label: '3-1-4-2', libero: false, eras: [1990, 2000],
    desc: 'Dreierkette mit einem Sechser davor, vier Mittelfeldspieler auf einer Linie und zwei Spitzen.',
    slots: [TW, ...BACK3, S('s5', 'DM', 50, 61), S('s6', 'LM', 13, 48), S('s7', 'ZM', 41.5, 49), S('s8', 'ZM', 58.5, 49), S('s9', 'RM', 87, 48), S('s10', 'MS', 34, 20), S('s11', 'MS', 66, 20)],
  },
  {
    id: '3-4-3-raute', label: '3-4-3 Raute', libero: false, eras: [1990],
    desc: 'Das Angriffsmodell der Holländer: Raute im Mittelfeld, drei Stürmer, nur drei Mann hinten. Mutig.',
    slots: [TW, ...BACK3, S('s5', 'DM', 50, 61), S('s6', 'LM', 13, 48), S('s7', 'RM', 87, 48), S('s8', 'OM', 50, 38), S('s9', 'LA', 16, 28), S('s10', 'MS', 50, 19), S('s11', 'RA', 84, 28)],
  },
  {
    id: '3-6-1', label: '3-6-1', libero: false, eras: [2010],
    desc: 'Massives Mittelfeld mit Doppelsechs und zwei Zehnern, eine Spitze. Kontrolle statt Tempo.',
    slots: [TW, ...BACK3, S('s5', 'LM', 13, 54), S('s6', 'DM', 41, 60.5), S('s7', 'DM', 59, 60.5), S('s8', 'RM', 87, 54), S('s9', 'OM', 34, 38), S('s10', 'OM', 66, 38), S('s11', 'MS', 50, 19)],
  },
  {
    id: '5-2-3', label: '5-2-3', libero: false, eras: [2010, 2020],
    desc: 'Fünferkette mit offensiven Außenverteidigern, zwei Achtern und drei Angreifern – hinten sicher, vorne breit.',
    slots: [TW, ...BACK5, S('s7', 'ZM', 41.5, 49), S('s8', 'ZM', 58.5, 49), S('s9', 'LA', 16, 28), S('s10', 'MS', 50, 19), S('s11', 'RA', 84, 28)],
  },
  {
    id: '5-2-1-2', label: '5-2-1-2', libero: false, eras: [1990, 2000],
    desc: 'Fünf hinten, zwei Zentrale, ein Zehner und zwei Spitzen: stabil und trotzdem mit zwei Anspielstationen vorne.',
    slots: [TW, ...BACK5, S('s7', 'ZM', 40, 54.5), S('s8', 'ZM', 60, 54.5), S('s9', 'OM', 50, 38), S('s10', 'MS', 34, 20), S('s11', 'MS', 66, 20)],
  },
  {
    id: '4-6-0', label: '4-6-0 (ohne Stürmer)', libero: false, eras: [2010, 2020],
    desc: 'Kein echter Stürmer: sechs Mittelfeldspieler rotieren und tauchen abwechselnd in der Spitze auf. Braucht Technik.',
    slots: [TW, ...BACK4, S('s6', 'DM', 41, 60.5), S('s7', 'DM', 59, 60.5), S('s8', 'LM', 14, 43), S('s9', 'RM', 86, 43), S('s10', 'OM', 42, 38), S('s11', 'OM', 58, 38)],
  },
  {
    id: '3-3-1-3', label: '3-3-1-3', libero: false, eras: [1970],
    desc: 'Totaler Fußball: drei hinten, drei im Mittelfeld, ein Spielmacher, drei Stürmer – alle schieben mit.',
    slots: [TW, ...BACK3, S('s5', 'DM', 50, 61), S('s6', 'LM', 23, 48.5), S('s7', 'RM', 77, 48.5), S('s8', 'OM', 50, 38), S('s9', 'LA', 16, 28), S('s10', 'MS', 50, 19), S('s11', 'RA', 84, 28)],
  },
  {
    id: 'wm-3-2-2-3', label: 'WM 3-2-2-3 (historisch)', libero: false, eras: [],
    desc: 'Das System der Großväter: drei Verteidiger, zwei Läufer, zwei Halbstürmer, drei Spitzen. Nur für Nostalgiker.',
    slots: [TW, S('s2', 'LV', 23, 71), S('s3', 'IV', 50, 73), S('s4', 'RV', 77, 71), S('s5', 'DM', 34, 60), S('s6', 'DM', 66, 60), S('s7', 'OM', 34, 38), S('s8', 'OM', 66, 38), S('s9', 'LA', 16, 28), S('s10', 'MS', 50, 19), S('s11', 'RA', 84, 28)],
  },
];
