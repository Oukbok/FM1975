// =============================================================================
// Text-Audit: Prüfregeln (Grammatik, Platzhalter, Epochen, Inhalte) und Bericht.
// Genutzt von tests/text-audit.ts (npm run test:texts).
// =============================================================================

export type Src = 'ticker' | 'press' | 'msg' | 'brief';

export interface Ctx {
  year: number;
  /** Drei-Punkte-Regel gilt. */
  points3: boolean;
  /** Heimatland (ger = Deutschland, gdr = DDR, sonst Ländercode). */
  home: string;
  /** Ligaebene des eigenen Vereins (1 = höchste). */
  tier: number;
}

export interface Sample { src: Src; unit: string; field: string; text: string; ctx: Ctx }

export interface Finding { cat: string; src: Src; year: number; text: string; hit: string }

/** Harte Fehlerarten (müssen 0 sein, sonst schlägt STRICT fehl). */
export const HARD = new Set(['Genus', 'Platzhalter', 'undefined/NaN', 'leerer Slot', 'Mehrzahl', 'Artikel vor Vereinsname', 'doppeltes Wort',
  'Leerzeichen', 'Satzzeichen', 'Umlaut als ae/oe/ue', 'Epoche', 'Inhalt', 'Währung']);

// --------------------------------------------------------------- Epochen
interface EraRule { re: RegExp; from?: number; to?: number; only?: Src[]; skip?: Src[]; label: string }

export const ERA_RULES: EraRule[] = [
  { re: /soziale[n]? Netzwerk|Social Media|Twitter|Instagram|Facebook|Influencer|Hashtag|Shitstorm/i, from: 2007, label: 'soziale Netzwerke' },
  { re: /\bInternet|\bonline\b|\bIm Netz (diskut|wird|kursier)|Webseite|Homepage|Website|Online-|\bE-Mail/i, from: 1996, skip: ['brief'], label: 'Internet' },
  { re: /\bHandy|\bSMS\b/, from: 1993, label: 'Handy/SMS' },
  { re: /Smartphone|\bApps?\b|Streaming|Livestream|Podcast/, from: 2009, label: 'Smartphone/App' },
  { re: /Videobeweis|Video-Assistent|Videoschiedsrichter|\bVAR\b|Kölner Keller|Videoraum|kalibrierte Linie|Ansicht der Bilder/i, from: 2016, skip: ['brief'], label: 'Videobeweis' },
  { re: /Torlinientechnik/, from: 2015, skip: ['brief'], label: 'Torlinientechnik' },
  { re: /Freistoßspray/, from: 2014, skip: ['brief'], label: 'Freistoßspray' },
  { re: /Champions League|Königsklasse/, from: 1992, skip: ['brief'], label: 'Champions League' },
  { re: /Europa League/, from: 2009, skip: ['brief'], label: 'Europa League' },
  { re: /Conference League/, from: 2021, skip: ['brief'], label: 'Conference League' },
  { re: /UEFA-Cup|UEFA-Pokal/, to: 2009, skip: ['brief'], label: 'UEFA-Cup' },
  { re: /\bLibero/, to: 2001, skip: ['brief'], label: 'Libero' },
  { re: /Manndeck/, to: 2005, skip: ['brief'], label: 'Manndeckung' },
  { re: /Viererkette/, from: 1990, skip: ['brief'], label: 'Viererkette' },
  { re: /Gegenpressing|Umschaltmoment|Umschaltspiel/, from: 2005, skip: ['brief'], label: 'Gegenpressing' },
  { re: /Halbr[aä]um|zwischen den Linien|falsche Neun|Restverteidigung|Doppelsechs|Box-to-Box/, from: 2008, skip: ['brief'], label: 'moderne Taktik' },
  { re: /\bpress(t|en|ing)\b|Pressing/, from: 1987, skip: ['brief'], label: 'Pressing' },
  { re: /Expected Goals|\bxG\b|Torwahrscheinlichkeit|Datenanalyst/, from: 2012, skip: ['brief'], label: 'Datenanalyse' },
  { re: /Rückpassregel/, from: 1992, skip: ['brief'], label: 'Rückpassregel' },
  { re: /Golden Goal/, from: 1996, to: 2004, skip: ['brief'], label: 'Golden Goal' },
  { re: /Bosman/, from: 1995, skip: ['brief'], label: 'Bosman' },
  { re: /Gelb-Rot|Ampelkarte/, from: 1991, skip: ['brief'], label: 'Gelb-Rot' },
  { re: /Ultras|Choreo/, from: 1995, skip: ['brief'], label: 'Ultras' },
  { re: /Fanmeile|Public Viewing/, from: 2006, skip: ['brief'], label: 'Public Viewing' },
  { re: /\bPhysio\b/, from: 1990, only: ['ticker'], label: 'Physio' },
  { re: /Trinkpause/, from: 2010, only: ['ticker'], label: 'Trinkpause' },
  { re: /Werbebanden blinken|LED/, from: 2005, only: ['ticker'], label: 'LED-Banden' },
  { re: /One-Touch/, from: 2000, label: 'One-Touch' },
  { re: /\bSechser\b/, from: 1995, label: 'Sechser' },
  { re: /Laptop|Notebook/, from: 1990, label: 'Laptop' },
  { re: /Tablet|iPad/, from: 2010, label: 'Tablet' },
  { re: /\bDVD/, from: 1998, label: 'DVD' },
  { re: /Pay-TV|Bezahlfernsehen/, from: 1991, skip: ['brief'], label: 'Pay-TV' },
  { re: /Klub-WM|Klub-Weltmeisterschaft/, from: 2000, skip: ['brief'], label: 'Klub-WM' },
  { re: /Ligaphase/, from: 2024, skip: ['brief'], label: 'Ligaphase' },
  { re: /Wiedervereinigung|Mauerfall/, from: 1989, skip: ['brief'], label: 'Wiedervereinigung' },
];

