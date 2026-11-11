// =============================================================================
// WM/EM – Teilnehmer, Gruppen, K.-o.-Runden (Wunsch Pascal, #36).
// Das Turnier wird beim Aufbau (Nominierung, 25 Tage vor dem Anpfiff) komplett
// ausgespielt und danach Tag für Tag aufgedeckt (Ergebnisse erst ab ihrem Datum
// sichtbar). Format nach Teilnehmerzahl wie historisch:
//   4 (EM 1976) Halbfinale + Finale · 8 (EM 1980) zwei Gruppen, Sieger ins Finale ·
//   8 (EM 1984–92) zwei Gruppen, Halbfinale · 16 vier Gruppen, Viertelfinale ·
//   24 sechs Gruppen + vier beste Dritte, Achtelfinale · 32 acht Gruppen,
//   Achtelfinale · 48 zwölf Gruppen + acht beste Dritte, Sechzehntelfinale.
// (Die zweiten Finalrunden-Gruppen der WM 1978/1982 sind vereinfacht als K.-o.)
// =============================================================================
import { NATION_BY_CODE, confOf, wmQuota, type Conf, type TournamentDef } from '../../data/nationalTeams';
import { addDaysISO } from '../../engine/trainingPlan';
import { hashStr, mulberry32, simMatchGoals } from '../../engine/leagues';

export interface NtMatch {
  date: string; stage: string; a: string; b: string; ga: number; gb: number;
  /** n.V. / i.E. (Sieger nach Elfmeterschießen in `pw`). */
  extra?: 'nV' | 'iE'; pw?: string;
  /** Torschützen [Spieler-ID, Nation]. */
  scorers?: [string, string][];
}
export interface NtGroup { name: string; teams: string[] }
export interface Tournament {
  kind: 'WM' | 'EM'; year: number; place: string; hosts: string[];
  start: string; end: string; nominate: string;
  teams: string[]; strength: Record<string, number>;
  groups: NtGroup[]; matches: NtMatch[];
  winner: string; runnerUp: string;
  /** Aufgebote: Nation → Spieler-IDs (volle Spieler und Weltspieler). */
  squads: Record<string, string[]>;
  /** Anzeigenamen der Aufgebote (Weltspieler haben keinen vollen Datensatz). */
  names: Record<string, [string, string, number, string]>; // id → [Name, Pos, Stärke, Vereins-ID]
  /** Letzter Spieltag je Nation (Aus/Endspiel) – danach reisen die Spieler heim. */
  out: Record<string, string>;
  /** Abgeschlossen (Wirkungen gebucht). */
  done?: boolean;
  /** Ergebnis je Nation („Weltmeister“, „Halbfinale“, „Vorrunde“ …). */
  result: Record<string, string>;
}

export const STAGE_LABEL: Record<string, string> = {
  G1: '1. Spieltag', G2: '2. Spieltag', G3: '3. Spieltag', R32: 'Sechzehntelfinale', R16: 'Achtelfinale', QF: 'Viertelfinale', SF: 'Halbfinale', F: 'Finale',
};

/** Teilnehmer: Gastgeber + Beste nach (Stärke + Qualifikations-Zufall). */
export function qualify(def: TournamentDef, strength: Map<string, number>, year: number): string[] {
  const noise = (c: string) => ((hashStr(`${def.kind}${def.year}|${c}|q`) % 1000) / 1000 - 0.5) * 8;
  const ranked = [...strength.keys()].filter((c) => !def.hosts.includes(c))
    .map((c) => ({ c, v: (strength.get(c) ?? 60) + noise(c) })).sort((a, b) => b.v - a.v);
  const hosts = def.hosts.filter((h) => strength.has(h));
  const need = def.teams - hosts.length;
  if (def.kind === 'EM') return [...hosts, ...ranked.filter((x) => confOf(NATION_BY_CODE[x.c], year) === 'UEFA').slice(0, need).map((x) => x.c)];
  const quota = wmQuota(def.teams);
  const picked: string[] = [];
  for (const [conf, q] of Object.entries(quota) as [Conf, number][]) {
    const hostIn = hosts.filter((h) => confOf(NATION_BY_CODE[h], year) === conf).length;
    picked.push(...ranked.filter((x) => confOf(NATION_BY_CODE[x.c], year) === conf).slice(0, Math.max(0, q - (conf === 'CONCACAF' ? hostIn : 0))).map((x) => x.c));
  }
  let list = picked;
  if (list.length > need) list = ranked.filter((x) => list.includes(x.c)).slice(0, need).map((x) => x.c);
  for (const x of ranked) { if (list.length >= need) break; if (!list.includes(x.c)) list.push(x.c); }
  return [...hosts, ...list];
}

