import { economyScale, yearOf } from '../../engine/economy';
import { cateringMatchIncome, expectedAttendance, expectedAttendanceRate, matchdayIncome } from '../../engine/finances';
import { Game } from '../../game/state';
import { DashBox, DashPage, Empty, KV, Kpi, Meter } from '../../ui/DashPage';
import { fmtDM, fmtDMfull, vColor } from '../../ui/format';
import { FormDots, MatchRow, avg, ownLeagueMatches, resultFor, tableRow } from '../shared';

// =============================================================================
// FANS — Zuschauer, Stimmung (aus Ergebnissen), Mitglieder, Spieltagserlöse
// =============================================================================
export function FansView({ g }: { g: Game }) {
  const myClub = g.clubs[g.managedClubId];
  const st = myClub.stadium;
  const scale = economyScale(yearOf(g.calendar.currentDate));
  const expRate = expectedAttendanceRate(myClub);
  const expVisitors = expectedAttendance(myClub);
  const ticket = Math.round(expVisitors * st.ticketPrice * scale);
  const catering = cateringMatchIncome(myClub, expVisitors, scale);
  const programme = matchdayIncome(expVisitors, scale);
  // Mitglieder-Schätzung: Beiträge / typischer Jahresbeitrag (~40 DM, 1975-Basis).
  const estMembers = Math.round((30000 + myClub.reputation * 1000) / 40);
  const played = ownLeagueMatches(g, 'finished');
  const last5 = played.slice(-5);
  const pts = last5.reduce((s, m) => s + ({ W: 3, D: 1, L: 0 }[resultFor(m, myClub.id) ?? 'L']), 0);
  const mood = last5.length ? Math.round((pts / (last5.length * 3)) * 100) : 50;
  const moodText = !last5.length ? 'Gespannt auf die neue Saison.' : mood >= 70 ? 'Begeistert – die Kurve steht hinter der Mannschaft.'
    : mood >= 45 ? 'Zufrieden, aber anspruchsvoll.' : mood >= 25 ? 'Unruhig – erste Pfiffe sind zu hören.' : 'Verärgert – die Fans fordern Konsequenzen.';
  const home = played.filter((m) => m.homeClubId === myClub.id && m.result);
  const away = played.filter((m) => m.awayClubId === myClub.id);
  const avgAtt = home.length ? Math.round(avg(home.map((m) => m.result!.attendance))) : 0;
  const row = tableRow(g);

  return (
    <DashPage>
      <DashBox title="Stimmung" icon="fans">
        <div className="dkpis">
          <Kpi value={mood} label="Fan-Stimmung" color={vColor(mood)} />
          <Kpi value={myClub.reputation} label="Ansehen" />
        </div>
        <div className="dnote" style={{ fontSize: 16, color: 'var(--text-2)' }}>{moodText}</div>
        {row && row.form.length > 0 && <KV k="Form" v={<FormDots form={row.form} />} />}
        <div className="dnote mt8">Die Stimmung leitet sich aus den letzten fünf Ligaspielen ab.</div>
      </DashBox>

      <DashBox title="Zuschauer" icon="stadium">
        <div className="dkpis">
          <Kpi value={home.length ? avgAtt.toLocaleString('de-DE') : expVisitors.toLocaleString('de-DE')} label={home.length ? 'Ø Heimspiel' : 'erwartet'} />
          <Kpi value={`${Math.round(expRate * 100)} %`} label="Erw. Auslastung" />
        </div>
        <KV k="Kapazität" v={st.capacity.toLocaleString('de-DE')} />
        <KV k="Ø Auslastung (Basis)" v={`${Math.round(st.averageAttendanceRate * 100)} %`} />
        <KV k="Ticketpreis" v={fmtDMfull(st.ticketPrice * scale)} />
      </DashBox>

      <DashBox title="Mitglieder" icon="dashVerein">
        <div className="dkpis"><Kpi value={estMembers.toLocaleString('de-DE')} label="geschätzte Mitglieder" /></div>
        <KV k="Beiträge / Jahr" v={fmtDM((30000 + myClub.reputation * 1000) * scale)} />
        <div className="dnote mt8">Die Mitgliederzahl wächst mit dem Ansehen des Vereins. Eine echte Mitgliederentwicklung folgt in einem späteren Ausbau.</div>
      </DashBox>

      <DashBox title="Heimspiele" icon="dashBall" right={`${home.length}`}>
        {home.length ? [...home].reverse().map((m) => (
          <Meter key={m.id} label={g.clubs[m.awayClubId]?.name ?? '—'} value={m.result!.attendance} max={st.capacity} text={m.result!.attendance.toLocaleString('de-DE')} />
        )) : <Empty icon="dashBall">Noch kein Heimspiel.</Empty>}
      </DashBox>

      <DashBox title="Auswärtsfahrten" icon="schedule" right={`${away.length}`}>
        {away.length ? [...away].reverse().slice(0, 8).map((m) => <MatchRow key={m.id} g={g} m={m} />) : <Empty icon="schedule">Noch kein Auswärtsspiel.</Empty>}
      </DashBox>

      <DashBox title="Spieltagserlöse" icon="finances" right="pro Heimspiel">
        <div className="dkpis"><Kpi value={fmtDM(ticket + catering + programme)} label="Summe (erwartet)" color="var(--green)" /></div>
        <KV k="Eintritt" v={fmtDM(ticket)} />
        <KV k="Catering" v={fmtDM(catering)} />
        <KV k="Programmhefte" v={fmtDM(programme)} />
      </DashBox>
    </DashPage>
  );
}
