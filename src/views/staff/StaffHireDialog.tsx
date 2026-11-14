// =============================================================================
// Verhandlung mit einer Person vom Arbeitsmarkt (Fenster fester Größe):
// links, wofür du sie holst – Eignung für die gewählte Stelle, die Fähigkeiten,
// die dort zählen, wen sie ersetzt und was sich dadurch ändert; rechts das
// Angebot (Stelle, Gehalt, Laufzeit, Ablöse/Abfindung).
// =============================================================================
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { STAFF_BY_ID } from '../../data/staff';
import { coachingTeam } from '../../engine/coaching';
import { clubTrainingFactor } from '../../engine/development';
import { economyScale, yearOf } from '../../engine/economy';
import { memberMonthlySalary, type StaffMember } from '../../engine/staffPeople';
import {
  acceptTolerance, bestRoles, type CoachSkill, fitWord, roleFit, roleName, roleQuality, ROLE_SKILLS, SKILL_LABEL, staffLevel, TEAM_ROLE_IDS,
} from '../../engine/staffSkills';
import type { Game } from '../../game/state';
import { ensureStaff } from '../../game/staffGame';
import { compensationOf, demandOf, moveBlocker, offerContract, replacedBy, severanceOf } from '../../game/trainerTeam';
import { fmtDM, fmtStaffWage } from '../../ui/format';
import Seg from '../../ui/Seg';
import Select from '../../ui/Select';
import { Fact, fitLevel, growthWord, Level, LevelBar, originText } from './staffUi';

const COACHING = new Set(['cheftrainer', 'cotrainer', 'torwarttrainer', 'konditionstrainer', 'athletiktrainer', 'sportpsychologe', 'fussballpsychologe']);

