import ClubCrest from '../components/ClubCrest';
import { ClubLink } from '../components/club/ClubLink';

import { STAFF_BY_ID, staffMonthlyTotal } from '../data/staff';
import { economyScale, yearOf } from '../engine/economy';
import { computeMonthly, expectedAttendanceRate, forecastSeasonEnd, totalExpense, totalIncome, weeklyWageBill } from '../engine/finances';
import { BalanceLine, CorporateBox, LicenseBox, useBalanceRange } from './finance/businessBoxes';
import { priceOf, seatPriceScale } from '../engine/seating';
import { FACILITIES, facilityAvailable, MAX_LEVEL } from '../engine/infrastructure';
import { getFormation } from '../data/formations';
import { Game } from '../game/state';
import { Screen } from '../shell/navigation';
import { BoxLink, DashBox, DashPage, Empty, KV, Kpi, Meter } from '../ui/DashPage';
import { fmtDM, fmtDMfull, fmtDateShort, condBar, fmtPrice, fmtWage } from '../ui/format';
import {
  FormDots, MatchRow, PlayerRow, avg, ownLeagueMatches, squadOf, tableRow,
} from './shared';
import { smoothArea, smoothPath, type Pt } from '../ui/smoothPath';

// =============================================================================
// KATEGORIE-ÜBERSICHTEN (Finanzen, Verein; Spieltag nur noch als Altbestand)
// Sechs Boxen im Raster der Zentrale; ein Klick auf eine Box führt zur passenden
// Unterseite. Kader, Jugend, Transfermarkt, Statistiken und Privat haben keine
// eigene Übersicht mehr (Wunsch Pascal), ihr Hauptpunkt öffnet die erste Unterseite.
// =============================================================================
export const TAC_STYLE_DE: Record<string, string> = {
  defensive: 'Defensiv', balanced: 'Ausgewogen', attacking: 'Offensiv', counter: 'Konter',
};

// --- SPIELTAG ---------------------------------------------------------------
export function SpieltagDashboard({ g, onGoto, onWatch }: {
  g: Game; onGoto: (s: Screen) => void; onWatch: (id: string) => void;
}) {
  const myId = g.managedClubId;
  const myClub = g.clubs[myId];
  const t = myClub.tactics;
  const upcoming = ownLeagueMatches(g, 'scheduled');
  const played = ownLeagueMatches(g, 'finished');
  const next = upcoming[0];
  const oppId = next ? (next.homeClubId === myId ? next.awayClubId : next.homeClubId) : null;
  const opp = oppId ? g.clubs[oppId] : null;
  const oppRow = oppId ? tableRow(g, oppId) : undefined;
  const oppSquad = oppId ? squadOf(g, oppId) : [];
  const mySquad = squadOf(g);
  const xi = t.startingXI.map((id) => g.players[id]).filter(Boolean);
  const name = (id: string | null) => (id && g.players[id] ? g.players[id].lastName : '—');
  return (
    <DashPage>
      <DashBox title="Nächstes Spiel" icon="dashBall" onClick={() => onGoto('fixtures')}
        right={next ? `${next.matchday}. Spieltag` : undefined}>
        {next && opp ? (
          <>
            <div className="dvs">
              <ClubLink id={next.homeClubId} block className="dvs-side"><ClubCrest club={g.clubs[next.homeClubId]} size={72} /><b>{g.clubs[next.homeClubId].name}</b></ClubLink>
              <div className="dvs-mid">VS<span>{fmtDateShort(next.date).dmy}</span></div>
              <ClubLink id={next.awayClubId} block className="dvs-side"><ClubCrest club={g.clubs[next.awayClubId]} size={72} /><b>{g.clubs[next.awayClubId].name}</b></ClubLink>
            </div>
            <KV k="Spielort" v={next.homeClubId === myId ? `Heimspiel · ${myClub.stadium.name}` : `Auswärts · ${opp.stadium.name}`} />
          </>
        ) : <Empty icon="schedule">Kein weiteres Ligaspiel in dieser Saison.</Empty>}
      </DashBox>

      <DashBox title="Gegner-Analyse" icon="watchlist" right={opp?.shortName}>
        {opp ? (
          <>
            <div className="dkpis">
              <Kpi value={oppRow ? `${oppRow.position}.` : '–'} label="Platz" />
              <Kpi value={Math.round(avg(oppSquad.map((p) => p.overall)))} label="Ø Stärke" sub={`wir: ${Math.round(avg(mySquad.map((p) => p.overall)))}`} />
              <Kpi value={oppRow ? `${oppRow.goalsFor}:${oppRow.goalsAgainst}` : '–'} label="Tore" />
            </div>
            {oppRow && <KV k="Form" v={<FormDots form={oppRow.form} />} />}
            <div className="dsec">Gefährlichste Spieler</div>
            {[...oppSquad].sort((a, b) => b.overall - a.overall).slice(0, 3).map((p) => <PlayerRow key={p.id} p={p} value={p.overall} />)}
          </>
        ) : <Empty icon="watchlist">Kein Gegner angesetzt.</Empty>}
      </DashBox>

      <DashBox title="Aufstellung" icon="lineup" onClick={() => onGoto('lineup')}
        right={<span style={{ color: xi.length === 11 ? 'var(--green)' : 'var(--red)' }}>{getFormation(t.formation).label} · {xi.length}/11</span>}>
        {xi.length ? (
          <div className="dgrid2">
            {xi.map((p) => <PlayerRow key={p.id} p={p} value={p.overall} />)}
          </div>
        ) : <Empty icon="lineup">Noch keine Startelf festgelegt.</Empty>}
      </DashBox>

      <DashBox title="Taktik" info="mentalitaet" icon="tactics" onClick={() => onGoto('tactics')} right={TAC_STYLE_DE[t.style] ?? t.style}>
        <Meter label="Tempo" value={t.tempo} />
        <Meter label="Pressing" value={t.pressing} />
        <Meter label="Abwehrlinie" value={t.defensiveLine} />
        <KV k="Spielaufbau" v={t.buildup === 'long' ? 'Lange Bälle' : 'Kurzpassspiel'} />
        <KV k="Kapitän" v={name(t.captainId)} />
        <KV k="Elfmeter · Freistoß · Ecke" v={`${name(t.penaltyTakerId)} · ${name(t.freeKickTakerId)} · ${name(t.cornerTakerId)}`} />
      </DashBox>

      <DashBox title="Letzte Ergebnisse" icon="stats" onClick={() => onGoto('fixtures')}>
        {played.length ? [...played].reverse().slice(0, 7).map((m) => (
          <MatchRow key={m.id} g={g} m={m} onClick={() => onWatch(m.id)} />
        )) : <Empty icon="stats">Noch kein Spiel absolviert.</Empty>}
      </DashBox>

      <DashBox title="Spielplan" icon="schedule" onClick={() => onGoto('fixtures')} right={`${upcoming.length} offen`}>
        {upcoming.length ? upcoming.slice(0, 7).map((m) => <MatchRow key={m.id} g={g} m={m} />) : <Empty icon="schedule">Saison beendet.</Empty>}
      </DashBox>
    </DashPage>
  );
}

