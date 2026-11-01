// =============================================================================
// ZENTRALE › BRIEFING — Archiv aller Saison-Briefings dieses Spiels
//   links: Liste der Saisons · rechts: Überblick, Ausgangslage, Neu im Spiel
//   „Briefing öffnen“ zeigt das Briefing-Fenster (BriefingModal, ohne Auftakt-Animation).
// =============================================================================
import { useMemo, useState } from 'react';
import Icon from '../../components/Icon';
import { briefingFor } from '../../data/briefings';
import { CHANGE_KIND_META } from '../../game/briefingChanges';
import { BriefingRecord, briefingLog, briefingOfRecord } from '../../game/seasonBriefing';
import { Game } from '../../game/state';
import { DashBox, DashPage, Empty } from '../../ui/DashPage';
import type { Screen } from '../../shell/navigation';
import { BriefingModal, BriefingTab } from './BriefingModal';
import { Highlights, Situation } from './briefing/BriefingParts';

export function BriefingView({ g, onGoto, onOpen }: { g: Game; onGoto?: (s: Screen) => void; onOpen?: () => void }) {
  const records: BriefingRecord[] = [...briefingLog(g).records].reverse();
  const [sel, setSel] = useState<string | null>(records[0]?.season ?? null);
  const [modal, setModalRaw] = useState<BriefingTab | null>(null);
  const setModal = (t: BriefingTab | null) => { if (t) onOpen?.(); setModalRaw(t); };
  const rec = records.find((r) => r.season === sel) ?? records[0];
  const b = useMemo(() => (rec ? briefingOfRecord(rec) : null), [rec]);

  return (
    <DashPage className="bf-arch">
      <DashBox title="Saisons" icon="briefing" rows={2} right={`${records.length}`}>
        {records.length === 0 ? <Empty icon="briefing">Noch keine Briefings.</Empty> : (
          <div className="bf-arch-list">
            {records.map((r) => (
              <button key={r.season} className={`bf-arch-item ${r.season === rec?.season ? 'sel' : ''}`} onClick={() => setSel(r.season)}>
                <span className="bf-arch-season">{r.season}</span>
                <span className="bf-arch-head">{briefingFor(r.season)?.headline ?? (r.first ? 'Spielbeginn' : 'Saisonwechsel')}</span>
                {r.first && <span className="bf-arch-tag">Spielbeginn</span>}
              </button>
            ))}
          </div>
        )}
      </DashBox>

      <DashBox title={b ? `${b.season}: ${b.headline}` : 'Briefing'} icon="briefing" span={2}
        right={b ? <button className="btn-sm" onClick={() => setModal('overview')}>Briefing öffnen</button> : undefined}>
        {b ? (
          <>
            <div className="bf-arch-title">{b.title}</div>
            <Highlights list={b.highlights} compact />
          </>
        ) : <Empty icon="briefing">Wähle links eine Saison.</Empty>}
      </DashBox>

      <DashBox title="Deine Ausgangslage" icon="dashVerein">
        {b ? <Situation sit={b.situation} year={b.startYear} /> : null}
      </DashBox>

      <DashBox title="Neu im Spiel" icon="unlock" right={b ? `${b.inGame.length}` : undefined}
        onClick={b && b.inGame.length ? () => setModal('ingame') : undefined}>
        {b && b.inGame.length ? (
          <div className="bf-arch-changes">
            {b.inGame.map((c, i) => (
              <div key={i} className="bf-arch-change">
                <Icon name={c.icon} size={18} />
                <span><b>{c.title}</b><small>{CHANGE_KIND_META[c.kind].label}</small></span>
              </div>
            ))}
          </div>
        ) : <Empty icon="unlock">Keine Änderungen im Spiel.</Empty>}
      </DashBox>

      {b && modal && <BriefingModal b={b} g={g} initialTab={modal} onClose={() => setModal(null)} onGoto={onGoto} />}
    </DashPage>
  );
}
