// =============================================================================
// Sponsoring 2.0 — gemeinsame Anzeige-Bausteine (Seite + Verhandlung).
// =============================================================================
import { COUNTRY_BY_ID, INDUSTRY_BY_ID, SLOT_BY_ID } from '../../../data/sponsorCatalog';
import { clauseLabel, clauseTone } from '../../../engine/sponsorship';
import { economyScale } from '../../../engine/economy';
import type { SponsorBonuses, SponsorClause, SponsorDeal, SponsorDealOffer } from '../../../types/sponsor';
import { fmtDM } from '../../../ui/format';

/** Branche · Herkunft. */
export function partnerMeta(x: SponsorDeal | SponsorDealOffer): string {
  const ind = INDUSTRY_BY_ID[x.industry]?.name ?? x.industry;
  const c = COUNTRY_BY_ID[x.country]?.name ?? x.country;
  return x.country === 'DE' ? ind : `${ind} · ${c}`;
}

export function slotName(x: { slot: SponsorDeal['slot'] }): string {
  return SLOT_BY_ID[x.slot]?.name ?? x.slot;
}

/** Jahreswert nominal im laufenden Jahr. */
export function yearly(base: number, year: number, cut = 0): number {
  return Math.round(base * (1 - cut) * economyScale(year));
}

/** Klauseln als ruhige Liste (Punkt in der Tonfarbe). */
export function ClauseList({ clauses, compact }: { clauses: SponsorClause[]; compact?: boolean }) {
  if (!clauses.length) return <span className="sp-none">keine besonderen Klauseln</span>;
  return (
    <span className={`sp-clauses ${compact ? 'compact' : ''}`}>
      {clauses.map((k, i) => <span key={i} className={`sp-clause ${clauseTone(k)}`}>{clauseLabel(k)}</span>)}
    </span>
  );
}

/** Erfolgsprämien kurz (1975-Basis → nominal). */
export function bonusText(b: SponsorBonuses, year: number): string {
  const s = economyScale(year);
  const parts: string[] = [];
  if (b.title) parts.push(`Meister ${fmtDM(b.title * s)}`);
  if (b.cup) parts.push(`Pokal ${fmtDM(b.cup * s)}`);
  if (b.euro) parts.push(`Europa ${fmtDM(b.euro * s)}`);
  if (b.survive) parts.push(`Klassenerhalt ${fmtDM(b.survive * s)}`);
  return parts.join(' · ');
}

/** Ende eines Vertrags als Saison-Text („bis 2027“). */
export function untilText(season: string, yearsLeft: number): string {
  return `bis ${Number(season.slice(0, 4)) + yearsLeft}`;
}
