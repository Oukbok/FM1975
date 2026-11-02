// =============================================================================
// Presse: Artikel abseits des Ligaalltags – Transfers, Gerüchte, Trainer,
// Verletzungen, Pokal/Europapokal, Kabine, Jugend, Chronik, Kurzmeldungen,
// Kommentar. Quelle ist immer der Spielstand (Spielerverlauf, Trainerhistorie,
// Pokalrunden, Nachrichten).
// =============================================================================
import { EURO_COMP_NAMES } from '../../data/europe';
import { economyScale } from '../../engine/economy';
import { hashStr } from '../../engine/leagues';
import type { CupState, Match } from '../../types';
import type { PressCtx } from './context';
import { durationText, plural, posName, story } from './context';
import { tableAt } from './matchStories';
import type { PressResult, PressStory } from './types';

const yearsBetween = (a: string, b: string) => Math.max(0, Math.round((Date.parse(b) - Date.parse(a)) / (365.25 * 864e5)));

// ----------------------------------------------------------------- Transfers
export function transferStories(c: PressCtx): { stories: PressStory[]; briefs: PressStory[] } {
  const g = c.g;
  const byName = new Map<string, string>();
  for (const cl of Object.values(g.clubs)) byName.set(cl.name, cl.id);
  for (const s of Object.values(g.simClubs ?? {})) if (!byName.has(s.name)) byName.set(s.name, s.id);
  const scale = economyScale(c.year);
  const items: { s: PressStory; w: number }[] = [];
  for (const p of Object.values(g.players)) {
    for (const t of p.history?.transfers ?? []) {
      if (!c.inWindow(t.date)) continue;
      const fromId = byName.get(t.fromClub), toId = byName.get(t.toClub);
      const base = t.fee / scale;
      const own = fromId === c.my || toId === c.my;
      const abroad = !toId;
      const imported = !fromId;
      const flags = [base >= 700_000 ? 'big' : '', t.fee <= 0 ? 'free' : '', abroad ? 'abroad' : '', imported ? 'import' : '', t.fromClub === 'Ausland' ? 'ausl' : ''].filter(Boolean);
      const slots = {
        player: p.fullName, to: abroad ? 'einem Verein im Ausland' : t.toClub, from: t.fromClub, fromcity: fromId ? c.city(fromId) : t.fromClub,
        tocity: toId ? c.city(toId) : t.toClub, fee: c.money(t.fee),
        age: p.age, pos: p.naturalPosition, posname: posName(p), apps: p.seasonStats.appearances, goals: p.seasonStats.goals,
      };
      const w = 12 + Math.min(45, Math.sqrt(Math.max(0, base) / 1000) * 1.5) + Math.max(0, (p.overall - 60) / 2) + (own ? 30 : 0);
      items.push({ w, s: story(c, {
        kind: 'transfer', rubric: 'Transfermarkt', date: t.date, weight: w,
        headline: c.say('hl_transfer', slots, flags), dek: `${t.fromClub} → ${t.toClub}`,
        body: [c.say('tr_lead', slots), c.say(t.fee > 0 ? 'tr_fee' : 'tr_free', slots), c.say('tr_fazit', slots)],
        image: { kind: 'player', id: p.id }, people: [p.id], clubs: [fromId, toId].filter((x): x is string => !!x),
        targets: [{ kind: 'screen', screen: 'transfers', label: 'Transfermarkt' }],
      }) });
    }
  }
  items.sort((a, b) => b.w - a.w);
  return { stories: items.slice(0, 5).map((x) => x.s), briefs: items.slice(5, 12).map((x) => ({ ...x.s, kind: 'meldung' as const })) };
}

