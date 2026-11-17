// =============================================================================
// LEIHE — Bedingungen, Bewertung und Antworten (Wunsch Pascal: Leihen mit
// realistischen Bedingungen). Reine Rechnung ohne Spielstand-Zugriff; der Ablauf
// liegt in game/loanTalks.ts (du leihst aus), game/loanMarket.ts (du verleihst)
// und game/loanLife.ts (Laufzeit, Rückruf, Saisonende). Regeln je Epoche in
// data/loanRules.ts.
//
// Bausteine einer Leihe: Laufzeit (halbe Saison, bis Saisonende, zwei Spielzeiten),
// Leihgebühr, Anteil am Gehalt, den der Leihverein trägt, Kaufoption, Kaufpflicht
// (unbedingt, nach Einsätzen oder bei Klassenerhalt), Einsatzgarantie mit Strafzahlung,
// Rückrufklausel zum Winter, kein Einsatz gegen den Stammverein, keine Weiterverleihung.
//
// Der abgebende Verein bewertet ein Angebot in Geld (1975-Basis): eingesparte Gehälter
// + Leihgebühr + was ihm die Klauseln wert sind. Junge Spieler, die Spielpraxis
// brauchen, gibt er gern ab – aber nur dorthin, wo sie spielen; Stammspieler kaum.
// =============================================================================
import type { Player, Position } from '../types';
import { GROUP_OF, type PosGroup } from './aiManager';

export type ObligationCond = 'always' | 'apps' | 'stay';

export interface LoanTerms {
  /** Ende der Leihe (ISO, 31.12. oder 30.6.). */
  until: string;
  /** Leihgebühr (1975-Basis). */
  fee: number;
  /** Anteil des Gehalts, den der Leihverein trägt (0,25–1). */
  share: number;
  /** Kaufoption (1975-Basis); fehlt = keine. */
  optionFee?: number;
  /** Kaufpflicht: Preis und Bedingung (Einsätze für den Leihverein bzw. Klassenerhalt des Leihvereins). */
  obligation?: { fee: number; cond: ObligationCond; apps?: number };
  /** Einsatzgarantie: so viele Pflichtspiele, sonst Strafzahlung `penalty` (1975-Basis). */
  minApps?: number; penalty?: number;
  /** Rückrufklausel: Der Stammverein darf ihn im Januar zurückholen. */
  recall?: boolean;
  /** Kein Einsatz gegen den Stammverein. */
  noParent?: boolean;
  /** Keine Weiterverleihung an einen dritten Verein. */
  noSublet?: boolean;
}

/** Am Spieler gespeicherte Leihe (Player.loan.deal): Bedingungen + Bilanz beim Leihverein. */
export interface LoanDeal extends Omit<LoanTerms, 'until' | 'optionFee'> {
  since: string;
  /** Stärke zu Beginn. */
  ov0: number;
  /** Saisonwerte zu Beginn bzw. nach dem Saisonwechsel: Einsätze, Startelf, Minuten, Tore. */
  base: [number, number, number, number];
  /** Aus früheren Spielzeiten der Leihe aufsummiert. */
  acc: [number, number, number, number];
  /** Strafzahlung/Kaufpflicht am Ende schon abgerechnet. */
  settled?: boolean;
}

export type LoanClause = 'until' | 'fee' | 'share' | 'option' | 'obligation' | 'minApps' | 'recall' | 'noParent' | 'noSublet';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
export const r5k = (x: number) => Math.max(0, Math.round(x / 5000) * 5000);

/** Stammkräfte je Positionsgruppe in einer üblichen Elf. */
const STARTERS: Record<PosGroup, number> = { TW: 1, IV: 2, RV: 1, LV: 1, ZM: 3, RF: 1, LF: 1, ST: 2 };

export type SquadRole = 'start' | 'rotation' | 'bench';

/** Rolle, die der Spieler in diesem Kader hätte (nach Stärke in seiner Positionsgruppe). */
export function expectedRole(p: Player, squad: Player[]): SquadRole {
  const grp = GROUP_OF[p.naturalPosition as Position];
  const better = squad.filter((x) => x.id !== p.id && GROUP_OF[x.naturalPosition as Position] === grp && x.overall > p.overall + 1).length;
  const n = STARTERS[grp] ?? 1;
  return better < n ? 'start' : better < n + 1 || better < n + 2 && grp === 'ZM' ? 'rotation' : 'bench';
}
export const ROLE_DE: Record<SquadRole, string> = { start: 'Stammspieler', rotation: 'Rotation', bench: 'Reservist' };

