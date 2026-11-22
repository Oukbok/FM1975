// =============================================================================
// Wiki-Artikel „Seitenlinie im Textmodus“ (Wunsch Pascal: Regeln der Zurufe,
// Halbzeitansprache, Einzelgespräche und Aufwärmen mit Wirkung in Prozent).
// Die Zahlen der Zurufe kommen direkt aus engine/match/shouts.ts; die übrigen
// stehen so in engine/match/sim.ts (`teamTalk`) und engine/match/sideline.ts.
// =============================================================================
import type { WikiArticle } from './wiki';
import {
  SHOUT_COOLDOWN, SHOUT_LIST, SHOUT_MINUTES, SHOUT_MIN_POWER, SHOUT_REPEAT_MALUS, SHOUT_REPEAT_WINDOW, shoutFxText,
} from '../engine/match/shouts';
import { WARM_DAY, WARM_ENERGY, WARM_MINUTES } from '../engine/match/sideline';

const pct = (v: number) => `${Math.round(v * 100)} %`;
const pause = SHOUT_COOLDOWN - SHOUT_MINUTES;

const shoutLines = SHOUT_LIST.map(([id, label]) => `- **${label}** – ${shoutFxText(id)}.`).join('\n');

export const SIDELINE_WIKI: WikiArticle = {
  id: 'match-sideline',
  category: 'match',
  title: 'Seitenlinie: Zurufe, Ansprache, Gespräche, Aufwärmen',
  keywords: ['zuruf', 'zurufe', 'seitenlinie', 'abklingzeit', 'wiederholung', 'kapitän', 'halbzeitansprache', 'ansprache', 'kabinenpredigt', 'einzelgespräch', 'spielergespräch', 'aufwärmen', 'textmodus'],
  body: `Alles hier gibt es nur im **Textmodus** und nur für deine Mannschaft. KI-Trainer nutzen keine Zurufe, Ansprachen oder Gespräche – simulierte Spiele rechnen ohne sie.

## Zurufe: Dauer und Abklingzeit
- Ein Zuruf wirkt **${SHOUT_MINUTES} Spielminuten** (Nachspielzeit zählt nicht mit).
- Den nächsten Zuruf kannst du **${SHOUT_COOLDOWN} Minuten** nach dem letzten geben – nach dem Ende der Wirkung also noch **${pause} Minuten Pause**.
- Im Reiter **Taktik** zeigt ein Ring die Restminuten („noch 9 Min.“), darunter eine Leiste mit Wirkung und Pause; danach steht dort „wieder möglich ab der 61. Min.“. Oben rechts in der Kopfzeile zeigt ein kleines Etikett dasselbe, ein Klick öffnet den Reiter Taktik. Auf der **Zeitleiste** markiert ein grünes Band die Spanne jedes Zurufs.
- Auch in der Halbzeitpause darfst du rufen; der Zuruf wirkt dann ab Beginn der zweiten Hälfte.

## Wirkung der Zurufe (bei normaler Stärke)
Die Prozente verändern die Mannschaftswerte, mit denen die Engine jede Szene rechnet.
${shoutLines}

## Wie stark ein Zuruf ankommt
- **Kapitän:** Seine Führungsqualität verstärkt oder dämpft jeden Zuruf – Führung 50 = normale Stärke, 25 = −10 %, 75 = +10 %, 100 = +20 %. Steht kein Kapitän auf dem Platz, zählt Führung 55.
- **Tagesform der Mannschaft:** Jeder Zuruf schwankt zufällig um ±15 %. Kommt er stärker an als normal, meldet der Ticker „Das kommt an!“.
- **Wiederholung:** War derselbe Zuruf schon unter deinen letzten **${SHOUT_REPEAT_WINDOW}** Zurufen, wirkt er je Wiederholung **${pct(SHOUT_REPEAT_MALUS)} schwächer** (einmal wiederholt −30 %, zweimal −60 %), nie aber unter **${pct(SHOUT_MIN_POWER)}** der normalen Stärke. Das Etikett am Knopf zeigt den Abschlag schon vor dem Klick („Wiederholung: −30 %“), ab der zweiten Wiederholung nicken die Spieler im Ticker nur noch müde. Wechselst du ab, wirkt jeder Zuruf wieder voll.
- Der Spielstand und dein Ansehen spielen für Zurufe keine Rolle.

## Halbzeitansprache
Nur in der Pause, wirkt die ganze zweite Hälfte (und eine Verlängerung) auf **Angriff, Abwehr und Spielkontrolle**, dazu ein Zufall von ±1 %:
- **Loben:** bei Führung +2 %, bei Unentschieden +1 %, bei Rückstand −1,5 %.
- **Ruhig analysieren:** immer +1,2 %.
- **Kabinenpredigt:** bei Rückstand +3,5 %, bei Unentschieden +1 %, bei Führung −2 %; dazu bekommt jeder Spieler 2 Punkte Kraft zurück.

## Einzelgespräche
Einmal je Halbzeit und Spieler; die Wirkung trifft seine **Tagesleistung** (Zufall ±0,3 %). Die Note ist die Live-Note (1 = sehr gut):
- **Loben:** Note bis 3,0 +1,5 %, bis 4,0 +0,5 %, schlechter −0,5 %.
- **Mehr fordern:** Note ab 4,0 +1,6 % plus bis zu +1 % nach Laufbereitschaft; Note bis 2,5 kränkt ihn (−1 %); dazwischen +0,3 %.
- **Beruhigen:** verwarnte oder nervenschwache Spieler (Nervenstärke unter 50) und alle in einer heißen Phase +1,2 %, sonst +0,2 %.

## Aufwärmen
Nach **${WARM_MINUTES} Minuten** ist ein Ersatzspieler warm: Eingewechselt bringt er **+${WARM_ENERGY} Kraft** und **+${pct(WARM_DAY - 1)} Tagesleistung** mit. Wer länger als zehn Minuten an der Linie läuft, verliert alle fünf Minuten 0,6 Punkte Kraft (nicht unter 70).`,
};
