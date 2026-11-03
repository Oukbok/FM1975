// =============================================================================
// Kommentarzeilen des Hallen-Textmodus (Grammatik wie im Textmodus, grammar.ts).
// Slots: {team} angreifende Mannschaft, {opp} Gegner, {who} Schütze, {assist}
// Vorlagengeber, {keeper} Torwart des Gegners, {score} Stand, {hall} Halle,
// {city} Ort, {round} Runde. Flags: named (Schütze bekannt), assist, keeper
// (Torwart bekannt), mine (dein Verein greift an), empty (leeres Tor), equal
// (Ausgleich), lead (Führung), ko (K.-o.-Spiel), final.
// Zusammengesetzt in screens/indoor/indoorScript.ts.
// =============================================================================
import type { Grammar } from './grammar';

export const INDOOR_TEXT: Grammar = {
  kickoff: [
    'Anpfiff in der {hall}! {team} gegen {opp} – {round}.',
    'Der Ball rollt auf dem Hallenboden: {team} gegen {opp}.',
    '?final Das Finale läuft! {team} gegen {opp}, die Halle steht.',
    '@-1987 Budenzauber in {city}: {team} gegen {opp}, Rauchschwaden unter dem Hallendach.',
    '@1988- Unter dem Hallendach in {city} geht es los: {team} gegen {opp}.',
    '?ko Jetzt zählt nur das Weiterkommen: {team} gegen {opp}.',
  ],
  goal: [
    '?named TOR! {who} trifft für {team} – {score}.',
    '?named ?assist {assist} legt quer, {who} schiebt ein. TOR für {team}, {score}!',
    '?named Doppelpass mit der Bande, {who} vollendet – {score}!',
    '?named {who} zieht aus der Drehung ab – unhaltbar! {score}.',
    '?named ?keeper Flach ins Eck, {keeper} ist ohne Chance: {who} zum {score}.',
    '?named Abpraller von der Bande, {who} ist zur Stelle – {score}.',
    '!named TOR für {team}! {score}.',
    '!named {team} kombiniert sich durch – Treffer zum {score}.',
    '!named Über die Bande und rein: {team} trifft zum {score}.',
    '?equal ?named Ausgleich! {who} macht das {score}.',
    '?lead ?named {who} bringt {team} in Führung – {score}!',
  ],
  goal_empty: [
    '?named Ins leere Tor! {who} trifft aus der eigenen Hälfte – {score}.',
    'Der Ball rollt ins verwaiste Tor – {team} erhöht auf {score}.',
  ],
  goal_mine: ['Die Fans auf der Tribüne springen auf!', 'Die Halle bebt.', 'Jubel im Fanblock.', ''],
  save: [
    '?keeper ?named {who} zieht ab – {keeper} pariert mit dem Fuß.',
    '?keeper Glanzparade von {keeper}!',
    '?named Schuss von {who}, aber der Torwart ist unten.',
    '!named {team} probiert es aus der Distanz – gehalten.',
  ],
  post: [
    '?named {who} trifft nur den Pfosten!',
    'Pfosten! {team} hat Pech.',
    '?named Latte! {who} hätte fast getroffen.',
  ],
  board: [
    '?named {who} spielt die Bande an, der Ball kommt zurück – knapp vorbei.',
    '{team} lässt den Ball über die Bande laufen, aber der Abschluss fehlt.',
    'Wildes Gestocher vor dem Tor von {opp}, dann ist der Ball an der Bande.',
    '?named {who} wird an die Bande gedrückt – Freistoß für {team}.',
  ],
  chance: [
    '?named {who} köpft knapp drüber.',
    '{team} drückt, {opp} steht tief.',
    '?named {who} tanzt zwei Gegenspieler aus – der Abschluss geht vorbei.',
    'Fliegender Wechsel bei {team}, die frischen Leute machen sofort Tempo.',
    'Konter von {team} – im letzten Moment geklärt.',
  ],
  penalty: [
    'Zeitstrafe gegen {team}! Zwei Minuten in Unterzahl.',
    '@1988- Wechselfehler bei {team} – zwei Minuten Strafe.',
    'Foul an der Bande: zwei Minuten für {team}.',
  ],
  penalty_end: ['{team} ist wieder komplett.', 'Die zwei Minuten sind um – {team} wieder zu fünft.'],
  half: ['Halbzeit – {score}.', 'Seitenwechsel beim Stand von {score}.'],
  second: ['Weiter geht’s – die zweiten zehn Minuten laufen.', 'Wiederanpfiff.'],
  keeper_out: [
    '?mine Alles oder nichts: {team} nimmt den Torwart raus, ein fünfter Feldspieler kommt.',
    '{team} spielt ohne Torwart – sechs gegen fünf.',
  ],
  end: ['Abpfiff! {team} – {opp} {score}.', 'Schluss in der {hall}: {score}.', 'Aus, vorbei – {score}.'],
  end_draw_ko: ['Unentschieden nach regulärer Zeit – jetzt entscheidet das Neunmeterschießen.'],
  so_start: ['Neunmeterschießen! Je drei Schützen, dann geht es Mann gegen Mann.'],
  so_hit: ['?named {who} trifft – {score}.', '?named {who} verwandelt sicher. {score}.', 'Drin! {score}.'],
  so_miss: ['?named ?keeper {keeper} hält gegen {who}!', '?named {who} schießt drüber!', 'Vergeben! {score}.'],
  so_end: ['{team} gewinnt das Neunmeterschießen {score}!', 'Entschieden: {team} setzt sich vom Punkt durch, {score}.'],
};
