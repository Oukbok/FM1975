// =============================================================================
// VERSPRECHEN AN SPIELER (aus Transferverhandlungen)
// -----------------------------------------------------------------------------
// Jedes Versprechen gilt für die Saison des Wechsels und wird am 30. Juni
// geprüft (Stammplatz zusätzlich mit einer Mahnung am 2. Januar).
// Gehalten: Zufriedenheit +8, Glaubwürdigkeit +5.
// Gebrochen: Zufriedenheit −25, Moral −2, Glaubwürdigkeit −15. Die
// Glaubwürdigkeit (Start 70) bestimmt, wie sehr künftige Spieler dir glauben.
// =============================================================================
import { PROMISES, PromiseType } from '../engine/transferMarket';
import { makeMessage, pushMessage } from '../engine/messages';
import { shiftMorale } from '../engine/randomEvents';
import { Player } from '../types';
import { Game } from './state';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function trustOf(g: Game): number { return g.promiseTrust ?? 70; }

export function givePromises(g: Game, p: Player, types: PromiseType[], date: string): void {
  p.promises = (p.promises ?? []).filter((x) => x.result);
  for (const t of types) {
    p.promises.push({ type: t, madeOn: date, season: g.season, result: t === 'umzug' ? 'kept' : undefined });
  }
}

function settle(g: Game, p: Player, type: PromiseType, kept: boolean, date: string, why?: string): void {
  const pr = p.promises?.find((x) => x.type === type && !x.result);
  if (!pr) return;
  pr.result = kept ? 'kept' : 'broken';
  if (kept) {
    p.contract.satisfaction = clamp((p.contract.satisfaction ?? 60) + 8, 0, 100);
    g.promiseTrust = clamp(trustOf(g) + 5, 0, 100);
    return;
  }
  p.contract.satisfaction = clamp((p.contract.satisfaction ?? 60) - 25, 0, 100);
  shiftMorale(p, -2);
  g.promiseTrust = clamp(trustOf(g) - 15, 0, 100);
  pushMessage(g.messages, makeMessage({
    date, category: 'contract', from: p.fullName,
    subject: `Versprechen gebrochen: ${PROMISES[type].label}`,
    shortText: `${p.lastName} fühlt sich getäuscht.`,
    bodyText: `${p.fullName}: „Du hast mir ${PROMISES[type].label.toLowerCase()} zugesagt. ${why ?? 'Daraus ist nichts geworden.'} So etwas spricht sich herum.“\n\nSeine Zufriedenheit und Moral sinken stark. Künftige Spieler glauben deinen Versprechen weniger (Glaubwürdigkeit jetzt ${trustOf(g)}).`,
  }));
}

export function breakPromise(g: Game, p: Player, type: PromiseType, date: string): void {
  settle(g, p, type, false, date, type === 'freigabe' ? 'Ein größerer Verein wollte mich – und du hast abgelehnt.' : undefined);
}

function leagueMatches(g: Game, clubId: string): number {
  return g.fixtures.filter((m) => m.result && (m.homeClubId === clubId || m.awayClubId === clubId)).length;
}

/** Täglich: 2. Januar Mahnung, 30. Juni Prüfung aller offenen Versprechen. */
export function checkPromises(g: Game, today: string): void {
  const md = today.slice(5);
  if (md !== '01-02' && md !== '06-30') return;
  const club = g.clubs[g.managedClubId];
  if (!club) return;
  const matches = leagueMatches(g, club.id);
  const pos = g.table.rows.findIndex((r) => r.clubId === club.id) + 1;
  for (const id of club.playerIds) {
    const p = g.players[id];
    const open = p?.promises?.filter((x) => !x.result && x.season === g.season) ?? [];
    for (const pr of open) {
      const startShare = matches ? (p.seasonStats?.starts ?? 0) / matches : 1;
      if (md === '01-02') {
        if (pr.type === 'stammplatz' && matches >= 8 && startShare < 0.45) {
          p.contract.satisfaction = clamp((p.contract.satisfaction ?? 60) - 6, 0, 100);
          pushMessage(g.messages, makeMessage({
            date: today, category: 'contract', from: p.fullName, subject: `${p.lastName} erinnert an den versprochenen Stammplatz`,
            shortText: `Bisher stand er in ${Math.round(startShare * 100)} % der Spiele in der Startelf.`,
            bodyText: `„Mir wurde ein Stammplatz versprochen. Bisher stand ich in ${Math.round(startShare * 100)} % der Ligaspiele in der Startelf.“ Bis zum Saisonende braucht er mindestens 60 %.`,
          }));
        }
        continue;
      }
      switch (pr.type) {
        case 'stammplatz': settle(g, p, 'stammplatz', startShare >= 0.6, today, `Ich stand nur in ${Math.round(startShare * 100)} % der Spiele in der Startelf.`); break;
        case 'kapitaen': settle(g, p, 'kapitaen', club.tactics?.captainId === p.id, today, 'Die Binde trägt ein anderer.'); break;
        case 'europa': settle(g, p, 'europa', pos > 0 && pos <= 5, today, `Wir sind ${pos}. geworden.`); break;
        case 'titel': settle(g, p, 'titel', pos > 0 && pos <= 3, today, `Platz ${pos} – das war kein Titelkampf.`); break;
        case 'entwicklung': settle(g, p, 'entwicklung', (p.seasonStats?.appearances ?? 0) >= 15, today, `Nur ${p.seasonStats?.appearances ?? 0} Einsätze.`); break;
        case 'stars': {
          const signed = club.playerIds.map((x) => g.players[x]).some((o) => o && o.id !== p.id && o.overall >= p.overall - 3
            && (o.history?.transfers ?? []).some((t) => t.toClub === club.name && t.date >= pr.madeOn));
          settle(g, p, 'stars', signed, today, 'Es kam keine Verstärkung auf meinem Niveau.');
          break;
        }
        case 'freigabe': settle(g, p, 'freigabe', true, today); break;
        default: break;
      }
    }
  }
}