/** Monate von heute bis zum Leihende (mindestens 1). */
export function loanMonths(today: string, until: string): number {
  const a = Date.parse(today + 'T00:00:00Z'), b = Date.parse(until + 'T00:00:00Z');
  return clamp(Math.round((b - a) / (30.44 * 86400000)), 1, 24);
}

/** Einsätze, Startelf, Minuten und Tore beim Leihverein (aus Saisonwerten, Stand heute). */
export function loanStats(p: Player): { apps: number; starts: number; minutes: number; goals: number } {
  const d = p.loan?.deal;
  const s = p.seasonStats;
  const cur = [s?.appearances ?? 0, s?.starts ?? 0, s?.minutesPlayed ?? 0, s?.goals ?? 0];
  const base = d?.base ?? [0, 0, 0, 0], acc = d?.acc ?? [0, 0, 0, 0];
  const v = cur.map((x, i) => acc[i] + Math.max(0, x - base[i]));
  return { apps: v[0], starts: v[1], minutes: v[2], goals: v[3] };
}

// -----------------------------------------------------------------------------
// Haltung des abgebenden Vereins
// -----------------------------------------------------------------------------
export interface LenderCtx {
  year: number;
  /** Platz des Spielers im Kader des Stammvereins nach Stärke (0 = bester). */
  rank: number;
  /** Rolle beim Leihverein. */
  role: SquadRole;
  /** Ansehen Stammverein / Leihverein. */
  lenderRep: number; borrowerRep: number;
  /** Stammverein braucht Geld. */
  broke: boolean;
  /** Häufigkeit der Leihen in der Epoche (data/loanRules.ts). */
  frequency: number;
  /** Laufzeit in Monaten. */
  months: number;
  /** Fester Wert 0..1 für Härte (aus Spieler/Verein/Datum). */
  seed: number;
}

export interface LenderStance {
  /** Grund, warum er gar nicht verleiht (Stammspieler, Leistungsträger). */
  refuse?: string;
  /** Er will, dass der Spieler spielt (Talent) – ohne Einsatzgarantie bei Reservistenrolle kein Geschäft. */
  wantsMinutes: boolean;
  /** Er will ihn langfristig behalten (Talent mit großer Zukunft): Kaufpflicht/billige Option schreckt ab. */
  keeper: boolean;
  /** Gehalt im Leihzeitraum (1975-Basis). */
  wageCost: number;
  /** Forderung als Wert und seine Wunschbedingungen. */
  ask: number; walkaway: number; hardness: number; patience: number;
  wish: { share: number; fee: number };
  /** Wichtigkeit je Punkt 0–3 (Anzeige). */
  weights: Partial<Record<LoanClause, number>>;
}

export function lenderStance(p: Player, c: LenderCtx): LenderStance {
  const young = p.age <= 21;
  const room = (p.development?.potentialAbility ?? p.overall) - p.overall;
  const wantsMinutes = young || (p.age <= 23 && room >= 6);
  const keeper = young && (room >= 10 || p.potentialStars >= 4);
  const wageCost = p.contract.weeklyWage * 52 * c.months / 12;
  const mv = p.contract.transferValue;
  let refuse: string | undefined;
  if (c.rank < 3) refuse = 'Er ist ein Leistungsträger – den verleihen wir nicht.';
  else if (c.rank < 11 && !(young && c.rank >= 8)) refuse = 'Er ist Stammspieler bei uns – eine Leihe kommt nicht infrage.';
  // Junge Spieler, die beim Leihverein nur auf der Bank säßen, gibt kaum ein Verein her.
  const hardness = clamp(0.25 + c.seed * 0.5 + (c.frequency < 0.5 ? 0.15 : 0), 0, 1);
  // Wunsch: volles Gehalt bei Ergänzungsspielern, Talente gegen Teilübernahme, wenn sie dafür spielen.
  const share = clamp((wantsMinutes ? 0.75 : 1) + (c.broke ? 0.15 : 0) - (c.lenderRep > c.borrowerRep + 15 && wantsMinutes ? 0.1 : 0), 0.5, 1);
  const feeF = (c.year < 1990 ? 0.02 : 0.06) * (c.rank < 15 ? 1.4 : 0.8) * (c.broke ? 1.4 : 1) * (wantsMinutes ? 0.7 : 1);
  const fee = r5k(mv * feeF * Math.min(1.5, c.months / 10));
  const ask = Math.max(5000, share * wageCost + fee) * (1 + (1 - c.frequency) * 0.25);
  return {
    refuse, wantsMinutes, keeper, wageCost, ask, walkaway: ask * (0.8 + hardness * 0.12), hardness,
    patience: Math.round(45 + (1 - hardness) * 35 + c.frequency * 10), wish: { share, fee },
    weights: {
      share: 3, fee: c.broke ? 3 : 2, minApps: wantsMinutes ? 3 : 0, option: keeper ? 3 : 1, obligation: keeper ? 3 : 2,
      recall: wantsMinutes ? 1 : 0, noParent: 1, noSublet: 2, until: 1,
    },
  };
}

