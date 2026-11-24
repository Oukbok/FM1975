// =============================================================================
// NEUTRALE VERBANDS- UND WETTBEWERBSNAMEN (Wunsch Pascal: „Verbände und Wettbewerbe müssen
// neutral heißen“). Angezeigte Texte nennen nie die echten Namen (FIFA, UEFA, DFB, DFL,
// Bundesliga, Champions League …), sondern das Schema des Spiels – Tabelle in CLAUDE.md:
//   Weltverband · Europaverband · Fußballbund · Ligaverband · Regelgremium ·
//   Pokal der Landesmeister → Meisterliga · Pokal der Pokalsieger → Europa-Trophäe ·
//   Messepokal → Europa-Pokal → Kontinental-Liga · Landespokal · 1. Liga/2. Liga ·
//   Transatlantik-Pokal · Klub-Weltturnier · Kontinentalsieger-Pokal · Gipfelpokal · Auftaktpokal ·
//   Hallenfinale · Goldener Stern · Torjägerstern (Stufe 2, `game.namesV` 2: sprachliche Glättung
//   „Erstligist“ → „Klub der 1. Liga“ – `RULES_V2` mit den Fällen im Satz; Stufe 3, `game.namesV` 3:
//   frühere Namen „Europa-Liga“/„Konferenz-Liga“ – direkte Übersetzungen der geschützten Marken –
//   → „Kontinental-Liga“/„Europa-Trophäe“, `RULES_V3`; „Europa-Pokal“ bleibt als Gattungsbegriff).
// `neutralText` setzt die Regeln auf einen fertigen Text um (Spielstände: game/neutralNamesMigration.ts);
// neue Texte schreiben die neutralen Namen gleich selbst. Kein neuer Name enthält einen alten
// (idempotent). Interne Schlüssel ('UEFA' als Kontinent, 'uefa' als Wettbewerb) bleiben.
// Prüfung: npm run test:names (Gruppe „Verband/Wettbewerb“ in tests/realPeopleList.ts).
// =============================================================================

type Rule = [RegExp, string];

/** Weiblich (die FIFA) → männlich (der Weltverband): Artikel und Präpositionen mitziehen. */
function feminineOrg(abbr: string, noun: string): Rule[] {
  const a = `(?<![\\p{L}\\p{N}-])${abbr}(?![\\p{L}\\p{N}])`;
  const r = (s: string) => new RegExp(s, 'gu');
  return [
    [r(`\\b([Vv])on der ${a}`), `$1om ${noun}`],
    [r(`\\b([Bb])ei der ${a}`), `$1eim ${noun}`],
    [r(`\\b([Zz])ur ${a}`), `$1um ${noun}`],
    [r(`\\b([Ii])n der ${a}`), `$1m ${noun}`],
    [r(`\\b(mit|nach|aus|unter|vor|seit|gegenüber|neben|Mit|Nach|Aus|Unter|Vor|Seit) der ${a}`), `$1 dem ${noun}`],
    [r(`\\b(für|durch|gegen|ohne|um|an|Für|Durch|Gegen|Ohne|An) die ${a}`), `$1 den ${noun}`],
    [r(`\\bDie ${a}`), `Der ${noun}`],
    [r(`\\bdie ${a}`), `der ${noun}`],
    [r(`\\bder ${a}`), `des ${noun}s`],
    [r(a), noun],
  ];
}

