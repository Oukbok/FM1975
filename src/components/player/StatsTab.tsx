// Reiter „Statistiken“ (Vorbild EA Fussball Manager): Spielerentwicklung als Liniendiagramm,
// Vereinsspiele (Saison und Karriere nebeneinander, Serien aus der Spielliste), darunter
// Potenzial und Bewertungen mit Gründen sowie die letzten Spiele.
import type { MatchLogEntry, Player, PlayerStats } from '../../types';
import type { Game } from '../../game/state';
import { useClubProfile } from '../club/ClubLink';
import { InfoTip } from '../../ui/InfoTip';
import DevChart from './DevChart';
import RecentMatches from './MatchesTab';
import { AttributeChanges, PotentialBox, RatingHistory } from './DevelopmentParts';
import { Section } from './shared';

type Row = [string, (s: PlayerStats) => string | number];
const avg = (s: PlayerStats) => (s.averageRating > 0 ? s.averageRating.toFixed(2) : '–');
const pct = (a?: number, b?: number) => (b ? `${Math.round(((a ?? 0) / b) * 100)} %` : '–');
const per90 = (n: number, min: number) => (min > 0 ? ((n * 90) / min).toFixed(2) : '–');

const LEFT: Row[] = [
  ['Spiele', (s) => s.appearances],
  ['davon Startelf', (s) => s.starts],
  ['Minuten gespielt', (s) => s.minutesPlayed.toLocaleString('de-DE')],
  ['Tore', (s) => s.goals],
  ['Vorlagen', (s) => s.assists],
  ['Durchschnittsnote', avg],
  ['Tore / 90 Min.', (s) => per90(s.goals, s.minutesPlayed)],
];
const RIGHT: Row[] = [
  ['Karten G/GR/R', (s) => `${s.yellowCards}/${s.yellowRedCards}/${s.redCards}`],
  ['Zu-null-Spiele', (s) => s.cleanSheets],
  ['Schüsse (aufs Tor)', (s) => (s.detail ? `${s.detail[0]} (${s.detail[1]})` : '–')],
  ['Pässe angekommen', (s) => pct(s.detail?.[3], s.detail?.[2])],
  ['Zweikämpfe gewonnen', (s) => pct(s.detail?.[5], s.detail?.[4])],
];

/** Spieltermine des eigenen Vereins = alle Daten in den Spiellisten des Kaders. */
function clubDates(g: Game | undefined, p: Player): string[] {
  if (!g || p.clubId !== g.managedClubId) return [];
  const set = new Set<string>();
  for (const id of g.clubs[p.clubId]?.playerIds ?? []) for (const m of g.players[id]?.history?.matches ?? []) set.add(m.date);
  return [...set].sort();
}
const conceded = (m: MatchLogEntry) => Number(m.score.split(':')[1] ?? 0);

/** Serien aus der Spielliste: Spiele in Folge, ohne Tor/Gegentor, Bestnote. */
function streaks(g: Game | undefined, p: Player) {
  const list = p.history?.matches ?? [];
  const mine = new Set(list.map((m) => m.date));
  const dates = clubDates(g, p);
  let row = 0;
  for (let i = dates.length - 1; i >= 0 && mine.has(dates[i]); i--) row++;
  const tail = (f: (m: MatchLogEntry) => boolean) => { let n = 0; for (let i = list.length - 1; i >= 0 && f(list[i]); i--) n++; return n; };
  const gk = p.naturalPosition === 'TW';
  return {
    row: dates.length ? row : null,
    dry: list.length ? (gk ? tail((m) => conceded(m) === 0) : tail((m) => m.goals === 0)) : null,
    gk,
    best: list.length ? Math.min(...list.map((m) => m.rating)) : null,
  };
}

function Grid({ rows, s, c }: { rows: Row[]; s: PlayerStats; c: PlayerStats }) {
  return (
    <div className="pp3-kv3">
      <span /><span className="h">Saison</span><span className="h">Karriere</span>
      {rows.map(([l, f]) => <Rowx key={l} l={l} a={f(s)} b={f(c)} />)}
    </div>
  );
}
const Rowx = ({ l, a, b }: { l: string; a: string | number; b: string | number }) => <><span className="l">{l}</span><b>{a}</b><b className="c">{b}</b></>;

export default function StatsTab({ p }: { p: Player }) {
  const g = useClubProfile()?.game;
  const s = p.seasonStats, c = p.careerStats;
  const st = streaks(g, p);
  return (
    <div className="pp3-stats">
      <Section title={<>Spielerentwicklung<InfoTip k="spielerentwicklung" /></>}>
        <DevChart p={p} g={g} />
      </Section>
      <Section title="Vereinsspiele">
        <div className="pp3-two">
          <Grid rows={LEFT} s={s} c={c} />
          <div>
            <Grid rows={RIGHT} s={s} c={c} />
            <div className="pp3-serie">
              <span>Spiele in Folge</span><b>{st.row ?? '–'}</b>
              <span>{st.gk ? 'Ohne Gegentor in Folge' : 'Spiele ohne Tor in Folge'}</span><b>{st.dry ?? '–'}</b>
              <span>Bestnote (Spielliste)</span><b>{st.best != null ? st.best.toFixed(1) : '–'}</b>
            </div>
          </div>
        </div>
      </Section>
      <div className="pp3-two">
        <PotentialBox p={p} />
        <Section title="Bewertungen und Gründe"><RatingHistory p={p} /></Section>
      </div>
      <Section title="Attribut-Veränderungen"><AttributeChanges p={p} /></Section>
      <RecentMatches p={p} />
    </div>
  );
}
