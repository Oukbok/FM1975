import { GOAL_LABEL, MARKETING_AREAS, MARKETING_BY_ID, MARKETING_GOALS, areaMonthlyCostBase, areaSaturation, channelGoals, marketingAvailable, type MarketingGoal } from '../../data/marketing';
import { marketingPrice, marketingView } from '../../game/marketingGame';
import { cateringDealNow, cateringExpectation, cateringOffers, cateringOpen, chooseCatering } from '../../game/cateringGame';
import { economyScale, yearOf } from '../../engine/economy';
import { LED_YEAR } from '../../data/sponsorCatalog';
import { computeMonthly } from '../../engine/finances';
import { bandenFactor, tvEraText, tvPresence } from '../../engine/sponsorship';
import { CATERING_UPKEEP, cateringMatchIncome, expectedAttendance, matchdayIncome, clubPriceScale } from '../../engine/finances';
import { MAX_LEVEL } from '../../engine/infrastructure';
import { Game } from '../../game/state';
import { DashBox, DashPage, KV, Kpi } from '../../ui/DashPage';
import { fmtDM, fmtDMfull } from '../../ui/format';

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
  const price = marketingPrice(g);
  const brandGoal = (k: MarketingGoal) => k === 'reg' || k === 'nat' || k === 'intl';
  const fxText = (k: MarketingGoal, v: number) => (brandGoal(k) ? `+${v.toFixed(1).replace('.', ',')}` : `+${(v * 100).toFixed(1).replace('.', ',')} %`);
  const net = mv.gainYear - mv.costYear;

  // --- Mitgliedsbeitraege, Catering-Betriebsform, Programmhefte (Finanzsystem) ---
  const cateringLevel = Math.max(1, Math.min(MAX_LEVEL, Math.round(club.infrastructure?.catering ?? 1)));
  const cExp = cateringExpectation(g, club);
  const cOffers = cateringOffers(g);
  const cDeal = cateringDealNow(g);
  const cOpen = cateringOpen(g);
  const pickCatering = (i: number | null) => { chooseCatering(g, i); onChange(); };
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
      <DashBox title="Werbekanäle" info="werbekanaele" icon="marketing" span={2} right={`${areas.length} verfügbar${future.length ? ` · nächster ab ${future[0].unlockYear}` : ''}`}>
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
              {/* Wunsch Pascal: Pfeil „jetzt“ (dunkel) und „Ziel mit diesen Einstellungen“ (hell) von oben auf den Balken */}
              <i className="dmkt-fx-bar"><b style={{ width: `${Math.min(100, (r.target / r.cap) * 100)}%` }} /><em style={{ width: `${Math.min(100, (r.now / r.cap) * 100)}%` }} /></i>
              {(r.target > 0 || r.now > 0) && <>
                <i className="dmkt-fx-arrow now" style={{ left: `${Math.min(100, (r.now / r.cap) * 100)}%` }} title={`Jetzt ${fxText(r.goal, r.now)}`} />
                <i className="dmkt-fx-arrow goal" style={{ left: `${Math.min(100, (r.target / r.cap) * 100)}%` }} title={`Ziel ${fxText(r.goal, r.target)}`} />
              </>}
            </div>
          ))}
          <div className="dmkt-fx-row sum"><span>Marke gesamt → Sponsoring, Vermarktung, Fanartikel</span><span /><span /><span>{mv.brandYear ? `+${fmtDM(mv.brandYear)}` : '–'}</span></div>
        </div>
        <div className="dmkt-legend"><span><i className="dmkt-fx-arrow now" />jetzt</span><span><i className="dmkt-fx-arrow goal" />Ziel mit diesen Einstellungen</span></div>
      </DashBox>

      <DashBox title="Zugkraft & Empfehlung" info="werbewirkung" icon="trendUp">
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
        {future.length > 0 && <KV k="Nächster Werbekanal" v={`${future[0].name} · ab ${future[0].unlockYear}`} />}
      </DashBox>

      <DashBox title="Stadion & Spieltag" info="reichweite" icon="stadium">
        <div className="dsec">Werbeflächen</div>
        <KV k="Bandenpartner" v={bandenDeal ? `${bandenDeal.partner} · ${fmtDM(monthly.advertising * 12)}/Jahr` : 'frei – siehe Sponsoring'} />
        <KV k="Banden" v={curYear >= LED_YEAR ? 'LED, wechselnde Motive' : 'statisch'} />
        <KV k="Wert (Zuschauer × TV)" info="reichweite" v={`${Math.round(bandenFactor(club, curYear) * 100)} %`} />
        <KV k="TV-Präsenz" v={`${Math.round(presence * 100)} %`} />
        <div className="dnote mt8">{tvEraText(curYear)}.</div>
        <div className="dsec">Pro Heimspiel (erwartet)</div>
        <KV k="Zuschauer" v={expAtt.toLocaleString('de-DE')} />
        <KV k="Catering" v={cDeal ? `${fmtDM(Math.round(cDeal.annual / 12))}/Monat fest` : fmtDM(expCatering)} />
        <KV k="Programmhefte" v={fmtDM(expProgramme)} />
      </DashBox>

      <DashBox title="Catering & Spieltag" info="catering" icon="catering" right={`Stufe ${cateringLevel}`}>
        {/* Wunsch Pascal: Jahresentscheidung statt fester Betriebsform (game/cateringGame.ts) */}
        <div className="dmkt-cat-exp">
          <span>Eigenbetrieb erwartet / Saison</span>
          <b>{fmtDM(cExp.mid)}</b>
          <i>je nach Zuschauern {fmtDM(cExp.lo)} bis {fmtDM(cExp.hi)} · Fixkosten {fmtDMfull(Math.round(CATERING_UPKEEP.eigenbetrieb[cateringLevel] * scale))}/Monat</i>
        </div>
        <div className="dmkt-cat-list">
          <button type="button" className={`dmkt-cat-opt ${!cDeal ? 'on' : ''}`} disabled={!cOpen} onClick={() => pickCatering(null)}>
            <span><b>Eigenbetrieb</b><small>Erlös je Besucher – läuft es gut, verdienst du mehr</small></span><em>variabel</em>
          </button>
          {cOffers.map((o, i) => {
            const on = cDeal?.caterer === o.caterer;
            const diff = cExp.mid ? Math.round((o.annual / cExp.mid - 1) * 100) : 0;
            return (
              <button key={o.caterer} type="button" className={`dmkt-cat-opt ${on ? 'on' : ''}`} disabled={!cOpen} onClick={() => pickCatering(i)}>
                <span><b>{o.caterer}</b><small>Jahresvertrag, feste Summe in Monatsraten</small></span>
                <em>{fmtDM(o.annual)}<small className={diff >= 0 ? 'up' : 'down'}>{diff >= 0 ? '+' : '−'}{Math.abs(diff)} %</small></em>
              </button>
            );
          })}
        </div>
        <div className="dnote mt8">{cOpen ? `Entscheide bis 31. Juli ${g.season.slice(0, 4)}. Ohne Wahl bleibt der Eigenbetrieb.` : cDeal ? `Vertrag mit ${cDeal.caterer} bis Saisonende – nächste Saison neu.` : 'Eigenbetrieb bis Saisonende – nächste Saison gibt es neue Angebote.'}</div>
      </DashBox>
    </DashPage>
  );
}
