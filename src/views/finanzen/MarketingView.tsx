import { GOAL_LABEL, MARKETING_AREAS, MARKETING_BY_ID, MARKETING_GOALS, areaMonthlyCostBase, areaSaturation, channelGoals, marketingAvailable, marketingPriceFactor, type MarketingGoal } from '../../data/marketing';
import { marketingView } from '../../game/marketingGame';
import { economyScale, yearOf } from '../../engine/economy';
import { LED_YEAR } from '../../data/sponsorCatalog';
import { computeMonthly } from '../../engine/finances';
import { bandenFactor, tvEraText, tvPresence } from '../../engine/sponsorship';
import { CATERING_LEASE, CATERING_NETPERHEAD, CATERING_UPKEEP, cateringMatchIncome, expectedAttendance, matchdayIncome, clubPriceScale } from '../../engine/finances';
import { MAX_LEVEL } from '../../engine/infrastructure';
import { Game } from '../../game/state';
import { CateringMode } from '../../types';
import { DashBox, DashPage, KV, Kpi } from '../../ui/DashPage';
import { fmtDM, fmtDMfull } from '../../ui/format';
import { fmtSmallMoney } from '../shared';

// =============================================================================
// MARKETING — Werbe-Regler je Kanal, epochenabhängig (Block p11)
// =============================================================================
export function MarketingView({ g, onChange }: { g: Game; onChange: () => void }) {
  const club = g.clubs[g.managedClubId];
  const curYear = yearOf(g.calendar.currentDate);
  const scale = economyScale(curYear);
  const mdScale = clubPriceScale(club, curYear); // Preis je Besucher (Stadionumsatz ÷ Zuschauer-Nachfrage, Liga-Ebene)
  const budgets = g.marketing ?? (g.marketing = {});

  const setUnits = (id: string, units: number) => {
    const area = MARKETING_BY_ID[id];
    if (!area) return;
    const u = Math.max(0, Math.min(area.maxUnits, Math.round(units)));
    if (u <= 0) delete budgets[id];
    else budgets[id] = u;
    onChange();
  };

  const mv = marketingView(g, budgets);
  const price = marketingPriceFactor(curYear, club.reputation ?? 60);
  const brandGoal = (k: MarketingGoal) => k === 'reg' || k === 'nat' || k === 'intl';
  const fxText = (k: MarketingGoal, v: number) => (brandGoal(k) ? `+${v.toFixed(1).replace('.', ',')}` : `+${(v * 100).toFixed(1).replace('.', ',')} %`);
  const net = mv.gainYear - mv.costYear;

  // --- Mitgliedsbeitraege, Catering-Betriebsform, Programmhefte (Finanzsystem) ---
  const cateringLevel = Math.max(1, Math.min(MAX_LEVEL, Math.round(club.infrastructure?.catering ?? 1)));
  const cateringMode: CateringMode = club.commerce?.cateringMode ?? 'verpachtung';
  const CATERING_MODE_LABEL: Record<CateringMode, string> = {
    eigenbetrieb: 'Eigenbetrieb', umsatz: 'Umsatzbeteiligung', verpachtung: 'Verpachtung',
  };
  const setCateringMode = (m: CateringMode) => {
    const com = club.commerce ?? (club.commerce = { cateringMode: 'verpachtung' });
    com.cateringMode = m;
    onChange();
  };
  // Mitgliedsbeiträge und Werbeflächen wie im Monatsabschluss (engine/finances.ts computeMonthly).
  const monthly = computeMonthly(club, g.players, g.table, scale, curYear);
  const membershipMonth = monthly.membership;
  const bandenDeal = club.commerce?.deals?.find((d) => d.slot === 'banden');
  const presence = tvPresence(club, curYear);
  // Erwartete Zuschauer & abgeleitete Spieltagserloese.
  const expAtt = expectedAttendance(club, undefined, curYear);
  const expCatering = cateringMatchIncome(club, expAtt, mdScale);
  const expProgramme = matchdayIncome(expAtt, mdScale);

  const areas = MARKETING_AREAS.filter((a) => marketingAvailable(a, curYear));
  const future = MARKETING_AREAS.filter((a) => !marketingAvailable(a, curYear)).sort((a, b) => a.unlockYear - b.unlockYear);

  return (
    <DashPage>
      <DashBox title="Werbekanäle" info="werbekanaele" icon="marketing" span={2} rows={future.length ? 1 : 2} right={`${areas.length} verfügbar`}>
        {areas.map((a) => {
          const avail = marketingAvailable(a, curYear);
          const units = budgets[a.id] ?? 0;
          const cost = Math.round(areaMonthlyCostBase(a, units) * price * scale);
          const benefitPct = Math.round(areaSaturation(a, units) * 100);
          const goals = MARKETING_GOALS.filter((k) => channelGoals(a.id)[k]).sort((x, y) => (channelGoals(a.id)[y] ?? 0) - (channelGoals(a.id)[x] ?? 0));
          return (
            <div key={a.id} className={`dmkt ${avail ? '' : 'locked'}`}>
              <div className="dmkt-main">
                <b>{a.name}</b>
                <span className="dnote">{a.desc}</span>
                <span className="dmkt-goals">{goals.map((k) => <i key={k}>{GOAL_LABEL[k]}</i>)}</span>
              </div>
              {avail ? (
                <div className="dmkt-ctrl">
                  <input type="range" min={0} max={a.maxUnits} step={1} value={units} onChange={(e) => setUnits(a.id, Number(e.target.value))} />
                  <span className="dnote">Stufe {units}/{a.maxUnits} · {fmtDM(cost)}/Monat · ausgeschöpft {benefitPct} %</span>
                </div>
              ) : <span className="dchip">ab {a.unlockYear}</span>}
            </div>
          );
        })}
        <div className="dnote mt8">Kosten steigen linear mit der Stufe, die Wirkung flacht ab – die ersten Stufen bringen am meisten. Eine Kampagne braucht rund ein halbes Jahr, bis sie voll wirkt, und klingt ebenso langsam ab. Markenwerbung bleibt als Wert erhalten.</div>
      </DashBox>

      {future.length > 0 && <DashBox title="Kommende Werbekanäle" icon="kalender" span={2} right={`${future.length} weitere`}>
        {future.length ? future.map((a) => (
          <div key={a.id} className="dlist-row">
            <span className="dchip" style={{ minWidth: 70, textAlign: 'center' }}>ab {a.unlockYear}</span>
            <span className="grow"><b>{a.name}</b><span className="dnote" style={{ display: 'block' }}>{a.desc}</span></span>
          </div>
        )) : null}
      </DashBox>}

      <DashBox title="Wirkung der Werbung" info="werbewirkung" icon="finances">
        <div className="dkpis">
          <Kpi value={fmtDM(mv.costYear)} label="Kosten / Jahr" color={mv.costYear ? 'var(--red)' : undefined} />
          <Kpi value={mv.costYear ? `${net >= 0 ? '+' : '−'}${fmtDM(Math.abs(net))}` : '–'} label="Überschuss geschätzt / Jahr" color={!mv.costYear ? undefined : net >= 0 ? 'var(--green)' : 'var(--red)'} />
        </div>
        <div className="dmkt-fx">
          <div className="dmkt-fx-h"><span>Werbeziel</span><span>jetzt</span><span>Ziel</span><span>bringt / Jahr</span></div>
          {mv.rows.map((r) => (
            <div key={r.goal} className={`dmkt-fx-row${r.target <= 0 && r.now <= 0 ? ' off' : ''}`}>
              <span>{GOAL_LABEL[r.goal]}</span>
              <span>{r.now > 0 ? fxText(r.goal, r.now) : '–'}</span>
              <span>{r.target > 0 ? fxText(r.goal, r.target) : '–'}</span>
              <span>{brandGoal(r.goal) ? '' : r.perYear ? `+${fmtDM(r.perYear)}` : '–'}</span>
              <i className="dmkt-fx-bar"><b style={{ width: `${Math.min(100, (r.target / r.cap) * 100)}%` }} /><em style={{ width: `${Math.min(100, (r.now / r.cap) * 100)}%` }} /></i>
            </div>
          ))}
          <div className="dmkt-fx-row sum"><span>Marke gesamt → Sponsoring, Vermarktung, Fanartikel</span><span /><span /><span>{mv.brandYear ? `+${fmtDM(mv.brandYear)}` : '–'}</span></div>
        </div>
        <div className="dmkt-pull" title={mv.pull.why}>
          <span>Zugkraft des Vereins</span><b className={mv.pull.factor >= 1.07 ? 'up' : mv.pull.factor <= 0.93 ? 'down' : ''}>{mv.pull.word} · ×{mv.pull.factor.toFixed(2).replace('.', ',')}</b>
          <i>{mv.pull.why}</i>
        </div>
        <div className="dnote mt8 dmkt-advice">
          {mv.costYear === 0 ? 'Keine Werbung geschaltet. Schon die ersten Stufen bringen spürbar Zuschauer, Mitglieder und Fanartikel-Umsatz.'
            : mv.netUp != null && mv.netUp > net && mv.netUp >= (mv.netDown ?? -Infinity) ? `Da geht noch mehr: Überall eine Stufe höher brächte geschätzt ${fmtDM(mv.netUp - net)} mehr im Jahr.`
              : mv.netDown != null && mv.netDown > net ? `Du liegst über dem einträglichsten Einsatz: Überall eine Stufe tiefer blieben geschätzt ${fmtDM(mv.netDown - net)} mehr im Jahr übrig.`
                : 'Du triffst gerade den einträglichsten Einsatz. Er verschiebt sich mit der Zugkraft – läuft es sportlich, lohnt mehr Werbung; in der Krise weniger.'}
          {mv.costYear > 0 && mv.progress < 0.85 ? ` Die Kampagnen laufen noch an (${Math.round(mv.progress * 100)} % der Zielwirkung).` : ''}
        </div>
        <KV k="Mitgliedsbeiträge / Monat" info="mitglieder" v={`+${fmtDM(membershipMonth)}`} color="var(--green)" />
        <div className="dsec">Werbeflächen im Stadion</div>
        <KV k="Bandenpartner" v={bandenDeal ? `${bandenDeal.partner} · ${fmtDM(monthly.advertising * 12)}/Jahr` : 'frei – siehe Sponsoring'} />
        <KV k="Banden" v={curYear >= LED_YEAR ? 'LED, wechselnde Motive' : 'statisch'} />
        <KV k="Wert (Zuschauer × TV)" info="reichweite" v={`${Math.round(bandenFactor(club, curYear) * 100)} %`} />
        <KV k="TV-Präsenz" v={`${Math.round(presence * 100)} %`} />
        <div className="dnote">{tvEraText(curYear)}.</div>
      </DashBox>

      <DashBox title="Catering & Spieltag" info="catering" icon="catering" right={`Stufe ${cateringLevel}`}>
        <div className="dbtnrow" style={{ marginBottom: 8 }}>
          {(['eigenbetrieb', 'umsatz', 'verpachtung'] as CateringMode[]).map((m) => (
            <button key={m} className={`dchip ${cateringMode === m ? 'on' : ''}`} onClick={() => setCateringMode(m)}>{CATERING_MODE_LABEL[m]}</button>
          ))}
        </div>
        <KV k="Netto pro Besucher" v={fmtSmallMoney(CATERING_NETPERHEAD[cateringMode][cateringLevel] * scale, curYear)} />
        <KV k="Fixkosten / Monat" v={`−${fmtDMfull(Math.round(CATERING_UPKEEP[cateringMode][cateringLevel] * scale))}`} color="var(--red)" />
        {cateringMode === 'verpachtung' && <KV k="Pacht / Monat" v={`+${fmtDMfull(Math.round(CATERING_LEASE[cateringLevel] * scale))}`} color="var(--green)" />}
        <div className="dsec">Pro Heimspiel (erwartet)</div>
        <KV k="Zuschauer" v={expAtt.toLocaleString('de-DE')} />
        <KV k="Catering" v={fmtDM(expCatering)} />
        <KV k="Programmhefte" v={fmtDM(expProgramme)} />
        <div className="dnote mt8">Eigenbetrieb: höchster Erlös, hohe Fixkosten. Verpachtung: feste Pacht, kaum Kosten.</div>
      </DashBox>
    </DashPage>
  );
}
