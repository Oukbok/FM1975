// =============================================================================
// AUFSTELLUNG — Formation, Drag&Drop, Eignung, Standardschützen, Taktik-Popup
// =============================================================================
import { useState } from 'react';
import { Player, Position, Tactics } from '../types';
import { FORMATIONS, getFormation, Formation } from '../data/formations';
import {
  positionSuitability, suitabilityColor, POSITION_NAMES_DE,
} from '../engine/positions';
import { autoFillLineup, assignToFormation } from '../engine/lineupAI';
import PlayerAvatar from './PlayerAvatar';
import { DashBox, DashPage, Kpi } from '../ui/DashPage';

// Loses Game-Interface (Vollstruktur liegt in App.tsx).
interface G {
  clubs: Record<string, any>;
  players: Record<string, Player>;
  managedClubId: string;
}

/** Baut assignedPositions + startingXI aus lineupMap + Formation neu auf. */
function syncFromMap(t: Tactics, formation: Formation) {
  const assigned: Record<string, Position> = {};
  const xi: string[] = [];
  for (const slot of formation.slots) {
    const pid = t.lineupMap?.[slot.id];
    if (pid) { assigned[pid] = slot.position; xi.push(pid); }
  }
  t.assignedPositions = assigned;
  t.startingXI = xi;
}

