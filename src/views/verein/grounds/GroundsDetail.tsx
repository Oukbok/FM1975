// =============================================================================
// VEREINSGELÄNDE — Detailansicht eines Umfeld-Teils (engine/grounds.ts) bzw.
// einer Einrichtung (engine/infrastructure.ts): Stufe, Wirkung, Zustand,
// nächster Ausbau mit Kosten/Fläche/Genehmigung, Sanieren, Abreißen.
// =============================================================================
import { useState } from 'react';
import { Game } from '../../../game/state';
import { Club, FacilityKey } from '../../../types';
import { ClubGrounds, GroundsModuleKey } from '../../../types/grounds';
import { GROUNDS_BY_KEY, GROUNDS_CATEGORIES, GroundsLevelDef, INFRA_AREA, permitMonths } from '../../../data/groundsCatalog';
import { areaUsed, checkNext, condMult, isOutdated, levelOf, mdScale, merchSlump, renovateCost } from '../../../engine/grounds';
import { DM_PER_EUR, currencyForYear, economyScale as economyScaleOf, formatMoney, revenueScale } from '../../../engine/economy';
import { commercialMultiplier } from '../../../engine/clubEconomy';
import { CATERING_UPKEEP } from '../../../engine/finances';
import { FACILITY_BY_KEY, FAC_UPKEEP_BASE, LEVEL_MULT, MAX_LEVEL, canUpgrade, upgradeFacility } from '../../../engine/infrastructure';
import { demolishGrounds, renovateGrounds, startGroundsBuild } from '../../../game/groundsGame';
import { makeMessage, pushMessage } from '../../../engine/messages';
import { KV, Meter } from '../../../ui/DashPage';
import { vColor } from '../../../ui/format';
import Icon from '../../../components/Icon';
import { InfoTip } from '../../../ui/InfoTip';

const pct = (v: number) => `${v > 0 ? '+' : ''}${(v * 100).toFixed(1).replace('.', ',').replace(',0', '')} %`;
const num = (v: number) => Math.round(v).toLocaleString('de-DE');

/** Geld kompakt; Kleinbeträge (Parkgebühr) mit Cent. */
export function money(v: number, year: number): string {
  if (Math.abs(v) >= 100) return formatMoney(v, year, true);
  const eur = currencyForYear(year) === 'EUR';
  return `${(eur ? v / DM_PER_EUR : v).toFixed(2).replace('.', ',')} ${eur ? '€' : 'DM'}`;
}

/** Wirkungen einer Stufe als kurze Zeilen (Geld nominal im aktuellen Jahr). */
export function effectLines(key: GroundsModuleKey, d: GroundsLevelDef, club: Club, year: number): string[] {
  const md = mdScale(year);
  const m = GROUNDS_BY_KEY[key];
  const out: string[] = [];
  if (d.spaces) out.push(`${num(d.spaces)} Stellplätze, Parkgebühr ${money(1.5 * md, year)} je Pkw`);
  if (d.transitCap) out.push(`Anreise +${num(d.transitCap)} Personen je Spiel`);
  if (d.vipMult) out.push(`Business-Seats und Logen im Stadion: +${Math.round(d.vipMult * 100)} % Nachfrage, +${Math.round(d.vipMult * 50)} % Preisbereitschaft`);
  if (d.lux) out.push(`${num(d.lux)} Lux`);
  if (d.att) out.push(`Auslastung ${pct(d.att)}`);
  if (d.mood) out.push(`Fan-Stimmung ${d.mood > 0 ? '+' : ''}${d.mood.toString().replace('.', ',')}`);
  if (d.risk) out.push(`Ausschreitungen −${Math.round(d.risk * 100)} %`);
  if (d.perHead) out.push(`${d.perHead > 0 ? 'Erlös' : 'Kosten'} ${money(Math.abs(d.perHead) * md * 10000, year)} je 10.000 Zuschauer`);
  if (d.perMatch) out.push(`${d.perMatch > 0 ? 'Erlös' : 'Kosten'} ${money(Math.abs(d.perMatch) * md, year)} je Heimspiel`);
  if (d.monthly) {
    const v = m.commercial ? d.monthly * revenueScale('commercial', year) * commercialMultiplier(club, year) * merchSlump(year) : d.monthly * md;
    out.push(`Erlös ~${money(v, year)} / Monat`);
  }
  if (d.brand) {
    const b = [d.brand.regional && 'regional', d.brand.national && 'national', d.brand.international && 'international'].filter(Boolean);
    out.push(`Marke wächst (${b.join(', ')})`);
  }
  return out;
}

