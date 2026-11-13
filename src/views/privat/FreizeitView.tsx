// =============================================================================
// PRIVAT › FREIZEIT (Wunsch Pascal #47): Wochenplan (Prioritäten 0–5 auf die
// Freizeit-Einheiten der Woche), Hobby, Weiterbildung, Urlaub, Zustand.
// Wirkung je Einheit: game/private/privateGame.ts `weekly`.
// =============================================================================
import type { Game } from '../../game/state';
import { ensurePrivate, partnerOf, kidsOf, ageOf } from '../../game/private/privateState';
import { freeUnitsFor, setHobby, setPlan, setStudy, vacation, vacationCost } from '../../game/private/privateGame';
import { cpi, hobbiesFor, PLAN_DEF, SKILLS } from '../../data/privateLife';
import { yearOf } from '../../engine/economy';
import { CalendarEngine } from '../../engine/calendar';
import { DashBox, DashPage } from '../../ui/DashPage';
import { fmtDM } from '../../ui/format';
import { Bar, Feedback, MeterRow, Steps, useFeedback } from './parts';

export function FreizeitView({ g, onChange }: { g: Game; onChange: () => void }) {
  const st = ensurePrivate(g);
  const [fb, setFb] = useFeedback();
  const today = g.calendar.currentDate;
  const monday = CalendarEngine.addDays(today, -((new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7));
  const wk = freeUnitsFor(g, monday);
  const sum = Object.values(st.plan).reduce((a, b) => a + b, 0) || 1;
  const hobbies = hobbiesFor(yearOf(today));
  const partner = partnerOf(st);
  const kids = kidsOf(st).filter((k) => ageOf(g, k) < 18);
  const onVac = !!st.vacation && st.vacation.to >= today;
  const sideNote: Record<string, string> = {
    partner: partner ? '' : ' – ohne Partner: Leute kennenlernen',
    familie: kids.length ? '' : ' – noch keine Kinder im Haus',
  };

  return (
    <DashPage className="pv-page">
      <DashBox title="Wochenplan" span={2} info="privatwoche" right={`${wk.units} Einheiten diese Woche`}>
        <div className="pv-plan">
          {PLAN_DEF.map((p) => {
            const u = (wk.units * st.plan[p.k]) / sum;
            return (
              <div key={p.k} className="pv-plan-row">
                <span className="pv-plan-k"><b>{p.label}</b><span className="pv-sub">{p.text}{sideNote[p.k] ?? ''}</span></span>
                <Steps value={st.plan[p.k]} label={p.label} onChange={(v) => { setPlan(g, p.k, v); onChange(); }} />
                <span className="pv-units">{u.toFixed(1).replace('.', ',')}</span>
              </div>
            );
          })}
        </div>
        <div className="dnote">Jede Woche hast du {6} Freizeit-Einheiten, eine weniger je weiterem Pflichtspiel, vier mehr in Sommer- und Winterpause. Die Punkte verteilen sie: Der Plan wird montags ausgewertet.{wk.matches > 1 ? ` Diese Woche ${wk.matches} Pflichtspiele – wenig Zeit.` : ''}</div>
      </DashBox>

      <DashBox title="Zustand">
        <MeterRow k="Energie" v={st.energy} hint="Unter 30: Training −3 %, Gespräche schwerer" />
        <MeterRow k="Laune" v={st.mood} />
        <MeterRow k="Gesundheit" v={st.health} />
        <MeterRow k="Kontakte" v={st.net} />
        {partner && <MeterRow k="Beziehung" v={st.rel} />}
        <div className="dnote">Spiele kosten Energie, Niederlagen etwas mehr. Erholung, Hobby und Urlaub geben sie zurück. Ab 50 kostet das Alter langsam Gesundheit – Bewegung hält dagegen.</div>
      </DashBox>

      <DashBox title="Hobby" flush>
        <div className="pv-choices">
          {hobbies.map((h) => (
            <button key={h.id} type="button" className={`pv-choice ${st.hobby === h.id ? 'on' : ''}`} onClick={() => { setHobby(g, h.id); onChange(); }}>
              <span className="pv-choice-t"><b>{h.label}</b><span className="pv-sub">{h.text}</span></span>
              <span className="pv-choice-r">{h.monthly ? `${fmtDM(Math.round(h.monthly * cpi(yearOf(today))))}/Mon.` : 'kostenlos'}<span className="pv-sub">Erholung {h.energy}{h.net ? ` · Kontakte ${h.net}` : ''}{h.health ? ` · Fitness ${h.health}` : ''}</span></span>
            </button>
          ))}
        </div>
      </DashBox>

      <DashBox title="Weiterbildung" info="privatbildung">
        {SKILLS.map((s) => {
          const need = 8 + st.skills[s.k] * 3;
          return (
            <button key={s.k} type="button" className={`pv-skill ${st.study === s.k ? 'on' : ''}`} onClick={() => { setStudy(g, s.k); onChange(); }}>
              <span className="pv-skill-t"><b>{s.label}</b><span className="pv-sub">{s.text}</span></span>
              <span className="pv-skill-v"><Bar v={st.skills[s.k]} max={20} tone="pos" /><b>{st.skills[s.k]}</b></span>
              {st.study === s.k && <span className="pv-sub pv-skill-xp">Lehrgang läuft · {Math.round((st.xp[s.k] / need) * 100)} % bis Stufe {st.skills[s.k] + 1}</span>}
            </button>
          );
        })}
      </DashBox>

      <DashBox title="Urlaub">
        {onVac ? <div className="pv-vac">{st.vacation!.label} bis {CalendarEngine.formatDate(st.vacation!.to)}</div> : null}
        <div className="dbtnrow">
          <button type="button" className="btn btn-sm" disabled={!wk.off || onVac} onClick={() => { setFb(vacation(g, 'kurz')); onChange(); }}>Kurzurlaub · {fmtDM(vacationCost(g, 'kurz'))}</button>
          <button type="button" className="btn btn-sm" disabled={!wk.off || onVac} onClick={() => { setFb(vacation(g, 'lang')); onChange(); }}>Familienurlaub · {fmtDM(vacationCost(g, 'lang'))}</button>
        </div>
        <Feedback text={fb} />
        <div className="dnote">{wk.off ? 'Jetzt ist Pause – ideal zum Durchatmen.' : 'Urlaub geht nur in der Sommer- oder Winterpause (Wochen ohne Pflichtspiel).'} Kurzurlaub: eine Woche, Energie +10. Familienurlaub: zwei Wochen, Energie +20, Beziehung und Kinder profitieren.</div>
      </DashBox>
    </DashPage>
  );
}
