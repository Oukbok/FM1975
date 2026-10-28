import { useState } from 'react';
import { economyScale, revenueScale, yearOf } from '../../engine/economy';
import { CATERING_NETPERHEAD, cateringMatchIncome, expectedAttendance, expectedAttendanceRate, matchdayIncome } from '../../engine/finances';
import { vipIncome } from '../../engine/clubBusiness';
import { BLOCK_NAME, migrateBlocks, roofShare, seatedCapacity, ticketFactor } from '../../engine/stadiumBlocks';
import { ensureStadiumBlocks } from '../../game/stadiumGame';
import { Game } from '../../game/state';
import { BlockId, CateringMode, StadiumBlock } from '../../types';
import { DashBox, DashPage, KV, Kpi, Meter } from '../../ui/DashPage';
import { fmtDM, fmtDMfull, vColor } from '../../ui/format';
import { avg, fmtSmallMoney, ownLeagueMatches } from '../shared';
import { BlockConfigurator } from './stadium/BlockConfigurator';
import { StadiumScene } from './stadium/StadiumScene';

// =============================================================================
// STADION — eine große Box: gezeichnetes Stadion, Blöcke anklickbar.
// Panel rechts: Übersicht (Ticketpreis, Erlöse, Catering, Namensrechte,
// laufender Umbau, Heimspiele) bzw. Block-Konfigurator.
// =============================================================================
const CATERING_MODE_LABEL: Record<CateringMode, string> = { eigenbetrieb: 'Eigenbetrieb', umsatz: 'Umsatzbeteiligung', verpachtung: 'Verpachtung' };
const lum = (hex: string) => { const n = parseInt((hex || '#888888').slice(1), 16); return (0.3 * ((n >> 16) & 255) + 0.59 * ((n >> 8) & 255) + 0.11 * (n & 255)) / 255; };
const fmtD = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;