// --------------------------------------------------------------- Mehrzahl
const PLURAL_ONE = /\b(1|eins?|eine[mnr]?) (?:(?:weitere|neue|letzte|volle|ganze)[nr]? )?(Tore|Toren|Spiele|Spielen|Punkte|Punkten|Tage|Tagen|Wochen|Monate|Monaten|Jahre|Jahren|Siege|Siegen|Niederlagen|Einsätze|Einsätzen|Partien|Saisons|Minuten|Stunden|Karten|Gegentore|Gegentoren|Vorlagen|Spieltage|Spieltagen|Saisontore|Saisontoren|Treffern|Zählern|Verträge|Aufwertungen|Abwertungen|Angebote|Spieler(?:n)|Vereine|Vereinen|Mannschaften|Länderspiele|Plätze|Ränge|Runden|Titel(?:n)|Torschüsse|Änderungen|Wechsel(?:n)|Länderspielen)\b/;
const PLURAL_MANY = /\b([02-9]|\d{2,}) (Tor|Spiel|Punkt|Tag|Sieg|Einsatz|Woche|Monat|Partie|Niederlage|Minute|Saisontor|Gegentor|Vorlage|Spieltag|Vertrag|Aufwertung|Abwertung|Angebot|Verein|Mannschaft|Länderspiel|Platz|Runde)\b(?![-.])/;

// --------------------------------------------------------------- Umlaute
const UMLAUT_OK = new Set(['duell', 'duelle', 'duellen', 'duells', 'michael', 'raphael', 'rafael', 'israel', 'manuel', 'samuel', 'emanuel',
  'joel', 'noel', 'poet', 'aero', 'suez', 'zuerst', 'quer']);

/** Wortgrenzen inkl. Umlaute. */
const W = '\\p{L}';

export interface Checker {
  findings: Finding[];
  /** Eigennamen (Spieler, Trainer, Vereine) – Wörter, die nicht geprüft/normalisiert werden. */
  names: Set<string>;
  /** Vereinsnamen, die mit der Stadt beginnen (ohne Artikel zu benutzen). */
  clubRe: RegExp | null;
}

export function makeChecker(): Checker { return { findings: [], names: new Set(), clubRe: null }; }

export function addNames(ch: Checker, names: Iterable<string>): void {
  for (const n of names) for (const t of String(n).split(/[\s\-()]+/)) if (t.length > 1) ch.names.add(t);
}