export default function LineupView({ g, onChange }: { g: G; onChange: () => void }) {
  const myClub = g.clubs[g.managedClubId];
  const t: Tactics = myClub.tactics;
  const [drag, setDrag] = useState<string | null>(null);
  const [, force] = useState(0);
  const refresh = () => { force((n) => n + 1); onChange(); };

  const formation = getFormation(t.formation);
  if (!t.lineupMap) {
    // Erststart / alter Spielstand: automatisch besetzen.
    const auto = autoFillLineup(myClub, g.players, t);
    Object.assign(t, auto);
  }
  const lineupMap = t.lineupMap!;

  const allPlayers: Player[] = (myClub.playerIds as string[])
    .map((id) => g.players[id]).filter(Boolean);
  const startingIds = new Set(Object.values(lineupMap));
  const benchPlayers = allPlayers
    .filter((p) => !startingIds.has(p.id))
    .sort((a, b) => b.overall - a.overall);

  // Slot, in dem ein Spieler aktuell steht (oder null).
  const slotOf = (pid: string): string | null => {
    for (const [sid, id] of Object.entries(lineupMap)) if (id === pid) return sid;
    return null;
  };

  // Spieler pid dem Slot sid zuweisen (mit Tausch, falls belegt).
  const dropOnSlot = (sid: string, pid: string) => {
    const from = slotOf(pid);
    const occupant = lineupMap[sid];
    if (from) delete lineupMap[from];
    if (occupant && from) lineupMap[from] = occupant; // Tausch
    else if (occupant && !from) delete lineupMap[sid];
    lineupMap[sid] = pid;
    syncFromMap(t, formation);
    setDrag(null);
    refresh();
  };

  // Spieler auf die Bank ziehen (aus Startelf entfernen).
  const dropOnBench = (pid: string) => {
    const from = slotOf(pid);
    if (from) { delete lineupMap[from]; syncFromMap(t, formation); }
    setDrag(null);
    refresh();
  };

  const changeFormation = (fid: string) => {
    const f = getFormation(fid);
    const pool = allPlayers.filter((p) => p.availability !== 'injured');
    const asg = assignToFormation(f, pool);
    t.formation = f.id;
    t.lineupMap = asg.lineupMap;
    t.assignedPositions = asg.assignedPositions;
    t.startingXI = asg.startingXI;
    t.substitutes = asg.substitutes;
    refresh();
  };

  const doAuto = () => { Object.assign(t, autoFillLineup(myClub, g.players, t)); refresh(); };

  const xiPlayers = Object.values(lineupMap).map((id) => g.players[id]).filter(Boolean) as Player[];

  const xiAvg = xiPlayers.length ? Math.round(xiPlayers.reduce((sum, p) => sum + p.overall, 0) / xiPlayers.length) : 0;
  const suitAvg = formation.slots.length
    ? Math.round(formation.slots.reduce((sum, slot) => {
      const pid = lineupMap[slot.id];
      const p = pid ? g.players[pid] : undefined;
      return sum + (p ? positionSuitability(p, slot.position) : 0);
    }, 0) / formation.slots.length)
    : 0;
  const unavailableInXI = xiPlayers.filter((p) => p.availability !== 'available' || p.suspensionMatches > 0);

  return (
    <DashPage>
      <DashBox title="Spielfeld" icon="lineup" rows={2}
        right={<button className="dchip" onClick={doAuto}>Auto-Aufstellen</button>}>
        <div className="lineup-pitch-wrap">
          <div className="pitch" onDragOver={(e) => e.preventDefault()}>
            {formation.slots.map((slot) => {
              const pid = lineupMap[slot.id];
              const p = pid ? g.players[pid] : undefined;
              const suit = p ? positionSuitability(p, slot.position) : 0;
              return (
                <div key={slot.id}
                  className={`slot ${drag ? 'droptarget' : ''}`}
                  style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => drag && dropOnSlot(slot.id, drag)}>
                  <div className="slot-pos">{slot.position}</div>
                  {p ? (
                    <div className="slot-player" draggable
                      onDragStart={() => setDrag(p.id)} onDragEnd={() => setDrag(null)}>
                      <PlayerAvatar player={p} size={34} />
                      <div className="slot-name">{p.lastName}</div>
                      <div className="suit-badge" style={{ background: suitabilityColor(suit) }}>{suit}</div>
                    </div>
                  ) : (
                    <div className="slot-empty">+</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </DashBox>

      <DashBox title="Formation" icon="tactics" right={formation.label}>
        <div className="dbtnrow" style={{ marginBottom: 10 }}>
          {FORMATIONS.map((f) => (
            <button key={f.id} className={`dchip ${t.formation === f.id ? 'on' : ''}`} title={f.desc}
              onClick={() => changeFormation(f.id)}>
              {f.label}{f.libero ? ' (Libero)' : ''}
            </button>
          ))}
        </div>
        <div className="dnote" style={{ marginBottom: 10 }}>{formation.desc}</div>
        <div className="dkpis">
          <Kpi value={xiPlayers.length + '/11'} label="Startelf" color={xiPlayers.length === 11 ? 'var(--green)' : 'var(--red)'} />
          <Kpi value={xiAvg} label="Ø Stärke" />
          <Kpi value={suitAvg} label="Ø Eignung" color={suitabilityColor(suitAvg)} />
        </div>
        {unavailableInXI.length > 0 && (
          <div className="dnote" style={{ color: 'var(--red)' }}>
            Nicht einsatzfähig in der Startelf: {unavailableInXI.map((p) => p.lastName).join(', ')}
          </div>
        )}
      </DashBox>

      <DashBox title="Ersatzbank & Reserve" icon="squad" rows={2} right={`${benchPlayers.length} Spieler`}>
        <div className="bench-drop" onDragOver={(e) => e.preventDefault()} onDrop={() => drag && dropOnBench(drag)}>
          {benchPlayers.map((p) => {
            const suit = positionSuitability(p, p.naturalPosition);
            return (
              <div key={p.id} className="bench-item" draggable
                onDragStart={() => setDrag(p.id)} onDragEnd={() => setDrag(null)}>
                <PlayerAvatar player={p} size={30} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="bench-name">{p.fullName}</div>
                  <div className="dim mini">{POSITION_NAMES_DE[p.naturalPosition]} · Stärke {p.overall}
                    {p.availability === 'injured' && ' · verletzt'}
                    {p.suspensionMatches > 0 && ' · gesperrt'}</div>
                </div>
                <span className="suit-badge sm" style={{ background: suitabilityColor(suit) }}>{suit}</span>
              </div>
            );
          })}
          {benchPlayers.length === 0 && <div className="dim mini">Keine weiteren Spieler.</div>}
          <div className="dnote mt8">Spieler hierher ziehen, um sie aus der Startelf zu nehmen.</div>
        </div>
      </DashBox>

      <DashBox title="Standardschützen" icon="matchball">
        <div className="setpiece-grid">
          <SetPieceSelect label="Elfmeter" value={t.penaltyTakerId} players={xiPlayers}
            onChange={(v) => { t.penaltyTakerId = v; refresh(); }} attr="penalties" />
          <SetPieceSelect label="Freistoß" value={t.freeKickTakerId} players={xiPlayers}
            onChange={(v) => { t.freeKickTakerId = v; refresh(); }} attr="freeKicks" />
          <SetPieceSelect label="Ecke" value={t.cornerTakerId} players={xiPlayers}
            onChange={(v) => { t.cornerTakerId = v; refresh(); }} attr="corners" />
          <SetPieceSelect label="Kapitän" value={t.captainId} players={xiPlayers}
            onChange={(v) => { t.captainId = v; refresh(); }} attr="leadership" />
        </div>
        <div className="dnote mt8">Die Zahl in Klammern ist der passende Wert (Elfmeter, Freistöße, Ecken, Führungsqualitäten).</div>
      </DashBox>
    </DashPage>
  );
}

function SetPieceSelect({ label, value, players, onChange, attr }: {
  label: string; value: string | null; players: Player[];
  onChange: (v: string) => void; attr: 'penalties' | 'freeKicks' | 'corners' | 'leadership';
}) {
  const sorted = [...players].sort((a, b) => b.attributes[attr] - a.attributes[attr]);
  return (
    <label className="setpiece">
      <span className="dim mini">{label}</span>
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        {sorted.map((p) => (
          <option key={p.id} value={p.id}>{p.lastName} ({p.attributes[attr]})</option>
        ))}
      </select>
    </label>
  );
}
