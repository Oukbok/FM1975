// =============================================================================
// LAGE DER VEREINSSTÄDTE für die Vorschau „Nächstes Spiel“ (screens/prematch/PrematchMap.tsx):
// Karte mit beiden Vereinen und Distanz (Luftlinie). Nur Anzeige – keine Spielwirkung.
// Koordinaten: Stadtzentren (Breite, Länge in Grad, WGS84, auf 2 Nachkommastellen gerundet)
// nach Wikipedia/GeoNames. Regionen ohne Stadt (Altmark, Lausitz, Vogtland …) = Hauptort
// bzw. Mitte der Region (im Kommentar genannt). Vereinsnamen mit Stadtteil/Farbe
// („Istanbul Gelb-Rot“, „Charlton“, „Partick“) laufen über ALIAS auf die Stadt.
// Fehlt ein Ort: Landesmitte (COUNTRY), sonst keine Markierung.
// =============================================================================

export type LatLon = [number, number];

const DE: Record<string, LatLon> = {
  Aachen: [50.78, 6.08], Aalen: [48.84, 10.09], Ahlen: [51.76, 7.89], Altenburg: [50.99, 12.43],
  Altmark: [52.64, 11.40], // Mitte der Altmark (zwischen Gardelegen und Stendal)
  Aschaffenburg: [49.97, 9.15], Aue: [50.59, 12.70], Augsburg: [48.37, 10.90], 'Bad Kreuznach': [49.84, 7.87],
  Bamberg: [49.89, 10.89], Baunatal: [51.25, 9.42], Bautzen: [51.18, 14.42], Bayreuth: [49.95, 11.58],
  Berlin: [52.52, 13.40], 'Berlin (Ost)': [52.51, 13.45], Bielefeld: [52.02, 8.53], Bocholt: [51.84, 6.62],
  Bochum: [51.48, 7.22], Bonn: [50.74, 7.10], Bottrop: [51.52, 6.93], Brandenburg: [52.41, 12.53],
  Braunschweig: [52.27, 10.52], Bremen: [53.08, 8.80], Bremerhaven: [53.55, 8.58], Burghausen: [48.17, 12.83],
  Celle: [52.62, 10.08], Chemnitz: [50.83, 12.92], Coburg: [50.26, 10.96], Cottbus: [51.76, 14.33],
  Cuxhaven: [53.86, 8.69], Darmstadt: [49.87, 8.65], Delmenhorst: [53.05, 8.63], Dessau: [51.83, 12.24],
  Dortmund: [51.51, 7.47], Dresden: [51.05, 13.74], Duisburg: [51.43, 6.76], Düren: [50.80, 6.48],
  Düsseldorf: [51.23, 6.78], Eberswalde: [52.83, 13.82], Eisenhüttenstadt: [52.15, 14.64],
  Elstertal: [50.66, 12.20], // Tal der Weißen Elster, Hauptort Greiz
  Elversberg: [49.32, 7.13], Emden: [53.37, 7.21], Erfurt: [50.98, 11.03], Erkenschwick: [51.64, 7.25],
  Erlangen: [49.59, 11.00], Essen: [51.46, 7.01], Esslingen: [48.74, 9.31], Flensburg: [54.78, 9.44],
  Frankfurt: [50.11, 8.68], 'Frankfurt (Oder)': [52.34, 14.55], Freiberg: [50.91, 13.34], Freiburg: [47.99, 7.84],
  Fulda: [50.55, 9.68], Fürstenwalde: [52.36, 14.06], Fürth: [49.48, 10.99], Gelsenkirchen: [51.51, 7.10],
  Gera: [50.88, 12.08], Gießen: [50.58, 8.68], Görlitz: [51.15, 14.99], Goslar: [51.91, 10.43], Gotha: [50.95, 10.70],
  Göttingen: [51.54, 9.93], Greifswald: [54.09, 13.38], Gütersloh: [51.91, 8.38], Hagen: [51.36, 7.47],
  Halberstadt: [51.90, 11.05], Halle: [51.48, 11.97], Hamburg: [53.55, 9.99], Hamm: [51.68, 7.82], Hanau: [50.13, 8.92],
  Hannover: [52.37, 9.73],
  Harzberg: [51.83, 10.78], // Harz (Raum Wernigerode)
  Havelberg: [52.83, 12.07], Heidelberg: [49.40, 8.69], Heidenheim: [48.68, 10.15], Heilbronn: [49.14, 9.22],
  Herford: [52.11, 8.67], Herne: [51.54, 7.22], Hildesheim: [52.15, 9.95], Hof: [50.31, 11.92], Hoffenheim: [49.28, 8.84],
  Homburg: [49.33, 7.34], Hoyerswerda: [51.44, 14.24], Ingolstadt: [48.77, 11.43], Jena: [50.93, 11.59],
  Kaiserslautern: [49.44, 7.77], Karlsruhe: [49.01, 8.40], Kassel: [51.31, 9.48], Kempten: [47.73, 10.31],
  Kiel: [54.32, 10.14], Koblenz: [50.36, 7.59], Köln: [50.94, 6.96], Krefeld: [51.34, 6.56], Landshut: [48.54, 12.15],
  Lausitz: [51.55, 14.20], // Mitte der Lausitz (Raum Spremberg)
  Leipzig: [51.34, 12.37], Leverkusen: [51.03, 6.98], Lippstadt: [51.67, 8.35], Lübeck: [53.87, 10.69],
  Ludwigsburg: [48.90, 9.19], Ludwigshafen: [49.48, 8.44], Lüdenscheid: [51.22, 7.63], Lüneburg: [53.25, 10.41],
  Magdeburg: [52.13, 11.63], Mainz: [50.00, 8.27], Mannheim: [49.49, 8.47], Marburg: [50.81, 8.77], Marl: [51.66, 7.09],
  Meißen: [51.16, 13.47], Memmingen: [47.99, 10.18], Meppen: [52.69, 7.29], Merseburg: [51.36, 12.00],
  Mönchengladbach: [51.19, 6.44],
  Muldental: [51.24, 12.73], // Hauptort Grimma
  Mülheim: [51.43, 6.88], München: [48.14, 11.58], Münster: [51.96, 7.63], Neubrandenburg: [53.56, 13.26],
  Neumünster: [54.07, 9.99], Neunkirchen: [49.35, 7.18], Neuruppin: [52.93, 12.80], Neuss: [51.20, 6.69],
  Nordhausen: [51.50, 10.79], Nürnberg: [49.45, 11.08], Oberhausen: [51.47, 6.85],
  Oderbruch: [52.53, 14.38], // Hauptort Seelow
  Offenbach: [50.10, 8.77], Oldenburg: [53.14, 8.21], Osnabrück: [52.28, 8.05], Paderborn: [51.72, 8.75],
  Passau: [48.57, 13.43], Pforzheim: [48.89, 8.70], Pirmasens: [49.20, 7.60], Plauen: [50.50, 12.14],
  Potsdam: [52.39, 13.07], Recklinghausen: [51.61, 7.20], Regensburg: [49.01, 12.10], Remscheid: [51.18, 7.19],
  Reutlingen: [48.49, 9.21], Riesa: [51.31, 13.29], Rostock: [54.09, 12.10], Saalfeld: [50.65, 11.36],
  Saarbrücken: [49.23, 7.00], Salzgitter: [52.15, 10.33], Sandhausen: [49.34, 8.66], Schweinfurt: [50.05, 10.23],
  Schwedt: [53.06, 14.28], Schwerin: [53.63, 11.41], Siegen: [50.87, 8.02], Solingen: [51.17, 7.08],
  Speyer: [49.32, 8.43], Steinach: [50.43, 11.16], Stendal: [52.61, 11.86], Stralsund: [54.31, 13.09],
  Straubing: [48.88, 12.57], Stuttgart: [48.78, 9.18], Suhl: [50.61, 10.69], Trier: [49.75, 6.64],
  Uckermark: [53.32, 13.86], // Hauptort Prenzlau
  Ulm: [48.40, 9.99], Unterhaching: [48.07, 11.62], Vestenbergsgreuth: [49.69, 10.65],
  Vogtland: [50.50, 12.14], // Hauptort Plauen
  Völklingen: [49.25, 6.86], Wattenscheid: [51.48, 7.13], Weimar: [50.98, 11.33], Wiesbaden: [50.08, 8.24],
  Wilhelmshaven: [53.53, 8.11], Wismar: [53.89, 11.47], Wittenberg: [51.87, 12.65], Wittenberge: [53.00, 11.75],
  Wolfsburg: [52.42, 10.79], Worms: [49.63, 8.36], Wuppertal: [51.26, 7.15], Würzburg: [49.79, 9.95],
  Zwickau: [50.72, 12.49],
};

