// =============================================================================
// Hallenturniere: Flagge vor Vereinen aus einem anderen Land als dem Heimatland
// (Auslandsgäste deutscher Turniere, Teilnehmer der Turniere im Ausland). Genutzt in der
// Hallen-Show (screens/indoor/) und in Statistiken › Halle. CSS `.ix-flag` in 28-indoor.css.
// =============================================================================
import { CountryFlag } from '../../components/competition/CountryFlag';
import { foreignCountry } from '../../game/competitionView';
import { homeCountryKey, type Game } from '../../game/state';

/** Land eines Hallen-Teilnehmers, wenn er nicht aus dem Heimatland kommt. */
export function indoorGuestCountry(g: Game, id: string): string | undefined {
  const c = foreignCountry(g, id);
  return c && c !== homeCountryKey(g) ? c : undefined;
}

export function IndoorFlag({ g, id, height = 12 }: { g: Game; id: string; height?: number }) {
  const c = indoorGuestCountry(g, id);
  return c ? <span className="ix-flag"><CountryFlag country={c} height={height} noLink /></span> : null;
}
