// =============================================================================
// Wiki-Artikel „Relegation & Play-offs“ (Wunsch Pascal: Relegation komplett und
// akkurat in jedem Ligensystem, auch außerhalb Deutschlands). Die Liste der
// Formate je Land entsteht direkt aus data/relegationRules.ts.
// Achtung: Der Artikel `relegation-end` (Ende der Amtszeit) ist etwas anderes.
// =============================================================================
import type { WikiArticle } from './wiki';
import { RELEGATION_FORMATS, bracketEntrants, relKindName, type RelFormat } from './relegationRules';
import { COUNTRY_BY_CC } from './world/countries';

const FROM_BOTTOM = ['Letzter', 'Vorletzter', 'Drittletzter', 'Viertletzter', 'Fünftletzter', 'Sechstletzter'];
const season = (y: number) => `${y}/${String(y + 1).slice(2)}`;
const span = (f: RelFormat) => (f.to >= 2100 ? `ab ${season(f.from)}` : f.from === f.to ? season(f.from) : `${season(f.from)}–${season(f.to)}`);

/** Kurzbeschreibung eines Formats ohne feste Ligagröße. */
function describe(f: RelFormat): string {
  if (f.brackets === 'champs') return 'geloste Duelle der Staffelmeister (und markierter Vizemeister) um die Aufstiegsplätze';
  return f.brackets.map((b) => {
    const e = bracketEntrants(b);
    const up = e.filter((x) => x.s === 'u').map((x) => (x.p < 0 ? FROM_BOTTOM[-x.p - 1] : `${x.p}.`));
    const low = [...new Set(e.filter((x) => x.s === 'l').map((x) => x.p))].sort((a, c) => a - c);
    const lowTxt = low.length === 1 ? `${low[0]}.${e.some((x) => x.g) ? ' der Staffeln' : ''} der Ebene ${f.lv + 1}` : low.length ? `Plätze ${low[0]}–${low[low.length - 1]} der Ebene ${f.lv + 1}` : '';
    if (b.ifLevel) return `Entscheidungsspiel bei Punktgleichheit (${up.length ? up.join('/') : lowTxt})`;
    if (!low.length) return `${up.join(' gegen ')}`;
    return up.length ? `${up.join('/')} gegen ${b.m.length > 1 ? 'Sieger ' : ''}${lowTxt}` : lowTxt;
  }).join('; ');
}

function formatList(): string {
  const byCc = new Map<string, RelFormat[]>();
  for (const f of RELEGATION_FORMATS) byCc.set(f.cc, [...(byCc.get(f.cc) ?? []), f]);
  return [...byCc.entries()]
    .map(([cc, fs]) => ({ name: COUNTRY_BY_CC[cc]?.name ?? cc, fs }))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'))
    .map(({ name, fs }) => `- **${name}:** ${fs.map((f) => `${span(f)} Ebene ${f.lv}/${f.lv + 1} ${relKindName(f)} (${describe(f)})`).join('; ')}.`)
    .join('\n');
}

