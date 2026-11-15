// =============================================================================
// VERHANDLUNG MIT SPONSOREN — Spielablauf (Wunsch Pascal: wie die Verhandlungen
// mit Spielern, am selben Verhandlungstisch)
// -----------------------------------------------------------------------------
// Rechnung: engine/sponsorNegotiation.ts. Hier: Ausgangslage aus dem Angebot
// (Sponsoring 2.0: `club.commerce.dealOffers`, oder ein Angebot für die
// Namensrechte am Stadion aus game/clubBusiness.ts), Gesprächszustand im
// optionalen `game.sponsorTalks` (Schlüssel = Angebots-ID bzw. `naming:<Firma>`),
// Runden mit Geduld, Abbruch: Der Sponsor zieht sein Angebot zurück (Namensrechte:
// Sperre, die Firma meldet sich eine Weile nicht). Abschluss ausschließlich über
// die vorhandenen Aktionen: `signSponsorOffer` (game/sponsorGame.ts) mit den
// verhandelten Werten bzw. `acceptNaming` (game/clubBusiness.ts). KI unverändert.
// Bildschirm: screens/negotiation/SponsorTalk.tsx.
// =============================================================================
import { SPONSOR_FOCUS, SPONSOR_OPEN, SPONSOR_REPLY } from '../data/sponsorTalkLines';
import { INDUSTRY_BY_ID, SLOT_BY_ID, industryImage } from '../data/sponsorCatalog';
import { CalendarEngine } from '../engine/calendar';
import { namingAnnualNominal } from '../engine/clubBusiness';
import { economyScale, yearOf } from '../engine/economy';
import {
  BONUS_KEYS, buildSponsorDemand, openTerms, SPONSOR_MAX_ROUNDS, sponsorAnswer, SponsorBase, sponsorCost, SponsorDemand, SponsorNegCtx,
  SponsorPoint, SponsorTerms, termsClauses,
} from '../engine/sponsorNegotiation';
import { slotMarketValue, sponsorPull } from '../engine/sponsorship';
import { hash01 } from '../engine/transferMarket';
import type { NamingRights } from '../types';
import type { SponsorDealOffer } from '../types/sponsor';
import { fmtDM } from '../ui/format';
import { acceptNaming, currentNamingOffers } from './clubBusiness';
import { staffAccuracy } from './contractCtx';
import { clubTierNow, rejectSponsorOffer, signSponsorOffer } from './sponsorGame';
import { Game } from './state';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export interface SponsorTalkLog { d: string; who: 'du' | 'sponsor' | 'info'; text: string }

/** Gesprächszustand je Angebot (gespeichert). */
export interface SponsorTalkState {
  kind: 'deal' | 'naming';
  partner: string;
  /** Eröffnungsangebot (Schnappschuss – Maßstab für Position und Ergebnis). */
  base: SponsorBase;
  started: string;
  last: string;
  round: number;
  patience: number;
  start: number;
  /** Aktuelles Angebot des Sponsors (nach Gegenvorschlägen). */
  ask: SponsorTerms;
  /** Kosten des Eröffnungsangebots für den Sponsor (Maßstab der Positionsanzeige). */
  open0: number;
  /** Verlauf je Runde: [Kosten deiner Forderung, Kosten seines Angebots danach]. */
  hist: [number, number][];
  log: SponsorTalkLog[];
  status: 'open' | 'agreed' | 'failed';
  deal?: SponsorTerms;
  endNote?: string;
  blockedUntil?: string;
}

export interface SponsorLever { text: string; side: 1 | -1; w: number }

/** Anlass: Angebot aus Sponsoring 2.0 oder Namensrechte am Stadion. */
export type SponsorSource = { kind: 'deal'; offer: SponsorDealOffer } | { kind: 'naming'; offer: NamingRights };

const talks = (g: Game) => (g.sponsorTalks ??= {});
export const namingKey = (sponsor: string) => `naming:${sponsor}`;
/** Flächen, für die du eine Verlängerungsoption verlangen kannst. */
const OPTION_SLOTS = new Set(['brust', 'ausruester', 'premium', 'copartner']);

