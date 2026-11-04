// =============================================================================
// Erfundene Namen ohne Ähnlichkeit zu echten Marken (Wunsch Pascal).   npm run test:names
// Prüft alle Namenslisten (Sponsoren, alte Trikot-/Bandenpartner, Namensrechte samt
// Stadionnamen, Investoren, Hallen, Zeitungsköpfe, Fan-Medien, Trainingslager-Unterkünfte,
// Vereinsstadien) gegen eine Sperrliste bekannter Marken/Medien/Firmen in Deutschland/Europa:
// Normalisierung (Kleinschrift, Umlaute, ohne Satzzeichen) + Levenshtein ≤ 2 je Wort, je
// Wortpaar und für den ganzen Namen, dazu „enthält die Marke“. Außerdem: Umbenennung
// alter Spielstände (data/sponsorRenames.ts) idempotent und vollständig.
// =============================================================================
import { ALL_SPONSOR_FIRMS } from '../src/data/sponsorNames';
import { SPONSOR_RENAMES, renameSponsorText } from '../src/data/sponsorRenames';
import { NAMING_FIRMS, INVESTORS } from '../src/engine/clubBusiness';
import { SHIRT_SPONSOR_NAMES, BANDEN_PARTNER_NAMES } from '../src/engine/finances';
import { INDOOR_VENUES } from '../src/data/indoorHistory';
import { mastheadFor } from '../src/game/press/calendar';
import { fanDeviceFor } from '../src/data/fanDevice';
import { CAMP_LODGINGS } from '../src/data/campLodgings';
import { CLUB_SEEDS } from '../src/data/generate';
import { migrateSponsorNames } from '../src/game/sponsorRenameMigration';
import { sponsorLogoSlug, SPONSOR_LOGOS } from '../src/data/sponsorLogos';

let fails = 0;
const ok = (c: boolean, msg: string) => { if (!c || process.env.VERBOSE) console.log(`${c ? 'OK  ' : 'FEHL'} ${msg}`); if (!c) fails++; };

