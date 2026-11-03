// =============================================================================
// Vornamen je Geburtsjahrgang („Kohorten“) und Herkunft.
// -----------------------------------------------------------------------------
// Ein 1975 aufgestellter Kader besteht aus Jahrgängen 1940–1957 (Klaus, Horst,
// Manfred), die Jugend von 2025 aus Jahrgängen um 2008 (Ben, Finn, Elias). Die
// Listen geben je Herkunft ab einem Geburtsjahr die damals üblichen Vornamen an;
// gilt bis zur nächsten Stufe. Herkünfte ohne Eintrag nutzen ihre Grundliste aus
// data/origins.ts. Nachnamen bleiben über die Zeit gleich.
//
// Quellen (Ranglisten der häufigsten Jungennamen je Jahrzehnt, nur gängige
// Namen übernommen; Details und Links: docs/recherche/namen.md):
//  - Deutschland West: Knud Bielefeld, beliebte-vornamen.de (Jahrgangslisten ab
//    1890); Gesellschaft für deutsche Sprache (GfdS, Vornamenstatistik ab 1977).
//  - DDR: beliebte-vornamen.de (DDR-Jahrgänge 1950–1989), GfdS-Auswertung Ost.
//  - Österreich: Statistik Austria (Vornamen ab 1984), ältere Jahrgänge nach
//    Taufnamen-Auswertungen. Niederlande: Meertens Instituut, Nederlandse
//    Voornamenbank. Dänemark/Schweden/Norwegen: Danmarks Statistik, SCB, SSB
//    (Namensstatistik nach Geburtsjahrzehnt). Polen: GUS/PESEL-Register.
//    Italien: ISTAT „I nomi più frequenti“. Spanien: INE „Nombres por década
//    de nacimiento“. Frankreich: INSEE Fichier des prénoms. England: ONS Baby
//    Names (ab 1996) + ältere Top-100-Listen. Türkei: TÜİK (Namen nach
//    Geburtsjahrzehnt). Brasilien: IBGE, Censo 2010 „Nomes no Brasil“.
//    Kroatien/Serbien: DZS bzw. RZS (Namen nach Geburtsjahr).
// Bewusst keine Kombinationen mit Nachnamen – Paare entstehen zufällig, bekannte
// reale Paare sperrt BLOCKED_NAMES (data/namePools.ts).
// =============================================================================

/** Liste [ab Geburtsjahr, Vornamen] – aufsteigend sortiert. */
export type FirstNameEra = [number, string[]];

