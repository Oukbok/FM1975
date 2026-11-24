// =============================================================================
// EINSCHÄTZUNG DES TRAINERTEAMS (Wunsch Pascal: keine genaue Messung mehr, die
// die beste Taktik verrät – der Spieler soll ausprobieren, bekommt aber Hinweise,
// die sich ergänzen und von den Spielertypen abhängen). Grundlage ist dasselbe
// Profil wie in der Match-Engine (engine/match/tacticFit.ts): Passspiel, Laufstärke,
// Tempo der Abwehr, Dribbling, Flanken, Lufthoheit der Startelf – verglichen mit
// den gewählten Anweisungen. Nur Worte, nie Zahlen; je Bereich höchstens ein
// Hinweis. Ein schwaches Trainerteam sieht weniger und ist unsicherer.
// Anzeige: components/tactics/TacticHints.tsx.
// =============================================================================
import type { Club, Player, Tactics } from '../types';
import { resolveLineup } from '../engine/match/team';
import { teamFit, type TeamFit } from '../engine/match/tacticFit';
import { effectiveTactics } from '../engine/tacticEra';

export type HintTone = 'good' | 'warn' | 'idea' | 'opp';
export type HintArea = 'aufbau' | 'pressing' | 'linie' | 'dribbling' | 'fluegel' | 'gegner';
export interface TacticHint { area: HintArea; tone: HintTone; text: string; /** Spieler, an denen es hängt (IDs für PlayerLink). */ who?: string[] }
export interface TacticHints { hints: TacticHint[]; /** Profil in Worten (Stärken/Schwächen der Elf). */ traits: { label: string; word: string; tone: 'hi' | 'lo' | 'mid' }[]; sure: boolean }

export const AREA_LABEL: Record<HintArea, string> = {
  aufbau: 'Aufbau', pressing: 'Pressing', linie: 'Abwehrlinie', dribbling: 'Eins gegen eins', fluegel: 'Flügel', gegner: 'Nächster Gegner',
};

const n = (v: number | undefined) => ((v ?? 50) - 50) / 50;
const HI = 0.3, LO = -0.3;

function xiOf(club: Club, players: Record<string, Player>, year: number): { p: Player; pos: string }[] {
  try { return resolveLineup(club, players, !!club.isPlayerControlled, 0, { year }).xi; } catch { return []; }
}

const word = (q: number, hi: string, lo: string, mid: string): { word: string; tone: 'hi' | 'lo' | 'mid' } =>
  q >= HI ? { word: hi, tone: 'hi' } : q <= LO ? { word: lo, tone: 'lo' } : { word: mid, tone: 'mid' };

/** Profil der Elf in Worten (für die Kopfzeile der Box). */
function traitsOf(f: TeamFit): TacticHints['traits'] {
  return [
    { label: 'Passspiel', ...word(f.pass, 'stark', 'wackelig', 'solide') },
    { label: 'Laufstärke', ...word(f.engine, 'hoch', 'gering', 'normal') },
    { label: 'Abwehrtempo', ...word(f.pace, 'schnell', 'langsam', 'normal') },
    { label: 'Dribbling', ...word(f.dribble, 'stark', 'schwach', 'solide') },
    { label: 'Flanken', ...word(f.cross, 'stark', 'schwach', 'solide') },
    { label: 'Lufthoheit', ...word(f.aerial, 'stark', 'schwach', 'normal') },
  ];
}

/** Die Besten bzw. Schwächsten einer Eigenschaft in der Elf (IDs, für „vor allem …“). */
function namesBy(xi: { p: Player; pos: string }[], val: (p: Player) => number, best: boolean, filter?: (pos: string) => boolean): string[] {
  return xi.filter((x) => x.pos !== 'TW' && (!filter || filter(x.pos)))
    .sort((a, b) => (best ? val(b.p) - val(a.p) : val(a.p) - val(b.p)))
    .slice(0, 2).map((x) => x.p.id);
}

/**
 * Hinweise für die eigene Taktik. `level` = Niveau des Trainerteams (1–99): unter 55 höchstens zwei
 * Hinweise und vorsichtige Worte, ab 70 bis zu fünf.
 */
