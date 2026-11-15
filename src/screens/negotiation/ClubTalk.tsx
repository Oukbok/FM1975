// =============================================================================
// VERHANDLUNGSTISCH — Gespräch mit einem Verein über die Ablöse (Wunsch Pascal:
// komplexer und übersichtlicher). Links der Verkäufer mit dem Kräfteverhältnis und
// der Spieler, um den es geht; in der Mitte die Verhandlungsposition (Wert deines
// Pakets für den Verkäufer gegen seine Forderung) und alle Punkte des Pakets mit
// seinem Gegenvorschlag; rechts Stimmung, Gespräch und was dich das Paket kostet.
// Logik: game/transferTalks.ts (`clubOffer`, `sellerStance`, `sellerLevers`),
// Rechnung engine/clubNegotiation.ts.
// =============================================================================
import { useState } from 'react';
import ClubCrest from '../../components/ClubCrest';
import Icon from '../../components/Icon';
import PlayerAvatar from '../../components/PlayerAvatar';
import PosBadge from '../../components/PosBadge';
import { ClubLink } from '../../components/club/ClubLink';
import { utcDate } from '../../components/player/shared';
import { CalendarEngine } from '../../engine/calendar';
import { type ClubClause, clauseMet } from '../../engine/clubNegotiation';
import { CLAUSE_FROM, type ClubPackage, packageParts, packageValue } from '../../engine/transferMarket';
import { estimateFor } from '../../game/playerPool';
import type { Game } from '../../game/state';
import {
  cancelTalk, clubOffer, inTransferWindow, scoutKnowledge, sellerLevers, sellerOf, sellerStance, swapValueFor, type TransferTalk,
} from '../../game/transferTalks';
import { fmtPrice, fmtPriceRange } from '../../ui/format';
import Seg from '../../ui/Seg';
import Select from '../../ui/Select';
import { NegCard, NegFrame, type NegStep } from './NegFrame';
import { Amount, Balance, Mood, Row, TalkLog, ValueStack } from './NegParts';
import { Outcome, type OutcomeData } from './Outcome';
import { PositionBar } from './PositionBar';
import { type TermRow, TermsTable } from './TermsTable';

const r5k = (x: number) => Math.max(5000, Math.round(x / 5000) * 5000);
const pct = (x: number) => `${Math.round(x * 100)} %`;
const payText = (p: Pick<ClubPackage, 'installments' | 'rates'>) => (p.installments ? `${p.rates ?? 2} Raten` : 'sofort');
const PART_LABEL: Record<string, string> = { fee: 'Ablöse', option: 'Kaufoption', sellOn: 'Weiterverkauf', bonus: 'Nachschlag Einsätze', euro: 'Nachschlag Europapokal', friendly: 'Ablösespiel', swap: 'Tauschspieler', buyBack: 'Rückkaufoption' };

/** Paket als Liste (Abschluss). */
export function packageTerms(g: Game, pk: ClubPackage): { k: string; v: string }[] {
  const sw = pk.swapPlayerId ? g.players[pk.swapPlayerId] : undefined;
  return [
    { k: pk.loan ? 'Leihgebühr' : 'Ablöse', v: fmtPrice(pk.fee) },
    ...(pk.loan ? [{ k: 'Kaufoption', v: fmtPrice(pk.optionFee ?? 0) }] : [{ k: 'Zahlung', v: pk.installments ? `in ${pk.rates ?? 2} Jahresraten` : 'sofort' }]),
    ...(pk.bonus ? [{ k: 'Nachschlag nach 20 Einsätzen', v: fmtPrice(pk.bonus) }] : []),
    ...(pk.euroBonus ? [{ k: 'Nachschlag bei Europapokal', v: fmtPrice(pk.euroBonus) }] : []),
    ...(pk.sellOn ? [{ k: 'Weiterverkaufsbeteiligung', v: pct(pk.sellOn) }] : []),
    ...(pk.friendly ? [{ k: 'Ablösespiel', v: 'beim Verkäufer' }] : []),
    ...(sw ? [{ k: 'Tauschspieler', v: sw.fullName }] : []),
    ...(pk.buyBack ? [{ k: 'Rückkaufoption', v: fmtPrice(pk.buyBack) }] : []),
  ];
}

