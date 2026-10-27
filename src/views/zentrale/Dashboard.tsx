import ClubCrest from '../../components/ClubCrest';
import ClubModal from '../../components/ClubModal';
import Icon from '../../components/Icon';
import JerseySVG, { type JerseyPattern } from '../../components/JerseySVG';
import { getClubKitDisplay } from '../../data/kits';
import { CalendarEngine } from '../../engine/calendar';
import { ROUND_NAMES, nextPlayerTie } from '../../engine/cup';
import { yearOf } from '../../engine/economy';
import { computeMonthly } from '../../engine/finances';
import { FACILITIES, MAX_LEVEL } from '../../engine/infrastructure';
import { divisionLabel } from '../../engine/leagues';
import { buildClubProfile } from '../../game/clubProfile';
import { Game } from '../../game/state';
import { MSG_CAT_ICON } from '../../shell/CalendarStrip';
import { Screen } from '../../shell/navigation';
import { Match, POSITION_GROUPS } from '../../types';
import { fmtDMfull, fmtDateFull, fmtDateShort, zoneClass } from '../../ui/format';
import { BalanceChart } from '../finanzen/FinancesView';
import { useState } from 'react';

// =============================================================================
// DASHBOARD
// =============================================================================
// Kleiner Donut-Ring (Ø Stärke / Ø Alter / Teamchemie) im Mockup-Stil.
// ring=false zeigt nur die blanke Zahl (in der Akzentfarbe) ohne Kringel.
export function Donut({ value, frac, color, label, ring = true }: { value: string; frac: number; color: string; label: string; ring?: boolean }) {
  const r = 25;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - Math.max(0, Math.min(1, frac)));
  return (
    <div className="ckd-donut">
      {ring ? (
        <div className="ckd-donut-ring">
          <svg viewBox="0 0 60 60" className="ckd-donut-svg">
            <circle className="ckd-donut-bg" cx="30" cy="30" r={r} />
            <circle
              className="ckd-donut-fg"
              cx="30" cy="30" r={r}
              style={{ stroke: color, strokeDasharray: circ, strokeDashoffset: off }}
            />
          </svg>
          <span className="ckd-donut-val">{value}</span>
        </div>
      ) : (
        <div className="ckd-donut-plain"><span className="ckd-donut-num" style={{ color }}>{value}</span></div>
      )}
      <span className="ckd-donut-lbl">{label}</span>
    </div>
  );
}

