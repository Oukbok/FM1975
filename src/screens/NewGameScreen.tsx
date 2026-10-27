import ClubCrest from '../components/ClubCrest';
import Icon from '../components/Icon';
import { getClubSeeds } from '../data/generate';
import { AppSettings } from '../engine/save';
import { Difficulty, ManagerBackground, ManagerProfile, ManagerStyle, NewGameOptions } from '../types';
import { useState } from 'react';

// -----------------------------------------------------------------------------
// NEUES SPIEL: Managerprofil + Verein + Optionen
// -----------------------------------------------------------------------------
export const STYLE_DE: Record<ManagerStyle, string> = { defensive: 'Defensiv', balanced: 'Ausgeglichen', attacking: 'Offensiv' };

export const BG_DE: Record<ManagerBackground, { label: string; desc: string }> = {
  legend: { label: 'Trainer-Legende', desc: 'Großer Name, hohes Ansehen beim Vorstand.' },
  ex_pro: { label: 'Ex-Profi', desc: 'Selbst gespielt – gute Draht zur Mannschaft.' },
  tactician: { label: 'Taktik-Fuchs', desc: 'Analytiker mit Sinn für Details.' },
  rookie: { label: 'Newcomer', desc: 'Unbeschriebenes Blatt mit Ambitionen.' },
};

export function NewGameScreen({ defaults, onBack, onStart }: {
  defaults: AppSettings; onBack: () => void; onStart: (o: NewGameOptions) => void;
}) {
  const seeds = getClubSeeds();
  const [name, setName] = useState('');
  const [nationality, setNationality] = useState('Deutschland');
  const [birthYear, setBirthYear] = useState(1940);
  const [style, setStyle] = useState<ManagerStyle>('balanced');
  const [background, setBackground] = useState<ManagerBackground>('ex_pro');
  const [clubId, setClubId] = useState(seeds[0].id);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [injuries, setInjuries] = useState(true);
  const [realistic, setRealistic] = useState(true);
  const [speedMs, setSpeedMs] = useState(defaults.speedMs);

  const canStart = name.trim().length >= 2;

  const start = () => {
    const manager: ManagerProfile = {
      name: name.trim(), nationality, birthYear, style, background,
      avatarSeed: name.trim().toLowerCase(),
    };
    onStart({
      managedClubId: clubId, manager, difficulty,
      realisticSquads: realistic, injuriesEnabled: injuries, speedMs,
    });
  };

  return (
    <div className="menu-panel wide">
      <div className="row"><h2 style={{ margin: 0 }}>Neues Spiel</h2><button className="btn-sm" onClick={onBack}>← Zurück</button></div>

      {/* Managerprofil */}
      <div className="card mt16">
        <div className="card-title"><span className="ico"><Icon name="squad" /></span> Dein Managerprofil</div>
        <div className="form-grid">
          <label>Name
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="z.B. Max Mustermann" />
          </label>
          <label>Nationalität
            <input value={nationality} onChange={(e) => setNationality(e.target.value)} />
          </label>
          <label>Geburtsjahr
            <input type="number" min={1910} max={1962} value={birthYear} onChange={(e) => setBirthYear(+e.target.value)} />
          </label>
          <label>Bevorzugter Spielstil
            <select value={style} onChange={(e) => setStyle(e.target.value as ManagerStyle)}>
              {(Object.keys(STYLE_DE) as ManagerStyle[]).map((s) => <option key={s} value={s}>{STYLE_DE[s]}</option>)}
            </select>
          </label>
        </div>
        <label className="dim mini mt12" style={{ display: 'block' }}>Trainer-Hintergrund</label>
        <div className="chip-row">
          {(Object.keys(BG_DE) as ManagerBackground[]).map((b) => (
            <button key={b} className={`chip ${background === b ? 'active' : ''}`} onClick={() => setBackground(b)} title={BG_DE[b].desc}>
              {BG_DE[b].label}
            </button>
          ))}
        </div>
        <div className="dim2 mini mt8">{BG_DE[background].desc}</div>
      </div>

      {/* Verein */}
      <div className="card mt16">
        <div className="card-title"><span className="ico"><Icon name="dashVerein" /></span> Verein wählen</div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))' }}>
          {seeds.map((s) => (
            <div key={s.id} className={`card club-pick ${clubId === s.id ? 'sel' : ''}`} onClick={() => setClubId(s.id)}>
              {/* ClubCrest statt Inline-SVG, damit ein spielweit hochgeladenes Wappen
                  auch in der Vereinsauswahl beim Spielstart erscheint. */}
              <ClubCrest club={{ id: s.id, name: s.name, shortName: s.shortName, city: s.city, colors: { primary: s.primary, secondary: s.secondary } } as any} size={32} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700 }}>{s.shortName}</div>
                <div className="dim2 mini" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                <div className="dim2 mini">{s.city} · Ansehen {s.reputation}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Optionen */}
      <div className="card mt16">
        <div className="card-title"><span className="ico"><Icon name="settings" /></span> Spieloptionen</div>
        <div className="form-grid">
          <label>Schwierigkeit
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
              <option value="easy">Leicht</option>
              <option value="normal">Normal</option>
              <option value="hard">Schwer</option>
            </select>
          </label>
        </div>
        <div className="toggle-row mt12">
          <label className="toggle-item">
            <input type="checkbox" checked={injuries} onChange={(e) => setInjuries(e.target.checked)} />
            <span className={`toggle ${injuries ? 'on' : ''}`}></span>
            Verletzungen aktiviert
          </label>
          <label className="toggle-item">
            <input type="checkbox" checked={realistic} onChange={(e) => setRealistic(e.target.checked)} />
            <span className={`toggle ${realistic ? 'on' : ''}`}></span>
            Realistische Kader
          </label>
        </div>
        <label className="dim mini mt12" style={{ display: 'block' }}>Spieltempo: <b className="accent-text">{speedMs} ms/Tag</b> ({speedMs <= 600 ? 'schnell' : speedMs >= 1200 ? 'langsam' : 'mittel'})</label>
        <input type="range" min={300} max={1600} step={100} value={speedMs} onChange={(e) => setSpeedMs(+e.target.value)} style={{ width: '100%' }} />
      </div>

      <button className="btn-primary btn-continue mt16" style={{ alignSelf: 'center', padding: '13px 40px', fontSize: 16 }} disabled={!canStart} onClick={start}>
        <Icon name="newGame" /> SAISON STARTEN
      </button>
      {!canStart && <div className="dim2 mini" style={{ textAlign: 'center', marginTop: 6 }}>Bitte gib deinen Managernamen ein (min. 2 Zeichen).</div>}
    </div>
  );
}
