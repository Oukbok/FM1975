// =============================================================================
// Spielertabelle des Transfermarkts (Wunsch Pascal, Aufbau nach EA FM): Kopfzeile
// mit Trefferzahl und „Nur gescoutete Spieler“, Spalten Info · Spieler · Nation ·
// Verein · Position (PosBadge + Spielertyp) · Alter · Fähigkeit/Potenzial als Sterne
// mit Spanne · Transferwert/Gehalt als Spanne · Empfehlung · Kenntnisse (Balken).
// Alle Werte aus game/marketView.ts (Schätzung nach Bekanntheit). Spaltenköpfe sortieren.
// `compact` (Beobachtung, schmale Box): ohne Info, Gehalt und Empfehlungstext.
// =============================================================================
import { useMemo, useState, type ReactNode } from 'react';
import ClubCrest from '../../components/ClubCrest';
import { ClubLink } from '../../components/club/ClubLink';
import FaceThumb from '../../components/FaceThumb';
import PosBadge from '../../components/PosBadge';
import { NatFlag } from '../../components/competition/CountryFlag';
import { KnowledgeBar, StarRating } from '../../components/StarRating';
import { PLAYER_TYPE } from '../../components/player/shared';
import { knowWord } from '../../game/playerPool';
import { marketInfo, TAG_SHORT, type MarketInfo } from '../../game/marketView';
import type { Game } from '../../game/state';
import type { Player } from '../../types';
import { fmtPriceRange, fmtWageRange, wageHead } from '../../ui/format';
import { InfoTip } from '../../ui/InfoTip';
import { useMultiSelect } from '../../ui/useMultiSelect';

type SortKey = 'name' | 'age' | 'ability' | 'potential' | 'value' | 'wage' | 'rec' | 'know';
const REC_ORDER: Record<string, number> = { '1+': 8, '1': 7, '2+': 6, '2': 5, '2-': 4, '3': 3, '3-': 2, '4': 1, '–': 0 };

