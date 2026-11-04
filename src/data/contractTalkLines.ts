// =============================================================================
// VERTRAGSVERHANDLUNG — Sätze von Spieler, Berater und Sportdirektor
// (Grammatik wie der Ticker, siehe data/ticker/grammar.ts: #symbol#, {slot},
// [a|b], @Jahr-, ?flag, !flag). Flag `agent` = ein Berater spricht.
// Slots: {name} Nachname, {agent} „sein Berater/Anwalt/Manager“, {Agent} groß,
// {club} dein Verein, {focus} Vertragspunkt, {wage} Gehalt, {years} Laufzeit,
// {rival} Interessent, {x} Betrag/Detail.
// =============================================================================
import type { Grammar } from './ticker/grammar';

export const CONTRACT_GRAMMAR: Grammar = {
  // ---------------------------------------------------------------- Eröffnung
  open_gern: [
    '„Ich fühle mich hier wohl. Lass uns das schnell hinbekommen.“',
    '„Ich will bleiben – wenn das Angebot fair ist, unterschreibe ich.“',
    '„{club} ist mein Verein. Ich hoffe, ihr seht das genauso.“',
    '@-1989 „Ich bin hier zu Hause. Über die Mark werden wir uns schon einig.“',
    '@2002- „Ich habe hier alles, was ich brauche. Mach mir ein faires Angebot.“',
  ],
  open_offen: [
    '„Ich höre mir an, was ihr vorhabt.“',
    '„Ich kann mir vorstellen zu bleiben – es muss aber passen.“',
    '„Bevor ich unterschreibe, will ich sehen, was ihr mir bietet.“',
    '„Mal sehen, was ihr mir zahlen wollt.“',
  ],
  open_zoeg: [
    '„Ehrlich gesagt bin ich mir nicht sicher, ob ich bleiben will.“',
    '„Andere Vereine haben auch schöne Stadien.“',
    '„Da müsst ihr euch schon etwas einfallen lassen.“',
    '„Ich weiß, was ich wert bin.“',
  ],
  agent_open: [
    '{Agent} legt eine Mappe auf den Tisch: „Mein Mandant hat klare Vorstellungen.“',
    '{Agent} lehnt sich zurück: „Fangen wir mit den Zahlen an.“',
    '{Agent}: „Wir sind gekommen, um zu verhandeln, nicht um zu plaudern.“',
    '@1995- {Agent} schiebt ein ausgedrucktes Papier über den Tisch: „Unsere Forderungen.“',
    '@2008- {Agent} tippt auf sein Telefon: „Ich habe nicht den ganzen Tag. Was bietet ihr?“',
    '@-1994 {Agent} raucht eine Zigarre und lächelt: „Na, dann zeigt mal, was ihr habt.“',
  ],

  // ---------------------------------------------------------------- Zusage
  accept: [
    '!agent „Abgemacht. Wo soll ich unterschreiben?“',
    '!agent „Das klingt gut. Ich bin dabei.“',
    '!agent „Einverstanden – ich gebe alles für {club}.“',
    '!agent „Damit kann ich leben. Handschlag drauf.“',
    '?agent {Agent} nickt: „Das ist ein Angebot, das wir annehmen können.“',
    '?agent {Agent} steckt den Füller ein: „Mein Mandant unterschreibt.“',
  ],

  // ---------------------------------------------------------------- Ablehnungen
  close: [
    '!agent „Wir sind nah dran. Ein kleines Stück noch.“',
    '!agent „Fast. Aber eben nur fast.“',
    '!agent „Da fehlt nicht mehr viel – legt noch etwas drauf.“',
    '?agent {Agent}: „Wir sind beinahe einig. Beinahe.“',
    '?agent {Agent}: „Noch ein letzter Schritt, dann haben wir es.“',
  ],
  gap: [
    '!agent „Das reicht mir noch nicht.“',
    '!agent „Da müsst ihr nachbessern.“',
    '!agent „So unterschreibe ich nicht.“',
    '?agent {Agent} schüttelt den Kopf: „Das ist nicht, was wir besprochen haben.“',
    '?agent {Agent}: „Damit kann ich meinem Mandanten nicht kommen.“',
  ],
  far: [
    '!agent „Das ist weit weg von dem, was ich mir vorstelle.“',
    '!agent „Ist das euer Ernst?“',
    '!agent „Da liegen Welten dazwischen.“',
    '?agent {Agent} lacht kurz: „Das ist ein Scherz, oder?“',
    '?agent {Agent}: „Mit so einem Angebot verschwenden wir beide unsere Zeit.“',
  ],
  insult: [
    '!agent „Das ist eine Frechheit. So wenig bin ich euch wert?“',
    '!agent „Ich fühle mich nicht ernst genommen.“',
    '!agent „Das empfinde ich als Beleidigung.“',
    '?agent {Agent} steht auf: „Für so ein Angebot bin ich nicht hergekommen.“',
    '?agent {Agent}: „Das werde ich meinem Mandanten nicht einmal vorlegen.“',
  ],
  breakoff: [
    '!agent „Ich habe genug. Wir reden ein andermal.“',
    '!agent „Das bringt nichts. Ich brauche erst mal Abstand.“',
    '?agent {Agent} packt seine Unterlagen ein: „Wir melden uns – vielleicht.“',
    '?agent {Agent}: „Die Gespräche sind für uns beendet.“',
  ],
  counter: [
    '!agent Gegenvorschlag: {x}.',
    '!agent „So würde ich es machen: {x}.“',
    '?agent {Agent} schreibt auf einen Zettel: {x}.',
    '?agent {Agent}: „Unser Vorschlag: {x}.“',
  ],
  package: [
    '!agent „Wenn ihr beim {focus} etwas drauflegt, komme ich euch beim Gehalt entgegen.“',
    '!agent „Mehr {focus}, dafür weniger Gehalt – darüber können wir reden.“',
    '?agent {Agent}: „Beim {focus} hättet ihr Spielraum – dann geht er beim Gehalt runter.“',
  ],

  // ---------------------------------------------------------------- Woran hakt es?
  focus_wage: ['„Beim Gehalt liegen wir noch auseinander.“', '„Das Grundgehalt ist mir zu niedrig.“', '?agent {Agent}: „Das Fixum stimmt nicht.“'],
  focus_years: ['„Die Laufzeit passt mir nicht – {years}.“', '„Über die Laufzeit müssen wir noch reden: {years}.“'],
  focus_signing: ['„Ohne ordentliches Handgeld unterschreibe ich nicht.“', '„Ein Handgeld gehört dazu.“', '?agent {Agent}: „Das Handgeld ist zu mager.“'],
  focus_appearance: ['„Ich will für jeden Einsatz belohnt werden.“', '„Eine Einsatzprämie wäre fair.“'],
  focus_goal: ['„Wer Tore schießt, soll dafür auch etwas bekommen.“', '„Ich will eine Torprämie.“'],
  focus_cleanSheet: ['„Für jedes Spiel ohne Gegentor eine Prämie – das ist üblich.“', '„Die Zu-null-Prämie fehlt mir.“'],
  focus_title: ['„Wenn wir etwas gewinnen, will ich beteiligt sein.“', '„Eine Titelprämie gehört in den Vertrag.“'],
  focus_stay: ['„Wenn wir drinbleiben, will ich etwas davon haben.“', '„Für den Klassenerhalt eine Prämie – sonst nicht.“'],
  focus_raise: ['„Das Gehalt muss mit den Jahren steigen.“', '„Ich will eine Staffelung.“'],
  focus_fixedFee: ['„Ich will wissen, was ich nach dem Vertrag koste – schreibt die Ablöse fest.“', '„Die Ablöse muss niedrig festgeschrieben werden, sonst sitze ich hier fest.“'],
  focus_release: ['„Ich brauche eine Ausstiegsklausel.“', '„Ohne Ausstiegsklausel unterschreibe ich nicht.“', '?agent {Agent}: „Die Ausstiegsklausel ist zu hoch.“'],
  focus_option: ['„Eine Option für den Verein kommt nicht in Frage.“', '„Über die Option reden wir noch.“'],
  focus_relegation: ['„Weniger Gehalt beim Abstieg? Das gefällt mir nicht.“', '„Die Abstiegsklausel muss raus.“'],
  focus_promises: ['„Ich will eine klare Zusage, welche Rolle ich spiele.“', '„Mir geht es um meine Rolle in der Mannschaft.“'],
  focus_agent: ['?agent {Agent}: „Und wo bleibe ich?“', '?agent {Agent}: „Meine Provision ist nicht verhandelbar.“', '?agent {Agent} räuspert sich: „Meine Arbeit will auch bezahlt werden.“'],
  focus_loyalty: ['„Wer bleibt, soll am Ende belohnt werden.“', '„Eine Treueprämie wäre ein Zeichen.“'],
  focus_success: ['„Wenn wir international spielen, will ich mehr verdienen.“', '„Eine Erfolgsklausel gehört dazu.“'],

  // ---------------------------------------------------------------- Konkurrenz
  bluff_claim: [
    '?agent {Agent}: „Ich will offen sein: Es gibt Anfragen von anderen Vereinen.“',
    '?agent {Agent}: „Ihr seid nicht die Einzigen, die sich für ihn interessieren.“',
    '?agent {Agent} lässt beiläufig fallen: „Ein großer Verein hat schon angerufen.“',
    '!agent „Ich habe Angebote von anderen Vereinen, das sollt ihr wissen.“',
  ],
  sd_confirm: [
    'Dein Sportdirektor bestätigt: {rival} ist tatsächlich interessiert.',
    'Dein Sportdirektor hat sich umgehört – {rival} beobachtet ihn wirklich.',
  ],
  sd_deny: [
    'Dein Sportdirektor hat davon nichts gehört – vermutlich ein Bluff.',
    'Dein Sportdirektor kann kein konkretes Interesse finden.',
  ],
  sd_unsure: [
    'Dein Sportdirektor ist sich nicht sicher, ob an den Gerüchten etwas dran ist.',
  ],
};
