// =============================================================================
// Sponsoring — Karteikarte (Linksklick): Vertrag, Angebot, freie oder gesperrte
// Fläche, Namensrechte, Tribüne. Alle Aktionen der Seite sind hier erreichbar.
// =============================================================================
import { useState, type ReactNode } from 'react';
import { campDestination } from '../../../data/campDestinations';
import { COUNTRY_BY_ID, INDUSTRY_BY_ID, SLOT_BY_ID } from '../../../data/sponsorCatalog';
import { LOGE_GUESTS, STAND } from '../../../data/seatingCatalog';
import { namingAnnualNominal, NAMING_RIGHTS_YEAR } from '../../../engine/clubBusiness';
import { rawStandCaps } from '../../../engine/seating';
import { slotMarketValue } from '../../../engine/sponsorship';
import { currentNamingOffers } from '../../../game/clubBusiness';
import { exerciseOption, rejectSponsorOffer, signSponsorOffer, terminateDeal, terminationCost } from '../../../game/sponsorGame';
import type { Game } from '../../../game/state';
import type { Screen } from '../../../shell/navigation';
import type { StandId } from '../../../types';
import type { SponsorDeal, SponsorDealOffer } from '../../../types/sponsor';
import { KV } from '../../../ui/DashPage';
import Select from '../../../ui/Select';
import { MAX_LEGENDS, STAND_SPONSOR_YEAR, acceptStandOffer, appointLegend, legendCandidates, nameStandAfterLegend, resetStandName, standAnnualNominal, standLabel, standOffers } from '../../../game/standNames';
import { fmtDM } from '../../../ui/format';
import { SponsorLogo } from './SponsorLogo';
import { ClauseList, bonusText, yearly } from './parts';
import { namingIndustry, spContext, untilSeason, yearsText, type SpTarget } from './model';

const fmtD = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;

function Frame({ logo, kicker, title, sub, children, actions, onClose }: {
  logo?: ReactNode; kicker: string; title: string; sub?: string; children: ReactNode; actions?: ReactNode; onClose: () => void;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal sp3-card" role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}>
        <div className="sp3-card-head">
          {logo && <div className="sp3-card-logo">{logo}</div>}
          <div className="sp3-card-title">
            <div className="sp3-kicker">{kicker}</div>
            <h2>{title}</h2>
            {sub && <div className="sp3-card-sub">{sub}</div>}
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Schließen" autoFocus>×</button>
        </div>
        <div className="sp3-card-body">{children}</div>
        {actions && <div className="sp3-card-foot">{actions}</div>}
      </div>
    </div>
  );
}

const meta = (x: SponsorDeal | SponsorDealOffer) => {
  const ind = INDUSTRY_BY_ID[x.industry]?.name ?? x.industry;
  return `${ind} · ${COUNTRY_BY_ID[x.country]?.name ?? x.country}`;
};