const RULES: Rule[] = [
  // --- Europapokale ---------------------------------------------------------------------------
  [/Europapokals der (Landesmeister|Pokalsieger)/g, 'Pokals der $1'],
  [/Europapokal der (Landesmeister|Pokalsieger)/g, 'Pokal der $1'],
  [/(?:UEFA[- ])?Youth[- ]League/g, 'Jugend-Meisterliga'],
  [/(?:UEFA[- ])?Nations[- ]League/g, 'Nationenliga'],
  [/\bUEFA[- ](?:Pokal|Cup)/g, 'Europa-Pokal'],
  [/(?:UEFA[- ])?Champions[- ]League/g, 'Meisterliga'],
  [/(?:UEFA[- ])?Europa[- ]League/g, 'Kontinental-Liga'],
  [/(?:UEFA[- ])?(?:Europa[- ])?Conference[- ]League/g, 'Europa-Trophäe'],
  [/\b(?:UEFA[- ])?Intertoto(?:[- ]Cup)?\b|\bUI-Cup\b/g, 'Sommerpokal'],
  [/Messestädte-Pokal/g, 'Messepokal'],
  [/\bCopa Libertadores\b/g, 'Südamerika-Pokal der Landesmeister'],
  [/Ballon d['’]Or/g, 'Goldener Ball'],
  // --- Ligen ----------------------------------------------------------------------------------
  [/Frauen-Bundesliga/g, 'Frauen-Liga'],
  [/\b([AB])-Junioren-Bundesliga/g, '$1-Junioren-Liga'],
  [/\b2\. Bundesliga/g, '2. Liga'],
  [/Bundesligist/g, 'Erstligist'],
  [/Bundesligaspiel/g, 'Erstligaspiel'],
  [/Bundesliga-(Rechte|Konferenz|Ergebnisse|Bilder|Spieltag)/g, 'Liga-$1'],
  [/Bundesliga-/g, 'Erstliga-'],
  [/\bBundesligen\b/g, 'Profiligen'],
  [/\bBundesliga\b/g, '1. Liga'],
  [/\b(englische|englischen) Premier League\b/g, '$1 1. Liga'],
  [/\bPremier League\b/g, '1. Liga Englands'],
  [/\b(italienische|italienischen) Serie A\b/g, '$1 1. Liga'],
  [/\bSerie A\b/g, '1. Liga Italiens'],
  [/\b(spanische|spanischen) (?:LaLiga|La Liga|Primera División)/g, '$1 1. Liga'],
  [/\bLaLiga\b|\bLa Liga\b/g, '1. Liga Spaniens'],
  [/\b(französische|französischen) Ligue 1\b/g, '$1 1. Liga'],
  [/\bLigue 1\b/g, '1. Liga Frankreichs'],
  [/\b(niederländische|niederländischen) Eredivisie\b/g, '$1 1. Liga'],
  [/\bEredivisie\b/g, '1. Liga der Niederlande'],
  [/NOFV-Oberliga/g, 'Oberliga Nordost'],
  [/NOFV-Liga/g, 'Liga Nordost'],
  // --- Verbände: Wortverbindungen ---------------------------------------------------------------
  [/DFB-Jugend-Kicker-Pokal/g, 'Junioren-Pokal'],
  [/\bUEFA-Super(?:cup|-Cup| Cup)/g, 'Europäischer Gipfelpokal'],
  [/\bD[FB][BLV]-Super(?:cup|-Cup| Cup)/g, 'Gipfelpokal'],
  [/\bD[FB][BL]-(Hallenpokal|Ligapokal|Junioren-Pokal|Junioren-Vereinspokal|Nachwuchsliga|Kinderfußball-Reform|Talentförderprogramm)/g, '$1'],
  [/\bDFB-Pokal/g, 'Landespokal'],
  [/\bDFB-Qualifikation/g, 'Verbandsqualifikation'],
  [/\bDFB-Spielausschuss/g, 'Spielausschuss des Fußballbunds'],
  [/\bDFB-Spielordnung/g, 'Spielordnung des Fußballbunds'],
  [/\bDFB-Präsident/g, 'Präsident des Fußballbunds'],
  [/\bDFB-Lizenzierung/g, 'Lizenzierung'],
  [/\bDFB-Geldstrafe/g, 'Verbandsstrafe'],
  [/\bDFB-Campus/g, 'Verbandscampus'],
  [/\bDFB-Titel/g, 'Verbandstitel'],
  [/\bDFB-Datencenter/g, 'Verbandsstatistik'],
  [/\bDFB-Frauen/g, 'Nationalspielerinnen'],
  [/\bDFB-Elf/g, 'Nationalelf'],
  [/\bDFB-/g, 'Verbands-'],
  [/\bDFL-Mitgliederversammlung/g, 'Mitgliederversammlung des Ligaverbands'],
  [/\bDFL-/g, 'Ligaverbands-'],
  [/\bUEFA-Fünfjahreswertung/g, 'Fünfjahreswertung'],
  [/\bUEFA-Pro-Lizenz/g, 'Pro-Lizenz'],
  [/\bUEFA-Beschluss/g, 'Beschluss des Europaverbands'],
  [/\bUEFA-Liste/g, 'Liste des Europaverbands'],
  [/\bUEFA-Gästekontingent/g, 'Gästekontingent im Europapokal'],
  [/\bUEFA-/g, 'Europapokal-'],
  [/\bFIFA-WM\b/g, 'WM'],
  [/\bFIFA-Weltrangliste/g, 'Weltrangliste'],
  [/\bFIFA-Präsident/g, 'Präsident des Weltverbands'],
  [/\bFIFA-Regel(n?)\b/g, 'Regel$1 des Weltverbands'],
  [/\bFIFA-/g, 'Weltverbands-'],
  [/Europäischen Verband(e?s)\b/g, 'Europaverbands'],
  [/Europäischen Verband\b/g, 'Europaverband'],
  [/Europäischer Verband\b/g, 'Europaverband'],
  // --- Verbände: Artikel/Fälle ------------------------------------------------------------------
  ...feminineOrg('UEFA', 'Europaverband'),
  ...feminineOrg('FIFA', 'Weltverband'),
  ...feminineOrg('DFL', 'Ligaverband'),
  ...feminineOrg('CONMEBOL', 'Südamerikaverband'),
  ...feminineOrg('CONCACAF', 'Nord- und Mittelamerikaverband'),
  ...feminineOrg('CAF', 'Afrikaverband'),
  ...feminineOrg('AFC', 'Asienverband'),
  ...feminineOrg('OFC', 'Ozeanienverband'),
  [/\bdes DFB\b/g, 'des Fußballbunds'],
  [/\bDFB\b/g, 'Fußballbund'],
  [/\bdes IFAB\b/g, 'des Regelgremiums'],
  [/\bIFAB\b/g, 'Regelgremium'],
  [/\bNOFV\b/g, 'Nordost-Verband'],
];

/** Klub-WM (die) → Klub-Weltturnier (das): Artikel, Präpositionen und Adjektivendung mitziehen. */
const KWM = '(?:Klub|Club)-(?:WM|Weltmeisterschaft)';
const ADJ = '((?:\\p{L}+e[nr]? )?)';
const kw = (s: string) => new RegExp(s, 'gu');
const KLUB_WM: Rule[] = [
  [kw(`\\b([Ii])n der ${ADJ}${KWM}`), '$1m $2Klub-Weltturnier'],
  [kw(`\\b([Bb])ei der ${ADJ}${KWM}`), '$1eim $2Klub-Weltturnier'],
  [kw(`\\b([Zz])ur ${ADJ}${KWM}`), '$1um $2Klub-Weltturnier'],
  [kw(`\\b([Vv])on der ${ADJ}${KWM}`), '$1om $2Klub-Weltturnier'],
  [kw(`\\b([Aa])n der ${ADJ}${KWM}`), '$1m $2Klub-Weltturnier'],
  [kw(`\\b(mit|nach|aus|seit|vor|auf|unter|nach|Mit|Nach|Aus|Seit|Vor|Auf|Unter) der ${ADJ}${KWM}`), '$1 dem $2Klub-Weltturnier'],
  [kw(`\\b([Dd])ie ${ADJ}${KWM}`), '$1as $2Klub-Weltturnier'],
  [kw(`\\b([Ee]in|[Kk]ein)e (\\p{L}+)e ${KWM}`), '$1 $2es Klub-Weltturnier'],
  [kw(`\\b([Ee]in|[Kk]ein)e ${KWM}`), '$1 Klub-Weltturnier'],
  [kw(`\\b([Ee]in|[Kk]ein)er ${ADJ}${KWM}`), '$1em $2Klub-Weltturnier'],
  [kw(`\\bder ${ADJ}${KWM}`), 'des $1Klub-Weltturniers'],
  [kw(`${KWM}s\\b`), 'Klub-Weltturniere'],
  [kw(`(?:Klub|Club)-Weltmeister(?!schaft)`), 'Sieger des Klub-Weltturniers'],
  [kw(KWM), 'Klub-Weltturnier'],
];

/** „Erstligist“ klingt holprig (Wunsch Pascal) → „Klub der 1. Liga“, Fall nach dem Begleiter. */
const SG_DAT_ACC = 'den|dem|einen|einem|diesen|diesem|jenen|jenem|keinen|keinem|jeden|jedem|seinen|seinem|ihren|ihrem|unseren|unserem|euren|eurem';
const SG_GEN = 'des|eines|dieses|jenes|keines|jedes|seines|ihres|unseres|eures';
const DAT_PL = 'mit|von|bei|zu|aus|nach|unter|vor|neben|zwischen|seit|gegenüber|Mit|Von|Bei|Zu|Aus|Nach|Unter|Vor|Neben|Zwischen|Seit';
const ERSTLIGIST: Rule[] = [
  [kw(`\\b(${DAT_PL}) den ((?:\\p{L}+en )*)(?:Erstligisten|Bundesligisten)\\b`), '$1 den $2Klubs der 1. Liga'],
  [kw(`\\b(${SG_GEN}|Des|Eines|Dieses|Jedes) ((?:\\p{L}+en )*)(?:Erstligisten|Bundesligisten)\\b`), '$1 $2Klubs der 1. Liga'],
  [kw(`\\b(${SG_DAT_ACC}|Den|Dem|Einen|Einem|Diesen|Diesem|Jeden|Jedem) ((?:\\p{L}+en )*)(?:Erstligisten|Bundesligisten)\\b`), '$1 $2Klub der 1. Liga'],
  [kw(`(?:Erstligisten|Bundesligisten)\\b`), 'Klubs der 1. Liga'],
  [kw(`(?:Erst|Bundes)ligist\\b`), 'Klub der 1. Liga'],
];

/** Stufe 2 (Wunsch Pascal: „Ja, bitte alles neutral umbenennen“): Weltpokal, Klub-WM, Supercup,
 *  Ligapokal, Hallen-Masters, Goldener Ball/Schuh, Interkontinentalpokal, Confed-Cup,
 *  Sommermärchen (Filmtitel), Wembley (Marke als Ortsname). Kein neuer Name enthält einen alten. */
const RULES_V2: Rule[] = [
  // --- Welt -----------------------------------------------------------------------------------
  [/Weltpokal/g, 'Transatlantik-Pokal'],
  [/Interkontinental-?[Pp]okal/g, 'Kontinentalsieger-Pokal'],
  [/Intercontinental Cup/g, 'Kontinentalsieger-Pokal'],
  ...KLUB_WM,
  [/Konföderationen-Pokal|Confed(?:erations)?-?Cup/g, 'Turnier der Kontinentalmeister'],
  // --- Supercups und Ligapokal ------------------------------------------------------------------
  [/\b(?:UEFA|Europa)-Super(?:cup|-Cup| Cup)/g, 'Europäischer Gipfelpokal'],
  [/\bDFV-Super(?:cup|-Cup| Cup)/g, 'Gipfelpokal'],
  [kw(`\\b(${SG_GEN}) ((?:\\p{L}+en )?)Super(?:cup|-Cup| Cup)s\\b`), '$1 $2Gipfelpokals'],
  [kw(`\\b(${DAT_PL}) den ((?:\\p{L}+en )?)Super(?:cup|-Cup| Cup)s\\b`), '$1 den $2Gipfelpokalen'],
  [/Super(?:cup|-Cup| Cup)s\b/g, 'Gipfelpokale'],
  [/Super(?:cup|-Cup| Cup)/g, 'Gipfelpokal'],
  [/Ligapokal/g, 'Auftaktpokal'],
  // --- Halle ----------------------------------------------------------------------------------
  [/Hallen-?[Mm]asters/g, 'Hallenfinale'],
  [/Masters-Sieg/g, 'Hallenfinal-Sieg'],
  [/Masters-Endrunde/g, 'Hallenfinale'],
  [/(?<![\p{L}\p{N}_])Masters-(?=\p{L})/gu, 'Hallenfinal-'],
  [/\b(des|eines) Masters(?![\p{L}\p{N}_])/gu, '$1 Hallenfinales'],
  // Alleinstehend nur nach Begleiter/Präposition: „Masters“ ist auch ein englischer Familienname (Spielernamen bleiben).
  [/\b(das|Das|dem|zum|beim|im|ins|vom|am|fürs|kein|keinem|ein|einem|inkl\.|ohne|der|seit) Masters(?![\p{L}\p{N}_])/gu, '$1 Hallenfinale'],
  // --- Preise ---------------------------------------------------------------------------------
  [/(Goldene[nmr]?) Ball(?:e?s)\b/g, '$1 Sterns'],
  [/(Goldene[nmr]?) Ball\b/g, '$1 Stern'],
  [/Goldene[nmr]? Schuh(?:e?s)\b/g, 'Torjägersterns'],
  [/Goldene[nmr]? Schuh\b/g, 'Torjägerstern'],
  // --- Orte/Titel als Marke -------------------------------------------------------------------
  [/\bDas Sommermärchen\b/g, 'Der WM-Sommer'],
  [/\bdas Sommermärchen\b/g, 'der WM-Sommer'],
  [/Sommermärchens\b/g, 'WM-Sommers'],
  [/Sommermärchen/g, 'WM-Sommer'],
  [/Wembley[- ]Arena/g, 'Arena im Londoner Nordwesten'],
  [/Wembley-?[Ss]tadion/g, 'Londoner Nationalstadion'],
  [/Wembley-Tor/g, 'Tor von London'],
  [/\bWembley\b/g, 'London'],
  // --- Sprache --------------------------------------------------------------------------------
  ...ERSTLIGIST,
];

/** Stufe 3 (Wunsch Pascal: neue Namen, wo rechtliches Risiko besteht): die früheren neutralen Namen
 *  „Europa-Liga“ und „Konferenz-Liga“ übersetzen die Marken „Europa League“/„Conference League“ direkt.
 *  Alle drei Namen sind weiblich – Artikel und Fälle bleiben. Kein neuer Name enthält einen alten. */
const RULES_V3: Rule[] = [
  [/Europa[- ]Liga/g, 'Kontinental-Liga'],
  [/Konferenz[- ]Liga/g, 'Europa-Trophäe'],
];

/** Schneller Vorfilter: nur Texte mit einem der alten Namen laufen durch alle Regeln. */
const ANY = /UEFA|FIFA|DFB|DFL|IFAB|NOFV|CONMEBOL|CONCACAF|\bCAF\b|\bAFC\b|\bOFC\b|Bundesligi?|Champions[- ]League|Europa[- ]League|Conference[- ]League|Nations[- ]League|Youth[- ]League|Europapokals? der|Intertoto|UI-Cup|Messestädte|Libertadores|Ballon d|Premier League|Serie A|LaLiga|La Liga|Ligue 1|Eredivisie|Europäischer? Verband/;
/** Vorfilter Stufe 2. */
const ANY_V2 = /Weltpokal|Interkontinental|Intercontinental|(?:Klub|Club)-W|Konföderationen|Confed|Super(?:cup|-Cup| Cup)|Ligapokal|[Mm]asters|Goldene[nmr]? (?:Ball|Schuh)|Sommermärchen|Wembley|(?:Erst|Bundes)ligist/;

/** Vorfilter Stufe 3. */
const ANY_V3 = /Europa[- ]Liga|Konferenz[- ]Liga/;

/** Interne Schlüssel, die genau so im Spielstand stehen (Kontinent eines Nationalteams, Kürzel). */
const KEYS = new Set(['UEFA', 'FIFA', 'CONMEBOL', 'CONCACAF', 'CAF', 'AFC', 'OFC', 'DFB', 'DFL']);

/** Echte Verbands-/Wettbewerbsnamen eines angezeigten Textes durch die neutralen ersetzen. */
export function neutralText(s: string): string {
  if (KEYS.has(s)) return s;
  let out = s;
  if (ANY.test(out)) for (const [rx, to] of RULES) out = out.replace(rx, to);
  if (ANY_V2.test(out)) for (const [rx, to] of RULES_V2) out = out.replace(rx, to);
  if (ANY_V3.test(out)) for (const [rx, to] of RULES_V3) out = out.replace(rx, to);
  return out;
}

/** Enthält der Text noch einen alten Namen? (Prüfung in Tests.) */
export const hasRealOrgName = (s: string): boolean => !KEYS.has(s) && (ANY.test(s) || ANY_V2.test(s) || ANY_V3.test(s));
