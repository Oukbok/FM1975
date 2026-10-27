// =============================================================================
// SPIELBERICHT – großes Fenster: Verlauf, zeitgemäße Statistik, Aufstellungen
// mit Noten, Druckphasen. Ausführliche Werte gibt es für Spiele des eigenen
// Vereins; bei anderen Partien die Eckdaten.
// =============================================================================
import ClubCrest from '../../components/ClubCrest';
import Icon from '../../components/Icon';
import { eraRules } from '../../engine/match/era';
import type { LineupEntry, MatchEventExt, MatchResultExt, TeamStats } from '../../engine/match/types';
import { findMatch } from '../../game/ownMatch';
import { Game } from '../../game/state';
import { fmtDateFull } from '../../ui/format';
import type { MatchEventType } from '../../types';
import { shortNamer } from '../../screens/match/names';

const WEATHER: Record<string, string> = {
  sonnig: 'Sonnig', bewoelkt: 'Bewölkt', regen: 'Regen', schnee: 'Schnee', hitze: 'Hitze', wind: 'Windig', nebel: 'Nebel',
};

const KEY: MatchEventType[] = ['goal', 'own_goal', 'penalty_goal', 'penalty_missed', 'penalty_saved', 'yellow_card', 'yellow_red_card',
  'red_card', 'substitution', 'injury', 'chance', 'half_time', 'extra_time_start', 'shootout_start', 'shootout_goal', 'shootout_miss', 'shootout_end'];

function evLabel(e: MatchEventExt): { tag: string; cls: string } {
  switch (e.type) {
    case 'goal': case 'penalty_goal': case 'own_goal': return { tag: 'Tor', cls: 'goal' };
    case 'yellow_card': return { tag: 'Gelb', cls: 'y' };
    case 'yellow_red_card': return { tag: 'Gelb-Rot', cls: 'r' };
    case 'red_card': return { tag: 'Rot', cls: 'r' };
    case 'substitution': return { tag: 'Wechsel', cls: 'sub' };
    case 'injury': return { tag: 'Verletzt', cls: 'inj' };
    case 'chance': return { tag: 'Chance', cls: 'ch' };
    case 'penalty_missed': case 'penalty_saved': return { tag: 'Elfer', cls: 'ch' };
    case 'shootout_goal': case 'shootout_miss': return { tag: 'i.E.', cls: 'so' };
    default: return { tag: '', cls: 'phase' };
  }
}

