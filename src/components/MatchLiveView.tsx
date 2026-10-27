// =============================================================================
// MATCH-TEXTMODUS — Spielbericht im EA-Fussball-Manager-Stil (Textphasen)
// =============================================================================
// Ablauf:
//  1) VOR-ANPFIFF: Das Fenster öffnet im Ruhezustand (0:0). Zu sehen sind die
//     Anzeigetafel, das Stadion-/Zuschauer-/Wetter-Panel und die eigene
//     Aufstellung. Erst ein Klick auf „Spiel simulieren" startet die Textphasen.
//  2) LIVE: Die (deterministisch simulierten) Events werden als Kommentar-Zeilen
//     nach und nach eingeblendet; der Spielstand wächst mit.
//  3) ABPFIFF: Weiter zum ausführlichen Spielbericht.
// =============================================================================
import { useState, useRef, useEffect, useMemo } from 'react';
import { Player } from '../types';
import ClubCrest from './ClubCrest';
import Icon from './Icon';
import {
  textRng, hashStr, CommentaryTokens, resolveShot, say,
  AUFBAU, CHANCE_AUFBAU, SPANNUNG, FOUL, GELB, ROT, GELBROT,
  ECKE, FREISTOSS, ABSEITS, VERLETZUNG, KICKOFF, JUBEL,
} from '../data/commentary';

interface G { clubs: Record<string, any>; players: Record<string, Player>; managedClubId?: string; }

interface Line {
  minute: number;
  text: string;
  kind: 'normal' | 'goal' | 'chance' | 'card' | 'whistle';
  // Gruppierung: alle Zeilen desselben Ursprungs-Ereignisses teilen sich groupId.
  groupId?: number;
  // 'goal'/'chance' → hervorgehobene Unterbox, 'plain' → schlichte Zeile.
  group?: 'goal' | 'chance' | 'plain';
  // Vorberechnete Anzeige-Uhr & Balkenstände (deterministisch aus dem Event-Stream).
  clock?: string;
  barL?: number;
  barR?: number;
  isET?: boolean;
}

/** Gruppentyp eines Ereignisses (für die Unterbox-Darstellung). */
function eventGroup(type: string): 'goal' | 'chance' | 'plain' {
  if (type === 'goal' || type === 'penalty_goal' || type === 'own_goal' || type === 'shootout_goal') return 'goal';
  if (type === 'chance' || type === 'save' || type === 'penalty_missed' || type === 'penalty_saved') return 'chance';
  return 'plain';
}

const clampPct = (x: number) => Math.max(0, Math.min(100, Math.round(x)));

/** Nachspielzeit je Halbzeit deterministisch aus der Foul-Anzahl (mehr Fouls → mehr). */
interface AddedTime { h1: number; h2: number; e1: number; e2: number; }
function computeAddedTime(events: any[]): AddedTime {
  const foulsIn = (lo: number, hi: number) =>
    events.filter((e) => e.type === 'foul' && e.minute >= lo && e.minute <= hi).length;
  const add = (n: number) => Math.max(1, Math.min(6, Math.round(n / 2)));
  return { h1: add(foulsIn(1, 45)), h2: add(foulsIn(46, 90)), e1: add(foulsIn(91, 105)), e2: add(foulsIn(106, 120)) };
}

