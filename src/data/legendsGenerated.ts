// =============================================================================
// ERZEUGTE LEGENDEN — je Jahrgang 1940–2010 weitere fiktive Ausnahmespieler
// -----------------------------------------------------------------------------
// Deterministisch (fester Seed je Jahrgang): Jedes neue Spiel kennt dieselben
// Legenden, der Editor kann sie wie handverlesene bearbeiten. Pro Jahrgang:
// vier deutsche (Seltenheit gestaffelt, vor 1976 teils aus der DDR) und zwei
// aus dem Ausland. Namen sind erfunden; reale Kombinationen sind gesperrt.
// =============================================================================
import type { LegendSeed } from './legends';
import { LEGEND_ARCHETYPES, LegendCurve, LegendRarity } from './legendArchetypes';
import { ORIGINS } from './origins';
import { BLOCKED_NAMES } from './namePools';
import { Position } from '../types';

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Regionen der Bundesrepublik und der DDR (Städte wie im Vereinsdatensatz). */
const REGIONS_WEST: { name: string; cities: string[] }[] = [
  { name: 'aus dem Ruhrgebiet', cities: ['Dortmund', 'Gelsenkirchen', 'Bochum', 'Essen', 'Duisburg', 'Herne', 'Wattenscheid'] },
  { name: 'vom Niederrhein', cities: ['Mönchengladbach', 'Krefeld', 'Düsseldorf', 'Köln', 'Leverkusen', 'Aachen'] },
  { name: 'aus Westfalen', cities: ['Bielefeld', 'Münster', 'Gütersloh', 'Osnabrück'] },
  { name: 'aus dem Norden', cities: ['Hamburg', 'Bremen', 'Hannover', 'Braunschweig', 'Göttingen'] },
  { name: 'aus Bayern', cities: ['München', 'Nürnberg', 'Augsburg', 'Fürth', 'Regensburg', 'Schweinfurt', 'Bayreuth'] },
  { name: 'aus dem Südwesten', cities: ['Stuttgart', 'Karlsruhe', 'Mannheim', 'Reutlingen', 'Kaiserslautern', 'Saarbrücken', 'Pirmasens'] },
  { name: 'aus Hessen', cities: ['Frankfurt', 'Offenbach', 'Darmstadt', 'Mainz'] },
  { name: 'aus Berlin', cities: ['Berlin'] },
];
const REGIONS_EAST: { name: string; cities: string[] }[] = [
  { name: 'aus Sachsen', cities: ['Leipzig', 'Dresden', 'Chemnitz', 'Vogtland'] },
  { name: 'aus Thüringen', cities: ['Jena', 'Erfurt', 'Thüringtal'] },
  { name: 'von der Ostsee', cities: ['Rostock', 'Ostsee'] },
  { name: 'aus Sachsen-Anhalt', cities: ['Magdeburg', 'Halle', 'Altmark'] },
];

const COUNTRY: Record<string, string> = {
  aut: 'Österreich', sui: 'der Schweiz', ned: 'den Niederlanden', bel: 'Belgien', den: 'Dänemark', swe: 'Schweden',
  nor: 'Norwegen', yug: 'Jugoslawien', cro: 'Kroatien', srb: 'Serbien', pol: 'Polen', cze: 'der Tschechoslowakei',
  hun: 'Ungarn', rus: 'der Sowjetunion', ita: 'Italien', esp: 'Spanien', por: 'Portugal', fra: 'Frankreich',
  fra_af: 'Frankreich', eng: 'England', sco: 'Schottland', tur: 'der Türkei', gre: 'Griechenland', bra: 'Brasilien',
  arg: 'Argentinien', gha: 'Ghana', nga: 'Nigeria', cmr: 'Kamerun', mar: 'Marokko', jpn: 'Japan', kor: 'Südkorea', usa: 'den USA',
};
const FOREIGN_WEIGHTS: [string, number][] = [
  ['ned', 3], ['ita', 3], ['esp', 3], ['fra', 3], ['eng', 3], ['por', 2], ['bra', 3], ['arg', 2], ['yug', 2], ['hun', 1],
  ['pol', 1.5], ['cze', 1.5], ['rus', 1.5], ['den', 1.5], ['swe', 1.5], ['bel', 1.5], ['aut', 1], ['sui', 1], ['sco', 1],
  ['tur', 1], ['gre', 0.8], ['nor', 0.8], ['gha', 0.8], ['nga', 0.8], ['cmr', 0.8], ['mar', 0.6], ['jpn', 0.5], ['kor', 0.5],
  ['fra_af', 1], ['usa', 0.4], ['cro', 0.8], ['srb', 0.8],
];