// --- Sperrliste: Marken, Firmen, Medien, Sender, Stadion-Sponsoren (Deutschland/Europa) -------
const BRANDS = [
  // Sportartikel
  'adidas', 'puma', 'nike', 'umbro', 'erima', 'uhlsport', 'hummel', 'kappa', 'diadora', 'lotto', 'reebok', 'le coq sportif', 'coq',
  'jako', 'saller', 'admiral', 'mizuno', 'asics', 'new balance', 'under armour', 'macron', 'joma', 'derbystar', 'select', 'fila',
  // Auto / Reifen / Zulieferer
  'opel', 'mercedes', 'daimler', 'bmw', 'audi', 'porsche', 'volkswagen', 'ford', 'fiat', 'toyota', 'mitsubishi', 'nissan',
  'mazda', 'honda', 'hyundai', 'kia', 'renault', 'peugeot', 'citroen', 'seat', 'skoda', 'volvo', 'saab', 'lancia', 'alfa romeo',
  'ferrari', 'borgward', 'trabant', 'wartburg', 'continental', 'michelin', 'pirelli', 'dunlop', 'goodyear', 'bridgestone',
  'semperit', 'fulda', 'bosch', 'mahle', 'zf', 'adler', 'nsu', 'horch', 'westfalia', 'sternauto', 'stern auto', 'geely', 'byd',
  // Elektronik / Tech / Telekom
  'telefunken', 'nordmende', 'grundig', 'blaupunkt', 'saba', 'loewe', 'metz', 'dual', 'braun', 'siemens', 'aeg', 'philips',
  'sony', 'samsung', 'panasonic', 'sharp', 'toshiba', 'hitachi', 'jvc', 'pioneer', 'technics', 'sanyo', 'orion', 'akai',
  'commodore', 'atari', 'nixdorf', 'apple', 'microsoft', 'google', 'amazon', 'ebay', 'zalando', 'otto', 'huawei', 'xiaomi',
  'lenovo', 'haier', 'hisense', 'tcl', 'lg', 'telekom', 'vodafone', 'mannesmann', 'eplus', 'o2', 'viag interkom', 'debitel',
  'mobilcom', 'freenet', 'unitymedia', 'kabel deutschland', 'sap', 'software ag', 'hp', 'ibm', 'intel', 'oracle', 'tipp24',
  'mobilis', 'orange', 'telefonica', 'swisscom', 'kpn', 'turkcell', 'mediamarkt', 'saturn', 'conrad', 'huaxing', 'longyuan',
  // Getränke / Lebensmittel / Tabak
  'jaegermeister', 'underberg', 'asbach', 'chantre', 'doornkaat', 'schlichte', 'echter nordhaeuser', 'berentzen', 'killepitsch',
  'ramazzotti', 'averna', 'campari', 'martini', 'krombacher', 'warsteiner', 'bitburger', 'veltins', 'paulaner', 'loewenbraeu',
  'spaten', 'hasseroeder', 'radeberger', 'jever', 'becks', 'holsten', 'astra', 'koenig pilsener', 'dab', 'dortmunder union',
  'kronen', 'erdinger', 'oettinger', 'diebels', 'gilde', 'herforder', 'licher', 'binding', 'henninger', 'tuborg', 'carlsberg',
  'heineken', 'grolsch', 'bavaria', 'oranjeboom', 'amstel', 'stella artois', 'efes', 'rheingold', 'klosterquelle', 'gerolsteiner',
  'apollinaris', 'coca cola', 'pepsi', 'fanta', 'sinalco', 'red bull', 'nestle', 'milka', 'lindt', 'ritter sport', 'haribo',
  'dr oetker', 'kraft', 'jacobs', 'tchibo', 'eduscho', 'melitta', 'dallmayr', 'nordsee', 'iglo', 'mueller milch', 'ehrmann',
  'zott', 'bahlsen', 'storck', 'ferrero', 'barilla', 'reemtsma', 'marlboro', 'camel', 'west', 'hb', 'ernte 23', 'peter stuyvesant',
  'lucky strike', 'ambassador', 'kim', 'r1', 'gauloises', 'philip morris', 'golden american', 'kapitaen',
  // Banken / Versicherungen / Finanzen
  'allianz', 'axa', 'ergo', 'hamburg mannheimer', 'victoria', 'iduna', 'signal iduna', 'debeka', 'huk coburg', 'hansemerkur',
  'generali', 'zurich', 'helvetia', 'alpina', 'swiss re', 'munich re', 'securitas', 'rheinland versicherung', 'provinzial',
  'gothaer', 'continentale', 'arag', 'wuestenrot', 'schwaebisch hall', 'lbs', 'sparkasse', 'volksbank', 'raiffeisen',
  'commerzbank', 'dresdner bank', 'deutsche bank', 'postbank', 'hypovereinsbank', 'hypo', 'dzbank', 'ing', 'santander',
  'targobank', 'citibank', 'merkur', 'unicredit', 'credit suisse', 'ubs', 'garanti', 'ziraat', 'qnb', 'barclays', 'hsbc',
  // Handel / Bau / Chemie / Industrie
  'aldi', 'lidl', 'rewe', 'edeka', 'penny', 'netto', 'kaufhof', 'karstadt', 'hertie', 'horten', 'quelle', 'neckermann',
  'kaufring', 'allkauf', 'kaiser', 'tengelmann', 'metro', 'real', 'globus', 'ikea', 'obi', 'hornbach', 'toom', 'bauhaus',
  'praktiker', 'hellweg', 'hagebau', 'adler modemaerkte', 'c und a', 'salamander', 'deichmann', 'hochtief', 'bilfinger',
  'strabag', 'holzmann', 'zueblin', 'basf', 'bayer', 'hoechst', 'henkel', 'evonik', 'degussa', 'phoenix', 'rheinmetall',
  'krupp', 'thyssen', 'mannesmann', 'ruhrkohle', 'rag', 'ruhrgas', 'preussag', 'salzgitter', 'klöckner', 'kloeckner',
  'hoesch', 'man', 'linde', 'wella', 'nivea', 'beiersdorf', 'trigema', 'falke', 'hugo boss', 'escada', 'brandt',
  'vogelsang', 'kessler',
  // Energie / Logistik / Airlines
  'eon', 'rwe', 'enbw', 'vattenfall', 'gazprom', 'lukoil', 'aral', 'shell', 'esso', 'bp', 'total', 'veba', 'viag', 'erdgas',
  'dhl', 'ups', 'tnt', 'hermes', 'dpd', 'gls', 'deutsche post', 'schenker', 'kuehne nagel', 'lufthansa', 'condor', 'hapag lloyd',
  'ltu', 'air berlin', 'germanwings', 'eurowings', 'tuifly', 'tui', 'emirates', 'etihad', 'qatar airways', 'turkish airlines',
  'anadolujet', 'pegasus', 'saudia', 'fly emirates', 'visit rwanda', 'visit qatar',
  // Pharma
  'ratiopharm', 'hexal', 'stada', 'boehringer', 'merck', 'schering', 'fresenius', 'novartis', 'roche', 'medivita',
  // Wetten / Krypto / Online
  'tipico', 'bwin', 'betway', 'unibet', 'bet at home', 'interwetten', 'oddset', 'bet365', 'sportwetten', 'mybet',
  'crypto com', 'coinbase', 'binance', 'bitpanda', 'socios', 'ftx', 'coinvault', 'nexchange',
  // Medien / Sender / Zeitungen
  'kicker', 'bild', 'sport bild', 'sportbild', 'ard', 'zdf', 'rtl', 'sat 1', 'sat1', 'pro7', 'premiere', 'sky', 'dazn',
  'sport1', 'dsf', 'eurosport', 'spiegel', 'stern', 'focus', 'welt', 'faz', 'sueddeutsche', 'express', 'nordkurier',
  'westfalenpost', 'ran', 'kicker sportmagazin', 'fussball woche', 'elf freunde', 'transfermarkt',
  // Stadien mit Sponsor
  'allianz arena', 'signal iduna park', 'veltins arena', 'aol arena', 'imtech arena', 'volksparkstadion', 'awd arena',
  'easycredit', 'wwk arena', 'pre zero', 'mercedes benz arena', 'commerzbank arena', 'deutsche bank park', 'rhein energie',
  'red bull arena', 'schauinsland', 'vonovia', 'wohninvest', 'europa park', 'bayarena', 'weser stadion', 'erdgas arena',
  'westfalenstadion', 'esprit arena', 'merkur spiel arena', 'gazprom arena', 'emirates stadium', 'etihad stadium',
];
// Gewöhnliche deutsche/englische Wörter, die zugleich Marke sind: nur als ganzer Name gesperrt.
const GENERIC = new Set(['west', 'kim', 'man', 'real', 'focus', 'total', 'express', 'kraft', 'stern', 'welt', 'ran', 'select',
  'kaiser', 'victoria', 'orange', 'globus', 'metro', 'seat', 'braun', 'dual', 'gilde', 'ergo', 'ing', 'kronen', 'linde', 'falke',
  'hermes', 'adler', 'sport1', 'phoenix', 'saturn', 'astra', 'admiral', 'puma', 'otto', 'quelle', 'penny', 'netto']);