/** Gerüchte: gute Spieler mit auslaufendem Vertrag oder auf der Transferliste. */
export function rumorStories(c: PressCtx): PressStory[] {
  const g = c.g;
  const rows = tableAt(c, c.date);
  const league = new Set(rows.map((r) => r.clubId));
  const bigs = Object.values(g.clubs).filter((cl) => league.has(cl.id)).sort((a, b) => b.reputation - a.reputation).slice(0, 6);
  const soon = new Date(Date.parse(c.date) + 240 * 864e5).toISOString().slice(0, 10);
  const cands = Object.values(g.players).filter((p) => league.has(p.clubId) && p.overall >= 72
    && (p.transferListed || p.contract.expiryDate <= soon))
    .sort((a, b) => b.overall - a.overall).slice(0, 8);
  const out: PressStory[] = [];
  const n = Math.min(cands.length, 1 + Math.floor(c.rng() * 2));
  for (let i = 0; i < n; i++) {
    const p = cands.splice(Math.floor(c.rng() * Math.min(cands.length, 4)), 1)[0];
    const targets = bigs.filter((b) => b.id !== p.clubId && b.id !== c.my);
    if (!p || !targets.length) continue;
    // Gleicher Interessent über mehrere Ausgaben (Spieler + Saison).
    const to = targets[hashStr(`${p.id}:${c.g.season}`) % targets.length];
    const flags = [p.transferListed ? 'liste' : 'vertrag'];
    const slots = { player: p.fullName, to: to.name, club: c.name(p.clubId), city: c.city(p.clubId), posname: posName(p) };
    out.push(story(c, {
      kind: 'geruecht', rubric: 'Gerüchteküche', date: c.date, weight: 12 + (p.overall - 70) + (p.clubId === c.my ? 16 : 0), rumor: true,
      headline: c.say('hl_geruecht', slots), body: [c.say('ge_body', slots), c.say('ge_grund', slots, flags)],
      image: { kind: 'player', id: p.id }, people: [p.id], clubs: [p.clubId, to.id],
      targets: [{ kind: 'screen', screen: p.clubId === c.my ? 'vertraege' : 'beobachtung', label: p.clubId === c.my ? 'Verträge' : 'Beobachtung' }],
    }));
  }
  return out;
}

// ------------------------------------------------------------------- Trainer
export function coachStories(c: PressCtx): PressStory[] {
  const out: PressStory[] = [];
  const pos = new Map(tableAt(c, c.date).map((r) => [r.clubId, r.pos]));
  for (const cl of Object.values(c.g.clubs)) {
    const hist = cl.coachHistory ?? [];
    hist.forEach((h, i) => {
      if (!c.inWindow(h.to)) return;
      const succ = hist[i + 1]?.name ?? (cl.coach && cl.coach.since >= h.to ? cl.coach.name : undefined);
      const succId = hist[i + 1] ? undefined : cl.coach?.id;
      const slots = { club: cl.name, city: cl.city, coach: h.name, succ, pos: pos.get(cl.id) ?? '–', years: yearsBetween(h.from, h.to) };
      const body = [c.say('co_lead', slots), c.say('co_grund', slots, [h.reason])];
      if (succ) body.push(c.say('co_nachfolger', slots));
      out.push(story(c, {
        kind: 'trainer', rubric: 'Trainerkarussell', date: h.to, weight: h.reason === 'entlassen' ? 46 : 24,
        headline: c.say(`hl_${h.reason}`, slots), dek: succ ? `Nachfolger: ${succ}` : undefined, body,
        image: succ && succId ? { kind: 'coach', id: succId, name: succ, clubId: cl.id } : { kind: 'coach', id: `${cl.id}:${h.name}`, name: h.name },
        clubs: [cl.id], targets: [],
      }));
    });
  }
  return out;
}