const POS_WEIGHTS: [Position, number][] = [
  ['TW', 1], ['LIB', 1], ['VS', 2], ['AV', 1.5], ['DM', 1], ['ZM', 2], ['OM', 1.5], ['FL', 1.5], ['MS', 2], ['HS', 0.6],
];

/** Silben für unverwechselbare deutsche Nachnamen (keine Allerweltsnamen). */
const SYL_A = ['Asch', 'Berg', 'Brenn', 'Dorn', 'Eich', 'Falken', 'Grün', 'Hagel', 'Hollen', 'Kessel', 'Kranich', 'Linden',
  'Mühlen', 'Ober', 'Rosen', 'Sonnen', 'Stein', 'Tann', 'Wend', 'Winter', 'Hassel', 'Elster', 'Birken', 'Fuchs', 'Kalten',
  'Kuhl', 'Moor', 'Reh', 'Schwarz', 'Silber', 'Teich', 'Wald', 'Weiden', 'Ahren', 'Brück', 'Ditt', 'Ems', 'Feld', 'Gold'];
const SYL_B = ['bach', 'berger', 'brink', 'feld', 'hagen', 'horst', 'kamp', 'kötter', 'rath', 'reiter', 'ring', 'stedt',
  'thal', 'winkel', 'hoff', 'grund', 'busch', 'mann', 'meyer', 'brock', 'beck', 'dorf', 'holt', 'ahr', 'scheidt', 'loh'];

const BIO: Record<string, string[]> = {
  katze: ['Ein Torwart mit Reflexen wie eine Katze.', 'Hält Bälle, die eigentlich drin sind.'],
  mitspieler_tw: ['Ein Torwart, der mitspielt wie ein Feldspieler.', 'Eröffnet das Spiel mit dem Fuß, ruhig wie ein Uhrwerk.'],
  libero: ['Liest das Spiel aus der Tiefe und dirigiert die ganze Mannschaft.', 'Ein Libero mit dem Blick für den ersten Pass.'],
  ausputzer: ['Räumt hinten alles ab, was in den Strafraum fliegt.', 'Kompromisslos, kopfballstark, nie zu überspielen.'],
  manndecker: ['Klebt am besten Stürmer des Gegners wie ein Schatten.', 'Ein Manndecker, gegen den niemand gern spielt.'],
  spielende_iv: ['Ein Innenverteidiger, der Angriffe mit einem Pass einleitet.', 'Ruhig am Ball, klug im Stellungsspiel.'],
  aussenlaeufer: ['Läuft die Linie rauf und runter, 90 Minuten lang.', 'Ein Außenverteidiger mit Flanken wie ein Flügelstürmer.'],
  abraeumer: ['Erobert Bälle, als wären sie ihm geschuldet.', 'Der Staubsauger vor der Abwehr.'],
  regisseur: ['Gibt dem Spiel aus der Tiefe den Takt vor.', 'Ein Regisseur mit langen, präzisen Bällen.'],
  motor: ['Läuft für zwei und reißt alle mit.', 'Der Motor, der nie stillsteht.'],
  spielmacher: ['Sieht Pässe, die sonst niemand sieht.', 'Ein Spielmacher mit Zauberfuß.'],
  fluegelflitzer: ['Schnell wie der Wind auf dem Flügel.', 'Lässt Verteidiger stehen und flankt punktgenau.'],
  strafraumstuermer: ['Ein Torjäger mit dem Riecher für den richtigen Moment.', 'Im Strafraum eiskalt.'],
  kopfballungeheuer: ['Steigt höher als alle anderen.', 'Ein Kopfballungeheuer, gefürchtet bei jeder Ecke.'],
  dribbelkuenstler: ['Dribbelt durch ganze Abwehrreihen.', 'Ein Straßenfußballer mit Kunststücken für jedes Publikum.'],
  freistossspezialist: ['Jeder Freistoß aus 25 Metern ist eine halbe Chance.', 'Ein Schuss wie ein Strich.'],
};