/** Uhr-Text & Balkenstände (links = 1. HZ, rechts = 2. HZ) für ein Ereignis. */
function segFor(etype: string, m: number, etActive: boolean, A: AddedTime): { clock: string; barL: number; barR: number; isET: boolean } {
  if (etype === 'half_time') return { clock: `45+${A.h1}`, barL: 100, barR: 0, isET: false };
  if (etype === 'extra_time_start') return { clock: `90+${A.h2}`, barL: 0, barR: 0, isET: true };
  if (etype === 'extra_time_half') return { clock: `105+${A.e1}`, barL: 100, barR: 0, isET: true };
  if (etype === 'extra_time_end') return { clock: '120', barL: 100, barR: 100, isET: true };
  if (etype === 'shootout_start' || etype === 'shootout_goal' || etype === 'shootout_miss' || etype === 'shootout_end')
    return { clock: '120', barL: 100, barR: 100, isET: true };
  if (etype === 'full_time') {
    return etActive
      ? { clock: '120', barL: 100, barR: 100, isET: true }
      : { clock: `90+${A.h2}`, barL: 100, barR: 100, isET: false };
  }
  // Reguläre Ereignisse anhand der Minute.
  const et = etActive || m > 90;
  if (et) {
    if (m <= 105) return { clock: String(m), barL: clampPct(((m - 90) / (15 + A.e1)) * 100), barR: 0, isET: true };
    return { clock: String(m), barL: 100, barR: clampPct(((m - 105) / (15 + A.e2)) * 100), isET: true };
  }
  if (m <= 45) return { clock: String(m), barL: clampPct((m / (45 + A.h1)) * 100), barR: 0, isET: false };
  return { clock: String(m), barL: 100, barR: clampPct(((m - 45) / (45 + A.h2)) * 100), isET: false };
}

const SPEEDS: { id: string; label: string; delay: number }[] = [
  { id: 'langsam', label: 'Langsam', delay: 1600 },
  { id: 'normal', label: 'Normal', delay: 850 },
  { id: 'schnell', label: 'Schnell', delay: 320 },
  { id: 'skip', label: 'Überspringen', delay: 0 },
];

// Kleiner, deterministischer Wetter- & Temperatur-„Generator" pro Spiel.
const WETTER = ['Sonnig', 'Leicht bewölkt', 'Bewölkt', 'Nieselregen', 'Regnerisch', 'Windig', 'Klar & kühl'];
function matchWeather(matchId: string): { label: string; temp: number } {
  const rng = textRng(hashStr(matchId + ':wetter'));
  const label = WETTER[Math.floor(rng() * WETTER.length)];
  const temp = 4 + Math.floor(rng() * 24); // 4–27 °C
  return { label, temp };
}

