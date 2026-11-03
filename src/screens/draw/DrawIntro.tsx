// =============================================================================
// Startbildschirm der Auslosung: Wettbewerb, Runde, Termin/Ort und die Regeln
// dieser Runde (data/drawRuleSheet.ts – so, wie die Engine spielt, mit
// Hinweis aufs historische Vorbild). Steht in der Mittelkarte unter dem vollen
// Lostopf; die Ziehung beginnt erst per Knopf (oder den runden Startknopf).
// =============================================================================
import Icon from '../../components/Icon';
import type { CupState } from '../../types';
import type { DrawRecord } from '../../types/draw';
import { drawCompLabel, drawCompName } from '../../game/cupDraw';
import { drawRulesFor } from '../../data/drawHistory';
import { ruleSheet } from '../../data/drawRuleSheet';
import { fmtDateFull } from '../../ui/format';

export function DrawIntro({ rec, cup, startYear, show, replay, onStart, onOverview }: {
  rec: DrawRecord; cup: CupState | null; startYear: number; show: string; replay?: boolean;
  onStart: () => void; onOverview: () => void;
}) {
  const roundNames = cup?.rounds.map((r) => r.name) ?? [rec.roundName];
  const items = ruleSheet({
    comp: rec.comp, roundIndex: rec.roundIndex, roundNames, startYear,
    rules: drawRulesFor(rec.comp, rec.roundIndex, startYear), potCount: rec.pots.length, legacy: !!cup && !cup.v2,
  });
  const teams = rec.pots.reduce((s, p) => s + p.ids.length, 0);
  return (
    <div className="dr-intro">
      <div className="dr-intro-facts">
        <span>{cup ? drawCompLabel(rec.comp, cup) : drawCompName(rec.comp)} {cup?.season ?? ''}</span>
        <span>Ziehung {fmtDateFull(rec.date)} · {rec.venue} · {show}</span>
        <span>{teams} Vereine · {rec.opponents ? 'Ligaphase' : rec.groups?.length ? `${rec.groups.length} Gruppen` : `${rec.pairs.length} Paarungen`} · {rec.groups?.length ? 'erster Spieltag' : 'gespielt am'} {fmtDateFull(rec.matchDate)}</span>
      </div>
      <div className="dr-rulebox">
        <div className="dr-rulebox-head">Regeln dieser Runde</div>
        <div className="dr-rulegrid">
          {items.map((it) => (
            <div key={it.title} className="dr-rule">
              <div className="dr-rule-t">{it.title}</div>
              <div className="dr-rule-x">{it.text}</div>
              {it.history && <div className="dr-rule-h">{it.history}</div>}
            </div>
          ))}
        </div>
      </div>
      <div className="dr-intro-actions">
        <button className="dr-close dr-start" onClick={onStart} autoFocus>
          <Icon name="play" size={22} /> Mit der Auslosung beginnen
        </button>
        <button className="ms-btn" onClick={onOverview}>{replay ? 'Direkt zur Übersicht' : 'Ergebnis sofort zeigen'}</button>
      </div>
    </div>
  );
}
