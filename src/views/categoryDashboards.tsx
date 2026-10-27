import ClubCrest from '../components/ClubCrest';
import { EURO_COMP_NAMES } from '../data/europe';
import { STAFF_BY_ID, staffMonthlyTotal } from '../data/staff';
import { TIMELINE } from '../data/timeline';
import { ROUND_NAMES, nextPlayerTie } from '../engine/cup';
import { economyScale, yearOf } from '../engine/economy';
import { nextPlayerEuroTie } from '../engine/euro';
import { computeMonthly, totalExpense, totalIncome } from '../engine/finances';
import { FACILITIES, MAX_LEVEL } from '../engine/infrastructure';
import { getAvailablePlayers } from '../engine/transfers';
import { getFormation } from '../data/formations';
import { Game } from '../game/state';
import { Screen } from '../shell/navigation';
import { BoxLink, DashBox, DashPage, Empty, KV, Kpi, Meter } from '../ui/DashPage';
import { fmtDM, fmtDMfull, fmtDateShort, vColor } from '../ui/format';
import {
  FormDots, GROUP_DE, MatchRow, PlayerRow, avg, groupOf, monthsUntil, ownLeagueMatches, squadOf, tableRow,
} from './shared';
import { ScoutStars, scoutMid } from './shared';

// =============================================================================
// KATEGORIE-ÜBERSICHTEN (Reihe-1-Klick im Hauptmenü)
// Jede Kategorie zeigt sechs Boxen im Raster der Zentrale; ein Klick auf eine
// Box führt zur passenden Unterseite.
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
              <div className="dvs-side"><ClubCrest club={g.clubs[next.homeClubId]} size={72} /><b>{g.clubs[next.homeClubId].name}</b></div>
              <div className="dvs-mid">VS<span>{fmtDateShort(next.date).dmy}</span></div>
              <div className="dvs-side"><ClubCrest club={g.clubs[next.awayClubId]} size={72} /><b>{g.clubs[next.awayClubId].name}</b></div>
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

      <DashBox title="Taktik" icon="tactics" onClick={() => onGoto('tactics')} right={TAC_STYLE_DE[t.style] ?? t.style}>
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