export function tacticHints(club: Club, players: Record<string, Player>, year: number, opp: Club | null, level: number): TacticHints {
  const t = (effectiveTactics(club.tactics, year) ?? club.tactics) as Tactics;
  const xi = xiOf(club, players, year);
  const f = teamFit(xi);
  const sure = level >= 55;
  // Unsicheres Trainerteam: Satz bleibt unverändert, davor „Wir vermuten:“ (kein „Vielleicht“ vor dem Hauptsatz – falsche Wortstellung).
  const say = (s: string) => (sure ? s : `Wir vermuten: ${s}`);
  const out: TacticHint[] = [];
  const add = (area: HintArea, tone: HintTone, text: string, who?: string[]) => {
    if (!out.some((h) => h.area === area)) out.push({ area, tone, text: say(text), who });
  };
  const tempo = n(t.tempo), press = n(t.pressing), line = n(t.defensiveLine), width = n(t.widthFocus);
  const long = t.buildup === 'long';
  const risky = long || tempo > 0.2;
  const passers = () => namesBy(xi, (p) => p.attributes.passing + p.attributes.vision, f.pass > 0);
  const DEF = (pos: string) => /^(LIB|IV|RV|LV)$/.test(pos);
  const WIDE = (pos: string) => /^(RV|LV|RM|LM|RA|LA)$/.test(pos);
  const FRONT = (pos: string) => /^(MS|HS|OM|RA|LA)$/.test(pos);

  // Warnungen zuerst: was gerade gegen die eigenen Leute arbeitet.
  if (risky && f.pass <= LO) add('aufbau', 'warn', 'Im schnellen, riskanten Aufbau gehen viele Bälle verloren – unsere Passspieler sind dafür nicht sicher genug.', passers());
  if (press > 0.2 && f.engine <= LO) add('pressing', 'warn', 'Das Pressing ist auf Dauer zu viel für diese Elf – nach der Pause dürften die Kräfte schwinden.', namesBy(xi, (p) => p.attributes.stamina, false));
  if (line > 0.2 && f.pace <= LO) add('linie', 'warn', 'Hinter der hohen Linie lauert Gefahr – unsere Verteidiger sind in Laufduellen zu langsam.', namesBy(xi, (p) => p.attributes.speed, false, DEF));
  if (width > 0.2 && f.cross <= LO) add('fluegel', 'warn', 'Über außen kommt wenig Verwertbares – unsere Außen schlagen keine guten Flanken.', namesBy(xi, (p) => p.attributes.crossing, false, WIDE));
  if (t.crossStyle === 'high' && width > -0.2 && f.aerial <= LO) add('fluegel', 'warn', 'Hohe Flanken, aber vorne fehlt die Lufthoheit – flach in den Rückraum fänden die Bälle eher Abnehmer.', namesBy(xi, (p) => p.attributes.heading, false, FRONT));
  if (long && f.aerial <= LO) add('aufbau', 'warn', 'Die langen Bälle finden vorne kaum einen, der sie festmacht.', namesBy(xi, (p) => p.attributes.heading, false, FRONT));

  // Ungenutzte Stärken: Ideen zum Ausprobieren.
  if (!risky && f.pass >= HI) add('aufbau', 'idea', 'Unsere Passspieler könnten mehr Risiko vertragen – ein höheres Tempo würde ihre Stärke nutzen. Sicher spielen geht auch, holt aber weniger heraus.', passers());
  if (press < 0.2 && f.engine >= HI) add('pressing', 'idea', 'Die Mannschaft hat die Luft für mehr Druck auf den Gegner.', namesBy(xi, (p) => p.attributes.stamina + p.attributes.workRate, true));
  if (line < 0.2 && f.pace >= HI + 0.1) add('linie', 'idea', 'Unsere schnellen Verteidiger könnten auch weiter vorne stehen und den Raum eng machen.', namesBy(xi, (p) => p.attributes.speed, true, DEF));
  if (tempo <= 0.2 && t.style !== 'attacking' && f.dribble >= HI) add('dribbling', 'idea', 'Unsere Dribbler würden bei mehr Tempo und Mut öfter durchkommen.', namesBy(xi, (p) => p.attributes.dribbling, true, (pos) => !DEF(pos)));
  if (width < -0.2 && f.cross >= HI) add('fluegel', 'idea', 'Mit dem Spiel durch die Mitte bleiben unsere Flankengeber ungenutzt.', namesBy(xi, (p) => p.attributes.crossing, true, WIDE));
  if (t.crossStyle === 'low' && width > -0.2 && f.aerial >= HI) add('fluegel', 'idea', 'Vorne stehen kopfballstarke Leute – hohe Flanken könnten sich lohnen.', namesBy(xi, (p) => p.attributes.heading, true, FRONT));

  // Gegner (nur Hinweise, die zur eigenen Elf passen)
  if (opp) {
    const ot = (effectiveTactics(opp.tactics, year) ?? opp.tactics) as Tactics;
    const of = teamFit(xiOf(opp, players, year));
    if (n(ot.defensiveLine) > 0.2 && of.pace <= LO + 0.1) add('gegner', 'opp', 'Der nächste Gegner verteidigt hoch, hinten aber eher langsam – Steilpässe in die Tiefe könnten wehtun.');
    else if (of.pass <= LO + 0.1) add('gegner', 'opp', 'Der nächste Gegner tut sich im Aufbau schwer – früher Druck könnte Ballgewinne bringen.');
    else if (of.engine <= LO + 0.1) add('gegner', 'opp', 'Der nächste Gegner wirkt nicht sehr laufstark – Tempo könnte ihn zum Ende hin müde machen.');
    else if (of.aerial >= HI && n(ot.widthFocus) > 0.2) add('gegner', 'opp', 'Der nächste Gegner sucht über außen seine kopfballstarken Leute – auf Flanken achten.');
    else if (of.pass >= HI && n(ot.tempo) > 0.2) add('gegner', 'opp', 'Der nächste Gegner kombiniert schnell und sicher – tief und kompakt stehen nimmt ihm den Raum.');
  }

  // Bestätigungen: was schon gut zusammenpasst.
  if (long && f.aerial >= HI && f.pass > LO) add('aufbau', 'good', 'Die langen Bälle passen – vorne steht jemand, der sie festmacht.', namesBy(xi, (p) => p.attributes.heading, true, FRONT));
  if (tempo > 0.2 && f.pass >= HI) add('aufbau', 'good', 'Das zügige Spiel passt zu unseren Passgebern.', passers());
  if (long && f.pass >= HI && f.aerial < HI) add('aufbau', 'idea', 'Unsere Passgeber würden auch flach und schnell nach vorn spielen können – der lange Ball nutzt sie kaum.', passers());
  if (!risky && f.pass <= LO) add('aufbau', 'good', 'Das ruhige Kurzpassspiel schützt uns vor Ballverlusten.');
  if (press > 0.2 && f.engine >= HI) add('pressing', 'good', 'Das Pressing passt – die Mannschaft hat die Energie dafür.');
  if (line > 0.2 && f.pace >= HI) add('linie', 'good', 'Die hohe Linie halten unsere schnellen Verteidiger gut.');
  if (line < -0.2 && f.pace <= LO) add('linie', 'good', 'Tief zu stehen schützt unsere eher langsame Abwehr.');
  if ((tempo > 0.2 || t.style === 'attacking') && f.dribble >= HI) add('dribbling', 'good', 'Das Tempo liegt unseren Dribblern.');
  if (width > 0.2 && f.cross >= HI) add('fluegel', 'good', 'Das Flügelspiel passt zu unseren Flankengebern.');
  if (!out.length) add('aufbau', 'good', 'Die Einstellungen passen ordentlich zur Elf – auffällige Stärken oder Schwächen sehen wir nicht. Ausprobieren lohnt trotzdem.');

  const max = level >= 70 ? 5 : level >= 55 ? 4 : 2;
  return { hints: out.slice(0, max), traits: traitsOf(f), sure };
}