// --- Deutschland (West) -------------------------------------------------------
const DE_1930 = ['Hans', 'Klaus', 'Günter', 'Horst', 'Werner', 'Gerhard', 'Heinz', 'Karl-Heinz', 'Manfred', 'Dieter', 'Helmut', 'Walter', 'Rolf', 'Kurt', 'Wolfgang', 'Jürgen', 'Herbert', 'Siegfried', 'Erich', 'Willi', 'Friedhelm', 'Egon', 'Lothar', 'Heinz-Dieter', 'Gerd', 'Rudi', 'Erwin', 'Alfred', 'Bernhard', 'Ernst', 'Fritz', 'Kurt', 'Otto', 'Paul', 'Franz'];
const DE_1950 = ['Peter', 'Wolfgang', 'Michael', 'Klaus', 'Jürgen', 'Thomas', 'Uwe', 'Bernd', 'Hans-Jürgen', 'Rainer', 'Dieter', 'Manfred', 'Norbert', 'Harald', 'Gerd', 'Werner', 'Reinhard', 'Hartmut', 'Hans-Peter', 'Joachim', 'Detlef', 'Ulrich', 'Rolf', 'Karl-Heinz', 'Horst', 'Dietmar', 'Volker', 'Lothar', 'Burkhard', 'Wilfried', 'Rüdiger', 'Bodo', 'Ewald', 'Erwin', 'Herbert', 'Heinz', 'Günter', 'Eberhard'];
const DE_1960 = ['Thomas', 'Michael', 'Andreas', 'Stefan', 'Frank', 'Jürgen', 'Peter', 'Ralf', 'Uwe', 'Jörg', 'Matthias', 'Martin', 'Klaus', 'Bernd', 'Holger', 'Dirk', 'Markus', 'Carsten', 'Torsten', 'Olaf', 'Rainer', 'Jens', 'Thorsten', 'Guido', 'Armin', 'Ulf', 'Wolfgang', 'Axel', 'Rolf', 'Norbert', 'Hans-Jörg', 'Ingo', 'Roland', 'Uli', 'Wolfram'];
const DE_1970 = ['Christian', 'Michael', 'Stefan', 'Andreas', 'Thomas', 'Markus', 'Sven', 'Daniel', 'Frank', 'Oliver', 'Jan', 'Tobias', 'Sebastian', 'Alexander', 'Martin', 'Dirk', 'Jens', 'Marco', 'Carsten', 'Thorsten', 'Matthias', 'Björn', 'Kai', 'Mario', 'Holger', 'Ingo', 'Heiko', 'Timo', 'Christoph', 'Dennis', 'Patrick', 'Nils', 'René', 'Torsten', 'Sascha'];
const DE_1980 = ['Christian', 'Daniel', 'Sebastian', 'Michael', 'Stefan', 'Dennis', 'Marcel', 'Tobias', 'Florian', 'Jan', 'Alexander', 'Patrick', 'Marco', 'Philipp', 'Kevin', 'Benjamin', 'Matthias', 'Dominik', 'David', 'Simon', 'Mario', 'Sascha', 'Tim', 'Markus', 'Martin', 'Thomas', 'Andreas', 'Benedikt', 'Fabian', 'Kai', 'Timo', 'Steffen', 'Mike', 'Sven', 'Christoph', 'René'];
const DE_1990 = ['Lukas', 'Jan', 'Tim', 'Niklas', 'Philipp', 'Kevin', 'Daniel', 'Florian', 'Tobias', 'Dennis', 'Marcel', 'Felix', 'Jonas', 'Alexander', 'Fabian', 'Julian', 'Max', 'Patrick', 'Marvin', 'Dominik', 'Christian', 'Sebastian', 'Pascal', 'Nico', 'Robin', 'Moritz', 'Maximilian', 'Yannick', 'Jannik', 'Leon', 'David', 'Sven', 'Steffen', 'Kai', 'Lars', 'Mirco'];
const DE_2000 = ['Lukas', 'Leon', 'Luca', 'Finn', 'Jonas', 'Tim', 'Niklas', 'Jan', 'Ben', 'Paul', 'Luis', 'Felix', 'Maximilian', 'Elias', 'Noah', 'Julian', 'Moritz', 'Tom', 'Nico', 'Philipp', 'Jannik', 'Lennart', 'Mats', 'Linus', 'Fabian', 'Marvin', 'Max', 'Joshua', 'Justin', 'David', 'Erik', 'Simon', 'Johannes', 'Florian', 'Malte', 'Jannis'];
const DE_2010 = ['Ben', 'Paul', 'Leon', 'Noah', 'Finn', 'Elias', 'Luis', 'Felix', 'Henry', 'Jonas', 'Emil', 'Theo', 'Luca', 'Matteo', 'Anton', 'Mats', 'Jakob', 'Liam', 'Leo', 'Milan', 'Moritz', 'Oskar', 'Nico', 'Linus', 'Lukas', 'Max', 'Julian', 'Tim', 'Jannis', 'Lennard', 'Mika', 'Ole', 'Karl', 'Jonathan', 'Malik', 'Levi'];
const DE: FirstNameEra[] = [[0, DE_1930], [1950, DE_1950], [1960, DE_1960], [1970, DE_1970], [1980, DE_1980], [1990, DE_1990], [2000, DE_2000], [2010, DE_2010]];

