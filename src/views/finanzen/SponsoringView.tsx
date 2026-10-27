import { type IconName } from '../../components/Icon';
import { economyScale, yearOf } from '../../engine/economy';
import { computeMonthly } from '../../engine/finances';
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
  const m = computeMonthly(myClub, g.players, g.table);
  const scale = economyScale(yearOf(g.calendar.currentDate));
  const com = myClub.commerce ?? (myClub.commerce = { cateringMode: 'verpachtung' });
  const row = tableRow(g);

  const signShirt = (o: SponsorOffer) => { com.shirtSponsor = offerToContract(o); com.shirtOffers = []; onChange(); };
  const signBanden = (o: SponsorOffer) => { com.banden = offerToContract(o); com.bandenOffers = []; onChange(); };

  const Contract = ({ title, icon, contract, monthly }: { title: string; icon: IconName; contract?: SponsorContract; monthly: number }) => (
    <DashBox title={title} icon={icon} right={contract ? `${contract.yearsLeft} ${contract.yearsLeft === 1 ? 'Saison' : 'Saisons'}` : 'kein Vertrag'}>
      {contract ? <>
        <div className="dkpis">
          <Kpi value={fmtDM(contract.annualValue * scale)} label="pro Jahr" />
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
          <span className="grow"><b>{o.name}</b><span className="dnote" style={{ display: 'block' }}>{fmtDM(o.annualValue * scale)} pro Jahr · {o.years} {o.years === 1 ? 'Saison' : 'Saisons'}</span></span>
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

      <DashBox title="Werbewert des Vereins" icon="stats">
        <Meter label="Ansehen" value={myClub.reputation} text={`${myClub.reputation}`} />
        <Meter label="Stadionkapazität" value={myClub.stadium.capacity} max={80000} text={myClub.stadium.capacity.toLocaleString('de-DE')} />
        <Meter label="Tabellenplatz" value={row ? g.table.rows.length + 1 - row.position : 0} max={g.table.rows.length || 1} text={row ? `${row.position}.` : '–'} />
        <div className="dnote mt8">Trikot- und Bandenwerte richten sich nach Ansehen, Stadionkapazität und Tabellenlage. Höheres Ansehen bringt bessere Angebote.</div>
      </DashBox>
    </DashPage>
  );
}