// --------------------------------------------------------------- Verletzung
export function injuryStories(c: PressCtx): { stories: PressStory[]; briefs: PressStory[] } {
  const items: PressStory[] = [];
  for (const p of Object.values(c.g.players)) {
    for (const inj of p.history?.injuries ?? []) {
      const own = p.clubId === c.my;
      if (!c.inWindow(inj.date) || inj.days < (own ? 10 : 21)) continue;
      const squad = (c.g.clubs[p.clubId]?.playerIds ?? []).map((id) => c.g.players[id]?.overall ?? 0).sort((a, b) => b - a);
      const stamm = p.overall >= (squad[10] ?? 0);
      const slots = { player: p.fullName, club: c.name(p.clubId), inj: inj.description, days: durationText(inj.days) };
      const flags = [inj.days >= 90 ? 'lang' : '', stamm ? 'stamm' : ''].filter(Boolean);
      items.push(story(c, {
        kind: 'verletzung', rubric: 'Lazarett', date: inj.date, weight: 10 + Math.max(0, p.overall - 60) / 2 + Math.min(20, inj.days / 6) + (own ? 25 : 0),
        headline: c.say('hl_verletzung', slots, flags),
        body: [c.say('vl_body', slots), c.say('vl_fazit', slots, flags)],
        image: { kind: 'player', id: p.id }, people: [p.id], clubs: [p.clubId],
        targets: own ? [{ kind: 'screen', screen: 'squad', label: 'Kader' }] : [],
      }));
    }
  }
  items.sort((a, b) => b.weight - a.weight);
  return { stories: items.slice(0, 3), briefs: items.slice(3, 8).map((s) => ({ ...s, kind: 'meldung' as const })) };
}

// ------------------------------------------------------------ Pokal/Europa
const intoPhrase = (name: string) => /runde/i.test(name) ? `in die ${name}` : /endspiel/i.test(name) ? 'ins Endspiel' : `ins ${name}`;

interface CupRes { r: PressResult; winner?: string; loser?: string; decided: boolean }

function cupResults(c: PressCtx, cup: CupState, german: (id: string) => boolean): { round: string; next?: string; final: boolean; res: CupRes[] }[] {
  const out: { round: string; next?: string; final: boolean; res: CupRes[] }[] = [];
  cup.rounds.forEach((rd, i) => {
    const res: CupRes[] = [];
    const add = (m: { home: string; away: string; hg: number | null; ag: number | null; match?: Match | null; date: string; pen?: { home: number; away: number } | null; note?: string }, winner: string | null, decided: boolean) => {
      if (!c.inWindow(m.date) || m.hg == null || m.ag == null || (!german(m.home) && !german(m.away))) return;
      const loser = winner ? (winner === m.home ? m.away : m.home) : undefined;
      res.push({ r: { matchId: m.match?.id, home: m.home, away: m.away, hg: m.hg, ag: m.ag, note: [m.note, m.pen ? `i. E. ${m.pen.home}:${m.pen.away}` : ''].filter(Boolean).join(', ') || undefined }, winner: decided ? winner ?? undefined : undefined, loser: decided ? loser : undefined, decided });
    };
    for (const t of rd.ties) {
      if (t.legs?.length) {
        const two = t.legs.length === 2 && t.legs[0].home === t.legs[1].away;
        t.legs.forEach((l, k) => {
          const last = k === t.legs!.length - 1;
          let note: string | undefined;
          if (two && last && l.homeGoals != null && t.legs![0].homeGoals != null) {
            const a = (l.homeGoals ?? 0) + (t.legs![0].awayGoals ?? 0), b = (l.awayGoals ?? 0) + (t.legs![0].homeGoals ?? 0);
            note = `Gesamt ${a}:${b}`;
          }
          add({ home: l.home, away: l.away, hg: l.homeGoals, ag: l.awayGoals, match: l.match, date: l.date, pen: l.penalties, note }, t.winnerClubId, last && !!t.winnerClubId);
        });
      }
      else if (t.played) add({ home: t.homeClubId, away: t.awayClubId, hg: t.homeGoals, ag: t.awayGoals, match: t.match, date: t.date, pen: t.penalties }, t.winnerClubId, !!t.winnerClubId);
    }
    for (const gr of rd.groups ?? []) for (const m of gr.matches) add({ home: m.home, away: m.away, hg: m.hg, ag: m.ag, match: m.match, date: m.date }, null, false);
    if (res.length) out.push({ round: rd.name, next: cup.rounds[i + 1]?.name, final: i === cup.rounds.length - 1, res });
  });
  return out;
}

