// =============================================================================
// Ruhige Spielphasen: Ballbesitz, Spielfluss, Stimmung, Wetter, Statistik,
// kleine Randgeschichten. Hält den Text lebendig, ohne Spannung vorzutäuschen.
// Slots: {t} Team am Ball, {o} Gegner, {p} Spieler von {t}, {d} Spieler von {o},
// {score}, {min}, {poss} Ballbesitz von {t} in Prozent, {shots} Schüsse.
// =============================================================================
import type { Grammar } from './grammar';

export const AMBIENCE: Grammar = {
  flow_def: [
    '{tn} lässt den Ball in der eigenen Hälfte zirkulieren.', '{p} spielt quer, {t} sucht die Lücke.', '{tn} baut ruhig von hinten auf.',
    '{p} mit dem Ball, er schaut sich um.', 'Rückpass zu {k_t}. Kurze Verschnaufpause.', '{tn} sortiert sich.',
    '{o} läuft früh an, {t} spielt sich trotzdem heraus.', '{p} schlägt den Ball lang – zu lang, Abstoß.',
    '@-1991 Rückpass zum Torwart, der nimmt ihn auf und wartet. So vergeht die Zeit.', '@1992- {k_t} spielt mit, kurzer Pass auf {p}.',
    '{p} dribbelt sich aus dem Pressing, gute Szene.', '{tn} hat den Ball, aber noch keine Idee.',
  ],
  flow_mid: [
    'Das Spiel spielt sich im Mittelfeld ab.', 'Viel Kampf, wenig Glanz im Mittelfeld.', '{p} und {d} beharken sich an der Mittellinie.',
    '{tn} hat mehr vom Spiel.', 'Ein Abtasten, beide Mannschaften warten auf Fehler.', '{p} versucht es mit einem Pass in die Tiefe – abgefangen.',
    'Einwurf für {t}.', '{p} holt sich den Ball tief in der eigenen Hälfte.', 'Zweikampf um Zweikampf im Mittelkreis.',
    '{tn} verlagert das Spiel auf die andere Seite.', 'Freistoß im Mittelfeld für {t}, schnell ausgeführt.', '{d} stört früh, {t} muss zurückspielen.',
    '@2008- {o} presst hoch, {t} spielt sich mit Geduld heraus.', '@-1990 Lange Bälle, zweite Bälle – ein typisches Spiel dieser Tage.',
    '{p} zieht das Tempo an.', '{p} lässt sich fallen und verteilt die Bälle.', '{tn} kontrolliert das Geschehen.',
  ],
  flow_att: [
    '{tn} kommt über {p} in die Hälfte von {o}.', '{p} versucht es mit einer Flanke – zu weit.', '{tn} drückt, {o} verteidigt tief.',
    '{p} sucht den Weg in den Strafraum, findet ihn aber nicht.', '{tn} belagert den Strafraum, aber es fehlt der letzte Pass.',
    'Einwurf tief in der Hälfte von {o}.', '{o} steht kompakt, {t} beißt sich die Zähne aus.', '{p} probiert es mit einem Hackentrick – zu verspielt.',
    'Getümmel vor dem Strafraum, {d} klärt.', '{tn} schnürt {o} ein.',
  ],
  // --- Farbe & Zwischentöne ---------------------------------------------------
  color: [
    '#publikum# singt sich warm.', 'Auf den Rängen wird gesungen.', 'Fahnen wehen in der Kurve.', 'Die Fans von {o} sind lautstark zu hören.',
    '?regen Der Regen wird stärker, das Leder rutscht.', '?schnee Die Schneeflocken tanzen im Flutlicht.', '?hitze Trinkpause? Die Hitze macht allen zu schaffen.',
    '?nebel Der Nebel wird dichter – man sieht kaum noch die Gegengerade.', '?wind Der Wind trägt jeden langen Ball ins Aus.',
    '?derby Die Stimmung ist aufgeheizt, jeder Zweikampf wird bejubelt.', 'Der Trainer von {t} gestikuliert an der Seitenlinie.',
    'Auf der Bank von {o} wird diskutiert.', '{p} bindet sich die Schuhe neu.', 'Ein Balljunge ist schnell und bringt den Ball zurück.',
    '@-1989 Bratwurstduft zieht über die Stehplätze.', '@-1994 Ein Fotograf hinter dem Tor wechselt den Film.', '@2005- Die Ersatzspieler machen sich am Rand warm.',
    '@1995- Die Werbebanden blinken – das Geschäft läuft mit.', '#zeitgeist#', 'Der Schiedsrichter lässt viel laufen.', 'Der Schiedsrichter pfeift kleinlich heute.',
    '?eigen Deine Elf hat gerade das Heft in der Hand.', '?gegner Deine Mannschaft läuft gerade hinterher.',
  ],
  stat_line: [
    '@1992- Ballbesitz {t}: {poss} Prozent.', '{tn} kommt bisher auf {shots} Torschüsse.', '@1998- {tn} gewinnt aktuell {duels} Prozent der Zweikämpfe.',
    '@2016- Expected Goals bisher: {xg_h} zu {xg_a}.', '@2003- {tn} hat bereits {passes} Pässe gespielt.', 'Eckenverhältnis: {corners}.',
  ],
  // --- Seltene Randgeschichten (nur gelegentlich) ---------------------------
  anecdote: [
    'Ein Hund läuft aufs Feld! Der Ordner hat Mühe, ihn einzufangen.', 'Ein Ball fliegt von der Tribüne aufs Feld, kurze Unterbrechung.',
    'Ein Zuschauer rennt aufs Feld und wird von den Ordnern abgeführt.', '@-1995 Ein Linienrichter muss seine Fahne reparieren lassen.',
    '?schnee Ein Schneeball fliegt Richtung Eckfahne. Die Fans haben Langeweile.', 'Ein Flitzer! Das Publikum feiert ihn mehr als den Fußball.',
    'Der Kapitän von {t} bespricht etwas mit dem Schiedsrichter.', 'Kurze Unterbrechung – {p} hat einen Schuh verloren.',
    '@-1990 Stadionsprecher: „Der Fahrer des grünen Kombis bitte zum Ausgang!“', '@2000- Kurze Pause – ein Tor-Netz hat ein Loch und wird geflickt.',
  ],
};