// Ortsnamen/Wörter, die zufällig nah an einer Marke liegen (Kapstadt ~ Karstadt).
const WORDS_OK = new Set(['kapstadt', 'insel']);
const norm = (s: string) => s.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
  .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
function lev(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 99;
  const d = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = d[0]; d[0] = i;
    for (let j = 1; j <= b.length; j++) { const t = d[j]; d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = t; }
  }
  return d[b.length];
}
/** Erlaubter Abstand je Länge der Marke (höchstens 2): kurze Marken nur exakt. */
const tol = (len: number) => (len <= 5 ? 0 : len <= 8 ? 1 : 2);

/** Treffer: Marke, an die der Name erinnert (oder null). */
function brandHit(name: string): string | null {
  const n = norm(name);
  const words = n.split(' ').filter(Boolean);
  const pairs: string[] = [];
  for (let i = 0; i + 1 < words.length; i++) pairs.push(words[i] + words[i + 1]);
  const whole = words.join('');
  for (const b of BRANDS) {
    const bn = norm(b), bc = bn.replace(/ /g, '');
    // ganzer Name gleich/fast gleich bzw. enthält eine längere Marke („Rheinmetallwerke“, „Stadtsparkasse“)
    if (lev(whole, bc) <= tol(bc.length)) return b;
    if (GENERIC.has(bc)) continue;
    if (bc.length >= 7 && whole.includes(bc)) return b;
    // einzelne Wörter nur gegen einwortige Marken, Wortpaare gegen alle
    const parts = (bn.includes(' ') ? pairs : [...words, ...pairs]).filter((p) => !WORDS_OK.has(p));
    for (const p of parts) if (lev(p, bc) <= tol(bc.length)) return b;
  }
  return null;
}

