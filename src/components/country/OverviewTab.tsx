// Länderprofil › Übersicht: Steckbrief · Ligaruf international · Weltrangliste |
// Meister & Pokal · Beste Vereine · Beste Spieler
import { useMemo } from 'react';
import {
  bestClubs, bestPlayers, countryFacts, countryHolders, countryLeagues, countryRep, countrySystem, titleCounts,
} from '../../game/countryProfile';
import { DashBox, Empty, KV, Meter } from '../../ui/DashPage';
import { vColor } from '../../ui/format';
import { fmtCoef } from '../../game/coefficients';
import { TeamName } from '../../views/stats/competition/parts';
import { NatRow, type CountryTabProps } from './parts';
import { CtChampBox, CtClubsBox, CtCupBox } from './ContinentBoxes';
import { WorldRankBox } from './WorldRankBox';
import { nationExists } from '../../data/nationalTeams';

const sign = (d: number) => `${d > 0 ? '+' : d < 0 ? '−' : '±'}${Math.abs(d).toFixed(0)}`;

export default function OverviewTab({ g, c, pyramid }: CountryTabProps) {
  const facts = countryFacts(g, c);
  const rep = countryRep(g, c);
  const holders = useMemo(() => countryHolders(g, c), [g, c]);
  const leagues = useMemo(() => countryLeagues(g, c), [g, c]);
  const sys = countrySystem(c, pyramid);
  const clubs = bestClubs(sys?.sys, 7);
  const players = bestPlayers(g, c, 7);
  const lead = leagues?.snaps[0];
  const leader = lead && lead.source === 'live' && !lead.roster && (lead.table?.[0]?.p ?? 0) > 0 ? lead.table![0].clubId : null;
  const last = holders.find((h) => h.champ);
  const lastCup = holders.find((h) => h.cup);
  const record = titleCounts(holders).filter((x) => x.champ > 0).slice(0, 3);

  return (
    <>
      <DashBox title="Steckbrief" info="laenderprofil">
        <KV k="Land" v={c.name} strong />
        <KV k="Kürzel" v={c.code} />
        <KV k="Kontinent" v={facts.conf ?? 'keine Daten'} />
        <KV k="Bestehen" v={facts.exists} />
        {facts.predecessor && <KV k="Vorgänger" v={facts.predecessor} />}
        {facts.successors?.length ? <KV k="Nachfolger" v={facts.successors.join(', ')} /> : null}
        <KV k="Ligen im Spiel" v={facts.ligen} />
      </DashBox>

      {c.kind === 'continent' ? <CtCupBox g={g} c={c} pyramid={pyramid} /> : <DashBox title="Ligaruf international" info="ligaruf" right={rep?.rank ? `Rang ${rep.rank}` : undefined}>
        {rep ? <>
          <Meter label={rep.live ? `Ligaruf (${rep.mode})` : 'Richtwert'} value={rep.rep} color={vColor(rep.rep)}
            text={<>{rep.rep.toFixed(0)}{rep.delta != null && <small className={`cnx-delta ${Math.abs(rep.delta) < 0.5 ? '' : rep.delta > 0 ? 'up' : 'down'}`}> {sign(rep.delta)} zur Vorsaison</small>}</>} />
          {rep.live && <KV k="Historisch um diese Zeit" v={rep.hist.toFixed(0)} />}
          {!rep.live && <div className="dnote">{c.kind === 'home' ? 'Dein Heimatland wird nicht gesteuert – seine Stärke kommt aus den echten Kadern.' : c.kind === 'ddr' ? 'Die DDR läuft mit deinem Spielstand; ihr Ruf ist nur ein Richtwert.' : 'Dieser Spielstand stammt aus einer Version ohne Ligaruf – angezeigt wird der historische Richtwert.'}</div>}
          <KV k="Fünfjahreswertung" info="fuenfjahreswertung" v={rep.rank ? `${rep.rank}. von ${rep.of}${rep.coef != null ? ` · ${fmtCoef(rep.coef)} Punkte` : ''}` : 'keine Daten'} strong />
          {rep.rank != null && <div className="cnx-coef-seasons" title="Punkte der letzten fünf Saisons">
            {rep.seasonLabels.map((l, i) => <span key={l}><small>{l.slice(2)}</small><b>{fmtCoef(rep.seasons[i] ?? null)}</b></span>)}
          </div>}
          {rep.slots.length ? <div className="cnx-slots"><em>Startplätze {rep.next}</em>{rep.slots.map((s) => <span key={s.label} className={s.n ? '' : 'none'}><b>{s.n}</b>{s.label}</span>)}</div>
            : <div className="dnote">Keine Daten – das Land steht nicht in der Wertung.</div>}
        </> : <Empty icon="international">{c.kind === 'none' ? 'Keine Liga im Spiel – deshalb kein Ligaruf und keine Fünfjahreswertung.' : `${c.name} besteht in dieser Saison nicht – kein Ligaruf, keine Fünfjahreswertung.`}</Empty>}
      </DashBox>}

      <WorldRankBox g={g} c={c} />

      {c.kind === 'continent' ? <><CtChampBox g={g} c={c} pyramid={pyramid} /><CtClubsBox g={g} c={c} pyramid={pyramid} /></> : <>
      <DashBox title="Meister & Pokal" right={leagues?.season}>
        {holders.length || leader ? <>
          {leader && <KV k="Tabellenführer" v={<TeamName g={g} id={leader} season={g.season} size={18} />} strong />}
          {last && <KV k={`Meister ${last.season}`} v={<TeamName g={g} id={last.champ!} season={last.season} size={18} />} strong={!leader} />}
          {lastCup && <KV k={`Pokalsieger ${lastCup.season}`} v={<TeamName g={g} id={lastCup.cup!} season={lastCup.season} size={18} />} />}
          {record.length > 0 && <>
            <div className="dsec">Meiste Titel (bekannte Saisons)</div>
            {record.map((r) => <KV key={r.clubId} k={<TeamName g={g} id={r.clubId} season={g.season} size={16} />} v={`${r.champ}×${r.cup ? ` · Pokal ${r.cup}×` : ''}`} />)}
          </>}
        </> : <Empty icon="trophy">{c.kind === 'none' ? 'Keine Liga im Spiel.' : 'Noch keine Meister bekannt.'}</Empty>}
      </DashBox>

      <DashBox title="Beste Vereine" right={clubs.length ? 'Ø Stärke' : undefined}>
        {clubs.length ? (
          <div className="cnx-list">
            {clubs.map((x, i) => (
              <div key={x.id} className={`cnx-crow ${x.id === g.managedClubId ? 'me' : ''}`}>
                <span className="rl-rank">{i + 1}</span>
                <span className="cnx-cname"><TeamName g={g} id={x.id} season={g.season} size={20} /></span>
                <b style={{ color: vColor(x.strength) }}>{Math.round(x.strength)}</b>
              </div>
            ))}
          </div>
        ) : <Empty icon="dashVerein">{c.kind === 'none' ? 'Keine Vereine im Spiel.' : 'Keine eigenen Ligen in dieser Saison – keine Daten.'}</Empty>}
      </DashBox>
      </>}

      <DashBox title="Beste Spieler" info="laenderprofilSpieler">
        {players.length ? <div className="cnx-list">{players.map((p, i) => <NatRow key={p.id} g={g} p={p} rank={i + 1} />)}</div>
          : <Empty icon="squad">Keine Spieler dieser Nationalität in der Spielwelt{c.nation && !nationExists(c.nation, parseInt(g.season.slice(0, 4), 10)) ? ' – das Land besteht nicht mehr' : ''}.</Empty>}
      </DashBox>
    </>
  );
}
