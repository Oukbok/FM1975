// =============================================================================
// VORSCHAU „NÄCHSTES SPIEL“ (Wunsch Pascal, Vorbild EA Fussball Manager): Vollbild vor
// jedem eigenen Pflichtspiel. Links Bühne + Fakten + historische Daten, rechts Karte,
// Stadtbild, Zuschauer, Wetter und „Über die Stadt“. Unten rechts die Wahl der Spielart:
// „Simulieren“ (sofortiges Ergebnis) oder „Im Textmodus spielen“ – beide starten exakt
// die bisherigen Abläufe in shell/GameShell.tsx. Daten: game/prematch.ts.
// Ein-/Ausschalten nur in den Einstellungen (AppSettings.prematchScreen) – kein Schalter im Bildschirm (Wunsch Pascal).
// (dann wieder die zwei Knöpfe oben rechts); die gewählte Art merkt sich `lastMatchMode`.
// =============================================================================
import { useEffect, useMemo, useState } from 'react';
import Icon from '../../components/Icon';
import { autoFillLineup } from '../../engine/lineupAI';
import { promiseLineupPrefs } from '../../game/seasonPromisesGame';
import { eraRules } from '../../engine/match/era';
import type { AppSettings } from '../../engine/save';
import type { OwnMatchInfo } from '../../game/ownMatch';
import { buildPrematch } from '../../game/prematch';
import type { Game } from '../../game/state';
import { fmtDateFull } from '../../ui/format';
import { InfoTip } from '../../ui/InfoTip';
import { CitySkyline } from './CitySkyline';
import { PrematchFacts, PrematchHistory } from './PrematchFacts';
import { PrematchMap } from './PrematchMap';
import { PrematchStage } from './PrematchStage';
import { effectiveFormation } from '../../components/lineup/lineupOps';

type QuickLineup = 'keep' | 'auto' | 'goto';
export type MatchMode = 'sim' | 'text';

const fmtInt = (n: number) => n.toLocaleString('de-DE');

function WeatherGlyph({ w }: { w: string }) {
  const sun = <g className="pm-wx-sun"><circle r="7" />{[0, 45, 90, 135, 180, 225, 270, 315].map((a) => <line key={a} x1="10" x2="14" transform={`rotate(${a})`} />)}</g>;
  const cloud = (dx = 0, dy = 0) => <path className="pm-wx-cloud" transform={`translate(${dx} ${dy})`} d="M-12 6 Q-14 -2 -6 -3 Q-4 -10 4 -8 Q11 -9 12 -1 Q17 1 14 6 Z" />;
  return (
    <svg className="pm-wx" viewBox="-18 -18 36 36" aria-hidden>
      {w === 'sonnig' || w === 'hitze' ? sun : null}
      {w === 'bewoelkt' && <><g transform="translate(-5 -5) scale(0.7)">{sun}</g>{cloud(3, 3)}</>}
      {(w === 'regen' || w === 'schnee' || w === 'wind' || w === 'nebel') && cloud(0, -4)}
      {w === 'regen' && [-7, 0, 7].map((x) => <line key={x} className="pm-wx-rain" x1={x} y1="6" x2={x - 3} y2="14" />)}
      {w === 'schnee' && [-7, 0, 7].map((x) => <circle key={x} className="pm-wx-snow" cx={x} cy="11" r="1.8" />)}
      {w === 'wind' && <path className="pm-wx-rain" d="M-14 8 H6 Q10 8 10 11 M-12 13 H10" />}
      {w === 'nebel' && [6, 10, 14].map((y) => <line key={y} className="pm-wx-rain" x1="-14" x2="14" y1={y} y2={y} />)}
    </svg>
  );
}

