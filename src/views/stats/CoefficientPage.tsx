// =============================================================================
// Statistiken › Ligensystem › Fünfjahreswertung (Wunsch Pascal: sehen, wer wie viele
// Teilnehmer für welchen Europapokal stellt). Links die Wertung aller Länder – Rang, Punkte
// der letzten fünf Saisons, Summe und Startplätze der Folgesaison je Wettbewerb, dein Land
// hervorgehoben –, rechts die Staffel „Startplätze nach Rang“ und die Regeln. Nur echte Daten
// des Spiels: game/coefficients.ts (liest engine/worldEuro.ts + data/euroFormats.ts).
// =============================================================================
import { useMemo } from 'react';
import { CountryFlag } from '../../components/competition/CountryFlag';
import { accessSlots } from '../../data/euroFormats';
import { seasonStartYear } from '../../data/timeline';
import { coefTable, fmtCoef, type CoefComp } from '../../game/coefficients';
import type { Game } from '../../game/state';
import { DashBox, DashPage, Empty } from '../../ui/DashPage';

/** Ränge mit gleichen Startplätzen zusammenfassen: „1.–3.“ → Plätze. */
function slotBands(next: number, n: number, comps: CoefComp[]): { from: number; to: number; slots: Record<CoefComp, number> }[] {
  const out: { from: number; to: number; slots: Record<CoefComp, number> }[] = [];
  for (let r = 1; r <= n; r++) {
    const s = accessSlots(next, r);
    const slots = { ec: s.ec, cwc: s.cwc, uefa: s.uefa };
    const last = out[out.length - 1];
    if (last && comps.every((c) => last.slots[c] === slots[c])) last.to = r;
    else out.push({ from: r, to: r, slots });
  }
  return out;
}

export function CoefficientPage({ g }: { g: Game }) {
  const t = useMemo(() => coefTable(g), [g, g.season]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!t) return <DashPage><DashBox title="Fünfjahreswertung" info="fuenfjahreswertung" span={3} rows={2}><Empty icon="international">Dieser Spielstand hat keine Hintergrund-Welt – keine Fünfjahreswertung.</Empty></DashBox></DashPage>;
  const comps = t.comps.map((c) => c.id);
  const bands = slotBands(seasonStartYear(t.next), t.rows.length, comps);
  const grid = { gridTemplateColumns: `52px minmax(0, 1fr) repeat(${t.seasons.length}, 66px) 78px repeat(${t.comps.length}, 112px)` };
  const own = t.rows.find((r) => r.home);
  return (
    <DashPage>
      <DashBox title="Fünfjahreswertung" info="fuenfjahreswertung" span={2} rows={2} flush className="cf-box" right={`Stand nach ${t.seasons[t.seasons.length - 1]} · Startplätze ${t.next}`}>
        <div className="cf-wrap">
          <div className="cf-row cf-head" style={grid}>
            <span className="cf-rank">Rang</span>
            <span>Land</span>
            {t.seasons.map((s) => <span key={s} className="cf-num">{s}</span>)}
            <span className="cf-num cf-sum">Punkte</span>
            {t.comps.map((c) => <span key={c.id} className="cf-num cf-comp" title={`Startplätze ${c.name} ${t.next}`}>{c.name}</span>)}
          </div>
          <div className="cf-list">
            {t.rows.map((r) => (
              <div key={r.key} className={`cf-row ${r.home ? 'me' : ''}`} style={grid} data-country={r.key}>
                <span className="cf-rank">{r.rank}.</span>
                <span className="cf-land"><CountryFlag country={r.key} height={14} /><span>{r.name}</span>{r.home && <em>Dein Land</em>}</span>
                {r.seasons.map((v, i) => <span key={i} className="cf-num cf-season">{fmtCoef(v)}</span>)}
                <span className="cf-num cf-sum">{fmtCoef(r.total)}</span>
                {t.comps.map((c) => <span key={c.id} className={`cf-num cf-slot ${r.slots[c.id] ? '' : 'none'}`}>{r.slots[c.id] || '–'}</span>)}
              </div>
            ))}
          </div>
          <div className="cf-foot">Punkte je Saison = Durchschnitt aller Starter des Landes: 1 je Teilnahme, 2 je gewonnene Runde und für den Titel, in Gruppen 1 je Sieg und ½ je Remis. Gewertet wird die Summe der letzten fünf Saisons.</div>
        </div>
      </DashBox>
      <DashBox title="Startplätze nach Rang" rows={2} className="cf-side" right={t.next}>
        {own && <div className="cf-own">
          <CountryFlag country={own.key} height={18} />
          <div><b>{own.name}: {own.rank}. Platz</b><span>{fmtCoef(own.total)} Punkte · {t.comps.map((c) => `${own.slots[c.id]} ${c.name}`).join(' · ')}</span></div>
        </div>}
        <div className="cf-band cf-band-head" style={{ gridTemplateColumns: `76px repeat(${t.comps.length}, minmax(0, 1fr))` }}>
          <span>Rang</span>{t.comps.map((c) => <span key={c.id}>{c.name}</span>)}
        </div>
        {bands.map((b) => (
          <div key={b.from} className={`cf-band ${own && own.rank >= b.from && own.rank <= b.to ? 'me' : ''}`} style={{ gridTemplateColumns: `76px repeat(${t.comps.length}, minmax(0, 1fr))` }}>
            <span>{b.from === b.to ? `${b.from}.` : `${b.from}.–${b.to}.`}</span>
            {comps.map((c) => <b key={c}>{b.slots[c]}</b>)}
          </div>
        ))}
        <div className="dsec">So gilt es</div>
        <ul className="cf-rules">
          {own && own.seasons.every((v) => v == null) && <li>Noch keine Saison gewertet: bis zur ersten Wertung führt das Spiel dein Land auf Rang 2.</li>}
          <li>Die Startplätze der Saison {t.next} hängen am Rang in dieser Wertung.</li>
          <li>Dein Land: Rang und Plätze stehen fest – so rechnet der Saisonwechsel.</li>
          <li>Andere Länder: beim Saisonwechsel kommt die laufende Saison hinzu, die älteste fällt heraus; danach wird neu gereiht.</li>
          <li>Einer der Plätze im Wettbewerb „{t.comps.find((c) => c.id === t.cupTo)?.name}“ geht an den Landespokalsieger.</li>
        </ul>
      </DashBox>
    </DashPage>
  );
}