/** Vereinsnamen nach Art „Frankfurt Rot“/„Bremen“ (Stadt am Anfang) – davor kein Artikel. */
export function setClubs(ch: Checker, clubs: { name: string; city?: string }[]): void {
  const set = new Set<string>();
  for (const c of clubs) {
    if (!c?.name || !c.city) continue;
    const first = c.name.split(' ')[0];
    if (first !== c.city.split(' ')[0]) continue;
    set.add(c.name);
  }
  const esc = (xs: string[]) => xs.sort((a, b) => b.length - a.length).map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const multi = [...set].filter((n) => n.includes(' ')), single = [...set].filter((n) => !n.includes(' '));
  const alts = [
    multi.length ? `(?:der|des|dem|den|die|das|beim|vom|zum|zur|im|ins|Der|Des|Dem|Den|Die|Das|Beim|Vom|Zum|Im) (?:${esc(multi)})` : '',
    single.length ? `(?:des|dem|beim|vom|zum|im|Des|Dem|Beim|Vom|Zum|Im) (?:${esc(single)})` : '',
  ].filter(Boolean);
  ch.clubRe = alts.length ? new RegExp(`(?<![${W}])(?:${alts.join('|')})(?![${W}\\-])`, 'u') : null;
}

function add(ch: Checker, s: Sample, cat: string, hit: string) {
  ch.findings.push({ cat, src: s.src, year: s.ctx.year, text: s.text.length > 220 ? s.text.slice(0, 220) + ' …' : s.text, hit });
}

/** Ein Text, zeilenweise geprüft (Nachrichten haben Zeilenumbrüche). */
export function checkSample(ch: Checker, s: Sample): void {
  for (const line of s.text.split('\n')) checkLine(ch, s, line);
}