export function Dashboard({ g, onGoto, onWatch, onOpenEditor }: {
  g: Game; onGoto: (s: Screen) => void; onWatch: (id: string) => void;
  onOpenEditor: () => void;
}) {
  const [clubModalId, setClubModalId] = useState<string | null>(null);
  const myClub = g.clubs[g.managedClubId];
  const myRow = g.table.rows.find((r) => r.clubId === g.managedClubId);
  const rows = g.table.rows;
  // Tabellen-Ausschnitt fuer das Dashboard-Panel: max. 10 Zeilen, eigenes Team
  // immer sichtbar. Echte Ligaplaetze bleiben erhalten (nur slicen, nicht neu sortieren).
  const tableRows = (() => {
    const total = rows.length;
    if (total <= 10) return rows;
    const p = rows.findIndex((r) => r.clubId === g.managedClubId); // 0-basiert
    if (p < 0) return rows.slice(0, 10);
    const pos = p + 1; // 1-basierter Platz
    let start: number, end: number;
    if (pos <= 7) { start = 0; end = 9; }
    else if (pos >= total - 2) { start = total - 10; end = total - 1; }
    else { start = p - 6; end = p + 3; }
    return rows.slice(start, end + 1);
  })();
  const leagueName = divisionLabel(g.leagues.playerDivision.tier, g.leagues.playerDivision.group);
  const nextLeague = g.fixtures.find((m) => m.status === 'scheduled' && m.involvesPlayerClub);
  const nextTie = g.cup ? nextPlayerTie(g.cup, g.managedClubId) : null;
  // Chronologisch nächstes Spiel: Liga oder Pokal – das frühere Datum gewinnt.
  const nextIsCup = !!nextTie && (!nextLeague || nextTie.date < nextLeague.date);
  const nextMatch = nextIsCup ? nextTie : nextLeague;
  // Wettbewerb (rechts oben) + Detailzeile darunter: Liga → "XX. Spieltag", Pokal → Runde.
  const nextCompName = nextIsCup ? 'DFB-Pokal' : leagueName;
  const nextCompDetail = nextIsCup
    ? (nextTie ? (ROUND_NAMES[nextTie.round] ?? 'Pokal') : 'Pokal')
    : (nextLeague ? `${nextLeague.matchday}. Spieltag` : '');
  const squad = myClub.playerIds.map((id) => g.players[id]).filter(Boolean);
  const monthly = computeMonthly(myClub, g.players, g.table);
  const monIncome = monthly.sponsorship + monthly.advertising + monthly.membership + monthly.cateringLease + monthly.tv + monthly.commercial + monthly.placementBonus;
  const monExpense = monthly.wages + monthly.staffWages + monthly.stadiumMaintenance + monthly.facilities + monthly.otherFixed;
  const bal = myClub.finances.balance;
  const finStatus = bal >= Math.max(1, myClub.finances.transferBudget) ? 'Solide' : bal > 0 ? 'Stabil' : 'Angespannt';
  const bc = myClub.boardConfidence;
  const boardLabel = bc >= 66 ? 'Zufrieden' : bc >= 40 ? 'Neutral' : 'Unzufrieden';
  const boardCls = bc >= 66 ? 'cvb-good' : bc >= 40 ? 'cvb-mid' : 'cvb-bad';
  const repGold = Math.max(0, Math.min(5, Math.round(myClub.reputation / 20)));
  const homeClub = nextMatch ? g.clubs[nextMatch.homeClubId] : null;
  const awayClub = nextMatch ? g.clubs[nextMatch.awayClubId] : null;
  // Gegenüberstellung für "Nächstes Spiel": echte Werte beider Vereine.
  const clubCompareStat = (club: typeof myClub | null) => {
    if (!club) return null;
    const ps = (club.playerIds ?? []).map((id) => g.players[id]).filter(Boolean);
    const ovr = ps.length ? Math.round(ps.reduce((s, p) => s + p.overall, 0) / ps.length) : 0;
    const row = g.table.rows.find((r) => r.clubId === club.id) ?? null;
    return {
      ovr,
      pos: row?.position ?? null,
      form: row?.form ?? [],
      gf: row?.goalsFor ?? 0,
      ga: row?.goalsAgainst ?? 0,
      gd: row?.goalDifference ?? 0,
    };
  };
  const homeStat = clubCompareStat(homeClub);
  const awayStat = clubCompareStat(awayClub);
  const news = (g.messages ?? []).slice(0, 6);
  const totalPlayers = squad.length;
  const avgAge = totalPlayers ? squad.reduce((s, p) => s + p.age, 0) / totalPlayers : 0;
  const avgOvr = totalPlayers ? Math.round(squad.reduce((s, p) => s + p.overall, 0) / totalPlayers) : 0;
  const posCount = { GK: 0, DEF: 0, MID: 0, ATT: 0 } as Record<'GK' | 'DEF' | 'MID' | 'ATT', number>;
  squad.forEach((p) => { const grp = POSITION_GROUPS[p.naturalPosition]; if (grp) posCount[grp]++; });
  const jerseyPattern: JerseyPattern = (myClub.colors.secondary && myClub.colors.secondary.toLowerCase() !== myClub.colors.primary.toLowerCase()) ? 'stripes' : 'solid';
  void jerseyPattern;
  // Heim-/Auswärtstrikot (spielweiter Override zuerst: Bild oder Design, sonst
  // aus Vereinsfarben abgeleitet).
  const homeKit = getClubKitDisplay(myClub, 'home');
  const awayKit = getClubKitDisplay(myClub, 'away');
  // Teamchemie DETERMINISTISCH aus echten Spielerdaten (Moral + Form) – kein Zufall.
  const MORALE_CHEM: Record<string, number> = { very_low: 20, low: 40, okay: 55, good: 75, excellent: 92 };
  const teamChemie = totalPlayers
    ? Math.round(squad.reduce((s, p) => s + 0.7 * (MORALE_CHEM[p.morale] ?? 55) + 0.3 * Math.max(0, Math.min(100, p.form ?? 60)), 0) / totalPlayers)
    : 0;
  // Positionszaehler im Mockup-Stil (TW/ABW/MF/ST) mit je eigener Akzentfarbe.
  const posMeta: { key: 'GK' | 'DEF' | 'MID' | 'ATT'; label: string; color: string }[] = [
    { key: 'GK', label: 'TW', color: '#00d9ff' },
    { key: 'DEF', label: 'ABW', color: '#3ddc84' },
    { key: 'MID', label: 'MF', color: '#4aa8ff' },
    { key: 'ATT', label: 'ST', color: '#9b7cff' },
  ];

  const colorFarben = [myClub.colors.primary, myClub.colors.secondary].filter((c, i, a) => c && a.indexOf(c) === i);
  // Vereinsgelaende-Box: Stufen der ersten (bis zu 6) freigeschalteten Gebaeude.
  const curYear = yearOf(g.calendar.currentDate);
  const FAC_SHORT: Record<string, string> = {
    stadium: 'Stadion', trainingCenter: 'Training', youthAcademy: 'Jugend',
    medical: 'Medizin', merchandising: 'Fanshop', rehaCenter: 'Reha',
    nlz: 'NLZ', performanceCenter: 'Leistung', dataCenter: 'Datenanalyse',
  };
  const facRows = FACILITIES
    .filter((def) => !def.unlockYear || curYear >= def.unlockYear)
    .slice(0, 6)
    .map((def) => ({ key: def.key, name: FAC_SHORT[def.key] ?? def.name, level: (myClub.infrastructure?.[def.key] as number) ?? 0 }));
  return (
    <div className="zentrale-wrap">
      <div className="dashx">

        {/* ZEILE 1, SPALTE 1 — VEREINSÜBERBLICK */}
        <div className="card dashx-verein clickable" onClick={() => onGoto('cat-verein')}>
          <div className="dxh">
            <span className="dxh-ico"><Icon name="dashVerein" size={20} /></span>
            <span className="dxh-title">Vereinsüberblick</span>
            <button
              className="cvb2-edit"
              title="Editor"
              onClick={(e) => { e.stopPropagation(); onOpenEditor(); }}
            >
              Bearbeiten
            </button>
          </div>
          <div className="cvb2-head">
            <div className="cvb2-crest"><ClubCrest club={myClub} size={148} /></div>
            <div className="cvb2-headfields">
              <div className="cvb2-name">{myClub.name}</div>
              <div className="cvb2-row"><span className="cvb2-k">Gegründet</span><span className="cvb2-v">{myClub.founded}</span></div>
              <div className="cvb2-row"><span className="cvb2-k">Stadion</span><span className="cvb2-v">{myClub.stadium.name}</span></div>
              <div className="cvb2-row"><span className="cvb2-k">Kapazität</span><span className="cvb2-v">{myClub.stadium.capacity.toLocaleString('de-DE')}</span></div>
              <div className="cvb2-row"><span className="cvb2-k">Liga</span><span className="cvb2-v">{leagueName}</span></div>
            </div>
          </div>
          <div className="cvb2-sep" />
          <div className="cvb2-cols">
          <div className="cvb2-list">
            <div className="cvb2-lrow"><span className="cvb2-lk">Ziele</span><span className="cvb2-lv">{myClub.boardExpectation}</span></div>
            <div className="cvb2-lrow"><span className="cvb2-lk">Stadt</span><span className="cvb2-lv">{myClub.city}</span></div>
            <div className="cvb2-lrow"><span className="cvb2-lk">Ruf National</span><span className="cvb2-lv cvb-stars">{[0, 1, 2, 3, 4].map((i) => <span key={i} className={i < repGold ? 'on' : ''}>★</span>)}</span></div>
            <div className="cvb2-lrow"><span className="cvb2-lk">Finanzstatus</span><span className="cvb2-lv">{finStatus}</span></div>
            <div className="cvb2-lrow"><span className="cvb2-lk">Vorstand</span><span className={`cvb2-lv ${boardCls}`}><i className="cvb-dot" />{boardLabel}</span></div>
            <div className="cvb2-lrow"><span className="cvb2-lk">Vereinsfarben</span><span className="cvb2-lv cvb2-colors">{colorFarben.map((c, i) => <i key={i} className="cvb2-swatch" style={{ background: c }} />)}</span></div>
          </div>
          <div className="cvb2-facs">
            {facRows.map((f) => (
              <div key={f.key} className="cvb2-frow">
                <span className="cvb2-fname">{f.name}</span>
                <span className="cvb2-fpips">
                  {Array.from({ length: MAX_LEVEL }).map((_, i) => (
                    <i key={i} className={`cvb2-fpip ${i < f.level ? 'on' : ''}`} />
                  ))}
                </span>
              </div>
            ))}
          </div>
          </div>
        </div>

        {/* ZEILE 1, SPALTE 2 — TABELLE */}
        <div className="card dashx-tabelle clickable" onClick={() => onGoto('table')}>
          <div className="dxh">
            <span className="dxh-ico"><Icon name="dashTabelle" size={20} /></span>
            <span className="dxh-title">Tabelle</span>
            <span className="dxh-right">{leagueName}</span>
          </div>
          <table className="dxt">
            <thead>
              <tr><th>#</th><th className="dxt-club">Verein</th><th>Pl</th><th>V</th><th>U</th><th>N</th><th>TD</th><th>Pkt</th></tr>
            </thead>
            <tbody>
              {tableRows.map((r) => {
                const c = g.clubs[r.clubId];
                const me = r.clubId === g.managedClubId;
                return (
                  <tr
                    key={r.clubId}
                    className={`dxt-row ${zoneClass(r.position, rows.length)} ${me ? 'me' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setClubModalId(r.clubId); }}
                    title="Vereinsprofil öffnen"
                  >
                    <td className="dxt-pos">{r.position}</td>
                    <td className="dxt-club">
                      {c && <ClubCrest club={c} size={18} />}
                      <span className="dxt-club-name">{c?.name ?? r.clubId}</span>
                    </td>
                    <td>{r.played}</td>
                    <td>{r.won}</td>
                    <td>{r.drawn}</td>
                    <td>{r.lost}</td>
                    <td>{(r.goalDifference > 0 ? '+' : '') + r.goalDifference}</td>
                    <td className="dxt-pkt">{r.points}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ZEILE 1, SPALTE 3 — NÄCHSTES SPIEL */}
        <div className="card dashx-naechstes clickable" onClick={() => onGoto('fixtures')}>
          <div className="dxh">
            <span className="dxh-ico"><Icon name="dashBall" size={20} /></span>
            <span className="dxh-title">Nächstes Spiel</span>
            <span className="dxh-right dxh-right-stack">
              <span className="dxh-comp">{nextCompName}</span>
              {nextMatch && nextCompDetail && <span className="dxh-round">{nextCompDetail}</span>}
            </span>
          </div>
          {nextMatch && homeClub && awayClub ? (
            <>
              <div className="cns-photo">
                <div className="cns-photo-crests">
                  <div className="cns-vs-side">
                    <ClubCrest club={homeClub} size={96} />
                    <span className="cns-nm">{homeClub.name}</span>
                  </div>
                  <span className="cns-vs">VS</span>
                  <div className="cns-vs-side">
                    <ClubCrest club={awayClub} size={96} />
                    <span className="cns-nm">{awayClub.name}</span>
                  </div>
                </div>
              </div>
              {homeStat && awayStat && (
                <div className="cns-cmp">
                  <div className="cns-cmp-row">
                    <span className={`cns-cmp-v${homeStat.ovr > awayStat.ovr ? ' better' : ''}`}>{homeStat.ovr}</span>
                    <span className="cns-cmp-l">Ø Stärke</span>
                    <span className={`cns-cmp-v${awayStat.ovr > homeStat.ovr ? ' better' : ''}`}>{awayStat.ovr}</span>
                  </div>
                  <div className="cns-cmp-row">
                    <span className={`cns-cmp-v${homeStat.pos != null && awayStat.pos != null && homeStat.pos < awayStat.pos ? ' better' : ''}`}>{homeStat.pos != null ? homeStat.pos + '.' : '–'}</span>
                    <span className="cns-cmp-l">Tabelle</span>
                    <span className={`cns-cmp-v${homeStat.pos != null && awayStat.pos != null && awayStat.pos < homeStat.pos ? ' better' : ''}`}>{awayStat.pos != null ? awayStat.pos + '.' : '–'}</span>
                  </div>
                  <div className="cns-cmp-row">
                    <span className="cns-form">
                      {homeStat.form.length ? homeStat.form.slice(-5).map((f, i) => <span key={i} className={`cns-fp cns-fp-${f}`}>{f === 'W' ? 'S' : f === 'D' ? 'U' : 'N'}</span>) : <span className="cns-cmp-v" style={{ color: 'var(--text-3)' }}>–</span>}
                    </span>
                    <span className="cns-cmp-l">Form</span>
                    <span className="cns-form">
                      {awayStat.form.length ? awayStat.form.slice(-5).map((f, i) => <span key={i} className={`cns-fp cns-fp-${f}`}>{f === 'W' ? 'S' : f === 'D' ? 'U' : 'N'}</span>) : <span className="cns-cmp-v" style={{ color: 'var(--text-3)' }}>–</span>}
                    </span>
                  </div>
                </div>
              )}
              <div className="cns-dsep" aria-hidden="true"><span /><span /></div>
              <div className="cns-meta">
                <div className="cns-meta-row"><span className="cns-meta-ico"><Icon name="kalender" size={22} /></span><span>{fmtDateFull(nextMatch.date)}, 15:30 Uhr</span></div>
                <div className="cns-meta-row"><span className="cns-meta-ico"><Icon name="stadium" size={22} /></span><span>{homeClub.stadium.name}, {homeClub.city}</span></div>
              </div>
            </>
          ) : (
            <div className="dim" style={{ padding: '24px 0', textAlign: 'center' }}>Kein weiteres Spiel angesetzt.</div>
          )}
        </div>

        {/* ZEILE 2, SPALTE 1 — FINANZEN */}
        <div className="card dashx-finanzen clickable" onClick={() => onGoto('finances')}>
          <div className="dxh">
            <span className="dxh-ico"><Icon name="dashFinanzen" size={20} /></span>
            <span className="dxh-title">Finanzen</span>
          </div>
          <div className="dxf-top">
            <div className="dxf-balance">
              <span className="dxf-balance-lbl">Aktueller Kontostand</span>
              <span className={`dxf-balance-val ${bal < 0 ? 'neg' : ''}`}>{fmtDMfull(bal)}</span>
            </div>
            <div className="dxf-stats">
              <div className="dxf-stat">
                <span className="dxf-lbl">Einnahmen (Monat)</span>
                <span className="dxf-val green">{fmtDMfull(monIncome)}</span>
              </div>
              <div className="dxf-stat">
                <span className="dxf-lbl">Ausgaben (Monat)</span>
                <span className="dxf-val red">{fmtDMfull(monExpense)}</span>
              </div>
              <div className="dxf-stat">
                <span className="dxf-lbl">Saldo</span>
                <span className={`dxf-val ${monIncome - monExpense >= 0 ? 'green' : 'red'}`}>{(monIncome - monExpense >= 0 ? '+' : '') + fmtDMfull(monIncome - monExpense)}</span>
              </div>
            </div>
          </div>
          <div className="dxf-chart">
            <BalanceChart points={myClub.finances.balanceHistory ?? []} current={bal} currentDate={g.calendar.currentDate} />
          </div>
        </div>

        {/* ZEILE 2, SPALTE 2 — KADER */}
        <div className="card dashx-kader clickable" onClick={() => onGoto('squad')}>
          <div className="dxh">
            <span className="dxh-ico"><Icon name="dashKader" size={20} /></span>
            <span className="dxh-title">Kader</span>
            <span className="dxh-right">{totalPlayers} Spieler</span>
          </div>
          <div className="ckd3">
            {/* Spalte 1 — Heimtrikot */}
            <div className="ckd3-col">
              <div className="ckd3-jwrap"><JerseySVG image={homeKit.image} primary={homeKit.primary} secondary={homeKit.secondary} pattern={homeKit.pattern} size={220} /></div>
              <span className="ckd3-cap">Heim</span>
            </div>
            {/* Spalte 2 — Auswärtstrikot */}
            <div className="ckd3-col">
              <div className="ckd3-jwrap"><JerseySVG image={awayKit.image} primary={awayKit.primary} secondary={awayKit.secondary} pattern={awayKit.pattern} size={220} /></div>
              <span className="ckd3-cap">Auswärts</span>
            </div>
            {/* Spalte 3 — Kaderinfos */}
            <div className="ckd3-col ckd3-info">
              <div className="ckd3-pos">
                {posMeta.map((pm) => (
                  <div key={pm.key} className="ckd3-pos-row">
                    <span className="ckd3-pos-bar" style={{ background: pm.color }} />
                    <span className="ckd3-pos-lbl">{pm.label}</span>
                    <span className="ckd3-pos-num">{posCount[pm.key]}</span>
                  </div>
                ))}
              </div>
              <div className="ckd3-donuts">
                <Donut value={String(avgOvr)} frac={avgOvr / 100} color="#00d9ff" label="Ø Stärke" ring={false} />
                <Donut value={String(Math.round(avgAge))} frac={avgAge / 40} color="#4aa8ff" label="Ø Alter" ring={false} />
                <Donut value={String(teamChemie)} frac={teamChemie / 100} color="#3ddc84" label="Teamchemie" />
              </div>
            </div>
          </div>
        </div>

        {/* ZEILE 2, SPALTE 3 — NACHRICHTEN */}
        <div className="card dashx-termine clickable" onClick={() => onGoto('news')}>
          <div className="dxh">
            <span className="dxh-ico"><Icon name="dashNews" size={20} /></span>
            <span className="dxh-title">Nachrichten</span>
          </div>
          <div className="cnw">
            {news.length === 0 && <div className="dim" style={{ padding: '18px 0', textAlign: 'center' }}>Keine Nachrichten.</div>}
            {news.map((m) => {
              const sd = fmtDateShort(m.date);
              return (
                <div key={m.id} className={`cnw-row${m.read ? '' : ' is-unread'}`}>
                  <span className="cnw-ico"><Icon name={MSG_CAT_ICON[m.category] ?? 'news'} size={22} /></span>
                  <span className="cnw-body">
                    <span className="cnw-subj">{m.subject}</span>
                    <span className="cnw-text">{m.shortText}</span>
                  </span>
                  <span className="cnw-date">{sd.dmy}</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
      {clubModalId && <ClubModal data={buildClubProfile(g, clubModalId)} onClose={() => setClubModalId(null)} />}
    </div>
  );
}

export function NextMatchCard({ g, m }: { g: Game; m: Match }) {
  const h = g.clubs[m.homeClubId]; const a = g.clubs[m.awayClubId];
  const isHome = m.homeClubId === g.managedClubId;
  const opp = isHome ? a : h;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
        <ClubCrest club={opp} size={44} />
        <div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{opp.name}</div>
          <div className="mini">
            <span className={`pill ${isHome ? 'home' : 'away'}`}>{isHome ? 'HEIM' : 'AUSWÄRTS'}</span>
            <span className="dim" style={{ marginLeft: 8 }}>{m.matchday}. Spieltag</span>
          </div>
        </div>
      </div>
      <div className="dim mini mt12"><Icon name="schedule" /> {CalendarEngine.formatDate(m.date)}</div>
    </div>
  );
}

export function MatchLine({ g, m, onWatch }: { g: Game; m: Match; onWatch?: (id: string) => void }) {
  const h = g.clubs[m.homeClubId]; const a = g.clubs[m.awayClubId];
  return (
    <div className="row" onClick={(e) => { e.stopPropagation(); if (onWatch && m.status === 'finished') onWatch(m.id); }}
      style={{ cursor: onWatch && m.status === 'finished' ? 'pointer' : 'default', padding: '4px 0' }}>
      <span className="dim mini" style={{ minWidth: 40 }}>{m.matchday}. ST</span>
      <span style={{ flex: 1, textAlign: 'right', fontWeight: 600 }}>{h.shortName}</span>
      <b style={{ minWidth: 54, textAlign: 'center', color: 'var(--accent)' }}>
        {m.result ? `${m.result.homeGoals}:${m.result.awayGoals}` : 'vs'}
      </b>
      <span style={{ flex: 1, fontWeight: 600 }}>{a.shortName}</span>
    </div>
  );
}
