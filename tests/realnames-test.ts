// =============================================================================
// Keine echten Vereinsnamen, Marken oder realen Fußballer im Spiel (Wunsch Pascal: Marketingrechte).
//   npm run test:realnames      (läuft auch in npm run test:names)
// „Bitte nenne keine echten Namen“ (Wunsch Pascal): auch Politiker, Künstler, Sportler, Bands, Sendungen, Filme und
// Produktmarken stehen auf der Sperrliste (tests/realPeopleList.ts) – im Text die Funktion nennen („der Bundeskanzler“).
// Durchsucht alle angezeigten Texte der Datendateien (nur String-Inhalte, Kommentare ausgenommen)
// nach einer Sperrliste echter Vereinsnamen/Kurzformen/Spitznamen, Stadion-Marken und bekannter
// Spieler/Trainer/Funktionäre. Im Spiel heißen Vereine nach Stadt (+ Farbe), z. B. „München Rot“,
// „Mönchengladbach“, „Hamburg Blau“ – Zuordnung in docs/research/world-clubs-*.md.
// VERBOSE=1 zeigt alle geprüften Dateien.
// =============================================================================
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { neutralText } from '../src/data/neutralNames';
import { POLITICS, ATHLETES, FOOTBALL_PEOPLE, CULTURE, PRODUCTS, HISTORIC, ORGS, CLUNKY } from './realPeopleList';

let fails = 0;
const ok = (c: boolean, msg: string) => { if (!c || process.env.VERBOSE) console.log(`${c ? 'OK  ' : 'FEHL'} ${msg}`); if (!c) fails++; };

// --- Angezeigte Datendateien -------------------------------------------------------------------
const DIRS = ['src/data/briefings', 'src/data/press', 'src/data/ticker', 'src/data/legends', 'src/data/world', 'src/data/history'];
const FILES = [
  'src/data/timeline.ts', 'src/data/reforms.ts', 'src/data/wiki.ts', 'src/data/infoTexts.ts', 'src/data/talkReplies.ts',
  'src/data/contractTalkLines.ts', 'src/data/history/finals.ts', 'src/data/europe.ts', 'src/data/drawHistory.ts',
  'src/data/drawRuleSheet.ts', 'src/data/indoorHistory.ts', 'src/data/campDestinations.ts', 'src/data/campLodgings.ts',
  'src/data/sponsorCatalog.ts', 'src/data/fanDevice.ts', 'src/data/youthRecruitEvents.ts', 'src/data/hiddenTraitWords.ts',
  'src/data/attributeInfo.ts', 'src/data/budgetEras.ts', 'src/data/seatingCatalog.ts', 'src/data/groundsCatalog.ts',
  'src/data/merchCatalog.ts', 'src/data/contractClauses.ts', 'src/data/matchCalendarRules.ts', 'src/data/youthCompetitions.ts',
  'src/data/youthLowerLeagues.ts', 'src/data/euroFormats.ts', 'src/data/winterBreaks.ts', 'src/data/marketing.ts',
  'src/data/staff.ts', 'src/data/leagueTiers.ts', 'src/data/prematch/cityTextsDe.ts', 'src/data/prematch/cityTextsAbroad.ts',
  'src/engine/sponsorship.ts', 'src/game/briefingChanges.ts', 'src/game/briefingStories.ts', 'src/game/seasonTasks.ts', 'src/game/indoorNews.ts',
  'src/data/indoorAbroad.ts', 'src/data/privateLife.ts', 'src/data/activities.ts', 'src/data/fanCulture.ts', 'src/data/superCups.ts',
  'src/data/scoutingProducts.ts', 'src/data/campImages.ts', 'src/data/history.ts', 'src/data/ddr.ts', 'src/data/transferRecords.ts',
  'src/data/clubHonours.ts', 'src/data/sponsorTalkLines.ts', 'src/screens/match/board/SidePanels.tsx',
];
const walk = (d: string): string[] => readdirSync(d).flatMap((f) => {
  const p = join(d, f);
  return statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(f) ? [p] : [];
});
const exists = (p: string) => { try { statSync(p); return true; } catch { return false; } };
const files = [...DIRS.flatMap(walk), ...FILES.filter(exists)];