// --- KADER ------------------------------------------------------------------
export function KaderDashboard({ g, onGoto }: { g: Game; onGoto: (s: Screen) => void }) {
  const myClub = g.clubs[g.managedClubId];
  const squad = squadOf(g);
  const today = g.calendar.currentDate;
  const injured = squad.filter((p) => p.availability === 'injured');
  const suspended = squad.filter((p) => p.suspensionMatches > 0);
  const groups = ['GK', 'DEF', 'MID', 'ATT'];
  const tired = [...squad].sort((a, b) => (a.frische ?? 100) - (b.frische ?? 100)).slice(0, 6);
  const expiring = [...squad].sort((a, b) => a.contract.expiryDate.localeCompare(b.contract.expiryDate)).slice(0, 6);
  const talents = squad.filter((p) => p.age <= 21).sort((a, b) => scoutMid(b) - scoutMid(a)).slice(0, 6);
  const youth = myClub.youthPlayerIds.map((id) => g.youthPlayers[id]).filter(Boolean);
  const topYouth = [...youth].sort((a, b) => (b.scoutedPotentialMax ?? 0) - (a.scoutedPotentialMax ?? 0)).slice(0, 5);
  const wages = squad.reduce((s, p) => s + p.contract.weeklyWage, 0);
  return (
    <DashPage>
      <DashBox title="Kader" icon="squad" onClick={() => onGoto('squad')} right={`${squad.length} Spieler`}>
        <div className="dkpis">
          <Kpi value={Math.round(avg(squad.map((p) => p.overall)))} label="Ø Stärke" />
          <Kpi value={avg(squad.map((p) => p.age)).toFixed(1)} label="Ø Alter" />
          <Kpi value={injured.length} label="Verletzt" color={injured.length ? 'var(--red)' : undefined} />
          <Kpi value={suspended.length} label="Gesperrt" color={suspended.length ? 'var(--red)' : undefined} />
        </div>
        {[...squad].sort((a, b) => b.overall - a.overall).slice(0, 4).map((p) => <PlayerRow key={p.id} p={p} value={p.overall} />)}
      </DashBox>

      <DashBox title="Positionen" icon="tactics" onClick={() => onGoto('squad')}>
        {groups.map((gr) => {
          const ps = squad.filter((p) => groupOf(p) === gr).sort((a, b) => b.overall - a.overall);
          return (
            <div key={gr} className="dlist-row">
              <span className="grow"><b>{GROUP_DE[gr]}</b> <span className="muted">· {ps.length} Spieler</span></span>
              <span className="meta">{ps.slice(0, 3).map((p) => p.lastName).join(', ')}</span>
              <span className="val" style={{ color: vColor(Math.round(avg(ps.slice(0, 3).map((p) => p.overall)))) }}>{Math.round(avg(ps.slice(0, 3).map((p) => p.overall))) || '–'}</span>
            </div>
          );
        })}
        <div className="dnote mt8">Wert = Ø der drei Besten je Mannschaftsteil.</div>
      </DashBox>

      <DashBox title="Belastung" icon="training" onClick={() => onGoto('training')} right="niedrigste Frische">
        {tired.map((p) => <Meter key={p.id} label={p.fullName} value={p.frische ?? 100} color={vColor(p.frische ?? 100)} />)}
      </DashBox>

      <DashBox title="Verträge" icon="contracts" onClick={() => onGoto('vertraege')} right={`${fmtDM(wages)} / Woche`}>
        {expiring.map((p) => {
          const left = monthsUntil(today, p.contract.expiryDate);
          return <PlayerRow key={p.id} p={p} sub={`${p.age} J.`} value={left <= 12 ? `${left} Mon.` : new Date(p.contract.expiryDate).getUTCFullYear()} color={left <= 6 ? 'var(--orange)' : 'var(--text)'} />;
        })}
      </DashBox>

      <DashBox title="Talente" icon="youth" onClick={() => onGoto('squad')} right="bis 21 Jahre">
        {talents.length ? talents.map((p) => (
          <PlayerRow key={p.id} p={p} sub={`${p.age} J. · ${p.overall}`} value={<ScoutStars p={p} />} color="var(--yellow)" />
        )) : <Empty icon="youth">Keine jungen Spieler im Profikader.</Empty>}
      </DashBox>

      <DashBox title="Jugendakademie" icon="youth" onClick={() => onGoto('youth')} right={`${youth.length} Talente`}>
        {topYouth.length ? topYouth.map((p) => (
          <PlayerRow key={p.id} p={p} sub={`${p.age} J.`} value={p.scoutedPotentialMin != null ? `${p.scoutedPotentialMin}–${p.scoutedPotentialMax}` : '–'} color="var(--accent)" />
        )) : <Empty icon="youth">Noch keine Talente in der Akademie.</Empty>}
        <div className="dnote mt8">Wert = geschätzte Potenzial-Spanne der Scouts.</div>
      </DashBox>
    </DashPage>
  );
}

