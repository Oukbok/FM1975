// =============================================================================
// Presse: Artikel aus der Liga – Spielberichte, Spieltag, Tabelle, Rekorde,
// Vorschau, Torjäger. Alles aus g.fixtures rekonstruiert (auch für ältere
// Ausgaben: Tabelle und Torjäger zum Stichtag).
// =============================================================================
import { POSTPONE_TEXT, type PostponeReason } from '../../data/matchCalendarRules';
import type { Match } from '../../types';
import type { PressCtx } from './context';
import { plural, scoreOf, story, winnerOf } from './context';
import type { PressResult, PressStory, PressTableRow } from './types';
import { weekdayOf } from './calendar';

const GOAL = new Set(['goal', 'penalty_goal']);

export const resultOf = (m: Match): PressResult => ({ matchId: m.id, home: m.homeClubId, away: m.awayClubId, hg: m.result!.homeGoals, ag: m.result!.awayGoals });

/** Tabelle aus allen Ligaspielen vor `before`. */
export function tableAt(c: PressCtx, before: string): PressTableRow[] {
  const win = c.g.pointSystem === '3-point' ? 3 : 2;
  const rows = new Map<string, PressTableRow & { gf: number }>();
  const row = (id: string) => { let r = rows.get(id); if (!r) rows.set(id, r = { clubId: id, pos: 0, pts: 0, gd: 0, played: 0, gf: 0 }); return r; };
  for (const m of c.g.fixtures) {
    row(m.homeClubId); row(m.awayClubId);
    if (m.status !== 'finished' || !m.result || m.date >= before) continue;
    const h = row(m.homeClubId), a = row(m.awayClubId), r = m.result;
    h.played++; a.played++;
    h.gf += r.homeGoals; a.gf += r.awayGoals;
    h.gd += r.homeGoals - r.awayGoals; a.gd += r.awayGoals - r.homeGoals;
    if (r.homeGoals > r.awayGoals) h.pts += win; else if (r.homeGoals < r.awayGoals) a.pts += win; else { h.pts++; a.pts++; }
  }
  const list = [...rows.values()].sort((x, y) => y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || x.clubId.localeCompare(y.clubId));
  list.forEach((r, i) => (r.pos = i + 1));
  return list.map(({ gf: _gf, ...r }) => r);
}

/** Tore je Spieler aus den Spielereignissen vor `before`. */
export function goalsBefore(c: PressCtx, before: string): Map<string, number> {
  const out = new Map<string, number>();
  for (const m of c.g.fixtures) {
    if (m.status !== 'finished' || m.date >= before) continue;
    for (const e of m.events) if (GOAL.has(e.type) && e.playerId) out.set(e.playerId, (out.get(e.playerId) ?? 0) + 1);
  }
  return out;
}

/** Torschützen eines Spiels als Text „Müller (12.), Kraus (77., FE)“. */
function goalText(c: PressCtx, m: Match): string {
  const parts: string[] = [];
  for (const e of m.events) {
    if (!GOAL.has(e.type) && e.type !== 'own_goal') continue;
    const p = c.player(e.playerId);
    const nm = p?.lastName ?? 'unbekannt';
    parts.push(e.type === 'own_goal' ? `${nm} (${e.minute}., Eigentor)` : `${nm} (${e.minute}.${e.type === 'penalty_goal' ? ', FE' : ''})`);
  }
  return parts.join(', ');
}

/** Torschützen je Spieler (nur Tore für den angegebenen Verein). */
function scorersOf(m: Match, clubId: string): Map<string, number[]> {
  const out = new Map<string, number[]>();
  for (const e of m.events) if (GOAL.has(e.type) && e.playerId && e.clubId === clubId) out.set(e.playerId, [...(out.get(e.playerId) ?? []), e.minute]);
  return out;
}

/** Spieltag-Schlagzeile ohne doppelte Doppelpunkte/Striche. */
function spieltagHeadline(c: PressCtx, md: number, top: string): string {
  return /[:–]/.test(top) ? `${md}. Spieltag · ${top}` : c.say('hl_spieltag', { md, top });
}

interface Rated { m: Match; score: number; flags: string[]; hero?: string }

