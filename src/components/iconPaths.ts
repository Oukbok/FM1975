// =============================================================================
// ICON-SET "Set C" (Duotone / Flat modern) — Single Source of Truth
// =============================================================================
// Alle 14 UI-Icons als reines Inline-SVG (viewBox 0 0 24 24, gleiche optische
// Größe/Gewicht). Zweifarbig: Off-White-Basis + GENAU EIN türkises Akzent-
// element pro Icon. Farben werden über die Platzhalter %BASE% / %ACCENT%
// eingesetzt und beim Laden durch feste Hex-Werte ersetzt:
//   Off-White  #e8edf4  (= Theme var(--text))
//   Türkis     #00d9ff  (= Theme var(--accent))
// Dieselben Rohdaten erzeugen via scripts/gen-icons.mjs die einzelnen
// public/assets/icons/*.svg — Stil bleibt garantiert identisch.
// Neue Icons: hier einen weiteren Eintrag ergänzen (siehe docs/ICON_STYLE.md).
// =============================================================================

/** Feste Icon-Farben (bewusst hart kodiert für Pixel-Konsistenz mit den .svg). */
export const BASE = '#e8edf4';
export const ACCENT = '#00d9ff';

/** Material-Zahnrad (ein Zahn-Ring mit Loch, evenodd) — als Basisform. */
const GEAR =
  'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58Z';

/**
 * Roh-Markup je Icon (nur SVG-Kindelemente, ohne <svg>-Rahmen).
 * Attribut-Schreibweise (kebab-case), da als HTML in die DOM injiziert.
 */