function checkLine(ch: Checker, s: Sample, t: string): void {
  if (!t.trim()) return;
  const y = s.ctx.year;
  let m: RegExpExecArray | null;
  if ((m = /#[a-zA-Z_]+#|\{[a-zA-Z_0-9]*\}|\[[^\]]*\|[^\]]*\]|\$\{/.exec(t))) add(ch, s, 'Platzhalter', m[0]);
  if ((m = /\bundefined\b|\bNaN\b|(?<!zu )\bnull\b|\[object Object\]|\bInfinity\b/.exec(t))) add(ch, s, 'undefined/NaN', m[0]);
  if ((m = PLURAL_ONE.exec(t)) || (m = PLURAL_MANY.exec(t))) add(ch, s, 'Mehrzahl', m[0]);
  if ((m = /\b(ein|kein) (Niederlage|Punkteteilung|Pleite|Nullnummer)\b|\b(eine|keine) (Sieg|Remis|Unentschieden|Tor|Punkt|Spiel|Erfolg)\b|\beinen (Niederlage|Remis|Unentschieden)\b/.exec(t))) add(ch, s, 'Genus', m[0]);
  if (ch.clubRe && (m = ch.clubRe.exec(t))) add(ch, s, 'Artikel vor Vereinsname', m[0]);
  const dw = new RegExp(`(?<![${W}])([${W}]{2,}) \\1(?![${W}])`, 'iu');
  if ((m = dw.exec(t)) && !/^\d/.test(m[1]) && m[0] !== 'Da Da') add(ch, s, 'doppeltes Wort', m[0]);
  if ((m = /\S {2,}\S/.exec(t)) && !/^[+−-]\d+ {2}/.test(t)) add(ch, s, 'Leerzeichen', JSON.stringify(m[0]));
  if ((m = new RegExp(`[${W}]{2}[,;][${W}]|[a-zäöüß]{3}[.!?][A-ZÄÖÜ][a-zäöü]`, 'u').exec(t))) add(ch, s, 'Leerzeichen', m[0]);
  if ((m = /(?<![\d%]) [,.!?;:](?=\s|$)/.exec(t))) add(ch, s, 'Leerzeichen', JSON.stringify(m[0]));
  if ((m = /[,;:]{2}|(?<!\.)\.\.(?!\.)|[!?]\.|(?<![A-Z][a-z]{0,3}|\d|\b(bzw|usw|ca|inkl|evtl|vgl|Mio|Tsd|Mrd|Std|Nr|Abs|Jh))\.,|,\.|\(\s*\)|\( | \)/.exec(t))) add(ch, s, 'Satzzeichen', m[0]);
  if (s.src !== 'brief' && (m = /\b(von|für|gegen|mit|bei|nach) [.,!?:;–]/.exec(t))) add(ch, s, 'leerer Slot', m[0]);
  for (const w of t.match(new RegExp(`[${W}]+`, 'gu')) ?? []) {
    if (!/(?:^(Ae|Oe|Ue)|[bcdfghjklmnprstvwxz](ae|oe|ue))/.test(w)) continue;
    if (UMLAUT_OK.has(w.toLowerCase()) || ch.names.has(w) || /uell|^(aero|poet)|League|[^\x00-\x7FÄÖÜäöüß]/i.test(w)) continue;
    add(ch, s, 'Umlaut als ae/oe/ue', w); break;
  }
  // Epochen
  for (const r of ERA_RULES) {
    if (r.only && !r.only.includes(s.src)) continue;
    if (r.skip?.includes(s.src) || s.src === 'brief' || /^Saison-Briefing|^Was ist neu|^Vorschau: Das ändert sich/.test(s.text)) continue;
    if ((r.from != null && y < r.from) || (r.to != null && y > r.to)) { const mm = r.re.exec(t); if (mm) add(ch, s, 'Epoche', `${r.label}: „${mm[0]}“`); }
  }
  if (!s.ctx.points3 && s.src !== 'brief' && (m = /\bDreier\b|mehr als drei Punkte|um drei Punkte|Drei-Punkte/.exec(t))) add(ch, s, 'Epoche', `Drei-Punkte-Regel: „${m[0]}“`);
  // Währung
  if (s.src !== 'brief') {
    if (s.ctx.home === 'ger') {
      if (y < 2002 && (m = /€|\bEuro\b|\bEUR\b/.exec(t))) add(ch, s, 'Währung', m[0]);
      if (y > 2001 && (m = /\d\s*(Mio\.|Tsd\.|Mrd\.)?\s*DM\b|D-Mark/.exec(t))) add(ch, s, 'Währung', m[0]);
    } else if ((m = /\d\s*(Mio\.|Tsd\.|Mrd\.)?\s*DM\b|D-Mark/.exec(t))) add(ch, s, 'Währung', `${s.ctx.home}: ${m[0]}`);
  }
  // DDR nach der Wiedervereinigung (nur als Rückblick)
  if (y >= 1992 && s.src !== 'brief' && /\bDDR\b/.test(t) && !/ehemalig|früher|einstig|Wende|Wiedervereinigung|alte[nr]? |damals|Geschichte|bis 1991/.test(t)) add(ch, s, 'Epoche', 'DDR nach 1991');
  // Inhalt: Abstieg in die zweite Liga, wenn man schon darunter spielt
  if (s.ctx.tier >= 2 && (m = /Richtung zweite Liga|in die zweite Liga|in die 2\. Liga|Jagd auf die Schale|Meisterschale/.exec(t))) add(ch, s, 'Inhalt', `Ebene ${s.ctx.tier}: „${m[0]}“`);
  if (s.ctx.tier === 1 && s.src !== 'brief' && (m = /Aufstieg in die (1\.|erste) Liga|Aufstiegsrennen|Wer schafft den Aufstieg|Anwärter auf den Aufstieg/.exec(t))) add(ch, s, 'Inhalt', `Ebene 1: „${m[0]}“`);
  // Zeilenende im Ticker/Artikeltext
  if ((s.src === 'ticker' || (s.src === 'press' && s.field === 'body')) && !/[.!?…“")»:]$/.test(t.trim()) && !/→|^[+−•-]|^\d+\. /.test(t)) add(ch, s, 'Satzende fehlt', t.slice(-30));
  if (/^[a-zäöü]/.test(t) && (s.field === 'headline' || s.field === 'subject' || s.src === 'ticker')) add(ch, s, 'Kleinschreibung am Anfang', t.slice(0, 30));
}

// --------------------------------------------------------------- Wiederholung
/** Text ohne Eigennamen/Zahlen – gleiche Bausteine erkennen. */
export function normalize(ch: Checker, t: string): string {
  return t.replace(new RegExp(`[${W}]+`, 'gu'), (w) => (ch.names.has(w) ? '§' : w)).replace(/\d+/g, '0').replace(/(§[ .]*)+/g, '§ ').trim();
}

export interface RepStat { units: number; items: number; dupExact: number; dupPattern: number; top: Map<string, number> }
export const newRep = (): RepStat => ({ units: 0, items: 0, dupExact: 0, dupPattern: 0, top: new Map() });

/** Wiederholungen innerhalb einer Einheit (ein Spiel, eine Ausgabe …). */
export function repUnit(ch: Checker, r: RepStat, items: string[]): void {
  r.units++;
  const exact = new Set<string>(), pat = new Set<string>();
  for (const it of items) {
    if (it.length < 14) continue;
    r.items++;
    const n = normalize(ch, it);
    if (exact.has(it)) r.dupExact++;
    if (pat.has(n)) { r.dupPattern++; r.top.set(n, (r.top.get(n) ?? 0) + 1); }
    exact.add(it); pat.add(n);
  }
}

export const pct = (a: number, b: number) => (b ? ((100 * a) / b).toFixed(2) : '0.00');

/** Bericht auf der Konsole + Zahlen für die JSON-Ausgabe. */
export function report(ch: Checker, reps: Record<string, RepStat>, totals: Record<string, number>, examples = 4) {
  const byCat = new Map<string, Finding[]>();
  for (const f of ch.findings) { const l = byCat.get(f.cat) ?? []; l.push(f); byCat.set(f.cat, l); }
  const out: Record<string, unknown> = { totals, cats: {}, reps: {} };
  console.log('\n=== Texte geprüft:', Object.entries(totals).map(([k, v]) => `${k} ${v}`).join(', '));
  console.log('\n=== Fehler je Art');
  for (const [cat, list] of [...byCat].sort((a, b) => b[1].length - a[1].length)) {
    const bySrc: Record<string, number> = {};
    for (const f of list) bySrc[f.src] = (bySrc[f.src] ?? 0) + 1;
    const uniq = new Map<string, Finding>();
    for (const f of list) if (!uniq.has(f.hit + f.text.slice(0, 40))) uniq.set(f.hit + f.text.slice(0, 40), f);
    (out.cats as Record<string, unknown>)[cat] = { n: list.length, bySrc };
    console.log(`\n${HARD.has(cat) ? '[!]' : '[ ]'} ${cat}: ${list.length} (${Object.entries(bySrc).map(([k, v]) => `${k} ${v}`).join(', ')})`);
    const hits = new Map<string, number>();
    for (const f of list) hits.set(f.hit, (hits.get(f.hit) ?? 0) + 1);
    console.log('    Treffer: ' + [...hits].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([h, n]) => `${h} ×${n}`).join(' | '));
    const showAll = process.env.CAT && cat.includes(process.env.CAT);
    for (const f of [...uniq.values()].slice(0, showAll ? 400 : examples)) console.log(`    ${f.src} ${f.year}: ${f.hit} ⟶ ${f.text.replace(/\n/g, ' ⏎ ')}`);
  }
  console.log('\n=== Wiederholungen (innerhalb einer Einheit)');
  for (const [k, r] of Object.entries(reps)) {
    (out.reps as Record<string, unknown>)[k] = { units: r.units, items: r.items, exact: +pct(r.dupExact, r.items), pattern: +pct(r.dupPattern, r.items) };
    console.log(`${k}: ${r.units} Einheiten, ${r.items} Sätze, wörtlich wiederholt ${pct(r.dupExact, r.items)} %, gleiches Muster ${pct(r.dupPattern, r.items)} %`);
    console.log('    häufigste: ' + [...r.top].sort((a, b) => b[1] - a[1]).slice(0, Number(process.env.TOP ?? 8)).map(([t, n]) => `„${t.slice(0, 70)}“ ×${n}`).join(' | '));
  }
  return { out, hard: ch.findings.filter((f) => HARD.has(f.cat)).length };
}
