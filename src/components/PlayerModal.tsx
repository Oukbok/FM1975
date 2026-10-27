// =============================================================================
// PlayerModal — Große Spieler-Detailansicht im Football-Manager-Stil
// Dreispaltiges Layout: FÄHIGKEITEN | Positions-Feld + ALLGEMEIN | LIGABILANZ/VERTRAG
// =============================================================================
import { useState } from 'react';
import { Player, Club, PlayerAttributes, Position, PlayerMorale, PlayerAvailability, renderStars, starsToPotential } from '../types';
import PlayerAvatar from './PlayerAvatar';
import ClubCrest from './ClubCrest';
import Icon from './Icon';
import { POSITION_NAMES_DE } from '../engine/positions';

const fmtDM = (n: number) => `${Math.round(n / 1000).toLocaleString('de-DE')} Tsd. DM`;

// Farbklasse/-farbe nach Wert (Grün >75, Gelb 60–75, Orange 45–59, Rot <45)
function vClass(v: number): string {
  if (v >= 75) return 'v-hi';
  if (v >= 60) return 'v-mid';
  if (v >= 45) return 'v-lo';
  return 'v-vlo';
}
function vColor(v: number): string {
  if (v >= 75) return 'var(--green)';
  if (v >= 60) return 'var(--yellow)';
  if (v >= 45) return 'var(--orange)';
  return 'var(--red)';
}

const POS_DE: Record<string, string> = {
  TW: 'Torwart', LIB: 'Libero', VS: 'Vorstopper', AV: 'Außenverteidiger',
  DM: 'Defensives Mittelfeld', ZM: 'Zentrales Mittelfeld', OM: 'Offensives Mittelfeld',
  FL: 'Flügel', MS: 'Mittelstürmer', HS: 'Hängende Spitze',
};

const ATTR_DE: Record<keyof PlayerAttributes, string> = {
  fitness: 'Fitness', stamina: 'Ausdauer', speed: 'Schnelligkeit', acceleration: 'Antritt',
  strength: 'Robustheit', jumping: 'Sprungkraft', agility: 'Beweglichkeit', balance: 'Balance',
  technique: 'Technik', firstTouch: 'Ballannahme', shooting: 'Torriecher', shotPower: 'Schusskraft',
  longShots: 'Fernschüsse', passing: 'Passspiel', longPassing: 'Lange Pässe', crossing: 'Flanken',
  dribbling: 'Dribbling', ballControl: 'Ballkontrolle', heading: 'Kopfball', tackling: 'Tackling',
  marking: 'Manndeckung', positioning: 'Stellungsspiel', interceptions: 'Abfangen', experience: 'Erfahrung',
  vision: 'Kreativität', composure: 'Ruhe', concentration: 'Konzentration', decisions: 'Entscheidungen',
  leadership: 'Führungsqualitäten', workRate: 'Lauffreudigkeit', aggression: 'Aggressivität', teamwork: 'Teamwork',
  flair: 'Genius', reflexes: 'Reflexe', handling: 'Fangsicherheit', kicking: 'Abschlag',
  aerialReach: 'Strafraumbeherrschung', oneOnOnes: 'Eins-gegen-Eins', communication: 'Kommunikation',
  penalties: 'Elfmeter', freeKicks: 'Freistöße', corners: 'Ecken',
};

const MORALE_DE: Record<PlayerMorale, string> = {
  very_low: 'Sehr niedrig', low: 'Niedrig', okay: 'Neutral', good: 'Gut', excellent: 'Ausgezeichnet',
};
const MORALE_VAL: Record<PlayerMorale, number> = {
  very_low: 20, low: 40, okay: 55, good: 75, excellent: 92,
};
const AVAIL_DE: Record<PlayerAvailability, string> = {
  available: 'Einsatzfähig', injured: 'Verletzt', suspended: 'Gesperrt', ill: 'Krank', international: 'Abgestellt',
};

