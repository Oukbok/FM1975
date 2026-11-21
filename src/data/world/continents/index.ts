// =============================================================================
// KONTINENTE AUSSERHALB EUROPAS – Register, Kontinentalwettbewerbe, Zugriff.
// -----------------------------------------------------------------------------
// Leichte Hintergrund-Simulation (game/continents.ts): je Land nur die Spitzen-
// vereine, je Saison nur eine gewichtete Ziehung der Platzierung, je Kontinent ein
// schlanker K.-o.-Pokal. Nichts davon ist spielbar (kein Heimatland, kein Assistent).
// Kontinentalpokale (Namen verfremdet; Vorbilder/Quellen docs/research/kontinente.md):
//   Südamerika  ab 1960 „Südamerika-Pokal der Landesmeister“
//   Afrika      ab 1964 „Afrika-Pokal der Landesmeister“, ab 1997 „Afrikanische Meisterliga“
//   Asien       1967–1971 und ab 1985/86 „Asien-Pokal der Landesmeister“, ab 2002/03 „Asiatische Meisterliga“
//   Nord-/Mittelamerika ab 1962 „Pokal der Landesmeister Nord- und Mittelamerikas“
//   Ozeanien    1987, 1999, 2001, ab 2005 „Ozeanien-Meisterliga“
// Historische Sieger (`winners`, nur Vereine dieser Daten) lenken die Ziehung je
// nach Option „Historische Entwicklung der Vereine“ und füllen die Siegerliste vor
// dem Spielstart.
// =============================================================================
import { SOUTH_AMERICA } from './southAmerica';
import { AFRICA, NORTH_AMERICA } from './americaAfrica';
import { ASIA, OCEANIA } from './asiaOceania';
import { CT_ANCHOR_YEARS, type ContinentKey, type CtClub, type CtContinent, type CtCountry, type CtCupEra } from './types';

export * from './types';

export const CT_COUNTRIES: CtCountry[] = [...SOUTH_AMERICA, ...NORTH_AMERICA, ...AFRICA, ...ASIA, ...OCEANIA];
export const CT_BY_CC: Record<string, CtCountry> = Object.fromEntries(CT_COUNTRIES.map((c) => [c.cc, c]));
export const CT_BY_KEY: Record<string, CtCountry> = Object.fromEntries(CT_COUNTRIES.map((c) => [c.key, c]));

const w = (list: [number, string][]): Record<number, string> => Object.fromEntries(list);
const seq = (from: number, ids: (string | null)[]): [number, string][] =>
  ids.map((id, i) => [from + i, id] as [number, string | null]).filter((x): x is [number, string] => !!x[1]);

