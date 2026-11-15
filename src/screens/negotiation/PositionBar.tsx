// =============================================================================
// VERHANDLUNGSPOSITION — wo stehen beide Seiten gerade? (Wunsch Pascal)
// Oben drei Zahlen: dein Angebot, der Abstand, die Forderung. Darunter eine Leiste
// auf gemeinsamer Skala: dein Angebot (rund, Vereinsfarbe) wandert beim Einstellen
// sofort mit, die Forderung des Gegenübers (Raute, dunkelblau) rückt mit jedem
// Gegenvorschlag näher; frühere Runden bleiben als kleine Marken stehen. Die
// schraffierte Zone ist die Einschätzung deines Stabs, wo eine Einigung liegt.
// Rechts der Verlauf je Runde: zwei Linien, die aufeinander zulaufen.
// Rein darstellend – alle Werte in derselben Einheit, Beschriftung über `fmt`.
// =============================================================================
export interface PositionData {
  /** Wert deines aktuellen Entwurfs. */
  offer: number;
  /** Wert der aktuellen Forderung (null = noch keine genannt). */
  ask: number | null;
  /** Eröffnungsforderung (Skalenende). */
  open: number;
  /** Einschätzung deines Stabs: Spanne, in der eine Einigung liegt. */
  zone?: [number, number] | null;
  zoneLabel?: string;
  /** Verlauf je Runde: [dein Angebot, Forderung danach]. */
  hist: [number, number][];
  fmt: (v: number) => string;
  offerLabel?: string;
  askLabel?: string;
  /** Text statt der Forderung, solange keine genannt ist. */
  askUnknown?: string;
  /** Was der Wert bedeutet (kleine Zeile unter den Zahlen). */
  unit?: string;
  /** Abstand als Text (fehlt = Betrag und Prozent der Forderung). */
  gapFmt?: (gap: number) => string;
}

const W = 100;

