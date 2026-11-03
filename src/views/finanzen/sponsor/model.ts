// =============================================================================
// Sponsoring — Anzeigedaten der vier Reiter (nur gelesen, Rechnung unverändert):
// Einteilung der Werbeflächen in Hauptsponsor / Pyramide / Banden, Kacheln je
// Platz (Vertrag, frei, gesperrt), Einnahmen je Art, Firmenzeichen der Namensrechte.
// Logik: engine/sponsorship.ts, game/sponsorGame.ts · Flächen: data/sponsorCatalog.ts
// =============================================================================
import { SLOT_BY_ID, type SponsorSlotDef } from '../../../data/sponsorCatalog';
import { namingAnnualNominal } from '../../../engine/clubBusiness';
import { yearOf } from '../../../engine/economy';
import { dealAnnualNominal, slotOpen } from '../../../engine/sponsorship';
import { clubTierNow } from '../../../game/sponsorGame';
import type { Game } from '../../../game/state';
import type { Club } from '../../../types';
import type { SponsorDeal, SponsorDealOffer, SponsorIndustry, SponsorSlotId } from '../../../types/sponsor';

export type SpTab = 'haupt' | 'namen' | 'pyramide' | 'banden';

/** Flächen je Reiter bzw. Ebene der Pyramide. */
export const SHIRT_SLOTS: SponsorSlotId[] = ['brust', 'ausruester', 'aermel'];
export const BOARD_SLOTS: SponsorSlotId[] = ['banden', 'wetten'];
export const PYRAMID: { id: 'premium' | 'neben' | 'lokal'; name: string; short: string; slots: SponsorSlotId[] }[] = [
  { id: 'premium', name: 'Premium-Sponsoren', short: 'Premium', slots: ['premium', 'trainingswear', 'digital'] },
  { id: 'neben', name: 'Nebensponsoren', short: 'Neben', slots: ['copartner', 'krypto'] },
  { id: 'lokal', name: 'Lokale Sponsoren', short: 'Lokal', slots: ['regional', 'jugend'] },
];

/** Ziel eines Klicks/Rechtsklicks. */
export type SpTarget =
  | { kind: 'deal'; id: string }
  | { kind: 'offer'; id: string }
  | { kind: 'free'; slot: SponsorSlotId }
  | { kind: 'locked'; slot: SponsorSlotId }
  | { kind: 'naming' }
  | { kind: 'namingOffer'; idx: number }
  | { kind: 'stand'; id: string };

export type Tile =
  | { kind: 'deal'; key: string; slot: SponsorSlotId; deal: SponsorDeal }
  | { kind: 'free'; key: string; slot: SponsorSlotId; offers: number }
  | { kind: 'locked'; key: string; slot: SponsorSlotId; why: string };

export interface SpCtx {
  g: Game;
  club: Club;
  year: number;
  tier: number;
  deals: SponsorDeal[];
  offers: SponsorDealOffer[];
}

export function spContext(g: Game): SpCtx {
  const club = g.clubs[g.managedClubId];
  const com = club.commerce ?? (club.commerce = { cateringMode: 'verpachtung' });
  const offers = [...(com.dealOffers ?? [])].sort((a, b) => Number(!!b.renewal) - Number(!!a.renewal) || b.annualValue - a.annualValue);
  return { g, club, year: yearOf(g.calendar.currentDate), tier: clubTierNow(g, club), deals: com.deals ?? [], offers };
}

/** Grund, warum eine Fläche (noch) nicht vermarktet werden kann. */
export function lockReason(def: SponsorSlotDef, year: number, tier: number): string {
  if (year < def.unlock) return `ab ${def.unlock}/${String(def.unlock + 1).slice(2)}`;
  if (def.until != null && year > def.until) return `bis ${def.until}/${String(def.until + 1).slice(2)}`;
  return tier > 1 ? 'nicht in dieser Liga' : 'derzeit nicht erlaubt';
}

