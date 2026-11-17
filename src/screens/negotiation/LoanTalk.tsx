// =============================================================================
// VERHANDLUNGSTISCH — Leihe (Wunsch Pascal: Spieler ausleihen mit realistischen
// Bedingungen). Links der Stammverein mit Kräfteverhältnis und dem Spieler, in der
// Mitte Verhandlungsposition und die Punkte der Leihe (Laufzeit, Leihgebühr,
// Gehaltsanteil, Kaufoption/Kaufpflicht, Einsatzgarantie, Rückruf, Einsatz gegen den
// Stammverein, Weiterverleihung – je nach Epoche freigeschaltet), rechts Stimmung,
// Gespräch und was dich die Leihe kostet. Schritte: Verein → Spieler → Abschluss.
// Logik: game/loanTalks.ts, Rechnung engine/loanDeal.ts, Regeln data/loanRules.ts.
// =============================================================================
import { useState } from 'react';
import ClubCrest from '../../components/ClubCrest';
import Icon from '../../components/Icon';
import PlayerAvatar from '../../components/PlayerAvatar';
import PosBadge from '../../components/PosBadge';
import { ClubLink } from '../../components/club/ClubLink';
import { utcDate } from '../../components/player/shared';
import { CalendarEngine } from '../../engine/calendar';
import { lenderParts, type LoanTerms, type ObligationCond, ROLE_DE, termsLines } from '../../engine/loanDeal';
import { loanCount, loanRulesNow, seasonEndOf } from '../../game/loanLife';
import { cancelLoanTalk, draftTerms, lenderMust, loanCtx, loanLevers, loanOffer, loanOfferValue, type LoanTalk as Talk } from '../../game/loanTalks';
import type { Game } from '../../game/state';
import { inTransferWindow } from '../../game/transferTalks';
import { fmtPrice, fmtWage } from '../../ui/format';
import Seg from '../../ui/Seg';
import { NegCard, NegFrame, type NegStep } from './NegFrame';
import { Amount, Balance, Mood, Row, TalkLog, ValueStack } from './NegParts';
import { Outcome, type OutcomeData } from './Outcome';
import { PositionBar } from './PositionBar';
import { type TermRow, TermsTable } from './TermsTable';

const r5k = (x: number) => Math.max(0, Math.round(x / 5000) * 5000);
const pct = (x: number) => `${Math.round(x * 100)} %`;
const OBL_DE: Record<ObligationCond, string> = { always: 'unbedingt', apps: 'ab 20 Einsätzen', stay: 'bei Klassenerhalt' };

