// Landesfarben aus der Flagge (data/countryFlags.ts) für den Akzent der Nationalteam-Sicht
// (ui/clubAccent.ts `applyClubAccent` wählt daraus wie bei Vereinsfarben).
import { COUNTRY_INFO, countryOfNat, type FlagSpec } from '../../data/countryFlags';

function colorsOf(f: FlagSpec): string[] {
  switch (f.kind) {
    case 'h': case 'v': return f.c;
    case 'nordic': return [f.cross, f.bg, f.inner ?? f.cross];
    case 'cross': case 'saltire': return [f.cross, f.bg];
    case 'crescent': return [f.bg, f.fg];
    default: return [f.bg, f.dot ?? f.bg];
  }
}
/** Nicht fast weiß/schwarz: kräftigste Flaggenfarben zuerst. */
const plainish = (hex: string) => /^#(?:[ef][0-9a-f]){3}$/i.test(hex) || /^#(?:[0-2][0-9a-f]){3}$/i.test(hex);
export function nationAccent(nat: string): { primary: string; secondary: string } {
  const k = countryOfNat(nat);
  const f = k ? COUNTRY_INFO[k]?.flag : null;
  if (!f) return { primary: '#2c4f9e', secondary: '#c8323c' };
  const cs = colorsOf(f);
  const strong = cs.filter((c) => !plainish(c));
  const list = strong.length ? strong : cs;
  return { primary: list[0], secondary: list[1] ?? list[0] };
}