interface Props { g: Game; club: Club; gr: ClubGrounds; year: number; onChange: () => void; onClose: () => void }

function Pips({ n, of }: { n: number; of: number }) {
  return <div className="gr-pips">{Array.from({ length: of }).map((_, i) => <i key={i} className={i < n ? 'on' : ''} />)}<span>Stufe {n} / {of}</span></div>;
}

export function ModuleDetail({ g, club, gr, year, onChange, onClose, k }: Props & { k: GroundsModuleKey }) {
  const [note, setNote] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const m = GROUNDS_BY_KEY[k];
  const st = gr.modules[k];
  const lv = levelOf(gr, k);
  const cur = lv ? m.levels[lv - 1] : null;
  const chk = checkNext(club, gr, k, year);
  const next = m.levels[lv];
  const proj = gr.projects.find((p) => p.module === k);
  const rc = renovateCost(gr, k, year);
  const cat = GROUNDS_CATEGORIES.find((c) => c.key === m.category)!;
  const act = (r: { ok: boolean; text: string }) => { setNote(r.text); setConfirm(false); if (r.ok) onChange(); };
  const negotiate = m.negotiated && lv >= 1;
  const upkeep = cur ? cur.upkeep * mdScale(year) * (k === 'fanProject' && year >= 1993 ? 0.4 : 1) : 0;
  return (
    <div className="gd">
      <div className="gd-head">
        <span className="gd-cat"><Icon name={cat.icon} size={18} />{cat.name}</span>
        <button className="gd-back" onClick={onClose}>Übersicht</button>
      </div>
      <div className="dnote">{m.desc}</div>
      <Pips n={lv} of={m.levels.length} />
      {cur ? <>
        <KV k="Ausbau" v={cur.name} strong />
        {effectLines(k, cur, club, year).map((t) => <div key={t} className="gd-eff">{t}</div>)}
        <Meter label="Zustand" value={st!.condition} color={vColor(st!.condition)} text={`${Math.round(st!.condition)} %`} />
        <KV k="Gebaut / modernisiert" v={`${st!.builtYear}${isOutdated(st, m, year) ? ' · veraltet' : ''}`} color={isOutdated(st, m, year) ? 'var(--orange)' : undefined} />
        <KV k="Wirkung aktuell" v={`${Math.round(condMult(st, m, year) * 100)} %`} />
        {upkeep > 0 && <KV k="Unterhalt" v={`${money(upkeep, year)} / Monat`} />}
      </> : <KV k="Status" v="noch nicht vorhanden" />}
      {proj && <div className="gd-proj"><Icon name="facilities" size={16} />{proj.phase === 'permit' ? 'Im Genehmigungsverfahren' : 'Im Bau'} bis {proj.phaseEnd.split('-').reverse().join('.')}: {m.levels[proj.targetLevel - 1].name}</div>}
      {k === 'transit' && gr.talk && <div className="gd-proj"><Icon name="transit" size={16} />Verhandlung über „{m.levels[gr.talk.targetLevel - 1].name}“ bis {gr.talk.decideDate.split('-').reverse().join('.')}</div>}
      {next && !proj && !(k === 'transit' && gr.talk) && (
        <div className="gd-next">
          <div className="gd-next-h">Nächste Stufe: {next.name}</div>
          {effectLines(k, next, club, year).map((t) => <div key={t} className="gd-eff acc">{t}</div>)}
          <KV k={negotiate ? 'Vereinsanteil' : 'Kosten'} v={chk.cost ? money(chk.cost, year) : 'keine'} />
          {next.upkeep > 0 && <KV k="Unterhalt danach" v={`${money(next.upkeep * mdScale(year), year)} / Monat`} />}
          {chk.areaNeed > 0 && <KV k="Fläche" v={`+${chk.areaNeed} Parzelle(n)`} />}
          <KV k="Dauer" v={negotiate ? 'Verhandlung 6–10 Wochen' : `${next.permit ? `Genehmigung ~${Math.round(permitMonths(year))} Mon. + ` : ''}Bau ~${Math.max(1, Math.round(next.days / 30))} Mon.`} />
          {next.permit && !negotiate && <div className="dnote">Anwohner können protestieren: Verzögerung, Auflagen (+12 %) oder Ablehnung (90 % zurück).<InfoTip k="anwohner" /></div>}
          <button className="btn btn-primary mt8" disabled={!chk.ok} onClick={() => act(startGroundsBuild(g, k))}>
            {negotiate ? 'Mit der Stadt verhandeln' : lv ? 'Ausbauen' : 'Bauen'}
          </button>
          {!chk.ok && <div className="dnote" style={{ color: 'var(--red)' }}>{chk.reason}</div>}
        </div>
      )}
      {!next && <div className="dnote mt8" style={{ color: 'var(--green)' }}>Höchste Ausbaustufe erreicht.</div>}
      <div className="gd-actions">
        {rc > 0 && <button className="btn btn-sm" disabled={club.finances.balance < rc} onClick={() => act(renovateGrounds(g, k))}>Sanieren · {money(rc, year)}</button>}
        {lv > 0 && !proj && m.levels[lv - 1].cost > 0 && (confirm
          ? <button className="btn btn-sm btn-danger" onClick={() => act(demolishGrounds(g, k))}>Wirklich abreißen?</button>
          : <button className="btn btn-sm" onClick={() => setConfirm(true)}>Abreißen</button>)}
      </div>
      {note && <div className="dnote mt8" style={{ color: 'var(--accent)', fontWeight: 700 }}>{note}</div>}
      {m.source && <div className="gd-src">Quelle: {m.source}</div>}
    </div>
  );
}

