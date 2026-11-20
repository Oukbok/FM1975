// =============================================================================
// TRANSFERS › SCOUTING › SOFTWARE & ABOS (Wunsch Pascal): Datenträger kaufen,
// in der Neuzeit abonnieren. Logik game/scoutSoftware.ts, Produkte
// data/scoutingProducts.ts.
// =============================================================================
import { useState } from 'react';
import { REGION_LABEL, SCOUT_REGIONS, type ScoutProduct, type ScoutRegion } from '../../../data/scoutingProducts';
import { yearOf } from '../../../engine/economy';
import { CalendarEngine } from '../../../engine/calendar';
import {
  activeSub, boughtEdition, buyBoost, buyProduct, cancelSub, productList, productPrice, softBoostFor, softProfile, subBoost, subscribe, subsMonthlyTag,
} from '../../../game/scoutSoftware';
import type { Game } from '../../../game/state';
import { DashBox, DashPage, Empty, KV } from '../../../ui/DashPage';
import Select from '../../../ui/Select';
import { fmtPrice } from '../../../ui/format';

const pct = (x: number) => `${Math.round(x * 100)} %`;
const levelText = (n: number) => (n <= 1 ? '1. Liga' : `1.–${n}. Liga`);

function Bar({ v, max = 0.6 }: { v: number; max?: number }) {
  return (
    <span className="scx-bar" title={`Zugewinn ${pct(v)}`}>
      <span className="dmeter-track"><span className="dmeter-fill" style={{ width: `${Math.round(Math.min(1, v / max) * 100)}%`, background: 'var(--bar-fill-hi)' }} /></span>
      <span className="scx-bar-n">{pct(v)}</span>
    </span>
  );
}

