// =============================================================================
// SCOUTING-SOFTWARE & ABOS (Wunsch Pascal, Transfers › Scouting › Software & Abos)
// -----------------------------------------------------------------------------
// „Kaufen ist einmalig und ggf. etwas veraltet, Abonnements sind up-to-date und
// werden immer genauer.“ Produkte je Epoche in data/scoutingProducts.ts.
//   KAUF   je Produkt und Region; Stand = Kaufjahr. Die Wirkung sinkt je Jahr um
//          `ageRate` (CD-ROM 20 %) – eine Neuauflage kaufen setzt den Stand neu.
//   ABO    Monatspreis am 1. (erster Monat beim Abschluss), deckt alle Regionen
//          des Produkts. Wirkung wächst mit der Laufzeit (60 % → 100 % nach zwei
//          Jahren) und mit der Epoche (+1,2 % je Jahr seit Markteinführung, bis
//          +25 %). Kündigen: zum Monatsende, danach keine Wirkung mehr.
//   WIRKUNG `softProfile` → `softBoostFor(profil, region, ebene, jugend)` =
//          1 − Π(1 − b) über alle passenden Produkte, höchstens 0,6. In
//          game/playerPool.ts `knowledge` als Anteil der Lücke bis „genau bekannt“.
// Kosten nach Verbraucherpreisen (`cpi`), Preisschild = nominal ÷ economyScale.
// Nur der eigene Verein; KI-Entsprechung über game/youthCamps.ts (Talentzufuhr).
// =============================================================================
import { economyScale, yearOf } from '../engine/economy';
import { book } from '../engine/finances';
import { makeMessage, pushMessage } from '../engine/messages';
import { PRODUCT_BY_ID, SCOUT_PRODUCTS, productOnSale, type ScoutProduct, type ScoutRegion } from '../data/scoutingProducts';
import { cpi, scoutingOf } from './scoutingGame';
import type { Game } from './state';

export interface SoftBuy { id: string; region: ScoutRegion; date: string }
export interface SoftSub { id: string; since: string; /** gekündigt zum (erster Tag ohne Abo) */ end?: string }

const MAX_SOFT = 0.6;
const days = (a: string, b: string) => (Date.parse(b) - Date.parse(a)) / 864e5;

/** Preis: nominal (gebucht) und Preisschild (1975-Basis für fmtPrice). */
export function productPrice(p: ScoutProduct, year: number): { nominal: number; tag: number } {
  const nominal = Math.round((p.price * cpi(year)) / 50) * 50;
  return { nominal, tag: nominal / economyScale(year) };
}

/** Wirkung eines Kaufs heute (veraltet je Jahr seit dem Kauf). */
export function buyBoost(b: SoftBuy, today: string): number {
  const p = PRODUCT_BY_ID[b.id];
  if (!p) return 0;
  const age = Math.max(0, days(b.date, today) / 365.25);
  return Math.max(0, p.boost * (1 - (p.ageRate ?? 0.2) * age));
}

/** Wirkung eines Abos heute (Laufzeit + Epoche). */
export function subBoost(s: SoftSub, today: string): number {
  const p = PRODUCT_BY_ID[s.id];
  if (!p || (s.end && s.end <= today)) return 0;
  const months = Math.max(0, days(s.since, today) / 30.44);
  const run = 0.6 + 0.4 * Math.min(1, months / 24);
  const era = 1 + Math.min(0.25, 0.012 * Math.max(0, yearOf(today) - p.from));
  return p.boost * run * era;
}

export interface SoftItem { region: ScoutRegion; maxLevel: number; youth: number; b: number }

/** Alle wirkenden Käufe/Abos als flache Liste (je Region ein Eintrag). */
export function softProfile(g: Game): SoftItem[] {
  const s = g.scouting;
  if (!s) return [];
  const today = g.calendar.currentDate;
  const out: SoftItem[] = [];
  for (const b of s.buys ?? []) {
    const p = PRODUCT_BY_ID[b.id];
    const v = buyBoost(b, today);
    if (p && v > 0.005) out.push({ region: b.region, maxLevel: p.maxLevel, youth: p.youth, b: v });
  }
  for (const x of s.subs ?? []) {
    const p = PRODUCT_BY_ID[x.id];
    const v = subBoost(x, today);
    if (p && v > 0.005) for (const r of p.regions) out.push({ region: r, maxLevel: p.maxLevel, youth: p.youth, b: v });
  }
  return out;
}

/** Zusammengefasster Zugewinn für einen Spieler (Region, Ligaebene, Jugend). */
export function softBoostFor(items: SoftItem[], region: ScoutRegion, level: number, youth: boolean): number {
  let miss = 1;
  for (const it of items) {
    if (it.region !== region || level > it.maxLevel) continue;
    const b = youth ? it.b * it.youth : it.b;
    if (b > 0) miss *= 1 - b;
  }
  return Math.min(MAX_SOFT, 1 - miss);
}

export function activeSub(g: Game, id: string): SoftSub | undefined {
  return g.scouting?.subs?.find((x) => x.id === id && (!x.end || x.end > g.calendar.currentDate));
}

export function boughtEdition(g: Game, id: string, region: ScoutRegion): SoftBuy | undefined {
  return g.scouting?.buys?.find((b) => b.id === id && b.region === region);
}