// FÄHIGKEITEN-Gruppen (nach FM-Kategorien; nur real existierende Attribute)
const SKILL_GROUPS: { title: string; keys: (keyof PlayerAttributes)[] }[] = [
  { title: 'Technik', keys: ['shotPower', 'longShots', 'dribbling', 'technique', 'crossing', 'flair', 'shooting', 'passing', 'longPassing', 'tackling', 'marking', 'heading', 'ballControl', 'firstTouch'] },
  { title: 'Standardsituationen', keys: ['freeKicks', 'corners', 'penalties'] },
  { title: 'Geistig', keys: ['positioning', 'aggression', 'composure', 'concentration', 'decisions', 'teamwork', 'experience', 'leadership', 'vision'] },
  { title: 'Verfassung', keys: ['acceleration', 'speed', 'workRate', 'strength', 'agility', 'jumping', 'stamina', 'balance'] },
];
const GK_SKILLS: { title: string; keys: (keyof PlayerAttributes)[] } =
  { title: 'Torwart', keys: ['reflexes', 'handling', 'kicking', 'aerialReach', 'oneOnOnes', 'communication'] };

// Detail-Tab: kompakte Attribut-Gruppen inkl. Balken
const ATTR_GROUPS: { title: string; keys: (keyof PlayerAttributes)[] }[] = [
  { title: 'Technisch', keys: ['technique', 'firstTouch', 'shooting', 'shotPower', 'longShots', 'passing', 'longPassing', 'crossing', 'dribbling', 'ballControl', 'heading'] },
  { title: 'Defensiv', keys: ['tackling', 'marking', 'positioning', 'interceptions'] },
  { title: 'Physisch', keys: ['stamina', 'speed', 'acceleration', 'strength', 'jumping', 'agility', 'balance'] },
  { title: 'Mental', keys: ['vision', 'composure', 'concentration', 'decisions', 'leadership', 'workRate', 'aggression', 'teamwork', 'flair', 'experience'] },
  { title: 'Standards', keys: ['penalties', 'freeKicks', 'corners'] },
];
const GK_GROUP: { title: string; keys: (keyof PlayerAttributes)[] } =
  { title: 'Torwart', keys: ['reflexes', 'handling', 'kicking', 'aerialReach', 'oneOnOnes', 'communication'] };

// Feld-Koordinaten je Position (x/y in %, y klein = Angriff oben)
const PITCH_POS: Record<Position, { x: number; y: number }> = {
  TW: { x: 50, y: 90 }, LIB: { x: 50, y: 76 }, VS: { x: 37, y: 72 }, AV: { x: 16, y: 66 },
  DM: { x: 50, y: 58 }, ZM: { x: 35, y: 48 }, OM: { x: 50, y: 36 }, FL: { x: 17, y: 30 },
  MS: { x: 50, y: 14 }, HS: { x: 62, y: 24 },
};

// -----------------------------------------------------------------------------
// Spielertyp aus Naturposition ableiten (rein beschriftend, keine erfundenen Werte)
// -----------------------------------------------------------------------------
const PLAYER_TYPE: Record<string, string> = {
  TW: 'Torhüter', LIB: 'Ausputzer', VS: 'Innenverteidiger', AV: 'Außenverteidiger',
  DM: 'Abräumer', ZM: 'Spielmacher', OM: 'Zehner', FL: 'Flügelflitzer',
  MS: 'Strafraumstürmer', HS: 'Hängende Spitze',
};