/** Wie berichtenswert ist ein Spiel? */
function rate(c: PressCtx, m: Match, posBefore: Map<string, number>): Rated {
  const r = m.result!;
  const flags: string[] = [];
  let score = Math.abs(r.homeGoals - r.awayGoals) * 3 + (r.homeGoals + r.awayGoals) * 2;
  const wl = winnerOf(m);
  if (m.homeClubId === c.my || m.awayClubId === c.my) { score += 60; flags.push('own'); }
  let hero: string | undefined;
  if (wl) {
    const pw = posBefore.get(wl.w) ?? 9, pl = posBefore.get(wl.l) ?? 9;
    if (pw - pl >= 8) { score += 22; flags.push('upset'); }
    const sc = scorersOf(m, wl.w);
    let best: [string, number[]] | undefined;
    for (const x of sc) if (!best || x[1].length > best[1].length) best = x;
    if (best) {
      hero = best[0];
      if (best[1].length >= 3) { flags.push('hattrick'); score += 15; } else if (best[1].length === 2) flags.push('doppel');
    }
    const margin = Math.abs(r.homeGoals - r.awayGoals);
    const last = [...m.events].reverse().find((e) => GOAL.has(e.type) && e.clubId === wl.w);
    if (margin === 1 && last && last.minute >= 84) { flags.push('spaet'); score += 8; hero = last.playerId ?? hero; }
    flags.push(margin >= 4 ? 'hoch' : margin === 1 ? 'knapp' : 'sieg');
  } else if (r.homeGoals === 0) flags.push('null');
  if ((posBefore.get(m.homeClubId) ?? 99) <= 4 && (posBefore.get(m.awayClubId) ?? 99) <= 4) score += 12;
  if (r.homeRedCards || r.awayRedCards) flags.push('rot');
  return { m, score, flags, hero: hero ?? r.manOfTheMatchId };
}

/** Schlagzeile eines Spiels. */
function matchHeadline(c: PressCtx, x: Rated): string {
  const m = x.m, wl = winnerOf(m);
  const slots = { h: c.name(m.homeClubId), a: c.name(m.awayClubId), score: scoreOf(m), city: c.city(m.homeClubId),
    w: wl ? c.name(wl.w) : '', l: wl ? c.name(wl.l) : '' };
  if (!wl) return c.say('hl_remis', slots, x.flags);
  const hero = c.player(x.hero);
  if (hero && hero.clubId === wl.w && (x.flags.includes('hattrick') || x.flags.includes('doppel') || x.flags.includes('spaet')) && c.rng() < 0.7)
    return c.say('hl_held', { ...slots, player: hero.fullName, club: c.name(wl.w) }, x.flags);
  if (x.flags.includes('upset')) return c.say('hl_upset', slots, x.flags);
  if (x.flags.includes('hoch')) return c.say('hl_sieg_hoch', slots, x.flags);
  if (x.flags.includes('knapp')) return c.say('hl_sieg_knapp', slots, x.flags);
  return c.say('hl_sieg', slots, x.flags);
}

