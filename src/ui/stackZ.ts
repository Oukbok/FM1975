// Stapelhöhe für Profile, die von überall geöffnet werden (Spieler über <PlayerLink>,
// Vereine über <ClubLink>): das zuletzt geöffnete liegt oben – über Shows (Gala,
// Halle, Auslosung, Vorschau, Textmodus: z-index ≤ 1100) und unter dem Rechtsklick-Menü (2000).
let top = 1200;
export const nextProfileZ = (): number => (top = top >= 1900 ? 1201 : top + 1);
