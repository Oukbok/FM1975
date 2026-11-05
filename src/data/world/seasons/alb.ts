// =============================================================================
// Weltdaten alb: Kategoria Superiore je Saison (Schlüssel = Startjahr, 1975 = 1975/76).
// t1 in Reihenfolge der Abschlusstabelle; cup/cupFinalist = Landespokal; euro = Europapokal-Teilnehmer.
// Quellen und Unsicherheiten: docs/recherche/weltvereine_alb.md.
// =============================================================================
import type { SeasonRow } from '../types';

export const SEASONS_ALB: Record<number, SeasonRow> = {
  1975: {
    t1: ['alb-tirana-blau', 'alb-tirana-rot', 'alb-tirana-weiss-blau', 'alb-shkodra', 'alb-vlora', 'alb-elbasan', 'alb-kavaja', 'alb-durres', 'alb-korca', 'alb-berat', 'alb-gjirokastra', 'alb-kucova', 'alb-lushnja', 'alb-fier'],
    note: 'Tabelle aus Wissen, ungeprüft (Meister gegen die Landesmeister-Teilnahmen geprüft, soweit Albanien antrat) Albanien nahm nicht an den Europapokalen teil.',
  },
  1976: {
    t1: ['alb-tirana-blau', 'alb-tirana-rot', 'alb-tirana-weiss-blau', 'alb-shkodra', 'alb-vlora', 'alb-elbasan', 'alb-kavaja', 'alb-durres', 'alb-korca', 'alb-berat', 'alb-gjirokastra', 'alb-kucova', 'alb-lushnja', 'alb-fier'],
    note: 'Tabelle aus Wissen, ungeprüft (Meister gegen die Landesmeister-Teilnahmen geprüft, soweit Albanien antrat) Albanien nahm nicht an den Europapokalen teil.',
  },
  1977: {
    t1: ['alb-shkodra', 'alb-tirana-blau', 'alb-tirana-rot', 'alb-tirana-weiss-blau', 'alb-vlora', 'alb-elbasan', 'alb-kavaja', 'alb-durres', 'alb-korca', 'alb-berat', 'alb-gjirokastra', 'alb-kucova', 'alb-lushnja', 'alb-fier'],
    note: 'Tabelle aus Wissen, ungeprüft (Meister gegen die Landesmeister-Teilnahmen geprüft, soweit Albanien antrat) Albanien nahm nicht an den Europapokalen teil.',
  },
  1978: {
    t1: ['alb-tirana-rot', 'alb-tirana-weiss-blau', 'alb-tirana-blau', 'alb-shkodra', 'alb-vlora', 'alb-elbasan', 'alb-kavaja', 'alb-durres', 'alb-korca', 'alb-berat', 'alb-gjirokastra', 'alb-kucova', 'alb-lushnja', 'alb-fier'],
    euro: { ec: ['alb-shkodra'] },
    note: 'Tabelle aus Wissen, ungeprüft (Meister gegen die Landesmeister-Teilnahmen geprüft, soweit Albanien antrat)',
  },
  1979: {
    t1: ['alb-tirana-blau', 'alb-tirana-rot', 'alb-tirana-weiss-blau', 'alb-shkodra', 'alb-vlora', 'alb-elbasan', 'alb-kavaja', 'alb-durres', 'alb-korca', 'alb-berat', 'alb-gjirokastra', 'alb-kucova', 'alb-lushnja', 'alb-fier'],
    euro: { ec: ['alb-tirana-rot'] },
    note: 'Tabelle aus Wissen, ungeprüft (Meister gegen die Landesmeister-Teilnahmen geprüft, soweit Albanien antrat)',
  },
  1980: {
    t1: ['alb-tirana-rot', 'alb-tirana-blau', 'alb-tirana-weiss-blau', 'alb-shkodra', 'alb-vlora', 'alb-elbasan', 'alb-kavaja', 'alb-durres', 'alb-korca', 'alb-berat', 'alb-gjirokastra', 'alb-kucova', 'alb-lushnja', 'alb-fier'],
    euro: { ec: ['alb-tirana-blau'] },
    note: 'Tabelle aus Wissen, ungeprüft (Meister gegen die Landesmeister-Teilnahmen geprüft, soweit Albanien antrat)',
  },
  1981: {
    t1: ['alb-tirana-weiss-blau', 'alb-tirana-rot', 'alb-tirana-blau', 'alb-shkodra', 'alb-vlora', 'alb-elbasan', 'alb-kavaja', 'alb-durres', 'alb-korca', 'alb-berat', 'alb-gjirokastra', 'alb-kucova', 'alb-lushnja', 'alb-fier'],
    euro: { ec: ['alb-tirana-rot'], uefa: ['alb-tirana-blau'] },
    note: 'Tabelle aus Wissen, ungeprüft (Meister gegen die Landesmeister-Teilnahmen geprüft, soweit Albanien antrat)',
  },
  1982: {
    t1: ['alb-shkodra', 'alb-tirana-weiss-blau', 'alb-tirana-blau', 'alb-tirana-rot', 'alb-vlora', 'alb-elbasan', 'alb-kavaja', 'alb-durres', 'alb-korca', 'alb-berat', 'alb-gjirokastra', 'alb-kucova', 'alb-lushnja', 'alb-fier'],
    euro: { ec: ['alb-tirana-weiss-blau'] },
    note: 'Tabelle aus Wissen, ungeprüft (Meister gegen die Landesmeister-Teilnahmen geprüft, soweit Albanien antrat)',
  },
  1983: {
    t1: ['alb-elbasan', 'alb-tirana-rot', 'alb-tirana-blau', 'alb-tirana-weiss-blau', 'alb-shkodra', 'alb-vlora', 'alb-kavaja', 'alb-durres', 'alb-korca', 'alb-berat', 'alb-gjirokastra', 'alb-kucova', 'alb-lushnja', 'alb-fier'],
    note: 'Tabelle aus Wissen, ungeprüft (Meister gegen die Landesmeister-Teilnahmen geprüft, soweit Albanien antrat)',
  },
  1984: {
    t1: ['alb-tirana-weiss-blau', 'alb-tirana-blau', 'alb-tirana-rot', 'alb-shkodra', 'alb-vlora', 'alb-elbasan', 'alb-kavaja', 'alb-durres', 'alb-korca', 'alb-berat', 'alb-gjirokastra', 'alb-kucova', 'alb-lushnja', 'alb-fier'],
    euro: { ec: ['alb-elbasan'] },
    note: 'Tabelle aus Wissen, ungeprüft (Meister gegen die Landesmeister-Teilnahmen geprüft, soweit Albanien antrat)',
  },
  1985: {
    t1: ['alb-tirana-blau', 'alb-vlora', 'alb-tirana-rot', 'alb-tirana-weiss-blau', 'alb-shkodra', 'alb-elbasan', 'alb-kavaja', 'alb-durres', 'alb-korca', 'alb-berat', 'alb-gjirokastra', 'alb-kucova', 'alb-lushnja', 'alb-fier'],
    euro: { uefa: ['alb-tirana-blau'] },
    note: 'Tabelle aus Wissen, ungeprüft (Meister gegen die Landesmeister-Teilnahmen geprüft, soweit Albanien antrat)',
  },
  1986: {
    t1: ['alb-tirana-rot', 'alb-vlora', 'alb-tirana-blau', 'alb-tirana-weiss-blau', 'alb-shkodra', 'alb-elbasan', 'alb-kavaja', 'alb-durres', 'alb-korca', 'alb-berat', 'alb-gjirokastra', 'alb-kucova', 'alb-lushnja', 'alb-fier'],
    euro: { ec: ['alb-tirana-blau'], uefa: ['alb-vlora'] },
    note: 'Tabelle aus Wissen, ungeprüft (Meister gegen die Landesmeister-Teilnahmen geprüft, soweit Albanien antrat)',
  },
  1987: {
    t1: ['alb-tirana-weiss-blau', 'alb-tirana-rot', 'alb-tirana-blau', 'alb-shkodra', 'alb-vlora', 'alb-elbasan', 'alb-kavaja', 'alb-durres', 'alb-korca', 'alb-berat', 'alb-gjirokastra', 'alb-kucova', 'alb-lushnja', 'alb-fier'],
    euro: { ec: ['alb-tirana-rot'], uefa: ['alb-vlora'] },
    note: 'Tabelle aus Wissen, ungeprüft (Meister gegen die Landesmeister-Teilnahmen geprüft, soweit Albanien antrat)',
  },
  1988: {
    t1: ['alb-tirana-weiss-blau', 'alb-fier', 'alb-tirana-blau', 'alb-tirana-rot', 'alb-shkodra', 'alb-vlora', 'alb-elbasan', 'alb-kavaja', 'alb-durres', 'alb-korca', 'alb-berat', 'alb-gjirokastra', 'alb-kucova', 'alb-lushnja'],
    euro: { ec: ['alb-tirana-weiss-blau'] },
    note: 'Tabelle aus Wissen, ungeprüft (Meister gegen die Landesmeister-Teilnahmen geprüft, soweit Albanien antrat)',
  },
  1989: {
    t1: ['alb-tirana-blau', 'alb-tirana-rot', 'alb-tirana-weiss-blau', 'alb-shkodra', 'alb-vlora', 'alb-elbasan', 'alb-kavaja', 'alb-durres', 'alb-korca', 'alb-berat', 'alb-gjirokastra', 'alb-kucova', 'alb-lushnja', 'alb-fier'],
    euro: { ec: ['alb-tirana-weiss-blau'], uefa: ['alb-fier'] },
    note: 'Tabelle aus Wissen, ungeprüft (Meister gegen die Landesmeister-Teilnahmen geprüft, soweit Albanien antrat)',
  },
  1990: {
    t1: ['alb-vlora', 'alb-shkodra', 'alb-tirana-blau', 'alb-tirana-rot', 'alb-tirana-weiss-blau', 'alb-durres', 'alb-elbasan', 'alb-kavaja', 'alb-fier', 'alb-korca', 'alb-berat', 'alb-gjirokastra', 'alb-lushnja', 'alb-kruja', 'alb-pogradec', 'alb-peqin'],
    euro: { ec: ['alb-tirana-blau'], uefa: ['alb-tirana-rot'] },
    note: 'Tabelle aus Wissen, ungeprüft (Meister gegen die Landesmeister-Teilnahmen geprüft, soweit Albanien antrat)',
  },
  1991: {
    t1: ['alb-shkodra', 'alb-tirana-weiss-blau', 'alb-tirana-blau', 'alb-tirana-rot', 'alb-vlora', 'alb-durres', 'alb-elbasan', 'alb-kavaja', 'alb-fier', 'alb-korca', 'alb-berat', 'alb-gjirokastra', 'alb-lushnja', 'alb-kruja', 'alb-pogradec', 'alb-peqin'],
    euro: { ec: ['alb-vlora'], uefa: ['alb-shkodra'] },
    note: 'Tabelle aus Wissen, ungeprüft (Meister gegen die Landesmeister-Teilnahmen geprüft, soweit Albanien antrat)',
  },
  1992: {
    t1: ['alb-tirana-rot', 'alb-durres', 'alb-tirana-blau', 'alb-tirana-weiss-blau', 'alb-shkodra', 'alb-vlora', 'alb-elbasan', 'alb-kavaja', 'alb-fier', 'alb-korca', 'alb-berat', 'alb-gjirokastra', 'alb-lushnja', 'alb-kruja', 'alb-pogradec', 'alb-peqin'],
    note: 'Tabelle aus Wissen, ungeprüft (Meister gegen die Landesmeister-Teilnahmen geprüft, soweit Albanien antrat)',
  },
  1993: {
    t1: ['alb-durres', 'alb-tirana-weiss-blau', 'alb-tirana-blau', 'alb-tirana-rot', 'alb-shkodra', 'alb-vlora', 'alb-elbasan', 'alb-kavaja', 'alb-fier', 'alb-korca', 'alb-berat', 'alb-gjirokastra', 'alb-lushnja', 'alb-kruja', 'alb-pogradec', 'alb-peqin'],
    euro: { cl: ['alb-tirana-rot'] },
    note: 'Tabelle aus Wissen, ungeprüft (Meister gegen die Landesmeister-Teilnahmen geprüft, soweit Albanien antrat)',
  },
  1994: {
    t1: ['alb-tirana-weiss-blau', 'alb-tirana-rot', 'alb-tirana-blau', 'alb-shkodra', 'alb-vlora', 'alb-durres', 'alb-elbasan', 'alb-kavaja', 'alb-fier', 'alb-korca', 'alb-berat', 'alb-gjirokastra', 'alb-lushnja', 'alb-kruja', 'alb-pogradec', 'alb-peqin'],
    euro: { uefa: ['alb-durres'] },
    note: 'Tabelle aus Wissen, ungeprüft (Meister gegen die Landesmeister-Teilnahmen geprüft, soweit Albanien antrat)',
  },
  1995: {
    t1: ['alb-tirana-weiss-blau', 'alb-durres', 'alb-tirana-blau', 'alb-tirana-rot', 'alb-shkodra', 'alb-vlora', 'alb-elbasan', 'alb-kavaja', 'alb-fier', 'alb-korca', 'alb-berat', 'alb-gjirokastra', 'alb-lushnja', 'alb-kruja', 'alb-pogradec', 'alb-peqin'],
    euro: { uefa: ['alb-tirana-weiss-blau', 'alb-tirana-rot'] },
    note: 'Tabelle aus Wissen, ungeprüft (Meister gegen die Landesmeister-Teilnahmen geprüft, soweit Albanien antrat)',
  },
  1996: {
    t1: ['alb-tirana-weiss-blau', 'alb-shkodra', 'alb-tirana-blau', 'alb-tirana-rot', 'alb-vlora', 'alb-durres', 'alb-elbasan', 'alb-kavaja', 'alb-fier', 'alb-korca', 'alb-berat', 'alb-gjirokastra', 'alb-lushnja', 'alb-kruja', 'alb-pogradec', 'alb-peqin'],
    euro: { uefa: ['alb-tirana-weiss-blau', 'alb-durres'] },
    note: 'Tabelle aus Wissen, ungeprüft (Meister gegen die Landesmeister-Teilnahmen geprüft, soweit Albanien antrat)',
  },
  1997: {
    t1: ['alb-shkodra', 'alb-tirana-weiss-blau', 'alb-tirana-rot', 'alb-peqin', 'alb-durres', 'alb-elbasan', 'alb-fier', 'alb-lac', 'alb-lushnja', 'alb-berat', 'alb-korca', 'alb-tirana-blau', 'alb-ballsh', 'alb-kavaja', 'alb-vlora', 'alb-gjirokastra', 'alb-librazhd', 'alb-patos'],
  },
  1998: {
    t1: ['alb-tirana-weiss-blau', 'alb-shkodra', 'alb-ballsh', 'alb-berat', 'alb-lushnja', 'alb-durres', 'alb-peqin', 'alb-tirana-blau', 'alb-tirana-rot', 'alb-elbasan', 'alb-vlora', 'alb-korca', 'alb-fier', 'alb-kavaja', 'alb-lac', 'alb-burrel'],
    euro: { uefa: ['alb-tirana-weiss-blau'], cl: ['alb-shkodra'] },
  },
  1999: {
    t1: ['alb-tirana-weiss-blau', 'alb-berat', 'alb-durres', 'alb-shkodra', 'alb-ballsh', 'alb-peqin', 'alb-lushnja', 'alb-korca', 'alb-gjirokastra-gelb', 'alb-tirana-blau', 'alb-fier', 'alb-vlora', 'alb-elbasan', 'alb-tirana-rot'],
    euro: { uefa: ['alb-shkodra', 'alb-ballsh'], cl: ['alb-tirana-weiss-blau'] },
    note: 'Punktgleich mit Berat, Meister Tirana Weiß-Blau',
  },
  2000: {
    t1: ['alb-shkodra', 'alb-tirana-weiss-blau', 'alb-tirana-blau', 'alb-ballsh', 'alb-peqin', 'alb-lezha', 'alb-durres', 'alb-gjirokastra', 'alb-lushnja', 'alb-fier', 'alb-vlora', 'alb-berat', 'alb-kavaja', 'alb-korca'],
    euro: { uefa: ['alb-durres', 'alb-berat'], cl: ['alb-tirana-weiss-blau'] },
  },
  2001: {
    t1: ['alb-tirana-blau', 'alb-tirana-weiss-blau', 'alb-tirana-rot', 'alb-durres', 'alb-shkodra', 'alb-peqin', 'alb-lushnja', 'alb-vlora', 'alb-fier', 'alb-shijak', 'alb-lezha', 'alb-ballsh', 'alb-gjirokastra', 'alb-berat'],
    euro: { uefa: ['alb-tirana-blau', 'alb-tirana-weiss-blau'], cl: ['alb-shkodra'] },
  },
  2002: {
    t1: ['alb-tirana-weiss-blau', 'alb-shkodra', 'alb-tirana-rot', 'alb-durres', 'alb-peqin', 'alb-tirana-blau', 'alb-kavaja', 'alb-elbasan', 'alb-vlora', 'alb-lushnja', 'alb-fier', 'alb-shijak', 'alb-ballsh', 'alb-lezha'],
    euro: { uefa: ['alb-tirana-weiss-blau', 'alb-tirana-rot'], cl: ['alb-tirana-blau'] },
  },
  2003: {
    t1: ['alb-tirana-weiss-blau', 'alb-tirana-blau', 'alb-shkodra', 'alb-tirana-rot', 'alb-durres', 'alb-lushnja', 'alb-peqin', 'alb-elbasan', 'alb-kavaja', 'alb-vlora'],
    euro: { uefa: ['alb-tirana-blau', 'alb-shkodra'], cl: ['alb-tirana-weiss-blau'] },
  },
  2004: {
    t1: ['alb-tirana-weiss-blau', 'alb-elbasan', 'alb-tirana-blau', 'alb-shkodra', 'alb-durres', 'alb-lushnja', 'alb-peqin', 'alb-tirana-rot', 'alb-rrogozhina', 'alb-lac'],
    euro: { uefa: ['alb-tirana-blau', 'alb-tirana-rot'], cl: ['alb-tirana-weiss-blau'] },
  },
  2005: {
    t1: ['alb-elbasan', 'alb-tirana-weiss-blau', 'alb-tirana-blau', 'alb-tirana-rot', 'alb-kavaja', 'alb-shkodra', 'alb-peqin', 'alb-korca', 'alb-durres', 'alb-lushnja'],
    euro: { uefa: ['alb-elbasan', 'alb-durres'], cl: ['alb-tirana-weiss-blau'] },
  },
  2006: {
    t1: ['alb-tirana-weiss-blau', 'alb-durres', 'alb-shkodra', 'alb-tirana-rot', 'alb-tirana-blau', 'alb-kavaja', 'alb-elbasan', 'alb-kruja', 'alb-vlora', 'alb-peqin', 'alb-gjirokastra', 'alb-fier'],
    euro: { uefa: ['alb-tirana-weiss-blau', 'alb-tirana-blau'], cl: ['alb-elbasan'] },
  },
  2007: {
    t1: ['alb-tirana-blau', 'alb-tirana-rot', 'alb-kavaja', 'alb-elbasan', 'alb-peqin', 'alb-tirana-weiss-blau', 'alb-shkodra', 'alb-vlora', 'alb-durres', 'alb-kruja', 'alb-lezha', 'alb-korca'],
    euro: { uefa: ['alb-kavaja', 'alb-durres'], cl: ['alb-tirana-weiss-blau'] },
  },
  2008: {
    t1: ['alb-tirana-weiss-blau', 'alb-shkodra', 'alb-tirana-blau', 'alb-durres', 'alb-peqin', 'alb-vlora', 'alb-kavaja', 'alb-fier', 'alb-ballsh', 'alb-tirana-rot', 'alb-lushnja', 'alb-elbasan'],
    euro: { uefa: ['alb-shkodra', 'alb-tirana-rot'], cl: ['alb-tirana-blau'] },
  },
  2009: {
    t1: ['alb-tirana-blau', 'alb-kavaja', 'alb-tirana-weiss-blau', 'alb-lac', 'alb-vlora', 'alb-shkodra', 'alb-peqin', 'alb-durres', 'alb-kruja', 'alb-korca', 'alb-fier', 'alb-erseka'],
    euro: { cl: ['alb-tirana-weiss-blau'], el: ['alb-tirana-blau', 'alb-vlora', 'alb-shkodra'] },
  },
  2010: {
    t1: ['alb-korca', 'alb-vlora', 'alb-shkodra', 'alb-lac', 'alb-tirana-weiss-blau', 'alb-ballsh', 'alb-kruja', 'alb-durres', 'alb-peqin', 'alb-tirana-blau', 'alb-kavaja', 'alb-elbasan'],
    euro: { cl: ['alb-tirana-blau'], el: ['alb-lac', 'alb-tirana-weiss-blau', 'alb-kavaja'] },
  },
  2011: {
    t1: ['alb-korca', 'alb-durres', 'alb-tirana-weiss-blau', 'alb-vlora', 'alb-lac', 'alb-kruja', 'alb-ballsh', 'alb-shkodra', 'alb-peqin', 'alb-berat', 'alb-kamza', 'alb-pogradec', 'alb-fier', 'alb-tirana-blau'],
    euro: { cl: ['alb-korca'], el: ['alb-tirana-weiss-blau', 'alb-vlora', 'alb-shkodra'] },
  },
  2012: {
    t1: ['alb-korca', 'alb-kukes', 'alb-durres', 'alb-vlora', 'alb-tirana-weiss-blau', 'alb-shkodra', 'alb-lac', 'alb-kruja', 'alb-ballsh', 'alb-kavaja', 'alb-peqin', 'alb-berat', 'alb-gjirokastra', 'alb-fier'],
    euro: { cl: ['alb-korca'], el: ['alb-durres', 'alb-vlora', 'alb-tirana-weiss-blau'] },
  },
  2013: {
    t1: ['alb-korca', 'alb-kukes', 'alb-lac', 'alb-durres', 'alb-tirana-rot', 'alb-vlora', 'alb-tirana-weiss-blau', 'alb-shkodra', 'alb-kavaja', 'alb-kruja', 'alb-lushnja', 'alb-ballsh'],
    euro: { cl: ['alb-korca'], el: ['alb-korca', 'alb-kukes', 'alb-lac', 'alb-durres'] },
  },
  2014: {
    t1: ['alb-korca', 'alb-kukes', 'alb-tirana-rot', 'alb-tirana-weiss-blau', 'alb-lac', 'alb-vlora', 'alb-shkodra', 'alb-durres', 'alb-fier', 'alb-elbasan'],
    euro: { cl: ['alb-korca'], el: ['alb-kukes', 'alb-lac', 'alb-vlora'] },
  },
  2015: {
    t1: ['alb-korca', 'alb-tirana-rot', 'alb-kukes', 'alb-durres', 'alb-tirana-weiss-blau', 'alb-shkodra', 'alb-vlora', 'alb-lac', 'alb-ballsh', 'alb-puka'],
    euro: { cl: ['alb-korca'], el: ['alb-korca', 'alb-tirana-rot', 'alb-kukes', 'alb-lac'] },
  },
  2016: {
    t1: ['alb-kukes', 'alb-tirana-rot', 'alb-korca', 'alb-vlora', 'alb-gjirokastra', 'alb-durres', 'alb-lac', 'alb-shkodra', 'alb-tirana-weiss-blau', 'alb-peshkopia'],
    euro: { cl: ['alb-tirana-rot'], el: ['alb-kukes', 'alb-tirana-rot', 'alb-durres'] },
  },
  2017: {
    t1: ['alb-korca', 'alb-kukes', 'alb-gjirokastra', 'alb-lac', 'alb-tirana-rot', 'alb-vlora', 'alb-kamza', 'alb-durres', 'alb-shkodra', 'alb-lushnja'],
    euro: { cl: ['alb-kukes'], el: ['alb-korca', 'alb-tirana-rot', 'alb-tirana-weiss-blau'] },
  },
  2018: {
    t1: ['alb-tirana-rot', 'alb-kukes', 'alb-durres', 'alb-korca', 'alb-vlora', 'alb-lac', 'alb-tirana-weiss-blau', 'alb-gjirokastra', 'alb-kruja', 'alb-kamza'],
    euro: { cl: ['alb-kukes'], el: ['alb-tirana-rot', 'alb-kukes', 'alb-lac', 'alb-gjirokastra'] },
  },
  2019: {
    t1: ['alb-tirana-weiss-blau', 'alb-kukes', 'alb-lac', 'alb-korca', 'alb-durres', 'alb-tirana-rot', 'alb-ballsh', 'alb-shkodra', 'alb-vlora', 'alb-gjirokastra'],
    euro: { cl: ['alb-tirana-rot'], el: ['alb-kukes', 'alb-lac', 'alb-durres', 'alb-tirana-rot'] },
  },
  2020: {
    t1: ['alb-durres', 'alb-shkodra', 'alb-tirana-rot', 'alb-lac', 'alb-tirana-weiss-blau', 'alb-kukes', 'alb-korca', 'alb-kruja', 'alb-ballsh', 'alb-fier'],
    euro: { cl: ['alb-tirana-weiss-blau'], el: ['alb-durres', 'alb-lac', 'alb-tirana-weiss-blau', 'alb-kukes'] },
  },
  2021: {
    t1: ['alb-tirana-weiss-blau', 'alb-lac', 'alb-tirana-rot', 'alb-kukes', 'alb-shkodra', 'alb-durres', 'alb-kruja', 'alb-rrogozhina', 'alb-tirana-blau', 'alb-korca'],
    euro: { cl: ['alb-durres'], ecl: ['alb-lac', 'alb-tirana-rot', 'alb-shkodra', 'alb-durres'] },
  },
  2022: {
    t1: ['alb-tirana-rot', 'alb-tirana-weiss-blau', 'alb-rrogozhina', 'alb-shkodra', 'alb-lac', 'alb-durres', 'alb-kukes', 'alb-shijak', 'alb-ballsh', 'alb-kruja'],
    euro: { cl: ['alb-tirana-weiss-blau'], ecl: ['alb-tirana-rot', 'alb-tirana-weiss-blau', 'alb-shkodra', 'alb-lac'] },
  },
  2023: {
    t1: ['alb-rrogozhina', 'alb-tirana-rot', 'alb-shkodra', 'alb-korca', 'alb-tirana-weiss-blau', 'alb-durres', 'alb-tirana-blau', 'alb-lac', 'alb-shijak', 'alb-kukes'],
    euro: { cl: ['alb-tirana-rot'], ecl: ['alb-rrogozhina', 'alb-tirana-rot', 'alb-shkodra', 'alb-tirana-weiss-blau'] },
    note: 'Meister über eine Endrunde der ersten Vier ermittelt; Reihenfolge nach der Grundrunde',
  },
  2024: {
    t1: ['alb-rrogozhina', 'alb-shkodra', 'alb-tirana-rot', 'alb-tirana-blau', 'alb-elbasan', 'alb-durres', 'alb-ballsh', 'alb-tirana-weiss-blau', 'alb-korca', 'alb-lac'],
    euro: { cl: ['alb-rrogozhina'], ecl: ['alb-rrogozhina', 'alb-shkodra', 'alb-tirana-rot', 'alb-tirana-weiss-blau'] },
    note: 'Meister über eine Endrunde der ersten Vier ermittelt; Reihenfolge nach der Grundrunde',
  },
  2025: {
    t1: ['alb-rrogozhina', 'alb-shkodra', 'alb-tirana-rot', 'alb-tirana-blau', 'alb-elbasan', 'alb-durres', 'alb-ballsh', 'alb-tirana-weiss-blau', 'alb-vlora', 'alb-vora'],
    euro: { cl: ['alb-rrogozhina'], ecl: ['alb-rrogozhina', 'alb-shkodra', 'alb-tirana-rot', 'alb-tirana-blau'] },
    note: 'Laufende Saison: Zusammensetzung zu Saisonbeginn (Vorjahresplatz, Aufsteiger hinten) – Aufsteiger aus Wissen, ungeprüft',
  },
};
