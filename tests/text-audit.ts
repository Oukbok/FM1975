// =============================================================================
// Text-Audit (Wunsch Pascal): sehr viele Texte aus allen Epochen erzeugen und
// automatisch prüfen – Tickerzeilen, Presseausgaben, Nachrichten, Briefings.
//   npm run test:texts                Standardlauf (≈ 3–4 Min.)
//   QUICK=1 npm run test:texts        kurz (weniger Spiele, kürzere Laufzeit der Spielstände)
//   GAMES=40 DAYS=120 SAVES=a,b       Spiele je Epoche, Tage je Spielstand, eigene Spielstände
//   JSON=datei                        Zahlen als JSON ablegen (Vergleich vorher/nachher)
//   LOOSE=1                           nur berichten (sonst: harte Fehler – Platzhalter, Mehrzahl, Epoche … – → Exit 1)
//   CAT=Epoche  TOP=40  DUMP_TEXTS=datei   alle Beispiele einer Art / längere Wiederholungslisten / alle Texte als TSV
// Prüfregeln und Bericht: tests/textAuditChecks.ts. Bericht: docs/research/text-audit.md.
// =============================================================================
import { readFileSync, writeFileSync } from 'node:fs';
import { decompressFromUTF16 } from 'lz-string';
import { createNewGame } from '../src/game/newGame';
import { prepareLoadedGame } from '../src/game/loadMigrations';
import { processDay, HEADLESS_UI } from '../src/game/day';
import { startNextSeason, leagueClubs } from '../src/game/season';
import { CalendarEngine } from '../src/engine/calendar';
import { setEraYear } from '../src/engine/positions';
import { MatchSim } from '../src/engine/match/sim';
import { Narrator } from '../src/data/ticker/narrator';
import { Speaker } from '../src/data/ticker/grammar';
import { buildEdition } from '../src/game/press/edition';
import { issueDates } from '../src/game/press/calendar';
import { composeBriefing } from '../src/game/seasonBriefing';
import { eraTipsFor } from '../src/data/briefings/eraTips';
import { sameRegion } from '../src/engine/environment';
import { cityGeo, distanceKm, isGermanCity } from '../src/data/prematch/cityGeo';
import { playerLevel, type Game } from '../src/game/state';
import type { Club } from '../src/types';
import { ORIGINS } from '../src/data/origins';
import { addNames, checkSample, makeChecker, newRep, report, repUnit, setClubs, type Ctx, type RepStat, type Sample, type Src } from './textAuditChecks';

let seed = 1975;
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

const QUICK = !!process.env.QUICK;
const GAMES = Number(process.env.GAMES ?? (QUICK ? 8 : 30));
const DAYS = Number(process.env.DAYS ?? (QUICK ? 40 : 130));
const YEARS = [1975, 1985, 1995, 2005, 2015, 2025];
const SAVES = (process.env.SAVES ?? (QUICK
  ? 'test-3-jahre,test-20-jahre,test-50-jahre'
  : 'test-3-jahre,test-10-jahre,test-20-jahre,test-30-jahre,test-40-jahre,test-50-jahre,liga2-1977,regionalliga-1995,liga3-2010,england-1992,italien-1985,ddr-1980'))
  .split(',').filter(Boolean);
/** Diese Spielstände laufen über den Saisonwechsel (Saisonstart-Nachrichten, Vorschau, Briefing). */
const FULL = new Set((process.env.FULL ?? (QUICK ? '' : 'test-3-jahre,test-20-jahre,test-40-jahre')).split(',').filter(Boolean));

const ch = makeChecker();
const reps: Record<string, RepStat> = { ticker: newRep(), 'presse (Ausgabe)': newRep(), 'presse (Schlagzeilen je Saison)': newRep(), 'nachrichten (je Spielstand)': newRep() };
const totals: Record<string, number> = { ticker: 0, press: 0, msg: 0, brief: 0 };
const t0 = Date.now();
const log = (s: string) => console.log(`[${((Date.now() - t0) / 1000).toFixed(0)} s] ${s}`);

// Leere Slots in der Grammatik (Ticker + Presse): {slot} ohne Wert.
const emptySlots: { rule: string; slot: string; year: number }[] = [];
const origExpand = Speaker.prototype.expand;
Speaker.prototype.expand = function (text: string, ctx, depth = 0) {
  for (const m of text.matchAll(/\{([a-zA-Z0-9_]+)\}/g)) {
    const v = ctx.slots[m[1]];
    if (v == null || v === '') emptySlots.push({ rule: text.slice(0, 120), slot: m[1], year: ctx.year });
  }
  return origExpand.call(this, text, ctx, depth);
};

const dumped: string[] = [];
function check(src: Src, unit: string, field: string, text: string | undefined, ctx: Ctx) {
  if (!text) return;
  totals[src]++;
  if (process.env.DUMP_TEXTS) dumped.push(`${src}\t${ctx.year}\t${unit}\t${field}\t${text.replace(/\n/g, ' ⏎ ')}`);
  checkSample(ch, { src, unit, field, text, ctx } as Sample);
}