function sourceOf(g: Game, key: string): SponsorSource | null {
  const club = g.clubs[g.managedClubId];
  if (key.startsWith('naming:')) {
    const name = key.slice(7);
    const o = currentNamingOffers(g).find((x) => x.sponsor === name);
    return o ? { kind: 'naming', offer: o } : null;
  }
  const o = club?.commerce?.dealOffers?.find((x) => x.id === key);
  return o ? { kind: 'deal', offer: o } : null;
}

function baseOf(src: SponsorSource): SponsorBase {
  if (src.kind === 'naming') {
    const o = src.offer;
    return {
      value: o.annualValue, years: o.untilYear - o.fromYear, range: [3, 10], bonuses: {}, clauses: [], option: false, optionOk: false,
      interest: 0.4 + 0.35 * hash01(`naming|${o.sponsor}|${o.fromYear}`),
    };
  }
  const o = src.offer;
  const def = SLOT_BY_ID[o.slot];
  const option = o.clauses.some((k) => k.kind === 'option');
  return {
    value: o.annualValue, years: o.years, range: [Math.min(def.years[0], o.years), Math.max(def.years[1], o.years)], bonuses: { ...o.bonuses },
    clauses: o.clauses.filter((k) => k.kind !== 'option').map((k) => ({ ...k })), option, optionOk: option || OPTION_SLOTS.has(o.slot),
    interest: o.interest, renewal: o.renewal,
  };
}

/** Chancen auf Titel, Pokal, Europapokal und Klassenerhalt (für die Prämien) – grob aus Ruf und Liga. */
export function sponsorCtx(g: Game, key: string): SponsorNegCtx {
  const club = g.clubs[g.managedClubId];
  const rep = club?.reputation ?? 60;
  const tier = club ? clubTierNow(g, club) : 1;
  return {
    p: {
      title: tier <= 1 ? clamp((rep - 72) / 50, 0.02, 0.35) : 0,
      cup: clamp(0.03 + (rep - 60) / 300, 0.02, 0.15),
      euro: tier <= 1 ? clamp((rep - 62) / 30, 0.05, 0.9) : 0,
      survive: tier <= 2 ? 0.75 : 0,
    },
    seed: `${key}|${g.season}`,
  };
}

/** Nominaler Jahreswert je Einheit der Basis (Sponsoring: × economyScale, Namensrechte: Vermarktungs-Skala × Marke). */
export function sponsorUnit(g: Game, kind: SponsorTalkState['kind']): number {
  const year = yearOf(g.calendar.currentDate);
  if (kind === 'deal') return economyScale(year);
  const club = g.clubs[g.managedClubId];
  return namingAnnualNominal({ sponsor: '', arenaName: '', annualValue: 1_000_000, fromYear: year, untilYear: year + 1 }, club, year) / 1_000_000;
}

