// Gemeinsame, rein darstellende Helfer für die Seiten (keine Spiellogik).
import ClubCrest from '../components/ClubCrest';
import { Game } from '../game/state';
import { Match, Player, POSITION_GROUPS } from '../types';
import { fmtDateShort, vColor } from '../ui/format';
import { scoutRange, scoutRangeText } from '../engine/scouting';
import { DM_PER_EUR, currencyForYear } from '../engine/economy';

export const squadOf = (g: Game, clubId = g.managedClubId): Player[] =>
  (g.clubs[clubId]?.playerIds ?? []).map((id) => g.players[id]).filter(Boolean);

export const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export const tableRow = (g: Game, clubId = g.managedClubId) => g.table.rows.find((r) => r.clubId === clubId);

/** Eigene Ligaspiele (gespielt bzw. offen), zeitlich sortiert. */
export function ownLeagueMatches(g: Game, status: 'finished' | 'scheduled'): Match[] {
  return g.fixtures.filter((m) => m.involvesPlayerClub && m.status === status).sort((a, b) => a.date.localeCompare(b.date));
}

/** Ergebnis aus Sicht eines Vereins: W / D / L oder null. */
export function resultFor(m: Match, clubId: string): 'W' | 'D' | 'L' | null {
  if (!m.result) return null;
  const home = m.homeClubId === clubId;
  const gf = home ? m.result.homeGoals : m.result.awayGoals;
  const ga = home ? m.result.awayGoals : m.result.homeGoals;
  return gf > ga ? 'W' : gf < ga ? 'L' : 'D';
}

export const FORM_DE = { W: 'S', D: 'U', L: 'N' } as const;

export function FormDots({ form }: { form: ('W' | 'D' | 'L')[] }) {
  return (
    <span className="dform">
      {form.slice(-5).map((f, i) => <i key={i} className={`dform-${f}`} title={f === 'W' ? 'Sieg' : f === 'D' ? 'Unentschieden' : 'Niederlage'}>{FORM_DE[f]}</i>)}
    </span>
  );
}

/** Eine Spielzeile: Datum · Gegner (H/A) · Ergebnis. */
export function MatchRow({ g, m, clubId = g.managedClubId, onClick }: { g: Game; m: Match; clubId?: string; onClick?: () => void }) {
  const home = m.homeClubId === clubId;
  const opp = g.clubs[home ? m.awayClubId : m.homeClubId];
  const r = resultFor(m, clubId);
  const score = m.result ? (home ? `${m.result.homeGoals}:${m.result.awayGoals}` : `${m.result.awayGoals}:${m.result.homeGoals}`) : '–:–';
  return (
    <div className={`dlist-row ${onClick ? 'clickable' : ''}`} onClick={onClick}>
      <span className="meta" style={{ minWidth: 64 }}>{fmtDateShort(m.date).dmy}</span>
      {opp && <ClubCrest club={opp} size={26} />}
      <span className="grow">{opp?.name ?? '—'} <span className="muted">({home ? 'H' : 'A'})</span></span>
      <span className={`dres ${r ? 'dres-' + r : ''}`}>{score}</span>
    </div>
  );
}

/** Spielerzeile: Positionskürzel · Name · Wert. */
export function PlayerRow({ p, value, sub, onClick, color }: { p: Player; value?: React.ReactNode; sub?: React.ReactNode; onClick?: () => void; color?: string }) {
  return (
    <div className={`dlist-row ${onClick ? 'clickable' : ''}`} onClick={onClick}>
      <span className="pos-badge">{p.naturalPosition}</span>
      <span className="grow">{p.fullName}{sub != null && <span className="muted"> · {sub}</span>}</span>
      {value != null && <span className="val" style={{ color: color ?? (typeof value === 'number' ? vColor(value) : undefined) }}>{value}</span>}
    </div>
  );
}

export const GROUP_DE: Record<string, string> = { GK: 'Torwart', DEF: 'Abwehr', MID: 'Mittelfeld', ATT: 'Angriff' };
export const groupOf = (p: Player) => POSITION_GROUPS[p.naturalPosition] as string;

/** Monate bis zu einem ISO-Datum (UTC), mindestens 0. */
export function monthsUntil(from: string, to: string): number {
  const a = new Date(from + 'T00:00:00Z'), b = new Date(to);
  return Math.max(0, (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth()));
}

/** Mitte der Scouting-Spanne (das wahre Potenzial ist verdeckt) – zum Sortieren. */
export const scoutMid = (p: Player) => { const [a, b] = scoutRange(p); return (a + b) / 2; };

/** Scout-Einschätzung des Potenzials als Text-Spanne, z. B. „3,5–4,5 ★“. */
export function ScoutStars({ p }: { p: Player }) {
  return <span className="dscout" title="Scouting-Einschätzung des Potenzials">{scoutRangeText(p)}</span>;
}

/** Kleinbeträge mit zwei Nachkommastellen (z. B. Netto pro Besucher), DM bzw. EUR ab 2002. */
export function fmtSmallMoney(dm: number, year: number): string {
  const eur = currencyForYear(year) === 'EUR';
  return `${(eur ? dm / DM_PER_EUR : dm).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${eur ? '€' : 'DM'}`;
}
