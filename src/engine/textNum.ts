// =============================================================================
// Zahl + Nomen in Texten: „1 Tor“, „2 Tore“ (statt „1 Tore“). Für Nachrichten,
// Begründungen und Bilanzen; die Presse hat dafür `count` in game/press/context.ts.
// =============================================================================

/** `n` mit Singular oder Plural: nOf(1, 'Tor', 'Tore') = „1 Tor“. */
export const nOf = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`;
