// Spielstand für Stadion-Screenshots vorbereiten: jede Seite in einer anderen Bauweise, Sommer.
//   node scripts/run-ts.mjs tests/stadium-prep.ts <ein.txt> <aus.txt> [modern|mix]
import { readFileSync, writeFileSync } from 'fs';
import { compressToUTF16, decompressFromUTF16 } from 'lz-string';
import { BLOCK_SIDE } from '../src/engine/stadiumBlocks';
import { rebuildBlocks } from '../src/engine/stadiumStandard';
const [inp, out, mode = 'mix'] = process.argv.slice(2);
const slot = JSON.parse(decompressFromUTF16(readFileSync(inp, 'utf8').slice(4)));
const g = slot.game;
const st = g.clubs[g.managedClubId].stadium;
if (mode === 'modern') {
  st.blocks = rebuildBlocks({ capacity: 62000, standing: 1, roof: 'full', lounges: 20, vip: true }, 2034);
  st.built = 2034;
} else {
  const look: Record<string, number> = { main: 2030, opposite: 2008, north: 1992, south: 1970, curve: 1970 };
  for (const b of st.blocks) {
    const side = BLOCK_SIDE[b.id as keyof typeof BLOCK_SIDE];
    b.look = look[side];
    if (side !== 'curve') b.roof = side === 'south' ? 'partial' : 'full';
    if (side === 'main' || side === 'opposite') b.tiers = [{ seat: 'schale', rows: 22 }, { seat: 'schale', rows: 16 }];
  }
  st.built = 1970;
}
// CURVE=small: hohe Geraden, flache Kurven (Verdeckung der Kurve durch die Nachbartribüne prüfen)
if (process.env.CURVE === 'small') for (const b of st.blocks) b.tiers = /^(main|opp|north|south)/.test(b.id) ? [{ seat: 'schale', rows: 34 }, { seat: 'schale', rows: 28 }] : [{ seat: 'steh', rows: 10 }];
// LAND=n: zugekaufte Grundstücke (sichtbar am Stadion- und Vereinsgelände)
if (process.env.LAND && g.clubs[g.managedClubId].grounds) { const gr = g.clubs[g.managedClubId].grounds; gr.landBought = Number(process.env.LAND); gr.area += 2 * gr.landBought; }
st.capacity = st.blocks.reduce((s: number) => s, st.capacity);
g.calendar.currentDate = g.calendar.currentDate.slice(0, 4) + '-08-' + g.calendar.currentDate.slice(8);
writeFileSync(out, 'LZ1:' + compressToUTF16(JSON.stringify(slot)));
console.log('ok', mode, st.blocks.length);
