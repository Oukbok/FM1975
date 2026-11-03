// Bausteine „Entwicklung“ im Reiter Statistiken: Potenzial, Attribut-Veränderungen, Bewertungen mit Gründen
import { Player, starsToPotential } from '../../types';
import { scoutRange, scoutRangeText } from '../../engine/scouting';
import { utcDate, Section, Line, ATTR_DE, AttrKey } from './shared';
import { useClubProfile } from '../club/ClubLink';
import { hiddenFor } from '../../game/hiddenTraits';

function careerPhase(age: number): { label: string; text: string } {
  if (age <= 20) return { label: 'Talent', text: 'Entwickelt sich noch stark. Spielpraxis und gutes Training zahlen sich jetzt am meisten aus.' };
  if (age <= 24) return { label: 'Aufstieg', text: 'Steigert sich weiter, nähert sich seinem Potenzial.' };
  if (age <= 29) return { label: 'Höhepunkt', text: 'Im besten Fußballeralter – die Werte bleiben weitgehend stabil.' };
  if (age <= 32) return { label: 'Spätphase', text: 'Körperliche Werte beginnen nachzulassen, Erfahrung gleicht vieles aus.' };
  return { label: 'Karriereende naht', text: 'Deutlicher Abbau der Physis. Ein Vertrag sollte gut überlegt sein.' };
}

export function AttributeChanges({ p }: { p: Player }) {
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

/** Letzte Bewertungen mit Begründung (nur eigener Kader, engine/ratingReasons.ts). */
export function RatingHistory({ p }: { p: Player }) {
  const log = (p.development.ratingLog ?? []).slice().reverse();
  if (!log.length) return <div className="pp-note">Die Begründungen erscheinen ab der nächsten Bewertungsrunde (nur dein Kader).</div>;
  return (
    <div className="pp-ratings">
      {log.map((e) => (
        <div key={e.date} className="pp-rating">
          <div className="pp-rating-head">
            <span>{e.label} <span className="dim">· {utcDate(e.date)}</span></span>
            <span>{e.old} → <b>{e.new}</b> <b style={{ color: e.change > 0 ? 'var(--pos)' : e.change < 0 ? 'var(--neg)' : 'var(--text-3)' }}>{e.change > 0 ? `+${e.change}` : e.change < 0 ? `−${-e.change}` : '±0'}</b></span>
          </div>
          <ul className="pp-rating-why">
            {e.reasons.map((x, i) => (
              <li key={x.k + i} className={x.v > 0 ? 'plus' : x.v < 0 ? 'minus' : 'note'}><span>{x.v > 0 ? '+' : x.v < 0 ? '−' : '·'}</span> {x.text}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** Potenzial (Scout-Spanne), Spielraum, letzte Bewertung, Entwicklungstempo, Karrierephase. */
export function PotentialBox({ p }: { p: Player }) {
  const tempo = hiddenFor(useClubProfile()?.game, p, 'tempo');
  // Nur die Scout-Einschätzung ist sichtbar – das wahre Potenzial bleibt verdeckt.
  const [lo, hi] = scoutRange(p);
  const minOvr = starsToPotential(lo), maxOvr = starsToPotential(hi);
  const growth = Math.round((minOvr + maxOvr) / 2) - p.overall;
  const phase = careerPhase(p.age);
  const last = p.development.lastRatingChange;
  return (
    <Section title="Potenzial">
      <div className="pp-stars">{scoutRangeText(p)}</div>
      <div className="pp-growth-track"><div className="pp-growth-fill" style={{ width: `${maxOvr > 0 ? Math.min(100, (p.overall / maxOvr) * 100) : 100}%` }} /></div>
      <div className="pp-list mt8">
        <Line label="Aktuelle Stärke" value={p.overall} strong />
        <Line label="Erreichbare Stärke (geschätzt)" value={minOvr === maxOvr ? `${maxOvr}` : `${minOvr}–${maxOvr}`} />
        <Line label="Spielraum (geschätzt)" value={growth > 0 ? `+${growth}` : '±0'} color={growth > 0 ? 'var(--pos)' : 'var(--text-2)'} />
        <Line label="Letzte Bewertung" value={last > 0 ? `+${last}` : last < 0 ? `${last}` : '±0'} color={last > 0 ? 'var(--pos)' : last < 0 ? 'var(--neg)' : 'var(--text-2)'} />
        <Line label={`Entwicklungstempo (${tempo.source})`} value={tempo.word ? tempo.word[0].toUpperCase() + tempo.word.slice(1) : 'noch kein Urteil'} />
        <Line label="Karrierephase" value={`${phase.label} · ${p.age} Jahre`} />
      </div>
      <div className="pp-note">{phase.text}</div>
    </Section>
  );
}
