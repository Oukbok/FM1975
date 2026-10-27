// =============================================================================
// FOOTBALL MANAGER 1980 — Kommentar-Katalog für den Text-Modus
// =============================================================================
// Große Sammlung deutscher Kommentar-Bausteine im Stil der frühen 1980er
// (Radio/TV-Reportage, kein xG, kein VAR). Chancen bauen sich über mehrere
// Text-Häppchen auf (Aufbau → Chance entsteht → Spannung) und lösen sich dann
// auf (Tor / gehalten / vorbei / geblockt / Latte).
//
// Platzhalter in den Texten:
//   {spieler}  → Nachname des Hauptbeteiligten
//   {team}     → Kurzname der Mannschaft
//   {gegner}   → Kurzname des Gegners
//   {torwart}  → Nachname des Torwarts
//   {vorlage}  → Nachname des Vorlagengebers
// =============================================================================

/** Mini-RNG (mulberry32) für reproduzierbare Textauswahl. */
export function textRng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

const pick = (arr: string[], rng: () => number): string => arr[Math.floor(rng() * arr.length)];

export interface CommentaryTokens {
  spieler?: string;
  team?: string;
  gegner?: string;
  torwart?: string;
  vorlage?: string;
}

function fill(tpl: string, tok: CommentaryTokens): string {
  return tpl
    .replace(/\{spieler\}/g, tok.spieler ?? 'der Angreifer')
    .replace(/\{team\}/g, tok.team ?? 'die Elf')
    .replace(/\{gegner\}/g, tok.gegner ?? 'der Gegner')
    .replace(/\{torwart\}/g, tok.torwart ?? 'der Schlussmann')
    .replace(/\{vorlage\}/g, tok.vorlage ?? 'der Nebenmann');
}

// -----------------------------------------------------------------------------
// AUFBAU (Spielaufbau, ruhige Phase)
// -----------------------------------------------------------------------------
export const AUFBAU: string[] = [
  '{team} lässt den Ball in der eigenen Hälfte durch die Reihen laufen.',
  '{team} sucht geduldig nach einer Lücke in der Deckung.',
  'Der Libero von {team} treibt das Leder nach vorne.',
  '{team} verlagert das Spiel auf die andere Seite — das Publikum wird lauter.',
  'Ballstafette bei {team}, alles noch ohne große Gefahr.',
  '{team} kombiniert sich durchs Mittelfeld, {gegner} steht aber kompakt.',
  'Ein langer Ball von {team} in die Spitze — die Abwehr klärt zunächst.',
  '{spieler} fordert den Ball, dreht auf und leitet den Angriff ein.',
  '{team} erhöht das Tempo, jetzt geht es nach vorne!',
  'Geduldiges Aufbauspiel von {team}, der Trainer dirigiert von der Bank.',
];

// -----------------------------------------------------------------------------
// CHANCE ENTSTEHT (der Angriff wird gefährlich)
// -----------------------------------------------------------------------------
export const CHANCE_AUFBAU: string[] = [
  '{spieler} tankt sich auf dem Flügel durch und zieht in die Mitte!',
  'Doppelpass im Strafraum — {spieler} kommt an den Ball!',
  '{spieler} wird mit einem Steilpass auf die Reise geschickt!',
  'Flanke von {vorlage} in den Sechzehner — da lauert {spieler}!',
  '{spieler} lässt zwei Mann stehen und sucht den Abschluss!',
  'Ein Fehler in der Abwehr von {gegner} — {spieler} schnappt sich die Kugel!',
  '{spieler} zieht aus der zweiten Reihe einfach mal ab …',
  'Konter über {team}! {spieler} läuft alleine auf das Tor zu!',
  'Kopfballverlängerung — und plötzlich steht {spieler} frei!',
  'Die Hereingabe kommt gefährlich, {spieler} geht dazwischen!',
];

// -----------------------------------------------------------------------------
// SPANNUNG (kurze Verzögerung vor der Auflösung)
// -----------------------------------------------------------------------------
export const SPANNUNG: string[] = [
  'Das ganze Stadion hält den Atem an …',
  'Jetzt wird es brenzlig vor dem Tor …',
  'Die Fans springen von den Sitzen …',
  'Das könnte die Führung bedeuten …',
  'Alles blickt auf den Ball …',
  'Ein Raunen geht durch die Ränge …',
];

