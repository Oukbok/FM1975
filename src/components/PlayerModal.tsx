// =============================================================================
// PlayerModal — Spielerprofil auf EINER Seite (kein Scrollen, keine Reiter)
//   Kopf:   großes Porträt | Identität + Steckbrief | Zustand (Frische, Fitness, Form, Moral …)
//   Körper: Fähigkeiten (Kategorien, alphabetisch) | Positionen + Entwicklung | Saison, Karriere, Vertrag
// =============================================================================
import { Player, Club, PlayerAttributes, Position, PlayerMorale, PlayerAvailability, renderStars, starsToPotential } from '../types';
import PlayerAvatar from './PlayerAvatar';
import ClubCrest from './ClubCrest';
import Icon from './Icon';
import { POSITION_NAMES_DE } from '../engine/positions';
import { fmtDM, fmtDMfull, vColor } from '../ui/format';

type AttrKey = keyof PlayerAttributes;

const ATTR_DE: Record<AttrKey, string> = {
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

// Kategorien nach Spielsituation. Fitness fehlt bewusst: sie steht als Zustandswert im Kopf.
// Innerhalb jeder Kategorie wird alphabetisch sortiert (siehe sortedKeys).
const GROUPS: { title: string; keys: AttrKey[] }[] = [
  { title: 'Ballbehandlung', keys: ['ballControl', 'crossing', 'dribbling', 'firstTouch', 'longPassing', 'passing', 'technique'] },
  { title: 'Abschluss', keys: ['heading', 'longShots', 'shooting', 'shotPower'] },
  { title: 'Defensive', keys: ['interceptions', 'marking', 'positioning', 'tackling'] },
  { title: 'Standards', keys: ['corners', 'freeKicks', 'penalties'] },
  { title: 'Mental', keys: ['aggression', 'composure', 'concentration', 'decisions', 'experience', 'flair', 'leadership', 'teamwork', 'vision', 'workRate'] },
  { title: 'Physis', keys: ['acceleration', 'agility', 'balance', 'jumping', 'speed', 'stamina', 'strength'] },
];
const GK_GROUP = { title: 'Torwart', keys: ['aerialReach', 'communication', 'handling', 'kicking', 'oneOnOnes', 'reflexes'] as AttrKey[] };

const sortedKeys = (keys: AttrKey[]) => [...keys].sort((a, b) => ATTR_DE[a].localeCompare(ATTR_DE[b], 'de'));

const POS_DE: Record<string, string> = {
  TW: 'Torwart', LIB: 'Libero', VS: 'Vorstopper', AV: 'Außenverteidiger',
  DM: 'Defensives Mittelfeld', ZM: 'Zentrales Mittelfeld', OM: 'Offensives Mittelfeld',
  FL: 'Flügel', MS: 'Mittelstürmer', HS: 'Hängende Spitze',
};
const PLAYER_TYPE: Record<string, string> = {
  TW: 'Torhüter', LIB: 'Ausputzer', VS: 'Innenverteidiger', AV: 'Außenverteidiger',
  DM: 'Abräumer', ZM: 'Spielmacher', OM: 'Zehner', FL: 'Flügelflitzer',
  MS: 'Strafraumstürmer', HS: 'Hängende Spitze',
};
const MORALE_DE: Record<PlayerMorale, string> = {
  very_low: 'Sehr niedrig', low: 'Niedrig', okay: 'Neutral', good: 'Gut', excellent: 'Ausgezeichnet',
};
const MORALE_VAL: Record<PlayerMorale, number> = { very_low: 20, low: 40, okay: 55, good: 75, excellent: 92 };
const AVAIL_DE: Record<PlayerAvailability, string> = {
  available: 'Einsatzfähig', injured: 'Verletzt', suspended: 'Gesperrt', ill: 'Krank', international: 'Abgestellt',
};

// Feld-Koordinaten je Position (x/y in %, y klein = Angriff oben)
const PITCH_POS: Record<Position, { x: number; y: number }> = {
  TW: { x: 50, y: 90 }, LIB: { x: 50, y: 76 }, VS: { x: 37, y: 72 }, AV: { x: 16, y: 66 },
  DM: { x: 50, y: 58 }, ZM: { x: 35, y: 48 }, OM: { x: 50, y: 36 }, FL: { x: 17, y: 30 },
  MS: { x: 50, y: 14 }, HS: { x: 62, y: 24 },
};

const utcDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('de-DE', { timeZone: 'UTC' }) : '—');

