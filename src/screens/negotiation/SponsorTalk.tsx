// =============================================================================
// VERHANDLUNGSTISCH — Gespräch mit einem Sponsor (Wunsch Pascal: „Die Verhandlungen
// mit Sponsoren sollen so aufgebaut sein wie die Verhandlungen mit Spielern.“).
// Links der Sponsor: Logo, Branche, Land, Image, die Fläche, Reichweite und Marktwert
// deines Vereins, das Kräfteverhältnis. Mitte: Verhandlungsposition (umgekehrte Rollen –
// du forderst, er bietet) und die Vertragspunkte (Jahresbetrag, Laufzeit, Prämien,
// Klauseln, Verlängerungsoption). Rechts Stimmung, Gespräch und was der Vertrag bringt.
// Gilt für Angebote aus Sponsoring 2.0 und die Namensrechte am Stadion.
// Logik: game/sponsorTalk.ts, Rechnung engine/sponsorNegotiation.ts.
// =============================================================================
import { useEffect, useMemo, useState } from 'react';
import Icon from '../../components/Icon';
import { campDestination } from '../../data/campDestinations';
import { COUNTRY_BY_ID, SLOT_BY_ID, industryImage } from '../../data/sponsorCatalog';
import { CalendarEngine } from '../../engine/calendar';
import { yearOf } from '../../engine/economy';
import { BONUS_KEYS, type BonusKey, clauseWeight, SPONSOR_MAX_ROUNDS, type SponsorPoint, type SponsorTerms, sponsorTotal, termsClauses } from '../../engine/sponsorNegotiation';
import { clauseFixed, clauseLabel, sponsorPull } from '../../engine/sponsorship';
import { cancelSponsorTalk, industryName, namingKey, sponsorTalkView, type SponsorTalkView, submitSponsorDemand } from '../../game/sponsorTalk';
import type { Game } from '../../game/state';
import type { SponsorClause } from '../../types/sponsor';
import { fmtDM } from '../../ui/format';
import Seg from '../../ui/Seg';
import { SponsorLogo } from '../../views/finanzen/sponsor/SponsorLogo';
import { namingIndustry } from '../../views/finanzen/sponsor/model';
import { NegCard, NegFrame } from './NegFrame';
import { Amount, Balance, Mood, Row, TalkLog } from './NegParts';
import { Outcome, type OutcomeData } from './Outcome';
import { PositionBar } from './PositionBar';
import { type TermRow, TermsTable } from './TermsTable';

export interface SponsorReq { kind: 'sponsor'; offerId?: string; naming?: string }

const BONUS_LABEL: Record<BonusKey, string> = { title: 'Meisterprämie', cup: 'Pokalprämie', euro: 'Europapokal-Prämie', survive: 'Klassenerhalt-Prämie' };
const BONUS_HINT: Record<BonusKey, string> = {
  title: 'einmalig, wenn du Meister wirst.', cup: 'einmalig für den Pokalsieg.',
  euro: 'halbe Prämie für die Teilnahme am Europapokal, doppelte für den Titel.', survive: 'wenn du in der 1. Liga die Klasse hältst.',
};
const IMAGE_WORD = ['unbedenklich', 'leicht umstritten', 'umstritten', 'hoch umstritten'];
const pctText = (v: number) => `${Math.round(v * 100)} %`;
const yearsWord = (y: number) => `${y} ${y === 1 ? 'Jahr' : 'Jahre'}`;
const r500 = (x: number) => Math.max(500, Math.round(x / 500) * 500);

