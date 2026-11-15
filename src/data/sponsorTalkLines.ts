// =============================================================================
// Sätze des Sponsors am Verhandlungstisch (game/sponsorTalk.ts). Geschäftlich,
// höflich, per „ihr“ an den Verein; keine echten Firmen oder Personen.
// =============================================================================
export const SPONSOR_OPEN = {
  fresh: ['„Wir sehen großes Potenzial in einer Partnerschaft mit euch.“', '„Unser Haus möchte mit eurem Verein wachsen. Reden wir über die Bedingungen.“', '„Wir haben uns gut vorbereitet – hier ist unser Angebot.“'],
  renewal: ['„Die Zusammenarbeit war für beide Seiten gut. Wir würden gern weitermachen.“', '„Wir kennen uns, wir schätzen uns. Lasst uns verlängern.“'],
  naming: ['„Ein Stadion mit unserem Namen – das wäre ein starkes Zeichen.“', '„Euer Stadion hat Strahlkraft. Wir möchten die Namensrechte.“'],
};

export const SPONSOR_REPLY: Record<string, string[]> = {
  insult: ['„Das ist weit weg von jeder Marktrealität.“', '„So viel ist uns die Fläche nicht wert – bei weitem nicht.“'],
  far: ['„Da liegen wir noch deutlich auseinander.“', '„Das müssen wir intern erst einmal verdauen. So geht es nicht.“'],
  gap: ['„Wir nähern uns, aber das Budget hat Grenzen.“', '„Die Richtung stimmt, der Betrag noch nicht.“'],
  close: ['„Fast. Ein kleiner Schritt von euch, dann haben wir es.“', '„Wir sind dicht dran. Unsere Geschäftsführung braucht nur noch ein Entgegenkommen.“'],
  accept: ['„Einverstanden – wir unterschreiben.“', '„Abgemacht. Auf eine erfolgreiche Partnerschaft!“', '„Das passt. Die Verträge gehen heute noch raus.“'],
  breakoff: ['„Unter diesen Bedingungen ziehen wir unser Angebot zurück.“', '„Wir investieren unser Werbebudget dann anderswo. Alles Gute.“'],
};

/** Hinweis, wo die Forderung am meisten drückt (Schlüssel = Punkt bzw. Klauselart). */
export const SPONSOR_FOCUS: Record<string, string> = {
  value: '„Der Jahresbetrag ist der Knackpunkt.“',
  years: '„Uns ist eine längere Bindung lieber.“',
  title: '„Die Meisterprämie ist uns zu hoch angesetzt.“',
  cup: '„Bei der Pokalprämie müsst ihr nachgeben.“',
  euro: '„Die Europapokal-Prämie können wir so nicht tragen.“',
  survive: '„Für den Klassenerhalt zahlen wir nicht so viel extra.“',
  option: '„Eine Option allein zu euren Gunsten ist für uns schwierig.“',
  camp: '„Die Reise in unser Land ist Teil unseres Marketings – darauf bestehen wir.“',
  exclusive: '„Ohne Exklusivität in unserer Branche lohnt sich das für uns nicht.“',
  minPlace: '„Wir zahlen für Erfolg – die Mindestplatzierung brauchen wir.“',
  relegationExit: '„Für die zweite Liga haben wir kein Budget. Die Ausstiegsklausel bleibt.“',
  relegationCut: '„Bei einem Abstieg müssen wir weniger zahlen können.“',
  friendly: '„Das Freundschaftsspiel bei uns ist für die Belegschaft wichtig.“',
};
