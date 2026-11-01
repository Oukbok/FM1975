// =============================================================================
// Sponsoring 2.0 ohne UI: Freischaltjahre, Regulierung, Katar-Klausel nie vor 2011,
// Verträge laufen aus / werden verlängert, Abstiegsklausel, Pflichtreise,
// Verhandlung, Migration alter Spielstände, Werteniveau.   npm run test:sponsor
// =============================================================================
import { createNewGame } from '../src/game/newGame';
import { Game } from '../src/game/state';
import { Club } from '../src/types';
import { SPONSOR_SLOTS, industryBan } from '../src/data/sponsorCatalog';
import { brandFromReputation, ensureBrand } from '../src/engine/clubEconomy';
import { economyScale } from '../src/engine/economy';
import { computeMonthly } from '../src/engine/finances';
import { counterOffer, makeOffers, slotMarketValue, slotsFor, sponsorMonthly } from '../src/engine/sponsorship';
import {
  clubTierNow, migrateSponsorship, monthlySponsoring, signSponsorOffer, sponsorSeasonClose, sponsorSeasonStart,
} from '../src/game/sponsorGame';
import type { SponsorDeal } from '../src/types/sponsor';

let seed = 1975;
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
let fails = 0;
const ok = (c: boolean, msg: string) => { console.log(`${c ? 'OK  ' : 'FEHL'} ${msg}`); if (!c) fails++; };
const E = (v: number) => `${(v / 1.95583 / 1e6).toFixed(1)} Mio. €`;

// --- 1) Freischaltjahre der Werbeflächen -----------------------------------------------
const ids = (y: number, t = 1) => slotsFor(y, t).map((s) => s.id);
ok(ids(1975).join(',') === 'brust,ausruester,banden,regional', `1975: ${ids(1975).join(', ')}`);
ok(ids(1989).every((x) => x !== 'premium') && ids(1990).includes('premium'), 'Premium-Partner ab 1990');
ok(!ids(1994).includes('copartner') && ids(1995).includes('copartner'), 'Co-Partner ab 1995');
ok(!ids(2000).includes('jugend') && ids(2001).includes('jugend'), 'Nachwuchs-Partner ab 2001 (NLZ)');
ok(!ids(2016).includes('aermel') && ids(2017).includes('aermel'), 'Ärmelsponsor ab 2017/18');
ok(!ids(2011).includes('digital') && ids(2012).includes('digital'), 'Digitalpartner ab 2012');
ok(!ids(2020).includes('krypto') && ids(2021).includes('krypto') && ids(2022).includes('krypto') && !ids(2023).includes('krypto'), 'Krypto-Welle nur 2021/22–2022/23');
ok(ids(2005).includes('wetten') && !ids(2006).includes('wetten') && !ids(2011).includes('wetten') && ids(2012).includes('wetten'), 'Wettpartner 2005, Verbot 2006–2011, ab 2012 wieder');
ok(!ids(2020, 4).includes('aermel') && ids(2020, 4).includes('regional'), 'Viertligist: kein Ärmel, aber Regionalpartner');

// --- 2) Regulierung je Branche ---------------------------------------------------------
ok(!!industryBan('tabak', 'brust', 1980) && !industryBan('tabak', 'banden', 1980), 'Tabak 1980: Banden ja, Trikot nein (TV-Verbot 1975)');
ok(!!industryBan('tabak', 'banden', 2008), 'Tabak ab 2007 ganz verboten (EU-Richtlinie)');
ok(!industryBan('spirituosen', 'brust', 1976) && !!industryBan('spirituosen', 'brust', 2005), 'Spirituosen auf der Brust: 1976 ja, 2005 nein');
ok(!!industryBan('wetten', 'brust', 2008) && !industryBan('wetten', 'brust', 2015), 'Wettanbieter 2008 untersagt, 2015 erlaubt');
ok(!!industryBan('telekom', 'brust', 1985) && !industryBan('telekom', 'brust', 1995), 'Telekom ab den 1990ern');

// --- 3) Katar nie vor dem realistischen Jahr (Angebote massenhaft würfeln) -------------
const fake = (rep: number): Club => ({ id: `t${rep}`, reputation: rep, brand: brandFromReputation(rep), stadium: { capacity: 60000 }, finances: {} } as unknown as Club);
let qaEarly = 0, qaLate = 0, qaLow = 0, campQaEarly = 0, campTotal = 0;
for (let y = 1975; y <= 2034; y++) {
  for (const rep of [60, 75, 90, 96]) {
    const c = fake(rep);
    if (rep >= 90) { c.brand!.international = 70; c.brand!.national = 95; }
    for (const s of SPONSOR_SLOTS) {
      for (let k = 0; k < 4; k++) {
        const offers = makeOffers({ club: c, year: y, season: `${y}/${String(y + 1).slice(2)}`, tier: 1, deals: [], until: `${y + 1}-06-30` }, s.id, 3, `x${k}`);
        for (const o of offers) {
          const camp = o.clauses.find((x) => x.kind === 'camp');
          if (camp) campTotal++;
          if (o.country === 'QA') { if (y < 2011) qaEarly++; else qaLate++; }
          if (camp && camp.kind === 'camp' && camp.destId === 'katar') { if (y < 2011) campQaEarly++; if (rep < 82) qaLow++; }
          if (industryBan(o.industry, o.slot, y)) { ok(false, `Angebot trotz Verbot: ${o.partner} ${o.slot} ${y}`); }
        }
      }
    }
  }
}
ok(qaEarly === 0 && campQaEarly === 0, `Keine katarischen Sponsoren/Katar-Klauseln vor 2011 (${qaEarly}/${campQaEarly})`);
ok(qaLate > 0, `Katarische Sponsoren ab 2011: ${qaLate} Angebote`);
ok(qaLow === 0, 'Katar-Pflichtlager nur für Vereine, die Doha buchen dürfen (Ansehen ≥ 82)');
ok(campTotal > 20, `Pflichtreisen kommen vor (${campTotal} Angebote mit Klausel)`);

