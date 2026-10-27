// =============================================================================
// ClubModal — Vereins-Detailansicht im Football-Manager-Stil
// Öffnet sich beim Klick auf eine fremde Mannschaft (Tabelle/Spielplan).
// Zeigt Profil, Tabellenplatz/Form, Ø-Stärke, Kader, Ergebnisse & Stadion.
// Rein präsentational: erhält vorberechnete Daten (ClubProfileData) aus App.tsx.
// =============================================================================
import { useState, useEffect } from 'react';
import { Player, Club, POSITION_GROUPS } from '../types';
import ClubCrest from './ClubCrest';
import { DashBox, Empty, KV, Kpi } from '../ui/DashPage';
import { fmtDM } from '../ui/format';
import { scoutRangeText } from '../engine/scouting';
import PlayerModal from './PlayerModal';
import { CalendarEngine } from '../engine/calendar';
import { POSITION_NAMES_DE } from '../engine/positions';

// Ein Spiel dieses Vereins (Ergebnis oder kommende Begegnung), aus Vereinssicht.
export interface ClubMatchLine {
  date: string;
  opponent: string;
  homeAway: 'H' | 'A';
  /** Ergebnis-String aus Vereinssicht (z. B. „2:1"), null wenn noch nicht gespielt. */
  score: string | null;
  /** true = gewonnen, false = verloren, null = unentschieden, undefined = ausstehend. */
  won: boolean | null | undefined;
  upcoming: boolean;
}

// Vollständig vorberechnete Anzeigedaten eines Vereins.
export interface ClubProfileData {
  clubId: string;
  name: string;
  shortName: string;
  colors: { primary: string; secondary: string };
  city: string;
  founded?: number;
  reputation?: number;
  stadium?: { name: string; capacity: number };
  /** Durchschnittliche Mannschaftsstärke (Ø Spielerstärke bzw. Sim-Stärke). */
  strength: number;
  divisionLabel?: string;
  tablePosition?: number;
  form?: ('W' | 'D' | 'L')[];
  isPlayerClub: boolean;
  /** Voller Vereinsdatensatz (nur bei Nicht-Sim-Vereinen) — für PlayerModal & Kader. */
  fullClub?: Club;
  /** Kader, absteigend nach Stärke sortiert (leer bei reinen Sim-Vereinen). */
  squad: Player[];
  /** Letzte Ergebnisse (neueste zuerst). */
  lastMatches: ClubMatchLine[];
  /** Kommende Spiele (nächste zuerst). */
  nextMatches: ClubMatchLine[];
}

const fmtNum = (n: number) => n.toLocaleString('de-DE');
function vColor(v: number): string {
  if (v >= 75) return 'var(--green)';
  if (v >= 60) return 'var(--yellow)';
  if (v >= 45) return 'var(--orange)';
  return 'var(--red)';
}

