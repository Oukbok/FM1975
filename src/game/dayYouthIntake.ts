// =============================================================================
// Tagesablauf, Teil 2: jährlicher Nachwuchs-Jahrgang zum 1. Juli (Vertragsende,
// Nachwuchs-Investitionen, Frühstarter, Altern/Abschluss/Neuaufnahme der Talente).
// Aufgerufen aus game/day.ts.
// =============================================================================
import { applyYouthGem, GEM_CHANCE_YOUTH, maybeMakeGem } from '../engine/gems';
import { academyIntake, ageYouthPlayers, graduateYouth } from '../engine/youth';
import { makeMessage, pushMessage } from '../engine/messages';
import { Game } from './state';
import { handleContractExpiry } from './contracts';
import { youthInvestSeasonStart } from './youthInvest';
import { fillYouthTeams, youthChangeMessage, youthTeamsSeasonChange } from './youthTeams';
import { seasonLeagueBalance } from './leagueBalance';
import { promoteEarlyTalents } from './talentGame';

/** JÄHRLICHER NACHWUCHS-JAHRGANG: zum 1. Juli neue Talente in allen Akademien. */
export function youthIntakeDaily(g: Game, today: string): void {
  const utcMon = new Date(today + 'T00:00:00Z').getUTCMonth() + 1; // 1–12
  const domNow = new Date(today + 'T00:00:00Z').getUTCDate();
  const yearNow = new Date(today + 'T00:00:00Z').getUTCFullYear();
  if (utcMon === 7 && domNow === 1) {
    // Liga-Gleichgewicht vor dem neuen Nachwuchs-Jahrgang nachführen.
    seasonLeagueBalance(g);
    // Vertragsende: Wechsel (vor Bosman gegen Ablöse) oder Verlängerung (game/contracts.ts).
    handleContractExpiry(g, today);
    // Nachwuchs-Investitionen: Ruf, NLZ-Pflicht, Wettbewerb um Talente (game/youthInvest.ts).
    youthInvestSeasonStart(g, today);
    // Frühstarter: profireife 16–19-Jährige rücken zu den Profis auf (game/talentGame.ts).
    promoteEarlyTalents(g, today);
    for (const club of Object.values(g.clubs)) {
      if ((club.infrastructure.lastYouthIntakeYear ?? 0) >= yearNow) continue;
      club.infrastructure.lastYouthIntakeYear = yearNow;
      const isMine = club.id === g.managedClubId;

      // 1) Alle Talente rücken einen Jahrgang auf (Alter +1, Altersklasse steigt).
      ageYouthPlayers(club, g.youthPlayers, yearNow);
      // Verborgene Juwelen der Jugend: mit 18/19 platzt der Knoten.
      for (const yid of club.youthPlayerIds) {
        const yp = g.youthPlayers[yid];
        if (yp && applyYouthGem(yp) && isMine) {
          pushMessage(g.messages, makeMessage({
            date: today, category: 'training', from: 'Leiter Jugendakademie',
            subject: `${yp.fullName} macht einen gewaltigen Sprung`,
            shortText: 'Ein Talent, das wir unterschätzt haben?',
            bodyText: `Bei ${yp.fullName} (${yp.naturalPosition}, ${yp.age}) ist im Sommer der Knoten geplatzt. Im Training zeigt er Dinge, die wir ihm nicht zugetraut hätten. Unsere Scouts werden ihre Einschätzung nach oben korrigieren.`,
          }));
        }
      }
      // 2) Jahrgangsabschluss: A-Jugend (nun ≥20) verlässt die Akademie –
      //    die Besten werden hochgezogen, der Rest verlässt den Verein.
      const grad = graduateYouth(club, g.players, g.youthPlayers, isMine);
      // 3) Neuer jüngster Jahrgang (G-Jugend/Bambini, 7 Jahre) rückt nach.
      const cohort = academyIntake(club, today, `${yearNow}`);
      for (const yp of cohort) maybeMakeGem(yp, GEM_CHANCE_YOUTH);
      for (const yp of cohort) {
        g.youthPlayers[yp.id] = yp;
        club.youthPlayerIds.push(yp.id);
      }

      if (isMine && !(g as any).simAutoManage) {
        // Volle Jugendmannschaften: Abgänge, Aussortieren, Auffüllen (game/youthTeams.ts).
        const leaving = youthTeamsSeasonChange(g, today);
        const added = fillYouthTeams(g, today);
        youthChangeMessage(g, today, leaving, added);
      }
      if (isMine) {
        if (cohort.length > 0) {
          pushMessage(g.messages, makeMessage({
            date: today, category: 'training', from: 'Leiter Jugendakademie',
            subject: 'Neuer G-Jugend-Jahrgang (Bambini) in der Jugendakademie',
            shortText: `${cohort.length} neue(s) Talent(e) (G-Jugend/Bambini, 7 Jahre) sind eingetroffen.`,
            bodyText: `Unsere Jugendakademie (Stufe ${club.infrastructure.youthAcademy}) hat einen neuen G-Jugend-Jahrgang (Bambini) aufgenommen: `
              + `${cohort.length} Nachwuchsspieler im Alter von 7 Jahren.\n\n`
              + cohort.map((y) => `• ${y.fullName} (${y.naturalPosition}, ${y.age} Jahre)`).join('\n')
              + `\n\nSo junge Talente lassen sich kaum einschätzen – unsere Scouts geben eine sehr breite Potenzial-Spanne an, die sich über die Jahre präzisiert. Schau im Bereich „Jugend“ vorbei.`,
          }));
        }
        if (grad.promoted.length > 0 || grad.released.length > 0) {
          const lines: string[] = [];
          if (grad.promoted.length > 0) {
            lines.push('In den Profikader hochgezogen:');
            lines.push(...grad.promoted.map((y) => `• ${y.fullName} (${y.naturalPosition}, ${y.age} Jahre)`));
          }
          if (grad.released.length > 0) {
            if (lines.length > 0) lines.push('');
            lines.push('Haben den Verein verlassen (kein Vertrag):');
            lines.push(...grad.released.map((y) => `• ${y.fullName} (${y.naturalPosition}, ${y.age} Jahre)`));
          }
          pushMessage(g.messages, makeMessage({
            date: today, category: 'training', from: 'Leiter Jugendakademie',
            subject: 'Jahrgangsabschluss der A-Jugend',
            shortText: `${grad.promoted.length} hochgezogen, ${grad.released.length} abgegeben.`,
            bodyText: `Die A-Jugend hat den Jahrgang abgeschlossen. `
              + `Die vielversprechendsten Talente wurden in den Profikader übernommen, die übrigen verlassen den Verein.\n\n`
              + lines.join('\n'),
          }));
        }
        // Jahrgangswechsel läuft still (Nachricht im Posteingang, keine Pause).
      }
    }
  }
}