export const RAW: Record<string, string> = {
  // 1) Neues Spiel — türkises Play-Dreieck
  newGame:
    '<polygon points="8 5.5 18.5 12 8 18.5" fill="%ACCENT%" stroke="%ACCENT%" stroke-width="1.6" stroke-linejoin="round"/>',

  // 2) Spiel laden — weißer Ordner mit türkisem Download-Pfeil
  loadGame:
    '<path d="M3 7.5a1.5 1.5 0 0 1 1.5-1.5h3.8l2 2h8.2A1.5 1.5 0 0 1 20 9.5V17a1.5 1.5 0 0 1-1.5 1.5h-14A1.5 1.5 0 0 1 3 17Z" fill="%BASE%"/>' +
    '<path d="M11 9.6h2v2.8h1.95L12 15.35 9.05 12.4H11Z" fill="%ACCENT%"/>',

  // 3) Einstellungen — weißes Zahnrad mit transparentem (leerem) Mittelloch
  settings:
    // Innenkreis bewusst TRANSPARENT: der Kreis-Subpfad stanzt per evenodd ein echtes
    // Loch in das Zahnrad (statt tuerkiser Fuellung); ein duenner Off-White-Ring bleibt
    // als reine Kontur stehen.
    `<path fill-rule="evenodd" d="${GEAR} M15 12 a3 3 0 1 0 -6 0 a3 3 0 1 0 6 0 z" fill="%BASE%"/>` +
    '<circle cx="12" cy="12" r="3" fill="none" stroke="%BASE%" stroke-width="1.4"/>',

  // 4) Spiel verlassen — türkises Power-Symbol
  quit:
    '<path d="M7.7 8.4a5.6 5.6 0 1 0 8.6 0" fill="none" stroke="%ACCENT%" stroke-width="2.3" stroke-linecap="round"/>' +
    '<line x1="12" y1="4.5" x2="12" y2="11.4" stroke="%ACCENT%" stroke-width="2.3" stroke-linecap="round"/>',

  // 5) Spielplan — weißer Kalender mit türkisen Tages-Kacheln
  schedule:
    '<rect x="3.5" y="5.5" width="17" height="14" rx="2.2" fill="%BASE%"/>' +
    '<rect x="7" y="3.2" width="1.8" height="3.8" rx="0.9" fill="%BASE%"/>' +
    '<rect x="15.2" y="3.2" width="1.8" height="3.8" rx="0.9" fill="%BASE%"/>' +
    '<rect x="6.2" y="12" width="2.7" height="2.7" rx="0.5" fill="%ACCENT%"/>' +
    '<rect x="10.65" y="12" width="2.7" height="2.7" rx="0.5" fill="%ACCENT%"/>' +
    '<rect x="15.1" y="12" width="2.7" height="2.7" rx="0.5" fill="%ACCENT%"/>',

  // 6) Kader — drei Personen, vordere türkis, hintere weiß
  squad:
    '<path d="M4 19.2c0-3.4 2.6-5.8 6-5.8h4c3.4 0 6 2.4 6 5.8v.4H4Z" fill="%BASE%"/>' +
    '<circle cx="7.4" cy="8.2" r="2.2" fill="%BASE%"/>' +
    '<circle cx="16.6" cy="8.2" r="2.2" fill="%BASE%"/>' +
    '<path d="M6.4 20c0-3.1 2.5-5.6 5.6-5.6s5.6 2.5 5.6 5.6v.3H6.4Z" fill="%ACCENT%"/>' +
    '<circle cx="12" cy="8.6" r="2.8" fill="%ACCENT%"/>',

  // 7) Aufstellung — weißes Spielfeld mit türkisen Formationspunkten
  lineup:
    '<rect x="4" y="3" width="16" height="18" rx="2" fill="none" stroke="%BASE%" stroke-width="1.6"/>' +
    '<line x1="4" y1="12" x2="20" y2="12" stroke="%BASE%" stroke-width="1.4"/>' +
    '<circle cx="12" cy="12" r="2.4" fill="none" stroke="%BASE%" stroke-width="1.4"/>' +
    '<circle cx="12" cy="6.2" r="1.15" fill="%ACCENT%"/>' +
    '<circle cx="8" cy="7.8" r="1.15" fill="%ACCENT%"/>' +
    '<circle cx="16" cy="7.8" r="1.15" fill="%ACCENT%"/>' +
    '<circle cx="7.5" cy="16.4" r="1.15" fill="%ACCENT%"/>' +
    '<circle cx="12" cy="17" r="1.15" fill="%ACCENT%"/>' +
    '<circle cx="16.5" cy="16.4" r="1.15" fill="%ACCENT%"/>',

  // 8) Transfers — türkise Kreis-Pfeile um weißen Münzstapel
  transfers:
    '<path d="M6.5 8.6a6.6 6.6 0 0 1 10.4-1.3" fill="none" stroke="%ACCENT%" stroke-width="2" stroke-linecap="round"/>' +
    '<polygon points="18 3.8 18.4 8 14.4 7" fill="%ACCENT%"/>' +
    '<path d="M17.5 15.4a6.6 6.6 0 0 1 -10.4 1.3" fill="none" stroke="%ACCENT%" stroke-width="2" stroke-linecap="round"/>' +
    '<polygon points="6 20.2 5.6 16 9.6 17" fill="%ACCENT%"/>' +
    '<rect x="9.1" y="9.6" width="5.8" height="3.4" fill="%BASE%"/>' +
    '<ellipse cx="12" cy="13" rx="2.9" ry="1.05" fill="%BASE%"/>' +
    '<ellipse cx="12" cy="11.3" rx="2.9" ry="1.05" fill="%BASE%"/>' +
    '<ellipse cx="12" cy="9.6" rx="2.9" ry="1.05" fill="%BASE%"/>',

  // 9) Pokal — weiße Trophäe mit türkisem Stern
  trophy:
    '<path d="M7 4h10v3a5 5 0 0 1-10 0Z" fill="%BASE%"/>' +
    '<path d="M7 4.8C4.8 4.8 3.5 6 3.5 7.8 3.5 9.6 5 10.6 7 10.6" fill="none" stroke="%BASE%" stroke-width="1.5"/>' +
    '<path d="M17 4.8c2.2 0 3.5 1.2 3.5 3 0 1.8-1.5 2.8-3.5 2.8" fill="none" stroke="%BASE%" stroke-width="1.5"/>' +
    '<rect x="11" y="11.6" width="2" height="3.2" fill="%BASE%"/>' +
    '<path d="M9 14.6h6l-.8 2.4H9.8Z" fill="%BASE%"/>' +
    '<rect x="7.8" y="18.4" width="8.4" height="2.2" rx="0.6" fill="%BASE%"/>' +
    '<rect x="9.2" y="16.8" width="5.6" height="1.8" rx="0.4" fill="%BASE%"/>' +
    '<polygon points="12 5.2 12.9 7 14.9 7.2 13.4 8.6 13.8 10.6 12 9.6 10.2 10.6 10.6 8.6 9.1 7.2 11.1 7" fill="%ACCENT%"/>',

  // 10) Finanzen — weiße Münzstapel + türkises Balkendiagramm
  finances:
    '<rect x="4.5" y="13" width="6" height="4" fill="%BASE%"/>' +
    '<ellipse cx="7.5" cy="17" rx="3" ry="1.1" fill="%BASE%"/>' +
    '<ellipse cx="7.5" cy="15" rx="3" ry="1.1" fill="%BASE%"/>' +
    '<ellipse cx="7.5" cy="13" rx="3" ry="1.1" fill="%BASE%"/>' +
    '<rect x="12.6" y="13" width="2.2" height="6" rx="0.4" fill="%ACCENT%"/>' +
    '<rect x="15.5" y="10.5" width="2.2" height="8.5" rx="0.4" fill="%ACCENT%"/>' +
    '<rect x="18.4" y="8" width="2.2" height="11" rx="0.4" fill="%ACCENT%"/>',

  // 11) Stadion — weiße Stadionschüssel mit türkisen Flutlichtern + Eingang
  stadium:
    '<line x1="6.6" y1="6" x2="6.6" y2="9" stroke="%BASE%" stroke-width="1"/>' +
    '<line x1="17.4" y1="6" x2="17.4" y2="9" stroke="%BASE%" stroke-width="1"/>' +
    '<circle cx="5.8" cy="4.6" r="0.7" fill="%ACCENT%"/><circle cx="7" cy="4.6" r="0.7" fill="%ACCENT%"/>' +
    '<circle cx="5.8" cy="5.8" r="0.7" fill="%ACCENT%"/><circle cx="7" cy="5.8" r="0.7" fill="%ACCENT%"/>' +
    '<circle cx="17" cy="4.6" r="0.7" fill="%ACCENT%"/><circle cx="18.2" cy="4.6" r="0.7" fill="%ACCENT%"/>' +
    '<circle cx="17" cy="5.8" r="0.7" fill="%ACCENT%"/><circle cx="18.2" cy="5.8" r="0.7" fill="%ACCENT%"/>' +
    '<path fill-rule="evenodd" d="M3 13a9 5 0 1 0 18 0a9 5 0 1 0 -18 0Z M7.5 12.4a4.5 2.4 0 1 0 9 0a4.5 2.4 0 1 0 -9 0Z" fill="%BASE%"/>' +
    '<ellipse cx="12" cy="12.4" rx="4" ry="2.1" fill="%ACCENT%"/>' +
    '<rect x="10.9" y="14.4" width="2.2" height="2.4" rx="0.4" fill="%ACCENT%"/>',

  // 12) Nachrichten — weiße Zeitung mit türkisem Bild-Block (Textzeilen ausgestanzt)
  news:
    '<path fill-rule="evenodd" d="M4 5.5h14.5a1.5 1.5 0 0 1 1.5 1.5v11a1.5 1.5 0 0 1-1.5 1.5H4Z ' +
    'M12 8.4h5v1.2h-5Z M12 10.6h5v1.2h-5Z M12 12.8h5v1.2h-5Z M6 14.8h11v1.2H6Z M6 16.8h11v1.2H6Z" fill="%BASE%"/>' +
    '<rect x="6" y="8" width="4.8" height="4.2" rx="0.6" fill="%ACCENT%"/>',

  // 13) Speichern — weiße Diskette (Label ausgestanzt) mit türkisem Schieber
  save:
    '<path fill-rule="evenodd" d="M5 4h11l3 3v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z M8 13.5h8v4.5H8Z" fill="%BASE%"/>' +
    '<rect x="9" y="4" width="5" height="4" rx="0.3" fill="%ACCENT%"/>' +
    '<rect x="12" y="4.6" width="1.5" height="2.8" rx="0.2" fill="%BASE%"/>',

  // 14) Spiel/Anpfiff — klassischer Fußball: weiße Kugel mit türkisen Fünfecken
  matchball:
    '<circle cx="12" cy="12" r="9" fill="%BASE%" stroke="%ACCENT%" stroke-width="0.9"/>' +
    '<polygon points="12,8.4 15.42,10.89 14.12,14.91 9.88,14.91 8.58,10.89" fill="%ACCENT%"/>' +
    '<line x1="12" y1="8.4" x2="12" y2="3.8" stroke="%ACCENT%" stroke-width="1.25" stroke-linecap="round"/>' +
    '<line x1="15.42" y1="10.89" x2="19.8" y2="9.47" stroke="%ACCENT%" stroke-width="1.25" stroke-linecap="round"/>' +
    '<line x1="14.12" y1="14.91" x2="16.82" y2="18.63" stroke="%ACCENT%" stroke-width="1.25" stroke-linecap="round"/>' +
    '<line x1="9.88" y1="14.91" x2="7.18" y2="18.63" stroke="%ACCENT%" stroke-width="1.25" stroke-linecap="round"/>' +
    '<line x1="8.58" y1="10.89" x2="4.2" y2="9.47" stroke="%ACCENT%" stroke-width="1.25" stroke-linecap="round"/>' +
    '<polygon points="12,3.9 13.43,4.94 12.88,6.61 11.12,6.61 10.57,4.94" fill="%ACCENT%"/>' +
    '<polygon points="18.28,8.46 19.71,9.5 19.16,11.17 17.4,11.17 16.85,9.5" fill="%ACCENT%"/>' +
    '<polygon points="15.88,15.84 17.31,16.88 16.76,18.55 15.0,18.55 14.45,16.88" fill="%ACCENT%"/>' +
    '<polygon points="8.12,15.84 9.55,16.88 9.0,18.55 7.24,18.55 6.69,16.88" fill="%ACCENT%"/>' +
    '<polygon points="5.72,8.46 7.15,9.5 6.6,11.17 4.84,11.17 4.29,9.5" fill="%ACCENT%"/>',

  // 14b) Spiel (Kalender) — rein weisser Fussball: weisse Kugel, Muster als feine dunkle Nahtlinien
  matchballwhite:
    '<circle cx="12" cy="12" r="9" fill="%BASE%" stroke="#0e1420" stroke-width="0.7"/>' +
    '<polygon points="12,8.4 15.42,10.89 14.12,14.91 9.88,14.91 8.58,10.89" fill="none" stroke="#0e1420" stroke-width="0.85" stroke-linejoin="round"/>' +
    '<line x1="12" y1="8.4" x2="12" y2="3.8" stroke="#0e1420" stroke-width="0.85" stroke-linecap="round"/>' +
    '<line x1="15.42" y1="10.89" x2="19.8" y2="9.47" stroke="#0e1420" stroke-width="0.85" stroke-linecap="round"/>' +
    '<line x1="14.12" y1="14.91" x2="16.82" y2="18.63" stroke="#0e1420" stroke-width="0.85" stroke-linecap="round"/>' +
    '<line x1="9.88" y1="14.91" x2="7.18" y2="18.63" stroke="#0e1420" stroke-width="0.85" stroke-linecap="round"/>' +
    '<line x1="8.58" y1="10.89" x2="4.2" y2="9.47" stroke="#0e1420" stroke-width="0.85" stroke-linecap="round"/>' +
    '<polygon points="12,3.9 13.43,4.94 12.88,6.61 11.12,6.61 10.57,4.94" fill="none" stroke="#0e1420" stroke-width="0.7" stroke-linejoin="round"/>' +
    '<polygon points="18.28,8.46 19.71,9.5 19.16,11.17 17.4,11.17 16.85,9.5" fill="none" stroke="#0e1420" stroke-width="0.7" stroke-linejoin="round"/>' +
    '<polygon points="15.88,15.84 17.31,16.88 16.76,18.55 15.0,18.55 14.45,16.88" fill="none" stroke="#0e1420" stroke-width="0.7" stroke-linejoin="round"/>' +
    '<polygon points="8.12,15.84 9.55,16.88 9.0,18.55 7.24,18.55 6.69,16.88" fill="none" stroke="#0e1420" stroke-width="0.7" stroke-linejoin="round"/>' +
    '<polygon points="5.72,8.46 7.15,9.5 6.6,11.17 4.84,11.17 4.29,9.5" fill="none" stroke="#0e1420" stroke-width="0.7" stroke-linejoin="round"/>',

  // 15) Zentrale — 2x2-Kachelraster, obere linke Kachel türkis
  zentrale:
    '<rect x="4" y="4" width="7" height="7" rx="1.4" fill="%ACCENT%"/>' +
    '<rect x="13" y="4" width="7" height="7" rx="1.4" fill="%BASE%"/>' +
    '<rect x="4" y="13" width="7" height="7" rx="1.4" fill="%BASE%"/>' +
    '<rect x="13" y="13" width="7" height="7" rx="1.4" fill="%BASE%"/>',

  // 16) Presse — türkises Mikrofon mit weißem Ständer/Bügel
  presse:
    '<rect x="9" y="3.5" width="6" height="10" rx="3" fill="%ACCENT%"/>' +
    '<path d="M6.5 11.3a5.5 5.5 0 0 0 11 0" fill="none" stroke="%BASE%" stroke-width="1.6" stroke-linecap="round"/>' +
    '<line x1="12" y1="16.8" x2="12" y2="20" stroke="%BASE%" stroke-width="1.6"/>' +
    '<line x1="8.5" y1="20.5" x2="15.5" y2="20.5" stroke="%BASE%" stroke-width="1.6" stroke-linecap="round"/>',

  // 17) Kalender — weißer Kalenderrahmen mit einem türkisen markierten Tag
  kalender:
    '<rect x="3.5" y="5.5" width="17" height="14" rx="2.2" fill="none" stroke="%BASE%" stroke-width="1.6"/>' +
    '<line x1="3.5" y1="9.5" x2="20.5" y2="9.5" stroke="%BASE%" stroke-width="1.4"/>' +
    '<rect x="7" y="3.2" width="1.8" height="3.8" rx="0.9" fill="%BASE%"/>' +
    '<rect x="15.2" y="3.2" width="1.8" height="3.8" rx="0.9" fill="%BASE%"/>' +
    '<circle cx="12" cy="14.5" r="2.4" fill="%ACCENT%"/>',

  // 18) Training — weiße Zielscheibe mit türkisem Zentrum
  training:
    '<circle cx="12" cy="12" r="8.5" fill="none" stroke="%BASE%" stroke-width="1.6"/>' +
    '<circle cx="12" cy="12" r="5" fill="none" stroke="%BASE%" stroke-width="1.6"/>' +
    '<circle cx="12" cy="12" r="2.2" fill="%ACCENT%"/>',

  // 19) Jugend — weißes Wappen mit türkisem Stern
  youth:
    '<path d="M12 3.2 19 5.6v5.8c0 4.2-3 7.6-7 9.4-4-1.8-7-5.2-7-9.4V5.6Z" fill="%BASE%"/>' +
    '<polygon points="12 7.8 13.1 10.1 15.6 10.4 13.8 12.2 14.2 14.7 12 13.5 9.8 14.7 10.2 12.2 8.4 10.4 10.9 10.1" fill="%ACCENT%"/>',

  // 20) Mitarbeiter — weiße Person mit türkiser Krawatte
  staff:
    '<circle cx="12" cy="7" r="3.2" fill="%BASE%"/>' +
    '<path d="M5 20.2c0-3.6 3-6.4 7-6.4s7 2.8 7 6.4v.3H5Z" fill="%BASE%"/>' +
    '<polygon points="12 13.9 13.3 15.5 12 20.2 10.7 15.5" fill="%ACCENT%"/>',

  // 21) Vereinsgelände — zwei Gebäude, das größere türkis
  facilities:
    '<rect x="3.8" y="9.5" width="6.6" height="10.5" rx="0.6" fill="%BASE%"/>' +
    '<rect x="11.8" y="5" width="8.4" height="15" rx="0.6" fill="%ACCENT%"/>' +
    '<rect x="13.6" y="7.4" width="1.7" height="1.7" fill="%BASE%"/>' +
    '<rect x="16.7" y="7.4" width="1.7" height="1.7" fill="%BASE%"/>' +
    '<rect x="13.6" y="10.6" width="1.7" height="1.7" fill="%BASE%"/>' +
    '<rect x="16.7" y="10.6" width="1.7" height="1.7" fill="%BASE%"/>',

  // 22) Statistiken/Tabelle — weißer Tabellenrahmen mit türkiser Kopfzeile
  stats:
    '<rect x="3.5" y="4.5" width="17" height="15" rx="2" fill="none" stroke="%BASE%" stroke-width="1.6"/>' +
    '<rect x="4.6" y="5.6" width="14.8" height="3" rx="0.6" fill="%ACCENT%"/>' +
    '<line x1="4.6" y1="11.5" x2="19.4" y2="11.5" stroke="%BASE%" stroke-width="1.3"/>' +
    '<line x1="4.6" y1="14.5" x2="19.4" y2="14.5" stroke="%BASE%" stroke-width="1.3"/>' +
    '<line x1="4.6" y1="17.5" x2="19.4" y2="17.5" stroke="%BASE%" stroke-width="1.3"/>',

  // 23) Chronik — weiße Schriftrolle mit türkisen Textzeilen
  chronicle:
    '<path d="M6 4.5h9.5a1.8 1.8 0 0 1 1.8 1.8V19a1.5 1.5 0 0 1-1.5 1.5H6Z" fill="%BASE%"/>' +
    '<path d="M17.3 4.5a1.8 1.8 0 0 1 1.7 1.8 1.4 1.4 0 0 1-1.4 1.4H15.5V6.3a1.8 1.8 0 0 1 1.8-1.8Z" fill="%BASE%"/>' +
    '<line x1="8" y1="9.2" x2="14" y2="9.2" stroke="%ACCENT%" stroke-width="1.5" stroke-linecap="round"/>' +
    '<line x1="8" y1="12.2" x2="14" y2="12.2" stroke="%ACCENT%" stroke-width="1.5" stroke-linecap="round"/>' +
    '<line x1="8" y1="15.2" x2="12" y2="15.2" stroke="%ACCENT%" stroke-width="1.5" stroke-linecap="round"/>',

  // 24) Wiki — aufgeschlagenes Buch mit türkisem Buchrücken
  wiki:
    '<path d="M12 6.6C10 5.1 7.2 4.9 4.6 5.5V18c2.6-.6 5.4-.4 7.4 1.1V6.6Z" fill="%BASE%"/>' +
    '<path d="M12 6.6c2-1.5 4.8-1.7 7.4-1.1V18c-2.6-.6-5.4-.4-7.4 1.1V6.6Z" fill="%BASE%"/>' +
    '<rect x="11.2" y="6" width="1.6" height="13.6" rx="0.4" fill="%ACCENT%"/>',

  // 25) Menü — Hamburger, mittlerer Balken türkis
  menu:
    '<rect x="4" y="6" width="16" height="2.2" rx="1.1" fill="%BASE%"/>' +
    '<rect x="4" y="10.9" width="16" height="2.2" rx="1.1" fill="%ACCENT%"/>' +
    '<rect x="4" y="15.8" width="16" height="2.2" rx="1.1" fill="%BASE%"/>',

  // 26) Hauptmenü — weißes Haus mit türkiser Tür
  mainmenu:
    '<path d="M12 3.5 21 11h-2.2v8.5a1 1 0 0 1-1 1H6.2a1 1 0 0 1-1-1V11H3Z" fill="%BASE%"/>' +
    '<rect x="10.3" y="13.5" width="3.4" height="6.5" rx="0.4" fill="%ACCENT%"/>',

  // 27) Verträge — weißes Dokument mit türkiser Unterschrift
  contracts:
    '<path d="M6 3.5h8l4 4V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" fill="%BASE%"/>' +
    '<path d="M13.5 3.7v3.8h3.8Z" fill="%BASE%"/>' +
    '<path d="M7.5 16.8c1-1.2 1.6-.2 2.4-.9.6-.5.2-1.6 1-1.9.9-.3 1.3 1.3 2.2 1 .7-.2.8-1 1.4-1" fill="none" stroke="%ACCENT%" stroke-width="1.5" stroke-linecap="round"/>',

  // 28) Beobachtungsliste — weißes Auge mit türkiser Iris
  watchlist:
    '<path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z" fill="none" stroke="%BASE%" stroke-width="1.6"/>' +
    '<circle cx="12" cy="12" r="2.8" fill="%ACCENT%"/>',

  // 29) Verhandlungen — zwei Sprechblasen, eine türkis
  negotiations:
    '<path d="M3.5 6a1.5 1.5 0 0 1 1.5-1.5h7A1.5 1.5 0 0 1 13.5 6v3.5A1.5 1.5 0 0 1 12 11H7.5L4.5 13.3V11a1.5 1.5 0 0 1-1-1.4Z" fill="%BASE%"/>' +
    '<path d="M20.5 13.5a1.5 1.5 0 0 0-1.5-1.5h-6A1.5 1.5 0 0 0 11.5 13.5V16a1.5 1.5 0 0 0 1.5 1.5h4l3 2.2V17.5a1.5 1.5 0 0 0 .5-1Z" fill="%ACCENT%"/>',

  // 30) Sponsoring — weißes Preisschild mit türkisem Loch
  sponsoring:
    '<path d="M4 12 12 4h6.5a1.5 1.5 0 0 1 1.5 1.5V12l-8 8Z" fill="%BASE%"/>' +
    '<circle cx="16" cy="8" r="1.8" fill="%ACCENT%"/>',

  // 31) Fans — weißes Herz mit türkiser Herzschlaglinie
  fans:
    '<path d="M12 20S3.5 14.5 3.5 8.8A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 8.5 1.8C20.5 14.5 12 20 12 20Z" fill="%BASE%"/>' +
    '<path d="M6.5 12h2l1.5-3 2 5 1.5-2.5h4" fill="none" stroke="%ACCENT%" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',

  // 32) International — weiße Weltkugel mit türkisen Meridianen
  international:
    '<circle cx="12" cy="12" r="8.5" fill="%BASE%"/>' +
    '<path d="M12 3.5v17M3.5 12h17M12 3.5c-3 2.5-3 13.5 0 17M12 3.5c3 2.5 3 13.5 0 17M4.8 7.5h14.4M4.8 16.5h14.4" fill="none" stroke="%ACCENT%" stroke-width="1.3"/>',

  // 33) Marketing — weißes Megafon mit türkisen Schallwellen
  marketing:
    '<path d="M4 10v4a1 1 0 0 0 1 1h2l7 4V5L7 9H5a1 1 0 0 0-1 1Z" fill="%BASE%"/>' +
    '<path d="M17.5 8.5a5 5 0 0 1 0 7M19.6 6.5a8 8 0 0 1 0 11" fill="none" stroke="%ACCENT%" stroke-width="1.6" stroke-linecap="round"/>',

  // 34) Taktik — weißes Taktikboard mit türkisem gestricheltem Laufweg
  tactics:
    '<rect x="3.5" y="4" width="17" height="16" rx="2" fill="none" stroke="%BASE%" stroke-width="1.6"/>' +
    '<line x1="12" y1="4" x2="12" y2="20" stroke="%BASE%" stroke-width="1.2"/>' +
    '<circle cx="7.5" cy="16" r="1.6" fill="%BASE%"/>' +
    '<path d="M8.2 14c2-1.5 4.8-1 6.3 1.4" fill="none" stroke="%ACCENT%" stroke-width="1.5" stroke-dasharray="1.6 1.8" stroke-linecap="round"/>' +
    '<polygon points="14.9 16.2 15.5 13.1 12.7 14.3" fill="%ACCENT%"/>',

  // 35) Wetter — türkise Sonne mit Strahlen, davor weisse Wolke (leicht bewoelkt)
  weather:
    '<circle cx="9" cy="8.2" r="3.1" fill="%ACCENT%"/>' +
    '<g stroke="%ACCENT%" stroke-width="1.4" stroke-linecap="round">' +
    '<line x1="9" y1="2.2" x2="9" y2="3.6"/>' +
    '<line x1="3.2" y1="8.2" x2="4.6" y2="8.2"/>' +
    '<line x1="4.7" y1="3.9" x2="5.7" y2="4.9"/>' +
    '<line x1="13.3" y1="3.9" x2="12.3" y2="4.9"/>' +
    '<line x1="4.7" y1="12.5" x2="5.7" y2="11.5"/>' +
    '</g>' +
    '<path d="M9.5 19.5h7.8a3 3 0 0 0 .3-5.98 4 4 0 0 0-7.64-1.05A3.2 3.2 0 0 0 9.5 19.5Z" fill="%BASE%"/>',

  // =========================================================================
  // DASHBOARD-KOPFSYMBOLE (Zentrale) — solide, monochrom weiße Glyphen,
  // exakt nach Mockup "Variante 12". Bewusst EINFARBIG (nur %BASE% + dunkle
  // Aussparung #0e1420), damit sie 1:1 wie in der Vorlage aussehen.
  // =========================================================================

  // Vereinsüberblick — antikes Gebäude (Säulen + Giebel), wie Mockup
  dashVerein:
    '<polygon points="12 3.2 21 8 3 8" fill="%BASE%"/>' +
    '<rect x="3.4" y="8.7" width="17.2" height="1.7" rx="0.3" fill="%BASE%"/>' +
    '<rect x="4.6" y="10.9" width="2.1" height="6.5" fill="%BASE%"/>' +
    '<rect x="8.2" y="10.9" width="2.1" height="6.5" fill="%BASE%"/>' +
    '<rect x="13.7" y="10.9" width="2.1" height="6.5" fill="%BASE%"/>' +
    '<rect x="17.3" y="10.9" width="2.1" height="6.5" fill="%BASE%"/>' +
    '<rect x="3.4" y="17.8" width="17.2" height="2.1" rx="0.3" fill="%BASE%"/>',

  // Tabelle — massiver Pokal (rein weiß), wie Mockup
  dashTabelle:
    '<path d="M6.4 4h11.2v3.1a5.6 5.6 0 0 1-11.2 0Z" fill="%BASE%"/>' +
    '<path d="M6.5 4.7C4.4 4.7 3.1 5.9 3.1 7.6c0 1.8 1.4 2.9 3.5 3" fill="none" stroke="%BASE%" stroke-width="1.5"/>' +
    '<path d="M17.5 4.7c2.1 0 3.4 1.2 3.4 2.9 0 1.8-1.4 2.9-3.5 3" fill="none" stroke="%BASE%" stroke-width="1.5"/>' +
    '<rect x="11" y="11.3" width="2" height="3.3" fill="%BASE%"/>' +
    '<path d="M8.7 14.4h6.6l-.9 2.5H9.6Z" fill="%BASE%"/>' +
    '<rect x="7.5" y="18.4" width="9" height="2.2" rx="0.6" fill="%BASE%"/>',

  // Nächstes Spiel — Fußball (weiß mit dunklen Segmenten), wie Mockup
  dashBall:
    '<circle cx="12" cy="12" r="8.6" fill="%BASE%"/>' +
    '<g stroke="#0e1420" stroke-width="0.9" stroke-linecap="round">' +
    '<line x1="12.00" y1="9.50" x2="12.00" y2="7.00"/>' +
    '<line x1="14.38" y1="11.23" x2="16.76" y2="10.45"/>' +
    '<line x1="13.47" y1="14.02" x2="14.94" y2="16.05"/>' +
    '<line x1="10.53" y1="14.02" x2="9.06" y2="16.05"/>' +
    '<line x1="9.62" y1="11.23" x2="7.24" y2="10.45"/>' +
    '</g>' +
    '<g fill="#0e1420">' +
    '<polygon points="12.00 9.50 14.38 11.23 13.47 14.02 10.53 14.02 9.62 11.23"/>' +
    '<polygon points="12.00 3.90 13.62 5.07 13.00 6.98 11.00 6.98 10.38 5.07"/>' +
    '<polygon points="19.70 9.50 19.09 11.40 17.09 11.40 16.47 9.50 18.09 8.32"/>' +
    '<polygon points="16.76 18.55 14.76 18.55 14.15 16.65 15.76 15.48 17.38 16.65"/>' +
    '<polygon points="7.24 18.55 6.62 16.65 8.24 15.48 9.85 16.65 9.24 18.55"/>' +
    '<polygon points="4.30 9.50 5.91 8.32 7.53 9.50 6.91 11.40 4.91 11.40"/>' +
    '</g>',

  // Finanzen — zwei Münzstapel (weiße Scheiben), wie Mockup
  dashFinanzen:
    '<g fill="%BASE%" stroke="#0e1420" stroke-width="0.6">' +
    '<ellipse cx="15.3" cy="15.4" rx="3.2" ry="1.25"/>' +
    '<ellipse cx="15.3" cy="13.5" rx="3.2" ry="1.25"/>' +
    '<ellipse cx="15.3" cy="11.6" rx="3.2" ry="1.25"/>' +
    '<ellipse cx="15.3" cy="9.7" rx="3.2" ry="1.25"/>' +
    '<ellipse cx="8.7" cy="16.6" rx="3.2" ry="1.25"/>' +
    '<ellipse cx="8.7" cy="14.7" rx="3.2" ry="1.25"/>' +
    '<ellipse cx="8.7" cy="12.8" rx="3.2" ry="1.25"/>' +
    '</g>',

  // Kader — zwei Personen (weiß), wie Mockup
  dashKader:
    '<circle cx="15.4" cy="8.6" r="2.6" fill="%BASE%"/>' +
    '<path d="M10.4 18.6v-.4c0-3 2.3-5 5-5s5 2 5 5v.4Z" fill="%BASE%"/>' +
    '<circle cx="9" cy="9.2" r="3.1" fill="%BASE%" stroke="#0e1420" stroke-width="0.7"/>' +
    '<path d="M2.6 19.6v-.5c0-3.2 2.6-5.6 6.4-5.6s6.4 2.4 6.4 5.6v.5Z" fill="%BASE%" stroke="#0e1420" stroke-width="0.7"/>',

  // Termine — Kalender mit Punkteraster, wie Mockup
  dashTermine:
    '<rect x="3.5" y="4.8" width="17" height="15.7" rx="2.3" fill="%BASE%"/>' +
    '<rect x="7" y="3" width="2" height="4" rx="1" fill="%BASE%"/>' +
    '<rect x="15" y="3" width="2" height="4" rx="1" fill="%BASE%"/>' +
    '<rect x="5" y="9" width="14" height="0.9" fill="#0e1420"/>' +
    '<g fill="#0e1420">' +
    '<circle cx="7" cy="12.6" r="0.85"/><circle cx="10.3" cy="12.6" r="0.85"/><circle cx="13.7" cy="12.6" r="0.85"/><circle cx="17" cy="12.6" r="0.85"/>' +
    '<circle cx="7" cy="15.4" r="0.85"/><circle cx="10.3" cy="15.4" r="0.85"/><circle cx="13.7" cy="15.4" r="0.85"/><circle cx="17" cy="15.4" r="0.85"/>' +
    '<circle cx="7" cy="18.2" r="0.85"/><circle cx="10.3" cy="18.2" r="0.85"/><circle cx="13.7" cy="18.2" r="0.85"/><circle cx="17" cy="18.2" r="0.85"/>' +
    '</g>',

  // Nachrichten — Zeitung (weiß) mit Bild- und Textbloecken, im dash-Stil
  dashNews:
    '<rect x="3.6" y="5.4" width="16.8" height="14.2" rx="2.1" fill="%BASE%"/>' +
    '<rect x="5.9" y="8" width="5.4" height="4.3" rx="0.6" fill="#0e1420"/>' +
    '<g fill="#0e1420">' +
    '<rect x="12.6" y="8.1" width="5.5" height="1.05" rx="0.5"/>' +
    '<rect x="12.6" y="10.3" width="5.5" height="1.05" rx="0.5"/>' +
    '<rect x="12.6" y="12.5" width="3.7" height="1.05" rx="0.5"/>' +
    '<rect x="5.9" y="14.6" width="12.2" height="1.05" rx="0.5"/>' +
    '<rect x="5.9" y="16.8" width="12.2" height="1.05" rx="0.5"/>' +
    '</g>',

  // Catering / Wuerstchenbude — weisser Imbissstand mit tuerkiser Markise
  catering:
    '<path d="M4 9.5 6 5h12l2 4.5Z" fill="none" stroke="%ACCENT%" stroke-width="1.5" stroke-linejoin="round"/>' +
    '<path d="M4 9.5h16v1.2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z" fill="%ACCENT%"/>' +
    '<rect x="5.6" y="12" width="12.8" height="7.5" rx="0.6" fill="none" stroke="%BASE%" stroke-width="1.5"/>' +
    '<line x1="5.6" y1="19.5" x2="18.4" y2="19.5" stroke="%BASE%" stroke-width="1.5"/>' +
    '<path d="M9 15.5c1-1 2.4-1 3.4 0s2.4 1 3.4 0" fill="none" stroke="%ACCENT%" stroke-width="1.4" stroke-linecap="round"/>',

  // Textmodus: Trillerpfeife (Zuruf) — weisser Korpus, tuerkise Schallwellen
  whistle:
    '<path d="M4 12.5a4.5 4.5 0 0 0 8.6 1.9H19a1 1 0 0 0 1-1v-2.3a1 1 0 0 0-1-1h-8.3A4.5 4.5 0 0 0 4 12.5Z" fill="%BASE%"/>' +
    '<circle cx="8.5" cy="12.5" r="1.6" fill="#0a0e14"/>' +
    '<path d="M14 6.5c.8-.8 2-.8 2.8 0M13 4.6c1.4-1.4 3.6-1.4 5 0" fill="none" stroke="%ACCENT%" stroke-width="1.4" stroke-linecap="round"/>',

  // Textmodus: Auswechslung — weisser Pfeil raus, tuerkiser Pfeil rein
  swap:
    '<path d="M7 4.5v12M7 16.5l-3-3M7 16.5l3-3" fill="none" stroke="%BASE%" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M17 19.5v-12M17 7.5l-3 3M17 7.5l3 3" fill="none" stroke="%ACCENT%" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',

  // Textmodus: Pause — zwei weisse Balken
  pause:
    '<rect x="6.5" y="5" width="4" height="14" rx="1" fill="%BASE%"/><rect x="13.5" y="5" width="4" height="14" rx="1" fill="%ACCENT%"/>',

  // Textmodus: Abspielen — tuerkises Dreieck
  play:
    '<path d="M8 5.5v13l11-6.5Z" fill="%ACCENT%"/>',

  // Textmodus: Vorspulen — weisses + tuerkises Dreieck
  skip:
    '<path d="M4 6v12l8-6Z" fill="%BASE%"/><path d="M12 6v12l8-6Z" fill="%ACCENT%"/>',
};

/** Gültige Icon-Namen (englische Keys). */
export type IconName = keyof typeof RAW;

/** Roh-Markup mit fest ersetzten Farben (für den React-Einsatz). */
export const ICON_MARKUP: Record<string, string> = Object.fromEntries(
  Object.entries(RAW).map(([k, v]) => [
    k,
    v.replace(/%BASE%/g, BASE).replace(/%ACCENT%/g, ACCENT),
  ]),
);