// -----------------------------------------------------------------------------
// Positions-Feldgrafik (CSS/SVG)
// -----------------------------------------------------------------------------
function PitchGraphic({ player }: { player: Player }) {
  const positions = Array.from(new Set([player.naturalPosition, ...player.secondaryPositions]));
  const ratingFor = (pos: Position) =>
    player.positionRatings[pos] ?? (pos === player.naturalPosition ? player.overall : 0);
  return (
    <div className="pm-pitch">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pm-pitch-svg">
        <rect x="1" y="1" width="98" height="98" rx="2" fill="none" stroke="var(--border)" strokeWidth="0.5" />
        <line x1="1" y1="50" x2="99" y2="50" stroke="var(--border)" strokeWidth="0.4" />
        <circle cx="50" cy="50" r="9" fill="none" stroke="var(--border)" strokeWidth="0.4" />
        <rect x="30" y="1" width="40" height="14" fill="none" stroke="var(--border)" strokeWidth="0.4" />
        <rect x="30" y="85" width="40" height="14" fill="none" stroke="var(--border)" strokeWidth="0.4" />
      </svg>
      {positions.map((pos) => {
        const c = PITCH_POS[pos];
        if (!c) return null;
        const r = Math.round(ratingFor(pos));
        const natural = pos === player.naturalPosition;
        return (
          <div key={pos} className={`pm-pitch-badge${natural ? ' natural' : ''}`}
               style={{ left: `${c.x}%`, top: `${c.y}%` }}>
            <span className="pm-pitch-pos">{pos}</span>
            <span className="pm-pitch-val" style={{ color: vColor(r) }}>{r || '—'}</span>
          </div>
        );
      })}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Attribut-Balken (Detail-Tab)
// -----------------------------------------------------------------------------
function AttrBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="attr-bar-row">
      <span className="lbl">{label}</span>
      <div className="attr-bar-track">
        <div className="attr-bar-fill" style={{ width: `${value}%`, background: vColor(value) }} />
      </div>
      <span className={`attr-num ${vClass(value)}`}>{value}</span>
    </div>
  );
}

// =============================================================================
// Modal
// =============================================================================
type Tab = 'allgemein' | 'details' | 'statistiken' | 'stationen' | 'vertrag';

