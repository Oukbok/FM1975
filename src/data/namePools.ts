// =============================================================================
// Erweiterte Namenspools je Herkunft (häufige, generische Vor- und Nachnamen).
// Werden in data/origins.ts mit den Grundlisten zusammengeführt, damit sich
// Namen über Jahrzehnte kaum wiederholen. Kombinationen sind zufällig – es gibt
// keine Zuordnung zu realen Personen.
// =============================================================================

export const EXTRA_NAMES: Record<string, { first?: string[]; last?: string[] }> = {
  ger: {
    first: ['Alfred', 'Bernhard', 'Burkhard', 'Christoph', 'Dietmar', 'Eberhard', 'Egon', 'Erich', 'Ernst', 'Erwin', 'Friedhelm', 'Fritz', 'Gerd', 'Gerhard', 'Gregor', 'Harald', 'Heiko', 'Heinz', 'Helmut', 'Hermann', 'Hubert', 'Ingo', 'Joachim', 'Johannes', 'Josef', 'Kurt', 'Lothar', 'Ludwig', 'Lutz', 'Martin', 'Norbert', 'Olaf', 'Otto', 'Paul', 'Reiner', 'Roland', 'Rolf', 'Rüdiger', 'Siegfried', 'Ulrich', 'Ulf', 'Walter', 'Wilfried', 'Willi', 'Wolfram', 'Axel', 'Bodo', 'Claus', 'Ewald', 'Hanno', 'Jochen', 'Klemens', 'Mathias', 'Rudolf', 'Theo', 'Gunnar', 'Karsten', 'Heiner', 'Armin', 'Gernot'],
    last: ['Albrecht', 'Bauer', 'Baumann', 'Beck', 'Berger', 'Bergmann', 'Böhm', 'Brinkmann', 'Dörr', 'Ebert', 'Eckert', 'Fiedler', 'Frank', 'Franke', 'Friedrich', 'Fuchs', 'Graf', 'Groß', 'Günther', 'Haas', 'Hahn', 'Heinrich', 'Heinz', 'Hesse', 'Horn', 'Huber', 'Jäger', 'Jung', 'Kaiser', 'Keller', 'Kern', 'Kirchner', 'Knoll', 'König', 'Kraft', 'Kramer', 'Kühn', 'Kunz', 'Lang', 'Lorenz', 'Ludwig', 'Maier', 'Martin', 'Mayer', 'Menzel', 'Michel', 'Moser', 'Nagel', 'Noack', 'Otto', 'Pfeiffer', 'Ritter', 'Roth', 'Sauer', 'Schäfer', 'Schmid', 'Schmitz', 'Schubert', 'Schulte', 'Schuster', 'Schwarz', 'Sommer', 'Stein', 'Thomas', 'Ullrich', 'Vogt', 'Voigt', 'Weiß', 'Werner', 'Winkler', 'Winter', 'Wolff', 'Ziegler', 'Zimmer', 'Bach', 'Brenner', 'Decker', 'Ernst', 'Geiger', 'Gerlach', 'Hagen', 'Hauser', 'Hecht', 'Henning', 'Hinz', 'Höfer', 'Kessler', 'Kranz', 'Kurz', 'Lindner', 'Marx', 'Merz', 'Naumann', 'Probst', 'Reuter', 'Rieger', 'Rösler', 'Sander', 'Seifert', 'Simon', 'Stark', 'Steiner', 'Strauß', 'Thiel', 'Unger', 'Wendt', 'Wirth', 'Witt', 'Wörner', 'Brückner', 'Dittmar', 'Eichler', 'Falk', 'Gärtner', 'Hammer', 'Heller', 'Janssen', 'Kolb', 'Lenz', 'Mertens', 'Nowak', 'Petersen', 'Rademacher', 'Reinhardt', 'Rothe', 'Scheffler', 'Schlüter', 'Sievers', 'Thieme', 'Vogler', 'Wegner', 'Wiese'],
  },
  ger_modern: {
    first: ['Lennart', 'Mats', 'Nils', 'Paul', 'Ben', 'Elias', 'Noah', 'Linus', 'Jannik', 'Marvin', 'Robin', 'Pascal', 'Sebastian', 'Dominik', 'Christian', 'Marc', 'Patrick', 'Daniel', 'Steffen', 'Sascha', 'Mario', 'René', 'Malte', 'Henrik', 'Till', 'Anton', 'Emil', 'Jakob', 'Konstantin', 'Leonard', 'Johannes', 'Vincent', 'Erik', 'Hannes', 'Ole', 'Joshua', 'Yannick', 'Maximilian', 'Kilian', 'Simon'],
    last: ['Albrecht', 'Bauer', 'Baumann', 'Berger', 'Böhm', 'Brandt', 'Busch', 'Dietrich', 'Ebert', 'Engel', 'Fiedler', 'Frank', 'Franke', 'Fuchs', 'Graf', 'Günther', 'Haas', 'Hahn', 'Heinrich', 'Herrmann', 'Horn', 'Jäger', 'Jansen', 'Jung', 'Kaiser', 'Keller', 'Klein', 'König', 'Kraft', 'Kramer', 'Kuhn', 'Lorenz', 'Ludwig', 'Martin', 'Meier', 'Möller', 'Peters', 'Pohl', 'Roth', 'Sauer', 'Schäfer', 'Schmitz', 'Schubert', 'Schulte', 'Seidel', 'Sommer', 'Stein', 'Vogel', 'Vogt', 'Weiß', 'Winkler', 'Winter', 'Ziegler', 'Brinkmann', 'Hesse', 'Lindner', 'Naumann', 'Thiel', 'Wendt', 'Wiese'],
  },
  ger_tr: {
    first: ['Mehmet', 'Mustafa', 'Ahmet', 'Ali', 'Hasan', 'Hüseyin', 'Murat', 'Emre', 'Serkan', 'Volkan', 'Kerem', 'Burak', 'Can', 'Deniz', 'Erkan', 'Gökhan', 'Kaan', 'Okan', 'Onur', 'Tolga', 'Yusuf', 'Cem'],
    last: ['Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Yıldız', 'Yıldırım', 'Öztürk', 'Aydın', 'Özdemir', 'Arslan', 'Doğan', 'Kılıç', 'Aslan', 'Çetin', 'Kara', 'Koç', 'Kurt', 'Özkan', 'Şimşek', 'Polat', 'Erdem'],
  },
  ger_af: {
    first: ['Kevin', 'Jeremy', 'David', 'Samuel', 'Daniel', 'Patrick', 'Emmanuel', 'Joel', 'Noah', 'Elias', 'Jamal', 'Malik', 'Yannick', 'Joshua'],
    last: ['Amankwah', 'Mensah', 'Owusu', 'Asante', 'Adjei', 'Ofori', 'Nkemelu', 'Okafor', 'Diallo', 'Kouassi', 'Traoré', 'Camara', 'Tetteh', 'Agyei'],
  },
  ger_pl: {
    first: ['Marek', 'Tomasz', 'Dariusz', 'Krzysztof', 'Piotr', 'Adam', 'Mateusz', 'Kamil', 'Jakub', 'Lukas', 'Patryk', 'Sebastian'],
    last: ['Nowak', 'Kowalski', 'Wiśniewski', 'Wójcik', 'Kamiński', 'Lewandowicz', 'Zieliński', 'Szymański', 'Woźniak', 'Dąbrowski', 'Kozłowski', 'Jankowski'],
  },
  aut: {
    first: ['Herbert', 'Gerhard', 'Walter', 'Johann', 'Franz', 'Alois', 'Christian', 'Markus', 'Andreas', 'Martin', 'Roman', 'Thomas', 'Michael', 'Florian', 'Lukas', 'David', 'Stefan', 'Peter'],
    last: ['Gruber', 'Huber', 'Bauer', 'Wagner', 'Pichler', 'Steiner', 'Moser', 'Mayer', 'Hofer', 'Leitner', 'Berger', 'Fuchs', 'Eder', 'Fischer', 'Schmid', 'Winkler', 'Weber', 'Schwarz', 'Maier', 'Reiter'],
  },
  sui: {
    first: ['Urs', 'Beat', 'Reto', 'Marco', 'Stephan', 'Daniel', 'Roger', 'Patrick', 'Fabian', 'Remo', 'Silvan', 'Nico', 'Pascal', 'Yann'],
    last: ['Müller', 'Meier', 'Schmid', 'Keller', 'Weber', 'Huber', 'Schneider', 'Meyer', 'Steiner', 'Fischer', 'Gerber', 'Brunner', 'Baumann', 'Frei', 'Zimmermann', 'Moser'],
  },
  ned: {
    first: ['Jan', 'Kees', 'Piet', 'Wim', 'Henk', 'Johan', 'Ruud', 'Frank', 'Marco', 'Dennis', 'Arjen', 'Wesley', 'Daan', 'Bram', 'Sem', 'Thijs', 'Joost', 'Sander'],
    last: ['de Jong', 'Jansen', 'de Vries', 'van den Berg', 'van Dijk', 'Bakker', 'Visser', 'Smit', 'Meijer', 'de Boer', 'Mulder', 'de Groot', 'Bos', 'Vos', 'Peters', 'Hendriks', 'van Leeuwen', 'Dekker', 'Brouwer', 'de Wit'],
  },
  bel: {
    first: ['Jean', 'Luc', 'Marc', 'Eric', 'Philippe', 'Dirk', 'Bart', 'Kevin', 'Thomas', 'Yannick', 'Jelle', 'Wout', 'Pieter', 'Jonas'],
    last: ['Peeters', 'Janssens', 'Maes', 'Jacobs', 'Mertens', 'Willems', 'Claes', 'Goossens', 'Wouters', 'De Smet', 'Dubois', 'Lambert', 'Dupont', 'Martens', 'Hermans'],
  },
  den: {
    first: ['Lars', 'Jens', 'Søren', 'Henrik', 'Morten', 'Michael', 'Peter', 'Kasper', 'Rasmus', 'Mads', 'Mikkel', 'Jesper', 'Thomas', 'Anders'],
    last: ['Jensen', 'Nielsen', 'Hansen', 'Pedersen', 'Andersen', 'Christensen', 'Larsen', 'Sørensen', 'Rasmussen', 'Jørgensen', 'Petersen', 'Madsen', 'Kristensen', 'Olsen'],
  },
  swe: {
    first: ['Anders', 'Lars', 'Per', 'Mats', 'Magnus', 'Johan', 'Fredrik', 'Henrik', 'Andreas', 'Erik', 'Oscar', 'Viktor', 'Emil', 'Gustav'],
    last: ['Andersson', 'Johansson', 'Karlsson', 'Nilsson', 'Eriksson', 'Larsson', 'Olsson', 'Persson', 'Svensson', 'Gustafsson', 'Pettersson', 'Jonsson', 'Lindberg', 'Lindqvist'],
  },
  yug: {
    first: ['Dragan', 'Zoran', 'Goran', 'Milan', 'Dejan', 'Nenad', 'Predrag', 'Slobodan', 'Vladimir', 'Branko', 'Ivica', 'Safet'],
    last: ['Petrović', 'Jovanović', 'Nikolić', 'Marković', 'Đorđević', 'Stojanović', 'Ilić', 'Pavlović', 'Hadžić', 'Kovačević', 'Popović', 'Savić'],
  },
  cro: {
    first: ['Ivan', 'Luka', 'Marko', 'Josip', 'Ante', 'Mario', 'Igor', 'Dario', 'Nikola', 'Tomislav', 'Mateo', 'Domagoj'],
    last: ['Horvat', 'Kovačević', 'Babić', 'Marić', 'Jurić', 'Novak', 'Knežević', 'Vuković', 'Matić', 'Perić', 'Tomić', 'Pavić'],
  },
  pol: {
    first: ['Andrzej', 'Grzegorz', 'Paweł', 'Marcin', 'Łukasz', 'Michał', 'Robert', 'Rafał', 'Wojciech', 'Artur'],
    last: ['Nowak', 'Kowalczyk', 'Mazur', 'Krawczyk', 'Kaczmarek', 'Grabowski', 'Pawlak', 'Michalski', 'Król', 'Wieczorek'],
  },
  cze: {
    first: ['Jan', 'Petr', 'Pavel', 'Tomáš', 'Martin', 'Jiří', 'Michal', 'Lukáš', 'Jakub', 'Ondřej', 'Václav', 'Vladimír'],
    last: ['Novák', 'Svoboda', 'Novotný', 'Dvořák', 'Černý', 'Procházka', 'Kučera', 'Veselý', 'Horák', 'Němec', 'Marek', 'Pokorný'],
  },
  rus: {
    first: ['Sergej', 'Aleksej', 'Dmitrij', 'Andrej', 'Igor', 'Juri', 'Wladimir', 'Nikolai', 'Oleg', 'Viktor', 'Pawel', 'Roman'],
    last: ['Iwanow', 'Smirnow', 'Kusnezow', 'Popow', 'Wassiljew', 'Petrow', 'Sokolow', 'Michailow', 'Nowikow', 'Fjodorow', 'Morosow', 'Wolkow'],
  },
  ita: {
    first: ['Marco', 'Luca', 'Andrea', 'Paolo', 'Giuseppe', 'Francesco', 'Alessandro', 'Stefano', 'Roberto', 'Davide', 'Simone', 'Matteo', 'Fabio', 'Daniele'],
    last: ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'De Luca', 'Costa', 'Mancini'],
  },
  esp: {
    first: ['Javier', 'Carlos', 'José', 'Manuel', 'David', 'Daniel', 'Sergio', 'Pablo', 'Álvaro', 'Iker', 'Raúl', 'Fernando', 'Diego', 'Rubén'],
    last: ['García', 'Fernández', 'González', 'Rodríguez', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín', 'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno', 'Álvarez'],
  },
  fra: {
    first: ['Jean', 'Pierre', 'Michel', 'Philippe', 'Alain', 'Nicolas', 'Julien', 'Sébastien', 'Antoine', 'Hugo', 'Lucas', 'Théo', 'Maxime', 'Romain'],
    last: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'Fournier'],
  },
  eng: {
    first: ['John', 'David', 'Paul', 'Mark', 'Steve', 'Gary', 'Ian', 'Peter', 'James', 'Michael', 'Chris', 'Daniel', 'Jack', 'Harry', 'Tom', 'Ben'],
    last: ['Smith', 'Jones', 'Williams', 'Taylor', 'Brown', 'Davies', 'Evans', 'Wilson', 'Thomas', 'Johnson', 'Roberts', 'Robinson', 'Thompson', 'Wright', 'Walker', 'White', 'Hughes', 'Green'],
  },
  bra: {
    first: ['João', 'Pedro', 'Lucas', 'Gabriel', 'Rafael', 'Thiago', 'Felipe', 'Bruno', 'Gustavo', 'Diego', 'Rodrigo', 'Marcelo'],
    last: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Pereira', 'Ferreira', 'Costa', 'Rodrigues', 'Almeida', 'Nascimento', 'Carvalho'],
  },
  tur: {
    first: ['Mehmet', 'Mustafa', 'Ahmet', 'Hakan', 'Arda', 'Emre', 'Selçuk', 'Burak', 'Oğuzhan', 'Caner', 'Yunus', 'Ozan'],
    last: ['Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Yıldız', 'Öztürk', 'Aydın', 'Arslan', 'Doğan', 'Kılıç', 'Aslan'],
  },
};