export function cupStories(c: PressCtx): PressStory[] {
  const g = c.g, out: PressStory[] = [];
  const german = (id: string) => !!g.clubs[id] || !!g.simClubs?.[id] || (g.cup?.participantIds ?? []).includes(id);
  const comps: [CupState | null | undefined, string, boolean][] = [[g.cup, 'Landespokal', false]];
  if (g.euroCups) for (const k of Object.keys(g.euroCups) as (keyof NonNullable<typeof g.euroCups>)[]) comps.push([g.euroCups[k], EURO_COMP_NAMES[k] ?? 'Europapokal', true]);
  for (const [cup, comp, euro] of comps) {
    if (!cup) continue;
    const isGer = euro ? (id: string) => !!g.clubs[id] : german;
    for (const rd of cupResults(c, cup, isGer)) {
      const amateurs = new Set(cup.amateurClubIds ?? []);
      const ownRes = rd.res.find((x) => x.r.home === c.my || x.r.away === c.my);
      const upset = !euro ? rd.res.find((x) => x.winner && amateurs.has(x.winner) && x.loser && !amateurs.has(x.loser)) : undefined;
      const focus = ownRes ?? upset ?? rd.res.find((x) => x.decided) ?? rd.res[0];
      const results = rd.res.map((x) => x.r);
      const resText = results.slice(0, 6).map((r) => `${c.name(r.home)} – ${c.name(r.away)} ${r.hg}:${r.ag}${r.note ? ` (${r.note})` : ''}`).join(', ');
      const next = rd.next ? intoPhrase(rd.next) : 'in die nächste Runde';
      let headline: string;
      const clubId = focus.winner && isGer(focus.winner) ? focus.winner : focus.r.home === c.my || focus.r.away === c.my ? c.my : isGer(focus.r.home) ? focus.r.home : focus.r.away;
      if (euro && !focus.decided) {
        const club = isGer(focus.r.home) ? focus.r.home : focus.r.away;
        const opp = club === focus.r.home ? focus.r.away : focus.r.home;
        const gf = club === focus.r.home ? focus.r.hg : focus.r.ag, ga = club === focus.r.home ? focus.r.ag : focus.r.hg;
        headline = c.say(gf > ga ? 'hl_leg_w' : gf < ga ? 'hl_leg_l' : 'hl_leg_d', { club: c.name(club), opp: c.name(opp), score: `${gf}:${ga}` });
      } else if (euro) {
        const out_ = !!focus.loser && isGer(focus.loser) && !(focus.winner && isGer(focus.winner));
        const club = out_ ? focus.loser! : clubId;
        const opp = focus.r.home === club ? focus.r.away : focus.r.home;
        headline = c.say('hl_euro', { club: c.name(club), next, round: rd.round, opp: c.name(opp) }, [out_ ? 'aus' : '', rd.final && focus.decided && !out_ ? 'final' : ''].filter(Boolean));
      } else if (focus.winner) {
        headline = c.say('hl_pokal', { w: c.name(focus.winner), l: c.name(focus.loser), next }, [focus === upset ? 'upset' : '', rd.final ? 'final' : ''].filter(Boolean));
      } else headline = `${comp}: ${c.name(focus.r.home)} – ${c.name(focus.r.away)} ${focus.r.hg}:${focus.r.ag}`;
      const own = !!ownRes;
      out.push(story(c, {
        kind: euro ? 'europa' : 'pokal', rubric: euro ? comp : 'Pokal', date: c.date,
        weight: (euro ? 30 : 24) + (own ? 45 : 0) + (upset ? 16 : 0) + (rd.final ? 30 : 0),
        headline, dek: `${comp} · ${rd.round}`,
        body: [c.say('cup_lead', { round: rd.round, round_gen: `der Runde „${rd.round}“`, comp, res: resText })],
        results, image: { kind: 'club', id: clubId }, clubs: [...new Set(results.flatMap((r) => [r.home, r.away]).filter((id) => !!g.clubs[id]))].slice(0, 8),
        targets: [
          ...(focus.r.matchId ? [{ kind: 'match' as const, id: focus.r.matchId, label: 'Spielbericht' }] : []),
          { kind: 'screen', screen: euro ? 'international' : 'cup', label: euro ? 'International' : 'Pokal' },
        ],
      }));
    }
  }
  return out;
}

