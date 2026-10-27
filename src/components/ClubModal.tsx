// =============================================================================
// ClubModal — Vereins-Detailansicht im Football-Manager-Stil
// Öffnet sich beim Klick auf eine fremde Mannschaft (Tabelle/Spielplan).
// Zeigt Profil, Tabellenplatz/Form, Ø-Stärke, Kader, Ergebnisse & Stadion.
// Rein präsentational: erhält vorberechnete Daten (ClubProfileData) aus App.tsx.
// =============================================================================
import { useState, useEffect } from 'react';
import { Player, Club } from '../types';
import ClubCrest from './ClubCrest';
import Icon from './Icon';
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
      <div className="cm-match">
        <span className="cm-match-date dim mini">{CalendarEngine.formatDate(m.date)}</span>
        <span className="cm-match-ha">{m.homeAway === 'H' ? 'H' : 'A'}</span>
        <span className="cm-match-opp">{m.opponent}</span>
        <span className="cm-match-res" style={{ color: col, fontWeight: 700 }}>
          {m.upcoming ? '–:–' : m.score}
        </span>
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal cm-modal" onClick={(e) => e.stopPropagation()}>

        {/* ===================== KOPFBEREICH ===================== */}
        <div className="cm-header" style={{ background: `linear-gradient(120deg, ${data.colors.primary}33, transparent 70%)` }}>
          <div className="cm-head-crest"><ClubCrest club={crestClub} size={64} /></div>
          <div className="cm-head-id">
            <h2 className="cm-head-name">{data.name}{data.isPlayerClub ? ' ★' : ''}</h2>
            <div className="cm-head-sub">
              {data.city}
              {data.founded ? ` · gegründet ${data.founded}` : ''}
              {data.divisionLabel ? ` · ${data.divisionLabel}` : ''}
            </div>
            <div className="cm-head-badges">
              {data.tablePosition != null && (
                <span className="pill">Platz <b style={{ marginLeft: 4 }}>{data.tablePosition}.</b></span>
              )}
              <span className="pill" style={{ color: vColor(data.strength) }}>Ø-Stärke <b style={{ marginLeft: 4 }}>{data.strength}</b></span>
              {data.reputation != null && (
                <span className="pill">Ansehen <b style={{ marginLeft: 4 }}>{data.reputation}</b></span>
              )}
              {data.form && data.form.length > 0 && (
                <span className="cm-form">
                  {data.form.map((f, i) => <span key={i} className={`form-pill ${f}`}>{f}</span>)}
                </span>
              )}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* ===================== HAUPTBEREICH ===================== */}
        <div className="cm-body">
          <div className="cm-cols">

            {/* --- Spalte 1: Profil + Stadion + beste Spieler --- */}
            <div className="cm-col">
              <div className="card">
                <div className="card-title">Vereinsprofil</div>
                <div className="cm-stat-line"><span>Stadt</span><b>{data.city}</b></div>
                {data.founded != null && <div className="cm-stat-line"><span>Gegründet</span><b>{data.founded}</b></div>}
                {data.divisionLabel && <div className="cm-stat-line"><span>Liga</span><b>{data.divisionLabel}</b></div>}
                {data.tablePosition != null && <div className="cm-stat-line"><span>Tabellenplatz</span><b>{data.tablePosition}.</b></div>}
                <div className="cm-stat-line"><span>Ø-Mannschaftsstärke</span><b style={{ color: vColor(data.strength) }}>{data.strength}</b></div>
                {data.reputation != null && <div className="cm-stat-line"><span>Ansehen</span><b>{data.reputation}</b></div>}
              </div>

              {data.stadium && (
                <div className="card">
                  <div className="card-title"><Icon name="stadium" /> Stadion</div>
                  <div className="cm-stat-line"><span>Name</span><b>{data.stadium.name}</b></div>
                  <div className="cm-stat-line"><span>Kapazität</span><b>{fmtNum(data.stadium.capacity)}</b></div>
                </div>
              )}

              {bestPlayers.length > 0 && (
                <div className="card">
                  <div className="card-title">Beste Spieler</div>
                  {bestPlayers.map((p) => (
                    <div key={p.id} className="cm-best clickable" onClick={() => setSelPlayer(p.id)}>
                      <span className="cm-best-name">{p.fullName}</span>
                      <span className="pos-tag">{p.naturalPosition}</span>
                      <b style={{ color: vColor(p.overall), marginLeft: 'auto' }}>{p.overall}</b>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* --- Spalte 2: Kader --- */}
            <div className="cm-col">
              <div className="card">
                <div className="card-title">Kader{data.squad.length > 0 ? ` (${data.squad.length})` : ''}</div>
                {data.squad.length === 0 ? (
                  <p className="dim mini" style={{ margin: 0 }}>Für diesen Verein liegt kein detaillierter Kader vor (rein simulierte Liga).</p>
                ) : (
                  <div className="cm-squad">
                    <div className="cm-squad-row cm-squad-head">
                      <span>#</span><span>Name</span><span>Pos</span><span>Alter</span><span>Stärke</span>
                    </div>
                    {data.squad.map((p) => (
                      <div key={p.id} className="cm-squad-row clickable" onClick={() => setSelPlayer(p.id)} title={POSITION_NAMES_DE[p.naturalPosition]}>
                        <span className="dim">{p.shirtNumber}</span>
                        <span style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.fullName}</span>
                        <span><span className="pos-tag">{p.naturalPosition}</span></span>
                        <span>{p.age}</span>
                        <b style={{ color: vColor(p.overall) }}>{p.overall}</b>
                      </div>
                    ))}
                  </div>
                )}
                {data.squad.length > 0 && <div className="dim2 mini mt12">Klicke einen Spieler für sein Profil.</div>}
              </div>
            </div>

            {/* --- Spalte 3: Ergebnisse + kommende Spiele --- */}
            <div className="cm-col">
              <div className="card">
                <div className="card-title">Letzte Ergebnisse</div>
                {data.lastMatches.length === 0 ? (
                  <p className="dim mini" style={{ margin: 0 }}>Noch keine Spiele absolviert.</p>
                ) : (
                  <div className="cm-matches">{data.lastMatches.map((m, i) => <MatchLine key={i} m={m} />)}</div>
                )}
              </div>
              <div className="card">
                <div className="card-title">Kommende Spiele</div>
                {data.nextMatches.length === 0 ? (
                  <p className="dim mini" style={{ margin: 0 }}>Keine weiteren Spiele terminiert.</p>
                ) : (
                  <div className="cm-matches">{data.nextMatches.map((m, i) => <MatchLine key={i} m={m} />)}</div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Spieler-Detail über dem Vereins-Modal */}
      {player && <PlayerModal player={player} club={data.fullClub} onClose={() => setSelPlayer(null)} />}
    </div>
  );
}
