// =============================================================================
// TRAININGSLAGER – Unterkünfte und Anlagen je Ziel (Ziele/Quellen: data/campDestinations.ts,
// Wirkung: engine/trainingCamp.ts).
//
// Jede Unterkunft beschreibt ihre KLASSE; was die Klasse in einem Jahr bedeutet, legt die
// Rechnung je Epoche fest (Kraftraum vor 1985 nur Hantelraum, Eisbad ab 1998, Kältekammer
// ab 2012, Ernährungsplan wirkt erst ab den 2000ern voll – Annahme nach allgemeiner
// Entwicklung der Sportmedizin). Bauliche Daten der Sportschule Hennef nach [C8].
// Tagessätze in 1975-Basis für den ganzen Tross inkl. Verpflegung und Platzmiete.
// Namen sind beschreibend (keine Markennamen).
// =============================================================================

export type LodgingKind = 'sportschule' | 'pension' | 'hotel' | 'sporthotel' | 'resort' | 'zentrum';
export type LodgingRuns = 'duenen' | 'strand' | 'wald' | 'berg';

export interface CampLodging {
  id: string;
  name: string;
  kind: LodgingKind;
  /** Komfort 1 (Mehrbettzimmer/Pension) … 4 (Luxus/Resort). */
  tier: 1 | 2 | 3 | 4;
  /** Tagessatz für den Tross (1975-Basis). */
  rate: number;
  /** Erstes/letztes Jahr, in dem die Unterkunft buchbar ist. */
  from?: number;
  until?: number;
  /** Rasenplätze (eigene oder fest gemietete) und deren Pflegezustand 0–1. */
  pitches: number;
  pitchQ: number;
  /** Sporthalle bzw. Kunstrasenplatz vorhanden ab Jahr. */
  hall?: number;
  turf?: number;
  /** Kraftraum 0 keiner · 1 einfach · 2 gut ausgestattet. */
  gym: 0 | 1 | 2;
  /** Regeneration 0 nichts · 1 Sauna · 2 Bad/Massage/Physio · 3 Spitzenklasse (je Epoche). */
  regen: 0 | 1 | 2 | 3;
  /** Küche 0 Hausmannskost · 1 Sportlerküche · 2 eigener Koch/Ernährungsplan. */
  kitchen: 0 | 1 | 2;
  /** Abgeschiedenheit 0–1 und Ablenkung 0–1 (Strand, Nachtleben, Luxus). */
  quiet: number;
  lure: number;
  runs?: LodgingRuns;
  /** Abweichende Höhe (m) gegenüber dem Ort. */
  altitude?: number;
  note: string;
}

type Opt = Partial<Omit<CampLodging, 'id' | 'name' | 'kind' | 'tier' | 'rate' | 'note'>>;
const L = (id: string, name: string, kind: LodgingKind, tier: CampLodging['tier'], rate: number, o: Opt, note: string): CampLodging => ({
  id, name, kind, tier, rate, pitches: 2, pitchQ: 0.7, gym: 1, regen: 1, kitchen: 1, quiet: 0.5, lure: 0.2, ...o, note,
});

