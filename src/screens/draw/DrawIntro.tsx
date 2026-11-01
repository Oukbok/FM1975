// =============================================================================
// Startbildschirm der Auslosung: Wettbewerb, Runde, Termin/Ort und die Regeln
// dieser Runde (data/drawRuleSheet.ts – so, wie die Engine spielt, mit
// Hinweis aufs historische Vorbild). Die Ziehung beginnt erst per Knopf.
// =============================================================================
import Icon from '../../components/Icon';
import type { CupState } from '../../types';
import type { DrawRecord } from '../../types/draw';
import { drawCompName } from '../../game/cupDraw';
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
    rules: drawRulesFor(rec.comp, rec.roundIndex, startYear), potCount: rec.pots.length,
  });
  const teams = rec.pots.reduce((s, p) => s + p.ids.length, 0);
  return (
    <div className="dr-intro">
      <div className="dr-intro-kicker">{drawCompName(rec.comp)} {cup?.season ?? ''}</div>
      <div className="dr-intro-title">Auslosung</div>
      <div className="dr-intro-round">{rec.roundName}</div>
      <div className="dr-intro-facts">
        <span>Ziehung {fmtDateFull(rec.date)}</span>
        <span>{rec.venue} · {show}</span>
        <span>{teams} Vereine · {rec.pairs.length} Paarungen · gespielt am {fmtDateFull(rec.matchDate)}</span>
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
          <Icon name="play" size={24} /> Mit der Auslosung beginnen
        </button>
        <button className="ms-btn" onClick={onOverview}>{replay ? 'Direkt zur Übersicht' : 'Ergebnis sofort zeigen'}</button>
      </div>
    </div>
  );
}
