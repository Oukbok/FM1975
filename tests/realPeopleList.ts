// =============================================================================
// Sperrliste echter Personen, Bands, Marken, Sendungen und Filme (Wunsch Pascal:
// „Bitte nenne keine echten Namen.“). Ergänzt die Vereins-/Marken-/Fußballerliste
// in tests/realnames-test.ts; geprüft werden nur String-Inhalte der Datendateien.
// Einträge sind Regex-Bruchstücke (ohne Wortgrenzen – die setzt der Test, Genitiv-s
// bei Personen inklusive). Allerweltsnamen (Schmidt, Kohl, Fischer, Becker …) stehen
// nur mit Vornamen oder Amt, damit erfundene Spieler- und Ortsnamen frei bleiben.
// Im Text stattdessen die Funktion nennen: „der Bundeskanzler“, „ein DDR-Kosmonaut“,
// „eine Tennisspielerin aus Brühl“, „ein Heimcomputer“, „ein Kurznachrichtendienst“.
// =============================================================================

/** Politik, Zeitgeschichte, Wirtschaft – je Jahrzehnt die gängigen Namen. */
export const POLITICS: string[] = [
  // Bundesrepublik / DDR 1970er–1980er
  'Helmut Schmidt', 'Helmut Kohl', 'Willy Brandt', '(?:Kanzler|Bundeskanzler|Ära|Jahren?|Regierung|Kabinett) (?:Schmidt|Kohl|Brandt|Schröder|Scholz|Adenauer|Erhard|Kiesinger)',
  '(?:Kanzlerin|Ära|Regierung|Kabinett) Merkel', 'Honecker', 'Ulbricht', 'Mielke', 'Egon Krenz', 'Krenz', 'Modrow', 'de Maizière', 'Stoph', 'Schalck',
  'Genscher', 'Franz Josef Strauß', 'Strauß-Kredit', 'Wehner', 'Egon Bahr', 'Lambsdorff', 'Möllemann', 'Scheel', 'Carstens', 'Heinemann',
  'Weizsäcker', 'Schleyer', 'Baader', 'Meinhof', 'Ensslin', 'Dutschke', 'Barschel', 'Engholm', 'Petra Kelly', 'Blüm', 'Stoltenberg',
  'Adenauer', 'Ludwig Erhard', 'Kiesinger', 'Hitler', 'Goebbels', 'Stalin', 'Lenin',
  // 1990er–2000er
  'Roman Herzog', 'Johannes Rau', 'Horst Köhler', 'Gerhard Schröder', 'Joschka Fischer', 'Lafontaine', 'Scharping', 'Schäuble', 'Waigel',
  'Kinkel', 'Biedenkopf', 'Stoiber', 'Schily', 'Trittin', 'Künast', 'Gysi', 'Peter Hartz', 'Riester(?!-)', 'Müntefering', 'Steinbrück',
  'Westerwelle', 'Wowereit', 'Angela Merkel', 'Merkel',
  // 2010er–2020er
  'Steinmeier', 'Gauck', 'Wulff', 'Guttenberg', 'von der Leyen', 'Seehofer', 'Sigmar Gabriel', 'Nahles', 'Kramp-Karrenbauer', 'Laschet',
  'Söder', 'Olaf Scholz', 'Habeck', 'Baerbock', 'Christian Lindner', 'Lauterbach', 'Spahn', 'Friedrich Merz', 'Merz', 'Klingbeil',
  'Pistorius', 'Wagenknecht', 'Weidel', 'Gauland', 'Höcke', 'Kühnert',
  // Welt
  'Breschnew', 'Andropow', 'Tschernenko', 'Gorbatschow', 'Gorbi', 'Jelzin', 'Putin', 'Medwedew', 'Chruschtschow', 'Nixon', 'Gerald Ford',
  'Jimmy Carter', 'Reagan', 'George (?:H\\. ?W\\. |W\\. )?Bush', 'Präsident Bush', 'Clinton', 'Obama', 'Trump', 'Biden', 'Kennedy', 'Thatcher',
  'Tony Blair', 'Boris Johnson', 'Mitterrand', 'Giscard', 'Chirac', 'Sarkozy', 'Hollande', 'Macron', 'Berlusconi', 'Andreotti', 'General Franco',
  'Marschall Tito', 'Ceau[sș]escu', 'Wa[lł][eę]sa', 'Jaruzelski', 'Václav Havel', 'Dubček', 'Kádár', 'Orbán', 'Erdo[gğ]an', 'Milo[sš]evi[cć]', 'Saddam',
  'Ch?omeini', 'Gaddafi', 'Arafat', 'Rabin', 'Mandela', 'Fidel Castro', 'Pinochet', 'Videla', 'Mao Zedong', 'Deng Xiaoping', 'Xi Jinping',
  'Selenskyj', 'Juncker', 'Draghi', 'Lagarde', 'Delors', 'Snowden', 'Assange', 'Bin Laden', 'Johannes Paul', 'Wojty[lł]a', 'Ratzinger',
  'Benedikt XVI', 'Papst Franziskus', 'Lady Di', 'Prinzessin Diana', 'Queen Elizabeth', 'Thunberg', 'Elon Musk', 'Steve Jobs', 'Bill Gates',
  'Zuckerberg', 'Bezos', 'Murdoch', 'Leo Kirch', 'Tapie', 'Abramowitsch', 'Mateschitz', 'Dietmar Hopp', 'Tönnies', 'Watzke', 'Martin Kind',
  // Raumfahrt und Zeitgeschehen
  'Jähn', 'Gagarin', 'Neil Armstrong', 'Merbold', 'Alexander Gerst', 'Mathias Rust', 'Kujau', 'Wallraff', 'Biermann',
];

