// =============================================================================
// Kommentarzeilen der Pokalauslosung (Grammatik wie im Textmodus, grammar.ts).
// Slots: {h} Heimverein, {a} Gastverein, {n} gezogener Verein, {me} dein Verein,
// {round} Rundenname, {round_n} mit Artikel (die 1. Hauptrunde / das Achtelfinale), {round_g} Genitiv, {venue} Ort. Flags: siehe screens/draw/drawComment.ts.
// =============================================================================
import type { Grammar } from './grammar';

export const DRAW_TEXT: Grammar = {
  intro: [
    '@-1989 ?cup Guten Abend aus dem Studio. Gleich wird {round_n} gelost – die Kugeln liegen im Topf.',
    '@1990-2016 ?cup Willkommen zur Auslosung {round_g}. Der Ziehungsleiter prüft die Töpfe.',
    '@2017- ?cup Live aus dem {venue}: {round_n} wird ausgelost.',
    '@-1989 !cup In {venue} kommt die Kommission zusammen. Die Kugeln für {round_n} sind vorbereitet.',
    '@1990-1997 !cup Auslosung in {venue}. Die Vertreter der Vereine sitzen im Saal.',
    '@1998- !cup Großer Abend in {venue}: {round_n} wird gelost.',
  ],
  first: [
    'Die erste Kugel: {n}.', 'Gezogen: {n}.', '{n} kommt aus dem Topf.', 'Nächste Kugel – {n}.',
    'Die Losfee greift hinein … {n}.', '@1998- Auf dem Zettel steht: {n}.', 'Es ist {n}.',
  ],
  pair: ['{h} gegen {a}.', '{h} empfängt {a}.', '{a} muss zu {h}.', 'Das ergibt {h} gegen {a}.'],
  big: ['Ein Kracher!', 'Da ist sie, die Wunschpaarung der Zuschauer.', 'Ein Duell zweier Großer – schon in dieser Runde.', 'Das wird ein Fest.'],
  david: ['David gegen Goliath.', 'Der Außenseiter darf vom großen Abend träumen.', '?home_small Das kleine Stadion wird aus allen Nähten platzen.'],
  amateur_home: ['Der Amateurverein hat Heimrecht.', 'Nach der Regel spielt der Amateur zu Hause.', 'Heimrecht für den Amateur – so will es die Regel.'],
  derby: ['Ein Derby!', 'Nachbarschaftsduell – da kennt man sich.'],
  german_duel: ['Ein deutsches Duell.', 'Zwei Vereine aus einem Land – erst jetzt, wo der Länderschutz fällt.'],
  rejected: ['Gleiches Land – die Kugel geht zurück in den Topf.', 'Länderschutz: {n} wartet auf die nächste Paarung.'],
  mine_first: ['Und da ist er: {me}!', 'Jetzt wird es ernst – {me} ist gezogen.', '{me}! Jetzt der Gegner …'],
  mine_pair_good: ['Eine lösbare Aufgabe für {me}.', 'Damit kann man leben.', 'Glück gehabt – das ist machbar.'],
  mine_pair_hard: ['Schweres Los für {me}.', 'Da hat {me} nicht gerade Glück gehabt.', 'Das wird ein ganz harter Brocken.'],
  mine_pair_even: ['Eine offene Partie.', 'Auf Augenhöhe – da entscheidet die Tagesform.'],
  end: ['Damit ist {round_n} komplett.', 'Alle Paarungen stehen fest.', 'Das war die Auslosung {round_g}.'],
};
