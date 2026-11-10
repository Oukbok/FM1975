// =============================================================================
// <LeaguePyramid>: Übersicht Ligensystem – Pyramide der Ligen als klickbare
// Kästen, links die Vereinsliste der gewählten Liga mit Zonen. Oben Wahl
// Deutschland / DDR / Ausland. Daten aus game/leaguePyramid.ts (vor dem Start
// aus den Stammdaten, im Spiel aus dem Spielstand). Genutzt im Assistenten
// „Neues Spiel“ und unter Statistiken › Ligensystem.
// =============================================================================
import { useMemo, useState } from 'react';
import ClubCrest from '../ClubCrest';
import { ClubLink } from '../club/ClubLink';
import { CountryFlag } from './CountryFlag';
import { countryInfo } from '../../data/countryFlags';
import Select from '../../ui/Select';
import { type PyrDivision, type PyrSystem, type PyramidData, type PyramidSide, pyrZone } from '../../game/leaguePyramid';
import type { Club } from '../../types';

const SIDES: { k: PyramidSide; label: string; country: string }[] = [
  { k: 'west', label: 'Deutschland', country: 'Deutschland' },
  { k: 'ddr', label: 'DDR', country: 'DDR' },
  { k: 'abroad', label: 'Ausland', country: '' },
];

function findDiv(sys: PyrSystem | undefined, id: string | undefined): PyrDivision | undefined {
  if (!sys) return undefined;
  const all = sys.levels.flat();
  return (id ? all.find((d) => d.id === id || d.clubs.some((c) => c.id === id)) : undefined) ?? all[0];
}

function flowText(d: PyrDivision): string[] {
  const out: string[] = [];
  if (d.pool) return ['Vereine ohne Liga im Spiel', 'die Besten rücken nach'];
  if (d.champion) out.push(d.europe ? `Meister + ${d.europe} Europapokal` : 'Meister');
  if (d.up) out.push(`${d.up} Aufsteiger${d.upChance ? ' + 1 Chance' : ''}`);
  if (d.down) out.push(`${d.down} Absteiger`);
  return out;
}

