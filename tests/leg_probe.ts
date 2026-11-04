import { createNewGame } from '../src/game/newGame';
import { LEGENDS } from '../src/data/legends';
const g = createNewGame({ managedClubId: 'mgl', manager: { name: 'T', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any, difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300 });
const d = g.legends2!.done;
for (const l of LEGENDS) { const id = d[l.id]; if (!id) continue; const p = g.players[id] ?? g.youthPlayers[id]; console.log(l.id.padEnd(15), id === '-' ? 'entfallen' : `${p.fullName} ${p.age}J ${p.naturalPosition} OVR ${p.overall} pot ${p.development.potentialAbility} ${p.isYouth ? 'Jugend' : 'Profi'} @${p.clubId} ${g.clubs[p.clubId]?.name}`); }
console.log('wartend', LEGENDS.filter((l) => !d[l.id]).length);
