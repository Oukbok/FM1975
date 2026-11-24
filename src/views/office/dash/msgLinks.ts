// =============================================================================
// Sprungknöpfe im Lesebereich des Newscenters (Wunsch Pascal: kein Knopf, der auf
// eine leere oder unpassende Seite führt). Früher galt ein Ziel je Kategorie –
// „Verhandlungen“ stand dadurch auch unter fremden Transfers. Jetzt entscheidet der
// Inhalt der Nachricht: offenes Angebot, eigene Verhandlung, Leihe, Vorvertrag,
// Jugend, Scouting, Europapokal …; fremde Wechsel zeigen den Verein statt einer Seite.
// =============================================================================
import type { Game } from '../../../game/state';
import { isOpenIncoming } from '../../../game/incomingOffers';
import type { Screen } from '../../../shell/navigation';
import type { InboxMessage, Player } from '../../../types';

export interface MsgLink {
  label: string;
  /** Seite öffnen … */
  screen?: Screen;
  /** … oder Vereinsprofil öffnen … */
  club?: string;
  /** … oder Spielerprofil öffnen. */
  player?: string;
  /** Reiter der Zielseite vorwählen (ui/SubTabs `presetSubTab`). */
  tab?: [string, string];
  title?: string;
}

const NEG_TAB: [string, string] = ['transfers.verhandlungen', 'uebersicht'];
const EURO_RE = /Europa|UEFA|Landesmeister|Pokal der Pokalsieger|Meisterliga|Kontinental-Liga|Konferenz|Intertoto/;

function transferLinks(g: Game, m: InboxMessage, faces: Player[]): MsgLink[] {
  const mine = g.managedClubId;
  if (isOpenIncoming(m) && m.eventRef?.type === 'ai_loan_request') {
    return [{ label: 'Leihangebot ansehen', screen: 'leihen', tab: ['transfers.leihen', 'angebote'], title: 'Transfers › Leihen › Angebote: annehmen, bessere Bedingungen fordern oder ablehnen' }];
  }
  if (isOpenIncoming(m)) {
    return [{ label: 'Angebot verhandeln', screen: 'verhandlungen', tab: NEG_TAB, title: 'Transfers › Verhandlungen: Angebote für deine Spieler – annehmen, mehr fordern oder ablehnen' }];
  }
  if (m.from === 'Scouting') return [{ label: 'Scouting', screen: 'scouting' }];
  if (m.from === 'Leiter Jugendakademie') return [{ label: 'Akademie', screen: 'akademie' }];
  const ids = new Set([m.relatedId, m.eventRef?.playerId, ...faces.map((p) => p.id)].filter(Boolean) as string[]);
  // Eigene Verhandlung über einen der Spieler (laufend, Einigung, abgeschlossen) → dort steht sie.
  if ((g.transferTalks ?? []).some((t) => ids.has(t.playerId))) return [{ label: 'Verhandlungen', screen: 'verhandlungen', tab: NEG_TAB }];
  if ((g.loanTalks ?? []).some((t) => ids.has(t.playerId))) return [{ label: 'Leihen', screen: 'leihen', tab: ['transfers.leihen', 'aus'] }];
  const own = faces.filter((p) => p.clubId === mine || p.loan?.fromClubId === mine);
  if (own.some((p) => p.loan)) {
    const out = own.some((p) => p.loan && p.loan.fromClubId === mine);
    return [{ label: 'Leihspieler', screen: 'leihen', tab: ['transfers.leihen', out ? 'ver' : 'aus'] }];
  }
  if (own.some((p) => p.contract.preContractClubId && p.contract.preContractClubId !== mine)) return [{ label: 'Verhandlungen', screen: 'verhandlungen', tab: NEG_TAB }];
  // Fremder Wechsel: Verein des Spielers (bzw. Käufers) statt einer leeren Seite.
  const other = faces.find((p) => p.clubId && p.clubId !== mine && g.clubs[p.clubId]);
  if (other) return [{ label: g.clubs[other.clubId].name || 'Verein', club: other.clubId, title: 'Vereinsprofil öffnen' }];
  if (/Transferfenster/.test(m.subject)) return [{ label: 'Transfermarkt', screen: 'transfers' }];
  // Ältere Meldungen ohne Spieler-ID („Spitzentransfer: X wechselt zu Y“): Verein und Spieler aus dem Betreff.
  const club = Object.values(g.clubs).filter((c) => c.id !== mine && c.name && m.subject.includes(c.name))
    .sort((a, b) => b.name.length - a.name.length)[0];
  if (!club) return [];
  const p = club.playerIds.map((id) => g.players[id]).find((x) => x?.fullName && m.subject.includes(x.fullName));
  return [
    ...(p && !faces.length ? [{ label: 'Spielerprofil', player: p.id }] : []),
    { label: club.name || 'Verein', club: club.id, title: 'Vereinsprofil öffnen' },
  ];
}

/** Knöpfe unter einer Nachricht (ohne Spielbericht/Spielerprofil/Vertrag – die setzt der Leser selbst). */
export function msgLinks(g: Game, m: InboxMessage, faces: Player[]): MsgLink[] {
  const ownFaces = faces.filter((p) => p.clubId === g.managedClubId);
  switch (m.category) {
    case 'transfer': return transferLinks(g, m, faces);
    case 'injury': return [{ label: 'Kader', screen: 'squad' }];
    case 'match': return [{ label: 'Spielplan', screen: 'fixtures' }];
    case 'board': {
      if (m.from === 'Marketingabteilung' || /Namensrechte|sponsor/i.test(m.subject)) return [{ label: 'Sponsoring', screen: 'sponsoring' }];
      if (/Stadion|Baubeginn|Tribüne/.test(m.subject)) return [{ label: 'Stadion', screen: 'stadium' }];
      if (/Personal/.test(m.subject)) return [{ label: 'Mitarbeiter', screen: 'staff' }];
      return [{ label: 'Verein', screen: 'cat-verein' }];
    }
    case 'contract': return ownFaces.length || !faces.length ? [{ label: 'Verträge', screen: 'vertraege' }] : [];
    case 'training': {
      if (/Trainingslager/.test(m.subject)) return [{ label: 'Trainingslager', screen: 'trainingslager' }];
      if (/Jugend|Bambini|Jahrgang/.test(m.subject) || ownFaces.some((p) => p.isYouth)) return [{ label: 'Jugend', screen: 'youth' }];
      return [{ label: 'Trainingsplan', screen: 'training' }];
    }
    case 'media': {
      if (/Goldener|des Jahres|Besten der Saison|Elf der Saison/.test(m.subject)) return [{ label: 'Auszeichnungen', screen: 'auszeichnungen' }];
      return [{ label: 'Presse', screen: 'presse' }];
    }
    case 'cup': {
      if (/Gipfelpokal|Auftaktpokal/.test(m.subject)) return [{ label: 'Gipfelpokal', screen: 'supercup' }];
      if (/Halle|Hallen/.test(m.subject)) return [{ label: 'Halle', screen: 'halle' }];
      if (!/Landespokal/.test(m.subject) && EURO_RE.test(m.subject)) return [{ label: 'International', screen: 'international' }];
      return [{ label: 'Pokal', screen: 'cup' }];
    }
    default: return [];
  }
}
