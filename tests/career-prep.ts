// Spielstand für Screenshots der Managerkarriere: Cheftrainer eingestellt (ein Vorgänger
// entlassen), Druck-Nachricht des Vorstands gegen den Trainer, dazu ein altes Jobangebot
// (muss beim Laden verfallen). Schreibt im Speicherformat.
//   node scripts/run-ts.mjs tests/career-prep.ts <ein.txt> <aus.txt>
import { readFileSync, writeFileSync } from 'node:fs';
import { compressToUTF16, decompressFromUTF16 } from 'lz-string';
import { migratePositions2 } from '../src/game/positions2Migration';
import { ensureCareer } from '../src/game/careerState';
import { askAboutCoach } from '../src/game/boardPressure';
import { headCoachNow, openCoachEntry } from '../src/game/headCoaches';
import { candidatesFor, hireStaff } from '../src/game/staffGame';
import { dismiss } from '../src/game/trainerTeam';
import { Game } from '../src/game/state';
import { makeMessage, pushMessage } from '../src/engine/messages';

const [inp, out] = process.argv.slice(2);
const raw = readFileSync(inp, 'utf8');
const data = JSON.parse(raw.startsWith('LZ1:') ? decompressFromUTF16(raw.slice(4))! : raw);
const g = data.game as Game;
migratePositions2(g);
ensureCareer(g);
const today = g.calendar.currentDate;
if (!headCoachNow(g)) {
  hireStaff(g, candidatesFor(g, 'cheftrainer')[0]);
  const e = openCoachEntry(g)!; e.from = `${Number(g.season.slice(0, 4)) - 2}-07-01`; e.recFrom = g.season;
  dismiss(g, headCoachNow(g)!.id);
  hireStaff(g, candidatesFor(g, 'cheftrainer')[1]);
  openCoachEntry(g)!.from = `${g.season.slice(0, 4)}-07-15`;
}
if (!process.env.NOPRESS) askAboutCoach(g, today, false);
// Altlast: Jobangebot aus einer früheren Version (verfällt beim Laden, sperrt „Weiter“ nicht).
const msg = makeMessage({ date: today, category: 'board', from: 'Präsident', subject: 'Altes Jobangebot (früher)', shortText: '–', bodyText: 'Angebot (Altstand)', actionRequired: true });
msg.choices = [{ id: 'ja', label: 'Annehmen' }, { id: 'nein', label: 'Ablehnen' }];
msg.eventRef = { type: 'career_offer', deadline: '2099-01-01', defaultChoice: 'nein', data: { offer: 'jo_alt' } };
pushMessage(g.messages, msg);
delete (g as any).simAutoManage;
// Andere Fenster der Kette (Gala, Ehrungen) stören die Screenshots nicht.
if ((g as any).goldenBall) delete (g as any).goldenBall.pending;
if ((g as any).seasonAwards) delete (g as any).seasonAwards.pending;
writeFileSync(out, 'LZ1:' + compressToUTF16(JSON.stringify(data)));
console.log('Cheftrainer:', headCoachNow(g)?.name, '→', out);
