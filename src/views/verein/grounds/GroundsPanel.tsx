// =============================================================================
// VEREINSGELÄNDE — Seitenleiste: Lage & Kennzahlen (Fläche, Anreise, Sicherheit,
// Wirkung, Saisonbilanz, Vorhaben, Lizenz) und die Bauliste je Kategorie.
// =============================================================================
import { useState } from 'react';
import { Game } from '../../../game/state';
import { Club, FacilityKey } from '../../../types';
import { ClubGrounds, GroundsModuleKey } from '../../../types/grounds';
import { GROUNDS_CATEGORIES, GROUNDS_MODULES, LAND_PARCEL, LOCATIONS, licenseMin } from '../../../data/groundsCatalog';
import {
  accessInfo, areaUsed, checkNext, groundsAttendanceParts, groundsMoodParts, incidentRisk, landPrice, levelDef, levelOf, riskReduction, typicalAttendance,
} from '../../../engine/grounds';
import { FACILITIES, FACILITY_BY_KEY, facilityAvailable } from '../../../engine/infrastructure';
import { buyGroundsLand } from '../../../game/groundsGame';
import { KV, Meter } from '../../../ui/DashPage';
import { vColor } from '../../../ui/format';
import { money } from './GroundsDetail';
import Icon from '../../../components/Icon';
import type { GroundKey } from './GroundsScene';

const pctS = (v: number) => `${v > 0 ? '+' : ''}${(v * 100).toFixed(1).replace('.', ',')} %`;
const date = (d: string) => d.split('-').reverse().join('.');

interface Props { g: Game; club: Club; gr: ClubGrounds; year: number; onSelect: (k: GroundKey) => void; onChange: () => void }

export function GroundsPanel(props: Props) {
  const [tab, setTab] = useState<'lage' | 'bauen'>('lage');
  return (
    <div className="gp">
      <div className="seg-group gp-tabs">
        <button className={`seg-btn ${tab === 'lage' ? 'active' : ''}`} onClick={() => setTab('lage')}>Lage &amp; Wirkung</button>
        <button className={`seg-btn ${tab === 'bauen' ? 'active' : ''}`} onClick={() => setTab('bauen')}>Bauliste</button>
      </div>
      <div className="gp-body">{tab === 'lage' ? <Overview {...props} /> : <BuildList {...props} />}</div>
    </div>
  );
}