function gameCtx(g: Game, date: string): Ctx {
  return { year: Number(date.slice(0, 4)), points3: g.pointSystem === '3-point', home: g.homeCountry ?? (g.ddrHome ? 'gdr' : 'ger'), tier: playerLevel(g) };
}

function namesOf(g: Game) {
  const ns: string[] = [];
  for (const p of Object.values(g.players)) ns.push(p.firstName, p.lastName);
  for (const p of Object.values(g.youthPlayers ?? {})) ns.push(p.firstName, p.lastName);
  const clubs = [...Object.values(g.clubs), ...Object.values(g.simClubs ?? {}), ...Object.values(g.euroClubs ?? {})] as Club[];
  for (const c of clubs) { ns.push(c.name); if (c.coach?.name) ns.push(c.coach.name); }
  if (g.manager?.name) ns.push(g.manager.name);
  // Mitarbeiter/Trainer (Arbeitsmarkt) – alle Felder „name“ im Stab
  const walk = (o: unknown, d: number) => {
    if (!o || typeof o !== 'object' || d > 4) return;
    for (const [k, v] of Object.entries(o)) {
      if (k === 'name' && typeof v === 'string') ns.push(v); else if (typeof v === 'object') walk(v, d + 1);
    }
  };
  walk(g.staffWorld, 0); walk(g.hiredStaff, 0); walk(g.coachPool, 0);
  // alle Namen der Namenspools (Weltspieler tauchen in Texten auf, ohne in g.players zu stehen)
  for (const o of Object.values(ORIGINS)) { ns.push(...o.first, ...o.last); for (const e of o.firstByEra ?? []) ns.push(...(e[1] as string[])); }
  addNames(ch, ns);
  setClubs(ch, clubs);
}

function load(name: string): Game {
  const txt = readFileSync(`public/saves/${name}.txt`, 'utf8');
  return (JSON.parse(txt.startsWith('LZ1:') ? decompressFromUTF16(txt.slice(4))! : txt) as { game: Game }).game;
}

// ------------------------------------------------------------------ 1) Ticker
{
  const g = createNewGame({ managedClubId: 'mgl', manager: { name: 'S', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any, difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300 });
  namesOf(g);
  const clubs = leagueClubs(g);
  const sameCity = clubs.filter((a) => clubs.some((b) => b !== a && b.city === a.city));
  const shouts = ['druck', 'ruhe', 'kompakt', 'fluegel', 'konzentration', 'zweikampf'] as const;
  const talks = ['loben', 'analyse', 'predigt'] as const;
  for (const year of YEARS) {
    setEraYear(year);
    const ctx: Ctx = { year, points3: year >= 1995, home: 'ger', tier: 1 };
    for (let i = 0; i < GAMES; i++) {
      const s = year * 100 + i;
      let home = clubs[s % clubs.length], away = clubs[(s * 7 + 3) % clubs.length];
      if (home === away) away = clubs[(s + 1) % clubs.length];
      if (i % 10 === 9 && sameCity.length >= 2) { home = sameCity[0]; away = sameCity.find((c) => c !== home && c.city === home.city)!; }
      const human = i % 2 === 0;
      const sim = new MatchSim(home, away, g.players, { year, seed: s, knockout: i % 5 === 4, live: true, humanSides: human ? ['home'] : [], humanClubIds: human ? [home.id] : [], date: `${year}-${i % 2 ? '11' : '08'}-1${i % 9}` });
      const nar = new Narrator(sim, { mySide: human ? 'home' : null, suspense: i % 3 === 0 });
      const lines: string[] = [];
      while (!sim.finished) {
        const evs = sim.step();
        if (human && sim.minute % 23 === 0 && evs.some((e) => e.kind === 'flow')) sim.shout('home', shouts[(sim.minute + i) % shouts.length]);
        if (human && evs.some((e) => e.kind === 'halftime')) sim.teamTalk('home', talks[i % 3]);
        for (const l of nar.narrate(evs)) {
          if (l.suspense) continue;
          lines.push(l.text);
          check('ticker', `${year}#${i}`, 'line', l.text, ctx);
        }
      }
      repUnit(ch, reps.ticker, lines);
    }
    log(`Ticker ${year}: ${GAMES} Spiele`);
  }
}

// ------------------------------------------------------------ 2) Briefings
for (let y = 1975; y <= 2030; y++) {
  const season = `${y}/${String((y + 1) % 100).padStart(2, '0')}`;
  const ctx: Ctx = { year: y, points3: y >= 1995, home: 'ger', tier: 1 };
  for (const first of y === 1975 ? [true, false] : [false]) {
    const b = composeBriefing(season, { first });
    const walk = (o: unknown, path: string) => {
      if (typeof o === 'string') { if (o.length > 3 && /\s/.test(o)) check('brief', season, path, o, ctx); return; }
      if (Array.isArray(o)) { o.forEach((x) => walk(x, path)); return; }
      if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) if (!['icon', 'kind', 'topic', 'key', 'img', 'image'].includes(k)) walk(v, k);
    };
    walk(b, '');
    walk(eraTipsFor(y), 'tip');
  }
}
log('Briefings 1975–2030');