/**
 * Bekannte Kombinationen realer Fußballer, die der Zufall nicht erzeugen soll.
 * (Einzelne häufige Vor- und Nachnamen sind unproblematisch – nur die Paare.)
 */
export const BLOCKED_NAMES = new Set([
  'Gerd Müller', 'Thomas Müller', 'Dieter Müller', 'Hansi Müller', 'Klaus Fischer', 'Jens Lehmann', 'Bernd Schuster',
  'Andreas Möller', 'Michael Schulz', 'Paolo Rossi', 'Thiago Silva', 'Diego Costa', 'Henrik Larsson', 'Frank de Boer',
  'Peter Neururer', 'Hans Meyer', 'Thomas Schaaf', 'Werner Lorant', 'Christian Ziege', 'Thomas Helmer', 'Stefan Kuntz',
  'Jürgen Kohler', 'Thomas Berthold', 'Lukas Podolski', 'Marco Reus', 'Mario Gomez', 'Jan Koller', 'Uwe Seeler',
  'Ji-sung Park', 'Heung-min Son', 'Ilkay Gündogan', 'Ilkay Gündoğan', 'Mesut Özil', 'Jerome Boateng', 'Ivan Rakitić', 'Luka Modrić', 'Marko Arnautović',
  // Historische Täter und Politiker (Hinweis aus der Namensprüfung): solche Paare nie erzeugen.
  'Albert Speer', 'Rudolf Hess', 'Rudolf Heß', 'Hermann Göring', 'Heinrich Himmler', 'Joseph Goebbels', 'Adolf Eichmann',
  'Martin Bormann', 'Reinhard Heydrich', 'Erich Mielke', 'Erich Honecker', 'Walter Ulbricht', 'Egon Krenz',
  'Willy Brandt', 'Helmut Schmidt', 'Helmut Kohl', 'Gerhard Schröder', 'Angela Merkel', 'Olaf Scholz', 'Friedrich Merz',
  'Gordon Brown', 'Tony Blair', 'David Cameron', 'Boris Johnson', 'Margaret Thatcher', 'John Major',
]);