function pickW<T>(rng: () => number, list: [T, number][]): T {
  const total = list.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [v, w] of list) { r -= w; if (r <= 0) return v; }
  return list[list.length - 1][0];
}
const pick = <T,>(rng: () => number, a: T[]): T => a[Math.floor(rng() * a.length)];

function germanOrigin(year: number, rng: () => number): string {
  if (year < 1960) return 'ger';
  if (year < 1980) return pickW(rng, [['ger', 8], ['ger_pl', 1], ['ger_tr', 1]]);
  if (year < 1990) return pickW(rng, [['ger', 4], ['ger_modern', 4], ['ger_tr', 1.5], ['ger_pl', 1], ['ger_af', 1]]);
  return pickW(rng, [['ger_modern', 6], ['ger_tr', 2], ['ger_af', 2], ['ger_pl', 1]]);
}

const SIG_RANGE: Record<LegendRarity, [number, number]> = { weltklasse: [89, 95], national: [84, 90], liebling: [80, 86] };
const CAP: Record<LegendRarity, number> = { weltklasse: 96, national: 90, liebling: 85 };


// Ausländische (und einfache deutsche) Nachnamen werden aus einem Wortstamm des
// Namenspools und einer landestypischen Endung neu gebildet. So klingen sie
// echt, treffen aber praktisch nie eine reale Person („Nielgaard“, „Rossetti“).
const ENDINGS: Record<string, string[]> = {
  eng: ['ford', 'ley', 'ton', 'wick', 'by', 'well', 'more', 'field', 'worth'], sco: ['ford', 'ton', 'more', 'law', 'burn'], usa: ['ford', 'ton', 'well', 'field'],
  den: ['gaard', 'holm', 'strand', 'bæk', 'dahl'], swe: ['berg', 'lund', 'ström', 'qvist', 'dahl'], nor: ['vik', 'stad', 'heim', 'dal', 'rud'],
  ita: ['elli', 'etti', 'ini', 'one', 'ardi', 'asco', 'ucci'], esp: ['ales', 'ondo', 'ares', 'ero', 'eda', 'illa'], por: ['eira', 'ares', 'inho', 'ado', 'oso'],
  bra: ['inho', 'eira', 'ão', 'ares', 'ado'], arg: ['ales', 'ero', 'oni', 'etti', 'ondo'], fra: ['court', 'mont', 'lier', 'ard', 'ois', 'eau'], fra_af: ['ard', 'eau', 'ou', 'ane'],
  ned: ['huis', 'kamp', 'berg', 'stra', 'veld'], bel: ['mans', 'aert', 'eyn', 'ens'], yug: ['ović', 'ić', 'aković'], srb: ['ović', 'ić', 'enović'], cro: ['ić', 'ović', 'ec'],
  pol: ['ski', 'czak', 'ewicz', 'iak'], cze: ['ek', 'ník', 'áček', 'ovský'], rus: ['ov', 'in', 'enko', 'ski'], hun: ['ai', 'ényi', 'ássy', 'os'],
  aut: ['huber', 'egger', 'mayr', 'leitner'], sui: ['egger', 'mann', 'li', 'ler'], tur: ['oğlu', 'can', 'han', 'soy'], gre: ['akis', 'opoulos', 'idis'],
  gha: ['ey', 'ah', 'ku'], nga: ['ola', 'emi', 'ade'], cmr: ['ong', 'mbe', 'ola'], mar: ['ani', 'aoui', 'iri'], jpn: ['moto', 'mura', 'saki', 'hara'], kor: [],
};
function stemOf(name: string): string {
  // Namenszusätze („van“, „de“, „da“) überspringen: der Stamm kommt aus dem Hauptnamen.
  const core = name.split(/\s+/).pop()!.split('-')[0];
  const m = /^[^aeiouyäöüáàâãéèêíìîóòôõúùûåøæ]*[aeiouyäöüáàâãéèêíìîóòôõúùûåøæ]+[^aeiouyäöüáàâãéèêíìîóòôõúùûåøæ]?/i.exec(core);
  return m ? m[0] : name.slice(0, 3);
}
function inventSurname(rng: () => number, originId: string, pool: string[]): string {
  const ends = ENDINGS[originId];
  if (!ends || !ends.length) return pick(rng, pool);
  for (let t = 0; t < 8; t++) {
    const stem = stemOf(pick(rng, pool));
    const end = pick(rng, ends);
    const raw = stem + end;
    const name = (raw.charAt(0).toUpperCase() + raw.slice(1)).replace(/(.)\1\1/g, '$1$1');
    if (name.length >= 5 && !pool.includes(name)) return name;
  }
  return pick(rng, pool);
}

