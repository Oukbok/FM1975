import { coefSum, countryRanking } from '../../engine/world';
import { yearOf } from '../../engine/economy';
import { Game } from '../../game/state';
import { DashBox, KV } from '../../ui/DashPage';

// =============================================================================
// Europa im Hintergrund: Fünfjahreswertung und Meister der Auslandsligen.
// =============================================================================
const LABEL: Record<string, string> = { Oesterreich: 'Österreich', Daenemark: 'Dänemark', Tuerkei: 'Türkei', Rumaenien: 'Rumänien' };
const label = (c: string) => LABEL[c] ?? c;

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
      {germans.length ? germans.map((id) => <KV key={id} k={teamName(id)} v={id === g.managedClubId ? 'dein Verein' : ''} />) : <div className="dnote">Keine.</div>}
      {w && <>
        <div className="dsec">Fünfjahreswertung</div>
        {rank.slice(0, 8).map((c, i) => <KV key={c.name} k={`${i + 1}. ${label(c.name)}`} v={coefSum(c.coef).toFixed(1)} />)}
        <KV k={`${deRank}. Deutschland`} v={de.toFixed(1)} strong color="var(--accent)" />
        {last && <>
          <div className="dsec">Meister {last.season}</div>
          {rank.slice(0, 6).map((c) => {
            const id = last.champions[c.name];
            return id ? <KV key={c.name} k={label(c.name)} v={g.euroClubs?.[id]?.name ?? id} /> : null;
          })}
        </>}
      </>}
      {!w && <div className="dnote mt8">Die Auslandsligen starten mit der zweiten Saison.</div>}
    </DashBox>
  );
}
