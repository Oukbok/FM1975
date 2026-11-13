// =============================================================================
// PRIVAT (Übersicht, Wunsch Pascal #47): du, diese Woche, Familie, Vermögen,
// Wirkung auf den Verein, Lebenslauf. Logik game/private/, CSS 28-privat.css.
// =============================================================================
import type { Game } from '../../game/state';
import type { Screen } from '../../shell/navigation';
import { ageOf, ensurePrivate, fullName, kidsOf, partnerOf, privateTalkBonus, privateTrainingFactor, privOn } from '../../game/private/privateState';
import { freeUnitsFor, heirsOf, homePrice, monthlyCosts, netWorth } from '../../game/private/privateGame';
import { storyText } from '../../game/private/privateStart';
import { carsFor, HOBBIES, HOMES, PLAN_DEF } from '../../data/privateLife';
import { repLabel } from '../../game/careerState';
import { yearOf } from '../../engine/economy';
import { CalendarEngine } from '../../engine/calendar';
import { DashBox, DashPage, Empty, KV } from '../../ui/DashPage';
import { fmtDM } from '../../ui/format';
import { MeterRow, personLine } from './parts';

const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);
const pct = (f: number) => `${f >= 0 ? '+' : '−'}${Math.abs(f * 100).toFixed(1).replace('.', ',')} %`;