// ----------------------------------------------------------------- Kabine
export function dressingStories(c: PressCtx): PressStory[] {
  const club = c.g.clubs[c.my], dr = club?.dressingRoom;
  if (!dr) return [];
  const name = (id: string) => c.player(id)?.fullName ?? 'ein Mitspieler';
  const conflict = (dr.conflicts ?? []).find((k) => c.inWindow(k.since));
  const mood = dr.mood;
  const moodText = mood >= 75 ? 'bestens' : mood >= 55 ? 'ordentlich' : mood >= 35 ? 'angespannt' : 'im Keller';
  const slots = { club: club.name, mood: moodText, a: conflict ? name(conflict.a) : '', b: conflict ? name(conflict.b) : '', cap: dr.captainId ? name(dr.captainId) : '' };
  let sym: string | null = null;
  if (conflict) sym = 'hl_kabine_krach';
  else if (mood < 35 && c.rng() < 0.6) sym = 'hl_kabine_schlecht';
  else if (mood >= 78 && c.rng() < 0.3) sym = 'hl_kabine_gut';
  if (!sym) return [];
  const flags = [conflict ? 'krach' : '', dr.captainId ? 'kapitaen' : ''].filter(Boolean);
  const people = conflict ? [conflict.a, conflict.b] : dr.captainId ? [dr.captainId] : [];
  return [story(c, {
    kind: 'kabine', rubric: 'Hinter den Kulissen', date: c.date, weight: conflict ? 44 : 28, rumor: true,
    headline: c.say(sym, slots), body: [c.say('kb_body', slots, flags), c.say('kb_body', slots, flags)],
    image: people[0] ? { kind: 'player', id: people[0] } : { kind: 'club', id: c.my }, people, clubs: [c.my],
    targets: [{ kind: 'screen', screen: 'kabine', label: 'Kabine' }],
  })];
}

// ------------------------------------------------------------------ Jugend
export function talentStories(c: PressCtx): PressStory[] {
  let best: { pid: string; m: Match } | null = null;
  for (const m of c.g.fixtures) {
    if (m.status !== 'finished' || !c.inWindow(m.date)) continue;
    for (const e of m.events) {
      if ((e.type !== 'goal' && e.type !== 'penalty_goal') || !e.playerId) continue;
      const p = c.player(e.playerId);
      if (!p || p.age > 19) continue;
      if (!best || p.age < c.player(best.pid)!.age || (p.clubId === c.my && c.player(best.pid)!.clubId !== c.my)) best = { pid: p.id, m };
    }
  }
  if (!best) return [];
  const p = c.player(best.pid)!, m = best.m;
  const opp = m.homeClubId === p.clubId ? m.awayClubId : m.homeClubId;
  const slots = { player: p.fullName, age: p.age, posname: posName(p), opp: c.name(opp), club: c.name(p.clubId), score: `${m.result!.homeGoals}:${m.result!.awayGoals}` };
  return [story(c, {
    kind: 'jugend', rubric: 'Talente', date: m.date, weight: 20 + (p.clubId === c.my ? 20 : 0),
    headline: c.say('hl_talent', slots), body: [c.say('tl_body', slots), c.say('tl_body', slots)],
    image: { kind: 'player', id: p.id }, people: [p.id], clubs: [p.clubId],
    targets: [{ kind: 'match', id: m.id, label: 'Spielbericht' }],
  })];
}

