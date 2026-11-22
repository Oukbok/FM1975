// =============================================================================
// NEUTRALE VERBANDS- UND WETTBEWERBSNAMEN (Wunsch Pascal: „Verbände und Wettbewerbe müssen
// neutral heißen“). Angezeigte Texte nennen nie die echten Namen (FIFA, UEFA, DFB, DFL,
// Bundesliga, Champions League …), sondern das Schema des Spiels – Tabelle in CLAUDE.md:
//   Weltverband · Europaverband · Fußballbund · Ligaverband · Regelgremium ·
//   Pokal der Landesmeister → Meisterliga · Pokal der Pokalsieger → Konferenz-Liga ·
//   Messepokal → Europa-Pokal → Europa-Liga · Landespokal · 1. Liga/2. Liga · Goldener Ball.
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
  [/(?:UEFA[- ])?Europa[- ]League/g, 'Europa-Liga'],
  [/(?:UEFA[- ])?(?:Europa[- ])?Conference[- ]League/g, 'Konferenz-Liga'],
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

/** Schneller Vorfilter: nur Texte mit einem der alten Namen laufen durch alle Regeln. */
const ANY = /UEFA|FIFA|DFB|DFL|IFAB|NOFV|CONMEBOL|CONCACAF|\bCAF\b|\bAFC\b|\bOFC\b|Bundesligi?|Champions[- ]League|Europa[- ]League|Conference[- ]League|Nations[- ]League|Youth[- ]League|Europapokals? der|Intertoto|UI-Cup|Messestädte|Libertadores|Ballon d|Premier League|Serie A|LaLiga|La Liga|Ligue 1|Eredivisie|Europäischer? Verband/;

/** Interne Schlüssel, die genau so im Spielstand stehen (Kontinent eines Nationalteams, Kürzel). */
const KEYS = new Set(['UEFA', 'FIFA', 'CONMEBOL', 'CONCACAF', 'CAF', 'AFC', 'OFC', 'DFB', 'DFL']);

/** Echte Verbands-/Wettbewerbsnamen eines angezeigten Textes durch die neutralen ersetzen. */
export function neutralText(s: string): string {
  if (!ANY.test(s) || KEYS.has(s)) return s;
  let out = s;
  for (const [rx, to] of RULES) out = out.replace(rx, to);
  return out;
}

/** Enthält der Text noch einen alten Namen? (Prüfung in Tests.) */
export const hasRealOrgName = (s: string): boolean => !KEYS.has(s) && ANY.test(s);
