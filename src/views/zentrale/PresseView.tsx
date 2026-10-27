import ClubCrest from '../../components/ClubCrest';
import { CalendarEngine } from '../../engine/calendar';
import { Game } from '../../game/state';
import { DashBox, DashPage, Empty, KV, Kpi } from '../../ui/DashPage';
import { vColor } from '../../ui/format';
import { FormDots, MatchRow, PlayerRow, avg, ownLeagueMatches, resultFor, squadOf, tableRow } from '../shared';

// =============================================================================
// PRESSE & MEDIEN — Schlagzeilen, Medientenor, Spieler im Fokus, Vorbericht
// Alles wird aus dem Spielstand abgeleitet (Ergebnisse, Tabelle, Statistik).
// =============================================================================
export function PresseView({ g }: { g: Game }) {
  const myId = g.managedClubId;
  const my = g.clubs[myId];
  const row = tableRow(g);
  const played = ownLeagueMatches(g, 'finished');
  const last5 = played.slice(-5);
  const pts = last5.reduce((s, m) => s + ({ W: 3, D: 1, L: 0 }[resultFor(m, myId) ?? 'L']), 0);
  const tenor = last5.length === 0 ? 50 : Math.round((pts / (last5.length * 3)) * 100);
  const tenorText = last5.length === 0 ? 'Abwartend – die Saison hat noch nicht begonnen.'
    : tenor >= 70 ? 'Euphorisch – die Zeitungen feiern die Mannschaft.'
    : tenor >= 45 ? 'Sachlich – solide Leistungen, aber noch Luft nach oben.'
    : tenor >= 25 ? 'Kritisch – erste Fragen an Trainer und Mannschaft.'
    : 'Feindselig – die Boulevardpresse fordert Konsequenzen.';
  const headlines = g.messages.filter((m) => m.category === 'media' || m.category === 'match' || m.category === 'milestone').slice(0, 14);
  const squad = squadOf(g);
  const scorer = [...squad].sort((a, b) => b.seasonStats.goals - a.seasonStats.goals)[0];
  const bestRated = [...squad].filter((p) => p.seasonStats.ratedMatches >= 2).sort((a, b) => a.seasonStats.averageRating - b.seasonStats.averageRating)[0];
  const next = ownLeagueMatches(g, 'scheduled')[0];
  const oppId = next ? (next.homeClubId === myId ? next.awayClubId : next.homeClubId) : null;
  const opp = oppId ? g.clubs[oppId] : null;
  const oppRow = oppId ? tableRow(g, oppId) : undefined;
  return (
    <DashPage>
      <DashBox title="Schlagzeilen" icon="presse" span={2} right={`${headlines.length} Meldungen`}>
        {headlines.length ? headlines.map((m) => (
          <div key={m.id} className="dlist-row">
            <span className="meta" style={{ minWidth: 150 }}>{CalendarEngine.formatDate(m.date)}</span>
            <span className="grow" style={{ fontWeight: m.read ? 500 : 800 }}>{m.subject}</span>
            <span className="meta">{m.from}</span>
          </div>
        )) : <Empty icon="presse">Derzeit keine Meldungen.</Empty>}
      </DashBox>

      <DashBox title="Medientenor" icon="news">
        <div className="dkpis">
          <Kpi value={`${tenor}`} label="Stimmung" color={vColor(tenor)} />
          <Kpi value={row ? `${row.position}.` : '–'} label="Tabelle" />
        </div>
        <div className="dnote" style={{ fontSize: 16, color: 'var(--text-2)' }}>{tenorText}</div>
        {row && <KV k="Form" v={<FormDots form={row.form} />} />}
      </DashBox>

      <DashBox title="Spieler im Fokus" icon="squad">
        {scorer && scorer.seasonStats.goals > 0 && <><div className="dsec">Bester Torschütze</div><PlayerRow p={scorer} value={`${scorer.seasonStats.goals} Tore`} color="var(--accent)" /></>}
        {bestRated && <><div className="dsec">Beste Durchschnittsnote</div><PlayerRow p={bestRated} value={bestRated.seasonStats.averageRating.toFixed(2)} color="var(--green)" /></>}
        <div className="dsec">Stärkster Spieler</div>
        {[...squad].sort((a, b) => b.overall - a.overall).slice(0, 1).map((p) => <PlayerRow key={p.id} p={p} value={p.overall} />)}
        {!played.length && <div className="dnote mt8">Statistiken folgen nach den ersten Spielen.</div>}
      </DashBox>

      <DashBox title="Vorbericht" icon="dashBall" right={next ? `${next.matchday}. Spieltag` : undefined}>
        {next && opp ? (
          <>
            <div className="dvs">
              <div className="dvs-side"><ClubCrest club={g.clubs[next.homeClubId]} size={56} /><b>{g.clubs[next.homeClubId].shortName}</b></div>
              <div className="dvs-mid">VS</div>
              <div className="dvs-side"><ClubCrest club={g.clubs[next.awayClubId]} size={56} /><b>{g.clubs[next.awayClubId].shortName}</b></div>
            </div>
            <KV k="Tabelle" v={`${row?.position ?? '–'}. gegen ${oppRow?.position ?? '–'}.`} />
            <KV k="Ø Stärke" v={`${Math.round(avg(squad.map((p) => p.overall)))} : ${Math.round(avg(squadOf(g, opp.id).map((p) => p.overall)))}`} />
          </>
        ) : <Empty icon="dashBall">Kein Spiel angesetzt.</Empty>}
      </DashBox>

      <DashBox title="Letzte Spiele" icon="stats">
        {last5.length ? [...last5].reverse().map((m) => <MatchRow key={m.id} g={g} m={m} />) : <Empty icon="stats">Noch kein Spiel.</Empty>}
        <div className="dnote mt8">{my.name} · Pressekonferenzen und Interviews folgen in einem späteren Ausbau.</div>
      </DashBox>
    </DashPage>
  );
}
