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
          ? 'Stadionnamen werden in dieser Epoche noch nicht verkauft. In Deutschland kam das erst um 2000 auf (Hamburg 2001: „AOL Arena“). Ab 2000 melden sich Interessenten.'
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

  // Tribüne
  const st = STAND[(t as { id: StandId }).id];
  const caps = rawStandCaps(club)?.[st.id];
  const persons = caps ? Object.entries(caps).reduce((a, [k, v]) => a + (k === 'loge' ? v * LOGE_GUESTS : v), 0) : 0;
  const parts: [string, number][] = caps ? [['Stehplätze', caps.steh], ['Sitzplätze', caps.sitz], ['Überdachte Sitze', caps.dach], ['Premium', caps.premium], ['Business', caps.business], ['Logen', caps.loge]] : [];
  return (
    <Frame kicker={`Tribüne · ${st.sub}`} title={st.name} sub={persons ? `${persons.toLocaleString('de-DE')} Plätze` : 'noch nicht ausgebaut'} onClose={onClose}
      actions={<>
        <button className="btn" onClick={() => { onGoto('kartenverkauf'); onClose(); }}>Zum Kartenverkauf</button>
        <button className="btn" onClick={() => { onGoto('stadium'); onClose(); }}>Zum Stadion</button>
      </>}>
      {parts.filter(([, v]) => v > 0).map(([k, v]) => <KV key={k} k={k} v={v.toLocaleString('de-DE')} />)}
      <div className="dnote mt8">Tribünennamen werden nicht einzeln vermarktet – der Name gehört zum Stadion. Werbung an der Tribüne läuft über die Banden und die Partner der Pyramide.</div>
    </Frame>
  );
}