export function LeaguePyramid({ data, mineId, className = '' }: { data: PyramidData; mineId?: string; className?: string }) {
  const [side, setSide] = useState<PyramidSide>('west');
  const [country, setCountry] = useState<string>(data.abroad[0]?.key ?? '');
  const sys: PyrSystem | undefined = side === 'west' ? data.west : side === 'ddr' ? data.ddr : data.abroad.find((a) => a.key === country) ?? data.abroad[0];
  const [selId, setSelId] = useState<string | undefined>(() => findDiv(data.west, mineId)?.id);
  const sel = useMemo(() => {
    const all = sys?.levels.flat() ?? [];
    return all.find((d) => d.id === selId) ?? findDiv(sys, mineId);
  }, [sys, selId, mineId]);
  const pick = (s: PyramidSide, c?: string) => {
    setSide(s);
    if (c) setCountry(c);
    const next = s === 'west' ? data.west : s === 'ddr' ? data.ddr : data.abroad.find((a) => a.key === (c ?? country));
    setSelId(findDiv(next, mineId)?.id);
  };
  // Heimatland (Weltdaten): Reiter/Flagge nach dem Land der eigenen Liga; DDR nur für Deutschland.
  const homeFlag = data.west.key === 'west' ? 'Deutschland' : data.west.key;
  const isGer = homeFlag === 'Deutschland';
  const sides = SIDES.filter((s) => s.k !== 'ddr' || isGer).map((s) => (s.k === 'west' ? { ...s, label: data.west.title, country: homeFlag } : s));
  const cName = side === 'abroad' ? countryInfo(sys?.key ?? '').name : side === 'ddr' ? 'DDR' : isGer ? 'Deutschland (West)' : data.west.title;

  return (
    <div className={`lp ${className}`}>
      <div className="lp-bar">
        {/* Länderwahl als Auswahlliste (Wunsch Pascal) statt Deutschland/DDR/Ausland */}
        <Select className="lp-country-sel" width={260} popWidth={300} listHeight={460} value={side === 'abroad' ? `a:${sys?.key ?? ''}` : side}
          onChange={(v) => (v.startsWith('a:') ? pick('abroad', v.slice(2)) : pick(v as PyramidSide))}
          options={[
            ...sides.filter((x) => x.k !== 'abroad').map((x) => ({ value: x.k, text: x.label, label: <span className="lp-opt"><CountryFlag country={x.country} height={13} />{x.label}</span> })),
            ...[...data.abroad].sort((a, b) => countryInfo(a.key).name.localeCompare(countryInfo(b.key).name, 'de')).map((a, i) => ({
              value: `a:${a.key}`, text: countryInfo(a.key).name, group: i === 0 ? 'Ausland' : undefined,
              label: <span className="lp-opt"><CountryFlag country={a.key} height={13} />{countryInfo(a.key).name}</span>,
            })),
          ]} />
        <span className="lp-season">Saison {data.season}</span>
      </div>

      <div className="lp-main">
        <aside className="lp-list">
          {sel ? <>
            <div className="lp-list-head">
              <div className="lp-list-title">{sel.name}</div>
              <div className="lp-list-sub"><CountryFlag country={side === 'abroad' ? sys?.key ?? '' : side === 'ddr' ? 'DDR' : homeFlag} height={12} />{cName} · {sel.clubs.length} Vereine</div>
              <div className="lp-list-note">{sel.order === 'table' ? 'Aktuelle Tabelle' : sel.order === 'pool' ? 'Nach Stärke – kein Spielbetrieb im Spiel' : 'Prognose nach Stärke'}</div>
            </div>
            <div className="rl rl-sm lp-rows">
              {sel.clubs.map((c, i) => (
                <div key={c.id} className={`rl-row ${c.id === mineId ? 'me' : ''}`}>
                  <span className="rl-rank"><span className={`rl-z ${pyrZone(sel, i + 1)}`}>{i + 1}</span></span>
                  <span className="rl-club">
                    <ClubLink id={c.dotOnly ? null : c.id} className="lp-club">
                      {c.dotOnly
                        ? <span className="lp-dot" style={{ background: c.colors.primary }} />
                        : <ClubCrest club={c as unknown as Club} size={24} />}
                      <span className="rl-name">{c.name}</span>
                    </ClubLink>
                  </span>
                  <span className="rl-num">{Math.round(c.strength)}</span>
                </div>
              ))}
            </div>
            <div className="lp-legend">
              {(sel.champion > 0 || sel.up > 0) && <span><i className="zone-cl" />{sel.champion ? 'Meister' : 'Aufstieg'}</span>}
              {(sel.europe > 0 || sel.upChance > 0) && <span><i className="zone-po" />{sel.europe ? 'Europapokal' : 'Aufstiegschance'}</span>}
              {sel.down > 0 && <span><i className="zone-rel" />{sel.downTo ?? 'Abstieg'}</span>}
            </div>
          </> : <div className="lp-empty">{sys?.note}</div>}
        </aside>

        <div className="lp-stage">
          {sys?.available === false || !sys?.levels.length
            ? <div className="lp-empty big">{sys?.note ?? 'Keine Ligen.'}</div>
            : <div className="lp-levels">
              {sys.levels.map((lv, i) => (
                <div key={i} className={`lp-level ${lv[0]?.pool ? 'pool' : ''}`}>
                  <span className="lp-level-no">{lv[0]?.pool ? 'Unterbau' : `Ebene ${i + 1}`}</span>
                  <div className="lp-boxes">
                    {lv.map((d) => (
                      <button key={d.id} className={`lp-box ${d.id === sel?.id ? 'on' : ''} ${d.clubs.some((c) => c.id === mineId) ? 'mine' : ''} ${d.pool ? 'pool' : ''}`}
                        onClick={() => setSelId(d.id)}>
                        <b>{d.name}</b>
                        <small>{d.clubs.length} Vereine</small>
                        <span className="lp-flow">{flowText(d).map((t) => <em key={t}>{t}</em>)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>}
          {sys?.note && sys.available && <p className="lp-note">{sys.note}</p>}
          {side === 'west' && data.reforms.length > 0 && (
            <div className="lp-reforms">
              <span className="lp-reforms-lbl">Ligareformen</span>
              {data.reforms.map((r) => (
                <span key={r.season} className={`lp-reform ${r.past ? 'past' : ''}`}><b>{r.season}</b>{r.title}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
