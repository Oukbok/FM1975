import { economyScale, yearOf } from '../../engine/economy';
import { StaffMember, memberMonthlySalary, methodFactor } from '../../engine/staffPeople';
import { COACH_SKILLS, CoachSkill, SKILL_LABEL, acceptTolerance, ROLE_SKILLS } from '../../engine/staffSkills';
import { Game } from '../../game/state';
import { compensationOf, demandOf, offerContract, roleLabel, severanceOf, willMove } from '../../game/trainerTeam';
import { KV, Meter } from '../../ui/DashPage';
import { fmtDMfull as fmtDM, vBar } from '../../ui/format';
import { useState } from 'react';

// =============================================================================
// Trainerteam: Personen-Detail (Fachgebiete, Karriere) und Gehaltsverhandlung.
// =============================================================================

/** Die drei stärksten Fachgebiete als Kurztext. */
export function topSkills(m: StaffMember, n = 3): string {
  const s = m.skills ?? {};
  return (Object.entries(s) as [CoachSkill, number][]).sort((a, b) => b[1] - a[1]).slice(0, n)
    .map(([k, v]) => `${SKILL_LABEL[k]} ${Math.round(v)}`).join(' · ');
}

export function originText(m: StaffMember): string {
  if (!m.exPro) return 'Quereinsteiger';
  const e = m.exPro;
  return `Ex-Profi (${e.pos}) · ${e.apps} Spiele${e.titles ? ` · ${e.titles} Titel` : ''}${e.captain ? ' · Kapitän' : ''}`;
}

/** Monochromer Qualitätsbalken (1–20 auf 0–100 abgebildet). */
export function QBar({ q }: { q: number }) {
  const v = q * 5;
  return <span className="tt-qbar"><span style={{ width: `${v}%`, background: vBar(v) }} /></span>;
}

export function PersonDetail({ g, m, own = false }: { g: Game; m: StaffMember; own?: boolean }) {
  const year = yearOf(g.calendar.currentDate);
  const scale = economyScale(year);
  const keys = new Set(Object.keys(ROLE_SKILLS[m.roleId] ?? {}));
  const club = m.clubId ? g.clubs[m.clubId] : null;
  return (
    <div className="tt-detail">
      <div className="tt-detail-col">
        <div className="dsec">Fachgebiete <span className="dim2">(Rolle: {roleLabel(m.roleId)})</span></div>
        {COACH_SKILLS.map((k) => {
          const v = m.skills?.[k] ?? 0;
          return <Meter key={k} label={<span className={keys.has(k) ? 'tt-key' : ''}>{SKILL_LABEL[k]}</span>} value={v} max={20} color={vBar(v * 5)} text={Math.round(v)} />;
        })}
        <div className="dnote mt8">Hervorgehoben: Fachgebiete, die für die Rolle zählen.</div>
      </div>
      <div className="tt-detail-col">
        <div className="dsec">Person</div>
        <KV k="Alter" v={`${m.age} Jahre`} />
        <KV k="Qualität in der Rolle" v={`${m.quality}/20`} strong />
        <KV k="Herkunft" v={originText(m)} />
        {m.exPro && <KV k="Spitzenstärke als Spieler" v={m.exPro.peak} />}
        {m.exPro?.clubs.length ? <KV k="Stationen" v={m.exPro.clubs.join(', ')} /> : null}
        <KV k="Methodenstand" v={`${m.methodYear}${methodFactor(m, year) < 0.9 ? ' (veraltet)' : ''}`} />
        <KV k="Arbeitgeber" v={own ? 'dein Verein' : club ? club.name : 'vereinslos'} />
        {m.contractEnd && <KV k="Vertrag bis" v={m.contractEnd.slice(0, 4)} />}
        <KV k="Gehalt / Monat" v={fmtDM(memberMonthlySalary(m, scale))} />
        {m.clubId && <KV k="Ablöse" v={fmtDM(compensationOf(g, m))} />}
      </div>
    </div>
  );
}

/** Gehaltsverhandlung mit einer Person vom Arbeitsmarkt. */
export function StaffNegotiation({ g, m, onClose, onDone }: { g: Game; m: StaffMember; onClose: () => void; onDone: (text: string) => void }) {
  const year = yearOf(g.calendar.currentDate);
  const scale = economyScale(year);
  const demand = demandOf(g, m);
  const rep = g.clubs[g.managedClubId]?.reputation ?? 60;
  const [factor, setFactor] = useState(Math.round(demand * 0.9 * 100) / 100);
  const [years, setYears] = useState(2);
  const [reply, setReply] = useState<string | null>(null);
  const [rounds, setRounds] = useState(0);
  const monthly = (f: number) => memberMonthlySalary({ ...m, salaryFactor: f }, scale);
  const occupied = (g.staff ?? []).find((x) => x.roleId === m.roleId);
  const tol = acceptTolerance(rep, years, m.age);
  const moves = willMove(g, m);
  const send = () => {
    const r = offerContract(g, m.id, factor, years);
    if (r.ok) { onDone(r.text); return; }
    setRounds((x) => x + 1);
    setReply(rounds >= 2 ? `${m.name} bricht die Gespräche ab.` : r.text);
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal tt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mx-head">
          <div>
            <div className="mx-sub">Verhandlung · {roleLabel(m.roleId)}</div>
            <div className="mx-title">{m.name}</div>
            <div className="dnote">{m.age} Jahre · {originText(m)} · {topSkills(m)}</div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="mx-body tt-neg">
          <PersonDetail g={g} m={m} />
          <div className="talk-form">
            <div className="talk-row"><span>Forderung</span><b>{fmtDM(monthly(demand))} / Monat</b></div>
            <label className="talk-row"><span>Dein Angebot</span>
              <input type="range" min={Math.round(demand * 50)} max={Math.round(demand * 150)} value={Math.round(factor * 100)}
                onChange={(e) => setFactor(Number(e.target.value) / 100)} />
              <b className="accent-text">{fmtDM(monthly(factor))}</b></label>
            <div className="talk-row"><span>Laufzeit</span><div className="dchips">
              {[1, 2, 3, 4].map((y) => <button key={y} className={`dchip ${years === y ? 'on' : ''}`} onClick={() => setYears(y)}>{y} J.</button>)}
            </div></div>
            {m.clubId && <div className="talk-row"><span>Ablöse an {g.clubs[m.clubId]?.shortName}</span><b>{fmtDM(compensationOf(g, m))}</b></div>}
            {occupied && <div className="dnote">Die Stelle hat {occupied.name} – er geht mit einer Abfindung von {fmtDM(severanceOf(g, occupied))}.</div>}
            <div className="dnote">Ein großer Verein und eine lange Laufzeit geben Spielraum (derzeit {Math.round(tol * 100)} % unter der Forderung). Nach drei Absagen ist Schluss.</div>
            {!moves && <div className="sp-warn">{m.name} will seinen größeren Verein nicht verlassen.</div>}
            <div className="dbtnrow">
              <button className="btn btn-primary" disabled={!moves || rounds >= 3} onClick={send}>Angebot machen</button>
              <button className="btn" onClick={onClose}>Abbrechen</button>
            </div>
            {reply && <div className="sp-reply">{reply}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