/** Sport außerhalb des Fußballs. */
export const ATHLETES: string[] = [
  'Boris Becker', 'Bobbele', 'Steffi Graf', 'Michael Stich', 'Björn Borg', 'McEnroe', 'Lendl', 'Navratilova', 'Federer', 'Nadal', 'Djokovi[cć]',
  'Zverev', 'Angelique Kerber', 'Katarina Witt', 'Kati Witt', '(?:Michael|Ralf) Schumacher', 'Schumi', 'Schumacher (?:Weltmeister|gewinnt|siegt|fährt)',
  'Vettel', 'Rosberg', 'Lewis Hamilton', 'Ayrton Senna', 'Niki Lauda', 'Alain Prost', 'Verstappen', 'Jan Ullrich', 'Ullrich gewinnt', 'Erik Zabel',
  'Lance Armstrong', 'Henry Maske', 'Axel Schulz', 'Klitschko', 'Muhammad Ali', 'Mike Tyson', 'Nowitzki', 'Michael Jordan', 'Usain Bolt',
  'van Almsick', 'Michael Groß', 'Kristin Otto', 'Kornelia Ender', 'Roland Matthes', 'Magdalena Neuner', 'Dahlmeier', 'Hannawald', 'Martin Schmitt',
  'Weißflog', 'Georg Hackl', 'Mittermaier', 'Maria Höfl-Riesch', 'Neureuther', 'Meyfarth', 'Heike Drechsler', 'Marita Koch', 'Täve Schur',
  'Cierpinski', 'Dieter Baumann', 'Timo Boll', 'Bernhard Langer', 'Tiger Woods', 'Carl Lewis', 'Ben Johnson', 'Mark Spitz', 'Nadia Comăneci',
  'Dirk Bauermann', 'Heiner Brand', 'Stefan Kretzschmar',
];