/**
 * Zusätzlich gesperrt nur für Namen zur abweichenden Ethnie (data/ethnicity.ts `heritageName`):
 * neue Kombinationen aus Gastland-Vorname + Herkunfts-Nachname. Getrennt von BLOCKED_NAMES,
 * damit `makeName` (und damit die Zufallsfolge aller übrigen Spieler) unverändert bleibt.
 */
export const HERITAGE_BLOCKED = new Set([
  'Christian Bassogog', 'Stéphane Mbia', 'Benoît Assou-Ekotto', 'Nicolas Nkoulou', 'Sofyan Amrabat', 'Nordin Amrabat', 'Asamoah Gyan', 'Stephen Appiah', 'Kevin-Prince Boateng', 'Yaya Touré', 'Kolo Touré', 'Djibril Cissé', 'Papiss Cissé', 'Moussa Sissoko', 'Mahamadou Diarra', 'Lassana Diarra', 'Alou Diarra', 'Adama Traoré', 'Hamari Traoré', 'Ibrahima Traoré', 'Sadio Mané', 'Ismaïla Sarr', 'Kalidou Koulibaly', 'Ousmane Dembélé', 'Moussa Dembélé', 'Idrissa Gueye', 'Mamadou Sakho', 'Cheikhou Kouyaté', 'Abdoulaye Doucouré', 'Moussa Diaby', 'Ibrahima Konaté', 'Moussa Konaté', 'Ferland Mendy', 'Benjamin Mendy', 'Edouard Mendy', 'Hakim Ziyech', 'Achraf Hakimi', 'Karim Benzema', 'Riyad Mahrez', "Samuel Eto'o", 'Joël Matip', 'André Onana', 'Wilfred Ndidi', 'Victor Moses', 'Ahmed Musa', 'Victor Osimhen', 'Kelechi Iheanacho', 'Emmanuel Adebayor', 'Michael Essien', 'Sulley Muntari', 'Thomas Partey', 'Mohammed Kudus', 'Inaki Williams', 'Burak Yılmaz', 'Hakan Çalhanoğlu', 'Arda Turan', 'Arda Güler', 'Cenk Tosun', 'Nuri Şahin', 'Hamit Altıntop', 'Halil Altıntop', 'Emre Can', 'Ozan Kabak', 'Kerem Demirbay', 'Mehmet Scholl', 'Ivan Perišić', 'Mario Mandžukić', 'Dejan Lovren', 'Davor Šuker', 'Zvonimir Boban', 'Granit Xhaka', 'Xherdan Shaqiri', 'Haris Seferović', 'Valon Behrami', 'Blerim Džemaili', 'Robert Lewandowski', 'Jakub Błaszczykowski', 'Łukasz Piszczek', 'Miroslav Klose', 'Dariusz Wosz', 'Shinji Kagawa', 'Makoto Hasebe', 'Takumi Minamino', 'Ritsu Doan', 'Kim Min-jae', 'Son Heung-min',
]);
