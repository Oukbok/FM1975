// Reiter „Übersicht“: Profil · Duell mit deinem Verein · Trainer | Kurzbewertung · Stärkste Spieler · Form & Spiele
import { h2hOf, titlesOf } from '../../game/clubRecords';
import { clubStrengthFor } from '../../game/season';
import { CalendarEngine } from '../../engine/calendar';
import { DashBox, Empty, KV, Meter } from '../../ui/DashPage';
import { fmtDateShort, vColor } from '../../ui/format';
import { FormDots, PlayerRow, ScoutStars } from '../../views/shared';
import { ClubTabProps, CoachBox, MatchLine, UnitCompare, verdict } from './shared';

export default function OverviewTab({ g, d, openPlayer }: ClubTabProps) {
  const own = g.clubs[g.managedClubId];
  const ownRow = g.table.rows.find((r) => r.clubId === g.managedClubId);
  const h2h = d.isPlayerClub ? [] : h2hOf(g, d.clubId);
  const bil = h2h.reduce((a, [, , , , gf, ga]) => {
    if (gf > ga) a.w++; else if (gf < ga) a.l++; else a.d++;
    a.gf += gf; a.ga += ga; return a;
  }, { w: 0, d: 0, l: 0, gf: 0, ga: 0 });
  const last = h2h[h2h.length - 1];
  const matches = [...d.lastMatches.slice(0, 4).reverse(), ...d.nextMatches.slice(0, 3)];

  return (
    <>
      <DashBox title="Vereinsprofil" icon="dashVerein">
        <KV k="Stadt" v={d.city || '–'} />
        <KV k="Gegründet" v={d.founded ?? 'unbekannt'} />
        <KV k="Liga" v={d.divisionLabel ?? '–'} />
        <KV k="Tabellenplatz" v={d.tablePosition != null ? `${d.tablePosition}. von ${d.tableSize}` : '–'} strong />
        {d.points != null && <KV k="Punkte · Tore" v={`${d.points} · ${d.goals}`} />}
        {d.form && d.form.length > 0 && <KV k="Form" v={<FormDots form={d.form} />} />}
        {d.reputation != null && <Meter label="Ansehen" value={d.reputation} color={vColor(d.reputation)} />}
        {d.fullClub && <KV k="Stadion" v={d.fullClub.stadium.name} />}
      </DashBox>

      {d.isPlayerClub ? (
        <DashBox title="Vorstand & Ziele" icon="dashVerein">
          <KV k="Saisonziel" v={own?.boardExpectation || '–'} strong />
          <Meter label="Vorstandsvertrauen" value={own?.boardConfidence ?? 0} color={vColor(own?.boardConfidence ?? 0)} />
          <KV k="Titel seit Spielbeginn" v={titlesOf(g, d.clubId).length} />
          <div className="dnote mt8">So sehen Presse und Konkurrenz deinen Verein. Details im Bereich Verein → Vorstand.</div>
        </DashBox>
      ) : (
        <DashBox title={`Duell mit ${own?.shortName ?? 'dir'}`} icon="dashBall" right={h2h.length ? `${h2h.length} Spiele` : undefined}>
          <div className="dsec">Kräftevergleich ({d.shortName} · {own?.shortName})</div>
          <KV k="Tabellenplatz" v={`${d.tablePosition != null ? d.tablePosition + '.' : '–'} · ${ownRow ? ownRow.position + '.' : '–'}`} />
          <KV k="Ø Stärke" v={`${d.strength} · ${clubStrengthFor(g, g.managedClubId)}`} />
          <div className="dsec">Duelle (aus deiner Sicht)</div>
          <KV k="Nächstes" v={d.vsOwnNext ? `${CalendarEngine.formatDate(d.vsOwnNext.date)} · ${d.vsOwnNext.comp}, ${d.vsOwnNext.homeAway === 'H' ? 'auswärts' : 'Heim'}` : 'nicht angesetzt'} />
          <KV k={last ? `Letztes · ${fmtDateShort(last[1]).dmy}` : 'Letztes'}
            v={last ? <span className={`dres dres-${last[4] > last[5] ? 'W' : last[4] < last[5] ? 'L' : 'D'}`}>{last[4]}:{last[5]}</span> : '–'} />
          <KV k="Bilanz S · U · N" v={h2h.length ? `${bil.w} · ${bil.d} · ${bil.l}` : 'noch kein Spiel'} strong />
          {h2h.length > 0 && <KV k="Tore" v={`${bil.gf}:${bil.ga}`} />}
        </DashBox>
      )}

      <CoachBox g={g} d={d} />

      <DashBox title="Kurzbewertung" icon="stats" right={`Ø ${d.strength}`}>
        {d.isPlayerClub ? (
          <>
            {d.units.map((u) => <Meter key={u.key} label={`${u.label} (${u.n})`} value={u.theirs} color={vColor(u.theirs)} />)}
            <div className="dnote mt8">Ø der Stammkräfte: 1 Torwart, je 4 Abwehr- und Mittelfeldspieler, 2 Stürmer.</div>
          </>
        ) : d.units.length ? (
          <>
            <UnitCompare d={d} ownName={own?.shortName ?? 'Du'} />
            <div className="dnote mt8 cmx-verdict">{verdict(d)}</div>
          </>
        ) : (
          <>
            <Meter label="Geschätzte Stärke" value={d.strength} color={vColor(d.strength)} />
            <div className="dnote mt8">Rein simulierter Verein: Die Scouts kennen nur die ungefähre Gesamtstärke, keine Einzelspieler.</div>
          </>
        )}
      </DashBox>

      <DashBox title="Stärkste Spieler" icon="squad">
        {d.squad.length ? d.squad.slice(0, 6).map((p) => (
          <PlayerRow key={p.id} p={p} value={p.overall} onClick={() => openPlayer(p.id)}
            sub={<>{p.age} J. · <ScoutStars p={p} /></>} />
        )) : <Empty icon="squad">Keine Kaderdaten.</Empty>}
      </DashBox>

      <DashBox title="Form & Spiele" icon="schedule">
        {matches.length ? <>
          {d.lastMatches.length > 0 && <div className="dsec">Zuletzt</div>}
          {d.lastMatches.slice(0, 4).map((m, i) => <MatchLine key={'l' + i} m={m} />)}
          {d.nextMatches.length > 0 && <div className="dsec">Als Nächstes</div>}
          {d.nextMatches.slice(0, 3).map((m, i) => <MatchLine key={'n' + i} m={m} />)}
        </> : <Empty icon="schedule">Noch keine Spiele.</Empty>}
      </DashBox>
    </>
  );
}
