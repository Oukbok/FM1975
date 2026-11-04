// =============================================================================
// Umbenennung zu echt klingender Firmen-/Hallennamen (Wunsch Pascal: keine Namen,
// die an echte Marken erinnern). Alte Spielstände tragen die Namen in Verträgen,
// Angeboten, Nachrichten und Buchungen – `migrateSponsorNames` (game/sponsorRenameMigration.ts)
// ersetzt sie beim Laden. Kein neuer Name enthält einen alten (idempotent, geprüft in
// tests/names-test.ts).
// =============================================================================

const ARENA_WORDS = ['Arena', 'Park', 'Stadion', 'Sportpark'];

/** Firmennamen alt → neu (Sponsoring 2.0, alte Trikot-/Bandenlisten, Namensrechte, Investoren). */
const FIRMS: Record<string, string> = {
  // Sponsoring 2.0 (data/sponsorNames.ts)
  'Hubertus Kräuterlikör': 'Falkenhorst Kräuterlikör',
  'Alt-Hansa Korn': 'Heidekrug Korn',
  'Kapitänsbitter': 'Lotsenbitter',
  'Doppelkorn Westfalia': 'Doppelkorn Brakelmann',
  'Amaro Vesuvio': 'Amaro Ventoso',
  'Weinbrand Rheingold': 'Weinbrand Goldhügel',
  'Bavaria Bräu': 'Kesselberg Bräu',
  'Sonnen-Brauerei': 'Brauerei Sonnwiese',
  'Hanse Bräu': 'Kogge Bräu',
  'Klosterquell': 'Abtei Hohenwald',
  'Bergbräu': 'Steinbock Bräu',
  'Oranje Bier': 'Polder Bier',
  'Kapitän Zigaretten': 'Kompass Zigaretten',
  'Ambassador Tabak': 'Kommodore Tabak',
  'Golden Mile': 'Silberstreif Filter',
  'Nordsee Versicherung': 'Deichland Versicherung',
  'Hanse Leben': 'Kontor Leben',
  'Merkur Assekuranz': 'Ankerhof Assekuranz',
  'Rheinland Versicherungen': 'Domblick Versicherungen',
  'Alpina Rück': 'Gotthard Rück',
  'Securitas Mutuelle': 'Mutuelle Clairval',
  'Atlantis Insurance': 'Thamesgate Insurance',
  'Merkur Bank': 'Kontorbank Nord',
  'Volkskasse': 'Heimatkasse',
  'Rheinische Hypo': 'Rheintaler Kreditbank',
  'Stadtsparkasse': 'Brunnenthal Sparbank',
  'Helvetia Privatbank': 'Säntis Privatbank',
  'Bosporus Bank': 'Marmara Kredi',
  'Oranje Bank': 'Grachten Bank',
  'Adler Automobile': 'Merlin Automobile',
  'Sternmobil Autohäuser': 'Lohwald Autohäuser',
  'Dragon Auto': 'Tianhe Motors',
  'Telefunk-Werke': 'Wellenwerk Radio',
  'Nordmende Radio': 'Nordklang Phono',
  'Orion Micro': 'Corvid Micro',
  'Philtron': 'Polderlicht',
  'Huaxing Electronics': 'Jinxiu Electronics',
  'Allmarkt': 'Marktkorb',
  'Kaufring': 'Kaufkontor',
  'Union Möbel': 'Möbel Wohnwerk',
  'Bauhaus Weber': 'Baumarkt Hammerschmidt',
  'Anadolu Market': 'Pazar Lale',
  'Rheinland Immobilien': 'Domstadt Immobilien',
  'Hochtief Weser': 'Weserbau Lohmann',
  'Al-Nahda Construction': 'Sahil Construction',
  'Phoenix Chemie': 'Greifen Chemie',
  'Rheinmetallwerke': 'Siegtal Metallwerke',
  'Ruhrkohle Werke': 'Emscher Kohle',
  'Continental Gummi': 'Elbgummi Werke',
  'Nordland Fisch': 'Kutterfang Fisch',
  'Schoko Lindau': 'Schoko Bodenhain',
  'Alpenmilch': 'Bergwiesen Milch',
  'Golden Cola': 'Prairie Cola',
  'Medivita': 'Medivalis',
  'Coq Bleu': 'Étoile Sport',
  'Nordkurier Express': 'Kurierwind Express',
  'Funknetz D-Plus': 'Funknetz Plus',
  'Mobilis': 'Mobiwell',
  'Huaxing Mobile': 'Jinxiu Mobile',
  'Nordgas': 'Küstengas',
  'Uralgas Export': 'Taiga Gas Export',
  'Longyuan Tech': 'Yunhai Tech',
  'Dragon Mall': 'Jade Mall',
  'Hansa Charter': 'Möwe Charter',
  'Sky Alpin': 'Alpenflug',
  'Anadolu Air': 'Lale Air',
  'Discover Doha': 'Doha Horizons',
  'Visit Al-Ain': 'Discover Liwa',
  'Topwette': 'Torwette',
  'CoinVault': 'Coinkeller',
  'Nexchange': 'Blockwerft',
  // Alte Trikot-/Bandenpartner (engine/finances.ts, Spielstände vor Sponsoring 2.0)
  'Adler Bekleidung': 'Lohwald Bekleidung',
  'Rheinmetall': 'Siegtal Metallwerke',
  'Continental Reifen': 'Elbgummi Reifen',
  'Salamander': 'Schuhhaus Brenner',
  'Fortuna Media': 'Säulen Media',
  // Namensrechte und Investoren (engine/clubBusiness.ts)
  'Elbe Telekom': 'Elbe Funknetz',
  'Westfalen Stahl': 'Lippetal Stahl',
  'Weserwerft': 'Weserkai Werft',
  'Brückner Bau': 'Steinhauer Bau',
  'Kessler Holding': 'Brennecke Holding',
  'Brandt & Söhne Beteiligungen': 'Hollmann & Söhne Beteiligungen',
  'Vogelsang Industrie': 'Falkenried Industrie',
  'Meridian Partners': 'Lindwurm Partners',
};

