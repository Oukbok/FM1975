// =============================================================================
// KARTENVERKAUF (Verein › Kartenverkauf) – Aufbau nach Vorbild EA Fussball Manager:
//   links oben   Übersicht (Zuschauerschnitt, letzte Saison, Zuschauertabelle,
//                Fanbasis, Gesamtkapazität) + Stadion-Draufsicht mit 8 Tribünen
//   rechts oben  Eintrittspreise je Tribüne × Platzkategorie (tickets/PriceTable)
//   links unten  Spiele dieser Saison mit Preiskategorie, Prognose-Spanne, Ist
//   rechts unten Besondere Preise (Topzuschlag, Rabatt, Automatik) + Prognose-Bilanz
// Spielablauf: game/ticketsGame.ts; Rechnung: engine/seating.ts, engine/ticketForecast.ts.
// =============================================================================
import { useState } from 'react';
import { CAT_KEYS, LOGE_GUESTS, STANDS } from '../../data/seatingCatalog';
import { yearOf } from '../../engine/economy';
import { ensureSeating, ensureTickets, expectedSale, standCaps } from '../../engine/seating';
import { ensureEnvironment } from '../../game/environmentGame';
import { leagueClubs } from '../../game/season';
import { forecastStaff } from '../../game/seatingGame';
import { ensureStadiumBlocks } from '../../game/stadiumGame';
import type { Game } from '../../game/state';
import { forecastGame, forecastRecord, homeGames, leagueCaps, setTicketOption, type GameForecast } from '../../game/ticketsGame';
import type { SeatNums, StandId } from '../../types';
import { DashBox, DashPage, Empty, KV } from '../../ui/DashPage';
import { InfoTip } from '../../ui/InfoTip';
import { GamesBox } from './tickets/GamesBox';
import { PriceTable } from './tickets/PriceTable';
import { StandMap } from './tickets/StandMap';
import { n0 } from './tickets/ticketFmt';

const persons = (s?: SeatNums) => CAT_KEYS.reduce((a, k) => a + (k === 'loge' ? (s?.[k] ?? 0) * LOGE_GUESTS : s?.[k] ?? 0), 0);

