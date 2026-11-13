// =============================================================================
// Inhalte der Briefing-Archivseite (views/zentrale/BriefingView.tsx): Aufmacher +
// zwei Nebenthemen je Saison und die Karten „Neu im Spiel“ (mit Auffüllen aus
// Unterschieden zu heute und Epochen-Tipps, damit jedes Feld gefüllt ist).
// Auch für die Bilderliste docs/bilder/briefing.md (scripts/briefing-image-list.ts).
// =============================================================================
import { topicMeta, type BriefingItem } from '../data/briefings';
import { eraTipsFor } from '../data/briefings/eraTips';
import { briefingImageKey, briefingKindPhoto } from '../data/briefingImages';
import { CHANGE_KIND_META } from './briefingChanges';
import { shorten, type SeasonBriefing } from './seasonBriefing';

export interface Story { topic: BriefingItem['topic']; title: string; text: string; kicker: string; inGame?: string; key: string }
export interface Card { icon: string; title: string; label: string; text: string; photo: string | null }

/** Aufmacher + zwei Nebenthemen: Fußball zuerst (mit Spielbezug bevorzugt), dann Gesellschaft. */
export function storiesOf(b: SeasonBriefing): Story[] {
  const mk = (it: BriefingItem, kicker: string): Story => ({ topic: it.topic, title: it.title, text: it.text, inGame: it.inGame, kicker, key: briefingImageKey(b.startYear, it.title) });
  const foot = [...b.football].sort((a, c) => Number(!!c.inGame) - Number(!!a.inGame));
  const list = [...foot.map((x) => mk(x, 'Fußball')), ...b.society.map((x) => mk(x, 'Gesellschaft'))];
  // Ein Nebenthema aus der Gesellschaft, wenn vorhanden – wie in der Zeitung.
  const hero = list[0];
  const soc = list.find((x) => x.kicker === 'Gesellschaft');
  const rest = list.filter((x) => x !== hero && x !== soc);
  return [hero, rest[0], soc ?? rest[1]].filter(Boolean) as Story[];
}

/** „Neu im Spiel“: Änderungen der Saison; reicht das nicht, Unterschiede zu heute und Epochen-Tipps. */
/** Kartentext: ganzer Text (nicht nur der erste Satz), höchstens ~170 Zeichen. */
const clip = (t: string, max = 170) => (t.length > max ? t.slice(0, max - 1).replace(/\s+\S*$/, '') + ' …' : t);

export function cardsOf(b: SeasonBriefing): Card[] {
  const words = (t: string) => new Set(t.toLowerCase().replace(/[^a-zäöüß0-9]+/g, ' ').split(' ').filter((w) => w.length > 3));
  const told = storiesOf(b).map((s) => words(s.title));
  const fresh = (title: string) => { const w = words(title); return !told.some((t) => [...w].some((x) => t.has(x))); };
  const out: Card[] = b.inGame.filter((c) => fresh(c.title)).slice(0, 3).map((c) => ({ icon: c.icon, title: c.title, label: CHANGE_KIND_META[c.kind].label, text: clip(c.text), photo: briefingKindPhoto(c.kind) }));
  for (const d of [...b.started, ...b.ended]) {
    if (out.length >= 3) break;
    // Unterschiede zu heute: Titel beschreibt den alten Zustand („Keine Gelbsperren“) – beim Ende als „Vorbei: …“.
    const start = b.started.includes(d);
    out.push({ icon: topicMeta(d.topic).icon, title: start ? d.title : `Vorbei: ${d.title}`, label: start ? 'Anders als heute' : 'Ab jetzt wie heute',
      text: clip(start ? d.then : `Ab dieser Saison wie heute: ${d.today}`), photo: null });
  }
  for (const t of eraTipsFor(b.startYear)) {
    if (out.length >= 3) break;
    out.push({ icon: topicMeta(t.topic).icon, title: t.title, label: 'Typisch für die Zeit', text: clip(t.inGame), photo: null });
  }
  return out;
}

