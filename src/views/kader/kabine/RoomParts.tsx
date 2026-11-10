// =============================================================================
// Kabine – Bausteine: Faktorliste, Verlauf, Spieler im Fokus, Maßnahmen.
// =============================================================================
import { PlayerLink } from '../../../components/playerMenu/PlayerLink';
import { useState } from 'react';
import {
  DRAnalysis, DRFactor, MORALE_LABEL, joltLeft, TIER_LABEL, moraleStepOf, teamEventDefs,
} from '../../../engine/dressingRoom';
import { economyScale, yearOf } from '../../../engine/economy';
import { personaOf, personaTitle } from '../../../engine/persona';
import {
  appointCaptain, eventState, meetingState, roomOf, talkState, talkWeek, teamEvent, teamMeeting, toggleCouncil,
} from '../../../game/dressingRoomGame';
import { joltsOf } from '../../../game/moraleJolt';
import { Game } from '../../../game/state';
import { condBar, condColor, fmtDay, fmtPrice } from '../../../ui/format';
import { MoraleIcon } from '../../../components/status';
import Icon from '../../../components/Icon';
import { InfoTip } from '../../../ui/InfoTip';
import { PlayerTalkModal } from '../talk/PlayerTalkModal';
import PosBadge from '../../../components/PosBadge';
import { LineChart } from '../../../ui/LineChart';

const sign = (v: number) => (v > 0 ? `+${v}` : `${v}`);

/** Liste von Einflussgrößen mit Vorzeichen (größte zuerst). */
export function FactorList({ items, max = 9, empty }: { items: DRFactor[]; max?: number; empty?: string }) {
  if (!items.length) return <div className="dnote">{empty ?? 'Nichts Besonderes.'}</div>;
  return (
    <div className="kb-factors">
      {items.slice(0, max).map((f, i) => (
        <div key={i} className="kb-factor">
          <span className="kb-f-lbl">{f.label}</span>
          <span className={`kb-f-val ${f.value > 0 ? 'up' : f.value < 0 ? 'down' : ''}`}>{sign(f.value)}</span>
        </div>
      ))}
      {items.length > max && <div className="dnote">… und {items.length - max} kleinere Faktoren</div>}
    </div>
  );
}

/** Verlaufslinie der Teamstimmung (Monatswerte) mit Achse 0–100 und Wert unter der Maus. */
export function MoodSpark({ points }: { points: { date: string; mood: number }[] }) {
  if (points.length < 2) return null;
  const MON = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  const pts = points.map((p) => ({ label: MON[+p.date.slice(5, 7) - 1], tip: `${MON[+p.date.slice(5, 7) - 1]} ${p.date.slice(0, 4)}`, value: Math.round(p.mood) }));
  return <div className="kb-spark"><LineChart points={pts} fmt={(v) => `Stimmung ${v}`} fmtAxis={(v) => String(v)} compact minHeight={84} ariaLabel="Teamstimmung je Monat" /></div>;
}