// --- String-Inhalte mit Zeilennummer (ohne Kommentare) ----------------------------------------
interface Lit { line: number; text: string }
function literals(src: string): Lit[] {
  const out: Lit[] = [];
  let i = 0, line = 1;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === '\n') { line++; i++; continue; }
    if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') {
      i += 2;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) { if (src[i] === '\n') line++; i++; }
      i += 2; continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      const start = line; let s = ''; i++;
      while (i < n && src[i] !== c) {
        if (src[i] === '\\') { s += src[i + 1] ?? ''; i += 2; continue; }
        if (src[i] === '\n') line++;
        // ${…} in Vorlagen: Ausdruck überspringen (Platzhalter bleibt als Leerzeichen)
        if (c === '`' && src[i] === '$' && src[i + 1] === '{') {
          let depth = 1; i += 2;
          while (i < n && depth) { if (src[i] === '{') depth++; else if (src[i] === '}') depth--; else if (src[i] === '\n') line++; i++; }
          s += ' '; continue;
        }
        s += src[i]; i++;
      }
      i++;
      out.push({ line: start, text: s });
      continue;
    }
    i++;
  }
  return out;
}

// --- Sperrliste --------------------------------------------------------------------------------
// Vereine (echte Namen, Kurzformen, Spitznamen). Städte allein sind erlaubt – Spielnamen = Stadt (+ Farbe).
const CLUBS: RegExp[] = [
  /\bFC Bayern\b/, /\bBayern München\b/, /\b(?:die|den|der|dem|des|beim|vom|zum) Bayern\b(?!-)/, /\bBayern-(?:Profis|Spieler|Trainer|Manager|Präsident|Elf)\b/,
  /\b(?<!Bergisch )Gladbach\b/, /\bBorussia\b/, /\bBVB\b/, /\bSchalke\b/, /\bS04\b/, /\bHSV\b/, /\bWerder\b/, /\bEintracht\b/,
  /\bVfB\b/, /\bVfL\b/, /\b1\. FC\b/, /\bFC [A-ZÄÖÜ]/, /\b[A-ZÄÖÜ][a-zäöü]+ FC\b/, /\bSC Freiburg\b/, /\bSpVgg\b/, /\bTSV 1860\b/, /\bSechziger\b/,
  /\bBetze\b/, /\bFCK\b/, /\bKSC\b/, /\bHertha\b/, /\bDynamo\b/, /\bDinamo\b/, /\bCarl Zeiss\b/, /\bFortuna\b/, /\bArminia\b/,
  /\bAlemannia\b/, /\bBayer (?:0[45]|Leverkusen|Uerdingen)\b/, /\bWerkself\b/, /\bKickers\b/, /\bRot-Wei(?:ß|ss) (?:Essen|Oberhausen|Erfurt|Ahlen)\b/,
  /\bWaldhof\b/, /\bSt\. Pauli\b/, /\bHansa Rostock\b/, /\bUnion Berlin\b/, /\b(?:1\. FC )?Union\b(?= (?:Berlin|Köpenick))/, /\bLok(?:omotive)? Leipzig\b/,
  /\bChemie (?:Leipzig|Halle)\b/, /\bWismut\b/, /\bEnergie Cottbus\b/, /\bStahl (?:Brandenburg|Riesa|Eisenhüttenstadt)\b/,
  /\bVorwärts (?:Frankfurt|Berlin)\b/, /\bSachsenring\b/, /\bGreuther\b/, /\bRB Leipzig\b/, /\bRasenBallsport\b/, /\bTSG\b/,
  /\bKleeblatt\b/, /\bGeißböcke\b/, /\bFohlen(?:elf)?\b/, /\bKnappen\b/, /\bKönigsblau(?:en)?\b/, /\bRothosen\b/, /\bDie Roten Teufel\b/,
  /\bReal (?:Madrid|Sociedad|Betis|Saragossa|Valladolid|Mallorca|Oviedo)\b/, /\bBarça\b/, /\bJuventus\b/, /\bJuve\b/,
  /\bInter (?:Mailand|Milan)\b/, /\bAC (?:Mailand|Milan)\b/, /\bAjax\b/, /\bPSV\b/, /\bFeyenoord\b/, /\bLiverpool FC\b/,
  /\bManchester (?:United|City)\b/, /\bManU\b/, /\bChelsea\b/, /\bArsenal\b/, /\bTottenham\b/, /\bEverton\b/, /\bAston Villa\b/,
  /\bNottingham Forest\b/, /\bLeeds United\b/, /\bCeltic\b/, /\bRangers\b/, /\bBenfica\b/, /\bSporting (?:Lissabon|CP)\b/,
  /\bAnderlecht\b/, /\bSteaua\b/, /\bOlympique\b/, /\bParis Saint-Germain\b/, /\bPSG\b/, /\bAS Monaco\b/, /\bGalatasaray\b/,
  /\bFenerbah/, /\bBe[sş]ikta[sş]\b/, /\bRoter Stern\b/, /\bCrvena\b/, /\bPartizan\b/, /\bHajduk\b/, /\bDukla\b/, /\bSparta Prag\b/,
  /\bSlavia\b/, /\bFerencváros\b/, /\bHonvéd\b/, /\bÚjpest\b/, /\bRapid Wien\b/, /\bAustria Wien\b/, /\bClub Brügge\b/,
  /\bStandard Lüttich\b/, /\bMalmö FF\b/, /\bIFK\b/, /\bNapoli\b/, /\bSSC Neapel\b/, /\bLazio\b/, /\bAS Rom(?:a)?\b/, /\bFiorentina\b/,
  /\bAtlético\b/, /\bAtletico\b/, /\bAthletic Bilbao\b/, /\bBetis\b/, /\bSpartak\b/, /\b[CZ]SKA\b/, /\bZenit (?:St\.|Sankt)/, /\bSchachtar\b/,
  /\bShakhtar\b/, /\bRed Bull\b/, /\bFC Basel\b/, /\bGrasshopper\b/, /\bYoung Boys\b/, /\bOlympiakos\b/, /\bPanathinaikos\b/,
  /\b[A-ZÄÖÜ][a-zäöü]+er (?:SC|SV|FC|TSV|SpVgg)\b/, /\b(?:SC|SV|TSV|FSV|TuS|SSV|VfR|BSC|KFC|MSV|SpVgg) [A-ZÄÖÜ]/, /\bCosmos\b/, /\bBoca Juniors\b/,
  /\bAtalanta\b/, /\bSampdoria\b/, /\bGenoa\b/, /\bUdinese\b/, /\bTriestina\b/, /\bCremonese\b/, /\bReggina\b/, /\bSalernitana\b/,
  /\bTernana\b/, /\bCasertana\b/, /\bEspanyol\b/, /\bCelta\b/, /\bAlavés\b/, /\bRayo Vallecano\b/, /\bRecreativo\b/, /\bCastilla\b(?! y)/,
  /\bMarítimo\b/, /\bSalgueiros\b/, /\bFarense\b/, /\bFeirense\b/, /\bTirsense\b/, /\bBoavista\b/, /\bBelenenses\b/, /\bGil Vicente\b/,
  /\bRiver Plate\b/, /\bAl-(?:Hilal|Nassr|Ittihad|Ahly)\b/,
  // Andere Kontinente (data/world/continents/, Wunsch Pascal)
  /\bFlamengo\b/, /\bFluminense\b/, /\bCorinthians\b/, /\bPalmeiras\b/, /\bGrêmio\b/, /\bCruzeiro\b/, /\bPeñarol\b/,
  /\bColo-Colo\b/, /\bEstudiantes\b/, /\bIndependiente\b/, /\bVélez\b/, /\bCruz Azul\b/, /\bChivas\b/, /\bZamalek\b/,
  /\bMazembe\b/, /\bWydad\b/, /\bEspérance\b/, /\bKaizer Chiefs\b/, /\bSundowns\b/, /\bKashima Antlers\b/, /\bAuckland City\b/,
];
// Marken in Stadionnamen und Sponsoren mit Bezug zum Fußball – und (Wunsch Pascal) Fernsehsender, Sendungen,
// Streamingdienste und Mediengruppen: im Text nur umschrieben („ein Privatsender“, „der Bezahlsender“).
const BRANDS: RegExp[] = [
  /\bAllianz\b/, /\bSignal Iduna\b/, /\bAOL\b/, /\bVeltins\b/, /\bBayArena\b/, /\bImtech\b/, /\bMercedes-Benz-Arena\b/,
  /\bVolkswagen\b/, /\bJägermeister\b/, /\bQatar Airways\b/, /\bEmirates\b/, /\bEtihad\b/, /\bTelekom\b/, /\bAdidas\b/i,
  /\bPuma\b/, /\bNike\b/, /\bHermes\b/, /\bAspire\b/, /\bCommerzbank\b/, /\bAudi\b/, /\bOpel\b/, /\bSAP\b/, /\bGazprom\b/,
  /\bEvonik\b/, /\bTipico\b/, /\bInternational Champions Cup\b/,
  /\bARD\b/, /\bZDF\b/, /\bRTL\b/, /\bSat\.1\b/i, /\bPremiere\b/, /\bSky\b/, /\bDAZN\b/, /\bKirch(?:-|s?\b|Media)/, /\bISPR\b/, /\bUFA\b/,
  /\bDSF\b/, /\bDF1\b/, /\bSport1\b/, /\bEurosport\b/, /\bNetflix\b/, /\bAmazon\b/, /\bMagentaSport\b/, /\bSportschau\b/,
  /\bSportstudio\b/, /„ran“/, /\bUnity ?Media\b/, /\bBig Brother\b/, /\bBBC\b/, /\bITV\b/, /\bCanal\+/, /\bMediaset\b/,
];
// Reale Fußballer, Trainer, Schiedsrichter und Funktionäre (Nachnamen bzw. Vor- + Nachname).
const PEOPLE: RegExp[] = [
  /\bBeckenbauer\b/, /\bKaiser Franz\b/, /\b(?:Der|der) Kaiser\b/, /\bGerd Müller\b/, /\bThomas Müller\b/, /\bBomber der Nation\b/,
  /\bNetzer\b/, /\bBreitner\b/, /\bSepp Maier\b/, /\bRummenigge\b/, /\bMatthäus\b/, /\bKlinsmann\b/, /\bVöller\b/, /\bBrehme\b/,
  /\bVogts\b/, /\bDerwall\b/, /\bHelmut Schön\b/, /\bHerberger\b/, /\bHappel\b/, /\bLattek\b/, /\bWeisweiler\b/, /\bRehhagel\b/,
  /\bHeynckes\b/, /\bHitzfeld\b/, /\bDaum\b/, /\bKlopp\b/, /\bLöw\b/, /\bHansi Flick\b/, /\bNagelsmann\b/, /\bTuchel\b/,
  /\bRangnick\b/, /\bHoeneß\b/, /\bBierhoff\b/, /\bOliver Kahn\b/, /\bBallack\b/, /\bPhilipp Lahm\b/, /\bSchweinsteiger\b/,
  /\bGötze\b/, /\bManuel Neuer\b/, /\bKroos\b/, /\bÖzil\b/, /\bHrubesch\b/, /\bSeeler\b/, /\bOverath\b/, /\bHölzenbein\b/,
  /\bGrabowski\b/, /\bToni Schumacher\b/, /\bEigendorf\b/, /\bSammer\b/, /\bAndreas Thom\b/, /\bUlf Kirsten\b/, /\bKießling\b/,
  /\bHoyzer\b/, /\bPelé\b/, /\bMaradona\b/, /\bCruyff\b/, /\bMessi\b/, /\bCristiano\b/, /\bRonaldo\b/, /\bZidane\b/, /\bPlatini\b/,
  /\bPogba\b/, /\bHarry Kane\b/, /\bHaaland\b/, /\bMbappé\b/, /\bPanenka\b/, /\bBlatter\b/, /\bNiersbach\b/, /\bInfantino\b/,
  /\bRibbeck\b/, /\bStielike\b/, /\bLittbarski\b/, /\bRiedle\b/, /\bEffenberg\b/, /\bMario Basler\b/, /\bJupp\b/, /\bBerti\b/,
  /\bWerner Lorant\b/, /\bAssauer\b/, /\bCalmund\b/, /\bMagath\b/, /\bGuardiola\b/, /\bMourinho\b/, /\bFerguson\b/, /\bSacchi\b/,
  /\bMichels\b/, /\bLobanowski\b/, /\bHerrera\b/, /\bLothar\b/, /\bKarl-Heinz\b/, /\bUli Hoe/, /\bMüller-Wohlfahrt\b/,
];
// \b kennt in JS keine Umlaute/Akzente („Pelé“, „Özil“) – Wortgrenze daher über Unicode-Buchstaben.
const WB = '(?:(?<![\\p{L}\\p{N}])(?=[\\p{L}\\p{N}])|(?<=[\\p{L}\\p{N}])(?![\\p{L}\\p{N}]))';
const uni = (r: RegExp) => new RegExp(r.source.replace(/\\b/g, WB), 'u' + r.flags);
// Listen aus realPeopleList.ts: Bruchstücke ohne Wortgrenzen; Personen auch im Genitiv.
const EDGE_L = '(?<![\\p{L}\\p{N}])', EDGE_R = '(?![\\p{L}\\p{N}])';
const listRules = (kind: string, list: string[], genitive: boolean) =>
  list.map((s) => [kind, new RegExp(`${EDGE_L}(?:${s})${genitive ? 's?' : ''}${EDGE_R}`, 'u')] as const);
