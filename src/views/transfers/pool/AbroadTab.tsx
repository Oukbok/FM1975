// =============================================================================
// TRANSFERS › SCOUTING › SCOUTS IM AUSLAND (Wunsch Pascal): Scouting-Mitarbeiter
// für Wochen in ein Land schicken – Länderwissen + Funde (game/scoutAbroad.ts).
// =============================================================================
import { useMemo, useState } from 'react';
import { PlayerLink } from '../../../components/playerMenu/PlayerLink';
import { LandFlag } from '../../../components/competition/CountryFlag';
import { REGION_LABEL, regionOfCountry } from '../../../data/scoutingProducts';
import { CalendarEngine } from '../../../engine/calendar';
import {
  ABROAD_WEEKS, abroadCountries, abroadProgress, abroadTerms, areaKnowledge, cancelAbroad, scoutStaff, startAbroad,
} from '../../../game/scoutAbroad';
import { busySlots, scoutSlots } from '../../../game/scoutingGame';
import { poolRows } from '../../../game/playerPool';
import { homeCountryKey, type Game } from '../../../game/state';
import { countryName } from '../../../game/worldPool';
import { DashBox, DashPage, Empty, KV } from '../../../ui/DashPage';
import Seg from '../../../ui/Seg';
import Select from '../../../ui/Select';
import { fmtPrice } from '../../../ui/format';

const pct = (x: number) => `${Math.round(x * 100)} %`;

