// =============================================================================
// VERHANDLUNGSTISCH — Gespräch mit einem Mitarbeiter (Einstellung für eine Stelle
// oder Verlängerung im letzten Vertragsjahr). Links die Person: Eignung für die
// Stelle, die Fähigkeiten, die dort zählen, das Kräfteverhältnis; in der Mitte die
// Verhandlungsposition und die Vertragspunkte (Gehalt, Laufzeit, Handgeld,
// Erfolgsprämie, Abfindung, Abwerbeschutz, Fortbildung); rechts Stimmung, Gespräch
// und was sich für Trainerteam und Kasse ändert.
// Logik: game/staffTalk.ts, Rechnung engine/staffNegotiation.ts.
// =============================================================================
import { useEffect, useMemo, useState } from 'react';
import Icon from '../../components/Icon';
import { STAFF_BY_ID } from '../../data/staff';
import { CalendarEngine } from '../../engine/calendar';
import { coachingTeam } from '../../engine/coaching';
import { clubTrainingFactor } from '../../engine/development';
import { yearOf } from '../../engine/economy';
import { SEV_RANK, type SeveranceRule, staffCostMonths, type StaffClause, STAFF_MAX_ROUNDS, type StaffTerms } from '../../engine/staffNegotiation';
import { type CoachSkill, fitWord, roleName, roleQuality, ROLE_SKILLS, SKILL_LABEL, staffLevel, TEAM_ROLE_IDS } from '../../engine/staffSkills';
import { ensureStaff } from '../../game/staffGame';
import { cancelStaffTalk, staffTalkView, type StaffTalkView, submitStaffOffer } from '../../game/staffTalk';
import type { Game } from '../../game/state';
import { fmtDM } from '../../ui/format';
import Seg from '../../ui/Seg';
import { fitLevel, growthWord, Level, LevelBar, originText } from '../../views/staff/staffUi';
import { NegCard, NegFrame } from './NegFrame';
import { Amount, Balance, Mood, Row, TalkLog } from './NegParts';
import { Outcome, type OutcomeData } from './Outcome';
import { PositionBar } from './PositionBar';
import { type TermRow, TermsTable } from './TermsTable';

const COACHING = new Set(['cheftrainer', 'cotrainer', 'torwarttrainer', 'konditionstrainer', 'athletiktrainer', 'sportpsychologe', 'fussballpsychologe']);
const SEV_LABEL: Record<SeveranceRule, string> = { cap: 'höchstens 3 Monate', standard: 'halbe Restlaufzeit', full: 'volle Restlaufzeit' };
const pctText = (v: number) => `${Math.round(v * 100)} %`;

export interface StaffReq { kind: 'staff'; id: string; role?: string; replaceId?: string }