const RULES = [...CLUBS.map((r) => ['Verein', uni(r)] as const), ...BRANDS.map((r) => ['Marke', uni(r)] as const),
  // Personen auch im Genitiv („Beckenbauers“, „Happels HSV“).
  ...PEOPLE.map((r) => ['Person', uni(new RegExp(r.source.replace(/\\b$/, 's?\\b')))] as const),
  ...listRules('Person', [...POLITICS, ...ATHLETES, ...FOOTBALL_PEOPLE, ...HISTORIC], true),
  ...listRules('Kultur', CULTURE, false), ...listRules('Marke', PRODUCTS, false)];

// Selbstprüfung: Beispiele werden erkannt, Spielnamen und Bundesland bleiben frei.
const hitOf = (s: string) => RULES.find(([, r]) => r.test(s));
const must = ['der FC Bayern', 'Gladbach gegen Bayern', 'Eintracht Braunschweig', 'Dynamo Dresden', 'Real Madrid', 'Allianz Arena',
  'Franz Beckenbauer', 'Pelé und Uli Hoeneß', 'Özil', 'Der Kaiser übernimmt', 'beim HSV', '1. FC Köln', 'Karlsruher SC', 'SV Werder', 'Happels Pressing', 'Hansa Rostock', 'Manchester United', 'Ajax Amsterdam', 'ARD und ZDF', 'bei Sky', 'Kirch-Pleite',
  'Bundeskanzler Helmut Schmidt', 'Nach 16 Jahren Kohl', 'Kanzler Schröder', 'Friedrich Merz', 'Honeckers Besuch', 'Sigmund Jähn', 'Gorbatschow',
  'Boris Becker, 17', 'Steffi Graf', 'Michael Schumacher', 'die Kelly Family', 'ABBA und Disco', 'der „Stern“', 'das iPhone', 'bei Facebook',
  'Windows 95', 'der Walkman', 'Neymar', '„Krieg der Sterne“', 'Lindenstraße', 'Richard Wagner', 'Johannes Gutenberg'];
