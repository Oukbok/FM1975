// =============================================================================
// Bilder eines Spielstands vorwärmen (Wunsch Pascal: keine Ladezeiten bei Bildern)
// -----------------------------------------------------------------------------
// `warmGameImages` läuft beim Laden/Starten eines Spiels, BEVOR die Zentrale
// erscheint (App.tsx wartet darauf höchstens `WARM_CAP_MS`): Papier-Texturen,
// zentrierte Wappen der eigenen Liga (ui/crestTrim.ts), Foto + Gesichter der
// Nachricht, die die Zentrale zuerst zeigt. `warmSquadFaces` lädt danach im
// Leerlauf die Gesichter des eigenen Kaders/der Jugend (Kader-Seiten, Profil).
// Begrenzt über ui/imagePreload.ts (LRU), damit nicht hunderte Gesichter im
// Speicher bleiben. Messung: tests/image-load-probe.mjs.
// =============================================================================
import type { Game } from '../game/state';
import { setCrestDate } from '../data/dataset/apply';
import { setPortraitGame } from '../game/playerPortraits';
import { resolveCrestImage } from '../data/clubOverrides';
import { isLeagueClub } from '../engine/clubEconomy';
import { warmCrest } from '../ui/crestTrim';
import { UI_TEXTURES, preloadImage, whenIdle } from '../ui/imagePreload';
import { preloadFace } from '../components/PlayerAvatar';
import { initialMessage, preloadReader } from '../views/office/dash/Newscenter';

/** Längste Wartezeit vor dem Zeigen der Zentrale (Desktop: lokal meist < 100 ms). */
export const WARM_CAP_MS = 600;

/** Was die Zentrale im ersten Bild braucht. Wartet höchstens `capMs`, der Rest lädt im Hintergrund weiter. */
export function warmGameImages(g: Game, capMs = WARM_CAP_MS): Promise<void> {
  if (typeof Image === 'undefined') return Promise.resolve();
  // Wie GameShell vor dem Rendern: Wappen-Datum und eigene Spielerbilder (gleiche Bildadressen).
  setCrestDate(g.calendar.currentDate);
  setPortraitGame(g);
  const me = g.clubs[g.managedClubId];
  const league = Object.values(g.clubs).filter((c) => c && isLeagueClub(c) && !c.guest);
  const jobs: Promise<unknown>[] = [
    ...UI_TEXTURES.slice(0, 2).map((t) => preloadImage(t, { keep: true })),
    ...(me ? [me] : []).concat(league).map((c) => warmCrest(resolveCrestImage(c))),
    preloadReader(g, initialMessage(g.messages ?? [])),
    // Eigener Kader: „Unsere Besten“ in der Zentrale, Kader-Seiten.
    ...(me?.playerIds ?? []).map((id) => preloadFace(g.players[id])),
  ];
  const all = Promise.all(jobs).then(() => undefined, () => undefined);
  return Promise.race([all, new Promise<void>((r) => setTimeout(r, capMs))]);
}

/**
 * Gesichter des eigenen Kaders (zuerst), dann der Jugend – im Leerlauf, einzeln nacheinander.
 * Rückgabe: Abbruch (beim Verlassen des Spiels).
 */
export function warmSquadFaces(g: Game): () => void {
  let stop = false;
  const club = g.clubs[g.managedClubId];
  const people = [
    ...(club?.playerIds ?? []).map((id) => g.players[id]),
    ...Object.values(g.youthPlayers ?? {}).filter((p) => p?.clubId === g.managedClubId),
  ].filter(Boolean).slice(0, 60);
  let i = 0;
  const next = () => {
    if (stop || i >= people.length) return;
    preloadFace(people[i++]).finally(() => whenIdle(next, 500));
  };
  const t = setTimeout(() => whenIdle(next), 300);
  return () => { stop = true; clearTimeout(t); };
}
