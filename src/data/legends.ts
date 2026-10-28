// =============================================================================
// FIKTIVE LEGENDEN — Jahrhunderttalente, die zu festen Jahrgängen auftauchen
// -----------------------------------------------------------------------------
// Alle Namen sind erfunden. Jede Legende taucht mit 15 Jahren in der Jugend-
// akademie eines Vereins der eigenen Liga auf (gute Akademien und passende
// Regionen werden bevorzugt). Wo sie landet, entscheidet der Zufall – sicher
// ist nur, dass es sie gibt. Ob sie wirklich zur Legende wird, hängt von
// Training, Spielpraxis und Charakter ab.
// Legenden 2.0: Archetyp, Seltenheit (verdeckter Talent-Korridor),
// Entwicklungskurve und Signatur-Werte (data/legendArchetypes.ts). Neben den
// handverlesenen Legenden unten erzeugt data/legendsGenerated.ts für jeden
// Jahrgang 1940–2010 weitere (deterministisch, immer dieselben Namen).
// =============================================================================
import { Position } from '../types';
import type { LegendCurve, LegendRarity } from './legendArchetypes';
import { generateLegends } from './legendsGenerated';

export interface LegendSeed {
  id: string;
  firstName: string;
  lastName: string;
  /** Herkunft für Gesicht/Nationalität (data/origins.ts). */
  origin: string;
  position: Position;
  /** Geburtsjahr; Auftauchen mit 15 Jahren zum Jahrgangswechsel (1. Juli). */
  birthYear: number;
  /** Höchststärke, die erreichbar ist (wahres Potenzial). */
  peak: number;
  /** Bevorzugte Städte (Region der Herkunft), optional. */
  cities?: string[];
  /** Kurzer Steckbrief für Chronik und Scouting. */
  bio: string;
  /** Charakter: Professionalität/Ehrgeiz (0–100). */
  professionalism: number;
  ambition: number;
  // --- Legenden 2.0 (alle optional) ---
  /** Archetyp (data/legendArchetypes.ts), sonst Standard je Position. */
  archetype?: string;
  /** Seltenheit → verdeckter Talent-Korridor; sonst aus `peak` abgeleitet. */
  rarity?: LegendRarity;
  /** Entwicklungskurve: wann der Sprung kommt. */
  curve?: LegendCurve;
  /** Signatur-Werte im Höhepunkt, z. B. "heading:90-95". */
  signature?: string[];
  /** Historischer Jugendverein (Vereins-ID), bevorzugt beim Auftauchen. */
  homeClub?: string;
  /** DDR-Legende: vor der Wende nicht im Spiel, danach in der Region. */
  ddr?: boolean;
}

