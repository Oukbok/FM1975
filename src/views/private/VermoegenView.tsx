// =============================================================================
// PRIVAT › VERMÖGEN (Wunsch Pascal #47): Konto/Sparbuch/Aktienfonds mit Umbuchen,
// Monatsabschluss, Zuschuss an den Verein, Wohnen und Auto. Beträge in 1975-Basis
// (nominal wie die Vereinskonten, Anzeige fmtDM), Logik game/private/privateGame.ts.
// =============================================================================
import { useState } from 'react';
import type { Game } from '../../game/state';
import { ensurePrivate } from '../../game/private/privateState';
import { buyCar, buyHome, carDeal, carPrice, donateToClub, homeDeal, homePrice, monthlyCosts, moveMoney, netWorth } from '../../game/private/privateGame';
import { carsFor, cpi, HOMES, savingsRate, stockYear } from '../../data/privateLife';
import { currencyAt, yearOf } from '../../engine/economy';
import { DashBox, DashPage, KV } from '../../ui/DashPage';
import Seg from '../../ui/Seg';
import { fmtDM } from '../../ui/format';
import { Feedback, useFeedback } from './parts';

/** Beträge je Zeit (Verbraucherpreise), auf runde Werte. */
const niceRound = (v: number) => { const p = Math.pow(10, Math.floor(Math.log10(v))); return Math.round(v / p) * p; };
// Runde Beträge in der angezeigten Währung (DM bzw. Euro), intern in DM-Werten.
const stepsFor = (year: number) => { const per = currencyAt(year).perDM; return [5000, 25000, 100000, 500000].map((v) => niceRound(v * cpi(year) * per) / per); };
const pctTxt = (v: number) => `${(v * 100).toFixed(1).replace('.', ',')} %`;

