// =============================================================================
// Reiter „Wünsche“: Charakter, Karrierephase, was ihm wichtig ist, Interesse
// an deinem Verein bzw. Bindung (eigene Spieler), Gehaltsvorstellung.
// Liest das laufende Spiel über den Vereinsprofil-Kontext (ClubProfileApi.game).
// =============================================================================
import { useClubProfile } from '../club/ClubLink';
import { careerPhase, PHASE_LABEL, personaOf, personaTitle } from '../../engine/persona';
import { CLAUSE_FROM, stanceFrom } from '../../engine/transferMarket';
import { isLeagueClub } from '../../engine/clubEconomy';
import { homeRegionOf, rivalsOf, wishesFor, yearsAtClub } from '../../game/playerWishesGame';
import { scoutKnowledge, talkFor } from '../../game/transferTalks';
import { Player } from '../../types';
import { fmtPrice } from '../../ui/format';
import Icon from '../Icon';
import { Line, Section } from './shared';
import { InterestLight, ReasonList, TraitBands, WishList } from './WishesParts';

const pct = (x: number) => `${Math.round(Math.abs(x) * 100)} %`;

export default function WishesTab({ p }: { p: Player }) {
  const g = useClubProfile()?.game;
  if (!g) return <div className="pp-grid"><Section title="Wünsche" icon={<Icon name="watchlist" size={15} />}><div className="dnote">Nur im laufenden Spiel verfügbar.</div></Section></div>;
  const own = g.clubs[g.managedClubId];
  const mine = p.clubId === own.id;
  const pe = personaOf(p);
  const k = scoutKnowledge(g, p);
  const home = homeRegionOf(g, p);
  const homeClub = pe.homeClubId ? (g.clubs[pe.homeClubId]?.name ?? g.simClubs?.[pe.homeClubId]?.name) : undefined;
  const rivalId = p.clubId && g.clubs[p.clubId] ? rivalsOf(g, p.clubId)[0] : undefined;
  const talk = talkFor(g, p.id);
  const w = !mine && g.clubs[p.clubId] ? wishesFor(g, p, own, { freeAgent: !!talk?.freeAgent }) : null;
  const st = w ? stanceFrom(w.appeal, w.demand, w.promises) : null;
  const known = mine || k >= 0.55 || (talk?.pRound ?? 0) >= 1;
  const promiseList = w?.promises ?? wishesFor(g, p, own).promises;

  // Eigene Spieler: Wie groß ist die Wechselgefahr? (reizvollster anderer Ligaverein)
  let tempter: { name: string; score: number } | null = null;
  if (mine) {
    for (const c of Object.values(g.clubs)) {
      if (!isLeagueClub(c) || c.id === own.id || c.reputation < own.reputation - 2) continue;
      const s = wishesFor(g, p, c).appeal;
      if (!s.dealBreaker && (!tempter || s.score > tempter.score)) tempter = { name: c.name, score: s.score };
    }
  }
  const sat = Math.round(p.contract.satisfaction ?? 60);
  const tScore = tempter?.score ?? 0;
  const risk = sat < 45 || (tScore >= 62 && sat < 70) ? 'hoch' : sat < 55 || tScore >= 56 ? 'mittel' : 'gering';
  const year = Number(g.calendar.currentDate.slice(0, 4));
  const c = p.contract;
  const clauses = [
    c.releaseClause && `Ausstiegsklausel ${fmtPrice(c.releaseClause)}`, c.loyaltyBonus && `Treueprämie ${fmtPrice(c.loyaltyBonus)}`,
    c.successRaise && `+${Math.round(c.successRaise * 100)} % bei Europapokal`, c.noRivalSale && 'kein Verkauf an Rivalen',
    c.buyBack && `Rückkaufoption ${g.clubs[c.buyBack.clubId]?.shortName ?? ''} ${fmtPrice(c.buyBack.fee)}`,
    p.loan && `Leihe bis ${p.loan.until.slice(0, 4)}, Kaufoption ${fmtPrice(p.loan.optionFee)}`,
  ].filter(Boolean) as string[];

  return (
    <div className="pp-grid pp-grid-wishes">
      <Section title="Charakter" icon={<Icon name="squad" size={15} />} right={mine ? 'bekannt' : k >= 0.6 ? 'gut gescoutet' : k >= 0.35 ? 'grob bekannt' : 'kaum bekannt'}>
        <div className="wish-title">{k >= 0.35 || mine ? personaTitle(pe) : 'Unbekannter Typ'}</div>
        <div className="dnote">{PHASE_LABEL[careerPhase(p)]}</div>
        <TraitBands pe={pe} knowledge={k} seed={p.id} />
        {!mine && <div className="dnote mt8">Spannen statt Werte: Je besser dein Scouting (und je länger ihr verhandelt), desto genauer das Bild.</div>}
      </Section>

      <Section title="Was ihm wichtig ist" icon={<Icon name="watchlist" size={15} />}>
        <div className="pp-list">
          <Line label="Heimat" value={home || (p.nationality !== 'GER' ? `Ausland (${p.nationality})` : 'ohne feste Heimat')} />
          {homeClub && <Line label="Jugendverein" value={homeClub} />}
          <Line label="Im Verein seit" value={`${Math.max(1, Math.round(yearsAtClub(p, g.calendar.currentDate)))} Jahr${Math.round(yearsAtClub(p, g.calendar.currentDate)) > 1 ? 'en' : ''}`} />
          <Line label="Vertrag bis" value={`30.06.${p.contract.expiryDate.slice(0, 4)}`} />
          {rivalId && <Line label="Erzrivale seines Vereins" value={g.clubs[rivalId]?.name ?? '—'} />}
        </div>
        <div className="pp-section-title mt14">Wünsche</div>
        <WishList wishes={promiseList} known={known} />
        {known && <div className="dnote mt8">Diese Punkte kannst du in der Verhandlung als Versprechen anbieten. Gebrochene Versprechen kosten Zufriedenheit, Kabinenfrieden und Glaubwürdigkeit.</div>}
        {mine && <>
          <div className="pp-section-title mt14">Vertragsklauseln</div>
          {clauses.length ? <ul className="pp-bullets">{clauses.map((x) => <li key={x}>{x}</li>)}</ul> : <div className="dnote">Keine Sonderklauseln.</div>}
        </>}
      </Section>

      {mine ? (
        <Section title="Bindung an den Verein" icon={<Icon name="contracts" size={15} />}>
          <div className="pp-list">
            <Line label="Zufriedenheit" value={`${sat} / 100`} color={sat >= 60 ? 'var(--green)' : sat >= 45 ? 'var(--yellow)' : 'var(--red)'} strong />
            <Line label="Wechselgefahr" value={risk} color={risk === 'hoch' ? 'var(--red)' : risk === 'mittel' ? 'var(--yellow)' : 'var(--green)'} />
            {tempter && risk !== 'gering' && <Line label="Reizvollster Verein" value={tempter.name} />}
            <Line label="Offene Versprechen" value={(p.promises ?? []).filter((x) => !x.result).length || 'keine'} />
          </div>
          <div className="dnote mt8">Ehrgeizige, wenig loyale Spieler werden von größeren Vereinen gelockt. Wer sich wohlfühlt und loyal ist, verlängert eher – und manchmal zu besseren Bedingungen für dich.</div>
        </Section>
      ) : st && w ? (
        <Section title={`Interesse an ${own.shortName}`} icon={<Icon name="transfers" size={15} />}>
          {st.dealBreaker && k >= 0.35 ? <div className="wish-block">{st.dealBreaker}</div> : <InterestLight score={st.interest} knowledge={k} />}
          <ReasonList reasons={w.appeal.factors} knowledge={k} />
          <div className="pp-section-title mt14">Gehaltsvorstellung</div>
          <div className="pp-list">
            <Line label="Marktgehalt bei dir" value={`${fmtPrice(st.market)} / Woche`} />
            <Line label={st.agent ? 'Forderung des Beraters' : 'Seine Forderung'} value={k >= 0.35 ? `${fmtPrice(st.agentWage)} / Woche` : '—'} />
            <Line label="Bereitschaft" value={k < 0.5 ? 'unbekannt' : st.cut > 0.04 ? `würde etwa ${pct(st.cut)} verzichten` : st.cut < -0.04 ? `verlangt etwa ${pct(st.cut)} Aufschlag` : 'keine Abstriche'}
              color={k < 0.5 ? undefined : st.cut > 0.04 ? 'var(--green)' : st.cut < -0.04 ? 'var(--orange)' : undefined} />
            <Line label="Berater" value={st.agent ? `ja – Provision etwa ${fmtPrice(st.agentFee)}` : 'nein, verhandelt selbst'} />
            {st.signingFee > 0 && <Line label="Handgeld erwartet" value={`etwa ${fmtPrice(st.signingFee)}`} />}
            <Line label="Wunschlaufzeit" value={`${st.years[0]}–${st.years[1]} Jahre`} />
          </div>
          {year < CLAUSE_FROM.releaseClause && <div className="dnote mt8">Ausstiegsklauseln sind erst ab {CLAUSE_FROM.releaseClause} üblich.</div>}
        </Section>
      ) : <Section title="Interesse" icon={<Icon name="transfers" size={15} />}><div className="dnote">Für diesen Spieler fehlen Daten.</div></Section>}
    </div>
  );
}