function matchStory(c: PressCtx, x: Rated, posAfter: Map<string, number>): PressStory {
  const m = x.m, r = m.result!, wl = winnerOf(m);
  const g = c.g;
  const motm = c.player(r.manOfTheMatchId);
  const slots = {
    h: c.name(m.homeClubId), a: c.name(m.awayClubId), w: wl ? c.name(wl.w) : '', l: wl ? c.name(wl.l) : '',
    city: c.city(m.homeClubId), stadium: g.clubs[m.homeClubId]?.stadium?.name ?? 'Stadion',
    att: r.attendance.toLocaleString('de-DE'), goals: goalText(c, m), motm: motm?.fullName,
  };
  const p1 = [c.say('sp_lead', slots, x.flags)];
  if (slots.goals) p1.push(c.say('sp_tore', slots));
  const p2 = [c.say(wl ? 'sp_fazit_w' : 'sp_fazit_d', slots, x.flags)];
  const red = m.events.find((e) => e.type === 'red_card' || e.type === 'yellow_red_card');
  if (red?.playerId && c.player(red.playerId)) p2.push(c.say('sp_rot', { rot: c.player(red.playerId)!.fullName }));
  if (motm) p2.push(c.say('sp_motm', slots));
  const p3: string[] = [];
  const coach = (id: string) => (id === c.my ? g.manager?.name : g.clubs[id]?.coach?.name);
  const quoteBy = wl ? (c.rng() < 0.6 ? wl.w : wl.l) : (c.rng() < 0.5 ? m.homeClubId : m.awayClubId);
  const qc = coach(quoteBy);
  if (qc) p3.push(c.say(!wl ? 'sp_zitat_d' : quoteBy === wl.w ? 'sp_zitat_w' : 'sp_zitat_l', { coach: qc }));
  const focusId = m.homeClubId === c.my || m.awayClubId === c.my ? c.my : wl?.w;
  const pos = focusId ? posAfter.get(focusId) : undefined;
  if (focusId && pos) p3.push(c.say('sp_platz', { club: c.name(focusId), pos }));
  const body = [p1.join(' '), p2.join(' '), p3.join(' ')].filter(Boolean);
  const heroP = c.player(x.hero);
  const people = [...new Set([x.hero, r.manOfTheMatchId, ...m.events.filter((e) => GOAL.has(e.type)).map((e) => e.playerId)].filter((id): id is string => !!id && !!c.player(id)))].slice(0, 6);
  return story(c, {
    kind: 'spiel', rubric: 'Bundesliga', date: m.date, weight: 40 + x.score,
    headline: matchHeadline(c, x), dek: `${m.matchday}. Spieltag${m.moved?.makeup ? ' (Nachholspiel)' : ''} · ${slots.h} – ${slots.a} ${scoreOf(m)}`,
    body, image: heroP ? { kind: 'player', id: heroP.id } : { kind: 'club', id: wl?.w ?? m.homeClubId },
    people, clubs: [m.homeClubId, m.awayClubId], results: [resultOf(m)],
    targets: [{ kind: 'match', id: m.id, label: 'Spielbericht' }, { kind: 'screen', screen: 'table', label: 'Tabelle' }],
  });
}

export interface LeagueOut {
  stories: PressStory[];
  matchday: { md: number; results: PressResult[] } | null;
  table: PressTableRow[];
  scorers: { id: string; name: string; clubId: string; goals: number }[];
}