export const CAMP_LODGINGS: Record<string, CampLodging[]> = {
  // --- Sportschulen -------------------------------------------------------------------
  sportschule: [
    L('schule', 'Sportschule, Doppel- und Mehrbettzimmer', 'sportschule', 1, 1400, { pitches: 4, hall: 1975, gym: 1, quiet: 0.6, lure: 0.1, runs: 'wald' }, 'Verbandsschule mit mehreren Plätzen und Halle; Zimmer schlicht.'),
    L('stadthotel', 'Hotel in Kamen', 'hotel', 2, 1900, { until: 1989, pitches: 4, hall: 1975, regen: 1, quiet: 0.4, lure: 0.25 }, 'Einzelzimmer statt Lehrgangsbetten, Training auf den Plätzen der Schule.'),
    L('sporthotel', 'SportHotel auf dem Gelände', 'sporthotel', 2, 2100, { from: 1990, pitches: 4, pitchQ: 0.8, hall: 1975, turf: 2008, gym: 2, regen: 2, kitchen: 2, quiet: 0.5, lure: 0.15, runs: 'wald' }, 'Hotel und Schule eng verzahnt [C10]; Annahme: Hotelstandard ab 1990.'),
  ],
  hennef: [
    L('stammhaus', 'Stammhaus der Sportschule', 'sportschule', 1, 1400, { pitches: 5, hall: 1965, turf: 2005, gym: 1, regen: 2, quiet: 0.55, lure: 0.1, runs: 'wald' }, 'Halle mit Kunstrasen seit 1965, Hallenbad seit 1968 [C8].'),
    L('schleiden', 'Haus Schleiden (Hotelstandard)', 'sporthotel', 2, 2000, { from: 2006, pitches: 5, pitchQ: 0.85, hall: 1965, turf: 2005, gym: 2, regen: 3, kitchen: 2, quiet: 0.5, lure: 0.1, runs: 'wald' }, 'Neubau 2006, Hallenkomplex mit Wellness seit 2000 [C8].'),
  ],
  wedau: [
    L('schule', 'Sportschule, Bettenhaus', 'sportschule', 1, 1300, { pitches: 6, hall: 1975, turf: 2005, gym: 1, quiet: 0.45, lure: 0.2, runs: 'wald' }, 'Rund 400 Betten, viele Plätze, Läufe an der Regattabahn [C9].'),
    L('parkhotel', 'Hotel am Sportpark', 'hotel', 2, 2000, { pitches: 6, hall: 1975, regen: 2, quiet: 0.35, lure: 0.35 }, 'Komfortabler, aber mitten in Duisburg.'),
    L('gaestehaus', 'Modernisiertes Gästehaus', 'sporthotel', 2, 1900, { from: 1995, pitches: 6, pitchQ: 0.8, hall: 1975, turf: 2005, gym: 2, regen: 2, kitchen: 2, quiet: 0.45, lure: 0.2, runs: 'wald' }, 'Annahme: Modernisierung Mitte der 90er.'),
  ],
  gruenberg: [
    L('schule', 'Sportschule, Lehrgangszimmer', 'sportschule', 1, 1400, { pitches: 3, hall: 1975, quiet: 0.75, lure: 0.05, runs: 'wald' }, 'Kleinstadt, Wald, kaum Ablenkung.'),
    L('landgasthof', 'Landgasthof im Vogelsberg', 'pension', 1, 1300, { until: 1995, pitches: 1, pitchQ: 0.6, gym: 0, kitchen: 0, quiet: 0.9, lure: 0, runs: 'berg' }, 'Ein Dorfplatz, Feldwege bergauf – billig und hart.'),
    L('sporthotel', 'Sporthotel am Verbandsgelände', 'sporthotel', 2, 2100, { from: 1985, pitches: 3, pitchQ: 0.8, hall: 1975, turf: 2010, gym: 2, regen: 2, kitchen: 2, quiet: 0.7, lure: 0.05, runs: 'wald' }, 'Annahme: Sporthotel ab Mitte der 80er.'),
  ],
  barsinghausen: [
    L('schule', 'Sportschule, Mehrbettzimmer', 'sportschule', 1, 1400, { pitches: 4, hall: 1975, quiet: 0.65, lure: 0.05, runs: 'berg' }, 'Waldläufe am Deisterhang.'),
    L('hotel', 'Hotel im Ort', 'hotel', 2, 1900, { until: 1984, pitches: 4, hall: 1975, quiet: 0.5, lure: 0.15, runs: 'berg' }, 'Einzelzimmer, Training auf den Verbandsplätzen.'),
    L('sporthotel', 'Sporthotel am Deister', 'sporthotel', 2, 2200, { from: 1985, pitches: 4, pitchQ: 0.8, hall: 1975, turf: 2008, gym: 2, regen: 2, kitchen: 2, quiet: 0.6, lure: 0.05, runs: 'berg' }, 'Annahme: Sporthotel des Verbands ab Mitte der 80er.'),
  ],
  malente: [
    L('schule', 'Sportschule am See', 'sportschule', 1, 1500, { pitches: 3, pitchQ: 0.75, hall: 1975, quiet: 0.9, lure: 0.05, runs: 'wald' }, 'Spartanisch und abgeschieden wie 1974: Tischtennis unterm Dach statt Ausgang [C11].'),
    L('kurhotel', 'Kurhotel am Kellersee', 'hotel', 3, 2600, { pitches: 3, pitchQ: 0.75, regen: 2, quiet: 0.6, lure: 0.25 }, 'Training auf den Plätzen der Sportschule, Wohnen mit Seeblick.'),
  ],
  // --- Küste --------------------------------------------------------------------------
  norderney: [
    L('pension', 'Inselpension', 'pension', 1, 1500, { pitches: 1, pitchQ: 0.6, gym: 0, kitchen: 0, quiet: 0.7, lure: 0.2, runs: 'duenen' }, 'Ein Platz am Ortsrand, dafür Dünen ohne Ende.'),
    L('kurhotel', 'Kurhotel am Weststrand', 'hotel', 3, 2800, { pitches: 1, pitchQ: 0.65, regen: 2, quiet: 0.45, lure: 0.45, runs: 'duenen' }, 'Seewasser-Bäder, Kurkonzert, Promenade.'),
  ],
  sylt: [
    L('gaestehaus', 'Gästehaus in Rantum', 'pension', 1, 1700, { pitches: 1, pitchQ: 0.6, gym: 0, kitchen: 0, quiet: 0.8, lure: 0.15, runs: 'duenen' }, 'Ruhig zwischen den Dünen.'),
    L('strandhotel', 'Strandhotel Westerland', 'hotel', 3, 3200, { pitches: 1, pitchQ: 0.65, regen: 2, quiet: 0.3, lure: 0.75, runs: 'strand' }, 'Mitten im Nachtleben – die Stimmung steigt, die Disziplin leidet.'),
  ],
  timmendorf: [
    L('pension', 'Pension hinterm Deich', 'pension', 1, 1400, { pitches: 1, pitchQ: 0.6, gym: 0, kitchen: 0, quiet: 0.6, lure: 0.2, runs: 'strand' }, 'Billig und hart, im Winter auf gefrorenem Boden [C2].'),
    L('strandhotel', 'Strandhotel mit Sportplatz', 'hotel', 2, 2300, { pitches: 2, hall: 1980, regen: 2, quiet: 0.4, lure: 0.45, runs: 'strand' }, 'Hallenbad und Turnhalle im Ort (Annahme).'),
    L('wellness', 'Wellnesshotel an der Promenade', 'resort', 4, 3800, { from: 1998, pitches: 2, pitchQ: 0.8, hall: 1980, turf: 2010, gym: 2, regen: 3, kitchen: 2, quiet: 0.5, lure: 0.35, runs: 'strand' }, 'Annahme: Wellness-Ausbau der Ostseebäder in den späten 90ern.'),
  ],
  // --- Mittelgebirge ------------------------------------------------------------------
  harz: [
    L('gasthof', 'Gasthof im Oberharz', 'pension', 1, 1300, { pitches: 1, pitchQ: 0.6, gym: 0, kitchen: 0, quiet: 0.85, lure: 0.05, runs: 'berg' }, 'Steigerungsläufe am Hang [C13], abends Skat in der Gaststube.'),
    L('kurhotel', 'Kurhotel Braunlage', 'hotel', 2, 2100, { pitches: 2, hall: 1980, regen: 2, quiet: 0.6, lure: 0.15, runs: 'berg' }, 'Halle und Bäder im Kurort.'),
  ],
  schwarzwald: [
    L('gasthof', 'Schwarzwaldgasthof', 'pension', 1, 1500, { pitches: 1, pitchQ: 0.65, gym: 0, kitchen: 0, quiet: 0.85, lure: 0.05, runs: 'wald' }, 'Ruhe, Wald und gutes Essen.'),
    L('seehotel', 'Seehotel am Schluchsee', 'hotel', 3, 3000, { pitches: 2, pitchQ: 0.75, regen: 2, quiet: 0.55, lure: 0.3 }, 'Komfortabel – 1982 beim DFB mit bekannten Folgen für die Disziplin [C14].'),
    L('herzogenhorn', 'Leistungszentrum am Feldberg (1.350 m)', 'zentrum', 1, 1700, { altitude: 1350, pitches: 2, hall: 1975, gym: 2, quiet: 0.95, lure: 0, runs: 'berg' }, 'Hier bereitete sich Brasilien 1974 dreieinhalb Wochen vor [C14]. Leichte Höhenwirkung.'),
  ],
  sauerland: [
    L('pension', 'Pension in Schmallenberg', 'pension', 1, 1300, { pitches: 1, pitchQ: 0.6, gym: 0, kitchen: 0, quiet: 0.8, lure: 0.05, runs: 'wald' }, 'Einfach und ruhig.'),
    L('sporthotel', 'Sporthotel Winterberg', 'sporthotel', 2, 2200, { pitches: 2, hall: 1980, regen: 2, quiet: 0.6, lure: 0.15, runs: 'berg' }, 'Halle, Höhenwege, im Winter Loipen statt Rasen.'),
    L('resort', 'Sport- und Tagungsresort', 'resort', 3, 3200, { from: 2000, pitches: 2, pitchQ: 0.8, hall: 1980, turf: 2008, gym: 2, regen: 3, kitchen: 2, quiet: 0.55, lure: 0.2, runs: 'berg' }, 'Annahme: Resorts im Hochsauerland ab 2000.'),
  ],
  // --- Alpen --------------------------------------------------------------------------
  tegernsee: [
    L('gasthof', 'Gasthof in Kreuth', 'pension', 1, 1700, { pitches: 1, pitchQ: 0.75, gym: 0, kitchen: 0, quiet: 0.75, lure: 0.1, runs: 'berg' }, 'Hinten im Tal, weg vom Trubel am See.'),
    L('seehotel', 'Seehotel Rottach-Egern', 'hotel', 3, 3000, { pitches: 2, pitchQ: 0.85, regen: 2, quiet: 0.45, lure: 0.35 }, 'Der Klassiker am See [C1] – mit Zaungästen.'),
    L('luxus', 'Luxushotel am See', 'resort', 4, 4800, { from: 1995, pitches: 2, pitchQ: 0.9, gym: 2, regen: 3, kitchen: 2, quiet: 0.55, lure: 0.4 }, 'Spa, Sterneküche, abgeschirmter Trainingsplatz.'),
  ],
  tirol: [
    L('pension', 'Pension in Seefeld', 'pension', 1, 1600, { pitches: 1, pitchQ: 0.75, gym: 0, kitchen: 0, quiet: 0.7, lure: 0.15, runs: 'berg' }, 'Einfach, 1.180 m Höhe.'),
    L('sporthotel', 'Sporthotel im Ort', 'sporthotel', 2, 2500, { pitches: 2, pitchQ: 0.85, regen: 2, quiet: 0.55, lure: 0.25, runs: 'berg' }, 'Gute Plätze, Hallenbad.'),
    L('kitz', 'Golf- und Wellnesshotel Kitzbühel', 'resort', 4, 4500, { from: 1990, pitches: 2, pitchQ: 0.9, gym: 2, regen: 3, kitchen: 2, quiet: 0.45, lure: 0.55, altitude: 760 }, 'Prominenz, Kasino, Golfplatz.'),
  ],
  zillertal: [
    L('gasthof', 'Gasthof im Talschluss', 'pension', 1, 1500, { pitches: 1, pitchQ: 0.75, gym: 0, kitchen: 0, quiet: 0.85, lure: 0.05, runs: 'berg', altitude: 1100 }, 'Bergläufe vor der Tür.'),
    L('posthotel', 'Traditionshotel im Tal', 'sporthotel', 2, 2500, { pitches: 2, pitchQ: 0.85, regen: 2, kitchen: 1, quiet: 0.6, lure: 0.2, runs: 'berg' }, 'Training im Ortsstadion, Wohnen im Familienhotel [C16].'),
  ],
  salzburgerland: [
    L('pension', 'Pension in Maria Alm', 'pension', 1, 1500, { pitches: 1, pitchQ: 0.75, gym: 0, kitchen: 0, quiet: 0.75, lure: 0.1, runs: 'berg' }, 'Einfach und ruhig.'),
    L('sporthotel', 'Sporthotel in Saalfelden', 'sporthotel', 2, 2400, { pitches: 2, pitchQ: 0.85, regen: 2, quiet: 0.6, lure: 0.2 }, 'Solide Plätze, kurze Wege.'),
    L('gut', 'Gutshof mit eigener Sportanlage', 'resort', 3, 3200, { from: 1995, pitches: 3, pitchQ: 0.9, gym: 2, regen: 3, kitchen: 2, quiet: 0.7, lure: 0.15 }, 'Eigene Plätze am Hotel (vgl. Saalfelden 2023 [C15]).'),
  ],
  steiermark: [
    L('pension', 'Pension in Schladming', 'pension', 1, 1400, { pitches: 1, pitchQ: 0.75, gym: 0, kitchen: 0, quiet: 0.7, lure: 0.15, runs: 'berg' }, 'Am Fuß des Dachsteins.'),
    L('sporthotel', 'Sporthotel Schladming', 'sporthotel', 2, 2300, { pitches: 2, pitchQ: 0.85, regen: 2, quiet: 0.6, lure: 0.2, runs: 'berg' }, 'Gute Plätze, Hallenbad.'),
    L('therme', 'Thermenhotel in der Oststeiermark', 'resort', 3, 3200, { from: 1990, pitches: 2, pitchQ: 0.85, gym: 2, regen: 3, kitchen: 2, quiet: 0.55, lure: 0.3, altitude: 300 }, 'Thermalwasser zur Regeneration (Annahme).'),
  ],
  kaernten: [
    L('pension', 'Pension am Südufer', 'pension', 1, 1500, { pitches: 1, pitchQ: 0.7, gym: 0, kitchen: 0, quiet: 0.5, lure: 0.4 }, 'Badesee vor der Tür.'),
    L('seehotel', 'Seehotel in Velden', 'resort', 4, 4200, { pitches: 2, pitchQ: 0.8, regen: 2, quiet: 0.2, lure: 0.85 }, 'Promenade und Kasino – gut für die Laune, schlecht für den Zapfenstreich.'),
  ],
  schweiz: [
    L('sporthotel', 'Sporthotel Crans-Montana', 'sporthotel', 2, 3000, { pitches: 2, pitchQ: 0.9, regen: 2, quiet: 0.7, lure: 0.2 }, 'Hochplateau auf rund 1.500 m [C17].'),
    L('ragaz', 'Grand Resort im Rheintal', 'resort', 4, 5500, { from: 1995, altitude: 500, pitches: 2, pitchQ: 0.95, gym: 2, regen: 3, kitchen: 2, quiet: 0.65, lure: 0.35 }, 'Thermalbad und Spitzenküche (vgl. Bad Ragaz [C17]).'),
  ],
  engadin: [
    L('zentrum', 'Höhentrainingszentrum St. Moritz', 'zentrum', 2, 3200, { pitches: 1, pitchQ: 0.8, gym: 2, regen: 2, kitchen: 2, quiet: 0.8, lure: 0.2, runs: 'berg' }, 'Leichtathletikbahn, Kraftraum, 1.850 m [C18].'),
    L('saasfee', 'Berghotel Saas-Fee (1.800 m)', 'hotel', 3, 3600, { altitude: 1800, pitches: 1, pitchQ: 0.8, regen: 2, quiet: 0.9, lure: 0.1, runs: 'berg' }, 'Autofreies Bergdorf, sehr ruhig [C17].'),
    L('palace', 'Grandhotel St. Moritz', 'resort', 4, 6000, { from: 1990, pitches: 1, pitchQ: 0.85, gym: 2, regen: 3, kitchen: 2, quiet: 0.4, lure: 0.7 }, 'Mondän – Höhenluft mit Glamour.'),
  ],
  suedtirol: [
    L('gasthof', 'Gasthof im Passeiertal', 'pension', 1, 1500, { pitches: 1, pitchQ: 0.75, gym: 0, kitchen: 1, quiet: 0.85, lure: 0.05, runs: 'berg' }, 'Abgeschieden; das Tal des DFB von 2014 [C19].'),
    L('weinhotel', 'Hotel in Eppan', 'hotel', 3, 3000, { pitches: 2, pitchQ: 0.85, regen: 2, kitchen: 2, quiet: 0.6, lure: 0.3 }, 'Weinberge, gute Küche, „guter Geist“ [C19].'),
    L('kronplatz', 'Sport- und Wellnessresort bei Bruneck', 'resort', 4, 4500, { from: 2000, altitude: 900, pitches: 3, pitchQ: 0.9, gym: 2, regen: 3, kitchen: 2, quiet: 0.55, lure: 0.3 }, 'Moderne Anlage (vgl. Bruneck 2023 [C15]).'),
  ],
  // --- Süden --------------------------------------------------------------------------
  kanaren: [
    L('apart', 'Appartementhotel an der Playa', 'hotel', 1, 1800, { pitches: 1, pitchQ: 0.6, gym: 0, kitchen: 0, quiet: 0.2, lure: 0.6 }, 'Pauschaltouristen nebenan, Platz in der Stadt.'),
    L('hotel', 'Hotel mit Sportplatz', 'hotel', 2, 2600, { pitches: 1, pitchQ: 0.7, quiet: 0.45, lure: 0.35 }, 'Eigener Platz, mäßiger Rasen.'),
    L('resort', 'Sportresort im Süden der Insel', 'resort', 3, 3500, { from: 1995, pitches: 3, pitchQ: 0.85, gym: 2, regen: 3, kitchen: 2, quiet: 0.55, lure: 0.4 }, 'Annahme: Sportresorts ab Mitte der 90er.'),
  ],
  spanien: [
    L('hotel', 'Strandhotel an der Costa del Sol', 'hotel', 2, 2200, { pitches: 1, pitchQ: 0.7, quiet: 0.25, lure: 0.65 }, 'Günstig, aber mitten im Urlaubsbetrieb.'),
    L('marbella', 'Luxushotel Marbella', 'resort', 4, 4500, { from: 1985, pitches: 2, pitchQ: 0.85, gym: 2, regen: 3, kitchen: 2, quiet: 0.3, lure: 0.8 }, 'Yachthafen, Glamour, Nachtleben.'),
    L('jerez', 'Golfresort bei Jerez', 'resort', 3, 3200, { from: 2000, pitches: 3, pitchQ: 0.9, gym: 2, regen: 3, kitchen: 2, quiet: 0.7, lure: 0.25 }, 'Ruhiger, viele Plätze [C7].'),
  ],
  mallorca: [
    L('playa', 'Hotel an der Playa de Palma', 'hotel', 1, 1800, { pitches: 1, pitchQ: 0.65, gym: 0, kitchen: 0, quiet: 0.1, lure: 0.9 }, 'Billig – und die Party ist direkt nebenan.'),
    L('finca', 'Sporthotel im Inselinneren', 'sporthotel', 3, 3000, { from: 1995, pitches: 2, pitchQ: 0.85, gym: 2, regen: 2, kitchen: 2, quiet: 0.8, lure: 0.2 }, 'Abgeschieden zwischen Mandelbäumen.'),
  ],
  lamanga: [
    L('apart', 'Appartements am Mar Menor', 'hotel', 1, 2000, { pitches: 8, pitchQ: 0.85, kitchen: 0, quiet: 0.5, lure: 0.35 }, 'Selbstversorger, Plätze des Clubs mitgemietet [C20].'),
    L('club', 'Clubhotel auf der Anlage', 'resort', 3, 3200, { pitches: 8, pitchQ: 0.9, gym: 2, regen: 2, kitchen: 2, quiet: 0.75, lure: 0.2 }, 'Acht Fußballplätze direkt am Hotel [C20].'),
  ],
  algarve: [
    L('hotel', 'Hotel in Albufeira', 'hotel', 1, 1900, { pitches: 1, pitchQ: 0.75, kitchen: 0, quiet: 0.3, lure: 0.6 }, 'Belebte Altstadt.'),
    L('golf', 'Golfhotel bei Almancil', 'resort', 3, 3200, { pitches: 2, pitchQ: 0.9, gym: 2, regen: 2, kitchen: 2, quiet: 0.7, lure: 0.3 }, 'Gepflegte Rasenplätze, Ruhe.'),
  ],
  malta: [
    L('hotel', 'Stadthotel in St. Julian’s', 'hotel', 2, 2000, { pitches: 1, pitchQ: 0.65, quiet: 0.3, lure: 0.55 }, 'Wenige gute Plätze auf der Insel.'),
  ],
  tuerkei: [
    L('hotel', 'Strandhotel bei Antalya', 'hotel', 1, 1300, { pitches: 1, pitchQ: 0.7, kitchen: 0, quiet: 0.3, lure: 0.5 }, 'Die frühen Jahre: einfach und günstig.'),
    L('resort', 'All-inclusive-Resort in Belek', 'resort', 3, 2400, { from: 1996, pitches: 4, pitchQ: 0.9, gym: 2, regen: 3, kitchen: 2, quiet: 0.45, lure: 0.5 }, 'Viele Teams, viele Berater, Buffet ohne Ende [C3].'),
    L('luxus', 'Luxusresort mit eigenem Trainingszentrum', 'resort', 4, 3800, { from: 2005, pitches: 5, pitchQ: 0.95, gym: 2, regen: 3, kitchen: 2, quiet: 0.6, lure: 0.4 }, 'Abgeschirmte Plätze, Physio-Abteilung im Haus.'),
  ],
  zypern: [
    L('hotel', 'Hotel in Limassol', 'hotel', 2, 2000, { pitches: 1, pitchQ: 0.7, quiet: 0.35, lure: 0.45 }, 'Stadtnah, Platz im Ort.'),
    L('resort', 'Resort bei Paphos', 'resort', 3, 2800, { from: 2005, pitches: 2, pitchQ: 0.85, gym: 2, regen: 2, kitchen: 2, quiet: 0.65, lure: 0.3 }, 'Ruhig, gute Plätze.'),
  ],
  // --- Fernreisen ---------------------------------------------------------------------
  florida: [
    L('hotel', 'Hotel in Orlando', 'hotel', 2, 3000, { pitches: 2, pitchQ: 0.85, gym: 2, regen: 2, quiet: 0.3, lure: 0.6 }, 'Freizeitparks in der Nähe.'),
    L('academy', 'Sportakademie bei Bradenton', 'zentrum', 3, 4200, { from: 2000, pitches: 6, pitchQ: 0.95, gym: 2, regen: 3, kitchen: 2, quiet: 0.75, lure: 0.2 }, 'Campus mit vielen Plätzen und Sportwissenschaft.'),
  ],
  dubai: [
    L('hotel', 'Stadthotel in Dubai', 'hotel', 3, 3500, { pitches: 1, pitchQ: 0.9, gym: 2, regen: 2, quiet: 0.25, lure: 0.65 }, 'Malls und Strände.'),
    L('palast', 'Luxusresort am Golf', 'resort', 4, 5500, { pitches: 2, pitchQ: 0.95, gym: 2, regen: 3, kitchen: 2, quiet: 0.55, lure: 0.6 }, 'Perfekte Plätze, perfekter Luxus [C5].'),
  ],
  katar: [
    L('aspire', 'Gästehaus der Sportakademie', 'zentrum', 4, 4500, { pitches: 6, pitchQ: 1, gym: 2, regen: 3, kitchen: 2, quiet: 0.7, lure: 0.3 }, 'Beste Bedingungen [C4].'),
  ],
  suedafrika: [
    L('kapstadt', 'Hotel an der Waterfront, Kapstadt', 'hotel', 3, 3400, { pitches: 2, pitchQ: 0.85, gym: 2, regen: 2, kitchen: 2, quiet: 0.3, lure: 0.55 }, 'Meer, Tafelberg, Testspiele gegen Klubs der Premier Soccer League [C22].'),
    L('highveld', 'Sporthotel auf dem Highveld bei Johannesburg', 'sporthotel', 3, 3200, { pitches: 3, pitchQ: 0.85, gym: 2, regen: 2, kitchen: 2, quiet: 0.6, lure: 0.25, altitude: 1600 }, 'Rund 1.600 m hoch: Höhenreiz wie in den Alpen, aber im Hochsommer [C23].'),
  ],
  asien: [
    L('tour', 'Tourhotels in den Metropolen', 'hotel', 4, 3800, { pitches: 1, pitchQ: 0.75, regen: 2, quiet: 0.1, lure: 0.5 }, 'Jede Nacht eine andere Stadt [C6].'),
  ],
  usatour: [
    L('tour', 'Tourhotels an der Küste', 'hotel', 4, 3800, { pitches: 1, pitchQ: 0.8, gym: 2, regen: 2, quiet: 0.15, lure: 0.5 }, 'Spiele in großen Stadien, viel Reiserei [C6].'),
  ],
};

