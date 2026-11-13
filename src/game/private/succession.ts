// =============================================================================
// GENERATIONSWECHSEL (Wunsch Pascal #47): Ein volljähriges Kind übernimmt den
// Verein – du spielst ab dann mit ihm/ihr weiter. Ohne Kind ab RETIRE_FORCE_AGE:
// Nachfolger von außen (Assistent), mit dem eine neue Familienlinie beginnt.
// -----------------------------------------------------------------------------
// • alter Manager → Rolle 'alt' (lebt weiter, kann sterben), Partner → 'eltern'
// • Erbe → 'self', neue Generation; g.manager wird umgeschrieben (Name, Geburt,
//   Werdegang), Fähigkeiten aus der Führungsstärke, die Hälfte des Vermögens geht mit
// • Spielt das Kind noch: Karriereende als Spieler (archiveRetired)
// • Ansehen: Nachfolger startet etwas tiefer (Management-Studium hilft)
// Die Managerbilanz (Zentrale/Privat › Karriere) läuft als Familienbilanz weiter.
// =============================================================================
import type { Game } from '../state';
import { hashSeed } from '../state';
import { mulberry32 } from '../../engine/leagues';
import { makeMessage, pushMessage } from '../../engine/messages';
import { archiveRetired } from '../archive';
import { careerLog, ensureCareer } from '../careerState';
import { cpi, LAST_NAMES, RETIRE_FORCE_AGE } from '../../data/privateLife';
import { ageOf, ageOn, clamp, ensurePrivate, fullName, makePerson, privLog, type Person } from './privateState';
import { heirsOf } from './privateGame';

export function canHandOver(g: Game, heirId: string): boolean {
  const st = ensurePrivate(g);
  return heirsOf(g, st).some((k) => k.id === heirId);
}

/** Nachfolger von außen (nur, wenn kein Kind infrage kommt und das Alter erreicht ist). */
export function canHandOverExternal(g: Game): boolean {
  const st = ensurePrivate(g);
  return !heirsOf(g, st).length && ageOf(g, st.persons[st.selfId]) >= RETIRE_FORCE_AGE;
}

function endPlayerCareer(g: Game, k: Person, today: string): string {
  if (!k.playerId) return '';
  const p = g.players[k.playerId] ?? g.youthPlayers[k.playerId];
  if (!p) return '';
  for (const c of Object.values(g.clubs)) {
    c.playerIds = c.playerIds.filter((x) => x !== p.id);
    c.youthPlayerIds = c.youthPlayerIds.filter((x) => x !== p.id);
  }
  if (g.players[p.id]) { archiveRetired(g, p, today); delete g.players[p.id]; }
  delete g.youthPlayers[p.id];
  k.notes = [...(k.notes ?? []), `Spielerkarriere beendet ${today.slice(0, 4)}`];
  k.playerId = undefined;
  return ` ${k.first} beendet dafür die Spielerkarriere.`;
}

export function handOver(g: Game, heirId: string | 'extern'): string {
  const st = ensurePrivate(g);
  const today = g.calendar.currentDate;
  const old = st.persons[st.selfId];
  let heir: Person | undefined;
  if (heirId === 'extern') {
    if (!canHandOverExternal(g)) return 'Ein Nachfolger von außen kommt erst infrage, wenn kein Kind übernehmen kann.';
    const r = mulberry32(hashSeed(`ext|${old.id}|${today}`));
    const y = +today.slice(0, 4) - 34;
    heir = makePerson(st, r, { sex: r() < 0.8 ? 'm' : 'w', birth: `${y}-04-1${Math.floor(r() * 9)}`, last: LAST_NAMES[Math.floor(r() * LAST_NAMES.length)], gen: old.gen + 1, role: 'kind' });
    heir.fuehrung = 62; heir.path = 'manager'; heir.bond = 50;
  } else {
    if (!canHandOver(g, heirId)) return 'Dieses Kind kann (noch) nicht übernehmen.';
    heir = st.persons[heirId];
  }
  const extra = endPlayerCareer(g, heir, today);
  // Alte Generation.
  old.role = 'alt';
  if (old.managed) old.managed.to = today;
  if (st.partnerId) { st.persons[st.partnerId].role = 'eltern'; }
  // Neue Generation.
  heir.role = 'self';
  heir.managed = { from: today, club: g.managedClubId };
  st.selfId = heir.id;
  st.partnerId = undefined; st.married = undefined; st.rel = 0; st.wish = false; st.expecting = undefined;
  st.seeking = heir.sex === 'm' ? 'w' : 'm';
  st.gen = heir.gen;
  // Vermögen: die Hälfte geht an die neue Generation, das Haus bleibt bei den Eltern.
  st.money = Math.round(st.money / 2 + 10000 * cpi(+today.slice(0, 4))); st.savings = Math.round(st.savings / 2); st.stocks = Math.round(st.stocks / 2);
  st.home = 0; st.car = 1;
  const lead = heir.fuehrung ?? 40;
  st.skills = {
    taktik: Math.round(clamp(lead / 12 + (heir.path === 'manager' ? 3 : 0), 0, 20)),
    menschen: Math.round(clamp((heir.bond ?? 50) / 15, 0, 20)),
    medien: Math.round(clamp(lead / 20 + 1, 0, 20)),
    wirtschaft: Math.round(clamp(heir.path === 'manager' ? 5 : 1, 0, 20)),
  };
  st.xp = { taktik: 0, menschen: 0, medien: 0, wirtschaft: 0 };
  st.energy = 85; st.mood = 70; st.health = 92; st.net = Math.round(st.net * 0.5);
  st.told = {};
  // Ansehen.
  const c = ensureCareer(g);
  const before = c.rep;
  c.rep = clamp(c.rep * 0.75 + 12 + (heir.path === 'manager' ? 6 : 0) + (lead - 50) * 0.15, 20, 90);
  // Spielerprofil.
  const age = ageOn(heir.birth, today);
  g.manager = {
    ...g.manager,
    name: fullName(heir), firstName: heir.first, lastName: heir.last, birthYear: +heir.birth.slice(0, 4), birthDate: heir.birth,
    background: heir.path === 'manager' ? 'tactician' : extra ? 'ex_pro' : 'rookie', avatarSeed: heir.id,
  };
  (g.manager as any).sex = heir.sex;
  careerLog(g, `Generationswechsel: ${fullName(heir)} übernimmt von ${fullName(old)}.`);
  privLog(st, today, `${fullName(heir)} übernimmt den Verein (${age}).`);
  pushMessage(g.messages, makeMessage({
    date: today, category: 'board', from: 'Vereinsvorstand',
    subject: `${fullName(heir)} übernimmt`,
    shortText: `Generation ${heir.gen}: ${heir.first} folgt ${old.first}.`,
    bodyText: `Auf der Pressekonferenz sitzt ${old.first} ein letztes Mal vorne – daneben ${heirId === 'extern' ? 'sein Nachfolger' : (heir.sex === 'm' ? 'der Sohn' : 'die Tochter')}, ${age} Jahre alt.${extra}\n\nDer Vorstand gibt ${heir.first} sein Vertrauen, die Branche ist skeptisch: Ansehen ${Math.round(before)} → ${Math.round(c.rep)}. Du spielst ab jetzt mit ${heir.first} weiter – mit eigenem Privatleben, eigener Familie und der Hälfte des Familienvermögens.`,
  }));
  return `${heir.first} übernimmt den Verein.${extra}`;
}