export function generateLegends(existing: LegendSeed[]): LegendSeed[] {
  const used = new Set(existing.map((l) => `${l.firstName} ${l.lastName}`));
  const out: LegendSeed[] = [];
  for (let year = 1940; year <= 2010; year++) {
    const rng = mulberry32(year * 7919 + 17);
    const slots: { rarity: LegendRarity; foreign: boolean; ddr: boolean }[] = [
      { rarity: rng() < 0.45 ? 'weltklasse' : 'national', foreign: false, ddr: false },
      { rarity: rng() < 0.5 ? 'national' : 'liebling', foreign: false, ddr: false },
      { rarity: rng() < 0.25 ? 'national' : 'liebling', foreign: false, ddr: false },
      { rarity: 'liebling', foreign: false, ddr: year <= 1975 && rng() < 0.4 },
      { rarity: rng() < 0.5 ? 'weltklasse' : 'national', foreign: true, ddr: false },
      { rarity: rng() < 0.4 ? 'national' : 'liebling', foreign: true, ddr: false },
    ];
    slots.forEach((slot, i) => {
      let pos = pickW(rng, POS_WEIGHTS);
      if (pos === 'LIB' && year > 1975) pos = 'VS';
      const types = LEGEND_ARCHETYPES.filter((a) => a.positions.includes(pos));
      const arch = types.length ? pick(rng, types) : LEGEND_ARCHETYPES[0];
      const originId = slot.foreign ? pickW(rng, FOREIGN_WEIGHTS) : (slot.ddr ? 'ger' : germanOrigin(year, rng));
      const o = ORIGINS[originId] ?? ORIGINS.ger;
      // Name: erfunden, eindeutig, nicht gesperrt.
      let first = '', last = '';
      for (let t = 0; t < 30; t++) {
        first = pick(rng, o.first);
        const german = originId === 'ger' || originId === 'ger_modern';
        last = german ? pick(rng, SYL_A) + pick(rng, SYL_B) : inventSurname(rng, originId, o.last);
        const full = `${first} ${last}`;
        if (!used.has(full) && !BLOCKED_NAMES.has(full) && first !== last) break;
      }
      used.add(`${first} ${last}`);
      const region = slot.foreign ? null : pick(rng, slot.ddr ? REGIONS_EAST : REGIONS_WEST);
      const curve: LegendCurve = pickW(rng, [['frueh', 1], ['normal', 2], ['spaet', 1]]);
      const [smin, smax] = SIG_RANGE[slot.rarity];
      const sigCount = slot.rarity === 'liebling' ? 1 : 1 + (rng() < 0.5 ? 1 : 0);
      const sigAttrs = [...arch.attrs].sort(() => rng() - 0.5).slice(0, sigCount);
      const signature = sigAttrs.map((a) => {
        const lo = smin + Math.floor(rng() * 3);
        return `${a}:${lo}-${Math.min(99, Math.max(lo + 2, smax - Math.floor(rng() * 2)))}`;
      });
      const where = slot.foreign ? `aus ${COUNTRY[originId] ?? 'dem Ausland'}` : region!.name;
      out.push({
        id: `lg_${year}_${i + 1}`,
        firstName: first, lastName: last, origin: o.id, position: pos, birthYear: year,
        peak: CAP[slot.rarity],
        cities: region ? region.cities : undefined,
        bio: `${pick(rng, BIO[arch.id] ?? BIO.motor)} Typ: ${arch.label} ${where}.`,
        professionalism: 45 + Math.floor(rng() * 50), ambition: 50 + Math.floor(rng() * 45),
        archetype: arch.id, rarity: slot.rarity, curve, signature,
        ddr: slot.ddr || undefined,
      });
    });
  }
  return out;
}