export function TicketsView({ g, onChange, onGoto }: { g: Game; onChange: () => void; onGoto?: (s: 'stadium') => void }) {
  useState(() => ensureStadiumBlocks(g));
  const [, force] = useState(0);
  const changed = () => { force((x) => x + 1); onChange(); };
  const [selKey, setSelKey] = useState<string | null>(null);
  const [stand, setStand] = useState<StandId | null>(null);
  const club = g.clubs[g.managedClubId];
  const year = yearOf(g.calendar.currentDate);
  const seating = ensureSeating(club, year);
  if (!club.stadium.blocks?.length) {
    return (
      <DashPage>
        <DashBox title="Kartenverkauf" icon="ticket" span={3} rows={2}>
          <Empty icon="stadium">Der laufende Stadionausbau muss erst fertig werden. Danach teilst du hier die Preise je Tribüne ein.
            {' '}<button className="btn btn-sm" onClick={() => onGoto?.('stadium')}>Zum Stadion</button></Empty>
        </DashBox>
      </DashPage>
    );
  }
  const t = ensureTickets(club, year);
  const games = homeGames(g);
  const fcs = new Map<string, GameForecast | null>();
  for (const hg of games) if (!hg.played) fcs.set(hg.key, forecastGame(g, hg));
  const next = games.find((h) => !h.played) ?? null;
  const sel = games.find((h) => h.key === selKey) ?? next ?? games[games.length - 1] ?? null;
  const selFc = sel && !sel.played ? fcs.get(sel.key) ?? null : null;
  // Kontingente des gewählten Spiels. Europapokal (UEFA: nur Sitzplätze): die Stehbereiche werden bestuhlt –
  // standCaps verteilt die zusätzlichen Sitze auf die Stehtribünen, die Draufsicht zeigt also dasselbe Stadion.
  const full = leagueCaps(club, year);
  const caps = selFc?.caps ?? full;
  const stands = standCaps(club, caps)!;
  const seatsOnly = !!selFc && (full.steh ?? 0) > 0 && (selFc.caps.steh ?? 0) === 0;
  const people = Object.fromEntries(STANDS.map((s) => [s.id, CAT_KEYS.reduce((a, k) => a + (k === 'loge' ? (stands[s.id][k] ?? 0) * LOGE_GUESTS : stands[s.id][k] ?? 0), 0)])) as Record<StandId, number>;

  // Übersicht
  const cur = seating.season, prev = seating.prevSeason;
  const avgNow = cur?.games ? Math.round(persons(cur.sold) / cur.games) : 0;
  const avgPrev = prev?.games ? Math.round(persons(prev.sold) / prev.games) : 0;
  const lc = leagueClubs(g);
  const ownAvg = avgNow || expectedSale(club, year).attendance;
  const rank = 1 + lc.filter((c) => c.id !== club.id && expectedSale(c, year).attendance > ownAvg).length;
  const env = ensureEnvironment(g);
  const rec = forecastRecord(club);
  const staff = forecastStaff(g);
  const opt = (patch: Parameters<typeof setTicketOption>[1]) => { setTicketOption(g, patch); changed(); };

  return (
    <DashPage className="tk-page">
      <DashBox title="Übersicht" icon="stadium" info="kartenverkauf">
        <div className="tk-over">
          <div className="tk-kv">
            <KV k="Zuschauerschnitt" v={avgNow ? n0(avgNow) : '–'} />
            <KV k="Letzte Saison" v={avgPrev ? n0(avgPrev) : '–'} />
            <KV k="Zuschauertabelle" v={`${rank}. von ${lc.length}`} />
            <KV k="Fanbasis" info="fanbasis" v={n0(env.members)} />
            <KV k="Gesamtkapazität" v={n0(club.stadium.capacity)} />
          </div>
          <StandMap club={club} people={people} sel={stand} onSel={setStand} />
        </div>
      </DashBox>

      <DashBox title="Eintrittspreise festlegen" icon="ticket" info="tribuenenpreise" span={2} flush
        right={sel && selFc ? <span className="tk-right">Prognose: {g.clubs[sel.awayId]?.name ?? ''}, {sel.date.slice(8, 10)}.{sel.date.slice(5, 7)}.{seatsOnly ? ' · Europapokal: nur Sitzplätze' : ''}</span> : undefined}>
        <PriceTable g={g} club={club} year={year} caps={caps} stands={stands} fc={selFc} sel={stand} onSel={setStand} onChange={changed} />
      </DashBox>

      <DashBox title="Spiele dieser Saison" icon="kalender" span={2} flush right={<span className="tk-right">Klick auf die Kategorie legt die Preise des Spiels fest</span>}>
        {games.length ? <GamesBox g={g} games={games} fcs={fcs} t={t} sel={sel} onSel={setSelKey} onChange={changed} />
          : <Empty icon="kalender">Der Spielplan steht noch nicht.</Empty>}
      </DashBox>

      <DashBox title="Besondere Preise" icon="finances" info="besonderePreise">
        <div className="tk-special">
          <div className="tk-opt"><span>Topzuschlag</span><Pct v={t.topPct} on={(v) => opt({ topPct: v })} sign="+" /></div>
          <div className="tk-opt"><span>Rabatt</span><Pct v={t.rabattPct} on={(v) => opt({ rabattPct: v })} sign="−" /></div>
          <label className="tk-opt tk-check">
            <input type="checkbox" checked={t.autoTop > 0} onChange={(e) => opt({ autoTop: e.target.checked ? 3 : 0 })} />
            <span>Automatischer Topzuschlag</span>
            <span className={`tk-mini ${t.autoTop > 0 ? '' : 'off'}`}>
              <button disabled={t.autoTop <= 1} onClick={(e) => { e.preventDefault(); opt({ autoTop: t.autoTop - 1 }); }}>−</button>
              <b>{t.autoTop || 3}</b> beste
              <button disabled={!t.autoTop || t.autoTop >= 8} onClick={(e) => { e.preventDefault(); opt({ autoTop: t.autoTop + 1 }); }}>+</button>
            </span>
          </label>
          <label className="tk-opt tk-check">
            <input type="checkbox" checked={t.autoRabatt} onChange={(e) => opt({ autoRabatt: e.target.checked })} />
            <span>Automatischer Rabatt gegen unterklassige Gegner</span>
          </label>
          <div className="tk-sec">Prognose-Bilanz<InfoTip k="prognoseSpanne" /></div>
          {rec.n ? (
            <div className="tk-rec">
              <div className="tk-rec-bar">
                <i className="lo" style={{ flex: rec.low }} /><i className="hit" style={{ flex: rec.hits }} /><i className="hi" style={{ flex: rec.high }} />
              </div>
              <div className="tk-rec-txt">Letzte {rec.games} Heimspiele: <b className="num">{rec.hits}</b> von {rec.n} Spannen getroffen · {rec.low} darunter · {rec.high} darüber</div>
            </div>
          ) : <div className="tk-muted">Nach dem ersten Heimspiel siehst du hier, wie oft die Prognosen gestimmt haben.</div>}
          <div className="tk-muted tk-staff">{staff.names.length ? `Spanne geschärft durch ${staff.names.length === 1 ? staff.names[0] : `${staff.names.length} Mitarbeiter`} (−${Math.round(staff.share * 100)} %).` : 'Kaufmännischer Leiter, Marketing-, Event- oder CRM-Manager machen die Spanne enger.'}</div>
        </div>
      </DashBox>
    </DashPage>
  );
}

function Pct({ v, on, sign }: { v: number; on: (v: number) => void; sign: string }) {
  return (
    <span className="tk-mini">
      <button onClick={() => on(v - 5)} aria-label="weniger">−</button>
      <b className="num">{sign}{v} %</b>
      <button onClick={() => on(v + 5)} aria-label="mehr">+</button>
    </span>
  );
}
