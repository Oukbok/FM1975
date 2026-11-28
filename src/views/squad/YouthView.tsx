import { scoutRange } from '../../engine/scouting';
import { Game } from '../../game/state';
import { ALL_POSITIONS, Player, YOUTH_AGE_CLASS_LABEL, YOUTH_AGE_CLASS_ORDER, YOUTH_AGE_CLASS_RANGE, YouthAgeClass, youthAgeClass } from '../../types';
import { StarRating } from '../../components/StarRating';
import { fmtDateShort, vColor } from '../../ui/format';
import { teamStandings, type YouthStanding } from '../../game/youthComps/view';
import PosBadge from '../../components/PosBadge';

/** Kurz: „ · 3. Platz“ bzw. „ · Spielfeste“ für die Meter-Beschriftung. */
const placeOf = (t?: YouthStanding) => (!t ? '' : t.fest ? ' · Spielfeste' : t.pos ? ` · ${t.pos}. Platz` : '');
import { DashBox, DashPage, Empty, Meter } from '../../ui/DashPage';
import { PlayerRow } from '../shared';
import { YouthModal } from './YouthModal';
import { YOUTH_TEAM_SIZE } from '../../game/youthTeams';
import { useState } from 'react';
import { SubTabsPage, useSubTab, type SubTab } from '../../ui/SubTabs';
import { youthInvestOf } from '../../game/youthInvest';
import { yearOf } from '../../engine/economy';

// =============================================================================
// JUGEND (Jugendakademie) — Talentliste + Detail mit verstecktem Potenzial
// =============================================================================
export type YouthSort = 'pot' | 'ovr' | 'age' | 'cls' | 'name' | 'pos' | 'speed' | 'technique' | 'passing' | 'tackling' | 'shooting';

/** Rendert die Scouting-Einschätzung als GOLDENE Sterne-Spanne (min–max). */
export function ScoutRange({ p }: { p: Player }) {
  const [min, max] = scoutRange(p);
  // Vektor-Sterne wie in allen Spielertabellen: alle gleich breit, Viertel wie eine Uhr gefüllt (Wunsch Pascal).
  return <StarRating lo={min} hi={max} size={17} label="Potenzial" note="Einschätzung der Scouts – die Spanne wird mit dem Alter enger." />;
}

