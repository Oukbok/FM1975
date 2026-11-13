// =============================================================================
// Was beeinflusst ein Attribut? – Texte für die i-Hilfe hinter jedem Attribut
// =============================================================================
// Abgeleitet aus der tatsächlichen Nutzung im Code (Stand: Match-Engine
// engine/match/team.ts + actions.ts + sim.ts + finish.ts, Form/Frische
// engine/form.ts, Kabine engine/dressingRoom.ts, Standardschützen
// engine/lineupAI.ts, Halle engine/indoor.ts, Abbau engine/development.ts).
// Prozentangaben = Anteil am jeweiligen Teilwert in der Engine.
// Positionsstärke (engine/positions.ts `weightsFor`) und Trainingsbausteine
// (engine/weeklyTraining.ts) werden in der Anzeige LIVE ergänzt – hier nicht pflegen.
// Ändert der Chancen-Strang die Engine, diese Liste mitziehen.
// =============================================================================
import type { PlayerAttributes } from '../types';

export type AttrInfoKey = keyof PlayerAttributes;

export interface AttrInfo {
  /** 1–2 Sätze: was der Wert beschreibt. */
  text: string;
  /** Spielsituationen, in denen der Wert direkt gerechnet wird. Leer = nur über die Positionsstärke. */
  uses: string[];
}

/** Körperliche Werte, die bei Abbau im Alter zuerst sinken (engine/development.ts). */
export const ATTR_PHYSICAL: AttrInfoKey[] = ['speed', 'acceleration', 'stamina', 'agility', 'jumping', 'strength', 'balance'];

const GK = 'Zählt für die Torwartstärke – und die steht jedem Schuss des Gegners gegenüber.';

