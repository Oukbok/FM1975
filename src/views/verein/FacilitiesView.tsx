import { currencyForYear, economyScale, yearOf } from '../../engine/economy';
import { CATERING_UPKEEP } from '../../engine/finances';
import { FACILITIES, facilityAvailable, FACILITY_BY_KEY, FAC_UPKEEP_BASE, LEVEL_MULT, MAX_LEVEL, canUpgrade, upgradeFacility } from '../../engine/infrastructure';
import { makeMessage, pushMessage } from '../../engine/messages';
import { Game } from '../../game/state';
import { CateringMode, FacilityKey } from '../../types';
import { DashBox, DashPage, KV } from '../../ui/DashPage';
import { fmtDM } from '../../ui/format';
import { GroundKey, GroundsScene } from './grounds/GroundsScene';
import { useState } from 'react';

// =============================================================================
// VEREINSGELÄNDE — gezeichnete Anlage (eine große Box). Gebäude wachsen mit
// dem Ausbau und verändern sich mit der Epoche. Klick auf ein Gebäude öffnet
// die Details mit Ausbau. Künftige Einrichtungen bleiben unsichtbar.
// =============================================================================
const FUTURE_UPKEEP_KEYS: FacilityKey[] = ['rehaCenter', 'nlz', 'performanceCenter', 'dataCenter'];