// --------------------------------------------------------------- Nachrichten
/** Nur Meldungen, die aus der Presse stammen (keine internen Hinweise an dich). */
const PRESS_FROM = /presse|redaktion|ticker|chronik/i;
const SKIP_FROM = /Pressestelle|Spielbericht/;
const YOUTH = /Jugend|Talent|Nachwuchs|Eigengewächs|Akademie/;

export function messageStories(c: PressCtx): { stories: PressStory[]; briefs: PressStory[] } {
  const stories: PressStory[] = [], briefs: PressStory[] = [];
  for (const m of c.g.messages) {
    if (!c.inWindow(m.date) || SKIP_FROM.test(m.from) || m.actionRequired) continue;
    const youth = YOUTH.test(m.subject);
    if (!PRESS_FROM.test(m.from) && !(youth && m.category !== 'training')) continue;
    if (/Trainer/.test(m.subject) && /entl|feuert|trennt/i.test(m.subject)) continue; // steht schon im Trainerkarussell
    const chronik = m.category === 'milestone';
    const base = {
      date: m.date, headline: m.subject, body: [m.shortText, ...(m.bodyText && m.bodyText !== m.shortText ? m.bodyText.split(/\n+/) : [])].filter(Boolean),
      clubs: [] as string[], own: m.category !== 'milestone' && m.from !== 'Europapokal-Chronik',
      targets: [{ kind: 'screen' as const, screen: 'news' as const, label: 'Nachrichten' }],
    };
    if (chronik) stories.push(story(c, { ...base, kind: 'chronik', rubric: 'Chronik', weight: 22, own: false }));
    else if (youth) stories.push(story(c, { ...base, kind: 'jugend', rubric: 'Nachwuchs', weight: 18, image: { kind: 'club', id: c.my }, clubs: [c.my] }));
    else briefs.push(story(c, { ...base, kind: 'meldung', rubric: m.from, weight: 8 + (m.actionRequired ? 6 : 0) }));
  }
  return { stories, briefs };
}

// --------------------------------------------------------------- Kommentar
export function commentStory(c: PressCtx): PressStory | null {
  const my = c.my;
  const last = c.g.fixtures.filter((m) => m.status === 'finished' && m.result && m.date < c.date && (m.homeClubId === my || m.awayClubId === my))
    .sort((a, b) => a.date.localeCompare(b.date)).slice(-5);
  if (!last.length) return null;
  let w = 0, d = 0, l = 0;
  for (const m of last) {
    const gf = m.homeClubId === my ? m.result!.homeGoals : m.result!.awayGoals, ga = m.homeClubId === my ? m.result!.awayGoals : m.result!.homeGoals;
    if (gf > ga) w++; else if (gf < ga) l++; else d++;
  }
  const tenor = (w * 3 + d) / (last.length * 3);
  const mood = tenor >= 0.6 ? 'gut' : tenor >= 0.34 ? 'mittel' : 'schlecht';
  const pos = tableAt(c, c.date).find((r) => r.clubId === my)?.pos ?? '–';
  const form = `${plural(w, 'Sieg', 'Siege')}, ${d ? `${d} Remis` : 'kein Remis'}, ${plural(l, 'Niederlage', 'Niederlagen')} aus den letzten ${last.length} Spielen`;
  const slots = { club: c.name(my), pos, form };
  return story(c, {
    kind: 'kommentar', rubric: 'Kommentar', date: c.date, weight: 12 + (mood === 'schlecht' ? 10 : 0),
    headline: c.say(`hl_kommentar_${mood}`, slots), body: [c.say(`km_${mood}`, slots), c.say('km_platz', slots)],
    image: { kind: 'club', id: my }, clubs: [my], targets: [{ kind: 'screen', screen: 'table', label: 'Tabelle' }],
  });
}
