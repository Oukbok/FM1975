// Sim-Bericht Vereinsauszeichnungen: `HONOURS=1 node scripts/sim.mjs 30`
// Je Saisonwertung: Zahl aktiver Stufen (Bronze/Silber/Gold) über alle Vereine der Spielerliga,
// am Ende je Auszeichnung: wie oft vergeben (neu/verlängert) und wie viele Vereine sie zuletzt halten.
import { HONOURS, TIER_NAME } from '../src/data/clubHonours';
import { honourState } from '../src/game/clubHonours';
import type { Game } from '../src/game/state';

const given: Record<string, [number, number, number]> = {};
const holdersBySeason: Record<string, number[]> = {};

export function honoursTrack(g: Game): void {
  const st = honourState(g);
  const last = st.log?.[st.log.length - 1];
  if (!last) return;
  const per: Record<string, number> = {};
  for (const act of Object.values(st.active)) for (const [id, a] of Object.entries(act ?? {})) {
    if (!a) continue;
    per[id] = (per[id] ?? 0) + 1;
    if (a.since === Number(last.s.slice(0, 4)) + 1) ((given[id] ??= [0, 0, 0])[a.tier]++);
  }
  for (const h of HONOURS) (holdersBySeason[h.id] ??= []).push(per[h.id] ?? 0);
  if (process.env.HONOURS === '2') for (const [cid, F] of Object.entries(st.facts).slice(0, 4)) console.log('  FACTS', cid, JSON.stringify(F[F.length - 1]));
  if (process.env.HONOURS === '3') console.log('  LOYAL', Object.values(st.facts).map((F) => F[F.length - 1]).filter((f) => f.s === last.s).map((f) => f.loyal).sort((a, b) => b - a).join(' '));
  const mine = Object.entries(st.active[g.managedClubId] ?? {}).map(([id, a]) => `${id}:${TIER_NAME[a!.tier][0]}`).join(' ');
  console.log(`HONOURS ${last.s}  Bronze ${last.n[0]}  Silber ${last.n[1]}  Gold ${last.n[2]}  · eigener Verein: ${mine || '–'}`);
}

export function honoursSummary(): void {
  console.log('\nAuszeichnung            neu B/S/G      Halter je Saison (Ø / max)');
  for (const h of HONOURS) {
    const gv = given[h.id] ?? [0, 0, 0];
    const hs = holdersBySeason[h.id] ?? [0];
    const avg = hs.reduce((a, b) => a + b, 0) / Math.max(1, hs.length);
    console.log(`${h.name.padEnd(24)} ${gv.join('/').padEnd(14)} ${avg.toFixed(1)} / ${Math.max(...hs)}`);
  }
}