export function SponsorCard({ g, t, onClose, onOpen, onTalk, onAct, onNaming, onGoto }: {
  g: Game; t: SpTarget; onClose: () => void; onOpen: (t: SpTarget) => void; onTalk: (offerId: string) => void;
  onAct: (err: string | null) => void; onNaming: (idx: number) => void; onGoto: (s: Screen) => void;
}) {
  const ctx = spContext(g);
  const { club, year, tier } = ctx;
  const [confirm, setConfirm] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const done = (e: string | null, close = true) => { onAct(e); if (e) setErr(e); else if (close) onClose(); };

  if (t.kind === 'deal') {
    const d = ctx.deals.find((x) => x.id === t.id);
    if (!d) return <Frame kicker="Vertrag" title="Vertrag beendet" onClose={onClose}><div className="dnote">Dieser Vertrag besteht nicht mehr.</div></Frame>;
    const def = SLOT_BY_ID[d.slot];
    const obligations = (club.commerce?.campObligations ?? []).filter((o) => o.dealId === d.id);
    const renew = ctx.offers.find((o) => o.renewal && o.partner === d.partner);
    const canOpt = d.clauses.some((k) => k.kind === 'option') && d.yearsLeft <= 1;
    const cost = terminationCost(g, d);
    return (
      <Frame logo={<SponsorLogo name={d.partner} industry={d.industry} year={Number(d.since.slice(0, 4))} />} kicker={def.name} title={d.partner} sub={meta(d)} onClose={onClose}
        actions={<>
          {canOpt && <button className="btn btn-primary" onClick={() => done(exerciseOption(g, d.id), false)}>Option ziehen</button>}
          {renew && <button className="btn" onClick={() => onOpen({ kind: 'offer', id: renew.id })}>Verlängerungsangebot</button>}
          {confirm
            ? <><span className="sp3-confirm">Ablöse {fmtDM(cost)} zahlen?</span>
              <button className="btn btn-danger" onClick={() => done(terminateDeal(g, d.id))}>Ja, auflösen</button>
              <button className="btn" onClick={() => setConfirm(false)}>Nein</button></>
            : <button className="btn" onClick={() => setConfirm(true)}>Vertrag auflösen</button>}
        </>}>
        {err && <div className="sp-warn">{err}</div>}
        <div className="sp3-card-grid">
          <div>
            <KV k="Jahreswert" v={fmtDM(yearly(d.annualValue, year, d.cut))} strong />
            {d.cut ? <KV k="Kürzung durch Klauseln" v={`−${Math.round(d.cut * 100)} %`} color="var(--orange)" /> : null}
            <KV k="Laufzeit" v={`${yearsText(d.yearsTotal)} · seit ${d.since}`} />
            <KV k="Endet nach der Saison" v={untilSeason(g.season, d.yearsLeft)} color={d.yearsLeft <= 1 ? 'var(--orange)' : undefined} />
            {bonusText(d.bonuses, year) && <KV k="Erfolgsprämien" v={bonusText(d.bonuses, year)} />}
            {d.next && <KV k="Ab nächster Saison" v={fmtDM(yearly(d.next.annualValue, year))} />}
            {d.legacy && <div className="dnote mt8">Aus einem älteren Spielstand übernommen.</div>}
          </div>
          <div>
            <div className="dsec">Klauseln</div>
            <ClauseList clauses={d.clauses} />
            {obligations.length > 0 && <div className="dsec">Pflichtreisen</div>}
            {obligations.map((o, i) => (
              <KV key={i} k={`${o.season} · ${campDestination(o.destId)?.name ?? o.destId}`}
                v={o.status === 'done' ? 'erfüllt' : o.status === 'missed' ? 'verpasst' : 'offen'}
                color={o.status === 'missed' ? 'var(--red)' : o.status === 'done' ? 'var(--green)' : undefined} />
            ))}
            {obligations.some((o) => o.status === 'open') && <button className="dchip mt8" onClick={() => onGoto('trainingslager')}>Zum Trainingslager</button>}
          </div>
        </div>
        <div className="dnote mt8">Auflösen kostet den halben Restwert als Ablöse. Danach melden sich neue Interessenten für die Fläche.</div>
      </Frame>
    );
  }

  if (t.kind === 'offer') {
    const o = ctx.offers.find((x) => x.id === t.id);
    if (!o) return <Frame kicker="Angebot" title="Angebot nicht mehr gültig" onClose={onClose}><div className="dnote">Das Angebot liegt nicht mehr vor.</div></Frame>;
    const def = SLOT_BY_ID[o.slot];
    const mood = o.interest >= 0.7 ? 'sehr interessiert' : o.interest >= 0.5 ? 'interessiert' : 'zurückhaltend';
    return (
      <Frame logo={<SponsorLogo name={o.partner} industry={o.industry} year={year} />} kicker={`${o.renewal ? 'Verlängerung' : 'Angebot'} · ${def.name}`} title={o.partner} sub={meta(o)} onClose={onClose}
        actions={<>
          <button className="btn btn-primary" onClick={() => done(signSponsorOffer(g, o.id))}>Annehmen</button>
          <button className="btn" onClick={() => { onTalk(o.id); onClose(); }}>Verhandeln</button>
          <button className="btn" onClick={() => { rejectSponsorOffer(g, o.id); done(null); }}>Ablehnen</button>
        </>}>
        {err && <div className="sp-warn">{err}</div>}
        <div className="sp3-card-grid">
          <div>
            <KV k="Jahreswert" v={fmtDM(yearly(o.annualValue, year))} strong />
            <KV k="Laufzeit" v={`${yearsText(o.years)}${o.renewal ? ' (ab nächster Saison)' : ''}`} />
            <KV k="Gültig bis" v={fmtD(o.until)} />
            <KV k="Sponsor" v={mood} />
            {bonusText(o.bonuses, year) && <KV k="Erfolgsprämien" v={bonusText(o.bonuses, year)} />}
            {o.rounds > 0 && <KV k="Verhandlungsrunden" v={`${o.rounds} von 2`} />}
          </div>
          <div>
            <div className="dsec">Klauseln</div>
            <ClauseList clauses={o.clauses} />
            {o.reply && <div className="sp-reply mt8">„{o.reply}“</div>}
          </div>
        </div>
        <div className="dnote mt8">{def.desc}</div>
      </Frame>
    );
  }

  if (t.kind === 'free' || t.kind === 'locked') {
    const def = SLOT_BY_ID[t.slot];
    const offers = ctx.offers.filter((o) => o.slot === t.slot && !o.renewal);
    const market = t.kind === 'free' ? slotMarketValue(club, t.slot, year, tier) : 0;
    return (
      <Frame kicker={t.kind === 'free' ? 'Freie Werbefläche' : 'Noch nicht vermarktbar'} title={def.name} sub={`Laufzeiten ${def.years[0]}–${def.years[1]} Jahre`} onClose={onClose}>
        <div className="dnote">{def.desc}</div>
        {t.kind === 'locked'
          ? <KV k="Vermarktbar" v={def.unlock > year ? `ab Saison ${def.unlock}/${String(def.unlock + 1).slice(2)}` : 'nicht in deiner Liga bzw. Epoche'} />
          : <KV k="Marktwert (Richtwert)" v={`≈ ${fmtDM(market)} pro Jahr`} />}
        {t.kind === 'free' && <div className="dsec">Angebote</div>}
        {t.kind === 'free' && (offers.length ? offers.map((o) => (
          <div key={o.id} className="sp3-mini">
            <SponsorLogo name={o.partner} industry={o.industry} year={year} variant="mark" className="sp3-mini-logo" />
            <button className="sp3-mini-name" onClick={() => onOpen({ kind: 'offer', id: o.id })}><b>{o.partner}</b><span>{meta(o)} · {yearsText(o.years)}</span></button>
            <b className="sp3-mini-val">{fmtDM(yearly(o.annualValue, year))}</b>
            <button className="dchip on" onClick={() => done(signSponsorOffer(g, o.id))}>Annehmen</button>
            <button className="dchip" onClick={() => { onTalk(o.id); onClose(); }}>Verhandeln</button>
          </div>
        )) : <div className="dnote">Im Moment kein Angebot. Interessenten melden sich zum Saisonwechsel und im Lauf der Saison.</div>)}
        {err && <div className="sp-warn">{err}</div>}
      </Frame>
    );
  }

  if (t.kind === 'naming' || t.kind === 'namingOffer') {
    const offers = currentNamingOffers(g);
    const nr = club.namingRights;
    const o = t.kind === 'namingOffer' ? offers[t.idx] : null;
    if (o) {
      const renewal = nr?.sponsor === o.sponsor;
      return (
        <Frame logo={<SponsorLogo name={o.sponsor} industry={namingIndustry(o.sponsor)} year={year} />} kicker={renewal ? 'Namensrechte · Verlängerung' : 'Namensrechte · Angebot'} title={o.sponsor} sub={`Neuer Name: ${o.arenaName}`} onClose={onClose}
          actions={confirm
            ? <><span className="sp3-confirm">{renewal ? 'Verlängern?' : 'Stadion umbenennen?'}</span>
              <button className="btn btn-primary" onClick={() => { onNaming(t.kind === 'namingOffer' ? t.idx : 0); setConfirm(false); }}>Ja, unterschreiben</button>
              <button className="btn" onClick={() => setConfirm(false)}>Nein</button></>
            : <button className="btn btn-primary" onClick={() => setConfirm(true)}>Namensrechte verkaufen</button>}>
          <KV k="Jahreswert" v={fmtDM(namingAnnualNominal(o, club, year))} strong />
          <KV k="Laufzeit" v={`${o.fromYear} bis 30.06.${o.untilYear}`} />
          <KV k="Stadion heißt dann" v={o.arenaName} />
          {!renewal && <div className="dnote mt8">Traditionsbewusste Fans nehmen einen Kunstnamen übel – je nach Vereinsphilosophie sinkt die Fan-Stimmung einmalig.</div>}
        </Frame>
      );
    }
    return (
      <Frame logo={nr ? <SponsorLogo name={nr.sponsor} industry={namingIndustry(nr.sponsor)} year={nr.fromYear} /> : undefined} kicker="Namensrechte am Stadion" title={club.stadium.name}
        sub={nr ? `Partner ${nr.sponsor}` : club.stadium.baseName && club.stadium.baseName !== club.stadium.name ? `früher ${club.stadium.baseName}` : undefined} onClose={onClose}>
        {nr ? <>
          <KV k="Jahreswert" v={fmtDM(namingAnnualNominal(nr, club, year))} strong />
          <KV k="Laufzeit" v={`${nr.fromYear} bis 30.06.${nr.untilYear}`} />
        </> : <div className="dnote">{year < NAMING_RIGHTS_YEAR
          ? 'Stadionnamen werden in dieser Epoche noch nicht verkauft. In Deutschland kam das erst um 2000 auf (Hamburg 2001 als einer der ersten Vereine). Ab 2000 melden sich Interessenten.'
          : 'Der Stadionname ist frei. Interessenten findest du unten.'}</div>}
        {offers.length > 0 && <div className="dsec">Angebote</div>}
        {offers.map((x, i) => (
          <div key={x.sponsor + i} className="sp3-mini">
            <SponsorLogo name={x.sponsor} industry={namingIndustry(x.sponsor)} year={year} variant="mark" className="sp3-mini-logo" />
            <button className="sp3-mini-name" onClick={() => onOpen({ kind: 'namingOffer', idx: i })}><b>{x.sponsor}</b><span>{x.arenaName} · bis {x.untilYear}</span></button>
            <b className="sp3-mini-val">{fmtDM(namingAnnualNominal(x, club, year))}</b>
            <button className="dchip" onClick={() => onOpen({ kind: 'namingOffer', idx: i })}>Ansehen</button>
          </div>
        ))}
      </Frame>
    );
  }

  // Tribüne: Name (Vereinslegende oder Sponsor), Angebote, Legenden ernennen (game/standNames.ts)
  return <StandCard g={g} id={(t as { id: StandId }).id} onClose={onClose} onAct={done} onGoto={onGoto} />;
}