export default function PlayerModal({ player, club, onClose }: { player: Player; club?: Club; onClose: () => void }) {
  const p = player;
  const maxOvr = starsToPotential(p.potentialStars);
  const growth = maxOvr - p.overall;
  const frische = typeof p.frische === 'number' ? Math.round(p.frische) : 100;
  const positions = Array.from(new Set([p.naturalPosition, ...p.secondaryPositions]));
  const ratingFor = (pos: Position) => Math.round(p.positionRatings[pos] ?? (pos === p.naturalPosition ? p.overall : 0));
  const footLabel = p.preferredFoot === 'left' ? 'Links' : p.preferredFoot === 'right' ? 'Rechts' : 'Beidfüßig';
  const groups = p.naturalPosition === 'TW' ? [GK_GROUP, ...GROUPS] : GROUPS;
  const s = p.seasonStats;
  const c = p.careerStats;
  const availText = p.availability === 'injured' ? `Verletzt (${p.injury?.daysRemaining ?? '?'} Tage)` : AVAIL_DE[p.availability];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal pm-modal" onClick={(e) => e.stopPropagation()}>
        {/* ===================== KOPF ===================== */}
        <div className="pm-header" style={{ background: `linear-gradient(120deg, ${club?.colors.primary ?? '#1a2331'}40, transparent 65%)` }}>
          <div className="pm-portrait">
            <PlayerAvatar player={p} club={club} size={176} />
            {club && <div className="pm-portrait-crest"><ClubCrest club={club} size={40} /></div>}
          </div>

          <div className="pm-id">
            <div className="pm-head-club">{club?.name ?? 'Vereinslos'}</div>
            <div className="pm-head-name-row">
              <span className="pm-head-no">#{p.shirtNumber}</span>
              <h2 className="pm-head-name">{p.fullName}</h2>
            </div>
            <div className="pm-head-sub">{POS_DE[p.naturalPosition] ?? p.naturalPosition} · {PLAYER_TYPE[p.naturalPosition] ?? '—'}</div>
            <div className="pm-head-badges">
              <span className="pill" style={{ color: vColor(p.overall) }}>Stärke <b>{p.overall}</b></span>
              <span className="pill">Potenzial <span className="stars">{renderStars(p.potentialStars)}</span></span>
              <span className="pill" style={{ color: p.availability === 'available' ? 'var(--green)' : 'var(--red)' }}>{availText}</span>
              {p.transferListed && <span className="pill" style={{ color: 'var(--orange)' }}>Transferliste</span>}
            </div>
            <div className="pm-facts">
              <Fact label="Alter" value={`${p.age} Jahre`} sub={utcDate(p.dateOfBirth)} />
              <Fact label="Nationalität" value={p.nationality} />
              <Fact label="Größe" value={`${p.height} cm`} />
              <Fact label="Gewicht" value={`${p.weight} kg`} />
              <Fact label="Fuß" value={footLabel} />
            </div>
          </div>

          <div className="pm-cond">
            <div className="pm-col-title"><Icon name="fans" size={15} /> Zustand</div>
            <CondBar label="Frische" value={frische} />
            <CondBar label="Fitness" value={Math.round(p.attributes.fitness)} />
            <CondBar label="Form" value={Math.round(p.form)} />
            <CondBar label={`Moral · ${MORALE_DE[p.morale]}`} value={MORALE_VAL[p.morale]} />
            <CondBar label="Konstanz" value={Math.round(p.development.consistency)} />
            <CondBar label="Nervenstärke" value={Math.round(p.development.bigMatchTemperament)} />
          </div>

          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* ===================== KÖRPER ===================== */}
        <div className="pm-cols">
          <section className="pm-col pm-col-skills">
            <div className="pm-col-title"><Icon name="training" size={15} /> Fähigkeiten</div>
            <div className="pm-skill-groups">
              {groups.map((grp) => (
                <div key={grp.title} className="pm-skill-group">
                  <div className="pm-skill-gt">{grp.title}</div>
                  {sortedKeys(grp.keys).map((k) => {
                    const v = Math.round(p.attributes[k]);
                    return (
                      <div key={k} className="pm-skill-row">
                        <span className="pm-skill-lbl">{ATTR_DE[k]}</span>
                        <span className="pm-skill-val" style={{ color: vColor(v) }}>{v}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </section>

          <section className="pm-col pm-col-pitch">
            <div className="pm-col-title"><Icon name="tactics" size={15} /> Positionen</div>
            <div className="pm-pitch">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pm-pitch-svg">
                <rect x="1" y="1" width="98" height="98" rx="2" fill="none" stroke="var(--border)" strokeWidth="0.5" />
                <line x1="1" y1="50" x2="99" y2="50" stroke="var(--border)" strokeWidth="0.4" />
                <circle cx="50" cy="50" r="9" fill="none" stroke="var(--border)" strokeWidth="0.4" />
                <rect x="30" y="1" width="40" height="14" fill="none" stroke="var(--border)" strokeWidth="0.4" />
                <rect x="30" y="85" width="40" height="14" fill="none" stroke="var(--border)" strokeWidth="0.4" />
              </svg>
              {positions.map((pos) => {
                const xy = PITCH_POS[pos];
                if (!xy) return null;
                const r = ratingFor(pos);
                return (
                  <div key={pos} className={`pm-pitch-badge${pos === p.naturalPosition ? ' natural' : ''}`} style={{ left: `${xy.x}%`, top: `${xy.y}%` }}>
                    <span className="pm-pitch-pos">{pos}</span>
                    <span className="pm-pitch-val" style={{ color: vColor(r) }}>{r || '—'}</span>
                  </div>
                );
              })}
            </div>
            <div className="pm-list">
              {positions.map((pos) => (
                <Line key={pos} label={`${pos} · ${POSITION_NAMES_DE[pos]}`} value={ratingFor(pos) || '—'} color={vColor(ratingFor(pos))} />
              ))}
            </div>
            <div className="pm-col-title mt14"><Icon name="youth" size={15} /> Entwicklung</div>
            <div className="pm-growth">
              <div className="pm-growth-track">
                <div className="pm-growth-fill" style={{ width: `${maxOvr > 0 ? Math.min(100, (p.overall / maxOvr) * 100) : 100}%` }} />
              </div>
              <div className="pm-growth-meta">
                <span>Jetzt <b>{p.overall}</b></span>
                <span>Potenzial <b style={{ color: 'var(--accent)' }}>{maxOvr}</b></span>
                <span>Spielraum <b style={{ color: growth > 0 ? 'var(--green)' : 'var(--text-2)' }}>{growth > 0 ? `+${growth}` : '±0'}</b></span>
              </div>
            </div>
          </section>

          <section className="pm-col pm-col-side">
            <div className="pm-col-title"><Icon name="stats" size={15} /> Saison</div>
            <div className="pm-stat-grid">
              <Stat label="Einsätze" value={s.appearances} sub={`${s.starts} Startelf`} />
              <Stat label="Tore" value={s.goals} />
              <Stat label="Vorlagen" value={s.assists} />
              <Stat label="Minuten" value={s.minutesPlayed} />
              <Stat label="Karten" value={`${s.yellowCards} / ${s.redCards + s.yellowRedCards}`} sub="Gelb / Rot" />
              {p.naturalPosition === 'TW'
                ? <Stat label="Zu null" value={s.cleanSheets} />
                : <Stat label="Ø Note" value={s.averageRating > 0 ? s.averageRating.toFixed(2) : '—'} />}
            </div>
            <div className="pm-col-title mt14"><Icon name="chronicle" size={15} /> Karriere</div>
            <div className="pm-list">
              <Line label="Einsätze / Tore / Vorlagen" value={`${c.appearances} / ${c.goals} / ${c.assists}`} />
            </div>
            <div className="pm-col-title mt14"><Icon name="contracts" size={15} /> Vertrag</div>
            <div className="pm-list">
              <Line label="Marktwert" value={fmtDM(p.contract.transferValue)} strong />
              <Line label="Gehalt / Woche" value={fmtDMfull(p.contract.weeklyWage)} />
              <Line label="Vertrag bis" value={utcDate(p.contract.expiryDate)} />
              {typeof p.contract.releaseClause === 'number' && <Line label="Ausstiegsklausel" value={fmtDM(p.contract.releaseClause)} />}
              {typeof p.contract.goalBonus === 'number' && p.contract.goalBonus > 0 && <Line label="Tor-Prämie" value={fmtDMfull(p.contract.goalBonus)} />}
              <Line label="Zufriedenheit" value={`${p.contract.satisfaction} %`} color={vColor(p.contract.satisfaction)} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
function Fact({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="pm-fact">
      <div className="pm-fact-lbl">{label}</div>
      <div className="pm-fact-val">{value}</div>
      {sub && <div className="pm-fact-sub">{sub}</div>}
    </div>
  );
}

function CondBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="pm-cond-row">
      <span className="pm-cond-lbl">{label}</span>
      <div className="pm-cond-track"><div className="pm-cond-fill" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: vColor(value) }} /></div>
      <span className="pm-cond-val" style={{ color: vColor(value) }}>{value}</span>
    </div>
  );
}

function Line({ label, value, strong, color }: { label: string; value: string | number; strong?: boolean; color?: string }) {
  return (
    <div className="pm-line">
      <span className="pm-line-lbl">{label}</span>
      <span style={{ fontWeight: strong ? 800 : 700, color: color ?? 'var(--text)' }}>{value}</span>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="pm-stat">
      <div className="pm-stat-num">{value}</div>
      <div className="pm-stat-lbl">{label}</div>
      {sub && <div className="pm-stat-sub">{sub}</div>}
    </div>
  );
}
