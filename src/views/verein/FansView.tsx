import { economyScale, revenueScale, yearOf } from '../../engine/economy';
import { PHILOSOPHY_INFO, PHILOSOPHY_LABEL, fanEra } from '../../engine/environment';
import { ensureEnvironment } from '../../game/environmentGame';
import { cateringMatchIncome, expectedAttendance, expectedAttendanceRate, matchdayIncome } from '../../engine/finances';
import { Game } from '../../game/state';
import { DashBox, DashPage, Empty, KV, Kpi, Meter } from '../../ui/DashPage';
import { fmtDM, fmtDMfull, vColor } from '../../ui/format';
import { FormDots, MatchRow, avg, ownLeagueMatches, resultFor, tableRow } from '../shared';
import { FanCrowd } from './FanCrowd';

// =============================================================================
// FANS — Zuschauer, Stimmung (aus Ergebnissen), Mitglieder, Spieltagserlöse
// =============================================================================
export function FansView({ g }: { g: Game }) {
  const myClub = g.clubs[g.managedClubId];
  const st = myClub.stadium;
  const year = yearOf(g.calendar.currentDate);
  const scale = economyScale(year);
  const md = revenueScale('matchday', year);
  const env = ensureEnvironment(g);
  const era = fanEra(year);
  const expRate = expectedAttendanceRate(myClub);
  const expVisitors = expectedAttendance(myClub);
  const ticket = Math.round(expVisitors * st.ticketPrice * md);
  const catering = cateringMatchIncome(myClub, expVisitors, md);
  const programme = matchdayIncome(expVisitors, md);
  const members = env.members;
  const played = ownLeagueMatches(g, 'finished');
  const last5 = played.slice(-5);
  const pts = last5.reduce((s, m) => s + ({ W: 3, D: 1, L: 0 }[resultFor(m, myClub.id) ?? 'L']), 0);
  const mood = Math.round(env.fanMood);
  const moodText = !last5.length && mood === 55 ? 'Gespannt auf die neue Saison.' : mood >= 70 ? 'Begeistert – die Kurve steht hinter der Mannschaft.'
    : mood >= 45 ? 'Zufrieden, aber anspruchsvoll.' : mood >= 25 ? 'Unruhig – erste Pfiffe sind zu hören.' : 'Verärgert – die Fans fordern Konsequenzen.';
  const home = played.filter((m) => m.homeClubId === myClub.id && m.result);
  const away = played.filter((m) => m.awayClubId === myClub.id);
  const avgAtt = home.length ? Math.round(avg(home.map((m) => m.result!.attendance))) : 0;
  const row = tableRow(g);

  return (
    <DashPage>
      <DashBox title="Fankurve" icon="fans" span={2} right={<span style={{ color: vColor(mood) }}>{moodText}</span>}>
        <div className="fan-layout">
          <FanCrowd mood={mood} formPoints={last5.length ? pts : -1} attendance={expRate} year={year} seed={`${myClub.id}|${g.calendar.currentDate.slice(0, 7)}`}
            primary={myClub.colors?.primary ?? '#c0392b'} secondary={myClub.colors?.secondary ?? '#ffffff'} />
          <div className="fan-side">
            <div className="dkpis">
              <Kpi value={mood} label="Fan-Stimmung" color={vColor(mood)} />
              <Kpi value={home.length ? avgAtt.toLocaleString('de-DE') : expVisitors.toLocaleString('de-DE')} label={home.length ? 'Ø Heimspiel' : 'erwartet'} />
            </div>
            {row && row.form.length > 0 && <KV k="Form" v={<FormDots form={row.form} />} />}
            <KV k="Erw. Auslastung" v={`${Math.round(expRate * 100)} %`} />
            <KV k="Kapazität" v={st.capacity.toLocaleString('de-DE')} />
            <KV k="Ticketpreis" v={fmtDMfull(st.ticketPrice * md)} />
            <KV k="Ansehen" v={myClub.reputation} />
            <KV k="Leitbild erfüllt" v={`${env.identity} %`} color={vColor(env.identity)} />
            <KV k="Medien-Druck" v={Math.round(env.mediaPressure)} />
            <div className="dnote mt8">Je besser Stimmung und Ergebnisse, desto voller und lauter die Kurve.</div>
          </div>
        </div>
      </DashBox>

      <DashBox title="Mitglieder" icon="dashVerein">
        <div className="dkpis">
          <Kpi value={members.toLocaleString('de-DE')} label="Mitglieder" />
          <Kpi value={`${env.memberTrend >= 0 ? '+' : ''}${(env.memberTrend * 1200).toFixed(1)} %`} label="Trend / Jahr" color={env.memberTrend >= 0 ? 'var(--green)' : 'var(--red)'} />
        </div>
        <KV k="Beiträge / Jahr" v={fmtDM(members * 40 * scale)} />
        {(env.history ?? []).slice(-4).map((h) => <KV key={h.season} k={h.season} v={`${h.members.toLocaleString('de-DE')} · Stimmung ${h.fanMood}`} />)}
        <div className="dnote mt8">Erfolg, gute Stimmung und die Fankultur der Epoche lassen die Mitgliederzahl wachsen.</div>
      </DashBox>

      <DashBox title="Heimspiele" icon="dashBall" right={`${home.length}`}>
        {home.length ? [...home].reverse().map((m) => (
          <Meter key={m.id} label={g.clubs[m.awayClubId]?.name ?? '—'} value={m.result!.attendance} max={st.capacity} text={m.result!.attendance.toLocaleString('de-DE')} />
        )) : <Empty icon="dashBall">Noch kein Heimspiel.</Empty>}
      </DashBox>

      <DashBox title="Identität & Rivalen" icon="dashVerein" right={era.name}>
        <KV k="Leitbild" v={PHILOSOPHY_LABEL[env.philosophy]} strong />
        <div className="dnote">{PHILOSOPHY_INFO[env.philosophy]}</div>
        <KV k="Tradition" v={env.tradition} />
        <div className="dsec">Rivalen</div>
        {env.rivals.length ? env.rivals.map((id) => <KV key={id} k={g.clubs[id]?.name ?? g.simClubs?.[id]?.name ?? id} v="Derby" />) : <div className="dnote">Kein Derbygegner in der Liga.</div>}
        <div className="dsec">Fankultur</div>
        <div className="dnote">{era.text}</div>
        {away.length > 0 && <div className="dnote mt8">{away.length} Auswärtsfahrten in dieser Saison.</div>}
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
