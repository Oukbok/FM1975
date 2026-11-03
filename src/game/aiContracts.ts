// =============================================================================
// KI-VERTRÄGE — vorzeitige Verlängerungen, auslaufende Altstars, Bosman-Planung
// -----------------------------------------------------------------------------
// • Stichtage 1.10., 1.2., 20.4. (vor Bosman nur 20.4., seltener): KI-Vereine sprechen Leistungsträger und Talente
//   an, deren Vertrag in höchstens 20 Monaten endet. Die meisten verlängern; wer
//   ehrgeizig/unzufrieden ist oder über dem Verein steht, lehnt ab
//   (`contract.refused`). Altstars (ab 32, nicht mehr Stammspieler; ab 34 immer)
//   bekommen keinen neuen Vertrag (`contract.aiLetGo`, Abgang am 1. Juli in
//   contracts.ts → handleContractExpiry).
// • Ab Bosman (Sommer 1995): Wer abgelehnt hat und nur noch ≤ 12 Monate (Sommer)
//   bzw. ≤ 6 Monate (Winter, 25.1. – nach den ersten Vorverträgen) Vertrag hat, wird oft verkauft – lieber Ablöse jetzt
//   als ablösefrei im Sommer (Abnehmer: KI-Verein mit Bedarf, sonst Ausland).
// • Ab Bosman, 15.1./15.2./15.3.: Vorverträge zwischen KI-Vereinen mit auslaufenden
//   Spielern (Wechsel am 1. Juli ablösefrei).
// Der eigene Verein ist nie betroffen (außer in der Simulation `simAutoManage`).
// =============================================================================
import { Club, Player } from '../types';
import { assessSquad, GROUP_OF, targetStrength } from '../engine/aiManager';
import { marketWage } from '../engine/clubEconomy';
import { bosmanActive, seasonEndYear } from '../engine/contractTalks';
import { personaOf } from '../engine/persona';
import { capBase, sellerPosition, softCap } from '../engine/transferMarket';
import { fmtPrice } from '../ui/format';
import { isAiClub, monthsLeftOf, squadOf } from './aiClubs';
import { sellAbroad } from './aiOffers';
import { noteSquad } from './aiSquadLog';
import { transferPlayer } from './contracts';
import { willJoin, wishesFor } from './playerWishesGame';
import { MIN_SQUAD, repairSquadLists, wageRatioOf } from './squads';
import { logRenewal } from './transferLog';
import { Game } from './state';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const r5k = (v: number) => Math.round(v / 5000) * 5000;
const RENEW_DAYS = new Set(['10-01', '02-01', '04-20']);
// Winterverkauf erst nach den ersten Vorverträgen (15.1.): Abnehmer warten lieber auf den ablösefreien Wechsel.
const SALE_DAYS = new Set(['07-20', '08-10', '01-25']);
const PRE_DAYS = new Set(['01-15', '02-15', '03-15']);

function hashRand(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 10000) / 10000;
}

const aiClubsOf = (g: Game) => Object.values(g.clubs).filter((c) => isAiClub(g, c));
const seasonKey = (today: string) => String(seasonEndYear(today) - 1);

/** Ist der Spieler für seinen Verein wichtig (Stammkraft oder großes Talent)? */
export function isKeyPlayer(p: Player, squad: Player[]): boolean {
  const rank = [...squad].sort((a, b) => b.overall - a.overall).findIndex((x) => x.id === p.id);
  return (rank >= 0 && rank < 13) || (p.age <= 23 && p.potentialStars >= 3.5);
}

/**
 * Kalibrierung je Epoche (Soll-Werte und Quellen: docs/recherche/ablösefrei.md):
 * `refuse` Grundneigung, eine Verlängerung abzulehnen; `preRefused`/`preKey` Chance je
 * Stichtag auf einen Vorvertrag (Ablehner bzw. nicht verlängerte Stammkraft); `fringe` Chance, dass ein
 * Ergänzungsspieler (ab Platz 16, ab 25 Jahren) zum Saisonende keinen neuen Vertrag bekommt.
 * Nach Bosman nehmen ablösefreie Wechsel über die Jahrzehnte zu (Berater, kürzere Bindung).
 */