// --- FINANZEN ---------------------------------------------------------------
const INCOME_DE: Record<string, string> = {
  ticketSales: 'Zuschauer', tvMoney: 'Fernsehen', sponsorship: 'Sponsoring', merchandise: 'Fanartikel',
  transferIncome: 'Transfers', prizeMoney: 'Prämien', catering: 'Catering', advertising: 'Werbung', commercial: 'Vermarktung',
  membership: 'Mitglieder', matchday: 'Spieltag', other: 'Sonstiges',
};
const EXPENSE_DE: Record<string, string> = {
  wages: 'Spielergehälter', transferExpense: 'Transfers', stadiumMaintenance: 'Stadion', trainingFacilities: 'Nachwuchs',
  staffWages: 'Mitarbeiter', facilities: 'Gebäude', operations: 'Betrieb & Vermarktung', other: 'Sonstiges',
};

export function FinanzenDashboard({ g, onGoto }: { g: Game; onGoto: (s: Screen) => void }) {
  const myClub = g.clubs[g.managedClubId];
  const fin = myClub.finances;
  const m = computeMonthly(myClub, g.players, g.table, economyScale(yearOf(g.calendar.currentDate)), yearOf(g.calendar.currentDate));
  const inc = totalIncome(fin), exp = totalExpense(fin);
  const incRows = Object.entries(fin.income).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const expRows = Object.entries(fin.expenses).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const homeRemaining = g.fixtures.filter((x) => x.homeClubId === myClub.id && x.status === 'scheduled').length;
  const forecast = forecastSeasonEnd(myClub, g.players, g.table, g.calendar.currentDate, g.calendar.seasonEndDate, homeRemaining);
  const wageFree = fin.wageBudget - weeklyWageBill(myClub, g.players);
  const c = myClub.commerce;
  const bal = useBalanceRange(g);
  return (
    <DashPage>
      <DashBox title="Kassenstand" info="kontostand" icon="finances" onClick={() => onGoto('finances')} right={bal.seg}>
        <div className="dkpis">
          <Kpi value={fmtDM(fin.balance)} label="Kontostand" color={fin.balance >= 0 ? undefined : 'var(--red)'} />
          <Kpi value={fmtDM(m.net)} label="Saldo pro Monat" color={m.net >= 0 ? 'var(--green)' : 'var(--red)'} />
        </div>
        <div className="dfin-chart"><BalanceLine g={g} range={bal.range} /></div>
        <KV k="Prognose Saisonende" info="prognose" v={fmtDM(forecast.projectedEndBalance)} color={forecast.projectedEndBalance < 0 ? 'var(--red)' : undefined} />
        <KV k="Transferbudget" info="transferbudget" v={fmtPrice(fin.transferBudget)} />
        <KV k="Gehaltsbudget frei" info="gehaltsbudget" v={fmtWage(wageFree)} color={wageFree < 0 ? 'var(--red)' : undefined} />
      </DashBox>

      <DashBox title="Einnahmen (Saison)" info="einnahmen" icon="dashFinanzen" onClick={() => onGoto('finances')} right={fmtDM(inc)}>
        {incRows.length ? incRows.slice(0, 7).map(([k, v]) => <Meter key={k} label={INCOME_DE[k] ?? k} value={v} max={incRows[0][1]} text={fmtDM(v)} color="var(--green)" />) : <Empty icon="finances">Noch keine Einnahmen gebucht.</Empty>}
      </DashBox>

      <DashBox title="Ausgaben (Saison)" info="ausgaben" icon="dashFinanzen" onClick={() => onGoto('finances')} right={fmtDM(exp)}>
        {expRows.length ? expRows.slice(0, 7).map(([k, v]) => <Meter key={k} label={EXPENSE_DE[k] ?? k} value={v} max={expRows[0][1]} text={fmtDM(v)} color="var(--orange)" />) : <Empty icon="finances">Noch keine Ausgaben gebucht.</Empty>}
      </DashBox>

      <DashBox title="Monatliche Fixposten" info="fixposten" icon="schedule">
        <KV k="Sponsoring" v={`+${fmtDM(m.sponsorship)}`} color="var(--green)" />
        <KV k="Werbung" v={`+${fmtDM(m.advertising)}`} color="var(--green)" />
        <KV k="Mitgliedsbeiträge" v={`+${fmtDM(m.membership)}`} color="var(--green)" />
        <KV k="Spielergehälter" v={`−${fmtDM(m.wages)}`} color="var(--red)" />
        <KV k="Mitarbeiter" v={`−${fmtDM(m.staffWages)}`} color="var(--red)" />
        <KV k="Stadion & Gebäude" v={`−${fmtDM(m.stadiumMaintenance + m.facilities)}`} color="var(--red)" />
      </DashBox>

      <DashBox title="Sponsoren" info="partnerPyramide" icon="sponsoring" onClick={() => onGoto('sponsoring')}>
        <KV k="Trikot" v={c?.shirtSponsor ? `${c.shirtSponsor.name}` : 'kein Vertrag'} color={c?.shirtSponsor ? undefined : 'var(--orange)'} />
        {c?.shirtSponsor && <KV k="· pro Jahr / Restlaufzeit" v={`${fmtDM(c.shirtSponsor.annualValue * economyScale(yearOf(g.calendar.currentDate)))} · ${c.shirtSponsor.yearsLeft} J.`} />}
        <KV k="Verträge gesamt" v={c?.deals?.length ?? (c?.banden ? 2 : 1)} />
        <KV k="Sponsoring + Werbung / Jahr" v={fmtDM((m.sponsorship + m.advertising) * 12)} color="var(--green)" />
        <KV k="Offene Angebote" v={c?.dealOffers?.length ?? (c?.shirtOffers?.length ?? 0) + (c?.bandenOffers?.length ?? 0)} color={(c?.dealOffers?.length ?? 0) > 0 ? 'var(--accent)' : undefined} />
        <BoxLink>Sponsoring öffnen</BoxLink>
      </DashBox>

      <LicenseBox g={g} />
    </DashPage>
  );
}

