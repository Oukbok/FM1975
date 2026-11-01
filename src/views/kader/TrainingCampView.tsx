import { useState } from 'react';
import { campDestination } from '../../data/campDestinations';
import { campLodging, lodgingsFor } from '../../data/campLodgings';
import { economyScale, yearOf } from '../../engine/economy';
import {
  CAMP_FOCUS, CAMP_FOCUS_ORDER, CAMP_MAX_DAYS, CAMP_MIN_DAYS, CampFocus, campCostBase, campMonth, campOutlook, campYear, destinationsFor,
} from '../../engine/trainingCamp';
import { Game } from '../../game/state';
import { bookCamp, campObligation, campWindow, cancelCamp, ownBooking, quoteCamp } from '../../game/trainingCampGame';
import { CampSeason, campState, daysBetween } from '../../game/winterShared';
import { DashBox, DashPage, Empty, KV } from '../../ui/DashPage';
import { fmtDM, fmtDay } from '../../ui/format';
import { ClimateStrip, DestinationFacts, clean, DestinationList, LodgingTable, OutlookList, campMilestones, tradeoffs } from './campParts';

// =============================================================================
// TRAININGSLAGER — Ziel → Unterkunft/Anlage → Schwerpunkt → Dauer/Testspiele,
// Vorschau der Wirkung, Buchung, Verlauf und Ziele der Liga.
// Spielablauf: game/trainingCampGame.ts · Ziele: data/campDestinations.ts ·
// Unterkünfte: data/campLodgings.ts · Rechnung: engine/trainingCamp.ts
// =============================================================================
export function TrainingCampView({ g, onChange }: { g: Game; onChange: () => void }) {
  const club = g.clubs[g.managedClubId];
  const today = g.calendar.currentDate;
  const sw = campWindow(g, 'summer');
  const initSeason: CampSeason = today > sw.to ? 'winter' : 'summer';
  const pickFor = (s: CampSeason) => {
    const b = ownBooking(g, s);
    if (b) return { dest: b.destId, lodging: b.lodgingId, focus: b.focus ?? 'ausgewogen' as CampFocus };
    const ob = campObligation(g, club, s);
    const first = destinationsFor(s, campYear(g.season, s), club.reputation, ob).find((x) => x.status.ok)?.d.id;
    return { dest: first ?? '', lodging: undefined as string | undefined, focus: 'ausgewogen' as CampFocus };
  };
  const [season, setSeason] = useState<CampSeason>(initSeason);
  const [mode, setMode] = useState<'ziele' | 'verlauf'>('ziele');
  const [destId, setDestId] = useState<string>(() => pickFor(initSeason).dest);
  const [lodgingId, setLodgingId] = useState<string | undefined>(() => pickFor(initSeason).lodging);
  const [focus, setFocus] = useState<CampFocus>(() => pickFor(initSeason).focus);
  const [days, setDays] = useState(initSeason === 'summer' ? 9 : 7);
  const [tests, setTests] = useState(2);
  const [start, setStart] = useState<string>('');
  const [msg, setMsg] = useState<string | null>(null);

  const year = campYear(g.season, season);
  const obligation = campObligation(g, club, season);
  const opts = destinationsFor(season, year, club.reputation, obligation);
  const dest = campDestination(destId) ?? opts.find((o) => o.status.ok)?.d;
  const destOk = opts.find((o) => o.d.id === dest?.id)?.status.ok ?? false;
  const lodgings = dest ? lodgingsFor(dest.id, year) : [];
  const lodging = lodgings.find((l) => l.id === lodgingId) ?? lodgings[0];
  const w = campWindow(g, season);
  const booking = ownBooking(g, season);
  const squad = club.playerIds.length;
  const choice = { lodgingId: lodging?.id, focus };

  // Mögliche Starttage (Pflichtspiele, Vorlauf, Hallenzusagen geprüft).
  const starts = dest && destOk && lodging ? daysBetween(w.from, w.to).filter((d) => !quoteCamp(g, dest.id, season, d, days, choice).error) : [];
  const relaxed = starts.find((d) => dest && !quoteCamp(g, dest.id, season, d, days, choice).surcharge);
  const chosen = starts.includes(start) ? start : relaxed ?? starts[0] ?? '';
  // Preise wie bei der Buchung: Wirtschaftsindex des Anreisejahres.
  const scale = economyScale(yearOf(chosen || w.from));
  const quote = dest && chosen ? quoteCamp(g, dest.id, season, chosen, days, choice) : null;
  const o = dest && lodging ? campOutlook({ d: dest, l: lodging, focus, season, days, tests, year, rep: club.reputation, start: chosen || undefined }) : null;
  const month = campMonth(chosen || undefined, season);

  const selectDest = (id: string) => { setDestId(id); setLodgingId(undefined); setMsg(null); };
  const switchSeason = (s: CampSeason) => {
    setSeason(s); setMode('ziele'); setMsg(null); setStart('');
    const p = pickFor(s);
    setDestId(p.dest); setLodgingId(p.lodging); setFocus(p.focus);
    setDays(s === 'summer' ? 9 : 7);
  };
  const doBook = () => {
    if (!dest || !chosen) return;
    const err = bookCamp(g, dest.id, season, chosen, days, tests, choice);
    setMsg(err ?? `${dest.name} gebucht.`);
    onChange();
  };

  const st = campState(g);
  const aiCount = new Map<string, number>();
  for (const a of st.ai) if (a.clubId && a.season === season) aiCount.set(a.destId, (aiCount.get(a.destId) ?? 0) + 1);
  const priceFrom = (d: NonNullable<typeof dest>) => {
    const l = lodgingsFor(d.id, year)[0];
    return l ? Math.round(campCostBase(d, l, days, club.reputation) * scale) : null;
  };
  const compare = (l: NonNullable<typeof lodging>) => {
    const x = campOutlook({ d: dest!, l, focus, season, days, tests, year, rep: club.reputation, start: chosen || undefined });
    return { fitness: x.fitness + x.altitudeFitness, incidents: x.discipline * squad, cost: Math.round(campCostBase(dest!, l, days, club.reputation, focus) * scale) };
  };
  const trade = o && lodging ? tradeoffs(o, lodging, squad) : null;
  const bookedDest = booking ? campDestination(booking.destId) : undefined;
  const bookedLodging = booking ? campLodging(booking.destId, booking.lodgingId) : undefined;

  return (
    <DashPage>
      <DashBox title={mode === 'verlauf' ? 'Verlauf' : `Ziele ${season === 'summer' ? 'Sommer' : 'Winter'} ${year}`} icon="weather" rows={2}
        right={<span className="dbtnrow">
          <button className={`dchip ${season === 'summer' && mode === 'ziele' ? 'on' : ''}`} onClick={() => switchSeason('summer')}>Sommer</button>
          <button className={`dchip ${season === 'winter' && mode === 'ziele' ? 'on' : ''}`} onClick={() => switchSeason('winter')}>Winter</button>
          <button className={`dchip ${mode === 'verlauf' ? 'on' : ''}`} onClick={() => setMode('verlauf')}>Verlauf</button>
        </span>}>
        {mode === 'ziele' ? (
          <>
            <div className="dnote" style={{ marginBottom: 4 }}>
              {season === 'summer' ? 'Sommervorbereitung' : 'Winterpause'}: {fmtDay(w.from)} – {fmtDay(w.to)} · Ansehen {Math.round(club.reputation)} · Preise für {days} Tage
            </div>
            {obligation && <div className="camp-oblig">Sponsor-Vertrag: Pflicht-Trainingslager in {campDestination(obligation)?.name}. Andere Ziele sind für dieses Fenster gesperrt.</div>}
            <DestinationList opts={opts} selected={dest?.id} year={year} priceFrom={priceFrom} aiCount={aiCount} onSelect={selectDest} />
          </>
        ) : (
          <>
            <div className="dsec">Deine Lager</div>
            {st.history.length ? [...st.history].reverse().slice(0, 14).map((h, i) => (
              <div key={i} className="dlist-row"><span className="meta" style={{ minWidth: 70 }}>{h.season} {h.campSeason === 'summer' ? 'So' : 'Wi'}</span><span className="grow camp-wrap">{h.note}</span></div>
            )) : <div className="dnote">Noch kein Trainingslager absolviert.</div>}
            <div className="dsec">Wo die Liga hinfährt ({season === 'summer' ? 'Sommer' : 'Winter'})</div>
            {aiCount.size ? [...aiCount.entries()].sort((a, b) => b[1] - a[1]).map(([id, n]) => (
              <div key={id} className="dlist-row"><span className="grow">{campDestination(id)?.name ?? id}</span><b>{n}</b></div>
            )) : <div className="dnote">Die anderen Vereine planen noch.</div>}
            <div className="dsec">Epochen</div>
            {campMilestones().map((m, i) => (
              <div key={i} className={`dlist-row ${m.year > year ? 'win-locked' : ''}`}><span className="meta" style={{ minWidth: 40 }}>{m.year}</span><span className="grow">{m.text}</span></div>
            ))}
          </>
        )}
      </DashBox>

      <DashBox title={dest ? `${dest.name} – Unterkunft & Anlage` : 'Unterkunft & Anlage'} icon="training" span={2}>
        {!dest ? <Empty icon="weather">Kein Ziel gewählt.</Empty> : (
          <>
            <DestinationFacts d={dest} month={month} tests={tests > 0} />
            <div className="dnote camp-destnote">{clean(dest.note)}</div>
            {!destOk ? <Empty icon="weather">{opts.find((x) => x.d.id === dest.id)?.status.reason ?? 'Nicht buchbar.'}</Empty> : (
              <>
                <LodgingTable d={dest} lodgings={lodgings} selected={lodging?.id} year={year} rep={club.reputation} scale={scale} compare={compare} onSelect={(id) => { setLodgingId(id); setMsg(null); }} />
                {lodging && <div className="dnote mt8"><b>{lodging.name}:</b> {clean(lodging.note)}</div>}
                <ClimateStrip d={dest} month={month} season={season} />
              </>
            )}
          </>
        )}
      </DashBox>

      <DashBox title={booking ? 'Gebucht' : 'Planung'} icon="kalender">
        {booking ? (
          <>
            <KV k="Ziel" v={bookedDest?.name ?? booking.destId} />
            <KV k="Unterkunft" v={bookedLodging?.name ?? 'Standard'} />
            <KV k="Schwerpunkt" v={CAMP_FOCUS[booking.focus ?? 'ausgewogen'].label} />
            <KV k="Zeitraum" v={`${fmtDay(booking.start)} – ${fmtDay(booking.end)}`} />
            <KV k="Testspiele" v={booking.tests} />
            <KV k="Kosten" v={fmtDM(booking.cost)} color="var(--red)" />
            {obligation && booking.destId !== obligation && <div className="camp-oblig mt8">Achtung: Das gebuchte Lager entspricht nicht der Sponsor-Pflicht ({campDestination(obligation)?.name}).</div>}
            {booking.report && <div className="dnote mt8">{booking.report}</div>}
            {!booking.done && booking.start > today && (
              <div className="dbtnrow mt8"><button className="btn btn-sm btn-ghost" onClick={() => { setMsg(cancelCamp(g, booking.id)); onChange(); }}>Stornieren (50 % zurück)</button></div>
            )}
          </>
        ) : !dest || !destOk || !lodging ? <Empty icon="weather">Wähle links ein buchbares Ziel.</Empty> : (
          <>
            <div className="dsec">Schwerpunkt</div>
            <div className="dbtnrow camp-focus">
              {CAMP_FOCUS_ORDER.map((f) => <button key={f} className={`dchip ${focus === f ? 'on' : ''}`} onClick={() => setFocus(f)}>{CAMP_FOCUS[f].label}</button>)}
            </div>
            <div className="dnote camp-focustext">{CAMP_FOCUS[focus].text}</div>
            <label className="cal-days">Dauer <b>{days}</b> Tage
              <input type="range" min={CAMP_MIN_DAYS} max={CAMP_MAX_DAYS} value={days} onChange={(e) => setDays(Number(e.target.value))} /></label>
            <label className="cal-days">Testspiele <b>{tests}</b>
              <input type="range" min={0} max={4} value={tests} onChange={(e) => setTests(Number(e.target.value))} /></label>
            <div className="dkv"><span className="dkv-k">Anreise</span>
              {starts.length ? (
                <select className="dselect" value={chosen} onChange={(e) => setStart(e.target.value)}>
                  {starts.map((d) => <option key={d} value={d}>{fmtDay(d)}</option>)}
                </select>
              ) : <span className="dkv-v" style={{ color: 'var(--red)' }}>kein freier Zeitraum</span>}
            </div>
            {quote && <KV k="Kosten gesamt" v={`${fmtDM(quote.cost)}${quote.surcharge ? ' (kurzfristig +20 %)' : ''}`} color="var(--red)" strong />}
            {quote?.indoorConflict?.length ? <div className="dnote mt8" style={{ color: 'var(--orange)' }}>Offene Hallen-Einladung wird abgesagt: {quote.indoorConflict.join(', ')}</div> : null}
            <div className="dbtnrow mt8"><button className="btn btn-primary" disabled={!chosen} onClick={doBook}>Trainingslager buchen</button></div>
          </>
        )}
        {msg && <div className="dnote mt8" style={{ color: 'var(--accent)' }}>{msg}</div>}
      </DashBox>

      <DashBox title="Erwartete Wirkung" icon="stats">
        {o ? (
          <>
            {trade && (
              <div className="camp-trade">
                {trade.good.map((t) => <span key={t} className="good">{t}</span>)}
                {trade.bad.map((t) => <span key={t} className="bad">{t}</span>)}
              </div>
            )}
            <OutlookList o={o} squad={squad} scale={scale} youthFocus={focus === 'jugend'} />
            <div className="dnote mt8">Werte je Spieler, Spannen je nach Wetter. Verstöße treffen vor allem wenig professionelle Spieler.</div>
          </>
        ) : <Empty icon="stats">Wähle Ziel und Unterkunft.</Empty>}
      </DashBox>
    </DashPage>
  );
}
