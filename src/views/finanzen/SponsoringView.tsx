import Icon, { type IconName } from '../../components/Icon';
import { economyScale, yearOf } from '../../engine/economy';
import { computeMonthly } from '../../engine/finances';
import { Game, offerToContract } from '../../game/state';
import { Screen } from '../../shell/navigation';
import { SponsorContract, SponsorOffer } from '../../types';
import { PageHead } from '../../ui/PageHead';
import { fmtDM } from '../../ui/format';

// --- SPONSORING -------------------------------------------------------------
export function SponsoringView({ g, onGoto, onChange }: { g: Game; onGoto: (s: Screen) => void; onChange: () => void }) {
  const myClub = g.clubs[g.managedClubId];
  const m = computeMonthly(myClub, g.players, g.table);
  const scale = economyScale(yearOf(g.calendar.currentDate));
  const com = myClub.commerce ?? (myClub.commerce = { cateringMode: 'verpachtung' });

  const signShirt = (o: SponsorOffer) => {
    com.shirtSponsor = offerToContract(o);
    com.shirtOffers = [];
    onChange();
  };
  const signBanden = (o: SponsorOffer) => {
    com.banden = offerToContract(o);
    com.bandenOffers = [];
    onChange();
  };

  const ContractCard = ({
    title, icon, contract, monthly, offers, onSign, kind,
  }: {
    title: string; icon: IconName; contract?: SponsorContract; monthly: number;
    offers?: SponsorOffer[]; onSign: (o: SponsorOffer) => void; kind: string;
  }) => (
    <div className="card">
      <div className="card-title"><span className="ico"><Icon name={icon} /></span> {title}</div>
      {contract ? (
        <>
          <div className="row mt8"><span className="dim">Partner</span><b>{contract.name}</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Jahreswert</span><b className="green">{fmtDM(contract.annualValue * scale)}</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Monatsrate</span><b className="green">{fmtDM(monthly)}</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Restlaufzeit</span><b>{contract.yearsLeft} {contract.yearsLeft === 1 ? 'Saison' : 'Saisons'}</b></div>
        </>
      ) : (
        <div className="pill mt8" style={{ display: 'inline-block', background: 'rgba(255,120,80,0.15)', color: 'var(--orange)' }}>
          Kein laufender Vertrag – wähle ein Angebot!
        </div>
      )}
      {offers && offers.length > 0 && (
        <div className="mt12">
          <div className="dim mini" style={{ marginBottom: 6 }}>Angebote dieser Saison ({kind}):</div>
          {offers.map((o, i) => (
            <div key={`${o.name}-${i}`} className="row" style={{ padding: '6px 0', borderTop: '1px solid var(--line)' }}>
              <span style={{ flex: 1 }}>
                <b>{o.name}</b>
                <span className="dim2 mini"> · {fmtDM(o.annualValue * scale)}/Jahr · {o.years} {o.years === 1 ? 'Saison' : 'Saisons'}</span>
              </span>
              <button className="btn-sm btn-primary" onClick={() => onSign(o)}>Unterschreiben</button>
            </div>
          ))}
        </div>
      )}
      {(!offers || offers.length === 0) && !contract && (
        <div className="dim2 mini mt8">Neue Angebote erscheinen zum Saisonwechsel.</div>
      )}
    </div>
  );

  return (
    <div className="page">
      <PageHead icon="sponsoring" title={<>Sponsoring — <span className="accent">{myClub.name}</span></>} />
      <div className="dash-grid">
        <ContractCard
          title="Trikotsponsor" icon="sponsoring" contract={com.shirtSponsor} monthly={m.sponsorship}
          offers={com.shirtOffers} onSign={signShirt} kind="Trikot"
        />
        <ContractCard
          title="Bandenwerbung" icon="marketing" contract={com.banden} monthly={m.advertising}
          offers={com.bandenOffers} onSign={signBanden} kind="Banden"
        />
      </div>
      <div className="card mt16" style={{ maxWidth: 720 }}>
        <div className="card-title"><span className="ico"><Icon name="finances" /></span> Sponsoring-Einnahmen (Monat)</div>
        <div className="row mt8"><span className="dim">Trikotsponsoring</span><b className="green">{fmtDM(m.sponsorship)}</b></div>
        <div className="row" style={{ padding: '6px 0' }}><span className="dim">Bandenwerbung</span><b className="green">{fmtDM(m.advertising)}</b></div>
        <div className="row" style={{ padding: '6px 0' }}><span className="dim">Vereinsansehen</span><b>{myClub.reputation}</b></div>
        <div className="dim mt12" style={{ lineHeight: 1.6 }}>
          Trikot- und Bandenwerte richten sich nach Ansehen, Stadionkapazität und Tabellenlage.
          Höhere Reputation bringt bessere Angebote zum Saisonwechsel.
        </div>
        <button className="btn-sm btn-ghost mt16" onClick={() => onGoto('marketing')}>Zum Marketing →</button>
      </div>
    </div>
  );
}
