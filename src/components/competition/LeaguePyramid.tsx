// =============================================================================
// <LeaguePyramid>: Übersicht Ligensystem – Pyramide der Ligen als klickbare
// Kästen, links die Vereinsliste der gewählten Liga mit Zonen. Oben Länderwahl:
// alle Länder alphabetisch in einer Liste (Heimatland vorgewählt, nicht mehr
// bestehende Ligen mit „(Archiv)“). Ebenen ohne simulierte Vereine (bis Ebene 4,
// data/leagueTiers.ts) als gestrichelte Strukturkästen. Daten aus game/leaguePyramid.ts
// (vor dem Start aus den Stammdaten, im Spiel aus dem Spielstand). Genutzt im
// Assistenten „Neues Spiel“, unter Statistiken › Ligensystem und im Länderprofil.
// =============================================================================
import { useMemo, useState, type ReactNode } from 'react';
import ClubCrest from '../ClubCrest';
import { ClubLink } from '../club/ClubLink';
import { CountryFlag } from './CountryFlag';
import { countryInfo } from '../../data/countryFlags';
import Select from '../../ui/Select';
import { type PyrDivision, type PyrFinal, type PyrSystem, type PyramidData, type PyramidSide, pyrSize, pyrZone } from '../../game/leaguePyramid';
import type { Club } from '../../types';
import { leagueTrophyShape } from '../../game/trophyCabinet';
import { TrophyImage } from '../../views/club/trophies/TrophyImage';

function findDiv(sys: PyrSystem | undefined, id: string | undefined): PyrDivision | undefined {
  if (!sys) return undefined;
  const all = sys.levels.flat().filter((d) => !d.struct);
  return (id ? all.find((d) => d.id === id || d.clubs.some((c) => c.id === id)) : undefined) ?? all[0];
}


/** Kurze Zeile unter dem Namen: Meister/Europapokal (1. Ebene) bzw. Hinweis bei Pool/Strukturkasten. */
function headText(d: PyrDivision, past = false): string | null {
  if (d.pool) return 'Vereine ohne Liga im Spiel – die Besten rücken nach';
  if (d.struct) return past ? null : 'nicht simuliert';
  if (d.champion) return d.europe ? `Meister + ${d.europe} Europapokal` : 'Meister';
  return null;
}

/**
 * Auf-/Abstieg als klare Marken (Wunsch Pascal: „2 Auf · 1 Aufstiegsrunde · 3 Ab“). Zahlen wie im Saisonwechsel
 * (game/leaguePyramid.ts westZones/abroadZones/ddrZones); Relegationsspiele gibt es im Spiel nicht.
 */
function Moves({ d }: { d: PyrDivision }) {
  if (d.pool || d.struct) return null;
  const marks: { k: string; cls: string; text: string; tip: string }[] = [];
  if (d.up) marks.push({ k: 'up', cls: 'up', text: `${d.up} Auf`, tip: `${d.up === 1 ? 'Der Meister steigt' : `Die ersten ${d.up} steigen`} direkt auf` });
  if (d.upChance) marks.push({ k: 'ch', cls: 'chance', text: '+1 bester Zweiter', tip: 'Der stärkste Zweite aller Staffeln steigt zusätzlich auf' });
  if (d.round) marks.push({ k: 'rd', cls: 'chance', text: d.round.seats > 1 ? 'Aufstiegsrunde ×2' : 'Aufstiegsrunde', tip: `${d.round.seats > 1 ? 'Meister und Vizemeister spielen mit. ' : 'Der Meister spielt mit. '}${d.round.field} Teilnehmer aus allen Staffeln spielen ${d.round.slots} Aufstiegsplätze in Duellen aus` });
  if (d.down) marks.push({ k: 'dn', cls: 'down', text: `${d.down} Ab`, tip: d.downTo ?? 'Abstieg' });
  if (!marks.length) return null;
  return <span className="lp-moves">{marks.map((m) => <span key={m.k} className={`lp-mv ${m.cls}`} title={m.tip}>{m.text}</span>)}</span>;
}

/**
 * `lock` = festes Land ohne Länderwahl (Länderprofil, components/country/): Seite und
 * bei „abroad“ der Länder-Schlüssel.
 */
