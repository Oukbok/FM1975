// Reiter „Verein“: Stadion · Finanzen (Außensicht) · Trikots | Gelände · Marke & Ansehen · Nachwuchs
import { getClubKitDisplay } from '../../data/kits';
import { Club } from '../../types';
import { FACILITIES, MAX_LEVEL, facilityAvailable } from '../../engine/infrastructure';
import { DashBox, Empty, KV, Kpi, Meter } from '../../ui/DashPage';
import { fmtDM, fmtPrice, fmtWage, vColor, wageUnit } from '../../ui/format';
import { ScoutStars, scoutMid } from '../../views/shared';
import JerseySVG, { type JerseyPattern } from '../JerseySVG';
import { ClubTabProps } from './shared';
import PosBadge from '../PosBadge';

const CLASS_DE = ['', 'Spitzengruppe', 'oberes Mittelfeld', 'unteres Mittelfeld', 'Schlussgruppe'];
const fmtNum = (n: number) => n.toLocaleString('de-DE');

export default function ClubTab({ g, d, openPlayer }: ClubTabProps) {
  const c = d.fullClub;
  if (!c) {
    const year = Number(g.calendar.currentDate.slice(0, 4));
    const sq = d.squad;
    const value = sq.reduce((a, p) => a + p.contract.transferValue, 0);
    const age = sq.length ? sq.reduce((a, p) => a + p.age, 0) / sq.length : 0;
    const homeNat = sq.length ? [...sq.reduce((m, p) => m.set(p.nationality, (m.get(p.nationality) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1])[0][0] : '';
    const legion = sq.filter((p) => p.nationality !== homeNat).length;
    const talents = [...sq].filter((p) => p.age <= 21).sort((a, b) => scoutMid(b) - scoutMid(a)).slice(0, 6);
    return (
      <>
        <DashBox title="Kader & Markt" icon="dashVerein">
          {sq.length ? <>
            <KV k="Spieler im Kader" v={sq.length} />
            <KV k="Kaderwert (geschätzt)" v={fmtPrice(value)} strong />
            <KV k="Ø Alter" v={age.toFixed(1).replace('.', ',')} />
            <KV k="Ausländer im Kader" v={legion} />
            <KV k="Ø Stärke" v={d.strength} color={vColor(d.strength)} />
            <div className="dnote mt8">{d.foreign ? `Auslandsverein (${d.foreign.country}): ` : ''}Stadion und Finanzen werden nicht im Detail geführt; Kader, Ergebnisse und Tabellen laufen in der Simulation mit ({year}).</div>
          </> : <Empty icon="dashVerein">Für {d.name} liegt noch kein Kader vor.</Empty>}
        </DashBox>
        <DashBox title="Talente (bis 21)" icon="youth">
          {talents.length ? talents.map((p) => (
            <div key={p.id} className="pp-line clickable" data-pid={p.id} onClick={() => openPlayer(p.id)}>
              <span className="pp-line-lbl">{p.fullName} <PosBadge p={p} compact /></span><span>{p.age} J. · <ScoutStars p={p} /></span>
            </div>
          )) : <Empty icon="youth">Keine jungen Spieler im Kader.</Empty>}
        </DashBox>
        <DashBox title="Trikots" icon="dashVerein" rows={2}>
          <Kits club={d.crestClub} />
        </DashBox>
      </>
    );
  }
  const year = Number(g.calendar.currentDate.slice(0, 4));
  const st = c.stadium;
  const f = d.finance;
  const facilities = FACILITIES.filter((x) => x.key !== 'stadium' && facilityAvailable(x, year));
  const youth = (c.youthPlayerIds ?? []).map((id) => g.youthPlayers[id] ?? g.players[id]).filter(Boolean).sort((a, b) => scoutMid(b) - scoutMid(a));
  const brand = c.brand;

  return (
    <>
      <DashBox title="Stadion" icon="stadium">
        <div className="cmx-stadium-name">{st.name}</div>
        <div className="dkpis">
          <Kpi value={fmtNum(st.capacity)} label="Plätze" />
          <Kpi value={`${Math.round((st.averageAttendanceRate || 0) * 100)} %`} label="Auslastung" />
        </div>
        {st.vipBoxes ? <KV k="Logen" v={st.vipBoxes} /> : null}
        <Meter label="Zustand" value={st.condition} color={vColor(st.condition)} />
        {c.stadiumProject && <div className="dnote mt8">Das Stadion wird gerade ausgebaut.</div>}
      </DashBox>

      <DashBox title="Finanzen" icon="finances" right="Außensicht">
        {f ? <>
          <KV k="Umsatzklasse" v={CLASS_DE[f.revenueClass]} strong />
          <KV k="Umsatz Vorsaison (ca.)" v={fmtDM(f.revenue)} />
          <KV k="Transferbudget (geschätzt)" v={`${fmtPrice(f.budget[0])} – ${fmtPrice(f.budget[1])}`} />
          <KV k="Kaderwert" v={fmtPrice(f.squadValue)} />
          <KV k={`Gehälter / ${wageUnit()} (ca.)`} v={fmtWage(f.wages, { unit: false })} />
          <div className="dnote mt8">Zahlen aus Presse und Scoutberichten – Kontostand und Schulden sind nicht öffentlich.</div>
        </> : <Empty icon="finances">Keine Angaben.</Empty>}
      </DashBox>

      <DashBox title="Trikots" icon="dashVerein">
        <Kits club={c} />
      </DashBox>

      <DashBox title="Gelände & Einrichtungen" icon="facilities">
        {facilities.map((x) => {
          const lvl = (c.infrastructure as unknown as Record<string, number | undefined>)[x.key] ?? 0;
          return <Meter key={x.key} label={x.name} value={lvl} max={MAX_LEVEL} text={lvl ? `Stufe ${lvl}` : '–'} />;
        })}
      </DashBox>

      <DashBox title="Marke & Ansehen" icon="fans">
        <Meter label="Ansehen" value={c.reputation} color={vColor(c.reputation)} />
        {brand ? <>
          <Meter label="Bekanntheit regional" value={brand.regional} />
          <Meter label="Bekanntheit national" value={brand.national} />
          <Meter label="Bekanntheit international" value={brand.international} />
        </> : <div className="dnote mt8">Zur Bekanntheit liegen noch keine Erhebungen vor.</div>}
        {c.commerce?.shirtSponsor && <KV k="Trikotsponsor" v={c.commerce.shirtSponsor.name} />}
      </DashBox>

      <DashBox title="Nachwuchs" icon="youth" right={youth.length ? `${youth.length} Talente` : undefined}>
        <KV k="Jugendakademie" v={`Stufe ${c.infrastructure.youthAcademy} von ${MAX_LEVEL}`} />
        {youth.length ? <>
          <div className="dsec">Größte Talente</div>
          {youth.slice(0, 5).map((p) => (
            <div key={p.id} data-pid={p.id} className="dlist-row clickable" onClick={() => openPlayer(p.id)}>
              <PosBadge p={p} compact />
              <span className="grow">{p.fullName}<span className="muted"> · {p.age} J.</span></span>
              <ScoutStars p={p} />
            </div>
          ))}
        </> : <div className="dnote mt8">Über die Jugendspieler ist nichts bekannt.</div>}
      </DashBox>
    </>
  );
}

function Kits({ club }: { club: Club }) {
  return (
    <div className="cmx-kits">
      {([['Heim', getClubKitDisplay(club, 'home')], ['Auswärts', getClubKitDisplay(club, 'away')]] as const).map(([lbl, k]) => (
        <div key={lbl} className="cmx-kit">
          {k.image ? <JerseySVG image={k.image} size={104} />
            : <JerseySVG primary={k.primary} secondary={k.secondary} pattern={k.pattern as JerseyPattern} size={104} />}
          <span className="cmx-kit-lbl">{lbl}</span>
        </div>
      ))}
    </div>
  );
}
