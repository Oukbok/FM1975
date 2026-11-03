// Spielstand für Screenshots der Trainerkarriere: zwei offene Jobangebote (eins sofort,
// eins zum Saisonende), etwas Karriere-Verlauf. Schreibt im Speicherformat.
//   node scripts/run-ts.mjs tests/career-prep.ts <ein.txt> <aus.txt>
import { readFileSync, writeFileSync } from 'node:fs';
import { compressToUTF16, decompressFromUTF16 } from 'lz-string';
import { migratePositions2 } from '../src/game/positions2Migration';
import { ensureCareer, careerLog } from '../src/game/careerState';
import { makeOffer, offerCandidates } from '../src/game/careerGame';
import { Game } from '../src/game/state';
import { makeMessage, pushMessage } from '../src/engine/messages';

const [inp, out] = process.argv.slice(2);
const raw = readFileSync(inp, 'utf8');
const data = JSON.parse(raw.startsWith('LZ1:') ? decompressFromUTF16(raw.slice(4))! : raw);
const g = data.game as Game;
migratePositions2(g);
const c = ensureCareer(g);
c.rep = 82;
careerLog(g, 'Erster Titel in Sicht: Herbstmeister');
const today = g.calendar.currentDate;
const cands = offerCandidates(g).sort((a, b) => b.level - a.level);
const same = cands.find((x) => g.clubs[x.id] && g.table.rows.some((r) => r.clubId === x.id));
const other = cands.find((x) => x.id !== same?.id);
for (const [id, when] of [[same?.id, 'sofort'], [other?.id, 'saisonende']] as const) {
  if (!id) continue;
  const o = makeOffer(g, id, when, when === 'sofort' ? 'Der Verein hat sich heute von seinem Trainer getrennt.' : 'Deine Arbeit hat sich herumgesprochen.', today);
  c.offers.push(o); c.offerCount++;
  const msg = makeMessage({ date: today, category: 'board', from: 'Präsident', subject: `${o.clubName} will dich als Trainer`, shortText: o.goal, bodyText: 'Angebot (Screenshot)', actionRequired: true });
  msg.choices = [{ id: 'ja', label: 'Annehmen' }, { id: 'mehr', label: 'Nachverhandeln' }, { id: 'nein', label: 'Ablehnen' }];
  msg.eventRef = { type: 'career_offer', deadline: o.deadline, defaultChoice: 'nein', data: { offer: o.id } };
  pushMessage(g.messages, msg);
}
delete (g as any).simAutoManage;
writeFileSync(out, 'LZ1:' + compressToUTF16(JSON.stringify(data)));
console.log('Angebote:', c.offers.map((o) => `${o.clubName} (${o.when})`).join(', '), '→', out);