/** Weitere Fußballer, Trainer, Schiedsrichter, Funktionäre und Reporter (zusätzlich zu PEOPLE in realnames-test.ts). */
export const FOOTBALL_PEOPLE: string[] = [
  // Spieler Deutschland
  'Fritz Walter', 'Helmut Rahn', 'Schwarzenbeck', 'Bonhof', 'Cullmann', 'Kaltz', 'Briegel', 'Allofs', 'Klaus Fischer', 'Abramczik', 'Hansi Müller',
  'Dieter Müller', 'Bernd Schuster', 'Olaf Thon', 'Uli Stein', 'Illgner', 'Köpke', 'Augenthaler', 'Buchwald', 'Jürgen Kohler', 'Häßler',
  'Andreas Möller', 'Stefan Reuter', 'Thomas Helmer', 'Babbel', 'Mehmet Scholl', 'Stefan Kuntz', 'Bobic', 'Lars Ricken', 'Jeremies', 'Dietmar Hamann',
  'Christian Ziege', 'Jancker', 'Zickler', 'Bernd Schneider', 'Frings', 'Mertesacker', 'Podolski', 'Poldi', 'Schweini', 'Miroslav Klose', 'Klose',
  'Khedira', 'Boateng', 'Hummels', 'Marco Reus', 'Gündo[gğ]an', 'Draxler', 'Schürrle', 'Gnabry', 'Kimmich', 'Goretzka', 'Havertz', 'Wirtz',
  'Musiala', 'Leroy Sané', 'ter Stegen', 'Rüdiger', 'Füllkrug', 'Sparwasser', 'Dörner', 'Ducke', 'Joachim Streich', 'Croy', 'Kreische',
  'Thomas Doll', 'Wosz', 'Ulf Kirsten', 'Birgit Prinz', 'Silvia Neid', 'Alexandra Popp',
  // Spieler Ausland
  'Neymar', 'Lewandowski', 'Robben', 'Ribéry', 'Bellingham', 'Kevin Keegan', 'Keegan', 'Simonsen', 'Chapuisat', 'Élber', 'Elber', 'Lizarazu',
  'Pizarro', 'Makaay', 'Luca Toni', 'van Bommel', 'Rosický', 'Aílton', 'Ailton', 'Džeko', 'Dzeko', 'Yeboah', 'Okocha', 'Sforza', 'Puskás',
  'Di Stéfano', 'Eusébio', 'Bobby Charlton', 'Bobby Moore', 'George Best', 'Dalglish', 'Lineker', 'Gascoigne', 'Shearer', 'Beckham', 'Rooney',
  'Cantona', 'Thierry Henry', 'Bergkamp', 'van Basten', 'Gullit', 'Rijkaard', 'Neeskens', 'Koeman', 'Seedorf', 'Kluivert', 'van Nistelrooy',
  'van Persie', 'Zico', 'Sócrates', 'Romário', 'Rivaldo', 'Ronaldinho', 'Kaká', 'Roberto Carlos', 'Kempes', 'Passarella', 'Batistuta',
  'Baggio', 'Baresi', 'Maldini', 'Paolo Rossi', 'Dino Zoff', 'Totti', 'Del Piero', 'Buffon', 'Pirlo', 'Cannavaro', 'Schillaci', 'Giresse',
  'Tigana', 'Papin', 'Deschamps', 'Griezmann', 'Benzema', 'Butragueño', 'Xavi', 'Iniesta', 'Casillas', 'Sergio Ramos', 'Stoitschkow', 'Gheorghe Hagi',
  'Šuker', 'Zvonimir Boban', 'Modri[cć]', 'Schewtschenko', 'Blochin', 'Jaschin', 'Boniek', 'Nedvěd', 'Laudrup', 'Schmeichel', 'Ibrahimovi[cć]',
  'George Weah', 'Roger Milla', 'Eto.o', 'Drogba', 'Mohamed Salah', 'Luis Suárez', 'Valderrama', 'Hugo Sánchez', 'Jean-Marc Bosman',
  // Trainer
  'Feldkamp', 'Zebec', 'Csernai', 'Dettmar Cramer', 'Schlappner', 'Stepanovi[cć]', 'Toppmöller', 'Neururer', 'Funkel', 'Armin Veh', 'Slomka',
  'Thomas Schaaf', 'Huub Stevens', 'Köppel', 'Jörg Berger', 'Eduard Geyer', 'Hans Meyer', 'Pagelsdorf', 'Lienen', 'Volker Finke',
  'Christian Streich', 'Favre', 'Hasenhüttl', 'Kova[cč]', 'Marco Rose', 'Terzi[cć]', 'Xabi Alonso', 'Kompany', 'Ancelotti', 'Trapattoni', 'Capello',
  'Lippi', 'van Gaal', 'Hiddink', 'Advocaat', 'Wenger', 'Benítez', 'Del Bosque', 'Simeone', 'Bielsa', 'Menotti', 'Bilardo', 'Zagallo', 'Scolari',
  'Bob Paisley', 'Shankly', 'Brian Clough', 'Matt Busby', 'Bobby Robson', 'Buschner', 'Bernd Stange', 'Labbadia', 'Skibbe', 'Erich Ribbeck',
  // Schiedsrichter, Funktionäre, Reporter
  'Collina', 'Markus Merk', 'Fandel', 'Hellmut Krug', 'Aytekin', 'Brych', 'Gräfe', 'Steinhaus', 'Ahlenfelder', 'Eschweiler', 'Theo Zwanziger',
  'Grindel', 'Fritz Keller', 'Neuendorf', 'Egidius Braun', 'Neuberger', 'Mayer-Vorfelder', 'Havelange', 'Lennart Johansson', '[CČ]eferin',
  'Christian Seifert', 'Faßbender', 'Rubenbauer', 'Huberty', 'Töpperwien', 'Marcel Reif', 'Wontorra', 'Réthy', 'Waldemar Hartmann', 'Valérien',
  'Herbert Zimmermann', 'Oertel', 'Delling', 'Johannes B\\. Kerner', 'Reinhold Beckmann',
];

