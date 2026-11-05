// =============================================================================
// FAN-MEDIUM JE EPOCHE (Zentrale, rechte Spalte unten)
// -----------------------------------------------------------------------------
// Wie erfuhren Fans Neuigkeiten über ihren Verein? Das Gerät/Medium wechselt mit
// der Zeit; Inhalt ist immer derselbe (Vereinsnachrichten + Gerüchte aus der Presse).
// Quellen:
// - Videotext (ARD/ZDF) gemeinsam ab 1. Juni 1980:
//   https://www.teltarif.de/videotext-geburtstag-teletext/news/38944.html
// - Handy/SMS als Massenmedium um 2000 („Rekordzuwächse im Mobilfunk“):
//   https://www.teltarif.de/chronik/2000/ ; SMS-Boom: https://www.computerwoche.de/article/2689914/15-jahre-sms-ein-community-phaenomen.html
// - Smartphone-Apps: iPhone in Deutschland ab 9.11.2007, App Store ab 10.7.2008
//   (Vereins-Apps der Bundesligisten ab etwa 2009/10).
// Vor 1980: gedrucktes Stadionheft/Vereinszeitung (Programmheft am Spieltag).
// =============================================================================

export type FanDeviceKind = 'heft' | 'videotext' | 'sms' | 'app';

export interface FanDevice {
  kind: FanDeviceKind;
  /** Kopfzeile des Widgets. */
  title: string;
  /** Kurzer Erklärsatz (Hover). */
  hint: string;
}

/** Medium am Datum `iso` (UTC). */
export function fanDeviceFor(iso: string): FanDevice {
  if (iso < '1980-06-01') return { kind: 'heft', title: 'Stadionheft', hint: 'Vereinsnachrichten aus dem Stadionheft – vor dem Videotext das wichtigste Blatt der Fans.' };
  if (iso < '1999-01-01') return { kind: 'videotext', title: 'Videotext', hint: 'Videotext der öffentlich-rechtlichen Sender (seit Juni 1980): Kurzmeldungen auf Tafel 200 ff.' };
  if (iso < '2008-07-10') return { kind: 'sms', title: 'SMS-Dienst', hint: 'Vereinsnachrichten als SMS aufs Handy – um 2000 wird das Handy zum Massenmedium.' };
  return { kind: 'app', title: 'Fan-App', hint: 'Vereinsnachrichten und Gerüchte in der Fan-App (App Store seit Juli 2008).' };
}