// --- DDR: bis 1989 eigene Moden, danach wie im Westen -------------------------
const OST: FirstNameEra[] = [
  [0, ['Joachim', 'Hans-Jürgen', 'Eberhard', 'Bernd', 'Jürgen', 'Wolfgang', 'Lothar', 'Gerd', 'Klaus', 'Manfred', 'Siegfried', 'Dieter', 'Harald', 'Frank', 'Gerhard', 'Peter', 'Reinhard', 'Rüdiger', 'Dietmar', 'Hartmut', 'Wilfried', 'Konrad', 'Ulrich', 'Hans-Joachim', 'Werner']],
  [1960, ['Matthias', 'Andreas', 'Thomas', 'Frank', 'Jörg', 'Torsten', 'Ralf', 'Steffen', 'Uwe', 'Olaf', 'Jens', 'Heiko', 'Ulf', 'Rainer', 'Dirk', 'Detlef', 'Lutz', 'Mario', 'Rico', 'Holger', 'Carsten', 'Sven', 'Mirko', 'Marko', 'Hendrik']],
  [1970, ['Ronny', 'René', 'Enrico', 'Sandro', 'Silvio', 'Mirko', 'Maik', 'Steffen', 'Danny', 'Toni', 'Marco', 'Sven', 'Tino', 'Ronald', 'Thomas', 'Daniel', 'Mike', 'Heiko', 'Nico', 'Falko', 'Sebastian', 'Christian', 'Alexander', 'Robert', 'Martin', 'Tom', 'Patrick', 'Rico', 'Kay', 'Jens']],
  [1980, ['Kevin', 'Steve', 'Ronny', 'Rico', 'Denny', 'Danny', 'Toni', 'Marcel', 'Maik', 'Sebastian', 'Christian', 'Tom', 'Martin', 'Robert', 'Tony', 'Patrick', 'Benjamin', 'Paul', 'Philipp', 'Erik', 'Max', 'Felix', 'Stefan', 'Daniel', 'Mike', 'Ricardo', 'Marcus', 'Sandro', 'Justin', 'Eric']],
  [1990, DE_1990], [2000, DE_2000], [2010, DE_2010],
];

// --- Deutsche mit Wurzeln anderswo (Kinder der Gastarbeiter/Aussiedler) -----
const DE_TR: FirstNameEra[] = [
  [0, ['Mehmet', 'Ali', 'Murat', 'Serkan', 'Erdal', 'Mustafa', 'Hakan', 'Ahmet', 'Ercan', 'Süleyman', 'Halil', 'Ünal', 'Ismail', 'Cem', 'Levent']],
  [1985, ['Serkan', 'Kerem', 'Nuri', 'Deniz', 'Baris', 'Emre', 'Can', 'Okan', 'Mert', 'Taner', 'Burak', 'Erhan', 'Tolga', 'Kaan', 'Volkan', 'Gökhan']],
  [2000, ['Yusuf', 'Emre', 'Can', 'Kaan', 'Mert', 'Deniz', 'Eren', 'Arda', 'Efe', 'Emir', 'Ömer', 'Kerem', 'Berkan', 'Enes', 'Elias', 'Yunus']],
];
const DE_PL: FirstNameEra[] = [
  [0, ['Marek', 'Dariusz', 'Piotr', 'Waldemar', 'Andreas', 'Christoph', 'Adam', 'Mirosław', 'Thomas', 'Sebastian', 'Damian', 'Artur']],
  [1988, ['Lukas', 'Marco', 'Sebastian', 'Patrick', 'Christian', 'Dominik', 'Daniel', 'Adrian', 'Kamil', 'Mateusz', 'Patryk', 'Pascal', 'Kevin', 'Dennis']],
  [2003, ['Jakub', 'Oskar', 'Filip', 'Szymon', 'Nikodem', 'Leon', 'Noah', 'Julian', 'Adrian', 'Kacper', 'Max', 'Luca']],
];
const DE_IT: FirstNameEra[] = [
  [0, ['Marco', 'Mario', 'Salvatore', 'Giuseppe', 'Antonio', 'Francesco', 'Luca', 'Vincenzo', 'Daniele', 'Michele', 'Stefano', 'Dario', 'Domenico', 'Rocco', 'Pasquale']],
  [1988, ['Luca', 'Marco', 'Gianluca', 'Alessandro', 'Nico', 'Dario', 'Matteo', 'Fabio', 'Enrico', 'Simone', 'Daniele', 'Leonardo', 'Fabrizio', 'Kevin']],
  [2003, ['Luca', 'Matteo', 'Leonardo', 'Gabriele', 'Lorenzo', 'Noah', 'Elia', 'Nico', 'Enzo', 'Liam', 'Alessio', 'Mattia']],
];
const DE_YU: FirstNameEra[] = [
  [0, ['Mario', 'Ivan', 'Dario', 'Marko', 'Zoran', 'Goran', 'Danijel', 'Denis', 'Edin', 'Emir', 'Alen', 'Milan', 'Robert', 'Saša']],
  [1990, ['Luka', 'Filip', 'Stefan', 'Nikola', 'Marko', 'Tomislav', 'Adnan', 'Amir', 'Kenan', 'Damir', 'Josip', 'Ivan', 'Leon', 'David']],
];

