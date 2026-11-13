// =============================================================================
// PRIVATLEBEN – Spielstart (newGame.ts): Zustand anlegen, beim Jungen Manager die
// Hintergrundgeschichte als Brief in den Posteingang, Ansehen nach Geschichte.
// =============================================================================
import type { Game } from '../state';
import { makeMessage, pushMessage } from '../../engine/messages';
import { storyById } from '../../data/privateLife';
import { ensureCareer } from '../careerState';
import { ageOn, clamp, ensurePrivate } from './privateState';

export function storyText(g: Game, id: string | undefined): { title: string; text: string } | null {
  const s = storyById(id);
  if (!s) return null;
  const club = g.clubs[g.managedClubId];
  const st = ensurePrivate(g);
  const self = st.persons[st.selfId];
  const age = ageOn(self.birth, g.calendar.currentDate);
  const text = s.text.replace(/\{club\}/g, club?.name ?? 'dem Verein').replace(/\{city\}/g, club?.city ?? 'der Stadt')
    .replace(/\{name\}/g, self.first).replace(/\{year\}/g, g.calendar.currentDate.slice(0, 4)).replace(/\{age\}/g, String(age));
  return { title: s.title, text };
}

export function startPrivateLife(g: Game): void {
  const st = ensurePrivate(g);
  const s = storyById(st.story);
  if (!s) return;
  const c = ensureCareer(g);
  // Mit 20 ist man in der Branche ein Niemand – unabhängig vom Verein; die Geschichte verschiebt es etwas.
  c.rep = clamp(Math.min(c.rep, 52) - 14 + s.rep, 15, 60);
  const t = storyText(g, s.id)!;
  pushMessage(g.messages, makeMessage({
    date: g.calendar.currentDate, category: 'general', from: 'Privat', subject: `Deine Geschichte: ${t.title}`,
    shortText: s.teaser, bodyText: `${t.text}\n\nIn Privat findest du dein Leben neben dem Verein: Familie, Freizeit, Vermögen – und irgendwann die Frage, wer nach dir kommt.`,
  }));
}
