// Reiter „Entwicklung“: Stärke-Verlauf, Potenzial, Karrierephase
import { Player, renderStars, starsToPotential } from '../../types';
import Icon from '../Icon';
import { utcDate, Section, Line, ATTR_DE, AttrKey } from './shared';

function careerPhase(age: number): { label: string; text: string } {
  if (age <= 20) return { label: 'Talent', text: 'Entwickelt sich noch stark. Spielpraxis und gutes Training zahlen sich jetzt am meisten aus.' };
  if (age <= 24) return { label: 'Aufstieg', text: 'Steigert sich weiter, nähert sich seinem Potenzial.' };
  if (age <= 29) return { label: 'Höhepunkt', text: 'Im besten Fußballeralter – die Werte bleiben weitgehend stabil.' };
  if (age <= 32) return { label: 'Spätphase', text: 'Körperliche Werte beginnen nachzulassen, Erfahrung gleicht vieles aus.' };
  return { label: 'Karriereende naht', text: 'Deutlicher Abbau der Physis. Ein Vertrag sollte gut überlegt sein.' };
}

function HistoryChart({ p }: { p: Player }) {
  const pts = p.development.abilityHistory.slice(-24);
  if (pts.length < 2) return <div className="pp-empty">Noch kein Verlauf – die Stärke wird bei jeder Bewertung festgehalten.</div>;
  const W = 520, H = 190, pad = 28;
  const vals = pts.map((h) => h.ability);
  const min = Math.max(0, Math.min(...vals) - 5), max = Math.min(100, Math.max(...vals) + 5);
  const x = (i: number) => pad + (i * (W - 2 * pad)) / (pts.length - 1);
  const y = (v: number) => H - pad - ((v - min) / Math.max(1, max - min)) * (H - 2 * pad);
  const path = pts.map((h, i) => `${i ? 'L' : 'M'}${x(i)},${y(h.ability)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="pp-chart">
      {[min, (min + max) / 2, max].map((v) => (
        <g key={v}>
          <line x1={pad} x2={W - pad} y1={y(v)} y2={y(v)} stroke="var(--border-soft)" />
          <text x={4} y={y(v) + 4} className="pp-chart-axis">{Math.round(v)}</text>
        </g>
      ))}
      <path d={`${path} L${x(pts.length - 1)},${H - pad} L${x(0)},${H - pad} Z`} fill="rgba(0,217,255,0.12)" />
      <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2.5" />
      {pts.map((h, i) => <circle key={i} cx={x(i)} cy={y(h.ability)} r="3" fill="var(--accent)" />)}
      <text x={pad} y={H - 6} className="pp-chart-axis">{utcDate(pts[0].date)}</text>
      <text x={W - pad} y={H - 6} textAnchor="end" className="pp-chart-axis">{utcDate(pts[pts.length - 1].date)}</text>
    </svg>
  );
}

function AttributeChanges({ p }: { p: Player }) {
  const snaps = p.history?.attributeSnapshots ?? [];
  if (snaps.length === 0) return <div className="pp-note">Der Verlauf startet mit der nächsten Bewertung.</div>;
  const first = snaps[0];
  const changes = (Object.keys(ATTR_DE) as AttrKey[])
    .filter((k) => k !== 'fitness' && typeof first.attributes[k] === 'number')
    .map((k) => ({ k, from: first.attributes[k] as number, to: Math.round(p.attributes[k]) }))
    .filter((c) => c.to !== c.from)
    .sort((a, b) => Math.abs(b.to - b.from) - Math.abs(a.to - a.from))
    .slice(0, 12);
  return (
    <>
      <div className="pp-note" style={{ marginTop: 0 }}>Seit „{first.label}“ ({utcDate(first.date)})</div>
      {changes.length === 0 ? <div className="pp-note">Noch keine Veränderung.</div> : (
        <div className="pp-changes">
          {changes.map((c) => (
            <div key={c.k} className="pp-change">
              <span className="pp-line-lbl">{ATTR_DE[c.k]}</span>
              <span>{c.from} → <b>{c.to}</b> <b style={{ color: c.to > c.from ? 'var(--green)' : 'var(--red)' }}>{c.to > c.from ? '+' : ''}{c.to - c.from}</b></span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default function DevelopmentTab({ p }: { p: Player }) {
  const maxOvr = starsToPotential(p.potentialStars);
  const growth = maxOvr - p.overall;
  const phase = careerPhase(p.age);
  const d = p.development;
  const last = d.lastRatingChange;
  return (
    <div className="pp-grid pp-grid-dev">
      <div className="pp-stack">
        <Section title="Stärke-Verlauf" icon={<Icon name="stats" size={15} />}>
          <HistoryChart p={p} />
        </Section>
        <Section title="Attribut-Veränderungen" icon={<Icon name="training" size={15} />}>
          <AttributeChanges p={p} />
        </Section>
      </div>
      <div className="pp-stack">
        <Section title="Potenzial" icon={<Icon name="youth" size={15} />}>
          <div className="pp-stars">{renderStars(p.potentialStars)}</div>
          <div className="pp-growth-track"><div className="pp-growth-fill" style={{ width: `${maxOvr > 0 ? Math.min(100, (p.overall / maxOvr) * 100) : 100}%` }} /></div>
          <div className="pp-list mt8">
            <Line label="Aktuelle Stärke" value={p.overall} strong />
            <Line label="Erreichbare Stärke" value={maxOvr} color="var(--accent)" />
            <Line label="Spielraum" value={growth > 0 ? `+${growth}` : '±0'} color={growth > 0 ? 'var(--green)' : 'var(--text-2)'} />
            <Line label="Letzte Bewertung" value={last > 0 ? `+${last}` : last < 0 ? `${last}` : '±0'} color={last > 0 ? 'var(--green)' : last < 0 ? 'var(--red)' : 'var(--text-2)'} />
            <Line label="Entwicklungstempo" value={d.growthRate >= 1.15 ? 'Schnell' : d.growthRate <= 0.85 ? 'Langsam' : 'Normal'} />
          </div>
        </Section>
        <Section title="Karrierephase" icon={<Icon name="chronicle" size={15} />}>
          <div className="pp-phase">{phase.label} <span className="dim">· {p.age} Jahre</span></div>
          <div className="pp-note">{phase.text}</div>
        </Section>
      </div>
    </div>
  );
}