export function ClubTalk({ g, talk: t, onClose, onChange, onNext, steps }: {
  g: Game; talk: TransferTalk; onClose: () => void; onChange: () => void;
  /** Nach der Einigung: weiter zum Spielergespräch. */
  onNext: () => void;
  steps?: NegStep[];
}) {
  const [, setTick] = useState(0);
  const year = Number(g.calendar.currentDate.slice(0, 4));
  const today = CalendarEngine.formatDate(g.calendar.currentDate);
  const p = g.players[t.playerId];
  const seller = sellerOf(g, t.sellerId);
  const own = g.clubs[g.managedClubId];
  const lo = r5k(Math.min(t.estimate[0], t.currentAsk) * 0.5);
  const hi = r5k(Math.max(t.estimate[1], t.currentAsk) * 1.35);
  const fee0 = r5k(Math.min(t.currentAsk, (t.estimate[0] + t.estimate[1]) / 2) * 0.85);
  const blank: ClubPackage = { fee: fee0, installments: false, sellOn: 0, bonus: 0 };
  const [pk, setPk] = useState<ClubPackage>(blank);
  const [locks, setLocks] = useState<ClubClause[]>([]);
  const [notice, setNotice] = useState<{ text: string; bad: boolean } | null>(null);
  const set = (x: Partial<ClubPackage>) => setPk((cur) => ({ ...cur, ...x }));
  const toggleLock = (k: ClubClause) => setLocks((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]));

  if (!p || !seller) {
    return (
      <NegFrame kind="club" context="Diese Verhandlung gibt es nicht mehr" onClose={onClose} steps={steps}
        foot={<><div className="vt-notice" /><div className="vt-actions"><button type="button" className="b3 b3-l b3-primary vt-send" onClick={onClose}>Schließen</button></div></>}>
        <div className="vt-blank">Diese Verhandlung gibt es nicht mehr.</div>
      </NegFrame>
    );
  }
  const st = sellerStance(g, t, pk.swapPlayerId);
  const sw = pk.swapPlayerId ? g.players[pk.swapPlayerId] : undefined;
  const swInfo = sw ? swapValueFor(g, sw, seller) : null;
  const draft: ClubPackage = { ...pk, swapValue: swInfo?.value ?? 0 };
  const worth = packageValue(draft, st ?? undefined);
  const knowledge = scoutKnowledge(g, p);
  const known = t.round >= 1 || knowledge >= 0.55;
  const c = t.counter;
  const open = t.phase === 'club';
  const agreed = t.phase === 'player' || t.phase === 'agreed' || t.phase === 'done';
  const failed = t.phase === 'failed';
  const est = estimateFor(g, t.playerId);
  const swaps = own.playerIds.map((id) => g.players[id]).filter((x) => x && !x.loan && !x.isYouth).sort((a, b) => b.overall - a.overall);
  const upfront = pk.loan || !pk.installments ? pk.fee : Math.round(pk.fee / (pk.rates ?? 2));
  const later = pk.fee - upfront;
  const over = upfront > own.finances.transferBudget;

  const send = () => {
    if (!open) return;
    const before = t.round;
    const text = clubOffer(g, t.id, {
      ...pk, rates: pk.installments ? (pk.rates ?? 2) : undefined, swapPlayerId: pk.swapPlayerId || undefined,
      optionFee: pk.loan ? (pk.optionFee ?? r5k(t.currentAsk * 1.1)) : undefined,
    }, locks);
    const refused = t.round === before && (t.phase as string) === 'club';
    setNotice((t.phase as string) === 'club' ? { text: refused ? `Nicht abgeschickt: ${text}` : 'Abgelehnt – der Gegenvorschlag steht in der Spalte „Forderung“.', bad: refused } : null);
    setTick((x) => x + 1);
    onChange();
  };
  const cancel = () => { cancelTalk(g, t.id); setTick((x) => x + 1); onChange(); };
  const adopt = () => { if (c) { setPk({ ...c, swapValue: undefined }); setLocks([]); } };

  // ----- Zeilen -----
  const askOf = (key: ClubClause, text: (x: ClubPackage) => string, none = '–') => (c ? text(c) : none);
  const status = (key: ClubClause): TermRow['status'] => (locks.includes(key) ? 'mine' : !c ? 'na' : clauseMet(key, draft, c) ? 'met' : 'open');
  const base = (key: ClubClause, lockable = true) => ({
    key, status: status(key), weight: st?.weights[key], known, lockable, locked: locks.includes(key), onLock: () => toggleLock(key), changed: !!t.asks?.includes(key),
  });
  const rows: TermRow[] = [];
  if (year >= CLAUSE_FROM.loanOption) rows.push({
    key: 'kind', label: 'Art des Geschäfts', info: 'leihe', ask: c ? (c.loan ? 'Leihe' : 'Kauf') : '–', status: 'na',
    control: <Seg<number> size="s" value={pk.loan ? 1 : 0} onChange={(v) => set(v ? { loan: true, installments: false, sellOn: 0, bonus: 0, euroBonus: 0, friendly: false, buyBack: 0, optionFee: pk.optionFee ?? r5k(t.currentAsk * 1.1) } : { loan: false })}
      options={[{ v: 0, label: 'Kauf' }, { v: 1, label: 'Leihe mit Kaufoption' }]} aria-label="Art des Geschäfts" />,
    hint: <><b>Leihe mit Kaufoption</b> – Eine Saison Leihe gegen Gebühr, danach entscheidest du über die Kaufoption. Stammspieler verleiht kaum ein Verein.</>,
  });
  rows.push({
    ...base('fee'), label: pk.loan ? 'Leihgebühr' : 'Ablöse',
    ask: c ? fmtPrice(c.fee) : t.round ? fmtPrice(t.currentAsk) : 'noch offen',
    onAdopt: c ? () => set({ fee: c.fee }) : undefined,
    control: <Amount label={pk.loan ? 'Leihgebühr' : 'Ablöse'} value={pk.fee} min={pk.loan ? 5000 : lo} max={hi} step={5000} onChange={(v) => set({ fee: v })} text={fmtPrice(pk.fee)} miss={!!c && pk.fee < c.fee} />,
    hint: <><b>{pk.loan ? 'Leihgebühr' : 'Ablöse'}</b> – der feste Betrag. Alles andere im Paket rechnet der Verkäufer mit Abschlag an – wie stark, hängt von seiner Lage ab.</>,
  });
  if (pk.loan) rows.push({
    ...base('option'), label: 'Kaufoption', info: 'leihe', ask: askOf('option', (x) => fmtPrice(x.optionFee ?? 0)), onAdopt: c ? () => set({ optionFee: c.optionFee }) : undefined,
    control: <Amount label="Kaufoption" value={pk.optionFee ?? 0} min={lo} max={hi * 1.3} step={5000} onChange={(v) => set({ optionFee: v })} text={fmtPrice(pk.optionFee ?? 0)} />,
    hint: <><b>Kaufoption</b> – Zu diesem Preis darfst du ihn am Ende der Leihe fest verpflichten. Für den Verkäufer zählt sie zu 60 %.</>,
  });
  if (!pk.loan) {
    rows.push({
      ...base('rates'), label: 'Zahlung', status: st?.noRates && known && !locks.includes('rates') ? 'their' : status('rates'),
      statusTitle: st?.noRates && known ? 'Der Verkäufer braucht das Geld sofort – darüber lässt er nicht mit sich reden.' : undefined,
      ask: c ? payText(c) : st?.noRates && known ? 'sofort' : '–', onAdopt: c ? () => set({ installments: c.installments, rates: c.rates }) : undefined,
      control: <Seg<number> size="s" value={pk.installments ? (pk.rates ?? 2) : 1} onChange={(v) => set({ installments: v > 1, rates: v === 3 ? 3 : v === 2 ? 2 : undefined })} aria-label="Zahlung"
        options={[{ v: 1, label: 'Sofort' }, { v: 2, label: '2 Raten' }, { v: 3, label: '3 Raten', disabled: year < CLAUSE_FROM.threeRates, title: year < CLAUSE_FROM.threeRates ? `erst ab ${CLAUSE_FROM.threeRates}` : undefined }]} />,
      hint: <><b>Zahlung</b> – Raten schonen dein Transferbudget: Heute zählt nur die erste Rate, der Rest wird jährlich fällig. Wer Geld braucht, rechnet spätere Raten deutlich schlechter an.</>,
    });
    rows.push({
      ...base('bonus'), label: 'Nachschlag nach Einsätzen', ask: askOf('bonus', (x) => (x.bonus ? fmtPrice(x.bonus) : 'keiner')), onAdopt: c ? () => set({ bonus: c.bonus }) : undefined,
      control: <Amount label="Nachschlag nach Einsätzen" value={pk.bonus} min={0} max={Math.max(50000, r5k(pk.fee * 0.5))} step={5000} onChange={(v) => set({ bonus: v })} text={pk.bonus ? fmtPrice(pk.bonus) : 'keiner'} miss={!!c && pk.bonus < c.bonus} />,
      hint: <><b>Nachschlag nach Einsätzen</b> – fällig am Saisonende, wenn er mindestens 20 Pflichtspiele für dich gemacht hat. Der Verkäufer rechnet ihn umso höher an, je sicherer der Spieler bei dir spielt.</>,
    });
    rows.push({
      ...base('euro'), label: 'Nachschlag bei Europapokal', ask: askOf('euro', (x) => (x.euroBonus ? fmtPrice(x.euroBonus) : 'keiner')), onAdopt: c ? () => set({ euroBonus: c.euroBonus }) : undefined,
      control: <Amount label="Nachschlag bei Europapokal" value={pk.euroBonus ?? 0} min={0} max={Math.max(50000, r5k(pk.fee * 0.3))} step={5000} onChange={(v) => set({ euroBonus: v })} text={pk.euroBonus ? fmtPrice(pk.euroBonus) : 'keiner'} miss={!!c && (pk.euroBonus ?? 0) < (c.euroBonus ?? 0)} />,
      hint: <><b>Nachschlag bei Europapokal</b> – fällig, wenn du am Saisonende auf einem Europapokal-Platz stehst und er noch bei dir spielt. Zahlt sich für dich aus, wenn der Erfolg ausbleibt.</>,
    });
    rows.push({
      ...base('sellOn'), label: 'Weiterverkaufsbeteiligung', ask: askOf('sellOn', (x) => (x.sellOn ? pct(x.sellOn) : 'keine')), onAdopt: c ? () => set({ sellOn: c.sellOn }) : undefined,
      control: <Seg<number> size="s" value={pk.sellOn} onChange={(v) => set({ sellOn: v })} options={[0, 0.1, 0.15, 0.2, 0.3].map((v) => ({ v, label: v ? pct(v) : 'keine' }))} aria-label="Weiterverkaufsbeteiligung" />,
      hint: <><b>Weiterverkaufsbeteiligung</b> – Verkaufst du ihn später weiter, bekommt der alte Verein diesen Anteil der Ablöse. Bei jungen Spielern mit Zukunft ist das dem Verkäufer viel wert.</>,
    });
    if (st && st.friendlyValue > 0) rows.push({
      ...base('friendly'), label: 'Ablösespiel', ask: c ? (c.friendly ? 'gewünscht' : 'nicht nötig') : '–', onAdopt: c ? () => set({ friendly: !!c.friendly }) : undefined,
      control: <><Seg<number> size="s" value={pk.friendly ? 1 : 0} onChange={(v) => set({ friendly: v === 1 })} options={[{ v: 0, label: 'keins' }, { v: 1, label: 'vereinbaren' }]} aria-label="Ablösespiel" />
        <span className="vt-ctl-note">Einnahmen rund {fmtPrice(st.friendlyValue)} für {seller.shortName ?? seller.name}</span></>,
      hint: <><b>Ablösespiel</b> – Du trittst zu einem Freundschaftsspiel beim Verkäufer an, die Einnahmen des Abends gehören ihm. Kostet dich kein Geld, aber deine Mannschaft etwas Frische. Bis in die 1990er ein üblicher Teil der Ablöse.</>,
    });
    rows.push({
      ...base('swap', false), label: 'Tauschspieler', ask: '–', status: 'na',
      control: <><Select className="vt-select" value={pk.swapPlayerId ?? ''} onChange={(v) => set({ swapPlayerId: v || undefined })} aria-label="Tauschspieler">
        <option value="">kein Tausch</option>
        {swaps.map((x) => <option key={x.id} value={x.id}>{x.fullName} ({x.naturalPosition}, {x.overall})</option>)}
      </Select><span className="vt-ctl-note">{swInfo ? (swInfo.value ? `zählt etwa ${fmtPrice(swInfo.value)}` : swInfo.reason) : ''}</span></>,
      hint: <><b>Tauschspieler</b> – Der Verkäufer rechnet einen deiner Spieler nach seinem eigenen Bedarf an – und nur, wenn der Spieler selbst dorthin wechseln will.</>,
    });
    if (year >= CLAUSE_FROM.buyBack) rows.push({
      ...base('buyBack'), label: 'Rückkaufoption', ask: c ? (c.buyBack ? fmtPrice(c.buyBack) : 'keine') : '–',
      control: <Seg<number> size="s" value={pk.buyBack ? 1 : 0} onChange={(v) => set({ buyBack: v ? r5k(pk.fee * 1.5) : 0 })} options={[{ v: 0, label: 'keine' }, { v: 1, label: fmtPrice(r5k(pk.fee * 1.5)) }]} aria-label="Rückkaufoption" />,
      hint: <><b>Rückkaufoption</b> – Der Verkäufer darf ihn zwei Jahre lang zu diesem Preis zurückholen. Macht ihm den Abschied leichter.</>,
    });
  }

  // ----- Abschluss -----
  const firstAsk = t.hist?.[0]?.[1] ?? t.currentAsk;
  let outcome: OutcomeData | null = null;
  if (agreed && t.pkg) {
    const v = packageValue(t.pkg, st ?? undefined);
    outcome = {
      ok: true, stamp: 'Einig', date: today, title: `Einigung mit ${seller.name}`, parties: [g.manager?.name ?? 'Manager', seller.name],
      text: `${seller.name} gibt ${p.fullName} frei.`, terms: packageTerms(g, t.pkg),
      recap: [
        { k: 'Runden', v: String(t.round) }, { k: 'Erste Forderung', v: fmtPrice(firstAsk) }, { k: 'Wert deines Pakets für den Verkäufer', v: fmtPrice(r5k(v)) },
        ...(firstAsk > v ? [{ k: 'Unter der ersten Forderung', v: `${fmtPrice(r5k(firstAsk - v))} · ${Math.round((1 - v / firstAsk) * 100)} %` }] : []),
      ],
      next: t.phase === 'player' ? [`Jetzt musst du ${p.fullName} selbst überzeugen – erst mit seiner Unterschrift ist der Wechsel perfekt.`, 'Die Ablöse wird erst mit dem Wechsel fällig.'] : ['Der Spieler hat ebenfalls zugestimmt.'],
    };
  } else if (failed) {
    outcome = {
      ok: false, stamp: 'Gescheitert', date: today, title: `Keine Einigung mit ${seller.name}`,
      text: t.endNote ?? `${seller.name} hat die Gespräche beendet.`,
      termsTitle: 'Letzte Forderung', terms: c ? packageTerms(g, c) : t.round ? [{ k: 'Forderung', v: fmtPrice(t.currentAsk) }] : [],
      recap: [{ k: 'Runden', v: String(t.round) }, ...(t.hist?.length ? [{ k: 'Dein letztes Angebot (Wert für den Verkäufer)', v: fmtPrice(r5k(t.hist[t.hist.length - 1][0])) }, { k: 'Abstand zuletzt', v: fmtPrice(r5k(Math.max(0, t.currentAsk - t.hist[t.hist.length - 1][0]))) }] : [])],
      next: [`${p.fullName} bleibt bei ${seller.name}.`, 'Eine neue Verhandlung kannst du jederzeit beginnen – der Verkäufer startet dann wieder bei seiner Eröffnungsforderung.'],
    };
  }

  const zone: [number, number] | null = t.round ? (t.walkEst ?? null) : t.estimate;
  const sellerSquad = g.clubs[seller.id] ? seller.playerIds.map((id) => g.players[id]).filter(Boolean).sort((a, b) => b.overall - a.overall) : [];
  const rank = sellerSquad.findIndex((x) => x.id === p.id);
  const role = rank < 0 ? 'unbekannt' : rank < 3 ? 'Leistungsträger' : rank < 11 ? 'Stammspieler' : rank < 16 ? 'Ergänzungsspieler' : 'Reservist';
  return (
    <NegFrame kind="club" info="verkaeuferposition" onClose={onClose} steps={steps}
      context={<>Transfer · {p.fullName} · {seller.name}</>}
      foot={<>
        <div className={`vt-notice${notice?.bad || (open && over) ? ' bad' : ''}`} aria-live="polite">
          {outcome ? '' : notice?.text ?? (over ? `Über deinem Transferbudget (${fmtPrice(own.finances.transferBudget)}) – der Vorstand gibt das nicht frei.` : 'Stelle dein Paket zusammen. Zu niedrige Angebote kosten Geduld.')}
        </div>
        <div className="vt-actions">
          {open && <button type="button" className="b3 b3-l vt-cancel" onClick={cancel}>Verhandlung abbrechen</button>}
          {open && <button type="button" className="b3 b3-l" onClick={() => { setPk(blank); setLocks([]); }}>Zurücksetzen</button>}
          {open && c && <button type="button" className="b3 b3-l" onClick={adopt}>Gegenvorschlag übernehmen</button>}
          {open ? <button type="button" className="b3 b3-l b3-primary vt-send" onClick={send}><Icon name="negotiations" size={22} /><span>Angebot abgeben</span></button>
            : t.phase === 'player' ? <button type="button" className="b3 b3-l b3-primary vt-send" onClick={onNext}><span>Weiter zum Spielergespräch</span><Icon name="navNext" size={18} /></button>
              : <button type="button" className="b3 b3-l b3-primary vt-send" onClick={onClose}><span>{outcome ? 'Fertig' : 'Schließen'}</span></button>}
        </div>
      </>}>
      <aside className="vt-left">
        <NegCard title="Der Verkäufer" className="vt-who">
          <div className="vt-who-head club">
            <ClubCrest club={seller} size={104} />
            <div className="vt-who-r">
              <div className="vt-who-name"><ClubLink id={seller.id}>{seller.name}</ClubLink></div>
              <div className="vt-who-sub"><span>{seller.finances.balance < 0 ? 'Kasse angespannt' : 'Kasse solide'}</span></div>
              <div className="vt-who-sub"><span>{t.hardness >= 0.66 ? 'verhandelt hart' : t.hardness <= 0.33 ? 'verhandelt umgänglich' : 'verhandelt sachlich'}</span></div>
            </div>
          </div>
          <h4 className="vt-h">Kräfteverhältnis</h4>
          <Balance levers={sellerLevers(g, t)} me="Du" them={seller.shortName ?? seller.name} max={5} />
          <h4 className="vt-h">Es geht um</h4>
          <div className="vt-subject">
            <PlayerAvatar player={p} club={seller} size={84} priority />
            <div>
              <div className="vt-subject-n">{p.fullName}</div>
              <div className="vt-who-sub"><PosBadge p={p} single /><span>{p.age} Jahre</span></div>
            </div>
          </div>
          <div className="vt-kpis">
            <div><b>{est && !est.exact ? `${est.ovLo}–${est.ovHi}` : p.overall}</b><span>Stärke</span></div>
            <div><b>{est ? (est.stLo === est.stHi ? `${est.st} ★` : `${est.stLo}–${est.stHi} ★`).replace(/\./g, ',') : '–'}</b><span>Potenzial</span></div>
            <div><b>{est && est.k < 0.8 ? `ca. ${fmtPrice(est.value)}` : fmtPrice(p.contract.transferValue)}</b><span>Marktwert</span></div>
          </div>
          <Row k="Vertrag bis">{utcDate(p.contract.expiryDate)}</Row>
          <Row k="Rolle im Kader">{role}</Row>
          <Row k="Forderung (Schätzung)">{fmtPriceRange(t.estimate[0], t.estimate[1])}</Row>
          <Row k="Kenntnis deines Stabs">{knowledge >= 0.7 ? 'gut' : knowledge >= 0.45 ? 'ordentlich' : 'gering'}</Row>
        </NegCard>
      </aside>
      <div className="vt-mid">
        {outcome ? <Outcome o={outcome} /> : (
          <>
            <NegCard title="Verhandlungsposition" info="v2_position" className="vt-poscard" right={t.round ? `Runde ${t.round}` : 'noch kein Angebot'}>
              <PositionBar p={{
                offer: worth, ask: t.round ? t.currentAsk : null, open: t.round ? Math.max(firstAsk, t.currentAsk) : t.estimate[1], zone, hist: t.hist ?? [], fmt: (v) => fmtPrice(r5k(v)),
                offerLabel: 'Dein Paket', askLabel: 'Forderung', askUnknown: 'offen',
                zoneLabel: t.round ? 'Sportdirektor schätzt: Schmerzgrenze des Verkäufers' : 'Sportdirektor schätzt: so viel wird er fordern',
                unit: 'Wert des Pakets für den Verkäufer – Raten, Nachschläge und Beteiligungen zählen mit Abschlag',
              }} />
            </NegCard>
            <NegCard title="Das Paket" className="vt-tablecard" right={locks.length ? `${locks.length} nicht verhandelbar` : undefined}>
              <TermsTable rows={rows} askHead={c ? 'Gegenvorschlag' : 'Forderung'} roomy
                extra={<ValueStack title="Was dein Paket dem Verkäufer wert ist" ask={t.round ? t.currentAsk : null} fmt={(x) => fmtPrice(r5k(x))}
                  parts={packageParts(draft, st ?? undefined).map((x) => ({ label: PART_LABEL[x.key] + (x.key === 'fee' && draft.installments ? ` (${draft.rates ?? 2} Raten)` : ''), value: x.value }))} />}
                defaultHint={<><b>So rechnet der Verkäufer</b> – Er bewertet das ganze Paket. Sein Gegenvorschlag ist ihm genau seine Forderung wert: Übernimmst du ihn, schlägt er ein. Erklärst du Punkte für nicht verhandelbar, sucht er den Wert bei den übrigen.</>} />
            </NegCard>
          </>
        )}
      </div>
      <div className="vt-side">
        <NegCard title="Stimmung" className="vt-moodcard">
          <Mood patience={t.patience} start={t.patience0 ?? Math.max(t.patience, 60)} round={t.round} ended={agreed ? 'agreed' : failed ? 'failed' : null} />
        </NegCard>
        <NegCard title="Gespräch" className="vt-logcard">
          <TalkLog lines={t.log.map((l) => ({ who: l.who, text: l.text }))} names={{ du: 'Du', verein: seller.shortName ?? seller.name, spieler: p.lastName, berater: 'Berater' }} />
        </NegCard>
        <NegCard title="Auswirkung" info="gehaltsbudget" className="vt-impact">
          <Row k="Transferbudget">{fmtPrice(Math.max(0, own.finances.transferBudget))}</Row>
          <Row k={pk.loan ? 'Leihgebühr jetzt' : 'Sofort fällig'} tone={over ? 'neg' : undefined} strong>{fmtPrice(upfront)}</Row>
          <div className="vt-meter"><span className={over ? 'bad' : ''} style={{ width: `${Math.min(100, (upfront / Math.max(1, own.finances.transferBudget)) * 100)}%` }} /></div>
          <Row k="Spätere Raten">{later > 0 ? fmtPrice(later) : '–'}</Row>
          <Row k="Nur bei Erfolg">{pk.bonus + (pk.euroBonus ?? 0) > 0 ? fmtPrice(pk.bonus + (pk.euroBonus ?? 0)) : '–'}</Row>
          <Row k="Höchstens insgesamt">{fmtPrice(pk.fee + pk.bonus + (pk.euroBonus ?? 0) + (pk.loan ? pk.optionFee ?? 0 : 0))}</Row>
          <Row k="Transferfenster">{inTransferWindow(g.calendar.currentDate) ? 'offen' : 'geschlossen'}</Row>
        </NegCard>
      </div>
    </NegFrame>
  );
}
