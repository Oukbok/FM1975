// =============================================================================
// Wechsel-/Taktik-Bildschirm des Textmodus (Vorbild EA, Halbzeit-Bildschirm):
// öffnet sich zur Halbzeit, über „Wechsel / Taktik“ oder wenn eine Option das
// Spiel anhält. Reiter Aufstellung | Halbzeitansprache | Spielergespräche.
// Alle Änderungen sind ein Entwurf und gelten erst mit „Bestätigen“.
// =============================================================================
import { useState } from 'react';
import ClubCrest from '../../../components/ClubCrest';
import Icon from '../../../components/Icon';
import type { MatchSim } from '../../../engine/match/sim';
import type { Side } from '../../../engine/match/types';
import { MENTALITY_LABEL, type Mentality } from '../../../engine/match/types';
import { InfoTip } from '../../../ui/InfoTip';
import { applyDraft, changeFormation, draftDiff, draftTeamStrength, initialDraft, swap, type Draft } from './draft';
import { PlayerTable } from './PlayerTable';
import { SystemPitch } from './SystemPitch';
import { HalftimeTalk, PlayerTalks, TacticPane } from './TalkTabs';
import Select from '../../../ui/Select';

export type ChangesTab = 'aufstellung' | 'ansprache' | 'gespraeche';

