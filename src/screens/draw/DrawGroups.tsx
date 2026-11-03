// =============================================================================
// Gruppenauslosung in der Show (Europapokal 2.0): Gruppen füllen sich Kugel für
// Kugel (unten in der Mittelkarte), am Ende „Deine Gruppe“ bzw. „Deine Gegner“ (Ligaphase) und die
// Übersicht aller Gruppen. Daten: DrawRecord.groups/opponents (game/euroDraw.ts).
// =============================================================================
import ClubCrest from '../../components/ClubCrest';
import { ClubLink } from '../../components/club/ClubLink';
import type { DrawRecord } from '../../types/draw';
import type { ShowClub } from './drawScript';

/** Ist das eine Gruppen- bzw. Ligaphasen-Ziehung? */
export const isGroupDraw = (rec: DrawRecord) => !!rec.groups?.length;
export const isLeagueDraw = (rec: DrawRecord) => !!rec.opponents;

function Slot({ c, fresh, crest = 22 }: { c: ShowClub | null; fresh?: boolean; crest?: number }) {
  if (!c) return <div className="dr-gslot empty"><span>–</span></div>;
  return (
    <div className={`dr-gslot ${c.mine ? 'me' : ''} ${fresh ? 'fresh' : ''}`}>
      <ClubLink id={c.id}><ClubCrest club={c.crest} size={crest} /></ClubLink><span>{c.name}</span>
    </div>
  );
}

/** Unten in der Mittelkarte während der Show: Gruppen füllen sich (feste Plätze, nichts springt). */
export function GroupsPanel({ rec, clubs, shown }: { rec: DrawRecord; clubs: (id: string) => ShowClub; shown: number }) {
  const seen = rec.balls.slice(0, shown);
  const last = seen[seen.length - 1];
  if (isLeagueDraw(rec)) {
    // Ligaphase: zuletzt gezogene Vereine mit ihren Gegnern (Kürzel), neueste oben.
    return (
      <div className="dg-league">
        {[...seen].reverse().slice(0, 9).map((b, i) => {
          const c = clubs(b.id);
          const o = rec.opponents![b.id];
          return (
            <div key={b.id} className={`dg-lrow ${c.mine ? 'mine' : ''} ${i === 0 ? 'fresh' : ''}`}>
              <Slot c={c} crest={34} />
              <span className="dg-lopp"><b>Heim</b> {o.home.map((x) => clubs(x).short).join(' · ')}</span>
              <span className="dg-lopp"><b>Auswärts</b> {o.away.map((x) => clubs(x).short).join(' · ')}</span>
            </div>
          );
        })}
      </div>
    );
  }
  const groups = rec.groups ?? [];
  const per = Math.max(...groups.map((gr) => gr.ids.length));
  const cols = groups.length > 8 ? 8 : groups.length === 6 ? 3 : Math.min(4, groups.length);
  return (
    <div className={`dg-groups ${groups.length > 8 ? 'many' : ''}`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {groups.map((gr, gi) => {
        const ids = seen.filter((b) => b.group === gi).map((b) => b.id);
        return (
          <div key={gr.name} className={`dg-gcard ${ids.some((id) => clubs(id).mine) ? 'mine' : ''} ${last?.group === gi ? 'fresh' : ''}`}>
            <div className="dg-gname">Gruppe {gr.name}</div>
            {Array.from({ length: per }, (_, k) => <Slot key={k} c={ids[k] ? clubs(ids[k]) : null} fresh={ids[k] === last?.id} crest={groups.length > 8 ? 24 : 30} />)}
          </div>
        );
      })}
    </div>
  );
}

/** Ende der Show: eigene Gruppe bzw. eigene Gegner der Ligaphase. */
export function GroupSummary({ rec, clubs, myId, onClose }: { rec: DrawRecord; clubs: (id: string) => ShowClub; myId: string; onClose: () => void }) {
  const opp = rec.opponents?.[myId];
  const mine = rec.groups?.find((gr) => gr.ids.includes(myId));
  const show = mine ?? rec.groups?.[0];
  return (
    <div className="dr-gsum">
      <div className="dr-sum-kicker">{opp ? 'Deine Gegner in der Ligaphase' : mine ? 'Deine Gruppe' : 'Dein Verein ist nicht dabei – Gruppe A'}</div>
      {opp ? (
        <div className="dr-opp">
          {[...opp.home.map((id) => [id, 'Heim'] as const), ...opp.away.map((id) => [id, 'Auswärts'] as const)].map(([id, w]) => {
            const c = clubs(id);
            return <div key={id} className="dr-opp-row"><ClubCrest club={c.crest} size={30} /><span>{c.name}</span><span>{w} · {c.country}</span></div>;
          })}
        </div>
      ) : show && (
        <div className={`dr-gcard ${mine ? 'mine' : ''}`}>
          <div className="dr-gname">{rec.opponents ? 'Ligaphase' : `Gruppe ${show.name}`}</div>
          {show.ids.slice(0, 6).map((id) => <Slot key={id} c={clubs(id)} crest={40} />)}
        </div>
      )}
      <button className="dr-close" onClick={onClose}>{opp ? 'Alle Töpfe' : 'Alle Gruppen'}</button>
    </div>
  );
}

/** Übersicht nach der Ziehung: alle Gruppen (bzw. Töpfe der Ligaphase). */
export function GroupsOverview({ rec, clubs }: { rec: DrawRecord; clubs: (id: string) => ShowClub }) {
  const league = isLeagueDraw(rec);
  const cards = league ? rec.pots.map((p) => ({ name: p.label, ids: p.ids })) : (rec.groups ?? []).map((gr) => ({ name: `Gruppe ${gr.name}`, ids: gr.ids }));
  return (
    <div className="dr-wide-body">
      <div className="dr-ov-head">
        <span>{league ? `Ligaphase · ${rec.balls.length} Vereine in ${rec.pots.length} Töpfen` : `${cards.length} Gruppen`}</span>
        <span className="dr-dim">{league ? 'Gegner je Verein: im Vereinsprofil und unter Statistiken › International' : 'Erster Spieltag'} · {new Date(rec.matchDate + 'T00:00:00Z').toLocaleDateString('de-DE', { timeZone: 'UTC' })}</span>
      </div>
      <div className={`dr-ov-groups ${cards.length === 6 || cards.length > 8 ? 'g6' : ''} ${cards.length > 8 || league ? 'dense' : ''}`}>
        {cards.map((c) => (
          <div key={c.name} className={`dr-gcard ${c.ids.some((id) => clubs(id).mine) ? 'mine' : ''}`}>
            <div className="dr-gname">{c.name}</div>
            {c.ids.map((id) => <Slot key={id} c={clubs(id)} crest={league || cards.length > 8 ? 26 : 34} />)}
          </div>
        ))}
      </div>
    </div>
  );
}