const free = ['München Rot', 'Mönchengladbach', 'Hamburg Blau', 'Gelsenkirchen', 'Dresden', 'Regionalliga Bayern', 'in Bayern',
  'Bergisch Gladbach', 'Madrid Weiß', 'Mailand Rot-Schwarz', 'Liverpool Rot', 'Porto', 'Daumen hoch', 'Kaiserslautern', 'Bosman-Urteil', 'Bezahlsender', 'Kirchheim', 'Premieren-Abend', 'Ufa',
  'der Bundeskanzler', 'ein DDR-Kosmonaut', 'an der Havel', 'Kohl und Rüben', 'Schmidt', 'Bosman-Urteil', 'Hartz IV', 'Lutherstadt Wittenberg',
  'Karl-Marx-Stadt', 'Die Zwanziger', 'Madonna di Campiglio', 'der Stern auf dem Trikot', 'E-Scooter', 'Riester-Rente', 'Die Ärzte rechnen'];
const missed = must.filter((s) => !hitOf(s)), wrong = free.filter((s) => hitOf(s));
ok(!missed.length, `Sperrliste erkennt Beispiele${missed.length ? ' – verfehlt: ' + missed.join(', ') : ''}`);
ok(!wrong.length, `Spielnamen/Orte bleiben frei${wrong.length ? ' – fälschlich: ' + wrong.join(', ') : ''}`);

