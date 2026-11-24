// =============================================================================
// RELEGATION, PLAY-OFFS & ENTSCHEIDUNGSSPIELE JE LAND UND SAISON (Wunsch Pascal:
// „Füge Relegation komplett hinzu und nutze sie akkurat in jedem Ligensystem“ –
// auch in anderen Ländern als Deutschland). Kurzfassung mit Quellen:
// docs/research/relegation.md.
// -----------------------------------------------------------------------------
// Ein Format gilt für eine Ebenen-Grenze `lv` (1 = zwischen 1. und 2. Ebene) und
// die Saisons `from`–`to` (Startjahr der GESPIELTEN Saison: 2008 = 2008/09, die
// Relegation am Ende von 2008/09 entscheidet über 2009/10). Es besteht aus einer
// oder mehreren „Klammern“ (`RelBracket`): Spiele, deren letztes über genau EINEN
// Platz in der oberen Liga entscheidet – der Sieger spielt dort, alle anderen
// Teilnehmer der Klammer spielen (bzw. bleiben) unten. Teilnehmer = Tabellenplätze
// der oberen (`u`) bzw. unteren (`l`) Liga; negativ = von unten gezählt (−3 =
// Drittletzter), damit dieselbe Regel über Ligagrößen hinweg gilt; `g` = Staffel
// (0-basiert) der unteren Ebene. Die ZAHL der Auf- und Absteiger bleibt so, wie
// der Saisonwechsel sie ohnehin rechnet (Deutschland data/reforms.ts, Ausland
// data/world/structure.ts aus den Weltdaten) – die Relegation legt nur fest, WER
// den umkämpften Platz bekommt (game/relegationCore.ts `relSwap`).
// Neutrale Namen: keine Verbands- oder Wettbewerbsmarken, nur Gattungsbegriffe.
// =============================================================================

export type RelSide = 'u' | 'l';
/** Teilnehmer: Platz `p` der oberen/unteren Liga (negativ = von unten), Staffel `g` der unteren Ebene. */
export interface RelEnt { s: RelSide; p: number; g?: number }
/** Platz in einem Spiel: Teilnehmer oder Sieger des Spiels `w` derselben Klammer. */
export type RelSlot = RelEnt | { w: number };
/** Ein Duell: `a` hat Heimrecht im (Hin-)Spiel, `b` im Rückspiel. */
export interface RelMatchDef { a: RelSlot; b: RelSlot; legs: 1 | 2; neutral?: boolean }
export interface RelBracket {
  m: RelMatchDef[];
  /** Nur bei Punktgleichheit der beiden Teilnehmer (Entscheidungsspiel). */
  ifLevel?: boolean;
}
export type RelKind = 'relegation' | 'barrage' | 'playoff' | 'playout' | 'decider' | 'promocion' | 'nacomp' | 'final' | 'qual';
export interface RelFormat {
  cc: string;
  lv: number;
  from: number;
  to: number;
  kind: RelKind;
  /** Klammern; 'champs' = Aufstiegsspiele der Staffelmeister (+ Vizemeister laut data/reforms.ts), Paare gelost. */
  brackets: RelBracket[] | 'champs';
  /** Auswärtstorregel bis einschließlich dieser Saison (fehlt = nie). */
  awayGoalsTo?: number;
  /** Nach Verlängerung kein Elfmeterschießen: der Besserplatzierte kommt weiter. */
  tieBetter?: boolean;
  /** Quelle(n) – Schlüssel in docs/research/relegation.md. */
  src: string;
  /** Vereinfachung gegenüber dem Original (Anzeige im Wiki/i-Hilfe, Doku). */
  simple?: string;
}

const U = (p: number): RelEnt => ({ s: 'u', p });
const L = (p: number, g?: number): RelEnt => (g == null ? { s: 'l', p } : { s: 'l', p, g });
const W = (w: number) => ({ w });
/** Duell oben gegen unten, Hin/Rück; `lowerFirst` = Unterklassiger hat im Hinspiel Heimrecht. */
const duel = (u: number, l: number, lowerFirst: boolean, legs: 1 | 2 = 2): RelBracket =>
  ({ m: [lowerFirst ? { a: L(l), b: U(u), legs } : { a: U(u), b: L(l), legs }] });
