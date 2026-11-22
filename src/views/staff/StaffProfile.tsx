// =============================================================================
// Profil einer Person: Kopf mit Eckdaten und Aktionen, alle 13 Fähigkeiten in
// vier Blöcken (Schlüssel-Fähigkeiten der betrachteten Stelle markiert) und
// ihre Eignung für die besten Stellen – mit „Anbieten“ (Arbeitsmarkt) bzw.
// „Versetzen“ (eigene Mitarbeiter).
// =============================================================================
import { ClubByName } from '../../ui/LinkedText';
import { ClubLink } from '../../components/club/ClubLink';
import { openContractScreen } from '../../screens/contract/contractOpen';
import { staffTalkBlocker } from '../../game/staffTalk';
import { Fragment, useEffect, useState } from 'react';
import { COACH_PHILOSOPHY_LABEL, COACH_STYLE_LABEL } from '../../engine/aiManager';
import { economyScale, yearOf } from '../../engine/economy';
import { memberMonthlySalary, methodFactor, type StaffMember, trainingCourseCost } from '../../engine/staffPeople';
import {
  bestRoles, fitWord, roleFit, roleName, ROLE_SKILLS, SKILL_GROUPS, SKILL_INFO, SKILL_LABEL, staffLevel, TRAIT_INFO, TRAIT_LABEL,
} from '../../engine/staffSkills';
import type { Game } from '../../game/state';
import {
  canCourse, canReassign, compensationOf, demandOf, dismiss, reassign, replacedBy,
  sendToCourse, severanceOf, slotInfo,
} from '../../game/trainerTeam';
import { Empty } from '../../ui/DashPage';
import { InfoTip } from '../../ui/InfoTip';
import { poachView } from '../../game/staffPoach';
import { anyClubName, isAbroad } from '../../game/staffLean';
import { fmtDM, fmtStaffWage } from '../../ui/format';
import { Fact, fitLevel, growthWord, Level, LevelBar, originText, type StaffScope } from './staffUi';

