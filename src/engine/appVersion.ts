// Versionsnummer des Spiels (Quelle: package.json, eingesetzt von scripts/build.mjs) und
// Build-Kennung (Git-Kurzhash + Datum). In Tests ohne Build-Schritt: „dev“.
// Sichtbar im Hauptmenü; Patch-Ablauf siehe desktop/README.md und CHANGELOG.md.
declare const __APP_VERSION__: string | undefined;
declare const __APP_BUILD__: string | undefined;

export const APP_VERSION: string = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev';
export const APP_BUILD: string = typeof __APP_BUILD__ === 'string' ? __APP_BUILD__ : '';

/** „v1.1.0 · Build 3fa2c1d · 21.11.2026“ */
export function versionLabel(): string {
  return `v${APP_VERSION}${APP_BUILD ? ` · Build ${APP_BUILD}` : ''}`;
}
