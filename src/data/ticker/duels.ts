// =============================================================================
// Textbausteine der Einzelduelle (Engine 2): Wer hat wen ausgespielt, wer gewann
// das Kopfballduell, wessen Pass wurde abgefangen? Slots wie in chances.ts:
// {p} Spieler des angreifenden Teams (Verlierer bzw. Schütze), {d} Gegenspieler
// (Gewinner bzw. Unterlegener), {a} Flanken-/Passgeber, {k} Torwart.
// =============================================================================
import type { Grammar } from './grammar';

export const DUELS: Grammar = {
  // --- Ballverluste je Art ------------------------------------------------------
  fail_intercept: [
    '{d} liest den Pass von {p} und fängt ihn ab.', '{d} spekuliert richtig – Pass von {p} abgefangen.',
    '{p} will in die Spitze spielen, doch {d} ist dazwischen.', 'Abgefangen! {d} hat die Idee von {p} geahnt.',
    '{d} geht dazwischen, der Ball von {p} kommt nicht an.', '@2008- {o} presst, {p} spielt in den Fuß von {d}.',
  ],
  fail_tackle: [
    '{d} gewinnt den Zweikampf gegen {p}.', '{p} bleibt an {d} hängen.', 'Saubere Grätsche von {d} gegen {p}.',
    '{d} nimmt {p} den Ball ab.', '{p} will vorbei, aber {d} stellt sich clever in den Weg.', '{d} setzt sich mit Körpereinsatz gegen {p} durch.',
    '@-1991 Manndecker {d} lässt {p} keinen Meter.',
  ],
  fail_aerial: [
    '{d} steigt höher als {p} und köpft weg.', 'Kopfballduell: {d} gewinnt gegen {p}.', '{d} klärt per Kopf vor {p}.',
    '{p} kommt nicht an {d} vorbei – in der Luft hat der Verteidiger das bessere Timing.', '@-1991 Libero {d} räumt in der Luft ab.',
  ],
  fail_claim: [
    '{d} kommt raus und pflückt die Flanke von {p} herunter.', 'Sicher gefangen – {d} beherrscht den Strafraum.',
    '{d} faustet die Hereingabe von {p} weg.', '{d} ist vor allen anderen am Ball.',
  ],
  fail_cross_blocked: [
    '{p} will flanken, {d} blockt.', '{d} stellt {p} auf der Außenbahn zu – keine Flanke.', 'Die Flanke von {p} prallt an {d} ab.',
    '{p} kommt gegen {d} nicht zur Flanke.',
  ],
  fail_race: [
    '{d} holt {p} im Laufduell ein und klärt.', '{p} ist schnell, aber {d} ist schneller.', '{d} läuft {p} ab.',
    'Wettrennen zwischen {p} und {d} – der Verteidiger gewinnt es.',
  ],
  fail_longball: [
    'Der lange Ball von {p} ist zu weit.', '{p} schlägt den Ball ins Aus.', 'Langer Ball von {p} – ohne Abnehmer.',
    '@-1991 Hoch und weit, aber ungenau – {p} findet keinen Mitspieler.',
  ],
  fail_recycle: [
    '{tn} findet keine Lücke und spielt zurück.', '{p} dreht ab – kein Durchkommen.', 'Ballbesitz {t}, aber kein Weg nach vorn.',
    '{p} legt quer, doch die Abwehr steht.',
  ],

  // --- Aufbau einer Chance aus dem Duell --------------------------------------
  b_flanke_flach: [
    '{a} bringt den Ball flach in den Rückraum, {p} ist vor {d} am Ball.', 'Scharfe flache Hereingabe von {a} – {p} läuft ein.',
    '{a} legt von der Grundlinie zurück, {p} lauert.', '@2005- {a} hinterläuft und spielt flach auf {p}.',
  ],
  b_fk_flanke: [
    '{a} bringt den Freistoß hoch in den Strafraum.', 'Freistoß von {a} von der Seite – alle Großen sind mit vorne.',
    '{a} zirkelt den Freistoß an den langen Pfosten.', 'Freistoß, Hereingabe {a}. {p} läuft an.',
  ],
  b_steil_lauf: [
    '{a} spielt steil, {p} läuft {d} davon!', 'Steilpass {a} – {p} ist einen Schritt schneller als {d}!',
    '{a} schickt {p} in die Tiefe, {d} kommt nicht hinterher.', '@-1991 {a} schlägt den Ball über den Libero, {p} enteilt {d}.',
  ],
  b_konter_lauf: [
    'Konter! {a} schickt {p}, und {d} kommt nicht mehr hinterher!', '{p} sprintet {d} davon – Gegenstoß!',
    'Ballgewinn, langer Ball von {a}, {p} ist auf und davon!',
  ],
};