/** Spieler im Fokus: Moral mit Gründen, Einfluss, Außenseiter-Gründe, Gespräch. */
export function PlayerFocus({ g, a, pid, onChange }: { g: Game; a: DRAnalysis; pid: string; onChange: () => void }) {
  const [msg, setMsg] = useState<{ pid: string; text: string } | null>(null);
  const [talk, setTalk] = useState(false);
  const p = g.players[pid];
  const o = a.byId[pid];
  if (!p || !o) return <div className="dnote">Wähle einen Spieler im Kreis oder in der Liste.</div>;
  const dr = roomOf(g.clubs[g.managedClubId]);
  const score = Math.round(p.moraleScore ?? 60);
  const trend = o.target - score;
  const ts = talkState(g, pid);
  const wk = talkWeek(g);
  const pe = personaOf(p);
  const cap = dr.captainId === pid;
  const inCouncil = !!dr.council?.includes(pid);
  const pledge = dr.pledges?.find((x) => x.pid === pid);
  const act = (f: () => { text: string }) => { setMsg({ pid, text: f().text }); onChange(); };
  return (
    <div className="kb-focus">
      <div className="kb-focus-head">
        <PosBadge p={p} />
        <span className="kb-focus-name"><PlayerLink id={p.id}>{p.fullName}</PlayerLink></span>
        <span className="kb-pill">{TIER_LABEL[o.tier]}</span>
        {cap && <span className="kb-pill">Kapitän</span>}
        {inCouncil && <span className="kb-pill">Mannschaftsrat</span>}
      </div>
      <div className="dnote">{p.age} Jahre · {p.nationality} · {o.language}{o.barrier > 0.05 ? ` (Barriere ${Math.round(o.barrier * 100)} %)` : ''} · {a.groups.find((x) => x.id === o.group)?.label} · {personaTitle(pe)}</div>
      <div className="kb-cols">
        <div>
          <div className="kb-big">
            <MoraleIcon value={score} size={26} /> <span className="kb-big-val">{score}</span>
            <span className="kb-big-lbl">Moral · {MORALE_LABEL[moraleStepOf(score)]} · Ziel {o.target} {Math.abs(trend) < 2 ? '(stabil)' : trend > 0 ? '(steigt)' : '(sinkt)'}</span>
          </div>
          <div className="kb-bar"><i style={{ width: `${score}%`, background: condBar(score) }} /><b style={{ left: `${o.target}%` }} title={`Zielwert ${o.target}`} /></div>
        </div>
        <div>
          <div className="kb-big">
            <span className="kb-big-val">{o.influence}</span>
            <span className="kb-big-lbl">Einfluss</span>
          </div>
          <div className="kb-bar"><i style={{ width: `${o.influence}%`, background: 'var(--bar-fill)' }} /></div>
        </div>
      </div>
      <div className="dsec">Einzelgespräch<InfoTip k="gespraeche" /></div>
      <div className="dbtnrow">
        <button className="btn btn-sm btn-ghost kb-talk-open" onClick={() => setTalk(true)}><Icon name="talk" size={18} /> Gespräch führen</button>
        <span className="dnote">{ts.nextOn ? `Wieder ab ${fmtDay(ts.nextOn)}. ` : ''}Diese Woche noch {wk.left} von {wk.limit} Treffen.</span>
      </div>
      <div className="dnote">
        {ts.count ? `${ts.count} Gespräch${ts.count > 1 ? 'e' : ''} in den letzten 60 Tagen – Wirkung ${Math.round(ts.wear * 100)} %. ` : ''}
        {pledge ? `Einsatz zugesagt bis ${fmtDay(pledge.until)}.` : ''}
      </div>
      {talk && <PlayerTalkModal g={g} pid={pid} onClose={() => { setTalk(false); onChange(); }} onChange={onChange} />}
      <div className="dbtnrow mt8">
        {!cap && <button className="btn btn-sm btn-ghost" onClick={() => act(() => appointCaptain(g, pid))}>Zum Kapitän ernennen</button>}
        {!cap && <button className="btn btn-sm btn-ghost" onClick={() => act(() => toggleCouncil(g, pid))}>{inCouncil ? 'Aus dem Mannschaftsrat nehmen' : 'In den Mannschaftsrat berufen'}</button>}
      </div>
      {msg && msg.pid === pid && <div className="kb-result">{msg.text}</div>}
      <div className="kb-cols">
        <div>
          <JoltList g={g} pid={pid} />
          <div className="dsec">Warum diese Moral?</div>
          <FactorList items={o.moraleWhy} />
        </div>
        <div>
          {o.outsiderWhy.length > 0 && <>
            <div className="dsec">{o.outsider ? 'Außen vor, weil' : 'Achtung'}</div>
            {o.outsiderWhy.map((r) => <div key={r} className="kb-reason">{r}</div>)}
          </>}
          <div className="dsec">Woher der Einfluss?</div>
          <FactorList items={o.influenceWhy} max={7} />
        </div>
      </div>
    </div>
  );
}