/** Datenträger kaufen (Neuauflage ersetzt die alte). Rückgabe: Fehlertext oder null. */
export function buyProduct(g: Game, id: string, region: ScoutRegion): string | null {
  const p = PRODUCT_BY_ID[id];
  const today = g.calendar.currentDate, year = yearOf(today);
  if (!p || p.kind !== 'buy') return 'Unbekanntes Produkt.';
  if (!productOnSale(p, year)) return `${p.name} gibt es ${year < p.from ? `erst ab ${p.from}` : 'nicht mehr'}.`;
  if (!p.regions.includes(region)) return 'Diese Region deckt das Produkt nicht ab.';
  const old = boughtEdition(g, id, region);
  if (old && yearOf(old.date) === year) return 'Die Ausgabe dieses Jahres hast du schon.';
  const own = g.clubs[g.managedClubId];
  const { nominal } = productPrice(p, year);
  if (own.finances.balance < nominal) return 'Dafür ist kein Geld in der Kasse.';
  book(own.finances, today, -nominal, 'operations', `Scouting: ${p.name} (${year})`, true);
  const s = scoutingOf(g);
  s.buys = (s.buys ?? []).filter((b) => !(b.id === id && b.region === region));
  s.buys.push({ id, region, date: today });
  return null;
}

/** Abo abschließen (erster Monat sofort). */
export function subscribe(g: Game, id: string): string | null {
  const p = PRODUCT_BY_ID[id];
  const today = g.calendar.currentDate, year = yearOf(today);
  if (!p || p.kind !== 'sub') return 'Unbekanntes Abo.';
  if (!productOnSale(p, year)) return `${p.name} gibt es erst ab ${p.from}.`;
  const cur = g.scouting?.subs?.find((x) => x.id === id);
  if (cur && !cur.end) return 'Das Abo läuft bereits.';
  const own = g.clubs[g.managedClubId];
  const { nominal } = productPrice(p, year);
  if (own.finances.balance < nominal) return 'Dafür ist kein Geld in der Kasse.';
  book(own.finances, today, -nominal, 'operations', `Abo: ${p.name}`, true);
  const s = scoutingOf(g);
  // Wiederaufnahme vor Ablauf der Kündigung: Laufzeit bleibt erhalten.
  if (cur && cur.end && cur.end > today) { delete cur.end; return null; }
  s.subs = (s.subs ?? []).filter((x) => x.id !== id);
  s.subs.push({ id, since: today });
  return null;
}

/** Erster Tag des Folgemonats. */
function nextMonth(d: string): string {
  const y = yearOf(d), m = Number(d.slice(5, 7));
  return m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`;
}

/** Abo kündigen: läuft bis Monatsende, danach keine Wirkung. */
export function cancelSub(g: Game, id: string): void {
  const x = g.scouting?.subs?.find((s) => s.id === id && !s.end);
  if (x) x.end = nextMonth(g.calendar.currentDate);
}

/** Monatsabschluss (1. des Monats): Abos abbuchen, gekündigte entfernen. */
export function softwareMonthly(g: Game, today: string): void {
  const s = g.scouting;
  if (!s?.subs?.length || today.slice(8) !== '01') return;
  const own = g.clubs[g.managedClubId];
  const year = yearOf(today);
  const keep: SoftSub[] = [];
  for (const x of s.subs) {
    const p = PRODUCT_BY_ID[x.id];
    if (!p || (x.end && x.end <= today)) {
      if (p) pushMessage(g.messages, makeMessage({
        date: today, category: 'transfer', from: 'Scouting',
        subject: `Abo beendet: ${p.name}`,
        shortText: 'Die Kündigung ist wirksam.',
        bodyText: `Das Abo „${p.name}“ ist zum Monatsende ausgelaufen. Was dein Stab über die Spieler weiß, beruht ab jetzt wieder nur auf Fernsehen, eigenen Scouts und Berichten.`,
      }));
      continue;
    }
    if (x.since === today) { keep.push(x); continue; } // am selben Tag abgeschlossen = schon bezahlt
    const { nominal } = productPrice(p, year);
    book(own.finances, today, -nominal, 'operations', `Abo: ${p.name}`, true);
    keep.push(x);
  }
  s.subs = keep;
}

/** Monatliche Gesamtkosten aller laufenden Abos (Preisschild). */
export function subsMonthlyTag(g: Game): number {
  const year = yearOf(g.calendar.currentDate);
  return (g.scouting?.subs ?? []).filter((x) => !x.end).reduce((a, x) => {
    const p = PRODUCT_BY_ID[x.id];
    return a + (p ? productPrice(p, year).tag : 0);
  }, 0);
}

/** Produkte für die Liste: im Angebot, demnächst, ausgelaufen-aber-besessen. */
export function productList(g: Game): { p: ScoutProduct; onSale: boolean }[] {
  const year = yearOf(g.calendar.currentDate);
  return SCOUT_PRODUCTS
    .filter((p) => productOnSale(p, year) || year < p.from || g.scouting?.buys?.some((b) => b.id === p.id) || g.scouting?.subs?.some((x) => x.id === p.id))
    .map((p) => ({ p, onSale: productOnSale(p, year) }));
}

/** Alte/fehlerhafte Spielstände absichern (loadMigrations): unbekannte Produkte entfernen. */
export function migrateScoutExtras(g: Game): void {
  const s = g.scouting;
  if (!s) return;
  if (s.buys) s.buys = s.buys.filter((b) => b && PRODUCT_BY_ID[b.id]);
  if (s.subs) s.subs = s.subs.filter((x) => x && PRODUCT_BY_ID[x.id]);
  if (s.abroad) s.abroad = s.abroad.filter((j) => j && j.country && j.start);
}