export function SoftwareTab({ g, onChange }: { g: Game; onChange: () => void }) {
  const [, setTick] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [regionOf, setRegionOf] = useState<Record<string, ScoutRegion>>({});
  const today = g.calendar.currentDate, year = yearOf(today);
  const s = g.scouting;
  const items = softProfile(g);
  const done = (err: string | null, ok: string) => { setMsg(err ?? ok); setTick((t) => t + 1); onChange(); };
  const buys = s?.buys ?? [];
  const subs = s?.subs ?? [];
  const list = productList(g);

  const regionPick = (p: ScoutProduct) => regionOf[p.id] ?? p.regions.find((r) => !boughtEdition(g, p.id, r) || yearOf(boughtEdition(g, p.id, r)!.date) < year) ?? p.regions[0];

  return (
    <DashPage className="scx-page">
      <DashBox title="Deine Datenträger & Abos" info="scoutSoftware" span={2} right={subs.some((x) => !x.end) ? `Abos ${fmtPrice(subsMonthlyTag(g))} im Monat` : undefined}>
        {buys.length || subs.length ? (
          <div className="scx-list">
            {subs.map((x) => {
              const p = list.find((l) => l.p.id === x.id)?.p;
              if (!p) return null;
              return (
                <div key={`s-${x.id}`} className="dlist-row scx-row">
                  <span className="grow"><b>{p.name}</b><span className="muted"> · {p.media} · Abo seit {CalendarEngine.formatDate(x.since)}{x.end ? ` · gekündigt zum ${CalendarEngine.formatDate(x.end)}` : ''}</span></span>
                  <Bar v={subBoost(x, today)} />
                  <span className="scx-cost">{fmtPrice(productPrice(p, year).tag)} / Monat</span>
                  {x.end
                    ? <button className="b3 b3-s" onClick={() => done(subscribe(g, x.id), `${p.name}: Kündigung zurückgenommen.`)}>Fortsetzen</button>
                    : <button className="b3 b3-s" onClick={() => { cancelSub(g, x.id); done(null, `${p.name} zum Monatsende gekündigt.`); }}>Kündigen</button>}
                </div>
              );
            })}
            {buys.map((b) => {
              const p = list.find((l) => l.p.id === b.id)?.p;
              if (!p) return null;
              const onSale = list.find((l) => l.p.id === b.id)?.onSale;
              const fresh = yearOf(b.date) === year;
              return (
                <div key={`b-${b.id}-${b.region}`} className="dlist-row scx-row">
                  <span className="grow"><b>{p.name}</b><span className="muted"> · {REGION_LABEL[b.region]} · Stand {yearOf(b.date)}{buyBoost(b, today) <= 0.005 ? ' · veraltet' : ''}</span></span>
                  <Bar v={buyBoost(b, today)} />
                  <span className="scx-cost">{fmtPrice(productPrice(p, year).tag)}</span>
                  <button className="b3 b3-s" disabled={!onSale || fresh} title={fresh ? 'Die Ausgabe dieses Jahres hast du schon.' : !onSale ? 'Nicht mehr im Handel.' : undefined}
                    onClick={() => done(buyProduct(g, b.id, b.region), `${p.name} (${REGION_LABEL[b.region]}): Ausgabe ${year} gekauft.`)}>Neuauflage</button>
                </div>
              );
            })}
          </div>
        ) : <Empty icon="trVideo">Noch keine Datenträger oder Abos. Unten findest du, was es {year} zu kaufen gibt – sie heben, was dein Stab über Spieler der abgedeckten Regionen weiß.</Empty>}
      </DashBox>

      <DashBox title="Wirkung je Region" info="scoutRegionen" rows={2}>
        <div className="scx-reg-head"><span>Region</span><span>1. Liga</span><span>Jugend</span></div>
        {SCOUT_REGIONS.map((r) => (
          <div key={r} className="scx-reg">
            <span>{REGION_LABEL[r]}</span>
            <Bar v={softBoostFor(items, r, 1, false)} />
            <Bar v={softBoostFor(items, r, 1, true)} />
          </div>
        ))}
        <div className="mt8">
          <KV k="Abos im Monat" v={subsMonthlyTag(g) > 0 ? fmtPrice(subsMonthlyTag(g)) : '–'} />
          <KV k="Gekaufte Datenträger" v={buys.length} />
        </div>
        <div className="dnote mt8">Die Balken zeigen, welchen Teil der Lücke bis „genau bekannt“ die Software schließt. Gekaufte Datenträger zeigen den Stand ihres Kaufjahres und verlieren jedes Jahr an Wert. Abos sind immer aktuell und werden mit der Laufzeit genauer. Einzelne Scouts bleiben genauer als jede Datenbank.</div>
        <div className="scx-msg dnote" role="status">{msg ?? ''}</div>
      </DashBox>

      <DashBox title={`Angebot ${year}`} span={2} flush>
        <table className="dtable scx-table">
          <thead><tr><th>Produkt</th><th>Art</th><th>Ligen</th><th className="ctr">Jugend</th><th className="num">Wirkung</th><th className="num">Preis</th><th className="w-l">Region</th><th /></tr></thead>
          <tbody>
            {list.map(({ p, onSale }) => {
              const later = year < p.from;
              const reg = regionPick(p);
              const sub = p.kind === 'sub' ? activeSub(g, p.id) : undefined;
              const have = p.kind === 'buy' ? boughtEdition(g, p.id, reg) : undefined;
              const fresh = !!have && yearOf(have.date) === year;
              return (
                <tr key={p.id} className={onSale ? '' : 'scx-dim'}>
                  <td className="scx-prod"><b>{p.name}</b><span className="scx-desc">{p.desc}</span></td>
                  <td className="nowrap">{p.media}</td>
                  <td className="nowrap">{levelText(p.maxLevel)}</td>
                  <td className="ctr">{p.youth ? pct(p.youth) : '–'}</td>
                  <td className="num">{pct(p.boost)}</td>
                  <td className="num nowrap">{later ? `ab ${p.from}` : `${fmtPrice(productPrice(p, year).tag)}${p.kind === 'sub' ? ' / Monat' : ''}`}</td>
                  <td>{p.kind === 'buy'
                    ? <Select size="s" width={170} value={reg} disabled={!onSale} onChange={(v) => setRegionOf((m) => ({ ...m, [p.id]: v as ScoutRegion }))}
                      options={p.regions.map((r) => ({ value: r, label: REGION_LABEL[r] }))} />
                    : <span className="muted">alle Regionen</span>}</td>
                  <td className="num">{p.kind === 'buy'
                    ? <button className="b3 b3-s" disabled={!onSale || fresh} onClick={() => done(buyProduct(g, p.id, reg), `${p.name} (${REGION_LABEL[reg]}) gekauft.`)}>{have ? 'Neuauflage' : 'Kaufen'}</button>
                    : <button className="b3 b3-s" disabled={!onSale || !!sub} onClick={() => done(subscribe(g, p.id), `${p.name} abonniert – der erste Monat ist bezahlt.`)}>{sub ? 'Läuft' : 'Abonnieren'}</button>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </DashBox>
    </DashPage>
  );
}