/** Musik, Film, Fernsehen, Kunst. */
export const CULTURE: string[] = [
  'ABBA', 'Boney M\\.?', 'Farian', 'Elvis Presley', 'Presley', 'Beatles', 'Lennon', 'McCartney', 'Rolling Stones', 'Freddie Mercury', 'Michael Jackson',
  '(?:Popstar|Sängerin|Popsängerin) Madonna', 'David Bowie', 'Springsteen', 'Bob Dylan', 'Pink Floyd', 'AC/DC', 'Bee Gees', 'Village People', 'Donna Summer', 'Sex Pistols',
  'Nena', 'Spliff', 'Fehlfarben', 'DAF', '(?:Sänger|Popstar) Falco', 'Modern Talking', 'Scorpions', 'Lindenberg', 'Grönemeyer', 'Westernhagen', 'Maffay',
  'Nina Hagen', 'BAP', 'Puhdys', 'Kelly Family', 'Take That', 'Backstreet Boys', 'Spice Girls', 'Snap!?', 'Culture Beat', 'Rammstein',
  'Tokio Hotel', 'Toten Hosen', 'Fantastischen Vier', 'Blümchen', 'DJ Bobo', 'Bushido', 'Helene Fischer', 'Meyer-Landrut',
  'Guildo Horn', '(?:Sänger|Schlagersänger|Barde) Heino', 'Udo Jürgens', 'Roy Black', 'Rex Gildo', 'Cordalis', 'Carpendale', 'Roland Kaiser', 'Wolfgang Petry', 'Matthias Reim',
  'Naidoo', 'Sarah Connor', 'Taylor Swift', 'Beyoncé', 'Rihanna', 'Lady Gaga', 'Ed Sheeran', 'Eminem', 'Nirvana', 'Cobain', 'Depeche Mode',
  'Milli Vanilli', 'Hasselhoff', 'Sportfreunde Stiller', 'Christo und', 'Jeanne-Claude', 'Beuys', 'Fassbinder', 'Wim Wenders', 'Schwarzenegger',
  'Spielberg', 'George Lucas', 'Til Schweiger', 'Günter Grass', 'Heinrich Böll', 'Christa Wolf', 'Gottschalk', 'Jauch', 'Stefan Raab',
  'Harald Schmidt', 'Bohlen', 'Kulenkampff', 'Carrell', 'Frankenfeld', 'Hans Rosenthal', 'Hallervorden', 'Waalkes', 'Loriot', 'Kerkeling',
  'Heidi Klum', 'Claudia Schiffer',
  // Sendungen, Filme, Lieder
  'Lindenstraße', 'Tagesschau', 'Tatort', 'Wetten, dass', 'Schwarzwaldklinik', 'Denver-Clan', 'Krieg der Sterne', 'Star Wars', 'Jurassic Park',
  'Saturday Night Fever', 'Harry Potter', 'Herr der Ringe', '„Titanic“', '„Holocaust“', '99 Luftballons', 'Daddy Cool', 'Mr\\. Vain',
  'Da Da Da', 'Live Aid', 'Love ?Parade',
];