/** Kacheln einer Flächengruppe: Verträge, freie Plätze, gesperrte Plätze (Vorschau künftiger Flächen). */
export function tilesFor(ctx: SpCtx, slots: SponsorSlotId[], showLocked = true): Tile[] {
  const out: Tile[] = [];
  for (const id of slots) {
    const def = SLOT_BY_ID[id];
    const mine = ctx.deals.filter((d) => d.slot === id);
    mine.forEach((d) => out.push({ kind: 'deal', key: d.id, slot: id, deal: d }));
    if (slotOpen(def, ctx.year, ctx.tier)) {
      const free = def.count(ctx.year, ctx.tier) - mine.length;
      const n = ctx.offers.filter((o) => o.slot === id && !o.renewal).length;
      for (let i = 0; i < free; i++) out.push({ kind: 'free', key: `${id}-f${i}`, slot: id, offers: i === 0 ? n : 0 });
    } else if (showLocked && !mine.length) {
      // Künftige Fläche: so viele Plätze, wie sie zum Start hätte (mind. 1).
      const yr = Math.max(ctx.year, def.unlock);
      const n = def.until != null && ctx.year > def.until ? 1 : Math.max(1, def.count(yr, ctx.tier));
      for (let i = 0; i < n; i++) out.push({ kind: 'locked', key: `${id}-l${i}`, slot: id, why: lockReason(def, ctx.year, ctx.tier) });
    }
  }
  return out;
}

export const dealValue = (ctx: SpCtx, d: SponsorDeal) => Math.round(dealAnnualNominal(d, ctx.year));
export const sumDeals = (ctx: SpCtx, slots: SponsorSlotId[]) =>
  ctx.deals.filter((d) => slots.includes(d.slot)).reduce((a, d) => a + dealAnnualNominal(d, ctx.year), 0);

/** Einnahmen dieser Saison je Art (Jahreswerte nominal). */
export function incomeRows(ctx: SpCtx): { label: string; value: number; tab?: SpTab }[] {
  const nr = ctx.club.namingRights;
  return [
    { label: 'Hauptsponsor (Brust)', value: sumDeals(ctx, ['brust']), tab: 'haupt' },
    { label: 'Ausrüster', value: sumDeals(ctx, ['ausruester']), tab: 'haupt' },
    ...(ctx.year >= 2017 || sumDeals(ctx, ['aermel']) ? [{ label: 'Ärmel', value: sumDeals(ctx, ['aermel']), tab: 'haupt' as SpTab }] : []),
    { label: 'Namensrechte', value: nr ? namingAnnualNominal(nr, ctx.club, ctx.year) : 0, tab: 'namen' },
    ...PYRAMID.map((l) => ({ label: l.name, value: sumDeals(ctx, l.slots), tab: 'pyramide' as SpTab })),
    { label: 'Bandenwerbung', value: sumDeals(ctx, BOARD_SLOTS), tab: 'banden' },
  ];
}

/** Firmenzeichen der Namensrechte-Interessenten (Branche aus dem Namen). */
export function namingIndustry(name: string): SponsorIndustry {
  const n = name.toLowerCase();
  const rules: [RegExp, SponsorIndustry][] = [
    [/versicherung|assekuranz/, 'versicherung'], [/bank|finanz|sparkasse/, 'bank'], [/energie|solar|strom|gas/, 'energie'],
    [/logistik|versand|werft|express|cargo/, 'logistik'], [/brauerei|bräu|quell/, 'brauerei'], [/stahl|bau|immobil/, 'bau'],
    [/telekom|mobilfunk|funk/, 'telekom'], [/auto/, 'auto'], [/software|medien|digital|tech/, 'tech'],
  ];
  return rules.find(([r]) => r.test(n))?.[1] ?? 'handel';
}

/** Saison-Text „bis 2027/28“ aus Restlaufzeit. */
export function untilSeason(season: string, yearsLeft: number): string {
  const y = Number(season.slice(0, 4)) + yearsLeft;
  return `${y - 1}/${String(y).slice(2)}`;
}

/** Laufzeit kurz („3 J.“ / „1 Jahr“). */
export const yearsText = (n: number) => (n === 1 ? '1 Jahr' : `${n} Jahre`);
