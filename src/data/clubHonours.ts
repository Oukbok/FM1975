// =============================================================================
// Vereinsauszeichnungen (Wunsch Pascal): 16 Auszeichnungen in Bronze/Silber/Gold.
// -----------------------------------------------------------------------------
// Jede Stufe gilt 5 Jahre (bis zum Saisonende im fünften Jahr) und verlängert sich,
// sobald der Verein dieselbe oder eine höhere Hürde erneut schafft. Eine höhere
// Stufe ersetzt sofort die niedrigere; wer nur eine niedrigere schafft, behält die
// höhere bis zum Ablauf und fällt dann auf die geschaffte zurück.
// Hürden prüft game/clubHonours.ts am Saisonende für alle Vereine mit vollem Kader
// (deine Liga). Wirkungen liest die Engine über engine/honourEffects.ts.
// Texte: `need` = Voraussetzung (Hover), `fx` = Wirkung. Keine echten Namen.
// =============================================================================
import type { HonourEffects } from '../engine/honourEffects';

export type HonourId =
  | 'talentschmiede' | 'sprungbrett' | 'jugendhoheit'
  | 'spitzenklub' | 'europa' | 'pokalschreck' | 'festung'
  | 'spektakel' | 'bollwerk' | 'fairplay' | 'truppe' | 'treue'
  | 'kasse' | 'huette' | 'transfer' | 'ruhe';

export type HonourGroup = 'Nachwuchs und Kader' | 'Sportlicher Erfolg' | 'Spielweise und Mannschaft' | 'Wirtschaft und Umfeld';

export interface HonourTier { need: string; fx: string; effects: HonourEffects }
export interface HonourDef {
  id: HonourId;
  name: string;
  group: HonourGroup;
  /** Was die Auszeichnung grundsätzlich bewirkt (eine Zeile). */
  what: string;
  /** Bronze, Silber, Gold. */
  tiers: [HonourTier, HonourTier, HonourTier];
}

export const HONOUR_YEARS = 5;
export const TIER_NAME = ['Bronze', 'Silber', 'Gold'] as const;

/** Spielminuten-Hürde der Talentschmiede bei 34 Spieltagen (anteilig bei anderer Ligagröße). */
export const HG_MINUTES_34 = 1500;

const pct = (v: number) => `${Math.round(v * 100)} %`;

