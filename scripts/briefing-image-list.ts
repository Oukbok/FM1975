// Bilderliste für das Briefing-Archiv: je Saison Aufmacher + zwei Nebenthemen, dazu je Art
// von „Neu im Spiel“ ein Bild. Schreibt docs/bilder/briefing.md.
//   node scripts/run-ts.mjs scripts/briefing-image-list.ts
import { writeFileSync } from 'node:fs';
import { composeBriefing } from '../src/game/seasonBriefing';
import { storiesOf } from '../src/game/briefingStories';
import { CHANGE_KIND_META } from '../src/game/briefingChanges';
import { topicMeta } from '../src/data/briefings';

const lines: string[] = [
  '# Bilder: Saison-Briefing (Zentrale › Briefing)',
  '',
  'Erzeugt mit `node scripts/run-ts.mjs scripts/briefing-image-list.ts`. Ablage `bilder/briefing/<datei>.webp`,',
  'danach den Schlüssel in `src/data/briefingImages.ts` (`BRIEFING_PHOTOS`) eintragen. Format WebP 1280 × 720 (16:9),',
  'Fotostil wie Pressefotos der jeweiligen Zeit (Farbe/Körnung passend zum Jahrzehnt), keine echten Logos, Vereine,',
  'Marken, Personen oder lesbaren Namen; Trikots in neutralen Farben. Das erste Bild je Saison ist der große Aufmacher.',
  '',
  '## Neu im Spiel (je Art ein Bild, `bilder/briefing/neu/<art>.webp`, Schlüssel in `BRIEFING_KIND_PHOTOS`)',
  '',
  '| Datei | Art | Motiv |',
  '|---|---|---|',
];
const KIND_MOTIF: Record<string, string> = {
  regel: 'Schiedsrichter mit Pfeife und Karten am Spielfeldrand', liga: 'Tabellenaushang/Anzeigetafel mit Ligatabelle',
  wettbewerb: 'Pokal auf einem Podest im Flutlicht', geld: 'Verhandlungstisch mit Vertrag, Füller und Geldscheinen',
  technik: 'Kamera/Technik am Tor oder im Stadion', training: 'Mannschaft beim Training in einem Trainingslager',
  halle: 'Hallenfußball mit Bande', jugend: 'Nachwuchsspieler auf dem Trainingsplatz', umfeld: 'Stadionvorplatz mit Fans und Ständen',
  einrichtung: 'Modernes Vereinsgebäude/Trainingszentrum',
};
for (const [k, m] of Object.entries(CHANGE_KIND_META)) lines.push(`| \`neu/${k}.webp\` | ${m.label} | ${KIND_MOTIF[k] ?? m.label} |`);
lines.push('', '## Ereignisse je Saison', '', '| Datei | Saison | Platz | Titel | Motiv (aus dem Text) |', '|---|---|---|---|---|');
let n = 0;
for (let y = 1975; y <= 2034; y++) {
  const season = `${y}/${String((y + 1) % 100).padStart(2, '0')}`;
  const b = composeBriefing(season, { first: false });
  storiesOf(b).forEach((s, i) => {
    n++;
    lines.push(`| \`${s.key}.webp\` | ${season} | ${i === 0 ? 'Aufmacher' : 'Nebenthema'} | ${s.title} (${topicMeta(s.topic).label}) | ${s.text.replace(/\|/g, '/')} |`);
  });
}
lines.push('', `Zusammen ${n} Ereignis-Bilder.`);
writeFileSync('docs/bilder/briefing.md', lines.join('\n') + '\n');
console.log(`docs/bilder/briefing.md: ${n} Ereignisse`);
