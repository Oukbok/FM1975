// =============================================================================
// REGELN MIT VORLAUF: Am 2. Januar kündigt der Verband an, was ab der
// kommenden Saison gilt (Meilensteine der Chronik und Ligareformen). So kannst
// du Kader und Finanzen ein halbes Jahr vorher darauf einstellen.
// =============================================================================
import { makeMessage, pushMessage } from '../engine/messages';
import { LEAGUE_REFORMS } from '../data/reforms';
import { TIMELINE, TIMELINE_TYPE_META } from '../data/timeline';
import { Game } from './state';

export function announceUpcomingRules(g: Game, today: string): void {
  if (today.slice(5) !== '01-02') return;
  const y = Number(today.slice(0, 4));
  const next = `${y}/${String((y + 1) % 100).padStart(2, '0')}`;
  const fired = new Set(g.firedMilestones ?? []);
  const items = TIMELINE.filter((e) => e.season === next && !fired.has(e.id) && e.type !== 'tech')
    .map((e) => `${TIMELINE_TYPE_META[e.type].label}: ${e.title}`);
  const applied = new Set(g.appliedReforms ?? []);
  for (const r of LEAGUE_REFORMS) if (r.effectiveSeason === next && !applied.has(r.reformId)) items.push(`Ligareform: ${r.title} – ${r.qualificationRule}`);
  if (!items.length) return;
  pushMessage(g.messages, makeMessage({
    date: today, category: 'milestone', from: 'Verband',
    subject: `Vorschau: Das ändert sich zur Saison ${next}`,
    shortText: items[0] + (items.length > 1 ? ` (+${items.length - 1} weitere)` : ''),
    bodyText: `Zur kommenden Saison ${next} treten folgende Änderungen in Kraft:\n\n${items.join('\n')}\n\nDie Details stehen ab dem 1. Juli in der Chronik.`,
  }));
}