/** Faktor, wie wahrscheinlich eine Kaufpflicht-Bedingung eintritt (aus Sicht des Stammvereins). */
const OBL_P: Record<ObligationCond, number> = { always: 1, apps: 0.6, stay: 0.7 };

/** Was die Bausteine dem Stammverein wert sind (1975-Basis), einzeln für die Anzeige. */
export function lenderParts(t: LoanTerms, p: Player, st: LenderStance, role: SquadRole): { key: LoanClause; label: string; value: number }[] {
  const mv = p.contract.transferValue;
  const out: { key: LoanClause; label: string; value: number }[] = [
    { key: 'share', label: 'Gehaltsübernahme', value: t.share * st.wageCost },
    { key: 'fee', label: 'Leihgebühr', value: t.fee },
  ];
  if (t.optionFee) out.push({ key: 'option', label: 'Kaufoption', value: t.optionFee >= mv ? mv * 0.03 : -(mv - t.optionFee) * (st.keeper ? 0.45 : 0.2) - (st.keeper ? mv * 0.05 : 0) });
  if (t.obligation) {
    const q = OBL_P[t.obligation.cond];
    out.push({ key: 'obligation', label: 'Kaufpflicht', value: q * ((t.obligation.fee - mv * 0.9) * 0.5 + mv * 0.08) - (st.keeper ? q * mv * 0.3 : 0) });
  }
  if (t.minApps) {
    const need = st.wantsMinutes ? (role === 'bench' ? 0.35 : 0.2) : 0.05;
    out.push({ key: 'minApps', label: 'Einsatzgarantie', value: st.wageCost * need * Math.min(1, t.minApps / 20) + (t.penalty ?? 0) * 0.3 });
  }
  if (t.recall) out.push({ key: 'recall', label: 'Rückrufklausel', value: st.wageCost * 0.08 });
  if (t.noParent) out.push({ key: 'noParent', label: 'Kein Einsatz gegen ihn', value: st.wageCost * 0.05 });
  if (t.noSublet) out.push({ key: 'noSublet', label: 'Keine Weiterverleihung', value: st.wageCost * 0.03 });
  return out;
}

export function lenderValue(t: LoanTerms, p: Player, st: LenderStance, role: SquadRole): number {
  return lenderParts(t, p, st, role).reduce((s, x) => s + x.value, 0);
}

export type LoanAnswer =
  | { kind: 'accept'; text: string }
  | { kind: 'counter'; ask: number; text: string; loss: number }
  | { kind: 'breakoff'; text: string };

/** Antwort des Stammvereins auf ein Leihangebot. */
export function lenderAnswer(st: LenderStance, curAsk: number, value: number, round: number, patience: number, rnd: number): LoanAnswer {
  if (value >= curAsk * 0.985 || (value >= st.walkaway && rnd < 0.15 + 0.15 * round)) return { kind: 'accept', text: 'Einverstanden – so machen wir das.' };
  const ratio = value / Math.max(1, curAsk);
  const loss = ratio < 0.6 ? 30 : ratio < 0.85 ? 16 : 7;
  if (patience - loss <= 0) return { kind: 'breakoff', text: 'So kommen wir nicht zusammen. Wir behalten ihn.' };
  const conc = clamp(0.2 + 0.08 * Math.min(round, 3) - st.hardness * 0.1, 0.08, 0.45);
  const ask = Math.max(st.walkaway, curAsk - (curAsk - value) * conc);
  const text = ratio < 0.6 ? 'Damit kommen wir nicht einmal auf seine Gehaltskosten.'
    : ratio < 0.85 ? 'Da fehlt noch einiges – mehr Gehalt übernehmen oder eine Leihgebühr.'
      : 'Wir sind nah dran. Noch ein kleines Stück.';
  return { kind: 'counter', ask, text, loss };
}

/** Gegenvorschlag: deine Bedingungen, ergänzt um seine Pflichtpunkte, der Rest über Gehaltsanteil und Leihgebühr. */
export function lenderCounter(t: LoanTerms, p: Player, st: LenderStance, role: SquadRole, ask: number, must: Partial<LoanTerms>): LoanTerms {
  const c: LoanTerms = { ...t, ...must };
  let gap = ask - lenderValue(c, p, st, role);
  if (gap > 0 && c.share < 1) {
    const add = Math.min(1 - c.share, gap / Math.max(1, st.wageCost));
    c.share = Math.min(1, Math.ceil((c.share + add - 1e-9) * 4) / 4); // Viertelschritte wie am Tisch
    gap = ask - lenderValue(c, p, st, role);
  }
  if (gap > 0) c.fee = r5k(c.fee + gap + 2500);
  return c;
}

