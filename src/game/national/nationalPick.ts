// =============================================================================
// NATIONALTRAINER – Aufgebot (Wunsch Pascal). Je Länderspielfenster bzw. Turnier ein
// `NjPick` im Spielstand (`nationalJob.pick`): Vorschlag des Co-Trainers = `pickSquad`
// wie ohne Nationaltrainer; änderst du nichts (`touched` false), nominiert er am Stichtag
// genau so wie bisher. Termin „Aufgebot nominieren“ = Nachricht mit Entscheidung
// (`nt_nominate`) → die Zeit hält an, bis du bestätigst (Stichtag = Fensterbeginn bzw.
// Turnier-Nominierung 25 Tage vor dem Anpfiff).
// Stärke: `nationStrength` aus deinem Aufgebot/deiner Startelf; mit gewählter Formation
// kostet jeder Spieler außerhalb seines Mannschaftsteils 0,5 Stärke (`MISFIT`).
// Nicht nominierte bessere Spieler: kleiner Moral-Dämpfer (eigener Verein) + Presse-Echo.
// =============================================================================
import type { Game } from '../state';
import type { Position } from '../../types';
import { squadSizeOf } from '../../data/nationalTeams';
import { getFormation, typicalFormations } from '../../data/formations';
import { candidatesByNation, nationStrength, pickSquad, startingXI, type Cand } from './pool';
import { available, natName } from './nationalGame';
import { activeJob, nextCycleDef, tKey, fmtDay, type NationalJob } from './nationalJob';
import { makeMessage, pushMessage } from '../../engine/messages';
import { CHOICE_HANDLERS, chooseEventOption } from '../eventsGame';
import { moraleJolt } from '../moraleJolt';

export interface NjPick {
  /** `w:<erster Spieltag>` (Fenster) bzw. `t:EM 1976` (Turnier). */
  key: string;
  label: string;
  /** Stichtag (dann wird nominiert). */
  date: string;
  size: number;
  ids: string[];
  /** Selbst gewählte Startelf (null = automatisch). */
  xi: string[] | null;
  /** Formation (null = automatisch: beste Elf). */
  formation: string | null;
  /** Du hast das Aufgebot verändert (sonst nominiert der Co-Trainer am Stichtag neu). */
  touched: boolean;
  confirmed: boolean;
  /** Schon nominiert (Fenster/Turnier läuft). */
  used?: boolean;
}

export const MISFIT = 0.5;
const yearOf = (iso: string) => parseInt(iso.slice(0, 4), 10);

export type PosGroup = 'GK' | 'D' | 'M' | 'A';
export function groupOf(pos: Position | string): PosGroup {
  if (pos === 'TW') return 'GK';
  if (pos === 'LIB' || pos === 'IV' || pos === 'RV' || pos === 'LV') return 'D';
  if (pos === 'DM' || pos === 'ZM' || pos === 'RM' || pos === 'LM' || pos === 'OM') return 'M';
  return 'A';
}
/** Bedarf je Mannschaftsteil einer Formation. */
export function formationNeed(id: string): Record<PosGroup, number> {
  const need: Record<PosGroup, number> = { GK: 0, D: 0, M: 0, A: 0 };
  for (const s of getFormation(id).slots) need[groupOf(s.position)]++;
  return need;
}
/** Spieler außerhalb ihres Mannschaftsteils, wenn die Elf diese Formation spielt. */
export function misfits(xi: Cand[], formation: string): number {
  const need = formationNeed(formation);
  const have: Record<PosGroup, number> = { GK: 0, D: 0, M: 0, A: 0 };
  for (const c of xi) have[groupOf(c.pos)]++;
  let miss = 0;
  for (const k of ['GK', 'D', 'M', 'A'] as PosGroup[]) miss += Math.max(0, need[k] - have[k]);
  return miss + Math.max(0, 11 - xi.length);
}
/** Beste Elf für eine Formation: je Mannschaftsteil die Stärksten, Lücken mit den besten Übrigen. */
export function xiForFormation(squad: Cand[], formation: string): Cand[] {
  const need = formationNeed(formation);
  const sorted = [...squad].sort((a, b) => b.ov - a.ov);
  const out: Cand[] = [];
  for (const k of ['GK', 'D', 'M', 'A'] as PosGroup[]) out.push(...sorted.filter((c) => groupOf(c.pos) === k).slice(0, need[k]));
  for (const c of sorted) { if (out.length >= 11) break; if (!out.includes(c) && c.pos !== 'TW') out.push(c); }
  return out.slice(0, 11);
}
/** Formationen zur Auswahl (typisch für das Jahr). */
export const formationChoices = (year: number) => typicalFormations(year).map((f) => ({ id: f.id, label: f.label }));