function koWinner(a: string, b: string, sa: number, sb: number, r: () => number, m: NtMatch): string {
  if (m.ga !== m.gb) return m.ga > m.gb ? a : b;
  // Verlängerung: etwa jede dritte bringt ein Tor.
  if (r() < 0.33) {
    const pa = 0.5 + (sa - sb) / 60;
    if (r() < pa) m.ga++; else m.gb++;
    m.extra = 'nV';
    return m.ga > m.gb ? a : b;
  }
  m.extra = 'iE';
  m.pw = r() < 0.5 + (sa - sb) / 120 ? a : b;
  return m.pw;
}

/** Turnier aufbauen und vollständig ausspielen. */
export function buildTournament(def: TournamentDef, strengthAll: Map<string, number>, year: number, place: string): Tournament {
  const teams = qualify(def, strengthAll, year);
  const S = (c: string) => strengthAll.get(c) ?? 60;
  const r = mulberry32(hashStr(`${def.kind}|${def.year}|turnier`));
  const host = new Set(def.hosts);
  const play = (a: string, b: string, stage: string, date: string): NtMatch => {
    // Gastgeber spielt „zu Hause“, sonst neutral (Heimvorteil per Zufall verteilt).
    let home = a, away = b;
    if (host.has(b) && !host.has(a)) { home = b; away = a; } else if (!host.has(a) && r() < 0.5) { home = b; away = a; }
    const neutral = !host.has(home);
    const g0 = simMatchGoals(S(home) - (neutral ? 2.5 : 0), S(away), r);
    const m: NtMatch = { date, stage, a, b, ga: home === a ? g0.home : g0.away, gb: home === a ? g0.away : g0.home };
    return m;
  };
  const days = Math.max(4, Math.round((Date.parse(def.end) - Date.parse(def.start)) / 864e5));
  const nGroups = def.teams <= 4 ? 0 : def.teams === 8 ? 2 : def.teams / 4;
  const groups: NtGroup[] = [];
  // Töpfe: nach Stärke, Gastgeber in Gruppe A.
  const seeded = [...teams].sort((a, b) => (host.has(b) ? 1 : 0) - (host.has(a) ? 1 : 0) || S(b) - S(a));
  for (let i = 0; i < nGroups; i++) groups.push({ name: String.fromCharCode(65 + i), teams: [] });
  for (let pot = 0; pot < 4 && nGroups; pot++) {
    const chunk = seeded.slice(pot * nGroups, (pot + 1) * nGroups);
    const order = pot === 0 ? chunk : [...chunk].sort(() => r() - 0.5);
    order.forEach((c, i) => groups[i].teams.push(c));
  }
  const matches: NtMatch[] = [];
  const result: Record<string, string> = {};
  const out: Record<string, string> = {};
  const groupSpan = Math.round(days * 0.42);
  const stageDate = (i: number, of: number, k: number) => addDaysISO(def.start, Math.min(days, Math.round(i / Math.max(1, of) * groupSpan) + (k % 4)));
  // Gruppenphase
  const ranks: { c: string; g: number; place: number; pts: number; gd: number; gf: number }[] = [];
  if (nGroups) {
    const pairs: [number, number][][] = [[[0, 1], [2, 3]], [[0, 2], [3, 1]], [[3, 0], [1, 2]]];
    pairs.forEach((md, mi) => groups.forEach((gr, gi) => md.forEach(([x, y], k) => {
      matches.push(play(gr.teams[x], gr.teams[y], `G${mi + 1}`, stageDate(mi, 3, gi + k)));
    })));
    groups.forEach((gr, gi) => {
      const tab = gr.teams.map((c) => {
        let pts = 0, gf = 0, ga = 0;
        for (const m of matches) {
          if (m.a === c) { gf += m.ga; ga += m.gb; pts += m.ga > m.gb ? (year >= 1994 ? 3 : 2) : m.ga === m.gb ? 1 : 0; }
          if (m.b === c) { gf += m.gb; ga += m.ga; pts += m.gb > m.ga ? (year >= 1994 ? 3 : 2) : m.ga === m.gb ? 1 : 0; }
        }
        return { c, pts, gd: gf - ga, gf };
      }).sort((x, y) => y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || S(y.c) - S(x.c));
      tab.forEach((t, place) => ranks.push({ ...t, g: gi, place }));
    });
  }
  // Wer kommt weiter?
  let ko: string[];
  if (!nGroups) ko = seeded;
  else {
    const per = def.teams === 8 && def.year === 1980 ? 1 : 2;
    const direct = ranks.filter((x) => x.place < per);
    const slots = [2, 4, 8, 16, 32].find((n) => n >= direct.length) ?? 32;
    const thirds = ranks.filter((x) => x.place === 2).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf).slice(0, slots - direct.length);
    const q = [...direct, ...thirds].sort((a, b) => a.place - b.place || b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
    // Paarung: Bester gegen Schwächsten, möglichst nicht aus derselben Gruppe.
    const left = [...q]; const order: typeof q = [];
    while (left.length) {
      const a = left.shift()!;
      let j = left.length - 1;
      while (j > 0 && left[j].g === a.g) j--;
      order.push(a, left.splice(j, 1)[0]);
    }
    ko = order.map((x) => x.c);
    for (const x of ranks) if (!ko.includes(x.c)) { result[x.c] = 'Vorrunde'; out[x.c] = matches.filter((m) => m.a === x.c || m.b === x.c).map((m) => m.date).sort().pop()!; }
  }
  const stagesFor = (n: number) => (['R32', 'R16', 'QF', 'SF', 'F'] as const).slice(5 - Math.log2(n));
  const stages = stagesFor(ko.length);
  const koDays = days - groupSpan - 2;
  let round = ko;
  stages.forEach((st, si) => {
    const base = nGroups ? groupSpan + 3 + Math.round((si / stages.length) * koDays) : Math.round((si / stages.length) * days);
    const next: string[] = [];
    for (let i = 0; i < round.length; i += 2) {
      const date = st === 'F' ? def.end : addDaysISO(def.start, Math.min(days - 1, base + ((i / 2) % 4)));
      const m = play(round[i], round[i + 1], st, date);
      const w = koWinner(round[i], round[i + 1], S(round[i]), S(round[i + 1]), r, m);
      const l = w === round[i] ? round[i + 1] : round[i];
      matches.push(m);
      result[l] = st === 'F' ? 'Finale' : STAGE_LABEL[st];
      out[l] = date;
      next.push(w);
    }
    round = next;
  });
  const winner = round[0];
  result[winner] = def.kind === 'WM' ? 'Weltmeister' : 'Europameister';
  out[winner] = def.end;
  const final = matches.find((m) => m.stage === 'F');
  const runnerUp = final ? (final.a === winner ? final.b : final.a) : '';
  return {
    kind: def.kind, year: def.year, place, hosts: def.hosts, start: def.start, end: def.end, nominate: addDaysISO(def.start, -25),
    teams, strength: Object.fromEntries(teams.map((c) => [c, S(c)])), groups, matches, winner, runnerUp, squads: {}, names: {}, out, result,
  };
}

/** Tabelle einer Gruppe bis zu einem Datum (für die Anzeige). */
export function groupTable(t: Tournament, gr: NtGroup, upTo: string) {
  const three = t.year >= 1994;
  return gr.teams.map((c) => {
    let p = 0, pts = 0, gf = 0, ga = 0;
    for (const m of t.matches) {
      if (!m.stage.startsWith('G') || m.date > upTo) continue;
      if (m.a === c) { p++; gf += m.ga; ga += m.gb; pts += m.ga > m.gb ? (three ? 3 : 2) : m.ga === m.gb ? 1 : 0; }
      if (m.b === c) { p++; gf += m.gb; ga += m.ga; pts += m.gb > m.ga ? (three ? 3 : 2) : m.ga === m.gb ? 1 : 0; }
    }
    return { c, p, pts, gf, ga };
  }).sort((x, y) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf);
}