export function SponsorTalk({ g, req, onClose, onChange }: { g: Game; req: SponsorReq; onClose: () => void; onChange: () => void }) {
  const key = req.naming ? namingKey(req.naming) : req.offerId ?? '';
  const [tick, setTick] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const live = useMemo(() => sponsorTalkView(g, key), [g, key, tick]);
  // Nach dem Abschluss ist das Angebot weg: den letzten Stand festhalten.
  const [frozen, setFrozen] = useState<SponsorTalkView | null>(null);
  const v = frozen ?? live;
  const [offer, setOffer] = useState<SponsorTerms | null>(v?.start ?? null);
  const [locks, setLocks] = useState<SponsorPoint[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => { if (!offer && v?.start) setOffer(v.start); }, [v, offer]);

  const year = yearOf(g.calendar.currentDate);
  const today = CalendarEngine.formatDate(g.calendar.currentDate);
  const club = g.clubs[g.managedClubId];
  if (!v || !v.base) {
    return (
      <NegFrame kind="sponsor" context="Dieses Angebot liegt nicht mehr vor" onClose={onClose}
        foot={<><div className="vt-notice" /><div className="vt-actions"><button type="button" className="b3 b3-l b3-primary vt-send" onClick={onClose}>Schließen</button></div></>}>
        <div className="vt-blank">Dieses Angebot liegt nicht mehr vor.</div>
      </NegFrame>
    );
  }
  const st = v.st;
  const b = v.base;
  const src = v.src;
  const naming = (src?.kind ?? st?.kind) === 'naming';
  const partner = st?.partner ?? (src ? (src.kind === 'naming' ? src.offer.sponsor : src.offer.partner) : '');
  const dealOffer = src?.kind === 'deal' ? src.offer : null;
  const slotDef = dealOffer ? SLOT_BY_ID[dealOffer.slot] : null;
  const industry = dealOffer ? dealOffer.industry : namingIndustry(partner);
  const status = result ? (result.ok ? 'agreed' : 'failed') : v.status;
  const open = status === 'open' && !!v.ask && !!offer;
  const ended = status === 'agreed' || status === 'failed' ? status : null;
  const money = (x: number) => fmtDM(Math.round(x * v.unit));
  const short = partner.split(' ')[0];

  const send = () => {
    if (!open || !offer) return;
    const snap = v;
    const r = submitSponsorDemand(g, key, offer, locks);
    if (r.done) {
      const s2 = g.sponsorTalks?.[key] ?? snap.st;
      const o0 = Math.max(1, s2?.open0 ?? 1);
      setFrozen({ ...snap, st: s2, hist: (s2?.hist ?? []).map(([o, a]) => [o / o0, a / o0] as [number, number]) });
      setResult({ ok: r.ok, text: r.text });
      setNotice(null);
    } else setNotice(`${partner} lehnt ab – der Gegenvorschlag steht in der Spalte „${naming ? 'Firma bietet' : 'Sponsor bietet'}“.`);
    setTick((t) => t + 1);
    onChange();
  };
  const cancel = () => { cancelSponsorTalk(g, key); setTick((t) => t + 1); onChange(); };
  const set = (x: Partial<SponsorTerms>) => offer && setOffer({ ...offer, ...x });
  const toggleLock = (k: SponsorPoint) => setLocks((cur) => (cur.includes(k) ? cur.filter((y) => y !== k) : [...cur, k]));

  // ----- Zeilen -----
  const rows: TermRow[] = [];
  if (open && offer && v.ask && v.d) {
    const a = v.ask, d = v.d;
    const base = (k: SponsorPoint, met: boolean) => ({
      key: k, status: (locks.includes(k) ? 'mine' : met ? 'met' : 'open') as TermRow['status'], weight: d.weights[k] ?? 1, known: true,
      lockable: true, locked: locks.includes(k), onLock: () => toggleLock(k),
      statusTitle: locks.includes(k) ? 'Von dir für nicht verhandelbar erklärt' : met ? 'Sein Angebot deckt deine Forderung in diesem Punkt' : 'Hier forderst du mehr, als er bietet',
    });
    const step = r500(b.value / 100);
    rows.push({
      ...base('value', offer.value <= a.value), label: 'Jahresbetrag', ask: money(a.value), onAdopt: () => set({ value: a.value }),
      control: <Amount label="Jahresbetrag" value={offer.value} min={r500(b.value * 0.7)} max={r500(b.value * 1.8)} step={step} onChange={(x) => set({ value: x })} text={money(offer.value)} miss={offer.value > a.value} />,
      hint: <><b>Jahresbetrag</b> – was {naming ? 'die Firma' : 'der Sponsor'} pro Saison zahlt, in Monatsraten. {v.market ? <>Deine Marketingabteilung schätzt den Marktwert der Fläche auf rund {fmtDM(v.market)} pro Jahr.</> : null}</>,
    });
    const yOpts = Array.from({ length: b.range[1] - b.range[0] + 1 }, (_, i) => b.range[0] + i);
    rows.push({
      ...base('years', offer.years === a.years), label: 'Laufzeit', ask: yearsWord(a.years), onAdopt: () => set({ years: a.years }),
      control: <Seg<number> size="s" value={offer.years} onChange={(y) => set({ years: y })} options={yOpts.map((y) => ({ v: y, label: `${y} J.` }))} aria-label="Laufzeit" />,
      hint: <><b>Laufzeit</b> – {naming ? 'Namensrechte' : 'diese Fläche'}: {b.range[0]}–{b.range[1]} Jahre. Eine längere Bindung ist dem Sponsor etwas wert (rund 2 % Spielraum je Jahr), dafür steht der Betrag lange fest – Verlängerungen bringen später den Sprung zum Marktwert.</>,
    });
    for (const k of BONUS_KEYS) {
      if (!(b.bonuses[k] ?? 0)) continue;
      const bv = b.bonuses[k] ?? 0;
      rows.push({
        ...base(k, (offer.bonuses[k] ?? 0) <= (a.bonuses[k] ?? 0)), label: BONUS_LABEL[k], ask: a.bonuses[k] ? money(a.bonuses[k]!) : 'keine',
        onAdopt: () => set({ bonuses: { ...offer.bonuses, [k]: a.bonuses[k] } }),
        control: <Amount label={BONUS_LABEL[k]} value={offer.bonuses[k] ?? 0} min={0} max={r500(bv * 3)} step={r500(bv / 10)} onChange={(x) => set({ bonuses: { ...offer.bonuses, [k]: x || undefined } })}
          text={offer.bonuses[k] ? money(offer.bonuses[k]!) : 'keine'} miss={(offer.bonuses[k] ?? 0) > (a.bonuses[k] ?? 0)} />,
        hint: <><b>{BONUS_LABEL[k]}</b> – {BONUS_HINT[k]} Der Sponsor rechnet sie nach deiner Erfolgsaussicht ein (Chance etwa {pctText(v.ctx.p[k])} je Saison).</>,
      });
    }
    b.clauses.forEach((c, i) => {
      const pk = `c${i}` as SponsorPoint;
      const fixed = clauseFixed(c);
      const mineDrop = offer.drop.includes(i), theirDrop = a.drop.includes(i);
      rows.push({
        key: pk, label: clauseShort(c), ask: fixed ? 'nicht verhandelbar' : theirDrop ? 'gestrichen' : 'verlangt',
        onAdopt: fixed ? undefined : () => set({ drop: theirDrop ? [...new Set([...offer.drop, i])] : offer.drop.filter((x) => x !== i) }),
        control: fixed ? <span className="vt-ctl-note">bleibt im Vertrag</span>
          : <Seg<number> size="s" value={mineDrop ? 1 : 0} onChange={(x) => set({ drop: x ? [...new Set([...offer.drop, i])] : offer.drop.filter((y) => y !== i) })}
            options={[{ v: 0, label: 'bleibt' }, { v: 1, label: 'streichen' }]} aria-label={clauseLabel(c)} />,
        status: fixed ? 'their' : locks.includes(pk) ? 'mine' : !mineDrop || theirDrop ? 'met' : 'open',
        statusTitle: fixed ? 'Kern des Vertrags – der Sponsor streicht ihn nie' : undefined,
        weight: clauseWeight(c), known: true, lockable: !fixed, locked: locks.includes(pk), onLock: fixed ? undefined : () => toggleLock(pk),
        hint: <><b>{clauseLabel(c)}</b> – {CLAUSE_HINT[c.kind]}</>,
      });
    });
    if (b.optionOk) {
      rows.push({
        ...base('option', offer.option === a.option || !offer.option), label: 'Verlängerungsoption', ask: a.option ? '2 J. (+10 %)' : 'keine',
        onAdopt: () => set({ option: a.option }),
        control: <Seg<number> size="s" value={offer.option ? 1 : 0} onChange={(x) => set({ option: x === 1 })} options={[{ v: 0, label: 'keine' }, { v: 1, label: '2 J. (+10 %)' }]} aria-label="Verlängerungsoption" />,
        hint: <><b>Verlängerungsoption</b> – Im letzten Vertragsjahr kannst allein du um zwei Jahre verlängern, mit 10 % Aufschlag. Sie nützt dir; der Sponsor lässt sie sich etwas kosten.</>,
      });
    }
  }

  // ----- Abschluss -----
  let outcome: OutcomeData | null = null;
  if (ended && st) {
    const deal = st.deal;
    const termRows = (t: SponsorTerms) => [
      { k: 'Jahresbetrag', v: money(t.value) }, { k: 'Laufzeit', v: yearsWord(t.years) },
      ...BONUS_KEYS.filter((k) => t.bonuses[k]).map((k) => ({ k: BONUS_LABEL[k], v: money(t.bonuses[k]!) })),
      ...(naming ? [] : [{ k: 'Klauseln', v: termsClauses(t, b).map(clauseLabel).join(' · ') || 'keine' }]),
    ];
    const first = b.value;
    const recap = [{ k: 'Runden', v: String(st.round) }, { k: 'Erstes Angebot', v: money(first) },
      ...(deal ? [{ k: 'Abschluss', v: money(deal.value) }, { k: 'Mehr als das Erstangebot', v: `${deal.value >= first ? '+' : '−'}${pctText(Math.abs(deal.value / first - 1))}` }]
        : v.hist.length ? [{ k: 'Deine letzte Forderung', v: `${pctText(v.hist[v.hist.length - 1][0])} des Erstangebots` }] : [])];
    const camp = deal ? termsClauses(deal, b).find((c) => c.kind === 'camp') : undefined;
    const stamp = naming ? 'Verkauft' : b.renewal ? 'Verlängert' : 'Unterschrieben';
    outcome = ended === 'agreed' && deal ? {
      ok: true, stamp, date: today, parties: [g.manager?.name ?? 'Manager', partner],
      title: naming ? `${partner} gibt dem Stadion den Namen` : `${partner} wird ${slotDef?.name ?? 'Partner'}`,
      text: result?.text ?? st.endNote ?? '', terms: termRows(deal), recap,
      next: [
        naming ? `Das Stadion heißt ab sofort ${club.stadium.name}.` : b.renewal ? 'Die neuen Bedingungen gelten ab der nächsten Saison.' : 'Das Geld fließt ab sofort in Monatsraten (Finanzen › Sponsoring).',
        ...(camp && camp.kind === 'camp' ? [`Pflichtreise: ${campDestination(camp.destId)?.name ?? camp.destId} – plane das Trainingslager entsprechend.`] : []),
        ...(deal.option ? ['Die Verlängerungsoption ziehst du im letzten Vertragsjahr auf der Karteikarte.'] : []),
      ],
    } : {
      ok: false, stamp: 'Gescheitert', date: today, title: `Keine Einigung mit ${partner}`,
      text: result?.text ?? st.endNote ?? `${partner} hat die Gespräche beendet.`, termsTitle: 'Sein letztes Angebot', terms: termRows(st.ask), recap,
      next: [st.blockedUntil && st.round > 0 && !(st.endNote ?? '').startsWith('Du hast')
        ? (naming ? `${partner} meldet sich erst ab ${CalendarEngine.formatDate(st.blockedUntil)} wieder.` : 'Das Angebot ist vom Tisch. Für die Fläche melden sich im Lauf der Saison neue Interessenten.')
        : st.blockedUntil ? `Das Angebot bleibt bestehen – zu seinen letzten Bedingungen kannst du auf der Karteikarte annehmen. Neu verhandeln erst ab ${CalendarEngine.formatDate(st.blockedUntil)}.`
          : 'Das Angebot bleibt bestehen; du kannst jederzeit neu verhandeln.'],
    };
  }

  const tot = offer ? sponsorTotal(offer, v.ctx) : null;
  const img = dealOffer ? industryImage(dealOffer.industry, year, dealOffer.country) : 0;
  const pull = slotDef ? sponsorPull(club, year, slotDef.reach) : null;
  const obligations = offer ? termsClauses(offer, b).filter((c) => c.kind === 'camp' || c.kind === 'friendly' || c.kind === 'youth') : [];

  return (
    <NegFrame kind="sponsor" info="sponsorVerhandlung" onClose={onClose}
      context={<>{naming ? 'Namensrechte' : b.renewal ? 'Verlängerung' : 'Sponsoring'} · {partner}{slotDef ? ` · ${slotDef.name}` : ''}</>}
      steps={[{ label: 'Verhandlung', state: ended === 'agreed' ? 'done' : ended === 'failed' ? 'fail' : 'now' }, { label: 'Abschluss', state: ended === 'agreed' ? 'done' : 'todo' }]}
      foot={<>
        <div className="vt-notice" aria-live="polite">{ended ? '' : notice ?? (open ? 'Stelle deine Forderung ein. Ein Klick auf sein Angebot übernimmt es für diesen Punkt.' : '')}</div>
        <div className="vt-actions">
          {open && <button type="button" className="b3 b3-l vt-cancel" onClick={cancel}>Verhandlung abbrechen</button>}
          {open && <button type="button" className="b3 b3-l" onClick={() => { if (v.start) setOffer(v.start); setLocks([]); }}>Zurücksetzen</button>}
          {open && <button type="button" className="b3 b3-l" onClick={() => v.ask && setOffer({ ...v.ask, bonuses: { ...v.ask.bonuses }, drop: [...v.ask.drop] })}>Angebot übernehmen</button>}
          {open ? <button type="button" className="b3 b3-l b3-primary vt-send" onClick={send}><Icon name="contracts" size={22} /><span>Forderung stellen</span></button>
            : <button type="button" className="b3 b3-l b3-primary vt-send" onClick={onClose}><span>{ended ? 'Fertig' : 'Schließen'}</span></button>}
        </div>
      </>}>
      <aside className="vt-left">
        <NegCard title={naming ? 'Die Firma' : 'Der Sponsor'} className="vt-who">
          <div className="vt-who-head sponsor">
            <SponsorLogo name={partner} industry={industry} year={year} className="vt-sp-logo" />
            <div className="vt-who-r">
              <div className="vt-who-name">{partner}</div>
              <div className="vt-who-sub"><span>{industryName(industry)}{dealOffer ? ` · ${COUNTRY_BY_ID[dealOffer.country]?.name ?? dealOffer.country}` : ''}</span></div>
              <div className="vt-who-sub"><span>{slotDef ? slotDef.name : `Namensrechte ${club.stadium.baseName ?? club.stadium.name}`}</span></div>
            </div>
          </div>
          {dealOffer && <Row k="Image">{IMAGE_WORD[Math.min(3, img)]}</Row>}
          {pull != null && slotDef && <Row k={`Reichweite (${slotDef.reach === 'regional' ? 'regional' : slotDef.reach === 'national' ? 'national' : 'weltweit'})`}>{`${pull.toFixed(2).replace('.', ',')} × Schnitt`}</Row>}
          {v.market != null && <Row k="Marktwert der Fläche">{`≈ ${fmtDM(v.market)} / Jahr`}</Row>}
          {naming && <Row k="Stadion">{`${(club.stadium.capacity ?? 0).toLocaleString('de-DE')} Plätze`}</Row>}
          {dealOffer && <Row k="Angebot gültig bis">{CalendarEngine.formatDate(dealOffer.until)}</Row>}
          <h4 className="vt-h">Kräfteverhältnis</h4>
          <Balance levers={v.levers} me="Du" them={short} max={5} />
          {slotDef && <><h4 className="vt-h">Die Fläche</h4><div className="vt-effect">{slotDef.desc}</div></>}
        </NegCard>
      </aside>
      <div className="vt-mid">
        {outcome ? <Outcome o={outcome} /> : open && offer ? (
          <>
            <NegCard title="Verhandlungsposition" info="v2_position" className="vt-poscard" right={`Runde ${st?.round ?? 0} von ${SPONSOR_MAX_ROUNDS}`}>
              <PositionBar p={{
                reverse: true, offer: v.worth!(offer), ask: v.askWorth, open: 1, zone: v.zone, hist: v.hist, fmt: pctText,
                offerLabel: 'Deine Forderung', askLabel: st?.round ? 'Sponsor bietet' : 'Sponsor bietet (Eröffnung)',
                zoneLabel: 'Marketing schätzt: bis hier geht er mit', unit: 'Kosten für den Sponsor, gemessen an seinem ersten Angebot (= 100 %)',
                gapFmt: (x) => `${Math.round(x * 100)} Punkte`,
              }} />
            </NegCard>
            <NegCard title="Vertragspunkte" className="vt-tablecard" right={locks.length ? `${locks.length} nicht verhandelbar` : undefined}>
              <TermsTable rows={rows} roomy={rows.length <= 7} askHead={naming ? 'Firma bietet' : 'Sponsor bietet'} mineHead="Deine Forderung"
                defaultHint={<><b>Paketlogik</b> – Der Sponsor rechnet alles in Kosten pro Jahr: Eine gestrichene Klausel oder höhere Prämien kosten ihn so viel wie ein höherer Betrag. Kernklauseln gibt er erst spät oder nie her.</>} />
            </NegCard>
          </>
        ) : (
          <div className="vt-blank"><Icon name="hourglass" size={44} /><p>{v.blocked ?? 'Gerade sind keine Gespräche möglich.'}</p></div>
        )}
      </div>
      <div className="vt-side">
        <NegCard title="Stimmung" className="vt-moodcard">
          <Mood patience={st?.patience ?? 0} start={st?.start ?? 100} round={st?.round ?? 0} maxRounds={SPONSOR_MAX_ROUNDS} ended={ended} />
        </NegCard>
        <NegCard title="Gespräch" className="vt-logcard">
          <TalkLog lines={(st?.log ?? []).map((l) => ({ who: l.who, text: l.text }))} names={{ du: 'Du', sponsor: short }} />
        </NegCard>
        <NegCard title="Was der Vertrag bringt" className="vt-impact">
          <Row k="Pro Jahr" strong>{offer ? money(offer.value) : '—'}</Row>
          <Row k={offer ? `Gesamt über ${yearsWord(offer.years)}` : 'Gesamt'}>{offer ? money(offer.value * offer.years) : '—'}</Row>
          {!naming && <Row k="Prämien (erwartet je Saison)">{tot && tot.bonus > 0 ? money(tot.bonus) : 'keine'}</Row>}
          <Row k="Sein erstes Angebot">{`${money(b.value)} · ${yearsWord(b.years)}`}</Row>
          {offer && <Row k="Gegenüber dem Erstangebot" tone={offer.value >= b.value ? 'pos' : 'neg'}>{`${offer.value >= b.value ? '+' : '−'}${pctText(Math.abs(offer.value / b.value - 1))}`}</Row>}
          {!naming && <Row k="Pflichten">{obligations.length ? obligations.map((c) => (c.kind === 'camp' ? 'Pflichtreise' : c.kind === 'friendly' ? 'Freundschaftsspiel' : 'Jugend-Zweckbindung')).join(', ') : 'keine'}</Row>}
        </NegCard>
      </div>
    </NegFrame>
  );
}