export const RELEGATION_WIKI: WikiArticle = {
  id: 'league-relegation',
  category: 'leagues',
  title: 'Relegation & Play-offs',
  keywords: ['relegation', 'play-off', 'playoffs', 'barrage', 'nacompetitie', 'promoción', 'play-out', 'entscheidungsspiel', 'kvalifikation', 'aufstiegsspiele', 'auswärtstore', 'hinspiel', 'rückspiel', 'aufstieg', 'abstieg'],
  body: `## Relegation & Play-offs
In vielen Ländern und Epochen entscheiden **Entscheidungsspiele** über Auf- und Abstieg: die Relegation (Drittletzter der oberen gegen Dritten der unteren Liga), Play-offs (mehrere Vereine der unteren Liga spielen einen Aufstiegsplatz aus), Barrages, Nacompetitie, Promoción, Play-out (zwei Vereine der oberen Liga spielen gegen den Abstieg) oder ein Entscheidungsspiel bei Punktgleichheit. Das Spiel kennt sie je Land und Saison so, wie es sie gab – auch, wenn dein Heimatland nicht Deutschland ist.

### So läuft es im Spiel
- **Die Zahl der Auf- und Absteiger** bleibt, wie sie der Saisonwechsel ohnehin rechnet (Deutschland nach den Ligareformen, im Ausland nach der historischen Struktur des Landes). Die Relegation entscheidet, **wer** den umkämpften Platz bekommt: Gewinnt der Verein der oberen Liga, bleibt er oben und der Herausforderer unten; sonst tauschen beide.
- **Termine:** nach dem letzten Spieltag der beiden Ligen – erstes Spiel vier Tage später, Rückspiel drei Tage danach, die nächste Runde eine Woche später. Die Spiele stehen im Kalender.
- **Entscheidung:** Gesamtstand aus Hin- und Rückspiel, dann Auswärtstore (wo und solange es sie gab – in Deutschland bis 2020/21), dann Verlängerung und Elfmeterschießen. In Italien und Spanien kommt nach der Verlängerung der Besserplatzierte weiter. Finale auf neutralem Platz (England ab 1989/90, Türkei) als ein Spiel.
- **Dein Verein:** Steht er nach dem letzten Spieltag auf einem Relegationsplatz, meldet sich der Vorstand. Die Spiele laufen wie jedes Pflichtspiel: Vorschau „Nächstes Spiel“, Simulieren oder Textmodus, Spielbericht. Ein Gegner ohne vollen Kader tritt mit seinen Spielern aus dem Spielerpool an.
- **Andere Vereine des Heimatlandes:** Spiele zwischen zwei Vereinen deiner Liga laufen über die Match-Engine, alle anderen über das Schnellmodell der simulierten Ligen.
- **Auslandsligen:** im Hintergrund nach dem letzten Spieltag ausgespielt (gleiches Modell wie ihre Ligaspiele); Ergebnisse erscheinen ab dem jeweiligen Termin.
- **Abstieg aus der untersten Liga:** Der Stichtag für das Ende der Amtszeit (Artikel „Abstieg aus der untersten Liga“) kommt erst nach der Relegation deines Vereins.

### Wo du es siehst
- **Statistiken › Liga:** Relegationsplätze haben eine eigene, gelbe Farbe; unter der Tabelle stehen Format, Paarungen, Ergebnisse und Sieger (Klick auf ein Spiel deines Landes öffnet den Spielbericht) – auch für frühere Saisons und für Auslandsligen.
- **Statistiken › Ligensystem:** Marke am Liga-Kasten (z. B. „Relegation“, „Play-offs“), der Zeiger zeigt das Format, etwa „16. gegen 3. der 2. Liga (Hin/Rück)“.
- **Nachrichten:** Paarungen nach dem letzten Spieltag, Ergebnis jeder Relegation.

### Formate je Land
${formatList()}

### Vereinfachungen
- Rundenturniere (Nacompetitie, Endrunde in Belgien, Auf-/Abstiegsrunde in der Schweiz 1987–2003) laufen als K.-o.-Duelle; Periodensieger werden durch Tabellenplätze ersetzt.
- Sonderregeln wie „Play-off entfällt bei großem Punkteabstand“ und Wiederholungsspiele gibt es nicht.
- Weicht die Ligagröße im Spiel von der historischen ab, bekommt eine Klammer manchmal keinen umkämpften Platz – dann zählt die Tabelle.
- Deutschland ab 2018/19: im Original vier Aufsteiger aus der Regionalliga mit wechselnden Direktplätzen; im Spiel bleiben drei Plätze über geloste Duelle der Meister.
- Länder ohne Eintrag spielen direkten Auf- und Abstieg.

### Alte Spielstände
Ein Spielstand aus einer Version ohne Relegation spielt die laufende Saison zu Ende wie bisher; ab der nächsten Saison gibt es die Relegation. Quellen und Details: \`docs/research/relegation.md\`, Test \`npm run test:relegation2\`.`,
};
