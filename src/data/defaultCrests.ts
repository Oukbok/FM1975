// =============================================================================
// defaultCrests — mitgelieferte Standard-Vereinswappen (gestickte Emaille-Patches)
// =============================================================================
// Diese Wappen liegen als statische PNGs unter public/assets/crests/<id>.png und
// dienen als Grundausstattung fuer Vereine, fuer die (noch) kein eigenes Wappen
// hochgeladen wurde. Sie stehen in der Aufloesungs-Reihenfolge UNTER dem
// spielweiten Override-Store und Club.customCrest — ein vom Nutzer hochgeladenes
// Wappen hat also immer Vorrang. Fehlt auch ein Default, greift das generierte
// SVG-Wappen (ClubCrest).
//
// Der Schluessel ist die Vereins-ID (siehe generate.ts CLUB_SEEDS).

/** Vereins-ID -> Pfad des mitgelieferten Standard-Wappens. */
export const DEFAULT_CRESTS: Record<string, string> = {
  mgl: '/assets/crests/mgl.png',
  ham: '/assets/crests/ham.png',
  muc: '/assets/crests/muc.png',
  kai: '/assets/crests/kai.png',
  gel: '/assets/crests/gel.png',
  kln: '/assets/crests/kln.png',
  ess: '/assets/crests/ess.png',
  dus: '/assets/crests/dus.png',
  kre: '/assets/crests/kre.png',
  kar: '/assets/crests/kar.png',
  han: '/assets/crests/han.png',
  off: '/assets/crests/off.png',
  // Batch 2 (2. Liga Nord)
  n_tebe: '/assets/crests/n_tebe.png',
  n_dor: '/assets/crests/n_dor.png',
  n_mun: '/assets/crests/n_mun.png',
  n_koes: '/assets/crests/n_koes.png',
  n_wup: '/assets/crests/n_wup.png',
  n_osn: '/assets/crests/n_osn.png',
  n_ess: '/assets/crests/n_ess.png',
  n_wat: '/assets/crests/n_wat.png',
  n_bie: '/assets/crests/n_bie.png',
  n_hern: '/assets/crests/n_hern.png',
  n_goe: '/assets/crests/n_goe.png',
  n_aac: '/assets/crests/n_aac.png',
  n_sol: '/assets/crests/n_sol.png',
  n_ham: '/assets/crests/n_ham.png',
  n_lev: '/assets/crests/n_lev.png',
  n_wac: '/assets/crests/n_wac.png',
  n_mue: '/assets/crests/n_mue.png',
  n_erk: '/assets/crests/n_erk.png',
  n_gue: '/assets/crests/n_gue.png',
  n_spa: '/assets/crests/n_spa.png',
  // Batch 3 (2. Liga Sued)
  s_saa: '/assets/crests/s_saa.png',
  s_nue: '/assets/crests/s_nue.png',
  s_muc: '/assets/crests/s_muc.png',
  s_hom: '/assets/crests/s_hom.png',
  s_bay: '/assets/crests/s_bay.png',
  s_voe: '/assets/crests/s_voe.png',
  s_dar: '/assets/crests/s_dar.png',
  s_man: '/assets/crests/s_man.png',
  s_hof: '/assets/crests/s_hof.png',
  s_fue: '/assets/crests/s_fue.png',
  s_vfb: '/assets/crests/s_vfb.png',
  s_mai: '/assets/crests/s_mai.png',
  s_fsv: '/assets/crests/s_fsv.png',
  s_pir: '/assets/crests/s_pir.png',
  s_aug: '/assets/crests/s_aug.png',
  s_stk: '/assets/crests/s_stk.png',
  s_reg: '/assets/crests/s_reg.png',
  s_sch: '/assets/crests/s_sch.png',
  s_bkr: '/assets/crests/s_bkr.png',
  s_reu: '/assets/crests/s_reu.png',
  // Batch 4 (DDR-Oberliga)
  'ddr-dresden': '/assets/crests/ddr-dresden.png',
  'ddr-rostock': '/assets/crests/ddr-rostock.png',
  'ddr-berlin-ost': '/assets/crests/ddr-berlin-ost.png',
  'ddr-magdeburg': '/assets/crests/ddr-magdeburg.png',
  'ddr-jena': '/assets/crests/ddr-jena.png',
  'ddr-erfurt': '/assets/crests/ddr-erfurt.png',
  'ddr-halle': '/assets/crests/ddr-halle.png',
  'ddr-chemnitz': '/assets/crests/ddr-chemnitz.png',
  'ddr-leipzig': '/assets/crests/ddr-leipzig.png',
  'ddr-brandenburg': '/assets/crests/ddr-brandenburg.png',
  'ddr-ob-ph1': '/assets/crests/ddr-ob-ph1.png',
  'ddr-ob-ph2': '/assets/crests/ddr-ob-ph2.png',
  'ddr-ob-ph3': '/assets/crests/ddr-ob-ph3.png',
  'ddr-ob-ph4': '/assets/crests/ddr-ob-ph4.png',
  'ddr-li-ph1': '/assets/crests/ddr-li-ph1.png',
  'ddr-li-ph2': '/assets/crests/ddr-li-ph2.png',
  'ddr-li-ph3': '/assets/crests/ddr-li-ph3.png',
  'ddr-li-ph4': '/assets/crests/ddr-li-ph4.png',
  'ddr-li-ph5': '/assets/crests/ddr-li-ph5.png',
  'ddr-li-ph6': '/assets/crests/ddr-li-ph6.png',
  'ddr-li-ph7': '/assets/crests/ddr-li-ph7.png',
  'ddr-li-ph8': '/assets/crests/ddr-li-ph8.png',
  'ddr-li-ph9': '/assets/crests/ddr-li-ph9.png',
  'ddr-li-ph10': '/assets/crests/ddr-li-ph10.png',
  'ddr-li-ph11': '/assets/crests/ddr-li-ph11.png',
  'ddr-li-ph12': '/assets/crests/ddr-li-ph12.png',
};

/** Standard-Wappen eines Vereins (oder undefined, wenn keines mitgeliefert wird). */
export function defaultCrestFor(clubId: string): string | undefined {
  return DEFAULT_CRESTS[clubId];
}