/** Kurzname einer Klausel für die Tabellenzeile (voller Text im Hinweisstreifen). */
function clauseShort(k: SponsorClause): string {
  switch (k.kind) {
    case 'camp': return `Pflichtreise ${campDestination(k.destId)?.place ?? ''}`.trim();
    case 'friendly': return 'Freundschaftsspiel';
    case 'relegationExit': return 'Ausstieg bei Abstieg';
    case 'relegationCut': return `Abstieg: −${Math.round(k.cut * 100)} %`;
    case 'minPlace': return `Mind. Platz ${k.place} (−${Math.round(k.cut * 100)} %)`;
    case 'exclusive': return 'Branchen-Exklusivität';
    case 'youth': return `Jugend-Zweckbindung ${Math.round(k.share * 100)} %`;
    case 'image': return 'Umstrittener Partner';
    default: return clauseLabel(k);
  }
}

const CLAUSE_HINT: Record<string, string> = {
  camp: 'Das Trainingslager bzw. die Sommerreise findet im Herkunftsland des Sponsors statt; verpasst du es, wird eine Vertragsstrafe von einem Viertel des Jahreswerts fällig. Dem Sponsor ist das viel wert (+12 %).',
  friendly: 'Einmal im Winter spielt die Mannschaft beim Sponsor: etwas Einnahmen, die Spieler werden müde. Für ihn eine Nebensache (+4 %).',
  relegationExit: 'Steigst du ab, endet der Vertrag sofort. Wer das streicht, kostet den Sponsor rund 6 %.',
  relegationCut: 'Bei einem Abstieg sinkt der Jahresbetrag um diesen Anteil. Streichen kostet ihn rund 4 %.',
  minPlace: 'Landest du schlechter, sinkt der Betrag in der Folgesaison. Dem Sponsor wichtig (+8 %).',
  exclusive: 'Kein zweiter Partner derselben Branche, solange der Vertrag läuft. Für ihn ein Kernpunkt (+10 %).',
  youth: 'Ein Teil fließt zweckgebunden in den Nachwuchs; liegt der Jugendetat darunter, zieht sich der Partner zurück. Nicht verhandelbar.',
  image: 'Die Branche ist umstritten – die Fan-Stimmung leidet, solange der Vertrag läuft. Dafür zahlt der Sponsor mehr. Nicht verhandelbar.',
  option: 'Verlängerungsoption zu deinen Gunsten.',
};