/** Baut aus den (deterministisch simulierten) Events die Textzeilen auf. */
function buildLines(g: G, matchId: string, events: any[], homeId: string, awayId: string): Line[] {
  const lines: Line[] = [];
  const nameOf = (pid?: string) => (pid && g.players[pid] ? g.players[pid].lastName : 'ein Spieler');
  const teamOf = (cid: string) => g.clubs[cid]?.shortName ?? 'die Elf';
  const gkOf = (cid: string) => {
    const club = g.clubs[cid];
    const gk = (club?.playerIds as string[] || []).map((id) => g.players[id])
      .find((p) => p && p.naturalPosition === 'TW');
    return gk ? gk.lastName : 'der Torwart';
  };

  const A = computeAddedTime(events);
  let etActive = false;
  let gid = 0;

  for (const e of events) {
    gid++;
    // Zeilen dieses Ereignisses zunächst separat sammeln, dann gemeinsam stempeln.
    const before = lines.length;
    const rng = textRng(hashStr(matchId + ':' + e.id + ':' + e.minute));
    const oppId = e.clubId === homeId ? awayId : homeId;
    const tok: CommentaryTokens = {
      spieler: nameOf(e.playerId),
      team: teamOf(e.clubId),
      gegner: teamOf(oppId),
      torwart: gkOf(oppId),
      vorlage: nameOf(e.secondaryPlayerId),
    };
    switch (e.type) {
      case 'kickoff':
        lines.push({ minute: e.minute, text: say(KICKOFF, tok, rng), kind: 'whistle' });
        break;
      case 'goal': case 'penalty_goal': case 'own_goal': {
        // Aufbau → Chance → Spannung → Torjubel (mehrere Textbausteine).
        lines.push({ minute: e.minute, text: say(AUFBAU, tok, rng), kind: 'normal' });
        lines.push({ minute: e.minute, text: say(CHANCE_AUFBAU, tok, rng), kind: 'chance' });
        lines.push({ minute: e.minute, text: say(SPANNUNG, tok, rng), kind: 'chance' });
        lines.push({ minute: e.minute, text: resolveShot('goal', tok, rng), kind: 'goal' });
        lines.push({ minute: e.minute, text: say(JUBEL, tok, rng), kind: 'goal' });
        break;
      }
      case 'chance': case 'save': {
        lines.push({ minute: e.minute, text: say(AUFBAU, tok, rng), kind: 'normal' });
        lines.push({ minute: e.minute, text: say(CHANCE_AUFBAU, tok, rng), kind: 'chance' });
        lines.push({ minute: e.minute, text: say(SPANNUNG, tok, rng), kind: 'chance' });
        const out = e.type === 'save' ? 'save' : (rng() < 0.5 ? 'miss' : (rng() < 0.5 ? 'blocked' : 'post'));
        lines.push({ minute: e.minute, text: resolveShot(out as any, tok, rng), kind: 'normal' });
        break;
      }
      case 'penalty_missed': case 'penalty_saved':
        lines.push({ minute: e.minute, text: say(SPANNUNG, tok, rng), kind: 'chance' });
        lines.push({ minute: e.minute, text: resolveShot(e.type === 'penalty_saved' ? 'save' : 'miss', tok, rng), kind: 'normal' });
        break;
      case 'yellow_card': lines.push({ minute: e.minute, text: say(GELB, tok, rng), kind: 'card' }); break;
      case 'red_card': lines.push({ minute: e.minute, text: say(ROT, tok, rng), kind: 'card' }); break;
      case 'yellow_red_card': lines.push({ minute: e.minute, text: say(GELBROT, tok, rng), kind: 'card' }); break;
      case 'foul': lines.push({ minute: e.minute, text: say(FOUL, tok, rng), kind: 'normal' }); break;
      case 'corner': lines.push({ minute: e.minute, text: say(ECKE, tok, rng), kind: 'normal' }); break;
      case 'free_kick': lines.push({ minute: e.minute, text: say(FREISTOSS, tok, rng), kind: 'normal' }); break;
      case 'offside': lines.push({ minute: e.minute, text: say(ABSEITS, tok, rng), kind: 'normal' }); break;
      case 'injury': lines.push({ minute: e.minute, text: say(VERLETZUNG, tok, rng), kind: 'normal' }); break;
      case 'half_time': lines.push({ minute: 45, text: e.commentary || 'Halbzeit! Die Mannschaften gehen in die Kabine.', kind: 'whistle' }); break;
      case 'full_time': lines.push({ minute: e.minute || 90, text: e.commentary || 'Abpfiff! Das Spiel ist zu Ende.', kind: 'whistle' }); break;
      // Landespokal: Verlängerung & Elfmeterschießen (Kommentar kommt aus der Engine).
      case 'extra_time_start': case 'extra_time_half': case 'extra_time_end':
        if (e.commentary) lines.push({ minute: e.minute, text: e.commentary, kind: 'whistle' });
        break;
      case 'shootout_start': case 'shootout_end':
        if (e.commentary) lines.push({ minute: e.minute, text: e.commentary, kind: 'whistle' });
        break;
      case 'shootout_goal':
        if (e.commentary) lines.push({ minute: e.minute, text: e.commentary, kind: 'goal' });
        break;
      case 'shootout_miss':
        if (e.commentary) lines.push({ minute: e.minute, text: e.commentary, kind: 'card' });
        break;
      default:
        if (e.commentary) lines.push({ minute: e.minute, text: e.commentary, kind: 'normal' });
    }
    // Verlängerung ab extra_time_start aktiv (wirkt auf nachfolgende Ereignisse).
    if (e.type === 'extra_time_start') etActive = true;
    // Alle in diesem Durchlauf erzeugten Zeilen einheitlich stempeln.
    const grp = eventGroup(e.type);
    const seg = segFor(e.type, e.minute, etActive, A);
    for (let i = before; i < lines.length; i++) {
      lines[i].groupId = gid;
      lines[i].group = grp;
      lines[i].clock = seg.clock;
      lines[i].barL = seg.barL;
      lines[i].barR = seg.barR;
      lines[i].isET = seg.isET;
    }
  }
  return lines;
}