export const ATTR_INFO: Record<AttrInfoKey, AttrInfo> = {
  fitness: { text: 'Grundkondition. Geht als Faktor in die Tagesstärke ein: Fitness 100 = volle Stärke, 0 = rund 10 % weniger.', uses: ['Tagesstärke in jedem Spiel', 'sinkt durch Einsätze, baut sich im Training wieder auf', 'hartes Training bei niedriger Fitness drückt die Form'] },
  stamina: { text: 'Wie lange ein Spieler durchhält.', uses: ['Kraftverlust im Spiel, Minute für Minute', 'Frische- und Fitnessverlust nach dem Spiel', 'schnellere Erholung der Frische', 'Laufleistung in der Spielstatistik'] },
  speed: { text: 'Grundschnelligkeit über längere Wege.', uses: [] },
  acceleration: { text: 'Antritt auf den ersten Metern.', uses: ['Hallenfußball (Technikwert)'] },
  strength: { text: 'Körperliche Robustheit im Duell.', uses: ['Kopfballduelle (15 % des Luftwerts)', 'Zweikämpfe (25 % des Zweikampfwerts)', 'Kopfball-Abschluss (15 %)', 'gewonnene Zweikämpfe in der Statistik'] },
  jumping: { text: 'Sprungkraft für hohe Bälle.', uses: ['Kopfballduelle (30 % des Luftwerts)', 'Kopfball-Abschluss (25 %)'] },
  agility: { text: 'Wendigkeit auf engem Raum.', uses: ['Hallenfußball (Technikwert)', 'Feldspieler im Tor: Ersatz-Torwartwert'] },
  balance: { text: 'Standfestigkeit im Körperkontakt.', uses: ['Zweikämpfe (10 % des Zweikampfwerts)'] },
  technique: { text: 'Saubere Ausführung am Ball.', uses: ['Torschüsse aus dem Spiel (15 %)', 'Fernschüsse (10 %)', 'direkte Freistöße (10 %)', 'Hallenfußball (Technikwert)'] },
  firstTouch: { text: 'Wie gut ein Ball verarbeitet wird.', uses: ['Torschüsse aus dem Spiel (15 %)', 'Passspiel der Mannschaft (20 % des Passwerts)', 'Hallenfußball (Technikwert)'] },
  shooting: { text: 'Abschlussqualität im Strafraum.', uses: ['Torschüsse aus dem Spiel (45 % der Abschlussqualität)', 'wer zum Abschluss kommt', 'Hallenfußball (Technikwert)'] },
  shotPower: { text: 'Wucht hinter dem Schuss.', uses: ['Fernschüsse (30 %)', 'direkte Freistöße (15 %)'] },
  longShots: { text: 'Abschluss aus der Distanz.', uses: ['Fernschüsse (60 %)', 'wer aus der Distanz abzieht'] },
  passing: { text: 'Genauigkeit im Kurzpassspiel.', uses: ['Passquote der Mannschaft (60 % des Passwerts)', 'Vorlagen bei Kurz- und Steilpässen', 'Passquote in der Spielstatistik'] },
  longPassing: { text: 'Lange Bälle und Spielverlagerungen.', uses: ['Vorlagen nach langen Bällen'] },
  crossing: { text: 'Flanken von außen.', uses: ['wie oft über Flanken angegriffen wird (Flügel, Außenverteidiger, OM)', 'Vorlagen nach Flanken', 'ohne festen Eckenschützen: wer die Ecke tritt'] },
  dribbling: { text: 'Am Gegner vorbeigehen.', uses: ['zieht Fouls des Gegners auf sich', 'Hallenfußball (Technikwert)'] },
  ballControl: { text: 'Ball eng am Fuß führen.', uses: ['Hallenfußball (Technikwert)'] },
  heading: { text: 'Kopfballspiel in beiden Strafräumen.', uses: ['Kopfballduelle bei Flanken und Ecken (55 % des Luftwerts)', 'Kopfball-Abschluss (60 %)', 'wer zum Kopfball kommt'] },
  tackling: { text: 'Sauberes Tackling.', uses: ['Zweikämpfe (35 % des Zweikampfwerts)', 'Balleroberungen', 'gewonnene Zweikämpfe in der Statistik'] },
  marking: { text: 'Gegenspieler eng decken.', uses: ['Zweikämpfe (20 % des Zweikampfwerts)'] },
  positioning: { text: 'Richtig stehen, ohne Ball.', uses: [] },
  interceptions: { text: 'Pässe ablaufen und abfangen.', uses: ['Balleroberungen (zusammen mit Tackling)'] },
  experience: { text: 'Erfahrung aus vielen Spielen – wächst mit jedem Pflichtspiel, bei jungen Spielern und im Europapokal schneller.', uses: ['Konstanz: weniger Schwankung der Tagesform', 'wichtige Spiele (Derby, Pokal, Europapokal, enge Schlussphase): bis etwa ±1,5 % Leistung', 'dämpft das Kartenrisiko in hitzigen Spielen', 'seltener Patzer im Spielaufbau'] },
  vision: { text: 'Kreativität und Spielübersicht.', uses: ['Passspiel der Mannschaft (20 % des Passwerts)', 'Vorlagen bei Kurz- und Steilpässen'] },
  composure: { text: 'Ruhe unter Druck.', uses: ['Torschüsse aus dem Spiel (25 %)', 'Elfmeter (30 %)', 'seltener Patzer im Spielaufbau', 'dämpft das Kartenrisiko', 'Reihenfolge im Elfmeterschießen'] },
  concentration: { text: 'Aufmerksamkeit über 90 Minuten.', uses: [] },
  decisions: { text: 'Die richtige Entscheidung im richtigen Moment.', uses: [] },
  leadership: { text: 'Ausstrahlung auf die Mitspieler.', uses: ['als Kapitän: Wirkung deiner Zurufe im Spiel', 'Einfluss in der Kabine und Zusammenhalt der Mannschaft', 'Vorschlag für die Kapitänsbinde'] },
  workRate: { text: 'Bereitschaft, viel zu laufen.', uses: ['Laufleistung in der Spielstatistik'] },
  aggression: { text: 'Härte im Zweikampf – auch über die Grenze.', uses: ['wer foult', 'Karten: Hitzköpfe sehen eher Gelb und Rot', 'Zweikämpfe (10 % des Zweikampfwerts)', 'Auswechselvorschlag bei Gelb'] },
  teamwork: { text: 'Mannschaftsdienliches Spiel.', uses: [] },
  flair: { text: 'Das Unberechenbare, Besondere.', uses: [] },
  reflexes: { text: 'Reaktion auf der Linie. ' + GK, uses: [] },
  handling: { text: 'Bälle sicher festhalten. ' + GK, uses: [] },
  kicking: { text: 'Abschlag und Spiel mit dem Fuß. ' + GK, uses: [] },
  aerialReach: { text: 'Flanken und hohe Bälle abfangen. ' + GK, uses: [] },
  oneOnOnes: { text: 'Duelle allein gegen den Stürmer. ' + GK, uses: [] },
  communication: { text: 'Die Abwehr dirigieren. ' + GK, uses: [] },
  penalties: { text: 'Sicherheit vom Punkt.', uses: ['Elfmeter (70 %)', 'Elfmeterschütze, wenn keiner festgelegt ist', 'Reihenfolge im Elfmeterschießen'] },
  freeKicks: { text: 'Direkte Freistöße.', uses: ['direkte Freistöße (75 %)', 'Freistoßschütze, wenn keiner festgelegt ist'] },
  corners: { text: 'Eckbälle treten.', uses: ['Vorschlag für den Eckenschützen'] },
};

/**
 * Attribute ohne eigene Wirkung im Spiel (weder direkt gerechnet noch in einer
 * Positionsgewichtung): nur Anzeige/Bericht. Wird in der i-Hilfe so genannt.
 */
export const ATTR_NO_EFFECT: AttrInfoKey[] = [];
