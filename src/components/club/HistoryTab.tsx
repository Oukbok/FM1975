// Reiter „Historie“: Platzierungsverlauf · Titel | Direkter Vergleich · Rekordspieler · Rekordtransfers
import { SeasonPlacement, TITLE_DE, TitleKind, h2hOf, seasonsOf, titlesOf } from '../../game/clubRecords';
import { Player } from '../../types';
import { DashBox, Empty, KV } from '../../ui/DashPage';
import { fmtDM, fmtDateShort } from '../../ui/format';
import { ClubTabProps, PlacementChart } from './shared';

const TITLE_ORDER: TitleKind[] = ['meister', 'ddr', 'pokal', 'ec', 'cwc', 'uefa', 'halle', 'uyl', 'jugendA', 'jugendB', 'jugendPokal', 'jugendDdr', 'jugendC', 'jugendD', 'jugendE', 'jugendF'];
const COMP_DE = { L: 'Liga', P: 'Pokal', E: 'Europa' } as const;

export default function HistoryTab({ g, d, openPlayer }: ClubTabProps) {
  const past = seasonsOf(g, d.clubId);
  const seasons: SeasonPlacement[] = [...past];
  if (d.tablePosition != null && d.tier != null && (d.played ?? 0) > 0 && !past.some((s) => s.season === g.season)) {
    seasons.push({ season: g.season, tier: d.tier, pos: d.tablePosition, size: d.tableSize ?? 18, league: d.divisionLabel ?? '', live: true });
  }
  const titles = titlesOf(g, d.clubId);
  const byKind = TITLE_ORDER.map((k) => ({ k, seasons: titles.filter((t) => t.kind === k).map((t) => t.season) })).filter((x) => x.seasons.length);
  let ups = 0, downs = 0;
  for (let i = 1; i < past.length; i++) {
    if (past[i].tier >= 100 || past[i - 1].tier >= 100) continue;
    if (past[i].tier < past[i - 1].tier) ups++; else if (past[i].tier > past[i - 1].tier) downs++;
  }
  const best = [...past].sort((a, b) => a.tier - b.tier || a.pos - b.pos)[0];

  const h2h = d.isPlayerClub ? [] : [...h2hOf(g, d.clubId)].reverse();
  const bil = h2h.reduce((a, x) => { const [, , , , gf, ga] = x; if (gf > ga) a.w++; else if (gf < ga) a.l++; else a.d++; return a; }, { w: 0, d: 0, l: 0 });

  // Rekordspieler: Einsätze/Tore für diesen Verein (Saison-Stationen + laufende Saison).
  const tally = new Map<string, { p: Player; apps: number; goals: number }>();
  for (const p of Object.values(g.players)) {
    let apps = 0, goals = 0;
    for (const s of p.history?.stations ?? []) if (s.clubId === d.clubId) { apps += s.appearances; goals += s.goals; }
    if (p.clubId === d.clubId) { apps += p.seasonStats.appearances; goals += p.seasonStats.goals; }
    if (apps > 0) tally.set(p.id, { p, apps, goals });
  }
  const recApps = [...tally.values()].sort((a, b) => b.apps - a.apps).slice(0, 4);
  const recGoals = [...tally.values()].filter((x) => x.goals > 0).sort((a, b) => b.goals - a.goals).slice(0, 3);
  const veterans = recApps.length ? [] : [...d.squad].filter((p) => (p.careerStats?.appearances ?? 0) > 0)
    .sort((a, b) => b.careerStats.appearances - a.careerStats.appearances).slice(0, 5);
  const legends = (g.archive ?? []).filter((a) => a.lastClubId === d.clubId).sort((a, b) => b.peak - a.peak).slice(0, 3);

  // Rekordtransfers (Ablöse nominal) aus den Wechseln aktiver Spieler.
  const ins: { p: Player; fee: number; date: string; other: string }[] = [];
  const outs: typeof ins = [];
  for (const p of Object.values(g.players)) {
    for (const t of p.history?.transfers ?? []) {
      if (t.fee <= 0) continue;
      if (t.toClub === d.name) ins.push({ p, fee: t.fee, date: t.date, other: t.fromClub });
      else if (t.fromClub === d.name) outs.push({ p, fee: t.fee, date: t.date, other: t.toClub });
    }
  }
  ins.sort((a, b) => b.fee - a.fee); outs.sort((a, b) => b.fee - a.fee);

  return (
    <>
      <DashBox title="Platzierungen" icon="stats" span={2} right={past.length ? `${past.length} Saisons` : undefined}>
        {seasons.length ? <>
          <div className="cmx-chart-wrap">
            <PlacementChart seasons={seasons} />
            {past.length === 0 && <div className="dnote">Die Historie beginnt mit deinem Spielstart; nach jeder Saison kommt der Endplatz hinzu. Ein offener Punkt zeigt den aktuellen Tabellenplatz der laufenden Saison.</div>}
          </div>
        </> : <Empty icon="stats">Noch keine abgeschlossene Saison. Nach jedem Saisonende erscheint hier der Endplatz – über alle Ligaebenen hinweg.</Empty>}
      </DashBox>

      <DashBox title="Titel & Erfolge" icon="trophy" right={titles.length ? `${titles.length} Titel` : undefined}>
        {byKind.length ? byKind.map(({ k, seasons: ss }) => (
          <div key={k} className="cmx-title">
            <span className="cmx-title-n">{ss.length}×</span>
            <span className="grow"><b>{TITLE_DE[k]}</b><span className="dnote cmx-title-seasons">{ss.join(', ')}</span></span>
          </div>
        )) : <div className="dnote">Seit Spielbeginn noch kein Titel.</div>}
        {past.length > 0 && <>
          <div className="dsec">Bilanz seit Spielbeginn</div>
          {best && <KV k="Beste Platzierung" v={`${best.pos}. · ${best.league} (${best.season})`} />}
          <KV k="Aufstiege · Abstiege" v={`${ups} · ${downs}`} />
        </>}
      </DashBox>

      <DashBox title="Direkter Vergleich" icon="dashBall" right={h2h.length ? `${bil.w}S ${bil.d}U ${bil.l}N` : undefined}>
        {d.isPlayerClub ? <Empty icon="dashBall">Das ist dein Verein.</Empty>
          : h2h.length ? <>
            <div className="dnote">Aus Sicht deines Vereins.</div>
            {h2h.slice(0, 12).map(([season, date, comp, home, gf, ga], i) => (
              <div key={i} className="dlist-row cmx-match">
                <span className="meta cmx-date">{fmtDateShort(date).dmy}</span>
                <span className="cmx-comp">{COMP_DE[comp]}</span>
                <span className="grow muted">{season} · {home ? 'Heim' : 'Ausw.'}</span>
                <span className={`dres dres-${gf > ga ? 'W' : gf < ga ? 'L' : 'D'}`}>{gf}:{ga}</span>
              </div>
            ))}
          </> : <Empty icon="dashBall">Noch keine Pflichtspiele gegen deinen Verein.</Empty>}
      </DashBox>

      <DashBox title="Rekordspieler" icon="squad">
        {recApps.length ? <>
          <div className="dsec">Meiste Einsätze</div>
          {recApps.map(({ p, apps }) => <Rec key={p.id} p={p} value={`${apps} Sp.`} onClick={() => openPlayer(p.id)} away={p.clubId !== d.clubId} />)}
          {recGoals.length > 0 && <div className="dsec">Meiste Tore</div>}
          {recGoals.map(({ p, goals }) => <Rec key={p.id} p={p} value={`${goals} T.`} onClick={() => openPlayer(p.id)} away={p.clubId !== d.clubId} />)}
        </> : veterans.length ? <>
          <div className="dsec">Erfahrenste Spieler (Karriere-Einsätze)</div>
          {veterans.map((p) => <Rec key={p.id} p={p} value={`${p.careerStats.appearances} Sp.`} onClick={() => openPlayer(p.id)} away={false} />)}
          <div className="dnote mt8">Vereinsrekorde entstehen ab der ersten gespielten Saison.</div>
        </> : <div className="dnote">Für diesen Verein liegen noch keine Einsatzdaten vor.</div>}
        {legends.length > 0 && <>
          <div className="dsec">Legenden im Ruhestand</div>
          {legends.map((a) => <KV key={a.id} k={`${a.name} (${a.pos})`} v={`Spitze ${a.peak}`} />)}
        </>}
      </DashBox>

      <DashBox title="Rekordtransfers" icon="transfers">
        <div className="dsec">Teuerste Zugänge</div>
        {ins.length ? ins.slice(0, 3).map((x) => <TransferRow key={x.p.id + x.date} {...x} dir="von" onClick={() => openPlayer(x.p.id)} />) : <div className="dnote">Keine bekannt.</div>}
        <div className="dsec">Teuerste Abgänge</div>
        {outs.length ? outs.slice(0, 3).map((x) => <TransferRow key={x.p.id + x.date} {...x} dir="zu" onClick={() => openPlayer(x.p.id)} />) : <div className="dnote">Keine bekannt.</div>}
      </DashBox>
    </>
  );
}

function Rec({ p, value, onClick, away }: { p: Player; value: string; onClick: () => void; away: boolean }) {
  return (
    <div className="dlist-row clickable" onClick={onClick}>
      <span className="pos-badge">{p.naturalPosition}</span>
      <span className="grow">{p.fullName}{away && <span className="muted"> · ehemalig</span>}</span>
      <span className="val">{value}</span>
    </div>
  );
}

function TransferRow({ p, fee, date, other, dir, onClick }: { p: Player; fee: number; date: string; other: string; dir: string; onClick: () => void }) {
  return (
    <div className="dlist-row clickable" onClick={onClick}>
      <span className="pos-badge">{p.naturalPosition}</span>
      <span className="grow">{p.fullName}<span className="muted"> · {dir} {other} · {date.slice(0, 4)}</span></span>
      <span className="val">{fmtDM(fee)}</span>
    </div>
  );
}
