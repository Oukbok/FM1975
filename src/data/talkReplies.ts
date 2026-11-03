// =============================================================================
// SPIELERGESPRÄCH — Sätze des Trainers und Antworten der Spieler
// -----------------------------------------------------------------------------
// Je Thema: was du sagst (`say`), Antworten bei Erfolg (`ok`), bei Misserfolg
// (`fail`) und wenn das Thema gerade kaum nötig war (`meh`). Dazu je
// stärkstem Charakterzug ein Nachsatz (`TRAIT_TAIL`) und eine Geste.
// Platzhalter: {coach} = Anrede des Trainers („Trainer“ / „Coach“ ab 2000),
// {club} = Vereinsname. Auswahl in game/playerTalk.ts.
// =============================================================================
import type { TalkKind } from '../engine/dressingRoom';
import type { PersonaTrait } from '../engine/persona';

export interface TalkLines { say: string; ok: string[]; fail: string[]; meh: string[] }

export const TALK_LINES: Record<TalkKind, TalkLines> = {
  training: {
    say: 'Du hast gut trainiert!',
    ok: ['Danke, {coach}. Ich merke selbst, dass es läuft.', 'Freut mich, dass Sie das sehen. Ich bleibe dran.', 'Das tut gut zu hören. Die Beine fühlen sich gerade richtig leicht an.'],
    fail: ['Training ist Training. Am Samstag zählt es.', 'Schön und gut – aber spielen darf ich trotzdem nicht.', 'Hm. Das sagen Sie jedem.'],
    meh: ['Ja, ich weiß. Danke.', 'Klar, {coach}. Das ist mein Job.'],
  },
  loben: {
    say: 'Starke Leistung zuletzt – weiter so!',
    ok: ['Danke! Das gebe ich gern an die Jungs weiter.', 'So soll es weitergehen, {coach}.', 'Endlich hat es mal geklappt. Das gibt Selbstvertrauen.'],
    fail: ['War doch nichts Besonderes.', 'Ein Spiel macht noch keine Saison.', 'Lob brauche ich nicht – ich brauche Einsatzzeit.'],
    meh: ['Danke, {coach}. Ich weiß, was ich kann.', 'Schon gut, das kenne ich.'],
  },
  fordern: {
    say: 'Gib im Training alles!',
    ok: ['Verstanden. Ab morgen bin ich der Erste auf dem Platz.', 'Sie haben recht – ich habe zuletzt geschludert.', 'Ich ziehe an, versprochen.'],
    fail: ['Ich gebe doch alles. Was wollen Sie denn noch?', 'Das sehe ich anders, {coach}.', 'Immer auf mich – andere schonen sich viel mehr.'],
    meh: ['Mache ich doch längst.', 'Natürlich. Wie immer.'],
  },
  pause: {
    say: 'Ich gönne dir eine Pause. Du bist müde.',
    ok: ['Danke, das brauche ich wirklich. Die Beine sind schwer.', 'Ein Tag Ruhe, dann bin ich wieder voll da.', 'Gut, dass Sie das merken. Ich war platt.'],
    fail: ['Ich bin nicht müde! Ich will spielen.', 'Pause? Wollen Sie mich aus der Mannschaft nehmen?', 'Ich brauche keine Schonung.'],
    meh: ['Müde? Ich fühle mich eigentlich frisch.', 'Wenn Sie meinen …'],
  },
  topform: {
    say: 'Im nächsten Spiel brauche ich dich in Topform.',
    ok: ['Sie können sich auf mich verlassen.', 'Ich bin bereit. Das Spiel gewinnen wir.', 'Genau für solche Spiele trainiere ich.'],
    fail: ['Setzen Sie mich nicht so unter Druck.', 'Ich versuche es – mehr kann ich nicht sagen.', 'Das macht es nicht leichter, {coach}.'],
    meh: ['Bin ich doch immer.', 'Klar.'],
  },
  ziele: {
    say: 'Ich möchte von dir gerne höhere Ziele sehen.',
    ok: ['Das will ich auch. Ich will hier etwas erreichen.', 'Sie glauben an mich? Dann zeige ich es Ihnen.', 'Ich habe noch viel vor – danke, dass Sie das sehen.'],
    fail: ['Ich weiß selbst, was ich mir vornehme.', 'In meinem Alter muss man mir das nicht mehr sagen.', 'Ziele … erstmal will ich regelmäßig spielen.'],
    meh: ['Das sage ich mir jeden Tag.', 'Schon klar, {coach}.'],
  },
  kritisieren: {
    say: 'Das war zu wenig zuletzt. Ich erwarte mehr von dir.',
    ok: ['Sie haben recht. Das war nicht gut genug.', 'Ich weiß. Ich zeige im nächsten Spiel ein anderes Gesicht.', 'Das nehme ich mir zu Herzen.'],
    fail: ['Andere waren viel schlechter, und die kritisieren Sie nicht.', 'Das ist unfair, {coach}.', 'Wenn Sie meinen. Ich sehe das anders.'],
    meh: ['Zuletzt? Ich fand mich ganz ordentlich.', 'Na gut.'],
  },
  einsatz: {
    say: 'Du bekommst deine Chancen – versprochen.',
    ok: ['Das ist alles, was ich will. Danke!', 'Dann werde ich bereit sein.', 'Ich nehme Sie beim Wort, {coach}.'],
    fail: ['Das habe ich schon mal gehört.', 'Mal sehen, ob das stimmt.'],
    meh: ['Spiele ich doch ohnehin.', 'Gut zu wissen.'],
  },
  beruhigen: {
    say: 'Was bedrückt dich? Lass uns reden.',
    ok: ['Gut, dass Sie fragen. Es tut gut, das loszuwerden.', 'Ehrlich gesagt: Es läuft nicht rund. Aber danke fürs Zuhören.', 'Mit Ihnen kann man reden, {coach}.'],
    fail: ['Alles in Ordnung. Wirklich.', 'Das ist meine Sache.', 'Reden hilft da auch nicht weiter.'],
    meh: ['Mir geht es gut, {coach}.', 'Nichts. Alles bestens.'],
  },
  zukunft: {
    say: 'Wir planen langfristig mit dir.',
    ok: ['Das bedeutet mir viel. Ich fühle mich wohl bei {club}.', 'Dann sollten wir bald über den Vertrag reden.', 'Gut zu hören – dann bleibe ich ruhig.'],
    fail: ['Worte sind billig. Ich will ein Angebot sehen.', 'Das haben schon andere gesagt.', 'Mal sehen. Ich halte mir alles offen.'],
    meh: ['Schön. Mein Vertrag läuft ja noch.', 'Davon gehe ich aus.'],
  },
  fuehrung: {
    say: 'Ich sehe dich als Führungsspieler. Geh voran.',
    ok: ['Das mache ich. Die Jungs hören auf mich.', 'Verantwortung? Gern. Ich gehe voran.', 'Danke für das Vertrauen, {coach}.'],
    fail: ['Ich bin nicht der Lautsprecher-Typ.', 'Dafür gibt es doch andere.', 'Ich kümmere mich lieber um mein eigenes Spiel.'],
    meh: ['Mache ich doch schon.', 'Wenn Sie meinen.'],
  },
};

