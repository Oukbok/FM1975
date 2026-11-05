// =============================================================================
// Weltdaten sui: Nationalliga A / Super League je Saison (Schlüssel = Startjahr, 1975 = 1975/76).
// t1 in Reihenfolge der Abschlusstabelle; cup/cupFinalist = Landespokal; euro = Europapokal-Teilnehmer.
// Quellen und Unsicherheiten: docs/recherche/weltvereine_sui.md.
// =============================================================================
import type { SeasonRow } from '../types';

export const SEASONS_SUI: Record<number, SeasonRow> = {
  1975: {
    t1: ['sui-zuerich', 'sui-genf-granat', 'sui-zuerich-blau-weiss', 'sui-basel', 'sui-bern', 'sui-st-gallen', 'sui-lausanne', 'sui-neuenburg', 'sui-chene-bourg', 'sui-sitten', 'sui-biel', 'sui-winterthur', 'sui-lugano', 'sui-la-chaux-de-fonds'],
    cup: 'sui-zuerich', cupFinalist: 'sui-genf-granat',
    euro: { ec: ['sui-zuerich'], cwc: ['sui-basel'], uefa: ['sui-zuerich-blau-weiss', 'sui-bern'] },
  },
  1976: {
    t1: ['sui-basel', 'sui-genf-granat', 'sui-zuerich', 'sui-lausanne', 'sui-chene-bourg', 'sui-zuerich-blau-weiss', 'sui-neuenburg', 'sui-sitten', 'sui-bern', 'sui-st-gallen', 'sui-winterthur', 'sui-bellinzona'],
    cup: 'sui-bern', cupFinalist: 'sui-st-gallen',
    euro: { ec: ['sui-zuerich'], cwc: ['sui-genf-granat'], uefa: ['sui-basel', 'sui-zuerich-blau-weiss'] },
  },
  1977: {
    t1: ['sui-zuerich-blau-weiss', 'sui-genf-granat', 'sui-zuerich', 'sui-basel', 'sui-bern', 'sui-lausanne', 'sui-chene-bourg', 'sui-st-gallen', 'sui-neuenburg', 'sui-sitten', 'sui-carouge', 'sui-zuerich-wiedikon'],
    cup: 'sui-genf-granat', cupFinalist: 'sui-zuerich-blau-weiss',
    euro: { ec: ['sui-basel'], cwc: ['sui-bern'], uefa: ['sui-zuerich-blau-weiss', 'sui-genf-granat', 'sui-zuerich'] },
  },
  1978: {
    t1: ['sui-genf-granat', 'sui-basel', 'sui-zuerich-blau-weiss', 'sui-zuerich', 'sui-st-gallen', 'sui-sitten', 'sui-bern', 'sui-chene-bourg', 'sui-lausanne', 'sui-chiasso', 'sui-neuenburg', 'sui-basel-kleinbasel'],
    cup: 'sui-genf-granat', cupFinalist: 'sui-bern',
    euro: { ec: ['sui-zuerich-blau-weiss'], cwc: ['sui-genf-granat'], uefa: ['sui-basel', 'sui-lausanne'] },
  },
  1979: {
    t1: ['sui-basel', 'sui-zuerich-blau-weiss', 'sui-zuerich', 'sui-genf-granat', 'sui-luzern', 'sui-sitten', 'sui-st-gallen', 'sui-chiasso', 'sui-neuenburg', 'sui-bern', 'sui-la-chaux-de-fonds', 'sui-chene-bourg', 'sui-lausanne', 'sui-lugano'],
    cup: 'sui-sitten', cupFinalist: 'sui-bern',
    euro: { ec: ['sui-genf-granat'], cwc: ['sui-bern'], uefa: ['sui-zuerich-blau-weiss', 'sui-zuerich'] },
  },
  1980: {
    t1: ['sui-zuerich', 'sui-zuerich-blau-weiss', 'sui-neuenburg', 'sui-bern', 'sui-lausanne', 'sui-basel', 'sui-genf-granat', 'sui-sitten', 'sui-luzern', 'sui-st-gallen', 'sui-basel-kleinbasel', 'sui-bellinzona', 'sui-chiasso', 'sui-chene-bourg'],
    cup: 'sui-lausanne', cupFinalist: 'sui-zuerich',
    euro: { ec: ['sui-basel'], cwc: ['sui-sitten'], uefa: ['sui-zuerich-blau-weiss', 'sui-genf-granat'] },
  },
  1981: {
    t1: ['sui-zuerich-blau-weiss', 'sui-genf-granat', 'sui-zuerich', 'sui-neuenburg', 'sui-bern', 'sui-sitten', 'sui-aarau', 'sui-basel', 'sui-st-gallen', 'sui-luzern', 'sui-vevey', 'sui-bellinzona', 'sui-lausanne', 'sui-bulle', 'sui-basel-kleinbasel', 'sui-chiasso'],
    cup: 'sui-sitten', cupFinalist: 'sui-basel',
    euro: { ec: ['sui-zuerich'], cwc: ['sui-lausanne'], uefa: ['sui-zuerich-blau-weiss', 'sui-neuenburg'] },
  },
  1982: {
    t1: ['sui-zuerich-blau-weiss', 'sui-genf-granat', 'sui-st-gallen', 'sui-lausanne', 'sui-zuerich', 'sui-neuenburg', 'sui-sitten', 'sui-luzern', 'sui-bern', 'sui-wettingen', 'sui-basel', 'sui-vevey', 'sui-bellinzona', 'sui-aarau', 'sui-bulle', 'sui-winterthur'],
    cup: 'sui-zuerich-blau-weiss', cupFinalist: 'sui-genf-granat',
    euro: { ec: ['sui-zuerich-blau-weiss'], cwc: ['sui-sitten'], uefa: ['sui-genf-granat', 'sui-zuerich'] },
  },
  1983: {
    t1: ['sui-zuerich-blau-weiss', 'sui-genf-granat', 'sui-sitten', 'sui-neuenburg', 'sui-st-gallen', 'sui-aarau', 'sui-lausanne', 'sui-basel', 'sui-wettingen', 'sui-bern', 'sui-zuerich', 'sui-la-chaux-de-fonds', 'sui-luzern', 'sui-vevey', 'sui-bellinzona', 'sui-chiasso'],
    cup: 'sui-genf-granat', cupFinalist: 'sui-lausanne',
    euro: { ec: ['sui-zuerich-blau-weiss'], cwc: ['sui-genf-granat'], uefa: ['sui-st-gallen', 'sui-zuerich'] },
  },
  1984: {
    t1: ['sui-genf-granat', 'sui-bern', 'sui-neuenburg', 'sui-aarau', 'sui-zuerich', 'sui-lausanne', 'sui-zuerich-blau-weiss', 'sui-luzern', 'sui-st-gallen', 'sui-sitten', 'sui-basel', 'sui-wettingen', 'sui-la-chaux-de-fonds', 'sui-vevey', 'sui-zug', 'sui-winterthur'],
    cup: 'sui-aarau', cupFinalist: 'sui-neuenburg',
    euro: { ec: ['sui-zuerich-blau-weiss'], cwc: ['sui-genf-granat'], uefa: ['sui-neuenburg', 'sui-sitten'] },
  },
  1985: {
    t1: ['sui-bern', 'sui-genf-granat', 'sui-neuenburg', 'sui-aarau', 'sui-zuerich', 'sui-lausanne', 'sui-zuerich-blau-weiss', 'sui-luzern', 'sui-st-gallen', 'sui-sitten', 'sui-basel', 'sui-wettingen', 'sui-la-chaux-de-fonds', 'sui-vevey', 'sui-zug', 'sui-winterthur'],
    cup: 'sui-sitten', cupFinalist: 'sui-genf-granat',
    euro: { ec: ['sui-genf-granat'], cwc: ['sui-aarau'], uefa: ['sui-neuenburg', 'sui-st-gallen'] },
  },
  1986: {
    t1: ['sui-neuenburg', 'sui-zuerich-blau-weiss', 'sui-luzern', 'sui-zuerich', 'sui-sitten', 'sui-bern', 'sui-genf-granat', 'sui-lausanne', 'sui-aarau', 'sui-basel', 'sui-wettingen', 'sui-st-gallen', 'sui-la-chaux-de-fonds', 'sui-vevey', 'sui-grenchen', 'sui-baden'],
    cup: 'sui-bern', cupFinalist: 'sui-genf-granat',
    euro: { ec: ['sui-bern'], cwc: ['sui-sitten'], uefa: ['sui-neuenburg', 'sui-luzern'] },
  },
  1987: {
    t1: ['sui-neuenburg', 'sui-luzern', 'sui-zuerich-blau-weiss', 'sui-bern', 'sui-sitten', 'sui-genf-granat', 'sui-bellinzona', 'sui-aarau', 'sui-st-gallen', 'sui-lausanne', 'sui-basel', 'sui-zuerich'],
    cup: 'sui-zuerich-blau-weiss', cupFinalist: 'sui-schaffhausen',
    euro: { ec: ['sui-neuenburg'], cwc: ['sui-bern'], uefa: ['sui-zuerich-blau-weiss', 'sui-sitten'] },
  },
  1988: {
    t1: ['sui-luzern', 'sui-zuerich-blau-weiss', 'sui-bellinzona', 'sui-sitten', 'sui-bern', 'sui-wettingen', 'sui-genf-granat', 'sui-neuenburg', 'sui-aarau', 'sui-lausanne', 'sui-st-gallen', 'sui-lugano'],
    cup: 'sui-zuerich-blau-weiss', cupFinalist: 'sui-aarau',
    euro: { ec: ['sui-neuenburg'], cwc: ['sui-zuerich-blau-weiss'], uefa: ['sui-genf-granat', 'sui-aarau'] },
  },
  1989: {
    t1: ['sui-zuerich-blau-weiss', 'sui-lausanne', 'sui-neuenburg', 'sui-luzern', 'sui-lugano', 'sui-sitten', 'sui-bern', 'sui-st-gallen', 'sui-genf-granat', 'sui-wettingen', 'sui-aarau', 'sui-bellinzona'],
    cup: 'sui-zuerich-blau-weiss', cupFinalist: 'sui-neuenburg',
    euro: { ec: ['sui-luzern'], cwc: ['sui-zuerich-blau-weiss'], uefa: ['sui-sitten', 'sui-wettingen'] },
  },
  1990: {
    t1: ['sui-zuerich-blau-weiss', 'sui-sitten', 'sui-lugano', 'sui-neuenburg', 'sui-lausanne', 'sui-genf-granat', 'sui-luzern', 'sui-bern', 'sui-st-gallen', 'sui-aarau', 'sui-zuerich', 'sui-wettingen'],
    cup: 'sui-sitten', cupFinalist: 'sui-bern',
    euro: { ec: ['sui-zuerich-blau-weiss'], cwc: ['sui-neuenburg'], uefa: ['sui-lausanne', 'sui-luzern'] },
  },
  1991: {
    t1: ['sui-sitten', 'sui-neuenburg', 'sui-zuerich-blau-weiss', 'sui-bern', 'sui-genf-granat', 'sui-lausanne', 'sui-zuerich', 'sui-st-gallen', 'sui-luzern', 'sui-lugano', 'sui-aarau', 'sui-wettingen'],
    cup: 'sui-luzern', cupFinalist: 'sui-lugano',
    euro: { ec: ['sui-zuerich-blau-weiss'], cwc: ['sui-sitten'], uefa: ['sui-neuenburg', 'sui-lausanne'] },
  },
  1992: {
    t1: ['sui-aarau', 'sui-bern', 'sui-lugano', 'sui-genf-granat', 'sui-zuerich', 'sui-neuenburg', 'sui-sitten', 'sui-lausanne', 'sui-zuerich-blau-weiss', 'sui-st-gallen', 'sui-chiasso', 'sui-bulle'],
    cup: 'sui-lugano', cupFinalist: 'sui-zuerich-blau-weiss',
    euro: { cwc: ['sui-luzern'], uefa: ['sui-neuenburg', 'sui-zuerich-blau-weiss'], cl: ['sui-sitten'] },
  },
  1993: {
    t1: ['sui-genf-granat', 'sui-zuerich-blau-weiss', 'sui-sitten', 'sui-aarau', 'sui-lugano', 'sui-bern', 'sui-lausanne', 'sui-luzern', 'sui-zuerich', 'sui-neuenburg', 'sui-yverdon', 'sui-kriens'],
    cup: 'sui-zuerich-blau-weiss', cupFinalist: 'sui-schaffhausen',
    euro: { cwc: ['sui-lugano'], uefa: ['sui-genf-granat', 'sui-bern'], cl: ['sui-aarau'] },
  },
  1994: {
    t1: ['sui-zuerich-blau-weiss', 'sui-lugano', 'sui-neuenburg', 'sui-aarau', 'sui-luzern', 'sui-basel', 'sui-sitten', 'sui-lausanne', 'sui-zuerich', 'sui-genf-granat', 'sui-st-gallen', 'sui-bern'],
    cup: 'sui-sitten', cupFinalist: 'sui-zuerich-blau-weiss',
    euro: { cwc: ['sui-zuerich-blau-weiss'], uefa: ['sui-aarau', 'sui-sitten'], cl: ['sui-genf-granat'] },
  },
  1995: {
    t1: ['sui-zuerich-blau-weiss', 'sui-sitten', 'sui-neuenburg', 'sui-aarau', 'sui-luzern', 'sui-basel', 'sui-genf-granat', 'sui-st-gallen', 'sui-lausanne', 'sui-lugano', 'sui-zuerich', 'sui-bern'],
    cup: 'sui-sitten', cupFinalist: 'sui-genf-granat',
    euro: { cwc: ['sui-sitten'], uefa: ['sui-neuenburg', 'sui-lugano'], cl: ['sui-zuerich-blau-weiss'] },
  },
  1996: {
    t1: ['sui-sitten', 'sui-neuenburg', 'sui-zuerich-blau-weiss', 'sui-lausanne', 'sui-aarau', 'sui-st-gallen', 'sui-zuerich', 'sui-basel', 'sui-genf-granat', 'sui-luzern', 'sui-lugano', 'sui-bern'],
    cup: 'sui-sitten', cupFinalist: 'sui-luzern',
    euro: { cwc: ['sui-sitten'], uefa: ['sui-neuenburg', 'sui-aarau'], cl: ['sui-zuerich-blau-weiss'] },
  },
  1997: {
    t1: ['sui-zuerich-blau-weiss', 'sui-genf-granat', 'sui-lausanne', 'sui-zuerich', 'sui-sitten', 'sui-st-gallen', 'sui-aarau', 'sui-luzern', 'sui-neuenburg', 'sui-kriens', 'sui-basel', 'sui-carouge'],
    cup: 'sui-lausanne', cupFinalist: 'sui-st-gallen',
    euro: { cwc: ['sui-luzern'], uefa: ['sui-zuerich-blau-weiss', 'sui-sitten', 'sui-neuenburg'], cl: ['sui-sitten'] },
  },
  1998: {
    t1: ['sui-zuerich-blau-weiss', 'sui-genf-granat', 'sui-lausanne', 'sui-zuerich', 'sui-basel', 'sui-luzern', 'sui-neuenburg', 'sui-st-gallen', 'sui-sitten', 'sui-lugano', 'sui-bern', 'sui-aarau'],
    cup: 'sui-lausanne', cupFinalist: 'sui-zuerich-blau-weiss',
    euro: { cwc: ['sui-lausanne'], uefa: ['sui-zuerich-blau-weiss', 'sui-genf-granat', 'sui-zuerich'], cl: ['sui-zuerich-blau-weiss'] },
  },
  1999: {
    t1: ['sui-st-gallen', 'sui-lausanne', 'sui-basel', 'sui-zuerich-blau-weiss', 'sui-genf-granat', 'sui-luzern', 'sui-neuenburg', 'sui-yverdon', 'sui-zuerich', 'sui-aarau', 'sui-lugano', 'sui-delsberg'],
    cup: 'sui-zuerich', cupFinalist: 'sui-lausanne',
    euro: { uefa: ['sui-lausanne', 'sui-zuerich-blau-weiss', 'sui-genf-granat', 'sui-zuerich'], cl: ['sui-genf-granat'] },
  },
  2000: {
    t1: ['sui-zuerich-blau-weiss', 'sui-lugano', 'sui-st-gallen', 'sui-genf-granat', 'sui-basel', 'sui-lausanne', 'sui-sitten', 'sui-zuerich', 'sui-aarau', 'sui-yverdon', 'sui-neuenburg', 'sui-luzern'],
    cup: 'sui-genf-granat', cupFinalist: 'sui-bern',
    euro: { uefa: ['sui-st-gallen', 'sui-basel', 'sui-lausanne', 'sui-zuerich'], cl: ['sui-st-gallen'] },
  },
  2001: {
    t1: ['sui-basel', 'sui-zuerich-blau-weiss', 'sui-lugano', 'sui-genf-granat', 'sui-zuerich', 'sui-st-gallen', 'sui-bern', 'sui-sitten', 'sui-aarau', 'sui-neuenburg', 'sui-lausanne', 'sui-luzern'],
    cup: 'sui-basel', cupFinalist: 'sui-zuerich-blau-weiss',
    euro: { uefa: ['sui-zuerich-blau-weiss', 'sui-genf-granat', 'sui-st-gallen'], cl: ['sui-zuerich-blau-weiss', 'sui-lugano'] },
  },
  2002: {
    t1: ['sui-zuerich-blau-weiss', 'sui-basel', 'sui-neuenburg', 'sui-bern', 'sui-zuerich', 'sui-genf-granat', 'sui-thun', 'sui-wil', 'sui-luzern', 'sui-st-gallen', 'sui-delsberg', 'sui-aarau'],
    cup: 'sui-basel', cupFinalist: 'sui-neuenburg',
    euro: { uefa: ['sui-zuerich-blau-weiss', 'sui-genf-granat', 'sui-lugano'], cl: ['sui-basel'] },
  },
  2003: {
    t1: ['sui-basel', 'sui-bern', 'sui-genf-granat', 'sui-zuerich', 'sui-st-gallen', 'sui-thun', 'sui-zuerich-blau-weiss', 'sui-aarau', 'sui-neuenburg', 'sui-wil'],
    cup: 'sui-wil', cupFinalist: 'sui-zuerich-blau-weiss',
    euro: { uefa: ['sui-basel', 'sui-bern', 'sui-zuerich-blau-weiss', 'sui-neuenburg'], cl: ['sui-zuerich-blau-weiss'] },
  },
  2004: {
    t1: ['sui-basel', 'sui-thun', 'sui-zuerich-blau-weiss', 'sui-bern', 'sui-zuerich', 'sui-neuenburg', 'sui-st-gallen', 'sui-aarau', 'sui-schaffhausen', 'sui-genf-granat'],
    cup: 'sui-zuerich', cupFinalist: 'sui-luzern',
    euro: { uefa: ['sui-basel', 'sui-genf-granat', 'sui-wil'], cl: ['sui-basel', 'sui-bern'] },
    note: 'Genf Granat im Februar 2005 Konkurs, Spiele annulliert (Tabellenletzter)',
  },
  2005: {
    t1: ['sui-zuerich', 'sui-basel', 'sui-bern', 'sui-zuerich-blau-weiss', 'sui-thun', 'sui-st-gallen', 'sui-aarau', 'sui-schaffhausen', 'sui-neuenburg', 'sui-yverdon'],
    cup: 'sui-sitten', cupFinalist: 'sui-bern',
    euro: { uefa: ['sui-zuerich', 'sui-basel', 'sui-zuerich-blau-weiss', 'sui-thun'], cl: ['sui-basel', 'sui-thun'] },
  },
  2006: {
    t1: ['sui-zuerich', 'sui-basel', 'sui-sitten', 'sui-bern', 'sui-st-gallen', 'sui-zuerich-blau-weiss', 'sui-thun', 'sui-luzern', 'sui-aarau', 'sui-schaffhausen'],
    cup: 'sui-basel', cupFinalist: 'sui-luzern',
    euro: { uefa: ['sui-basel', 'sui-sitten', 'sui-bern', 'sui-zuerich-blau-weiss'], cl: ['sui-zuerich'] },
  },
  2007: {
    t1: ['sui-basel', 'sui-bern', 'sui-zuerich', 'sui-zuerich-blau-weiss', 'sui-aarau', 'sui-luzern', 'sui-sitten', 'sui-neuenburg', 'sui-st-gallen', 'sui-thun'],
    cup: 'sui-basel', cupFinalist: 'sui-bellinzona',
    euro: { uefa: ['sui-basel', 'sui-bern', 'sui-zuerich', 'sui-sitten'], cl: ['sui-zuerich'] },
  },
  2008: {
    t1: ['sui-zuerich', 'sui-bern', 'sui-basel', 'sui-zuerich-blau-weiss', 'sui-aarau', 'sui-bellinzona', 'sui-neuenburg', 'sui-sitten', 'sui-luzern', 'sui-vaduz'],
    cup: 'sui-sitten', cupFinalist: 'sui-bern',
    euro: { uefa: ['sui-zuerich', 'sui-bern', 'sui-zuerich-blau-weiss', 'sui-bellinzona'], cl: ['sui-basel'] },
  },
  2009: {
    t1: ['sui-basel', 'sui-bern', 'sui-zuerich-blau-weiss', 'sui-luzern', 'sui-sitten', 'sui-st-gallen', 'sui-zuerich', 'sui-neuenburg', 'sui-bellinzona', 'sui-aarau'],
    cup: 'sui-basel', cupFinalist: 'sui-lausanne',
    euro: { cl: ['sui-zuerich'], el: ['sui-basel', 'sui-bern', 'sui-sitten'] },
  },
  2010: {
    t1: ['sui-basel', 'sui-zuerich', 'sui-bern', 'sui-sitten', 'sui-thun', 'sui-luzern', 'sui-zuerich-blau-weiss', 'sui-neuenburg', 'sui-bellinzona', 'sui-st-gallen'],
    cup: 'sui-sitten', cupFinalist: 'sui-neuenburg',
    euro: { cl: ['sui-basel', 'sui-bern'], el: ['sui-basel', 'sui-bern', 'sui-luzern', 'sui-zuerich-blau-weiss', 'sui-lausanne'] },
  },
  2011: {
    t1: ['sui-basel', 'sui-luzern', 'sui-bern', 'sui-genf-granat', 'sui-thun', 'sui-zuerich', 'sui-lausanne', 'sui-zuerich-blau-weiss', 'sui-sitten', 'sui-neuenburg'],
    cup: 'sui-basel', cupFinalist: 'sui-luzern',
    euro: { cl: ['sui-basel', 'sui-zuerich'], el: ['sui-bern', 'sui-thun', 'sui-zuerich', 'sui-sitten'] },
    note: 'Sitten 36 Punkte Abzug; Neuenburg im Januar 2012 ausgeschlossen',
  },
  2012: {
    t1: ['sui-basel', 'sui-zuerich-blau-weiss', 'sui-st-gallen', 'sui-zuerich', 'sui-thun', 'sui-sitten', 'sui-bern', 'sui-luzern', 'sui-lausanne', 'sui-genf-granat'],
    cup: 'sui-zuerich-blau-weiss', cupFinalist: 'sui-basel',
    euro: { cl: ['sui-basel'], el: ['sui-basel', 'sui-bern', 'sui-luzern', 'sui-genf-granat'] },
  },
  2013: {
    t1: ['sui-basel', 'sui-zuerich-blau-weiss', 'sui-bern', 'sui-luzern', 'sui-zuerich', 'sui-thun', 'sui-st-gallen', 'sui-sitten', 'sui-aarau', 'sui-lausanne'],
    cup: 'sui-zuerich', cupFinalist: 'sui-basel',
    euro: { cl: ['sui-basel', 'sui-zuerich-blau-weiss'], el: ['sui-basel', 'sui-zuerich-blau-weiss', 'sui-zuerich', 'sui-thun', 'sui-st-gallen'] },
  },
  2014: {
    t1: ['sui-basel', 'sui-bern', 'sui-zuerich', 'sui-thun', 'sui-luzern', 'sui-st-gallen', 'sui-sitten', 'sui-zuerich-blau-weiss', 'sui-vaduz', 'sui-aarau'],
    cup: 'sui-sitten', cupFinalist: 'sui-basel',
    euro: { cl: ['sui-basel', 'sui-zuerich-blau-weiss'], el: ['sui-bern', 'sui-zuerich', 'sui-luzern', 'sui-zuerich-blau-weiss'] },
  },
  2015: {
    t1: ['sui-basel', 'sui-bern', 'sui-luzern', 'sui-zuerich-blau-weiss', 'sui-sitten', 'sui-thun', 'sui-st-gallen', 'sui-vaduz', 'sui-lugano', 'sui-zuerich'],
    cup: 'sui-zuerich', cupFinalist: 'sui-lugano',
    euro: { cl: ['sui-basel', 'sui-bern'], el: ['sui-basel', 'sui-bern', 'sui-sitten', 'sui-thun', 'sui-zuerich'] },
  },
  2016: {
    t1: ['sui-basel', 'sui-bern', 'sui-lugano', 'sui-sitten', 'sui-luzern', 'sui-thun', 'sui-st-gallen', 'sui-zuerich-blau-weiss', 'sui-lausanne', 'sui-vaduz'],
    cup: 'sui-basel', cupFinalist: 'sui-sitten',
    euro: { cl: ['sui-basel', 'sui-bern'], el: ['sui-bern', 'sui-luzern', 'sui-zuerich-blau-weiss', 'sui-zuerich'] },
  },
  2017: {
    t1: ['sui-bern', 'sui-basel', 'sui-luzern', 'sui-zuerich', 'sui-st-gallen', 'sui-sitten', 'sui-thun', 'sui-lugano', 'sui-zuerich-blau-weiss', 'sui-lausanne'],
    cup: 'sui-zuerich', cupFinalist: 'sui-bern',
    euro: { cl: ['sui-bern', 'sui-basel'], el: ['sui-bern', 'sui-luzern', 'sui-sitten', 'sui-lugano'] },
  },
  2018: {
    t1: ['sui-bern', 'sui-basel', 'sui-lugano', 'sui-thun', 'sui-luzern', 'sui-st-gallen', 'sui-zuerich', 'sui-sitten', 'sui-neuenburg', 'sui-zuerich-blau-weiss'],
    cup: 'sui-basel', cupFinalist: 'sui-thun',
    euro: { cl: ['sui-bern', 'sui-basel'], el: ['sui-basel', 'sui-luzern', 'sui-st-gallen', 'sui-zuerich'] },
  },
  2019: {
    t1: ['sui-bern', 'sui-st-gallen', 'sui-basel', 'sui-genf-granat', 'sui-lugano', 'sui-luzern', 'sui-zuerich', 'sui-sitten', 'sui-thun', 'sui-neuenburg'],
    cup: 'sui-bern', cupFinalist: 'sui-basel',
    euro: { cl: ['sui-bern', 'sui-basel'], el: ['sui-bern', 'sui-basel', 'sui-lugano', 'sui-luzern', 'sui-thun'] },
  },
  2020: {
    t1: ['sui-bern', 'sui-basel', 'sui-genf-granat', 'sui-lugano', 'sui-luzern', 'sui-lausanne', 'sui-st-gallen', 'sui-zuerich', 'sui-sitten', 'sui-vaduz'],
    cup: 'sui-luzern', cupFinalist: 'sui-st-gallen',
    euro: { cl: ['sui-bern'], el: ['sui-bern', 'sui-basel', 'sui-genf-granat', 'sui-st-gallen'] },
  },
  2021: {
    t1: ['sui-zuerich', 'sui-basel', 'sui-bern', 'sui-lugano', 'sui-st-gallen', 'sui-genf-granat', 'sui-sitten', 'sui-zuerich-blau-weiss', 'sui-luzern', 'sui-lausanne'],
    cup: 'sui-lugano', cupFinalist: 'sui-st-gallen',
    euro: { cl: ['sui-bern'], ecl: ['sui-basel', 'sui-genf-granat', 'sui-luzern'] },
  },
  2022: {
    t1: ['sui-bern', 'sui-genf-granat', 'sui-lugano', 'sui-luzern', 'sui-basel', 'sui-st-gallen', 'sui-zuerich-blau-weiss', 'sui-zuerich', 'sui-winterthur', 'sui-sitten'],
    cup: 'sui-bern', cupFinalist: 'sui-lugano',
    euro: { cl: ['sui-zuerich'], el: ['sui-zuerich'], ecl: ['sui-bern', 'sui-lugano', 'sui-basel'] },
  },
  2023: {
    t1: ['sui-bern', 'sui-lugano', 'sui-genf-granat', 'sui-zuerich', 'sui-st-gallen', 'sui-winterthur', 'sui-luzern', 'sui-basel', 'sui-yverdon', 'sui-lausanne', 'sui-zuerich-blau-weiss', 'sui-lausanne-ouchy'],
    cup: 'sui-genf-granat', cupFinalist: 'sui-lugano',
    euro: { cl: ['sui-bern', 'sui-genf-granat'], el: ['sui-bern', 'sui-lugano', 'sui-genf-granat'], ecl: ['sui-lugano', 'sui-genf-granat', 'sui-luzern', 'sui-basel'] },
  },
  2024: {
    t1: ['sui-basel', 'sui-genf-granat', 'sui-bern', 'sui-lugano', 'sui-lausanne', 'sui-luzern', 'sui-zuerich', 'sui-st-gallen', 'sui-sitten', 'sui-winterthur', 'sui-zuerich-blau-weiss', 'sui-yverdon'],
    cup: 'sui-basel', cupFinalist: 'sui-biel',
    euro: { cl: ['sui-bern', 'sui-lugano'], el: ['sui-genf-granat', 'sui-lugano'], ecl: ['sui-genf-granat', 'sui-lugano', 'sui-zuerich', 'sui-st-gallen'] },
  },
  2025: {
    t1: ['sui-basel', 'sui-genf-granat', 'sui-bern', 'sui-lugano', 'sui-lausanne', 'sui-luzern', 'sui-zuerich', 'sui-st-gallen', 'sui-sitten', 'sui-winterthur', 'sui-zuerich-blau-weiss', 'sui-thun'],
    euro: { cl: ['sui-basel', 'sui-genf-granat'], el: ['sui-genf-granat', 'sui-bern', 'sui-lugano'], ecl: ['sui-genf-granat', 'sui-lugano', 'sui-lausanne'] },
    note: 'Laufende Saison: Zusammensetzung zu Saisonbeginn (Reihenfolge = Vorjahresplatz, Aufsteiger hinten)',
  },
};