/** Was deine Position stärkt (+) oder schwächt (−). */
export function sponsorLevers(g: Game, src: SponsorSource): SponsorLever[] {
  const club = g.clubs[g.managedClubId];
  const today = g.calendar.currentDate;
  const year = yearOf(today);
  const out: SponsorLever[] = [];
  if (src.kind === 'naming') {
    const o = src.offer;
    const i = 0.4 + 0.35 * hash01(`naming|${o.sponsor}|${o.fromYear}`);
    out.push(i >= 0.6 ? { text: 'Die Firma will unbedingt ins Stadion', side: 1, w: 2 } : { text: 'Die Firma prüft auch andere Stadien', side: -1, w: 1 });
    if ((club.stadium?.capacity ?? 0) >= 50000) out.push({ text: 'Großes Stadion – viel Publikum', side: 1, w: 2 });
    else if ((club.stadium?.capacity ?? 0) < 25000) out.push({ text: 'Kleines Stadion', side: -1, w: 1 });
    if (currentNamingOffers(g).length >= 3) out.push({ text: 'Mehrere Interessenten für den Namen', side: 1, w: 2 });
    if (club.namingRights?.sponsor === o.sponsor) out.push({ text: 'Bisheriger Namensgeber – man kennt sich', side: 1, w: 1 });
    if ((g.environment?.tradition ?? 50) >= 70) out.push({ text: 'Traditionsverein – Kunstnamen schrecken ab', side: -1, w: 1 });
    return out;
  }
  const o = src.offer;
  const def = SLOT_BY_ID[o.slot];
  const tier = clubTierNow(g, club);
  out.push(o.interest >= 0.7 ? { text: 'Der Sponsor will unbedingt zu dir', side: 1, w: 3 } : o.interest >= 0.5 ? { text: 'Ernsthaftes Interesse', side: 1, w: 1 } : { text: 'Zurückhaltendes Interesse', side: -1, w: 2 });
  const pull = sponsorPull(club, year, def.reach);
  if (pull >= 1.3) out.push({ text: 'Große Strahlkraft deines Vereins', side: 1, w: 2 });
  else if (pull < 0.7) out.push({ text: 'Kleine Bühne – wenig Reichweite', side: -1, w: 2 });
  const rivals = (club.commerce?.dealOffers ?? []).filter((x) => x.slot === o.slot && x.id !== o.id && !x.renewal).length;
  if (o.renewal) out.push({ text: 'Bisheriger Partner – man kennt sich', side: 1, w: 1 });
  else if (rivals >= 2) out.push({ text: `${rivals} weitere Interessenten für die Fläche`, side: 1, w: 2 });
  else if (rivals === 0) out.push({ text: 'Einziger Interessent für die Fläche', side: -1, w: 2 });
  const market = slotMarketValue(club, o.slot, year, tier);
  if (market > 0 && o.annualValue * economyScale(year) < market * 0.95) out.push({ text: 'Angebot liegt unter dem Marktwert', side: 1, w: 1 });
  if (industryImage(o.industry, year, o.country) > 0) out.push({ text: 'Umstrittene Branche – braucht eine seriöse Bühne', side: 1, w: 1 });
  if (tier > 1) out.push({ text: 'Unterklassig – kleiner Werbemarkt', side: -1, w: 1 });
  if (CalendarEngine.addDays(today, 21) >= o.until) out.push({ text: 'Das Angebot läuft bald aus', side: -1, w: 1 });
  return out;
}

function say(st: SponsorTalkState, d: string, who: SponsorTalkLog['who'], text: string): void {
  st.log.push({ d, who, text });
  if (st.log.length > 30) st.log.splice(0, st.log.length - 30);
}
const pick = (list: string[], seed: string) => list[Math.floor(hash01(seed) * list.length) % list.length];

/** Paket in einem Satz (Beträge nominal). */
export function sponsorTermsLine(t: SponsorTerms, base: SponsorBase, unit: number): string {
  const bn = BONUS_KEYS.filter((k) => (t.bonuses[k] ?? 0) > 0).reduce((a, k) => a + (t.bonuses[k] ?? 0), 0);
  const parts = [`${fmtDM(Math.round(t.value * unit))} pro Jahr`, `${t.years} ${t.years === 1 ? 'Jahr' : 'Jahre'}`,
    bn > 0 && `Prämien bis ${fmtDM(Math.round(bn * unit))}`, t.drop.length > 0 && `${t.drop.length} ${t.drop.length === 1 ? 'Klausel' : 'Klauseln'} gestrichen`,
    t.option && !base.option && 'Verlängerungsoption'];
  return parts.filter(Boolean).join(', ');
}

/** Grund, warum (gerade) nicht verhandelt werden kann – sonst null. */
export function sponsorTalkBlocker(g: Game, key: string): string | null {
  const prev = g.sponsorTalks?.[key];
  if (prev?.blockedUntil && prev.blockedUntil > g.calendar.currentDate) return `${prev.partner} will nach dem Abbruch erst ab ${CalendarEngine.formatDate(prev.blockedUntil)} wieder reden.`;
  return sourceOf(g, key) ? null : 'Das Angebot liegt nicht mehr vor.';
}