// -----------------------------------------------------------------------------
// AUFLÖSUNGEN
// -----------------------------------------------------------------------------
export const AUF_TOR: string[] = [
  '… und TOOOR! {spieler} vollstreckt eiskalt für {team}!',
  '… drin! {spieler} hämmert die Kugel unter die Latte — Tor für {team}!',
  '… das sitzt! {spieler} trifft für {team}, was für ein Treffer!',
  '… TOR! {spieler} schiebt am {torwart} vorbei ein!',
  '… und {spieler} macht es! Jubel bei {team}!',
];
export const AUF_GEHALTEN: string[] = [
  '… doch {torwart} ist zur Stelle und pariert glänzend!',
  '… {torwart} taucht ab und hält den Ball fest — stark!',
  '… gehalten! {torwart} verhindert die Führung mit einer Glanzparade!',
  '… {torwart} lenkt den Ball mit den Fingerspitzen um den Pfosten!',
];
export const AUF_VORBEI: string[] = [
  '… aber {spieler} setzt den Ball knapp neben das Tor!',
  '… drüber! {spieler} zielt zu hoch.',
  '… vorbei! Um Zentimeter verfehlt {spieler} das lange Eck.',
  '… {spieler} rutscht im letzten Moment weg — daneben!',
];
export const AUF_GEBLOCKT: string[] = [
  '… doch die Abwehr von {gegner} wirft sich dazwischen und blockt!',
  '… geblockt! Ein Verteidiger von {gegner} klärt in höchster Not.',
  '… der Schuss von {spieler} wird abgefälscht und verspringt!',
];
export const AUF_LATTE: string[] = [
  '… an die LATTE! Wahnsinn, {spieler} hatte Pech!',
  '… Pfosten! Der Ball klatscht ans Aluminium und springt zurück ins Feld!',
  '… an den Innenpfosten und wieder heraus — was für ein Aluminiumtreffer von {spieler}!',
];

// -----------------------------------------------------------------------------
// EINZELEREIGNISSE (ein Text-Häppchen)
// -----------------------------------------------------------------------------
export const FOUL: string[] = [
  'Ruppiges Einsteigen von {spieler} — der Schiedsrichter pfeift Foul.',
  '{spieler} kommt zu spät und holt den Gegenspieler von den Beinen.',
  'Freistoß! {spieler} hat da unfair nachgeholfen.',
  'Ein hartes Foul von {spieler}, der Gegner bleibt kurz liegen.',
];
export const GELB: string[] = [
  'Gelbe Karte für {spieler} — das war notwendig, sagt der Unparteiische.',
  'Verwarnung für {spieler}. Er nickt und trollt sich.',
  '{spieler} sieht Gelb, in der 80er-Ära eine echte Ansage.',
];
export const ROT: string[] = [
  'ROTE KARTE! {spieler} muss unter die Dusche — {team} nur noch zu zehnt!',
  'Platzverweis für {spieler}! Das war zu viel des Guten.',
];
export const GELBROT: string[] = [
  'Gelb-Rot! Nach der zweiten Verwarnung ist für {spieler} Feierabend.',
  '{spieler} sieht die Ampelkarte — {team} muss dezimiert weiterspielen.',
];
export const ECKE: string[] = [
  'Eckball für {team}. {spieler} läuft an …',
  '{spieler} bringt die Ecke scharf herein.',
  'Eckstoß {team} — die Großen rücken nach vorne.',
];
export const FREISTOSS: string[] = [
  'Aussichtsreicher Freistoß für {team}, {spieler} legt sich den Ball zurecht.',
  '{spieler} steht über dem ruhenden Ball — Mauer wird gestellt.',
];
export const ABSEITS: string[] = [
  'Abseits! Die Fahne des Linienrichters geht hoch — {spieler} war zu früh gestartet.',
  'Die Abseitsfalle von {gegner} klappt — {spieler} stand im Abseits.',
];
export const VERLETZUNG: string[] = [
  '{spieler} bleibt liegen und muss behandelt werden — das sieht nicht gut aus.',
  'Verletzungssorgen bei {team}: {spieler} humpelt und kann kaum auftreten.',
];
export const PARADE: string[] = [
  '{torwart} zeigt eine Weltklasse-Parade und hält {team} im Spiel!',
  'Was für ein Reflex von {torwart}!',
];
export const KICKOFF: string[] = [
  'Anpfiff! Das Spiel läuft — die Zuschauer sind in bester Stimmung.',
  'Der Schiedsrichter gibt das Spiel frei. Auf geht\'s!',
];
export const JUBEL: string[] = [
  'Die Ränge beben! Fahnen wehen, das Stadion steht Kopf.',
  'Riesenjubel auf den Rängen — die Fans feiern ihren Torschützen!',
];

/** Baut die Auflösung eines Torschusses passend zum Ausgang. */
export function resolveShot(
  outcome: 'goal' | 'save' | 'miss' | 'blocked' | 'post',
  tok: CommentaryTokens,
  rng: () => number,
): string {
  const map = {
    goal: AUF_TOR, save: AUF_GEHALTEN, miss: AUF_VORBEI, blocked: AUF_GEBLOCKT, post: AUF_LATTE,
  } as const;
  return fill(pick(map[outcome], rng), tok);
}

/** Wählt und füllt einen zufälligen Text aus einem Katalog. */
export function say(catalog: string[], tok: CommentaryTokens, rng: () => number): string {
  return fill(pick(catalog, rng), tok);
}