/** Sofortige Moral-Sprünge der letzten Wochen (neueste zuerst), mit Nachwirkung. */
function JoltList({ g, pid }: { g: Game; pid: string }) {
  const dr = roomOf(g.clubs[g.managedClubId]);
  const today = g.calendar.currentDate;
  const js = joltsOf(dr, pid, 4);
  if (!js.length) return null;
  return (
    <>
      <div className="dsec">Zuletzt passiert</div>
      <div className="kb-factors">
        {js.map((j, i) => {
          const left = Math.round(joltLeft(j, today));
          return (
            <div key={i} className="kb-factor kb-jolt">
              <span className="meta">{fmtDay(j.date).slice(0, 6)}</span>
              <span className="kb-f-lbl">{j.label}</span>
              <span className={`kb-f-val ${j.value > 0 ? 'up' : 'down'}`}>{sign(j.value)}</span>
              <span className="kb-j-left">{left === 0 ? 'verflogen' : `noch ${sign(left)}`}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

/** Maßnahmen für die ganze Mannschaft: Sitzung, Teamevent, Führung. */
export function TeamActions({ g, onChange }: { g: Game; onChange: () => void }) {
  const [msg, setMsg] = useState<string | null>(null);
  const club = g.clubs[g.managedClubId];
  const dr = roomOf(club);
  const today = g.calendar.currentDate;
  const ms = meetingState(g), es = eventState(g);
  const scale = economyScale(yearOf(today));
  const act = (f: () => { text: string }) => { setMsg(f().text); onChange(); };
  const name = (id?: string) => (id ? g.players[id]?.lastName ?? '–' : '–');
  return (
    <div>
      <div className="dsec">Mannschaftssitzung</div>
      <div className="dbtnrow">
        <button className="btn btn-sm btn-ghost" disabled={!!ms.nextOn} onClick={() => act(() => teamMeeting(g, 'aufbauen'))} title="Hilft vor allem bei gedrückter Stimmung, wenn die Führungsspieler mitziehen.">Aufbauen</button>
        <button className="btn btn-sm btn-ghost" disabled={!!ms.nextOn} onClick={() => act(() => teamMeeting(g, 'klartext'))} title="Wirkt in der Krise bei professionellen Mannschaften – nach Siegen kommt er schlecht an.">Klartext</button>
      </div>
      <div className="dnote">{ms.nextOn ? `Wieder möglich ab ${fmtDay(ms.nextOn)}. ` : ''}{ms.wear < 1 ? `Wirkung zurzeit ${Math.round(ms.wear * 100)} % – zu viele Sitzungen nutzen sich ab.` : 'Sparsam einsetzen – jede weitere Sitzung wirkt schwächer.'}</div>
      <div className="dsec">Teamevent</div>
      {teamEventDefs(yearOf(today)).map((d) => {
        const cost = Math.round(d.cost * scale);
        return (
          <div key={d.kind} className="dlist-row">
            <span className="grow" title={d.text}>{d.label}</span>
            <span className="meta">{fmtPrice(d.cost)}</span>
            <button className="btn btn-sm btn-ghost" disabled={!!es.nextOn || club.finances.balance < cost} onClick={() => act(() => teamEvent(g, d.kind))}>Ausrichten</button>
          </div>
        );
      })}
      <div className="dnote">{es.nextOn ? `Nächstes Teamevent ab ${fmtDay(es.nextOn)}.` : es.wear < 1 ? `Wirkung zurzeit ${Math.round(es.wear * 100)} % (kurz nach dem letzten Event).` : 'Hebt Stimmung und Zusammenhalt, Außenseiter kommen ins Gespräch.'}</div>
      <div className="dsec">Führung</div>
      <div className="dkv"><span className="dkv-k">Kapitän</span><span className="dkv-v">{name(dr.captainId)}{dr.captainSince ? <span className="muted"> · seit {fmtDay(dr.captainSince)}</span> : null}</span></div>
      <div className="dkv"><span className="dkv-k">Mannschaftsrat</span><span className="dkv-v">{dr.council?.length ? dr.council.map(name).join(', ') : 'nicht besetzt'}</span></div>
      <div className="dnote">Kapitän und Mannschaftsrat bestimmst du beim Spieler im Fokus.</div>
      {msg && <div className="kb-result">{msg}</div>}
    </div>
  );
}