// Erkennbar erfundene Platzhalter (data/reforms.ts FICT_PREFIX + Städte wie „Musterstadt“): Vorsilben allein sind kein Verein.
const FICTIONAL = new Set(['FC', 'SV', 'TSV', 'VfL', 'SpVgg', 'SC', '1. FC', 'FV']);
const FICT_TEXT = /\b(?:FC|SV|TSV|VfL|SpVgg|SC|1\. FC|FV) (?:Muster|Beispiel|Platz|Fikt|Schablon|Exempel|Attrappen|Dummen|Schemen|Blaupaus|Vorlag|Test)\p{L}*/gu;

// --- Prüfung -----------------------------------------------------------------------------------
let strings = 0;
for (const f of files) {
  const lits = literals(readFileSync(f, 'utf8'));
  strings += lits.length;
  const hits: string[] = [];
  for (const { line, text: raw } of lits) {
    if (FICTIONAL.has(raw)) continue;
    const text = raw.replace(FICT_TEXT, '');
    for (const [kind, r] of RULES) {
      const m = text.match(r);
      if (m) hits.push(`  ${f}:${line} ${kind} „${m[0]}“ in: ${text.length > 120 ? text.slice(Math.max(0, (m.index ?? 0) - 50), (m.index ?? 0) + 70) : text}`);
    }
  }
  ok(!hits.length, `${f}${hits.length ? `: ${hits.length} Treffer\n${hits.join('\n')}` : ''}`);
}
// --- Verbände/Wettbewerbe: alle Quelltexte unter src/ ------------------------------------------
// Ausgenommen: die Regeln selbst (data/neutralNames.ts), Recherche-Belege der Ligastruktur
// (data/leagueTiers.ts, nicht angezeigt), Quellen mit Adresse (Zeile mit „url:“) und reine
// interne Schlüssel ('UEFA' als Kontinent, 'DFL' als Kürzel eines schottischen Vereins).
const ORG_RULES = [...listRules('Verband/Wettbewerb', ORGS, false), ...listRules('holprig', CLUNKY, false)];
const ORG_SKIP = new Set(['src/data/neutralNames.ts', 'src/data/leagueTiers.ts']);
const ORG_KEYS = /^(?:UEFA|FIFA|CONMEBOL|CONCACAF|CAF|AFC|OFC|DFB|DFL)$/;
const orgHit = (s: string) => ORG_RULES.find(([, r]) => r.test(s));
const orgMust = ['die UEFA', 'Champions League', 'DFB-Pokal', 'Bundesligist', '2. Bundesliga', 'Serie A', 'FIFA-Regel', 'NOFV-Oberliga', 'Fridays for Future',
  'Weltpokal', 'Klub-WM', 'Klub-Weltmeisterschaft', 'Interkontinentalpokal', 'Supercup', 'Europäischer Supercup', 'Ligapokal', 'Hallen-Masters', 'zum Masters',
  'Masters-Sieger', 'Goldener Ball', 'Goldenen Balls', 'Goldener Stern', 'den Goldenen Stern', 'des Goldenen Sterns', 'Goldenen Schuh', 'Confed-Cup', 'Sommermärchen', 'in Wembley', 'Erstligist', 'Erstligisten',
  'Europa-Liga', 'Europa Liga', 'der Konferenz-Liga'];
