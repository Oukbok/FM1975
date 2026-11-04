import ClubCrest from '../../components/ClubCrest';
import PlayerAvatar from '../../components/PlayerAvatar';
import { expectedPosition } from '../../engine/environment';
import { ensureEnvironment } from '../../game/environmentGame';
import type { Game } from '../../game/state';
import type { Player } from '../../types';
import { ageAtStart, fullName, managerFace, type NewGameDraft } from './draft';
import PosBadge from '../../components/PosBadge';

// Schritt 6: Willkommen bei deinem Verein — echte Werte aus der eben erzeugten Spielwelt
const elf = (g: Game, ids: string[]) => ids.map((id) => g.players[id]).filter(Boolean).sort((a, b) => b.overall - a.overall);
const xiSum = (ps: Player[]) => ps.slice(0, 11).reduce((a, p) => a + p.overall, 0);

function Status({ title, value, text, invert }: { title: string; value: number; text: string; invert?: boolean }) {
  const v = Math.round(value);
  return (
    <div className="ng-status">
      <div className="ng-status-head"><span>{title}</span><b>{v}<small> / 100</small></b></div>
      <div className="ng-meter"><i style={{ width: `${v}%`, background: !invert && v < 35 ? 'var(--red)' : 'var(--bar-fill-hi)' }} /></div>
      <p>{text}</p>
    </div>
  );
}

export function StepWelcome({ d, game }: { d: NewGameDraft; game: Game | null }) {
  if (!game) {
    return <div className="ng-wait"><span className="ng-spinner" /><b>Die Spielwelt wird aufgebaut</b><small>Kader, Spielpläne und Ligen für 1975/76 …</small></div>;
  }
  const club = game.clubs[game.managedClubId];
  const squad = elf(game, club.playerIds);
  const best = squad[0];
  const leagueIds = game.table.rows.map((r) => r.clubId);
  const ranking = leagueIds.map((id) => ({ id, s: xiSum(elf(game, game.clubs[id]?.playerIds ?? [])) })).sort((a, b) => b.s - a.s);
  const realRank = ranking.findIndex((x) => x.id === club.id) + 1;
  const size = leagueIds.length;
  const target = expectedPosition(club.boardExpectation, size);
  const env = ensureEnvironment(game);
  const rep = club.reputation;
  const div = game.leagues.playerDivision.name;
  const press = rep >= 80 ? 'Ein großes Aufgebot an Reportern und Kameras begleitet deinen ersten Arbeitstag. Hier wird jedes Wort gedruckt.'
    : rep >= 65 ? 'Die Zeitungen der Region sind gespannt, wie du die Mannschaft aufstellst.'
      : 'Ein Lokalreporter schreibt ein paar Zeilen über den neuen Trainer – noch hast du Ruhe.';
  const board = `Der Vorstand erwartet: ${club.boardExpectation} (etwa Platz ${target}). Nach Kaderstärke liegt ihr realistisch auf Platz ${realRank} von ${size}.`;
  const fans = d.favoriteClubId === club.id ? 'Es ist dein Herzensverein – das hat sich in der Kurve schnell herumgesprochen.'
    : d.avoidClubId === club.id ? 'Ausgerechnet der Verein, den du nie trainieren wolltest. Die Fans wissen es zum Glück nicht.'
      : env.fanMood >= 60 ? 'Die Fans freuen sich auf die neue Saison.' : 'Die Fans sind abwartend – überzeuge sie auf dem Platz.';
  const face = managerFace(d.avatarSeed, fullName(d)) as unknown as Player;
  return (
    <div className="ng-cols ng-cols-welcome">
      <section className="ng-card ng-welcome-hero">
        <div className="ng-welcome-mgr">
          <PlayerAvatar player={{ ...face, age: ageAtStart(d) }} size={64} staff year={1975} />
          <span><b>{fullName(d)}</b><small>{ageAtStart(d)} Jahre · {d.nationality}</small></span>
        </div>
        <ClubCrest club={club} size={210} />
        <h2 className="ng-welcome-title">Willkommen bei<br /><span>{club.name}</span></h2>
        <div className="ng-welcome-sub">{div} · Saison 1975/76 · {club.stadium?.name ?? ''}</div>
      </section>

      <section className="ng-card">
        <h3 className="ng-h">Spielerkader</h3>
        <div className="ng-kpis">
          <div className="ng-kpi"><b>{squad.length}</b><span>Spieler</span></div>
          <div className="ng-kpi"><b>{xiSum(squad)}</b><span>Stärke 1. Elf</span></div>
          <div className="ng-kpi"><b>{Math.round(squad.reduce((a, p) => a + p.overall, 0) / Math.max(1, squad.length))}</b><span>Durchschnitt</span></div>
        </div>
        {best && <>
          <h3 className="ng-h">Bester Spieler</h3>
          <div className="ng-best" data-pid={best.id}>
            <PlayerAvatar player={best} club={club} size={120} />
            <div>
              <b>{best.fullName}</b>
              <small><PosBadge p={best} single /> {best.age} Jahre · {best.nationality}</small>
              <div className="ng-best-ovr">{best.overall}<span>Stärke</span></div>
            </div>
          </div>
          <div className="rl rl-sm rl-players ng-keyplayers">
            {squad.slice(1, 5).map((p) => (
              <div key={p.id} className="rl-row" data-pid={p.id}>
                <span className="rl-rank"><PosBadge p={p} single /></span>
                <span className="rl-name">{p.fullName}</span>
                <span className="rl-num">{p.age} J.</span>
                <span className="rl-main">{p.overall}</span>
              </div>
            ))}
          </div>
        </>}
        <div className="ng-kv ng-push"><span>Realistischer Platz nach Stärke</span><b>{realRank}. von {size}</b></div>
      </section>

      <section className="ng-card">
        <h3 className="ng-h">Erste Eindrücke</h3>
        <Status title="Mediendruck" value={env.mediaPressure} text={press} invert />
        <Status title="Vertrauen des Vorstands" value={club.boardConfidence ?? 60} text={board} />
        <Status title="Stimmung der Fans" value={env.fanMood} text={fans} />
        <p className="ng-note ng-push">Danach folgt das Saison-Briefing mit deinen ersten Aufgaben.</p>
      </section>
    </div>
  );
}
