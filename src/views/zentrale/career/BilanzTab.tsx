// =============================================================================
// Zentrale › Karriere, Reiter „Bilanz“ im Akten-/Scrapbook-Look (Wunsch Pascal,
// Vorschlag 2): aufgeschlagene Ringmappe `bilder/akte/bilanz.webp` (2400×1174),
// darauf Zettel aus `bilder/akte/bilanz/` – alle Lagen in % der Mappe (CSS
// `28-career-binder.css`, `.bnd-*`). Links Managerbilanz + Blatt „Je Wettbewerb“,
// rechts Ansehen je Saison auf Karopapier, Titel & Rekorde (Abriss), Zeitungsausschnitt,
// Meilensteine (oranger Zettel), Lieblings-/Angstgegner (gelber Zettel), Polaroid
// mit Wappen. Reiter der Mappe springen zu Saisons / Trainer & Spieler.
// =============================================================================
import type { ReactNode } from 'react';
import { currentStint, repLabel } from '../../../game/careerState';
import { headCoachNow } from '../../../game/headCoaches';
import type { CareerData, OppLine } from '../../../game/managerView';
import { games } from '../../../game/managerView';
import { trophyTally } from '../../../game/trophyCabinet';
import type { Game } from '../../../game/state';
import ClubCrest from '../../../components/ClubCrest';
import { ClubLink } from '../../../components/club/ClubLink';
import { InfoTip } from '../../../ui/InfoTip';
import type { InfoKey } from '../../../data/infoTexts';
import { COMP_DE, crestOf, dmy, ppgText, wdlText } from './parts';
import { RepChart } from './RepChart';

type Tab = 'bilanz' | 'saisons' | 'personen';

/** Büroklammer (gezeichnet), sitzt über der Oberkante eines Zettels. */
function Clip({ className }: { className: string }) {
  return (
    <svg className={`bnd-clip ${className}`} viewBox="0 0 24 64" aria-hidden="true">
      <path d="M7 50 V12 a5 5 0 0 1 10 0 V54 a7 7 0 0 1 -14 0 V18" />
    </svg>
  );
}

function Opp({ g, o }: { g: Game; o: OppLine }) {
  const c = crestOf(g, o.id);
  return (
    <div className="bnd-opp">
      {c && <ClubCrest club={c} size={22} />}
      <ClubLink id={o.id}><span className="bnd-opp-n">{o.name}</span></ClubLink>
      <span className="bnd-opp-r">{games(o.r)} Sp · {ppgText(o.r)}</span>
    </div>
  );
}

function Row({ k, v, info }: { k: string; v: ReactNode; info?: InfoKey }) {
  return <div className="bnd-kv"><span>{k}{info && <InfoTip k={info} />}</span><b>{v}</b></div>;
}

