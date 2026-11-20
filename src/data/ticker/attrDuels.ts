// =============================================================================
// Textbausteine je entscheidendem Attribut (Wunsch Pascal: der Kommentar erzählt,
// WARUM sich ein Spieler durchsetzt). Die Engine merkt sich am Ereignis `why`
// (Duell davor) bzw. `fin` (Abschluss), siehe engine/match/traits.ts `why…`.
// Schlüssel:  fail_<Art>_<why>   Ballverlust ({p} verliert, {d} gewinnt)
//             b_<Aufbau>_<why>   Aufbau einer Chance ({p} Schütze, {d} Gegenspieler, {a} Vorbereiter)
//             o_<Ausgang>_<fin>  Ausgang des Abschlusses ({k} Torwart)
// Fehlt ein Schlüssel, nimmt der Kommentar wie bisher den allgemeinen Baustein.
// Slots und Bedingungen wie in grammar.ts (@Jahr, ?Flag).
// =============================================================================
import type { Grammar } from './grammar';

export const ATTR_DUELS: Grammar = {
  // --- Laufduelle ---------------------------------------------------------------
  b_steilpass_pace: [
    '{a} spielt steil – {p} zieht den Turbo an und lässt {d} einfach stehen!', '{p} ist auf und davon, {d} sieht nur noch die Rückennummer!',
    'Steilpass {a}, und {p} ist mit zwei Schritten an {d} vorbei – was für ein Antritt!', '{p} startet in den Pass von {a}, {d} hat im Laufduell keine Chance.',
  ],
  b_steilpass_line: [
    '{a} spielt hinter die hoch stehende Abwehr – {p} sprintet {d} davon!', 'Die Kette steht hoch, {a} sieht den Raum, {p} ist schneller als {d}!',
    'Ein Ball in den Rücken der Abwehr, {p} läuft {d} auf dreißig Metern weg!', '@-1991 {a} hebt den Ball über die aufgerückte Abwehr, {p} enteilt {d}.',
  ],
  b_konter_pace: [
    'Konter! {p} rennt {d} davon – gegen dieses Tempo ist kein Kraut gewachsen!', '{a} schickt {p}, und der ist schneller als {d} – Gegenstoß!',
    '{p} nimmt Fahrt auf, {d} kommt nicht hinterher!', 'Blitzkonter: {p} lässt {d} auf dem Weg zum Tor stehen.',
  ],
  b_konter_line: [
    'Die Abwehr ist weit aufgerückt – {a} spielt sofort steil, {p} läuft {d} davon!', 'Konter in den freien Raum hinter der Kette, {p} gewinnt das Wettrennen gegen {d}!',
  ],
  b_konter_kicking: [
    'Schneller Abschlag von {a} – der Ball fliegt bis an den Strafraum, {p} ist frei durch!', '{a} schaltet blitzschnell um, weiter Abwurf auf {p} – Konter!',
    'Was für ein Abschlag von {a}! Der Ball landet genau bei {p}, die Abwehr ist überrascht.',
  ],
  b_steilpass_tired: ['{a} spielt steil, {p} läuft dem müden {d} davon.', '{d} hat nichts mehr in den Beinen – {p} ist vorbei.'],
  b_konter_tired: ['Konter! {d} ist platt, {p} hat freie Bahn.'],
  fail_race_pace: [
    '{d} ist einfach schneller als {p} und klärt.', 'Laufduell {p} gegen {d} – der Verteidiger hat den längeren Atem und das höhere Tempo.',
    '{d} holt {p} mit einem Sprint ein.', '{p} glaubt sich schon frei, doch {d} ist mit langen Schritten zur Stelle.',
  ],
  fail_race_pos: [
    '{d} steht goldrichtig und läuft {p} den Ball ab.', '{d} hat die Situation früh erkannt – {p} kommt nicht durch.',
    'Gutes Stellungsspiel von {d}: Er muss gar nicht sprinten, um {p} zu stoppen.',
  ],
  fail_race_tired: ['{p} fehlen die Kräfte, {d} läuft ihn mühelos ab.', 'Der Sprint von {p} verpufft – er ist sichtlich müde.'],

  // --- Dribbling / Zweikampf am Boden -------------------------------------------
  b_dribbling_drib: ['{p} tanzt {d} aus!', 'Feine Ballführung von {p}, {d} greift ins Leere.', '{p} mit einem Haken – {d} ist überspielt.'],
  b_dribbling_pace: ['{p} geht mit Tempo an {d} vorbei.', '{p} legt sich den Ball vor und ist weg – {d} ist zu langsam.', 'Tempodribbling von {p}, {d} kann nur hinterherschauen.'],
  b_dribbling_agil: ['{p} dreht sich blitzschnell um {d} herum.', 'Wendig wie ein Wiesel: {p} lässt {d} stehen.'],
  b_dribbling_flair: ['Ein Trick von {p} – {d} fällt darauf herein!', '{p} probiert etwas Verrücktes, und es klappt gegen {d}.', 'Hackentrick von {p}, {d} ist verladen!'],
  b_dribbling_balance: ['{d} rempelt, aber {p} bleibt auf den Beinen.', '{p} lässt sich von {d} nicht vom Ball trennen.'],
  b_dribbling_strength: ['{p} schüttelt {d} mit Körpereinsatz ab.', '{p} schirmt den Ball gegen {d} ab und setzt sich durch.'],
  b_dribbling_tired: ['{d} kommt nicht mehr hinterher – {p} nutzt die müden Beine aus.'],
  b_kurzpass_drib: ['{a} legt ab, {p} dribbelt an {d} vorbei.'], b_kurzpass_pace: ['{a} spielt auf {p}, der mit Tempo an {d} vorbeizieht.'],
  b_kurzpass_agil: ['{p} nimmt den Ball von {a} an, dreht sich um {d} – frei!'], b_kurzpass_flair: ['{a} auf {p}, eine Körpertäuschung, und {d} ist weg.'],
  b_kurzpass_balance: ['{p} behauptet den Ball gegen {d} und kommt zum Abschluss.'], b_kurzpass_strength: ['{p} setzt sich nach dem Zuspiel von {a} robust gegen {d} durch.'],
  b_kurzpass_tired: ['{d} ist stehend k. o., {p} nimmt das Zuspiel von {a} und zieht ab.'],
  b_kurzpass_vision: [
    'Was für ein Pass von {a}! Er sieht die Lücke, die sonst niemand sieht – {p} ist frei!', '{a} mit dem tödlichen Pass in die Schnittstelle auf {p}.',
    'Geniale Idee von {a}: Der Ball geht durch drei Reihen auf {p}.',
  ],
  b_kurzpass_teamwork: ['Schöne Kombination, jeder Laufweg passt – {a} findet {p}.', 'Doppelpass {a} – {p}, die Abwehr ist ausgespielt.'],
  b_kurzpass_touch: ['{p} nimmt das Zuspiel von {a} mit dem ersten Kontakt perfekt mit – vorbei an {d}!', 'Traumhafte Ballannahme von {p}, {d} ist sofort zu spät.'],
  fail_tackle_tackle: ['Saubere Grätsche von {d} – {p} ist den Ball los.', '{d} spitzelt {p} den Ball mit perfektem Timing vom Fuß.', 'Lehrbuch-Tackling von {d} gegen {p}.'],
  fail_tackle_strength: ['{d} drückt {p} mit dem Körper vom Ball.', '{p} prallt an {d} ab wie an einer Wand.'],
  fail_tackle_pace: ['{d} ist schneller wieder in Position und stoppt {p}.'],
  fail_tackle_pos: ['{d} läuft den Weg zu, {p} rennt sich fest.', '{d} stellt {p} clever – kein Durchkommen.'],
  fail_tackle_marking: ['{d} klebt an {p}, keine Chance, den Ball anzunehmen.', '@-1991 Manndecker {d} lässt {p} auch hier keinen Zentimeter.'],
  fail_tackle_tired: ['{p} fehlt die Spritzigkeit, {d} nimmt ihm den Ball ab.', 'Müde Beine bei {p} – {d} gewinnt den Zweikampf mühelos.'],

  // --- Luftduelle -----------------------------------------------------------------
  b_flanke_header: ['Flanke {a}, {p} hat das bessere Timing als {d}.', '{a} flankt, {p} köpft mit Wucht über {d} hinweg.'],
  b_flanke_jump: ['{a} flankt, {p} schraubt sich hoch – höher als {d}!', '{p} steht förmlich in der Luft, {d} springt vergeblich.'],
  b_flanke_strength: ['{a} flankt, {p} setzt sich im Gerangel gegen {d} durch.'],
  b_flanke_height: ['Flanke {a} – der lange {p} überragt {d} um einen Kopf.'],
  b_ecke_header: ['Ecke {a}, {p} hat das Timing und köpft vor {d}.', 'Eckball von {a}, {p} ist mit dem Kopf zuerst da.'],
  b_ecke_jump: ['Ecke {a}, {p} steigt am höchsten!', '{p} springt in die Ecke von {a} – {d} kommt nicht mit hoch.'],
  b_ecke_strength: ['Ecke {a}, {p} drückt sich gegen {d} durch.'],
  b_ecke_height: ['Ecke {a}, Kopfball des langen {p}.'],
  fail_aerial_header: ['{d} gewinnt das Kopfballduell gegen {p} mit perfektem Timing.', '{d} ist mit der Stirn zuerst am Ball.'],
  fail_aerial_jump: ['{d} steigt höher als {p} und köpft weg.', 'Sprungkraft pur: {d} räumt in der Luft gegen {p} ab.'],
  fail_aerial_strength: ['{d} setzt sich im Luftkampf mit Körpereinsatz gegen {p} durch.'],
  fail_aerial_height: ['Gegen den langen {d} hat {p} in der Luft keine Chance.'],
  fail_aerial_marking: ['{d} lässt {p} keinen Meter Platz zum Anlaufen und klärt.', '{d} hat {p} genau im Blick – geklärt.'],
  fail_aerial_tired: ['{p} kommt nicht mehr hoch – {d} klärt.'],
  fail_claim_comm: ['{d} ruft laut „Leo!“ und pflückt den Ball sicher herunter.', '{d} dirigiert die Abwehr und ist dann selbst zur Stelle.'],

  // --- Pässe ----------------------------------------------------------------------
  fail_intercept_antic: [
    '{d} ahnt den Pass von {p} und geht dazwischen.', '{d} liest das Spiel – Pass von {p} abgefangen.',
    'Gute Antizipation von {d}: Der Ball von {p} kommt nie an.', '{d} steht genau im Passweg von {p}.',
  ],
  fail_intercept_tired: ['Der Pass von {p} ist zu lasch – die Kräfte schwinden. {d} fängt ihn ab.'],

  // --- Abschluss -----------------------------------------------------------------------
  b_abpraller_handling: ['{k} kann den Ball nicht festhalten – {p} ist zur Stelle!', '{k} lässt nach vorne abprallen, {p} setzt nach!'],
  o_goal_cool: [
    'Eiskalt! {p} bleibt ganz ruhig, wartet, bis {k} liegt, und schiebt ein – {score}!', 'Keine Spur von Nervosität: {p} verwandelt souverän zum {score}!',
    'Mit der Ruhe eines Routiniers lupft {p} den Ball über {k} – {score}!',
  ],
  o_goal_power: ['Ein Hammer von {p}! {k} sieht den Ball nur noch einschlagen – {score}!', 'Mit voller Wucht – der Schuss von {p} ist unhaltbar! {score}!'],
  o_saved_reflex: ['Glanzparade! {k} reißt reflexartig die Hand hoch.', '{k} mit einem Wahnsinnsreflex!', 'Was für eine Reaktion von {k}!'],
  o_saved_k1v1: ['{k} kommt raus, macht sich breit – und hält gegen {p}!', 'Eins gegen eins – {k} bleibt lange stehen und gewinnt das Duell mit {p}.'],
  o_wide_nerves: ['{p} verliert die Nerven – der Ball geht weit vorbei!', 'Allein vor dem Tor zittert {p} – daneben!'],
  o_over_nerves: ['{p} hat zu viel Zeit zum Nachdenken – und jagt den Ball über das Tor.', 'Die Nerven! {p} verzieht kläglich.'],
  o_saved_nerves: ['{p} schiebt zaghaft – {k} hat keine Mühe.'],
  o_blocked_nerves: ['{p} zögert zu lange, ein Verteidiger blockt.'],
};
