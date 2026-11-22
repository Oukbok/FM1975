// =============================================================================
// AUFGELÖSTE STAATEN (Wunsch Pascal: Länder, die es nicht mehr gibt, gelten für
// Spieler nur, solange sie bestehen)
// -----------------------------------------------------------------------------
// Tschechoslowakei (bis 1992) → Tschechien/Slowakei, Sowjetunion (bis 1991) →
// Russland/Ukraine, Jugoslawien (bis 1991) → Serbien/Kroatien/Bosnien-Herzegowina/
// Slowenien/Nordmazedonien, DDR (bis 1990) → Deutschland. Jahreszahlen wie bei den
// Nationalmannschaften (data/nationalTeams.ts, Kalenderjahr).
//  - Vor dem Zerfall trägt ein Spieler das Kürzel des alten Staates (auch wenn seine
//    Herkunft „Kroatien“ oder „Russland“ heißt), danach das eines Nachfolgers.
//  - Welcher Nachfolger: Land des Vereins bzw. Heimatland (`hint`), sonst fest aus
//    dem Schlüssel (Spieler-ID) nach Gewicht – bei jedem Aufruf dasselbe Ergebnis.
// Einheimische eines Landes: `landNation`. Reine Rechnung ohne Spielstand; Anwendung beim Erzeugen (data/origins.ts
// `originNat`) und für bestehende Spieler in game/nationSync.ts.
// =============================================================================
import { COUNTRY_INFO } from './countryFlags';
import { NATION_BY_CODE } from './nationalTeams';

interface NationEra { code: string; to: number; succ: [string, number][] }

export const NATION_ERAS: NationEra[] = [
  { code: 'TCH', to: 1992, succ: [['CZE', 65], ['SVK', 35]] },
  { code: 'URS', to: 1991, succ: [['RUS', 65], ['UKR', 35]] },
  { code: 'YUG', to: 1991, succ: [['SRB', 40], ['CRO', 25], ['BIH', 15], ['SVN', 10], ['MKD', 10]] },
  { code: 'GDR', to: 1990, succ: [['GER', 1]] },
];
const BY_CODE: Record<string, NationEra> = Object.fromEntries(NATION_ERAS.map((e) => [e.code, e]));
/** Nachfolger → alter Staat (Deutschland gehört nicht dazu: GER war nie GDR). */
const ROOT: Record<string, string> = {};
for (const e of NATION_ERAS) if (e.code !== 'GDR') for (const [c] of e.succ) ROOT[c] = e.code;

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Alter Staat zu einem Kürzel (TCH für CZE/SVK/TCH), sonst null. */
export function nationRoot(code: string): string | null {
  return BY_CODE[code] ? code : ROOT[code] ?? null;
}

/** Gehört das Kürzel zu einem aufgelösten Staat oder einem Nachfolger? */
export const isEraNation = (code: string | undefined): boolean => !!code && (!!BY_CODE[code] || !!ROOT[code]);

/**
 * Nationalität im Kalenderjahr. `key` (Spieler-ID) entscheidet fest über den Nachfolger,
 * `hint` (Nation des Vereins-/Heimatlandes) hat Vorrang, wenn er zur selben Familie gehört.
 */
export function natAt(code: string, year: number, key = '', hint?: string | null): string {
  const era = BY_CODE[code] ?? BY_CODE[ROOT[code]];
  if (!era) return code;
  if (year <= era.to) return era.code;
  if (code !== era.code) return code;
  if (hint && hint !== era.code && ROOT[hint] === era.code) return hint;
  if (!key || era.succ.length === 1) return era.succ[0][0];
  const total = era.succ.reduce((a, [, w]) => a + w, 0);
  let x = hash(`${key}|${era.code}`) % total;
  for (const [c, w] of era.succ) { x -= w; if (x < 0) return c; }
  return era.succ[0][0];
}

/**
 * Nation der Einheimischen eines Landes (Schlüssel der Hintergrund-Welt, z. B. 'Slowakei') im Jahr –
 * nur für die Sonderfälle: Land ist ein aufgelöster Staat oder Nachfolger (Slowakei → SVK, vor 1993 TCH),
 * oder seine Spielernamen stammen aus einer solchen Herkunft (`base`, z. B. Bulgarien mit serbischen
 * Namenslisten → BUL). Aufgelöster Staat nach dem Zerfall und alle übrigen Länder: null.
 */
export function landNation(key: string | undefined, year: number, base?: string): string | null {
  const code = key ? COUNTRY_INFO[key]?.code : undefined;
  if (!code) return null;
  if (isEraNation(code)) return BY_CODE[code] && year > BY_CODE[code].to ? null : natAt(code, year);
  return isEraNation(base) && NATION_BY_CODE[code] ? code : null;
}

/** Kürzel, unter denen die Herkunft eines Spielers geführt sein kann (CZE → CZE, TCH, SVK). */
export function nationFamily(code: string): string[] {
  const root = nationRoot(code);
  if (!root) return [code];
  return [code, root, ...BY_CODE[root].succ.map(([c]) => c)].filter((c, i, a) => a.indexOf(c) === i);
}
