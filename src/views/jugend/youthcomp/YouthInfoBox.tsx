// =============================================================================
// Jugendwettbewerbe – Info-Box rechts unten: Sieger, Endspiel, deine Jugend, Modus
// =============================================================================
import { CalendarEngine } from '../../../engine/calendar';
import type { Game } from '../../../game/state';
import { myYouthStandings, type YcSnapshot } from '../../../game/youthComps/view';
import { isLowKey } from '../../../data/youthLowerLeagues';
import { DashBox, KV } from '../../../ui/DashPage';
import { TeamName } from '../../statistiken/competition/parts';

/** Kurzbeschreibung des Modus (Quellen: data/youthCompetitions.ts). */
function modeText(snap: YcSnapshot): string {
  const y0 = Number(snap.season.slice(0, 4));
  if (snap.fest) return `Spielfeste statt Meisterschaft (${snap.play ?? ''}). Keine Tabelle, keine Ergebnisse.`;
  if (isLowKey(snap.compKey)) {
    const own = 'Gezeigt wird die Staffel deiner Mannschaft; die übrigen Staffeln werden nicht simuliert.';
    const move = snap.lowLevel === 1 ? 'Der Erste steigt auf.' : snap.zones?.includes('zone-rel') ? 'Der Erste ist Meister, die Letzten steigen ab.' : 'Der Erste ist Meister.';
    return `Doppelrunde, ${snap.play ?? '11 gegen 11'}. ${move} ${own}`;
  }
  switch (snap.compKey) {
    case 'u19': case 'u17': {
      const rl = snap.compKey === 'u19' ? 1996 : 2000, bl = snap.compKey === 'u19' ? 2003 : 2007;
      if (y0 < rl) return 'Die Meister der Landesverbände (im Spiel: Verbandsligen) spielen im K.-o.-System mit Hin- und Rückspiel um den Titel, das Endspiel ist ein Spiel.';
      if (y0 < bl) return 'Fünf Regionalligen; Meister und einige Vizemeister bilden die Endrunde der letzten Acht (Hin- und Rückspiel, Endspiel ein Spiel). Je drei Absteiger.';
      if (y0 < 2024) return 'Drei Staffeln à 14 (Nord/Nordost, West, Süd/Südwest). Die Meister und der Zweite aus Süd/Südwest spielen das Halbfinale (Hin- und Rückspiel), dann das Endspiel. Je drei Absteiger.';
      return 'DFB-Nachwuchsliga: Vorrunde in regionalen Gruppen, die besten Drei je Gruppe spielen die Hauptrunde Liga A, die besten Vier je Gruppe das Achtelfinale (ein Spiel).';
    }
    case 'pokal': return y0 < 2017 ? 'Die Pokalsieger der Landesverbände spielen im K.-o.-System (ein Spiel, Verlängerung, Elfmeterschießen). Amateure haben Heimrecht.'
      : 'Landespokalsieger, Titelverteidiger, Meister und die besten Teams der Staffeln; ein Spiel, Amateure haben bis zum Halbfinale Heimrecht.';
    case 'ddr': return 'Die Nachwuchsmannschaften der 14 Oberligisten spielen eine Doppelrunde; ohne Auf- und Abstieg. Der Erste ist DDR-Juniorenmeister.';
    default: return y0 < 2015 ? 'Die Jugend der Champions-League-Vereine: acht Gruppen, dann K.-o.-Runden; Halbfinale und Endspiel in Nyon.'
      : y0 < 2024 ? 'Champions-League-Weg (Gruppen) und Meisterweg der Jugendmeister; Gruppenzweite gegen Sieger des Meisterwegs in den Play-offs, Final Four in Nyon.'
      : 'Ligaphase mit 36 Teams (sechs Spiele), die besten 22 und die Sieger des Meisterwegs spielen das Sechzehntelfinale; Final Four in Nyon.';
  }
}

export function YouthInfoBox({ g, snap }: { g: Game; snap: YcSnapshot | null }) {
  if (!snap) return <DashBox title="Saison" icon="chronicle"><div className="dnote">–</div></DashBox>;
  const mid = g.managedClubId;
  const T = (id: string) => <TeamName g={g} id={id} season={snap.season} size={16} />;
  const live = snap.source === 'live';
  const mine = live ? myYouthStandings(g).find((s) => s.compKey === snap.compKey) : undefined;
  const rounds = snap.rounds;
  const fin = rounds?.[rounds.length - 1]?.ties[0];
  const started = !!snap.table?.some((r) => r.p > 0);
  const leader = started ? snap.table?.[0]?.clubId : undefined;
  const myRow = started ? snap.table?.find((r) => r.clubId === mid) : undefined;
  return (
    <DashBox title={live && mine ? 'Deine Jugend' : live ? 'Stand' : 'Saisonbilanz'} icon={live && mine ? 'youth' : 'chronicle'} right={snap.compLabel} className="yc-info">
      {snap.fest ? <KV k="Sieger" v="keiner (Spielfeste)" />
        : snap.winner ? <KV k="Sieger" v={T(snap.winner)} strong />
        : leader && snap.kind === 'league' ? <KV k="Tabellenführer" v={T(leader)} /> : <KV k="Sieger" v="steht noch aus" />}
      {fin?.winner && <KV k="Endspiel" v={<span className="cmp-inline">{T(fin.home)} {fin.hg}:{fin.ag}{fin.dec === 1 ? ' n. V.' : fin.dec === 2 ? ' i. E.' : ''} {T(fin.away)}</span>} />}
      {myRow && <KV k="Dein Verein" v={`${myRow.pos}. · ${myRow.pts} Pkt.`} />}
      {mine && <>
        {mine.league && !myRow && !mine.fest && <KV k={mine.league} v={mine.pos ? `${mine.pos}. von ${mine.size}` : '–'} />}
        {mine.ko && <KV k={snap.compKey === 'pokal' ? 'Stand' : 'Endrunde'} v={mine.ko} />}
        {mine.next && <>
          <div className="dsec">{mine.fest ? 'Nächstes Spielfest' : 'Nächstes Spiel'}</div>
          <KV k={mine.next.what} v={CalendarEngine.formatDate(mine.next.date)} />
          <KV k={mine.fest ? 'Gastgeber' : mine.next.home ? 'Heim gegen' : 'Auswärts bei'} v={T(mine.next.opp)} />
        </>}
      </>}
      {snap.zones && snap.kind === 'league' && (
        <div className="dzones mt8">
          <span><span className="pos-badge zone-cl" /> {snap.compKey === 'ddr' || snap.lowLevel === 0 ? 'Meister' : snap.lowLevel === 1 ? 'Aufstieg' : 'Endrunde'}</span>
          {snap.zones.includes('zone-rel') && <span><span className="pos-badge zone-rel" /> Abstieg</span>}
        </div>
      )}
      <div className="dsec">Modus</div>
      <div className="dnote">{modeText(snap)}</div>
    </DashBox>
  );
}