/** Gespräch öffnen bzw. fortsetzen. */
export function openSponsorTalk(g: Game, key: string): SponsorTalkState | string {
  const today = g.calendar.currentDate;
  const prev = g.sponsorTalks?.[key];
  const src = sourceOf(g, key);
  if (prev && prev.status === 'open' && src) return prev;
  const block = sponsorTalkBlocker(g, key);
  if (block || !src) return block ?? 'Das Angebot liegt nicht mehr vor.';
  for (const [k, x] of Object.entries(talks(g))) if (x.status !== 'open' && CalendarEngine.addDays(x.last, 120) < today && (!x.blockedUntil || x.blockedUntil < today)) delete talks(g)[k];
  const base = baseOf(src);
  const ctx = sponsorCtx(g, key);
  const start = Math.round(clamp(50 + 70 * base.interest + (base.renewal ? 15 : 0), 50, 120));
  const ask = openTerms(base);
  const partner = src.kind === 'naming' ? src.offer.sponsor : src.offer.partner;
  const st: SponsorTalkState = {
    kind: src.kind, partner, base, started: today, last: today, round: 0, patience: start, start, ask,
    open0: sponsorCost(ask, base, ctx), hist: [], log: [], status: 'open',
  };
  say(st, today, 'sponsor', pick(src.kind === 'naming' ? SPONSOR_OPEN.naming : base.renewal ? SPONSOR_OPEN.renewal : SPONSOR_OPEN.fresh, `${key}|${today}|o`));
  say(st, today, 'sponsor', `„Unser Angebot: ${sponsorTermsLine(ask, base, sponsorUnit(g, src.kind))}.“`);
  talks(g)[key] = st;
  return st;
}

export interface SponsorTalkResult { ok: boolean; done: boolean; text: string }

function clean(t: SponsorTerms, b: SponsorBase): SponsorTerms {
  const bonuses: SponsorTerms['bonuses'] = {};
  for (const k of BONUS_KEYS) { const v = Math.max(0, Math.round((t.bonuses[k] ?? 0) / 500) * 500); if (v > 0 && (b.bonuses[k] ?? 0) > 0) bonuses[k] = v; }
  return {
    value: Math.max(500, Math.round(t.value / 500) * 500), years: clamp(Math.round(t.years), b.range[0], b.range[1]), bonuses,
    drop: [...new Set(t.drop)].filter((i) => b.clauses[i] && b.clauses[i].kind !== 'image' && b.clauses[i].kind !== 'youth').sort((x, y) => x - y),
    option: b.optionOk && !!t.option,
  };
}