// --- 4) Werteniveau 2024 ----------------------------------------------------------------
const sumSlots = (c: Club, y: number) => slotsFor(y, 1).reduce((a, s) => a + slotMarketValue(c, s.id, y, 1) * s.count(y, 1), 0);
const med = fake(74), top = fake(95);
top.brand = { regional: 100, national: 100, international: 100 };
ok(sumSlots(med, 2024) > 25e6 * 1.956 && sumSlots(med, 2024) < 60e6 * 1.956, `Sponsoring Median-Erstligist 2024 ≈ ${E(sumSlots(med, 2024))} (Soll 25–60)`);
ok(sumSlots(top, 2024) > 180e6 * 1.956, `Weltmarke 2024 ≈ ${E(sumSlots(top, 2024))} (FC Bayern 2024/25: 240 Mio. €)`);
ok(sumSlots(med, 1975) > 300_000 && sumSlots(med, 1975) < 900_000, `Sponsoring Median 1975 ≈ ${(sumSlots(med, 1975) / 1e6).toFixed(2)} Mio. DM`);

// --- 5) Verhandlung ---------------------------------------------------------------------
const base = makeOffers({ club: fake(80), year: 1995, season: '1995/96', tier: 1, deals: [], until: '1996-06-30' }, 'brust', 1, 'neg')[0];
ok(counterOffer(base, { annualValue: base.annualValue, years: base.years, drop: [] }).outcome === 'accept', 'Gleiche Bedingungen werden angenommen');
const greedy = counterOffer({ ...base, interest: 0.3, rounds: 1 }, { annualValue: base.annualValue * 2, years: base.years, drop: [] });
ok(greedy.outcome !== 'accept', `Doppelte Forderung wird nicht angenommen (${greedy.outcome})`);

