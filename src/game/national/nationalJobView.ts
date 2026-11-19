// =============================================================================
// NATIONALTRAINER – Anzeigedaten (nur lesen): Kalender-Termine der eigenen Nation,
// nächste Termine, eigene Spiele, Bilanz je Wettbewerb. Seiten: views/national/.
// =============================================================================
import type { Game } from '../state';
import { addDaysISO } from '../../engine/trainingPlan';
import { nationalState, natName, nationMatches, type NatMatchRow } from './nationalGame';
import { QUAL_DAYS, NOMINATE_DAYS, activeJob, defOfKey, nationalJob, nextCycleDef, tKey, tLong, type NjRec } from './nationalJob';
import { STAGE_LABEL } from './tournament';

export interface JobCalEntry { date: string; line: string; own?: boolean }

const ddmm = (d: string) => `${d.slice(8, 10)}.${d.slice(5, 7)}.`;

/** Termine der eigenen Nation in der laufenden Saison (Kalender, Quelle N2 in CalendarStrip.tsx). */
export function jobCalendar(g: Game): JobCalEntry[] {
  const job = activeJob(g);
  if (!job) return [];
  const st = nationalState(g);
  const out: JobCalEntry[] = [];
  const today = g.calendar.currentDate;
  if (st.season === g.season) for (const w of st.windows) {
    if (!w.matches.length) out.push({ date: addDaysISO(w.from, -NOMINATE_DAYS) < today ? today : addDaysISO(w.from, -NOMINATE_DAYS), line: `Nationalteam: Aufgebot nominieren (${w.label})` });
    for (const d of w.dates) {
      const m = w.matches.find((x) => x.date === d && (x.a === job.nat || x.b === job.nat));
      out.push({ date: d, own: true, line: m ? `${natName(m.a)} – ${natName(m.b)} (${w.label})` : `Länderspiel ${natName(job.nat)} (${w.label})` });
    }
  }
  const def = nextCycleDef(job.nat, addDaysISO(today, -45));
  if (def) {
    const nom = addDaysISO(def.start, -25);
    if (!job.qual || job.qual.key !== tKey(def)) out.push({ date: addDaysISO(nom, -QUAL_DAYS), line: `Nationalteam: Qualifikation ${tKey(def)} entschieden` });
    if (!job.qual || job.qual.teams.includes(job.nat)) out.push({ date: nom, line: `Nationalteam: Turnieraufgebot ${tKey(def)}` });
  }
  const t = st.tourn;
  if (t && !t.done && t.teams.includes(job.nat)) {
    for (const m of t.matches) if ((m.a === job.nat || m.b === job.nat) && (m.stage.startsWith('G') || m.date <= today)) {
      out.push({ date: m.date, own: true, line: `${natName(m.a)} – ${natName(m.b)} (${t.kind} · ${STAGE_LABEL[m.stage] ?? m.stage})` });
    }
  }
  return out;
}

/** Nächster Termin des Nationaltrainers (Übersicht/Zentrale). */
export function nextJobDate(g: Game): JobCalEntry | null {
  const today = g.calendar.currentDate;
  return jobCalendar(g).filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0] ?? null;
}

/** Eigene Länderspiele (bis heute), neueste zuerst. */
export function jobMatches(g: Game): NatMatchRow[] {
  const job = nationalJob(g);
  return job ? nationMatches(g, job.nat).filter((m) => m.date >= job.since) : [];
}

export interface RecRow { key: string; label: string; rec: NjRec }
/** Bilanz je Wettbewerb (neueste zuerst) + gesamt. */
export function recordRows(g: Game): RecRow[] {
  const job = nationalJob(g);
  if (!job) return [];
  return Object.entries(job.record.by).map(([key, rec]) => ({ key, label: key, rec })).reverse();
}

export const recText = (r: NjRec) => `${r.w} S · ${r.d} U · ${r.l} N`;
export const contractText = (g: Game) => { const j = nationalJob(g); const d = j ? defOfKey(j.untilKey) : null; return d ? `bis ${tLong(d)}` : '–'; };
export { ddmm };
