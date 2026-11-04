// Fanartikel › Statistiken: Verkäufe je Artikel, Umsatzentwicklung, Trikots (bzw. Poster) je Spieler.
import { useState } from 'react';
import type { Club, Player } from '../../../types';
import type { MerchItemId, MerchShop } from '../../../types/merch';
import { Game } from '../../../game/state';
import { MERCH_BY_ID, FLOCK_YEAR } from '../../../data/merchCatalog';
import { seasonTotals } from '../../../engine/merch';
import { isNewcomer } from '../../../game/merchGame';
import PlayerAvatar from '../../../components/PlayerAvatar';
import { DashBox, Empty } from '../../../ui/DashPage';
import { MerchChart, type ChartSeries } from './MerchChart';
import { shownItems } from './MerchGeneral';
import { Signed, money, n0, type MerchTab } from './parts';

interface Props { g: Game; club: Club; shop: MerchShop; year: number; tab: MerchTab; setTab: (t: MerchTab) => void }
type Focus = { kind: 'all' } | { kind: 'item'; id: MerchItemId } | { kind: 'player'; id: string };

export function MerchStats(p: Props) {
  const [focus, setFocus] = useState<Focus>({ kind: 'all' });
  const [range, setRange] = useState<'wochen' | 'saisons'>('wochen');
  return (
    <>
      <ItemTable {...p} focus={focus} setFocus={setFocus} />
      <PlayerBox {...p} focus={focus} setFocus={setFocus} />
      <DashBox title="Umsatzentwicklung" info="merchUmsatz" icon="stats" span={2}
        right={<span className="seg-group mc-tabs">
          <button className={`seg-btn ${range === 'wochen' ? 'active' : ''}`} onClick={() => setRange('wochen')}>Wochen</button>
          <button className={`seg-btn ${range === 'saisons' ? 'active' : ''}`} onClick={() => setRange('saisons')}>Saisons</button>
        </span>}>
        <MerchChart s={series(p.g, p.shop, focus, range)} />
      </DashBox>
    </>
  );
}

function ItemTable({ shop, year, tab, setTab, focus, setFocus }: Props & { focus: Focus; setFocus: (f: Focus) => void }) {
  const last = shop.weeks[shop.weeks.length - 1];
  const t = seasonTotals(shop);
  const items = shownItems(shop, year);
  const isAll = focus.kind === 'all';
  return (
    <DashBox title="Verkäufe je Artikel" info="merchStatistik" icon="merch" span={2} flush>
      <table className="dtable rl-sm mc-table">
        <thead><tr>
          <th>Artikel</th><th className="num">Verkauft</th><th className="num">Einnahmen</th><th className="num">Ausgaben</th>
          <th className="num">Gewinn</th><th className="num">Letzte Woche</th><th className="num">Nicht lieferbar</th>
        </tr></thead>
        <tbody>
          {items.map((d) => {
            const s = shop.items[d.id]?.season;
            const on = focus.kind === 'item' && focus.id === d.id;
            return (
              <tr key={d.id} className={on ? 'mc-sel' : ''} onClick={() => setFocus(on ? { kind: 'all' } : { kind: 'item', id: d.id })}>
                <td className="rl-name">{d.name}</td>
                <td className="num">{n0(s?.sold ?? 0)}</td>
                <td className="num">{money(s?.rev ?? 0)}</td>
                <td className="num">{money(s?.cost ?? 0)}</td>
                <td className="num"><Signed v={(s?.rev ?? 0) - (s?.cost ?? 0)} fmt={money} /></td>
                <td className="num">{money(last?.it[d.id] ?? 0)}</td>
                <td className="num muted">{s?.lost ? n0(s.lost) : '–'}</td>
              </tr>
            );
          })}
          <tr className={`mc-sum ${isAll ? 'mc-sel' : ''}`} onClick={() => setFocus({ kind: 'all' })}>
            <td className="rl-name">Gesamt</td>
            <td className="num">{n0(t.sold)}</td>
            <td className="num">{money(t.rev)}</td>
            <td className="num">{money(t.cost)}</td>
            <td className="num"><Signed v={t.rev - t.cost} fmt={money} pos /></td>
            <td className="num">{money(last?.rev ?? 0)}</td>
            <td className="num muted">{t.lost ? n0(t.lost) : '–'}</td>
          </tr>
        </tbody>
      </table>
    </DashBox>
  );
}