export function freeAgentEra(year: number): { refuse: number; preRefused: number; preKey: number; fringe: number } {
  if (year < 1995) return { refuse: 0.04, preRefused: 0, preKey: 0, fringe: 0 };
  if (year < 2005) return { refuse: 0.11, preRefused: 0.4, preKey: 0.08, fringe: 0.05 };
  if (year < 2015) return { refuse: 0.19, preRefused: 0.55, preKey: 0.14, fringe: 0.3 };
  return { refuse: 0.21, preRefused: 0.6, preKey: 0.15, fringe: 0.6 };
}

/** Lehnt der Spieler eine vorzeitige Verlängerung ab? (Persönlichkeit, Zufriedenheit, Größe des Vereins, Epoche) */
export function refusesRenewal(p: Player, club: Club, bosman: boolean, r: number, year = 2000): boolean {
  const pe = personaOf(p);
  const urge = (pe.ehrgeiz - pe.loyalitaet) / 220 + (55 - (p.contract.satisfaction ?? 60)) / 160 + (p.overall - (club.reputation ?? 60)) / 70;
  return r < clamp((bosman ? freeAgentEra(year).refuse : 0.04) + urge, 0.03, bosman ? 0.55 : 0.3);
}

function renewYears(age: number, r: number): number {
  if (age <= 24) return 3 + Math.floor(r * 2);
  if (age <= 28) return 2 + Math.floor(r * 2);
  if (age <= 30) return 2;
  return 1;
}

// -----------------------------------------------------------------------------
// Vorzeitige Verlängerungen / Altstars
// -----------------------------------------------------------------------------
export function aiEarlyRenewals(g: Game, today: string): void {
  if (!RENEW_DAYS.has(today.slice(5))) return;
  const bosman = bosmanActive(today);
  // Vor Bosman bringt auch ein auslaufender Vertrag noch Ablöse: kaum Eile, nur im Frühjahr.
  if (!bosman && today.slice(5) !== '04-20') return;
  const season = seasonKey(today);
  const endYear = seasonEndYear(today);
  for (const club of aiClubsOf(g)) {
    const squad = squadOf(g, club).filter((p) => !p.isYouth);
    const byOv = [...squad].sort((a, b) => b.overall - a.overall);
    for (const p of squad) {
      if (p.loan || p.contract.preContractClubId || p.contract.aiLetGo) continue;
      const months = monthsLeftOf(p, today);
      if (months <= 0 || months > 20) continue;
      const rank = byOv.indexOf(p);
      // Altstars: ab 34 immer, ab 32 außerhalb der Stammelf – kein neuer Vertrag.
      if (p.age >= 34 || (p.age >= 32 && rank >= 11)) {
        if (Number(p.contract.expiryDate.slice(0, 4)) <= endYear) { p.contract.aiLetGo = true; noteSquad(g, 'letGo'); }
        continue;
      }
      // Nach Bosman lassen Vereine auch Ergänzungsspieler häufiger auslaufen (Kaderumbau ohne Ablöse),
      // heute deutlich öfter als in den ersten Bosman-Jahren.
      if (bosman && today.slice(5) === '04-20' && rank >= 15 && p.age >= 25 && Number(p.contract.expiryDate.slice(0, 4)) <= endYear
        && !isKeyPlayer(p, squad) && hashRand(`${p.id}|fringe|${season}`) < freeAgentEra(Number(today.slice(0, 4))).fringe) {
        p.contract.aiLetGo = true; noteSquad(g, 'letGo');
        continue;
      }
      if (!isKeyPlayer(p, squad) || p.contract.refused) continue; // wer abgelehnt hat, bleibt dabei (bis Wechsel/Vertragsende)
      // Nicht jeder Verein handelt an jedem Stichtag (Verhandlungen dauern).
      const r = hashRand(`${p.id}|ren|${today}`);
      if (r > (bosman ? (months <= 8 ? 0.85 : 0.55) : 0.3)) continue;
      if (refusesRenewal(p, club, bosman, hashRand(`${p.id}|ref|${season}`), Number(today.slice(0, 4)))) {
        p.contract.refused = season;
        noteSquad(g, 'refused');
        continue;
      }
      const years = renewYears(p.age, hashRand(p.id + today));
      const base = Number(p.contract.expiryDate.slice(0, 4));
      p.contract.expiryDate = `${Math.max(base + 1, endYear + years)}-06-30`;
      p.contract.weeklyWage = Math.round(Math.max(p.contract.weeklyWage, (p.contract.weeklyWage + marketWage(p) * Math.min(1.1, wageRatioOf(g, club))) / 2 * 1.05));
      p.contract.satisfaction = clamp((p.contract.satisfaction ?? 60) + 8, 0, 100);
      p.contract.refused = undefined;
      logRenewal(g, p, club.id, today);
      noteSquad(g, 'early');
    }
  }
}