/** Klassische 70er-Analog-Stoppuhr mit aktueller Minute im Zentrum. */
function Stopwatch({ label, et }: { label: string; et: boolean }) {
  const ticks = Array.from({ length: 12 }, (_, i) => i);
  return (
    <div className="live-watch">
      <span className={`live-etlabel${et ? '' : ' hidden'}`}>Verlängerung</span>
      <svg viewBox="0 0 100 118" className="live-watch-svg" role="img" aria-label={`Minute ${label}`}>
        {/* Krone & seitliche Drücker oben */}
        <rect x="45" y="1" width="10" height="7" rx="2" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <rect x="47.5" y="7" width="5" height="6" rx="1.5" fill="currentColor" />
        <rect x="17" y="23" width="9" height="6" rx="3" fill="currentColor" opacity="0.85" transform="rotate(-40 21 26)" />
        <rect x="74" y="23" width="9" height="6" rx="3" fill="currentColor" opacity="0.85" transform="rotate(40 79 26)" />
        {/* Gehäuse */}
        <circle cx="50" cy="66" r="46" fill="#0b1822" stroke="var(--accent)" strokeWidth="3" />
        <circle cx="50" cy="66" r="40" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
        {/* Minutenstriche */}
        {ticks.map((i) => {
          const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
          const r1 = 40, r2 = i % 3 === 0 ? 32 : 36;
          return (
            <line key={i}
              x1={50 + Math.cos(a) * r1} y1={66 + Math.sin(a) * r1}
              x2={50 + Math.cos(a) * r2} y2={66 + Math.sin(a) * r2}
              stroke="currentColor" strokeWidth={i % 3 === 0 ? 2 : 1} opacity="0.75" />
          );
        })}
        {/* Aktuelle Minute im Zentrum */}
        <text x="50" y="60" textAnchor="middle" dominantBaseline="central" className="live-watch-min">{label}</text>
        {/* dezenter Sekunden-Subdial */}
        <circle cx="50" cy="88" r="9" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
        <line x1="50" y1="88" x2="50" y2="81" stroke="var(--accent)" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

export default function MatchLiveView({ g, matchId, onClose }: { g: G; matchId: string; onClose: () => void }) {
  // Match aus dem Spielzustand holen (Liga liegt in fixtures, Pokal in cup.rounds).
  let match = (g as any).fixtures?.find((x: any) => x.id === matchId);
  if (!match && (g as any).cup) {
    for (const round of (g as any).cup.rounds || []) {
      const t = (round.ties || []).find((x: any) => x.id === matchId);
      if (t && t.match) { match = t.match; break; }
    }
  }
  const homeId = match.homeClubId, awayId = match.awayClubId;
  const home = g.clubs[homeId], away = g.clubs[awayId];

  const lines = useMemo(() => buildLines(g, matchId, match.events || [], homeId, awayId),
    [matchId]);

  const [started, setStarted] = useState(false);  // vor Anpfiff = false
  const [idx, setIdx] = useState(0);               // wie viele Zeilen gezeigt
  const [speed, setSpeed] = useState('normal');
  const [paused, setPaused] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  const finished = started && idx >= lines.length;

  useEffect(() => {
    if (!started || paused || finished) return;
    const sp = SPEEDS.find((s) => s.id === speed)!;
    if (sp.delay === 0) { setIdx(lines.length); return; }
    const tmr = setTimeout(() => setIdx((i) => Math.min(i + 1, lines.length)), sp.delay);
    return () => clearTimeout(tmr);
  }, [started, idx, speed, paused, finished, lines.length]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [idx]);

  // Laufender Spielstand: Tor-Events bis zur aktuellen Minute zählen.
  const shown = lines.slice(0, idx);
  let hg = 0, ag = 0, curMin = 0;
  const goalEvents = (match.events || []).filter((e: any) =>
    ['goal', 'penalty_goal', 'own_goal'].includes(e.type));
  for (const ln of shown) curMin = Math.max(curMin, ln.minute);
  for (const ge of goalEvents) {
    if (ge.minute <= curMin && shown.some((l: Line) => l.kind === 'goal' && l.minute === ge.minute)) {
      const scoringHome = ge.type === 'own_goal' ? ge.clubId !== homeId : ge.clubId === homeId;
      if (scoringHome) hg++; else ag++;
    }
  }

  // --- Infopanel-Daten -------------------------------------------------------
  const stadium = home?.stadium;
  const attendance = match?.result?.attendance
    ?? Math.round((stadium?.capacity ?? 0) * (stadium?.averageAttendanceRate ?? 0.6));
  const wetter = matchWeather(matchId);

  // Eigenes Team (Manager-Verein) für Kader-/Bank-Übersicht.
  const myId = g.managedClubId;
  const myClub = myId ? g.clubs[myId] : (home?.isPlayerControlled ? home : away);
  const tac = myClub?.tactics;
  const toRow = (pid: string) => {
    const p = g.players[pid];
    if (!p) return null;
    return { id: pid, num: p.shirtNumber, pos: p.naturalPosition, name: p.lastName, ovr: p.overall };
  };
  const startingXI = (tac?.startingXI ?? myClub?.playerIds?.slice(0, 11) ?? [])
    .map(toRow).filter(Boolean) as { id: string; num: number; pos: string; name: string; ovr: number }[];
  const bench = (tac?.substitutes ?? [])
    .map(toRow).filter(Boolean) as { id: string; num: number; pos: string; name: string; ovr: number }[];

  // Aktuelle Anzeige (Uhr + Doppel-Balken) aus der zuletzt gezeigten Zeile ableiten.
  const cur = shown.length ? shown[shown.length - 1] : null;
  const watchLabel = started ? (cur?.clock ?? '0') : '—';
  const barL = started && cur ? (cur.barL ?? 0) : 0;
  const barR = started && cur ? (cur.barR ?? 0) : 0;
  const isET = !!(started && cur && cur.isET);

  // Aufeinanderfolgende Zeilen mit gleicher groupId zu einer Unterbox bündeln.
  const groups: { id: number; group: 'goal' | 'chance' | 'plain'; minute: number; lines: Line[] }[] = [];
  for (const l of shown) {
    const last = groups[groups.length - 1];
    if (last && last.id === l.groupId) last.lines.push(l);
    else groups.push({ id: l.groupId ?? 0, group: l.group ?? 'plain', minute: l.minute, lines: [l] });
  }

  const SquadTable = ({ rows }: { rows: typeof startingXI }) => (
    <table className="live-squad">
      <tbody>
        {rows.map((r) => (
          <tr key={r.id}>
            <td className="ls-num">{r.num}</td>
            <td className="ls-pos">{r.pos}</td>
            <td className="ls-name">{r.name}</td>
            <td className="ls-ovr">{r.ovr}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="modal-overlay">
      <div className="modal live-modal" onClick={(e) => e.stopPropagation()}>
        {/* Kopf: Anzeigetafel (Wappen + Spielstand + Minute + Zeitleiste) */}
        <div className="live-head">
          <div className="live-team"><ClubCrest club={home} size={40} /><span>{home.shortName}</span></div>
          <div className="live-score">
            <div className="big-num" style={{ color: 'var(--accent)' }}>{hg}:{ag}</div>
          </div>
          <div className="live-team"><span>{away.shortName}</span><ClubCrest club={away} size={40} /></div>
        </div>
        {/* Doppel-Fortschrittsbalken mit 70er-Stoppuhr in der Mitte:
            links = 1. Halbzeit, rechts = 2. Halbzeit (in der Verlängerung je 15 Min). */}
        <div className="live-bars">
          <div className="live-bar"><span className="live-bar-fill" style={{ width: `${barL}%` }} /></div>
          <Stopwatch label={watchLabel} et={isET} />
          <div className="live-bar"><span className="live-bar-fill" style={{ width: `${barR}%` }} /></div>
        </div>

        {/* Körper: Ticker links, Infopanel rechts */}
        <div className="live-body">
          <div className="live-main">
            <div className="live-log" ref={logRef}>
              {!started && (
                <div className="live-prekick">
                  <Icon name="matchball" size={44} className="live-prekick-icon" />
                  <div className="live-prekick-title">{home.name} – {away.name}</div>
                  <div className="dim mini">Die Mannschaften stehen bereit. Starte die Simulation, um den Spielverlauf Zug um Zug mitzuerleben.</div>
                </div>
              )}
              {started && groups.map((gr, gi) => (
                gr.group === 'plain' ? (
                  gr.lines.map((l, i) => (
                    <div key={`${gi}-${i}`} className={`live-line ${l.kind}`}>
                      <span className="live-line-min">{l.minute}'</span>
                      <span>{l.text}</span>
                    </div>
                  ))
                ) : (
                  <div key={gi} className={`live-group ${gr.group}`}>
                    <span className="live-group-min">{gr.minute}'</span>
                    <div className="live-group-body">
                      {gr.lines.map((l, i) => (
                        <div key={i} className={`live-gline ${l.kind}`}>{l.text}</div>
                      ))}
                    </div>
                  </div>
                )
              ))}
              {started && shown.length === 0 && <div className="dim mini">Anpfiff steht bevor …</div>}
            </div>
          </div>

          <aside className="live-side">
            {/* Stadion / Zuschauer / Wetter */}
            <div className="live-box">
              <div className="live-box-head"><Icon name="stadium" size={15} /><span>Stadion</span></div>
              <div className="live-info-row"><span className="dim">Arena</span><span>{stadium?.name ?? '—'}</span></div>
              <div className="live-info-row"><span className="dim">Zuschauer</span><span>{attendance.toLocaleString('de-DE')}</span></div>
              <div className="live-info-row"><span className="dim">Kapazität</span><span>{(stadium?.capacity ?? 0).toLocaleString('de-DE')}</span></div>
              <div className="live-info-row"><span className="dim">Wetter</span><span>{wetter.label}, {wetter.temp}°C</span></div>
            </div>

            {/* Eigene Aufstellung */}
            <div className="live-box">
              <div className="live-box-head"><Icon name="lineup" size={15} /><span>Aufstellung · {myClub?.shortName ?? ''}</span></div>
              {startingXI.length > 0
                ? <SquadTable rows={startingXI} />
                : <div className="dim mini">Keine Aufstellung hinterlegt.</div>}
            </div>

            {/* Ersatzbank */}
            {bench.length > 0 && (
              <div className="live-box">
                <div className="live-box-head"><Icon name="squad" size={15} /><span>Ersatzbank</span></div>
                <SquadTable rows={bench} />
              </div>
            )}
          </aside>
        </div>

        {/* Steuerung */}
        <div className="live-controls">
          {!started ? (
            <button className="btn-continue fixed live-startbtn" onClick={() => setStarted(true)}>
              <Icon name="matchball" size={18} /> Spiel simulieren
            </button>
          ) : !finished ? (
            <>
              <div className="chip-row">
                {SPEEDS.map((s) => (
                  <button key={s.id} className={`chip ${speed === s.id ? 'active' : ''}`}
                    onClick={() => setSpeed(s.id)}>{s.label}</button>
                ))}
              </div>
              <button className="btn-sm btn-ghost" onClick={() => setPaused((p) => !p)}>
                {paused ? 'Fortsetzen' : 'Pause'}
              </button>
            </>
          ) : (
            <button className="btn-continue fixed" onClick={onClose}>Zum Spielbericht</button>
          )}
        </div>
      </div>
    </div>
  );
}