/** Handverlesene Legenden (Weltklasse). */
const CURATED: LegendSeed[] = [

  { id: 'lg_1961_tw', firstName: 'Bernd', lastName: 'Hollmann', origin: 'ger', position: 'TW', birthYear: 1961, peak: 93, cities: ['Köln', 'Mönchengladbach', 'Düsseldorf'], bio: 'Ein Torwart mit Nerven aus Stahl und Reflexen wie eine Katze.', professionalism: 85, ambition: 80 },
  { id: 'lg_1962_ms', firstName: 'Klaus', lastName: 'Brettschneider', origin: 'ger', position: 'MS', birthYear: 1962, peak: 94, cities: ['Gelsenkirchen', 'Dortmund', 'Bochum'], bio: 'Der Bomber aus dem Kohlenpott – trifft mit links, rechts und mit dem Kopf.', professionalism: 70, ambition: 90 },
  { id: 'lg_1964_lib', firstName: 'Wolfgang', lastName: 'Aschenbrenner', origin: 'ger', position: 'LIB', birthYear: 1964, peak: 94, cities: ['München', 'Nürnberg', 'Augsburg'], bio: 'Ein Libero, der das Spiel liest wie ein Buch und aus der Tiefe dirigiert.', professionalism: 90, ambition: 85 },
  { id: 'lg_1966_om', firstName: 'Mirko', lastName: 'Stanković', origin: 'yug', position: 'OM', birthYear: 1966, peak: 95, bio: 'Ein Spielmacher mit Zauberfuß, der Pässe sieht, die sonst niemand sieht.', professionalism: 60, ambition: 75 },
  { id: 'lg_1968_fl', firstName: 'Jürgen', lastName: 'Kesselring', origin: 'ger', position: 'FL', birthYear: 1968, peak: 92, cities: ['Stuttgart', 'Karlsruhe', 'Mannheim'], bio: 'Schnell wie der Wind, mit Flanken wie an der Schnur gezogen.', professionalism: 75, ambition: 80 },
  { id: 'lg_1970_vs', firstName: 'Thorsten', lastName: 'Rehbein', origin: 'ger', position: 'VS', birthYear: 1970, peak: 92, cities: ['Hamburg', 'Bremen', 'Hannover'], bio: 'Ein Verteidiger, an dem kein Stürmer vorbeikommt – fair, hart, unbeugsam.', professionalism: 88, ambition: 70 },
  { id: 'lg_1972_zm', firstName: 'Henrik', lastName: 'Thorvaldsen', origin: 'den', position: 'ZM', birthYear: 1972, peak: 93, bio: 'Läuft für zwei, denkt für drei: der Motor jeder Mannschaft.', professionalism: 92, ambition: 78 },
  { id: 'lg_1974_ms', firstName: 'Carlos', lastName: 'Ventura', origin: 'bra', position: 'MS', birthYear: 1974, peak: 96, bio: 'Dribbelt durch ganze Abwehrreihen – ein Straßenfußballer mit Weltklasse.', professionalism: 55, ambition: 85 },
  { id: 'lg_1977_dm', firstName: 'Ralf', lastName: 'Mühlenkamp', origin: 'ger', position: 'DM', birthYear: 1977, peak: 92, cities: ['Bielefeld', 'Paderborn', 'Münster'], bio: 'Der Staubsauger vor der Abwehr, der jeden Ball erobert.', professionalism: 85, ambition: 75 },
  { id: 'lg_1979_om', firstName: 'Dariusz', lastName: 'Wrona', origin: 'ger_pl', position: 'OM', birthYear: 1979, peak: 93, cities: ['Gelsenkirchen', 'Dortmund', 'Bochum', 'Essen'], bio: 'Ein Techniker, der mit dem Ball verschmilzt – und mit Freistößen Spiele entscheidet.', professionalism: 70, ambition: 88 },
  { id: 'lg_1981_tw', firstName: 'Sebastian', lastName: 'Kranichfeld', origin: 'ger', position: 'TW', birthYear: 1981, peak: 94, cities: ['Leipzig', 'Dresden', 'Rostock'], bio: 'Ein moderner Torwart, der mitspielt wie ein Feldspieler.', professionalism: 90, ambition: 85 },
  { id: 'lg_1983_av', firstName: 'Philipp', lastName: 'Sonnleitner', origin: 'ger', position: 'AV', birthYear: 1983, peak: 92, cities: ['München', 'Augsburg', 'Regensburg'], bio: 'Unermüdlich auf der Außenbahn, klug und torgefährlich.', professionalism: 95, ambition: 85 },
  { id: 'lg_1985_ms', firstName: 'Emre', lastName: 'Kalaycı', origin: 'ger_tr', position: 'MS', birthYear: 1985, peak: 93, cities: ['Berlin', 'Köln', 'Duisburg'], bio: 'Ein Vollstrecker mit Instinkt, der aus dem Nichts trifft.', professionalism: 65, ambition: 92 },
  { id: 'lg_1987_zm', firstName: 'Lukas', lastName: 'Bergfeld', origin: 'ger_modern', position: 'ZM', birthYear: 1987, peak: 94, cities: ['Frankfurt', 'Darmstadt', 'Mainz'], bio: 'Ein Taktgeber mit Übersicht, Ruhe und einem perfekten ersten Kontakt.', professionalism: 90, ambition: 80 },
  { id: 'lg_1989_fl', firstName: 'Kwame', lastName: 'Owusu-Reiter', origin: 'ger_af', position: 'FL', birthYear: 1989, peak: 93, cities: ['Hamburg', 'Hannover', 'Kiel'], bio: 'Explosiv, dribbelstark, unberechenbar – ein Albtraum für jeden Außenverteidiger.', professionalism: 72, ambition: 88 },
  { id: 'lg_1991_vs', firstName: 'Niklas', lastName: 'Achterberg', origin: 'ger_modern', position: 'VS', birthYear: 1991, peak: 93, cities: ['Dortmund', 'Bochum', 'Gelsenkirchen'], bio: 'Ein Innenverteidiger mit Spieleröffnung wie ein Mittelfeldspieler.', professionalism: 88, ambition: 82 },
  { id: 'lg_1993_om', firstName: 'Matteo', lastName: 'Lombardini', origin: 'ita', position: 'OM', birthYear: 1993, peak: 95, bio: 'Eleganz pur: Ballannahme, Drehung, tödlicher Pass – alles in einer Bewegung.', professionalism: 68, ambition: 84 },
  { id: 'lg_1995_ms', firstName: 'Jonas', lastName: 'Falkenrath', origin: 'ger_modern', position: 'MS', birthYear: 1995, peak: 94, cities: ['Stuttgart', 'Freiburg', 'Karlsruhe'], bio: 'Groß, schnell, kopfballstark – der komplette Mittelstürmer.', professionalism: 85, ambition: 90 },
  { id: 'lg_1997_dm', firstName: 'Ibrahim', lastName: 'Dossou-Holt', origin: 'ger_af', position: 'DM', birthYear: 1997, peak: 92, cities: ['Köln', 'Leverkusen', 'Düsseldorf'], bio: 'Ein Kraftpaket mit feinem Fuß, das ganze Spiele kontrolliert.', professionalism: 86, ambition: 80 },
  { id: 'lg_1999_tw', firstName: 'Mats', lastName: 'Lindgaard', origin: 'den', position: 'TW', birthYear: 1999, peak: 93, bio: 'Ein Torwart mit Ausstrahlung, der Elfmeter liest wie ein Buch.', professionalism: 90, ambition: 78 },
  { id: 'lg_2001_fl', firstName: 'Luca', lastName: 'Brandhorst', origin: 'ger_modern', position: 'FL', birthYear: 2001, peak: 95, cities: ['Hamburg', 'Bremen', 'Hannover'], bio: 'Tempo, Tricks, Torinstinkt – und keine Angst vor großen Spielen.', professionalism: 75, ambition: 92 },
  { id: 'lg_2003_zm', firstName: 'Yusuf', lastName: 'Erdoğdu', origin: 'ger_tr', position: 'ZM', birthYear: 2003, peak: 94, cities: ['Berlin', 'Frankfurt', 'Mannheim'], bio: 'Ein Box-to-Box-Spieler, der Tore schießt und vorbereitet.', professionalism: 84, ambition: 88 },
  { id: 'lg_2005_av', firstName: 'Noah', lastName: 'Kettelhoit', origin: 'ger_modern', position: 'AV', birthYear: 2005, peak: 92, cities: ['Münster', 'Bielefeld', 'Osnabrück'], bio: 'Ein offensiver Außenverteidiger mit unglaublicher Ausdauer.', professionalism: 90, ambition: 80 },
  { id: 'lg_2007_ms', firstName: 'Elias', lastName: 'Wendebourg', origin: 'ger_modern', position: 'MS', birthYear: 2007, peak: 96, cities: ['Leipzig', 'Halle', 'Dresden'], bio: 'Ein Jahrhunderttalent: kühl vor dem Tor, beidfüßig, schnell im Kopf.', professionalism: 88, ambition: 95 },
  { id: 'lg_2009_vs', firstName: 'Adrian', lastName: 'Kovač-Lenz', origin: 'cro', position: 'VS', birthYear: 2009, peak: 92, bio: 'Kopfballstark, zweikampfstark, ein Anführer schon mit 19.', professionalism: 87, ambition: 83 },
  { id: 'lg_2011_om', firstName: 'Finn', lastName: 'Rosenthal', origin: 'ger_modern', position: 'OM', birthYear: 2011, peak: 95, cities: ['Frankfurt', 'Kassel', 'Darmstadt'], bio: 'Ein Kreativspieler, der Räume findet, wo keine sind.', professionalism: 80, ambition: 90 },
  { id: 'lg_2014_tw', firstName: 'Tiago', lastName: 'Marinho', origin: 'por', position: 'TW', birthYear: 2014, peak: 93, bio: 'Ein Torwart wie eine Wand, mit präzisem Abwurf.', professionalism: 89, ambition: 82 },
  { id: 'lg_2017_fl', firstName: 'Samuel', lastName: 'Oduya-Brandt', origin: 'ger_af', position: 'FL', birthYear: 2017, peak: 95, cities: ['München', 'Nürnberg', 'Stuttgart'], bio: 'Der schnellste Spieler, den die Liga je gesehen hat.', professionalism: 78, ambition: 90 },
  { id: 'lg_2020_zm', firstName: 'Leon', lastName: 'Achenbach', origin: 'ger_modern', position: 'ZM', birthYear: 2020, peak: 94, cities: ['Köln', 'Bonn', 'Aachen'], bio: 'Ein Dirigent mit Weltklasse-Passspiel.', professionalism: 92, ambition: 86 },
  { id: 'lg_2024_ms', firstName: 'Milan', lastName: 'Hartwig', origin: 'ger_modern', position: 'MS', birthYear: 2024, peak: 96, bio: 'Ein Stürmer, über den man in 50 Jahren noch spricht.', professionalism: 86, ambition: 94 },
];

/** Alle Legenden: handverlesen + je Jahrgang erzeugt. Wird vom Datensatz ersetzt. */
export const LEGENDS: LegendSeed[] = [...CURATED, ...generateLegends(CURATED)];
