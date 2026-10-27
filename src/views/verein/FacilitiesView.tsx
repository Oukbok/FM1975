import ClubCrest from '../../components/ClubCrest';
import Icon from '../../components/Icon';
import { currencyForYear, economyScale, yearOf } from '../../engine/economy';
import { CATERING_LEASE, CATERING_NETPERHEAD, CATERING_UPKEEP } from '../../engine/finances';
import { FACILITIES, FACILITY_BY_KEY, FAC_UPKEEP_BASE, LEVEL_MULT, MAX_LEVEL, canUpgrade, upgradeCost, upgradeFacility } from '../../engine/infrastructure';
import { makeMessage, pushMessage } from '../../engine/messages';
import { Game } from '../../game/state';
import { CateringMode, FacilityKey } from '../../types';
import { PageHead } from '../../ui/PageHead';
import { fmtDM } from '../../ui/format';
import { useState } from 'react';

// =============================================================================
// VEREINSGELÄNDE (Infrastruktur) — Einrichtungen ausbauen
// =============================================================================
export function FacilitiesView({ g, onChange }: { g: Game; onChange: () => void }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [showFuture, setShowFuture] = useState(false);
  const club = g.clubs[g.managedClubId];
  const infra = club.infrastructure;
  const curYear = yearOf(g.calendar.currentDate);
  const scale = economyScale(curYear);
  const cateringMode: CateringMode = club.commerce?.cateringMode ?? 'verpachtung';
  const CATERING_MODE_LABEL: Record<CateringMode, string> = {
    eigenbetrieb: 'Eigenbetrieb', umsatz: 'Umsatzbeteiligung', verpachtung: 'Verpachtung',
  };
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

  const setCateringMode = (mode: CateringMode) => {
    const com = club.commerce ?? (club.commerce = { cateringMode: 'verpachtung' });
    com.cateringMode = mode;
    onChange();
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
      setMsg(`✔ ${def.name} auf Stufe ${res.newLevel} ausgebaut (${fmtDM(res.cost)}).`);
      onChange();
    } else {
      setMsg(`⚠ ${res.reason}`);
    }
    setTimeout(() => setMsg(null), 4000);
  };

  return (
    <div className="page">
      <PageHead
        left={<ClubCrest club={club} size={27} />}
        title="Vereinsgelände"
        right={<span className="dim">Kontostand: <b style={{ color: 'var(--accent)' }}>{fmtDM(club.finances.balance)}</b></span>}
      />

      <label className="future-toggle mt12">
        <input type="checkbox" checked={showFuture} onChange={(e) => setShowFuture(e.target.checked)} />
        <span>Zukunft anzeigen</span>
        <span className="dim2 mini">— zeigt noch nicht verfügbare Einrichtungen späterer Epochen (ausgegraut).</span>
      </label>

      {msg && <div className="card mt12" style={{ borderColor: 'var(--accent)' }}>{msg}</div>}

      <div className="fac-grid mt12">
        {FACILITIES.filter((def) => {
          const unlocked = !def.unlockYear || curYear >= def.unlockYear;
          return unlocked || showFuture;
        }).map((def) => {
          const unlocked = !def.unlockYear || curYear >= def.unlockYear;
          const level = infra[def.key] as number;
          const check = canUpgrade(club, def.key);
          const atMax = level >= MAX_LEVEL;
          const nextCost = atMax ? 0 : upgradeCost(def.key, level + 1);
          const affordable = check.ok && unlocked;
          if (!unlocked) {
            return (
              <div key={def.key} className="card fac-card fac-locked">
                <div className="fac-head">
                  <span className="fac-ico">{def.iconName ? <Icon name={def.iconName} /> : def.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div className="fac-name">{def.name}</div>
                    <div className="fac-level">
                      <span className="pill" style={{ color: 'var(--yellow)' }}>ab {def.unlockYear}</span>
                    </div>
                  </div>
                </div>
                <div className="dim mini fac-desc">{def.desc}</div>
                <div className="fac-foot">
                  <span className="dim2 mini">Noch nicht verfügbar — schaltet sich {def.unlockYear} frei.</span>
                </div>
              </div>
            );
          }
          return (
            <div key={def.key} className="card fac-card">
              <div className="fac-head">
                <span className="fac-ico">{def.iconName ? <Icon name={def.iconName} /> : def.icon}</span>
                <div style={{ flex: 1 }}>
                  <div className="fac-name">{def.name}</div>
                  <div className="fac-level">
                    {Array.from({ length: MAX_LEVEL }).map((_, i) => (
                      <span key={i} className={`fac-pip ${i < level ? 'on' : ''}`} />
                    ))}
                    <span className="dim mini" style={{ marginLeft: 8 }}>Stufe {level}/{MAX_LEVEL}</span>
                  </div>
                </div>
              </div>
              <div className="dim mini fac-desc">{def.desc}</div>

              <div className="fac-effect">
                <div className="fac-effect-row">
                  <span className="dim2 mini">Aktuell:</span>
                  <span className="mini">{def.effectAt(level)}</span>
                </div>
                {!atMax && (
                  <div className="fac-effect-row">
                    <span className="dim2 mini">Nach Ausbau:</span>
                    <span className="mini accent-text">{def.effectAt(level + 1)}</span>
                  </div>
                )}
                <div className="fac-effect-row">
                  <span className="dim2 mini">Fixkosten / Monat:</span>
                  <span className="mini red">
                    {facMonthlyUpkeep(def.key, level) > 0 ? `−${fmtDM(facMonthlyUpkeep(def.key, level))}` : (def.key === 'stadium' ? 'im Stadionunterhalt' : '—')}
                  </span>
                </div>
              </div>

              {def.key === 'catering' && (
                <div className="fac-effect" style={{ marginTop: 6 }}>
                  <div className="dim2 mini" style={{ marginBottom: 4 }}>Betriebsform (Netto/Besucher · Fixkosten/Monat):</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {(['eigenbetrieb', 'umsatz', 'verpachtung'] as CateringMode[]).map((m) => (
                      <button
                        key={m}
                        className={`btn btn-sm ${cateringMode === m ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setCateringMode(m)}
                        title={`${fmtDM(Math.round(CATERING_NETPERHEAD[m][level] * scale))}/Besucher · −${fmtDM(Math.round(CATERING_UPKEEP[m][level] * scale))}/Monat${m === 'verpachtung' ? ` · +${fmtDM(Math.round(CATERING_LEASE[level] * scale))} Pacht/Monat` : ''}`}
                      >
                        {CATERING_MODE_LABEL[m]}
                      </button>
                    ))}
                  </div>
                  <div className="mini dim" style={{ marginTop: 4 }}>
                    Aktuell <b>{CATERING_MODE_LABEL[cateringMode]}</b>: {fmtDM(Math.round(CATERING_NETPERHEAD[cateringMode][level] * scale))}/Besucher
                    {cateringMode === 'verpachtung' && <> · +{fmtDM(Math.round(CATERING_LEASE[level] * scale))} Pacht/Monat</>}
                  </div>
                </div>
              )}

              <div className="fac-foot">
                {atMax ? (
                  <span className="pill" style={{ color: 'var(--green)' }}>Maximalstufe erreicht</span>
                ) : (
                  <>
                    <span className="mini">
                      Ausbau auf Stufe {level + 1}: <b className={affordable ? 'accent-text' : 'red'}>{fmtDM(nextCost)}</b>
                    </span>
                    <button className="btn btn-sm" disabled={!affordable} onClick={() => doUpgrade(def.key)} style={{ marginLeft: 'auto' }}>
                      🔨 Ausbauen
                    </button>
                  </>
                )}
              </div>
              {!atMax && !affordable && (
                <div className="red mini" style={{ marginTop: 6 }}>{check.reason}</div>
              )}
            </div>
          );
        })}
      </div>

      <div className="dim2 mini mt12">
        Alle Ausbaukosten werden sofort vom Vereinskonto abgebucht (Währung ära-gerecht: {currencyForYear(yearOf(g.calendar.currentDate))}). Effekte:
        <b> Stadion</b> → mehr Zuschauerkapazität & Stadioneinnahmen · <b>Trainingszentrum</b> → schnellere Kaderentwicklung ·
        <b> Jugendakademie</b> → mehr & bessere Talente · <b>Medizin</b> → schnellere Regeneration & kürzere Ausfälle ·
        <b> Fanshop</b> → höherer Fanartikel-Erlös · <b>Catering</b> → Pro-Kopf-Erlös je Heimspiel (Betriebsform waehlbar).
        Jede gebaute Einrichtung verursacht monatliche <b>Fixkosten</b> (oben je Einrichtung ausgewiesen), die im Monatsabschluss gebucht werden.
      </div>
    </div>
  );
}