// --- TRANSFERS --------------------------------------------------------------
export function TransfersDashboard({ g, onGoto }: { g: Game; onGoto: (s: Screen) => void }) {
  const myClub = g.clubs[g.managedClubId];
  const fin = myClub.finances;
  const squad = squadOf(g);
  const market = getAvailablePlayers(g.players, g.managedClubId);
  const best = [...market].sort((a, b) => b.overall - a.overall).slice(0, 6);
  const young = [...market].filter((p) => p.age <= 21).sort((a, b) => scoutMid(b) - scoutMid(a)).slice(0, 6);
  const listed = squad.filter((p) => p.transferListed);
  const moves = Object.values(g.players)
    .flatMap((p) => (p.history?.transfers ?? []).map((t) => ({ p, t })))
    .sort((a, b) => b.t.date.localeCompare(a.t.date))
    .slice(0, 7);
  const wageBill = squad.reduce((s, p) => s + p.contract.weeklyWage, 0);
  const groups = ['GK', 'DEF', 'MID', 'ATT'];
  const needs = groups.map((gr) => {
    const ps = squad.filter((p) => groupOf(p) === gr).sort((a, b) => b.overall - a.overall);
    return { gr, n: ps.length, top: Math.round(avg(ps.slice(0, 2).map((p) => p.overall))) };
  }).sort((a, b) => a.top - b.top);
  return (
    <DashPage>
      <DashBox title="Budget" icon="finances" onClick={() => onGoto('transfers')}>
        <div className="dkpis">
          <Kpi value={fmtDM(fin.transferBudget)} label="Transferbudget" color="var(--green)" />
          <Kpi value={fmtDM(fin.balance)} label="Kontostand" color={fin.balance >= 0 ? 'var(--text)' : 'var(--red)'} />
        </div>
        <KV k="Gehälter pro Woche" v={fmtDM(wageBill)} />
        {fin.wageBudget > 0 && <Meter label="Gehaltsbudget genutzt" value={wageBill} max={fin.wageBudget} text={`${Math.round((wageBill / fin.wageBudget) * 100)} %`} color={wageBill > fin.wageBudget ? 'var(--red)' : 'var(--accent)'} />}
      </DashBox>

      <DashBox title="Bedarf" icon="squad" onClick={() => onGoto('squad')}>
        {needs.map((n, i) => (
          <div key={n.gr} className="dlist-row">
            <span className="grow"><b>{GROUP_DE[n.gr]}</b> <span className="muted">· {n.n} Spieler</span></span>
            <span className="val" style={{ color: vColor(n.top) }}>{n.top || '–'}</span>
            {i === 0 && <span className="dchip on">Priorität</span>}
          </div>
        ))}
        <div className="dnote mt8">Wert = Ø der zwei Besten je Mannschaftsteil. Der schwächste Teil ist markiert.</div>
      </DashBox>

      <DashBox title="Top auf dem Markt" icon="transfers" onClick={() => onGoto('transfers')} right={`${market.length} verfügbar`}>
        {best.length ? best.map((p) => <PlayerRow key={p.id} p={p} sub={`${p.age} J. · ${g.clubs[p.clubId]?.shortName ?? '—'}`} value={p.overall} />) : <Empty icon="transfers">Derzeit niemand verfügbar.</Empty>}
      </DashBox>

      <DashBox title="Junge Talente auf dem Markt" icon="youth" onClick={() => onGoto('transfers')}>
        {young.length ? young.map((p) => <PlayerRow key={p.id} p={p} sub={`${p.age} J. · ${p.overall}`} value={<ScoutStars p={p} />} color="var(--yellow)" />) : <Empty icon="youth">Keine Talente verfügbar.</Empty>}
      </DashBox>

      <DashBox title="Eigene Transferliste" icon="negotiations" right={`${listed.length}`}>
        {listed.length ? listed.map((p) => <PlayerRow key={p.id} p={p} sub={fmtDM(p.contract.transferValue)} value={p.overall} />) : <Empty icon="negotiations">Kein Spieler steht auf der Transferliste.</Empty>}
      </DashBox>

      <DashBox title="Letzte Wechsel" icon="news">
        {moves.length ? moves.map(({ p, t }, i) => (
          <div key={i} className="dlist-row">
            <span className="meta" style={{ minWidth: 64 }}>{fmtDateShort(t.date).dmy}</span>
            <span className="grow">{p.fullName} <span className="muted">· {t.fromClub} → {t.toClub}</span></span>
            <span className="val">{t.fee > 0 ? fmtDM(t.fee) : 'ablösefrei'}</span>
          </div>
        )) : <Empty icon="news">Noch keine Wechsel in diesem Spiel.</Empty>}
      </DashBox>
    </DashPage>
  );
}

