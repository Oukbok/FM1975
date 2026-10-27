import { MAX_LEVEL } from '../../engine/infrastructure';
import { Game } from '../../game/state';
import { Player, YOUTH_AGE_CLASS_LABEL, YOUTH_AGE_CLASS_ORDER, YOUTH_AGE_CLASS_RANGE, YouthAgeClass, renderStars, youthAgeClass } from '../../types';
import { vColor } from '../../ui/format';
import { YouthModal } from './YouthModal';
import { useState } from 'react';

// =============================================================================
// JUGEND (Jugendakademie) — Talentliste + Detail mit verstecktem Potenzial
// =============================================================================
export type YouthSort = 'pot' | 'ovr' | 'age';

/** Rendert die Scouting-Einschätzung als GOLDENE Sterne-Spanne (min–max). */
export function ScoutRange({ p }: { p: Player }) {
  const min = p.scoutedPotentialMin ?? p.potentialStars;
  const max = p.scoutedPotentialMax ?? p.potentialStars;
  if (Math.abs(max - min) < 0.001) {
    return <span className="stars" title={`Potenzial: ${min.toFixed(1)} Sterne`}>{renderStars(min)}</span>;
  }
  return (
    <span title={`Scouting-Spanne: ${min.toFixed(1)}–${max.toFixed(1)} Sterne`} style={{ whiteSpace: 'nowrap' }}>
      <span className="stars" style={{ fontSize: 11 }}>{renderStars(min)}</span>
      <span className="dim2 mini" style={{ margin: '0 4px' }}>bis</span>
      <span className="stars" style={{ fontSize: 11 }}>{renderStars(max)}</span>
    </span>
  );
}