/** Stärke eines Aufgebots mit Startelf/Formation – ohne beides genau die bisherige Rechnung. */
export function squadStrength(nat: string, squad: Cand[], year: number, depth: number, xiIds: string[] | null, formation: string | null): { strength: number; xi: Cand[]; misfit: number } {
  let xi: Cand[] | undefined;
  if (xiIds?.length) { const by = new Map(squad.map((c) => [c.id, c])); xi = xiIds.map((id) => by.get(id)).filter((c): c is Cand => !!c); if (!xi.length) xi = undefined; }
  if (!xi && formation) xi = xiForFormation(squad, formation);
  const miss = formation && xi ? misfits(xi, formation) : 0;
  const s = nationStrength(nat, squad, year, depth, xi);
  return { strength: Math.round((s - miss * MISFIT) * 10) / 10, xi: xi ?? startingXI(squad), misfit: miss };
}

// -----------------------------------------------------------------------------
// Anlegen, Nachricht, Entscheidung
// -----------------------------------------------------------------------------
const sizeFor = (key: string, year: number) => (key.startsWith('w:') ? Math.min(23, squadSizeOf(year)) : squadSizeOf(year));

export function createPick(g: Game, job: NationalJob, o: { key: string; label: string; date: string; size: number; year: number }, today: string): void {
  if (job.pick?.key === o.key) return;
  for (const m of g.messages) if (m.eventRef?.type === 'nt_nominate' && !m.eventRef.resolved) { m.eventRef.resolved = 'auto'; m.actionRequired = false; m.resultText = 'Erledigt.'; }
  const size = o.size || sizeFor(o.key, o.year);
  const ids = pickSquad(g, job.nat, today, size, available(g)).map((c) => c.id);
  job.pick = { key: o.key, label: o.label, date: o.date, size, ids, xi: null, formation: null, touched: false, confirmed: false };
  const tourn = o.key.startsWith('t:');
  const msg = makeMessage({
    date: today, category: 'general', from: 'Verband', subject: `Aufgebot nominieren: ${o.label}`, actionRequired: true,
    shortText: `Bis ${fmtDay(o.date)} – bis zu ${size} Spieler.`,
    bodyText: `${tourn ? 'Für das Turnier' : `Für ${o.label}`} benennst du dein Aufgebot (bis zu ${size} Spieler, Stichtag ${fmtDay(o.date)}).\n\nDein Co-Trainer hat einen Vorschlag gemacht: Nationalteam › Aufgebot. Dort kannst du Spieler tauschen, eine Formation und deine Startelf wählen. Lässt du alles, wie es ist, nominiert er am Stichtag die Besten.`,
  });
  msg.choices = [
    { id: 'confirm', label: 'Aufgebot bestätigen', hint: 'Dein Aufgebot aus Nationalteam › Aufgebot – unverändert ist das der Vorschlag des Co-Trainers.' },
    { id: 'auto', label: 'Co-Trainer nominieren lassen', hint: 'Er beruft am Stichtag die Besten – wie ohne Nationaltrainer.' },
  ];
  msg.eventRef = { type: 'nt_nominate', deadline: o.date, defaultChoice: 'confirm', data: { key: o.key } };
  pushMessage(g.messages, msg);
}

