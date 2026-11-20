// =============================================================================
// STÄDTE FÜR DIE TIEFEREN AUSLANDSLIGEN (Ebene 3/4, data/world/deepStructure.ts)
// -----------------------------------------------------------------------------
// Echte Vereinsdaten gibt es nur für die 1./2. Ebene (data/world/clubs/<cc>.ts). Darunter
// spielen zuerst die übrigen Vereine des Landes aus den Weltdaten (Unterbau), danach
// erfundene Vereine aus diesen Städten – benannt wie die Pool-Vereine nur nach der Stadt
// (bei zwei Vereinen einer Stadt mit Farbe, engine/worldCountries.ts `newClub`). Keine
// Vereinsnamen, nur Orte des Landes (Mittel- und Kleinstädte, grob nach Größe).
// Deutschland im Hintergrund nutzt die Amateur-Städte data/poolTowns.ts.
// =============================================================================
import { POOL_TOWNS } from '../poolTowns';

export const DEEP_TOWNS: Record<string, string[]> = {
  eng: [
    'Wigan', 'Stoke', 'Derby', 'Ipswich', 'Barnsley', 'Huddersfield', 'Rotherham', 'Doncaster', 'Scunthorpe', 'Grimsby',
    'Lincoln', 'Peterborough', 'Northampton', 'Cambridge', 'Colchester', 'Southend', 'Gillingham', 'Bournemouth', 'Exeter', 'Torquay',
    'Swindon', 'Cheltenham', 'Hereford', 'Shrewsbury', 'Wrexham', 'Chester', 'Crewe', 'Port Vale', 'Macclesfield', 'Stockport',
    'Rochdale', 'Bury', 'Accrington', 'Morecambe', 'Barrow', 'Workington', 'Darlington', 'Hartlepool', 'Halifax', 'Mansfield',
    'Chesterfield', 'Burton', 'Kidderminster', 'Wycombe', 'Aldershot', 'Crawley', 'Stevenage', 'Dagenham', 'Barnet', 'Wimbledon',
    'Brentford', 'Gateshead', 'Yeovil', 'Weymouth', 'Bath', 'Gloucester', 'Worcester', 'Telford', 'Nuneaton', 'Kettering',
    'Boston', 'Scarborough', 'Harrogate', 'Fleetwood', 'Southport', 'Altrincham', 'Northwich', 'Tamworth', 'Hinckley', 'Rushden',
    'Maidstone', 'Dover', 'Woking', 'Sutton', 'Bromley', 'Ebbsfleet', 'Eastleigh', 'Salisbury', 'Truro', 'Forest Green',
  ],
  esp: [
    'Albacete', 'Almería', 'Jaén', 'Badajoz', 'Cáceres', 'Mérida', 'León', 'Ponferrada', 'Lugo', 'Ourense',
    'Pontevedra', 'Ferrol', 'Avilés', 'Langreo', 'Mieres', 'Torrelavega', 'Palencia', 'Zamora', 'Segovia', 'Ávila',
    'Soria', 'Guadalajara', 'Toledo', 'Talavera', 'Ciudad Real', 'Puertollano', 'Cuenca', 'Alcorcón', 'Getafe', 'Leganés',
    'Fuenlabrada', 'Móstoles', 'Alcalá', 'Tarragona', 'Lleida', 'Girona', 'Reus', 'Sabadell', 'Terrassa', 'Badalona',
    'Hospitalet', 'Mataró', 'Figueres', 'Huesca', 'Teruel', 'Eibar', 'Irún', 'Barakaldo', 'Sestao', 'Vitoria',
    'Tudela', 'Calahorra', 'Algeciras', 'Jerez', 'Marbella', 'Linares', 'Écija', 'Lorca', 'Cartagena', 'Orihuela',
    'Alcoy', 'Gandía', 'Villarreal', 'Ontinyent', 'Benidorm', 'Ibiza', 'Menorca', 'Tenerife', 'Lanzarote', 'Melilla',
    'Ceuta', 'Motril', 'Antequera', 'Lucena', 'Don Benito', 'Zafra', 'Plasencia', 'Astorga', 'Compostela', 'Lalín',
  ],
  ita: [
    'Novara', 'Alessandria', 'Pro Vercelli', 'Asti', 'Cuneo', 'Biella', 'Monza', 'Lecco', 'Cremona', 'Mantova',
    'Piacenza', 'Reggio Emilia', 'Carpi', 'Ferrara', 'Ravenna', 'Rimini', 'Forlì', 'Treviso', 'Padua', 'Venedig',
    'Triest', 'Pordenone', 'Trient', 'Bozen', 'La Spezia', 'Savona', 'Sanremo', 'Pisa', 'Livorno', 'Lucca',
    'Siena', 'Arezzo', 'Prato', 'Pistoia', 'Empoli', 'Grosseto', 'Ancona', 'Pesaro', 'Macerata', 'Fermo',
    'Teramo', "L'Aquila", 'Chieti', 'Campobasso', 'Benevent', 'Salerno', 'Caserta', 'Neapel-Ost', 'Juve Stabia', 'Potenza',
    'Matera', 'Cosenza', 'Catanzaro', 'Crotone', 'Reggio Calabria', 'Messina', 'Trapani', 'Siracusa', 'Ragusa', 'Agrigent',
    'Sassari', 'Olbia', 'Latina', 'Frosinone', 'Viterbo', 'Rieti', 'Terni-Süd', 'Gubbio', 'Foligno', 'Sangiovannese',
    'Legnano', 'Pavia', 'Varese-Nord', 'Sondrio', 'Vigevano', 'Lumezzane', 'Südtirol', 'Bassano', 'Belluno', 'Rovigo',
  ],
  fra: [
    'Amiens', 'Beauvais', 'Creil', 'Saint-Quentin', 'Dunkerque', 'Boulogne', 'Calais', 'Arras', 'Douai', 'Cambrai',
    'Charleville', 'Sedan', 'Épinal', 'Thionville', 'Colmar', 'Mulhouse', 'Belfort', 'Besançon', 'Dijon', 'Chalon',
    'Mâcon', 'Bourg-en-Bresse', 'Annecy', 'Chambéry', 'Grenoble', 'Valence', 'Avignon', 'Nîmes', 'Arles', 'Martigues',
    'Toulon', 'Fréjus', 'Cannes', 'Nizza-West', 'Ajaccio', 'Perpignan', 'Béziers', 'Sète', 'Carcassonne', 'Narbonne',
    'Pau', 'Tarbes', 'Bayonne', 'Mont-de-Marsan', 'Agen', 'Périgueux', 'Brive', 'Limoges', 'Niort', 'La Rochelle',
    'Poitiers', 'Châteauroux', 'Tours', 'Orléans', 'Blois', 'Bourges', 'Vierzon', 'Clermont', 'Vichy', 'Moulins',
    'Le Puy', 'Rodez', 'Albi', 'Cholet', 'Lorient', 'Vannes', 'Quimper', 'Saint-Brieuc', 'Guingamp', 'Saint-Malo',
    'Cherbourg', 'Alençon', 'Évreux', 'Chartres', 'Créteil', 'Versailles', 'Fontainebleau', 'Melun', 'Meaux', 'Gueugnon',
  ],
  ned: [
    'Emmen', 'Assen', 'Hoogeveen', 'Meppel', 'Almelo', 'Hengelo', 'Enschede-Noord', 'Oldenzaal', 'Apeldoorn', 'Ede',
    'Veenendaal', 'Wageningen', 'Amersfoort', 'Hilversum', 'Zeist', 'Nieuwegein', 'Gouda', 'Alphen', 'Leiden', 'Katwijk',
    'Noordwijk', 'Delft', 'Westland', 'Spijkenisse', 'Barendrecht', 'Ridderkerk', 'Gorinchem', 'Oss', 'Den Bosch', 'Eindhoven-Zuid',
    'Veldhoven', 'Valkenswaard', 'Weert', 'Roermond', 'Geleen', 'Heerlen', 'Bergen op Zoom', 'Roosendaal', 'Oosterhout', 'Waalwijk',
    'Goes', 'Middelburg', 'Vlissingen', 'Terneuzen', 'Purmerend', 'Zaandam', 'Hoorn', 'Den Helder', 'Harderwijk', 'Lelystad',
    'Almere', 'Kampen', 'Steenwijk', 'Sneek', 'Drachten', 'Harlingen', 'Winschoten', 'Veendam', 'Stadskanaal', 'Doetinchem',
  ],
  bel: [
    'Brügge', 'Löwen', 'Aalst', 'Sint-Niklaas', 'Dendermonde', 'Ronse', 'Oudenaarde', 'Roeselare', 'Izegem', 'Ieper',
    'Menen', 'Torhout', 'Turnhout', 'Geel', 'Mol', 'Herentals', 'Lier', 'Boom', 'Willebroek', 'Vilvoorde',
    'Dilbeek', 'Halle', 'Tienen', 'Sint-Truiden', 'Genk', 'Lommel', 'Maaseik', 'Bilzen', 'Diest', 'Aarschot',
    'Lüttich-Nord', 'Verviers', 'Eupen', 'Huy', 'Visé', 'Waremme', 'Mons', 'La Louvière', 'Tournai', 'Mouscron',
    'Ath', 'Soignies', 'Nivelles', 'Wavre', 'Tubize', 'Châtelet', 'Fleurus', 'Dinant', 'Arlon', 'Virton',
  ],
  por: [
    'Vila Real', 'Bragança', 'Viana do Castelo', 'Barcelos', 'Famalicão', 'Fafe', 'Felgueiras', 'Amarante', 'Paredes', 'Paços de Ferreira',
    'Vila do Conde', 'Póvoa de Varzim', 'Maia', 'Gondomar', 'Espinho', 'Feira', 'Oliveira de Azeméis', 'Ovar', 'Águeda', 'Covilhã',
    'Guarda', 'Castelo Branco', 'Tondela', 'Figueira da Foz', 'Pombal', 'Marinha Grande', 'Caldas da Rainha', 'Torres Vedras', 'Santarém', 'Tomar',
    'Abrantes', 'Portalegre', 'Elvas', 'Évora', 'Beja', 'Sines', 'Lagos', 'Olhão', 'Loulé', 'Tavira',
    'Amadora', 'Odivelas', 'Sintra', 'Cascais', 'Oeiras', 'Almada', 'Seixal', 'Montijo', 'Ponta Delgada', 'Angra',
  ],
  urs: [
    'Wolgograd', 'Saratow', 'Kasan', 'Ufa', 'Perm', 'Tscheljabinsk', 'Swerdlowsk', 'Omsk', 'Nowosibirsk', 'Krasnojarsk',
    'Irkutsk', 'Chabarowsk', 'Wladiwostok', 'Jaroslawl', 'Iwanowo', 'Kalinin', 'Smolensk', 'Brjansk', 'Kursk', 'Orjol',
    'Tula', 'Rjasan', 'Lipezk', 'Tambow', 'Pensa', 'Uljanowsk', 'Astrachan', 'Krasnodar', 'Sotschi', 'Stawropol',
    'Ordschonikidse', 'Grosny', 'Machatschkala', 'Lwiw', 'Saporoschje', 'Krywyj Rih', 'Mykolajiw', 'Cherson', 'Sewastopol', 'Simferopol',
    'Luhansk', 'Poltawa', 'Tscherkassy', 'Schytomyr', 'Winnyzja', 'Gomel', 'Brest', 'Witebsk', 'Kaunas', 'Tallinn',
    'Tiflis-Süd', 'Kutaissi', 'Batumi', 'Leninakan', 'Gandscha', 'Samarkand', 'Buchara', 'Frunse', 'Duschanbe', 'Aschgabat',
  ],
  rus: [
    'Wolgograd', 'Saratow', 'Kasan', 'Ufa', 'Perm', 'Tscheljabinsk', 'Jekaterinburg', 'Omsk', 'Nowosibirsk', 'Krasnojarsk',
    'Irkutsk', 'Chabarowsk', 'Wladiwostok', 'Jaroslawl', 'Iwanowo', 'Twer', 'Smolensk', 'Brjansk', 'Kursk', 'Orjol',
    'Tula', 'Rjasan', 'Lipezk', 'Tambow', 'Pensa', 'Uljanowsk', 'Astrachan', 'Krasnodar', 'Sotschi', 'Stawropol',
    'Wladikawkas', 'Grosny', 'Machatschkala', 'Nalchik', 'Tscheboksary', 'Ischewsk', 'Kirow', 'Wologda', 'Archangelsk', 'Murmansk',
    'Petrosawodsk', 'Pskow', 'Nowgorod', 'Kaliningrad', 'Belgorod', 'Kaluga', 'Wladimir', 'Kostroma', 'Tomsk', 'Barnaul',
  ],
  ger: POOL_TOWNS.map((t) => t.town),
};