export function LoanTalk({ g, talkId, onClose, onChange }: { g: Game; talkId: string; onClose: () => void; onChange: () => void }) {
  const t: Talk | undefined = (g.loanTalks ?? []).find((x) => x.id === talkId);
  const [, setTick] = useState(0);
  const [tm, setTm] = useState<LoanTerms | null>(() => (t ? t.counter ?? draftTerms(g, t) : null));
  const [notice, setNotice] = useState<{ text: string; bad: boolean } | null>(null);
  const c = t ? loanCtx(g, t) : null;
  if (!t || !c || !tm) {
    return (
      <NegFrame kind="loan" context="Dieses Leihgespräch gibt es nicht mehr" onClose={onClose}
        foot={<><div className="vt-notice" /><div className="vt-actions"><button type="button" className="b3 b3-l b3-primary vt-send" onClick={onClose}>Schließen</button></div></>}>
        <div className="vt-blank">Dieses Leihgespräch gibt es nicht mehr.</div>
      </NegFrame>
    );
  }
  const { p, lender, own, role, st } = c;
  const today = g.calendar.currentDate;
  const rules = loanRulesNow(g);
  const month = Number(today.slice(5, 7));
  const end = seasonEndOf(today);
  const set = (x: Partial<LoanTerms>) => setTm((cur) => ({ ...cur!, ...x }));
  const open = t.phase === 'club';
  const failed = t.phase === 'failed';
  const agreed = t.phase === 'agreed' || t.phase === 'done';
  const must = lenderMust(g, t);
  const cnt = t.counter;
  const mv = p.contract.transferValue;
  const worth = loanOfferValue(g, t, tm);
  const k = c.months(tm.until) / c.months(end);
  const curAsk = t.round ? t.ask * k : null;
  const wageCost = p.contract.weeklyWage * 52 * c.months(tm.until) / 12;
  const over = tm.fee > own.finances.transferBudget;

  const send = () => {
    if (!open) return;
    const before = t.round;
    const text = loanOffer(g, t.id, tm);
    const refused = t.round === before && (t.phase as string) === 'club';
    setNotice({ text: refused ? `Nicht abgeschickt: ${text}` : text, bad: refused || (t.phase as string) === 'failed' });
    if (t.counter && (t.phase as string) === 'club') setTm((cur) => ({ ...cur!, ...must }));
    setTick((x) => x + 1);
    onChange();
  };
  const cancel = () => { cancelLoanTalk(g, t.id); setTick((x) => x + 1); onChange(); };

  // ----- Zeilen -----
  const status = (mine: boolean, need = false): TermRow['status'] => (need && !mine ? 'their' : !cnt ? 'na' : mine ? 'met' : 'open');
  const untilOpts = [
    ...(month >= 7 && month <= 11 && rules.year < 2022 ? [{ v: `${today.slice(0, 4)}-12-31`, label: 'Halbe Saison' }] : []),
    { v: end, label: 'Bis Saisonende' },
    { v: `${Number(end.slice(0, 4)) + 1}-06-30`, label: 'Zwei Spielzeiten', disabled: rules.maxSeasons < 2 || month <= 6, title: rules.maxSeasons < 2 ? (rules.year >= 2022 ? 'höchstens ein Jahr (FIFA)' : 'in dieser Zeit unüblich') : undefined },
  ];
  const off = (ok: boolean, from: number) => (ok ? undefined : `erst ab ${from}`); // (Zeilen außerhalb der Epoche fallen unten ganz weg)
  const allRows: TermRow[] = [
    {
      key: 'until', label: 'Laufzeit', info: 'leihLaufzeit', ask: cnt ? utcDate(cnt.until) : '–', status: status(!cnt || cnt.until === tm.until), weight: st.weights.until,
      control: <Seg<string> size="s" value={tm.until} onChange={(v) => set({ until: v })} options={untilOpts} aria-label="Laufzeit" />,
      hint: <><b>Laufzeit</b> – Eine halbe Saison (bis 31.12., Rückkehr im Winterfenster), bis zum Saisonende oder über zwei Spielzeiten. Seit 2022 höchstens ein Jahr.</>,
    },
    {
      key: 'share', label: 'Gehaltsübernahme', info: 'leihGehalt', ask: cnt ? pct(cnt.share) : '–', status: status(!cnt || tm.share >= cnt.share), weight: st.weights.share, onAdopt: cnt ? () => set({ share: cnt.share }) : undefined,
      control: <><Seg<number> size="s" value={tm.share} onChange={(v) => set({ share: v })} options={[0.25, 0.5, 0.75, 1].map((v) => ({ v, label: pct(v) }))} aria-label="Gehaltsübernahme" />
        <span className="vt-ctl-note">{fmtWage(p.contract.weeklyWage * tm.share)}</span></>,
      hint: <><b>Gehaltsübernahme</b> – Wie viel seines Gehalts du trägst. Den Rest zahlt sein Verein weiter. Für den Stammverein ist das der wichtigste Punkt.</>,
    },
    {
      key: 'fee', label: 'Leihgebühr', ask: cnt ? (cnt.fee ? fmtPrice(cnt.fee) : 'keine') : '–', status: status(!cnt || tm.fee >= cnt.fee), weight: st.weights.fee, onAdopt: cnt ? () => set({ fee: cnt.fee }) : undefined,
      control: <Amount label="Leihgebühr" value={tm.fee} min={0} max={Math.max(50000, r5k(mv * 0.3))} step={5000} onChange={(v) => set({ fee: v })} text={tm.fee ? fmtPrice(tm.fee) : 'keine'} miss={!!cnt && tm.fee < cnt.fee} />,
      hint: <><b>Leihgebühr</b> – einmalig beim Wechsel. {rules.feeCommon ? 'Seit den 90ern üblich.' : 'In dieser Zeit noch unüblich – meist reicht die Gehaltsübernahme.'}</>,
    },
    {
      key: 'option', label: 'Kaufoption', info: 'leihe', ask: cnt ? (cnt.optionFee ? fmtPrice(cnt.optionFee) : 'keine') : '–', status: status(true), weight: st.weights.option,
      control: <Seg<number> size="s" value={tm.optionFee ? 1 : 0} onChange={(v) => set(v ? { optionFee: r5k(mv * 1.1), obligation: undefined } : { optionFee: undefined })}
        options={[{ v: 0, label: 'keine' }, { v: 1, label: 'vereinbaren', disabled: !rules.clauses.option, title: off(rules.clauses.option, 2000) }]} aria-label="Kaufoption" />,
      hint: <><b>Kaufoption</b> – Zu diesem Preis darfst du ihn am Ende der Leihe fest verpflichten. Liegt sie unter seinem Marktwert, verlangt der Stammverein mehr – bei großen Talenten erst recht.</>,
    },
    ...(tm.optionFee ? [{
      key: 'optionFee', label: 'Preis der Kaufoption', ask: '–', status: 'na' as const,
      control: <Amount label="Preis der Kaufoption" value={tm.optionFee} min={r5k(mv * 0.5)} max={r5k(mv * 2.5)} step={5000} onChange={(v) => set({ optionFee: v })} text={fmtPrice(tm.optionFee)} />,
      hint: <><b>Preis der Kaufoption</b> – Marktwert heute {fmtPrice(mv)}.</>,
    }] : []),
    {
      key: 'obligation', label: 'Kaufpflicht', info: 'leihKaufpflicht', ask: cnt ? (cnt.obligation ? `${fmtPrice(cnt.obligation.fee)}` : 'keine') : '–', status: status(true), weight: st.weights.obligation,
      control: <Seg<string> size="s" value={tm.obligation?.cond ?? 'none'} onChange={(v) => set(v === 'none' ? { obligation: undefined } : { obligation: { fee: tm.obligation?.fee ?? r5k(mv), cond: v as ObligationCond, apps: 20 }, optionFee: undefined })}
        options={[{ v: 'none', label: 'keine' }, ...(['always', 'apps', 'stay'] as ObligationCond[]).map((v) => ({ v, label: OBL_DE[v], disabled: !rules.clauses.obligation, title: off(rules.clauses.obligation, 2010) }))]} aria-label="Kaufpflicht" />,
      hint: <><b>Kaufpflicht</b> – Ist die Bedingung am Saisonende erfüllt (unbedingt, 20 Pflichtspiele für dich oder Klassenerhalt), musst du ihn zum vereinbarten Preis kaufen. Der Stammverein mag die Sicherheit – außer bei Talenten, mit denen er plant.</>,
    },
    ...(tm.obligation ? [{
      key: 'oblFee', label: 'Preis bei Kaufpflicht', ask: '–', status: 'na' as const,
      control: <Amount label="Preis bei Kaufpflicht" value={tm.obligation.fee} min={r5k(mv * 0.5)} max={r5k(mv * 2.5)} step={5000} onChange={(v) => set({ obligation: { ...tm.obligation!, fee: v } })} text={fmtPrice(tm.obligation.fee)} />,
      hint: <><b>Preis bei Kaufpflicht</b> – Marktwert heute {fmtPrice(mv)}.</>,
    }] : []),
    {
      key: 'minApps', label: 'Einsatzgarantie', info: 'leihEinsatz', ask: must.minApps ? `${must.minApps} Spiele` : cnt?.minApps ? `${cnt.minApps} Spiele` : '–', weight: st.weights.minApps,
      status: status(!must.minApps || (tm.minApps ?? 0) >= must.minApps, !!must.minApps), statusTitle: must.minApps ? 'Er soll spielen – darauf besteht der Stammverein.' : undefined,
      onAdopt: must.minApps ? () => set({ minApps: must.minApps, penalty: must.penalty }) : undefined,
      control: <Seg<number> size="s" value={tm.minApps ?? 0} onChange={(v) => set(v ? { minApps: v, penalty: tm.penalty ?? r5k(Math.max(10000, mv * 0.06)) } : { minApps: undefined, penalty: undefined })}
        options={[0, 10, 15, 20].map((v) => ({ v, label: v ? `${v} Spiele` : 'keine', disabled: v > 0 && !rules.clauses.minApps, title: v > 0 ? off(rules.clauses.minApps, 2000) : undefined }))} aria-label="Einsatzgarantie" />,
      hint: <><b>Einsatzgarantie</b> – So viele Pflichtspiele sagst du zu; schaffst du es nicht, zahlst du am Ende die Strafzahlung. Talente, die bei dir nicht Stammspieler wären, gibt der Stammverein nur so her.</>,
    },
    ...(tm.minApps ? [{
      key: 'penalty', label: 'Strafzahlung', ask: must.penalty ? fmtPrice(must.penalty) : '–', status: status(!must.penalty || (tm.penalty ?? 0) >= must.penalty, !!must.penalty),
      onAdopt: must.penalty ? () => set({ penalty: must.penalty }) : undefined,
      control: <Amount label="Strafzahlung" value={tm.penalty ?? 0} min={5000} max={Math.max(50000, r5k(mv * 0.3))} step={5000} onChange={(v) => set({ penalty: v })} text={fmtPrice(tm.penalty ?? 0)} />,
      hint: <><b>Strafzahlung</b> – fällig am Leihende, wenn die zugesagten Einsätze fehlen.</>,
    }] : []),
    {
      key: 'recall', label: 'Rückrufklausel', info: 'leihRueckruf', ask: '–', status: status(true), weight: st.weights.recall,
      control: <Seg<number> size="s" value={tm.recall ? 1 : 0} onChange={(v) => set({ recall: v === 1 || undefined })} options={[{ v: 0, label: 'keine' }, { v: 1, label: 'im Januar', disabled: !rules.clauses.recall, title: off(rules.clauses.recall, 1995) }]} aria-label="Rückrufklausel" />,
      hint: <><b>Rückrufklausel</b> – Der Stammverein darf ihn im Winterfenster zurückholen, etwa wenn er bei dir kaum spielt. Für ihn ein Pluspunkt, für dich ein Risiko.</>,
    },
    {
      key: 'noParent', label: 'Gegen den Stammverein', info: 'leihStammverein', ask: must.noParent ? 'kein Einsatz' : '–', status: status(!must.noParent || !!tm.noParent, !!must.noParent), weight: st.weights.noParent,
      control: rules.parentPlay === 'banned' ? <span className="vt-ctl-note">kein Einsatz (Ligaregel)</span>
        : <Seg<number> size="s" value={tm.noParent ? 1 : 0} onChange={(v) => set({ noParent: v === 1 || undefined })} options={[{ v: 0, label: 'darf spielen' }, { v: 1, label: 'kein Einsatz' }]} aria-label="Einsatz gegen den Stammverein" />,
      hint: <><b>Einsatz gegen den Stammverein</b> – {rules.parentPlay === 'banned' ? 'In dieser Liga verbietet eine Regel den Einsatz gegen den Stammverein.' : 'In Deutschland gibt es keine Ligaregel – ausschließen lässt es sich per Absprache, das ist dem Stammverein etwas wert. In diesen Spielen fehlt er dir dann.'}</>,
    },
    {
      key: 'noSublet', label: 'Weiterverleihung', ask: must.noSublet ? 'ausgeschlossen' : '–', status: status(!must.noSublet || !!tm.noSublet, !!must.noSublet), weight: st.weights.noSublet,
      control: rules.sublet === 'banned' ? <span className="vt-ctl-note">ausgeschlossen (FIFA-Regel)</span>
        : <Seg<number> size="s" value={tm.noSublet ? 1 : 0} onChange={(v) => set({ noSublet: v === 1 || undefined })} options={[{ v: 0, label: 'offen' }, { v: 1, label: 'ausgeschlossen' }]} aria-label="Weiterverleihung" />,
      hint: <><b>Weiterverleihung</b> – Darfst du ihn an einen dritten Verein weiterverleihen? Seit 2022 verbietet die FIFA das grundsätzlich.</>,
    },
  ];
  const rows = allRows.filter((r) => {
    // Klauseln, die es in der Epoche noch nicht gibt, stehen nicht auf dem Tisch (Hinweis im Fuß der Tabelle).
    if (r.key === 'option' || r.key === 'optionFee') return rules.clauses.option;
    if (r.key === 'obligation' || r.key === 'oblFee') return rules.clauses.obligation;
    if (r.key === 'minApps' || r.key === 'penalty') return rules.clauses.minApps;
    if (r.key === 'recall') return rules.clauses.recall;
    return true;
  });
  const later = [!rules.clauses.recall && 'Rückrufklausel ab 1995', !rules.clauses.option && 'Kaufoption und Einsatzgarantie ab 2000', !rules.clauses.obligation && 'Kaufpflicht ab 2010'].filter(Boolean).join(', ');

  // ----- Abschluss -----
  const dateTxt = CalendarEngine.formatDate(today);
  let outcome: OutcomeData | null = null;
  if (agreed && t.terms) {
    outcome = {
      ok: true, stamp: t.phase === 'done' ? 'Leihe perfekt' : 'Einig', date: dateTxt, title: `${p.fullName} kommt auf Leihbasis`, parties: [g.manager?.name ?? 'Manager', lender.name],
      text: t.phase === 'done' ? `${p.fullName} spielt ab sofort für dich. ${t.playerNote ?? ''}` : `${lender.name} und ${p.lastName} sind einverstanden. Die Leihe beginnt mit dem nächsten Transferfenster.`,
      terms: termsLines(t.terms, fmtPrice, utcDate, fmtWage(p.contract.weeklyWage * t.terms.share)),
      recap: [{ k: 'Runden', v: String(t.round) }, { k: 'Rolle bei dir', v: ROLE_DE[role] }, { k: 'Vertrag beim Stammverein bis', v: utcDate(p.contract.expiryDate) }],
      next: ['Einsätze, Minuten und Entwicklung siehst du unter Transfers › Leihen.', t.terms.optionFee ? 'Am Saisonende entscheidest du über die Kaufoption.' : t.terms.obligation ? 'Ist die Bedingung erfüllt, wechselt er am Saisonende fest zu dir.' : 'Am Leihende kehrt er zu seinem Verein zurück.'],
    };
  } else if (failed) {
    outcome = {
      ok: false, stamp: 'Gescheitert', date: dateTxt, title: `Keine Leihe von ${p.fullName}`, text: t.endNote ?? `${lender.name} hat die Gespräche beendet.`,
      termsTitle: 'Letzter Stand', terms: t.counter ? termsLines(t.counter, fmtPrice, utcDate) : [], recap: [{ k: 'Runden', v: String(t.round) }],
      next: [`${p.fullName} bleibt bei ${lender.name}.`, 'Ein neues Gespräch kannst du jederzeit beginnen.'],
    };
  }
  const steps: NegStep[] = [
    { label: 'Verein', state: open ? 'now' : failed && !t.terms ? 'fail' : 'done' },
    { label: 'Spieler', state: open || (failed && !t.terms) ? 'todo' : failed ? 'fail' : 'done' },
    { label: 'Abschluss', state: t.phase === 'done' ? 'done' : agreed ? 'now' : 'todo' },
  ];
  const lc = loanCount(g, own.id);
  const lenderSquad = lender.playerIds.map((id) => g.players[id]).filter(Boolean).sort((a, b) => b.overall - a.overall);
  const rank = lenderSquad.findIndex((x) => x.id === p.id);
  const lrole = rank < 0 ? '–' : rank < 3 ? 'Leistungsträger' : rank < 11 ? 'Stammspieler' : rank < 16 ? 'Ergänzungsspieler' : 'Reservist';
  return (
    <NegFrame kind="loan" info="leihen" onClose={onClose} steps={steps}
      context={<>Leihe · {p.fullName} · {lender.name}</>}
      foot={<>
        <div className={`vt-notice${notice?.bad || (open && over) ? ' bad' : ''}`} aria-live="polite">
          {outcome ? '' : notice?.text ?? (over ? `Über deinem Transferbudget (${fmtPrice(own.finances.transferBudget)}).` : 'Stelle die Bedingungen der Leihe zusammen. Zu knappe Angebote kosten Geduld.')}
        </div>
        <div className="vt-actions">
          {open && <button type="button" className="b3 b3-l vt-cancel" onClick={cancel}>Verhandlung abbrechen</button>}
          {open && cnt && <button type="button" className="b3 b3-l" onClick={() => setTm({ ...cnt })}>Gegenvorschlag übernehmen</button>}
          {open ? <button type="button" className="b3 b3-l b3-primary vt-send" onClick={send}><Icon name="negotiations" size={22} /><span>Angebot abgeben</span></button>
            : <button type="button" className="b3 b3-l b3-primary vt-send" onClick={onClose}><span>{outcome ? 'Fertig' : 'Schließen'}</span></button>}
        </div>
      </>}>
      <aside className="vt-left">
        <NegCard title="Der Stammverein" className="vt-who">
          <div className="vt-who-head club">
            <ClubCrest club={lender} size={104} />
            <div className="vt-who-r">
              <div className="vt-who-name"><ClubLink id={lender.id}>{lender.name}</ClubLink></div>
              <div className="vt-who-sub"><span>{lender.finances.balance < 0 ? 'Kasse angespannt' : 'Kasse solide'}</span></div>
              <div className="vt-who-sub"><span>{st.hardness >= 0.66 ? 'verhandelt hart' : st.hardness <= 0.33 ? 'verhandelt umgänglich' : 'verhandelt sachlich'}</span></div>
            </div>
          </div>
          <h4 className="vt-h">Kräfteverhältnis</h4>
          <Balance levers={loanLevers(g, t)} me="Du" them={lender.shortName ?? lender.name} max={5} />
          <h4 className="vt-h">Es geht um</h4>
          <div className="vt-subject">
            <PlayerAvatar player={p} club={lender} size={84} priority />
            <div>
              <div className="vt-subject-n">{p.fullName}</div>
              <div className="vt-who-sub"><PosBadge p={p} single /><span>{p.age} Jahre</span></div>
            </div>
          </div>
          <div className="vt-kpis">
            <div><b>{Math.round(p.overall)}</b><span>Stärke</span></div>
            <div><b>{fmtWage(p.contract.weeklyWage, { unit: false })}</b><span>Gehalt</span></div>
            <div><b>{fmtPrice(mv)}</b><span>Marktwert</span></div>
          </div>
          <Row k="Rolle beim Stammverein">{lrole}</Row>
          <Row k="Rolle bei dir">{ROLE_DE[role]}</Row>
          <Row k="Vertrag bis">{utcDate(p.contract.expiryDate)}</Row>
        </NegCard>
      </aside>
      <div className="vt-mid">
        {outcome ? <Outcome o={outcome} /> : (
          <>
            <NegCard title="Verhandlungsposition" info="v2_position" className="vt-poscard" right={t.round ? `Runde ${t.round}` : 'noch kein Angebot'}>
              <PositionBar p={{
                offer: worth, ask: curAsk, open: t.ask0 * k, zone: [st.walkaway * k * 0.95, st.ask * k], hist: t.hist, fmt: (v) => fmtPrice(r5k(v)),
                offerLabel: 'Dein Paket', askLabel: 'Forderung', askUnknown: 'offen', zoneLabel: 'Sportdirektor schätzt: hier wird man sich einig',
                unit: 'Wert der Leihe für den Stammverein – übernommenes Gehalt, Gebühr und Klauseln',
              }} />
            </NegCard>
            <NegCard title="Die Leihe" className="vt-tablecard">
              <TermsTable rows={rows} askHead={cnt ? 'Gegenvorschlag' : 'Forderung'}
                extra={<ValueStack title="Was die Leihe dem Stammverein wert ist" ask={curAsk} fmt={(x) => fmtPrice(r5k(x))}
                  parts={lenderParts(tm, p, { ...st, wageCost }, role).map((x) => ({ label: x.label, value: x.value }))} />}
                defaultHint={<><b>So rechnet der Stammverein</b> – Er bewertet die ganze Leihe: eingespartes Gehalt, Leihgebühr und Klauseln. Talente gibt er nur ab, wenn sie spielen; Kaufpflicht oder billige Kaufoption schrecken ihn bei Spielern ab, mit denen er plant.{later ? ` Noch nicht üblich: ${later}.` : ''}</>} />
            </NegCard>
          </>
        )}
      </div>
      <div className="vt-side">
        <NegCard title="Stimmung" className="vt-moodcard">
          <Mood patience={t.patience} start={t.patience0} round={t.round} ended={agreed ? 'agreed' : failed ? 'failed' : null} />
        </NegCard>
        <NegCard title="Gespräch" className="vt-logcard">
          <TalkLog lines={t.log.map((l) => ({ who: l.who, text: l.text }))} names={{ du: 'Du', verein: lender.shortName ?? lender.name, spieler: p.lastName }} />
        </NegCard>
        <NegCard title="Auswirkung" info="leihgrenze" className="vt-impact">
          <Row k="Transferbudget">{fmtPrice(Math.max(0, own.finances.transferBudget))}</Row>
          <Row k="Leihgebühr jetzt" tone={over ? 'neg' : undefined} strong>{tm.fee ? fmtPrice(tm.fee) : 'keine'}</Row>
          <Row k="Dein Gehaltsanteil">{fmtWage(p.contract.weeklyWage * tm.share)}</Row>
          <Row k="Leihspieler (Grenze)">{rules.maxLoans != null ? `${lc.in + lc.out} von ${rules.maxLoans}` : `${lc.in + lc.out} · keine Grenze`}</Row>
          <Row k="Transferfenster">{inTransferWindow(today) ? 'offen' : 'geschlossen'}</Row>
        </NegCard>
      </div>
    </NegFrame>
  );
}