export function PositionBar({ p, ended }: { p: PositionData; ended?: 'agreed' | 'failed' | null }) {
  const ask = p.ask ?? p.open;
  const vals = [p.offer, ask, p.open, ...(p.zone ?? []), ...p.hist.flat()].filter((x) => Number.isFinite(x) && x > 0);
  let lo = Math.min(...vals), hi = Math.max(...vals);
  const pad = Math.max((hi - lo) * 0.12, hi * 0.03);
  lo = Math.max(0, lo - pad); hi += pad * 0.6;
  const x = (v: number) => Math.max(0, Math.min(W, ((v - lo) / Math.max(1e-9, hi - lo)) * W));
  const met = p.ask != null && p.offer >= p.ask * 0.985;
  const gap = Math.max(0, ask - p.offer);
  const gapPct = ask > 0 ? Math.round((gap / ask) * 100) : 0;
  const inZone = p.zone ? (p.offer >= p.zone[1] ? 2 : p.offer >= p.zone[0] ? 1 : 0) : -1;
  const verdict = ended === 'agreed' ? 'Einigung erzielt' : ended === 'failed' ? 'Gespräch beendet'
    : p.ask == null ? 'Noch keine Forderung' : met ? 'Du erfüllst die Forderung' : inZone === 2 ? 'Über der geschätzten Zone – gute Aussicht' : inZone === 1 ? 'In der geschätzten Zone – könnte reichen'
      : p.ask == null ? 'Noch keine Forderung' : inZone === 0 ? 'Unter der geschätzten Zone' : 'Abstand zur Forderung';
  const tone = ended === 'failed' ? 'bad' : p.ask == null ? 'far' : met || ended === 'agreed' || inZone === 2 ? 'good' : inZone === 1 ? 'mid' : 'far';
  const rounds = p.hist.length;

  // Verlauf: Forderungen fallen (ab der Eröffnung), Angebote steigen; der Entwurf hängt gestrichelt an.
  const CW = 380, CH = 148, L = 14, R = 14, T = 12, B = 26;
  const steps = Math.max(2, rounds + 1);
  const cx = (i: number) => L + (i / steps) * (CW - L - R);
  const cy = (v: number) => T + (1 - (v - lo) / Math.max(1e-9, hi - lo)) * (CH - T - B);
  const askPts = [[0, p.open] as [number, number], ...p.hist.map(([, a], i) => [i + 1, a] as [number, number])];
  const offPts = p.hist.map(([o], i) => [i + 1, o] as [number, number]);
  const path = (pts: [number, number][]) => pts.map(([i, v], k) => `${k ? 'L' : 'M'}${cx(i).toFixed(1)} ${cy(v).toFixed(1)}`).join(' ');
  const lastOff = offPts[offPts.length - 1];

  return (
    <div className={`vt-pos tone-${tone}`}>
      <div className="vt-pos-main">
        <div className="vt-pos-nums">
          <div className="vt-pos-num mine"><span>{p.offerLabel ?? 'Dein Angebot'}</span><b>{p.fmt(p.offer)}</b></div>
          <div className="vt-pos-num gap"><span>{verdict}</span><b>{met || ended === 'agreed' || p.ask == null ? '–' : p.gapFmt ? p.gapFmt(gap) : `${p.fmt(gap)}${gapPct ? ` · ${gapPct} %` : ''}`}</b></div>
          <div className="vt-pos-num theirs"><span>{p.askLabel ?? 'Forderung'}</span><b>{p.ask == null ? (p.askUnknown ?? 'offen') : p.fmt(p.ask)}</b></div>
        </div>
        <div className="vt-pos-bar" role="img"
          aria-label={`${p.offerLabel ?? 'Dein Angebot'} ${p.fmt(p.offer)}, ${p.askLabel ?? 'Forderung'} ${p.ask == null ? 'offen' : p.fmt(p.ask)}`}>
          <i className="vt-track" />
          {p.zone && <i className="vt-zone" style={{ left: `${x(p.zone[0])}%`, width: `${Math.max(0.6, x(p.zone[1]) - x(p.zone[0]))}%` }} />}
          {p.ask != null && !met && <i className="vt-gap" style={{ left: `${x(p.offer)}%`, width: `${Math.max(0, x(ask) - x(p.offer))}%` }} />}
          {p.hist.map(([o], i) => <i key={`o${i}`} className="vt-ghost mine" style={{ left: `${x(o)}%` }} />)}
          {rounds > 0 && <i className="vt-ghost theirs" style={{ left: `${x(p.open)}%` }} />}
          {p.hist.slice(0, -1).map(([, a], i) => <i key={`a${i}`} className="vt-ghost theirs" style={{ left: `${x(a)}%` }} />)}
          {p.ask != null && <i className="vt-mark theirs" style={{ left: `${x(ask)}%` }} />}
          <i className="vt-mark mine" style={{ left: `${x(p.offer)}%` }} />
        </div>
        <div className="vt-pos-legend">
          <span className="k mine"><i />{p.offerLabel ?? 'Dein Angebot'}</span>
          <span className="k theirs"><i />{p.askLabel ?? 'Forderung'}</span>
          {p.zone && <span className="k zone"><i />{p.zoneLabel ?? 'Einschätzung deines Stabs'}</span>}
          {p.unit && <span className="vt-pos-unit">{p.unit}</span>}
        </div>
      </div>
      <div className="vt-pos-chart">
        <div className="vt-pos-chart-h">Annäherung<span>{rounds ? `${rounds} ${rounds === 1 ? 'Runde' : 'Runden'}` : 'noch keine Runde'}</span></div>
        <svg viewBox={`0 0 ${CW} ${CH}`} role="img" aria-label="Verlauf der Angebote und Forderungen je Runde">
          {p.zone && <rect className="vt-zone" x={L} y={cy(p.zone[1])} width={CW - L - R} height={Math.max(3, cy(p.zone[0]) - cy(p.zone[1]))} />}
          <line className="vt-axis" x1={L} y1={CH - B} x2={CW - R} y2={CH - B} />
          {askPts.length > 1 && <path className="vt-line theirs" d={path(askPts)} />}
          {offPts.length > 1 && <path className="vt-line mine" d={path(offPts)} />}
          {lastOff && !ended && <path className="vt-line mine draft" d={`M${cx(lastOff[0]).toFixed(1)} ${cy(lastOff[1]).toFixed(1)} L${cx(rounds + 1).toFixed(1)} ${cy(p.offer).toFixed(1)}`} />}
          {askPts.map(([i, v]) => <rect key={`ca${i}`} className="vt-dot theirs" x={cx(i) - 4} y={cy(v) - 4} width="8" height="8" transform={`rotate(45 ${cx(i)} ${cy(v)})`} />)}
          {offPts.map(([i, v]) => <circle key={`co${i}`} className="vt-dot mine" cx={cx(i)} cy={cy(v)} r="4.5" />)}
          {!ended && <circle className="vt-dot mine draft" cx={cx(rounds + 1)} cy={cy(p.offer)} r="5" />}
          <text className="vt-tick" x={cx(0)} y={CH - 8} textAnchor="start">Start</text>
          {Array.from({ length: rounds }, (_, i) => <text key={i} className="vt-tick" x={cx(i + 1)} y={CH - 8} textAnchor="middle">{i + 1}</text>)}
          {!ended && <text className="vt-tick" x={cx(rounds + 1)} y={CH - 8} textAnchor="end">jetzt</text>}
        </svg>
      </div>
    </div>
  );
}