/** Buchbare Unterkünfte eines Ziels im Jahr (günstigste zuerst). */
export function lodgingsFor(destId: string, year: number): CampLodging[] {
  return (CAMP_LODGINGS[destId] ?? []).filter((l) => (l.from ?? 0) <= year && (l.until ?? 9999) >= year).sort((a, b) => a.rate - b.rate);
}

/** Standard-Unterkunft (günstigste buchbare; für alte Spielstände und Vorauswahl). */
export function defaultLodging(destId: string, year: number): CampLodging | undefined {
  return lodgingsFor(destId, year)[0] ?? CAMP_LODGINGS[destId]?.[0];
}

export function campLodging(destId: string, id: string | undefined): CampLodging | undefined {
  return CAMP_LODGINGS[destId]?.find((l) => l.id === id);
}

export const LODGING_KIND_LABEL: Record<LodgingKind, string> = {
  sportschule: 'Sportschule', pension: 'Pension', hotel: 'Hotel', sporthotel: 'Sporthotel', resort: 'Resort', zentrum: 'Leistungszentrum',
};
export const LODGING_RUNS_LABEL: Record<LodgingRuns, string> = {
  duenen: 'Dünenläufe', strand: 'Strandläufe', wald: 'Waldläufe', berg: 'Bergläufe',
};