export function PrivatView({ g, onGoto }: { g: Game; onChange?: () => void; onGoto: (s: Screen) => void }) {
  if (!privOn(g)) {
    return <DashPage><DashBox title="Privat" span={3} rows={2}><Empty icon="home">Das Privatleben ist in diesem Spielstand abgeschaltet (Einstellung beim Spielstart).</Empty></DashBox></DashPage>;
  }
  const st = ensurePrivate(g);
  const self = st.persons[st.selfId];
  const today = g.calendar.currentDate;
  const year = yearOf(today);
  const partner = partnerOf(st);
  const kids = kidsOf(st);
  const heirs = heirsOf(g, st);
  const monday = CalendarEngine.addDays(today, -((new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7));
  const wk = freeUnitsFor(g, monday);
  const sum = Object.values(st.plan).reduce((a, b) => a + b, 0) || 1;
  const c = monthlyCosts(g, st);
  const costs = c.living + c.home + c.car + c.hobby + c.kids;
  const story = storyText(g, st.story);
  const hobby = HOBBIES.find((h) => h.id === st.hobby);
  const rep = g.career?.rep ?? 50;

  return (
    <DashPage className="pv-page">
      <DashBox title={fullName(self)} info="privatleben" right={`Generation ${st.gen}`}>
        <KV k="Alter" v={`${ageOf(g, self)} Jahre`} strong />
        <KV k="Manager seit" v={self.managed ? CalendarEngine.formatDate(self.managed.from) : '–'} />
        <KV k="Ruf" v={repLabel(rep)} />
        <KV k="Zuhause" v={HOMES[st.home].label} />
        <KV k="Auto" v={carsFor(year)[st.car]?.label ?? '–'} />
        <div className="pv-gap" />
        <MeterRow k="Energie" v={st.energy} hint="Unter 30: Training −3 %, Gespräche schwerer" />
        <MeterRow k="Laune" v={st.mood} />
        <MeterRow k="Gesundheit" v={st.health} />
        <MeterRow k="Kontakte" v={st.net} hint="Vorstand, Sponsoren, Presse" />
      </DashBox>

      <DashBox title="Diese Woche" right={`${wk.units} Freizeit-Einheiten`} onClick={() => onGoto('freizeit')}>
        <div className="pv-plan-mini">
          {PLAN_DEF.map((p) => {
            const u = (wk.units * st.plan[p.k]) / sum;
            return (
              <div key={p.k} className="pv-plan-mini-row">
                <span>{p.label}{p.k === 'hobby' && hobby ? ` (${hobby.label})` : ''}</span>
                <span className="pv-units">{u.toFixed(1).replace('.', ',')}</span>
              </div>
            );
          })}
        </div>
        <div className="dnote">{wk.matches ? `${wk.matches} ${wk.matches === 1 ? 'Pflichtspiel' : 'Pflichtspiele'} diese Woche.` : 'Keine Pflichtspiele – mehr Zeit für dich.'}{st.vacation && st.vacation.to >= today ? ` ${st.vacation.label} bis ${CalendarEngine.formatDate(st.vacation.to)}.` : ''}</div>
        {st.last && <div className="pv-deltas">Letzte Woche: Energie {signed(st.last.energy)} · Laune {signed(st.last.mood)}{partner ? ` · Beziehung ${signed(st.last.rel)}` : ''} · Kontakte {signed(st.last.net)}</div>}
      </DashBox>

      <DashBox title="Familie" onClick={() => onGoto('familie')} right={kids.length ? `${kids.length} ${kids.length === 1 ? 'Kind' : 'Kinder'}` : undefined}>
        {partner ? (
          <>
            <KV k={st.married ? 'Verheiratet mit' : 'Partner'} v={`${fullName(partner)} (${personLine(g, partner)})`} />
            <MeterRow k="Beziehung" v={st.rel} />
          </>
        ) : <KV k="Partner" v="Single" />}
        {st.expecting && <KV k="Nachwuchs" v={`erwartet ab ${CalendarEngine.formatDate(st.expecting)}`} />}
        <div className="pv-kidlist">
          {kids.slice(0, 5).map((k) => (
            <div key={k.id} className="pv-kidrow"><span>{k.first}</span><span className="pv-sub">{personLine(g, k)}{k.playerId ? ' · Fußballer' : k.path === 'manager' ? ' · Management' : ''}</span></div>
          ))}
          {kids.length > 5 && <div className="pv-sub">… und {kids.length - 5} weitere</div>}
        </div>
        <div className="dnote">{heirs.length ? `Nachfolge möglich: ${heirs.map((h) => h.first).join(', ')}.` : 'Noch kein Nachfolger in der Familie (ab 18 Jahren).'}</div>
      </DashBox>

      <DashBox title="Vermögen" onClick={() => onGoto('vermoegen')} right={fmtDM(netWorth(st, year))}>
        <KV k="Konto" v={<span className={st.money < 0 ? 'neg' : ''}>{fmtDM(st.money)}</span>} strong />
        <KV k="Sparbuch" v={fmtDM(st.savings)} />
        <KV k="Aktienfonds" v={fmtDM(st.stocks)} />
        <KV k="Immobilie" v={st.home ? fmtDM(homePrice(st.home, year)) : 'zur Miete'} />
        <div className="pv-gap" />
        <KV k="Gehalt im Monat" v={fmtDM(c.income)} />
        <KV k="Lebenshaltung im Monat" v={fmtDM(costs)} />
        <KV k="Bleibt" v={<span className={c.income - costs < 0 ? 'neg' : 'pos'}>{fmtDM(c.income - costs)}</span>} strong />
      </DashBox>

      <DashBox title="Wirkung auf den Verein" info="privatwirkung">
        <KV k="Training (Lernwirkung)" v={pct(privateTrainingFactor(g) - 1)} />
        <KV k="Spielergespräche" v={pct(privateTalkBonus(g))} />
        <KV k="Kontakt-Chance im Monat" v={`${Math.round(st.net / 5)} %`} />
        <KV k="An den Verein gegeben" v={st.donated ? fmtDM(st.donated) : '–'} />
        <div className="dnote">Trainingslehre und Energie wirken aufs Training, Menschenführung und Laune auf Gespräche. Kontakte bringen Sponsorengeld, Vorstandsvertrauen oder gute Presse.</div>
      </DashBox>

      <DashBox title="Lebenslauf" right={story?.title}>
        <div className="pv-log">
          {story && <div className="pv-story">{story.text.split('\n\n')[0]}</div>}
          {[...st.log].reverse().slice(0, 30).map((l, i) => (
            <div key={i} className="pv-logrow"><span className="pv-sub">{CalendarEngine.formatDate(l.d)}</span><span>{l.t}</span></div>
          ))}
        </div>
      </DashBox>
    </DashPage>
  );
}
