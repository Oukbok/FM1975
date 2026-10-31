import { useState } from 'react';
import { yearOf } from '../../engine/economy';
import { FACILITIES, FACILITY_BY_KEY, facilityAvailable } from '../../engine/infrastructure';
import { GROUNDS_BY_KEY, GROUNDS_MODULES } from '../../data/groundsCatalog';
import { areaUsed, levelOf } from '../../engine/grounds';
import { ensureClubGrounds } from '../../game/groundsGame';
import { Game } from '../../game/state';
import { FacilityKey } from '../../types';
import { GroundsModuleKey } from '../../types/grounds';
import { DashBox, DashPage, KV } from '../../ui/DashPage';
import { fmtDM } from '../../ui/format';
import { GroundKey, GroundsScene } from './grounds/GroundsScene';
import { GroundsPanel } from './grounds/GroundsPanel';
import { FacilityDetail, ModuleDetail } from './grounds/GroundsDetail';

// =============================================================================
// VEREINSGELÄNDE — links die gezeichnete Anlage (wächst mit Ausbau und Epoche),
// rechts Lage & Wirkung, Bauliste oder die Details des gewählten Teils.
// Umfeld-Logik: engine/grounds.ts + game/groundsGame.ts.
// =============================================================================
const FUTURE_KEYS: FacilityKey[] = ['rehaCenter', 'nlz', 'performanceCenter', 'dataCenter'];
const isModule = (k: GroundKey): k is GroundsModuleKey => k in GROUNDS_BY_KEY;

export function FacilitiesView({ g, onChange, onGoto }: { g: Game; onChange: () => void; onGoto?: (s: 'stadium' | 'marketing') => void }) {
  const [sel, setSel] = useState<GroundKey | null>(null);
  const [hover, setHover] = useState<GroundKey | null>(null);
  const club = g.clubs[g.managedClubId];
  const today = g.calendar.currentDate;
  const gr = ensureClubGrounds(club, today);
  const infra = club.infrastructure;
  const year = yearOf(today);
  const month = Number(today.slice(5, 7));

  const unlocked = new Set<FacilityKey>(FACILITIES.filter((d) => facilityAvailable(d, year) || ((infra[d.key] as number) >= 2 && (!d.unlockYear || year >= d.unlockYear))).map((d) => d.key));
  const labels: Partial<Record<GroundKey, string>> = { clubhouse: 'Geschäftsstelle' };
  for (const d of FACILITIES) labels[d.key] = `${d.name}${FUTURE_KEYS.includes(d.key) && (infra[d.key] as number) < 2 ? ' (Bauplatz)' : ` · Stufe ${infra[d.key]}`}`;
  for (const m of GROUNDS_MODULES) {
    const lv = levelOf(gr, m.key);
    labels[m.key] = lv ? m.levels[lv - 1].name : `${m.name} (Bauplatz)`;
  }
  const used = areaUsed(club, gr);
  const title = sel == null ? 'Umfeld' : sel === 'clubhouse' ? 'Geschäftsstelle' : isModule(sel) ? GROUNDS_BY_KEY[sel].name : FACILITY_BY_KEY[sel].name;
  const common = { g, club, gr, year, onChange, onClose: () => setSel(null) };

  return (
    <DashPage>
      <DashBox title={`Vereinsgelände ${club.name}`} icon="facilities" span={2} rows={2} flush
        right={`Kontostand ${fmtDM(club.finances.balance)} · Fläche ${used}/${gr.area}`}>
        <div className="gr-wrap" onClick={(e) => { if ((e.target as Element).tagName === 'svg') setSel(null); }}>
          <GroundsScene club={club} year={year} month={month} unlocked={unlocked} selected={sel} hover={hover}
            onSelect={setSel} onHover={setHover} labels={labels as Record<GroundKey, string>} />
          {!sel && <div className="gr-hint">Klicke auf ein Gebäude, einen Platz oder eine Fläche.</div>}
        </div>
      </DashBox>
      <DashBox title={title} icon={sel && isModule(sel) ? undefined : 'facilities'} span={1} rows={2}>
        {sel == null && <GroundsPanel g={g} club={club} gr={gr} year={year} onSelect={setSel} onChange={onChange} />}
        {sel === 'clubhouse' && (
          <div className="gd">
            <div className="gd-head"><span className="gd-cat">Verwaltung</span><button className="gd-back" onClick={() => setSel(null)}>Übersicht</button></div>
            <div className="dnote">Sitz von Vorstand, Verwaltung und Trainerbüros. Sie wächst mit dem Ansehen des Vereins und zeigt den Baustil der Epoche.</div>
            <KV k="Ansehen" v={`${Math.round(club.reputation)} / 100`} />
            <KV k="Gegründet" v={club.founded} />
          </div>
        )}
        {sel && sel !== 'clubhouse' && isModule(sel) && <ModuleDetail key={sel} {...common} k={sel} />}
        {sel && sel !== 'clubhouse' && !isModule(sel) && <FacilityDetail key={sel} {...common} k={sel} onGoto={onGoto} />}
      </DashBox>
    </DashPage>
  );
}
