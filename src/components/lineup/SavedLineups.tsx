// =============================================================================
// Aufstellungen speichern & laden (Wunsch Pascal): Fenster aus Aufstellung ›
// Aufstellung. Gespeichert am Spielstand im optionalen `game.savedLineups`
// (höchstens 12): Formation, Startelf je Slot, Bank, eigene Slot-Lagen, Kapitän und
// Standardschützen. Beim Laden fallen Spieler, die nicht mehr im Kader sind, weg;
// freie Plätze füllt die Engine beim Anpfiff (resolveLineup).
// =============================================================================
import { useState } from 'react';
import type { Player, Tactics } from '../../types';
import type { Game } from '../../game/state';
import { getFormation } from '../../data/formations';
import { syncLineup } from './lineupOps';

export interface SavedLineup {
  id: string;
  name: string;
  date: string;
  formation: string;
  lineupMap: Record<string, string>;
  substitutes: string[];
  slotLayout?: Tactics['slotLayout'];
  captainId: string | null;
  penaltyTakerId: string | null;
  freeKickTakerId: string | null;
  cornerTakerId: string | null;
}

export const MAX_SAVED = 12;

export function savedLineups(g: Game): SavedLineup[] {
  return (g.savedLineups ??= []);
}

export function saveLineup(g: Game, t: Tactics, name: string): SavedLineup | null {
  const list = savedLineups(g);
  if (list.length >= MAX_SAVED) return null;
  const s: SavedLineup = {
    id: `lu${Date.now().toString(36)}${list.length}`, name: name.trim() || `Aufstellung ${list.length + 1}`, date: g.calendar.currentDate,
    formation: t.formation, lineupMap: { ...(t.lineupMap ?? {}) }, substitutes: [...(t.substitutes ?? [])],
    slotLayout: t.slotLayout ? JSON.parse(JSON.stringify(t.slotLayout)) : undefined,
    captainId: t.captainId, penaltyTakerId: t.penaltyTakerId, freeKickTakerId: t.freeKickTakerId, cornerTakerId: t.cornerTakerId,
  };
  list.push(s);
  return s;
}

/** Lädt eine gespeicherte Aufstellung; Rückgabe = Zahl der fehlenden Spieler. */
export function loadLineup(g: Game, t: Tactics, s: SavedLineup, benchSize: number): number {
  const club = g.clubs[g.managedClubId];
  const inSquad = new Set(club.playerIds);
  let missing = 0;
  const map: Record<string, string> = {};
  for (const [slot, pid] of Object.entries(s.lineupMap)) { if (inSquad.has(pid)) map[slot] = pid; else missing++; }
  t.formation = s.formation;
  t.slotLayout = s.slotLayout ? JSON.parse(JSON.stringify(s.slotLayout)) : undefined;
  t.lineupMap = map;
  t.substitutes = s.substitutes.filter((id) => inSquad.has(id));
  const keep = (id: string | null) => (id && inSquad.has(id) ? id : null);
  t.captainId = keep(s.captainId) ?? t.captainId;
  t.penaltyTakerId = keep(s.penaltyTakerId) ?? t.penaltyTakerId;
  t.freeKickTakerId = keep(s.freeKickTakerId) ?? t.freeKickTakerId;
  t.cornerTakerId = keep(s.cornerTakerId) ?? t.cornerTakerId;
  syncLineup(t, benchSize);
  return missing;
}

const dmy = (d: string) => `${d.slice(8, 10)}.${d.slice(5, 7)}.${d.slice(0, 4)}`;

export default function SavedLineupsModal({ g, t, benchSize, onClose, onChanged }: {
  g: Game; t: Tactics; benchSize: number; onClose: () => void; onChanged: () => void;
}) {
  const list = savedLineups(g);
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  const [del, setDel] = useState<string | null>(null);
  const players = g.players as Record<string, Player>;
  const club = g.clubs[g.managedClubId];
  const doSave = () => {
    const s = saveLineup(g, t, name);
    if (!s) { setMsg(`Höchstens ${MAX_SAVED} Aufstellungen – lösche zuerst eine.`); return; }
    setName(''); setMsg(`„${s.name}“ gespeichert.`); onChanged();
  };
  const doLoad = (s: SavedLineup) => {
    const miss = loadLineup(g, t, s, benchSize);
    onChanged();
    setMsg(miss ? `„${s.name}“ geladen – ${miss} ${miss === 1 ? 'Spieler ist' : 'Spieler sind'} nicht mehr im Kader, die Plätze sind frei.` : `„${s.name}“ geladen.`);
  };
  const doDel = (s: SavedLineup) => {
    const i = list.indexOf(s);
    if (i >= 0) list.splice(i, 1);
    setDel(null); setMsg(`„${s.name}“ gelöscht.`); onChanged();
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal lu-saved" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Aufstellungen speichern und laden">
        <div className="lu-saved-head">
          <h2>Aufstellungen</h2>
          <button className="modal-close" onClick={onClose} aria-label="Schließen">×</button>
        </div>
        <div className="lu-saved-new">
          <input className="lu-saved-in" value={name} maxLength={40} placeholder="Name, z. B. Heimspiel 4-4-2" onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') doSave(); }} />
          <button className="b3 b3-primary" onClick={doSave} disabled={list.length >= MAX_SAVED}>Aktuelle speichern</button>
        </div>
        <div className="lu-saved-msg">{msg}</div>
        <div className="lu-saved-list">
          {list.length === 0 && <div className="dnote">Noch keine Aufstellung gespeichert. Gespeichert werden Formation, Startelf, Bank, eigene Positionen, Kapitän und Standardschützen.</div>}
          {[...list].reverse().map((s) => {
            const xi = Object.values(s.lineupMap);
            const gone = xi.filter((id) => !club.playerIds.includes(id)).length;
            return (
              <div key={s.id} className="lu-saved-row">
                <span className="lu-saved-main">
                  <b>{s.name}</b>
                  <span className="lu-saved-sub">{getFormation(s.formation).label} · {dmy(s.date)}{gone ? ` · ${gone} nicht mehr im Kader` : ''}</span>
                  <span className="lu-saved-sub">{xi.map((id) => players[id]?.lastName).filter(Boolean).slice(0, 11).join(', ')}</span>
                </span>
                <span className="lu-saved-acts">
                  <button className="b3 b3-s" onClick={() => doLoad(s)}>Laden</button>
                  {del === s.id
                    ? <button className="b3 b3-s" onClick={() => doDel(s)}>Wirklich löschen</button>
                    : <button className="b3 b3-s" onClick={() => setDel(s.id)}>Löschen</button>}
                </span>
              </div>
            );
          })}
        </div>
        <div className="lu-saved-foot">{list.length} von {MAX_SAVED} Plätzen belegt</div>
      </div>
    </div>
  );
}