export default function PlayerModal({ player, club, onClose }: { player: Player; club?: Club; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('allgemein');
  const p = player;
  const maxOvr = starsToPotential(p.potentialStars);
  const growth = maxOvr - p.overall;
  const frische = typeof p.frische === 'number' ? Math.round(p.frische) : 100;
  const fitness = Math.round(p.attributes.fitness);

  const positions = Array.from(new Set([p.naturalPosition, ...p.secondaryPositions]));
  const ratingFor = (pos: Position) => p.positionRatings[pos] ?? (pos === p.naturalPosition ? p.overall : 0);
  const footLabel = p.preferredFoot === 'left' ? 'Links' : p.preferredFoot === 'right' ? 'Rechts' : 'Beidfüßig';

  const skillGroups = p.naturalPosition === 'TW' ? [GK_SKILLS, ...SKILL_GROUPS] : SKILL_GROUPS;
  const detailGroups = p.naturalPosition === 'TW' ? [GK_GROUP, ...ATTR_GROUPS] : ATTR_GROUPS;

  const s = p.seasonStats;
  const tps = s.appearances > 0 ? (s.goals / s.appearances).toFixed(2) : '0,00';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal pm-modal" onClick={(e) => e.stopPropagation()}>

        {/* ===================== KOPFBEREICH ===================== */}
        <div className="pm-header" style={{ background: `linear-gradient(120deg, ${club?.colors.primary ?? '#1a2331'}33, transparent 70%)` }}>
          <div className="pm-head-left">
            <div className="pm-head-avatar">
              <PlayerAvatar player={p} club={club} size="large" />
              {club && <div className="pm-head-crest"><ClubCrest club={club} size={30} /></div>}
            </div>
            <div className="pm-head-id">
              <div className="pm-head-club">{club?.name ?? '—'}</div>
              <div className="pm-head-name-row">
                <span className="pm-head-no">#{p.shirtNumber}</span>
                <h2 className="pm-head-name">{p.fullName}</h2>
              </div>
              <div className="pm-head-sub">
                {POS_DE[p.naturalPosition] ?? p.naturalPosition} · {p.age} Jahre · {p.nationality}
              </div>
              <div className="pm-head-badges">
                <span className="pill" style={{ color: vColor(p.overall) }}>OVR <b style={{ marginLeft: 4 }}>{p.overall}</b></span>
                <span className="pill"><span className="stars">{renderStars(p.potentialStars)}</span></span>
                <span className="pill" style={{ color: p.availability === 'injured' ? 'var(--red)' : 'var(--green)' }}>
                  {p.availability === 'injured' ? `Verletzt (${p.injury?.daysRemaining ?? '?'}d)` : AVAIL_DE[p.availability]}
                </span>
              </div>
            </div>
          </div>

          {/* Positions-Stärke-Tabelle */}
          <div className="pm-head-postable">
            <div className="pm-pt-row pm-pt-head">
              <span>Position</span><span>Stärke</span>
            </div>
            {positions.map((pos) => {
              const r = Math.round(ratingFor(pos));
              return (
                <div key={pos} className="pm-pt-row">
                  <span>{pos} <em>{POSITION_NAMES_DE[pos]}</em></span>
                  <span className="pm-pt-val" style={{ color: vColor(r) }}>{r || '—'}</span>
                </div>
              );
            })}
            <div className="pm-pt-row"><span>Fuß</span><span className="pm-pt-val">{footLabel}</span></div>
            <div className="pm-pt-row"><span>Spielertyp</span><span className="pm-pt-val">{PLAYER_TYPE[p.naturalPosition] ?? '—'}</span></div>
          </div>

          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* ===================== HAUPT-3-SPALTER ===================== */}
        <div className="pm-body">
          <div className="pm-cols">

            {/* LINKS: FÄHIGKEITEN */}
            <div className="pm-col pm-col-skills">
              <div className="pm-col-title"><Icon name="training" size={15} /> Fähigkeiten</div>
              {skillGroups.map((grp) => (
                <div key={grp.title} className="pm-skill-group">
                  <div className="pm-skill-gt">{grp.title}</div>
                  <div className="pm-skill-list">
                    {grp.keys.map((k) => {
                      const v = Math.round(p.attributes[k]);
                      return (
                        <div key={k} className="pm-skill-row">
                          <span className="pm-skill-lbl">{ATTR_DE[k]}</span>
                          <span className="pm-skill-val" style={{ color: vColor(v) }}>{v}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* MITTE: Positions-Feld */}
            <div className="pm-col pm-col-pitch">
              <div className="pm-col-title"><Icon name="tactics" size={15} /> Positionen</div>
              <PitchGraphic player={p} />
              <div className="pm-pitch-legend">
                {positions.map((pos) => (
                  <span key={pos} className="pm-pitch-leg">
                    <b>{pos}</b> {POSITION_NAMES_DE[pos]}
                  </span>
                ))}
              </div>
            </div>

            {/* RECHTS: LIGABILANZ + VERTRAGSSTATUS */}
            <div className="pm-col pm-col-side">
              <div className="pm-col-title"><Icon name="stats" size={15} /> Ligabilanz <span className="pm-col-sub">[{s.appearances} Spiele]</span></div>
              <div className="pm-side-stats">
                <StatLine label="Einsätze" value={s.appearances} />
                <StatLine label="Tore" value={s.goals} />
                <StatLine label="Tore / Spiel" value={tps} />
                <StatLine label="Vorlagen" value={s.assists} />
                <StatLine label="Gelbe Karten" value={s.yellowCards} />
                <StatLine label="Rote Karten" value={s.redCards + s.yellowRedCards} />
                {p.naturalPosition === 'TW' && <StatLine label="Zu Null" value={s.cleanSheets} />}
                <StatLine label="Ø Note" value={s.averageRating > 0 ? s.averageRating.toFixed(2) : '—'} />
              </div>

              <div className="pm-col-title mt14"><Icon name="contracts" size={15} /> Vertragsstatus</div>
              <div className="pm-side-stats">
                <StatLine label="Marktwert" value={fmtDM(p.contract.transferValue)} strong />
                <StatLine label="Gehalt / Woche" value={`${p.contract.weeklyWage.toLocaleString('de-DE')} DM`} />
                <StatLine label="Vertrag bis" value={p.contract.expiryDate ? new Date(p.contract.expiryDate).getFullYear().toString() : '—'} />
                <StatLine label="Zufriedenheit" value={`${p.contract.satisfaction}%`} color={vColor(p.contract.satisfaction)} />
              </div>
            </div>
          </div>

          {/* ===================== TABS ===================== */}
          <div className="tabs pm-tabs">
            {([['allgemein', 'Allgemein'], ['details', 'Details'], ['statistiken', 'Statistiken'], ['stationen', 'Stationen'], ['vertrag', 'Vertrag']] as [Tab, string][]).map(([t, l]) => (
              <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{l}</button>
            ))}
          </div>

          {tab === 'allgemein' && (
            <div className="pm-general">
              <div className="pm-gen-block">
                <div className="pm-gen-title">Spielerdaten</div>
                <div className="pm-side-stats">
                  <StatLine label="Name" value={p.fullName} />
                  <StatLine label="Nationalität" value={p.nationality} />
                  <StatLine label="Naturposition" value={`${p.naturalPosition} · ${POSITION_NAMES_DE[p.naturalPosition]}`} />
                  <StatLine label="Bevorzugter Fuß" value={footLabel} />
                </div>
              </div>

              <div className="pm-gen-block">
                <div className="pm-gen-title">Allgemein</div>
                <div className="pm-tiles">
                  <Tile num={p.age} label={`Alter`} sub={p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString('de-DE') : ''} />
                  <Tile num={p.weight} label="Gewicht" sub="kg" />
                  <Tile num={p.height} label="Größe" sub="cm" />
                  <Tile num={fitness} label={`Fit (${fitness}/100)`} color={vColor(fitness)} />
                  <Tile num={frische} label={`Frisch (${frische}/100)`} color={vColor(frische)} />
                </div>
              </div>

              <div className="pm-gen-block">
                <div className="pm-gen-title">Zustand</div>
                <div className="pm-tiles pm-tiles-cond">
                  <Tile num={Math.round(p.attributes.experience)} label="Erfahrung" color={vColor(p.attributes.experience)} />
                  <Tile num={MORALE_VAL[p.morale]} label={`Moral: ${MORALE_DE[p.morale]}`} color={vColor(MORALE_VAL[p.morale])} />
                  <Tile num={Math.round(p.form)} label="Form" color={vColor(p.form)} />
                  <Tile num={Math.round(p.development.consistency)} label="Konstanz" color={vColor(p.development.consistency)} />
                  <Tile num={Math.round(p.development.bigMatchTemperament)} label="Nervenstärke" color={vColor(p.development.bigMatchTemperament)} />
                </div>
              </div>
            </div>
          )}

          {tab === 'details' && (
            <div className="pm-detail-grid">
              {detailGroups.map((grp) => (
                <div key={grp.title} className="card">
                  <div className="card-title"><Icon name="stats" size={14} /> {grp.title}</div>
                  {grp.keys.map((k) => <AttrBar key={k} label={ATTR_DE[k]} value={Math.round(p.attributes[k])} />)}
                </div>
              ))}
              <div className="card">
                <div className="card-title"><Icon name="youth" size={14} /> Potenzial &amp; Entwicklung</div>
                <StatLine label="Aktuelles Overall" value={`${p.overall}`} strong />
                <StatLine label="Potenzial (Softcap)" value={`${maxOvr}`} color="var(--accent)" />
                <StatLine label="Wachstumsspielraum" value={growth > 0 ? `+${growth}` : '±0'} color={growth > 0 ? 'var(--green)' : 'var(--text-2)'} />
                <div className="mt12">
                  <div className="dim mini" style={{ marginBottom: 4 }}>Fortschritt zum Potenzial</div>
                  <div className="attr-bar-track" style={{ height: 12 }}>
                    <div className="attr-bar-fill" style={{
                      width: `${maxOvr > 0 ? Math.min(100, (p.overall / maxOvr) * 100) : 100}%`,
                      background: 'linear-gradient(90deg, var(--accent-dim), var(--accent))',
                    }} />
                  </div>
                </div>
                <div className="stars mt12" style={{ fontSize: 20 }}>{renderStars(p.potentialStars)}</div>
              </div>
            </div>
          )}

          {tab === 'statistiken' && (
            <div>
              <div className="pm-gen-title">Aktuelle Saison</div>
              <div className="pm-stat-boxes">
                <StatBox label="Einsätze" value={s.appearances} />
                <StatBox label="Startelf" value={s.starts} />
                <StatBox label="Tore" value={s.goals} />
                <StatBox label="Vorlagen" value={s.assists} />
                <StatBox label="Minuten" value={s.minutesPlayed} />
                <StatBox label="Gelbe K." value={s.yellowCards} />
                <StatBox label="Rote K." value={s.redCards + s.yellowRedCards} />
                <StatBox label="Ø Note" value={s.averageRating > 0 ? s.averageRating.toFixed(2) : '—'} />
              </div>
              <div className="pm-gen-title mt16">Karriere gesamt</div>
              <div className="pm-stat-boxes">
                <StatBox label="Einsätze" value={p.careerStats.appearances} />
                <StatBox label="Tore" value={p.careerStats.goals} />
                <StatBox label="Vorlagen" value={p.careerStats.assists} />
                <StatBox label="Minuten" value={p.careerStats.minutesPlayed} />
              </div>
            </div>
          )}

          {tab === 'stationen' && (
            <div className="pm-empty">
              <Icon name="stadium" size={26} />
              <div className="mt8">Aktueller Verein: <b>{club?.name ?? '—'}</b></div>
              <div className="dim mini mt8">Frühere Stationen werden in dieser Ära noch nicht erfasst.</div>
            </div>
          )}

          {tab === 'vertrag' && (
            <div className="pm-general">
              <div className="pm-gen-block">
                <div className="pm-gen-title">Vertragsdaten</div>
                <div className="pm-side-stats">
                  <StatLine label="Marktwert" value={fmtDM(p.contract.transferValue)} strong />
                  <StatLine label="Gehalt / Woche" value={`${p.contract.weeklyWage.toLocaleString('de-DE')} DM`} />
                  <StatLine label="Vertrag bis" value={p.contract.expiryDate ? new Date(p.contract.expiryDate).toLocaleDateString('de-DE') : '—'} />
                  {typeof p.contract.releaseClause === 'number' && <StatLine label="Ausstiegsklausel" value={fmtDM(p.contract.releaseClause)} />}
                  {typeof p.contract.goalBonus === 'number' && p.contract.goalBonus > 0 && <StatLine label="Tor-Prämie" value={`${p.contract.goalBonus.toLocaleString('de-DE')} DM`} />}
                  <StatLine label="Zufriedenheit" value={`${p.contract.satisfaction}%`} color={vColor(p.contract.satisfaction)} />
                  {p.transferListed && <StatLine label="Status" value="Transferliste" color="var(--orange)" />}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Hilfs-Komponenten
// -----------------------------------------------------------------------------
function StatLine({ label, value, strong, color }: { label: string; value: string | number; strong?: boolean; color?: string }) {
  return (
    <div className="pm-stat-line">
      <span className="dim mini">{label}</span>
      <span style={{ fontWeight: strong ? 800 : 600, color: color ?? 'var(--text)' }}>{value}</span>
    </div>
  );
}

function Tile({ num, label, sub, color }: { num: number | string; label: string; sub?: string; color?: string }) {
  return (
    <div className="pm-tile">
      <div className="pm-tile-num" style={{ color: color ?? 'var(--text)' }}>{num}</div>
      <div className="pm-tile-lbl">{label}</div>
      {sub && <div className="pm-tile-sub">{sub}</div>}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card pm-statbox">
      <div className="pm-statbox-num">{value}</div>
      <div className="dim mini mt8">{label}</div>
    </div>
  );
}