export const CONTINENTS: Record<ContinentKey, CtContinent> = {
  sa: {
    key: 'sa', name: 'Südamerika', short: 'Südamerika',
    cups: [
      { from: 1960, to: 1999, name: 'Südamerika-Pokal der Landesmeister', size: 16, legs: 2, finalLegs: 2 },
      { from: 2000, to: 2018, name: 'Südamerika-Pokal der Landesmeister', size: 16, legs: 2, finalLegs: 2 },
      { from: 2019, to: 9999, name: 'Südamerika-Pokal der Landesmeister', size: 16, legs: 2, finalLegs: 1 },
    ],
    winners: w(seq(1960, [
      'uru_pen', 'uru_pen', 'bra_san', 'bra_san', 'arg_ind', 'arg_ind', 'uru_pen', 'arg_rac', 'arg_est', 'arg_est',
      'arg_est', 'uru_nac', 'arg_ind', 'arg_ind', 'arg_ind', 'arg_ind', 'bra_cru', 'arg_boc', 'arg_boc', 'par_oli',
      'uru_nac', 'bra_flm', 'uru_pen', 'bra_gre', 'arg_ind', 'arg_arj', 'arg_riv', 'uru_pen', 'uru_nac', 'col_anc',
      'par_oli', 'chi_col', 'bra_spf', 'bra_spf', 'arg_vel', 'bra_gre', 'arg_riv', 'bra_cru', 'bra_vas', 'bra_pal',
      'arg_boc', 'arg_boc', 'par_oli', 'arg_boc', 'col_onc', 'bra_spf', 'bra_int', 'arg_boc', 'ecu_ldu', 'arg_est',
      'bra_int', 'bra_san', 'bra_cor', 'bra_cam', 'arg_slo', 'arg_riv', 'col_anc', 'bra_gre', 'arg_riv', 'bra_flm',
      'bra_pal', 'bra_pal', 'bra_flm', 'bra_flu', 'bra_bot', 'bra_flm',
    ]).map(([y, id]) => [y, `w_ct_${id}`])),
  },
  af: {
    key: 'af', name: 'Afrika', short: 'Afrika',
    cups: [
      { from: 1964, to: 1996, name: 'Afrika-Pokal der Landesmeister', size: 8, legs: 2, finalLegs: 2 },
      { from: 1997, to: 9999, name: 'Afrikanische Meisterliga', size: 16, legs: 2, finalLegs: 2 },
    ],
    winners: w(seq(1976, [
      'alg_mca', null, 'cmr_can', 'cmr_udo', 'cmr_can', 'alg_jsk', 'egy_ahl', 'gha_kot', 'egy_zam', 'mar_far',
      'egy_zam', 'egy_ahl', 'alg_ess', 'mar_raj', 'alg_jsk', 'tun_caf', 'mar_wyd', 'egy_zam', 'tun_est', 'rsa_orl',
      'egy_zam', 'mar_raj', 'civ_ase', 'mar_raj', 'gha_hoo', 'egy_ahl', 'egy_zam', 'nga_eny', 'nga_eny', 'egy_ahl',
      'egy_ahl', 'tun_ess', 'egy_ahl', 'cod_maz', 'cod_maz', 'tun_est', 'egy_ahl', 'egy_ahl', 'alg_ess', 'cod_maz',
      'rsa_sun', 'mar_wyd', 'tun_est', 'tun_est', 'egy_ahl', 'egy_ahl', 'mar_wyd', 'egy_ahl', 'egy_ahl', 'egy_pyr',
    ]).map(([y, id]) => [y, `w_ct_${id}`])),
  },
  as: {
    key: 'as', name: 'Asien', short: 'Asien',
    cups: [
      { from: 1967, to: 1971, name: 'Asien-Pokal der Landesmeister', size: 8, legs: 1, finalLegs: 1 },
      { from: 1986, to: 2002, name: 'Asien-Pokal der Landesmeister', size: 8, legs: 1, finalLegs: 1 },
      { from: 2003, to: 9999, name: 'Asiatische Meisterliga', size: 16, legs: 2, finalLegs: 2 },
    ],
    winners: w([
      [1989, 'qat_sad'], [1991, 'irn_est'], [1992, 'ksa_hil'], [1996, 'kor_seo'], [1997, 'kor_poh'], [1998, 'kor_poh'], [2000, 'ksa_hil'],
      [2001, 'kor_suw'], [2002, 'kor_suw'], [2003, 'uae_ain'], [2004, 'ksa_itt'], [2005, 'ksa_itt'], [2006, 'kor_jeo'], [2007, 'jpn_ura'],
      [2008, 'jpn_gam'], [2009, 'kor_poh'], [2010, 'kor_seo'], [2011, 'qat_sad'], [2012, 'kor_uls'], [2013, 'chn_gua'], [2014, 'aus_wsw'],
      [2015, 'chn_gua'], [2016, 'kor_jeo'], [2017, 'jpn_ura'], [2018, 'jpn_kas'], [2019, 'ksa_hil'], [2020, 'kor_uls'], [2021, 'ksa_hil'],
      [2022, 'jpn_ura'], [2023, 'uae_ain'], [2024, 'ksa_ahl'],
    ].map(([y, id]) => [y as number, `w_ct_${id}`])),
  },
  na: {
    key: 'na', name: 'Nord- und Mittelamerika', short: 'Nord-/Mittelamerika',
    cups: [{ from: 1962, to: 9999, name: 'Pokal der Landesmeister Nord- und Mittelamerikas', size: 8, legs: 2, finalLegs: 2, skip: [2001] }],
    winners: w([
      [1977, 'mex_ame'], [1980, 'mex_unam'], [1982, 'mex_unam'], [1986, 'crc_ala'], [1987, 'mex_ame'], [1989, 'mex_unam'], [1990, 'mex_ame'],
      [1992, 'mex_ame'], [1993, 'crc_sap'], [1994, 'crc_car'], [1995, 'crc_sap'], [1996, 'mex_cru'], [1997, 'mex_cru'], [1998, 'usa_dcu'],
      [2000, 'usa_lag'], [2002, 'mex_pac'], [2004, 'crc_ala'], [2005, 'crc_sap'], [2006, 'mex_ame'], [2007, 'mex_pac'], [2008, 'mex_pac'],
      [2010, 'mex_pac'], [2011, 'mex_mty'], [2012, 'mex_mty'], [2013, 'mex_mty'], [2014, 'mex_cru'], [2015, 'mex_ame'], [2016, 'mex_ame'],
      [2017, 'mex_pac'], [2018, 'mex_gua'], [2019, 'mex_mty'], [2020, 'mex_tig'], [2021, 'mex_mty'], [2022, 'usa_sea'], [2023, 'mex_leo'],
      [2024, 'mex_pac'], [2025, 'mex_cru'],
    ].map(([y, id]) => [y as number, `w_ct_${id}`])),
  },
  oc: {
    key: 'oc', name: 'Ozeanien', short: 'Ozeanien',
    cups: [{ from: 1987, to: 9999, name: 'Ozeanien-Meisterliga', size: 4, legs: 1, finalLegs: 1, skip: [1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 2000, 2002, 2003, 2004, 2020, 2021] }],
    winners: w([
      [1999, 'aus_smb'], [2005, 'aus_syd'], [2006, 'nzl_auc'], [2007, 'nzl_wai'], [2008, 'nzl_wai'], [2009, 'nzl_auc'], [2011, 'nzl_auc'],
      [2012, 'nzl_auc'], [2013, 'nzl_auc'], [2014, 'nzl_auc'], [2015, 'nzl_auc'], [2016, 'nzl_auc'], [2017, 'nzl_auc'], [2018, 'nzl_wel'],
      [2022, 'nzl_auc'], [2023, 'nzl_auc'], [2024, 'nzl_auc'], [2025, 'nzl_auc'],
    ].map(([y, id]) => [y as number, `w_ct_${id}`])),
  },
};
export const CONTINENT_KEYS: ContinentKey[] = ['sa', 'na', 'af', 'as', 'oc'];