// ------------------------------------------- 3) Spielstände: Nachrichten + Presse
const derbyFar = new Map<string, number>();
const germanCities = new Set<string>();
/** Derby-Regionen (engine/environment.ts): alle Paare deutscher Vereinsstädte derselben Region, die weit auseinander liegen. */
function noteRivals(g: Game) {
  for (const c of [...Object.values(g.clubs), ...Object.values(g.simClubs ?? {})] as Club[]) if (c.city && isGermanCity(c.city)) germanCities.add(c.city);
}
function derbyCheck() {
  const cs = [...germanCities];
  for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++) {
    if (!sameRegion(cs[i], cs[j])) continue;
    const a = cityGeo(cs[i]), b = cityGeo(cs[j]);
    if (!a || !b) continue;
    const km = Math.round(distanceKm(a.geo, b.geo));
    if (km > 160) derbyFar.set(`${cs[i]} – ${cs[j]}`, km);
  }
}

for (const name of SAVES) {
  let g: Game;
  try { g = load(name); } catch { console.log(`(Spielstand ${name} fehlt)`); continue; }
  prepareLoadedGame(g);
  namesOf(g);
  noteRivals(g);
  const seen = new Set(g.messages.map((m) => m.id));
  const subjects: string[] = [];
  const checkMsgs = () => {
    for (const m of g.messages) {
      if (seen.has(m.id)) continue;
      seen.add(m.id);
      const ctx = gameCtx(g, m.date);
      check('msg', name, 'subject', m.subject, ctx);
      check('msg', name, 'short', m.shortText, ctx);
      check('msg', name, 'body', m.bodyText, ctx);
      for (const c of m.choices ?? []) { check('msg', name, 'choice', c.label, ctx); check('msg', name, 'choice', (c as { hint?: string }).hint, ctx); }
      subjects.push(m.subject);
    }
  };
  const editions = (since: string) => {
    const dates = issueDates(g.calendar.currentDate, since, 999);
    const heads: string[] = [];
    for (const d of dates) {
      const e = buildEdition(g, d);
      const ctx = gameCtx(g, d);
      const sentences: string[] = [];
      for (const s of [...(e.lead ? [e.lead] : []), ...e.stories, ...e.briefs]) {
        check('press', `${name}@${d}`, 'headline', s.headline, ctx);
        check('press', `${name}@${d}`, 'rubric', s.rubric, ctx);
        check('press', `${name}@${d}`, 'dek', s.dek, ctx);
        for (const b of s.body) { check('press', `${name}@${d}`, 'body', b, ctx); sentences.push(...b.split(/(?<=[.!?])\s+/)); }
        heads.push(s.headline);
      }
      repUnit(ch, reps['presse (Ausgabe)'], sentences);
    }
    repUnit(ch, reps['presse (Schlagzeilen je Saison)'], heads);
    return dates.length;
  };
  const start = g.calendar.currentDate;
  const sinceOld = `${g.season.slice(0, 4)}-07-01`;
  const clearXI = () => { const t = g.clubs[g.managedClubId]?.tactics; if (t?.startingXI?.length) { t.startingXI = []; t.lineupMap = undefined; } };
  if (FULL.has(name)) {
    let guard = 0;
    while (!CalendarEngine.isSeasonOver(g.calendar) && guard++ < 400) { clearXI(); processDay(g, HEADLESS_UI); checkMsgs(); }
    const ne = editions(sinceOld);
    startNextSeason(g); checkMsgs();
    for (let d = 0; d < 75; d++) { clearXI(); processDay(g, HEADLESS_UI); checkMsgs(); }
    const ne2 = editions(`${g.season.slice(0, 4)}-07-01`);
    log(`${name}: ${start} → ${g.calendar.currentDate} (Saisonwechsel), ${ne + ne2} Ausgaben`);
  } else {
    for (let d = 0; d < DAYS && !CalendarEngine.isSeasonOver(g.calendar); d++) { clearXI(); processDay(g, HEADLESS_UI); checkMsgs(); }
    const ne = editions(sinceOld);
    log(`${name}: ${start} → ${g.calendar.currentDate}, ${ne} Ausgaben`);
  }
  repUnit(ch, reps['nachrichten (je Spielstand)'], subjects);
}

derbyCheck();
// Leere Slots als Befund
for (const e of emptySlots) ch.findings.push({ cat: 'leerer Slot', src: 'ticker', year: e.year, text: e.rule, hit: `{${e.slot}}` });
for (const [pair, km] of derbyFar) ch.findings.push({ cat: 'Inhalt', src: 'msg', year: 0, text: `${pair}: ${km} km`, hit: pair });

const { out, hard } = report(ch, reps, totals);
console.log(`\nHarte Fehler: ${hard}   Laufzeit ${((Date.now() - t0) / 1000).toFixed(0)} s`);
if (process.env.DUMP_TEXTS) writeFileSync(process.env.DUMP_TEXTS, dumped.join('\n'));
if (process.env.JSON) writeFileSync(process.env.JSON, JSON.stringify({ ...out, hard, at: new Date().toISOString() }, null, 1));
if (!process.env.LOOSE && hard > 0) process.exit(1);
