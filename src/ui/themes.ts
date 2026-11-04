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
  | 'hellkuehl' | 'kontrast' | 'retro' | 'modern' | 'graphit';

export interface ThemeDef {
  id: ThemeId;
  name: string;
  /** dunkle oder helle Flächen (steuert `data-tone`, Foto-Behandlung, dunkle Bühnen). */
  tone: 'dark' | 'light';
  /** Kurzbeschreibung für Einstellungen/Auswahlliste. */
  note: string;
  /** Vorschau-Farben: Fläche, Box, Akzent (nur für das Farbfeld in der Liste). */
  swatch: [string, string, string];
}

export const THEMES: ThemeDef[] = [
  { id: 'abendhimmel', name: 'Abendhimmel', tone: 'dark', note: 'Heutiger Look: Schiefer, Bernstein als Akzent', swatch: ['#0c0f15', '#1c2028', '#f2a541'] },
  { id: 'ruhig', name: 'Abendhimmel ruhig', tone: 'dark', note: 'Auswahl über Helligkeit, Bernstein nur am Hauptknopf', swatch: ['#0c0f15', '#1c2028', '#d9dee5'] },
  { id: 'schiefer', name: 'Schiefer kühl', tone: 'dark', note: 'Blaugraue Flächen, blaugrauer Akzent', swatch: ['#0d1117', '#18202b', '#8eb0d6'] },
  { id: 'stadionnacht', name: 'Stadion-Nacht', tone: 'dark', note: 'Dunkel mit gedämpftem Rasengrün', swatch: ['#0a0f0d', '#151d19', '#7cc39a'] },
  { id: 'papier', name: 'Papier hell', tone: 'light', note: 'Helle Boxen auf warmem Weiß, Tinten-Indigo', swatch: ['#f4f3ef', '#fffefb', '#3d4a9e'] },
  { id: 'hellkuehl', name: 'Hell kühl', tone: 'light', note: 'Weiß und Hellgrau, blauer Akzent', swatch: ['#e9edf2', '#ffffff', '#2563c9'] },
  { id: 'kontrast', name: 'Hell Kontrast', tone: 'light', note: 'Sehr klar: Schwarz auf Weiß, ein Akzent', swatch: ['#f0f0f0', '#ffffff', '#0044cc'] },
  { id: 'retro', name: 'Retro 1975', tone: 'dark', note: 'Anthrazit, Senfgelb als Akzent, eckige Knöpfe', swatch: ['#121212', '#1e1e1e', '#d9a822'] },
  { id: 'modern', name: 'Modern 2025', tone: 'dark', note: 'Fast schwarz, Neon-Akzent sparsam', swatch: ['#060708', '#111316', '#c8f53c'] },
  { id: 'graphit', name: 'Graphit monochrom', tone: 'dark', note: 'Ganz ohne Farbakzent', swatch: ['#101112', '#1b1c1e', '#e4e6e9'] },
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
