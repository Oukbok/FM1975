// =============================================================================
// Wetter des eigenen Spiels – deterministisch aus Datum und Heimverein.
// Die Vorschau „Nächstes Spiel“ (screens/prematch/) zeigt es an, und der Spielstart
// (game/ownMatch.ts → createMatchSim `weather`) übernimmt genau diese Angabe.
// Verteilung je Monat wie in der Match-Engine (engine/match/sim.ts `rollWeather`).
// =============================================================================
import { fixedWeather, type Weather } from '../engine/match/sim';

export function forecastWeather(date: string, homeId: string): Weather {
  return fixedWeather(date, homeId);
}

/** Anzeige + Wirkung laut Match-Engine (sim.ts, attack.ts, actions.ts, engine/seating.ts). */
export const WEATHER_DE: Record<Weather, { label: string; note: string }> = {
  sonnig: { label: 'Sonnig, trocken', note: 'Kein besonderer Einfluss auf das Spiel.' },
  bewoelkt: { label: 'Bewölkt, trocken', note: 'Kein besonderer Einfluss auf das Spiel.' },
  regen: { label: 'Regen', note: 'Nasser Rasen: mehr Fehler im Aufbau, Fernschüsse und Freistöße werden gefährlicher, auf offenen Plätzen bleiben Zuschauer weg.' },
  schnee: { label: 'Schnee', note: 'Schwerer Boden: mehr Fehler, etwas weniger Tempo; auf offenen Plätzen bleiben Zuschauer weg.' },
  hitze: { label: 'Hitze', note: 'Die Kräfte lassen schneller nach – Wechsel früher einplanen.' },
  wind: { label: 'Windig', note: 'Kein besonderer Einfluss auf das Spiel.' },
  nebel: { label: 'Nebel', note: 'Kein besonderer Einfluss auf das Spiel.' },
};