const ABROAD: Record<string, LatLon> = {
  // England & Wales
  Birmingham: [52.49, -1.89], Blackburn: [53.75, -2.48], Blackpool: [53.82, -3.05], Bolton: [53.58, -2.43],
  Bradford: [53.80, -1.75], Brighton: [50.82, -0.14], Bristol: [51.45, -2.59], Burnley: [53.79, -2.25],
  Cardiff: [51.48, -3.18], Carlisle: [54.89, -2.93], Coventry: [52.41, -1.51], Derby: [52.92, -1.48], Hull: [53.74, -0.33],
  Ipswich: [52.06, 1.16], Leeds: [53.80, -1.55], Leicester: [52.64, -1.13], Liverpool: [53.41, -2.98], London: [51.51, -0.13],
  Luton: [51.88, -0.42], Manchester: [53.48, -2.24], Middlesbrough: [54.57, -1.23], Newcastle: [54.98, -1.61],
  Norwich: [52.63, 1.30], Nottingham: [52.95, -1.15], Oldham: [53.54, -2.12], Oxford: [51.75, -1.26],
  Plymouth: [50.38, -4.14], Portsmouth: [50.80, -1.09], Preston: [53.76, -2.70], Reading: [51.45, -0.97],
  Sheffield: [53.38, -1.47], Southampton: [50.90, -1.40], 'Stoke-on-Trent': [53.00, -2.18], Sunderland: [54.91, -1.38],
  Swansea: [51.62, -3.94], Walsall: [52.59, -1.98], Watford: [51.66, -0.40], Wolverhampton: [52.59, -2.13], York: [53.96, -1.08],
  // Schottland
  Aberdeen: [57.15, -2.09], Airdrie: [55.87, -3.98], Arbroath: [56.56, -2.58], Ayr: [55.46, -4.63], Clydebank: [55.90, -4.40],
  Dumbarton: [55.94, -4.57], Dundee: [56.46, -2.97], Dunfermline: [56.07, -3.45], Edinburgh: [55.95, -3.19],
  Falkirk: [56.00, -3.78], Glasgow: [55.86, -4.25], Greenock: [55.95, -4.76], Hamilton: [55.78, -4.04],
  Inverness: [57.48, -4.22], Kilmarnock: [55.61, -4.50], Kirkcaldy: [56.11, -3.16], Montrose: [56.71, -2.47],
  Motherwell: [55.79, -3.99], Paisley: [55.85, -4.42], Perth: [56.40, -3.43], Stirling: [56.12, -3.94],
  // Italien
  Ascoli: [42.85, 13.58], Avellino: [40.91, 14.79], Bari: [41.12, 16.87], Bergamo: [45.70, 9.67], Bologna: [44.49, 11.34],
  Brescia: [45.54, 10.22], Cagliari: [39.22, 9.12], Catania: [37.50, 15.09], Cesena: [44.14, 12.24], Como: [45.81, 9.09],
  Florenz: [43.77, 11.26], Foggia: [41.46, 15.54], Genua: [44.41, 8.93], Lecce: [40.35, 18.17], Mailand: [45.46, 9.19],
  Modena: [44.65, 10.93], Neapel: [40.85, 14.27], Palermo: [38.12, 13.36], Parma: [44.80, 10.33], Perugia: [43.11, 12.39],
  Pescara: [42.46, 14.21], Rom: [41.90, 12.50], Taranto: [40.47, 17.24], Terni: [42.56, 12.65], Turin: [45.07, 7.69],
  Udine: [46.06, 13.24], Varese: [45.82, 8.83], Verona: [45.44, 10.99], Vicenza: [45.55, 11.55],
  // Spanien
  Alicante: [38.35, -0.48], Barcelona: [41.39, 2.17], Bilbao: [43.26, -2.93], Burgos: [42.34, -3.70], Cádiz: [36.53, -6.29],
  Castellón: [39.99, -0.05], Córdoba: [37.89, -4.78], Elche: [38.27, -0.70], Gijón: [43.54, -5.66], Granada: [37.18, -3.60],
  Huelva: [37.26, -6.95], 'La Coruña': [43.36, -8.41], 'Las Palmas': [28.12, -15.44], Logroño: [42.47, -2.45],
  Madrid: [40.42, -3.70], Málaga: [36.72, -4.42], Mallorca: [39.57, 2.65], Murcia: [37.99, -1.13], Oviedo: [43.36, -5.85],
  Pamplona: [42.81, -1.64], Salamanca: [40.97, -5.66], 'San Sebastián': [43.32, -1.98], Santander: [43.46, -3.81],
  Saragossa: [41.65, -0.89], Sevilla: [37.39, -5.98], Valencia: [39.47, -0.38], Valladolid: [41.65, -4.72], Vigo: [42.24, -8.72],
  // Frankreich & Monaco
  Angers: [47.47, -0.55], Auxerre: [47.80, 3.57], Bastia: [42.70, 9.45], Bordeaux: [44.84, -0.58], Brest: [48.39, -4.49],
  Caen: [49.18, -0.37], Laval: [48.07, -0.77], 'Le Havre': [49.49, 0.11], Lens: [50.43, 2.83], Lille: [50.63, 3.06],
  Lyon: [45.76, 4.84], Marseille: [43.30, 5.37], Metz: [49.12, 6.18], Monaco: [43.74, 7.42], Montpellier: [43.61, 3.88],
  Nancy: [48.69, 6.18], Nantes: [47.22, -1.55], Nimes: [43.84, 4.36], Nizza: [43.70, 7.27], Paris: [48.86, 2.35],
  Reims: [49.26, 4.03], Rennes: [48.11, -1.68], Rouen: [49.44, 1.10], 'Saint-Etienne': [45.43, 4.39], Sochaux: [47.51, 6.83],
  Straßburg: [48.57, 7.75], Toulouse: [43.60, 1.44], Troyes: [48.30, 4.08], Valenciennes: [50.36, 3.52],
  // Niederlande
  Alkmaar: [52.63, 4.75], Amsterdam: [52.37, 4.90], Arnheim: [51.98, 5.91], Breda: [51.59, 4.78], 'Den Haag': [52.08, 4.30],
  Deventer: [52.25, 6.16], Dordrecht: [51.81, 4.67], Eindhoven: [51.44, 5.47], Enschede: [52.22, 6.89], Groningen: [53.22, 6.57],
  Haarlem: [52.38, 4.64], Heerenveen: [52.96, 5.92], Helmond: [51.48, 5.66], Kerkrade: [50.87, 6.06], Leeuwarden: [53.20, 5.80],
  Maastricht: [50.85, 5.69], Nimwegen: [51.84, 5.86], Rotterdam: [51.92, 4.48], Sittard: [51.00, 5.87], Tilburg: [51.56, 5.09],
  Utrecht: [52.09, 5.12], Venlo: [51.37, 6.17], Volendam: [52.50, 5.07], Zwolle: [52.52, 6.08],
  // Belgien
  Antwerpen: [51.22, 4.40], Beveren: [51.21, 4.26], Bruegge: [51.21, 3.22], Bruessel: [50.85, 4.35], Charleroi: [50.41, 4.44],
  Genk: [50.97, 5.50], Gent: [51.05, 3.72], Hasselt: [50.93, 5.34], Kortrijk: [50.83, 3.26], Lier: [51.13, 4.57],
  Lokeren: [51.10, 3.99], Luettich: [50.63, 5.57], Mechelen: [51.03, 4.48], Namur: [50.47, 4.87], Ostende: [51.23, 2.92],
  Seraing: [50.60, 5.51], Tongeren: [50.78, 5.46], Waregem: [50.89, 3.43],
  // Portugal
  Aveiro: [40.64, -8.65], Barreiro: [38.66, -9.07], Braga: [41.55, -8.42], Chaves: [41.74, -7.47], Coimbra: [40.21, -8.43],
  Estoril: [38.70, -9.40], Faro: [37.02, -7.93], Funchal: [32.65, -16.91], Guimarães: [41.44, -8.29], Leiria: [39.74, -8.81],
  Lissabon: [38.72, -9.14], Penafiel: [41.21, -8.28], Portimão: [37.14, -8.54], Porto: [41.15, -8.61], Setúbal: [38.52, -8.89],
  Viseu: [40.66, -7.91],
  // Österreich & Schweiz
  Dornbirn: [47.41, 9.74], Graz: [47.07, 15.44], Innsbruck: [47.27, 11.39], Kapfenberg: [47.44, 15.29], Klagenfurt: [46.62, 14.31],
  Linz: [48.31, 14.29], Salzburg: [47.81, 13.04], 'St. Pölten': [48.20, 15.63], Steyr: [48.04, 14.42], Villach: [46.61, 13.85],
  Wels: [48.16, 14.03], Wien: [48.21, 16.37], 'Wiener Neustadt': [47.81, 16.24],
  Aarau: [47.39, 8.04], Basel: [47.56, 7.59], Bellinzona: [46.19, 9.02], Bern: [46.95, 7.45], Chiasso: [45.83, 9.03],
  Genf: [46.20, 6.14], Grenchen: [47.19, 7.40], Lausanne: [46.52, 6.63], Lugano: [46.00, 8.95], Luzern: [47.05, 8.31],
  Neuenburg: [46.99, 6.93], Sitten: [46.23, 7.36], 'St. Gallen': [47.42, 9.38], Winterthur: [47.50, 8.72], Zuerich: [47.38, 8.54],
  // Skandinavien
  Åtvidaberg: [58.20, 16.00], Gävle: [60.67, 17.14], Göteborg: [57.71, 11.97], Halmstad: [56.67, 12.86], Helsingborg: [56.05, 12.69],
  Kalmar: [56.66, 16.36], Landskrona: [55.87, 12.83], Malmoe: [55.60, 13.00], Norrköping: [58.59, 16.19], Örebro: [59.27, 15.21],
  Östersund: [63.18, 14.64], Stockholm: [59.33, 18.07], Sundsvall: [62.39, 17.31], Uppsala: [59.86, 17.64], Västerås: [59.61, 16.55],
  Aalborg: [57.05, 9.92], Aarhus: [56.16, 10.20], Brøndby: [55.65, 12.42], Esbjerg: [55.48, 8.46], Herning: [56.14, 8.97],
  Horsens: [55.86, 9.85], Køge: [55.46, 12.18], Kopenhagen: [55.68, 12.57], Næstved: [55.23, 11.76], Odense: [55.40, 10.39],
  Randers: [56.46, 10.04], Silkeborg: [56.17, 9.55], Vejle: [55.71, 9.54],
  // Jugoslawien und Nachfolgestaaten
  'Banja Luka': [44.77, 17.19], Belgrad: [44.79, 20.45], Dubrovnik: [42.65, 18.09], Karlovac: [45.49, 15.55], Koprivnica: [46.16, 16.83],
  Kragujevac: [44.01, 20.91], Ljubljana: [46.06, 14.51], Maribor: [46.55, 15.65], Mostar: [43.34, 17.81], Niš: [43.32, 21.90],
  'Novi Sad': [45.27, 19.83], Osijek: [45.55, 18.69], Priština: [42.66, 21.17], Pula: [44.87, 13.85], Rijeka: [45.33, 14.44],
  Sarajevo: [43.86, 18.41], Šibenik: [43.73, 15.90], Skopje: [42.00, 21.43], Split: [43.51, 16.44], Subotica: [46.10, 19.67],
  Titograd: [42.44, 19.26], Tuzla: [44.54, 18.68], Varaždin: [46.31, 16.34], Vinkovci: [45.29, 18.80], Zadar: [44.12, 15.23],
  Zagreb: [45.81, 15.98], Zenica: [44.20, 17.91],
  // Ungarn
  Békéscsaba: [46.68, 21.09], Budapest: [47.50, 19.04], Debrecen: [47.53, 21.63], Dunaújváros: [46.96, 18.94], Győr: [47.69, 17.63],
  Kaposvár: [46.36, 17.80], Miskolc: [48.10, 20.78], Nyíregyháza: [47.96, 21.72], Pécs: [46.07, 18.23], Salgótarján: [48.10, 19.80],
  Szeged: [46.25, 20.15], Székesfehérvár: [47.19, 18.41], Szombathely: [47.23, 16.62], Tatabánya: [47.58, 18.39], Zalaegerszeg: [46.84, 16.84],
  // Tschechoslowakei / Tschechien / Slowakei
  'Banská Bystrica': [48.74, 19.15], Bratislava: [48.15, 17.11], Brünn: [49.20, 16.61], Cheb: [50.08, 12.37],
  'Dunajská Streda': [47.99, 17.62], 'Hradec Králové': [50.21, 15.83], Košice: [48.72, 21.26], Liberec: [50.77, 15.06],
  Michalovce: [48.75, 21.92], Most: [50.50, 13.64], Nitra: [48.31, 18.09], Olmütz: [49.59, 17.25], Ostrava: [49.82, 18.26],
  Pilsen: [49.74, 13.38], Prag: [50.08, 14.44], Prešov: [49.00, 21.24], Ružomberok: [49.08, 19.31], Senica: [48.68, 17.37],
  Teplice: [50.64, 13.82], Trenčín: [48.89, 18.04], Trnava: [48.38, 17.59], Žilina: [49.22, 18.74],
  // Polen
  'Bielsko-Biała': [49.82, 19.04], Breslau: [51.11, 17.03], Bytom: [50.35, 18.92], Chorzow: [50.30, 18.95], Danzig: [54.35, 18.65],
  Kattowitz: [50.26, 19.02], Krakau: [50.06, 19.94], Łódź: [51.76, 19.46], Lublin: [51.25, 22.57], Mielec: [50.29, 21.42],
  Posen: [52.41, 16.93], Rzeszów: [50.04, 22.00], Sosnowiec: [50.29, 19.10], Stettin: [53.43, 14.55], Warschau: [52.23, 21.01],
  Zabrze: [50.32, 18.79],
  // Sowjetunion und Nachfolgestaaten
  'Alma-Ata': [43.24, 76.89], Baku: [40.41, 49.87], Charkow: [49.99, 36.23], Dnipro: [48.46, 35.05], Donezk: [48.02, 37.80],
  Jerewan: [40.18, 44.51], Kiew: [50.45, 30.52], Kischinjow: [47.01, 28.86], 'Krywyj Rih': [47.91, 33.39], Kuibyschew: [53.20, 50.15],
  Leningrad: [59.94, 30.31], Luhansk: [48.57, 39.31], Lwiw: [49.84, 24.03], Minsk: [53.90, 27.56], Moskau: [55.76, 37.62],
  Mykolajiw: [46.97, 32.00], Odessa: [46.48, 30.72], Poltawa: [49.59, 34.55], Riga: [56.95, 24.11], Rostow: [47.24, 39.71],
  Saporischschja: [47.84, 35.14], Sumy: [50.91, 34.80], Taschkent: [41.30, 69.24], Tiflis: [41.72, 44.79], Tscherkassy: [49.44, 32.06],
  Wilna: [54.69, 25.28], Winnyzja: [49.23, 28.47], Woronesch: [51.66, 39.20],
  // Griechenland & Türkei
  Athen: [37.98, 23.73], Drama: [41.15, 24.15], Ioannina: [39.67, 20.85], Iraklio: [35.34, 25.13], Kalamata: [37.04, 22.11],
  Kavala: [40.94, 24.41], Korinth: [37.94, 22.93], Larisa: [39.64, 22.42], Patras: [38.25, 21.73], Piraeus: [37.94, 23.65],
  Saloniki: [40.64, 22.94], Serres: [41.09, 23.55], Trikala: [39.56, 21.77], Veria: [40.52, 22.20], Volos: [39.36, 22.94], Xanthi: [41.14, 24.89],
  Adana: [37.00, 35.32], Ankara: [39.93, 32.86], Antalya: [36.90, 30.71], Bursa: [40.19, 29.06], Eskişehir: [39.78, 30.52],
  Gaziantep: [37.07, 37.38], Istanbul: [41.01, 28.98], Izmir: [38.42, 27.14], Kayseri: [38.73, 35.49], Konya: [37.87, 32.48],
  Malatya: [38.35, 38.31], Samsun: [41.29, 36.33], Trabzon: [41.00, 39.72],
  // Rumänien
  Arad: [46.18, 21.31], Bacău: [46.57, 26.91], Brașov: [45.66, 25.61], Bukarest: [44.43, 26.10], Cluj: [46.77, 23.60],
  Constanța: [44.18, 28.63], Craiova: [44.32, 23.80], Galați: [45.44, 28.05], Iași: [47.16, 27.59], Oradea: [47.07, 21.93],
  Pitești: [44.86, 24.87], Ploiești: [44.94, 26.02], Sibiu: [45.79, 24.15], Timișoara: [45.75, 21.23],
};