const FUTURE: FacilityKey[] = ['rehaCenter', 'nlz', 'performanceCenter', 'dataCenter'];

export function FacilityDetail({ g, club, gr, year, onChange, onClose, k, onGoto }: Props & { k: FacilityKey; onGoto?: (s: 'stadium' | 'marketing' | 'akademie') => void }) {
  const [note, setNote] = useState<string | null>(null);
  const def = FACILITY_BY_KEY[k];
  const level = (club.infrastructure[k] as number) ?? 1;
  const plot = FUTURE.includes(k) && level < 2;
  const check = canUpgrade(club, k, economyScaleOf(year));
  const areaArr = INFRA_AREA[k];
  const areaNeed = areaArr ? Math.max(0, (areaArr[level + 1] ?? 0) - (areaArr[level] ?? 0)) : 0;
  const areaBlocked = k !== 'youthAcademy' && areaNeed > 0 && areaUsed(club, gr) + areaNeed > gr.area;
  const mode = club.commerce?.cateringMode ?? 'verpachtung';
  const upkeep = k === 'catering' ? CATERING_UPKEEP[mode][Math.max(1, level)] * economyScaleOf(year)
    : FAC_UPKEEP_BASE[k] && !(plot) ? FAC_UPKEEP_BASE[k]! * LEVEL_MULT[Math.max(1, level)] * economyScaleOf(year) : 0;
  const obsolete = def.obsoleteYear != null && year >= def.obsoleteYear;
  // Jugendakademie und NLZ werden über Jugend › Akademie gesteuert (game/youthInvest.ts);
  // hier spiegeln sie nur deren Stand (syncLegacyAcademy).
  const viaAcademy = k === 'youthAcademy' || k === 'nlz';
  const doUpgrade = () => {
    const res = upgradeFacility(club, k, g.calendar.currentDate, true);
    if (res.ok) {
      pushMessage(g.messages, makeMessage({
        date: g.calendar.currentDate, category: 'board', from: 'Vereinsvorstand',
        subject: `Ausbau abgeschlossen: ${def.name} (Stufe ${res.newLevel})`,
        shortText: `${def.name} wurde auf Stufe ${res.newLevel} ausgebaut.`,
        bodyText: `Der Ausbau der Einrichtung „${def.name}" auf Stufe ${res.newLevel} ist abgeschlossen.\n\nKosten: ${money(res.cost, year)}\nNeuer Effekt: ${def.effectAt(res.newLevel)}\nNeuer Kontostand: ${money(club.finances.balance, year)}`,
      }));
      setNote(`${def.name} auf Stufe ${res.newLevel} ausgebaut (${money(res.cost, year)}).`);
      onChange();
    } else setNote(res.reason ?? 'Ausbau nicht möglich.');
  };
  return (
    <div className="gd">
      <div className="gd-head">
        <span className="gd-cat"><Icon name={k === 'catering' ? 'catering' : k === 'merchandising' ? 'marketing' : 'training'} size={18} />{k === 'catering' || k === 'merchandising' ? 'Gastronomie & Handel' : 'Sport & Betrieb'}</span>
        <button className="gd-back" onClick={onClose}>Übersicht</button>
      </div>
      <div className="dnote">{def.desc}</div>
      {plot ? <KV k="Status" v="Bauplatz – noch nicht gebaut" /> : <>
        <Pips n={level} of={MAX_LEVEL} />
        <div className="gd-eff">{def.effectAt(level)}</div>
      </>}
      <KV k="Fixkosten" v={upkeep > 0 ? `${money(upkeep, year)} / Monat` : k === 'stadium' ? 'im Stadionunterhalt' : viaAcademy ? 'über die Akademie' : 'keine'} />
      {viaAcademy && <>
        <div className="dnote mt8">Ausbau, Jugendtrainer, Internat und Etat steuerst du auf der Akademie-Seite. Die Stufe hier zeigt den Stand der Nachwuchsarbeit.</div>
        <button className="btn btn-primary mt8" onClick={() => onGoto?.('akademie')}>Zur Akademie</button>
      </>}
      {level < MAX_LEVEL && k !== 'stadium' && !obsolete && !viaAcademy && (
        <div className="gd-next">
          <div className="gd-next-h">{plot ? 'Nach dem Bau' : `Stufe ${level + 1}`}</div>
          <div className="gd-eff acc">{def.effectAt(level + 1)}</div>
          <KV k="Kosten" v={money(check.cost, year)} />
          {areaNeed > 0 && <KV k="Fläche" v={`+${areaNeed} Parzelle(n)`} />}
          <button className="btn btn-primary mt8" disabled={!check.ok || areaBlocked} onClick={doUpgrade}>{plot ? 'Bauen' : 'Ausbauen'}</button>
          {(!check.ok || areaBlocked) && <div className="dnote" style={{ color: 'var(--red)' }}>{areaBlocked ? 'Keine Fläche frei – Grundstück kaufen oder etwas abreißen' : check.reason}</div>}
        </div>
      )}
      {k === 'stadium' && <button className="btn btn-primary mt8" onClick={() => onGoto?.('stadium')}>Zum Stadion</button>}
      {obsolete && <div className="dnote mt8">Diese Einrichtung ist veraltet und wird nicht mehr ausgebaut.</div>}
      {level >= MAX_LEVEL && <div className="dnote mt8" style={{ color: 'var(--green)' }}>Höchste Ausbaustufe erreicht.</div>}
      {k === 'catering' && <div className="dnote mt8">Die Betriebsform (Eigenbetrieb, Umsatzbeteiligung, Pacht) stellst du unter „Marketing“ ein. <button className="btn btn-sm" onClick={() => onGoto?.('marketing')}>Zum Marketing</button></div>}
      {note && <div className="dnote mt8" style={{ color: 'var(--accent)', fontWeight: 700 }}>{note}</div>}
    </div>
  );
}