export function YouthView({ g, onChange }: { g: Game; onChange: () => void }) {
  const [sel, setSel] = useState<string | null>(null);
  const [sortBy, setSortByRaw] = useState<YouthSort>('pot');
  // Zweiter Klick auf dieselbe Spalte dreht die Richtung (Wunsch Pascal: alle Spalten sortierbar).
  const [desc, setDesc] = useState(true);
  const setSortBy = (k: YouthSort) => {
    if (k === sortBy) setDesc((d) => !d);
    else { setSortByRaw(k); setDesc(k !== 'name' && k !== 'pos' && k !== 'age' && k !== 'cls'); }
  };
  const [classFilter, setClassFilter] = useSubTab<YouthAgeClass | 'ALL'>('jugend.mannschaften', 'A');
  const club = g.clubs[g.managedClubId];
  const inv = youthInvestOf(club, yearOf(g.calendar.currentDate));

  const posIdx = (x: Player) => ALL_POSITIONS.indexOf(x.naturalPosition);
  const clsIdx = (x: Player) => YOUTH_AGE_CLASS_ORDER.indexOf(youthAgeClass(x.age) ?? 'G');
  const keyOf = (x: Player): number | string => {
    switch (sortBy) {
      case 'ovr': return x.overall;
      case 'age': return x.age;
      case 'cls': return clsIdx(x);
      case 'name': return `${x.lastName ?? ''} ${x.fullName}`;
      case 'pos': return posIdx(x);
      case 'speed': case 'technique': case 'passing': case 'tackling': case 'shooting': return x.attributes[sortBy];
      default: return scoutRange(x)[1] * 1000 + x.overall;
    }
  };
  const sortFn = (a: Player, b: Player) => {
    const ka = keyOf(a), kb = keyOf(b);
    const c = typeof ka === 'string' ? ka.localeCompare(kb as string, 'de') : ka - (kb as number);
    return (desc ? -c : c) || b.overall - a.overall;
  };

  const youth = club.youthPlayerIds
    .map((id) => g.youthPlayers[id])
    .filter(Boolean);

  // Talente nach Altersklasse G–A gruppieren.
  const byClass: Record<YouthAgeClass, Player[]> = { G: [], F: [], E: [], D: [], C: [], B: [], A: [] };
  for (const pl of youth) {
    const cls = youthAgeClass(pl.age);
    if (cls) byClass[cls].push(pl);
  }
  for (const cls of YOUTH_AGE_CLASS_ORDER) byClass[cls].sort(sortFn);

  const p = sel ? g.youthPlayers[sel] : null;

  const rows = sortBy === 'cls' || classFilter !== 'ALL'
    ? YOUTH_AGE_CLASS_ORDER.filter((cls) => classFilter === 'ALL' || classFilter === cls).flatMap((cls) => byClass[cls])
    : [...youth].sort(sortFn);
  if (sortBy === 'cls' && !desc) rows.reverse();
  const Th = ({ k, children, cls, title }: { k: YouthSort; children: React.ReactNode; cls?: string; title?: string }) => (
    <th className={`sortable ${cls ?? ''} ${sortBy === k ? 'sorted' : ''}`} title={title} onClick={() => setSortBy(k)}
      aria-sort={sortBy === k ? (desc ? 'descending' : 'ascending') : undefined}>{children}{sortBy === k ? (desc ? ' ▾' : ' ▴') : ''}</th>
  );
  const top = [...youth].sort((a, b) => (scoutRange(b)[1] - scoutRange(a)[1]) || b.overall - a.overall).slice(0, 5);
  const ready = youth.filter((x) => youthAgeClass(x.age) === 'A').sort((a, b) => b.overall - a.overall).slice(0, 4);
  const teams = teamStandings(g);
  const maxClass = Math.max(1, ...YOUTH_AGE_CLASS_ORDER.map((c) => byClass[c].length));

  // Drittes Menü: A- bis G-Jugend + Alle (Wunsch Pascal)
  const tabs: SubTab<YouthAgeClass | 'ALL'>[] = [
    ...[...YOUTH_AGE_CLASS_ORDER].reverse().map((cls) => ({
      id: cls, label: cls === 'G' ? 'Bambini' : `${cls}-Jugend`, count: byClass[cls].length,
      title: YOUTH_AGE_CLASS_RANGE[cls],
    })),
    { id: 'ALL', label: 'Alle', count: youth.length },
  ];
  const boxTitle = classFilter === 'ALL' ? `Alle Talente (${youth.length})` : `${YOUTH_AGE_CLASS_LABEL[classFilter]} (${byClass[classFilter].length})`;

  return (
    <SubTabsPage tabs={tabs} active={classFilter} onSelect={setClassFilter}>
    <DashPage>
      <DashBox title={boxTitle} span={2} rows={2} flush>
        {classFilter !== 'ALL' && teams[classFilter] && (
          <div className="yc-team-strip">
            {YOUTH_AGE_CLASS_LABEL[classFilter]}: {teams[classFilter]!.league ?? teams[classFilter]!.compLabel}
            {teams[classFilter]!.pos ? ` · ${teams[classFilter]!.pos}. von ${teams[classFilter]!.size}` : teams[classFilter]!.fest ? ' · ohne Tabelle' : ''}
            {teams[classFilter]!.next ? ` · nächster Termin ${fmtDateShort(teams[classFilter]!.next!.date).dmy}` : ''}
          </div>
        )}
        {rows.length === 0 ? (
          <Empty icon="youth">{youth.length === 0 ? 'Aktuell keine Talente in der Akademie. Der nächste Bambini-Jahrgang trifft zum 1. Juli ein.' : 'In dieser Altersklasse gibt es derzeit keine Talente.'}</Empty>
        ) : (
          <table className="dtable rl-players yv-table">
            <thead><tr>
              <Th k="cls" cls="rl-rank">Kl.</Th><Th k="name">Name</Th><Th k="pos" cls="ctr">Pos</Th><Th k="age" cls="num">Alter</Th>
              <Th k="ovr" cls="num">Stärke</Th><Th k="pot" title="Potenzial laut Scouting">Potenzial</Th>
              <Th k="speed" cls="num" title="Tempo">TMP</Th><Th k="technique" cls="num" title="Technik">TEC</Th><Th k="passing" cls="num" title="Passspiel">PAS</Th>
              <Th k="tackling" cls="num" title="Zweikampf">ZWK</Th><Th k="shooting" cls="num" title="Torschuss">TOR</Th>
            </tr></thead>
            <tbody>
              {rows.map((pl) => (
                <tr key={pl.id} data-pid={pl.id} className="clickable" onClick={() => setSel(pl.id)}>
                  <td className="rl-rank">{youthAgeClass(pl.age)}</td>
                  <td className="nowrap rl-name">{pl.fullName}</td>
                  <td className="ctr"><PosBadge p={pl} /></td>
                  <td className="num">{pl.age}</td>
                  <td className="num"><b style={{ color: vColor(pl.overall) }}>{pl.overall}</b></td>
                  <td><ScoutRange p={pl} /></td>
                  <td className="num" style={{ color: vColor(pl.attributes.speed) }}>{pl.attributes.speed}</td>
                  <td className="num" style={{ color: vColor(pl.attributes.technique) }}>{pl.attributes.technique}</td>
                  <td className="num" style={{ color: vColor(pl.attributes.passing) }}>{pl.attributes.passing}</td>
                  <td className="num" style={{ color: vColor(pl.attributes.tackling) }}>{pl.attributes.tackling}</td>
                  <td className="num" style={{ color: vColor(pl.attributes.shooting) }}>{pl.attributes.shooting}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </DashBox>

      <DashBox title="Jugendakademie" info="ausbildung" right={`Ruf ${Math.round(inv.reputation)}`}>
        <Meter label="Ausbildungsqualität" value={inv.quality} text={`${Math.round(inv.quality)}`} />
        {YOUTH_AGE_CLASS_ORDER.map((cls) => (
          <Meter key={cls} label={teams[cls] ? `${cls === 'G' ? 'Bambini' : `${cls}-Jugend`}${placeOf(teams[cls])}` : `${YOUTH_AGE_CLASS_LABEL[cls]} · ${YOUTH_AGE_CLASS_RANGE[cls].split(' · ')[0]}`} value={byClass[cls].length} max={Math.max(YOUTH_TEAM_SIZE[cls], maxClass)}
            text={`${byClass[cls].length} / ${YOUTH_TEAM_SIZE[cls]}`} />
        ))}
        <div className="dnote mt8">Jede Altersklasse hat eine volle Mannschaft. Die meisten spielen aus Freude am Fußball – Profi wird nur, wer genug Potenzial hat. Zum 1. Juli rücken alle auf, einige hören auf, Lücken werden aufgefüllt. Investitionen steuerst du unter Jugend › Akademie.</div>
      </DashBox>

      <DashBox title="Größte Talente">
        {top.length ? top.map((x) => (
          <div key={x.id} data-pid={x.id} className="dlist-row clickable" onClick={() => setSel(x.id)}>
            <PosBadge p={x} compact />
            <span className="grow">{x.fullName} <span className="muted">· {x.age} J.</span></span>
            <ScoutRange p={x} />
          </div>
        )) : <Empty icon="youth">Noch keine Talente.</Empty>}
        <div className="dsec">A-Jugend: bereit für die Profis</div>
        {ready.length ? ready.map((x) => <PlayerRow key={x.id} p={x} value={x.overall} onClick={() => setSel(x.id)} />)
          : <div className="dnote">Derzeit niemand in der A-Jugend.</div>}
        <div className="dnote mt8">Das echte Potenzial ist verborgen; die Spanne wird mit dem Alter enger.</div>
      </DashBox>

      {p && (
        <YouthModal
          g={g} player={p} club={club}
          onClose={() => setSel(null)}
          onChange={onChange}
        />
      )}
    </DashPage>
    </SubTabsPage>
  );
}