// --- Ausland ----------------------------------------------------------------
const AUT: FirstNameEra[] = [
  [0, ['Franz', 'Johann', 'Josef', 'Herbert', 'Walter', 'Friedrich', 'Karl', 'Ernst', 'Alois', 'Heinz', 'Gerhard', 'Kurt', 'Erich', 'Helmut', 'Rudolf']],
  [1960, ['Andreas', 'Gerhard', 'Peter', 'Herbert', 'Robert', 'Markus', 'Christian', 'Wolfgang', 'Michael', 'Thomas', 'Martin', 'Manfred', 'Günther', 'Anton']],
  [1978, ['Christoph', 'Markus', 'Stefan', 'Daniel', 'Florian', 'Thomas', 'Andreas', 'Michael', 'Martin', 'Christian', 'Roman', 'Jürgen', 'Manuel', 'Patrick', 'René']],
  [1995, ['Lukas', 'David', 'Florian', 'Tobias', 'Philipp', 'Fabian', 'Maximilian', 'Simon', 'Julian', 'Dominik', 'Kevin', 'Marco', 'Nicolas', 'Raphael', 'Valentin', 'Elias', 'Luca', 'Felix', 'Moritz', 'Leon']],
];
const NED: FirstNameEra[] = [
  [0, ['Johan', 'Wim', 'Kees', 'Piet', 'Jan', 'Henk', 'Willem', 'Rinus', 'Gerrit', 'Cor', 'Theo', 'Arie', 'Hans', 'Rob', 'Wim', 'Adrie']],
  [1960, ['Ruud', 'Frank', 'Marco', 'Erwin', 'Ronald', 'Hans', 'Gerald', 'Marcel', 'Edwin', 'Richard', 'Patrick', 'Dennis', 'Jaap', 'Michel', 'Aron']],
  [1980, ['Wesley', 'Arjen', 'Dirk', 'Rafael', 'Robin', 'Ryan', 'Nigel', 'Kevin', 'Jeroen', 'Bas', 'Mark', 'Tim', 'Joris', 'Niels', 'Sander', 'Stijn']],
  [1998, ['Daan', 'Sem', 'Bram', 'Thijs', 'Jesse', 'Lars', 'Luuk', 'Teun', 'Milan', 'Stijn', 'Joey', 'Xavi', 'Ryan', 'Justin', 'Cody', 'Jurriën']],
];
const DEN: FirstNameEra[] = [
  [0, ['Henning', 'Allan', 'Ole', 'Per', 'Jørgen', 'Preben', 'Bent', 'Kurt', 'Finn', 'Erik', 'Poul', 'Flemming', 'Kim', 'Jens']],
  [1960, ['Michael', 'Brian', 'Søren', 'Lars', 'Jan', 'John', 'Morten', 'Kim', 'Jesper', 'Henrik', 'Bjarne', 'Torben', 'Claus', 'Bo']],
  [1980, ['Thomas', 'Martin', 'Daniel', 'Christian', 'Kasper', 'Mads', 'Rasmus', 'Nicklas', 'Simon', 'Jesper', 'Jakob', 'Mikkel', 'Dennis', 'Kenneth']],
  [1998, ['Mikkel', 'Mathias', 'Oliver', 'William', 'Lucas', 'Victor', 'Frederik', 'Magnus', 'Emil', 'Gustav', 'Andreas', 'Jonas', 'Rasmus', 'Mads']],
];
const SWE: FirstNameEra[] = [
  [0, ['Lennart', 'Bo', 'Sven', 'Bengt', 'Gunnar', 'Ingemar', 'Björn', 'Ronnie', 'Ralf', 'Thomas', 'Roland', 'Kent', 'Hans', 'Leif']],
  [1960, ['Glenn', 'Mats', 'Peter', 'Anders', 'Jonas', 'Stefan', 'Tomas', 'Patrik', 'Roger', 'Magnus', 'Mikael', 'Joakim', 'Niclas', 'Jan']],
  [1980, ['Andreas', 'Fredrik', 'Johan', 'Daniel', 'Marcus', 'Kim', 'Christian', 'Sebastian', 'Erik', 'Oscar', 'Mattias', 'Pontus', 'Tobias', 'Martin']],
  [1998, ['Viktor', 'Emil', 'Oscar', 'Gustav', 'Elias', 'Isak', 'Hugo', 'Alexander', 'Albin', 'Anton', 'William', 'Filip', 'Ludvig', 'Jesper']],
];
const NOR: FirstNameEra[] = [
  [0, ['Ole', 'Knut', 'Tore', 'Rune', 'Svein', 'Arne', 'Tom', 'Terje', 'Per', 'Odd', 'Kjell', 'Geir']],
  [1970, ['Tore André', 'John', 'Steffen', 'Ståle', 'Henning', 'Morten', 'Kjetil', 'Thomas', 'Erik', 'Bjørn', 'Espen', 'Trond', 'Øyvind', 'Vegard']],
  [1993, ['Martin', 'Sander', 'Jonas', 'Markus', 'Kristian', 'Tobias', 'Emil', 'Mathias', 'Magnus', 'Sondre', 'Fredrik', 'Håkon', 'Kristoffer', 'Ola']],
];
const YUG: FirstNameEra[] = [
  [0, ['Dragan', 'Dragoslav', 'Velibor', 'Ilija', 'Josip', 'Vladimir', 'Branko', 'Dušan', 'Zlatko', 'Ivica', 'Momčilo', 'Jovan', 'Radomir', 'Blagoje', 'Safet']],
  [1960, ['Zoran', 'Goran', 'Dejan', 'Nenad', 'Predrag', 'Slaviša', 'Darko', 'Dragan', 'Haris', 'Mehmed', 'Faruk', 'Robert', 'Srečko', 'Davor', 'Siniša']],
];
const CRO: FirstNameEra[] = [
  [0, ['Ivan', 'Zvonimir', 'Davor', 'Robert', 'Igor', 'Aljoša', 'Mario', 'Krunoslav', 'Alen', 'Slaven', 'Dario', 'Silvio', 'Goran', 'Nikola']],
  [1980, ['Luka', 'Ivan', 'Marko', 'Josip', 'Ante', 'Mateo', 'Mario', 'Domagoj', 'Tin', 'Dejan', 'Nikola', 'Andrej', 'Borna', 'Lovro', 'Duje', 'Marin']],
];
const SRB: FirstNameEra[] = [
  [0, ['Dejan', 'Siniša', 'Savo', 'Mateja', 'Slaviša', 'Darko', 'Saša', 'Dragan', 'Zoran', 'Goran', 'Ivica', 'Ljubinko', 'Vladimir', 'Predrag']],
  [1980, ['Nemanja', 'Aleksandar', 'Stefan', 'Nikola', 'Dušan', 'Filip', 'Miloš', 'Uroš', 'Lazar', 'Luka', 'Strahinja', 'Veljko', 'Marko', 'Vanja']],
];
const POL: FirstNameEra[] = [
  [0, ['Kazimierz', 'Jan', 'Zbigniew', 'Władysław', 'Andrzej', 'Henryk', 'Jerzy', 'Grzegorz', 'Antoni', 'Roman', 'Stanisław', 'Lesław', 'Janusz']],
  [1960, ['Zbigniew', 'Dariusz', 'Andrzej', 'Jacek', 'Piotr', 'Krzysztof', 'Waldemar', 'Mirosław', 'Ryszard', 'Jarosław', 'Roman', 'Marek', 'Wojciech', 'Tomasz']],
  [1980, ['Tomasz', 'Paweł', 'Marcin', 'Michał', 'Łukasz', 'Bartosz', 'Kamil', 'Piotr', 'Jakub', 'Mariusz', 'Rafał', 'Grzegorz', 'Sebastian', 'Damian']],
  [1998, ['Jakub', 'Kacper', 'Mateusz', 'Szymon', 'Filip', 'Bartosz', 'Kamil', 'Patryk', 'Dawid', 'Przemysław', 'Oskar', 'Adrian', 'Igor', 'Michał']],
];
const ITA: FirstNameEra[] = [
  [0, ['Giacinto', 'Sandro', 'Gianni', 'Luigi', 'Giovanni', 'Franco', 'Roberto', 'Fabio', 'Romeo', 'Giuseppe', 'Claudio', 'Mario', 'Tarcisio', 'Antonio']],
  [1960, ['Roberto', 'Paolo', 'Massimo', 'Stefano', 'Gianluca', 'Walter', 'Franco', 'Fabrizio', 'Giuseppe', 'Riccardo', 'Marco', 'Salvatore', 'Pietro', 'Giancarlo']],
  [1978, ['Alessandro', 'Andrea', 'Francesco', 'Marco', 'Luca', 'Daniele', 'Matteo', 'Simone', 'Davide', 'Fabio', 'Christian', 'Massimo', 'Antonio', 'Giorgio']],
  [1996, ['Lorenzo', 'Federico', 'Riccardo', 'Nicolò', 'Gabriele', 'Matteo', 'Leonardo', 'Tommaso', 'Alessandro', 'Edoardo', 'Giorgio', 'Mattia', 'Davide', 'Samuele']],
];
const ESP: FirstNameEra[] = [
  [0, ['José Antonio', 'Juan', 'Francisco', 'Antonio', 'Manuel', 'Ángel', 'Miguel', 'Rafael', 'Santiago', 'Andoni', 'Julio', 'Ricardo', 'José Luis', 'Jesús']],
  [1965, ['Fernando', 'Sergio', 'Javier', 'Carlos', 'David', 'Raúl', 'Iván', 'Rubén', 'Óscar', 'Alberto', 'Joaquín', 'Xavier', 'Jorge', 'Luis']],
  [1990, ['Pablo', 'Álvaro', 'Alejandro', 'Hugo', 'Adrián', 'Daniel', 'Mario', 'Iker', 'Marcos', 'Diego', 'Unai', 'Pau', 'Jorge', 'Gonzalo']],
];
const FRA: FirstNameEra[] = [
  [0, ['Michel', 'Jean', 'Jacques', 'Dominique', 'Gérard', 'Alain', 'Patrick', 'Jean-Pierre', 'Bernard', 'Didier', 'Christian', 'Daniel']],
  [1962, ['Thierry', 'Laurent', 'Philippe', 'Pascal', 'Frédéric', 'Éric', 'Stéphane', 'Christophe', 'Franck', 'Jean-Marc', 'Bruno', 'Didier']],
  [1978, ['Nicolas', 'Julien', 'Sébastien', 'Romain', 'Mathieu', 'Florent', 'Jérôme', 'Ludovic', 'Anthony', 'Benoît', 'Yoann', 'Kevin']],
  [1996, ['Hugo', 'Lucas', 'Théo', 'Maxime', 'Enzo', 'Mathis', 'Nathan', 'Clément', 'Antoine', 'Valentin', 'Baptiste', 'Alexis', 'Rayan', 'Adrien']],
];
const ENG: FirstNameEra[] = [
  [0, ['Kevin', 'Trevor', 'Keith', 'Mick', 'Ray', 'Terry', 'Ian', 'Brian', 'Geoff', 'Colin', 'Malcolm', 'Alan', 'Roy', 'Dave']],
  [1960, ['Paul', 'Mark', 'David', 'Gary', 'Steve', 'Stuart', 'Tony', 'Neil', 'Andy', 'Chris', 'Glenn', 'Des', 'Nigel', 'Peter']],
  [1975, ['Lee', 'Darren', 'Craig', 'Wayne', 'Ashley', 'Jamie', 'Gareth', 'Danny', 'Ryan', 'Matthew', 'Michael', 'Steven', 'Scott', 'Dean']],
  [1995, ['Jack', 'Harry', 'Callum', 'Jordan', 'Kyle', 'Connor', 'Ben', 'Luke', 'Tom', 'Josh', 'Mason', 'Declan', 'Jacob', 'Reece', 'Kieran']],
];
const TUR: FirstNameEra[] = [
  [0, ['Mehmet', 'Ahmet', 'Mustafa', 'Hüseyin', 'Ali', 'Hasan', 'İbrahim', 'Metin', 'Cemil', 'Rıdvan', 'Tanju', 'Şenol', 'Fatih', 'Erdal']],
  [1965, ['Hakan', 'Tolga', 'Ogün', 'Bülent', 'Tugay', 'Sergen', 'Rüştü', 'Ümit', 'Okan', 'Abdullah', 'Alpay', 'Arif', 'Oktay', 'Ertuğrul']],
  [1980, ['Emre', 'Burak', 'Serkan', 'Tuncay', 'Gökhan', 'Volkan', 'Semih', 'Selçuk', 'Sabri', 'Nihat', 'Arda', 'Mehmet', 'Onur', 'Caner', 'Ozan']],
  [1998, ['Yusuf', 'Eren', 'Kerem', 'Arda', 'Berkay', 'Enes', 'Efe', 'Barış', 'Ömer', 'Mert', 'Emirhan', 'Kaan', 'Orkun', 'Berat']],
];
const BRA: FirstNameEra[] = [
  [0, ['Paulo', 'José', 'João', 'Roberto', 'Carlos', 'Sebastião', 'Antônio', 'Luiz', 'Waldir', 'Edson', 'Jair', 'Reinaldo', 'Valdomiro']],
  [1960, ['Marcos', 'Sérgio', 'Ricardo', 'Cláudio', 'Marcelo', 'Jorge', 'Paulo Roberto', 'Luiz Carlos', 'Valdir', 'Márcio', 'Renato', 'Alexandre']],
  [1978, ['Rafael', 'Rodrigo', 'Bruno', 'Diego', 'Thiago', 'Felipe', 'Leandro', 'Fernando', 'Anderson', 'Fábio', 'Luciano', 'Juliano', 'Gilberto', 'Wellington']],
  [1996, ['Gabriel', 'Lucas', 'Matheus', 'Guilherme', 'Pedro', 'Vinícius', 'João Pedro', 'Kauã', 'Gustavo', 'Felipe', 'Bruno', 'Arthur', 'Davi', 'Igor']],
];

/** Kohorten je Herkunfts-ID (Schlüssel wie in ORIGINS). */
export const FIRST_BY_ERA: Record<string, FirstNameEra[]> = {
  ger: DE, ger_modern: DE, ger_ost: OST, ger_tr: DE_TR, ger_pl: DE_PL, ger_it: DE_IT, ger_yu: DE_YU,
  aut: AUT, ned: NED, den: DEN, swe: SWE, nor: NOR, yug: YUG, cro: CRO, srb: SRB, pol: POL,
  ita: ITA, esp: ESP, fra: FRA, eng: ENG, tur: TUR, bra: BRA,
};
