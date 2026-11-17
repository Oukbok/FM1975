// =============================================================================
// Aufstellung, rechte Spalte: Taktik-Zusammenfassung (Mentalität, Anweisungen, Kennzahlen –
// nur Anzeige, Wunsch Pascal: geändert wird ausschließlich auf der Taktik-Seite, Knopf „Taktik ändern“)
// sowie Kapitän/Standardschützen (Reihenfolgen, lineup/TakerOrders.tsx) und Hinweise.
// =============================================================================
import type { Player, Tactics } from '../../types';
import type { Formation } from '../../data/formations';
import { suitabilityColor } from '../../engine/positions';
import { KV, Meter } from '../../ui/DashPage';
import type { Hint } from './lineupOps';
import { TakerGrid } from './TakerOrders';
import { instrLabel, type InstrKey } from '../tactics/instructions';

export const STYLE_DE: Record<string, string> = { defensive: 'Defensiv', balanced: 'Ausgewogen', attacking: 'Offensiv', counter: 'Konter' };
export const STYLE_DESC: Record<string, string> = {
  defensive: 'Sicherheit zuerst: tief stehen, wenig Risiko im Spielaufbau.',
  balanced: 'Gleichgewicht zwischen Angriff und Abwehr.',
  attacking: 'Viele Spieler im Angriff, früher Druck aufs gegnerische Tor.',
  counter: 'Ball erobern und schnell über wenige Stationen umschalten.',
};
export const STYLES = ['defensive', 'balanced', 'attacking', 'counter'] as const;

export function TacticHead({ t, xiAvg, suitAvg, familiar, xiCount, year, cohesion, onEdit }: {
  t: Tactics; formation: Formation;
  /** Sprung zur Taktik-Seite. */
  onEdit?: () => void;
  xiAvg: number; suitAvg: number; familiar: number; xiCount: number;
  /** Saison-Startjahr (Stufen/Grenzen der Anweisungen) und Eingespieltheit 0–100 (engine/cohesion.ts). */
  year: number; cohesion?: number;
}) {
  const L = (k: InstrKey) => instrLabel(k, t, year);
  return (
    <>
      <div className="lu-tsum">
        <div><span className="lu-mlabel">Mentalität</span><b>{STYLE_DE[t.style]}</b></div>
        {onEdit && <button type="button" className="b3 b3-s" data-act="edit-tactics" onClick={onEdit}>Taktik ändern</button>}
      </div>
      <div className="dnote lu-desc">{STYLE_DESC[t.style]}</div>
      <div className="lu-instr">
        <KV k="Einsatz" v={L('effort')} />
        <KV k="Flanken" v={L('cross')} />
        <KV k="Aufbau" v={L('buildup')} />
        <KV k="Tempo" v={L('tempo')} />
        <KV k="Breite" v={L('width')} />
        <KV k="Deckung" v={L('marking')} />
        <KV k="Pressing" v={L('pressing')} />
        <KV k="Abwehrlinie" v={L('line')} />
        <KV k="Zweikampf" v={L('hard')} />
        <KV k="Abseitsfalle" v={L('trap')} />
      </div>
      <div className="lu-meters">
        <Meter label="Ø Stärke" value={xiAvg} max={99} color="var(--text-2)" />
        <Meter label="Ø Eignung" info="eignung" value={suitAvg} max={99} color={suitabilityColor(suitAvg)} />
        <Meter label="Vertraute Positionen" info="vertrautheit" value={familiar} max={Math.max(1, xiCount)} color="var(--text-2)" text={`${familiar}/${xiCount}`} />
        {cohesion != null && <Meter label="Eingespielt" info="eingespieltheit" value={cohesion} max={100} color={cohesion >= 80 ? 'var(--pos)' : cohesion >= 60 ? 'var(--yellow)' : 'var(--neg)'} />}
      </div>
    </>
  );
}

export function RolesAndHints({ t, xi, squad, hints, set }: { t: Tactics; xi: Player[]; squad: Player[]; hints: Hint[]; set: (p: Partial<Tactics>) => void }) {
  return (
    <>
      <TakerGrid t={t} xi={xi} squad={squad} set={set} />
      <div className="lu-mlabel">Hinweise</div>
      <ul className="lu-hints">
        {hints.length ? hints.map((h, i) => <li key={i} className={h.level}>{h.text}</li>)
          : <li className="ok">Keine Auffälligkeiten – die Aufstellung ist spielbereit.</li>}
      </ul>
    </>
  );
}
