import { useState } from 'react';
import { campDestination } from '../../data/campDestinations';
import { campLodging, defaultLodging } from '../../data/campLodgings';
import { campEffectBars } from '../../engine/campPlan';
import { economyScale, yearOf } from '../../engine/economy';
import { CAMP_FOCUS, campOutlook, campYear } from '../../engine/trainingCamp';
import { campGroup } from '../../game/campResult';
import { Game } from '../../game/state';
import { campObligation, campWindow, cancelCamp, ownBooking } from '../../game/trainingCampGame';
import { CampBooking, CampSeason, campState, daysBetween } from '../../game/winterShared';
import { DashBox, DashPage, KV } from '../../ui/DashPage';
import { fmtDM, fmtDay } from '../../ui/format';
import { CampPlanner, planBlocked } from './camp/CampPlanner';
import { HistoryDetail, HistoryList } from './camp/CampHistory';
import { EffectBars } from './camp/EffectBars';
import { campMilestones } from './campParts';

// =============================================================================
// TRAININGSLAGER — Übersicht: geplante/laufende Lager mit erwarteter Wirkung,
// Knopf „Trainingslager planen“ (Planer-Popup views/kader/camp/CampPlanner.tsx),
// vergangene Lager mit gemessener Wirkung (Archiv), Ziele der Liga.
// Spielablauf: game/trainingCampGame.ts · Messung: game/campResult.ts
// =============================================================================
const SEASONS: CampSeason[] = ['summer', 'winter'];

function BookingCard({ g, s, b, onCancel }: { g: Game; s: CampSeason; b?: CampBooking; onCancel: (id: string) => void }) {
  const today = g.calendar.currentDate;
  const w = campWindow(g, s);
  const title = s === 'summer' ? 'Sommervorbereitung' : 'Winterpause';
  if (!b) {
    const past = today > w.to;
    return (
      <div className="cp-card free">
        <div className="cp-card-head"><span className="cp-kicker">{title}</span><span className="cp-pill">{past ? 'vorbei' : 'frei'}</span></div>
        <div className="cp-card-empty">{past ? 'In diesem Fenster gab es kein Lager.' : `Noch kein Lager geplant. Fenster ${fmtDay(w.from)} – ${fmtDay(w.to)}.`}</div>
      </div>
    );
  }
  const club = g.clubs[g.managedClubId];
  const d = campDestination(b.destId);
  const year = campYear(g.season, s);
  const l = campLodging(b.destId, b.lodgingId) ?? defaultLodging(b.destId, year);
  const state = b.done ? 'zurück' : b.start <= today ? 'läuft' : 'geplant';
  const grp = campGroup(g, b);
  const o = d && l ? campOutlook({ d, l, focus: b.focus ?? 'ausgewogen', season: s, days: daysBetween(b.start, b.end).length, tests: b.tests, year, rep: club.reputation, start: b.start }) : null;
  const scale = economyScale(yearOf(b.start));
  const bars = o ? campEffectBars({
    o, travelers: grp.pros.filter((p) => !p.injury).length, youth: grp.youth.length, stayed: grp.stayed.filter((p) => !p.injury && p.age > 21).length,
    injuredAlong: grp.pros.filter((p) => p.injury).length, cost: b.cost, income: Math.round((o.testIncome + o.sponsorBase) * scale), balance: club.finances.balance,
  }) : [];
  return (
    <div className={`cp-card ${state}`}>
      <div className="cp-card-head"><span className="cp-kicker">{title}</span><span className={`cp-pill ${state === 'läuft' ? 'live' : ''}`}>{state}</span></div>
      <div className="cp-card-name">{d?.name ?? b.destId}</div>
      <div className="cp-card-sub">{d?.place} · {fmtDay(b.start)} – {fmtDay(b.end)}</div>
      <div className="cp-card-kv">
        <span><em>Unterkunft</em>{l?.name ?? 'Standard'}</span>
        <span><em>Schwerpunkt · Tests</em>{CAMP_FOCUS[b.focus ?? 'ausgewogen'].label} · {b.tests}</span>
        <span><em>Reisegruppe</em>{grp.pros.length} Profis{grp.youth.length ? ` + ${grp.youth.length} Jugend` : ''}</span>
        <span><em>Kosten</em>{fmtDM(b.cost)}</span>
      </div>
      {b.done && b.result ? <KV k="Ergebnis" v={`${b.result.score} von 100`} strong />
        : o ? <><div className="cp-sec">Erwartete Wirkung</div><EffectBars bars={bars} /></> : null}
      {state === 'geplant' && <div className="dbtnrow mt8"><button className="btn btn-sm btn-ghost" onClick={() => onCancel(b.id)}>Stornieren (50 % zurück)</button></div>}
    </div>
  );
}

