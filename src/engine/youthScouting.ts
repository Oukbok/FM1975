// =============================================================================
// TALENTE ANDERER VEREINE — sichten, ansprechen, schützen
// -----------------------------------------------------------------------------
// Deine Scouts sehen nur einen Teil der fremden Akademien (Reichweite wächst mit
// dem Scouting-Personal). Ein Talent abzuwerben ist schwer:
//   • Epochenregeln: bis 1990 wechseln Jugendliche erst ab 16 und selten; ab den
//     1990ern gibt es Förderverträge, ab 2000 Leistungszentren und Ausbildungs-
//     entschädigungen; ab 2010 werben große Vereine schon 14-Jährige an.
//   • Vereine blockieren ihre größten Talente (Fördervertrag / keine Freigabe).
//   • Talente wollen nicht immer umziehen (Heimat, Anpassungsfähigkeit, Alter,
//     Ansehen des neuen Vereins).
// Umgekehrt versuchen größere Vereine, deine Talente abzuwerben – ein
// Fördervertrag schützt sie (kostet jährlich).
// =============================================================================
import { Club, Player, starsToPotential } from '../types';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Mindestalter für einen Vereinswechsel in der Jugend je Epoche. */
export function minYouthMoveAge(year: number): number {
  return year < 1990 ? 16 : year < 2010 ? 15 : 14;
}

/** Förderverträge gibt es ab 1990. */
export function protectionAvailable(year: number): boolean {
  return year >= 1990;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
}

/**
 * Welche fremden Talente kennen deine Scouts? Reichweite 0,15–0,65 je nach
 * Scouting-Wert; die Auswahl wechselt monatlich (neue Sichtungen).
 */
export function visibleForeignYouth(
  clubs: Record<string, Club>, youthPlayers: Record<string, Player>, managedId: string,
  scouting: number, date: string,
): Player[] {
  const year = Number(date.slice(0, 4));
  const reach = clamp(0.15 + scouting * 3.3, 0.15, 0.65);
  const minAge = Math.max(12, minYouthMoveAge(year) - 2);
  const month = date.slice(0, 7);
  const out: Player[] = [];
  for (const c of Object.values(clubs)) {
    if (c.id === managedId || c.id.startsWith('am') || c.id.startsWith('eu_') || c.id.startsWith('w_')) continue;
    for (const id of c.youthPlayerIds ?? []) {
      const p = youthPlayers[id];
      if (!p || p.age < minAge) continue;
      if (hash(`${id}:${month}`) < reach) out.push(p);
    }
  }
  return out.sort((a, b) => scoutMidOf(b) - scoutMidOf(a));
}

export function scoutMidOf(p: Player): number {
  return ((p.scoutedPotentialMin ?? p.potentialStars) + (p.scoutedPotentialMax ?? p.potentialStars)) / 2;
}

/** Ausbildungsentschädigung (1975-Basis). Steigt mit Potenzial und ab 2000 deutlich. */
export function youthCompensation(p: Player, year: number): number {
  const pot = starsToPotential(scoutMidOf(p));
  const eraF = year < 1990 ? 0.5 : year < 2000 ? 1 : year < 2010 ? 1.6 : 2.2;
  const v = 15000 * Math.pow(2, (pot - 70) / 6) * eraF;
  return Math.round(v / 5000) * 5000;
}

export type ApproachOutcome =
  | { ok: true; fee: number; text: string }
  | { ok: false; reason: 'age' | 'blocked' | 'unwilling' | 'budget' | 'cooldown'; text: string };

/**
 * Talent ansprechen. Deterministisch je Talent und Saison (kein „Neu-Würfeln“).
 */