/** Eine Runde: Forderung stellen. */
export function submitSponsorDemand(g: Game, key: string, raw: SponsorTerms, locks: SponsorPoint[] = []): SponsorTalkResult {
  const st = g.sponsorTalks?.[key];
  const src = sourceOf(g, key);
  if (!st || st.status !== 'open') return { ok: false, done: true, text: 'Kein offenes Gespräch.' };
  const today = g.calendar.currentDate;
  if (!src) {
    st.status = 'failed'; st.endNote = 'Das Angebot ist inzwischen abgelaufen.';
    say(st, today, 'info', st.endNote);
    return { ok: false, done: true, text: st.endNote };
  }
  const b = st.base;
  const ctx = sponsorCtx(g, key);
  const unit = sponsorUnit(g, st.kind);
  const t = clean(raw, b);
  st.round += 1;
  st.last = today;
  say(st, today, 'du', `Forderung: ${sponsorTermsLine(t, b, unit)}.`);
  const worth = sponsorCost(t, b, ctx);
  const ans = sponsorAnswer(t, b, ctx, st.ask, st.round, locks);
  const seed = `${key}|${today}|${st.round}`;
  if (ans.accepted) {
    st.hist.push([worth, worth]);
    say(st, today, 'sponsor', pick(SPONSOR_REPLY.accept, seed));
    const err = applyDeal(g, src, t, b);
    st.status = err ? 'failed' : 'agreed';
    st.deal = err ? undefined : t;
    st.endNote = err ?? (src.kind === 'naming' ? `Namensrechte an ${st.partner} verkauft – ${fmtDM(Math.round(t.value * unit))} pro Jahr.` : `Vertrag mit ${st.partner} unterschrieben – ${fmtDM(Math.round(t.value * unit))} pro Jahr.`);
    say(st, today, 'info', st.endNote);
    if (err && src.kind === 'deal') mirror(src.offer, st, t, b);
    return { ok: !err, done: true, text: st.endNote };
  }
  st.patience -= ans.patienceLoss;
  say(st, today, 'sponsor', pick(SPONSOR_REPLY[ans.kind], seed));
  st.hist.push([worth, sponsorCost(ans.counter ?? st.ask, b, ctx)]);
  if (st.patience <= 0 || st.round >= SPONSOR_MAX_ROUNDS) {
    st.status = 'failed';
    st.blockedUntil = CalendarEngine.addDays(today, src.kind === 'naming' ? 120 : 60);
    st.endNote = st.patience <= 0 ? `${st.partner} hat die Geduld verloren und zieht das Angebot zurück.` : `Nach ${SPONSOR_MAX_ROUNDS} Runden ohne Einigung zieht ${st.partner} das Angebot zurück.`;
    say(st, today, 'sponsor', pick(SPONSOR_REPLY.breakoff, seed + 'b'));
    if (src.kind === 'deal') rejectSponsorOffer(g, src.offer.id);
    return { ok: false, done: true, text: st.endNote };
  }
  if (ans.focus) {
    const f = ans.focus.startsWith('c') ? b.clauses[Number(ans.focus.slice(1))]?.kind ?? 'value' : ans.focus;
    say(st, today, 'sponsor', SPONSOR_FOCUS[f] ?? SPONSOR_FOCUS.value);
  }
  if (ans.counter) {
    st.ask = ans.counter;
    say(st, today, 'sponsor', `„Unser Vorschlag: ${sponsorTermsLine(ans.counter, b, unit)}.“`);
  }
  if (src.kind === 'deal') mirror(src.offer, st, st.ask, b);
  return { ok: false, done: false, text: st.log[st.log.length - 1]?.text ?? '' };
}

/** Stand am Angebot spiegeln (Karteikarte zeigt Runden, letzte Antwort und die aktuellen Bedingungen). */
function mirror(o: SponsorDealOffer, st: SponsorTalkState, t: SponsorTerms, b: SponsorBase): void {
  o.annualValue = t.value; o.years = t.years; o.bonuses = { ...t.bonuses }; o.clauses = termsClauses(t, b);
  o.rounds = st.round;
  o.reply = [...st.log].reverse().find((l) => l.who === 'sponsor')?.text.replace(/^„|“$/g, '');
}

/** Abschluss über die vorhandenen Aktionen. Fehlertext oder null. */
function applyDeal(g: Game, src: SponsorSource, t: SponsorTerms, b: SponsorBase): string | null {
  if (src.kind === 'naming') {
    acceptNaming(g, { ...src.offer, annualValue: t.value, untilYear: src.offer.fromYear + t.years });
    return null;
  }
  const o = src.offer;
  const keep = { annualValue: o.annualValue, years: o.years, bonuses: o.bonuses, clauses: o.clauses };
  o.annualValue = t.value; o.years = t.years; o.bonuses = { ...t.bonuses }; o.clauses = termsClauses(t, b);
  const err = signSponsorOffer(g, o.id);
  if (err) Object.assign(o, keep);
  return err;
}

/** Gespräch von dir aus beenden. */
export function cancelSponsorTalk(g: Game, key: string): void {
  const st = g.sponsorTalks?.[key];
  if (!st || st.status !== 'open') return;
  st.status = 'failed';
  st.endNote = 'Du hast die Verhandlung beendet. Das Angebot bleibt bestehen.';
  if (st.round > 0) st.blockedUntil = CalendarEngine.addDays(g.calendar.currentDate, 14);
  say(st, g.calendar.currentDate, 'info', st.endNote);
}