function StandCard({ g, id, onClose, onAct, onGoto }: { g: Game; id: StandId; onClose: () => void; onAct: (e: string | null, close?: boolean) => void; onGoto: (s: Screen) => void }) {
  const ctx = spContext(g);
  const { club, year } = ctx;
  const [pick, setPick] = useState('');
  const [, setTick] = useState(0);
  const st = STAND[id];
  const caps = rawStandCaps(club)?.[st.id];
  const persons = caps ? Object.entries(caps).reduce((a, [k, v]) => a + (k === 'loge' ? v * LOGE_GUESTS : v), 0) : 0;
  const cur = club.standNames?.[id];
  const offers = standOffers(g, id);
  const legends = club.clubLegends ?? [];
  const usedLegend = new Set(Object.values(club.standNames ?? {}).filter((n) => n?.kind === 'legend').map((n) => (n as { legendId: string }).legendId));
  const cands = legendCandidates(g);
  const act = (e: string | null) => { onAct(e, false); setTick((x) => x + 1); };
  return (
    <Frame kicker={`Tribüne · ${st.sub}${persons ? ` · ${persons.toLocaleString('de-DE')} Plätze` : ''}`} title={standLabel(club, id)}
      sub={cur ? (cur.kind === 'legend' ? `benannt nach Vereinslegende · seit ${fmtD(cur.since)}` : `Namensrechte ${cur.sponsor} · bis 30.06.${cur.untilYear}`) : st.name}
      onClose={onClose}
      actions={<>
        {cur && <button className="btn" onClick={() => { resetStandName(g, id); act(null); }}>Wieder „{st.name}“</button>}
        <button className="btn" onClick={() => { onGoto('kartenverkauf'); onClose(); }}>Zum Kartenverkauf</button>
      </>}>
      {cur?.kind === 'sponsor' && <KV k="Jahreswert" v={fmtDM(standAnnualNominal(cur, club, year))} strong />}
      <div className="dsec">Nach einer Vereinslegende benennen</div>
      {legends.length ? (
        <div className="sp3-mini-row">
          <Select size="s" width={300} value={pick} placeholder="Legende wählen …" onChange={setPick}
            options={legends.map((l) => ({ value: l.id, label: `${l.name} · ${l.apps} Spiele`, disabled: usedLegend.has(l.id) }))} />
          <button className="dchip on" disabled={!pick} onClick={() => act(nameStandAfterLegend(g, id, pick))}>Benennen</button>
        </div>
      ) : <div className="dnote">Noch keine Vereinslegende ernannt – Kandidaten stehen unten.</div>}
      <div className="dnote">Bringt kein Geld, aber die Fans sind stolz darauf: Die Stimmung steigt sofort und bleibt dauerhaft etwas höher – das zieht Zuschauer und Mitglieder an.</div>
      <div className="dsec">Angebote für den Tribünennamen</div>
      {offers.length ? offers.map((o, i) => (
        <div key={o.sponsor + i} className="sp3-mini">
          <SponsorLogo name={o.sponsor} industry={namingIndustry(o.sponsor)} year={year} variant="mark" className="sp3-mini-logo" />
          <span className="sp3-mini-name"><b>{o.sponsor}</b><span>„{o.name}“ · bis {o.untilYear}</span></span>
          <b className="sp3-mini-val">{fmtDM(standAnnualNominal(o, club, year))}</b>
          <button className="dchip" onClick={() => act(acceptStandOffer(g, id, i))}>Annehmen</button>
        </div>
      )) : <div className="dnote">{year < STAND_SPONSOR_YEAR ? `Tribünennamen verkauft in dieser Epoche noch niemand – Firmen melden sich ab ${STAND_SPONSOR_YEAR}.` : cur?.kind === 'sponsor' ? 'Der Vertrag läuft noch. Ein Jahr vor dem Ende melden sich Interessenten.' : persons ? 'Im Moment keine Interessenten.' : 'Die Tribüne ist noch nicht ausgebaut.'}</div>}
      {cur?.kind === 'legend' && offers.length > 0 && <div className="sp-warn">Ein Firmenname statt einer Legende empört die Fans.</div>}
      <div className="dsec">Vereinslegenden {legends.length}/{MAX_LEGENDS}</div>
      {legends.map((l) => <div key={l.id} className="sp3-mini sp3-mini-lg"><span className="sp3-mini-name"><b>{l.name}</b><span>{l.apps} Spiele · {l.goals} Tore · ernannt {fmtD(l.since)}</span></span></div>)}
      {cands.length > 0 && legends.length < MAX_LEGENDS && <>
        <div className="dnote mt8">Kandidaten (mindestens 120 Pflichtspiele für den Verein):</div>
        {cands.slice(0, 8).map((c) => (
          <div key={c.id} className="sp3-mini sp3-mini-lg">
            <span className="sp3-mini-name"><b>{c.name}</b><span>{c.apps} Spiele · {c.goals} Tore{c.active ? ' · im Kader' : ''}</span></span>
            <button className="dchip" onClick={() => act(appointLegend(g, c.id))}>Zur Legende ernennen</button>
          </div>
        ))}
      </>}
      {!cands.length && !legends.length && <div className="dnote">Noch hat niemand 120 Pflichtspiele für den Verein bestritten.</div>}
    </Frame>
  );
}