// --- 6) Spielablauf: neues Spiel, unterschreiben, Laufzeit, Verlängerung --------------------
const g: Game = createNewGame({
  managedClubId: 'mgl',
  manager: { name: 'Test', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any,
  difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300, legendMode: 'fictional',
});
const me = g.clubs[g.managedClubId];
const ai = Object.values(g.clubs).find((c) => c.id !== me.id && !c.id.startsWith('am'))!;
ok((ai.commerce?.deals?.length ?? 0) >= 4, `KI-Verein hat zum Start ${ai.commerce?.deals?.length} Verträge`);
ok((me.commerce?.deals?.length ?? 0) === 0 && (me.commerce?.dealOffers?.length ?? 0) >= 4, `Eigener Verein: ${me.commerce?.dealOffers?.length} Angebote, noch kein Vertrag`);
const brustOffer = me.commerce!.dealOffers!.find((o) => o.slot === 'brust')!;
ok(signSponsorOffer(g, brustOffer.id) === null, `Brustsponsor ${brustOffer.partner} unterschrieben`);
ok(!me.commerce!.dealOffers!.some((o) => o.slot === 'brust'), 'Weitere Brust-Angebote verfallen');
ok(me.commerce!.shirtSponsor?.name === brustOffer.partner, 'Spiegel shirtSponsor aktualisiert');
const m1 = computeMonthly(me, g.players, g.table, 1, 1975);
ok(m1.sponsorship > 0 && Math.abs(m1.sponsorship - brustOffer.annualValue / 12) < 50, `Monatsrate ${m1.sponsorship} DM`);
const deal = me.commerce!.deals![0];
deal.yearsLeft = 2; deal.yearsTotal = 2;
deal.clauses.push({ kind: 'relegationExit' });
const advance = (season: string) => {
  g.season = season;
  g.calendar.currentDate = `${season.slice(0, 4)}-07-01`;
  sponsorSeasonStart(g, season, g.calendar.currentDate);
};
advance('1976/77');
ok(deal.yearsLeft === 1 && me.commerce!.deals!.includes(deal), 'Nach einer Saison: Restlaufzeit 1');
g.calendar.currentDate = '1977-01-01';
monthlySponsoring(g, '1977-01-01');
const renewal = me.commerce!.dealOffers!.find((o) => o.renewal && o.partner === deal.partner);
ok(!!renewal, `Januar: Verlängerungsangebot von ${deal.partner}`);
if (renewal) {
  ok(signSponsorOffer(g, renewal.id) === null, 'Verlängerung unterschrieben');
  ok(deal.yearsLeft === 1 + renewal.years && !!deal.next, `Restlaufzeit ${deal.yearsLeft}, neue Konditionen ab nächster Saison`);
  advance('1977/78');
  ok(deal.annualValue === renewal.annualValue && !deal.next, 'Neue Konditionen gelten ab 1977/78');
}
// Auslaufen ohne Verlängerung.
const reg = me.commerce!.dealOffers!.find((o) => o.slot === 'regional');
if (reg) signSponsorOffer(g, reg.id);
const regDeal = me.commerce!.deals!.find((d) => d.slot === 'regional');
if (regDeal) {
  regDeal.yearsLeft = 1;
  advance('1978/79');
  ok(!me.commerce!.deals!.includes(regDeal), 'Nicht verlängerter Vertrag läuft aus');
  ok(me.commerce!.dealOffers!.some((o) => o.slot === 'regional'), 'Für die frei gewordene Fläche kommen neue Angebote');
}
// Abstieg: Ausstiegsklausel.
me.commerce!.lastTier = 1;
const tierBefore = g.leagues.playerDivision.tier;
(g.leagues.playerDivision as any).tier = 2;
ok(clubTierNow(g, me) === 2, 'Liga-Ebene 2 nach Abstieg');
advance('1979/80');
ok(!me.commerce!.deals!.includes(deal), 'Abstieg: Brustsponsor nutzt die Ausstiegsklausel');
(g.leagues.playerDivision as any).tier = tierBefore;

// Erfolgsprämie.
const bonusDeal: SponsorDeal = { ...deal, id: 'bonus', clauses: [], bonuses: { title: 50_000 }, yearsLeft: 2 };
me.commerce!.deals!.push(bonusDeal);
const balBefore = me.finances.balance;
sponsorSeasonClose(g, me, { position: 1, size: 18, tier: 1, cupWinner: false, euroPoints: 0, euroTitle: false }, '1980-06-30');
ok(Math.round(me.finances.balance - balBefore) === Math.round(50_000 * economyScale(1980)), 'Meister: Erfolgsprämie gebucht');

// --- 7) Pflicht-Trainingslager: verpasst → Vertragsstrafe ---------------------------------
g.season = '2015/16';
g.calendar.currentDate = '2015-07-01';
const campDeal: SponsorDeal = { id: 'qa', slot: 'aermel', partner: 'Doha Pearl Airways', industry: 'airline', country: 'QA', annualValue: 200_000, yearsTotal: 3, yearsLeft: 3, since: '2015/16', bonuses: {}, clauses: [{ kind: 'camp', destId: 'katar', window: 'winter' }], tier: 1 };
me.commerce!.deals!.push(campDeal);
me.commerce!.campObligations = [{ destId: 'katar', season: '2015/16', window: 'winter', dealId: 'qa', partner: campDeal.partner, status: 'open' }];
const before = me.finances.balance;
monthlySponsoring(g, '2016-04-01');
const ob = me.commerce!.campObligations![0];
ok(ob.status === 'missed', `Pflichtlager nicht gebucht → Status ${ob.status}`);
ok(me.finances.balance < before - 0.2 * 200_000 * economyScale(2016), 'Vertragsstrafe gebucht');

// --- 8) Migration eines alten Spielstands -----------------------------------------------
const old = JSON.parse(JSON.stringify(g)) as Game;
const oc = old.clubs[ai.id];
oc.commerce = { cateringMode: 'verpachtung', shirtSponsor: { name: 'Alt-Hansa Korn', annualValue: 275_000, yearsTotal: 3, yearsLeft: 2 }, banden: { name: 'City Reklame', annualValue: 150_000, yearsTotal: 2, yearsLeft: 1 } };
old.calendar.currentDate = '1990-10-01'; old.season = '1990/91';
ensureBrand(oc);
const legacy = computeMonthly(oc, old.players, old.table, economyScale(1990), 1990);
migrateSponsorship(old);
const brust = oc.commerce.deals!.find((d) => d.legacy && d.slot === 'brust');
ok(oc.commerce.sponsorV === 1 && !!brust, 'Trikotvertrag übernommen');
const brustMonth = sponsorMonthly({ ...oc, commerce: { ...oc.commerce, deals: brust ? [brust] : [] } } as Club, 1990).sponsorship;
ok(Math.abs(brustMonth - legacy.sponsorship) / legacy.sponsorship < 0.05, `Monatsrate Trikot bleibt (${legacy.sponsorship} → ${brustMonth})`);
const snap = JSON.stringify(oc.commerce);
migrateSponsorship(old);
ok(JSON.stringify(oc.commerce) === snap, 'Zweiter Aufruf ändert nichts (idempotent)');

if (fails) { console.log(`\n${fails} Prüfung(en) fehlgeschlagen.`); process.exit(1); }
console.log('\nSponsoring-Test bestanden.');
