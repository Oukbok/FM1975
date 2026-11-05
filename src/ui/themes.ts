// =============================================================================
// Themes (Wunsch Pascal: 10 Styles zum Ausprobieren, Auswahl oben rechts)
// =============================================================================
// Ein Theme setzt nur Design-Tokens: `data-theme` + `data-tone` am Wurzelelement
// (<html>), Werte in `styles/30-themes.css`. Standard = „Abendhimmel“ (ohne Attribut-
// Überschreibungen, die Tokens in `styles/00-base.css` :root). Gespeichert in den
// AppSettings (`theme`, optional – fehlt = Abendhimmel).
// =============================================================================

export type ThemeId =
  | 'abendhimmel' | 'ruhig' | 'schiefer' | 'stadionnacht' | 'papier'
  | 'hellkuehl' | 'kontrast' | 'retro' | 'modern' | 'graphit'
  // „Ruhig – neu“ (31-themes-ruhig.css): Varianten von „Abendhimmel ruhig“
  | 'ruhig-hell' | 'ruhig-glas' | 'ruhig-milchglas' | 'ruhig-kreide' | 'ruhig-klar'
  | 'ruhig-sanft' | 'ruhig-hart' | 'ruhig-nordlicht' | 'ruhig-eisblau' | 'ruhig-petrol'
  | 'ruhig-tanne' | 'ruhig-abendrot' | 'ruhig-sand' | 'ruhig-mitternacht' | 'ruhig-nebel'
  | 'ruhig-stahl' | 'ruhig-flutlicht' | 'ruhig-sw' | 'ruhig-tiefsee' | 'ruhig-kante';

/** Gruppe in der Auswahlliste. */
export type ThemeGroup = 'dark' | 'light' | 'more' | 'ruhig';
export const THEME_GROUP_LABEL: Record<ThemeGroup, string> = {
  dark: 'Klassisch – dunkel', light: 'Klassisch – hell', more: 'Klassisch – weitere', ruhig: 'Ruhig – neu',
};

export interface ThemeDef {
  id: ThemeId;
  name: string;
  /** dunkle oder helle Flächen (steuert `data-tone`, Foto-Behandlung, dunkle Bühnen). */
  tone: 'dark' | 'light';
  /** Kurzbeschreibung für Einstellungen/Auswahlliste. */
  note: string;
  /** Vorschau-Farben: Fläche, Box, Akzent (nur für das Farbfeld in der Liste). */
  swatch: [string, string, string];
  group: ThemeGroup;
}