// -----------------------------------------------------------------------------
// Bosman-Planung: Verkauf im letzten Vertragsjahr
// -----------------------------------------------------------------------------
export function aiBosmanSales(g: Game, today: string, rng: () => number = Math.random): void {
  if (!SALE_DAYS.has(today.slice(5)) || !bosmanActive(today)) return;
  const winter = today.slice(5, 7) === '01';
  const year = Number(today.slice(0, 4));
  const clubs = aiClubsOf(g);
  const busy = new Set((g.transferTalks ?? []).filter((t) => t.phase !== 'done' && t.phase !== 'failed').map((t) => t.playerId));
  let sold = 0;
  for (const seller of clubs) {
    if (seller.playerIds.length <= MIN_SQUAD) continue;
    const squad = squadOf(g, seller);
    const cands = squad.filter((p) => p.contract.refused && !p.contract.preContractClubId && !p.loan && !busy.has(p.id)
      && monthsLeftOf(p, today) > 0 && monthsLeftOf(p, today) <= (winter ? 6 : 12));
    for (const p of cands) {
      if (seller.playerIds.length <= MIN_SQUAD || rng() > (winter ? 0.4 : 0.5)) continue;
      const months = monthsLeftOf(p, today);
      const group = GROUP_OF[p.naturalPosition];
      // Abnehmer im Inland: Bedarf, Budget, Spieler will.
      const buyers = clubs.filter((b) => b.id !== seller.id && b.playerIds.length < 26 && (b.reputation ?? 0) >= (seller.reputation ?? 0) - 6)
        .map((b) => {
          const a = assessSquad(squadOf(g, b), b.tactics?.formation);
          const need = a.groups[group];
          return { b, s: p.overall >= targetStrength(a, need).min ? need.score : -1 };
        })
        .filter((x) => x.s >= 4).sort((x, y) => y.s - x.s).slice(0, 3);
      let done = false;
      for (const { b } of buyers) {
        const pos = sellerPosition(p, seller, b, { year, monthsLeft: months, bosman: true, squad, rival: false, scope: 'germany' });
        const fee = r5k(Math.min(b.finances.transferBudget, softCap((pos.asking + pos.walkaway) / 2, capBase(year, 'germany'))));
        if (fee < pos.walkaway * 0.9 || fee <= 0) continue;
        if (!willJoin(g, p, b, rng).ok) continue;
        const name = p.fullName;
        transferPlayer(g, p, seller, b, fee, today);
        g.aiMarket?.news.push(`${seller.name} verkauft ${name} vor Vertragsende an ${b.name} (${fmtPrice(fee)})`);
        done = true;
        break;
      }
      if (!done && rng() < 0.45) {
        // Kein Abnehmer im Inland: ins Ausland, zum Bosman-Abschlag.
        const fee = r5k(p.contract.transferValue * (months <= 6 ? 0.35 : 0.55));
        g.aiMarket?.news.push(`${seller.name} gibt ${p.fullName} vor Vertragsende ins Ausland ab (${fmtPrice(fee)})`);
        sellAbroad(g, p, seller, 'Ausland', fee, today);
        done = true;
      }
      if (done) { sold++; noteSquad(g, 'bosmanSales'); }
    }
  }
  if (sold) repairSquadLists(g);
}

