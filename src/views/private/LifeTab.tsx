// =============================================================================
// PRIVAT › KARRIERE, Reiter „Lebenslauf“ (früher eigene Seite Privat, Wunsch Pascal:
// Menüpunkt Privat führt direkt auf Karriere). Du, Wirkung auf den Verein und
// Lebenslauf; Zustand/Wochenplan stehen unter Freizeit, Konten unter Vermögen,
// Familie unter Familie. Logik game/private/, CSS 28-private.css.
// =============================================================================
import type { Game } from '../../game/state';
import { ageOf, ensurePrivate, fullName, kidsOf, partnerOf, privateTalkBonus, privateTrainingFactor } from '../../game/private/privateState';
import { heirsOf, netWorth } from '../../game/private/privateGame';
import { storyText } from '../../game/private/privateStart';
import { carsFor, HOMES } from '../../data/privateLife';
import { repLabel } from '../../game/careerState';
import { yearOf } from '../../engine/economy';
import { CalendarEngine } from '../../engine/calendar';
import { DashBox, DashPage, KV } from '../../ui/DashPage';
import { fmtDM } from '../../ui/format';

const pct = (f: number) => `${f >= 0 ? '+' : '−'}${Math.abs(f * 100).toFixed(1).replace('.', ',')} %`;

/** Nur aufrufen, wenn das Privatleben an ist (`privOn`). */
export function LifeTab({ g }: { g: Game }) {
  const st = ensurePrivate(g);
  const self = st.persons[st.selfId];
  const year = yearOf(g.calendar.currentDate);
  const partner = partnerOf(st);
  const kids = kidsOf(st);
  const heirs = heirsOf(g, st);
  const story = storyText(g, st.story);
  const rep = g.career?.rep ?? 50;

  return (
    <DashPage className="pv-page">
      <DashBox title={fullName(self)} info="privatleben" right={`Generation ${st.gen}`}>
        <KV k="Alter" v={`${ageOf(g, self)} Jahre`} strong />
        <KV k="Manager seit" v={self.managed ? CalendarEngine.formatDate(self.managed.from) : '–'} />
        <KV k="Ruf" v={repLabel(rep)} />
        <KV k={st.married ? 'Verheiratet mit' : 'Partner'} v={partner ? fullName(partner) : 'Single'} />
        <KV k="Kinder" v={kids.length || '–'} />
        <KV k="Zuhause" v={HOMES[st.home].label} />
        <KV k="Auto" v={carsFor(year)[st.car]?.label ?? '–'} />
        <KV k="Vermögen" v={fmtDM(netWorth(st, year))} />
        <div className="dnote">{heirs.length ? `Nachfolge möglich: ${heirs.map((h) => h.first).join(', ')}.` : 'Noch kein Nachfolger in der Familie (ab 18 Jahren).'}</div>
      </DashBox>

      <DashBox title="Lebenslauf" span={2} rows={2} right={story?.title}>
        <div className="pv-log">
          {story && <div className="pv-story">{story.text.split('\n\n')[0]}</div>}
          {[...st.log].reverse().slice(0, 60).map((l, i) => (
            <div key={i} className="pv-logrow"><span className="pv-sub">{CalendarEngine.formatDate(l.d)}</span><span>{l.t}</span></div>
          ))}
        </div>
      </DashBox>

      <DashBox title="Wirkung auf den Verein" info="privatwirkung">
        <KV k="Training (Lernwirkung)" v={pct(privateTrainingFactor(g) - 1)} />
        <KV k="Spielergespräche" v={pct(privateTalkBonus(g))} />
        <KV k="Kontakt-Chance im Monat" v={`${Math.round(st.net / 5)} %`} />
        <KV k="An den Verein gegeben" v={st.donated ? fmtDM(st.donated) : '–'} />
        <div className="dnote">Trainingslehre und Energie wirken aufs Training, Menschenführung und Laune auf Gespräche. Kontakte bringen Sponsorengeld, Vorstandsvertrauen oder gute Presse.</div>
      </DashBox>
    </DashPage>
  );
}