export function PrematchScreen({ g, info, settings, onSettings, onStart, onLineup, onClose }: {
  g: Game; info: OwnMatchInfo; settings: AppSettings; onSettings: (s: AppSettings) => void;
  onStart: (mode: MatchMode) => void; onLineup: () => void; onClose: () => void;
}) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const d = useMemo(() => buildPrematch(g, info), [g, info.matchId]);
  const [quick, setQuick] = useState<QuickLineup>('keep');
  const primary: MatchMode = settings.lastMatchMode ?? 'text';
  // Freie Plätze in der gespeicherten Aufstellung (leer gezogen oder verletzt/gesperrt):
  // beim Anpfiff besetzt sie der Co-Trainer slotgenau mit dem Passendsten (engine/match/team.ts).
  const open = (() => {
    const t = g.clubs[g.managedClubId]?.tactics;
    if (!t?.lineupMap) return 0;
    const ok = (id?: string) => { const p = id ? g.players[id] : undefined; return !!p && p.availability === 'available' && !p.injury && !(p.suspensionMatches > 0); };
    return effectiveFormation(t).slots.filter((s) => !ok(t.lineupMap![s.id])).length;
  })();

  const start = (mode: MatchMode) => {
    if (quick === 'auto') {
      const club = g.clubs[g.managedClubId];
      if (club.tactics) Object.assign(club.tactics, autoFillLineup(club, g.players, club.tactics, eraRules(d.year).benchSize, promiseLineupPrefs(g)));
    }
    if (settings.lastMatchMode !== mode) onSettings({ ...settings, lastMatchMode: mode });
    onStart(mode);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); onClose(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const oppCity = d.about.city;
  return (
    <div className="pm-root" role="dialog" aria-label="Nächstes Spiel">
      <header className="pm-top">
        <div className="pm-top-l">
          <Icon name="matchball" size={30} />
          <span className="pm-title">Nächstes Spiel</span>
          <span className="pm-comp">{info.label}</span>
        </div>
        <button className="modal-close" onClick={onClose} aria-label="Schließen" title="Esc">×</button>
      </header>

      <div className="pm-body">
        {/* ---------------- Links: Karte des Spiels ---------------- */}
        <div className="pm-card">
          <PrematchStage home={d.home} away={d.away} year={d.year} capacity={d.capacity} />
          <div className="pm-venue">
            <div className="pm-venue-name">{d.stadium || d.home.city}</div>
            <div className="pm-venue-date">{fmtDateFull(info.date)}</div>
          </div>
          <div className="pm-quick">
            <span className="pm-quick-l">Schnelle Aufstellung <InfoTip k="prematch_aufstellung" />
              {open > 0 && quick === 'keep' && <span className="pm-quick-warn" title="Freie Plätze besetzt der Co-Trainer beim Anpfiff mit dem Passendsten">Aufstellung unvollständig ({11 - open}/11)</span>}</span>
            <select className="pm-select" value={quick} onChange={(e) => {
              const v = e.target.value as QuickLineup;
              if (v === 'goto') onLineup(); else setQuick(v);
            }}>
              <option value="keep">Aktuelle Aufstellung übernehmen</option>
              <option value="auto">Co-Trainer stellt die beste Elf auf</option>
              <option value="goto">Zur Aufstellung wechseln …</option>
            </select>
          </div>
          <PrematchFacts d={d} />
          <PrematchHistory d={d} />
        </div>

        {/* ---------------- Rechts: Ort, Zuschauer, Wetter, Stadt ---------------- */}
        <div className="pm-side">
          <div className="pm-pics">
            <PrematchMap d={d} />
            <div className="pm-city"><CitySkyline city={oppCity} tags={d.about.tags} year={d.year} /></div>
          </div>
          <div className="pm-dist">
            {d.distance != null
              ? <>Distanz (Luftlinie): <b>{fmtInt(Math.round(d.distance))} km</b></>
              : <span className="pm-dim">Distanz unbekannt</span>}
          </div>
          <div className="pm-info">
            <div className="pm-info-col">
              <section className="pm-sec">
                <h3 className="pm-h">Zuschauer <InfoTip k="prematch_zuschauer" /></h3>
                <div className="pm-kv"><span>Stadionkapazität</span><b>{d.capacity ? fmtInt(d.capacity) : '–'}</b></div>
                <div className="pm-kv"><span>Erwartete Zuschauerzahl</span><b>{d.expected ? fmtInt(d.expected) : '–'}</b></div>
                {d.capacity > 0 && d.expected > 0 && (
                  <div className="pm-meter" aria-hidden><span style={{ width: `${Math.min(100, (d.expected / d.capacity) * 100)}%` }} /></div>
                )}
              </section>
              <section className="pm-sec">
                <h3 className="pm-h">Wetter</h3>
                <div className="pm-weather">
                  <WeatherGlyph w={d.weather} />
                  <div>
                    <div className="pm-wx-l">Voraussichtliches Wetter: <b>{d.weatherLabel}</b></div>
                    <div className="pm-wx-n">{d.weatherNote}</div>
                  </div>
                </div>
              </section>
            </div>
            <section className="pm-sec pm-about">
              <h3 className="pm-h">Über die Stadt</h3>
              <div className="pm-about-city">{oppCity}</div>
              <p>{d.about.text}</p>
            </section>
          </div>
        </div>
      </div>

      <footer className="pm-foot">
        <span className="pm-foot-gap" />
        <div className="pm-go">
          <button className={`pm-go-btn ${primary === 'sim' ? 'primary' : ''}`} onClick={() => start('sim')} title="Sofortiges Ergebnis, danach der Spielbericht">
            <Icon name="skip" size={34} /><span>Simulieren</span>
          </button>
          <button className={`pm-go-btn ${primary === 'text' ? 'primary' : ''}`} onClick={() => start('text')} title="Spiel live verfolgen und eingreifen">
            <Icon name="whistle" size={34} /><span>Im Textmodus spielen</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