export function leagueStories(c: PressCtx): LeagueOut {
  const g = c.g;
  const inWin = g.fixtures.filter((m) => m.status === 'finished' && m.result && c.inWindow(m.date));
  const before = tableAt(c, c.from), after = tableAt(c, c.date);
  const posBefore = new Map(before.map((r) => [r.clubId, r.pos]));
  const stories: PressStory[] = [];
  const rated = inWin.map((m) => rate(c, m, posBefore)).sort((a, b) => b.score - a.score);
  const picked = rated.filter((x, i) => i < 3 || x.flags.includes('own')).slice(0, 4);
  const posAfter = new Map(after.map((r) => [r.clubId, r.pos]));
  for (const x of picked) stories.push(matchStory(c, x, posAfter));

  // Spieltag-Überblick (jüngster Spieltag im Zeitraum)
  let matchday: LeagueOut['matchday'] = null;
  if (inWin.length) {
    const md = Math.max(...inWin.map((m) => m.matchday));
    const games = g.fixtures.filter((m) => m.matchday === md && m.status === 'finished' && m.result);
    const results = games.map(resultOf);
    matchday = { md, results };
    const goals = results.reduce((s, r) => s + r.hg + r.ag, 0);
    const hw = results.filter((r) => r.hg > r.ag).length, aw = results.filter((r) => r.ag > r.hg).length;
    const top = rated.find((x) => x.m.matchday === md && !x.flags.includes('own')) ?? rated.find((x) => x.m.matchday === md);
    const dr = games.length - hw - aw;
    const slots = { md, goals, games: games.length, hw, hws: plural(hw, 'Heimsieg', 'Heimsiege'), aws: plural(aw, 'Auswärtssieg', 'Auswärtssiege'), drs: plural(dr, 'Unentschieden', 'Unentschieden') };
    stories.push(story(c, {
      kind: 'spieltag', rubric: 'Bundesliga', date: games[games.length - 1]?.date ?? c.date, weight: 30,
      headline: spieltagHeadline(c, md, top ? matchHeadline(c, top) : `${goals} Tore`),
      body: [c.say('st_lead', slots), c.say('st_heim', slots)], results, clubs: [],
      image: top ? { kind: 'club', id: winnerOf(top.m)?.w ?? top.m.homeClubId } : undefined,
      targets: [{ kind: 'screen', screen: 'fixtures', label: 'Spielplan' }, { kind: 'screen', screen: 'table', label: 'Tabelle' }],
    }));
  }

  // Spielabsagen (game/fixtureWatch.ts): Wetter – Nachholspiel unter der Woche.
  const ppd = g.fixtures.filter((m) => m.moved?.makeup && c.inWindow(m.moved.on));
  if (ppd.length) {
    const why = POSTPONE_TEXT[ppd[0].moved!.why as PostponeReason];
    const own = ppd.find((m) => m.homeClubId === c.my || m.awayClubId === c.my);
    const pairs = ppd.map((m) => `${c.name(m.homeClubId)} – ${c.name(m.awayClubId)} (neu: ${weekdayOf(m.date)}, ${Number(m.date.slice(8, 10))}.${Number(m.date.slice(5, 7))}.)`);
    stories.push(story(c, {
      kind: 'spieltag', rubric: 'Spielabsagen', date: ppd[0].moved!.on, weight: own ? 45 : 14 + ppd.length * 3,
      headline: ppd.length > 1 ? `${why?.short ?? 'Wetter'}: ${ppd.length} Spiele abgesagt` : `${why?.short ?? 'Wetter'}: ${c.name(ppd[0].homeClubId)} – ${c.name(ppd[0].awayClubId)} abgesagt`,
      body: [`${why?.long ?? 'Der Platz ist unbespielbar.'} ${ppd.length > 1 ? 'Abgesagt wurden:' : 'Abgesagt wurde:'} ${pairs.join('; ')}.`,
        'Die Nachholspiele finden unter der Woche statt – spätestens vor den letzten zwei Spieltagen.'],
      clubs: [...new Set(ppd.flatMap((m) => [m.homeClubId, m.awayClubId]))].slice(0, 4),
      image: { kind: 'club', id: (own ?? ppd[0]).homeClubId },
      targets: [{ kind: 'screen', screen: 'fixtures', label: 'Spielplan' }],
    }));
  }

  // Tabelle: Spitze und Keller
  const played = after.some((r) => r.played > 0);
  if (played && inWin.length) {
    const lead = after[0], second = after[1];
    const newLead = before[0]?.clubId !== lead.clubId && before.some((r) => r.played > 0);
    const n = after.length;
    const bottom = after.slice(-3);
    stories.push(story(c, {
      kind: 'tabelle', rubric: 'Tabelle', date: c.date, weight: newLead ? 55 : 22,
      headline: c.say(newLead ? 'hl_spitze_neu' : 'hl_spitze', { club: c.name(lead.clubId) }),
      body: [
        c.say('tb_lead', { club: c.name(lead.clubId), played: lead.played, pts: lead.pts, pos: 1 }),
        c.say('tb_abstand', { second: c.name(second?.clubId), gap: plural(lead.pts - (second?.pts ?? 0), 'Punkt', 'Punkte') }, lead.pts === second?.pts ? ['gleich'] : []),
        c.say('tb_keller', { bottom: bottom.map((r) => c.name(r.clubId)).join(', ') }),
      ],
      image: { kind: 'club', id: lead.clubId }, clubs: [lead.clubId, second?.clubId].filter(Boolean) as string[],
      targets: [{ kind: 'screen', screen: 'table', label: 'Tabelle' }],
    }));
    const last = after[n - 1];
    const lastBefore = before[n - 1]?.clubId;
    const me = after.find((r) => r.clubId === c.my);
    const kellerId = me && me.pos >= n - 2 ? me.clubId : last.clubId;
    if (kellerId !== lastBefore || kellerId === c.my || c.rng() < 0.35) {
      const kr = after.find((r) => r.clubId === kellerId)!;
      stories.push(story(c, {
        kind: 'tabelle', rubric: 'Abstiegskampf', date: c.date, weight: kellerId === c.my ? 70 : 18,
        headline: c.say('hl_keller', { club: c.name(kellerId) }),
        body: [c.say('tb_lead', { club: c.name(kellerId), played: kr.played, pts: kr.pts, pos: kr.pos }), c.say('tb_keller', { bottom: bottom.map((r) => c.name(r.clubId)).join(', ') })],
        image: { kind: 'club', id: kellerId }, clubs: [kellerId], targets: [{ kind: 'screen', screen: 'table', label: 'Tabelle' }],
      }));
    }
  }

  // Rekorde: Hattricks, Torjäger-Marken, Zuschauer
  const gb = goalsBefore(c, c.from), ga = goalsBefore(c, c.date);
  const topScorers = new Set([...ga].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => id));
  for (const x of rated) {
    if (!x.flags.includes('hattrick') || !x.hero) continue;
    const p = c.player(x.hero); if (!p) continue;
    const opp = x.m.homeClubId === p.clubId ? x.m.awayClubId : x.m.homeClubId;
    stories.push(story(c, {
      kind: 'rekord', rubric: 'Rekorde', date: x.m.date, weight: 34,
      headline: c.say('hl_rekord_hattrick', { player: p.fullName }),
      body: [c.say('rk_body', { player: p.fullName, opp: c.name(opp), score: x.m.homeClubId === opp ? `${x.m.result!.awayGoals}:${x.m.result!.homeGoals}` : scoreOf(x.m), club: c.name(p.clubId) }, ['hattrick'])],
      image: { kind: 'player', id: p.id }, people: [p.id], clubs: [p.clubId],
      targets: [{ kind: 'match', id: x.m.id, label: 'Spielbericht' }],
    }));
  }
  for (const [pid, n] of ga) {
    const was = gb.get(pid) ?? 0;
    const mark = [40, 30, 25, 20, 15, 10].find((k) => was < k && n >= k);
    if (mark && mark < 15 && !topScorers.has(pid)) continue;
    const p = c.player(pid);
    if (!mark || !p) continue;
    stories.push(story(c, {
      kind: 'rekord', rubric: 'Torjäger', date: c.date, weight: 16 + mark,
      headline: c.say('hl_rekord_marke', { player: p.fullName, n: mark }),
      body: [c.say('rk_body', { player: p.fullName, n: mark, club: c.name(p.clubId) }, ['marke'])],
      image: { kind: 'player', id: p.id }, people: [p.id], clubs: [p.clubId], targets: [{ kind: 'screen', screen: 'table', label: 'Bestenliste' }],
    }));
  }
  const prevMax = Math.max(0, ...g.fixtures.filter((m) => m.status === 'finished' && m.result && m.date < c.from).map((m) => m.result!.attendance));
  const nPrev = g.fixtures.filter((m) => m.status === 'finished' && m.date < c.from).length;
  const top = [...inWin].sort((a, b) => b.result!.attendance - a.result!.attendance)[0];
  if (top && nPrev >= 18 && top.result!.attendance > prevMax) {
    const s = { h: c.name(top.homeClubId), a: c.name(top.awayClubId), att: top.result!.attendance.toLocaleString('de-DE'), city: c.city(top.homeClubId) };
    stories.push(story(c, {
      kind: 'rekord', rubric: 'Rekorde', date: top.date, weight: 20, headline: c.say('hl_rekord_kulisse', s),
      body: [c.say('rk_body', s, ['kulisse'])], image: { kind: 'club', id: top.homeClubId }, clubs: [top.homeClubId, top.awayClubId],
      targets: [{ kind: 'match', id: top.id, label: 'Spielbericht' }],
    }));
  }

  // Vorschau: nächstes eigenes Ligaspiel ab Erscheinungstag
  const next = g.fixtures.filter((m) => m.date >= c.date && (m.homeClubId === c.my || m.awayClubId === c.my)).sort((a, b) => a.date.localeCompare(b.date))[0];
  if (next) {
    const pos = new Map(after.map((r) => [r.clubId, r.pos]));
    const s = { h: c.name(next.homeClubId), a: c.name(next.awayClubId), wd: weekdayOf(next.date), hp: pos.get(next.homeClubId) ?? '–', ap: pos.get(next.awayClubId) ?? '–' };
    const days = (Date.parse(next.date) - Date.parse(c.date)) / 864e5;
    stories.push(story(c, {
      kind: 'vorschau', rubric: 'Vorschau', date: next.date, weight: days <= 3 ? 40 : days <= 6 ? 24 : 10,
      headline: c.say('hl_vorschau', s, Number(s.hp) <= 6 && Number(s.ap) <= 6 ? ['top'] : []), dek: `${next.matchday}. Spieltag${next.moved?.makeup ? ' · Nachholspiel' : next.moved ? ' · verlegt' : ''}`, body: [c.say('vs_body', s), c.say('vs_body', s)],
      image: { kind: 'club', id: next.homeClubId === c.my ? next.awayClubId : next.homeClubId }, clubs: [next.homeClubId, next.awayClubId],
      targets: [{ kind: 'screen', screen: 'lineup', label: 'Aufstellung' }, { kind: 'screen', screen: 'fixtures', label: 'Spielplan' }],
    }));
  }

  const scorers = [...ga].sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([id, goals]) => ({ id, goals, name: c.player(id)?.fullName ?? '–', clubId: c.player(id)?.clubId ?? '' }))
    .filter((s) => s.name !== '–');
  return { stories, matchday, table: after, scorers };
}

