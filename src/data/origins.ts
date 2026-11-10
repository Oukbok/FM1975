import { BLOCKED_NAMES, EXTRA_NAMES } from './namePools';
import { MORE_NAMES } from './namePoolsMore';
import { FIRST_BY_ERA, type FirstNameEra } from './nameEras';
// =============================================================================
// Herkünfte: Namenslisten, Nationalität und Gesichtsgruppe (für spätere Porträts).
// Der Ausländeranteil und die Herkunftsmischung ändern sich je Jahrzehnt.
// Bewusst nur gängige Namen – keine bekannten Spielernamen.
// =============================================================================

export type FaceGroup =
  | 'mitteleuropa' | 'nordeuropa' | 'suedeuropa' | 'osteuropa' | 'balkan'
  | 'tuerkei' | 'westafrika' | 'lateinamerika' | 'ostasien' | 'nordafrika';

export interface Origin {
  id: string;
  /** Nationalitäts-Kürzel, wie es im Spiel angezeigt wird. */
  nationality: string;
  face: FaceGroup;
  first: string[];
  last: string[];
  /**
   * Vornamen je Geburtsjahrgang: [ab Jahr, Namen] aufsteigend (data/nameEras.ts).
   * Fehlt das Feld oder ist es leer, gilt `first` für alle Jahrgänge.
   */
  firstByEra?: FirstNameEra[];
  /**
   * Verdeckte Ethnie (Wunsch Pascal): Anteile der Gesichtsgruppen je Stützjahr
   * (Jahr, in dem die Spieler etwa 20 sind), dazwischen übergeblendet. So ist ein
   * Engländer meist `mitteleuropa`, aber mit wachsendem Anteil `westafrika`.
   * Fehlt das Feld, gilt immer `face`. Nie im Spiel sichtbar – nur fürs Gesicht.
   */
  faceMix?: FaceMix;
}

export type FaceMix = [number, Partial<Record<FaceGroup, number>>][];

