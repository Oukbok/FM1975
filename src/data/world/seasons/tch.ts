// Ligen Tschechoslowakei je Saison (Schlüssel = Startjahr). Quellen: docs/recherche/weltvereine_tch.md
import type { SeasonRow } from '../types';

export const SEASONS_TCH: Record<number, SeasonRow> = {
  1975: {
    t1: ['tch-ostrava', 'tch-prag-gelb-rot', 'tch-bratislava-gelb', 'tch-bruenn', 'tch-bratislava', 'tch-trnava', 'tch-prag-rot-weiss', 'tch-kosice', 'tch-prag-gruen', 'tch-presov', 'tch-teplice', 'tch-nitra', 'tch-hradec', 'tch-banska-bystrica', 'tch-pilsen', 'tch-trinec'],
    cup: 'tch-bratislava',
    cupFinalist: 'tch-ostrava',
    euro: { ec: ['tch-bratislava'], cwc: ['tch-bratislava'], uefa: ['tch-bratislava-gelb', 'tch-prag-gelb-rot'] },
  },
  1976: {
    t1: ['tch-prag-gelb-rot', 'tch-prag-rot-weiss', 'tch-ostrava', 'tch-bruenn', 'tch-bratislava', 'tch-kosice-blau', 'tch-trnava', 'tch-bratislava-gelb', 'tch-prag-gruen', 'tch-presov', 'tch-kosice', 'tch-prag-rot', 'tch-nitra', 'tch-teplice', 'tch-zilina', 'tch-trinec'],
    cup: 'tch-kosice-blau',
    cupFinalist: 'tch-ostrava',
    euro: { ec: ['tch-ostrava'], cwc: ['tch-bratislava'], uefa: ['tch-prag-gelb-rot', 'tch-prag-rot-weiss'] },
  },
  1977: {
    t1: ['tch-bruenn', 'tch-prag-gelb-rot', 'tch-ostrava', 'tch-prag-rot-weiss', 'tch-bratislava', 'tch-kosice-blau', 'tch-bratislava-gelb', 'tch-trnava', 'tch-prag-gruen', 'tch-kosice', 'tch-prag-rot', 'tch-presov', 'tch-zilina', 'tch-nitra', 'tch-teplice', 'tch-hradec'],
    cup: 'tch-ostrava',
    cupFinalist: 'tch-kosice',
    euro: { ec: ['tch-prag-gelb-rot'], cwc: ['tch-kosice-blau'], uefa: ['tch-ostrava', 'tch-prag-rot-weiss'] },
  },
  1978: {
    t1: ['tch-prag-gelb-rot', 'tch-bruenn', 'tch-ostrava', 'tch-prag-rot-weiss', 'tch-bratislava', 'tch-kosice-blau', 'tch-prag-gruen', 'tch-bratislava-gelb', 'tch-trnava', 'tch-kosice', 'tch-prag-rot', 'tch-zilina', 'tch-teplice', 'tch-presov', 'tch-cheb', 'tch-nitra'],
    cup: 'tch-kosice-blau',
    cupFinalist: 'tch-prag-gelb-rot',
    euro: { ec: ['tch-bruenn'], cwc: ['tch-ostrava'], uefa: ['tch-prag-gelb-rot', 'tch-prag-rot-weiss'] },
  },
  1979: {
    t1: ['tch-ostrava', 'tch-bruenn', 'tch-prag-gelb-rot', 'tch-prag-rot-weiss', 'tch-bratislava', 'tch-prag-gruen', 'tch-kosice-blau', 'tch-bratislava-gelb', 'tch-trnava', 'tch-prag-rot', 'tch-zilina', 'tch-cheb', 'tch-kosice', 'tch-teplice', 'tch-presov', 'tch-pilsen'],
    cup: 'tch-prag-rot',
    cupFinalist: 'tch-bratislava-gelb',
    euro: { ec: ['tch-prag-gelb-rot'], cwc: ['tch-kosice-blau'], uefa: ['tch-bruenn', 'tch-ostrava'] },
  },
  1980: {
    t1: ['tch-ostrava', 'tch-prag-gelb-rot', 'tch-bruenn', 'tch-prag-gruen', 'tch-bratislava', 'tch-prag-rot', 'tch-prag-rot-weiss', 'tch-bratislava-gelb', 'tch-kosice-blau', 'tch-trnava', 'tch-zilina', 'tch-cheb', 'tch-kosice', 'tch-nitra', 'tch-presov', 'tch-banska-bystrica'],
    cup: 'tch-prag-gelb-rot',
    cupFinalist: 'tch-bratislava',
    euro: { ec: ['tch-ostrava'], cwc: ['tch-prag-rot'], uefa: ['tch-bruenn', 'tch-prag-gelb-rot'] },
  },
  1981: {
    t1: ['tch-prag-gelb-rot', 'tch-ostrava', 'tch-prag-gruen', 'tch-bratislava', 'tch-prag-rot', 'tch-bruenn', 'tch-prag-rot-weiss', 'tch-bratislava-gelb', 'tch-kosice-blau', 'tch-trnava', 'tch-zilina', 'tch-cheb', 'tch-nitra', 'tch-kosice', 'tch-presov', 'tch-banska-bystrica'],
    cup: 'tch-bratislava',
    cupFinalist: 'tch-prag-gelb-rot',
    euro: { ec: ['tch-ostrava'], cwc: ['tch-prag-gelb-rot'], uefa: ['tch-prag-gruen', 'tch-bratislava'] },
  },
  1982: {
    t1: ['tch-prag-gruen', 'tch-prag-rot', 'tch-prag-gelb-rot', 'tch-ostrava', 'tch-bratislava', 'tch-prag-rot-weiss', 'tch-bratislava-gelb', 'tch-bruenn', 'tch-trnava', 'tch-kosice-blau', 'tch-zilina', 'tch-cheb', 'tch-nitra', 'tch-presov', 'tch-ostrava-vitkovice', 'tch-banska-bystrica'],
    cup: 'tch-prag-gelb-rot',
    cupFinalist: 'tch-bratislava',
    euro: { ec: ['tch-prag-gelb-rot'], cwc: ['tch-bratislava'], uefa: ['tch-prag-gruen', 'tch-prag-rot'] },
  },
  1983: {
    t1: ['tch-prag-rot', 'tch-prag-gruen', 'tch-prag-gelb-rot', 'tch-ostrava', 'tch-prag-rot-weiss', 'tch-bratislava-gelb', 'tch-bratislava', 'tch-trnava', 'tch-ostrava-vitkovice', 'tch-kosice-blau', 'tch-bruenn', 'tch-cheb', 'tch-zilina', 'tch-nitra', 'tch-presov', 'tch-banska-bystrica'],
    cup: 'tch-prag-rot',
    cupFinalist: 'tch-trnava',
    euro: { ec: ['tch-prag-gruen'], cwc: ['tch-prag-gelb-rot'], uefa: ['tch-prag-rot', 'tch-ostrava'] },
  },
  1984: {
    t1: ['tch-prag-rot', 'tch-prag-gruen', 'tch-ostrava', 'tch-prag-gelb-rot', 'tch-ostrava-vitkovice', 'tch-prag-rot-weiss', 'tch-bratislava-gelb', 'tch-trnava', 'tch-bratislava', 'tch-kosice-blau', 'tch-cheb', 'tch-bruenn', 'tch-zilina', 'tch-presov', 'tch-nitra', 'tch-banska-bystrica'],
    cup: 'tch-prag-gelb-rot',
    cupFinalist: 'tch-bratislava-gelb',
    euro: { ec: ['tch-prag-rot'], cwc: ['tch-prag-gelb-rot'], uefa: ['tch-prag-gruen', 'tch-ostrava'] },
  },
  1985: {
    t1: ['tch-ostrava-vitkovice', 'tch-prag-rot', 'tch-prag-gruen', 'tch-ostrava', 'tch-prag-gelb-rot', 'tch-prag-rot-weiss', 'tch-trnava', 'tch-bratislava-gelb', 'tch-cheb', 'tch-bratislava', 'tch-kosice-blau', 'tch-zilina', 'tch-bruenn', 'tch-dunajska-streda', 'tch-nitra', 'tch-presov'],
    cup: 'tch-trnava',
    cupFinalist: 'tch-prag-gelb-rot',
    euro: { ec: ['tch-prag-rot'], cwc: ['tch-prag-gelb-rot'], uefa: ['tch-prag-gruen', 'tch-ostrava'] },
  },
  1986: {
    t1: ['tch-prag-rot', 'tch-ostrava-vitkovice', 'tch-prag-gruen', 'tch-ostrava', 'tch-prag-gelb-rot', 'tch-prag-rot-weiss', 'tch-trnava', 'tch-dunajska-streda', 'tch-bratislava-gelb', 'tch-cheb', 'tch-kosice-blau', 'tch-zilina', 'tch-bratislava', 'tch-nitra', 'tch-presov', 'tch-bruenn'],
    cup: 'tch-dunajska-streda',
    cupFinalist: 'tch-prag-rot',
    euro: { ec: ['tch-ostrava-vitkovice'], cwc: ['tch-trnava'], uefa: ['tch-prag-rot', 'tch-ostrava'] },
  },
  1987: {
    t1: ['tch-prag-rot', 'tch-prag-gelb-rot', 'tch-ostrava', 'tch-prag-gruen', 'tch-ostrava-vitkovice', 'tch-prag-rot-weiss', 'tch-dunajska-streda', 'tch-bratislava-gelb', 'tch-trnava', 'tch-cheb', 'tch-presov', 'tch-kosice-blau', 'tch-nitra', 'tch-zilina', 'tch-bratislava', 'tch-olmuetz'],
    cup: 'tch-prag-rot',
    cupFinalist: 'tch-presov',
    euro: { ec: ['tch-prag-rot'], cwc: ['tch-dunajska-streda'], uefa: ['tch-ostrava-vitkovice', 'tch-prag-gelb-rot'] },
  },
  1988: {
    t1: ['tch-prag-rot', 'tch-ostrava', 'tch-prag-gelb-rot', 'tch-prag-gruen', 'tch-dunajska-streda', 'tch-presov', 'tch-ostrava-vitkovice', 'tch-prag-rot-weiss', 'tch-trnava', 'tch-cheb', 'tch-bratislava-gelb', 'tch-olmuetz', 'tch-kosice-blau', 'tch-nitra', 'tch-bratislava', 'tch-pilsen'],
    cup: 'tch-prag-rot',
    cupFinalist: 'tch-kosice-blau',
    euro: { ec: ['tch-prag-rot'], cwc: ['tch-prag-rot'], uefa: ['tch-ostrava-vitkovice', 'tch-ostrava'] },
  },
  1989: {
    t1: ['tch-prag-rot', 'tch-ostrava', 'tch-prag-gelb-rot', 'tch-prag-gruen', 'tch-dunajska-streda', 'tch-prag-rot-weiss', 'tch-presov', 'tch-ostrava-vitkovice', 'tch-bratislava', 'tch-cheb', 'tch-olmuetz', 'tch-trnava', 'tch-bratislava-gelb', 'tch-nitra', 'tch-kosice-blau', 'tch-pilsen'],
    cup: 'tch-prag-gelb-rot',
    cupFinalist: 'tch-bratislava-gelb',
    euro: { ec: ['tch-prag-rot'], cwc: ['tch-prag-gelb-rot'], uefa: ['tch-ostrava', 'tch-dunajska-streda'] },
  },
  1990: {
    t1: ['tch-prag-rot', 'tch-bratislava', 'tch-ostrava', 'tch-prag-rot-weiss', 'tch-olmuetz', 'tch-prag-gelb-rot', 'tch-bratislava-gelb', 'tch-dunajska-streda', 'tch-prag-gruen', 'tch-presov', 'tch-ostrava-vitkovice', 'tch-cheb', 'tch-trnava', 'tch-nitra', 'tch-kosice', 'tch-bruenn'],
    cup: 'tch-ostrava',
    cupFinalist: 'tch-prag-rot',
    euro: { ec: ['tch-prag-rot'], cwc: ['tch-prag-gelb-rot'], uefa: ['tch-bratislava', 'tch-ostrava'] },
  },
  1991: {
    t1: ['tch-bratislava', 'tch-prag-rot', 'tch-prag-rot-weiss', 'tch-ostrava', 'tch-olmuetz', 'tch-kosice', 'tch-bratislava-gelb', 'tch-dunajska-streda', 'tch-prag-gelb-rot', 'tch-presov', 'tch-hradec', 'tch-trnava', 'tch-ostrava-vitkovice', 'tch-nitra', 'tch-cheb', 'tch-bruenn'],
    cup: 'tch-prag-rot',
    cupFinalist: 'tch-kosice',
    euro: { ec: ['tch-prag-rot'], cwc: ['tch-ostrava'], uefa: ['tch-bratislava', 'tch-olmuetz'] },
  },
  1992: {
    t1: ['tch-prag-rot', 'tch-prag-rot-weiss', 'tch-kosice', 'tch-bratislava', 'tch-ostrava', 'tch-olmuetz', 'tch-dunajska-streda', 'tch-bratislava-gelb', 'tch-trnava', 'tch-prag-gelb-rot', 'tch-hradec', 'tch-presov', 'tch-bruenn', 'tch-nitra', 'tch-ostrava-vitkovice', 'tch-prag-gruen'],
    cupFinalist: 'tch-kosice',
    euro: { ec: ['tch-bratislava'], cwc: ['tch-prag-rot'], uefa: ['tch-prag-rot-weiss', 'tch-olmuetz'] },
    note: "Letzte gemeinsame Saison.",
  },
};
