// =============================================================================
// Vorschau „Nächstes Spiel“ – Fakten (Stärke, Saison, Form, Hinspiel) und historische
// Daten (direkter Vergleich der letzten zehn Ligasaisons, zweispaltig).
// Werte monochrom; Grün/Rot nur für Sieg/Niederlage in der Formkurve.
// =============================================================================
import type { H2HRow, PrematchData, PrematchSide } from '../../game/prematch';
import { InfoTip } from '../../ui/InfoTip';

const FORM_DE = { W: 'S', D: 'U', L: 'N' } as const;
const FORM_TIP = { W: 'Sieg', D: 'Unentschieden', L: 'Niederlage' } as const;

function Split({ l, r }: { l: number; r: number }) {
  const sum = Math.max(0.0001, l + r);
  const lp = (l / sum) * 100;
  return (
    <div className="pm-split" aria-hidden>
      <span className={`pm-split-l ${l >= r ? 'hi' : ''}`} style={{ width: `${lp}%` }} />
      <span className={`pm-split-r ${r >= l ? 'hi' : ''}`} style={{ width: `${100 - lp}%` }} />
    </div>
  );
}

function Rank({ s }: { s: PrematchSide }) {
  return s.strengthRank ? <span className="pm-rank" title={`Rang ${s.strengthRank} von ${s.strengthOf} in der Liga`}>{s.strengthRank}</span> : <span className="pm-rank empty" />;
}

function Form({ s, right }: { s: PrematchSide; right?: boolean }) {
  if (!s.form.length) return <span className="pm-dim">–</span>;
  const f = right ? [...s.form].reverse() : s.form;
  return (
    <span className="pm-form">
      {f.map((x, i) => <span key={i} className={`pm-form-x ${x}`} title={FORM_TIP[x]}>{FORM_DE[x]}</span>)}
    </span>
  );
}

const seasonTxt = (s: PrematchSide) => s.season ? `${s.season.won}-${s.season.drawn}-${s.season.lost} · ${s.season.points} Pkt.` : '–';
const ppg = (s: PrematchSide) => (s.season && s.season.played ? s.season.points / s.season.played : 0);
const formPts = (s: PrematchSide) => s.form.reduce((a, x) => a + (x === 'W' ? 3 : x === 'D' ? 1 : 0), 0);

export function PrematchFacts({ d }: { d: PrematchData }) {
  const { home: h, away: a } = d;
  return (
    <section className="pm-sec pm-facts">
      <h3 className="pm-h">Fakten</h3>
      <div className="pm-frow">
        <span className="pm-fl"><Rank s={h} /><b>{h.strength.toFixed(1)}</b></span>
        <span className="pm-fc">Mannschaftsstärke <InfoTip k="prematch_staerke" /></span>
        <span className="pm-fr"><b>{a.strength.toFixed(1)}</b><Rank s={a} /></span>
        <Split l={Math.max(0, h.strength - 30)} r={Math.max(0, a.strength - 30)} />
      </div>
      <div className="pm-frow">
        <span className="pm-fl">{seasonTxt(h)}</span>
        <span className="pm-fc">Saison bisher</span>
        <span className="pm-fr">{seasonTxt(a)}</span>
        {h.season && a.season && <Split l={ppg(h) + 0.2} r={ppg(a) + 0.2} />}
      </div>
      <div className="pm-frow">
        <span className="pm-fl"><Form s={h} /></span>
        <span className="pm-fc">Form</span>
        <span className="pm-fr"><Form s={a} right /></span>
        {h.form.length > 0 && a.form.length > 0 && <Split l={formPts(h) + 1} r={formPts(a) + 1} />}
      </div>
      {d.firstLeg && (
        <div className="pm-leg"><span className="pm-leg-l">{d.firstLeg.label}</span><span className="pm-leg-t">{d.firstLeg.text}</span></div>
      )}
    </section>
  );
}

function H2HTable({ rows, hLabel, aLabel }: { rows: H2HRow[]; hLabel: string; aLabel: string }) {
  return (
    <table className="pm-h2h">
      <thead><tr><th>Saison</th><th title={`Spiel bei ${hLabel}`}>H</th><th title={`Spiel bei ${aLabel}`}>A</th></tr></thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.season}><td>{r.season}</td><td className={r.h ? '' : 'pm-dim'}>{r.h ?? '–'}</td><td className={r.a ? '' : 'pm-dim'}>{r.a ?? '–'}</td></tr>
        ))}
      </tbody>
    </table>
  );
}

export function PrematchHistory({ d }: { d: PrematchData }) {
  const any = d.h2h.some((r) => r.h || r.a);
  return (
    <section className="pm-sec pm-hist">
      <h3 className="pm-h">Historische Daten <span className="pm-h-note">{d.h2hScope} · H = bei {d.home.short}, A = bei {d.away.short}</span></h3>
      <div className="pm-h2h-wrap">
        <H2HTable rows={d.h2h.slice(0, 5)} hLabel={d.home.name} aLabel={d.away.name} />
        <H2HTable rows={d.h2h.slice(5, 10)} hLabel={d.home.name} aLabel={d.away.name} />
      </div>
      {!any && <p className="pm-dim pm-h2h-none">Keine solchen Spiele zwischen beiden Vereinen in diesem Zeitraum (erfasst ab Spielbeginn).</p>}
    </section>
  );
}