export function BilanzTab({ g, d, rep, onTab }: { g: Game; d: CareerData; rep: number; onTab?: (t: Tab) => void }) {
  const club = g.clubs[g.managedClubId];
  const all = d.totals.all;
  const years = d.seasons.length;
  const tally = trophyTally(d.titles.filter((t) => t.cat !== 'jugend'));
  const youth = d.titles.filter((t) => t.cat === 'jugend').length;
  const titleCount = tally.reduce((a, t) => a + t.n, 0);
  const miles = [...d.tally.miles].reverse().slice(0, 4);
  const st = currentStint(g);
  const since = st.from;
  const days = Math.max(0, Math.round((Date.parse(g.calendar.currentDate) - Date.parse(since)) / 86400000));
  const yearsText = days >= 365 ? `${(days / 365).toFixed(1).replace('.', ',')} Jahre` : `${days} Tage`;
  const coach = headCoachNow(g);
  const mgr = g.manager?.name || 'Der Manager';
  const best = d.records[0];
  const headline = titleCount
    ? `${titleCount} Titel in ${yearsText}`
    : years > 1 ? `${yearsText} im Amt` : 'Der neue Mann ist da';

  return (
    <div className="dpage bnd-page">
      <div className="bnd" role="region" aria-label="Managerbilanz">
        {/* Reiter der Mappe */}
        <button type="button" className="bnd-tab bnd-tab-1" onClick={() => onTab?.('saisons')}>Saisons</button>
        <button type="button" className="bnd-tab bnd-tab-2" onClick={() => onTab?.('personen')}>Personen</button>

        {/* Links oben: Managerbilanz direkt auf dem Block */}
        <section className="bnd-sheet">
          <h2 className="bnd-h">Managerbilanz<InfoTip k="managerBilanz" /></h2>
          <div className="bnd-kpis">
            <div><b>{d.tally.n}</b><span>Pflichtspiele</span></div>
            <div><b>{ppgText(all)}</b><span>Punkte je Spiel</span></div>
            <div><b>{years}</b><span>{years === 1 ? 'Saison' : 'Saisons'}</span></div>
          </div>
          <Row k="Verein" v={club.name} />
          <Row k="Im Amt seit" v={`${dmy(since)} · ${yearsText}`} />
          <Row k="Siege · Remis · Niederlagen" v={wdlText(all)} />
          <Row k="Tore" v={`${all[3]}:${all[4]}`} />
          <Row k="Saisonziele erreicht" v={d.goalsJudged ? `${d.goalsOk} von ${d.goalsJudged}` : '–'} info="saisonziel" />
          <Row k="Titel" v={titleCount || '–'} />
          <Row k="Cheftrainer" v={coach?.name ?? 'nicht besetzt'} info="deineTrainer" />
          <Row k="Ruf in der Branche" v={repLabel(rep)} />
          <div className="bnd-kv bnd-rep"><span>Ansehen<InfoTip k="trainerAnsehen" /></span><i><em style={{ width: `${Math.max(2, Math.min(100, rep))}%` }} /></i><b>{Math.round(rep)}</b></div>
        </section>

        {/* Polaroid mit Wappen */}
        <figure className="bnd-polaroid">
          <div className="bnd-pol-img"><ClubCrest club={club} size={92} /></div>
          <figcaption>{club.shortName} · seit {since.slice(0, 4)}</figcaption>
        </figure>

        {/* Links unten: Blatt „Je Wettbewerb“ */}
        <section className="bnd-note bnd-comp">
          <span className="bnd-tape bnd-tape-a" />
          <h3 className="bnd-h3">Je Wettbewerb</h3>
          <table className="bnd-table">
            <thead><tr><th>Wettbewerb</th><th>Sp</th><th>S-U-N</th><th>Tore</th><th>P/Sp</th></tr></thead>
            <tbody>
              {(['L', 'P', 'E'] as const).map((k) => {
                const r = d.totals[k];
                return (
                  <tr key={k}><td>{k === 'L' ? 'Liga' : k === 'P' ? 'Landespokal' : 'Europapokal'}</td>
                    <td>{games(r)}</td><td>{wdlText(r)}</td><td>{r[3]}:{r[4]}</td><td><b>{ppgText(r)}</b></td></tr>
                );
              })}
              <tr className="tot"><td>Gesamt</td><td>{games(all)}</td><td>{wdlText(all)}</td><td>{all[3]}:{all[4]}</td><td><b>{ppgText(all)}</b></td></tr>
            </tbody>
          </table>
          {best && <div className="bnd-scribble">{best.k}: {best.v}{best.sub ? ` (${best.sub})` : ''}</div>}
        </section>

        {/* Rechts oben: Ansehen je Saison auf Karopapier */}
        <section className="bnd-chart">
          <Clip className="bnd-clip-a" /><Clip className="bnd-clip-b" />
          <h3 className="bnd-h3">Historische Entwicklung <small>Ansehen je Saison</small></h3>
          {d.repSeries.length ? <RepChart points={d.repSeries} liveLast={!!d.seasons[0]?.live} />
            : <div className="bnd-empty">Nach deiner ersten Saison siehst du hier, wie sich dein Ansehen entwickelt.</div>}
        </section>

        {/* Rechts unten links: Titel & Rekorde */}
        <section className="bnd-note bnd-rec">
          <h3 className="bnd-h3">Titel &amp; Rekorde</h3>
          <div className="bnd-scroll">
            {tally.length ? tally.map((t) => <div key={t.title} className="bnd-kv"><span>{t.title}</span><b>{t.n}×</b></div>)
              : <div className="bnd-empty">Noch kein Titel in deiner Amtszeit.</div>}
            {youth ? <div className="bnd-kv"><span>Jugendtitel</span><b>{youth}×</b></div> : null}
            <div className="bnd-sec">Rekorde deiner Amtszeit</div>
            {d.records.length ? d.records.map((r) => (
              <div key={r.k} className="bnd-kv bnd-recl"><span>{r.k}{r.sub && <small>{r.sub}</small>}</span><b>{r.v}</b></div>
            )) : <div className="bnd-empty">Rekorde zählen ab der ersten abgeschlossenen Saison.</div>}
          </div>
        </section>

        {/* Kleiner Zettel: nächster Meilenstein */}
        {d.nextMile && (
          <div className="bnd-note bnd-mini">
            <b>{d.nextMile.left}</b>
            <span>{d.nextMile.left === 1 ? 'Spiel' : 'Spiele'} bis zum {d.nextMile.n}. Pflichtspiel</span>
          </div>
        )}

        {/* Zeitungsausschnitt */}
        <section className="bnd-note bnd-paper">
          <div className="bnd-paper-mast">Sportdienst</div>
          <div className="bnd-paper-h">{headline}</div>
          <div className="bnd-paper-t">{mgr} und {club.shortName}: {wdlText(all)} in {d.tally.n} Pflichtspielen{best ? `. ${best.k}: ${best.v}` : ''}.</div>
          <div className="bnd-paper-cols" aria-hidden="true">{Array.from({ length: 8 }, (_, i) => <i key={i} />)}</div>
        </section>

        {/* Meilensteine (oranger Zettel) */}
        <section className="bnd-note bnd-miles">
          <Clip className="bnd-clip-c" />
          <h3 className="bnd-h3">Meilensteine</h3>
          {miles.length ? miles.map(([n, x]) => (
            <div key={n} className="bnd-mile">
              <b>{n}.</b>
              <span>{dmy(x[0])} · {COMP_DE[x[1]]}<br /><small>{x[6]} {x[4]}:{x[5]}</small></span>
            </div>
          )) : <div className="bnd-empty">Dein erstes Pflichtspiel steht noch aus.</div>}
        </section>

        {/* Lieblings- und Angstgegner (gelber Zettel) */}
        <section className="bnd-note bnd-opps">
          <span className="bnd-tape bnd-tape-b" />
          <h3 className="bnd-h3">Lieblingsgegner</h3>
          {d.oppBest.length ? d.oppBest.slice(0, 2).map((o) => <Opp key={o.id} g={g} o={o} />) : <div className="bnd-empty">Ab vier Spielen gegen denselben Gegner.</div>}
          <h3 className="bnd-h3 bnd-h3b">Angstgegner</h3>
          {d.oppWorst.slice(0, 2).map((o) => <Opp key={o.id} g={g} o={o} />)}
        </section>
      </div>
    </div>
  );
}