CHOICE_HANDLERS.nt_nominate = (g, ref, choice) => {
  const job = activeJob(g);
  const p = job?.pick;
  if (!p || p.key !== ref.data?.key || p.used) return { text: 'Das Aufgebot steht bereits.' };
  if (choice === 'auto') { resetPick(g); p.confirmed = true; return { text: 'Dein Co-Trainer nominiert am Stichtag die Besten.' }; }
  p.confirmed = true;
  return { text: p.touched ? `Dein Aufgebot mit ${p.ids.length} Spielern ist gemeldet.` : 'Der Vorschlag des Co-Trainers ist gemeldet.' };
};

/** Offene Nominierungs-Nachricht bestätigen (Knopf auf der Seite). */
export function confirmPick(g: Game): void {
  const job = activeJob(g);
  if (!job?.pick) return;
  const m = g.messages.find((x) => x.eventRef?.type === 'nt_nominate' && !x.eventRef.resolved && x.eventRef.data?.key === job.pick!.key);
  if (m) chooseEventOption(g, m, 'confirm'); else job.pick.confirmed = true;
}

// -----------------------------------------------------------------------------
// Bearbeiten (Seite Nationalteam › Aufgebot)
// -----------------------------------------------------------------------------
function editable(g: Game): NjPick | null { const p = activeJob(g)?.pick; return p && !p.used ? p : null; }
export function togglePick(g: Game, id: string): void {
  const p = editable(g); if (!p) return;
  if (p.ids.includes(id)) { p.ids = p.ids.filter((x) => x !== id); if (p.xi) p.xi = p.xi.filter((x) => x !== id); }
  else if (p.ids.length < p.size) p.ids = [...p.ids, id];
  p.touched = true;
}
export function toggleXI(g: Game, id: string): void {
  const p = editable(g); if (!p || !p.ids.includes(id)) return;
  const pv = pickPreview(g);
  const cur = p.xi ?? pv?.xi.map((c) => c.id) ?? [];
  p.xi = cur.includes(id) ? cur.filter((x) => x !== id) : cur.length < 11 ? [...cur, id] : cur;
  p.touched = true;
}
export function setPickFormation(g: Game, f: string | null): void {
  const p = editable(g); if (!p) return;
  p.formation = f; p.touched = true;
}
export function autoXI(g: Game): void { const p = editable(g); if (p) { p.xi = null; p.touched = true; } }
export function resetPick(g: Game): void {
  const job = activeJob(g); const p = editable(g); if (!job || !p) return;
  p.ids = pickSquad(g, job.nat, g.calendar.currentDate, p.size, available(g)).map((c) => c.id);
  p.xi = null; p.formation = null; p.touched = false;
}

export interface PickPreview { squad: Cand[]; xi: Cand[]; strength: number; autoStrength: number; misfit: number; depth: number }
/** Aufgebot heute: Kandidaten, Startelf, Stärke gegen den Vorschlag des Co-Trainers. */
export function pickPreview(g: Game, date = g.calendar.currentDate): PickPreview | null {
  const job = activeJob(g); const p = job?.pick;
  if (!job || !p) return null;
  const year = yearOf(date);
  const all = candidatesByNation(g, date).get(job.nat) ?? [];
  const by = new Map(all.map((c) => [c.id, c]));
  const squad = p.ids.map((id) => by.get(id)).filter((c): c is Cand => !!c);
  const own = squadStrength(job.nat, squad, year, all.length, p.xi, p.formation);
  const auto = nationStrength(job.nat, pickSquad(g, job.nat, date, p.size, available(g)), year, all.length);
  return { squad, xi: own.xi, strength: own.strength, autoStrength: auto, misfit: own.misfit, depth: all.length };
}