/** Kontinentalpokal eines Kontinents im Jahr (null = nicht ausgetragen). */
export function cupEraOf(k: ContinentKey, year: number): CtCupEra | null {
  const e = CONTINENTS[k].cups.find((c) => year >= c.from && year <= c.to);
  if (!e || e.skip?.includes(year) || (e.years && !e.years.includes(year))) return null;
  return e;
}

// -----------------------------------------------------------------------------
// Vereine
// -----------------------------------------------------------------------------
export interface CtClubRef { id: string; cc: string; idx: number; club: CtClub; country: CtCountry }
const BY_ID = new Map<string, CtClubRef>();
for (const c of CT_COUNTRIES) c.clubs.forEach((cl, idx) => BY_ID.set(`w_ct_${c.cc}_${cl.key}`, { id: `w_ct_${c.cc}_${cl.key}`, cc: c.cc, idx, club: cl, country: c }));

export const isContinentalId = (id: string | null | undefined): boolean => !!id && id.startsWith('w_ct_');
export const ctClub = (id: string): CtClubRef | undefined => BY_ID.get(id);
export const ctId = (cc: string, idx: number): string | undefined => {
  const c = CT_BY_CC[cc]?.clubs[idx];
  return c ? `w_ct_${cc}_${c.key}` : undefined;
};

const inSpan = (spans: [number, number][] | undefined, y: number) => !spans || spans.some(([a, b]) => y >= a && y <= b);

/** Spielt der Verein in diesem Jahr? */
export const ctClubActive = (cl: CtClub, year: number): boolean => inSpan(cl.y, year);
/** Hat das Land in diesem Jahr eine Liga? */
export const ctLeagueActive = (c: CtCountry, year: number): boolean => inSpan(c.league, year) && c.clubs.filter((cl) => ctClubActive(cl, year)).length >= 2;

/** Kontinentalverband eines Landes im Jahr. */
export function ctConfOf(c: CtCountry, year: number): ContinentKey {
  let k = c.conf[0][1];
  for (const [from, conf] of c.conf) if (year >= from) k = conf;
  return k;
}
export function ctSlots(c: CtCountry, year: number): number {
  let n = c.slots[0][1];
  for (const [from, s] of c.slots) if (year >= from) n = s;
  return c.cupFrom && year < c.cupFrom ? 0 : n;
}

/** Stärke eines Vereins im Jahr (Stützjahre + Zusatzpunkte, dazwischen linear). */
export function ctStrength(cl: CtClub, year: number): number {
  const pts: [number, number][] = [];
  CT_ANCHOR_YEARS.forEach((y, i) => { if (cl.s[i] > 0) pts.push([y, cl.s[i]]); });
  for (const p of cl.x ?? []) pts.push(p);
  pts.sort((a, b) => a[0] - b[0]);
  if (!pts.length) return 60;
  if (year <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    const [y1, v1] = pts[i], [y0, v0] = pts[i - 1];
    if (year <= y1) return v0 + ((v1 - v0) * (year - y0)) / Math.max(1, y1 - y0);
  }
  return pts[pts.length - 1][1];
}

/** Alle Städte (Vorschau-Karte, data/prematch/cityGeo.ts). */
export const CT_CITY_GEO: Record<string, [number, number]> = Object.assign({}, ...CT_COUNTRIES.map((c) => c.geo));
export const CT_COUNTRY_GEO: Record<string, [number, number]> = Object.fromEntries(CT_COUNTRIES.map((c) => [c.key, c.center]));
/** Herkunft der Spielernamen je Länderschlüssel (data/generate.ts, Gegnerkader). */
export const CT_ORIGIN_BY_KEY: Record<string, string> = Object.fromEntries(CT_COUNTRIES.map((c) => [c.key, c.origin]));
