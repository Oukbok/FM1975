import { coefSum, countryRanking } from '../../engine/world';
import { yearOf } from '../../engine/economy';
import { Game } from '../../game/state';
import { DashBox, KV } from '../../ui/DashPage';
import { ClubLink } from '../../components/club/ClubLink';
import { CountryFlag } from '../../components/competition/CountryFlag';

// =============================================================================
// Europa im Hintergrund: Fünfjahreswertung und Meister der Auslandsligen.
// =============================================================================
const LABEL: Record<string, string> = { Oesterreich: 'Österreich', Daenemark: 'Dänemark', Tuerkei: 'Türkei', Rumaenien: 'Rumänien' };
const label = (c: string) => LABEL[c] ?? c;
const fmtCoef = (v: number) => v.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
/** Ländername mit klickbarer Flagge davor (öffnet das Länderprofil). */
const land = (c: string, prefix = '') => <span className="kv-flag">{prefix}<CountryFlag country={c} height={12} />{label(c)}</span>;

export function EuropeBox({ g, germans, teamName }: { g: Game; germans: string[]; teamName: (id: string) => string }) {
  const w = g.world;
  const year = yearOf(g.calendar.currentDate);
  const rank = w ? countryRanking(w, year) : [];
  const de = w ? coefSum(w.germanCoef) : 0;
  const deRank = rank.filter((c) => coefSum(c.coef) > de).length + 1;
  const last = w?.history[w.history.length - 1];
  return (
    <DashBox title="Europa" icon="international" right={w ? `Rang Deutschland: ${deRank}` : undefined}>
      <div className="dsec">Deutsche Teilnehmer</div>
      {germans.length ? germans.map((id) => <KV key={id} k={<ClubLink id={id}>{teamName(id)}</ClubLink>} v={id === g.managedClubId ? 'dein Verein' : ''} />) : <div className="dnote">Keine.</div>}
      {w && <>
        <div className="dsec">Fünfjahreswertung</div>
        {/* Spielstart nach 1975: noch keine abgeschlossene Saison → keine Liste aus lauter „0,0“ (test:audit) */}
        {de === 0 && rank.every((c) => coefSum(c.coef) === 0) ? <div className="dnote">Noch keine Wertung – sie zählt ab der ersten abgeschlossenen Europapokal-Saison.</div> : <>
          {rank.slice(0, 8).map((c, i) => <KV key={c.name} k={land(c.name, `${i + 1}. `)} v={fmtCoef(coefSum(c.coef))} />)}
          <KV k={land('Deutschland', `${deRank}. `)} v={fmtCoef(de)} strong color="var(--accent)" />
        </>}
        {last && <>
          <div className="dsec">Meister {last.season}</div>
          {rank.slice(0, 6).map((c) => {
            const id = last.champions[c.name];
            return id ? <KV key={c.name} k={land(c.name)} v={<ClubLink id={id}>{g.euroClubs?.[id]?.name ?? id}</ClubLink>} /> : null;
          })}
        </>}
      </>}
      {!w && <div className="dnote mt8">Die Auslandsligen starten mit der zweiten Saison.</div>}
    </DashBox>
  );
}
