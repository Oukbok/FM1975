// =============================================================================
// Training › Trainingsplan › Langfristig (Vorbild EA FM „Saisonverlauf“): jede Woche
// bis Saisonende mit Aufgabe (Vorlage bzw. eigener Plan), Spielen, Einheiten,
// Fitness-Bilanz, Verletzungsrisiko und Schwerpunkt. Rechts die Vorlagen – für die
// gewählte Woche vormerken (game/trainingSeason.ts) – und die Philosophie je Saisonabschnitt.
// =============================================================================
import { useState } from 'react';
import { PLAN_TEMPLATES } from '../../../engine/trainingPlan';
import { Game } from '../../../game/state';
import { SeasonWeek, seasonWeeks, setWeekTemplate, templateName } from '../../../game/trainingSeason';
import { DashBox, DashPage } from '../../../ui/DashPage';
import { fmtDateShort } from '../../../ui/format';
import { PhilosophyBox } from '../../kader/PhilosophyBox';

const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const risk = (i: number) => (i < 0.6 ? 'gering' : i < 1.3 ? 'normal' : i < 2.2 ? 'erhöht' : 'hoch');

function task(w: SeasonWeek): { text: string; cls: string } {
  if (w.camp) return { text: `Trainingslager ${w.camp}`, cls: 'camp' };
  const t = templateName(w.tplId);
  if (w.winter && !w.matches.length) return { text: `${t} · Winterpause`, cls: '' };
  return { text: t, cls: w.tplId === 'schonung' || w.tplId === 'englisch' ? 'easy' : w.tplId === 'vorbereitung' ? 'hard' : '' };
}

export function LongTermTab({ g, refresh }: { g: Game; refresh: () => void }) {
  const weeks = seasonWeeks(g);
  const [selMon, setSel] = useState<string | null>(weeks[1]?.monday ?? weeks[0]?.monday ?? null);
  const sel = weeks.find((w) => w.monday === selMon) ?? null;
  const assign = (id: string | null) => { if (sel) { setWeekTemplate(g, sel.monday, id); refresh(); } };
  let lastMonth = -1;
  return (
    <DashPage className="tr3-long">
      <DashBox title="Saisonverlauf" icon="kalender" span={2} rows={2} flush info="langfristig" right={`${weeks.length} Wochen bis Saisonende`}>
        <div className="tr3-tablewrap">
          <table className="dtable rl-players rl-sm tr3-ltable">
            <thead>
              <tr><th>Woche</th><th>Aufgabe</th><th className="r">Spiele</th><th className="r">Einheiten</th><th className="r">Fitness/Tag</th><th>Risiko</th><th>Schwerpunkt</th></tr>
            </thead>
            <tbody>
              {weeks.flatMap((w) => {
                const m = Number(w.monday.slice(5, 7)) - 1;
                const rows = [];
                if (m !== lastMonth) {
                  lastMonth = m;
                  rows.push(<tr key={`m${w.monday}`} className="tr3-month"><td colSpan={7}>{MONTHS[m]} {w.monday.slice(0, 4)}</td></tr>);
                }
                const tk = task(w);
                rows.push(
                  <tr key={w.monday} className={`tr3-wrow ${w.monday === selMon ? 'sel' : ''} ${w.current ? 'cur' : ''}`} onClick={() => setSel(w.monday)}>
                    <td className="muted">{fmtDateShort(w.monday).dmy.slice(0, 6)}{w.current ? ' · jetzt' : ''}</td>
                    <td className={`tr3-task ${tk.cls}`}>{w.scheduled && <span className="tr3-mark">ab hier</span>}{tk.text}</td>
                    <td className="r">{w.matches.length || '–'}</td>
                    <td className="r">{w.fx.units}</td>
                    <td className={`r ${w.fx.fitnessPerDay < -2 ? 'neg' : ''}`}>{w.fx.fitnessPerDay > 0 ? '+' : ''}{w.fx.fitnessPerDay}</td>
                    <td className={w.fx.injuryIndex >= 2.2 ? 'neg' : 'muted'}>{risk(w.fx.injuryIndex)}</td>
                    <td className="muted">{w.focus ?? '–'}</td>
                  </tr>,
                );
                return rows;
              })}
            </tbody>
          </table>
        </div>
      </DashBox>

      <DashBox title="Verfügbare Trainingswochen" icon="training"
        right={sel ? `Woche ab ${fmtDateShort(sel.monday).dmy.slice(0, 6)}` : ''}>
        <div className="tr3-tpls">
          <button className="tr3-tpl tr3-tpl-clear" disabled={!sel || sel.current || !sel.scheduled} onClick={() => assign(null)}>
            <b>Vormerkung löschen</b><span>Woche folgt wieder dem Plan davor.</span>
          </button>
          {PLAN_TEMPLATES.map((t) => (
            <button key={t.id} className={`tr3-tpl ${sel?.tplId === t.id ? 'on' : ''}`} disabled={!sel} onClick={() => assign(t.id)}>
              <b>{t.name}</b><span>{t.desc}</span>
            </button>
          ))}
        </div>
        <div className="dnote mt8">{sel?.current ? 'Laufende Woche: Die Vorlage wird sofort geladen.' : 'Ab dem gewählten Montag lädt der Trainerstab die Vorlage in deinen Wochenplan – bis du etwas anderes vormerkst oder den Plan änderst.'}</div>
      </DashBox>

      <PhilosophyBox g={g} onChange={refresh} hideFoerder />
    </DashPage>
  );
}
