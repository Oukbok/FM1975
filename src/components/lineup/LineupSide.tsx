// =============================================================================
// Aufstellung, rechte Spalte: Taktik-Kopf (Mentalität, Anweisungen, Kennzahlen)
// sowie Kapitän/Standardschützen und Hinweise.
// =============================================================================
import type { Player, Tactics } from '../../types';
import type { Formation } from '../../data/formations';
import { suitabilityColor } from '../../engine/positions';
import { KV, Meter } from '../../ui/DashPage';
import type { Hint } from './lineupOps';

export const STYLE_DE: Record<string, string> = { defensive: 'Defensiv', balanced: 'Ausgewogen', attacking: 'Offensiv', counter: 'Konter' };
export const STYLE_DESC: Record<string, string> = {
  defensive: 'Sicherheit zuerst: tief stehen, wenig Risiko im Spielaufbau.',
  balanced: 'Gleichgewicht zwischen Angriff und Abwehr.',
  attacking: 'Viele Spieler im Angriff, früher Druck aufs gegnerische Tor.',
  counter: 'Ball erobern und schnell über wenige Stationen umschalten.',
};
export const STYLES = ['defensive', 'balanced', 'attacking', 'counter'] as const;
export const level = (v: number | undefined, lo: string, mid: string, hi: string) => ((v ?? 50) < 35 ? lo : (v ?? 50) > 65 ? hi : mid);

export function TacticHead({ t, formation, set, xiAvg, suitAvg, familiar, xiCount }: {
  t: Tactics; formation: Formation; set: (p: Partial<Tactics>) => void;
  xiAvg: number; suitAvg: number; familiar: number; xiCount: number;
}) {
  return (
    <>
      <div className="lu-mlabel">Mentalität</div>
      <div className="lu-seg" role="group">
        {STYLES.map((s) => (
          <button key={s} className={t.style === s ? 'on' : ''} onClick={() => set({ style: s })}>{STYLE_DE[s]}</button>
        ))}
      </div>
      <div className="dnote lu-desc">{STYLE_DESC[t.style]}</div>
      <div className="lu-instr">
        <KV k="Tempo" v={level(t.tempo, 'bedächtig', 'normal', 'hoch')} />
        <KV k="Pressing" v={level(t.pressing, 'abwartend', 'normal', 'hoch')} />
        <KV k="Abwehrlinie" v={level(t.defensiveLine, 'tief', 'normal', 'hoch')} />
        <KV k="Breite" v={level(t.widthFocus, 'Mitte', 'normal', 'Flügel')} />
        <KV k="Aufbau" v={t.buildup === 'long' ? 'lang' : 'kurz'} />
        <KV k="Zweikampf" v={level(t.tackleHardness, 'fair', 'normal', 'hart')} />
        <KV k="Abseitsfalle" v={t.offsideTrap ? 'an' : 'aus'} />
        <KV k="Libero" v={formation.slots.some((s) => s.position === 'LIB') ? 'ja' : 'nein'} />
      </div>
      <div className="lu-meters">
        <Meter label="Ø Stärke" value={xiAvg} max={99} color="var(--text-2)" />
        <Meter label="Ø Eignung" info="eignung" value={suitAvg} max={99} color={suitabilityColor(suitAvg)} />
        <Meter label="Vertraute Positionen" info="vertrautheit" value={familiar} max={Math.max(1, xiCount)} color="var(--text-2)" text={`${familiar}/${xiCount}`} />
      </div>
      <div className="dnote">Anweisungen: Spieltag › Taktik. Vertraut = Stamm- oder Nebenposition.</div>
    </>
  );
}

type Attr = 'penalties' | 'freeKicks' | 'corners' | 'leadership';
const ROLES: [keyof Tactics & string, string, Attr][] = [
  ['captainId', 'Kapitän', 'leadership'],
  ['penaltyTakerId', 'Elfmeter', 'penalties'],
  ['freeKickTakerId', 'Freistöße', 'freeKicks'],
  ['cornerTakerId', 'Ecken', 'corners'],
];

export function RolesAndHints({ t, xi, hints, set }: { t: Tactics; xi: Player[]; hints: Hint[]; set: (p: Partial<Tactics>) => void }) {
  return (
    <>
      <div className="lu-roles">
        {ROLES.map(([key, label, attr]) => {
          const sorted = [...xi].sort((a, b) => b.attributes[attr] - a.attributes[attr]);
          const v = (t[key] as string | null) ?? '';
          return (
            <label key={key} className="lu-role">
              <span>{label}</span>
              <select value={xi.some((p) => p.id === v) ? v : ''} data-role={key}
                onChange={(e) => set({ [key]: e.target.value || null } as Partial<Tactics>)}>
                <option value="">{key === 'captainId' ? 'keiner' : 'automatisch (Bester)'}</option>
                {sorted.map((p) => <option key={p.id} value={p.id}>{p.lastName} ({Math.round(p.attributes[attr])})</option>)}
              </select>
            </label>
          );
        })}
      </div>
      <div className="lu-mlabel">Hinweise</div>
      <ul className="lu-hints">
        {hints.length ? hints.map((h, i) => <li key={i} className={h.level}>{h.text}</li>)
          : <li className="ok">Keine Auffälligkeiten – die Aufstellung ist spielbereit.</li>}
      </ul>
    </>
  );
}
