// =============================================================================
// Weltdaten mlt: Premier League je Saison (Schlüssel = Startjahr, 1975 = 1975/76).
// t1 in Reihenfolge der Abschlusstabelle; cup/cupFinalist = Landespokal; euro = Europapokal-Teilnehmer.
// Quellen und Unsicherheiten: docs/recherche/weltvereine_mlt.md.
// =============================================================================
import type { SeasonRow } from '../types';

export const SEASONS_MLT: Record<number, SeasonRow> = {
  1975: {
    t1: ['mlt-sliema', 'mlt-paola', 'mlt-floriana', 'mlt-valletta', 'mlt-hamrun', 'mlt-marsa', 'mlt-zurrieq', 'mlt-gzira', 'mlt-cospicua', 'mlt-msida'],
    euro: { ec: ['mlt-floriana'], uefa: ['mlt-sliema'] },
    note: 'Tabelle aus Wissen, ungeprüft (nur Meister und Europapokalplatz gegen die Europapokal-Teilnahmen geprüft)',
  },
  1976: {
    t1: ['mlt-floriana', 'mlt-sliema', 'mlt-valletta', 'mlt-paola', 'mlt-hamrun', 'mlt-marsa', 'mlt-zurrieq', 'mlt-gzira', 'mlt-cospicua', 'mlt-msida'],
    euro: { ec: ['mlt-sliema'], uefa: ['mlt-paola'] },
    note: 'Tabelle aus Wissen, ungeprüft (nur Meister und Europapokalplatz gegen die Europapokal-Teilnahmen geprüft)',
  },
  1977: {
    t1: ['mlt-valletta', 'mlt-paola', 'mlt-sliema', 'mlt-floriana', 'mlt-hamrun', 'mlt-marsa', 'mlt-zurrieq', 'mlt-gzira', 'mlt-cospicua', 'mlt-msida'],
    euro: { ec: ['mlt-floriana'], uefa: ['mlt-sliema'] },
    note: 'Tabelle aus Wissen, ungeprüft (nur Meister und Europapokalplatz gegen die Europapokal-Teilnahmen geprüft)',
  },
  1978: {
    t1: ['mlt-paola', 'mlt-valletta', 'mlt-sliema', 'mlt-floriana', 'mlt-hamrun', 'mlt-marsa', 'mlt-zurrieq', 'mlt-gzira', 'mlt-cospicua', 'mlt-msida'],
    euro: { ec: ['mlt-valletta'], uefa: ['mlt-paola'] },
    note: 'Tabelle aus Wissen, ungeprüft (nur Meister und Europapokalplatz gegen die Europapokal-Teilnahmen geprüft)',
  },
  1979: {
    t1: ['mlt-valletta', 'mlt-sliema', 'mlt-floriana', 'mlt-paola', 'mlt-hamrun', 'mlt-marsa', 'mlt-zurrieq', 'mlt-gzira', 'mlt-cospicua', 'mlt-msida'],
    euro: { ec: ['mlt-paola'], uefa: ['mlt-valletta'] },
    note: 'Tabelle aus Wissen, ungeprüft (nur Meister und Europapokalplatz gegen die Europapokal-Teilnahmen geprüft)',
  },
  1980: {
    t1: ['mlt-paola', 'mlt-sliema', 'mlt-floriana', 'mlt-valletta', 'mlt-hamrun', 'mlt-marsa', 'mlt-zurrieq', 'mlt-gzira', 'mlt-cospicua', 'mlt-msida'],
    euro: { ec: ['mlt-valletta'], uefa: ['mlt-sliema'] },
    note: 'Tabelle aus Wissen, ungeprüft (nur Meister und Europapokalplatz gegen die Europapokal-Teilnahmen geprüft)',
  },
  1981: {
    t1: ['mlt-paola', 'mlt-zurrieq', 'mlt-sliema', 'mlt-floriana', 'mlt-valletta', 'mlt-hamrun', 'mlt-marsa', 'mlt-gzira', 'mlt-cospicua', 'mlt-msida'],
    euro: { ec: ['mlt-paola'], uefa: ['mlt-sliema'] },
    note: 'Tabelle aus Wissen, ungeprüft (nur Meister und Europapokalplatz gegen die Europapokal-Teilnahmen geprüft)',
  },
  1982: {
    t1: ['mlt-hamrun', 'mlt-rabat', 'mlt-valletta', 'mlt-paola', 'mlt-sliema', 'mlt-floriana', 'mlt-zurrieq', 'mlt-zebbug', 'mlt-qormi', 'mlt-naxxar'],
    euro: { ec: ['mlt-paola'], uefa: ['mlt-zurrieq'] },
    note: 'Tabelle aus Wissen, ungeprüft (nur Meister und Europapokalplatz gegen die Europapokal-Teilnahmen geprüft)',
  },
  1983: {
    t1: ['mlt-valletta', 'mlt-rabat', 'mlt-hamrun', 'mlt-paola', 'mlt-sliema', 'mlt-floriana', 'mlt-zurrieq', 'mlt-zebbug', 'mlt-qormi', 'mlt-naxxar'],
    euro: { ec: ['mlt-hamrun'], uefa: ['mlt-rabat'] },
    note: 'Tabelle aus Wissen, ungeprüft (nur Meister und Europapokalplatz gegen die Europapokal-Teilnahmen geprüft)',
  },
  1984: {
    t1: ['mlt-rabat', 'mlt-hamrun', 'mlt-valletta', 'mlt-paola', 'mlt-sliema', 'mlt-floriana', 'mlt-zurrieq', 'mlt-zebbug', 'mlt-qormi', 'mlt-naxxar'],
    euro: { ec: ['mlt-valletta'], uefa: ['mlt-rabat'] },
    note: 'Tabelle aus Wissen, ungeprüft (nur Meister und Europapokalplatz gegen die Europapokal-Teilnahmen geprüft)',
  },
  1985: {
    t1: ['mlt-rabat', 'mlt-paola', 'mlt-hamrun', 'mlt-valletta', 'mlt-sliema', 'mlt-floriana', 'mlt-zurrieq', 'mlt-zebbug', 'mlt-qormi', 'mlt-naxxar'],
    euro: { ec: ['mlt-rabat'], uefa: ['mlt-hamrun'] },
    note: 'Tabelle aus Wissen, ungeprüft (nur Meister und Europapokalplatz gegen die Europapokal-Teilnahmen geprüft)',
  },
  1986: {
    t1: ['mlt-hamrun', 'mlt-valletta', 'mlt-rabat', 'mlt-paola', 'mlt-sliema', 'mlt-floriana', 'mlt-zurrieq', 'mlt-zebbug', 'mlt-qormi', 'mlt-naxxar'],
    euro: { ec: ['mlt-rabat'], uefa: ['mlt-paola'] },
    note: 'Tabelle aus Wissen, ungeprüft (nur Meister und Europapokalplatz gegen die Europapokal-Teilnahmen geprüft)',
  },
  1987: {
    t1: ['mlt-hamrun', 'mlt-sliema', 'mlt-rabat', 'mlt-valletta', 'mlt-paola', 'mlt-floriana', 'mlt-zurrieq', 'mlt-zebbug', 'mlt-qormi', 'mlt-naxxar'],
    euro: { ec: ['mlt-hamrun'], uefa: ['mlt-valletta'] },
    note: 'Tabelle aus Wissen, ungeprüft (nur Meister und Europapokalplatz gegen die Europapokal-Teilnahmen geprüft)',
  },
  1988: {
    t1: ['mlt-sliema', 'mlt-valletta', 'mlt-hamrun', 'mlt-rabat', 'mlt-paola', 'mlt-floriana', 'mlt-zurrieq', 'mlt-zebbug', 'mlt-qormi', 'mlt-naxxar'],
    euro: { ec: ['mlt-hamrun'], uefa: ['mlt-sliema'] },
    note: 'Tabelle aus Wissen, ungeprüft (nur Meister und Europapokalplatz gegen die Europapokal-Teilnahmen geprüft)',
  },
  1989: {
    t1: ['mlt-valletta', 'mlt-paola', 'mlt-hamrun', 'mlt-rabat', 'mlt-sliema', 'mlt-floriana', 'mlt-zurrieq', 'mlt-zebbug', 'mlt-qormi', 'mlt-naxxar'],
    euro: { ec: ['mlt-sliema'], uefa: ['mlt-valletta'] },
    note: 'Tabelle aus Wissen, ungeprüft (nur Meister und Europapokalplatz gegen die Europapokal-Teilnahmen geprüft)',
  },
  1990: {
    t1: ['mlt-hamrun', 'mlt-floriana', 'mlt-valletta', 'mlt-paola', 'mlt-sliema', 'mlt-birkirkara', 'mlt-rabat', 'mlt-naxxar', 'mlt-pieta', 'mlt-zurrieq'],
    euro: { ec: ['mlt-valletta'], uefa: ['mlt-paola'] },
    note: 'Tabelle aus Wissen, ungeprüft (nur Meister und Europapokalplatz gegen die Europapokal-Teilnahmen geprüft)',
  },
  1991: {
    t1: ['mlt-valletta', 'mlt-floriana', 'mlt-hamrun', 'mlt-paola', 'mlt-sliema', 'mlt-birkirkara', 'mlt-rabat', 'mlt-naxxar', 'mlt-pieta', 'mlt-zurrieq'],
    euro: { ec: ['mlt-hamrun'], uefa: ['mlt-floriana'] },
    note: 'Tabelle aus Wissen, ungeprüft (nur Meister und Europapokalplatz gegen die Europapokal-Teilnahmen geprüft)',
  },
  1992: {
    t1: ['mlt-floriana', 'mlt-valletta', 'mlt-hamrun', 'mlt-paola', 'mlt-sliema', 'mlt-birkirkara', 'mlt-rabat', 'mlt-naxxar', 'mlt-pieta', 'mlt-zurrieq'],
    euro: { uefa: ['mlt-floriana'], cl: ['mlt-valletta'] },
    note: 'Tabelle aus Wissen, ungeprüft (nur Meister und Europapokalplatz gegen die Europapokal-Teilnahmen geprüft)',
  },
  1993: {
    t1: ['mlt-paola', 'mlt-valletta', 'mlt-hamrun', 'mlt-floriana', 'mlt-sliema', 'mlt-birkirkara', 'mlt-rabat', 'mlt-naxxar', 'mlt-pieta', 'mlt-zurrieq'],
    euro: { uefa: ['mlt-valletta'], cl: ['mlt-floriana'] },
    note: 'Tabelle aus Wissen, ungeprüft (nur Meister und Europapokalplatz gegen die Europapokal-Teilnahmen geprüft)',
  },
  1994: {
    t1: ['mlt-paola', 'mlt-sliema', 'mlt-valletta', 'mlt-hamrun', 'mlt-floriana', 'mlt-birkirkara', 'mlt-rabat', 'mlt-naxxar', 'mlt-pieta', 'mlt-zurrieq'],
    euro: { uefa: ['mlt-paola', 'mlt-valletta'] },
    note: 'Tabelle aus Wissen, ungeprüft (nur Meister und Europapokalplatz gegen die Europapokal-Teilnahmen geprüft)',
  },
  1995: {
    t1: ['mlt-sliema', 'mlt-floriana', 'mlt-valletta', 'mlt-hamrun', 'mlt-paola', 'mlt-birkirkara', 'mlt-rabat', 'mlt-naxxar', 'mlt-pieta', 'mlt-zurrieq'],
    euro: { uefa: ['mlt-sliema', 'mlt-paola'] },
    note: 'Tabelle aus Wissen, ungeprüft (nur Meister und Europapokalplatz gegen die Europapokal-Teilnahmen geprüft)',
  },
  1996: {
    t1: ['mlt-valletta', 'mlt-birkirkara', 'mlt-hamrun', 'mlt-floriana', 'mlt-paola', 'mlt-sliema', 'mlt-rabat', 'mlt-naxxar', 'mlt-pieta', 'mlt-zurrieq'],
    euro: { uefa: ['mlt-floriana', 'mlt-sliema'] },
    note: 'Tabelle aus Wissen, ungeprüft (nur Meister und Europapokalplatz gegen die Europapokal-Teilnahmen geprüft)',
  },
  1997: {
    t1: ['mlt-valletta', 'mlt-birkirkara', 'mlt-sliema', 'mlt-paola', 'mlt-floriana', 'mlt-naxxar', 'mlt-pieta', 'mlt-hamrun', 'mlt-xghajra', 'mlt-tarxien'],
    euro: { uefa: ['mlt-birkirkara'], cl: ['mlt-valletta'] },
    note: 'Nach der Vorrunde Punkte halbiert, dann Meister- und Abstiegsrunde',
  },
  1998: {
    t1: ['mlt-valletta', 'mlt-birkirkara', 'mlt-sliema', 'mlt-floriana', 'mlt-naxxar', 'mlt-paola', 'mlt-pieta', 'mlt-rabat', 'mlt-zabbar', 'mlt-hamrun'],
    euro: { uefa: ['mlt-birkirkara'], cl: ['mlt-valletta'] },
    note: 'Nach der Vorrunde Punkte halbiert, dann Meister- und Abstiegsrunde',
  },
  1999: {
    t1: ['mlt-birkirkara', 'mlt-sliema', 'mlt-valletta', 'mlt-floriana', 'mlt-pieta', 'mlt-paola', 'mlt-naxxar', 'mlt-rabat', 'mlt-gozo', 'mlt-zurrieq'],
    euro: { uefa: ['mlt-birkirkara', 'mlt-sliema'], cl: ['mlt-valletta'] },
    note: 'Nach der Vorrunde Punkte halbiert, dann Meister- und Abstiegsrunde',
  },
  2000: {
    t1: ['mlt-valletta', 'mlt-sliema', 'mlt-birkirkara', 'mlt-paola', 'mlt-floriana', 'mlt-hamrun', 'mlt-pieta', 'mlt-naxxar', 'mlt-rabat', 'mlt-xghajra'],
    euro: { uefa: ['mlt-valletta', 'mlt-sliema'], cl: ['mlt-birkirkara'] },
    note: 'Nach der Vorrunde Punkte halbiert, dann Meister- und Abstiegsrunde',
  },
  2001: {
    t1: ['mlt-paola', 'mlt-sliema', 'mlt-birkirkara', 'mlt-valletta', 'mlt-floriana', 'mlt-marsa', 'mlt-naxxar', 'mlt-pieta', 'mlt-hamrun', 'mlt-lija'],
    euro: { uefa: ['mlt-sliema', 'mlt-birkirkara'], cl: ['mlt-valletta'] },
    note: 'Nach der Vorrunde Punkte halbiert, dann Meister- und Abstiegsrunde',
  },
  2002: {
    t1: ['mlt-sliema', 'mlt-birkirkara', 'mlt-valletta', 'mlt-paola', 'mlt-pieta', 'mlt-marsaxlokk', 'mlt-hamrun', 'mlt-floriana', 'mlt-marsa', 'mlt-mosta'],
    euro: { uefa: ['mlt-sliema', 'mlt-birkirkara'], cl: ['mlt-paola'] },
    note: 'Nach der Vorrunde Punkte halbiert, dann Meister- und Abstiegsrunde',
  },
  2003: {
    t1: ['mlt-sliema', 'mlt-birkirkara', 'mlt-paola', 'mlt-marsaxlokk', 'mlt-pieta', 'mlt-floriana', 'mlt-valletta', 'mlt-msida', 'mlt-balzan', 'mlt-hamrun'],
    euro: { uefa: ['mlt-birkirkara', 'mlt-valletta'], cl: ['mlt-sliema'] },
    note: 'Nach der Vorrunde Punkte halbiert, dann Meister- und Abstiegsrunde',
  },
  2004: {
    t1: ['mlt-sliema', 'mlt-birkirkara', 'mlt-paola', 'mlt-valletta', 'mlt-marsaxlokk', 'mlt-floriana', 'mlt-msida', 'mlt-pieta', 'mlt-zabbar', 'mlt-lija'],
    euro: { uefa: ['mlt-birkirkara', 'mlt-marsaxlokk'], cl: ['mlt-sliema'] },
    note: 'Nach der Vorrunde Punkte halbiert, dann Meister- und Abstiegsrunde',
  },
  2005: {
    t1: ['mlt-birkirkara', 'mlt-sliema', 'mlt-marsaxlokk', 'mlt-paola', 'mlt-valletta', 'mlt-msida', 'mlt-floriana', 'mlt-pieta', 'mlt-mosta', 'mlt-hamrun'],
    euro: { uefa: ['mlt-birkirkara', 'mlt-paola'], cl: ['mlt-sliema'] },
    note: 'Nach der Vorrunde Punkte halbiert, dann Meister- und Abstiegsrunde',
  },
  2006: {
    t1: ['mlt-marsaxlokk', 'mlt-sliema', 'mlt-birkirkara', 'mlt-valletta', 'mlt-paola', 'mlt-msida', 'mlt-floriana', 'mlt-pieta', 'mlt-marsa', 'mlt-cospicua'],
    euro: { uefa: ['mlt-sliema', 'mlt-paola'], cl: ['mlt-birkirkara'] },
    note: 'Nach der Vorrunde Punkte halbiert, dann Meister- und Abstiegsrunde',
  },
  2007: {
    t1: ['mlt-valletta', 'mlt-marsaxlokk', 'mlt-birkirkara', 'mlt-sliema', 'mlt-floriana', 'mlt-hamrun', 'mlt-paola', 'mlt-msida', 'mlt-pieta', 'mlt-mqabba'],
    euro: { uefa: ['mlt-sliema', 'mlt-paola'], cl: ['mlt-marsaxlokk'] },
    note: 'Nach der Vorrunde Punkte halbiert, dann Meister- und Abstiegsrunde',
  },
  2008: {
    t1: ['mlt-paola', 'mlt-valletta', 'mlt-birkirkara', 'mlt-sliema', 'mlt-marsaxlokk', 'mlt-floriana', 'mlt-qormi', 'mlt-tarxien', 'mlt-msida', 'mlt-hamrun'],
    euro: { uefa: ['mlt-birkirkara', 'mlt-marsaxlokk'], cl: ['mlt-valletta'] },
    note: 'Nach der Vorrunde Punkte halbiert, dann Meister- und Abstiegsrunde',
  },
  2009: {
    t1: ['mlt-birkirkara', 'mlt-valletta', 'mlt-sliema', 'mlt-qormi', 'mlt-tarxien', 'mlt-paola', 'mlt-floriana', 'mlt-hamrun', 'mlt-msida', 'mlt-dingli'],
    euro: { cl: ['mlt-paola'], el: ['mlt-birkirkara', 'mlt-valletta', 'mlt-sliema'] },
    note: 'Nach der Vorrunde Punkte halbiert, dann Meister- und Abstiegsrunde',
  },
  2010: {
    t1: ['mlt-valletta', 'mlt-floriana', 'mlt-birkirkara', 'mlt-marsaxlokk', 'mlt-tarxien', 'mlt-hamrun', 'mlt-sliema', 'mlt-qormi', 'mlt-paola', 'mlt-birgu'],
    euro: { cl: ['mlt-birkirkara'], el: ['mlt-valletta', 'mlt-sliema'] },
    note: 'Nach der Vorrunde Punkte halbiert, dann Meister- und Abstiegsrunde',
  },
  2011: {
    t1: ['mlt-valletta', 'mlt-paola', 'mlt-birkirkara', 'mlt-floriana', 'mlt-sliema', 'mlt-balzan', 'mlt-qormi', 'mlt-tarxien', 'mlt-mosta', 'mlt-hamrun', 'mlt-mqabba', 'mlt-marsaxlokk'],
    euro: { cl: ['mlt-valletta'], el: ['mlt-birkirkara', 'mlt-floriana'] },
    note: 'Nach der Vorrunde Punkte halbiert, dann Meister- und Abstiegsrunde',
  },
  2012: {
    t1: ['mlt-birkirkara', 'mlt-paola', 'mlt-valletta', 'mlt-sliema', 'mlt-tarxien', 'mlt-mosta', 'mlt-floriana', 'mlt-qormi', 'mlt-balzan', 'mlt-rabat', 'mlt-hamrun', 'mlt-san-giljan'],
    euro: { cl: ['mlt-valletta'], el: ['mlt-birkirkara', 'mlt-paola', 'mlt-floriana'] },
    note: 'Nach der Vorrunde Punkte halbiert, dann Meister- und Abstiegsrunde',
  },
  2013: {
    t1: ['mlt-valletta', 'mlt-birkirkara', 'mlt-paola', 'mlt-mosta', 'mlt-sliema', 'mlt-balzan', 'mlt-floriana', 'mlt-tarxien', 'mlt-qormi', 'mlt-naxxar', 'mlt-birgu', 'mlt-rabat'],
    euro: { cl: ['mlt-birkirkara'], el: ['mlt-valletta', 'mlt-paola', 'mlt-sliema'] },
    note: 'Nach der Vorrunde Punkte halbiert, dann Meister- und Abstiegsrunde',
  },
  2014: {
    t1: ['mlt-paola', 'mlt-valletta', 'mlt-birkirkara', 'mlt-balzan', 'mlt-floriana', 'mlt-sliema', 'mlt-naxxar', 'mlt-qormi', 'mlt-tarxien', 'mlt-mosta', 'mlt-pieta', 'mlt-zebbug'],
    euro: { cl: ['mlt-valletta'], el: ['mlt-paola', 'mlt-birkirkara', 'mlt-sliema'] },
  },
  2015: {
    t1: ['mlt-valletta', 'mlt-paola', 'mlt-birkirkara', 'mlt-balzan', 'mlt-floriana', 'mlt-tarxien', 'mlt-sliema', 'mlt-mosta', 'mlt-pembroke', 'mlt-naxxar', 'mlt-st-andrews', 'mlt-qormi'],
    euro: { cl: ['mlt-paola'], el: ['mlt-valletta', 'mlt-birkirkara', 'mlt-balzan'] },
  },
  2016: {
    t1: ['mlt-paola', 'mlt-balzan', 'mlt-birkirkara', 'mlt-valletta', 'mlt-floriana', 'mlt-sliema', 'mlt-gzira', 'mlt-st-andrews', 'mlt-tarxien', 'mlt-hamrun', 'mlt-mosta', 'mlt-pembroke'],
    euro: { cl: ['mlt-valletta'], el: ['mlt-paola', 'mlt-balzan', 'mlt-birkirkara'] },
  },
  2017: {
    t1: ['mlt-valletta', 'mlt-balzan', 'mlt-gzira', 'mlt-birkirkara', 'mlt-paola', 'mlt-floriana', 'mlt-sliema', 'mlt-hamrun', 'mlt-senglea', 'mlt-mosta', 'mlt-st-andrews', 'mlt-tarxien', 'mlt-naxxar', 'mlt-lija'],
    euro: { cl: ['mlt-paola'], el: ['mlt-valletta', 'mlt-balzan', 'mlt-floriana'] },
  },
  2018: {
    t1: ['mlt-valletta', 'mlt-paola', 'mlt-gzira', 'mlt-hamrun', 'mlt-sliema', 'mlt-balzan', 'mlt-birkirkara', 'mlt-floriana', 'mlt-mosta', 'mlt-tarxien', 'mlt-senglea', 'mlt-st-andrews', 'mlt-qormi', 'mlt-pieta'],
    euro: { cl: ['mlt-valletta'], el: ['mlt-valletta', 'mlt-gzira', 'mlt-balzan', 'mlt-birkirkara'] },
  },
  2019: {
    t1: ['mlt-floriana', 'mlt-valletta', 'mlt-paola', 'mlt-st-paul-s-bay', 'mlt-birkirkara', 'mlt-gzira', 'mlt-balzan', 'mlt-mosta', 'mlt-hamrun', 'mlt-gudja', 'mlt-sliema', 'mlt-santa-lucija', 'mlt-senglea', 'mlt-tarxien'],
    euro: { cl: ['mlt-valletta'], el: ['mlt-valletta', 'mlt-paola', 'mlt-gzira', 'mlt-balzan'] },
    note: 'Saison wegen der Pandemie abgebrochen; Floriana zum Meister erklärt',
  },
  2020: {
    t1: ['mlt-hamrun', 'mlt-paola', 'mlt-gzira', 'mlt-birkirkara', 'mlt-sliema', 'mlt-mosta', 'mlt-valletta', 'mlt-santa-lucija', 'mlt-st-paul-s-bay', 'mlt-floriana', 'mlt-gudja', 'mlt-balzan', 'mlt-zejtun', 'mlt-tarxien', 'mlt-lija', 'mlt-senglea'],
    euro: { cl: ['mlt-floriana'], el: ['mlt-paola', 'mlt-valletta', 'mlt-st-paul-s-bay', 'mlt-floriana'] },
    note: 'Saison wegen der Pandemie abgebrochen; Hamrun zum Meister erklärt',
  },
  2021: {
    t1: ['mlt-paola', 'mlt-floriana', 'mlt-hamrun', 'mlt-gzira', 'mlt-birkirkara', 'mlt-valletta', 'mlt-st-paul-s-bay', 'mlt-gudja', 'mlt-mosta', 'mlt-balzan', 'mlt-santa-lucija', 'mlt-sliema'],
    euro: { cl: ['mlt-paola'], ecl: ['mlt-paola', 'mlt-gzira', 'mlt-birkirkara', 'mlt-mosta'] },
  },
  2022: {
    t1: ['mlt-hamrun', 'mlt-birkirkara', 'mlt-balzan', 'mlt-gzira', 'mlt-paola', 'mlt-mosta', 'mlt-floriana', 'mlt-valletta', 'mlt-st-paul-s-bay', 'mlt-gudja', 'mlt-marsaxlokk', 'mlt-santa-lucija', 'mlt-zebbug', 'mlt-pieta'],
    euro: { cl: ['mlt-paola'], ecl: ['mlt-hamrun', 'mlt-gzira', 'mlt-paola', 'mlt-floriana'] },
  },
  2023: {
    t1: ['mlt-hamrun', 'mlt-floriana', 'mlt-sliema', 'mlt-marsaxlokk', 'mlt-birkirkara', 'mlt-naxxar', 'mlt-paola', 'mlt-balzan', 'mlt-gzira', 'mlt-mosta', 'mlt-santa-lucija', 'mlt-valletta', 'mlt-st-paul-s-bay', 'mlt-gudja'],
    euro: { cl: ['mlt-hamrun'], ecl: ['mlt-hamrun', 'mlt-birkirkara', 'mlt-balzan', 'mlt-gzira'] },
  },
  2024: {
    t1: ['mlt-hamrun', 'mlt-floriana', 'mlt-sliema', 'mlt-birkirkara', 'mlt-paola', 'mlt-gzira', 'mlt-marsaxlokk', 'mlt-mosta', 'mlt-zabbar', 'mlt-naxxar', 'mlt-san-giljan', 'mlt-balzan'],
    euro: { cl: ['mlt-hamrun'], ecl: ['mlt-hamrun', 'mlt-floriana', 'mlt-sliema', 'mlt-marsaxlokk'] },
    note: 'Meister Hamrun gesetzt (Meisterrunde im Datensatz unvollständig/abweichendes Format)',
  },
  2025: {
    t1: ['mlt-hamrun', 'mlt-floriana', 'mlt-sliema', 'mlt-birkirkara', 'mlt-paola', 'mlt-gzira', 'mlt-marsaxlokk', 'mlt-mosta', 'mlt-zabbar', 'mlt-naxxar', 'mlt-valletta', 'mlt-tarxien'],
    euro: { cl: ['mlt-hamrun'], el: ['mlt-hamrun'], ecl: ['mlt-hamrun', 'mlt-floriana', 'mlt-birkirkara', 'mlt-paola'] },
    note: 'Laufende Saison: Zusammensetzung zu Saisonbeginn (Vorjahresplatz, Aufsteiger hinten) – Aufsteiger aus Wissen, ungeprüft',
  },
};