export function AbroadTab({ g, onChange }: { g: Game; onChange: () => void }) {
  const [, setTick] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const countries = abroadCountries(g);
  const homeKey = homeCountryKey(g);
  const staff = scoutStaff(g);
  const [land, setLand] = useState(countries.includes('England') ? 'England' : countries[0] ?? '');
  const [weeks, setWeeks] = useState<number>(8);
  const [who, setWho] = useState<string>(staff.find((m) => !m.busy)?.id ?? '');
  const s = g.scouting;
  const jobs = s?.abroad ?? [];
  const log = s?.abroadLog ?? [];
  const { rows } = poolRows(g);
  const byId = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);
  const t = land ? abroadTerms(g, land, weeks, who || undefined) : null;
  const refresh = (err: string | null, ok: string) => { setMsg(err ?? ok); setTick((x) => x + 1); onChange(); };
  const free = staff.filter((m) => !m.busy);
  const slotsFull = busySlots(g) >= scoutSlots(g);
  const known = countries.map((c) => ({ c, k: areaKnowledge(g, c), last: log.find((l) => l.country === c) })).filter((x) => x.k > 0.005 || x.last)
    .sort((a, b) => b.k - a.k);

  // Länderauswahl nach Region gruppiert
  const groups = ['west', 'sued', 'nord', 'ost'] as const;
  const options = groups.flatMap((r) => countries.filter((c) => regionOfCountry(c, homeKey) === r)
    .map((c, i) => ({ value: c, label: countryName(c), group: i === 0 ? REGION_LABEL[r] : undefined })));

  return (
    <DashPage className="scx-page">
      <DashBox title="Scouts im Ausland" info="scoutAusland" span={2} right={`${jobs.length} unterwegs · Plätze ${busySlots(g)} / ${scoutSlots(g)}`}>
        {jobs.length ? jobs.map((j) => (
          <div key={j.country} className="dlist-row pool-jobrow">
            <LandFlag country={j.country} />
            <span className="grow"><b>{countryName(j.country)}</b><span className="muted"> · {j.staffName} · {Math.round(j.days / 7)} Wochen · {fmtPrice(j.cost)}</span></span>
            <span className="pool-jobmeter"><span className="dmeter-track"><span className="dmeter-fill" style={{ width: `${Math.round(abroadProgress(g, j) * 100)}%`, background: 'var(--bar-fill-hi)' }} /></span>
              <span className="muted">zurück {CalendarEngine.formatDate(CalendarEngine.addDays(j.start, j.days))}</span></span>
            <button className="b3 b3-s" title="Reisegeld wird nicht erstattet; das bisher Gesehene bleibt." onClick={() => { cancelAbroad(g, j.country); refresh(null, `Reise nach ${countryName(j.country)} abgebrochen.`); }}>Zurückholen</button>
          </div>
        )) : <Empty icon="international">Kein Scout im Ausland. Rechts wählst du Land, Dauer und Mitarbeiter – nach der Rückkehr kennt dein Stab die Spieler dort deutlich besser und hat Berichte über die größten Talente.</Empty>}
        {log.length > 0 && <div className="dsec mt8">Zurückgekehrt</div>}
        {log.slice(0, 6).map((l) => (
          <div key={`${l.country}-${l.end}`} className="dlist-row scx-row">
            <LandFlag country={l.country} />
            <span className="grow"><b>{countryName(l.country)}</b><span className="muted"> · {l.staffName} · {CalendarEngine.formatDate(l.end)} · </span>
              {l.finds.slice(0, 5).map((id, i) => { const r = byId.get(id); return r ? <span key={id}>{i ? ', ' : ''}<PlayerLink id={id}>{r.name}</PlayerLink></span> : null; })}
            </span>
          </div>
        ))}
      </DashBox>

      <DashBox title="Neue Reise" rows={2}>
        <div className="scx-form">
          <label className="scx-lab">Land</label>
          <Select value={land} onChange={setLand} options={options} width="100%" />
          <label className="scx-lab">Dauer</label>
          <Seg<number> value={weeks} onChange={(v) => setWeeks(Number(v))} fill options={ABROAD_WEEKS.map((w) => ({ v: w as number, label: `${w} Wochen` }))} />
          <label className="scx-lab">Mitarbeiter</label>
          <Select value={who} onChange={setWho} width="100%" placeholder="Mitarbeiter wählen"
            options={staff.map((m) => ({ value: m.id, label: `${m.name}${m.busy ? ' (unterwegs)' : ''}`, disabled: m.busy }))} />
        </div>
        {t && (
          <div className="mt8">
            <KV k="Zurück am" v={CalendarEngine.formatDate(CalendarEngine.addDays(g.calendar.currentDate, t.days))} />
            <KV k="Reisekosten" v={fmtPrice(t.cost)} />
            <KV k="Länderwissen danach" v={pct(t.k)} info="scoutAusland" />
            <KV k="Heute" v={pct(areaKnowledge(g, land))} />
          </div>
        )}
        <button className="b3 b3-primary scx-go" disabled={!who || !free.some((m) => m.id === who) || slotsFull || jobs.some((j) => j.country === land)}
          onClick={() => refresh(startAbroad(g, land, weeks, who), `${staff.find((m) => m.id === who)?.name} reist nach ${countryName(land)}.`)}>Reise starten</button>
        <div className="scx-msg dnote" role="status">{msg ?? (slotsFull ? 'Alle Scouting-Plätze sind belegt. Mehr Scouting-Mitarbeiter = mehr Plätze.' : staff.length < 2 ? 'Ohne angestellten Scout reist der nebenberufliche Vereinsscout – angestellte Scouts (Verein › Mitarbeiter) sehen mehr.' : '')}</div>
        <div className="dnote mt8">Länger und mit besseren Scouts wird das Wissen größer. Ostblock-Länder sind vor 1990 teurer, ein internationaler Scout reist günstiger. Das Wissen verblasst um 15 Punkte im Jahr.</div>
      </DashBox>

      <DashBox title="Länderwissen" span={2} flush right={known.length ? `${known.length} Länder` : undefined}>
        {known.length ? (
          <table className="dtable">
            <thead><tr><th>Land</th><th>Region</th><th className="w-l">Länderwissen</th><th className="num">Letzte Reise</th><th className="num">Funde</th></tr></thead>
            <tbody>
              {known.map(({ c, k, last }) => (
                <tr key={c}>
                  <td className="nowrap"><span className="scx-land"><LandFlag country={c} /> {countryName(c)}</span></td>
                  <td>{REGION_LABEL[regionOfCountry(c, homeKey)]}</td>
                  <td><span className="scx-bar"><span className="dmeter-track"><span className="dmeter-fill" style={{ width: `${Math.round(Math.min(1, k / 0.45) * 100)}%`, background: 'var(--bar-fill-hi)' }} /></span><span className="scx-bar-n">{pct(k)}</span></span></td>
                  <td className="num muted">{last ? CalendarEngine.formatDate(last.end) : 'unterwegs'}</td>
                  <td className="num">{last?.finds.length ?? '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <Empty icon="international">Noch kein Länderwissen aus Reisen.</Empty>}
      </DashBox>
    </DashPage>
  );
}