/** Play-off der unteren Liga (Plätze a–d, a = bester): Halbfinale Hin/Rück, Finale je nach Saison. */
const po4 = (a: number, b: number, c: number, d: number, finalLegs: 1 | 2, neutral: boolean): RelBracket => ({
  m: [
    { a: L(d), b: L(a), legs: 2 },
    { a: L(c), b: L(b), legs: 2 },
    { a: W(1), b: W(0), legs: finalLegs, neutral: finalLegs === 1 && neutral },
  ],
});
/** Play-off mit dem Club der oberen Liga im Halbfinale (England 1986–88): Halbfinale + Finale Hin/Rück. */
const po4Upper = (u: number, l1: number, l2: number, l3: number): RelBracket => ({
  m: [
    { a: L(l3), b: U(u), legs: 2 },
    { a: L(l2), b: L(l1), legs: 2 },
    { a: W(1), b: W(0), legs: 2 },
  ],
});
/** Entscheidungsspiel bei Punktgleichheit an der Abstiegs- bzw. Aufstiegslinie (neutraler Platz). */
const decider = (a: RelEnt, b: RelEnt): RelBracket => ({ ifLevel: true, m: [{ a, b, legs: 1, neutral: true }] });

const N = 2100; // offen (fortgeschrieben)

export const RELEGATION_FORMATS: RelFormat[] = [
  // ---------------------------------------------------------------------------
  // Deutschland [DE1–DE4]
  // ---------------------------------------------------------------------------
  // 1974/75–1980/81: die Zweiten der 2. Liga Nord und Süd spielen um den dritten Aufstiegsplatz.
  { cc: 'ger', lv: 1, from: 1975, to: 1980, kind: 'playoff', brackets: [{ m: [{ a: L(2, 1), b: L(2, 0), legs: 2 }] }], src: 'DE1' },
  // 1981/82–1990/91 und ab 2008/09: 16. der 1. Liga gegen 3. der 2. Liga, Hinspiel beim Erstligisten.
  { cc: 'ger', lv: 1, from: 1981, to: 1990, kind: 'relegation', brackets: [duel(-3, 3, false)], awayGoalsTo: 1990, src: 'DE1' },
  { cc: 'ger', lv: 1, from: 2008, to: N, kind: 'relegation', brackets: [duel(-3, 3, false)], awayGoalsTo: 2020, src: 'DE2' },
  // Ab 2008/09: 16. der 2. Liga gegen 3. der 3. Liga, Hinspiel beim Drittligisten.
  { cc: 'ger', lv: 2, from: 2008, to: N, kind: 'relegation', brackets: [duel(-3, 3, true)], awayGoalsTo: 2020, src: 'DE2' },
  // Ab 2012/13: Aufstiegsspiele der Regionalliga-Meister (+ Vizemeister Südwest) – drei geloste Duelle.
  {
    cc: 'ger', lv: 3, from: 2012, to: N, kind: 'playoff', brackets: 'champs', awayGoalsTo: 2020, src: 'DE3',
    simple: 'Ab 2018/19 im Original vier Aufsteiger mit wechselnden Direktplätzen; im Spiel bleiben drei Aufstiegsplätze über geloste Duelle der Meister.',
  },
  // ---------------------------------------------------------------------------
  // England [EN1, EN2]
  // ---------------------------------------------------------------------------
  { cc: 'eng', lv: 1, from: 1986, to: 1987, kind: 'playoff', brackets: [po4Upper(-4, 3, 4, 5)], src: 'EN1', simple: 'Wiederholungsspiel im Finale 1987 entfällt (Verlängerung/Elfmeterschießen).' },
  { cc: 'eng', lv: 1, from: 1988, to: 1988, kind: 'playoff', brackets: [po4(3, 4, 5, 6, 2, false)], src: 'EN1' },
  { cc: 'eng', lv: 1, from: 1989, to: N, kind: 'playoff', brackets: [po4(3, 4, 5, 6, 1, true)], src: 'EN1' },
  { cc: 'eng', lv: 2, from: 1986, to: 1987, kind: 'playoff', brackets: [po4Upper(-3, 3, 4, 5)], src: 'EN1' },
  { cc: 'eng', lv: 2, from: 1988, to: 1988, kind: 'playoff', brackets: [po4(3, 4, 5, 6, 2, false)], src: 'EN1' },
  { cc: 'eng', lv: 2, from: 1989, to: N, kind: 'playoff', brackets: [po4(3, 4, 5, 6, 1, true)], src: 'EN1' },
  { cc: 'eng', lv: 3, from: 1986, to: 1987, kind: 'playoff', brackets: [po4Upper(-4, 4, 5, 6)], src: 'EN1' },
  { cc: 'eng', lv: 3, from: 1988, to: 1988, kind: 'playoff', brackets: [po4(4, 5, 6, 7, 2, false)], src: 'EN1' },
  { cc: 'eng', lv: 3, from: 1989, to: N, kind: 'playoff', brackets: [po4(4, 5, 6, 7, 1, true)], src: 'EN1' },
  // ---------------------------------------------------------------------------
  // Schottland [SC1]
  // ---------------------------------------------------------------------------
  { cc: 'sco', lv: 1, from: 1995, to: 1999, kind: 'playoff', brackets: [duel(-2, 2, true)], src: 'SC1' },
  {
    cc: 'sco', lv: 1, from: 2013, to: N, kind: 'playoff', src: 'SC1',
    brackets: [{ m: [{ a: L(4), b: L(3), legs: 2 }, { a: W(0), b: L(2), legs: 2 }, { a: W(1), b: U(-2), legs: 2 }] }],
  },
  {
    cc: 'sco', lv: 2, from: 2005, to: N, kind: 'playoff', src: 'SC1',
    brackets: [{ m: [{ a: L(4), b: U(-2), legs: 2 }, { a: L(3), b: L(2), legs: 2 }, { a: W(1), b: W(0), legs: 2 }] }],
    simple: 'Paarungen des Halbfinales vereinfacht (Zweitletzter der oberen Liga gegen den Vierten).',
  },
  // ---------------------------------------------------------------------------
  // Frankreich [FR1, FR2]
  // ---------------------------------------------------------------------------
  {
    cc: 'fra', lv: 1, from: 1975, to: 1992, kind: 'barrage', src: 'FR2',
    brackets: [{ m: [{ a: L(2, 1), b: L(2, 0), legs: 2 }, { a: W(0), b: U(-3), legs: 2 }] }],
    simple: 'Vereinfacht: die beiden Staffelzweiten ermitteln den Gegner des Drittletzten (einige Jahre spielten auch die Dritten mit).',
  },
  { cc: 'fra', lv: 1, from: 2016, to: 2016, kind: 'barrage', brackets: [duel(-3, 3, true)], src: 'FR1' },
  ...[[2017, 2018], [2020, 2021], [2023, N]].map(([from, to]): RelFormat => ({
    cc: 'fra', lv: 1, from, to, kind: 'barrage', src: 'FR1', awayGoalsTo: 2020,
    brackets: [{ m: [{ a: L(4), b: L(5), legs: 1 }, { a: L(3), b: W(0), legs: 1 }, { a: W(1), b: U(-3), legs: 2 }] }],
  })),
  ...[[2015, 2018], [2020, 2021], [2023, N]].map(([from, to]): RelFormat => ({
    cc: 'fra', lv: 2, from, to, kind: 'barrage', brackets: [duel(-3, 3, true)], src: 'FR1', awayGoalsTo: 2020,
    simple: 'Unterklassige Barrage (Drittletzter gegen Dritten der 3. Ebene) als Annahme nach dem Muster der oberen Barrage.',
  })),
  // ---------------------------------------------------------------------------
  // Italien [IT1, IT2]
  // ---------------------------------------------------------------------------
  { cc: 'ita', lv: 1, from: 1975, to: 1987, kind: 'decider', brackets: [decider(U(-4), U(-3)), decider(L(3), L(4))], src: 'IT1' },
  { cc: 'ita', lv: 1, from: 1988, to: 2003, kind: 'decider', brackets: [decider(U(-5), U(-4)), decider(L(4), L(5))], src: 'IT1' },
  { cc: 'ita', lv: 1, from: 2004, to: 2004, kind: 'decider', brackets: [decider(U(-4), U(-3))], src: 'IT1' },
  { cc: 'ita', lv: 1, from: 2005, to: 2012, kind: 'playoff', brackets: [po4(3, 4, 5, 6, 2, false)], tieBetter: true, src: 'IT2' },
  {
    cc: 'ita', lv: 1, from: 2013, to: 2021, kind: 'playoff', tieBetter: true, src: 'IT2',
    brackets: [{ m: [
      { a: L(5), b: L(8), legs: 1 }, { a: L(6), b: L(7), legs: 1 },
      { a: W(1), b: L(3), legs: 2 }, { a: W(0), b: L(4), legs: 2 }, { a: W(3), b: W(2), legs: 2 },
    ] }],
  },
  {
    cc: 'ita', lv: 1, from: 2022, to: N, kind: 'playoff', tieBetter: true, src: 'IT2',
    brackets: [decider(U(-4), U(-3)), { m: [
      { a: L(5), b: L(8), legs: 1 }, { a: L(6), b: L(7), legs: 1 },
      { a: W(1), b: L(3), legs: 2 }, { a: W(0), b: L(4), legs: 2 }, { a: W(3), b: W(2), legs: 2 },
    ] }],
  },
  { cc: 'ita', lv: 2, from: 2003, to: N, kind: 'playout', brackets: [{ m: [{ a: U(-4), b: U(-5), legs: 2 }] }], tieBetter: true, src: 'IT2', simple: 'Ohne die Sonderregel, dass das Play-out bei großem Punkteabstand entfällt.' },
  // ---------------------------------------------------------------------------
  // Spanien [ES1]
  // ---------------------------------------------------------------------------
  { cc: 'esp', lv: 1, from: 1987, to: 1998, kind: 'promocion', brackets: [duel(-4, 4, true), duel(-3, 3, true)], awayGoalsTo: 1998, src: 'ES1' },
  { cc: 'esp', lv: 1, from: 2010, to: N, kind: 'playoff', brackets: [po4(3, 4, 5, 6, 2, false)], tieBetter: true, src: 'ES1', simple: 'Zweite Mannschaften sind im Original nicht spielberechtigt; im Spiel nach Tabellenplatz.' },
  // ---------------------------------------------------------------------------
  // Niederlande [NL1, NL2]
  // ---------------------------------------------------------------------------
  {
    cc: 'ned', lv: 1, from: 1984, to: 1988, kind: 'nacomp', brackets: [{ m: [{ a: L(4), b: L(3), legs: 2 }] }], src: 'NL1',
    simple: 'Rundenturnier der Periodensieger als Duell der Tabellendritten und -vierten.',
  },
  {
    cc: 'ned', lv: 1, from: 1989, to: 1991, kind: 'nacomp', src: 'NL1', simple: 'Gruppen der Periodensieger als K.-o.-Duelle nach Tabellenplatz.',
    brackets: [{ m: [{ a: L(3), b: L(2), legs: 2 }] }, { m: [{ a: L(4), b: U(-3), legs: 2 }] }],
  },
  ...[[1992, 2016]].map(([from, to]): RelFormat => ({
    cc: 'ned', lv: 1, from, to, kind: 'nacomp', src: 'NL1', simple: 'Gruppen bzw. drei Runden der Periodensieger als zwei Klammern nach Tabellenplatz.',
    brackets: [
      { m: [{ a: L(5), b: L(2), legs: 2 }, { a: W(0), b: U(-3), legs: 2 }] },
      { m: [{ a: L(4), b: L(3), legs: 2 }, { a: W(0), b: U(-2), legs: 2 }] },
    ],
  })),
  {
    cc: 'ned', lv: 1, from: 2017, to: N, kind: 'nacomp', src: 'NL2', simple: 'Periodensieger durch Tabellenplätze ersetzt.',
    brackets: [
      { m: [{ a: L(5), b: L(2), legs: 2 }, { a: W(0), b: U(-3), legs: 2 }] },
      { m: [{ a: L(4), b: L(3), legs: 2 }] },
    ],
  },
  // ---------------------------------------------------------------------------
  // Belgien [BE1]
  // ---------------------------------------------------------------------------
  { cc: 'bel', lv: 1, from: 1975, to: 2014, kind: 'final', brackets: [po4(2, 3, 4, 5, 2, false)], src: 'BE1', simple: 'Endrunde (Rundenturnier mit Periodensiegern) als K.-o.-Runde der Plätze 2–5.' },
  { cc: 'bel', lv: 1, from: 2015, to: N, kind: 'final', brackets: [{ m: [{ a: L(2), b: L(1), legs: 2 }] }], src: 'BE1', simple: 'Finale der Periodensieger als Duell Erster gegen Zweiter.' },
  // ---------------------------------------------------------------------------
  // Schweiz, Österreich, Portugal [CH1, AT1, PT1]
  // ---------------------------------------------------------------------------
  { cc: 'sui', lv: 1, from: 2003, to: 2011, kind: 'barrage', brackets: [duel(-2, 2, true)], src: 'CH1' },
  { cc: 'sui', lv: 1, from: 2019, to: N, kind: 'barrage', brackets: [duel(-2, 2, true)], src: 'CH1', simple: 'Auf-/Abstiegsrunde 1987–2003 nicht abgebildet (direkter Auf- und Abstieg).' },
  { cc: 'aut', lv: 1, from: 2026, to: N, kind: 'relegation', brackets: [duel(-1, 2, true)], src: 'AT1', simple: 'Angekündigte Relegation ab 2026/27; Paarung Letzter gegen Zweiten als Annahme.' },
  { cc: 'por', lv: 1, from: 2021, to: N, kind: 'playoff', brackets: [duel(-3, 3, true)], src: 'PT1' },
  // ---------------------------------------------------------------------------
  // Nordeuropa [SE1, NO1, FI1]
  // ---------------------------------------------------------------------------
  { cc: 'swe', lv: 1, from: 2000, to: N, kind: 'qual', brackets: [duel(-3, 3, true)], awayGoalsTo: 2100, src: 'SE1', simple: 'Kvalifikation vor 2000 nicht abgebildet.' },
  {
    cc: 'nor', lv: 1, from: 2009, to: N, kind: 'qual', src: 'NO1',
    brackets: [{ m: [{ a: L(3), b: L(6), legs: 1 }, { a: L(4), b: L(5), legs: 1 }, { a: W(0), b: W(1), legs: 1 }, { a: W(2), b: U(-3), legs: 2 }] }],
    simple: 'Kvalifikation vor 2009 nicht abgebildet; Heimrecht in den Einzelspielen beim Besserplatzierten.',
  },
  { cc: 'fin', lv: 1, from: 1995, to: N, kind: 'qual', brackets: [duel(-2, 2, true)], src: 'FI1', simple: 'Beginn des Formats als Annahme.' },
  // ---------------------------------------------------------------------------
  // Britische Inseln, Ost- und Südosteuropa [NI1, IE1, RU1, UA1, HR1, TR1]
  // ---------------------------------------------------------------------------
  { cc: 'nir', lv: 1, from: 2008, to: N, kind: 'playoff', brackets: [duel(-2, 2, true)], src: 'NI1' },
  { cc: 'irl', lv: 1, from: 2009, to: N, kind: 'playoff', brackets: [duel(-2, 2, true)], src: 'IE1', simple: 'Vorrunde der unteren Liga zusammengefasst zum Duell mit dem Zweiten.' },
  { cc: 'rus', lv: 1, from: 2011, to: N, kind: 'relegation', brackets: [duel(-4, 4, true), duel(-3, 3, true)], awayGoalsTo: 2020, src: 'RU1' },
  { cc: 'ukr', lv: 1, from: 2020, to: N, kind: 'relegation', brackets: [duel(-3, 3, true)], src: 'UA1', simple: 'Beginn und Paarung als Annahme.' },
  { cc: 'cro', lv: 1, from: 2009, to: 2021, kind: 'relegation', brackets: [duel(-2, 2, true)], awayGoalsTo: 2020, src: 'HR1', simple: 'Zeitraum als Annahme.' },
  {
    cc: 'tur', lv: 1, from: 2005, to: N, kind: 'playoff', src: 'TR1',
    brackets: [{ m: [{ a: L(3), b: L(6), legs: 1, neutral: true }, { a: L(4), b: L(5), legs: 1, neutral: true }, { a: W(0), b: W(1), legs: 1, neutral: true }] }],
    simple: 'Beginn als Annahme; alle Spiele auf neutralem Platz.',
  },
];