export function YouthView({ g, onChange }: { g: Game; onChange: () => void }) {
  const [sel, setSel] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<YouthSort>('pot');
  const [classFilter, setClassFilter] = useState<YouthAgeClass | 'ALL'>('ALL');
  const club = g.clubs[g.managedClubId];
  const acadLevel = club.infrastructure.youthAcademy;

  const sortFn = (a: Player, b: Player) => {
    switch (sortBy) {
      case 'ovr': return b.overall - a.overall;
      case 'age': return a.age - b.age;
      default: {
        const am = a.scoutedPotentialMax ?? a.potentialStars;
        const bm = b.scoutedPotentialMax ?? b.potentialStars;
        return (bm - am) || (b.overall - a.overall);
      }
    }
  };

  const youth = club.youthPlayerIds
    .map((id) => g.youthPlayers[id])
    .filter(Boolean);

  // Talente nach Altersklasse G–A gruppieren.
  const byClass: Record<YouthAgeClass, Player[]> = { G: [], F: [], E: [], D: [], C: [], B: [], A: [] };
  for (const pl of youth) {
    const cls = youthAgeClass(pl.age);
    if (cls) byClass[cls].push(pl);
  }
  for (const cls of YOUTH_AGE_CLASS_ORDER) byClass[cls].sort(sortFn);

  const visibleClasses = YOUTH_AGE_CLASS_ORDER.filter(
    (cls) => (classFilter === 'ALL' || classFilter === cls) && byClass[cls].length > 0,
  );

  const p = sel ? g.youthPlayers[sel] : null;

  const SortBtn = ({ k, label }: { k: YouthSort; label: string }) => (
    <button className={`btn-sm ${sortBy === k ? 'active' : ''}`} onClick={() => setSortBy(k)}>{label}</button>
  );

  const YouthTable = ({ rows }: { rows: Player[] }) => (
    <div className="table-scroll">
      <table className="squad-table">
        <thead>
          <tr>
            <th>Name</th><th>Pos</th><th>Alter</th><th>OVR</th><th>Potenzial (Scouting)</th>
            <th title="Tempo">TMP</th><th title="Technik">TEC</th><th title="Passspiel">PAS</th>
            <th title="Zweikampf">ZWK</th><th title="Torschuss">TOR</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((pl) => (
            <tr key={pl.id} className="clickable" onClick={() => setSel(pl.id)}>
              <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{pl.fullName}</td>
              <td><span className="pos-tag">{pl.naturalPosition}</span></td>
              <td>{pl.age}</td>
              <td><b style={{ color: vColor(pl.overall) }}>{pl.overall}</b></td>
              <td><ScoutRange p={pl} /></td>
              <td style={{ color: vColor(pl.attributes.speed) }}>{pl.attributes.speed}</td>
              <td style={{ color: vColor(pl.attributes.technique) }}>{pl.attributes.technique}</td>
              <td style={{ color: vColor(pl.attributes.passing) }}>{pl.attributes.passing}</td>
              <td style={{ color: vColor(pl.attributes.tackling) }}>{pl.attributes.tackling}</td>
              <td style={{ color: vColor(pl.attributes.shooting) }}>{pl.attributes.shooting}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="youth-academy">
      <div className="youth-hero card">
        <div className="youth-hero-title">🧒 Jugendakademie</div>
        <div className="youth-hero-sub dim">
          {club.name} · Jahrgänge von der G-Jugend (Bambini) bis zur A-Jugend
        </div>
        <div className="youth-hero-pills">
          <span className="pill">Akademie-Stufe <b style={{ marginLeft: 4 }}>{acadLevel}/{MAX_LEVEL}</b></span>
          <span className="pill">Talente gesamt <b style={{ marginLeft: 4 }}>{youth.length}</b></span>
        </div>
        <div className="dim mini mt8">
          Neue G-Jugend-Talente (Bambini, 7 Jahre) treffen jeweils zum <b>1. Juli</b> ein; alle Jahrgänge rücken
          dann eine Altersklasse auf. Am Ende der A-Jugend (mit ~19&nbsp;Jahren) verlassen die Talente die
          Akademie – die besten werden in den Profikader hochgezogen. Anzahl, Qualität und Lernrate hängen
          von der Akademie-Stufe ab (Ausbau im Bereich <b>Gelände</b>).
        </div>
      </div>

      <div className="row mt12">
        <div className="youth-class-tabs">
          <button
            className={`btn-sm ${classFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setClassFilter('ALL')}
          >
            Alle <span className="dim2">({youth.length})</span>
          </button>
          {YOUTH_AGE_CLASS_ORDER.map((cls) => (
            <button
              key={cls}
              className={`btn-sm ${classFilter === cls ? 'active' : ''}`}
              onClick={() => setClassFilter(cls)}
              disabled={byClass[cls].length === 0}
            >
              {YOUTH_AGE_CLASS_LABEL[cls]} <span className="dim2">({byClass[cls].length})</span>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="dim mini">Sortieren:</span>
          <SortBtn k="pot" label="Potenzial" />
          <SortBtn k="ovr" label="OVR" />
          <SortBtn k="age" label="Alter" />
        </div>
      </div>

      {youth.length === 0 ? (
        <div className="card mt12 dim" style={{ padding: 16 }}>
          Aktuell befinden sich keine Talente in der Akademie. Der nächste G-Jugend-Jahrgang (Bambini) trifft zum 1. Juli ein.
        </div>
      ) : visibleClasses.length === 0 ? (
        <div className="card mt12 dim" style={{ padding: 16 }}>
          In dieser Altersklasse befinden sich derzeit keine Talente.
        </div>
      ) : (
        visibleClasses.map((cls) => (
          <div key={cls} className="youth-class-section card mt12">
            <div className="youth-class-head">
              <div className="youth-class-badge">{cls}</div>
              <div>
                <div className="youth-class-name">{YOUTH_AGE_CLASS_LABEL[cls]}</div>
                <div className="dim2 mini">{YOUTH_AGE_CLASS_RANGE[cls]}</div>
              </div>
              <span className="pill" style={{ marginLeft: 'auto' }}>{byClass[cls].length} Talent(e)</span>
            </div>
            <YouthTable rows={byClass[cls]} />
          </div>
        ))
      )}

      {youth.length > 0 && (
        <div className="dim2 mini mt12">
          Das echte Potenzial eines Talents ist verborgen – die Scouts geben nur eine <b>Sterne-Spanne</b> an.
          Je jünger das Talent (G/F/E-Jugend), desto breiter die Spanne; mit steigendem Alter und höherer
          Akademie-Stufe engt sie sich an den wahren Wert an. Klicke eine Zeile für Details und zum Hochziehen
          in den Profikader.
        </div>
      )}

      {p && (
        <YouthModal
          g={g} player={p} club={club}
          onClose={() => setSel(null)}
          onChange={onChange}
        />
      )}
    </div>
  );
}
