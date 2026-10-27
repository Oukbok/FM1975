import { currencyForYear, economyScale, yearOf } from '../../engine/economy';
import { CATERING_UPKEEP } from '../../engine/finances';
import { FACILITIES, FACILITY_BY_KEY, FAC_UPKEEP_BASE, LEVEL_MULT, MAX_LEVEL, canUpgrade, upgradeCost, upgradeFacility } from '../../engine/infrastructure';
import { makeMessage, pushMessage } from '../../engine/messages';
import { Game } from '../../game/state';
import { CateringMode, FacilityKey } from '../../types';
import { DashBox, DashPage, KV, Kpi } from '../../ui/DashPage';
import { fmtDM } from '../../ui/format';
import { useState } from 'react';

// =============================================================================
// VEREINSGELÄNDE (Infrastruktur) — Einrichtungen ausbauen
// =============================================================================
export function FacilitiesView({ g, onChange }: { g: Game; onChange: () => void }) {
  const [msg, setMsg] = useState<string | null>(null);
  const club = g.clubs[g.managedClubId];
  const infra = club.infrastructure;
  const curYear = yearOf(g.calendar.currentDate);
  const scale = economyScale(curYear);
  const cateringMode: CateringMode = club.commerce?.cateringMode ?? 'verpachtung';
  const FUTURE_UPKEEP_KEYS: FacilityKey[] = ['rehaCenter', 'nlz', 'performanceCenter', 'dataCenter'];

  // Monatliche Fixkosten (Unterhalt) einer einzelnen Einrichtung (era-skaliert).
  const facMonthlyUpkeep = (key: FacilityKey, level: number): number => {
    const lvl = Math.max(1, Math.min(MAX_LEVEL, Math.round(level)));
    if (key === 'catering') return Math.round(CATERING_UPKEEP[cateringMode][lvl] * scale);
    if (key === 'stadium') return 0; // im Stadionunterhalt enthalten
    const base = FAC_UPKEEP_BASE[key];
    if (!base) return 0;
    if (FUTURE_UPKEEP_KEYS.includes(key) && lvl < 2) return 0;
    return Math.round(base * LEVEL_MULT[lvl] * scale);
  };

  const doUpgrade = (key: typeof FACILITIES[number]['key']) => {
    const res = upgradeFacility(club, key, g.calendar.currentDate, club.id === g.managedClubId);
    if (res.ok) {
      const def = FACILITY_BY_KEY[key];
      pushMessage(g.messages, makeMessage({
        date: g.calendar.currentDate, category: 'board', from: 'Vereinsvorstand',
        subject: `Ausbau abgeschlossen: ${def.name} (Stufe ${res.newLevel})`,
        shortText: `${def.name} wurde auf Stufe ${res.newLevel} ausgebaut.`,
        bodyText: `Der Ausbau der Einrichtung „${def.name}" auf Stufe ${res.newLevel} ist abgeschlossen.\n\n`
          + `Kosten: ${fmtDM(res.cost)}\n`
          + `Neuer Effekt: ${def.effectAt(res.newLevel)}\n`
          + `Neuer Kontostand: ${fmtDM(club.finances.balance)}`,
      }));
      setMsg(`${def.name} auf Stufe ${res.newLevel} ausgebaut (${fmtDM(res.cost)}).`);
      onChange();
    } else {
      setMsg(res.reason ?? 'Ausbau nicht möglich.');
    }
  };

  const unlockedDefs = FACILITIES.filter((d) => !d.unlockYear || curYear >= d.unlockYear);
  const futureDefs = FACILITIES.filter((d) => d.unlockYear && curYear < d.unlockYear).sort((a, b) => (a.unlockYear ?? 0) - (b.unlockYear ?? 0));
  const totalUpkeep = unlockedDefs.reduce((sum, d) => sum + facMonthlyUpkeep(d.key, infra[d.key] as number), 0);
  const upgradable = unlockedDefs.filter((d) => (infra[d.key] as number) < MAX_LEVEL)
    .map((d) => ({ d, cost: upgradeCost(d.key, (infra[d.key] as number) + 1) })).sort((a, b) => a.cost - b.cost);
  const avgLevel = unlockedDefs.length ? unlockedDefs.reduce((s2, d) => s2 + (infra[d.key] as number), 0) / unlockedDefs.length : 0;

  return (
    <DashPage>
      <DashBox title="Einrichtungen" icon="facilities" span={2} rows={2} right={`Ø Stufe ${avgLevel.toFixed(1)} / ${MAX_LEVEL}`}>
        {unlockedDefs.map((def) => {
          const level = infra[def.key] as number;
          const check = canUpgrade(club, def.key);
          const atMax = level >= MAX_LEVEL;
          const nextCost = atMax ? 0 : upgradeCost(def.key, level + 1);
          const upkeep = facMonthlyUpkeep(def.key, level);
          return (
            <div key={def.key} className="dfac">
              <div className="dfac-name">
                <b>{def.name}</b>
                <span className="dpips">{Array.from({ length: MAX_LEVEL }).map((_, i) => <i key={i} className={i < level ? 'on' : ''} />)}</span>
              </div>
              <div className="dfac-fx">
                <span>{def.effectAt(level)}</span>
                {!atMax && <span className="dnote" style={{ color: 'var(--accent)' }}>Stufe {level + 1}: {def.effectAt(level + 1)}</span>}
                <span className="dnote">Fixkosten: {upkeep > 0 ? `${fmtDM(upkeep)}/Monat` : def.key === 'stadium' ? 'im Stadionunterhalt' : 'keine'}</span>
              </div>
              <div className="dfac-act">
                {atMax ? <span className="dchip on">Maximum</span> : <>
                  <button className="dchip on" disabled={!check.ok} onClick={() => doUpgrade(def.key)} title={check.ok ? '' : check.reason}>Ausbauen {fmtDM(nextCost)}</button>
                  {!check.ok && <span className="dnote" style={{ color: 'var(--red)' }}>{check.reason}</span>}
                </>}
              </div>
            </div>
          );
        })}
      </DashBox>

      <DashBox title="Ausbau-Übersicht" icon="finances">
        <div className="dkpis">
          <Kpi value={fmtDM(club.finances.balance)} label="Kontostand" />
          <Kpi value={fmtDM(totalUpkeep)} label="Fixkosten / Monat" color="var(--red)" />
        </div>
        <div className="dsec">Günstigste nächste Ausbauten</div>
        {upgradable.slice(0, 4).map(({ d, cost }) => <KV key={d.key} k={`${d.name} → Stufe ${(infra[d.key] as number) + 1}`} v={fmtDM(cost)} />)}
        {msg && <div className="dnote mt8" style={{ color: 'var(--accent)', fontSize: 15 }}>{msg}</div>}
        <div className="dnote mt8">Ausbaukosten werden sofort abgebucht ({currencyForYear(curYear)}). Die Catering-Betriebsform stellst du unter „Marketing“ ein.</div>
      </DashBox>

      <DashBox title="Künftige Einrichtungen" icon="kalender" right={`${futureDefs.length}`}>
        {futureDefs.length ? futureDefs.map((d) => (
          <div key={d.key} className="dlist-row" style={{ alignItems: 'flex-start' }}>
            <span className="dchip" style={{ minWidth: 70, textAlign: 'center' }}>ab {d.unlockYear}</span>
            <span className="grow"><b>{d.name}</b><span className="dnote" style={{ display: 'block' }}>{d.desc}</span></span>
          </div>
        )) : <div className="dnote">Alle Einrichtungen sind verfügbar.</div>}
      </DashBox>
    </DashPage>
  );
}
