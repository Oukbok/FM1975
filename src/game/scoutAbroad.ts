// =============================================================================
// SCOUTS INS AUSLAND (Wunsch Pascal, Transfermarkt › Scouting › Scouts im Ausland)
// -----------------------------------------------------------------------------
// Ein Scouting-Mitarbeiter (Scout, Chefscout, internationaler Scout, Nachwuchs-
// koordinator) oder der nebenberufliche Vereinsscout des Grundplatzes (Qualität 7)
// reist 4, 8 oder 12 Wochen in ein Land. Er belegt einen Scouting-
// Platz (wie ein Einzelauftrag) und kostet Reisegeld je Woche nach Verbraucher-
// preisen (Ostblock vor 1990 teurer, Fernziele teurer, internationaler Scout
// günstiger), gebucht beim Start.
// WIRKUNG: Länderwissen `areas[land]` = 0,10 + 0,03 je Woche + 0,012 je Punkt
//   Qualität über 10 (höchstens 0,45) – während der Reise anteilig, nach der
//   Rückkehr voll, danach −0,15 je Jahr. In game/playerPool.ts `knowledge` als
//   Anteil der Lücke bis „genau bekannt“, für Profis UND Jugendliche des Landes.
// FUNDE: Bei der Rückkehr liegen Berichte (Bekanntheit 0,8) über die drei
//   größten Jugendtalente und zwei unterschätzte junge Profis vor (+ Nachricht).
// =============================================================================
import { CalendarEngine } from '../engine/calendar';
import { economyScale, yearOf } from '../engine/economy';
import { book } from '../engine/finances';
import { makeMessage, pushMessage } from '../engine/messages';
import { roleQuality } from '../engine/staffSkills';
import { cpi, busySlots, scoutSlots, scoutingOf, SCOUT_ROLE_IDS } from './scoutingGame';
import { poolRows } from './playerPool';
import { countryName } from './worldPool';
import { homeCountryKey, type Game } from './state';

export interface AbroadJob { country: string; staffId: string; staffName: string; start: string; days: number; /** Preisschild */ cost: number; k: number }
export interface AbroadDone { country: string; staffName: string; end: string; k: number; finds: string[] }

export const ABROAD_WEEKS = [4, 8, 12] as const;
const EAST = new Set(['DDR', 'Sowjetunion', 'Polen', 'Ungarn', 'Tschechoslowakei', 'Rumaenien', 'Bulgarien', 'Albanien', 'Jugoslawien']);
const FAR = new Set(['Israel', 'Tuerkei', 'Sowjetunion', 'Russland', 'Ukraine', 'Island', 'Zypern', 'Malta']);
const LOG_KEEP = 12;

/** Länder, in die ein Scout reisen kann (aktive Länder der Hintergrund-Welt außer der Heimat). */
export function abroadCountries(g: Game): string[] {
  const home = homeCountryKey(g);
  return Object.entries(g.world?.countries ?? {})
    .filter(([key, c]) => c.active !== false && key !== home && !(home === 'Deutschland' && key === 'DDR'))
    .map(([key]) => key)
    .sort((a, b) => countryName(a).localeCompare(countryName(b), 'de'));
}

/** Der Vereinsscout des Grundplatzes (ohne angestellten Scout: nebenberuflich, Qualität 7). */
export const CLUB_SCOUT = 'club';

/** Scouting-Mitarbeiter des eigenen Vereins (+ Vereinsscout) mit Qualität und ob gerade unterwegs. */
export function scoutStaff(g: Game): { id: string; name: string; roleId: string; q: number; busy: boolean }[] {
  const out = (g.staff ?? []).filter((m) => SCOUT_ROLE_IDS.includes(m.roleId));
  const busy = new Set((g.scouting?.abroad ?? []).map((j) => j.staffId));
  return [
    ...out.map((m) => ({ id: m.id, name: m.name, roleId: m.roleId, q: roleQuality(m.skills, m.roleId, m.quality), busy: busy.has(m.id) })),
    { id: CLUB_SCOUT, name: 'Vereinsscout (nebenberuflich)', roleId: '', q: 7, busy: busy.has(CLUB_SCOUT) },
  ];
}

/** Dauer, Kosten (Preisschild) und Länderwissen einer Reise. */
export function abroadTerms(g: Game, country: string, weeks: number, staffId?: string): { days: number; cost: number; nominal: number; k: number } {
  const year = yearOf(g.calendar.currentDate);
  const st = scoutStaff(g).find((m) => m.id === staffId);
  const q = st?.q ?? 8;
  let perWeek = 900;
  if (EAST.has(country) && year < 1990) perWeek *= 1.4;
  if (FAR.has(country)) perWeek *= 1.3;
  if (st?.roleId === 'intl_scout') perWeek *= 0.85;
  const nominal = Math.round((perWeek * weeks * cpi(year)) / 50) * 50;
  const k = Math.min(0.45, Math.max(0.08, 0.1 + 0.03 * weeks + 0.012 * (q - 10)));
  return { days: weeks * 7, nominal, cost: nominal / economyScale(year), k };
}

/** Reise starten. Rückgabe: Fehlertext oder null. */
export function startAbroad(g: Game, country: string, weeks: number, staffId: string): string | null {
  const s = scoutingOf(g);
  if (!abroadCountries(g).includes(country)) return 'In dieses Land kann kein Scout reisen.';
  if ((s.abroad ?? []).some((j) => j.country === country)) return 'In diesem Land ist schon ein Scout unterwegs.';
  const st = scoutStaff(g).find((m) => m.id === staffId);
  if (!st) return 'Diesen Mitarbeiter gibt es nicht (mehr).';
  if (st.busy) return `${st.name} ist schon im Ausland.`;
  if (busySlots(g) >= scoutSlots(g)) return `Alle ${scoutSlots(g)} Scouting-Plätze sind belegt.`;
  const t = abroadTerms(g, country, weeks, staffId);
  const own = g.clubs[g.managedClubId];
  if (own.finances.balance < t.nominal) return 'Für die Reise ist kein Geld in der Kasse.';
  const today = g.calendar.currentDate;
  book(own.finances, today, -t.nominal, 'other', `Scouting-Reise: ${countryName(country)}`, true);
  (s.abroad ??= []).push({ country, staffId, staffName: st.name, start: today, days: t.days, cost: t.cost, k: t.k });
  return null;
}