// --- Alle Namenslisten ------------------------------------------------------------------------
const ARENA = ['Arena', 'Park', 'Stadion', 'Sportpark'];
const lists: Record<string, string[]> = {
  'Sponsoren (data/sponsorNames.ts)': ALL_SPONSOR_FIRMS.map((f) => f.name),
  'Alte Trikotpartner (engine/finances.ts)': SHIRT_SPONSOR_NAMES,
  'Alte Bandenpartner (engine/finances.ts)': BANDEN_PARTNER_NAMES,
  'Namensrechte (engine/clubBusiness.ts)': NAMING_FIRMS,
  'Stadionnamen aus Namensrechten': NAMING_FIRMS.flatMap((f) => ARENA.map((w) => `${f.split(' ')[0]}-${w}`)),
  'Investoren (engine/clubBusiness.ts)': INVESTORS,
  'Hallen (data/indoorHistory.ts)': INDOOR_VENUES.map((v) => v.hall),
  'Zeitungsköpfe (game/press/calendar.ts)': [1975, 1990, 2000, 2015].map((y) => mastheadFor(y).name),
  'Fan-Medien (data/fanDevice.ts)': ['1976-01-01', '1990-01-01', '2005-01-01', '2015-01-01'].map((d) => fanDeviceFor(d).title),
  'Trainingslager-Unterkünfte (data/campLodgings.ts)': Object.values(CAMP_LODGINGS).flat().map((l) => l.name),
  'Vereinsstadien (data/generate.ts)': CLUB_SEEDS.map((c) => c.stadium),
};
// Historische Hallen ohne Sponsor (reale Orte der Hallenturniere, kein Markenname).
const ALLOW = new Set(['Westfalenhalle', 'Deutschlandhalle', 'Hanns-Martin-Schleyer-Halle', 'Killesberghalle', 'Olympiahalle', 'Festhalle', 'Messehalle', 'Weser-Ems-Halle']);

let total = 0;
for (const [label, names] of Object.entries(lists)) {
  const hits = names.filter((n) => !ALLOW.has(n)).map((n) => [n, brandHit(n)] as const).filter(([, h]) => h);
  total += names.length;
  ok(hits.length === 0, `${label}: ${names.length} Namen${hits.length ? ' – erinnert an Marke: ' + hits.map(([n, h]) => `${n} ~ ${h}`).join(', ') : ''}`);
}
console.log(`Geprüft: ${total} Namen gegen ${BRANDS.length} Marken.`);

// Selbstprüfung der Erkennung: alte Namen werden erkannt.
const mustHit = ['Continental Gummi', 'Telefunk-Werke', 'Nordmende Radio', 'Hochtief Weser', 'Bauhaus Weber', 'Rheinmetallwerke',
  'Ruhrkohle Werke', 'Kaufring', 'Stadtsparkasse', 'Bavaria Bräu', 'Kapitän Zigaretten', 'Erdgas Arena', 'Sky Alpin', 'Merkur Assekuranz', 'Coq Bleu'];