export function StaffHireDialog({ g, m, roleId, onClose, onDone }: { g: Game; m: StaffMember; roleId: string; onClose: () => void; onDone: (text: string) => void }) {
  const year = yearOf(g.calendar.currentDate);
  const scale = economyScale(year);
  const club = g.clubs[g.managedClubId];
  const rep = club?.reputation ?? 60;
  const [role, setRole] = useState(roleId);
  const [pct, setPct] = useState(95);
  const [years, setYears] = useState(2);
  const [reply, setReply] = useState<string | null>(null);
  const [rounds, setRounds] = useState(0);
  const demand = demandOf(g, m, role);
  const factor = Math.round(demand * pct) / 100;
  const monthly = (f: number) => memberMonthlySalary({ ...m, roleId: role, salaryFactor: f }, scale);
  const out = replacedBy(g, role);
  const fee = compensationOf(g, m);
  const sev = out ? severanceOf(g, out) : 0;
  const tol = acceptTolerance(rep, years, m.age);
  const block = moveBlocker(g, m);
  const lvl = fitLevel(m, role);
  const weights = Object.entries(ROLE_SKILLS[role] ?? {}).sort((a, b) => (b[1] as number) - (a[1] as number)) as [CoachSkill, number][];
  // Stellen zur Wahl: die besten der Person, dazu die angefragte.
  const options = bestRoles(m.skills ?? {}, year, 12);
  if (!options.some((o) => o.id === roleId)) options.push({ id: roleId, fit: roleFit(m.skills, roleId, 1) });

  // Vorher/Nachher für das Trainerteam.
  const staff = ensureStaff(g);
  const squad = club?.playerIds.length ?? 24;
  const now = coachingTeam(staff, squad, year, rep);
  const then = coachingTeam([...staff.filter((x) => x !== out), { ...m, roleId: role, quality: roleQuality(m.skills, role, m.quality) }], squad, year, rep);
  const dev = (t: typeof now) => (club ? Math.round((clubTrainingFactor(club, t.extra) / clubTrainingFactor(club, 0) - 1) * 100) : 0);
  const sign = (v: number) => `${v >= 0 ? '+' : '−'}${Math.abs(v)} %`;

  const send = () => {
    const r = offerContract(g, m.id, factor, years, { roleId: role });
    if (r.ok) { onDone(r.text); return; }
    setRounds((x) => x + 1);
    setReply(rounds >= 2 ? `${m.name} bricht die Gespräche ab.` : r.text);
  };

  const host = (typeof document !== 'undefined' && (document.querySelector('.display-content') ?? document.body)) as Element;
  return createPortal(
    <div className="modal-overlay sf-hire-overlay" onClick={onClose}>
      <div className="modal sf-hire" onClick={(e) => e.stopPropagation()}>
        <div className="mx-head">
          <div>
            <div className="mx-sub">Verhandlung</div>
            <div className="mx-title">{m.name}</div>
            <div className="sf-hire-sub">{m.age} Jahre · {originText(m, true)} · {m.clubId ? g.clubs[m.clubId]?.name ?? 'angestellt' : 'vereinslos'}</div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Schließen">×</button>
        </div>
        <div className="mx-body sf-hire-body">
          <div className="sf-hire-left">
            <div className="sf-prof-top">
              <Level v={lvl} big />
              <div>
                <div className="sf-prof-role">als {roleName(role)}</div>
                <div className="sf-prof-word">{fitWord(lvl)} · {growthWord(m, role)}</div>
              </div>
            </div>
            <div className="sf-sg-h">Was in dieser Stelle zählt</div>
            {weights.map(([k, w]) => {
              const v = staffLevel(m.skills?.[k] ?? 1);
              return <div key={k} className="sf-skill key"><span className="sf-skill-l">{SKILL_LABEL[k]} <i>{Math.round(w * 100)} %</i></span><LevelBar v={v} /><b>{v}</b></div>;
            })}
            <div className="sf-sg-h">Was sich ändert</div>
            <Fact k="Platz">{out ? `ersetzt ${out.name} (${fitLevel(out, role)})` : 'freie Stelle'}</Fact>
            {COACHING.has(role) ? <>
              <Fact k="Niveau des Trainerteams" strong>{Math.round(now.level)} → {Math.round(then.level)}</Fact>
              {role === 'torwarttrainer' && <Fact k="Niveau für Torhüter" strong>{Math.round(now.gkLevel)} → {Math.round(then.gkLevel)}</Fact>}
              <Fact k="Entwicklung durch das Trainerteam" strong>{sign(dev(now))} → {sign(dev(then))}</Fact>
            </> : <div className="sf-hire-effect">{TEAM_ROLE_IDS.has(role) ? '' : STAFF_BY_ID[role]?.effect}</div>}
          </div>

          <div className="sf-hire-right">
            <div className="sf-hire-row"><span>Stelle</span>
              <Select width={330} value={role} onChange={(v) => { setRole(v); setPct(95); setReply(null); }} aria-label="Stelle">
                {options.map((o) => <option key={o.id} value={o.id}>{roleName(o.id)} · {staffLevel(o.fit)}</option>)}
              </Select>
            </div>
            <div className="sf-hire-row"><span>Forderung</span><b>{fmtStaffWage(monthly(demand))}</b></div>
            <label className="sf-hire-row offer"><span>Dein Angebot</span>
              <input type="range" min={60} max={140} step={1} value={pct} aria-label="Angebot" onChange={(e) => setPct(Number(e.target.value))} />
              <b>{fmtStaffWage(monthly(factor))}</b></label>
            <div className="sf-hire-row"><span>Laufzeit</span>
              <Seg<number> size="s" value={years} onChange={setYears} options={[1, 2, 3, 4].map((y) => ({ v: y, label: `${y} ${y === 1 ? 'Jahr' : 'Jahre'}` }))} />
            </div>
            <div className="sf-hire-costs">
              <Fact k={m.clubId ? `Ablöse an ${g.clubs[m.clubId]?.shortName ?? 'den Verein'}` : 'Ablöse'}>{fee ? fmtDM(fee) : 'keine'}</Fact>
              <Fact k={out ? `Abfindung ${out.name}` : 'Abfindung'}>{sev ? fmtDM(sev) : 'keine'}</Fact>
              <Fact k="Sofort fällig" strong>{fmtDM(fee + sev)}</Fact>
            </div>
            <div className="sf-hire-hint">Ein großer Verein und eine lange Laufzeit geben Spielraum – derzeit bis {Math.round(tol * 100)} % unter der Forderung. Nach drei Absagen ist Schluss.</div>
            <div className={`sf-hire-reply ${reply || block ? 'on' : ''}`}>{block ?? reply ?? ''}</div>
            <div className="sf-hire-btns">
              <button type="button" className="b3 b3-l" onClick={onClose}>Abbrechen</button>
              <button type="button" className="b3 b3-l b3-primary" disabled={!!block || rounds >= 3} onClick={send}>Angebot machen</button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    host,
  );
}