export const HONOURS: HonourDef[] = [
  // --------------------------------------------------------------- Nachwuchs
  { id: 'talentschmiede', name: 'Talentschmiede', group: 'Nachwuchs und Kader', what: 'Talente kommen lieber in deine Akademie.',
    tiers: [
      { need: '3 Eigengewächse mit je 1.500 Minuten (bei 34 Spieltagen)', fx: `+${pct(0.05)} Anziehungskraft der Akademie`, effects: { youthAppeal: 0.05 } },
      { need: '5 Eigengewächse mit je 1.500 Minuten', fx: `+${pct(0.1)} Anziehungskraft der Akademie`, effects: { youthAppeal: 0.1 } },
      { need: '7 Eigengewächse mit je 1.500 Minuten, davon 3 mit Stärke 80+', fx: `+${pct(0.18)} Anziehungskraft der Akademie`, effects: { youthAppeal: 0.18 } },
    ] },
  { id: 'sprungbrett', name: 'Sprungbrett', group: 'Nachwuchs und Kader', what: 'Junge Spieler sehen dich als Karriere-Sprungbrett.',
    tiers: [
      { need: 'Ein Eigengewächs unter den 10 höchsten Ablösen der Saison verkauft', fx: `Junge Spieler (bis 23) fordern ${pct(0.05)} weniger Gehalt`, effects: { youngWage: 0.05 } },
      { need: 'Zwei Eigengewächse unter den 10 höchsten Ablösen der Saison verkauft', fx: `Junge Spieler fordern ${pct(0.1)} weniger Gehalt`, effects: { youngWage: 0.1 } },
      { need: 'Rekordablöse der Saison für ein Eigengewächs', fx: `Junge Spieler fordern ${pct(0.15)} weniger Gehalt, +${pct(0.1)} Anziehungskraft der Akademie`, effects: { youngWage: 0.15, youthAppeal: 0.1 } },
    ] },
  { id: 'jugendhoheit', name: 'Jugendhoheit', group: 'Nachwuchs und Kader', what: 'Deine Jugend entwickelt sich schneller.',
    tiers: [
      { need: '3 Jugendtitel in derselben Saison (Meister A-/B-Jugend, Junioren-Pokal, Youth League, Staffelsieg C-/D-Jugend)', fx: `+${pct(0.04)} Entwicklung der Jugend`, effects: { youthDev: 0.04 } },
      { need: 'Meister in 4 Jugendwettbewerben', fx: `+${pct(0.08)} Entwicklung der Jugend`, effects: { youthDev: 0.08 } },
      { need: 'Meister in 5 Jugendwettbewerben', fx: `+${pct(0.12)} Entwicklung der Jugend`, effects: { youthDev: 0.12 } },
    ] },
  // ------------------------------------------------------- Sportlicher Erfolg
  { id: 'spitzenklub', name: 'Spitzenklub', group: 'Sportlicher Erfolg', what: 'Leistungsträger wechseln eher zu dir und verlangen weniger.',
    tiers: [
      { need: 'Drei Saisons in Folge unter den Top 2 der 1. Liga', fx: `+${pct(0.05)} Reiz für Wechselkandidaten`, effects: { appeal: 0.05 } },
      { need: 'Zwei Meistertitel in drei Saisons', fx: `+${pct(0.1)} Reiz, ${pct(0.05)} weniger Gehalt`, effects: { appeal: 0.1, wage: 0.05 } },
      { need: 'Drei Meistertitel in Folge', fx: `+${pct(0.18)} Reiz, ${pct(0.1)} weniger Gehalt`, effects: { appeal: 0.18, wage: 0.1 } },
    ] },
  { id: 'europa', name: 'Europäische Größe', group: 'Sportlicher Erfolg', what: 'Spieler aus dem Ausland und Sponsoren werden aufmerksam.',
    tiers: [
      { need: 'Endspiel in einem Europapokal', fx: `+${pct(0.05)} Reiz für Auslandsspieler, +${pct(0.05)} Sponsorwert`, effects: { foreignAppeal: 0.05, sponsor: 0.05 } },
      { need: 'Sieg in einem Europapokal', fx: `+${pct(0.1)} Reiz für Auslandsspieler, +${pct(0.1)} Sponsorwert`, effects: { foreignAppeal: 0.1, sponsor: 0.1 } },
      { need: 'Sieg im wichtigsten Europapokal', fx: `+${pct(0.18)} Reiz für Auslandsspieler, +${pct(0.18)} Sponsorwert`, effects: { foreignAppeal: 0.18, sponsor: 0.18 } },
    ] },
  { id: 'pokalschreck', name: 'Pokalschreck', group: 'Sportlicher Erfolg', what: 'Pokalspiele ziehen mehr Zuschauer an.',
    tiers: [
      { need: 'Als Außenseiter (kein großer Titel in 15 Jahren, in der Liga nicht unter den ersten 6) im Landespokal-Finale', fx: `+${pct(0.08)} Zuschauer in Pokalspielen`, effects: { cupDemand: 0.08 } },
      { need: 'Landespokal als Außenseiter gewonnen', fx: `+${pct(0.15)} Zuschauer in Pokalspielen`, effects: { cupDemand: 0.15 } },
      { need: 'Landespokal und Europapokal-Halbfinale als Außenseiter in derselben Saison', fx: `+${pct(0.25)} Zuschauer in Pokalspielen`, effects: { cupDemand: 0.25 } },
    ] },
  { id: 'festung', name: 'Festung', group: 'Sportlicher Erfolg', what: 'Zuhause seid ihr stärker, die Karten gehen besser weg.',
    tiers: [
      { need: 'Ganze Ligasaison ohne Heimniederlage', fx: '+1 % Heimstärke', effects: { homeStrength: 0.01 } },
      { need: 'Ohne Heimniederlage und mit höchstens 2 Heim-Remis', fx: `+2 % Heimstärke, +${pct(0.05)} Ticketverkäufe`, effects: { homeStrength: 0.02, tickets: 0.05 } },
      { need: 'Zwei Ligasaisons in Folge ohne Heimniederlage', fx: `+3 % Heimstärke, +${pct(0.1)} Ticketverkäufe`, effects: { homeStrength: 0.03, tickets: 0.1 } },
    ] },
  // ---------------------------------------------- Spielweise und Mannschaft
  { id: 'spektakel', name: 'Spektakel', group: 'Spielweise und Mannschaft', what: 'Torreicher Fußball füllt Stadion und Fanshop.',
    tiers: [
      { need: 'Bester Angriff der Liga, mindestens 60 % über dem Torschnitt der Liga', fx: `+${pct(0.04)} Zuschauer und Fanartikel`, effects: { demand: 0.04, merch: 0.04 } },
      { need: 'So zwei Saisons in Folge', fx: `+${pct(0.08)} Zuschauer und Fanartikel`, effects: { demand: 0.08, merch: 0.08 } },
      { need: 'So drei Saisons in Folge und dabei Meister', fx: `+${pct(0.14)} Zuschauer und Fanartikel`, effects: { demand: 0.14, merch: 0.14 } },
    ] },
  { id: 'bollwerk', name: 'Bollwerk', group: 'Spielweise und Mannschaft', what: 'Verteidiger und Torhüter wechseln lieber zu dir.',
    tiers: [
      { need: 'Beste Abwehr der Liga mit höchstens 0,8 Gegentoren je Spiel', fx: `+${pct(0.05)} Reiz für Verteidiger und Torhüter`, effects: { defAppeal: 0.05 } },
      { need: 'Beste Abwehr mit höchstens 0,6 Gegentoren je Spiel', fx: `+${pct(0.1)} Reiz für Verteidiger und Torhüter`, effects: { defAppeal: 0.1 } },
      { need: 'Höchstens 0,5 Gegentore je Spiel zwei Saisons in Folge (jeweils beste Abwehr)', fx: `+${pct(0.15)} Reiz für Verteidiger und Torhüter`, effects: { defAppeal: 0.15 } },
    ] },
  { id: 'fairplay', name: 'Fair Play', group: 'Spielweise und Mannschaft', what: 'Sponsoren schätzen dein sauberes Image.',
    tiers: [
      { need: 'Fairste Mannschaft der Liga ohne Platzverweis', fx: `+${pct(0.05)} Sponsorwert (Image)`, effects: { sponsor: 0.05 } },
      { need: 'So zwei Saisons in Folge', fx: `+${pct(0.1)} Sponsorwert (Image)`, effects: { sponsor: 0.1 } },
      { need: 'So vier Saisons in Folge', fx: `+${pct(0.15)} Sponsorwert (Image)`, effects: { sponsor: 0.15 } },
    ] },
  { id: 'truppe', name: 'Eingeschworene Truppe', group: 'Spielweise und Mannschaft', what: 'Die Moral bricht langsamer ein.',
    tiers: [
      { need: 'Teamstimmung von September bis Juni nie unter 65', fx: `Moral sinkt ${pct(0.1)} langsamer`, effects: { moraleHold: 0.1 } },
      { need: 'Teamstimmung von September bis Juni nie unter 72', fx: `Moral sinkt ${pct(0.2)} langsamer`, effects: { moraleHold: 0.2 } },
      { need: 'So drei Saisons in Folge (nie unter 72)', fx: `Moral sinkt ${pct(0.3)} langsamer`, effects: { moraleHold: 0.3 } },
    ] },
  { id: 'treue', name: 'Vereinstreue', group: 'Nachwuchs und Kader', what: 'Vertragsverlängerungen werden günstiger.',
    tiers: [
      { need: '10 Spieler mit mindestens 25 Saisonspielen sind seit 10 Jahren im Verein', fx: `Verlängerungen ${pct(0.05)} günstiger`, effects: { renewWage: 0.05 } },
      { need: '11 solche Spieler', fx: `Verlängerungen ${pct(0.1)} günstiger`, effects: { renewWage: 0.1 } },
      { need: '12 solche Spieler, davon 3 Eigengewächse', fx: `Verlängerungen ${pct(0.15)} günstiger`, effects: { renewWage: 0.15 } },
    ] },
  // ----------------------------------------------------- Wirtschaft und Umfeld
  { id: 'kasse', name: 'Solide Kasse', group: 'Wirtschaft und Umfeld', what: 'Die Bank traut dir mehr zu: niedrigere Zinsen.',
    tiers: [
      { need: 'Fünf Saisons in Folge mit Gewinn und ohne Kredit', fx: 'Kreditzins −0,5 Prozentpunkte', effects: { interest: 0.005 } },
      { need: 'Sieben Saisons in Folge, Rücklage mindestens 50 % eines Jahresumsatzes', fx: 'Kreditzins −1 Prozentpunkt', effects: { interest: 0.01 } },
      { need: 'Zehn Saisons in Folge, Rücklage mindestens ein Jahresumsatz', fx: 'Kreditzins −1,5 Prozentpunkte', effects: { interest: 0.015 } },
    ] },
  { id: 'huette', name: 'Volle Hütte', group: 'Wirtschaft und Umfeld', what: 'Ein ausverkauftes Stadion bringt Mitglieder und Fanartikel.',
    tiers: [
      { need: 'Mindestens 95 % Auslastung im Schnitt bei 40.000 oder mehr Plätzen', fx: `+${pct(0.04)} Mitglieder und Fanartikel`, effects: { members: 0.04, merch: 0.04 } },
      { need: 'Mindestens 98 % Auslastung bei 50.000 oder mehr Plätzen', fx: `+${pct(0.08)} Mitglieder und Fanartikel`, effects: { members: 0.08, merch: 0.08 } },
      { need: 'Praktisch immer ausverkauft (99,5 %) zwei Saisons in Folge bei 60.000 oder mehr Plätzen', fx: `+${pct(0.14)} Mitglieder und Fanartikel`, effects: { members: 0.14, merch: 0.14 } },
    ] },
  { id: 'transfer', name: 'Transfer-Geschick', group: 'Wirtschaft und Umfeld', what: 'Verkäufer und Berater verhandeln weicher mit dir.',
    tiers: [
      { need: 'Positiver Transfersaldo und trotzdem eine deutlich stärkere Mannschaft (+1,5 Stärke der besten 11)', fx: `Geforderte Ablösen ${pct(0.05)} niedriger`, effects: { feeCut: 0.05 } },
      { need: 'So drei Saisons in Folge', fx: `Geforderte Ablösen ${pct(0.1)} niedriger`, effects: { feeCut: 0.1 } },
      { need: 'So fünf Saisons in Folge, dazu ein Titel in dieser Zeit', fx: `Ablösen und Beraterprovision ${pct(0.15)} niedriger`, effects: { feeCut: 0.15, agentCut: 0.15 } },
    ] },
  { id: 'ruhe', name: 'Ruhige Hand', group: 'Wirtschaft und Umfeld', what: 'Trainer auf dem Arbeitsmarkt kommen lieber zu dir.',
    tiers: [
      { need: 'Derselbe Cheftrainer seit 5 Jahren, ohne Druck auf ihn', fx: `+${pct(0.08)} Reiz für Trainer`, effects: { coachAppeal: 0.08 } },
      { need: 'Derselbe Cheftrainer seit 8 Jahren', fx: `+${pct(0.14)} Reiz für Trainer`, effects: { coachAppeal: 0.14 } },
      { need: 'Derselbe Cheftrainer seit 12 Jahren, mit mindestens einem Titel', fx: `+${pct(0.2)} Reiz für Trainer`, effects: { coachAppeal: 0.2 } },
    ] },
];

export const HONOUR_BY_ID = Object.fromEntries(HONOURS.map((h) => [h.id, h])) as Record<HonourId, HonourDef>;
export const HONOUR_GROUPS: HonourGroup[] = ['Nachwuchs und Kader', 'Sportlicher Erfolg', 'Spielweise und Mannschaft', 'Wirtschaft und Umfeld'];