/** Einfache Verlaufslinie (z. B. Kontostand). */
export function Sparkline({ values, height = 120 }: { values: number[]; height?: number }) {
  if (values.length < 2) return <div className="dnote">Der Verlauf erscheint nach den ersten Monatsabschlüssen.</div>;
  const W = 400, H = height, pad = 6;
  const min = Math.min(...values, 0), max = Math.max(...values, 1);
  const x = (i: number) => pad + (i * (W - 2 * pad)) / (values.length - 1);
  const y = (v: number) => H - pad - ((v - min) / Math.max(1, max - min)) * (H - 2 * pad);
  const pts: Pt[] = values.map((v, i) => [x(i), y(v)]);
  const path = smoothPath(pts);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="dspark" preserveAspectRatio="none">
      {min < 0 && <line x1={0} x2={W} y1={y(0)} y2={y(0)} stroke="var(--red)" strokeDasharray="4 4" strokeWidth="1" />}
      <path d={smoothArea(pts, H)} style={{ fill: "rgba(var(--ink-rgb), 0.07)" }} />
      <path d={path} fill="none" stroke="var(--text-2)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// --- VEREIN -----------------------------------------------------------------
export function VereinDashboard({ g, onGoto, onChange }: { g: Game; onGoto: (s: Screen) => void; onChange: () => void }) {
  const myClub = g.clubs[g.managedClubId];
  const infra = myClub.infrastructure as unknown as Record<string, number>;
  const year = yearOf(g.calendar.currentDate);
  const staff = (g.hiredStaff ?? []).map((id) => STAFF_BY_ID[id]).filter(Boolean);
  const staffCost = staffMonthlyTotal(g.hiredStaff ?? [], economyScale(year));
  const facs = FACILITIES.filter((f) => facilityAvailable(f, year));
  const homeGames = g.fixtures.filter((m) => m.homeClubId === myClub.id && m.result).slice(-6);
  const avgAtt = homeGames.length ? Math.round(avg(homeGames.map((m) => m.result!.attendance))) : 0;
  return (
    <DashPage>
      <CorporateBox g={g} onChange={onChange} />

      <DashBox title="Vereinsprofil" info="ansehen" icon="stadium">
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 8 }}>
          <ClubCrest club={myClub} size={84} />
          <div><div style={{ fontSize: 22, fontWeight: 900 }}><ClubLink id={myClub.id}>{myClub.name}</ClubLink></div><div className="dnote">gegründet {myClub.founded} · {myClub.city}</div></div>
        </div>
        <Meter label="Ansehen" value={myClub.reputation} />
        <KV k="Vereinsfarben" v={<span className="dswatch"><i style={{ background: myClub.colors.primary }} /><i style={{ background: myClub.colors.secondary }} /></span>} />
      </DashBox>

      <DashBox title="Mitarbeiter" info="mitarbeiter" icon="staff" onClick={() => onGoto('staff')} right={`${fmtDM(staffCost)} / Monat`}>
        {staff.length ? staff.slice(0, 8).map((s) => (
          <div key={s.id} className="dlist-row"><span className="grow">{s.name}</span><span className="meta">{s.effect}</span></div>
        )) : <Empty icon="staff">Noch keine Mitarbeiter angestellt.</Empty>}
      </DashBox>

      <DashBox title="Vereinsgelände" info="einrichtungen" icon="facilities" onClick={() => onGoto('facilities')}>
        {facs.slice(0, 8).map((f) => (
          <div key={f.key} className="dlist-row">
            <span className="grow">{f.name}</span>
            <span className="dpips">{Array.from({ length: MAX_LEVEL }, (_, i) => <i key={i} className={i < (infra[f.key] ?? 0) ? 'on' : ''} />)}</span>
          </div>
        ))}
      </DashBox>

      <DashBox title="Stadion" info="auslastung" icon="stadium" onClick={() => onGoto('stadium')} right={myClub.stadium.name}>
        <div className="dkpis">
          <Kpi value={myClub.stadium.capacity.toLocaleString('de-DE')} label="Plätze" />
          <Kpi value={`${Math.round(expectedAttendanceRate(myClub, undefined, yearOf(g.calendar.currentDate)) * 100)} %`} label="Auslastung" />
        </div>
        <KV k="Stehplatz" v={fmtDMfull(priceOf(myClub, 'steh', yearOf(g.calendar.currentDate)) * seatPriceScale(myClub, yearOf(g.calendar.currentDate)))} />
        <Meter label="Zustand" value={myClub.stadium.condition} color={condBar(myClub.stadium.condition)} />
      </DashBox>

      <DashBox title="Fans" info="fanStimmung" icon="fans" onClick={() => onGoto('fans')}>
        <KV k="Ø Zuschauer (letzte Heimspiele)" v={avgAtt ? avgAtt.toLocaleString('de-DE') : '–'} />
        {homeGames.slice(-5).reverse().map((m) => (
          <Meter key={m.id} label={g.clubs[m.awayClubId]?.name ?? '—'} value={m.result!.attendance} max={myClub.stadium.capacity} text={m.result!.attendance.toLocaleString('de-DE')} />
        ))}
        {!homeGames.length && <Empty icon="fans">Noch kein Heimspiel.</Empty>}
      </DashBox>
    </DashPage>
  );
}