// -----------------------------------------------------------------------------
// Stichtag: dein Aufgebot gilt (game/national/nationalGame.ts)
// -----------------------------------------------------------------------------
/** Aufgebot + Stärke der eigenen Nation für ein Fenster/Turnier; null = nicht deine Nation. */
export function jobSquadFor(g: Game, nat: string, key: string, date: string, size: number): { squad: Cand[]; strength: number } | null {
  const job = activeJob(g);
  if (!job || job.nat !== nat) return null;
  const year = yearOf(date);
  const excl = available(g);
  const auto = pickSquad(g, nat, date, size, excl);
  const all = candidatesByNation(g, date).get(nat) ?? [];
  const p = job.pick?.key === key ? job.pick : null;
  let squad = auto, xiIds: string[] | null = null, formation: string | null = null;
  if (p?.touched) {
    const by = new Map(all.map((c) => [c.id, c]));
    squad = p.ids.map((id) => by.get(id)).filter((c): c is Cand => !!c && !excl(c)).slice(0, size);
    if (!squad.some((c) => c.pos === 'TW')) { const gk = auto.find((c) => c.pos === 'TW'); if (gk) squad = [gk, ...squad].slice(0, size); }
    for (const c of auto) { if (squad.length >= size) break; if (!squad.includes(c) && p.ids.length < size) squad.push(c); }
    xiIds = p.xi; formation = p.formation;
    echo(g, job, squad, auto, p.label);
  } else if (p) formation = p.formation;
  if (p) p.used = true;
  const s = squadStrength(nat, squad, year, all.length, xiIds, formation).strength;
  if (key.startsWith('w:')) {
    const def = nextCycleDef(nat, date);
    const ck = def ? tKey(def) : '';
    if (!job.camp || job.camp.key !== ck) job.camp = { key: ck, s: [], pts: 0, exp: 0, n: 0 };
    job.camp.s.push(s);
  }
  return { squad, strength: s };
}

/** Moral/Presse: bessere Spieler daheim gelassen. */
function echo(g: Game, job: NationalJob, squad: Cand[], auto: Cand[], label: string): void {
  const inSq = new Set(squad.map((c) => c.id));
  const left = auto.filter((c) => !inSq.has(c.id));
  const worst = (grp: PosGroup) => Math.min(...squad.filter((c) => groupOf(c.pos) === grp).map((c) => c.ov), 99);
  for (const c of left) {
    const p = g.players[c.id];
    if (p && p.clubId === g.managedClubId && c.ov >= worst(groupOf(c.pos))) moraleJolt(g, p, -3, 'nicht für die Nationalmannschaft berufen');
  }
  for (const c of squad) {
    const p = g.players[c.id];
    if (p && p.clubId === g.managedClubId && !auto.some((a) => a.id === c.id)) moraleJolt(g, p, 2, 'überraschend in die Nationalmannschaft berufen');
  }
  const snub = left.map((c) => ({ c, gap: c.ov - worst(groupOf(c.pos)) })).filter((x) => x.gap >= 4).sort((a, b) => b.gap - a.gap)[0];
  if (!snub) return;
  job.trust = Math.max(0, job.trust - 2);
  pushMessage(g.messages, makeMessage({
    date: g.calendar.currentDate, category: 'media', from: 'Pressestelle', subject: `Kritik am Aufgebot: Warum fehlt ${snub.c.name}?`,
    shortText: `${natName(job.nat)}: Die Zeitungen wundern sich über deine Nominierung.`,
    bodyText: `Für ${label} hast du ${snub.c.name} (Stärke ${snub.c.ov}) nicht berufen – dabei stehen schwächere Spieler auf seiner Position im Aufgebot. Die Presse fragt nach, der Verband hört mit (Vertrauen −2).`,
  }));
}

/** Kampagnenstärke für die Qualifikation (Ø deiner Fenster + Ergebnisbonus ±3). */
export function ownCampaignStrength(_g: Game, job: NationalJob, key: string, _today: string): number | null {
  const c = job.camp;
  if (!c || c.key !== key || !c.s.length) return null;
  const avg = c.s.reduce((a, v) => a + v, 0) / c.s.length;
  const bonus = c.n ? Math.max(-3, Math.min(3, ((c.pts - c.exp) / c.n) * 6)) : 0;
  return Math.round((avg + bonus) * 10) / 10;
}