function PlayerBox({ g, club, shop, year, focus, setFocus }: Props & { focus: Focus; setFocus: (f: Focus) => void }) {
  const flock = year >= FLOCK_YEAR;
  const rows = Object.entries(shop.jersey).map(([id, n]) => ({ p: g.players[id], n })).filter((r): r is { p: Player; n: number } => !!r.p).sort((a, b) => b.n - a.n);
  const selId = focus.kind === 'player' ? focus.id : rows[0]?.p.id;
  const sel = rows.find((r) => r.p.id === selId) ?? rows[0];
  const today = g.calendar.currentDate;
  const title = flock ? 'Trikotverkäufe' : 'Poster & Autogrammkarten';
  return (
    <DashBox title={title} info="merchTrikots" icon="squad" rows={2} right={shop.season}>
      {!rows.length ? <Empty icon="squad">{flock ? 'Noch keine beflockten Trikots verkauft – die Woche wird montags abgerechnet.' : 'Noch keine Verkäufe in dieser Saison – die Woche wird montags abgerechnet.'}</Empty> : <>
        {sel && (
          <div className="mc-face">
            <PlayerAvatar player={sel.p} club={sel.p.clubId === club.id ? club : g.clubs[sel.p.clubId]} size={112} />
            <div className="mc-face-txt">
              <div className="mc-face-name">{sel.p.fullName}</div>
              <div className="dnote">{sel.p.clubId === club.id ? `Nr. ${sel.p.shirtNumber} · ${sel.p.naturalPosition}` : 'nicht mehr im Verein'}{isNewcomer(sel.p, club, today) ? ' · Neuzugang' : ''}</div>
              <div className="mc-face-n">{n0(sel.n)}<span> {flock ? 'Trikots' : 'Stück'}</span></div>
            </div>
          </div>
        )}
        <table className="dtable rl-players rl-sm mc-table">
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.p.id} data-pid={r.p.id} className={r.p.id === sel?.p.id ? 'mc-sel' : ''} onClick={() => setFocus({ kind: 'player', id: r.p.id })}>
                <td className="rl-rank">{i + 1}</td>
                <td className="rl-name">{r.p.fullName}</td>
                <td><span className="pos-badge">{r.p.naturalPosition}</span></td>
                <td className="num rl-main">{n0(r.n)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>}
      <div className="dnote mt8">{flock ? 'Seit 1995/96 tragen Fan-Trikots Namen und feste Rückennummern – gut sechs von zehn werden beflockt.' : 'Trikots mit Spielernamen gibt es erst ab 1995/96 – bis dahin zeigt sich die Beliebtheit an Postern und Autogrammkarten.'}</div>
    </DashBox>
  );
}

// -----------------------------------------------------------------------------
function series(g: Game, shop: MerchShop, f: Focus, range: 'wochen' | 'saisons'): ChartSeries {
  const name = f.kind === 'item' ? MERCH_BY_ID[f.id].name : f.kind === 'player' ? (g.players[f.id]?.fullName ?? '?') : 'Fanartikel gesamt';
  const units = f.kind === 'player';
  const fmt = units ? (v: number) => `${n0(v)} St.` : (v: number) => money(v);
  if (range === 'wochen') {
    const values = shop.weeks.map((w, i) => f.kind === 'all' ? w.rev : f.kind === 'item' ? (w.it[f.id] ?? 0) : (shop.jerseyW[f.id]?.[i] ?? 0));
    return {
      title: `${units ? 'Verkäufe' : 'Umsatz'} je Woche: ${name}`, unit: units ? 'Stück' : 'Umsatz', values, fmt,
      labels: shop.weeks.map((_, i) => String(i + 1)), tips: shop.weeks.map((w, i) => `Woche ${i + 1} · ab ${w.d.slice(8, 10)}.${w.d.slice(5, 7)}.${w.d.slice(0, 4)}`),
    };
  }
  const cur = seasonTotals(shop);
  const arch = shop.archive.slice(-14);
  const val = (a: (typeof arch)[number]) => f.kind === 'all' ? a.rev : f.kind === 'item' ? (a.it?.[f.id] ?? 0) : (a.top?.find((t) => t.id === f.id)?.n ?? 0);
  const now = f.kind === 'all' ? cur.rev : f.kind === 'item' ? (shop.items[f.id]?.season.rev ?? 0) : (shop.jersey[f.id] ?? 0);
  return {
    title: `${units ? 'Verkäufe' : 'Umsatz'} je Saison: ${name}`, unit: units ? 'Stück' : 'Umsatz', fmt, openLast: true,
    values: [...arch.map(val), now],
    labels: [...arch.map((a) => a.season.slice(2, 4)), shop.season.slice(2, 4)],
    tips: [...arch.map((a) => `Saison ${a.season}`), `Saison ${shop.season} (läuft)`],
  };
}
