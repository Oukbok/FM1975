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
}

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
  usa: { id: 'usa', nationality: 'USA', face: 'mitteleuropa',
    first: ['Brian', 'Tyler', 'Josh', 'Chris', 'Matt', 'Weston'],
    last: ['Miller', 'Davis', 'Clark', 'Lewis', 'Walker', 'Young'] },
};

// -----------------------------------------------------------------------------
// Mischung je Epoche (Bundesliga-artige Liga). Werte = Gewichte.
// Anteil Ausländer: 1975 ≈ 8 %, 1990 ≈ 15 %, 2000 ≈ 35 %, 2010 ≈ 45 %, 2025 ≈ 52 %.
// Deutsche mit Wurzeln in anderen Ländern werden ab den 1990ern häufiger.
// -----------------------------------------------------------------------------
type Mix = [number, Record<string, number>];
const MIX: Mix[] = [
  [1975, { ger: 92, aut: 2, den: 1.5, ned: 1, yug: 1.5, swe: 1, sui: 0.5, bel: 0.5 }],
  [1985, { ger: 88, aut: 2, den: 2, ned: 1.5, yug: 2, swe: 1, nor: 0.5, pol: 0.5, sco: 0.5, kor: 0.3, hun: 0.5, bel: 0.7, ger_tr: 0.5 }],
  [1995, { ger: 62, ger_tr: 2, ger_pl: 1.5, ger_af: 1, aut: 2, sui: 1.5, den: 2, swe: 1.5, nor: 1, ned: 2, bel: 1, cro: 2, srb: 2, pol: 2, cze: 2, hun: 1, rus: 2, bra: 3, gha: 1.5, nga: 1, cmr: 0.5, tur: 1.5, ita: 0.5, fra: 0.5 }],
  [2005, { ger: 45, ger_modern: 5, ger_tr: 3, ger_pl: 2, ger_af: 2, aut: 2, sui: 3, den: 2, swe: 1.5, nor: 1, ned: 2.5, bel: 1.5, cro: 3, srb: 2.5, pol: 2.5, cze: 3, hun: 1, rus: 1, bra: 5, arg: 1.5, gha: 1.5, nga: 1, cmr: 1, tur: 2, fra: 1, fra_af: 1, jpn: 1, kor: 0.5, por: 0.5, gre: 1, usa: 0.5 }],
  [2015, { ger: 20, ger_modern: 22, ger_tr: 3, ger_pl: 2, ger_af: 3, aut: 4, sui: 4, den: 3, swe: 1.5, nor: 1.5, ned: 3, bel: 2, cro: 3, srb: 2, pol: 2.5, cze: 2, hun: 1, bra: 3, arg: 1, gha: 1.5, nga: 1, cmr: 1, tur: 1.5, fra: 2.5, fra_af: 2, jpn: 3, kor: 2, esp: 1.5, por: 1.5, ita: 1, usa: 1.5, mar: 1, eng: 1 }],
  [2025, { ger: 10, ger_modern: 30, ger_tr: 3, ger_pl: 2, ger_af: 4, aut: 4, sui: 3.5, den: 3.5, swe: 1.5, nor: 2, ned: 3, bel: 2, cro: 2.5, srb: 1.5, pol: 1.5, cze: 1.5, hun: 1.5, bra: 2, arg: 1, gha: 1.5, nga: 1.5, cmr: 1, tur: 1, fra: 3, fra_af: 3, jpn: 3.5, kor: 2, esp: 1.5, por: 2, ita: 1, usa: 2.5, mar: 1.5, eng: 2 }],
];

/** Gewichtete Herkunfts-Mischung für ein Jahr (lineare Interpolation zwischen den Stützjahren). */
export function originMixForYear(year: number): Record<string, number> {
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
  const entries = Object.entries(mix).filter(([k, w]) => w > 0 && (!domestic || ORIGINS[k].nationality === 'GER'));
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [k, w] of entries) { r -= w; if (r <= 0) return ORIGINS[k]; }
  return ORIGINS[entries[entries.length - 1][0]];
}

/** Name passend zur Herkunft. */
export function makeName(o: Origin, rng: () => number): { firstName: string; lastName: string } {
  const pick = (a: string[]) => a[Math.floor(rng() * a.length)];
  return { firstName: pick(o.first), lastName: pick(o.last) };
}