function Overview({ g, club, gr, year, onChange, onSelect }: Props) {
  const [note, setNote] = useState<string | null>(null);
  const loc = LOCATIONS[gr.location];
  const used = areaUsed(club, gr);
  const lp = landPrice(gr, year);
  const typ = typicalAttendance(club);
  const accTyp = accessInfo(club, gr, year, typ);
  const accFull = accessInfo(club, gr, year, club.stadium.capacity);
  const mood = g.environment?.fanMood ?? 55;
  const risk = incidentRisk(gr, year, false, mood);
  const riskD = incidentRisk(gr, year, true, mood);
  const att = groundsAttendanceParts(club, gr, year);
  const moodParts = groundsMoodParts(gr, year, g.calendar.currentDate);
  const tier = g.leagues?.playerDivision?.tier ?? 1;
  const s = gr.stats;
  const lic = (['floodlight', 'press'] as const).map((k) => ({ k, need: licenseMin(k, tier, year), have: levelOf(gr, k) }));
  return (
    <>
      <div className="gp-sec">Lage: {loc.name}</div>
      <div className="dnote">{loc.desc}</div>
      <Meter label="Fläche belegt" value={used} max={gr.area} color={used >= gr.area ? 'var(--orange)' : undefined} text={`${used} / ${gr.area}`} />
      {lp != null
        ? <button className="btn btn-sm" disabled={club.finances.balance < lp} onClick={() => { const r = buyGroundsLand(g); setNote(r.text); if (r.ok) onChange(); }}>Grundstück kaufen (+{LAND_PARCEL} Parzellen) · {money(lp, year)}</button>
        : <div className="dnote">Rund um das Stadion ist kein Grundstück mehr zu haben – Platz schaffst du nur durch Abriss.</div>}
      {note && <div className="dnote" style={{ color: 'var(--accent)', fontWeight: 700 }}>{note}</div>}

      <div className="gp-sec">Anreise</div>
      <Meter label="Normales Spiel" value={Math.min(1.5, accTyp.ratio)} max={1.5} color={accTyp.ratio >= 1 ? 'var(--green)' : 'var(--orange)'} text={`${Math.round(Math.min(accTyp.ratio, 9) * 100)} %`} />
      <Meter label="Ausverkauft" value={Math.min(1.5, accFull.ratio)} max={1.5} color={accFull.ratio >= 1 ? 'var(--green)' : 'var(--red)'} text={`${Math.round(Math.min(accFull.ratio, 9) * 100)} %`} />
      <div className="dnote">Kapazität {accFull.capacity.toLocaleString('de-DE')} Personen ({accFull.spaces.toLocaleString('de-DE')} Stellplätze, Bus &amp; Bahn {accFull.transit.toLocaleString('de-DE')}, Wildparken {accFull.street.toLocaleString('de-DE')}); {Math.round(loc.walk * 100)} % kommen zu Fuß. Unter 100 % droht Anreise-Chaos.</div>

      <div className="gp-sec">Sicherheit</div>
      <KV k="Risiko je Heimspiel" v={`${(risk * 100).toFixed(1).replace('.', ',')} % · Derby ${(riskD * 100).toFixed(1).replace('.', ',')} %`} color={riskD > 0.15 ? 'var(--orange)' : undefined} />
      <KV k="Senkung durch Maßnahmen" v={`−${Math.round(riskReduction(gr, year) * 100)} %`} />

      <div className="gp-sec">Wirkung</div>
      {att.length ? att.map((p) => <KV key={p.label} k={`Auslastung: ${p.label}`} v={pctS(p.value)} color={p.value < 0 ? 'var(--red)' : 'var(--green)'} />) : <div className="dnote">Keine Wirkung auf die Auslastung.</div>}
      {moodParts.map((p) => <KV key={p.label} k={`Stimmung: ${p.label}`} v={`${p.value > 0 ? '+' : ''}${p.value.toFixed(1).replace('.', ',')}`} color={p.value < 0 ? 'var(--red)' : 'var(--green)'} />)}

      <div className="gp-sec">Lizenzauflagen</div>
      {lic.map((l) => (
        <KV key={l.k} k={l.k === 'floodlight' ? 'Flutlicht' : 'Presse & TV'} v={l.have >= l.need ? 'erfüllt' : `fehlt: ${levelDef(l.k, l.need)?.name}`} color={l.have >= l.need ? 'var(--green)' : 'var(--red)'} />
      ))}

      {(gr.projects.length > 0 || gr.talk) && <div className="gp-sec">Laufende Vorhaben</div>}
      {gr.projects.map((p) => (
        <button key={p.id} className="gp-row" onClick={() => onSelect(p.module)}>
          <Icon name="facilities" size={16} /><span className="grow">{levelDef(p.module, p.targetLevel)?.name}</span>
          <span className="gp-st">{p.phase === 'permit' ? 'Genehmigung' : 'Bau'} bis {date(p.phaseEnd)}</span>
        </button>
      ))}
      {gr.talk && <button className="gp-row" onClick={() => onSelect('transit')}><Icon name="transit" size={16} /><span className="grow">Verhandlung ÖPNV</span><span className="gp-st">bis {date(gr.talk.decideDate)}</span></button>}

      <div className="gp-sec">Saison {s?.season ?? ''}</div>
      <KV k="Erlöse Umfeld" v={money(s?.income ?? 0, year)} color="var(--green)" />
      <KV k="Kosten Umfeld" v={money(s?.cost ?? 0, year)} />
      <KV k="davon Strafen & Polizei" v={money(s?.fines ?? 0, year)} color={(s?.fines ?? 0) > 0 ? 'var(--red)' : undefined} />
      <KV k="Ausschreitungen / Anreise-Chaos" v={`${s?.incidents ?? 0} / ${s?.chaos ?? 0}`} />
      {gr.prevStats && <div className="dnote">Vorsaison {gr.prevStats.season}: Saldo {money(gr.prevStats.income - gr.prevStats.cost, year)}</div>}
      {gr.log.slice(0, 4).map((e, i) => <div key={i} className="gp-log"><b>{date(e.date)}</b> {e.text.split('\n')[0]}</div>)}
    </>
  );
}