export function StadiumView({ g, onChange }: { g: Game; onChange: () => void }) {
  useState(() => ensureStadiumBlocks(g)); // ältere Spielstände: Blöcke sofort anlegen
  const club = g.clubs[g.managedClubId];
  const st = club.stadium;
  const today = g.calendar.currentDate;
  const year = yearOf(today);
  const month = Number(today.slice(5, 7));
  const [sel, setSel] = useState<BlockId | null>(null);
  const [hover, setHover] = useState<BlockId | null>(null);
  const [draft, setDraft] = useState<StadiumBlock | null>(null);
  const blocks = st.blocks?.length ? st.blocks : migrateBlocks(club, year); // altes Projekt läuft: nur Vorschau
  const editable = !!st.blocks?.length;
  const shown = draft ? blocks.map((b) => (b.id === draft.id ? draft : b)) : blocks;
  const select = (id: BlockId | null) => {
    setSel(id);
    const b = id ? blocks.find((x) => x.id === id) : null;
    setDraft(b && editable ? JSON.parse(JSON.stringify(b)) : null);
  };

  const scale = economyScale(year);
  const mdScale = revenueScale('matchday', year);
  const setTicket = (delta: number) => { st.ticketPrice = Math.max(4, Math.min(60, st.ticketPrice + delta)); onChange(); };
  const cateringMode: CateringMode = club.commerce?.cateringMode ?? 'verpachtung';
  const cateringLevel = Math.max(1, Math.min(5, Math.round(club.infrastructure?.catering ?? 1)));
  const expRate = expectedAttendanceRate(club);
  const expVisitors = expectedAttendance(club);
  const ticketRev = Math.round(expVisitors * st.ticketPrice * ticketFactor(club) * mdScale);
  const cateringRev = cateringMatchIncome(club, expVisitors, mdScale);
  const programmeRev = matchdayIncome(expVisitors, mdScale);
  const vipRev = vipIncome(club, mdScale, year);
  const home = ownLeagueMatches(g, 'finished').filter((m) => m.homeClubId === club.id && m.result);
  const avgAtt = home.length ? Math.round(avg(home.map((m) => m.result!.attendance))) : 0;
  const cap = st.capacity;
  const seated = seatedCapacity(blocks);
  const total = blocks.reduce((s, b) => s + b.tiers.length, 0) ? cap : 1;
  const primary = lum(club.colors?.primary ?? '') < 0.18 ? (club.colors?.secondary ?? '#c0392b') : (club.colors?.primary ?? '#c0392b');
  const secondary = club.colors?.secondary ?? '#ffffff';
  const bp = st.blockProject, old = club.stadiumProject;
  const nr = club.namingRights;

  return (
    <DashPage>
      <DashBox title={st.name} icon="stadium" span={3} rows={2} flush
        right={`${cap.toLocaleString('de-DE')} Plätze · Kontostand ${fmtDM(club.finances.balance)}`}>
        <div className="gr-wrap st-wrap">
          <StadiumScene blocks={shown} colors={{ primary, secondary }} year={year} month={month}
            selected={sel} hover={hover} building={bp?.blockId ?? null} onSelect={select} onHover={setHover} />
          {!sel && <div className="gr-hint">Klicke auf einen Block, um Ränge, Sitze, Dach, VIP-Bereich und Logen zu planen.</div>}
          {sel && draft && editable && (
            <BlockConfigurator key={sel} g={g} draft={draft} setDraft={setDraft} onClose={() => select(null)}
              onDone={() => { onChange(); }} />
          )}
          {sel && !editable && (
            <div className="gr-panel st-panel">
              <div className="gr-panel-head"><b>{BLOCK_NAME[sel]}</b><button className="modal-close" onClick={() => select(null)}>×</button></div>
              <div className="dnote">Der laufende Stadionausbau muss erst fertig werden. Danach kannst du jeden Block einzeln umbauen.</div>
            </div>
          )}
          {!sel && (
            <div className="gr-panel st-panel">
              <div className="dkpis">
                <Kpi value={cap.toLocaleString('de-DE')} label="Plätze" />
                <Kpi value={`${Math.round((seated / total) * 100)} %`} label="Sitzplätze" />
                <Kpi value={`${Math.round(roofShare(blocks) * 100)} %`} label="überdacht" />
              </div>
              <Meter label="Zustand" value={st.condition} text={`${st.condition} %`} color={vColor(st.condition)} />

              <div className="st-sec">Ticketpreis</div>
              <div className="dbtnrow" style={{ justifyContent: 'center', alignItems: 'center', gap: 14 }}>
                <button className="dchip" onClick={() => setTicket(-1)}>− 1</button>
                <span style={{ fontSize: 28, fontWeight: 900, color: 'var(--accent)', minWidth: 140, textAlign: 'center' }}>{fmtDMfull(st.ticketPrice * mdScale)}</span>
                <button className="dchip" onClick={() => setTicket(1)}>+ 1</button>
              </div>
              <Meter label="Erw. Auslastung" value={expRate * 100} text={`${Math.round(expRate * 100)} %`} />
              <KV k="Erwartete Zuschauer" v={expVisitors.toLocaleString('de-DE')} strong />
              <div className="dnote">Grundpreis für einen Stehplatz-Mix; Sitzplätze, Komfort- und Business-Seats bringen mehr pro Kopf.</div>

              <div className="st-sec">Erlöse pro Heimspiel (erwartet)</div>
              <KV k="Eintritt" v={fmtDM(ticketRev)} />
              <KV k="Catering" v={fmtDM(cateringRev)} />
              <KV k="Programmhefte" v={fmtDM(programmeRev)} />
              {vipRev > 0 && <KV k={`Logen & VIP (${st.vipBoxes ?? 0} Logen)`} v={fmtDM(vipRev)} />}
              <KV k="Summe" v={fmtDM(ticketRev + cateringRev + programmeRev + vipRev)} color="var(--green)" strong />

              <div className="st-sec">Bau</div>
              {bp ? <>
                <KV k="Umbau" v={BLOCK_NAME[bp.blockId]} strong />
                <KV k="Fertig zum" v={fmtD(bp.finishDate)} />
                <KV k="Gesperrt" v={`${bp.capacityLoss.toLocaleString('de-DE')} Plätze`} color="var(--red)" />
                <KV k="Kosten" v={`${fmtDM(bp.cost)} · ${bp.financing === 'loan' ? 'Kredit' : 'bar'}`} />
              </> : old ? <>
                <KV k="Ausbau" v={`Stufe ${old.targetLevel} · +${old.addCapacity.toLocaleString('de-DE')} Plätze`} strong />
                <KV k="Fertig zum" v={fmtD(old.finishDate)} />
              </> : <div className="dnote">Kein Umbau im Gange.</div>}

              <div className="st-sec">Vermarktung</div>
              <KV k="Catering" v={`${CATERING_MODE_LABEL[cateringMode]} · Stufe ${cateringLevel} · ${fmtSmallMoney(CATERING_NETPERHEAD[cateringMode][cateringLevel] * scale, year)}/Kopf`} />
              <KV k="Namensrechte" v={nr ? `${nr.sponsor} bis ${nr.untilYear}` : year >= 2000 ? 'frei (siehe Vorstand)' : 'ab 2000'} />

              <div className="st-sec">Heimspiele {home.length ? `· Ø ${avgAtt.toLocaleString('de-DE')}` : ''}</div>
              {home.length ? [...home].reverse().slice(0, 6).map((m) => (
                <Meter key={m.id} label={g.clubs[m.awayClubId]?.name ?? '—'} value={m.result!.attendance} max={cap} text={m.result!.attendance.toLocaleString('de-DE')} />
              )) : <div className="dnote">Noch kein Heimspiel in dieser Saison.</div>}
            </div>
          )}
        </div>
      </DashBox>
    </DashPage>
  );
}
