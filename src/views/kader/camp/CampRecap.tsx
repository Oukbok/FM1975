// =============================================================================
// TRAININGSLAGER – animierte Zusammenfassung nach der Rückkehr (ca. 12 s, überspringbar).
// Bühne wie der Saison-Auftakt (views/zentrale/briefing/SeasonIntro.tsx): Ort, Erfolgs-
// Bogen mit Wertung, Kennzahlen Vorher/Nachher, Gewinner und Sorgenkinder, Kosten.
// Ausgelöst über DayUi.onCampEnd (game/day.ts → shell/GameShell.tsx). CSS 28-camp.css.
// Klick/Leertaste/Enter: erst Animation überspringen, dann schließen; Esc schließt.
// =============================================================================
import { useEffect, useRef, useState } from 'react';
import { campDestination } from '../../../data/campDestinations';
import { campLodging } from '../../../data/campLodgings';
import { campGrade } from '../../../engine/campPlan';
import { campFocusLabel } from '../../../game/trainingCampGame';
import type { Game } from '../../../game/state';
import { CampPlayerDelta, campState } from '../../../game/winterShared';
import { fmtDM, fmtDay } from '../../../ui/format';
import PosBadge from '../../../components/PosBadge';

export const RECAP_MS = 12500;
const sgn = (v: number, dig = 1) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(dig).replace('.', ',')}`;

function PlayerLine({ p, k, bad }: { p: CampPlayerDelta; k: number; bad?: boolean }) {
  const parts = p.injured ? [`verletzt: ${p.injured}`] : [
    `Fitness ${sgn(p.fit)}`, `Form ${sgn(p.form)}`, p.dev ? `Entw. ${sgn(p.dev, 2)}` : '', p.morale ? `Moral ${p.morale > 0 ? 'besser' : 'schlechter'}` : '', p.incident ? 'Disziplinverstoß' : '',
  ].filter(Boolean);
  return (
    <li className={`cr-pl ${bad ? 'bad' : ''}`} style={{ ['--k' as string]: k }}>
      <PosBadge pos={p.pos} />
      <span className="cr-pl-name">{p.name}{p.youth ? <em> · Jugend</em> : null}</span>
      <span className="cr-pl-what">{parts.join(' · ') || 'blieb zu Hause'}</span>
    </li>
  );
}

export function CampRecap({ g, bookingId, onClose }: { g: Game; bookingId: string; onClose: () => void }) {
  const b = campState(g).bookings.find((x) => x.id === bookingId);
  const r = b?.result;
  const [done, setDone] = useState(false);
  const [num, setNum] = useState(0);
  const doneRef = useRef(false);
  doneRef.current = done;
  useEffect(() => {
    if (!r) return;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const f = Math.min(1, Math.max(0, (t - t0 - 900) / 1800));
      setNum(Math.round(r.score * (1 - Math.pow(1 - f, 3))));
      if (f < 1 && !doneRef.current) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const end = setTimeout(() => setDone(true), RECAP_MS);
    return () => { cancelAnimationFrame(raf); clearTimeout(end); };
  }, [r]);
  const advance = () => { if (!doneRef.current) { setDone(true); setNum(r?.score ?? 0); } else onClose(); };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); onClose(); }
      else if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); e.stopImmediatePropagation(); advance(); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  });
  if (!b || !r) return null;
  const d = campDestination(b.destId);
  const l = campLodging(b.destId, b.lodgingId);
  const shown = done ? r.score : num;
  const tiles = [
    { k: 'Fitness Ø', a: r.fit[0], b: r.fit[1] },
    { k: 'Form Ø', a: r.form[0], b: r.form[1] },
    { k: 'Teamgeist', a: r.spirit[0], b: r.spirit[1], dig: 0 },
    { k: 'Frische Ø', a: r.frische[0], b: r.frische[1], dig: 0 },
  ];
  return (
    <div className={`cr-root ${done ? 'done' : ''}`} role="dialog" aria-label="Bilanz des Trainingslagers" onClick={advance}>
      <div className="si-pattern cr-pattern" />
      <div className="cr-top">
        <div className="cr-kicker">Trainingslager beendet · {fmtDay(b.start)} – {fmtDay(b.end)}</div>
        <h1 className="cr-place">{d?.name ?? b.destId}</h1>
        <div className="cr-sub">{l?.name ?? ''} · Schwerpunkt {campFocusLabel(b)} · {r.travelers} Profis{r.youth ? ` + ${r.youth} Jugend` : ''}</div>
      </div>
      <div className="cr-mid">
        <div className="cr-gauge">
          <svg viewBox="0 0 200 200" aria-hidden>
            <circle cx="100" cy="100" r="84" className="cr-g-track" pathLength={1000} />
            <circle cx="100" cy="100" r="84" className="cr-g-val" pathLength={1000} style={{ strokeDashoffset: 1000 - shown * 10 }} />
          </svg>
          <div className="cr-g-num"><b>{shown}</b><span>von 100</span></div>
          <div className="cr-grade">{campGrade(r.score)}</div>
        </div>
        <div className="cr-tiles">
          {tiles.map((t, i) => (
            <div key={t.k} className="cr-tile" style={{ ['--k' as string]: i }}>
              <span className="cr-tile-k">{t.k}</span>
              <span className="cr-tile-v">{t.a.toFixed(t.dig ?? 1).replace('.', ',')} <i>›</i> <b>{t.b.toFixed(t.dig ?? 1).replace('.', ',')}</b></span>
              <span className={`cr-tile-d ${t.b - t.a > 0.05 ? 'pos' : t.b - t.a < -0.05 ? 'neg' : ''}`}>{sgn(t.b - t.a, t.dig ?? 1)}{t.k === 'Fitness Ø' && t.b >= 98.5 ? ' · am Limit' : ''}</span>
            </div>
          ))}
          <div className="cr-tile" style={{ ['--k' as string]: 4 }}>
            <span className="cr-tile-k">Verletzte · Verstöße</span>
            <span className="cr-tile-v"><b>{r.injuries}</b> <i>·</i> <b>{r.incidents}</b></span>
            <span className={`cr-tile-d ${r.injuries ? 'neg' : ''}`}>{r.healed ? `${r.healed} früher fit` : r.injuries ? 'Ausfälle' : 'ohne Ausfall'}</span>
          </div>
          <div className="cr-tile" style={{ ['--k' as string]: 5 }}>
            <span className="cr-tile-k">Kosten · Erlöse</span>
            <span className="cr-tile-v"><b>{fmtDM(r.cost)}</b></span>
            <span className={`cr-tile-d ${r.income + r.sponsor > 0 ? 'pos' : ''}`}>{r.income + r.sponsor > 0 ? `+${fmtDM(r.income + r.sponsor)} vor Ort` : 'keine Erlöse'}</span>
          </div>
        </div>
      </div>
      <div className="cr-lists">
        <section className="cr-list win">
          <h3>Profitiert</h3>
          <ul>{r.best.length ? r.best.map((p, i) => <PlayerLine key={p.id} p={p} k={i} />) : <li className="cr-none">Niemand ragte heraus.</li>}</ul>
        </section>
        <section className="cr-list lose">
          <h3>Weniger gut gelaufen</h3>
          <ul>{r.worst.length ? r.worst.map((p, i) => <PlayerLine key={p.id} p={p} k={i} bad />) : <li className="cr-none">Keine Sorgenkinder.</li>}</ul>
        </section>
      </div>
      {r.drills?.length ? <div className="cr-alt">Taktik-Inhalte: {r.drills.map((x) => `${x.label} – ${x.up} Spieler verbessert`).join(' · ')}</div> : null}
      {r.altitudeDue && <div className="cr-alt">Höhentraining: Die Zusatzwirkung greift um den {fmtDay(r.altitudeDue)}.</div>}
      <div className="cr-skip">{done ? 'Klick, Leertaste oder Esc – weiter' : 'Klick oder Leertaste – überspringen'}</div>
    </div>
  );
}