function BuildList({ club, gr, year, onSelect }: Props) {
  const status = (k: GroundsModuleKey): { text: string; tone?: string } => {
    const p = gr.projects.find((x) => x.module === k);
    if (p) return { text: p.phase === 'permit' ? 'Genehmigung' : 'im Bau', tone: 'var(--accent)' };
    if (k === 'transit' && gr.talk) return { text: 'Verhandlung', tone: 'var(--accent)' };
    const c = checkNext(club, gr, k, year);
    if (!c.def) return { text: 'max.', tone: 'var(--green)' };
    if (year < c.def.unlock) return { text: `ab ${c.def.unlock}`, tone: 'var(--text-3)' };
    return c.ok ? { text: 'ausbaubar', tone: 'var(--green)' } : { text: c.reason?.startsWith('Keine Fläche') ? 'kein Platz' : c.reason?.startsWith('Kontostand') ? 'zu teuer' : 'gesperrt', tone: 'var(--text-3)' };
  };
  const facRow = (k: FacilityKey) => {
    const d = FACILITY_BY_KEY[k];
    const lv = (club.infrastructure[k] as number) ?? 1;
    const avail = facilityAvailable(d, year) || lv >= 2;
    if (!avail && d.unlockYear && year < d.unlockYear - 15) return null;
    return (
      <button key={k} className="gp-row" onClick={() => avail && onSelect(k)} disabled={!avail}>
        <span className="grow">{d.name}</span>
        <span className="gp-lv">{avail ? `Stufe ${lv}` : '—'}</span>
        <span className="gp-st" style={{ color: avail ? undefined : 'var(--text-3)' }}>{avail ? '' : `ab ${d.unlockYear}`}</span>
      </button>
    );
  };
  return (
    <>
      {GROUNDS_CATEGORIES.map((cat) => (
        <div key={cat.key}>
          <div className="gp-sec"><Icon name={cat.icon} size={18} />{cat.name}</div>
          {cat.key === 'handel' && (['catering', 'merchandising'] as FacilityKey[]).map(facRow)}
          {GROUNDS_MODULES.filter((m) => m.category === cat.key && m.levels[0].unlock <= year + 15).map((m) => {
            const lv = levelOf(gr, m.key);
            const st = status(m.key);
            const cond = gr.modules[m.key]?.condition;
            return (
              <button key={m.key} className="gp-row" onClick={() => onSelect(m.key)}>
                <span className="grow">{m.name}<small>{lv ? m.levels[lv - 1].name : 'nicht vorhanden'}</small></span>
                {cond != null && cond < 60 && <span className="gp-cond" style={{ color: vColor(cond) }}>{Math.round(cond)} %</span>}
                <span className="gp-lv">{lv}/{m.levels.length}</span>
                <span className="gp-st" style={{ color: st.tone }}>{st.text}</span>
              </button>
            );
          })}
        </div>
      ))}
      <div className="gp-sec"><Icon name="training" size={18} />Sport &amp; Betrieb</div>
      {FACILITIES.filter((d) => d.key !== 'stadium' && d.key !== 'catering' && d.key !== 'merchandising').map((d) => facRow(d.key))}
    </>
  );
}
