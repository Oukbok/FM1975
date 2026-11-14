// =============================================================================
// MITARBEITER — gemeinsame Anzeige-Bausteine der Seiten Training › Trainerteam
// und Verein › Mitarbeiter (views/staff/StaffPage.tsx)
// =============================================================================
import type { ReactNode } from 'react';
import { STAFF_ROLES, staffAvailable } from '../../data/staff';
import { KINDS } from '../../engine/staffGen';
import type { StaffMember } from '../../engine/staffPeople';
import {
  COACH_SKILLS, type CoachSkill, roleFit, ROLE_SKILLS, SKILL_LABEL, staffLevel, TEAM_ROLES, TEAM_ROLE_IDS,
} from '../../engine/staffSkills';
import { vBar } from '../../ui/format';

export type StaffScope = 'team' | 'club';

/** Stellen einer Seite, gruppiert: Trainerteam bzw. alle übrigen Bereiche des Vereins. */
export function scopeGroups(scope: StaffScope): { id: string; label: string; roles: string[] }[] {
  if (scope === 'team') return [{ id: 'team', label: 'Trainerteam', roles: TEAM_ROLES.map((r) => r.id) }];
  const of = (grp: string) => STAFF_ROLES.filter((r) => r.group === grp && !TEAM_ROLE_IDS.has(r.id) && ROLE_SKILLS[r.id]).map((r) => r.id);
  return [
    { id: 'lead', label: 'Sportliche Leitung', roles: of('trainer') },
    { id: 'medical', label: 'Medizin, Reha & Athletik', roles: of('medical') },
    { id: 'scouting', label: 'Scouting, Analyse & Daten', roles: of('scouting') },
    { id: 'media', label: 'Medien, Marketing & Fans', roles: of('media') },
    { id: 'admin', label: 'Verwaltung & Organisation', roles: of('admin') },
  ];
}
export const scopeRoles = (scope: StaffScope): string[] => scopeGroups(scope).flatMap((g) => g.roles);
export const availableIn = (roles: string[], year: number): string[] => roles.filter((id) => { const r = STAFF_ROLES.find((x) => x.id === id); return !!r && staffAvailable(r, year); });

/** Stärke 1–99 als ruhiges Zahlenfeld (wie die Stärke eines Spielers). */
export function Level({ v, big, dim }: { v: number | null; big?: boolean; dim?: boolean }) {
  return <span className={`sf-lvl ${big ? 'big' : ''} ${dim || v == null ? 'dim' : ''}`}>{v == null ? '–' : v}</span>;
}

/** Balken zur Stärke (monochrome Skala wie bei Spielerwerten). */
export function LevelBar({ v, mark }: { v: number; mark?: number | null }) {
  return (
    <span className="sf-bar">
      <span className="sf-bar-fill" style={{ width: `${v}%`, background: vBar(v) }} />
      {mark != null && <span className="sf-bar-mark" style={{ left: `${mark}%` }} />}
    </span>
  );
}

export const fitLevel = (m: StaffMember, roleId: string): number => staffLevel(roleFit(m.skills, roleId, m.quality));
/** Wie viel Luft nach oben eine Person in einer Stelle hat (Punkte auf der Stärke-Skala). */
export function growthRoom(m: StaffMember, roleId: string): number {
  if (!m.pot) return 0;
  return Math.max(0, staffLevel(roleFit(m.pot, roleId, m.quality)) - fitLevel(m, roleId));
}
export function growthWord(m: StaffMember, roleId: string): string {
  const d = growthRoom(m, roleId);
  if (m.age >= 58) return 'lässt nach';
  return d >= 9 ? 'viel Luft nach oben' : d >= 4 ? 'kann noch zulegen' : 'ausgereift';
}

/** Herkunft in einem Satzteil: ehemaliger Profi mit Eckdaten oder der Beruf des Quereinsteigers. */
export function originText(m: StaffMember, long = false): string {
  if (m.exPro) {
    const e = m.exPro;
    return long ? `Ex-Profi (${e.pos}) · ${e.apps} Spiele${e.titles ? ` · ${e.titles} Titel` : ''}${e.captain ? ' · Kapitän' : ''}` : `Ex-Profi ${e.pos}`;
  }
  if (m.coach) return 'Trainer';
  return (m.bg && KINDS[m.bg]?.label) || 'Quereinsteiger';
}

/** Die stärksten Fähigkeiten als Kurztext („Taktik 84 · Führung 80“). */
export function topSkills(m: StaffMember, n = 3): { k: CoachSkill; v: number }[] {
  const s = m.skills ?? {};
  return COACH_SKILLS.map((k) => ({ k, v: staffLevel(s[k] ?? 1) })).sort((a, b) => b.v - a.v).slice(0, n);
}
export const topSkillsText = (m: StaffMember, n = 3): string => topSkills(m, n).map((x) => `${SKILL_LABEL[x.k]} ${x.v}`).join(' · ');

/** Zeile „Beschriftung … Wert“ (Faktenliste im Profil und im Verhandlungsfenster). */
export function Fact({ k, children, strong }: { k: ReactNode; children: ReactNode; strong?: boolean }) {
  return <div className={`sf-fact ${strong ? 'strong' : ''}`}><span>{k}</span><b>{children}</b></div>;
}