export function FacilitiesView({ g, onChange, onGoto }: { g: Game; onChange: () => void; onGoto?: (s: 'stadium' | 'marketing') => void }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [sel, setSel] = useState<GroundKey | null>(null);
  const [hover, setHover] = useState<GroundKey | null>(null);
  const club = g.clubs[g.managedClubId];
  const infra = club.infrastructure;
  const today = g.calendar.currentDate;
  const curYear = yearOf(today);
  const month = Number(today.slice(5, 7));
  const scale = economyScale(curYear);
  const cateringMode: CateringMode = club.commerce?.cateringMode ?? 'verpachtung';

  const upkeepOf = (key: FacilityKey, level: number): number => {
    const lvl = Math.max(1, Math.min(MAX_LEVEL, Math.round(level)));
    if (key === 'catering') return Math.round(CATERING_UPKEEP[cateringMode][lvl] * scale);
    if (key === 'stadium') return 0;
    const base = FAC_UPKEEP_BASE[key];
    if (!base || (FUTURE_UPKEEP_KEYS.includes(key) && lvl < 2)) return 0;
    return Math.round(base * LEVEL_MULT[lvl] * scale);
  };

  const unlockedDefs = FACILITIES.filter((d) => facilityAvailable(d, curYear) || ((infra[d.key] as number) >= 2 && (!d.unlockYear || curYear >= d.unlockYear)));
  const unlocked = new Set<FacilityKey>(unlockedDefs.map((d) => d.key));
  const totalUpkeep = unlockedDefs.reduce((sum, d) => sum + upkeepOf(d.key, infra[d.key] as number), 0);
  const labels = Object.fromEntries([...FACILITIES.map((d) => [d.key, `${d.name}${FUTURE_UPKEEP_KEYS.includes(d.key) && (infra[d.key] as number) < 2 ? ' (Bauplatz)' : ` · Stufe ${infra[d.key]}`}`]), ['clubhouse', 'Geschäftsstelle']]) as Record<GroundKey, string>;

  const doUpgrade = (key: FacilityKey) => {
    const res = upgradeFacility(club, key, today, true);
    if (res.ok) {
      const def = FACILITY_BY_KEY[key];
      pushMessage(g.messages, makeMessage({
        date: today, category: 'board', from: 'Vereinsvorstand',
        subject: `Ausbau abgeschlossen: ${def.name} (Stufe ${res.newLevel})`,
        shortText: `${def.name} wurde auf Stufe ${res.newLevel} ausgebaut.`,
        bodyText: `Der Ausbau der Einrichtung „${def.name}" auf Stufe ${res.newLevel} ist abgeschlossen.\n\nKosten: ${fmtDM(res.cost)}\nNeuer Effekt: ${def.effectAt(res.newLevel)}\nNeuer Kontostand: ${fmtDM(club.finances.balance)}`,
      }));
      setMsg(`${def.name} auf Stufe ${res.newLevel} ausgebaut (${fmtDM(res.cost)}).`);
      onChange();
    } else setMsg(res.reason ?? 'Ausbau nicht möglich.');
  };

  const def = sel && sel !== 'clubhouse' ? FACILITY_BY_KEY[sel] : null;
  const level = def ? (infra[def.key] as number) : 0;
  const plot = def && FUTURE_UPKEEP_KEYS.includes(def.key) && level < 2;
  const check = def ? canUpgrade(club, def.key, scale) : null;
  const obsolete = def?.obsoleteYear != null && curYear >= def.obsoleteYear;

  return (
    <DashPage>
      <DashBox title={`Vereinsgelände ${club.name}`} icon="facilities" span={3} rows={2} flush
        right={`Kontostand ${fmtDM(club.finances.balance)} · Fixkosten ${fmtDM(totalUpkeep)}/Monat`}>
        <div className="gr-wrap" onClick={(e) => { if ((e.target as Element).tagName === 'svg') setSel(null); }}>
          <GroundsScene club={club} year={curYear} month={month} unlocked={unlocked} selected={sel} hover={hover}
            onSelect={(k) => { setSel(k); setMsg(null); }} onHover={setHover} labels={labels} />
          {!sel && <div className="gr-hint">Klicke auf ein Gebäude oder einen Platz, um Details zu sehen und auszubauen.</div>}
          {sel === 'clubhouse' && (
            <div className="gr-panel">
              <div className="gr-panel-head"><b>Geschäftsstelle</b><button className="modal-close" onClick={() => setSel(null)}>×</button></div>
              <div className="dnote">Sitz von Vorstand, Verwaltung und Trainerbüros. Sie wächst mit dem Ansehen des Vereins und zeigt den Baustil der Epoche.</div>
              <KV k="Ansehen" v={`${Math.round(club.reputation)} / 100`} />
              <KV k="Gegründet" v={club.founded} />
            </div>
          )}
          {def && (
            <div className="gr-panel">
              <div className="gr-panel-head"><b>{def.name}</b><button className="modal-close" onClick={() => setSel(null)}>×</button></div>
              <div className="dnote">{def.desc}</div>
              {plot ? <KV k="Status" v="Bauplatz – noch nicht gebaut" /> : <>
                <div className="gr-pips">{Array.from({ length: MAX_LEVEL }).map((_, i) => <i key={i} className={i < level ? 'on' : ''} />)}<span>Stufe {level} / {MAX_LEVEL}</span></div>
                <KV k="Wirkung" v={def.effectAt(level)} />
              </>}
              {level < MAX_LEVEL && <KV k={plot ? 'Nach dem Bau' : `Stufe ${level + 1}`} v={def.effectAt(level + 1)} color="var(--accent)" />}
              <KV k="Fixkosten" v={upkeepOf(def.key, level) > 0 ? `${fmtDM(upkeepOf(def.key, level))} / Monat` : def.key === 'stadium' ? 'im Stadionunterhalt' : 'keine'} />
              {def.key === 'stadium' ? (
                <button className="btn btn-primary mt8" onClick={() => onGoto?.('stadium')}>Zum Stadion</button>
              ) : obsolete ? <div className="dnote mt8">Diese Einrichtung ist veraltet und wird nicht mehr ausgebaut.</div>
                : level >= MAX_LEVEL ? <div className="dnote mt8" style={{ color: 'var(--green)' }}>Höchste Ausbaustufe erreicht.</div>
                  : <>
                    <button className="btn btn-primary mt8" disabled={!check?.ok} onClick={() => doUpgrade(def.key)}>{plot ? 'Bauen' : 'Ausbauen'} für {fmtDM(check?.cost ?? 0)}</button>
                    {!check?.ok && <div className="dnote" style={{ color: 'var(--red)' }}>{check?.reason}</div>}
                  </>}
              {def.key === 'catering' && <div className="dnote mt8">Die Betriebsform stellst du unter „Marketing“ ein.</div>}
              {msg && <div className="dnote mt8" style={{ color: 'var(--accent)', fontWeight: 700 }}>{msg}</div>}
              <div className="dnote mt8">Ausbaukosten werden sofort abgebucht ({currencyForYear(curYear)}).</div>
            </div>
          )}
        </div>
      </DashBox>
    </DashPage>
  );
}