export const ORIGINS: Record<string, Origin> = {
  ger: { id: 'ger', nationality: 'GER', face: 'mitteleuropa',
    first: ['Klaus', 'Hans', 'Jürgen', 'Uwe', 'Manfred', 'Wolfgang', 'Rainer', 'Dieter', 'Rudi', 'Bernd', 'Karl', 'Günter', 'Horst', 'Werner', 'Norbert', 'Herbert', 'Reinhard', 'Michael', 'Thomas', 'Andreas', 'Stefan', 'Peter', 'Frank', 'Ralf', 'Holger', 'Detlef', 'Hartmut', 'Bodo', 'Volker', 'Jens'],
    last: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Hoffmann', 'Schulz', 'Koch', 'Bauer', 'Richter', 'Klein', 'Wolf', 'Neumann', 'Braun', 'Zimmermann', 'Krüger', 'Hartmann', 'Lange', 'Krause', 'Lehmann', 'Köhler', 'Herrmann', 'Walter', 'Schröder', 'Peters', 'Möller', 'Jansen', 'Brandt', 'Scholz', 'Busch', 'Kuhn', 'Pohl', 'Engel', 'Seidel', 'Arnold', 'Dietrich', 'Vogel'] },
  ger_modern: { id: 'ger_modern', nationality: 'GER', face: 'mitteleuropa',
    first: ['Jonas', 'Leon', 'Lukas', 'Felix', 'Tim', 'Niklas', 'Jan', 'Max', 'Julian', 'Florian', 'Tobias', 'Kevin', 'Dennis', 'Marcel', 'Philipp', 'Moritz', 'Fabian', 'Benedikt', 'Luca', 'Finn'],
    last: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann', 'Koch', 'Richter', 'Wolf', 'Schröder', 'Neumann', 'Schwarz', 'Zimmermann', 'Braun', 'Hofmann', 'Hartmann', 'Lange', 'Werner', 'Krause', 'Lehmann', 'Schmitt'] },
  ger_tr: { id: 'ger_tr', nationality: 'GER', face: 'tuerkei',
    first: ['Mehmet', 'Emre', 'Can', 'Kerem', 'Deniz', 'Serkan', 'Okan', 'Baris', 'Mert', 'Ilkay', 'Yusuf', 'Kaan'],
    last: ['Yilmaz', 'Kaya', 'Demir', 'Sahin', 'Celik', 'Yildiz', 'Aydin', 'Öztürk', 'Arslan', 'Dogan', 'Kilic', 'Aslan'] },
  ger_af: { id: 'ger_af', nationality: 'GER', face: 'westafrika',
    first: ['David', 'Daniel', 'Jerome', 'Benjamin', 'Samuel', 'Kevin', 'Jonathan', 'Joshua', 'Noah', 'Malik'],
    last: ['Mensah', 'Owusu', 'Boateng', 'Asante', 'Adeyemi', 'Okafor', 'Diallo', 'Nkemelu', 'Addo', 'Amoah'] },
  ger_pl: { id: 'ger_pl', nationality: 'GER', face: 'osteuropa',
    first: ['Lukas', 'Marco', 'Sebastian', 'Patrick', 'Christian', 'Dominik', 'Daniel', 'Adrian'],
    last: ['Nowak', 'Kowalski', 'Wisniewski', 'Lewandowicz', 'Kaminski', 'Zielinski', 'Szymanski', 'Wozniak'] },
  aut: { id: 'aut', nationality: 'AUT', face: 'mitteleuropa',
    first: ['Franz', 'Johann', 'Josef', 'Herbert', 'Walter', 'Robert', 'Andreas', 'Christoph', 'Markus', 'Gerhard'],
    last: ['Gruber', 'Huber', 'Bauer', 'Wagner', 'Pichler', 'Steiner', 'Moser', 'Mayer', 'Hofer', 'Leitner', 'Berger', 'Fuchs'] },
  sui: { id: 'sui', nationality: 'SUI', face: 'mitteleuropa',
    first: ['Urs', 'Beat', 'Reto', 'Marco', 'Daniel', 'Stefan', 'Lukas', 'Simon'],
    last: ['Meier', 'Keller', 'Frei', 'Gerber', 'Brunner', 'Baumann', 'Zürcher', 'Schmid', 'Widmer', 'Graf'] },
  ned: { id: 'ned', nationality: 'NED', face: 'mitteleuropa',
    first: ['Johan', 'Willem', 'Jan', 'Pieter', 'Ruud', 'Frank', 'Arjen', 'Dirk', 'Bram', 'Sven'],
    last: ['de Jong', 'Jansen', 'de Vries', 'van den Berg', 'van Dijk', 'Bakker', 'Visser', 'Smit', 'Meijer', 'de Boer', 'Mulder', 'Bos'] },
  bel: { id: 'bel', nationality: 'BEL', face: 'mitteleuropa',
    first: ['Jan', 'Luc', 'Marc', 'Eric', 'Kevin', 'Thomas', 'Wim', 'Bart'],
    last: ['Peeters', 'Janssens', 'Maes', 'Jacobs', 'Mertens', 'Willems', 'Claes', 'Goossens', 'Wouters', 'Dubois'] },
  den: { id: 'den', nationality: 'DEN', face: 'nordeuropa',
    first: ['Søren', 'Morten', 'Lars', 'Henrik', 'Jesper', 'Allan', 'Brian', 'Kasper', 'Mads', 'Rasmus'],
    last: ['Jensen', 'Nielsen', 'Hansen', 'Pedersen', 'Andersen', 'Christensen', 'Larsen', 'Sørensen', 'Rasmussen', 'Poulsen'] },
  swe: { id: 'swe', nationality: 'SWE', face: 'nordeuropa',
    first: ['Anders', 'Lars', 'Magnus', 'Johan', 'Erik', 'Fredrik', 'Mikael', 'Patrik', 'Oskar', 'Viktor'],
    last: ['Andersson', 'Johansson', 'Karlsson', 'Nilsson', 'Eriksson', 'Larsson', 'Olsson', 'Persson', 'Svensson', 'Gustafsson'] },
  nor: { id: 'nor', nationality: 'NOR', face: 'nordeuropa',
    first: ['Ole', 'Knut', 'Tore', 'Rune', 'Håkon', 'Erling', 'Martin', 'Sondre'],
    last: ['Hansen', 'Johansen', 'Olsen', 'Larsen', 'Berg', 'Haugen', 'Dahl', 'Lie', 'Solberg'] },
  yug: { id: 'yug', nationality: 'YUG', face: 'balkan',
    first: ['Dragan', 'Zoran', 'Milan', 'Goran', 'Branko', 'Dejan', 'Vladimir', 'Nenad', 'Predrag', 'Slobodan'],
    last: ['Jovanović', 'Petrović', 'Nikolić', 'Marković', 'Đorđević', 'Stojanović', 'Ilić', 'Pavlović', 'Kovačević', 'Popović'] },
  cro: { id: 'cro', nationality: 'CRO', face: 'balkan',
    first: ['Ivan', 'Luka', 'Marko', 'Ante', 'Josip', 'Mario', 'Dario', 'Niko'],
    last: ['Horvat', 'Kovačević', 'Babić', 'Marić', 'Jurić', 'Novak', 'Knežević', 'Vuković', 'Perić'] },
  srb: { id: 'srb', nationality: 'SRB', face: 'balkan',
    first: ['Nemanja', 'Aleksandar', 'Stefan', 'Nikola', 'Dušan', 'Filip', 'Miloš', 'Uroš'],
    last: ['Jovanović', 'Petrović', 'Nikolić', 'Ilić', 'Đukić', 'Lazić', 'Mitrović', 'Savić'] },
  pol: { id: 'pol', nationality: 'POL', face: 'osteuropa',
    first: ['Andrzej', 'Piotr', 'Krzysztof', 'Tomasz', 'Marcin', 'Jakub', 'Paweł', 'Michał'],
    last: ['Nowak', 'Kowalski', 'Wiśniewski', 'Wójcik', 'Kowalczyk', 'Kamiński', 'Lewandowski', 'Zieliński', 'Szymański'] },
  cze: { id: 'cze', nationality: 'TCH', face: 'osteuropa',
    first: ['Jan', 'Petr', 'Josef', 'Pavel', 'Martin', 'Tomáš', 'Jiří', 'Karel'],
    last: ['Novák', 'Svoboda', 'Novotný', 'Dvořák', 'Černý', 'Procházka', 'Kučera', 'Veselý', 'Horák'] },
  hun: { id: 'hun', nationality: 'HUN', face: 'osteuropa',
    first: ['László', 'István', 'Zoltán', 'Gábor', 'Péter', 'Tamás', 'Balázs'],
    last: ['Nagy', 'Kovács', 'Tóth', 'Szabó', 'Horváth', 'Varga', 'Kiss', 'Molnár'] },
  rus: { id: 'rus', nationality: 'RUS', face: 'osteuropa',
    first: ['Sergej', 'Andrej', 'Dmitri', 'Alexej', 'Igor', 'Juri', 'Oleg', 'Wladimir'],
    last: ['Iwanow', 'Smirnow', 'Kusnezow', 'Popow', 'Wassiljew', 'Petrow', 'Sokolow', 'Morosow'] },
  ita: { id: 'ita', nationality: 'ITA', face: 'suedeuropa',
    first: ['Marco', 'Luca', 'Giuseppe', 'Antonio', 'Francesco', 'Alessandro', 'Andrea', 'Paolo', 'Roberto', 'Davide'],
    last: ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco'] },
  esp: { id: 'esp', nationality: 'ESP', face: 'suedeuropa',
    first: ['José', 'Juan', 'Javier', 'Carlos', 'Miguel', 'Sergio', 'David', 'Pablo', 'Álvaro', 'Iker'],
    last: ['García', 'Fernández', 'González', 'Rodríguez', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Ruiz'] },
  por: { id: 'por', nationality: 'POR', face: 'suedeuropa',
    first: ['João', 'Rui', 'Pedro', 'Nuno', 'Tiago', 'Bruno', 'Diogo', 'André'],
    last: ['Silva', 'Santos', 'Ferreira', 'Pereira', 'Oliveira', 'Costa', 'Rodrigues', 'Martins'] },
  fra: { id: 'fra', nationality: 'FRA', face: 'mitteleuropa',
    first: ['Jean', 'Pierre', 'Michel', 'Philippe', 'Thierry', 'Laurent', 'Nicolas', 'Julien', 'Antoine', 'Hugo'],
    last: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau'] },
  fra_af: { id: 'fra_af', nationality: 'FRA', face: 'westafrika',
    first: ['Ousmane', 'Moussa', 'Ibrahima', 'Mamadou', 'Youssouf', 'Kylian', 'Eduardo', 'Dayot'],
    last: ['Diarra', 'Traoré', 'Koné', 'Camara', 'Sissoko', 'Kanté', 'Touré', 'Cissé'] },
  eng: { id: 'eng', nationality: 'ENG', face: 'mitteleuropa',
    first: ['John', 'David', 'Paul', 'Mark', 'Gary', 'Steven', 'James', 'Michael', 'Tony', 'Kevin'],
    last: ['Smith', 'Jones', 'Taylor', 'Brown', 'Williams', 'Wilson', 'Johnson', 'Davies', 'Robinson', 'Wright'] },
  sco: { id: 'sco', nationality: 'SCO', face: 'mitteleuropa',
    first: ['Alan', 'Graeme', 'Kenny', 'Gordon', 'Ian', 'Stuart', 'Callum'],
    last: ['MacDonald', 'Campbell', 'Stewart', 'Robertson', 'Thomson', 'Anderson', 'Murray', 'Reid'] },
  tur: { id: 'tur', nationality: 'TUR', face: 'tuerkei',
    first: ['Mehmet', 'Ahmet', 'Mustafa', 'Hakan', 'Emre', 'Burak', 'Arda', 'Oğuz', 'Selçuk'],
    last: ['Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Yıldız', 'Aydın', 'Öztürk', 'Arslan', 'Doğan'] },
  gre: { id: 'gre', nationality: 'GRE', face: 'suedeuropa',
    first: ['Giorgos', 'Nikos', 'Kostas', 'Dimitris', 'Giannis', 'Vasilis', 'Christos'],
    last: ['Papadopoulos', 'Pappas', 'Georgiou', 'Nikolaidis', 'Karagounis', 'Oikonomou', 'Vlachos'] },
  bra: { id: 'bra', nationality: 'BRA', face: 'lateinamerika',
    first: ['Carlos', 'Paulo', 'Marcos', 'Rafael', 'Lucas', 'Gabriel', 'Felipe', 'Thiago', 'Rodrigo', 'Diego'],
    last: ['da Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Pereira', 'Ferreira', 'Alves', 'Costa', 'Ribeiro'] },
  arg: { id: 'arg', nationality: 'ARG', face: 'lateinamerika',
    first: ['Diego', 'Martín', 'Juan', 'Facundo', 'Nicolás', 'Matías', 'Gonzalo', 'Leandro'],
    last: ['González', 'Rodríguez', 'Gómez', 'Fernández', 'López', 'Díaz', 'Romero', 'Sosa', 'Acosta'] },
  gha: { id: 'gha', nationality: 'GHA', face: 'westafrika',
    first: ['Kwame', 'Kofi', 'Kwabena', 'Yaw', 'Emmanuel', 'Isaac', 'Samuel', 'Prince'],
    last: ['Mensah', 'Owusu', 'Boateng', 'Asante', 'Appiah', 'Addo', 'Agyemang', 'Gyan'] },
  nga: { id: 'nga', nationality: 'NGA', face: 'westafrika',
    first: ['Chinedu', 'Emeka', 'Obinna', 'Sunday', 'Victor', 'Ahmed', 'Taiwo', 'Kelechi'],
    last: ['Okafor', 'Eze', 'Okonkwo', 'Adeyemi', 'Balogun', 'Nwosu', 'Okoro', 'Obi'] },
  cmr: { id: 'cmr', nationality: 'CMR', face: 'westafrika',
    first: ['Jean-Pierre', 'Samuel', 'Patrick', 'Eric', 'André', 'Joël'],
    last: ['Mbarga', 'Ndongo', 'Ekotto', 'Nkoulou', 'Atangana', 'Mbia', 'Fokou'] },
  mar: { id: 'mar', nationality: 'MAR', face: 'nordafrika',
    first: ['Youssef', 'Hakim', 'Achraf', 'Nabil', 'Karim', 'Amine', 'Soufiane'],
    last: ['El Amrani', 'Benali', 'Bouzid', 'Haddad', 'El Idrissi', 'Ziani', 'Amrabat'] },
  jpn: { id: 'jpn', nationality: 'JPN', face: 'ostasien',
    first: ['Takashi', 'Hiroshi', 'Daichi', 'Kenta', 'Yuto', 'Shinji', 'Makoto', 'Ritsu'],
    last: ['Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura'] },
  kor: { id: 'kor', nationality: 'KOR', face: 'ostasien',
    first: ['Min-jae', 'Ji-sung', 'Heung-min', 'Jae-sung', 'Dong-won', 'Seung-ho'],
    last: ['Kim', 'Lee', 'Park', 'Choi', 'Jung', 'Kang', 'Cho'] },
  // Ostdeutsche (nach der Wiedervereinigung im gesamtdeutschen Profifußball).
  ger_ost: { id: 'ger_ost', nationality: 'GER', face: 'mitteleuropa',
    first: ['Matthias', 'Steffen', 'Ronny', 'René', 'Enrico', 'Sandro', 'Silvio', 'Maik', 'Torsten', 'Heiko'],
    last: ['Schulze', 'Lehmann', 'Richter', 'Seidel', 'Kunze', 'Uhlig', 'Lorenz', 'Böttcher', 'Fiedler', 'Ebert', 'Thieme', 'Körner', 'Haase', 'Voigt', 'Hähnel', 'Langer', 'Wendt', 'Reichelt', 'Ullrich', 'Kretschmer', 'Kühn', 'Pfeiffer', 'Heinze', 'Teichmann', 'Gläser', 'Rößler', 'Löffler', 'Schreiter', 'Engelmann', 'Kirchner', 'Herold', 'Grünert', 'Bachmann', 'Riedel', 'Kluge', 'Jahn', 'Lindner', 'Gerlach'] },
  // Deutsche mit italienischen bzw. jugoslawischen Wurzeln (Kinder der Gastarbeiter).
  ger_it: { id: 'ger_it', nationality: 'GER', face: 'suedeuropa',
    first: ['Marco', 'Mario', 'Luca', 'Daniele', 'Salvatore', 'Dario', 'Fabio', 'Matteo'],
    last: ['Russo', 'Esposito', 'Romano', 'Greco', 'Lombardi', 'Caruso', 'Ferraro', 'Rizzo', 'Gallo', 'Marino', 'Sorrentino', 'Santoro', 'Fontana', 'Moretti', 'Barone', 'Vitale', 'Messina', 'Di Stefano', 'Morelli', 'Pellegrino'] },
  ger_yu: { id: 'ger_yu', nationality: 'GER', face: 'balkan',
    first: ['Mario', 'Ivan', 'Dario', 'Marko', 'Denis', 'Edin', 'Alen', 'Luka', 'Filip', 'Damir'],
    last: ['Jurić', 'Marić', 'Hadžić', 'Begić', 'Mehmedović', 'Ivanović', 'Babić', 'Šarić', 'Hodžić', 'Stanić', 'Delić', 'Mujić', 'Lukić', 'Tomić', 'Kovač', 'Ramić', 'Bešić', 'Grgić'] },
  usa: { id: 'usa', nationality: 'USA', face: 'mitteleuropa',
    first: ['Brian', 'Tyler', 'Josh', 'Chris', 'Matt', 'Weston'],
    last: ['Miller', 'Davis', 'Clark', 'Lewis', 'Walker', 'Young'] },
};

// -----------------------------------------------------------------------------
// Mischung je Epoche (1. Liga-artige Liga). Werte = Gewichte.
// Anteil Ausländer: 1975 ≈ 8 %, 1990 ≈ 15 %, 2000 ≈ 35 %, 2010 ≈ 45 %, 2025 ≈ 52 %.
// Deutsche mit Wurzeln in anderen Ländern werden ab den 1990ern häufiger;
// Ostdeutsche (ger_ost) erst nach der Wiedervereinigung (Stützjahr 1990 = Mitte
// aus 1985/1995, damit sich die übrigen Anteile nicht verschieben).
// -----------------------------------------------------------------------------
export type Mix = [number, Record<string, number>];
export const MIX: Mix[] = [
  [1975, { ger: 92, aut: 2, den: 1.5, ned: 1, yug: 1.5, swe: 1, sui: 0.5, bel: 0.5 }],
  [1985, { ger: 88, aut: 2, den: 2, ned: 1.5, yug: 2, swe: 1, nor: 0.5, pol: 0.5, sco: 0.5, kor: 0.3, hun: 0.5, bel: 0.7, ger_tr: 0.5 }],
  [1990, { ger: 73.85, ger_ost: 0.4, ger_it: 0.4, ger_yu: 0.35, aut: 2, den: 2, ned: 1.75, yug: 1, swe: 1.25, nor: 0.75, pol: 1.25, sco: 0.25, kor: 0.15, hun: 0.75, bel: 0.85, ger_tr: 1.25, ger_pl: 0.75, ger_af: 0.5, sui: 0.75, cro: 1, srb: 1, cze: 1, rus: 1, bra: 1.5, gha: 0.75, nga: 0.5, cmr: 0.25, tur: 0.75, ita: 0.25, fra: 0.25 }],
  [1995, { ger: 56, ger_ost: 4.5, ger_it: 0.8, ger_yu: 0.7, ger_tr: 2, ger_pl: 1.5, ger_af: 1, aut: 2, sui: 1.5, den: 2, swe: 1.5, nor: 1, ned: 2, bel: 1, cro: 2, srb: 2, pol: 2, cze: 2, hun: 1, rus: 2, bra: 3, gha: 1.5, nga: 1, cmr: 0.5, tur: 1.5, ita: 0.5, fra: 0.5 }],
  [2005, { ger: 40.5, ger_ost: 2.5, ger_it: 1, ger_yu: 1, ger_modern: 5, ger_tr: 3, ger_pl: 2, ger_af: 2, aut: 2, sui: 3, den: 2, swe: 1.5, nor: 1, ned: 2.5, bel: 1.5, cro: 3, srb: 2.5, pol: 2.5, cze: 3, hun: 1, rus: 1, bra: 5, arg: 1.5, gha: 1.5, nga: 1, cmr: 1, tur: 2, fra: 1, fra_af: 1, jpn: 1, kor: 0.5, por: 0.5, gre: 1, usa: 0.5 }],
  [2015, { ger: 18, ger_ost: 1, ger_it: 0.5, ger_yu: 0.5, ger_modern: 22, ger_tr: 3, ger_pl: 2, ger_af: 3, aut: 4, sui: 4, den: 3, swe: 1.5, nor: 1.5, ned: 3, bel: 2, cro: 3, srb: 2, pol: 2.5, cze: 2, hun: 1, bra: 3, arg: 1, gha: 1.5, nga: 1, cmr: 1, tur: 1.5, fra: 2.5, fra_af: 2, jpn: 3, kor: 2, esp: 1.5, por: 1.5, ita: 1, usa: 1.5, mar: 1, eng: 1 }],
  [2025, { ger: 9, ger_it: 0.5, ger_yu: 0.5, ger_modern: 30, ger_tr: 3, ger_pl: 2, ger_af: 4, aut: 4, sui: 3.5, den: 3.5, swe: 1.5, nor: 2, ned: 3, bel: 2, cro: 2.5, srb: 1.5, pol: 1.5, cze: 1.5, hun: 1.5, bra: 2, arg: 1, gha: 1.5, nga: 1.5, cmr: 1, tur: 1, fra: 3, fra_af: 3, jpn: 3.5, kor: 2, esp: 1.5, por: 2, ita: 1, usa: 2.5, mar: 1.5, eng: 2 }],
];

// -----------------------------------------------------------------------------
// Heimatland (Weltdaten, Wunsch Pascal): führt der Spieler einen Verein außerhalb
// Deutschlands, tauschen „Einheimische“ und Deutsche ihre Rollen in der Mischung –
// alle deutschen Herkünfte gehen auf die Herkunft des Heimatlandes über, dessen
// bisheriges Gewicht auf 'ger'. null = Deutschland (unverändert).
// -----------------------------------------------------------------------------
let homeOrigin: string | null = null;
export function setHomeOrigin(id: string | null): void { homeOrigin = id && id !== 'ger' && ORIGINS[id] ? id : null; }
export function getHomeOrigin(): string | null { return homeOrigin; }
/** Nationalitätskürzel der Einheimischen ('GER' bzw. Heimatland). */
export function homeNationality(): string { return homeOrigin ? ORIGINS[homeOrigin]?.nationality ?? 'GER' : 'GER'; }

function swapHome(mix: Record<string, number>): Record<string, number> {
  if (!homeOrigin) return mix;
  const out: Record<string, number> = {};
  let dom = 0;
  for (const [k, w] of Object.entries(mix)) {
    if (ORIGINS[k]?.nationality === 'GER') dom += w;
    else if (k !== homeOrigin) out[k] = w;
  }
  out[homeOrigin] = dom;
  out.ger = (out.ger ?? 0) + (mix[homeOrigin] ?? 0) + 0.5;
  return out;
}

/** Gewichtete Herkunfts-Mischung für ein Jahr (lineare Interpolation zwischen den Stützjahren). */
export function originMixForYear(year: number): Record<string, number> {
  return swapHome(baseMixForYear(year));
}

function baseMixForYear(year: number): Record<string, number> {
  if (year <= MIX[0][0]) return MIX[0][1];
  for (let i = 1; i < MIX.length; i++) {
    const [y1, m1] = MIX[i];
    const [y0, m0] = MIX[i - 1];
    if (year <= y1) {
      const t = (year - y0) / (y1 - y0);
      const out: Record<string, number> = {};
      for (const k of new Set([...Object.keys(m0), ...Object.keys(m1)])) out[k] = (m0[k] ?? 0) * (1 - t) + (m1[k] ?? 0) * t;
      return out;
    }
  }
  return MIX[MIX.length - 1][1];
}

/** Zieht eine Herkunft für ein Jahr. `domestic` erzwingt einheimische Spieler (z. B. Jugend). */
export function pickOrigin(year: number, rng: () => number, domestic = false): Origin {
  const mix = originMixForYear(year);
  // Robust gegenüber Datensätzen: unbekannte Herkünfte überspringen.
  let entries = Object.entries(mix).filter(([k, w]) => w > 0 && ORIGINS[k] && (!domestic || ORIGINS[k].nationality === homeNationality()));
  if (!entries.length) entries = Object.keys(ORIGINS).slice(0, 1).map((k) => [k, 1] as [string, number]);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [k, w] of entries) { r -= w; if (r <= 0) return ORIGINS[k]; }
  return ORIGINS[entries[entries.length - 1][0]];
}

/**
 * Vornamen-Pool für einen Geburtsjahrgang. Ohne Jahrgang oder Kohorten die
 * Grundliste; nahe einer Kohortengrenze (±2 Jahre) mischen beide Stufen.
 */
export function firstNamesFor(o: Origin, birthYear?: number): string[] {
  const eras = o.firstByEra;
  if (birthYear == null || !Number.isFinite(birthYear) || !eras?.length) return o.first;
  let i = 0;
  for (let k = 0; k < eras.length; k++) if (eras[k][0] <= birthYear) i = k;
  const cur = eras[i][1];
  const next = eras[i + 1];
  const prev = i > 0 ? eras[i - 1] : undefined;
  const pool = next && next[0] - birthYear <= 2 ? [...cur, ...next[1]]
    : prev && birthYear - eras[i][0] < 2 ? [...cur, ...prev[1]] : cur;
  return pool.length ? pool : o.first;
}

/**
 * Name passend zur Herkunft und – wenn bekannt – zum Geburtsjahrgang.
 * Verbraucht genau so viele Zufallszahlen wie ohne Jahrgang (Spielablauf bleibt gleich).
 */
export function makeName(o: Origin, rng: () => number, birthYear?: number): { firstName: string; lastName: string } {
  const firsts = firstNamesFor(o, birthYear);
  const pick = (a: string[]) => (a.length ? a[Math.floor(rng() * a.length)] : 'Spieler');
  let firstName = pick(firsts), lastName = pick(o.last);
  // Bekannte reale Kombinationen und Doppelnamen („Thomas Thomas“) vermeiden.
  for (let i = 0; i < 6 && (BLOCKED_NAMES.has(`${firstName} ${lastName}`) || firstName === lastName); i++) {
    firstName = pick(firsts); lastName = pick(o.last);
  }
  return { firstName, lastName };
}

// Erweiterte Namenspools einmalig einmischen (ohne Dubletten).
for (const [id, extra] of [...Object.entries(EXTRA_NAMES), ...Object.entries(MORE_NAMES)]) {
  const o = ORIGINS[id];
  if (!o) continue;
  if (extra.first) o.first = [...new Set([...o.first, ...extra.first])];
  if (extra.last) o.last = [...new Set([...o.last, ...extra.last])];
}

// Vornamen je Jahrgang einmischen (Kopien – Datensätze dürfen sie ändern).
for (const [id, eras] of Object.entries(FIRST_BY_ERA)) {
  const o = ORIGINS[id];
  if (o && !o.firstByEra) o.firstByEra = eras.map(([y, n]) => [y, [...new Set(n)]] as FirstNameEra);
}

// -----------------------------------------------------------------------------
// Verdeckte Ethnie je Herkunft (Vorgabe; im Editor unter Namen › Ethnie änderbar).
// Grobe Anteile im Profifußball des jeweiligen Landes, keine Statistik.
// -----------------------------------------------------------------------------
const FACE_MIX: Record<string, FaceMix> = {
  eng: [[1975, { mitteleuropa: 97, westafrika: 3 }], [1990, { mitteleuropa: 86, westafrika: 13, suedeuropa: 1 }], [2010, { mitteleuropa: 70, westafrika: 26, nordafrika: 2, suedeuropa: 2 }], [2025, { mitteleuropa: 60, westafrika: 34, nordafrika: 3, suedeuropa: 3 }]],
  sco: [[1975, { mitteleuropa: 100 }], [2025, { mitteleuropa: 92, westafrika: 8 }]],
  fra: [[1975, { mitteleuropa: 86, suedeuropa: 6, westafrika: 4, nordafrika: 4 }], [1995, { mitteleuropa: 66, westafrika: 20, nordafrika: 9, suedeuropa: 5 }], [2025, { mitteleuropa: 44, westafrika: 38, nordafrika: 15, suedeuropa: 3 }]],
  ned: [[1975, { mitteleuropa: 95, westafrika: 4, ostasien: 1 }], [1990, { mitteleuropa: 80, westafrika: 16, nordafrika: 2, ostasien: 2 }], [2025, { mitteleuropa: 60, westafrika: 28, nordafrika: 10, ostasien: 2 }]],
  bel: [[1975, { mitteleuropa: 97, suedeuropa: 2, nordafrika: 1 }], [1995, { mitteleuropa: 82, westafrika: 10, nordafrika: 6, suedeuropa: 2 }], [2025, { mitteleuropa: 56, westafrika: 30, nordafrika: 12, suedeuropa: 2 }]],
  sui: [[1975, { mitteleuropa: 94, suedeuropa: 6 }], [2000, { mitteleuropa: 76, balkan: 12, suedeuropa: 6, westafrika: 4, tuerkei: 2 }], [2025, { mitteleuropa: 64, balkan: 16, westafrika: 12, tuerkei: 4, suedeuropa: 4 }]],
  aut: [[1975, { mitteleuropa: 98, balkan: 2 }], [2025, { mitteleuropa: 72, balkan: 13, tuerkei: 7, westafrika: 8 }]],
  swe: [[1975, { nordeuropa: 98, balkan: 2 }], [2000, { nordeuropa: 86, balkan: 8, westafrika: 4, nordafrika: 2 }], [2025, { nordeuropa: 68, balkan: 10, westafrika: 14, nordafrika: 6, tuerkei: 2 }]],
  den: [[1975, { nordeuropa: 100 }], [2025, { nordeuropa: 82, westafrika: 9, tuerkei: 4, balkan: 3, nordafrika: 2 }]],
  nor: [[1975, { nordeuropa: 100 }], [2025, { nordeuropa: 80, westafrika: 12, nordafrika: 4, balkan: 4 }]],
  por: [[1975, { suedeuropa: 88, westafrika: 12 }], [2025, { suedeuropa: 76, westafrika: 22, lateinamerika: 2 }]],
  esp: [[1975, { suedeuropa: 99, lateinamerika: 1 }], [2025, { suedeuropa: 84, westafrika: 9, nordafrika: 5, lateinamerika: 2 }]],
  ita: [[1975, { suedeuropa: 100 }], [2025, { suedeuropa: 88, westafrika: 9, nordafrika: 2, lateinamerika: 1 }]],
  bra: [[1975, { lateinamerika: 62, westafrika: 36, suedeuropa: 2 }], [2025, { lateinamerika: 60, westafrika: 38, suedeuropa: 2 }]],
  arg: [[1975, { lateinamerika: 70, suedeuropa: 30 }], [2025, { lateinamerika: 76, suedeuropa: 24 }]],
  usa: [[1975, { mitteleuropa: 80, lateinamerika: 10, westafrika: 10 }], [2025, { mitteleuropa: 48, westafrika: 26, lateinamerika: 24, ostasien: 2 }]],
  rus: [[1975, { osteuropa: 100 }], [2025, { osteuropa: 94, westafrika: 2, tuerkei: 4 }]],
  ger_modern: [[2000, { mitteleuropa: 100 }], [2025, { mitteleuropa: 94, osteuropa: 3, suedeuropa: 3 }]],
};
for (const [id, mix] of Object.entries(FACE_MIX)) {
  const o = ORIGINS[id];
  if (o && !o.faceMix) o.faceMix = mix.map(([y, m]) => [y, { ...m }]);
}

function hashStr(str: string): number {
  let h = 0x9e3779b9;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; }
  return (h >>> 0) / 4294967296;
}

/** Anteile der Gesichtsgruppen einer Herkunft in einem Jahr (Spieler etwa 20). */
export function faceMixFor(o: Origin, year: number): Record<string, number> {
  const m = o.faceMix;
  if (!m?.length) return { [o.face]: 1 };
  if (year <= m[0][0]) return m[0][1] as Record<string, number>;
  for (let i = 1; i < m.length; i++) {
    const [y1, a] = m[i]; const [y0, b] = m[i - 1];
    if (year <= y1) {
      const t = (year - y0) / Math.max(1, y1 - y0);
      const out: Record<string, number> = {};
      for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) out[k] = ((b as Record<string, number>)[k] ?? 0) * (1 - t) + ((a as Record<string, number>)[k] ?? 0) * t;
      return out;
    }
  }
  return m[m.length - 1][1] as Record<string, number>;
}

/**
 * Verdeckte Ethnie (Gesichtsgruppe) eines neuen Spielers: fest aus seiner ID
 * gezogen (verbraucht keine Zufallszahl → Spielablauf bleibt gleich).
 */
export function faceFor(o: Origin, birthYear: number, id: string): string {
  const mix = Object.entries(faceMixFor(o, birthYear + 20)).filter(([, w]) => w > 0);
  const total = mix.reduce((s, [, w]) => s + w, 0);
  if (!total) return o.face;
  let r = hashStr(id) * total;
  for (const [k, w] of mix) { r -= w; if (r <= 0) return k; }
  return mix[mix.length - 1][0];
}