// -----------------------------------------------------------------------------
// Der Spieler
// -----------------------------------------------------------------------------
/** Ist der Spieler mit der Leihe einverstanden? Er geht nur dorthin, wo er spielt. */
export function playerConsent(p: Player, role: SquadRole, rankAtParent: number, t: Pick<LoanTerms, 'minApps'>, borrowerRep: number, parentRep: number): { ok: boolean; text: string } {
  if (role === 'bench' && !(t.minApps && t.minApps >= 10)) return { ok: false, text: `${p.lastName} will nur verliehen werden, wenn er dort spielt – bei euch säße er auf der Bank.` };
  if (p.age >= 29 && rankAtParent < 14 && role !== 'start') return { ok: false, text: `${p.lastName} sieht sich nicht als Leihspieler, schon gar nicht als Ergänzung.` };
  if (borrowerRep < parentRep - 30 && p.age >= 24 && role !== 'start') return { ok: false, text: `Für ${p.lastName} wäre das ein zu großer Schritt nach unten.` };
  return { ok: true, text: role === 'start' ? `${p.lastName} freut sich auf Spielpraxis als Stammspieler.` : `${p.lastName} will sich bei euch durchsetzen.` };
}

// -----------------------------------------------------------------------------
// Angebot eines KI-Vereins für einen deiner Spieler
// -----------------------------------------------------------------------------
export interface BidCtx {
  year: number; until: string; months: number; rich: number; need: number; rnd: () => number;
  clauses: { option: boolean; obligation: boolean; minApps: boolean; recall: boolean };
  feeCommon: boolean; noParent: boolean; noSublet: boolean;
}
export function aiLoanBid(p: Player, c: BidCtx): LoanTerms {
  const mv = p.contract.transferValue;
  const t: LoanTerms = {
    until: c.until,
    share: clamp(Math.round((0.55 + c.rich * 0.35 + c.need * 0.1 + c.rnd() * 0.15) * 20) / 20, 0.5, 1),
    fee: c.feeCommon && c.rnd() < 0.4 ? r5k(mv * (0.03 + c.rnd() * 0.05)) : 0,
    noParent: c.noParent || undefined, noSublet: c.noSublet || undefined,
  };
  if (c.clauses.option && c.rnd() < 0.35) t.optionFee = r5k(mv * (1.0 + c.rnd() * 0.4));
  else if (c.clauses.obligation && c.rnd() < 0.2) t.obligation = { fee: r5k(mv * (0.9 + c.rnd() * 0.3)), cond: 'apps', apps: 20 };
  if (c.clauses.minApps && p.age <= 22 && c.rnd() < 0.3) { t.minApps = 15; t.penalty = r5k(Math.max(10000, mv * 0.05)); }
  if (c.clauses.recall && c.rnd() < 0.25) t.recall = true;
  return t;
}

/** Bedingungen als lesbare Zeilen (Nachricht, Profil, Abschluss). */
export function termsLines(t: Partial<LoanTerms>, fmt: (v: number) => string, dateFmt: (iso: string) => string, wageText?: string): { k: string; v: string }[] {
  const OBL: Record<ObligationCond, string> = { always: 'unbedingt', apps: `ab ${t.obligation?.apps ?? 20} Einsätzen`, stay: 'bei Klassenerhalt des Leihvereins' };
  return [
    ...(t.until ? [{ k: 'Laufzeit bis', v: dateFmt(t.until) }] : []),
    { k: 'Leihgebühr', v: t.fee ? fmt(t.fee) : 'keine' },
    { k: 'Gehalt trägt der Leihverein', v: `${Math.round((t.share ?? 1) * 100)} %${wageText ? ` (${wageText})` : ''}` },
    ...(t.optionFee ? [{ k: 'Kaufoption', v: fmt(t.optionFee) }] : []),
    ...(t.obligation ? [{ k: 'Kaufpflicht', v: `${fmt(t.obligation.fee)} – ${OBL[t.obligation.cond]}` }] : []),
    ...(t.minApps ? [{ k: 'Einsatzgarantie', v: `${t.minApps} Pflichtspiele, sonst ${fmt(t.penalty ?? 0)}` }] : []),
    ...(t.recall ? [{ k: 'Rückrufklausel', v: 'im Januar' }] : []),
    ...(t.noParent ? [{ k: 'Gegen den Stammverein', v: 'kein Einsatz' }] : []),
    ...(t.noSublet ? [{ k: 'Weiterverleihung', v: 'ausgeschlossen' }] : []),
  ];
}
