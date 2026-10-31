import { useState } from 'react';
import { CAMP_DESTINATIONS, CAMP_OPP_LABEL, CAMP_REGION_LABEL, campDestination } from '../../data/campDestinations';
import { economyScale } from '../../engine/economy';
import { CAMP_MAX_DAYS, CAMP_MIN_DAYS, campCostBase, campOutlook, campYear, destinationsFor } from '../../engine/trainingCamp';
import { Game } from '../../game/state';
import { bookCamp, campWindow, cancelCamp, ownBooking, quoteCamp } from '../../game/trainingCampGame';
import { CampSeason, campState, daysBetween } from '../../game/winterShared';
import { DashBox, DashPage, Empty, KV } from '../../ui/DashPage';
import { fmtDM, fmtDay } from '../../ui/format';

// =============================================================================
// TRAININGSLAGER — Ziele je Epoche, Buchung im Voraus, Wirkung, KI-Ziele
// Spielablauf: game/trainingCampGame.ts · Ziele/Quellen: data/campDestinations.ts
// =============================================================================
export function TrainingCampView({ g, onChange }: { g: Game; onChange: () => void }) {
  const club = g.clubs[g.managedClubId];
  const today = g.calendar.currentDate;
  const sw = campWindow(g, 'summer');
  const [season, setSeason] = useState<CampSeason>(today > sw.to ? 'winter' : 'summer');
  const year = campYear(g.season, season);
  const opts = destinationsFor(season, year, club.reputation);
  const firstOk = opts.find((o) => o.status.ok)?.d.id ?? opts[0]?.d.id;
  const [destId, setDestId] = useState<string>(firstOk);
  const [days, setDays] = useState(season === 'summer' ? 9 : 7);
  const [tests, setTests] = useState(2);
  const [start, setStart] = useState<string>('');
  const [msg, setMsg] = useState<string | null>(null);
  const dest = campDestination(destId) ?? opts[0]?.d;
  const w = campWindow(g, season);
  const scale = economyScale(year);
  const booking = ownBooking(g, season);
  const destOk = opts.find((o) => o.d.id === dest?.id)?.status.ok ?? false;

  // Mögliche Starttage (Pflichtspiele, Vorlauf, Hallenzusagen geprüft).
  const starts = dest && destOk ? daysBetween(w.from, w.to).filter((d) => !quoteCamp(g, dest.id, season, d, days).error) : [];
  // Vorschlag: frühester Termin ohne Kurzfrist-Aufschlag (sonst der erste freie).
  const relaxed = starts.find((d) => dest && !quoteCamp(g, dest.id, season, d, days).surcharge);
  const chosen = starts.includes(start) ? start : relaxed ?? starts[0] ?? '';
  const quote = dest && chosen ? quoteCamp(g, dest.id, season, chosen, days) : null;
  const o = dest ? campOutlook(dest, season, days, tests, year, club.reputation) : null;

  const doBook = () => {
    if (!dest || !chosen) return;
    const err = bookCamp(g, dest.id, season, chosen, days, tests);
    setMsg(err ?? `${dest.name} gebucht.`);
    onChange();
  };
  const switchSeason = (s: CampSeason) => {
    setSeason(s); setMsg(null); setStart('');
    const first = destinationsFor(s, campYear(g.season, s), club.reputation).find((x) => x.status.ok);
    if (first) setDestId(first.d.id);
    setDays(s === 'summer' ? 9 : 7);
  };

  const ai = campState(g).ai.filter((a) => a.clubId && a.season === season);
  const aiCount = new Map<string, number>();
  for (const a of ai) aiCount.set(a.destId, (aiCount.get(a.destId) ?? 0) + 1);
  const st = campState(g);

  // Epochen: Freischaltungen aller Ziele (erste Stufe + Öffnung für alle).
  const milestones = CAMP_DESTINATIONS.flatMap((d) => d.access.map((a, i) => ({ year: a.from, text: `${d.name}${i === 0 && a.minRep > 0 ? ` (nur Ansehen ≥ ${a.minRep})` : i > 0 ? ` für Ansehen ≥ ${a.minRep}` : ''}` })))
    .sort((a, b) => a.year - b.year);

  return (
    <DashPage>
      <DashBox title={`Ziele ${season === 'summer' ? 'Sommer' : 'Winter'} ${year}`} icon="weather" span={2}
        right={<span className="dbtnrow">
          <button className={`dchip ${season === 'summer' ? 'on' : ''}`} onClick={() => switchSeason('summer')}>Sommer</button>
          <button className={`dchip ${season === 'winter' ? 'on' : ''}`} onClick={() => switchSeason('winter')}>Winter</button>
        </span>}>
        <div className="dnote" style={{ marginBottom: 6 }}>
          {season === 'summer' ? 'Sommervorbereitung' : 'Winterpause'}: {fmtDay(w.from)} – {fmtDay(w.to)}. Ansehen deines Vereins: {Math.round(club.reputation)}.
        </div>
        {opts.map(({ d, status }) => {
          const cost = Math.round(campCostBase(d, days, club.reputation) * scale);
          return (
            <div key={d.id} className={`dlist-row clickable ${d.id === dest?.id ? 'win-sel' : ''} ${status.ok ? '' : 'win-locked'}`} onClick={() => { setDestId(d.id); setMsg(null); }}>
              <span className="grow"><b>{d.name}</b> <span className="muted">· {d.place} · {CAMP_REGION_LABEL[d.region]}</span></span>
              {status.ok ? (
                <>
                  <span className="meta">{d.flightH ? `${d.flightH} h Flug${d.tz ? `, ${d.tz > 0 ? '+' : ''}${d.tz} h` : ''}` : 'Bus'}</span>
                  <span className="meta">Platz {Math.round(d.pitch[season === 'summer' ? 0 : 1] * 10)}/10</span>
                  <b className="nowrap">{fmtDM(cost)}</b>
                </>
              ) : <span className="meta">{status.reason}</span>}
            </div>
          );
        })}
      </DashBox>

      <DashBox title={dest ? dest.name : 'Planung'} icon="training">
        {booking ? (
          <>
            <div className="dnote">Für {season === 'summer' ? 'den Sommer' : 'den Winter'} ist gebucht:</div>
            <KV k="Ziel" v={campDestination(booking.destId)?.name ?? booking.destId} />
            <KV k="Zeitraum" v={`${fmtDay(booking.start)} – ${fmtDay(booking.end)}`} />
            <KV k="Kosten" v={fmtDM(booking.cost)} color="var(--red)" />
            {booking.report && <div className="dnote mt8">{booking.report}</div>}
            {!booking.done && booking.start > today && (
              <div className="dbtnrow mt8"><button className="btn btn-sm btn-ghost" onClick={() => { setMsg(cancelCamp(g, booking.id)); onChange(); }}>Stornieren (50 % zurück)</button></div>
            )}
          </>
        ) : !dest || !destOk ? <Empty icon="weather">Dieses Ziel ist noch nicht buchbar.</Empty> : (
          <>
            <div className="dnote" style={{ marginBottom: 6 }}>{dest.note}</div>
            <label className="cal-days">Dauer: <b>{days}</b> Tage
              <input type="range" min={CAMP_MIN_DAYS} max={CAMP_MAX_DAYS} value={days} onChange={(e) => setDays(Number(e.target.value))} /></label>
            <label className="cal-days">Testspiele: <b>{tests}</b> ({CAMP_OPP_LABEL[dest.opp]})
              <input type="range" min={0} max={4} value={tests} onChange={(e) => setTests(Number(e.target.value))} /></label>
            <div className="dkv"><span className="dkv-k">Anreise</span>
              {starts.length ? (
                <select className="dselect" value={chosen} onChange={(e) => setStart(e.target.value)}>
                  {starts.map((d) => <option key={d} value={d}>{fmtDay(d)}</option>)}
                </select>
              ) : <span className="dkv-v" style={{ color: 'var(--red)' }}>kein freier Zeitraum</span>}
            </div>
            {quote && <KV k="Kosten" v={`${fmtDM(quote.cost)}${quote.surcharge ? ' (kurzfristig +20 %)' : ''}`} color="var(--red)" />}
            {o && (
              <>
                <KV k="Kondition / Form" v={`+${o.fitness} / ${o.form - o.travelForm >= 0 ? '+' : ''}${(o.form - o.travelForm).toFixed(1)}`} />
                <KV k="Verletzungsrisiko je Spieler" v={`${(o.injury * 100).toFixed(1)} %`} />
                {o.travelFrische > 0 && <KV k="Reisestrapazen" v={`Frische −${o.travelFrische}`} color="var(--orange)" />}
                {o.testIncome > 0 && <KV k="Testspiel-Erlös" v={`+${fmtDM(Math.round(o.testIncome * scale))}`} color="var(--green)" />}
                {o.sponsorBase > 0 && <KV k="Marketing" v={`+${fmtDM(Math.round(o.sponsorBase * scale))}`} color="var(--green)" />}
                {o.criticism > 0 && <KV k="Kritik" v={`Fans −${o.criticism}`} color="var(--red)" />}
              </>
            )}
            {quote?.indoorConflict?.length ? <div className="dnote mt8" style={{ color: 'var(--orange)' }}>Offene Hallen-Einladung wird abgesagt: {quote.indoorConflict.join(', ')}</div> : null}
            <div className="dbtnrow mt8"><button className="btn btn-sm" disabled={!chosen} onClick={doBook}>Buchen</button></div>
          </>
        )}
        {msg && <div className="dnote mt8" style={{ color: 'var(--accent)' }}>{msg}</div>}
      </DashBox>

      <DashBox title="Deine Lager" icon="kalender">
        {st.bookings.filter((b) => !b.done).map((b) => (
          <div key={b.id} className="dlist-row"><span className="grow">{campDestination(b.destId)?.name}</span><span className="meta">{fmtDay(b.start)} – {fmtDay(b.end)}</span></div>
        ))}
        <div className="dsec">Rückblick</div>
        {st.history.length ? [...st.history].reverse().slice(0, 12).map((h, i) => (
          <div key={i} className="dlist-row"><span className="meta" style={{ minWidth: 64 }}>{h.season} {h.campSeason === 'summer' ? 'S' : 'W'}</span><span className="grow">{h.note}</span></div>
        )) : <div className="dnote">Noch kein Trainingslager absolviert.</div>}
      </DashBox>

      <DashBox title="Wo die Liga hinfährt" icon="international">
        {aiCount.size ? [...aiCount.entries()].sort((a, b) => b[1] - a[1]).map(([id, n]) => (
          <div key={id} className="dlist-row"><span className="grow">{campDestination(id)?.name ?? id}</span><b>{n}</b></div>
        )) : <Empty icon="international">Die anderen Vereine planen ihre {season === 'summer' ? 'Sommervorbereitung' : 'Winterpause'} noch.</Empty>}
        <div className="dnote mt8">Alle Vereine fahren ins Lager; die Kosten tragen sie selbst, der Effekt ist kleiner als bei dir.</div>
      </DashBox>

      <DashBox title="Epochen der Trainingslager" icon="chronicle">
        {milestones.map((m, i) => (
          <div key={i} className={`dlist-row ${m.year > year ? 'win-locked' : ''}`}>
            <span className="meta" style={{ minWidth: 40 }}>{m.year}</span><span className="grow">{m.text}</span>
          </div>
        ))}
      </DashBox>
    </DashPage>
  );
}