/** Stadionnamen aus Namensrechten (engine/clubBusiness.ts: erstes Wort der Firma + "-" + Arena-Wort).
 *  Nur für umbenannte Namensrechte-Firmen – sonst träfe es echte Vereinsstadien wie „Hanse-Stadion“. */
const NAMING_FIRMS_RENAMED = ['Westfalen Stahl', 'Weserwerft', 'Brückner Bau'];
function arenaRenames(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const o of NAMING_FIRMS_RENAMED) {
    const a = o.split(' ')[0], b = FIRMS[o].split(' ')[0];
    for (const w of ARENA_WORDS) out[`${a}-${w}`] = `${b}-${w}`;
  }
  return out;
}

/** Hallen-/Stadionnamen mit echtem Sponsor (data/indoorHistory.ts). */
const VENUES: Record<string, string> = {
  'Erdgas Arena': 'Mehrzweckhalle',
};

/** Vollständige Zuordnung alt → neu. */
export const SPONSOR_RENAMES: Record<string, string> = { ...arenaRenames(), ...FIRMS, ...VENUES };

let rx: RegExp | null = null;
/** Ersetzt alle alten Namen in einem Text (ganze Wörter, längste zuerst). */
export function renameSponsorText(s: string): string {
  if (!rx) {
    const keys = Object.keys(SPONSOR_RENAMES).sort((a, b) => b.length - a.length)
      .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    rx = new RegExp(`(?<![\\p{L}\\p{N}])(?:${keys.join('|')})(?![\\p{L}\\p{N}])`, 'gu');
  }
  return s.replace(rx, (m) => SPONSOR_RENAMES[m] ?? m);
}
