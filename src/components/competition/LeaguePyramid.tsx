// =============================================================================
// <LeaguePyramid>: Übersicht Ligensystem – Pyramide der Ligen als klickbare
// Kästen, links die Vereinsliste der gewählten Liga mit Zonen. Oben Länderwahl:
// alle Länder alphabetisch in einer Liste (Heimatland vorgewählt, nicht mehr
// bestehende Ligen mit „(Archiv)“). Ebenen ohne simulierte Vereine (bis Ebene 4,
// data/leagueTiers.ts) als gestrichelte Strukturkästen. Daten aus game/leaguePyramid.ts
// (vor dem Start aus den Stammdaten, im Spiel aus dem Spielstand). Genutzt im
// Assistenten „Neues Spiel“, unter Statistiken › Ligensystem und im Länderprofil.
// =============================================================================
import { useMemo, useState } from 'react';
import ClubCrest from '../ClubCrest';
import { ClubLink } from '../club/ClubLink';
import { CountryFlag } from './CountryFlag';
import { countryInfo } from '../../data/countryFlags';
import Select from '../../ui/Select';
import { type PyrDivision, type PyrSystem, type PyramidData, type PyramidSide, pyrZone } from '../../game/leaguePyramid';
import type { Club } from '../../types';

function findDiv(sys: PyrSystem | undefined, id: string | undefined): PyrDivision | undefined {
  if (!sys) return undefined;
  const all = sys.levels.flat().filter((d) => !d.struct);
  return (id ? all.find((d) => d.id === id || d.clubs.some((c) => c.id === id)) : undefined) ?? all[0];
}

function flowText(d: PyrDivision): string[] {
  const out: string[] = [];
  if (d.pool) return ['Vereine ohne Liga im Spiel', 'die Besten rücken nach'];
  if (d.struct) return ['nicht simuliert'];
  if (d.champion) out.push(d.europe ? `Meister + ${d.europe} Europapokal` : 'Meister');
  if (d.up) out.push(`${d.up} Aufsteiger${d.upChance ? ' + 1 Chance' : ''}`);
  if (d.down) out.push(`${d.down} Absteiger`);
  return out;
}

/**
 * `lock` = festes Land ohne Länderwahl (Länderprofil, components/country/): Seite und
 * bei „abroad“ der Länder-Schlüssel.
 */
export function LeaguePyramid({ data, mineId, className = '', lock }: { data: PyramidData; mineId?: string; className?: string; lock?: { side: PyramidSide; country?: string } }) {
  const [side, setSide] = useState<PyramidSide>(lock?.side ?? 'west');
  const [country, setCountry] = useState<string>(lock?.country ?? data.abroad.find((a) => a.available)?.key ?? '');
  const sys: PyrSystem | undefined = side === 'west' ? data.west : side === 'ddr' ? data.ddr : data.abroad.find((a) => a.key === country) ?? data.abroad[0];
  const [selId, setSelId] = useState<string | undefined>(() => findDiv(sys, mineId)?.id);
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
  const cName = side === 'abroad' ? countryInfo(sys?.key ?? '').name : side === 'ddr' ? 'DDR' : isGer ? 'Deutschland (West)' : data.west.title;
  // Alle Länder alphabetisch in EINER Liste (Wunsch Pascal), Heimatland eingereiht; „(Archiv)“ = Liga besteht nicht mehr.
  const opts = [
    { value: 'west', name: data.west.title, flag: homeFlag, archive: false },
    ...(isGer ? [{ value: 'ddr', name: 'DDR', flag: 'DDR', archive: !!data.ddr.archive }] : []),
    ...data.abroad.map((a) => ({ value: `a:${a.key}`, name: countryInfo(a.key).name, flag: a.key, archive: !!a.archive })),
  ].sort((a, b) => a.name.localeCompare(b.name, 'de')).map((o) => {
    const text = `${o.name}${o.archive ? ' (Archiv)' : ''}`;
    return { value: o.value, text, label: <span className="lp-opt"><CountryFlag country={o.flag} height={13} />{text}</span> };
  });

  return (
    <div className={`lp ${className}`}>
      <div className="lp-bar">
        {/* Länderwahl als Auswahlliste (Wunsch Pascal): alle Länder alphabetisch */}
        {lock ? <span className="lp-lock"><CountryFlag country={side === 'abroad' ? sys?.key ?? '' : side === 'ddr' ? 'DDR' : homeFlag} height={16} noLink />{cName}</span> : <Select className="lp-country-sel" width={260} popWidth={300} listHeight={460} value={side === 'abroad' ? `a:${sys?.key ?? ''}` : side}
          onChange={(v) => (v.startsWith('a:') ? pick('abroad', v.slice(2)) : pick(v as PyramidSide))}
          options={opts} />}
        <span className="lp-season">Saison {data.season}</span>
      </div>

      <div className="lp-main">
        <aside className="lp-list">
          {sel?.struct ? <>
            <div className="lp-list-head">
              <div className="lp-list-title">{sel.name}</div>
              <div className="lp-list-sub"><CountryFlag country={side === 'abroad' ? sys?.key ?? '' : side === 'ddr' ? 'DDR' : homeFlag} height={12} />{cName} · {sel.level}. Ebene</div>
              <div className="lp-list-note">Nur Struktur – nicht simuliert</div>
            </div>
            <div className="lp-empty">{sel.struct}. Diese Ebene läuft im Spiel nicht mit: Vereine von hier tauchen erst auf, wenn sie in eine simulierte Liga aufsteigen.</div>
          </> : sel ? <>
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
                <div key={i} className={`lp-level ${lv[0]?.pool ? 'pool' : ''} ${lv[0]?.struct ? 'struct' : ''}`}>
                  <div className="lp-boxes">
                    <span className="lp-level-no">{lv[0]?.pool ? 'Unterbau' : `Ebene ${i + 1}`}</span>
                    {lv.map((d) => (
                      <button key={d.id} className={`lp-box ${d.id === sel?.id ? 'on' : ''} ${d.clubs.some((c) => c.id === mineId) ? 'mine' : ''} ${d.pool ? 'pool' : ''} ${d.struct ? 'struct' : ''}`}
                        onClick={() => setSelId(d.id)}>
                        <b>{d.name}</b>
                        <small>{d.struct ?? `${d.clubs.length} Vereine`}</small>
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