export function VermoegenView({ g, onChange }: { g: Game; onChange: () => void }) {
  const st = ensurePrivate(g);
  const [fb, setFb] = useFeedback();
  const year = yearOf(g.calendar.currentDate);
  const STEPS = stepsFor(year);
  const [amt0, setAmt] = useState(1);
  const amt = STEPS[amt0] ?? STEPS[1];
  const act = (t: string) => { setFb(t || 'Nicht genug Geld.'); onChange(); };
  const c = monthlyCosts(g, st);
  const L = st.ledger;
  const cars = carsFor(year);

  return (
    <DashPage className="pv-page">
      <DashBox title="Konten" right={fmtDM(netWorth(st, year))} info="privatvermoegen">
        <KV k="Konto" v={<span className={st.money < 0 ? 'neg' : ''}>{fmtDM(st.money)}</span>} strong />
        <KV k={`Sparbuch (${pctTxt(savingsRate(year))} Zins)`} v={fmtDM(st.savings)} />
        <KV k={`Aktienfonds (Vorjahr ${stockYear(year - 1) >= 0 ? '+' : ''}${pctTxt(stockYear(year - 1))})`} v={fmtDM(st.stocks)} />
        <div className="pv-toggle-row"><span>Betrag</span><Seg size="s" value={amt0} options={STEPS.map((v, i) => ({ v: i, label: fmtDM(v) }))} onChange={(v) => setAmt(Number(v))} /></div>
        <div className="dbtnrow mt8 pv-wrap">
          <button type="button" className="btn btn-sm" onClick={() => act(moveMoney(g, 'money', 'savings', amt))}>Aufs Sparbuch</button>
          <button type="button" className="btn btn-sm" onClick={() => act(moveMoney(g, 'money', 'stocks', amt))}>In den Fonds</button>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => act(moveMoney(g, 'savings', 'money', amt))}>Sparbuch abheben</button>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => act(moveMoney(g, 'stocks', 'money', amt))}>Fonds verkaufen</button>
        </div>
        <Feedback text={fb} />
        <div className="dnote">Der Fonds folgt den großen Börsen – Boom und Crash wie in der echten Zeit. Ist das Konto leer, wird erst das Sparbuch, dann der Fonds aufgelöst.</div>
      </DashBox>

      <DashBox title="Monatsabschluss" right={L ? L.d.slice(5, 7) + '/' + L.d.slice(0, 4) : undefined}>
        <KV k="Gehalt" v={<span className="pos">+{fmtDM(c.income)}</span>} strong />
        <KV k="Lebenshaltung" v={`−${fmtDM(c.living)}`} />
        <KV k="Wohnen" v={`−${fmtDM(c.home)}`} />
        <KV k="Auto" v={`−${fmtDM(c.car)}`} />
        <KV k="Hobby" v={c.hobby ? `−${fmtDM(c.hobby)}` : '–'} />
        <KV k="Kinder" v={c.kids ? `−${fmtDM(c.kids)}` : '–'} />
        {L && <KV k="Zinsen / Fonds" v={`${L.interest >= 0 ? '+' : '−'}${fmtDM(Math.abs(L.interest))} / ${L.stocks >= 0 ? '+' : '−'}${fmtDM(Math.abs(L.stocks))}`} />}
        <KV k="Bleibt im Monat" v={<span className={c.income - (c.living + c.home + c.car + c.hobby + c.kids) < 0 ? 'neg' : 'pos'}>{fmtDM(c.income - (c.living + c.home + c.car + c.hobby + c.kids))}</span>} strong />
        <div className="dnote">Dein Gehalt richtet sich nach Größe des Vereins und deinem Ruf.</div>
      </DashBox>

      <DashBox title="Verein unterstützen">
        <div className="dnote">Privatgeld als Zuschuss an den Verein – keine Rückzahlung, keine Anteile. Der Vorstand rechnet es dir an (Vertrauen bis +8).</div>
        <div className="dbtnrow mt8">
          <button type="button" className="btn btn-sm btn-primary" disabled={st.money < amt} onClick={() => act(donateToClub(g, amt))}>{fmtDM(amt)} überweisen</button>
        </div>
        <KV k="Bisher gegeben" v={st.donated ? fmtDM(st.donated) : '–'} />
      </DashBox>

      <DashBox title="Wohnen" span={2} flush>
        <table className="dtable rl-sm pv-shop">
          <thead><tr><th>Zuhause</th><th className="rl-num">Preis</th><th className="rl-num">Monatlich</th><th /></tr></thead>
          <tbody>
            {HOMES.map((h) => {
              const { cost } = homeDeal(g, st, h.lvl);
              return (
                <tr key={h.lvl} className={st.home === h.lvl ? 'pv-cur' : ''}>
                  <td className="rl-main">{h.label}<div className="pv-sub">{h.text}</div></td>
                  <td className="rl-num">{h.price ? fmtDM(homePrice(h.lvl, year)) : 'Miete'}</td>
                  <td className="rl-num">{fmtDM(Math.round(h.monthly * cpi(year)))}</td>
                  <td className="pv-acts">{st.home === h.lvl ? <span className="pv-sub">dein Zuhause</span>
                    : <button type="button" className="btn btn-sm" disabled={cost > st.money} onClick={() => act(buyHome(g, h.lvl))}>{h.lvl === 0 ? 'Zur Miete ziehen' : cost > 0 ? `Kaufen (${fmtDM(cost)})` : 'Umziehen'}</button>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </DashBox>

      <DashBox title="Auto" flush>
        <table className="dtable rl-sm pv-shop">
          <tbody>
            {cars.map((car) => {
              const { cost } = carDeal(g, st, car.lvl);
              return (
                <tr key={car.lvl} className={st.car === car.lvl ? 'pv-cur' : ''}>
                  <td className="rl-main">{car.label}<div className="pv-sub">{car.price ? `${fmtDM(carPrice(car.lvl, year))} · ` : ''}{fmtDM(Math.round(car.monthly * cpi(year)))}/Mon.</div></td>
                  <td className="pv-acts">{st.car === car.lvl ? <span className="pv-sub">fährst du</span>
                    : <button type="button" className="btn btn-sm" disabled={cost > st.money} onClick={() => act(buyCar(g, car.lvl))}>{cost > 0 ? fmtDM(cost) : 'Tauschen'}</button>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </DashBox>
    </DashPage>
  );
}