export const THEMES: ThemeDef[] = [
  { id: 'abendhimmel', name: 'Abendhimmel', tone: 'dark', note: 'Heutiger Look: Schiefer, Bernstein als Akzent', swatch: ['#0c0f15', '#1c2028', '#f2a541'], group: 'dark' },
  { id: 'ruhig', name: 'Abendhimmel ruhig', tone: 'dark', note: 'Auswahl über Helligkeit, Bernstein nur am Hauptknopf', swatch: ['#0c0f15', '#1c2028', '#d9dee5'], group: 'dark' },
  { id: 'schiefer', name: 'Schiefer kühl', tone: 'dark', note: 'Blaugraue Flächen, blaugrauer Akzent', swatch: ['#0d1117', '#18202b', '#8eb0d6'], group: 'dark' },
  { id: 'stadionnacht', name: 'Stadion-Nacht', tone: 'dark', note: 'Dunkel mit gedämpftem Rasengrün', swatch: ['#0a0f0d', '#151d19', '#7cc39a'], group: 'dark' },
  { id: 'papier', name: 'Papier hell', tone: 'light', note: 'Helle Boxen auf warmem Weiß, Tinten-Indigo', swatch: ['#f4f3ef', '#fffefb', '#3d4a9e'], group: 'light' },
  { id: 'hellkuehl', name: 'Hell kühl', tone: 'light', note: 'Weiß und Hellgrau, blauer Akzent', swatch: ['#e9edf2', '#ffffff', '#2563c9'], group: 'light' },
  { id: 'kontrast', name: 'Hell Kontrast', tone: 'light', note: 'Sehr klar: Schwarz auf Weiß, ein Akzent', swatch: ['#f0f0f0', '#ffffff', '#0044cc'], group: 'light' },
  { id: 'retro', name: 'Retro 1975', tone: 'dark', note: 'Anthrazit, Senfgelb als Akzent, eckige Knöpfe', swatch: ['#121212', '#1e1e1e', '#d9a822'], group: 'more' },
  { id: 'modern', name: 'Modern 2025', tone: 'dark', note: 'Fast schwarz, Neon-Akzent sparsam', swatch: ['#060708', '#111316', '#c8f53c'], group: 'more' },
  { id: 'graphit', name: 'Graphit monochrom', tone: 'dark', note: 'Ganz ohne Farbakzent', swatch: ['#101112', '#1b1c1e', '#e4e6e9'], group: 'more' },
  // --- Ruhig – neu: weiße Knöpfe, klares Foto, Kontrast von sanft bis hart ---
  { id: 'ruhig-hell', name: 'Ruhig Hell-Akzent', tone: 'dark', group: 'ruhig', note: 'Wie „ruhig“, gewählte Knöpfe weiß, Foto etwas klarer', swatch: ['#0c0f15', '#1c2028', '#eef1f5'] },
  { id: 'ruhig-glas', name: 'Ruhig Glas', tone: 'dark', group: 'ruhig', note: 'Glasboxen mit Unschärfe, Foto deutlich sichtbar', swatch: ['#3a4250', '#10141b', '#eef1f5'] },
  { id: 'ruhig-milchglas', name: 'Ruhig Milchglas', tone: 'dark', group: 'ruhig', note: 'Starke Unschärfe, hellere Glasboxen', swatch: ['#4a525e', '#222833', '#eef1f5'] },
  { id: 'ruhig-kreide', name: 'Ruhig Kreide', tone: 'dark', group: 'ruhig', note: 'Kreideweiße Rahmen und Knöpfe, harter Weiß-Kontrast', swatch: ['#0c0f15', '#1c2028', '#ffffff'] },
  { id: 'ruhig-klar', name: 'Ruhig Klarsicht', tone: 'dark', group: 'ruhig', note: 'Foto fast unverändert, dunkles Rauchglas', swatch: ['#56606c', '#0a0d12', '#eef1f5'] },
  { id: 'ruhig-sanft', name: 'Ruhig Sanft', tone: 'dark', group: 'ruhig', note: 'Weiche Kontraste, gedämpftes Foto', swatch: ['#11151b', '#1d222a', '#d5dae1'] },
  { id: 'ruhig-hart', name: 'Ruhig Hart', tone: 'dark', group: 'ruhig', note: 'Fast schwarz, reines Weiß, kräftige Rahmen', swatch: ['#07090c', '#0f1216', '#ffffff'] },
  { id: 'ruhig-nordlicht', name: 'Ruhig Nordlicht', tone: 'dark', group: 'ruhig', note: 'Blauschwarz, Polarlicht-Grün als Akzent', swatch: ['#080d12', '#121a21', '#7fd6c0'] },
  { id: 'ruhig-eisblau', name: 'Ruhig Eisblau', tone: 'dark', group: 'ruhig', note: 'Kühles Blau, eisweiße Knöpfe', swatch: ['#0a0f16', '#141c27', '#a8d4f5'] },
  { id: 'ruhig-petrol', name: 'Ruhig Petrol', tone: 'dark', group: 'ruhig', note: 'Dunkles Petrol, Petrolblau als Akzent', swatch: ['#071114', '#0f1f24', '#5cc0c4'] },
  { id: 'ruhig-tanne', name: 'Ruhig Tanne', tone: 'dark', group: 'ruhig', note: 'Gedämpftes Waldgrün, Salbei als Akzent', swatch: ['#0a100d', '#141e19', '#9fd0a6'] },
  { id: 'ruhig-abendrot', name: 'Ruhig Abendrot', tone: 'dark', group: 'ruhig', note: 'Kühles Indigo-Violett, Lavendel als Akzent', swatch: ['#0d0d16', '#191a27', '#b9a8f5'] },
  { id: 'ruhig-sand', name: 'Ruhig Sand', tone: 'dark', group: 'ruhig', note: 'Schieferflächen, heller Sand als Akzent', swatch: ['#0c0f15', '#1c2028', '#e2d3ad'] },
  { id: 'ruhig-mitternacht', name: 'Ruhig Mitternacht', tone: 'dark', group: 'ruhig', note: 'Tiefes Nachtblau, Foto gedämpft', swatch: ['#060a14', '#0f1626', '#eef2fb'] },
  { id: 'ruhig-nebel', name: 'Ruhig Nebel', tone: 'dark', group: 'ruhig', note: 'Helleres Grau, Milchglas, sanftes Foto', swatch: ['#1a1e24', '#262b33', '#f3f5f8'] },
  { id: 'ruhig-stahl', name: 'Ruhig Stahl', tone: 'dark', group: 'ruhig', note: 'Stahlgrau, gewählt = weißer Rahmen, eckig', swatch: ['#0e1114', '#1a1e23', '#c9d4df'] },
  { id: 'ruhig-flutlicht', name: 'Ruhig Flutlicht', tone: 'dark', group: 'ruhig', note: 'Foto hell und klar, weißer Knopf mit Lichtschein', swatch: ['#6a7480', '#0c0f14', '#ffffff'] },
  { id: 'ruhig-sw', name: 'Ruhig Schwarzweiß', tone: 'dark', group: 'ruhig', note: 'Foto schwarzweiß, alles monochrom', swatch: ['#0d0d0e', '#19191b', '#f0f0f0'] },
  { id: 'ruhig-tiefsee', name: 'Ruhig Tiefsee', tone: 'dark', group: 'ruhig', note: 'Tiefblau mit Türkis, Glas', swatch: ['#050b14', '#0c1828', '#4fd1d9'] },
  { id: 'ruhig-kante', name: 'Ruhig Bernsteinkante', tone: 'dark', group: 'ruhig', note: 'Weiße Knöpfe mit Bernstein-Unterstrich', swatch: ['#0c0f15', '#eef1f5', '#f2a541'] },
];

export const DEFAULT_THEME: ThemeId = 'abendhimmel';

export function themeOf(id: string | undefined | null): ThemeDef {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

/** Theme sofort anwenden (Attribute am <html>; ohne DOM = nichts). */
export function applyTheme(id: string | undefined | null): void {
  if (typeof document === 'undefined') return;
  const t = themeOf(id);
  const el = document.documentElement;
  el.dataset.theme = t.id;
  el.dataset.tone = t.tone;
}