export function TrainingCampView({ g, onChange }: { g: Game; onChange: () => void }) {
  const club = g.clubs[g.managedClubId];
  const st = campState(g);
  const [planner, setPlanner] = useState<CampSeason | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const history = [...st.history].reverse();
  const [sel, setSel] = useState(0);
  const bookings = { summer: ownBooking(g, 'summer'), winter: ownBooking(g, 'winter') };
  const blocked = { summer: planBlocked(g, 'summer', !!bookings.summer), winter: planBlocked(g, 'winter', !!bookings.winter) };
  const open = SEASONS.filter((s) => !blocked[s]);
  const aiCount = new Map<string, number>();
  const aiSeason: CampSeason = g.calendar.currentDate > campWindow(g, 'summer').to ? 'winter' : 'summer';
  for (const a of st.ai) if (a.clubId && a.season === aiSeason) aiCount.set(a.destId, (aiCount.get(a.destId) ?? 0) + 1);
  const year = campYear(g.season, open[0] ?? aiSeason);
  const cancel = (id: string) => { setMsg(cancelCamp(g, id)); onChange(); };

  return (
    <DashPage>
      <DashBox title="Geplante Lager" icon="kalender" span={2} right={`Saison ${g.season}`}>
        <div className="cp-cards">
          {SEASONS.map((s) => <BookingCard key={s} g={g} s={s} b={bookings[s]} onCancel={cancel} />)}
        </div>
        {msg && <div className="dnote mt8">{msg}</div>}
      </DashBox>

      <DashBox title="Planen" icon="weather">
        <div className="cp-plan-box">
          <button className="btn btn-primary cp-plan-btn" disabled={!open.length} onClick={() => { setMsg(null); setPlanner(open[0]); }}>Trainingslager planen</button>
          <div className="cp-plan-note">
            {SEASONS.map((s) => (
              <div key={s} className="dkv"><span className="dkv-k">{s === 'summer' ? 'Sommer' : 'Winter'}</span>
                <span className="dkv-v">{blocked[s] ?? `frei bis ${fmtDay(campWindow(g, s).to)}`}</span></div>
            ))}
          </div>
          {SEASONS.map((s) => {
            const ob = campObligation(g, club, s);
            return ob ? <div key={s} className="camp-oblig">Sponsor-Vertrag: {s === 'summer' ? 'Sommer' : 'Winter'}lager in {campDestination(ob)?.name}.</div> : null;
          })}
        </div>
        <div className="dsec">Wo die Liga hinfährt ({aiSeason === 'summer' ? 'Sommer' : 'Winter'})</div>
        {aiCount.size ? [...aiCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([id, n]) => (
          <div key={id} className="dlist-row"><span className="grow">{campDestination(id)?.name ?? id}</span><b>{n}</b></div>
        )) : <div className="dnote">Die anderen Vereine planen noch.</div>}
        <div className="dsec">Demnächst neu</div>
        {campMilestones().filter((m) => m.year > year).slice(0, 3).map((m, i) => (
          <div key={i} className="dlist-row win-locked"><span className="meta" style={{ minWidth: 40 }}>{m.year}</span><span className="grow">{m.text}</span></div>
        ))}
      </DashBox>

      <DashBox title="Vergangene Lager" icon="chronicle" right={history.length ? `${history.length}` : undefined}>
        <HistoryList list={history} sel={sel} onSel={setSel} />
      </DashBox>

      <DashBox title="Gemessene Wirkung" icon="stats" span={2}>
        <HistoryDetail h={history[sel]} />
      </DashBox>

      {planner && (
        <CampPlanner g={g} season={planner} seasons={open} onClose={() => setPlanner(null)}
          onBooked={(m) => { setPlanner(null); setMsg(m); onChange(); }} />
      )}
    </DashPage>
  );
}