/** Alles für den Bildschirm (frisch gerechnet). */
export interface SponsorTalkView {
  key: string;
  src: SponsorSource | null;
  status: 'open' | 'agreed' | 'failed' | 'blocked';
  blocked?: string;
  st: SponsorTalkState | null;
  base: SponsorBase | null;
  ctx: SponsorNegCtx;
  d: SponsorDemand | null;
  ask: SponsorTerms | null;
  /** Vorbelegung deiner Forderung. */
  start: SponsorTerms | null;
  levers: SponsorLever[];
  /** Kosten einer Forderung für den Sponsor relativ zu seinem Eröffnungsangebot (= 1). */
  worth: ((t: SponsorTerms) => number) | null;
  askWorth: number;
  /** Einschätzung deiner Marketingabteilung: bis hierhin geht er mit. */
  zone: [number, number] | null;
  hist: [number, number][];
  /** Nominal je Einheit der Basis. */
  unit: number;
  /** Marktwert der Fläche (nominal, Richtwert) – bei Namensrechten null. */
  market: number | null;
}

export function sponsorTalkView(g: Game, key: string): SponsorTalkView | null {
  const prev = g.sponsorTalks?.[key] ?? null;
  const src = sourceOf(g, key);
  if (!src && !prev) return null;
  const opened = openSponsorTalk(g, key);
  const ctx = sponsorCtx(g, key);
  const kind = src?.kind ?? prev!.kind;
  const unit = sponsorUnit(g, kind);
  const club = g.clubs[g.managedClubId];
  const year = yearOf(g.calendar.currentDate);
  const market = src?.kind === 'deal' ? slotMarketValue(club, src.offer.slot, year, clubTierNow(g, club)) : null;
  const common = { key, src, ctx, levers: src ? sponsorLevers(g, src) : [], unit, market };
  if (typeof opened === 'string') {
    const base = prev?.base ?? (src ? baseOf(src) : null);
    return { ...common, status: prev && prev.status !== 'open' ? prev.status : 'blocked', blocked: opened, st: prev, base, d: base ? buildSponsorDemand(base, ctx) : null,
      ask: null, start: null, worth: null, askWorth: 1, zone: null, hist: (prev?.hist ?? []).map(([o, a]) => [o / Math.max(1, prev!.open0), a / Math.max(1, prev!.open0)] as [number, number]) };
  }
  const st = opened;
  const b = st.base;
  const d = buildSponsorDemand(b, ctx);
  const open0 = Math.max(1, st.open0);
  // Einschätzung: Schärfe wie beim Stab der anderen Verhandlungen (Scouting/Analyse).
  const width = 0.12 - 0.07 * staffAccuracy(g);
  const bias = (hash01(`${key}|${st.started}|zone`) - 0.5) * width * 0.8;
  const need = d.limit / open0;
  const askWorth = sponsorCost(st.ask, b, ctx) / open0;
  const hi = Math.max(askWorth + 0.01, need + bias + width / 2);
  const lo = Math.max(askWorth, Math.min(hi - 0.01, need + bias - width / 2));
  const start: SponsorTerms = { ...st.ask, bonuses: { ...st.ask.bonuses }, drop: [...st.ask.drop], value: Math.round(st.ask.value * 1.2 / 500) * 500 };
  return {
    ...common, status: st.status, st, base: b, d, ask: st.ask, start,
    worth: (t) => sponsorCost(t, b, ctx) / open0, askWorth, zone: [lo, hi],
    hist: st.hist.map(([o, a]) => [o / open0, a / open0] as [number, number]),
  };
}

/** Branche als Wort (Anzeige). */
export const industryName = (id: string) => INDUSTRY_BY_ID[id as keyof typeof INDUSTRY_BY_ID]?.name ?? id;
