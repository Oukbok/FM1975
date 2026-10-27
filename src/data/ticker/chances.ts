// =============================================================================
// Textbausteine rund um Torchancen: Spielaufbau, Abschluss, Ausgang, Reaktion.
// Slots: {p} Schütze, {a} Vorbereiter, {k} Torwart, {d} Gegenspieler,
// {t} angreifendes Team, {o} verteidigendes Team, {score} Spielstand,
// {pos} Position des Schützen, {xgp} Torwahrscheinlichkeit in Prozent.
// =============================================================================
import type { Grammar } from './grammar';

export const CHANCES: Grammar = {
  // --- Aufbau ---------------------------------------------------------------
  b_kurzpass: [
    '{tn} lässt den Ball laufen: kurz, kurz, lang – und schon ist {a} durch.',
    'Schöne Kombination von {t} über mehrere Stationen. {a} hat den Ball am Strafraum.',
    '{a} sucht den Doppelpass mit {p}, und der kommt an!',
    '#team_tempo# {t} kombiniert sich durchs Mittelfeld, {a} behält die Übersicht.',
    'Ein Kurzpass-Festival von {t}. Am Ende landet die Kugel bei {a}.',
    'Ballstafette von {t} – {o} läuft nur hinterher.',
    '{a} dreht sich im Mittelfeld #geschickt# um die eigene Achse und spielt {p} an.',
    '{tn} spielt sich mit One-Touch-Fußball in die Hälfte von {o}.',
    '{a} legt ab, {p} geht mit und bekommt den Ball zurück.',
    '@2008- Schnelles Kurzpassspiel im Halbraum, {a} findet {p} zwischen den Linien.',
    '@-1990 {a} treibt den Ball nach vorn, lässt einen Gegenspieler stehen und sucht {p}.',
    'Geduldiger Aufbau von {t}. Dann geht es plötzlich ganz schnell über {a}.',
  ],
  b_steilpass: [
    '{a} sieht die Lücke und spielt den Ball steil auf {p}!',
    'Tödlicher Pass von {a} in die Schnittstelle – {p} startet!',
    '{a} steckt durch, {p} ist auf und davon!',
    'Herrlicher Steilpass von {a}, {o} hebt das Bein zum Abseits – aber {p} stand richtig!',
    '{a} chippt den Ball über die Abwehr, {p} läuft ein.',
    'Ein Zuckerpass von {a}! {p} muss nur noch laufen.',
    '{a} mit dem Auge für den Mitspieler: Ball in den Lauf von {p}.',
    'Vertikalpass von {a}, {p} schüttelt seinen Bewacher ab.',
    '@-1991 {a} schlägt den Ball über den aufgerückten Libero, {p} startet durch.',
    '@2010- Der Pass zwischen Innen- und Außenverteidiger hindurch – {p} ist frei.',
  ],
  b_flanke: [
    '{a} flankt von der #seite_lang# in den Strafraum.',
    '{a} geht bis zur Grundlinie und bringt den Ball scharf nach innen.',
    'Flanke von {a}, #flanke_art#.',
    '{a} schlägt eine hohe Hereingabe Richtung langer Pfosten.',
    '{a} zieht #seite# an seinem Gegenspieler vorbei und flankt.',
    'Halbfeldflanke von {a}, gut getimt.',
    '{a} mit dem Außenrist – die Flanke senkt sich gefährlich.',
    '@-1989 {a} schlägt eine Bananenflanke in den Strafraum.',
    '@-1992 Lange Flanke von {a} auf den Kopf des Mittelstürmers – so wird das hier gespielt.',
    '@2005- {a} hinterläuft, bekommt den Ball und flankt flach in den Rückraum.',
    '{a} täuscht die Flanke an, geht nach innen und flankt mit dem schwachen Fuß.',
  ],
  flanke_art: ['scharf und flach', 'hoch und weit', 'mit viel Effet', 'genau auf den Punkt', 'leicht abgefälscht', 'etwas zu lang – nein, gerade noch erreichbar'],
  seite_lang: ['linken Seite', 'rechten Seite', 'linken Außenbahn', 'rechten Außenbahn', 'Grundlinie links', 'Grundlinie rechts'],
  b_konter: [
    'Ballgewinn! {t} schaltet #schnell# um!',
    'Konter! {t} kommt mit drei gegen zwei!',
    '{o} ist weit aufgerückt – und {t} fährt den Gegenstoß!',
    'Gegenstoß über {a}, der das halbe Feld überbrückt.',
    'Ballverlust von {o} im Mittelfeld, und jetzt geht es ganz schnell.',
    'Was für ein Konter! {a} treibt den Ball durch die Mitte.',
    '{a} fängt den Pass ab und schickt {p} sofort auf die Reise.',
    '@2008- Umschaltmoment! {t} ist in Sekunden vor dem Tor.',
    '@2010- Lehrbuch-Konter: Balleroberung, ein Vertikalpass, {p} läuft.',
    '@-1988 Ein Konter wie aus alten Tagen: langer Ball, und {p} rennt.',
  ],
  b_dribbling: [
    '{p} nimmt es mit zwei Gegenspielern auf …',
    '{p} tanzt seinen Bewacher aus!',
    '{p} lässt {d} mit einem Übersteiger stehen.',
    'Solo von {p}! Er geht an einem, an zwei Mann vorbei!',
    '{p} mit dem Ball am Fuß – {o} bekommt ihn nicht zu fassen.',
    '{p} zieht von außen nach innen, der Haken sitzt.',
    'Tunnel! {p} schiebt den Ball {d} durch die Beine.',
    '{p} dribbelt sich in den Strafraum, {d} grätscht ins Leere.',
    '{p} mit einer Körpertäuschung, {d} fällt darauf herein.',
  ],
  b_weit: [
    'Langer Ball von {a} aus der eigenen Hälfte.',
    '{a} schlägt den Ball hoch nach vorne, {p} setzt sich im Luftduell durch.',
    'Diagonalball von {a} – präzise wie mit dem Lineal gezogen.',
    '{a} hat den Ball und schlägt ihn sofort lang auf {p}.',
    '@-1991 Abschlag, Kopfballverlängerung, und {p} ist am Ball.',
    '@1992- Spielverlagerung von {a} über 50 Meter, {p} nimmt ihn #geschickt# an.',
    '{a} mit dem weiten Schlag, {p} läuft sich frei.',
  ],
  b_fehler: [
    'Fehler von {d}! #fehler_art# – {p} ist plötzlich frei!',
    '{d} spielt einen Fehlpass genau in die Füße von {p}!',
    'Ein Geschenk! {d} vertändelt den Ball, {p} sagt danke.',
    'Missverständnis in der Abwehr von {o}! {p} geht dazwischen.',
    '{d} rutscht weg – und {p} hat freie Bahn!',
    '#fehler_art#! {d} sieht dabei gar nicht gut aus. {p} schnappt sich den Ball.',
    '@1992- Rückpass von {d} zu kurz – {p} spritzt dazwischen!',
    '{d} will den Ball ins Aus schlagen und trifft ihn nicht richtig. {p} lauert!',
  ],
  fehler_art: ['Der Ball verspringt', 'Schlimmer Abspielfehler', 'Zu lässig im Spielaufbau', 'Ein Stockfehler', 'Der Querpass ist viel zu kurz', 'Die Ballannahme misslingt völlig'],
  b_ecke: [
    'Ecke von {a}, #ecke_art#.',
    '{a} tritt die Ecke – Getümmel im Fünfmeterraum!',
    'Der Eckstoß von {a} kommt scharf auf den ersten Pfosten.',
    '{a} bringt die Ecke kurz, dann die Flanke.',
    'Die Ecke segelt in den Strafraum, alle springen hoch.',
    '{a} zirkelt den Eckball an den langen Pfosten.',
  ],
  ecke_art: ['scharf hereingedreht', 'hoch an den langen Pfosten', 'flach an die Strafraumgrenze', 'direkt aufs Tor gezogen', 'mit viel Schnitt'],
  b_freistoss: [
    'Freistoß aus gut {dist} Metern. {p} legt sich den Ball zurecht.',
    '{p} steht am Ball. Die Mauer formiert sich, {k} dirigiert.',
    'Freistoß in aussichtsreicher Position. {p} steht bereit.',
    'Die Mauer steht. {p} schaut noch einmal hoch, dann läuft er an.',
    '@2015- Das Freistoßspray wird gesprüht. {p} wartet geduldig.',
    'Gefährliche Position, halblinks vor dem Strafraum. {p} übernimmt.',
  ],
  b_abpraller: [
    'Der Abpraller landet bei {p}!',
    'Nachschuss! {p} ist zur Stelle!',
    'Der Ball springt zurück ins Feld – {p} ist schneller als alle anderen!',
    'Zweiter Ball, {p} hat ihn!',
  ],
  b_spannung: [
    'Jetzt wird es gefährlich!', 'Achtung!', 'Das ist die Chance!', 'Riesenchance!', 'Da ist die Lücke!',
    'Jetzt brennt es lichterloh im Strafraum!', 'Das könnte es sein!', 'Alarm im Strafraum von {o}!',
  ],

  // --- Abschluss ------------------------------------------------------------
  s_normal: [
    '{p} kommt zum Abschluss …', '{p} zieht ab …', '{p} schießt …', '{p} versucht es mit dem Innenrist …',
    '{p} nimmt den Ball direkt …', '{p} legt sich den Ball zurecht und schießt …', '{p} zieht aus #kurze_dist# ab …',
    '{p} dreht sich und schießt …', '{p} mit dem Spann …', '{p} schlenzt ihn Richtung langes Eck …',
  ],
  kurze_dist: ['elf Metern', 'zwölf Metern', 'vierzehn Metern', 'spitzem Winkel', 'halbrechter Position', 'halblinker Position', 'kurzer Distanz'],
  s_header: [
    '{p} steigt am höchsten und köpft …', '{p} kommt mit dem Kopf an den Ball …', 'Kopfball {p} …',
    '{p} wuchtet den Ball mit dem Kopf Richtung Tor …', '{p} hechtet in die Flanke …', '{p} verlängert per Kopf …',
    '{p} setzt sich im Luftkampf gegen {d} durch und köpft …', 'Flugkopfball {p} …',
  ],
  s_long: [
    '{p} fasst sich ein Herz – aus {dist} Metern …', '{p} zieht aus der Distanz ab …', 'Distanzschuss {p} …',
    '{p} probiert es einfach mal von weit draußen …', '{p} hält aus {dist} Metern drauf …', 'Warum nicht? {p} schießt aus der zweiten Reihe …',
    '{p} mit einem Gewaltschuss aus der Distanz …',
  ],
  s_big: [
    '{p} ist frei vor {k} …', '{p} läuft allein auf {k} zu …', '{p} hat nur noch {k} vor sich …',
    '{p} steht völlig blank, fünf Meter vor dem Tor …', '{p} umkurvt {k} …', '{p} muss den Ball eigentlich nur noch über die Linie drücken …',
    '{p} legt sich den Ball vor, {k} kommt raus …', 'Eins gegen eins: {p} gegen {k} …',
  ],
  s_counter: [
    '{p} läuft auf {k} zu, niemand mehr dazwischen …', '{p} ist durch! Nur noch {k} …', '{p} hat das ganze Feld vor sich, {k} wartet …',
  ],
  s_solo: ['{p} ist durch, jetzt nur noch {k} …', '{p} vollendet sein Solo …', 'Und jetzt der Abschluss von {p} …'],
  s_freekick: ['Er läuft an …', 'Der Ball ist unterwegs …', 'Über die Mauer …', 'Flach unter der springenden Mauer hindurch …', '{p} schießt …', 'Mit Schnitt Richtung Winkel …'],
  s_penalty: [
    '{p} legt sich den Ball auf den Punkt. {k} hüpft auf der Linie … Anlauf …',
    '{p} gegen {k}. Das Stadion hält den Atem an … {p} läuft an …',
    '{p} nimmt sich den Ball. Kurzer Blick, langer Anlauf …',
    'Es ist ganz still. {p} … gegen {k} …',
  ],

  // --- Ausgang --------------------------------------------------------------
  o_goal: [
    '#ausrufGut# {p} trifft #ecke_tor# – {score}!',
    'Und der Ball zappelt im Netz! {p} macht das {score}!',
    '{p} lässt {k} keine Chance. {score}!',
    'Drin! {p} schiebt eiskalt ein. {score}.',
    'Der sitzt! {p} versenkt den Ball #ecke_tor#. {score}!',
    '{p} trifft! {k} ist ohne Chance. Es steht {score}.',
    'Tor für {t}! {p} vollendet zum {score}.',
    'Was für ein Abschluss von {p}! {score}!',
  ],
  o_goal_header: [
    '{p} köpft ein! {score}!', 'Unhaltbar platziert – Kopfballtor {p}! {score}.', 'Wuchtig ins Netz gewuchtet! {p} macht das {score}.',
    'Der Kopfball schlägt #ecke_tor# ein. {score}!', '{k} fliegt vergeblich – {p} trifft per Kopf. {score}!',
  ],
  o_goal_long: [
    'Was für ein Hammer! Der Ball schlägt #ecke_tor# ein – {score}!', 'Ein Traumtor! {p} aus der Distanz – {score}!',
    '{k} streckt sich vergeblich. Ein Strahl von {p} – {score}!', 'Ein Tor für die Ewigkeit! {p} trifft aus {dist} Metern! {score}!',
  ],
  o_goal_freekick: [
    'Direkt verwandelt! Über die Mauer #ecke_tor#. {score}!', '{p} zirkelt den Freistoß ins Netz! {k} chancenlos. {score}.',
    'Der Freistoß sitzt! {score}!',
  ],
  o_goal_penalty: [
    'Verwandelt! {p} schickt {k} in die falsche Ecke. {score}.', 'Sicher! {p} bleibt cool. {score}!', 'Drin! Platziert ins Eck. {score}.',
    '{k} ahnt die Ecke – aber zu spät. {score}!',
  ],
  o_goal_own: [
    'Eigentor! {p} lenkt den Ball unglücklich ins eigene Netz. {score}.', 'Oh nein – {p} fälscht ins eigene Tor ab! {score}.',
    'Ausgerechnet {p}! Der Ball springt ihm vom Schienbein ins eigene Tor. {score}.',
  ],
  o_saved: [
    '{k} ist zur Stelle!', 'Gehalten! {k} taucht ab.', '{k} pariert #stark#!', '{k} fischt den Ball aus dem Eck!',
    'Reflex von {k}! Der hält!', '{k} bleibt lange stehen und hat den Ball.', '{k} wirft sich in den Schuss.',
    'Klasse Parade von {k}!', '{k} faustet den Ball weg.', '{k} lenkt den Ball mit den Fingerspitzen um den Pfosten.',
  ],
  o_saved_penalty: ['{k} hält den Elfmeter! Er hat die Ecke geahnt!', 'Gehalten! {k} pariert den Strafstoß!', '{k} ist der Held! Elfmeter gehalten!'],
  o_wide: [
    'Vorbei! Der Ball streicht #knapp# am Pfosten vorbei.', 'Daneben! {p} verzieht.', 'Am Tor vorbei – {p} schlägt die Hände vors Gesicht.',
    'Zu ungenau. Der Ball geht #klar# vorbei.', '{p} schiebt den Ball am langen Pfosten vorbei.', 'Knapp vorbei! {k} hätte keine Chance gehabt.',
  ],
  o_over: [
    'Drüber! {p} setzt den Ball über die Latte.', 'Zu hoch! Der Ball fliegt auf die Tribüne.', 'Über das Tor – {p} hat zu viel Rücklage.',
    'Der Ball steigt und steigt … und landet hinter dem Tor.', 'Knapp drüber!', '@-1995 Der Ball landet in der Kurve, ein Fan bringt ihn zurück.',
  ],
  o_post: [
    'Pfosten! Das Aluminium rettet für {o}!', 'Latte! Der Ball knallt ans Gebälk!', 'An den Innenpfosten – und wieder heraus!',
    'Die Latte zittert noch! {k} wäre geschlagen gewesen.', 'Aluminium! {p} kann es nicht fassen.',
  ],
  o_blocked: [
    'Geblockt! {d} wirft sich in den Schuss.', 'Ein Bein ist dazwischen – abgeblockt.', '{d} rettet in höchster Not!',
    'Der Schuss bleibt in der Abwehr hängen.', '{d} klärt auf der Linie!', 'Abgefälscht – und geklärt.',
  ],
  o_missed_penalty: ['Verschossen! {p} jagt den Ball neben das Tor!', 'Drüber! {p} verschießt den Elfmeter!', 'Pfosten! Der Elfmeter prallt zurück ins Feld!'],

  // --- Nachklang --------------------------------------------------------------
  after_goal_home: [
    '#publikum# #laut#!', 'Das Stadion steht Kopf!', '{p} rennt zur Kurve und lässt sich feiern.', 'Die Mitspieler begraben {p} unter sich.',
    'Riesenjubel bei {t}!', 'Die Heimfans singen seinen Namen.', '{p} reißt das Trikot hoch und jubelt.', 'Ekstase auf den Rängen.',
  ],
  after_goal_away: ['#stille#', '{tn} jubelt vor dem Gästeblock.', 'Nur in der Gästeecke wird gefeiert.', '{p} legt den Finger an die Lippen – die Heimfans pfeifen.'],
  after_goal_ctx: [
    '?ausgleich Der Ausgleich! Alles wieder offen.',
    '?fuehrung Die Führung für {t}!',
    '?ausbau {tn} baut die Führung aus.',
    '?anschluss Nur noch ein Tor Rückstand – der Anschlusstreffer!',
    '?spaet Und das so spät im Spiel!',
    '?frueh Was für ein Start!',
    '?eigen Deine Mannschaft trifft!',
    '?gegner Gegentor für deine Elf.',
    '?doppel Sein zweiter Treffer heute!',
    '?dreier Dreierpack für {p}!',
  ],
  after_miss: [
    '#raunen#', '{p} kann es nicht glauben.', 'Das muss ein Tor sein!', 'Die Riesenchance ist vertan.', '{p} hadert mit sich.',
    'Da war mehr drin.', '@2016- Die Torwahrscheinlichkeit lag bei {xgp} Prozent – Daten können so grausam sein.',
    '@2016- {xgp} Prozent Torwahrscheinlichkeit, sagt der Rechner. Heute nicht.', 'Das wird {p} heute Nacht noch beschäftigen.',
  ],
  after_save: ['Was für ein Torwart!', '{k} ist heute ein Rückhalt.', 'Der Keeper hält {o} im Spiel.', 'Das war Weltklasse von {k}.', 'Applaus auch von den Gästefans.'],

  team_tempo: ['Jetzt mit Tempo:', 'Geduldig:', 'Ruhig im Aufbau:', 'Mit viel Ballbesitz:', 'Sauber herausgespielt:'],
};