const byCc = new Map<string, RelFormat[]>();
for (const f of RELEGATION_FORMATS) {
  const list = byCc.get(f.cc) ?? [];
  list.push(f);
  byCc.set(f.cc, list);
}

/** Alle Formate eines Landes in der Saison `year` (Startjahr der gespielten Saison), nach Ebene. */
export function relegationFormats(cc: string, year: number): RelFormat[] {
  return (byCc.get(cc) ?? []).filter((f) => year >= f.from && year <= f.to).sort((a, b) => a.lv - b.lv);
}

/** Format eines Landes an einer Ebenen-Grenze (null = direkter Auf- und Abstieg). */
export function relegationFormat(cc: string, year: number, lv: number): RelFormat | null {
  return relegationFormats(cc, year).find((f) => f.lv === lv) ?? null;
}

/** Länder mit mindestens einem Format (Doku/Tests). */
export const relegationCountries = (): string[] => [...byCc.keys()];

// -----------------------------------------------------------------------------
// Anzeige
// -----------------------------------------------------------------------------
const KIND_DE: Record<RelKind, string> = {
  relegation: 'Relegation', barrage: 'Barrage', playoff: 'Play-offs', playout: 'Play-out', decider: 'Entscheidungsspiel',
  promocion: 'Promoción', nacomp: 'Nacompetitie', final: 'Endrunde', qual: 'Kvalifikation',
};
export const relKindName = (f: RelFormat): string => KIND_DE[f.kind];