const orgFree = ['Meisterliga', 'Kontinental-Liga', 'Europa-Trophäe', 'Weltverband', 'Europaverband', 'Fußballbund', 'Ligaverband', 'Landespokal',
  '1. Liga', 'Europa-Pokal', 'Pokal der Landesmeister', 'Kristallstern', 'des Kristallsterns', 'Goldene Sterne', 'Torjägerstern', 'Nationenliga', 'Sommerpokal', 'Oberliga Nordost', 'Hartz IV',
  'Bosman-Urteil', 'Orkan Kyrill', 'Stuttgart 21', 'Bundesanstalt für Arbeit', 'Bundestrainer', 'Café am Markt', 'Transatlantik-Pokal', 'Klub-Weltturnier',
  'Kontinentalsieger-Pokal', 'Gipfelpokal', 'Europäischer Gipfelpokal', 'Auftaktpokal', 'Hallenfinale', 'Hallenpokal', 'Erstliga-Profis', 'Verein der 1. Liga',
  'Weltmeisterschaft', 'Europameisterschaft', 'Haywood, Masters, Cain', 'Olympiahalle'];
const orgMissed = orgMust.filter((s) => !orgHit(s)), orgWrong = orgFree.filter((s) => orgHit(s));
ok(!orgMissed.length, `Verbände/Wettbewerbe: Beispiele erkannt${orgMissed.length ? ' – verfehlt: ' + orgMissed.join(', ') : ''}`);
ok(!orgWrong.length, `Verbände/Wettbewerbe: neutrale Namen frei${orgWrong.length ? ' – fälschlich: ' + orgWrong.join(', ') : ''}`);
// Stufe 4 (Spielstände): „Goldener Ball“/„Goldener Stern“ → „Kristallstern“ mit Artikel und Fall, idempotent.
const ksCases: [string, string][] = [
  ['Der Goldene Ball geht an Muster.', 'Der Kristallstern geht an Muster.'],
  ['erhielt den Goldenen Ball 1980', 'erhielt den Kristallstern 1980'],
  ['die Gala des Goldenen Balls', 'die Gala des Kristallsterns'],
  ['Goldener Stern 1990', 'Kristallstern 1990'],
  ['Platz 2 beim Goldenen Stern 1990', 'Platz 2 beim Kristallstern 1990'],
  ['Bei der Gala erhielt er den Goldenen Stern.', 'Bei der Gala erhielt er den Kristallstern.'],
  ['Archiv des Goldenen Sterns', 'Archiv des Kristallsterns'],
  ["Ballon d'Or", 'Kristallstern'],
  ['Goldene Sterne zeigen das Potenzial', 'Goldene Sterne zeigen das Potenzial'],
];
const ksBad = ksCases.filter(([a, b]) => neutralText(a) !== b || neutralText(neutralText(a)) !== b).map(([a]) => `${a} → ${neutralText(a)}`);
ok(!ksBad.length, `Kristallstern: Umbenennung alter Texte${ksBad.length ? ' – falsch: ' + ksBad.join(' | ') : ''}`);
const allSrc = walk('src').filter((f) => !ORG_SKIP.has(f.replace(/\\/g, '/')));
let orgStrings = 0;
for (const f of allSrc) {
  const src = readFileSync(f, 'utf8');
  const lines = src.split('\n');
  const hits: string[] = [];
  for (const { line, text } of literals(src)) {
    orgStrings++;
    if (ORG_KEYS.test(text) || /\burl:/.test(lines[line - 1] ?? '')) continue;
    const h = orgHit(text);
    if (h) { const m = text.match(h[1])!; hits.push(`  ${f}:${line} „${m[0]}“ in: ${text.length > 120 ? text.slice(Math.max(0, (m.index ?? 0) - 50), (m.index ?? 0) + 70) : text}`); }
  }
  if (hits.length) ok(false, `${f} (Verband/Wettbewerb): ${hits.length} Treffer\n${hits.join('\n')}`);
}
console.log(`Verbände/Wettbewerbe: ${allSrc.length} Quelltexte, ${orgStrings} Texte gegen ${ORG_RULES.length} Muster.`);
console.log(`Geprüft: ${files.length} Dateien, ${strings} Texte gegen ${RULES.length} Muster.`);
console.log(fails ? `\n${fails} Fehler` : '\nKeine echten Namen in den angezeigten Texten.');
process.exit(fails ? 1 : 0);