/** Nachsatz je stärkstem Charakterzug (nur gelegentlich, damit es nicht gleich klingt). */
export const TRAIT_TAIL: Record<PersonaTrait, { ok: string; fail: string }> = {
  ehrgeiz: { ok: 'Ich will Titel gewinnen.', fail: 'Ich bin nicht hier, um Mittelmaß zu spielen.' },
  loyalitaet: { ok: 'Für den Verein mache ich alles.', fail: 'Ich hänge an diesem Verein – aber das hier gefällt mir nicht.' },
  geld: { ok: 'Wenn es läuft, stimmt am Ende auch die Prämie.', fail: 'Vielleicht sollte mein Berater mal mit dem Präsidium reden.' },
  heimat: { ok: 'Hier bin ich zu Hause.', fail: 'Manchmal denke ich an früher, zu Hause.' },
  abenteuer: { ok: 'Mal sehen, wohin mich das noch führt.', fail: 'Es gibt auch andere Ligen.' },
  rampenlicht: { ok: 'Die Zeitungen werden schon wieder über mich schreiben.', fail: 'Die Presse sieht das übrigens anders.' },
  familie: { ok: 'Meine Familie fühlt sich hier auch wohl.', fail: 'Ich muss das auch mit meiner Frau besprechen.' },
};

/** Gesten (Erzähltext unter der Antwort). */
export const GESTURE = {
  ok: ['Er nickt und reicht dir die Hand.', 'Er lächelt und klopft dir auf die Schulter.', 'Er wirkt erleichtert.', 'Er geht sichtbar zufrieden zurück zur Gruppe.'],
  fail: ['Er verschränkt die Arme.', 'Er schaut an dir vorbei.', 'Er zuckt mit den Schultern und geht.', 'Er schüttelt den Kopf.'],
  meh: ['Er nickt kurz.', 'Er zuckt mit den Schultern.'],
};