/** Vereinsnamen mit Stadtteil, Farbe oder Vereinszusatz → Stadt. */
const ALIAS: Record<string, string> = {
  'Karl-Marx-Stadt': 'Chemnitz', 'Berlin (West)': 'Berlin',
  Charlton: 'London', Millwall: 'London', Fulham: 'London', Orient: 'London', Notts: 'Nottingham',
  Partick: 'Glasgow', Raith: 'Kirkcaldy', 'Dundee Nord': 'Dundee',
  Ternana: 'Terni', 'Sampdoria-Genua': 'Genua', 'Hércules-Alicante': 'Alicante',
  'Belenenses-Lissabon': 'Lissabon', 'Boavista-Porto': 'Porto',
  Beerschot: 'Antwerpen', Berchem: 'Antwerpen', Lierse: 'Lier', Molenbeek: 'Bruessel', Winterslag: 'Genk',
  Frem: 'Kopenhagen', Bielsko: 'Bielsko-Biała', 'Stal-Rzeszów': 'Rzeszów', Zagłębie: 'Sosnowiec',
  'Slaven-Koprivnica': 'Koprivnica', Podgorica: 'Titograd', 'Sankt Petersburg': 'Leningrad', Samara: 'Kuibyschew',
};

/** Ungefähre Landesmitte (bzw. Hauptstadt) als Rückfall. */
const COUNTRY: Record<string, LatLon> = {
  Deutschland: [51.0, 10.4], DDR: [52.0, 12.6], England: [52.8, -1.5], Wales: [52.3, -3.7], Schottland: [56.5, -4.0],
  Nordirland: [54.6, -6.7], Irland: [53.3, -7.7], Italien: [42.8, 12.5], Spanien: [40.2, -3.6], Frankreich: [46.6, 2.4],
  Niederlande: [52.2, 5.5], Belgien: [50.6, 4.6], Luxemburg: [49.8, 6.1], Portugal: [39.6, -8.0], Oesterreich: [47.6, 14.1],
  Schweiz: [46.8, 8.2], Schweden: [60.1, 15.0], Daenemark: [56.0, 9.5], Norwegen: [60.5, 9.0], Finnland: [62.0, 25.7],
  Island: [64.9, -18.6], Jugoslawien: [44.0, 19.0], Serbien: [44.0, 20.9], Kroatien: [45.1, 15.6], Slowenien: [46.1, 14.8],
  Ungarn: [47.2, 19.4], Tschechoslowakei: [49.4, 16.8], Tschechien: [49.8, 15.5], Slowakei: [48.7, 19.5], Polen: [52.0, 19.4],
  Sowjetunion: [55.76, 37.62], Russland: [55.76, 37.62], Ukraine: [49.0, 31.4], Griechenland: [39.3, 22.0], Tuerkei: [39.0, 35.0],
  Rumaenien: [45.9, 24.9], Bulgarien: [42.7, 25.5], Albanien: [41.2, 20.2], Zypern: [35.1, 33.4], Malta: [35.9, 14.4],
};