export function ChangesScreen({ sim, side, reason, halftime, initialTab, initialPane, autoSubs, onAutoSubs, onConfirm, onCancel, onPlayer }: {
  sim: MatchSim; side: Side; reason: string | null; halftime: boolean;
  initialTab?: ChangesTab; initialPane?: 'system' | 'taktik';
  autoSubs: boolean; onAutoSubs: (v: boolean) => void;
  /** Entwurf anwenden (läuft über act → wird erzählt) und weiter. */
  onConfirm: (apply: () => void) => void;
  onCancel: () => void;
  onPlayer: (id: string) => void;
}) {
  const [d, setD] = useState<Draft>(() => initialDraft(sim, side));
  const [tab, setTab] = useState<ChangesTab>(initialTab ?? 'aufstellung');
  const [pane, setPane] = useState<'system' | 'taktik'>(initialPane ?? 'system');
  const [sel, setSel] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const t = sim.team(side);
  const H = sim.home.club, A = sim.away.club;
  const [hs, as] = sim.score();
  const upd = (f: (x: Draft) => void) => setD((x) => { const n = { ...x, tactics: { ...x.tactics }, talks: { ...x.talks } }; f(n); return n; });
  const doSwap = (a: string, b: string) => {
    const n = { ...d, map: { ...d.map } };
    const err = swap(sim, side, n, a, b);
    setMsg(err);
    if (!err) setD(n);
    setSel(null);
  };
  const pick = (key: string) => {
    if (!sel) { setSel(key); setMsg(null); return; }
    if (sel === key) { setSel(null); return; }
    doSwap(sel, key);
  };
  const { ins } = draftDiff(sim, side, d);
  const left = sim.subsLeft(t) - ins.length;
  const minute = sim.phase === 'halftime' ? 'Halbzeit' : `${sim.minute}${sim.stoppage ? `+${sim.stoppage}` : ''}. Spielminute`;
  const gk = d.slots.find((s) => s.position === 'TW');
  const gkWarn = gk && d.map[gk.id] && sim.players[d.map[gk.id]]?.naturalPosition !== 'TW';

  return (
    <div className="tm-cs" role="dialog" aria-label="Wechsel und Taktik">
      <div className="tm-cs-top">
        <ClubCrest club={t.club} size={44} />
        <span className="tm-cs-title">{t.club.name}, {sim.phase === 'halftime' ? 'Halbzeit' : 'Spielunterbrechung'}</span>
        <div className="tm-cs-score">
          <ClubCrest club={H} size={64} />
          <span className="tm-cs-tn">{H.name}</span>
          <b>{hs}:{as}</b>
          <span className="tm-cs-tn">{A.name}</span>
          <ClubCrest club={A} size={64} />
        </div>
        <button type="button" className="tm-cs-x" aria-label="Schließen ohne Änderungen" onClick={onCancel}><span aria-hidden>×</span></button>
      </div>

      <div className="tm-cs-tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'aufstellung'} className={tab === 'aufstellung' ? 'on' : ''} onClick={() => setTab('aufstellung')}>Aufstellung</button>
        {halftime && <button role="tab" aria-selected={tab === 'ansprache'} className={tab === 'ansprache' ? 'on' : ''} onClick={() => setTab('ansprache')}>Halbzeitansprache</button>}
        <button role="tab" aria-selected={tab === 'gespraeche'} className={tab === 'gespraeche' ? 'on' : ''} onClick={() => setTab('gespraeche')}>Spielergespräche</button>
        <div className="tm-cs-minute"><Icon name="hourglass" size={30} /> {minute}</div>
        {reason && <div className="tm-cs-reason">Angehalten: {reason}</div>}
      </div>

      <div className="tm-cs-body">
        {tab === 'aufstellung' && (
          <div className="tm-cs-grid">
            <div className="tm-cs-left">
              <div className="tm-cs-lhead">
                <span className="tm-sec">Spielerliste</span>
                <span>Mannschaftsstärke: <b>{draftTeamStrength(sim, side, d)}</b> <InfoTip k="mannschaftsstaerke" /></span>
                <label className="tm-cs-ment">Ausrichtung <Select value={d.mentality} onChange={(v) => upd((x) => { x.mentality = Number(v) as Mentality; })} aria-label="Ausrichtung">
                  {([-2, -1, 0, 1, 2] as Mentality[]).map((m) => <option key={m} value={m}>{MENTALITY_LABEL[m]}</option>)}
                </Select></label>
              </div>
              <PlayerTable sim={sim} side={side} d={d} sel={sel} onPick={pick} onPlayer={onPlayer} />
              <div className="tm-cs-lfoot">
                <span className="tm-cs-left-n">Verbleibende Wechsel: <b>{Math.max(0, left)}</b></span>
                <button type="button" className={`ms-btn ${pane === 'taktik' ? 'on' : ''}`} onClick={() => setPane(pane === 'taktik' ? 'system' : 'taktik')}>
                  <Icon name="tactics" size={22} /> {pane === 'taktik' ? 'Spielsystem zeigen' : 'Taktik öffnen'}
                </button>
                <button type="button" className="ms-btn ghost" onClick={() => { setD(initialDraft(sim, side)); setSel(null); setMsg(null); }}>Zurücksetzen</button>
                <div className="tm-cs-auto">
                  <span className="tm-sec">Auswechslungen</span>
                  <label className="tm-radio"><input type="radio" checked={!autoSubs} onChange={() => onAutoSubs(false)} /> Manuell</label>
                  <label className="tm-radio"><input type="radio" checked={autoSubs} onChange={() => onAutoSubs(true)} /> Co-Trainer wechselt automatisch</label>
                </div>
              </div>
              {(msg || gkWarn || sel) && (
                <div className={`tm-cs-msg ${msg || gkWarn ? 'warn' : ''}`}>
                  {msg ?? (gkWarn ? 'Im Tor steht kein Torwart.' : 'Jetzt den Spieler wählen, mit dem getauscht wird – oder auf dem Feld ziehen.')}
                </div>
              )}
            </div>
            <div className="tm-cs-right">
              {pane === 'system'
                ? <SystemPitch sim={sim} side={side} d={d} sel={sel} onPick={pick} onSwap={doSwap}
                    onFormation={(id) => upd((x) => { changeFormation(sim, side, x, id); })} />
                : <TacticPane sim={sim} side={side} d={d} onMentality={(m) => upd((x) => { x.mentality = m; })}
                    onTactic={(p) => upd((x) => { x.tactics = { ...x.tactics, ...p }; })} />}
            </div>
          </div>
        )}
        {tab === 'ansprache' && <HalftimeTalk sim={sim} side={side} d={d} onChange={(v) => upd((x) => { x.talk = v; })} />}
        {tab === 'gespraeche' && <PlayerTalks sim={sim} side={side} d={d} onChange={(id, k) => upd((x) => { if (k) x.talks[id] = k; else delete x.talks[id]; })} />}
      </div>

      <div className="tm-cs-foot">
        <span className="tm-dim">{ins.length ? `${ins.length} Wechsel geplant. ` : ''}Änderungen gelten erst mit „Bestätigen“.</span>
        <button type="button" className="ms-btn ghost" onClick={onCancel}>Abbrechen</button>
        <button type="button" className="btn-primary tm-cs-ok" onClick={() => onConfirm(() => applyDraft(sim, side, d))}>
          <Icon name="play" size={22} /> Bestätigen
        </button>
      </div>
    </div>
  );
}