/**
 * Statistiken › Ligensystem (Zeiträume, Wunsch Pascal): `pick`/`onPick` = Länderwahl vom Aufrufer gesteuert
 * (Zeitraum-Wahl im Box-Kopf), `final` = Abschlusstabelle einer Liga im früheren Zeitraum,
 * `onReform` = Klick auf eine Ligareform wählt ihren Zeitraum.
 */
export interface PyramidCtl {
  pick: { side: PyramidSide; country: string };
  onPick: (side: PyramidSide, country: string) => void;
  final?: (d: PyrDivision) => PyrFinal | null;
  onReform?: (season: string) => void;
}

export function LeaguePyramid({ data, mineId, className = '', lock, ctl, aside }: { data: PyramidData; mineId?: string; className?: string; lock?: { side: PyramidSide; country?: string }; ctl?: PyramidCtl; /** dritte Spalte rechts (Statistiken › Ligensystem: Pokale des Landes) */ aside?: ReactNode }) {
  // Dein Verein in der DDR (DDR-Start, game/ddrHome.ts) → DDR-Pyramide vorgewählt.
  const mineInDdr = !!mineId && !!data.ddr.available && data.ddr.levels.flat().some((d) => d.clubs.some((c) => c.id === mineId));
  const [sideState, setSide] = useState<PyramidSide>(lock?.side ?? (mineInDdr ? 'ddr' : 'west'));
  const [countryState, setCountry] = useState<string>(lock?.country ?? data.abroad.find((a) => a.available)?.key ?? '');
  const side = ctl?.pick.side ?? sideState;
  const country = ctl?.pick.country ?? countryState;
  const sys: PyrSystem | undefined = side === 'west' ? data.west : side === 'ddr' ? data.ddr : data.abroad.find((a) => a.key === country) ?? data.abroad[0];
  const [selId, setSelId] = useState<string | undefined>(() => findDiv(sys, mineId)?.id);
  const sel = useMemo(() => {
    const all = sys?.levels.flat() ?? [];
    return all.find((d) => d.id === selId) ?? findDiv(sys, mineId);
  }, [sys, selId, mineId]);
  const pick = (s: PyramidSide, c?: string) => {
    if (ctl) { ctl.onPick(s, c ?? country); return; }
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
        <span className={`lp-season ${sys?.past ? 'past' : ''}`}>{sys?.past ? `Stand: Saison ${sys.stand ?? ''}` : `Saison ${data.season}`}</span>
      </div>

      <div className={`lp-main ${aside ? 'has-aside' : ''}`}>
        <aside className="lp-list">
          {sel?.struct ? <>
            <div className="lp-list-head">
              <div className="lp-list-title">{sel.name}</div>
              <div className="lp-list-sub"><CountryFlag country={side === 'abroad' ? sys?.key ?? '' : side === 'ddr' ? 'DDR' : homeFlag} height={12} />{cName} · {sel.level}. Ebene</div>
              <div className="lp-list-note">Nur Struktur – nicht simuliert</div>
            </div>
            <div className="lp-empty">{sel.struct}. Diese Ebene läuft im Spiel nicht mit: Vereine von hier tauchen erst auf, wenn sie in eine simulierte Liga aufsteigen.</div>
          </> : sel && sys?.past ? <PastList sel={sel} final={ctl?.final?.(sel) ?? null} cName={cName} flag={side === 'abroad' ? sys?.key ?? '' : side === 'ddr' ? 'DDR' : homeFlag} mineId={mineId} />
            : sel ? <>
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
              {(sel.europe > 0 || sel.upChance > 0 || !!sel.round) && <span><i className="zone-po" />{sel.europe ? 'Europapokal' : sel.round ? 'Aufstiegsrunde' : 'Aufstiegschance'}</span>}
              {sel.down > 0 && <span><i className="zone-rel" />{sel.downTo ?? 'Abstieg'}</span>}
            </div>
          </> : <div className="lp-empty">{sys?.note}</div>}
        </aside>

        <div className={`lp-stage ${sys?.archive && sys.since ? 'archived' : ''}`}>
          {sys?.archive && sys.since && (
            <>
              <div className="lp-archived" role="note"><b>Diese Liga existiert seit {sys.since} nicht mehr.</b> Gezeigt wird ihr letzter Stand.</div>
              <span className="lp-stamp" aria-hidden="true"><span>Archiviert</span><small>seit {sys.since}</small></span>
            </>
          )}
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
                        <span className="lp-box-head">
                          {!d.pool && !d.struct && ((shape) => shape && <span className="lp-box-tro"><TrophyImage shape={shape} title /></span>)(leagueTrophyShape(i + 1, side === 'ddr'))}
                          <span className="lp-box-name"><b>{d.name}</b><small>{d.struct ?? `${pyrSize(d)} Vereine`}</small></span>
                        </span>
                        {((t) => t && <span className="lp-flow"><em>{t}</em></span>)(headText(d, sys.past))}
                        <Moves d={d} />
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
                ctl?.onReform && r.past
                  ? <button key={r.season} type="button" className={`lp-reform ${r.past ? 'past' : ''} ${r.on ? 'on' : ''}`} onClick={() => ctl.onReform?.(r.season)} title="Zeitraum dieser Reform zeigen"><b>{r.season}</b>{r.title}</button>
                  : <span key={r.season} className={`lp-reform ${r.past ? 'past' : ''} ${r.on ? 'on' : ''}`}><b>{r.season}</b>{r.title}</span>
              ))}
            </div>
          )}
          {sys?.available !== false && !!sys?.levels.length && <p className="lp-key">
            <span><i className="up" />Auf = direkter Aufstieg</span>
            <span><i className="chance" />Aufstiegsrunde/bester Zweiter = weitere Plätze</span>
            <span><i className="down" />Ab = Abstieg</span>
            <span className="lp-key-rel">Relegation: keine – im Spiel gibt es keine Relegationsspiele</span>
          </p>}
        </div>
        {aside}
      </div>
    </div>
  );
}