export function approachYouth(
  p: Player, from: Club, to: Club, youthPlayers: Record<string, Player>, date: string, budgetBase: number,
): ApproachOutcome {
  const year = Number(date.slice(0, 4));
  const season = Number(date.slice(5, 7)) >= 7 ? year : year - 1;
  if (p.age < minYouthMoveAge(year)) {
    return { ok: false, reason: 'age', text: `${p.fullName} ist mit ${p.age} Jahren noch zu jung für einen Vereinswechsel (Mindestalter ${minYouthMoveAge(year)}).` };
  }
  // Fördervertrag beim eigenen Verein?
  if ((p.development.protectedUntil ?? 0) >= season) {
    return { ok: false, reason: 'blocked', text: `${from.name} hat ${p.fullName} mit einem Fördervertrag gebunden – keine Chance.` };
  }
  // Vereine blockieren ihre zwei größten Talente, wenn sie nicht deutlich kleiner sind.
  const ranked = (from.youthPlayerIds ?? []).map((id) => youthPlayers[id]).filter(Boolean)
    .sort((a, b) => b.potentialStars - a.potentialStars);
  const top2 = ranked.slice(0, 2).some((x) => x.id === p.id);
  if (top2 && (from.reputation ?? 50) >= (to.reputation ?? 50) - 12) {
    return { ok: false, reason: 'blocked', text: year < 1990
      ? `${from.name} gibt ${p.fullName} nicht frei – er gilt dort als das größte Talent des Vereins.`
      : `${from.name} blockt ab: ${p.fullName} ist eines ihrer größten Talente und soll einen Fördervertrag bekommen.` };
  }
  // Wechselwille.
  const d = p.development;
  let will = 0.45 + ((to.reputation ?? 50) - (from.reputation ?? 50)) / 60
    + ((d.adaptability ?? 50) - 50) / 140
    + ((to.infrastructure?.youthAcademy ?? 1) - (from.infrastructure?.youthAcademy ?? 1)) * 0.05;
  if (from.city && to.city && from.city !== to.city) will -= p.age < 17 ? 0.2 : 0.1;
  if (year < 1990) will -= 0.1;
  const roll = hash(`${p.id}:${to.id}:${season}`);
  if (roll > clamp(will, 0.05, 0.9)) {
    return { ok: false, reason: 'unwilling', text: `${p.fullName} möchte nicht wechseln${from.city !== to.city ? ' – er will in seiner Heimat bleiben' : ''}. Vielleicht in einer späteren Saison.` };
  }
  const fee = youthCompensation(p, year);
  if (fee > budgetBase) {
    return { ok: false, reason: 'budget', text: `${p.fullName} würde kommen, aber die Ausbildungsentschädigung übersteigt dein Transferbudget.` };
  }
  return { ok: true, fee, text: `${p.fullName} wechselt in deine Jugendakademie.` };
}

/** Talent zwischen zwei Akademien verschieben. */
export function moveYouth(p: Player, from: Club, to: Club): void {
  from.youthPlayerIds = (from.youthPlayerIds ?? []).filter((x) => x !== p.id);
  (to.youthPlayerIds ??= []).push(p.id);
  p.clubId = to.id;
  p.development.protectedUntil = undefined;
}

/** Jährliche Kosten eines Fördervertrags (1975-Basis). */
export function protectionCost(p: Player): number {
  return Math.round((4000 + Math.max(0, scoutMidOf(p) - 3) * 6000) / 500) * 500;
}

/**
 * Abwerbeversuche größerer Vereine bei deinen Talenten (Saisonwechsel).
 * Liefert die verlorenen Talente; geschützte Talente bleiben.
 */
export function aiPoachAttempts(
  mine: Club, clubs: Club[], youthPlayers: Record<string, Player>, year: number, rng: () => number,
): { p: Player; to: Club }[] {
  const lost: { p: Player; to: Club }[] = [];
  const bigger = clubs.filter((c) => (c.reputation ?? 50) > (mine.reputation ?? 50) + 5);
  if (!bigger.length) return lost;
  for (const id of [...(mine.youthPlayerIds ?? [])]) {
    const p = youthPlayers[id];
    if (!p || p.age < minYouthMoveAge(year) || p.age > 18) continue;
    if ((p.development.protectedUntil ?? 0) >= year) continue;
    if (p.potentialStars < 3.75) continue;
    const chance = (year < 1990 ? 0.04 : year < 2010 ? 0.08 : 0.12) * (p.potentialStars >= 4.5 ? 1.6 : 1)
      * (1.2 - (p.development.adaptability ?? 50) / 250);
    if (rng() < chance) {
      const to = bigger[Math.floor(rng() * bigger.length)];
      moveYouth(p, mine, to);
      lost.push({ p, to });
    }
  }
  return lost;
}
