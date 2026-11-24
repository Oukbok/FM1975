// =============================================================================
// NATIONALITÄTEN ZUM SPIELDATUM (Wunsch Pascal; Regeln data/nationEras.ts)
// -----------------------------------------------------------------------------
// Aufgelöste Staaten gelten nur, solange sie bestehen: Am 1. Januar nach dem Zerfall
// wechseln alle Spieler (volle Spieler, Jugend, Weltspieler), Trainer und Mitarbeiter
// zur Nachfolge-Nation; vor dem Zerfall tragen sie das Kürzel des alten Staates.
// Welcher Nachfolger: (1) Einheimische des Heimatlandes → Nation des Landes, (2) Herkunft
// des Spielers (Kroatien → CRO), (3) Nachname (Jugoslawien: serbische/kroatische
// Namenslisten), (4) fest aus der ID nach Gewicht (data/nationEras.ts).
// Ältere Spielstände einmalig (`game.natV`): Einheimische der Auslandsvereine bekommen
// das Kürzel ihres Landes (Slowakei → SVK, Ukraine → UKR, Bulgarien → BUL).
// Aufruf: neues Spiel, Laden (Migration, idempotent), 1. Januar (`nationDaily`).
// =============================================================================
import { isEraNation, landNation, natAt, nationRoot } from '../data/nationEras';
import { ORIGINS } from '../data/origins';
import { COUNTRY_BY_CC, countryOrigin } from '../data/world/countries';
import type { Player } from '../types';
import { homeCountryOf, type Game } from './state';
import { WP_FIELD as W, homeOriginOf, worldClubs } from './worldPool';

/** Stand der einmaligen Zuordnung (`game.natV`). */
export const NAT_VERSION = 1;
const yearOf = (iso: string) => Number(iso.slice(0, 4));

// Nachfolger mit eigener Herkunft/Namensliste (Jugoslawien: Serbien und Kroatien). Hat ein alter Staat nur
// eine solche Herkunft (Sowjetunion: „rus“ für alle), sagen Herkunft und Name nichts – dann entscheidet die ID.
let lastMemo: Map<string, string> | null = null;
let multiMemo: Set<string> | null = null;
function build(): void {
  lastMemo = new Map();
  multiMemo = new Set();
  const perRoot = new Map<string, Set<string>>();
  const succ = Object.values(ORIGINS).filter((o) => { const r = nationRoot(o.nationality); return !!r && r !== o.nationality; });
  for (const o of succ) { const r = nationRoot(o.nationality)!; (perRoot.get(r) ?? perRoot.set(r, new Set()).get(r)!).add(o.nationality); }
  for (const [r, set] of perRoot) if (set.size >= 2) multiMemo.add(r);
  const seen = new Map<string, Set<string>>();
  for (const o of succ) if (multiMemo.has(nationRoot(o.nationality)!)) for (const l of o.last) (seen.get(l) ?? seen.set(l, new Set()).get(l)!).add(o.nationality);
  for (const [l, set] of seen) if (set.size === 1) lastMemo.set(l, [...set][0]);
}
function byLastName(last: string, root: string | null): string | null {
  if (!lastMemo) build();
  const c = lastMemo!.get(last);
  return c && nationRoot(c) === root ? c : null;
}
const telling = (root: string | null) => { if (!multiMemo) build(); return !!root && multiMemo!.has(root); };
/** Zwischenspeicher leeren (anderer Datensatz = andere Namenslisten; game/resetModuleState.ts). */
export function clearNationSync(): void { lastMemo = null; multiMemo = null; }

/** Nationalität eines Spielers im Jahr: Herkunft (Kroatien → CRO), sonst Nachname, sonst fest aus der ID. */
export function playerNatAt(nat: string, year: number, id: string, origin: string | undefined, lastName: string): string {
  if (!isEraNation(nat)) return nat;
  const root = nationRoot(nat);
  const own = origin ? ORIGINS[origin]?.nationality : undefined;
  const hint = !telling(root) ? null : own && own !== nat && nationRoot(own) === root && own !== root ? own : byLastName(lastName, root);
  return natAt(nat, year, id, hint);
}

/**
 * Alle Nationalitäten auf den Stand des Kalenderjahres bringen. Idempotent; liefert die Zahl
 * der Änderungen. Läuft nur über Spieler mit einem betroffenen Kürzel.
 */
