// =============================================================================
// Hauptorte zur Orientierung auf der Trainingslager-Karte (views/kader/camp/CampMap.tsx).
// Nur Lage (Breite, Länge in Grad, WGS84, gerundet) – keine Spielwirkung.
// Koordinaten: Stadtzentren nach Wikipedia/GeoNames. `minor` = nur im Ausschnitt
// „Deutschland & Alpen“.
// =============================================================================
export interface CampMapCity { name: string; geo: [number, number]; minor?: boolean }

export const CAMP_MAP_CITIES: CampMapCity[] = [
  { name: 'Berlin', geo: [52.52, 13.40] },
  { name: 'Hamburg', geo: [53.55, 9.99], minor: true },
  { name: 'München', geo: [48.14, 11.58] },
  { name: 'Köln', geo: [50.94, 6.96], minor: true },
  { name: 'Frankfurt', geo: [50.11, 8.68], minor: true },
  { name: 'Stuttgart', geo: [48.78, 9.18], minor: true },
  { name: 'Leipzig', geo: [51.34, 12.37], minor: true },
  { name: 'Hannover', geo: [52.37, 9.73], minor: true },
  { name: 'Wien', geo: [48.21, 16.37] },
  { name: 'Zürich', geo: [47.38, 8.54], minor: true },
  { name: 'Paris', geo: [48.86, 2.35] },
  { name: 'London', geo: [51.51, -0.13] },
  { name: 'Madrid', geo: [40.42, -3.70] },
  { name: 'Lissabon', geo: [38.72, -9.14] },
  { name: 'Rom', geo: [41.90, 12.50] },
  { name: 'Athen', geo: [37.98, 23.73] },
  { name: 'Istanbul', geo: [41.01, 28.98] },
  { name: 'Warschau', geo: [52.23, 21.01] },
  { name: 'Kairo', geo: [30.04, 31.24] },
  { name: 'Casablanca', geo: [33.57, -7.59] },
  { name: 'Nairobi', geo: [-1.29, 36.82] },
  { name: 'Johannesburg', geo: [-26.20, 28.05] },
  { name: 'Kapstadt', geo: [-33.92, 18.42] },
  { name: 'Riad', geo: [24.71, 46.68] },
  { name: 'Dubai', geo: [25.20, 55.27] },
  { name: 'Delhi', geo: [28.61, 77.21] },
  { name: 'Bangkok', geo: [13.76, 100.50] },
  { name: 'Singapur', geo: [1.35, 103.82] },
  { name: 'Peking', geo: [39.90, 116.41] },
  { name: 'Shanghai', geo: [31.23, 121.47] },
  { name: 'Tokio', geo: [35.68, 139.69] },
  { name: 'New York', geo: [40.71, -74.01] },
  { name: 'Chicago', geo: [41.88, -87.63] },
  { name: 'Los Angeles', geo: [34.05, -118.24] },
  { name: 'Miami', geo: [25.76, -80.19] },
  { name: 'Mexiko-Stadt', geo: [19.43, -99.13] },
];