/** Saisonvorschau vor dem ersten Spieltag: Favoriten, Stars, Saisonziel. */
export function previewStories(c: PressCtx): PressStory[] {
  const g = c.g;
  if (g.fixtures.some((m) => m.status === 'finished' && m.date < c.date)) return [];
  const ids = [...new Set(g.fixtures.flatMap((m) => [m.homeClubId, m.awayClubId]))].filter((id) => g.clubs[id]);
  const strength = (id: string) => {
    const ov = g.clubs[id].playerIds.map((p) => g.players[p]?.overall ?? 0).sort((a, b) => b - a).slice(0, 14);
    return ov.reduce((s, v) => s + v, 0) / Math.max(1, ov.length);
  };
  const fav = [...ids].sort((a, b) => strength(b) - strength(a)).slice(0, 3);
  const out: PressStory[] = [];
  if (fav.length === 3) {
    const s = { a: c.name(fav[0]), b: c.name(fav[1]), c: c.name(fav[2]) };
    out.push(story(c, {
      kind: 'vorschau', rubric: 'Saisonvorschau', date: c.date, weight: 48, headline: c.say('hl_favoriten', s), body: [c.say('fv_body', s)],
      image: { kind: 'club', id: fav[0] }, clubs: fav, targets: [{ kind: 'screen', screen: 'table', label: 'Tabelle' }],
    }));
  }
  const stars = ids.flatMap((id) => g.clubs[id].playerIds.map((p) => g.players[p]).filter(Boolean)).sort((a, b) => b.overall - a.overall).slice(0, 5);
  if (stars.length) {
    const s = { player: stars[0].fullName, club: c.name(stars[0].clubId), list: stars.map((p) => `${p.fullName} (${c.name(p.clubId)})`).join(', ') };
    out.push(story(c, {
      kind: 'rekord', rubric: 'Saisonvorschau', date: c.date, weight: 40, headline: c.say('hl_stars', s), body: [c.say('sr_body', s), c.say('sr_body', s)],
      image: { kind: 'player', id: stars[0].id }, people: stars.map((p) => p.id), clubs: [...new Set(stars.map((p) => p.clubId))],
      targets: [{ kind: 'screen', screen: 'transfers', label: 'Transfermarkt' }],
    }));
  }
  const my = g.clubs[c.my];
  if (my?.boardExpectation) {
    const s = { club: my.name, goal: my.boardExpectation };
    out.push(story(c, {
      kind: 'kommentar', rubric: 'Saisonvorschau', date: c.date, weight: 30, headline: c.say('hl_ziel', s), body: [c.say('zl_body', s), c.say('zl_body', s)],
      image: { kind: 'club', id: c.my }, clubs: [c.my], targets: [{ kind: 'screen', screen: 'vorstand', label: 'Vorstand' }],
    }));
  }
  return out;
}

/** Paarungen des nächsten Liga-Spieltags ab dem Erscheinungstag. */
export function upcomingMatchday(c: PressCtx): { md: number; pairs: { home: string; away: string; date: string }[] } | null {
  const next = c.g.fixtures.filter((m) => m.date >= c.date).sort((a, b) => a.date.localeCompare(b.date))[0];
  if (!next) return null;
  const pairs = c.g.fixtures.filter((m) => m.matchday === next.matchday).map((m) => ({ home: m.homeClubId, away: m.awayClubId, date: m.date }));
  return { md: next.matchday, pairs };
}
