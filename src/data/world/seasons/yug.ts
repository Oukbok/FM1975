// Ligen Jugoslawien je Saison (Schlüssel = Startjahr). Quellen: docs/recherche/weltvereine_yug.md
import type { SeasonRow } from '../types';

export const SEASONS_YUG: Record<number, SeasonRow> = {
  1975: {
    t1: ['yug-belgrad-schwarz-weiss', 'yug-split', 'yug-belgrad-rot', 'yug-zagreb', 'yug-novi-sad', 'yug-mostar', 'yug-belgrad-blau-weiss', 'yug-rijeka', 'yug-sarajevo-weinrot', 'yug-sarajevo-blau', 'yug-tuzla', 'yug-osijek', 'yug-titograd', 'yug-skopje', 'yug-ljubljana', 'yug-zenica', 'yug-banja-luka', 'yug-nis'],
    cup: 'yug-split',
    cupFinalist: 'yug-zagreb',
    euro: { ec: ['yug-split'], cwc: ['yug-belgrad-rot'], uefa: ['yug-belgrad-blau-weiss', 'yug-mostar'] },
    note: "Reihenfolge der Mittelfeldplätze aus Wissen, ungeprüft.",
  },
  1976: {
    t1: ['yug-belgrad-rot', 'yug-zagreb', 'yug-split', 'yug-belgrad-schwarz-weiss', 'yug-mostar', 'yug-rijeka', 'yug-novi-sad', 'yug-belgrad-blau-weiss', 'yug-sarajevo-weinrot', 'yug-sarajevo-blau', 'yug-tuzla', 'yug-osijek', 'yug-titograd', 'yug-ljubljana', 'yug-skopje', 'yug-zenica', 'yug-banja-luka', 'yug-nis'],
    cup: 'yug-split',
    cupFinalist: 'yug-belgrad-rot',
    euro: { ec: ['yug-belgrad-schwarz-weiss'], cwc: ['yug-split'], uefa: ['yug-mostar', 'yug-zagreb'] },
  },
  1977: {
    t1: ['yug-belgrad-schwarz-weiss', 'yug-belgrad-rot', 'yug-split', 'yug-zagreb', 'yug-rijeka', 'yug-mostar', 'yug-novi-sad', 'yug-sarajevo-weinrot', 'yug-belgrad-blau-weiss', 'yug-sarajevo-blau', 'yug-tuzla', 'yug-osijek', 'yug-titograd', 'yug-zenica', 'yug-skopje', 'yug-nis', 'yug-mitrovica', 'yug-ljubljana'],
    cup: 'yug-rijeka',
    cupFinalist: 'yug-split',
    euro: { ec: ['yug-belgrad-rot'], cwc: ['yug-split'], uefa: ['yug-zagreb', 'yug-mostar'] },
  },
  1978: {
    t1: ['yug-split', 'yug-zagreb', 'yug-belgrad-rot', 'yug-belgrad-schwarz-weiss', 'yug-rijeka', 'yug-sarajevo-blau', 'yug-mostar', 'yug-novi-sad', 'yug-sarajevo-weinrot', 'yug-belgrad-blau-weiss', 'yug-tuzla', 'yug-osijek', 'yug-titograd', 'yug-nis', 'yug-skopje', 'yug-zenica', 'yug-banja-luka', 'yug-mitrovica'],
    cup: 'yug-rijeka',
    cupFinalist: 'yug-belgrad-schwarz-weiss',
    euro: { ec: ['yug-belgrad-schwarz-weiss'], cwc: ['yug-rijeka'], uefa: ['yug-belgrad-rot', 'yug-split'] },
  },
  1979: {
    t1: ['yug-belgrad-rot', 'yug-sarajevo-weinrot', 'yug-split', 'yug-zagreb', 'yug-rijeka', 'yug-sarajevo-blau', 'yug-mostar', 'yug-belgrad-schwarz-weiss', 'yug-novi-sad', 'yug-osijek', 'yug-tuzla', 'yug-belgrad-blau-weiss', 'yug-titograd', 'yug-nis', 'yug-zenica', 'yug-skopje', 'yug-banja-luka', 'yug-vinkovci'],
    cup: 'yug-zagreb',
    cupFinalist: 'yug-split',
    euro: { ec: ['yug-split'], cwc: ['yug-rijeka'], uefa: ['yug-belgrad-rot', 'yug-zagreb'] },
  },
  1980: {
    t1: ['yug-belgrad-rot', 'yug-split', 'yug-zagreb', 'yug-nis', 'yug-sarajevo-blau', 'yug-belgrad-schwarz-weiss', 'yug-rijeka', 'yug-mostar', 'yug-sarajevo-weinrot', 'yug-osijek', 'yug-novi-sad', 'yug-tuzla', 'yug-titograd', 'yug-vinkovci', 'yug-belgrad-blau-weiss', 'yug-zenica', 'yug-skopje', 'yug-banja-luka'],
    cup: 'yug-mostar',
    cupFinalist: 'yug-zagreb',
    euro: { ec: ['yug-belgrad-rot'], cwc: ['yug-zagreb'], uefa: ['yug-split', 'yug-nis'] },
  },
  1981: {
    t1: ['yug-zagreb', 'yug-belgrad-rot', 'yug-split', 'yug-nis', 'yug-belgrad-schwarz-weiss', 'yug-sarajevo-blau', 'yug-mostar', 'yug-sarajevo-weinrot', 'yug-rijeka', 'yug-osijek', 'yug-novi-sad', 'yug-tuzla', 'yug-vinkovci', 'yug-titograd', 'yug-skopje', 'yug-belgrad-blau-weiss', 'yug-pristina', 'yug-zenica'],
    cup: 'yug-belgrad-rot',
    cupFinalist: 'yug-zagreb',
    euro: { ec: ['yug-belgrad-rot'], cwc: ['yug-mostar'], uefa: ['yug-split', 'yug-nis'] },
  },
  1982: {
    t1: ['yug-belgrad-schwarz-weiss', 'yug-split', 'yug-zagreb', 'yug-belgrad-rot', 'yug-sarajevo-blau', 'yug-mostar', 'yug-sarajevo-weinrot', 'yug-rijeka', 'yug-nis', 'yug-osijek', 'yug-vinkovci', 'yug-novi-sad', 'yug-tuzla', 'yug-titograd', 'yug-pristina', 'yug-skopje', 'yug-belgrad-blau-weiss', 'yug-zenica'],
    cup: 'yug-zagreb',
    cupFinalist: 'yug-split',
    euro: { ec: ['yug-zagreb'], cwc: ['yug-belgrad-rot'], uefa: ['yug-split', 'yug-nis'] },
  },
  1983: {
    t1: ['yug-belgrad-rot', 'yug-split', 'yug-sarajevo-blau', 'yug-belgrad-schwarz-weiss', 'yug-zagreb', 'yug-sarajevo-weinrot', 'yug-mostar', 'yug-rijeka', 'yug-osijek', 'yug-vinkovci', 'yug-titograd', 'yug-nis', 'yug-tuzla', 'yug-pristina', 'yug-novi-sad', 'yug-skopje', 'yug-zenica', 'yug-banja-luka'],
    cup: 'yug-split',
    cupFinalist: 'yug-belgrad-rot',
    euro: { ec: ['yug-belgrad-schwarz-weiss'], cwc: ['yug-zagreb'], uefa: ['yug-split', 'yug-sarajevo-blau'] },
  },
  1984: {
    t1: ['yug-sarajevo-weinrot', 'yug-split', 'yug-belgrad-schwarz-weiss', 'yug-belgrad-rot', 'yug-zagreb', 'yug-mostar', 'yug-rijeka', 'yug-sarajevo-blau', 'yug-osijek', 'yug-titograd', 'yug-vinkovci', 'yug-pristina', 'yug-nis', 'yug-novi-sad', 'yug-tuzla', 'yug-bugojno', 'yug-belgrad-blau-weiss', 'yug-skopje'],
    cup: 'yug-belgrad-rot',
    cupFinalist: 'yug-zagreb',
    euro: { ec: ['yug-belgrad-rot'], cwc: ['yug-split'], uefa: ['yug-belgrad-schwarz-weiss', 'yug-sarajevo-blau'] },
  },
  1985: {
    t1: ['yug-belgrad-schwarz-weiss', 'yug-belgrad-rot', 'yug-mostar', 'yug-split', 'yug-rijeka', 'yug-zagreb', 'yug-sarajevo-blau', 'yug-sarajevo-weinrot', 'yug-titograd', 'yug-osijek', 'yug-novi-sad', 'yug-nis', 'yug-pristina', 'yug-vinkovci', 'yug-belgrad-banjica', 'yug-tuzla', 'yug-zenica', 'yug-bugojno'],
    cup: 'yug-mostar',
    cupFinalist: 'yug-zagreb',
    euro: { ec: ['yug-sarajevo-weinrot'], cwc: ['yug-belgrad-rot'], uefa: ['yug-split', 'yug-belgrad-schwarz-weiss'] },
  },
  1986: {
    t1: ['yug-belgrad-schwarz-weiss', 'yug-mostar', 'yug-belgrad-rot', 'yug-split', 'yug-rijeka', 'yug-sarajevo-blau', 'yug-zagreb', 'yug-belgrad-banjica', 'yug-sarajevo-weinrot', 'yug-titograd', 'yug-novi-sad', 'yug-osijek', 'yug-pristina', 'yug-vinkovci', 'yug-nis', 'yug-skopje', 'yug-tuzla', 'yug-zenica'],
    cup: 'yug-split',
    cupFinalist: 'yug-novi-sad',
    euro: { ec: ['yug-belgrad-schwarz-weiss'], cwc: ['yug-mostar'], uefa: ['yug-belgrad-rot', 'yug-split'] },
    note: "Saison mit Punktabzügen (Spielmanipulation); Meister nachträglich Belgrad Schwarz-Weiß.",
  },
  1987: {
    t1: ['yug-belgrad-rot', 'yug-belgrad-schwarz-weiss', 'yug-mostar', 'yug-split', 'yug-zagreb', 'yug-rijeka', 'yug-sarajevo-blau', 'yug-novi-sad', 'yug-sarajevo-weinrot', 'yug-titograd', 'yug-osijek', 'yug-belgrad-banjica', 'yug-skopje', 'yug-banja-luka', 'yug-pristina', 'yug-vinkovci', 'yug-zenica', 'yug-nis'],
    cup: 'yug-banja-luka',
    cupFinalist: 'yug-belgrad-rot',
    euro: { ec: ['yug-belgrad-schwarz-weiss'], cwc: ['yug-split'], uefa: ['yug-mostar', 'yug-skopje'] },
  },
  1988: {
    t1: ['yug-novi-sad', 'yug-belgrad-rot', 'yug-belgrad-schwarz-weiss', 'yug-split', 'yug-zagreb', 'yug-mostar', 'yug-rijeka', 'yug-sarajevo-blau', 'yug-osijek', 'yug-belgrad-banjica', 'yug-sarajevo-weinrot', 'yug-titograd', 'yug-skopje', 'yug-nis', 'yug-banja-luka', 'yug-zenica', 'yug-vinkovci', 'yug-sibenik'],
    cup: 'yug-belgrad-schwarz-weiss',
    cupFinalist: 'yug-novi-sad',
    euro: { ec: ['yug-belgrad-rot'], cwc: ['yug-banja-luka'], uefa: ['yug-belgrad-schwarz-weiss', 'yug-split'] },
    note: "Bei Remis Elfmeterschießen um einen Zusatzpunkt (1988–1990).",
  },
  1989: {
    t1: ['yug-belgrad-rot', 'yug-zagreb', 'yug-split', 'yug-belgrad-schwarz-weiss', 'yug-novi-sad', 'yug-rijeka', 'yug-osijek', 'yug-mostar', 'yug-sarajevo-blau', 'yug-belgrad-banjica', 'yug-sarajevo-weinrot', 'yug-titograd', 'yug-zemun', 'yug-nis', 'yug-skopje', 'yug-banja-luka', 'yug-ljubljana', 'yug-sibenik'],
    cup: 'yug-belgrad-rot',
    cupFinalist: 'yug-split',
    euro: { ec: ['yug-novi-sad'], cwc: ['yug-belgrad-schwarz-weiss'], uefa: ['yug-belgrad-rot', 'yug-zagreb'] },
  },
  1990: {
    t1: ['yug-belgrad-rot', 'yug-zagreb', 'yug-belgrad-schwarz-weiss', 'yug-split', 'yug-novi-sad', 'yug-osijek', 'yug-mostar', 'yug-rijeka', 'yug-sarajevo-blau', 'yug-belgrad-banjica', 'yug-zemun', 'yug-titograd', 'yug-sarajevo-weinrot', 'yug-skopje', 'yug-ljubljana', 'yug-nis', 'yug-subotica', 'yug-sibenik'],
    cup: 'yug-split',
    cupFinalist: 'yug-belgrad-rot',
    euro: { ec: ['yug-belgrad-rot'], cwc: ['yug-split'], uefa: ['yug-zagreb', 'yug-belgrad-schwarz-weiss'] },
    note: "Letzte Saison mit slowenischen und kroatischen Vereinen.",
  },
  1991: {
    t1: ['yug-belgrad-rot', 'yug-belgrad-schwarz-weiss', 'yug-novi-sad', 'yug-mostar', 'yug-belgrad-blau-weiss', 'yug-sarajevo-blau', 'yug-zemun', 'yug-belgrad-banjica', 'yug-titograd', 'yug-skopje', 'yug-sarajevo-weinrot', 'yug-nis', 'yug-krusevac', 'yug-subotica', 'yug-pristina', 'yug-zenica', 'yug-bitola', 'yug-zrenjanin'],
    cup: 'yug-belgrad-schwarz-weiss',
    cupFinalist: 'yug-belgrad-rot',
    euro: { ec: ['yug-belgrad-rot'], cwc: ['yug-split'], uefa: ['yug-belgrad-schwarz-weiss', 'yug-novi-sad'] },
    note: "Ohne kroatische und slowenische Vereine (Bürgerkrieg); bosnische Vereine verließen die Liga im Frühjahr 1992. Split spielte den Pokalsieger-Wettbewerb noch für Jugoslawien.",
  },
};