export function syncNationalities(g: Game, date = g.calendar.currentDate): number {
  const year = yearOf(date);
  let n = 0;
  // Einheimische des Heimatlandes (Spiel in der Slowakei, in Bulgarien …): Nation des Landes.
  const homeCc = homeCountryOf(g);
  const homeOrigin = homeCc === 'ger' ? null : countryOrigin(homeCc);
  const homeNation = homeOrigin ? landNation(COUNTRY_BY_CC[homeCc]?.key, year, ORIGINS[homeOrigin]?.nationality) : null;
  const fix = (p: Player) => {
    if (!p || !isEraNation(p.nationality)) return;
    const local = homeNation && p.origin === homeOrigin;
    const next = local ? homeNation : playerNatAt(p.nationality, year, p.id, p.origin, p.lastName);
    if (next !== p.nationality) { p.nationality = next; n++; }
  };
  for (const p of Object.values(g.players)) fix(p);
  for (const p of Object.values(g.youthPlayers ?? {})) fix(p);
  const pool = g.worldPool?.p ?? [];
  if (pool.some((w) => isEraNation(w[W.nat]))) {
    // Einmalig (ältere Spielstände): Einheimische eines Auslandsvereins tragen das Kürzel seines Landes
    // (Verein in der Slowakei: TCH → SVK, in der Ukraine: RUS → UKR, in Bulgarien: SRB → BUL).
    const first = (g.natV ?? 0) < NAT_VERSION;
    const clubs = first ? worldClubs(g) : null;
    const memo = new Map<string, [string, string, string] | null>();
    const homeOf = (id: string) => {
      let v = memo.get(id);
      if (v === undefined) {
        const key = clubs?.get(id)?.country;
        const base = key && key !== 'Deutschland' ? homeOriginOf(key).nationality : '';
        const nation = base ? landNation(key, year, base) : null;
        v = nation ? [nation, base, natAt(base, year)] : null;
        memo.set(id, v);
      }
      return v;
    };
    for (const w of pool) {
      if (!isEraNation(w[W.nat])) continue;
      const h = first ? homeOf(w[W.club]) : null;
      const next = h && (w[W.nat] === h[1] || w[W.nat] === h[2]) ? h[0] : playerNatAt(w[W.nat], year, w[W.id], undefined, w[W.last]);
      if (next !== w[W.nat]) { w[W.nat] = next; n++; }
    }
  }
  // Trainer und Mitarbeiter (Anzeige im Vereinsprofil/Stab).
  for (const m of g.staffWorld?.people ?? []) if (m.nat && isEraNation(m.nat)) { const x = homeNation && nationRoot(m.nat) === nationRoot(homeNation) ? homeNation : natAt(m.nat, year, m.id); if (x !== m.nat) { m.nat = x; n++; } }
  // Cheftrainer und freie Trainer der Welt (game/worldCoaches.ts, Tupel: Nation an Stelle 2).
  const wh = g.staffWorld?.heads;
  for (const t of [...Object.values(wh?.c ?? {}), ...(wh?.f ?? [])]) if (t[2] && isEraNation(t[2])) { const x = homeNation && nationRoot(t[2]) === nationRoot(homeNation) ? homeNation : natAt(t[2], year, t[0]); if (x !== t[2]) { t[2] = x; n++; } }
  const coaches = [...(g.coachPool ?? []), ...Object.values(g.clubs).map((c) => c.coach)];
  for (const c of coaches) if (c?.nationality && isEraNation(c.nationality)) { const x = homeNation && nationRoot(c.nationality) === nationRoot(homeNation) ? homeNation : natAt(c.nationality, year, c.id); if (x !== c.nationality) { c.nationality = x; n++; } }
  // Transferbilanz (letzte Fenster): Nationalität zum Datum des Wechsels – wenn möglich die des Spielers selbst.
  for (const win of g.transferLog?.wins ?? []) for (const e of win.e) {
    if (!isEraNation(e.nat)) continue;
    const y = yearOf(e.d);
    const cur = g.players[e.p]?.nationality;
    const next = cur && nationRoot(cur) === nationRoot(e.nat) && natAt(cur, y) === cur ? cur : natAt(e.nat, y, e.p);
    if (next !== e.nat) { e.nat = next; n++; }
  }
  g.natV = NAT_VERSION;
  return n;
}

/** Tagesablauf: am 1. Januar zerfallen Staaten bzw. wechseln ihre Spieler zum Nachfolger. */
export function nationDaily(g: Game, today: string): void {
  if (today.slice(5) === '01-01') syncNationalities(g, today);
}