export function StaffProfile({ g, m, own, role, scope, onOffer, onAct }: {
  g: Game; m: StaffMember | null; own: boolean; role: string; scope: StaffScope;
  onOffer: (roleId: string) => void; onAct: (text: string, gone?: boolean) => void;
}) {
  const [confirm, setConfirm] = useState(false);
  useEffect(() => { setConfirm(false); }, [m?.id]);
  if (!m) {
    return (
      <Empty icon="staff">
        Wähle jemanden aus {scope === 'team' ? 'deinem Trainerteam' : 'deinem Stab'} oder vom Arbeitsmarkt. Jede Person kommt für jede Stelle infrage – ihr Profil zeigt, wofür sie taugt.
        Ehemalige Profis bringen ihr Spielverständnis mit; ob aus einem guten Spieler ein guter Trainer wird, zeigt sich erst im Beruf.
      </Empty>
    );
  }
  const year = yearOf(g.calendar.currentDate);
  const scale = economyScale(year);
  const view = role === 'all' ? m.roleId : role;
  const keys = ROLE_SKILLS[view] ?? {};
  const club = m.clubId ? g.clubs[m.clubId] : null;
  const block = own ? null : staffTalkBlocker(g, m, false, view);
  const pv = !own && m.clubId ? poachView(g, m, view) : null;
  const mf = methodFactor(m, year);
  // Beste Stellen der Person; die betrachtete und die eigene Stelle sind immer dabei.
  const list = bestRoles(m.skills ?? {}, year, 7);
  for (const id of [view, m.roleId]) if (ROLE_SKILLS[id] && !list.some((r) => r.id === id)) list.push({ id, fit: roleFit(m.skills, id, 1) });
  list.sort((a, b) => b.fit - a.fit);
  const extBlock = own ? staffTalkBlocker(g, m, true) : null;
  const act = (text: string, gone = false) => { setConfirm(false); onAct(text, gone); };

  return (
    <div className="sf-prof">
      <div className="sf-prof-head">
        <div className="sf-prof-top">
          <Level v={fitLevel(m, view)} big />
          <div>
            <div className="sf-prof-role">{own ? roleName(m.roleId) : `als ${roleName(view)}`}</div>
            <div className="sf-prof-word">{fitWord(fitLevel(m, view))} · {growthWord(m, view)}</div>
          </div>
        </div>
        <Fact k="Alter">{m.age} Jahre</Fact>
        <Fact k="Herkunft">{originText(m, true)}</Fact>
        {m.exPro?.clubs.length ? <Fact k="Stationen">{m.exPro.clubs.map((c, i) => <Fragment key={i}>{i ? ', ' : ''}<ClubByName g={g} name={c} /></Fragment>)}</Fact> : null}
        {m.coach && <Fact k="Spielidee">{COACH_STYLE_LABEL[m.coach.style]} · {COACH_PHILOSOPHY_LABEL[m.coach.philosophy]}</Fact>}
        <Fact k="Arbeitgeber">{own ? 'dein Verein' : club ? <ClubLink id={club.id}>{club.name}</ClubLink> : m.clubId ? `${anyClubName(g, m.clubId)}${isAbroad(g, m.clubId) ? ' (Ausland)' : ''}` : 'vereinslos'}</Fact>
        {(own || m.clubId) && <Fact k="Vertrag bis">{m.contractEnd?.slice(0, 4) ?? '–'}</Fact>}
        <Fact k={own ? 'Gehalt' : 'Forderung'} strong>{fmtStaffWage(memberMonthlySalary(own ? m : { ...m, roleId: view, salaryFactor: demandOf(g, m, view) }, scale))}</Fact>
        {!own && m.clubId && <Fact k={<>Ablöse <InfoTip k="staffAbloese" /></>}>{fmtDM(compensationOf(g, m))}</Fact>}
        {pv && <Fact k={<>Wechsel <InfoTip k="staffWechselwunsch" /></>}><span title={pv.reasons.map((r) => `${r.w >= 0 ? '+' : '−'} ${r.text}`).join('\n')}>{pv.blocker && !pv.reasons.length ? 'gesperrt' : pv.score >= 2 ? 'will gern wechseln' : pv.score >= 0 ? 'offen für Gespräche' : 'will bleiben'}</span></Fact>}
        {pv && pv.reasons.length > 0 && (
          <div className="sf-reasons">
            {pv.reasons.slice(0, 2).map((r) => <span key={r.text} className={r.w >= 0 ? 'pro' : 'con'}>{r.w >= 0 ? '+' : '−'} {r.text}</span>)}
          </div>
        )}
        {!pv && <Fact k="Methodenstand">{m.methodYear}{mf < 0.9 ? ` · veraltet (${Math.round(mf * 100)} %)` : ''}</Fact>}
        {m.traits?.map((t) => <div key={t} className="sf-trait"><b>{TRAIT_LABEL[t]}</b><span>{TRAIT_INFO[t]}</span></div>)}
        {m.home === g.managedClubId && !own && <div className="sf-trait"><b>Einer von uns</b><span>Früherer Spieler deines Vereins: kommt dir beim Gehalt entgegen und wartet ein Jahr auf dein Angebot.</span></div>}
        <div className="sf-prof-btns">
          {own ? <>
            <button type="button" className="b3 b3-s" disabled={!!extBlock} title={extBlock ?? 'Am Verhandlungstisch über Gehalt, Laufzeit und Vertragspunkte sprechen'}
              onClick={() => openContractScreen({ kind: 'staff', id: m.id })}>Verlängern</button>
            <button type="button" className="b3 b3-s" disabled={!canCourse(g, m)} title={canCourse(g, m) ? `Kosten ${fmtDM(trainingCourseCost(m, scale))} – Methodenstand ${year}, Fähigkeiten rücken ans Potenzial` : 'In diesem Jahr schon auf Fortbildung'}
              onClick={() => act(sendToCourse(g, m.id))}>Fortbildung</button>
            {confirm
              ? <button type="button" className="b3 b3-s sf-danger" onClick={() => act(dismiss(g, m.id), true)}>Abfindung {fmtDM(severanceOf(g, m))} zahlen</button>
              : <button type="button" className="b3 b3-s" onClick={() => setConfirm(true)}>Entlassen</button>}
          </> : (
            <button type="button" className="b3 b3-primary" disabled={!!block} onClick={() => onOffer(view)}>Verhandeln</button>
          )}
        </div>
        <div className="sf-prof-note">{block ?? (own && confirm ? 'Noch einmal klicken, um zu entlassen.' : '')}</div>
      </div>

      <div className="sf-prof-skills">
        {SKILL_GROUPS.map((grp) => (
          <div key={grp.id} className="sf-sg">
            <div className="sf-sg-h">{grp.label}</div>
            {grp.skills.map((k) => {
              const v = staffLevel(m.skills?.[k] ?? 1);
              const pot = m.pot?.[k] != null ? staffLevel(m.pot[k]!) : null;
              return (
                <div key={k} className={`sf-skill ${keys[k] ? ((keys[k] ?? 0) >= 0.3 ? 'key' : 'key2') : ''}`} title={SKILL_INFO[k]}>
                  <span className="sf-skill-l">{SKILL_LABEL[k]}</span>
                  <LevelBar v={v} mark={own && pot != null && pot > v + 1 ? pot : null} />
                  <b>{v}</b>
                </div>
              );
            })}
          </div>
        ))}
        <div className="sf-skills-note">Markiert: was {own ? 'in seiner Stelle' : `als ${roleName(view)}`} zählt.{own ? ' Strich im Balken: so weit kann er noch kommen.' : ''}</div>
      </div>

      <div className="sf-prof-fit">
        <div className="sf-sg-h">Eignung je Stelle</div>
        {list.slice(0, 8).map(({ id, fit }) => {
          const lvl = staffLevel(fit);
          const info = slotInfo(g, id);
          const isOwnRole = own && id === m.roleId;
          const out = !own ? replacedBy(g, id) : null;
          const can = own && !isOwnRole ? canReassign(g, m, id) : null;
          return (
            <div key={id} className={`sf-fit ${id === view ? 'cur' : ''}`}>
              <span className="sf-fit-l">{roleName(id)}</span>
              <LevelBar v={lvl} />
              <Level v={lvl} />
              <span className="sf-fit-s">{isOwnRole ? 'seine Stelle' : info.free > 0 ? 'frei' : out ? `statt ${out.name.split(' ').slice(-1)[0]} (${fitLevel(out, id)})` : 'besetzt'}</span>
              {own
                ? <button type="button" className="b3 b3-s" disabled={isOwnRole || !can?.ok} title={can?.ok === false ? can.reason : undefined} onClick={() => act(reassign(g, m.id, id))}>Versetzen</button>
                : <button type="button" className="b3 b3-s" disabled={!!block} onClick={() => onOffer(id)}>Anbieten</button>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
