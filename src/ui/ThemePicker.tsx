// Auswahlliste der Themes (Kopfleiste oben rechts + Einstellungen). Wirkt sofort und
// wird in den AppSettings gespeichert (`theme`). Farbfelder = Fläche/Box/Akzent.
import type { AppSettings } from '../engine/save';
import Select, { type SelectOption } from './Select';
import { THEMES, themeOf } from './themes';

function Swatch({ c }: { c: [string, string, string] }) {
  return (
    <span className="thm-sw" aria-hidden="true">
      <span style={{ background: c[0] }} /><span style={{ background: c[1] }} /><span style={{ background: c[2] }} />
    </span>
  );
}

export const THEME_OPTIONS: SelectOption[] = THEMES.map((t, i) => ({
  value: t.id,
  text: t.name,
  group: i === 0 ? 'Dunkel' : t.id === 'papier' ? 'Hell' : t.id === 'retro' ? 'Dunkel (weitere)' : undefined,
  label: <span className="thm-opt"><Swatch c={t.swatch} /><span className="thm-name">{t.name}</span></span>,
}));

export default function ThemePicker({ settings, onSettings, width = 210, size = 'm' }: {
  settings: AppSettings; onSettings: (s: AppSettings) => void; width?: number; size?: 's' | 'm' | 'l';
}) {
  const t = themeOf(settings.theme);
  return (
    <Select className="thm-pick" value={t.id} options={THEME_OPTIONS} width={width} popWidth={270} align="right" size={size}
      aria-label="Style wählen" title={`Style: ${t.name} – ${t.note}`} data-role="theme-picker"
      onChange={(v) => onSettings({ ...settings, theme: v })} />
  );
}