const ALL: Record<string, LatLon> = { ...DE, ...ABROAD };

/** Stadtname, unter dem die Lage geführt wird (Alias aufgelöst, Farbzusatz entfernt). */
export function canonicalCity(city: string): string {
  const c = city.trim();
  if (ALL[c]) return c;
  if (ALIAS[c]) return ALIAS[c];
  // „Athen Gelb“, „Istanbul Schwarz-Weiß“, „Bukarest Rot-Weiß“ → erstes Wort
  const first = c.split(' ')[0];
  if (ALL[first]) return first;
  return c;
}

/** Lage einer Vereinsstadt; ohne Treffer optional die Landesmitte. */
export function cityGeo(city: string | undefined, country?: string): { geo: LatLon; exact: boolean } | null {
  if (city) {
    const hit = ALL[canonicalCity(city)];
    if (hit) return { geo: hit, exact: true };
  }
  const ctry = country ? COUNTRY[country] : undefined;
  return ctry ? { geo: ctry, exact: false } : null;
}

export const isGermanCity = (city: string): boolean => !!DE[canonicalCity(city)];

/** Luftlinie in km (Großkreis, Erdradius 6371 km). */
export function distanceKm(a: LatLon, b: LatLon): number {
  const r = Math.PI / 180;
  const dLat = (b[0] - a[0]) * r, dLon = (b[1] - a[1]) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}