const isEnt = (s: RelSlot): s is RelEnt => 's' in s;
/** Teilnehmer aller Klammern eines Formats (ohne Sieger-Verweise). */
export function bracketEntrants(b: RelBracket): RelEnt[] {
  const out: RelEnt[] = [];
  for (const m of b.m) for (const s of [m.a, m.b]) if (isEnt(s)) out.push(s);
  return out;
}

/** Platz (1-basiert) eines Teilnehmers in einer Liga mit `n` Vereinen. */
export const entPos = (e: RelEnt, n: number): number => (e.p > 0 ? e.p : n + 1 + e.p);

/**
 * Kurztext eines Formats, z. B. „16. gegen 3. der 2. Liga (Hin/Rück)“, „Play-offs der Plätze 3–6“,
 * „Play-out 17. gegen 18.“. `nUp` = Größe der oberen Liga, `lower` = Name der unteren Liga.
 */
export function relegationText(f: RelFormat, nUp: number, lower: string): string {
  if (f.brackets === 'champs') return `Aufstiegsspiele der Meister der ${lower} (Hin/Rück, gelost)`;
  const parts = f.brackets.map((b) => {
    const ents = bracketEntrants(b);
    const up = ents.filter((e) => e.s === 'u').map((e) => entPos(e, nUp)).sort((a, c) => a - c);
    const low = ents.filter((e) => e.s === 'l');
    const lowPos = [...new Set(low.map((e) => e.p))].sort((a, c) => a - c);
    const grp = low.some((e) => e.g != null) && new Set(low.map((e) => e.g)).size > 1;
    const lowTxt = !lowPos.length ? '' : lowPos.length === 1
      ? `${lowPos[0]}.${grp ? ' der Staffeln' : ''} der ${lower}`
      : `Plätze ${lowPos[0]}–${lowPos[lowPos.length - 1]} der ${lower}`;
    if (b.ifLevel) return up.length ? `bei Punktgleichheit ${up.join('./')}.` : `bei Punktgleichheit ${lowTxt}`;
    if (!low.length) return `${up.join('. gegen ')}.`;
    if (!up.length) return lowTxt;
    const legs = b.m[b.m.length - 1].legs === 2 ? ' (Hin/Rück)' : '';
    return b.m.length === 1 ? `${up[0]}. gegen ${lowTxt}${legs}` : `${up[0]}. gegen Sieger ${lowTxt}`;
  });
  return [...new Set(parts)].join(' · ');
}