/** Linke Liste in einem früheren Zeitraum: Abschlusstabelle der letzten Saison, falls im Spielstand. */
function PastList({ sel, final, cName, flag, mineId }: { sel: PyrDivision; final: PyrFinal | null; cName: string; flag: string; mineId?: string }) {
  const clubs = final?.clubs;
  const shown: PyrDivision = clubs ? { ...sel, clubs } : sel;
  return <>
    <div className="lp-list-head">
      <div className="lp-list-title">{sel.name}</div>
      <div className="lp-list-sub"><CountryFlag country={flag} height={12} />{cName} · {pyrSize(sel)} Vereine</div>
      <div className="lp-list-note">{final?.caption ?? 'Abschlusstabelle'}</div>
    </div>
    {clubs?.length ? <>
      <div className="rl rl-sm lp-rows">
        {clubs.map((c, i) => (
          <div key={c.id} className={`rl-row ${c.id === mineId ? 'me' : ''}`}>
            <span className="rl-rank"><span className={`rl-z ${pyrZone(shown, i + 1)}`}>{i + 1}</span></span>
            <span className="rl-club">
              <ClubLink id={c.dotOnly ? null : c.id} className="lp-club">
                {c.dotOnly ? <span className="lp-dot" style={{ background: c.colors.primary }} /> : <ClubCrest club={c as unknown as Club} size={24} />}
                <span className="rl-name">{c.name}</span>
              </ClubLink>
            </span>
            <span className="rl-num">{c.pts ?? ''}</span>
          </div>
        ))}
      </div>
      <div className="lp-legend">
        {(sel.champion > 0 || sel.up > 0) && <span><i className="zone-cl" />{sel.champion ? 'Meister' : 'Aufstieg'}</span>}
        {(sel.europe > 0 || sel.upChance > 0 || !!sel.round) && <span><i className="zone-po" />{sel.europe ? 'Europapokal' : sel.round ? 'Aufstiegsrunde' : 'Aufstiegschance'}</span>}
        {sel.down > 0 && <span><i className="zone-rel" />{sel.downTo ?? 'Abstieg'}</span>}
      </div>
    </> : <div className="lp-empty">{final?.hint ?? (sel.struct ? `${sel.struct}. Diese Ebene lief im Spiel nicht mit.` : 'Für diese Liga liegt keine Abschlusstabelle vor.')}</div>}
  </>;
}
