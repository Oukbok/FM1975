import { useState } from 'react';
import { campDestination } from '../../data/campDestinations';
import { SLOT_BY_ID } from '../../data/sponsorCatalog';
import { commercialMultiplier, ensureBrand } from '../../engine/clubEconomy';
import { economyScale, yearOf } from '../../engine/economy';
import { computeMonthly } from '../../engine/finances';
import { namingAnnualNominal } from '../../engine/clubBusiness';
import { slotsFor, tvPresence, upcomingSlots } from '../../engine/sponsorship';
import { clubTierNow, exerciseOption, rejectSponsorOffer, signSponsorOffer, terminateDeal, terminationCost } from '../../game/sponsorGame';
import { Game } from '../../game/state';
import { Screen } from '../../shell/navigation';
import type { SponsorDeal } from '../../types/sponsor';
import { DashBox, DashPage, Empty, KV, Kpi, Meter } from '../../ui/DashPage';
import { fmtDM } from '../../ui/format';
import { NegotiateModal } from './sponsor/NegotiateModal';
import { ClauseList, bonusText, partnerMeta, untilText, yearly } from './sponsor/parts';

// =============================================================================
// SPONSORING 2.0 — Partner-Pyramide, Angebote, Klauseln & Pflichten, Einnahmen.
// Logik: engine/sponsorship.ts, game/sponsorGame.ts · Flächen: data/sponsorCatalog.ts
// =============================================================================
export function SponsoringView({ g, onGoto, onChange }: { g: Game; onGoto: (s: Screen) => void; onChange: () => void }) {
  const club = g.clubs[g.managedClubId];
  const year = yearOf(g.calendar.currentDate);
  const tier = clubTierNow(g, club);
  const com = club.commerce ?? (club.commerce = { cateringMode: 'verpachtung' });
  const deals = com.deals ?? [];
  const offers = [...(com.dealOffers ?? [])].sort((a, b) => Number(!!b.renewal) - Number(!!a.renewal) || b.annualValue - a.annualValue);
  const m = computeMonthly(club, g.players, g.table, economyScale(year), year);
  const brand = ensureBrand(club);
  const [sel, setSel] = useState<string | null>(null);
  const [talk, setTalk] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const selected = deals.find((d) => d.id === sel) ?? null;
  const act = (err: string | null) => { setNote(err); onChange(); };

  // Pyramide: Flächen der Epoche in Reihenfolge, je Platz ein Vertrag oder „frei“.
  const rows: { key: string; slot: string; label: string; deal?: SponsorDeal; open?: number }[] = [];
  for (const def of slotsFor(year, tier)) {
    const mine = deals.filter((d) => d.slot === def.id);
    mine.forEach((d, i) => rows.push({ key: d.id, slot: def.id, label: i === 0 ? def.short : '', deal: d }));
    const free = def.count(year, tier) - mine.length;
    if (free > 0) rows.push({ key: `${def.id}-free`, slot: def.id, label: mine.length ? '' : def.short, open: offers.filter((o) => o.slot === def.id).length });
  }
  const sponsorYear = (m.sponsorship + m.advertising) * 12;
  const bonusPotential = deals.reduce((a, d) => a + (d.bonuses.title ?? 0) + (d.bonuses.cup ?? 0) + (d.bonuses.euro ?? 0), 0) * economyScale(year);
  const obligations = (com.campObligations ?? []).filter((o) => o.season === g.season);
  const naming = club.namingRights ? namingAnnualNominal(club.namingRights, club, year) : 0;
  const coming = upcomingSlots(year, tier).slice(0, 4);

  return (
    <DashPage>
      <DashBox title="Partner-Pyramide" icon="sponsoring" span={2} right={`${deals.length} Verträge · ${fmtDM(sponsorYear)} pro Jahr`}>
        <div className="sp-table">
          {rows.map((r) => r.deal ? (
            <button key={r.key} className={`sp-row ${sel === r.deal.id ? 'on' : ''}`} onClick={() => setSel(sel === r.deal!.id ? null : r.deal!.id)}>
              <span className="sp-slot">{r.label}</span>
              <span className="sp-who"><b>{r.deal.partner}</b><span className="sp-meta">{partnerMeta(r.deal)}</span></span>
              <span className="sp-cl"><ClauseList clauses={r.deal.clauses} compact /></span>
              <span className="sp-val">{fmtDM(yearly(r.deal.annualValue, year, r.deal.cut))}{r.deal.cut ? <span className="sp-cut">−{Math.round(r.deal.cut * 100)} %</span> : null}</span>
              <span className="sp-term">{untilText(g.season, r.deal.yearsLeft)}</span>
            </button>
          ) : (
            <div key={r.key} className="sp-row free">
              <span className="sp-slot">{r.label}</span>
              <span className="sp-who"><span className="sp-free">frei</span><span className="sp-meta">{SLOT_BY_ID[r.slot as SponsorDeal['slot']].name}</span></span>
              <span className="sp-cl" />
              <span className="sp-val">{r.open ? `${r.open} Angebot${r.open === 1 ? '' : 'e'}` : 'kein Angebot'}</span>
              <span className="sp-term" />
            </div>
          ))}
        </div>
      </DashBox>

      <DashBox title="Einnahmen & Reichweite" icon="finances">
        <div className="dkpis">
          <Kpi value={fmtDM(m.sponsorship * 12)} label="Sponsoring / Jahr" />
          <Kpi value={fmtDM(m.advertising * 12)} label="Werbung / Jahr" />
        </div>
        {bonusPotential > 0 && <KV k="Mögliche Erfolgsprämien" v={fmtDM(bonusPotential)} />}
        {m.merchGlobal > 0 && <KV k="Fanartikel weltweit / Jahr" v={fmtDM(m.merchGlobal * 12)} />}
        <KV k="Lizenzen & Vermarktung / Jahr" v={fmtDM(club.finances.commercialAnnual ?? 0)} />
        {naming > 0 && <KV k={`Namensrechte (${club.namingRights!.arenaName})`} v={fmtDM(naming)} />}
        <div className="dsec">Reichweite</div>
        <Meter label="TV-Präsenz" value={tvPresence(club, year) * 100} text={`${Math.round(tvPresence(club, year) * 100)}`} />
        <Meter label="Regional" value={brand.regional} text={Math.round(brand.regional)} />
        <Meter label="National" value={brand.national} text={Math.round(brand.national)} />
        <Meter label="International" value={brand.international} text={Math.round(brand.international)} />
        <div className="dnote mt8">Markenfaktor {commercialMultiplier(club, year).toFixed(2)}. Titel, Europapokal und Fernsehen machen die Marke größer – und große Marken verdienen überproportional.</div>
      </DashBox>

      <DashBox title="Angebote" icon="negotiations" span={2} right={offers.length ? `${offers.length} offen` : undefined}>
        {note && <div className="sp-warn">{note}</div>}
        {offers.length ? offers.map((o) => (
          <div key={o.id} className="sp-offer">
            <div className="sp-offer-main">
              <div className="sp-offer-top">
                <span className="sp-slot">{SLOT_BY_ID[o.slot].short}</span>
                <b>{o.partner}</b>
                <span className="sp-meta">{partnerMeta(o)}{o.renewal ? ' · Verlängerung' : ''}</span>
              </div>
              <ClauseList clauses={o.clauses} compact />
            </div>
            <div className="sp-offer-val"><b>{fmtDM(yearly(o.annualValue, year))}</b><span className="sp-meta">{o.years} J. · pro Jahr</span></div>
            <div className="dbtnrow">
              <button className="dchip on" onClick={() => act(signSponsorOffer(g, o.id))}>Annehmen</button>
              <button className="dchip" onClick={() => setTalk(o.id)}>Verhandeln</button>
              <button className="dchip" onClick={() => { rejectSponsorOffer(g, o.id); act(null); }}>Ablehnen</button>
            </div>
          </div>
        )) : <Empty icon="negotiations">Keine offenen Angebote. Neue Interessenten melden sich zum Saisonwechsel, im Lauf der Saison für freie Flächen und im Januar für auslaufende Verträge.</Empty>}
      </DashBox>

      {selected ? (
        <DashBox title={selected.partner} icon="contracts" right={<button className="dchip" onClick={() => setSel(null)}>Schließen</button>}>
          <KV k="Werbefläche" v={SLOT_BY_ID[selected.slot].name} />
          <KV k="Branche" v={partnerMeta(selected)} />
          <KV k="Jahreswert" v={fmtDM(yearly(selected.annualValue, year, selected.cut))} strong />
          <KV k="Laufzeit" v={`${selected.yearsTotal} J., ${untilText(g.season, selected.yearsLeft)}`} />
          {bonusText(selected.bonuses, year) && <KV k="Prämien" v={bonusText(selected.bonuses, year)} />}
          {selected.next && <KV k="Ab nächster Saison" v={fmtDM(yearly(selected.next.annualValue, year))} />}
          <div className="dsec">Klauseln</div>
          <ClauseList clauses={selected.clauses} />
          <div className="dbtnrow mt8">
            {selected.clauses.some((k) => k.kind === 'option') && selected.yearsLeft <= 1 && <button className="dchip on" onClick={() => act(exerciseOption(g, selected.id))}>Option ziehen</button>}
            <button className="dchip" title="Ablöse: halber Restwert" onClick={() => { const e = terminateDeal(g, selected.id); if (!e) setSel(null); act(e); }}>Auflösen ({fmtDM(terminationCost(g, selected))})</button>
          </div>
        </DashBox>
      ) : (
        <DashBox title="Pflichten & Markt" icon="kalender">
          {obligations.length ? obligations.map((o, i) => (
            <KV key={i} k={`${o.window === 'winter' ? 'Winterlager' : 'Sommerreise'}: ${campDestination(o.destId)?.name ?? o.destId}`}
              v={o.status === 'done' ? 'erfüllt' : o.status === 'missed' ? 'verpasst' : `für ${o.partner}`}
              color={o.status === 'missed' ? 'var(--red)' : o.status === 'done' ? 'var(--green)' : 'var(--accent)'} />
          )) : <div className="dnote">Keine Pflichtreisen in dieser Saison.</div>}
          {obligations.some((o) => o.status === 'open') && <button className="dchip mt8" onClick={() => onGoto('trainingslager')}>Zum Trainingslager</button>}
          {coming.length > 0 && <div className="dsec">Kommt in den nächsten Jahren</div>}
          {coming.map((s) => <KV key={s.id} k={s.name} v={`ab ${s.unlock}/${String(s.unlock + 1).slice(2)}`} />)}
          {(com.sponsorLog ?? []).length > 0 && <div className="dsec">Zuletzt</div>}
          {(com.sponsorLog ?? []).slice(0, 4).map((l, i) => <div key={i} className="dnote">{l.date.split('-').reverse().join('.')} · {l.text}</div>)}
        </DashBox>
      )}

      {talk && <NegotiateModal g={g} offerId={talk} onClose={() => setTalk(null)} onChange={onChange} />}
    </DashPage>
  );
}