export function MarketTable({ g, list, onOpen, action, compact = false, extra, filtered = false }: {
  g: Game; list: Player[]; onOpen: (id: string) => void; action?: (p: Player) => ReactNode;
  compact?: boolean;
  /** Zusatz rechts in der Kopfzeile (z. B. Budget) */
  extra?: ReactNode;
  /** Liste ist schon gefiltert (Suche, Mannschaftsteil) – nur für die Kopfzeile */
  filtered?: boolean;
}) {
  const [onlyScouted, setOnlyScouted] = useState(false);
  const [sort, setSort] = useState<{ k: SortKey; dir: 1 | -1 } | null>(null);
  const info = useMemo(() => marketInfo(g, list), [g, list, g.calendar.currentDate]);
  const shown = useMemo(() => {
    let xs = onlyScouted ? list.filter((p) => info.get(p.id)?.scouted) : list;
    if (sort) {
      const val = (p: Player, m: MarketInfo): number | string => {
        switch (sort.k) {
          case 'name': return p.lastName;
          case 'age': return p.age;
          case 'ability': return m.ability.lo + m.ability.hi;
          case 'potential': return m.potential.lo + m.potential.hi;
          case 'value': return m.value[0] + m.value[1];
          case 'wage': return m.wage[0] + m.wage[1];
          case 'rec': return REC_ORDER[m.rec.grade] ?? 0;
          case 'know': return m.k;
        }
      };
      xs = [...xs].sort((a, b) => {
        const va = val(a, info.get(a.id)!), vb = val(b, info.get(b.id)!);
        return (typeof va === 'string' ? va.localeCompare(vb as string) : va - (vb as number)) * sort.dir;
      });
    }
    return xs;
  }, [list, info, onlyScouted, sort]);
  const ms = useMultiSelect(shown.map((p) => p.id));
  const th = (k: SortKey, label: ReactNode, cls = '') => (
    <th className={`mk-sort ${cls} ${sort?.k === k ? 'on' : ''}`} onClick={() => setSort((s) => (s?.k === k ? (s.dir === -1 ? { k, dir: 1 } : null) : { k, dir: k === 'name' ? 1 : -1 }))}>
      {label}{sort?.k === k ? <span className="mk-sort-dir">{sort.dir === -1 ? '▼' : '▲'}</span> : null}
    </th>
  );

  return (
    <div className={`mk ${compact ? 'compact' : ''}`}>
      <div className="mk-bar">
        <span className="mk-count"><b>{shown.length}</b> Spieler gefunden{filtered || onlyScouted ? ' (gefiltert)' : ''}</span>
        <label className="mk-only-wrap">
          <span>Nur gescoutete Spieler</span>
          <button type="button" className={`toggle mk-only ${onlyScouted ? 'on' : ''}`} aria-pressed={onlyScouted} aria-label="Nur gescoutete Spieler" onClick={() => setOnlyScouted((v) => !v)} />
        </label>
        <span className="mk-extra">{extra}</span>
      </div>
      <div className="mk-scroll">
        <table className="dtable rl-players mk-table" {...ms.attr}>
          <thead><tr>
            <th className="mk-c-check" />
            {!compact && <th className="mk-c-info">Info</th>}
            {th('name', 'Spieler')}
            <th>Nation</th>
            <th>Verein</th>
            <th>Position</th>
            {th('age', 'Alter', 'num')}
            {th('ability', <>Fähigkeit<InfoTip k="faehigkeitSterne" /></>)}
            {th('potential', <>Potenzial<InfoTip k="potenzial" /></>)}
            {th('value', <>Transferwert<InfoTip k="marktwert" /></>)}
            {!compact && th('wage', wageHead())}
            {th('rec', <>Empfehlung<InfoTip k="empfehlung" /></>)}
            {th('know', 'Kenntnisse', 'ctr')}
            {action && <th />}
          </tr></thead>
          <tbody>
            {shown.map((p) => {
              const c = g.clubs[p.clubId];
              const m = info.get(p.id)!;
              const sel = ms.has(p.id);
              return (
                <tr key={p.id} data-pid={p.id} className={`clickable ${sel ? 'msel' : ''}`}
                  onMouseDown={ms.onMouseDown} onClick={(e) => { if (!ms.click(e, p.id)) onOpen(p.id); }}>
                  <td className="mk-c-check" onClick={(e) => { e.stopPropagation(); ms.click({ ...e, ctrlKey: true, metaKey: false, shiftKey: e.shiftKey } as unknown as React.MouseEvent, p.id); }}>
                    <span className={`mk-box ${sel ? 'on' : ''}`} role="checkbox" aria-checked={sel} aria-label={`${p.fullName} markieren`} />
                  </td>
                  {!compact && <td className="mk-c-info">{m.tags.slice(0, 1).map((t) => <span key={t} className="mk-tag" title={m.tags.join(' · ')}>{TAG_SHORT[t] ?? t}{m.tags.length > 1 ? '+' : ''}</span>)}</td>}
                  <td className="nowrap rl-name"><span className="tm-name"><FaceThumb p={p} club={c} size={26} /><span className="mk-pname">{p.fullName}</span></span></td>
                  <td className="nowrap"><span className="mk-nat"><NatFlag nat={p.nationality} />{!compact && <span>{p.nationality}</span>}</span></td>
                  <td className="nowrap"><ClubLink id={p.clubId}><span className="mk-club">{c && <ClubCrest club={c} size={24} />}<span>{compact ? c?.shortName : c?.name ?? c?.shortName}</span></span></ClubLink></td>
                  <td className="nowrap"><span className="mk-pos"><PosBadge p={p} /><span className="mk-role">{PLAYER_TYPE[p.naturalPosition] ?? ''}</span></span></td>
                  <td className="num">{p.age}</td>
                  <td><StarRating lo={m.ability.lo} hi={m.ability.hi} label="Fähigkeit" note="Aktuelle Stärke nach Einschätzung deiner Scouts." /></td>
                  <td><StarRating lo={m.potential.lo} hi={m.potential.hi} label="Potenzial" note="Mögliche Höchststärke." /></td>
                  <td className="nowrap"><span className="mk-money">{fmtPriceRange(m.value[0], m.value[1])}</span></td>
                  {!compact && <td className="nowrap"><span className="mk-money">{fmtWageRange(m.wage[0], m.wage[1])}</span></td>}
                  <td className="nowrap"><span className={`mk-rec t${m.rec.tone}`} title={m.rec.text}><span className="mk-rec-c">{m.rec.grade}</span>{!compact && <span className="mk-rec-t">{m.rec.text}</span>}</span></td>
                  <td className="ctr"><KnowledgeBar k={m.k} word={knowWord(m.k)} /></td>
                  {action && <td className="num nowrap" onClick={(e) => e.stopPropagation()}>{action(p)}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