const missed = mustHit.filter((n) => !brandHit(n));
ok(missed.length === 0, `Sperrliste erkennt die alten Namen${missed.length ? ' – verfehlt: ' + missed.join(', ') : ''}`);

// --- Umbenennung alter Spielstände -----------------------------------------------------------
const olds = Object.keys(SPONSOR_RENAMES), news = Object.values(SPONSOR_RENAMES);
const allNow = Object.values(lists).flat();
ok(!allNow.some((n) => olds.includes(n)), 'kein alter Name mehr in den Listen');
ok(news.every((n) => renameSponsorText(n) === n), 'neue Namen bleiben bei erneutem Lauf unverändert (idempotent)');
ok(allNow.every((n) => renameSponsorText(n) === n), 'aktuelle Listen werden von der Umbenennung nicht berührt');
ok(news.every((n) => !brandHit(n)), 'Ersatznamen erinnern an keine Marke');
ok(renameSponsorText('Vertrag: Continental Gummi (Trikotbrust), Rheinmetall und Rheinmetallwerke') === 'Vertrag: Elbgummi Werke (Trikotbrust), Siegtal Metallwerke und Siegtal Metallwerke', 'Ersetzen im Fließtext');

// Kleiner Spielstand mit alten Namen
const g = {
  clubs: {
    a: {
      stadium: { name: 'Westfalen-Arena' },
      commerce: {
        deals: [{ partner: 'Bavaria Bräu' }], dealOffers: [{ partner: 'Merkur Bank', reply: 'Merkur Bank lehnt ab.' }],
        campObligations: [{ partner: 'Sky Alpin' }], shirtSponsor: { name: 'Continental Reifen' }, sponsorLog: [{ text: 'Vertrag: Kaufring' }],
      },
      namingRights: { sponsor: 'Westfalen Stahl', arenaName: 'Westfalen-Arena' },
      corporate: { investorName: 'Meridian Partners' },
      finances: { transactions: [{ description: 'Namensrechte Westfalen-Arena (Monat)' }] },
    },
    b: { stadium: { name: 'Hanse-Stadion' }, commerce: { deals: [{ partner: 'Hanse Logistik' }] } },
  },
  messages: [{ subject: 'Fans kritisieren den neuen Partner Uralgas Export', bodyText: 'Philtron und Telefunk-Werke' }],
  indoor: { current: { tournaments: [{ hall: 'Erdgas Arena' }] } },
} as unknown as Parameters<typeof migrateSponsorNames>[0];
migrateSponsorNames(g);
const once = JSON.stringify(g);
migrateSponsorNames(g);
ok(once === JSON.stringify(g), 'Migration idempotent');
const left = olds.filter((o) => new RegExp(`(^|[^\\p{L}])${o.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\p{L}]|$)`, 'u').test(once));
ok(left.length === 0, `Migration: keine alten Namen im Spielstand${left.length ? ' – übrig: ' + left.join(', ') : ''}`);
ok(once.includes('Hanse-Stadion') && once.includes('Hanse Logistik'), 'Migration: unveränderte Namen bleiben (Hanse-Stadion, Hanse Logistik)');
ok(once.includes('Lippetal-Arena') && once.includes('Kesselberg Bräu') && once.includes('Mehrzweckhalle'), 'Migration: Stadion, Vertrag, Halle umbenannt');

// --- Logo-Register -----------------------------------------------------------------------------
const slugs = ALL_SPONSOR_FIRMS.map((f) => sponsorLogoSlug(f.name));
ok(new Set(slugs).size === slugs.length && slugs.every((s) => /^[a-z0-9-]+$/.test(s)), `Logo-Dateinamen eindeutig und sauber (${slugs.length})`);
ok(Object.keys(SPONSOR_LOGOS).every((s) => slugs.includes(s)), 'Logo-Register enthält nur bekannte Firmen');

console.log(fails ? `\n${fails} Fehler` : '\nAlle Prüfungen bestanden.');
process.exit(fails ? 1 : 0);