// -----------------------------------------------------------------------------
// Vorverträge zwischen KI-Vereinen (ab Bosman)
// -----------------------------------------------------------------------------
export function aiPreContracts(g: Game, today: string): void {
  if (!PRE_DAYS.has(today.slice(5)) || !bosmanActive(today)) return;
  const endDate = `${seasonEndYear(today)}-06-30`;
  for (const club of aiClubsOf(g)) {
    const squad = squadOf(g, club);
    for (const p of squad) {
      if (p.contract.expiryDate > endDate || p.contract.preContractClubId || p.loan || p.contract.aiLetGo || p.age >= 33) continue;
      // Wer abgelehnt hat, sucht aktiv; andere Leistungsträger nur gelegentlich.
      // Nicht verlängerte Stammkräfte (der Verein hat noch nicht verlängert) werden ebenfalls umworben.
      const era = freeAgentEra(Number(today.slice(0, 4)));
      const chance = p.contract.refused ? era.preRefused : isKeyPlayer(p, squad) ? era.preKey : p.age <= 30 ? era.preKey * 0.4 : 0.02;
      if (hashRand(`${p.id}|pre|${today}`) >= chance) continue;
      // Abnehmer für die neue Saison: KI-Vereine, bei denen er zu den besten 14 gehören würde
      // (Kadergröße im Winter zählt nicht – zum 1. Juli wird ohnehin umgebaut).
      const cands = Object.values(g.clubs).filter((b) => b.id !== club.id && isAiClub(g, b) && b.playerIds.length < 30
        && (b.reputation ?? 60) >= (club.reputation ?? 60) - 10
        && p.overall >= (squadOf(g, b).map((x) => x.overall).sort((a, z) => z - a)[15] ?? 0));
      // Wer abgelehnt hat, will weg und ist weniger wählerisch als ein Spieler, der eigentlich bleiben könnte.
      const buyer = bestPreBuyer(g, p, cands, p.contract.refused ? 28 : 42, () => hashRand(`${p.id}|preb|${today}|${cands.length}`));
      if (!buyer) continue;
      p.contract.preContractClubId = buyer.id;
      g.aiMarket?.news.push(`${p.fullName} (${club.shortName}) unterschreibt Vorvertrag bei ${buyer.name}`);
      noteSquad(g, 'pre');
    }
  }
}

/** Reizvollster Abnehmer (Spielerwünsche, ablösefrei) ab einer Mindestwertung. */
function bestPreBuyer(g: Game, p: Player, cands: Club[], min: number, rng: () => number): Club | null {
  let best: Club | null = null, bestS = -1;
  for (const c of cands) {
    const w = wishesFor(g, p, c, { freeAgent: true });
    if (w.appeal.dealBreaker) continue;
    const sc = w.appeal.score + rng() * 10;
    if (sc > bestS) { bestS = sc; best = c; }
  }
  return bestS >= min ? best : null;
}

/** Täglicher Einstieg (game/day.ts). */
export function aiContractsDaily(g: Game, today: string, rng: () => number = Math.random): void {
  aiEarlyRenewals(g, today);
  aiBosmanSales(g, today, rng);
  aiPreContracts(g, today);
}