/** Firmen, Produkte, Medien, Internetdienste (zusätzlich zu BRANDS in realnames-test.ts). */
export const PRODUCTS: string[] = [
  'Lufthansa', 'Commodore', 'C ?64', 'VC ?20', 'Atari', 'Amiga', 'Nintendo', 'Game ?Boy', 'PlayStation', 'Xbox', 'Walkman', 'Sony', 'Philips',
  'Grundig', 'Telefunken', 'Betamax', 'Video 2000', 'Windows(?: \\d+)?', 'Microsoft', 'Apple', 'iPhone', 'iPad', 'iPod', 'Google', 'YouTube',
  'Facebook', 'Twitter', 'Instagram', 'TikTok', 'WhatsApp', 'Snapchat', 'Spotify', 'StudiVZ', 'wer-kennt-wen', 'MySpace', 'eBay', 'PayPal',
  'ChatGPT', 'OpenAI', 'Tamagotchi', 'Pokémon(?: Go)?', 'Lehman(?: Brothers)?', 'IKB', 'Sachsen LB', 'Deutsche Bank', 'Dresdner Bank',
  'T-Online', 'Nokia', 'Siemens', 'Samsung', 'BlackBerry', 'Motorola', 'Trabant', 'Trabis?', 'VW', 'BMW', 'Mercedes(?:-Benz)?(?=[ -])', 'Porsche', 'Coca-Cola',
  'Pepsi', 'McDonald.?s', 'Aldi', 'Lidl', 'Neckermann', 'Karstadt', 'IKEA', 'Tchibo', 'Haribo', 'Bild-Zeitung', '„Bild“', '„Stern“',
  '„Spiegel“', '„Bravo“', '„kicker“', '„Sputnik“', 'MTV', 'VIVA', 'Deutschen? Bahn AG', 'GDL', 'Tesla', 'Uber', 'Airbnb', 'Skype', 'Napster',
];

/** Historische Persönlichkeiten in Stadttexten (data/prematch) – auch sie nur umschrieben. */
export const HISTORIC: string[] = [
  'Richard Wagner', 'Guericke', 'Gutenberg', 'Karl Marx', 'Robert Schumann', 'Goethe', 'Schiller(?!nd)', 'Martin Luther', 'Luther',
  'Johann Sebastian Bach', 'Beethoven', 'Händel', 'Mozart', 'Brahms', 'Dürer', 'Immanuel Kant', 'Einstein', 'Zeppelin', 'Gottlieb Daimler',
  'Carl Benz', 'Brüder Grimm', 'Fugger', 'Karl der Große', 'Karls des Großen', 'Barbarossa', 'August der Starke', 'Augusts des Starken',
  'Friedrich der Große', 'Bismarck', 'Napoleon', 'Kopernikus', 'Kepler', 'Röntgen', 'Gauß', 'Humboldt', 'Lessing', 'Heine(?![a-zäöü])', 'Fontane',
  'Thomas Mann', 'Brecht', 'Nietzsche', 'Hegel', 'Leibniz', 'Krupp', 'Thyssen', 'Zeiss', 'Otto Lilienthal', 'Till Eulenspiegel', 'Störtebeker',
  'Münchhausen', 'Kolumbus', 'Gaudí', 'Picasso', 'Shakespeare', 'Rembrandt', 'Rubens', 'Chopin', 'Verdi', 'Garibaldi', 'Michelangelo', 'da Vinci',
];
