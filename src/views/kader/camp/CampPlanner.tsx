// =============================================================================
// TRAININGSLAGER-PLANER – großes Popup in drei Schritten: (1) Zeitraum, (2) Ziel auf
// der Karte + Unterkunft, (3) Reisegruppe + Schwerpunkt. Rechts durchgehend die
// Wirkungsbalken (wie in der Taktik), die sich bei jeder Wahl ändern. „Buchen“ legt
// die Buchung an (game/trainingCampGame.ts `bookCamp`).
// =============================================================================
import { useEffect, useMemo, useState } from 'react';
import { campDestination } from '../../../data/campDestinations';
import { lodgingsFor } from '../../../data/campLodgings';
import { CampMapViewId, campEffectBars, destinationProsCons, homeView } from '../../../engine/campPlan';
import { CalendarEngine } from '../../../engine/calendar';
import { economyScale, yearOf } from '../../../engine/economy';
import { CAMP_FOCUS, CampFocus, campMonth, campOutlook, campYear, destinationsFor } from '../../../engine/trainingCamp';
import { defaultCampSquad, invitableYouth } from '../../../game/campResult';
import type { Game } from '../../../game/state';
import { CAMP_MIN_GROUP, bookCamp, campObligation, campWindow, checkCampDates, quoteCamp } from '../../../game/trainingCampGame';
import { CampSeason, campState, daysBetween } from '../../../game/winterShared';
import { KV } from '../../../ui/DashPage';
import { fmtDM, fmtDay } from '../../../ui/format';
import { CampMap } from './CampMap';
import { DestPanel } from './DestPanel';
import { EffectBars } from './EffectBars';
import { PlanDates } from './PlanDates';
import { PlanSquad } from './PlanSquad';

const STEPS = ['Zeitraum', 'Ziel & Unterkunft', 'Reisegruppe'];

/** Kann für dieses Fenster noch geplant werden? Liefert null oder den Grund. */
export function planBlocked(g: Game, s: CampSeason, booked: boolean): string | null {
  if (booked) return 'schon gebucht';
  const w = campWindow(g, s);
  if (g.calendar.currentDate > w.to) return 'Fenster vorbei';
  const ok = daysBetween(w.from, w.to).some((d) => !checkCampDates(g, s, d, 5).error);
  return ok ? null : 'kein freier Zeitraum mehr';
}