export default function ClubModal({ data, onClose }: { data: ClubProfileData; onClose: () => void }) {
  const [selPlayer, setSelPlayer] = useState<string | null>(null);

  // Escape schließt das Modal.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const crestClub = (data.fullClub ?? { colors: data.colors, shortName: data.shortName }) as Club;
  const player = selPlayer ? data.squad.find((p) => p.id === selPlayer) ?? null : null;

  // Beste Spieler (Top 3 nach Stärke) — nur bei vollem Kader.
  const bestPlayers = data.squad.slice(0, 3);

  const MatchLine = ({ m }: { m: ClubMatchLine }) => {
    const col = m.upcoming ? 'var(--text-2)'
      : m.won === true ? 'var(--green)'
      : m.won === false ? 'var(--red)'
      : 'var(--yellow)';
    return (
      <div className="dlist-row">
        <span className="meta" style={{ minWidth: 140 }}>{CalendarEngine.formatDate(m.date)}</span>
        <span className="grow">{m.opponent} <span className="muted">({m.homeAway})</span></span>
        <span className="val" style={{ color: col }}>{m.upcoming ? '–:–' : m.score}</span>
      </div>
    );
  };

  const GROUPS: [string, string][] = [['GK', 'Torwart'], ['DEF', 'Abwehr'], ['MID', 'Mittelfeld'], ['ATT', 'Angriff']];
  const avgOf = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);
  const squadValue = data.squad.reduce((sum, p) => sum + p.contract.transferValue, 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mx-head" style={{ background: `linear-gradient(120deg, ${data.colors.primary}33, transparent 70%)` }}>
          <ClubCrest club={crestClub} size={72} />
          <div>
            <div className="mx-sub">{data.city}{data.founded ? ` · gegründet ${data.founded}` : ''}{data.divisionLabel ? ` · ${data.divisionLabel}` : ''}</div>
            <h2>{data.name}{data.isPlayerClub ? ' (dein Verein)' : ''}</h2>
          </div>
          <div className="mx-kpis">
            {data.tablePosition != null && <Kpi value={`${data.tablePosition}.`} label="Platz" />}
            <Kpi value={data.strength} label="Ø Stärke" color={vColor(data.strength)} />
            {data.reputation != null && <Kpi value={data.reputation} label="Ansehen" />}
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="mx-body mx-grid">
          <DashBox title="Vereinsprofil" icon="dashVerein">
            <KV k="Stadt" v={data.city} />
            {data.founded != null && <KV k="Gegründet" v={data.founded} />}
            {data.divisionLabel && <KV k="Liga" v={data.divisionLabel} />}
            {data.form && data.form.length > 0 && <KV k="Form" v={<span className="dform">{data.form.slice(-5).map((f, i) => <i key={i} className={`dform-${f}`}>{f === 'W' ? 'S' : f === 'D' ? 'U' : 'N'}</i>)}</span>} />}
            {data.stadium && <>
              <div className="dsec">Stadion</div>
              <KV k="Name" v={data.stadium.name} />
              <KV k="Kapazität" v={fmtNum(data.stadium.capacity)} />
            </>}
          </DashBox>

          <DashBox title={`Kader${data.squad.length ? ` (${data.squad.length})` : ''}`} icon="squad" rows={2} flush>
            {data.squad.length === 0 ? <Empty icon="squad">Für diesen Verein liegt kein detaillierter Kader vor (rein simulierte Liga).</Empty> : (
              <table className="dtable">
                <thead><tr><th className="ctr">#</th><th>Name</th><th className="ctr">Pos</th><th className="num">Alter</th><th className="num">Stärke</th><th>Potenzial</th></tr></thead>
                <tbody>
                  {data.squad.map((p) => (
                    <tr key={p.id} className="clickable" onClick={() => setSelPlayer(p.id)} title={POSITION_NAMES_DE[p.naturalPosition]}>
                      <td className="ctr muted">{p.shirtNumber}</td>
                      <td className="nowrap" style={{ fontWeight: 700 }}>{p.fullName}</td>
                      <td className="ctr"><span className="pos-badge">{p.naturalPosition}</span></td>
                      <td className="num">{p.age}</td>
                      <td className="num"><b style={{ color: vColor(p.overall) }}>{p.overall}</b></td>
                      <td className="nowrap"><span className="dscout">{scoutRangeText(p)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </DashBox>

          <DashBox title="Letzte Ergebnisse" icon="stats">
            {data.lastMatches.length ? data.lastMatches.map((m, i) => <MatchLine key={i} m={m} />) : <Empty icon="stats">Noch keine Spiele absolviert.</Empty>}
          </DashBox>

          <DashBox title="Kaderstruktur" icon="dashKader">
            {data.squad.length ? <>
              <KV k="Ø Alter" v={(data.squad.reduce((a, p) => a + p.age, 0) / data.squad.length).toFixed(1)} />
              <KV k="Kaderwert" v={fmtDM(squadValue)} />
              {GROUPS.map(([k, label]) => {
                const xs = data.squad.filter((p) => POSITION_GROUPS[p.naturalPosition] === k);
                return <KV key={k} k={`${label} (${xs.length})`} v={xs.length ? `Ø ${avgOf(xs.map((p) => p.overall))}` : '–'} />;
              })}
              <div className="dsec">Beste Spieler</div>
              {bestPlayers.map((p) => (
                <div key={p.id} className="dlist-row clickable" onClick={() => setSelPlayer(p.id)}>
                  <span className="pos-badge">{p.naturalPosition}</span><span className="grow">{p.fullName}</span>
                  <span className="val" style={{ color: vColor(p.overall) }}>{p.overall}</span>
                </div>
              ))}
            </> : <div className="dnote">Keine Kaderdaten.</div>}
          </DashBox>

          <DashBox title="Kommende Spiele" icon="schedule">
            {data.nextMatches.length ? data.nextMatches.map((m, i) => <MatchLine key={i} m={m} />) : <Empty icon="schedule">Keine weiteren Spiele terminiert.</Empty>}
          </DashBox>
        </div>
      </div>

      {/* Spieler-Detail über dem Vereins-Modal */}
      {player && <PlayerModal player={player} club={data.fullClub} onClose={() => setSelPlayer(null)} />}
    </div>
  );
}