// --- FINANZEN ---------------------------------------------------------------
const INCOME_DE: Record<string, string> = {
  ticketSales: 'Zuschauer', tvMoney: 'Fernsehen', sponsorship: 'Sponsoring', merchandise: 'Fanartikel',
  transferIncome: 'Transfers', prizeMoney: 'Prämien', catering: 'Catering', advertising: 'Werbung',
  membership: 'Mitglieder', matchday: 'Spieltag', other: 'Sonstiges',
};
const EXPENSE_DE: Record<string, string> = {
  wages: 'Spielergehälter', transferExpense: 'Transfers', stadiumMaintenance: 'Stadion', trainingFacilities: 'Trainingsanlagen',
  staffWages: 'Mitarbeiter', facilities: 'Gebäude', other: 'Sonstiges',
};

export function FinanzenDashboard({ g, onGoto }: { g: Game; onGoto: (s: Screen) => void }) {
  const myClub = g.clubs[g.managedClubId];
  const fin = myClub.finances;
  const m = computeMonthly(myClub, g.players, g.table, economyScale(yearOf(g.calendar.currentDate)));
  const inc = totalIncome(fin), exp = totalExpense(fin);
  const incRows = Object.entries(fin.income).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const expRows = Object.entries(fin.expenses).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const tx = [...fin.transactions].reverse().slice(0, 9);
  const hist = (fin.balanceHistory ?? []).slice(-24);
  const c = myClub.commerce;
  return (
    <DashPage>
      <DashBox title="Kassenstand" icon="finances" onClick={() => onGoto('finances')}>
        <div className="dkpis">
          <Kpi value={fmtDM(fin.balance)} label="Kontostand" color={fin.balance >= 0 ? 'var(--accent)' : 'var(--red)'} />
          <Kpi value={fmtDM(m.net)} label="Saldo pro Monat" color={m.net >= 0 ? 'var(--green)' : 'var(--red)'} />
        </div>
        <Sparkline values={hist.map((h) => h.balance)} />
      </DashBox>

      <DashBox title="Einnahmen (Saison)" icon="dashFinanzen" onClick={() => onGoto('finances')} right={fmtDM(inc)}>
        {incRows.length ? incRows.slice(0, 7).map(([k, v]) => <Meter key={k} label={INCOME_DE[k] ?? k} value={v} max={incRows[0][1]} text={fmtDM(v)} color="var(--green)" />) : <Empty icon="finances">Noch keine Einnahmen gebucht.</Empty>}
      </DashBox>

      <DashBox title="Ausgaben (Saison)" icon="dashFinanzen" onClick={() => onGoto('finances')} right={fmtDM(exp)}>
        {expRows.length ? expRows.slice(0, 7).map(([k, v]) => <Meter key={k} label={EXPENSE_DE[k] ?? k} value={v} max={expRows[0][1]} text={fmtDM(v)} color="var(--orange)" />) : <Empty icon="finances">Noch keine Ausgaben gebucht.</Empty>}
      </DashBox>

      <DashBox title="Monatliche Fixposten" icon="schedule">
        <KV k="Trikotsponsor" v={`+${fmtDM(m.sponsorship)}`} color="var(--green)" />
        <KV k="Bandenwerbung" v={`+${fmtDM(m.advertising)}`} color="var(--green)" />
        <KV k="Mitgliedsbeiträge" v={`+${fmtDM(m.membership)}`} color="var(--green)" />
        <KV k="Spielergehälter" v={`−${fmtDM(m.wages)}`} color="var(--red)" />
        <KV k="Mitarbeiter" v={`−${fmtDM(m.staffWages)}`} color="var(--red)" />
        <KV k="Stadion & Gebäude" v={`−${fmtDM(m.stadiumMaintenance + m.facilities)}`} color="var(--red)" />
      </DashBox>

      <DashBox title="Sponsoren" icon="sponsoring" onClick={() => onGoto('sponsoring')}>
        <KV k="Trikot" v={c?.shirtSponsor ? `${c.shirtSponsor.name}` : 'kein Vertrag'} color={c?.shirtSponsor ? undefined : 'var(--orange)'} />
        {c?.shirtSponsor && <KV k="· pro Jahr / Restlaufzeit" v={`${fmtDM(c.shirtSponsor.annualValue)} · ${c.shirtSponsor.yearsLeft} J.`} />}
        <KV k="Banden" v={c?.banden ? `${c.banden.name}` : 'kein Vertrag'} color={c?.banden ? undefined : 'var(--orange)'} />
        {c?.banden && <KV k="· pro Jahr / Restlaufzeit" v={`${fmtDM(c.banden.annualValue)} · ${c.banden.yearsLeft} J.`} />}
        <KV k="Offene Angebote" v={(c?.shirtOffers?.length ?? 0) + (c?.bandenOffers?.length ?? 0)} />
        <BoxLink>Sponsoring öffnen</BoxLink>
      </DashBox>

      <DashBox title="Letzte Buchungen" icon="contracts" onClick={() => onGoto('finances')}>
        {tx.length ? tx.map((t) => (
          <div key={t.id} className="dlist-row">
            <span className="meta" style={{ minWidth: 64 }}>{fmtDateShort(t.date).dmy}</span>
            <span className="grow">{t.description}</span>
            <span className="val" style={{ color: t.amount >= 0 ? 'var(--green)' : 'var(--red)' }}>{t.amount >= 0 ? '+' : '−'}{fmtDM(Math.abs(t.amount))}</span>
          </div>
        )) : <Empty icon="contracts">Noch keine Buchungen.</Empty>}
      </DashBox>
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
  const path = values.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="dspark" preserveAspectRatio="none">
      {min < 0 && <line x1={0} x2={W} y1={y(0)} y2={y(0)} stroke="var(--red)" strokeDasharray="4 4" strokeWidth="1" />}
      <path d={`${path} L${x(values.length - 1)},${H} L${x(0)},${H} Z`} fill="rgba(0,217,255,0.12)" />
      <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// --- VEREIN -----------------------------------------------------------------
export function VereinDashboard({ g, onGoto }: { g: Game; onGoto: (s: Screen) => void }) {
  const myClub = g.clubs[g.managedClubId];
  const infra = myClub.infrastructure as unknown as Record<string, number>;
  const year = yearOf(g.calendar.currentDate);
  const staff = (g.hiredStaff ?? []).map((id) => STAFF_BY_ID[id]).filter(Boolean);
  const staffCost = staffMonthlyTotal(g.hiredStaff ?? [], economyScale(year));
  const facs = FACILITIES.filter((f) => !f.unlockYear || f.unlockYear <= year);
  const homeGames = g.fixtures.filter((m) => m.homeClubId === myClub.id && m.result).slice(-6);
  const avgAtt = homeGames.length ? Math.round(avg(homeGames.map((m) => m.result!.attendance))) : 0;
  const row = tableRow(g);
  const conf = myClub.boardConfidence ?? 50;
  return (
    <DashPage>
      <DashBox title="Vorstand" icon="dashVerein">
        <div className="dkpis">
          <Kpi value={row ? `${row.position}.` : '–'} label="Tabellenplatz" />
          <Kpi value={`${Math.round(conf)}`} label="Vertrauen" color={vColor(conf)} />
        </div>
        <KV k="Saisonziel" v={myClub.boardExpectation} />
        <Meter label="Vertrauen des Vorstands" value={conf} color={vColor(conf)} />
        <div className="dnote mt8">Unter 20 droht die Entlassung.</div>
      </DashBox>

      <DashBox title="Vereinsprofil" icon="stadium">
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 8 }}>
          <ClubCrest club={myClub} size={84} />
          <div><div style={{ fontSize: 22, fontWeight: 900 }}>{myClub.name}</div><div className="dnote">gegründet {myClub.founded} · {myClub.city}</div></div>
        </div>
        <Meter label="Ansehen" value={myClub.reputation} />
        <KV k="Vereinsfarben" v={<span className="dswatch"><i style={{ background: myClub.colors.primary }} /><i style={{ background: myClub.colors.secondary }} /></span>} />
      </DashBox>

      <DashBox title="Mitarbeiter" icon="staff" onClick={() => onGoto('staff')} right={`${fmtDM(staffCost)} / Monat`}>
        {staff.length ? staff.slice(0, 8).map((s) => (
          <div key={s.id} className="dlist-row"><span className="grow">{s.name}</span><span className="meta">{s.effect}</span></div>
        )) : <Empty icon="staff">Noch keine Mitarbeiter angestellt.</Empty>}
      </DashBox>

      <DashBox title="Vereinsgelände" icon="facilities" onClick={() => onGoto('facilities')}>
        {facs.slice(0, 8).map((f) => (
          <div key={f.key} className="dlist-row">
            <span className="grow">{f.name}</span>
            <span className="dpips">{Array.from({ length: MAX_LEVEL }, (_, i) => <i key={i} className={i < (infra[f.key] ?? 0) ? 'on' : ''} />)}</span>
          </div>
        ))}
      </DashBox>

      <DashBox title="Stadion" icon="stadium" onClick={() => onGoto('stadium')} right={myClub.stadium.name}>
        <div className="dkpis">
          <Kpi value={myClub.stadium.capacity.toLocaleString('de-DE')} label="Plätze" />
          <Kpi value={`${Math.round(myClub.stadium.averageAttendanceRate * 100)} %`} label="Auslastung" />
        </div>
        <KV k="Ticketpreis" v={fmtDMfull(myClub.stadium.ticketPrice)} />
        <Meter label="Zustand" value={myClub.stadium.condition} color={vColor(myClub.stadium.condition)} />
      </DashBox>

      <DashBox title="Fans" icon="fans" onClick={() => onGoto('fans')}>
        <KV k="Ø Zuschauer (letzte Heimspiele)" v={avgAtt ? avgAtt.toLocaleString('de-DE') : '–'} />
        {homeGames.slice(-5).reverse().map((m) => (
          <Meter key={m.id} label={g.clubs[m.awayClubId]?.name ?? '—'} value={m.result!.attendance} max={myClub.stadium.capacity} text={m.result!.attendance.toLocaleString('de-DE')} />
        ))}
        {!homeGames.length && <Empty icon="fans">Noch kein Heimspiel.</Empty>}
      </DashBox>
    </DashPage>
  );
}