export function CampPlanner({ g, season: season0, seasons, onClose, onBooked }: {
  g: Game; season: CampSeason; seasons: CampSeason[]; onClose: () => void; onBooked: (msg: string) => void;
}) {
  const club = g.clubs[g.managedClubId];
  const [season, setSeason] = useState<CampSeason>(season0);
  const [step, setStep] = useState(0);
  const [days, setDays] = useState(season0 === 'summer' ? 9 : 7);
  const [start, setStart] = useState('');
  const [destId, setDestId] = useState<string | undefined>(() => campObligation(g, club, season0));
  const [lodgingId, setLodgingId] = useState<string | undefined>();
  const [view, setView] = useState<CampMapViewId>(() => homeView(campDestination(campObligation(g, club, season0) ?? '')));
  const [focus, setFocus] = useState<CampFocus>('ausgewogen');
  const [tests, setTests] = useState(2);
  const [squad, setSquad] = useState<Set<string>>(() => new Set(defaultCampSquad(g)));
  const [invited, setInvited] = useState<Set<string>>(() => new Set());
  const [err, setErr] = useState<string | null>(null);

  const w = campWindow(g, season);
  const year = campYear(g.season, season);
  const obligation = campObligation(g, club, season);
  const opts = useMemo(() => destinationsFor(season, year, club.reputation, obligation), [season, year, club.reputation, obligation]);
  // Startvorschlag: erster Tag ohne Aufschlag (Winter: spät in der Pause), sonst der erste mögliche.
  useEffect(() => {
    if (start && !checkCampDates(g, season, start, days).error) return;
    const all = daysBetween(w.from, w.to).filter((d) => !checkCampDates(g, season, d, days).error);
    // Winter: wie üblich in den letzten vier Wochen vor dem Rückrundenstart (Dezember = Urlaub/Halle).
    const late = season === 'winter' ? CalendarEngine.addDays(w.to, -28) : '';
    const pool = all.filter((d) => d >= late);
    setStart(pool.find((d) => !checkCampDates(g, season, d, days).surcharge) ?? pool[0] ?? all[0] ?? '');
  }, [season, days]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const aiCount = new Map<string, number>();
  for (const a of campState(g).ai) if (a.clubId && a.season === season) aiCount.set(a.destId, (aiCount.get(a.destId) ?? 0) + 1);
  const dest = destId ? campDestination(destId) : undefined;
  const status = opts.find((o) => o.d.id === destId)?.status;
  const lodgings = dest ? lodgingsFor(dest.id, year) : [];
  const lodging = lodgings.find((l) => l.id === lodgingId) ?? lodgings[0];
  const pros = club.playerIds.map((id) => g.players[id]).filter(Boolean);
  const youth = invitableYouth(g);
  const squadIds = pros.filter((p) => squad.has(p.id)).map((p) => p.id);
  const youthIds = youth.filter((p) => invited.has(p.id)).map((p) => p.id);
  const choice = { lodgingId: lodging?.id, focus, squad: squadIds, youth: youthIds };
  const scale = economyScale(yearOf(start || w.from));
  const month = campMonth(start || undefined, season);
  const quote = dest && lodging ? quoteCamp(g, dest.id, season, start || w.from, days, choice) : null;
  const costOf = (l: typeof lodging) => (dest && l ? quoteCamp(g, dest.id, season, start || w.from, days, { ...choice, lodgingId: l.id }).cost : 0);
  const o = dest && lodging && status?.ok ? campOutlook({ d: dest, l: lodging, focus, season, days, tests, year, rep: club.reputation, start: start || undefined }) : null;
  const income = o ? Math.round((o.testIncome + o.sponsorBase) * scale) : 0;
  const healthyAlong = pros.filter((p) => squad.has(p.id) && !p.injury).length;
  const stayed = pros.filter((p) => !squad.has(p.id) && !p.injury && p.age > 21).length;
  const bars = campEffectBars({
    o: o ?? ({ fitness: 0, altitudeFitness: 0, dev: 0, form: 0, morale: 0.3, satisfaction: 0, starGrumble: 0, discipline: 0, campFrische: 0, travelFrische: 0, heal: 0, injury: 0 } as never),
    travelers: healthyAlong, youth: youthIds.length, stayed, injuredAlong: squadIds.length - healthyAlong,
    cost: quote?.cost ?? 0, income, balance: club.finances.balance,
  });
  const pc = dest ? destinationProsCons({ d: dest, l: status?.ok ? lodging : undefined, season, month, year, cost: quote?.cost, balance: club.finances.balance, obligation, aiCount: aiCount.get(dest.id) }) : undefined;

  const dateErr = start ? checkCampDates(g, season, start, days).error : 'Kein Anreisetag gewählt.';
  const group = squadIds.length + youthIds.length;
  const checks = [
    { label: 'Zeitraum', ok: !dateErr, v: start ? `${fmtDay(start)} – ${fmtDay(CalendarEngine.addDays(start, days - 1))}` : '–' },
    { label: 'Ziel', ok: !!dest && !!status?.ok, v: dest ? dest.name : 'auf der Karte wählen' },
    { label: 'Unterkunft', ok: !!lodging && !!status?.ok, v: lodging && status?.ok ? lodging.name : '–' },
    { label: 'Reisegruppe', ok: group >= CAMP_MIN_GROUP, v: `${squadIds.length} Profis${youthIds.length ? ` + ${youthIds.length} Jugend` : ''}` },
    { label: 'Schwerpunkt', ok: true, v: `${CAMP_FOCUS[focus].label}, ${tests} Tests` },
  ];
  const canBook = checks.every((c) => c.ok) && !!quote && !quote.error && club.finances.balance >= quote.cost;

  const switchSeason = (s: CampSeason) => {
    setSeason(s); setStart(''); setDays(s === 'summer' ? 9 : 7); setErr(null);
    const ob = campObligation(g, club, s);
    setDestId(ob); setLodgingId(undefined); setView(homeView(campDestination(ob ?? '')));
  };
  const pick = (id: string) => { setDestId(id); setLodgingId(undefined); setErr(null); };
  const doBook = () => {
    if (!dest || !start) return;
    const e = bookCamp(g, dest.id, season, start, days, tests, choice);
    if (e) { setErr(e); return; }
    onBooked(`${dest.name} gebucht: ${fmtDay(start)} – ${fmtDay(quote!.end)}.`);
  };

  return (
    <div className="modal-overlay cp-overlay" onClick={onClose}>
      <div className="modal modal-xl cp-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Trainingslager planen">
        <header className="mx-head cp-head">
          <div>
            <div className="mx-sub">Trainingslager planen · {season === 'summer' ? 'Sommer' : 'Winter'} {year}</div>
            <h2>{dest && status?.ok ? dest.name : 'Neues Trainingslager'}</h2>
          </div>
          <nav className="cp-steps">
            {STEPS.map((s, i) => (
              <button key={s} className={`cp-step ${i === step ? 'on' : ''} ${i < step ? 'done' : ''}`} onClick={() => setStep(i)}>
                <span className="cp-step-n">{i + 1}</span>{s}
              </button>
            ))}
          </nav>
          {seasons.length > 1 && (
            <div className="lu-seg cp-season">
              {seasons.map((s) => <button key={s} className={s === season ? 'on' : ''} onClick={() => switchSeason(s)}>{s === 'summer' ? 'Sommer' : 'Winter'}</button>)}
            </div>
          )}
          <button className="modal-close" onClick={onClose} aria-label="Schließen">×</button>
        </header>
        <div className="cp-body">
          <main className="cp-main">
            {step === 0 && <PlanDates g={g} season={season} window={w} start={start} days={days} onStart={setStart} onDays={setDays} />}
            {step === 1 && (
              <div className="cp-where">
                {obligation && <div className="camp-oblig cp-oblig">Sponsor-Vertrag: Pflicht-Trainingslager in {campDestination(obligation)?.name}. Andere Ziele sind für dieses Fenster gesperrt.</div>}
                <CampMap dests={opts.map((x) => ({ ...x, aiCount: aiCount.get(x.d.id) ?? 0 }))} view={view} onView={setView} selected={destId} onSelect={pick} obligation={obligation} />
                <DestPanel d={dest} status={status} season={season} month={month} year={year} lodgings={lodgings} lodgingId={lodging?.id}
                  onLodging={setLodgingId} pc={pc} costOf={costOf} aiCount={dest ? aiCount.get(dest.id) ?? 0 : 0} />
              </div>
            )}
            {step === 2 && <PlanSquad pros={pros} youth={youth} squad={squad} invited={invited} setSquad={setSquad} setInvited={setInvited}
              focus={focus} setFocus={setFocus} tests={tests} setTests={setTests} />}
          </main>
          <aside className="cp-side">
            <div className="cp-sec">Erwartete Wirkung</div>
            <EffectBars bars={bars} empty={!o} />
            {!o && <div className="cp-hint">Wähle Zeitraum und Ziel – dann zeigen die Balken, was das Lager bringt.</div>}
            <div className="cp-sec">Deine Planung</div>
            <div className="cp-checks">
              {checks.map((c) => (
                <div key={c.label} className={`cp-check ${c.ok ? 'ok' : ''}`}><span>{c.label}</span><b>{c.v}</b></div>
              ))}
            </div>
            <div className="cp-sec">Kosten</div>
            <KV k="Lager gesamt" v={quote ? `${fmtDM(quote.cost)}${quote.surcharge ? ' (+20 %)' : ''}` : '–'} />
            <KV k="Erlöse vor Ort (erwartet)" v={o ? `+${fmtDM(income)}` : '–'} />
            <KV k="Kontostand danach" v={quote ? fmtDM(club.finances.balance - quote.cost) : fmtDM(club.finances.balance)} strong />
          </aside>
        </div>
        <footer className="mx-foot cp-foot">
          <span className={`cp-foot-msg ${err || (quote?.error && step === 2) ? 'bad' : ''}`}>
            {err ?? (step === 2 && quote?.error ? quote.error : step === 0 ? 'Pflichtspiele und zugesagte Hallenturniere sind gesperrt.' : step === 1 ? 'Ziele zeigen sich mit ihrem historischen Jahr; gesperrte Orte sind gedimmt.' : '')}
          </span>
          {step > 0 && <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>Zurück</button>}
          {step < 2 && <button className="btn btn-ghost" onClick={() => setStep(step + 1)}>Weiter</button>}
          <button className="btn btn-primary" disabled={!canBook} onClick={doBook}>Trainingslager buchen</button>
        </footer>
      </div>
    </div>
  );
}
