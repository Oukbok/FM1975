import { type IconName } from '../../components/Icon';
import { economyScale, revenueScale, yearOf } from '../../engine/economy';
import { computeMonthly } from '../../engine/finances';
import { commercialMultiplier, ensureBrand, internationalWeight } from '../../engine/clubEconomy';
import { Game, offerToContract } from '../../game/state';
import { Screen } from '../../shell/navigation';
import { SponsorContract, SponsorOffer } from '../../types';
import { DashBox, DashPage, Empty, KV, Kpi, Meter } from '../../ui/DashPage';
import { fmtDM } from '../../ui/format';
import { tableRow } from '../shared';

// =============================================================================
// SPONSORING — Verträge, Angebote, Einnahmen und Werbewert-Faktoren
// =============================================================================
export function SponsoringView({ g, onGoto, onChange }: { g: Game; onGoto: (s: Screen) => void; onChange: () => void }) {
  const myClub = g.clubs[g.managedClubId];
  const year = yearOf(g.calendar.currentDate);
  const scale = economyScale(year);
  const m = computeMonthly(myClub, g.players, g.table, scale, year);
  const brand = ensureBrand(myClub);
  const commMult = commercialMultiplier(myClub, year);
  const intW = internationalWeight(year);
  // Vertragswerte (1975-Basis) wachsen mit dem Vermarktungsmarkt und der Marke.
  const commScale = revenueScale('commercial', year) * commMult;
  void scale;
  const com = myClub.commerce ?? (myClub.commerce = { cateringMode: 'verpachtung' });
  const row = tableRow(g);

  const signShirt = (o: SponsorOffer) => { com.shirtSponsor = offerToContract(o); com.shirtOffers = []; onChange(); };
  const signBanden = (o: SponsorOffer) => { com.banden = offerToContract(o); com.bandenOffers = []; onChange(); };

  const Contract = ({ title, icon, contract, monthly }: { title: string; icon: IconName; contract?: SponsorContract; monthly: number }) => (
    <DashBox title={title} icon={icon} right={contract ? `${contract.yearsLeft} ${contract.yearsLeft === 1 ? 'Saison' : 'Saisons'}` : 'kein Vertrag'}>
      {contract ? <>
        <div className="dkpis">
          <Kpi value={fmtDM(contract.annualValue * commScale)} label="pro Jahr" />
          <Kpi value={fmtDM(monthly)} label="pro Monat" color="var(--green)" />
        </div>
        <KV k="Partner" v={contract.name} strong />
        <KV k="Restlaufzeit" v={`${contract.yearsLeft} ${contract.yearsLeft === 1 ? 'Saison' : 'Saisons'}`} />
      </> : <Empty icon={icon}>Kein laufender Vertrag – wähle unten ein Angebot.</Empty>}
    </DashBox>
  );

  const Offers = ({ title, icon, offers, onSign }: { title: string; icon: IconName; offers?: SponsorOffer[]; onSign: (o: SponsorOffer) => void }) => (
    <DashBox title={title} icon={icon} right={offers?.length ? `${offers.length} Angebote` : undefined}>
      {offers && offers.length ? offers.map((o, i) => (
        <div key={`${o.name}-${i}`} className="dlist-row">
          <span className="grow"><b>{o.name}</b><span className="dnote" style={{ display: 'block' }}>{fmtDM(o.annualValue * commScale)} pro Jahr · {o.years} {o.years === 1 ? 'Saison' : 'Saisons'}</span></span>
          <button className="dchip on" onClick={() => onSign(o)}>Unterschreiben</button>
        </div>
      )) : <Empty icon={icon}>Neue Angebote kommen zum Saisonwechsel oder wenn ein Vertrag ausläuft.</Empty>}
    </DashBox>
  );

  return (
    <DashPage>
      <Contract title="Trikotsponsor" icon="sponsoring" contract={com.shirtSponsor} monthly={m.sponsorship} />
      <Contract title="Bandenwerbung" icon="marketing" contract={com.banden} monthly={m.advertising} />

      <DashBox title="Sponsoring-Einnahmen" icon="finances">
        <div className="dkpis">
          <Kpi value={fmtDM(m.sponsorship + m.advertising)} label="pro Monat" color="var(--green)" />
          <Kpi value={fmtDM((m.sponsorship + m.advertising) * 12)} label="pro Jahr" />
        </div>
        <KV k="Trikotsponsoring / Monat" v={fmtDM(m.sponsorship)} />
        <KV k="Bandenwerbung / Monat" v={fmtDM(m.advertising)} />
        <button className="dchip mt8" onClick={() => onGoto('marketing')}>Zum Marketing</button>
      </DashBox>

      <Offers title="Angebote Trikot" icon="sponsoring" offers={com.shirtOffers} onSign={signShirt} />
      <Offers title="Angebote Banden" icon="marketing" offers={com.bandenOffers} onSign={signBanden} />

      <DashBox title="Marke & Vermarktung" icon="stats" right={`Faktor ${commMult.toFixed(2)}`}>
        <Meter label="Regional" value={brand.regional} text={Math.round(brand.regional)} />
        <Meter label="National" value={brand.national} text={Math.round(brand.national)} />
        <Meter label="International" value={brand.international} text={Math.round(brand.international)} />
        <KV k="Vermarktung & Hospitality / Jahr" v={fmtDM(myClub.finances.commercialAnnual ?? 0)} />
        <KV k="TV-Gelder / Jahr" v={fmtDM(myClub.finances.tvAnnual ?? 0)} />
        <KV k="Ansehen · Tabellenplatz" v={`${myClub.reputation} · ${row ? `${row.position}.` : '–'}`} />
        <div className="dnote mt8">Die Marke wächst mit Titeln und Europapokal-Erfolgen und vervielfacht Sponsoring, Fanartikel und Vermarktung. Internationale Bekanntheit zählt heute {Math.round(intW * 100)} % – Tendenz steigend.</div>
      </DashBox>
    </DashPage>
  );
}