// --- STATISTIKEN ------------------------------------------------------------
export function StatistikenDashboard({ g, onGoto }: { g: Game; onGoto: (s: Screen) => void }) {
  const myId = g.managedClubId;
  const row = tableRow(g);
  const rows = g.table.rows;
  const idx = row ? rows.indexOf(row) : 0;
  const around = rows.slice(Math.max(0, idx - 3), Math.max(0, idx - 3) + 7);
  const leagueIds = new Set(rows.map((r) => r.clubId));
  const lp = Object.values(g.players).filter((p) => leagueIds.has(p.clubId));
  const scorers = [...lp].filter((p) => p.seasonStats.goals > 0).sort((a, b) => b.seasonStats.goals - a.seasonStats.goals).slice(0, 7);
  const rated = [...lp].filter((p) => p.seasonStats.ratedMatches >= 3).sort((a, b) => a.seasonStats.averageRating - b.seasonStats.averageRating).slice(0, 7);
  const cup = g.cup;
  const myTie = cup ? nextPlayerTie(cup, myId) : null;
  const cupOut = cup && !myTie && cup.rounds.some((r) => r.ties.some((t) => t.played && (t.homeClubId === myId || t.awayClubId === myId) && t.winnerClubId !== myId));
  const euro = (['ec', 'cwc', 'uefa'] as const).map((k) => ({ k, c: g.euroCups?.[k] ?? null })).filter((e) => e.c && e.c.participantIds.includes(myId));
  const year = yearOf(g.calendar.currentDate);
  const milestones = TIMELINE.filter((e) => e.year <= year).slice(-6).reverse();
  return (
    <DashPage>
      <DashBox title="Liga" icon="dashTabelle" onClick={() => onGoto('table')} right={row ? `${row.position}. · ${row.points} Pkt.` : undefined}>
        <table className="dtable">
          <thead><tr><th>#</th><th>Verein</th><th className="num">Sp</th><th className="num">TD</th><th className="num">Pkt</th></tr></thead>
          <tbody>
            {around.map((r) => (
              <tr key={r.clubId} className={r.clubId === myId ? 'me' : ''}>
                <td>{r.position}</td><td>{g.clubs[r.clubId]?.name}</td><td className="num">{r.played}</td>
                <td className="num">{r.goalDifference > 0 ? '+' : ''}{r.goalDifference}</td><td className="num">{r.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </DashBox>

      <DashBox title="Torjäger" icon="matchball" onClick={() => onGoto('table')}>
        {scorers.length ? scorers.map((p) => <PlayerRow key={p.id} p={p} sub={g.clubs[p.clubId]?.shortName} value={p.seasonStats.goals} color="var(--accent)" />) : <Empty icon="matchball">Noch keine Tore gefallen.</Empty>}
      </DashBox>

      <DashBox title="Beste Noten" icon="stats" right="ab 3 Spielen">
        {rated.length ? rated.map((p) => <PlayerRow key={p.id} p={p} sub={g.clubs[p.clubId]?.shortName} value={p.seasonStats.averageRating.toFixed(2)} color="var(--green)" />) : <Empty icon="stats">Noch zu wenige Spiele.</Empty>}
      </DashBox>

      <DashBox title="DFB-Pokal" icon="trophy" onClick={() => onGoto('cup')}>
        {cup ? (
          <>
            <KV k="Aktuelle Runde" v={cup.rounds[cup.currentRoundIndex]?.name ?? '—'} />
            <KV k="Dein Status" v={cup.winnerClubId === myId ? 'Pokalsieger!' : myTie ? `dabei – ${ROUND_NAMES[myTie.round] ?? ''}` : cupOut ? 'ausgeschieden' : '—'} color={cupOut ? 'var(--red)' : 'var(--green)'} />
            {myTie && <KV k="Nächster Gegner" v={g.clubs[myTie.homeClubId === myId ? myTie.awayClubId : myTie.homeClubId]?.name ?? '—'} />}
            {cup.winnerClubId && <KV k="Sieger" v={g.clubs[cup.winnerClubId]?.name ?? '—'} />}
          </>
        ) : <Empty icon="trophy">Kein Pokal in dieser Saison.</Empty>}
      </DashBox>

      <DashBox title="International" icon="international" onClick={() => onGoto('international')}>
        {euro.length ? euro.map(({ k, c }) => {
          const t = nextPlayerEuroTie(c!, myId);
          return <KV key={k} k={EURO_COMP_NAMES[k]} v={t ? `${c!.rounds[t.round]?.name ?? ''}` : c!.winnerClubId === myId ? 'Sieger!' : 'ausgeschieden'} />;
        }) : <Empty icon="international">Diese Saison nicht im Europapokal.</Empty>}
      </DashBox>

      <DashBox title="Chronik" icon="chronicle" onClick={() => onGoto('chronicle')}>
        {milestones.map((e) => (
          <div key={e.id} className="dlist-row"><span className="meta" style={{ minWidth: 44 }}>{e.year}</span><span className="grow">{e.title}</span></div>
        ))}
      </DashBox>
    </DashPage>
  );
}