/** Reise abbrechen (Reisegeld bleibt weg, Wissen bis heute bleibt anteilig). */
export function cancelAbroad(g: Game, country: string): void {
  const s = g.scouting;
  const j = s?.abroad?.find((x) => x.country === country);
  if (!s || !j) return;
  const part = j.k * abroadProgress(g, j);
  if (part > 0.02) noteArea(g, country, part, g.calendar.currentDate);
  s.abroad = s.abroad!.filter((x) => x !== j);
}

export function abroadProgress(g: Game, j: AbroadJob): number {
  return Math.max(0, Math.min(1, (Date.parse(g.calendar.currentDate) - Date.parse(j.start)) / 864e5 / j.days));
}

function noteArea(g: Game, country: string, k: number, date: string): void {
  const s = scoutingOf(g);
  const areas = (s.areas ??= {});
  const cur = areaKnowledge(g, country);
  if (k >= cur) areas[country] = { k, date };
}

/** Länderwissen heute (laufende Reise anteilig, sonst verfallend). */
export function areaKnowledge(g: Game, country: string): number {
  const s = g.scouting;
  if (!s) return 0;
  let k = 0;
  const a = s.areas?.[country];
  if (a) k = Math.max(0, a.k - 0.15 * Math.max(0, (Date.parse(g.calendar.currentDate) - Date.parse(a.date)) / (365.25 * 864e5)));
  const j = s.abroad?.find((x) => x.country === country);
  if (j) k = Math.max(k, j.k * abroadProgress(g, j));
  return k;
}

/** Länderwissen aller Länder (für knowCtx). */
export function areaMap(g: Game): Map<string, number> {
  const out = new Map<string, number>();
  const s = g.scouting;
  if (!s) return out;
  for (const c of new Set([...Object.keys(s.areas ?? {}), ...(s.abroad ?? []).map((j) => j.country)])) {
    const k = areaKnowledge(g, c);
    if (k > 0.005) out.set(c, k);
  }
  return out;
}

const h01 = (str: string) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967296;
};

/** Täglich: Rückkehr der Scouts, Funde, Nachricht. */
export function abroadDaily(g: Game, today: string): void {
  const s = g.scouting;
  if (!s?.abroad?.length) return;
  const done = s.abroad.filter((j) => CalendarEngine.addDays(j.start, j.days) <= today);
  if (!done.length) return;
  s.abroad = s.abroad.filter((j) => !done.includes(j));
  const { rows } = poolRows(g);
  for (const j of done) {
    noteArea(g, j.country, j.k, today);
    const here = rows.filter((r) => r.country === j.country && r.clubId !== g.managedClubId);
    const noise = (id: string) => (h01(`${id}|${j.start}`) - 0.5) * 10;
    const youth = here.filter((r) => r.youth).sort((a, b) => (b.pot + noise(b.id)) - (a.pot + noise(a.id))).slice(0, 3);
    const youthIds = new Set(youth.map((r) => r.id));
    const gems = here.filter((r) => !youthIds.has(r.id) && r.age <= 23 && r.ov >= 55)
      .sort((a, b) => (b.pot - b.ov + noise(b.id)) - (a.pot - a.ov + noise(a.id))).slice(0, 2);
    const finds = [...youth, ...gems];
    for (const r of finds) {
      const old = s.reports[r.id];
      if (!old || old.k < 0.8) s.reports[r.id] = { k: 0.8, date: today };
    }
    (s.abroadLog ??= []).unshift({ country: j.country, staffName: j.staffName, end: today, k: j.k, finds: finds.map((r) => r.id) });
    if (s.abroadLog.length > LOG_KEEP) s.abroadLog.length = LOG_KEEP;
    const land = countryName(j.country);
    const line = (r: typeof finds[number]) => `• ${r.name} (${r.pos}, ${r.age} Jahre${r.youth ? ', Jugend' : ''})`;
    pushMessage(g.messages, makeMessage({
      date: today, category: 'transfer', from: 'Scouting',
      subject: `Zurück aus ${land}: ${j.staffName}`,
      shortText: `${Math.round(j.days / 7)} Wochen ${land} – ${finds.length} Spieler im Bericht.`,
      bodyText: `${j.staffName} ist nach ${Math.round(j.days / 7)} Wochen aus ${land} zurück. Über die Spieler des Landes wissen wir jetzt deutlich mehr – das Wissen verblasst über die Jahre wieder.\n\n`
        + (youth.length ? `Die größten Talente der Jugend dort:\n${youth.map(line).join('\n')}\n\n` : '')
        + (gems.length ? `Unterschätzte junge Spieler:\n${gems.map(line).join('\n')}\n\n` : '')
        + 'Alle Berichte findest du unter Transfermarkt › Scouting und im Spielerpool (Filter „Gescoutet“).',
    }));
  }
}

/** Rückkehrtermine der Scouts (Kalender). */
export function abroadReturns(g: Game): { date: string; country: string; name: string }[] {
  return (g.scouting?.abroad ?? []).map((j) => ({ date: CalendarEngine.addDays(j.start, j.days), country: j.country, name: j.staffName }));
}