export function MatchModal({ g, matchId, onClose }: { g: Game; matchId: string; onClose: () => void }) {
  const found = findMatch(g, matchId);
  if (!found || !found.match.result) return null;
  const m = found.match;
  const r = m.result as MatchResultExt;
  const rep = r.report;
  const h = g.clubs[m.homeClubId], a = g.clubs[m.awayClubId];
  const year = rep?.year ?? Number(m.date.slice(0, 4));
  const av = eraRules(year).stats;
  const events = (m.events as MatchEventExt[]).filter((e) => KEY.includes(e.type));
  const motm = r.manOfTheMatchId ? g.players[r.manOfTheMatchId] : null;
  const tie = m.events.find((e) => e.type === 'shootout_end');
  const aet = m.events.some((e) => e.type === 'extra_time_start');
  const myId = g.managedClubId;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal mr-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        {/* ---------- Kopf ---------- */}
        <div className="mr-head">
          <div className="mr-meta">
            <span className="mr-comp">{found.label}</span>
            <span>{fmtDateFull(m.date)}</span>
            <span>{h?.stadium?.name}</span>
            <span>{r.attendance.toLocaleString('de-DE')} Zuschauer</span>
            {rep?.weather && <span><Icon name="weather" size={18} /> {WEATHER[rep.weather] ?? rep.weather}</span>}
          </div>
          <div className="mr-score">
            <div className={`mr-team ${m.homeClubId === myId ? 'mine' : ''}`}><ClubCrest club={h} size={92} /><b>{h?.name}</b></div>
            <div className="mr-res">
              <div className="mr-big">{r.homeGoals}<span>:</span>{r.awayGoals}</div>
              <div className="mr-sub">
                {rep && <>Halbzeit {rep.halftime[0]}:{rep.halftime[1]}</>}
                {aet && <> · n.V.</>}
                {tie?.scoreAfter && <> · {tie.scoreAfter.home}:{tie.scoreAfter.away} i.E.</>}
              </div>
            </div>
            <div className={`mr-team ${m.awayClubId === myId ? 'mine' : ''}`}><ClubCrest club={a} size={92} /><b>{a?.name}</b></div>
          </div>
          {motm && <div className="mr-motm">Spieler des Spiels: <b>{motm.firstName} {motm.lastName}</b></div>}
        </div>

        {rep?.momentum?.length ? (
          <div className="mr-mom" title="Druckphasen">
            {rep.momentum.map((v, i) => (
              <span key={i} className={i === 44 ? 'ht' : ''}>
                {v > 0.02 && <i className="up" style={{ height: `${Math.min(100, v * 160)}%` }} />}
                {v < -0.02 && <i className="dn" style={{ height: `${Math.min(100, -v * 160)}%` }} />}
              </span>
            ))}
          </div>
        ) : null}

        {/* ---------- Inhalt ---------- */}
        <div className="mr-body">
          <div className="mr-box">
            <div className="mr-box-h">Spielverlauf</div>
            <div className="mr-events">
              {events.map((e) => {
                const l = evLabel(e);
                const home = e.clubId === m.homeClubId;
                return (
                  <div key={e.id} className={`mr-ev ${l.cls} ${home ? 'h' : 'a'}`}>
                    <span className="mr-ev-min">{e.type === 'half_time' ? 'HZ' : e.stoppage ? `${e.minute}+${e.stoppage}'` : `${e.minute}'`}</span>
                    {l.tag && <span className={`mr-ev-tag ${l.cls}`}>{l.tag}</span>}
                    <span className="mr-ev-txt">{e.commentary}</span>
                  </div>
                );
              })}
              {!events.length && <div className="mr-empty">Keine besonderen Vorkommnisse.</div>}
            </div>
          </div>

          <div className="mr-box">
            <div className="mr-box-h">Statistik</div>
            <StatTable r={r} hs={rep?.home} as={rep?.away} av={av} />
          </div>

          <div className="mr-box">
            <div className="mr-box-h">Aufstellungen{rep ? ' und Noten' : ''}</div>
            {rep ? (
              <div className="mr-lineups">
                <LineupCol g={g} list={rep.lineups.home} />
                <LineupCol g={g} list={rep.lineups.away} />
              </div>
            ) : <div className="mr-empty">Für dieses Spiel liegen keine Aufstellungen vor.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatTable({ r, hs, as, av }: { r: MatchResultExt; hs?: TeamStats; as?: TeamStats; av: ReturnType<typeof eraRules>['stats'] }) {
  const rows: [string, string, string, number, number][] = [];
  const add = (l: string, h: number, a: number, f: (v: number) => string = (v) => String(v)) => rows.push([l, f(h), f(a), h, a]);
  const pct = (x: number, y: number) => (y > 0 ? Math.round((x / y) * 100) : 0);
  if (hs && as && av.xg) add('Expected Goals', hs.xg, as.xg, (v) => v.toFixed(2).replace('.', ','));
  if (av.possession) add('Ballbesitz', r.homePossession, 100 - r.homePossession, (v) => `${v} %`);
  add('Torschüsse', r.homeShots, r.awayShots);
  if (av.shotsOnTarget) add('Aufs Tor', r.homeShotsOnTarget, r.awayShotsOnTarget);
  if (hs && as && av.bigChances) add('Großchancen', hs.bigChances, as.bigChances);
  if (hs && as && av.passes) { add('Pässe', hs.passes, as.passes); add('Passquote', pct(hs.passesOk, hs.passes), pct(as.passesOk, as.passes), (v) => `${v} %`); }
  if (hs && as && av.duels) add('Zweikämpfe gewonnen', pct(hs.duelsWon, hs.duels), pct(as.duelsWon, as.duels), (v) => `${v} %`);
  if (hs && as && av.distance) add('Laufleistung', hs.distance, as.distance, (v) => `${v.toFixed(1).replace('.', ',')} km`);
  add('Ecken', r.homeCorners, r.awayCorners);
  add('Fouls', r.homeFouls, r.awayFouls);
  if (hs && as) add('Abseits', hs.offsides, as.offsides);
  add('Gelbe Karten', r.homeYellowCards, r.awayYellowCards);
  add('Rote Karten', r.homeRedCards, r.awayRedCards);
  if (hs && as) add('Paraden', hs.saves, as.saves);
  return (
    <div className="mr-stats">
      {rows.map(([l, h, a, hv, avv]) => {
        const tot = hv + avv || 1;
        return (
          <div key={l} className="mr-stat">
            <div className="mr-stat-v"><b>{h}</b><span>{l}</span><b>{a}</b></div>
            <div className="mr-stat-bar"><span className="h" style={{ width: `${(hv / tot) * 100}%` }} /><span className="a" style={{ width: `${(avv / tot) * 100}%` }} /></div>
          </div>
        );
      })}
    </div>
  );
}

function LineupCol({ g, list }: { g: Game; list: LineupEntry[] }) {
  const nm = shortNamer(list.map((e) => g.players[e.id]));
  return (
    <div className="mr-lu">
      {list.map((e) => {
        const p = g.players[e.id];
        return (
          <div key={e.id} className={`mr-lu-row ${e.started ? '' : 'sub'}`}>
            <span className="mr-pos">{e.pos}</span>
            <span className="mr-nm">
              {nm(p)}
              {e.goals > 0 && <span className="mr-tag goal">{e.goals > 1 ? `${e.goals}×` : ''}Tor</span>}
              {e.assists > 0 && <span className="mr-tag">{e.assists > 1 ? `${e.assists}×` : ''}Vorl.</span>}
              {e.card && <span className={`mr-card ${e.card === 'Gelb' ? 'y' : 'r'}`} />}
              {!e.started && <span className="mr-in">{e.in}'</span>}
            </span>
            <span className={`mr-grade ${e.grade <= 2 ? 'g-top' : e.grade <= 3 ? 'g-good' : e.grade <= 4 ? 'g-mid' : 'g-bad'}`}>{e.grade.toFixed(1).replace('.', ',')}</span>
          </div>
        );
      })}
    </div>
  );
}