export function StaffTalk({ g, req, onClose, onChange }: { g: Game; req: StaffReq; onClose: () => void; onChange: () => void }) {
  const [tick, setTick] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const live = useMemo(() => staffTalkView(g, req.id, req.role, req.replaceId), [g, req, tick]);
  // Nach dem Abschluss ändert sich die Lage (die Person ist angestellt): den letzten Stand festhalten.
  const [frozen, setFrozen] = useState<StaffTalkView | null>(null);
  const v = frozen ?? live;
  const [offer, setOffer] = useState<StaffTerms | null>(v?.start ?? null);
  const [locks, setLocks] = useState<StaffClause[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => { if (!offer && v?.start) setOffer(v.start); }, [v, offer]);

  const year = yearOf(g.calendar.currentDate);
  const today = CalendarEngine.formatDate(g.calendar.currentDate);
  const club = g.clubs[g.managedClubId];
  if (!v) {
    return (
      <NegFrame kind="staff" context="Diese Person ist nicht mehr verfügbar" onClose={onClose}
        foot={<><div className="vt-notice" /><div className="vt-actions"><button type="button" className="b3 b3-l b3-primary vt-send" onClick={onClose}>Schließen</button></div></>}>
        <div className="vt-blank">Diese Person ist nicht mehr verfügbar.</div>
      </NegFrame>
    );
  }
  const { m, role } = v;
  const st = v.st;
  const status = result ? (result.ok ? 'agreed' : 'failed') : v.status;
  const open = status === 'open' && !!v.ask && !!offer && !!v.d;
  const ended = status === 'agreed' || status === 'failed' ? status : null;
  const lvl = fitLevel(m, role);
  const weights = Object.entries(ROLE_SKILLS[role] ?? {}).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 4) as [CoachSkill, number][];
  const money = (monthsOfUnit: number) => fmtDM(Math.round(v.unit * monthsOfUnit));
  const wageText = (f: number) => `${fmtDM(Math.round(v.unit * f * 12))} / Jahr`;

  const send = () => {
    if (!open || !offer) return;
    const snap = v;
    const r = submitStaffOffer(g, req.id, offer, locks, req.replaceId);
    if (r.done) {
      // Den Gesprächsstand vor dem Wechsel der Lage einfrieren (Verlauf steht im gespeicherten Zustand).
      setFrozen({ ...snap, st: g.staffTalks?.[req.id] ?? snap.st, hist: (g.staffTalks?.[req.id]?.hist ?? []).map(([o, a]) => [o / Math.max(0.01, snap.st?.open0 ?? 1), a / Math.max(0.01, snap.st?.open0 ?? 1)] as [number, number]) });
      setResult({ ok: r.ok, text: r.text });
      setNotice(null);
    } else setNotice(`${m.name} lehnt ab – der Gegenvorschlag steht in der Spalte „Forderung“.`);
    setTick((t) => t + 1);
    onChange();
  };
  const cancel = () => { cancelStaffTalk(g, req.id); setTick((t) => t + 1); onChange(); };
  const set = (x: Partial<StaffTerms>) => offer && setOffer({ ...offer, ...x });
  const toggleLock = (k: StaffClause) => setLocks((cur) => (cur.includes(k) ? cur.filter((y) => y !== k) : [...cur, k]));

  // ----- Zeilen -----
  const rows: TermRow[] = [];
  if (open && offer && v.ask && v.d) {
    const a = v.ask, d = v.d;
    const base = (key: StaffClause, met: boolean) => ({
      key, status: (locks.includes(key) ? 'mine' : met ? 'met' : 'open') as TermRow['status'], weight: d.weights[key], lockable: true, locked: locks.includes(key), onLock: () => toggleLock(key),
    });
    rows.push({
      ...base('wage', offer.factor >= a.factor), label: 'Gehalt', ask: wageText(a.factor), onAdopt: () => set({ factor: a.factor }),
      control: <Amount label="Gehalt" value={Math.round(offer.factor * 100)} min={Math.round(a.factor * 55)} max={Math.round(a.factor * 140)} step={1} onChange={(x) => set({ factor: x / 100 })} text={wageText(offer.factor)} miss={offer.factor < a.factor} />,
      hint: <><b>Gehalt</b> – das Jahresgehalt für diese Stelle. Seine Forderung richtet sich nach der Eignung für die Stelle; wer anderswo unter Vertrag steht, verlangt mehr.</>,
    });
    rows.push({
      ...base('years', offer.years === a.years), label: 'Laufzeit', ask: `${a.years} ${a.years === 1 ? 'Jahr' : 'Jahre'}`, onAdopt: () => set({ years: a.years }),
      control: <Seg<number> size="s" value={offer.years} onChange={(y) => set({ years: y })} options={[1, 2, 3, 4].map((y) => ({ v: y, label: `${y} ${y === 1 ? 'Jahr' : 'Jahre'}` }))} aria-label="Laufzeit" />,
      hint: <><b>Laufzeit</b> – Wunsch: {d.range[0] === d.range[1] ? `${d.range[0]} Jahre` : `${d.range[0]}–${d.range[1]} Jahre`}. Ältere suchen Sicherheit, begehrte junge Trainer binden sich ungern lange. Eine lange Laufzeit macht eine Entlassung teurer.</>,
    });
    rows.push({
      ...base('signing', offer.signing >= a.signing), label: 'Handgeld', ask: a.signing ? `${money(a.factor * a.signing)}` : 'keins', onAdopt: () => set({ signing: a.signing }),
      control: <Amount label="Handgeld" value={offer.signing} min={0} max={6} step={1} onChange={(x) => set({ signing: x })} text={offer.signing ? money(offer.factor * offer.signing) : 'keins'} miss={offer.signing < a.signing} />,
      hint: <><b>Handgeld</b> – einmalig bei der Unterschrift, in Monatsgehältern. Gut, um jemanden aus einem laufenden Vertrag zu locken, ohne das Gehalt dauerhaft zu erhöhen.</>,
    });
    rows.push({
      ...base('bonus', offer.bonus >= a.bonus), label: 'Erfolgsprämie', ask: a.bonus ? money(a.factor * a.bonus) : 'keine', onAdopt: () => set({ bonus: a.bonus }),
      control: <Amount label="Erfolgsprämie" value={offer.bonus} min={0} max={6} step={1} onChange={(x) => set({ bonus: x })} text={offer.bonus ? money(offer.factor * offer.bonus) : 'keine'} miss={offer.bonus < a.bonus} />,
      hint: <><b>Erfolgsprämie</b> – fällig am Saisonende, wenn du das Saisonziel des Vorstands erreichst. Kostet nur bei Erfolg; Trainer rechnen sie höher an als andere.</>,
    });
    rows.push({
      ...base('severance', SEV_RANK[offer.severance] >= SEV_RANK[a.severance]), label: 'Abfindung bei Entlassung', ask: SEV_LABEL[a.severance], onAdopt: () => set({ severance: a.severance }),
      control: <Seg<SeveranceRule> size="s" value={offer.severance} onChange={(x) => set({ severance: x })} options={(['cap', 'standard', 'full'] as SeveranceRule[]).map((x) => ({ v: x, label: SEV_LABEL[x] }))} aria-label="Abfindung" />,
      hint: <><b>Abfindung</b> – was du zahlst, wenn du ihn vor Vertragsende entlässt. „Höchstens 3 Monate“ hält dich beweglich, kostet aber Gehalt; „volle Restlaufzeit“ gibt ihm Sicherheit und macht ihn günstiger.</>,
    });
    rows.push({
      ...base('protect', !offer.protect || a.protect), label: 'Abwerbeschutz', ask: a.protect ? 'einverstanden' : 'lieber nicht', onAdopt: () => set({ protect: a.protect }),
      control: <Seg<number> size="s" value={offer.protect ? 1 : 0} onChange={(x) => set({ protect: x === 1 })} options={[{ v: 0, label: 'keiner' }, { v: 1, label: 'vereinbaren' }]} aria-label="Abwerbeschutz" />,
      hint: <><b>Abwerbeschutz</b> – Solange der Vertrag läuft, wechselt er zu keinem anderen Verein. Wertvoll bei Spitzenkräften; ehrgeizige Leute lassen ihn sich bezahlen.</>,
    });
    if (v.ctx?.canCourse) rows.push({
      ...base('course', offer.course || !a.course), label: 'Fortbildung', ask: a.course ? 'gewünscht' : 'nicht nötig', onAdopt: () => set({ course: a.course }),
      control: <><Seg<number> size="s" value={offer.course ? 1 : 0} onChange={(x) => set({ course: x === 1 })} options={[{ v: 0, label: 'keine' }, { v: 1, label: 'zusagen' }]} aria-label="Fortbildung" />
        <span className="vt-ctl-note">kostet {money(offer.factor * 3)}</span></>,
      hint: <><b>Fortbildung</b> – Du schickst ihn gleich nach der Unterschrift auf einen Lehrgang (drei Monatsgehälter): Methodenstand von heute, seine Fähigkeiten rücken ein Stück ans Potenzial.</>,
    });
  }

  // ----- Auswirkung -----
  const staff = ensureStaff(g);
  const squad = club?.playerIds.length ?? 24;
  const rep = club?.reputation ?? 60;
  const now = coachingTeam(staff, squad, year, rep);
  const then = v.own ? now : coachingTeam([...staff.filter((x) => x !== v.replaced), { ...m, roleId: role, quality: roleQuality(m.skills, role, m.quality) }], squad, year, rep);
  const dev = (t: typeof now) => (club ? Math.round((clubTrainingFactor(club, t.extra) / clubTrainingFactor(club, 0) - 1) * 100) : 0);
  const sign = (x: number) => `${x >= 0 ? '+' : '−'}${Math.abs(x)} %`;
  const cost = offer && v.ctx ? staffCostMonths(offer, v.ctx.pGoal) : null;

  // ----- Abschluss -----
  let outcome: OutcomeData | null = null;
  if (ended && st) {
    const deal = st.deal;
    const hist = v.hist;
    const terms = (t: StaffTerms) => [
      { k: 'Gehalt', v: wageText(t.factor) }, { k: 'Laufzeit', v: `${t.years} ${t.years === 1 ? 'Jahr' : 'Jahre'}` },
      ...(t.signing ? [{ k: 'Handgeld', v: money(t.factor * t.signing) }] : []), ...(t.bonus ? [{ k: 'Erfolgsprämie', v: `${money(t.factor * t.bonus)} bei erreichtem Saisonziel` }] : []),
      { k: 'Abfindung bei Entlassung', v: SEV_LABEL[t.severance] }, ...(t.protect ? [{ k: 'Abwerbeschutz', v: 'vereinbart' }] : []), ...(t.course ? [{ k: 'Fortbildung', v: 'zugesagt' }] : []),
    ];
    const recap = [{ k: 'Runden', v: String(st.round) }, ...(v.d ? [{ k: 'Erste Forderung', v: wageText(v.d.ask.factor) }] : []),
      ...(deal ? [{ k: 'Abschluss', v: wageText(deal.factor) }] : hist.length ? [{ k: 'Dein letztes Angebot', v: `${pctText(hist[hist.length - 1][0])} der ersten Forderung` }] : [])];
    outcome = ended === 'agreed' ? {
      ok: true, stamp: v.own ? 'Verlängert' : 'Eingestellt', date: today, parties: [g.manager?.name ?? 'Manager', m.name],
      title: v.own ? `${m.name} bleibt` : `${m.name} kommt als ${roleName(role)}`, text: result?.text ?? st.endNote ?? '', terms: deal ? terms(deal) : [], recap,
      next: [v.own ? 'Der neue Vertrag gilt ab sofort.' : `${m.name} fängt sofort an.`,
        ...(COACHING.has(role) && !v.own ? [`Niveau des Trainerteams ${Math.round(now.level)} – die Wirkung auf die Entwicklung siehst du unter Training › Trainerteam.`] : [])],
    } : {
      ok: false, stamp: 'Gescheitert', date: today, title: `Keine Einigung mit ${m.name}`, text: result?.text ?? st.endNote ?? `${m.name} hat die Gespräche beendet.`,
      termsTitle: 'Seine letzte Forderung', terms: terms(st.ask), recap,
      next: [st.blockedUntil ? `${m.name} will erst ab ${CalendarEngine.formatDate(st.blockedUntil)} wieder reden.` : 'Ein neuer Anlauf ist später möglich.', v.own ? 'Sein Vertrag läuft weiter – ohne Verlängerung entscheidet er am Vertragsende selbst.' : 'Die Stelle bleibt, wie sie ist. Der Arbeitsmarkt hat weitere Kandidaten.'],
    };
  }

  return (
    <NegFrame kind="staff" info="staffVerhandlung" onClose={onClose}
      context={<>{v.own ? 'Vertragsverlängerung' : 'Einstellung'} · {m.name} · {roleName(role)}</>}
      steps={[{ label: v.own ? 'Verlängerung' : 'Verhandlung', state: ended === 'agreed' ? 'done' : ended === 'failed' ? 'fail' : 'now' }, { label: 'Abschluss', state: ended === 'agreed' ? 'done' : 'todo' }]}
      foot={<>
        <div className="vt-notice" aria-live="polite">{ended ? '' : notice ?? (open ? 'Stelle dein Angebot ein. Ein Klick auf eine Forderung übernimmt sie für diesen Punkt.' : '')}</div>
        <div className="vt-actions">
          {open && <button type="button" className="b3 b3-l vt-cancel" onClick={cancel}>Verhandlung abbrechen</button>}
          {open && <button type="button" className="b3 b3-l" onClick={() => { if (v.start) setOffer(v.start); setLocks([]); }}>Zurücksetzen</button>}
          {open && <button type="button" className="b3 b3-l" onClick={() => v.ask && setOffer({ ...v.ask })}>Forderung übernehmen</button>}
          {open ? <button type="button" className="b3 b3-l b3-primary vt-send" onClick={send}><Icon name="contracts" size={22} /><span>Angebot machen</span></button>
            : <button type="button" className="b3 b3-l b3-primary vt-send" onClick={onClose}><span>{ended ? 'Fertig' : 'Schließen'}</span></button>}
        </div>
      </>}>
      <aside className="vt-left">
        <NegCard title={v.own ? 'Dein Mitarbeiter' : 'Der Kandidat'} className="vt-who">
          <div className="vt-who-head staff">
            <Level v={lvl} big />
            <div className="vt-who-r">
              <div className="vt-who-name">{m.name}</div>
              <div className="vt-who-sub"><span>als {roleName(role)} · {fitWord(lvl)}</span></div>
              <div className="vt-who-sub"><span>{m.age} Jahre · {originText(m, true)}</span></div>
            </div>
          </div>
          <Row k="Derzeit">{v.own ? `bei dir bis ${m.contractEnd?.slice(0, 4) ?? '—'}` : m.clubId ? g.clubs[m.clubId]?.name ?? 'angestellt' : 'vereinslos'}</Row>
          <Row k="Entwicklung">{growthWord(m, role)}</Row>
          <h4 className="vt-h">Kräfteverhältnis</h4>
          <Balance levers={v.levers} me="Du" them={m.name.split(' ').slice(-1)[0]} max={5} />
          <h4 className="vt-h">Was in dieser Stelle zählt</h4>
          {weights.map(([k, w]) => {
            const x = staffLevel(m.skills?.[k] ?? 1);
            return <div key={k} className="sf-skill key"><span className="sf-skill-l">{SKILL_LABEL[k]} <i>{Math.round(w * 100)} %</i></span><LevelBar v={x} /><b>{x}</b></div>;
          })}
        </NegCard>
      </aside>
      <div className="vt-mid">
        {outcome ? <Outcome o={outcome} /> : open && offer ? (
          <>
            <NegCard title="Verhandlungsposition" info="v2_position" className="vt-poscard" right={`Runde ${st?.round ?? 0} von ${STAFF_MAX_ROUNDS}`}>
              <PositionBar p={{
                offer: v.worth!(offer), ask: v.askWorth, open: 1, zone: v.zone, hist: v.hist, fmt: pctText,
                offerLabel: 'Dein Paket', askLabel: st?.round ? 'Forderung' : 'Forderung (Eröffnung)',
                zoneLabel: 'Dein Stab schätzt: ab hier sagt er zu', unit: 'Wert für ihn, gemessen an seiner ersten Forderung (= 100 %)',
                gapFmt: (x) => `${Math.round(x * 100)} Punkte`,
              }} />
            </NegCard>
            <NegCard title="Vertragspunkte" className="vt-tablecard" right={locks.length ? `${locks.length} nicht verhandelbar` : undefined}>
              <TermsTable rows={rows} roomy defaultHint={<><b>Paketlogik</b> – Auch Mitarbeiter bewerten das ganze Paket: Handgeld, Erfolgsprämie und Sicherheit können ein niedrigeres Gehalt ausgleichen.</>} />
            </NegCard>
          </>
        ) : (
          <div className="vt-blank"><Icon name="hourglass" size={44} /><p>{v.blocked ?? 'Gerade sind keine Gespräche möglich.'}</p></div>
        )}
      </div>
      <div className="vt-side">
        <NegCard title="Stimmung" className="vt-moodcard">
          <Mood patience={st?.patience ?? 0} start={st?.start ?? 100} round={st?.round ?? 0} maxRounds={STAFF_MAX_ROUNDS} ended={ended} />
        </NegCard>
        <NegCard title="Gespräch" className="vt-logcard">
          <TalkLog lines={(st?.log ?? []).map((l) => ({ who: l.who, text: l.text }))} names={{ du: 'Du', person: m.name.split(' ').slice(-1)[0] }} />
        </NegCard>
        <NegCard title="Auswirkung" className="vt-impact">
          {!v.own && <Row k="Platz">{v.replaced ? `ersetzt ${v.replaced.name} (${fitLevel(v.replaced, role)})` : 'freie Stelle'}</Row>}
          {COACHING.has(role) && !v.own ? <>
            <Row k="Niveau des Trainerteams" strong>{Math.round(now.level)} → {Math.round(then.level)}</Row>
            <Row k="Entwicklung der Spieler" strong>{sign(dev(now))} → {sign(dev(then))}</Row>
          </> : !TEAM_ROLE_IDS.has(role) && !v.own ? <div className="vt-effect">{STAFF_BY_ID[role]?.effect}</div> : null}
          <Row k="Kosten erstes Jahr">{cost ? money(cost.first) : '—'}</Row>
          <Row k={offer ? `Gesamt über ${offer.years} ${offer.years === 1 ? 'Jahr' : 'Jahre'}` : 'Gesamt'}>{cost ? money(cost.total) : '—'}</Row>
          {!v.own && <Row k={m.clubId ? `Ablöse an ${g.clubs[m.clubId]?.shortName ?? 'den Verein'}` : 'Ablöse'}>{v.fee ? fmtDM(v.fee) : 'keine'}</Row>}
          {!v.own && <Row k={v.replaced ? `Abfindung ${v.replaced.name}` : 'Abfindung'}>{v.severance ? fmtDM(v.severance) : 'keine'}</Row>}
          <Row k="Sofort fällig" strong>{fmtDM(v.fee + v.severance + (cost ? Math.round(v.unit * cost.oneOff) : 0))}</Row>
        </NegCard>
      </div>
    </NegFrame>
  );
}
