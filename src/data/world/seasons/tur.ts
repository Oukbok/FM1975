// =============================================================================
// Weltdaten tur: Süper Lig (1. Lig) je Saison (Schlüssel = Startjahr, 1975 = 1975/76).
// t1 in Reihenfolge der Abschlusstabelle; cup/cupFinalist = Landespokal; euro = Europapokal-Teilnehmer.
// Quellen und Unsicherheiten: docs/recherche/weltvereine_tur.md.
// =============================================================================
import type { SeasonRow } from '../types';

export const SEASONS_TUR: Record<number, SeasonRow> = {
  1975: {
    t1: ['tur-trabzon', 'tur-istanbul-gelb-blau', 'tur-istanbul-gelb-rot', 'tur-adana-orange', 'tur-izmir-schwarz-weiss', 'tur-bolu', 'tur-adana-blau', 'tur-giresun', 'tur-eskisehir', 'tur-bursa', 'tur-ordu', 'tur-istanbul-schwarz-weiss', 'tur-zonguldak', 'tur-izmir-gelb-rot', 'tur-ankara-gelb-blau', 'tur-balikesir'],
    cup: 'tur-istanbul-gelb-rot', cupFinalist: 'tur-trabzon',
    euro: { ec: ['tur-istanbul-gelb-blau'], cwc: ['tur-istanbul-schwarz-weiss'], uefa: ['tur-istanbul-gelb-rot', 'tur-eskisehir'] },
  },
  1976: {
    t1: ['tur-trabzon', 'tur-istanbul-gelb-blau', 'tur-izmir-schwarz-weiss', 'tur-istanbul-gelb-rot', 'tur-istanbul-schwarz-weiss', 'tur-bursa', 'tur-bolu', 'tur-mersin', 'tur-eskisehir', 'tur-samsun', 'tur-ordu', 'tur-adana-blau', 'tur-zonguldak', 'tur-izmir-gelb-rot', 'tur-adana-orange', 'tur-giresun'],
    cup: 'tur-trabzon', cupFinalist: 'tur-istanbul-schwarz-weiss',
    euro: { ec: ['tur-trabzon'], cwc: ['tur-istanbul-gelb-rot'], uefa: ['tur-istanbul-gelb-blau', 'tur-adana-orange'] },
  },
  1977: {
    t1: ['tur-istanbul-gelb-blau', 'tur-trabzon', 'tur-istanbul-gelb-rot', 'tur-adana-orange', 'tur-istanbul-schwarz-weiss', 'tur-izmir-schwarz-weiss', 'tur-diyarbakir', 'tur-zonguldak', 'tur-bolu', 'tur-bursa', 'tur-ordu', 'tur-adana-blau', 'tur-eskisehir', 'tur-samsun', 'tur-ankara-gelb-blau', 'tur-mersin'],
    cup: 'tur-trabzon', cupFinalist: 'tur-adana-orange',
    euro: { ec: ['tur-trabzon'], cwc: ['tur-istanbul-schwarz-weiss'], uefa: ['tur-istanbul-gelb-blau', 'tur-izmir-schwarz-weiss'] },
  },
  1978: {
    t1: ['tur-trabzon', 'tur-istanbul-gelb-rot', 'tur-istanbul-gelb-blau', 'tur-ordu', 'tur-diyarbakir', 'tur-izmir-schwarz-weiss', 'tur-eskisehir', 'tur-zonguldak', 'tur-istanbul-schwarz-weiss', 'tur-izmir-gelb-rot', 'tur-adana-orange', 'tur-bursa', 'tur-adana-blau', 'tur-bolu', 'tur-samsun', 'tur-kirikkale'],
    cup: 'tur-istanbul-gelb-blau', cupFinalist: 'tur-izmir-schwarz-weiss',
    euro: { ec: ['tur-istanbul-gelb-blau'], cwc: ['tur-trabzon'], uefa: ['tur-istanbul-gelb-rot', 'tur-adana-orange'] },
  },
  1979: {
    t1: ['tur-trabzon', 'tur-istanbul-gelb-blau', 'tur-zonguldak', 'tur-bursa', 'tur-rize', 'tur-eskisehir', 'tur-ordu', 'tur-adana-orange', 'tur-istanbul-schwarz-weiss', 'tur-adana-blau', 'tur-istanbul-gelb-rot', 'tur-gaziantep', 'tur-izmir-schwarz-weiss', 'tur-izmir-gelb-rot', 'tur-kayseri', 'tur-diyarbakir'],
    cup: 'tur-izmir-schwarz-weiss', cupFinalist: 'tur-istanbul-gelb-rot',
    euro: { ec: ['tur-trabzon'], cwc: ['tur-istanbul-gelb-blau'], uefa: ['tur-ordu', 'tur-istanbul-gelb-rot'] },
  },
  1980: {
    t1: ['tur-trabzon', 'tur-adana-orange', 'tur-istanbul-gelb-rot', 'tur-gaziantep', 'tur-eskisehir', 'tur-istanbul-schwarz-weiss', 'tur-izmit', 'tur-bursa', 'tur-zonguldak', 'tur-rize', 'tur-adana-blau', 'tur-istanbul-gelb-blau', 'tur-izmir-schwarz-weiss', 'tur-bolu', 'tur-mersin', 'tur-ordu'],
    cup: 'tur-ankara-gelb-blau', cupFinalist: 'tur-bolu',
    euro: { ec: ['tur-trabzon'], cwc: ['tur-izmir-schwarz-weiss'], uefa: ['tur-istanbul-gelb-blau'] },
  },
  1981: {
    t1: ['tur-istanbul-schwarz-weiss', 'tur-trabzon', 'tur-istanbul-gelb-blau', 'tur-zonguldak', 'tur-adapazari', 'tur-ankara-gelb-blau', 'tur-adana-blau', 'tur-adana-orange', 'tur-izmir-schwarz-weiss', 'tur-izmit', 'tur-istanbul-gelb-rot', 'tur-bursa', 'tur-bolu', 'tur-gaziantep', 'tur-eskisehir', 'tur-izmir-gelb-rot', 'tur-diyarbakir'],
    cup: 'tur-istanbul-gelb-rot', cupFinalist: 'tur-bolu',
    euro: { ec: ['tur-trabzon'], cwc: ['tur-ankara-gelb-blau'], uefa: ['tur-adana-orange'] },
  },
  1982: {
    t1: ['tur-istanbul-gelb-blau', 'tur-trabzon', 'tur-istanbul-gelb-rot', 'tur-bolu', 'tur-istanbul-schwarz-weiss', 'tur-ankara-gelb-blau', 'tur-izmit', 'tur-bursa', 'tur-adana-blau', 'tur-adapazari', 'tur-adana-orange', 'tur-istanbul-sariyer', 'tur-zonguldak', 'tur-mersin', 'tur-antalya', 'tur-samsun', 'tur-gaziantep', 'tur-izmir-schwarz-weiss'],
    cup: 'tur-istanbul-gelb-blau', cupFinalist: 'tur-mersin',
    euro: { ec: ['tur-istanbul-schwarz-weiss'], cwc: ['tur-istanbul-gelb-rot'], uefa: ['tur-trabzon'] },
  },
  1983: {
    t1: ['tur-trabzon', 'tur-istanbul-gelb-blau', 'tur-istanbul-schwarz-weiss', 'tur-istanbul-gelb-rot', 'tur-adapazari', 'tur-ankara-gelb-blau', 'tur-denizli', 'tur-zonguldak', 'tur-izmit', 'tur-ankara-rot-schwarz', 'tur-bursa', 'tur-istanbul-sariyer', 'tur-ordu', 'tur-adana-blau', 'tur-bolu', 'tur-antalya', 'tur-adana-orange', 'tur-istanbul-karaguemruek'],
    cup: 'tur-trabzon', cupFinalist: 'tur-istanbul-schwarz-weiss',
    euro: { ec: ['tur-istanbul-gelb-blau'], cwc: ['tur-mersin'], uefa: ['tur-trabzon'] },
  },
  1984: {
    t1: ['tur-istanbul-gelb-blau', 'tur-istanbul-schwarz-weiss', 'tur-trabzon', 'tur-ankara-gelb-blau', 'tur-istanbul-gelb-rot', 'tur-adapazari', 'tur-izmit', 'tur-ordu', 'tur-istanbul-sariyer', 'tur-eskisehir', 'tur-zonguldak', 'tur-bursa', 'tur-ankara-rot-schwarz', 'tur-malatya', 'tur-izmir-schwarz-weiss', 'tur-denizli', 'tur-antalya', 'tur-bolu'],
    cup: 'tur-istanbul-gelb-rot', cupFinalist: 'tur-trabzon',
    euro: { ec: ['tur-trabzon'], cwc: ['tur-istanbul-schwarz-weiss'], uefa: ['tur-istanbul-gelb-blau'] },
  },
  1985: {
    t1: ['tur-istanbul-schwarz-weiss', 'tur-istanbul-gelb-rot', 'tur-samsun', 'tur-istanbul-sariyer', 'tur-istanbul-gelb-blau', 'tur-ankara-gelb-blau', 'tur-trabzon', 'tur-izmir-schwarz-weiss', 'tur-ankara-rot-schwarz', 'tur-zonguldak', 'tur-eskisehir', 'tur-rize', 'tur-denizli', 'tur-izmit', 'tur-malatya', 'tur-bursa', 'tur-adapazari', 'tur-ordu', 'tur-kayseri'],
    cup: 'tur-bursa', cupFinalist: 'tur-izmir-schwarz-weiss',
    euro: { ec: ['tur-istanbul-gelb-blau'], cwc: ['tur-istanbul-gelb-rot'], uefa: ['tur-istanbul-schwarz-weiss'] },
  },
  1986: {
    t1: ['tur-istanbul-gelb-rot', 'tur-istanbul-schwarz-weiss', 'tur-samsun', 'tur-trabzon', 'tur-istanbul-gelb-blau', 'tur-malatya', 'tur-denizli', 'tur-izmir-schwarz-weiss', 'tur-ankara-gelb-blau', 'tur-eskisehir', 'tur-zonguldak', 'tur-ankara-rot-schwarz', 'tur-rize', 'tur-istanbul-sariyer', 'tur-bolu', 'tur-izmit', 'tur-bursa', 'tur-antalya', 'tur-diyarbakir'],
    cup: 'tur-ankara-rot-schwarz', cupFinalist: 'tur-eskisehir',
    euro: { ec: ['tur-istanbul-schwarz-weiss'], cwc: ['tur-bursa'], uefa: ['tur-istanbul-gelb-rot'] },
  },
  1987: {
    t1: ['tur-istanbul-gelb-rot', 'tur-istanbul-schwarz-weiss', 'tur-malatya', 'tur-samsun', 'tur-bursa', 'tur-trabzon', 'tur-izmir-gruen-rot', 'tur-istanbul-gelb-blau', 'tur-istanbul-sariyer', 'tur-adana-blau', 'tur-adapazari', 'tur-izmir-schwarz-weiss', 'tur-rize', 'tur-bolu', 'tur-ankara-gelb-blau', 'tur-eskisehir', 'tur-denizli', 'tur-izmit', 'tur-ankara-rot-schwarz', 'tur-zonguldak'],
    cup: 'tur-adapazari', cupFinalist: 'tur-samsun',
    euro: { ec: ['tur-istanbul-gelb-rot'], cwc: ['tur-ankara-rot-schwarz'], uefa: ['tur-istanbul-schwarz-weiss'] },
  },
  1988: {
    t1: ['tur-istanbul-gelb-blau', 'tur-istanbul-schwarz-weiss', 'tur-istanbul-gelb-rot', 'tur-istanbul-sariyer', 'tur-trabzon', 'tur-ankara-gelb-blau', 'tur-bolu', 'tur-konya', 'tur-bursa', 'tur-adapazari', 'tur-izmir-gruen-rot', 'tur-malatya', 'tur-adana-orange', 'tur-adana-blau', 'tur-eskisehir', 'tur-izmir-schwarz-weiss', 'tur-rize', 'tur-kahramanmaras', 'tur-samsun'],
    cup: 'tur-istanbul-schwarz-weiss', cupFinalist: 'tur-istanbul-gelb-blau',
    euro: { ec: ['tur-istanbul-gelb-rot'], cwc: ['tur-adapazari'], uefa: ['tur-istanbul-schwarz-weiss'] },
  },
  1989: {
    t1: ['tur-istanbul-schwarz-weiss', 'tur-istanbul-gelb-blau', 'tur-trabzon', 'tur-istanbul-gelb-rot', 'tur-istanbul-sariyer', 'tur-bursa', 'tur-izmir-gruen-rot', 'tur-konya', 'tur-ankara-gelb-blau', 'tur-istanbul-zeytinburnu', 'tur-ankara-rot-schwarz', 'tur-adana-orange', 'tur-bolu', 'tur-malatya', 'tur-izmir-schwarz-weiss', 'tur-samsun', 'tur-adana-blau', 'tur-adapazari'],
    cup: 'tur-istanbul-schwarz-weiss', cupFinalist: 'tur-trabzon',
    euro: { ec: ['tur-istanbul-gelb-blau'], cwc: ['tur-istanbul-schwarz-weiss'], uefa: ['tur-istanbul-gelb-rot'] },
  },
  1990: {
    t1: ['tur-istanbul-schwarz-weiss', 'tur-istanbul-gelb-rot', 'tur-trabzon', 'tur-istanbul-sariyer', 'tur-istanbul-gelb-blau', 'tur-istanbul-bakirkoey', 'tur-ankara-gelb-blau', 'tur-bursa', 'tur-bolu', 'tur-ankara-rot-schwarz', 'tur-aydin', 'tur-konya', 'tur-gaziantep', 'tur-istanbul-zeytinburnu', 'tur-adana-orange', 'tur-izmir-gruen-rot'],
    cup: 'tur-istanbul-gelb-rot', cupFinalist: 'tur-ankara-gelb-blau',
    euro: { ec: ['tur-istanbul-schwarz-weiss'], cwc: ['tur-trabzon'], uefa: ['tur-istanbul-gelb-blau'] },
  },
  1991: {
    t1: ['tur-istanbul-schwarz-weiss', 'tur-istanbul-gelb-blau', 'tur-istanbul-gelb-rot', 'tur-trabzon', 'tur-aydin', 'tur-bursa', 'tur-istanbul-sariyer', 'tur-ankara-gelb-blau', 'tur-izmir-schwarz-weiss', 'tur-ankara-rot-schwarz', 'tur-istanbul-bakirkoey', 'tur-konya', 'tur-gaziantep', 'tur-bolu', 'tur-adana-blau', 'tur-samsun'],
    cup: 'tur-trabzon', cupFinalist: 'tur-bursa',
    euro: { ec: ['tur-istanbul-schwarz-weiss'], cwc: ['tur-istanbul-gelb-rot'], uefa: ['tur-trabzon'] },
  },
  1992: {
    t1: ['tur-istanbul-gelb-rot', 'tur-istanbul-schwarz-weiss', 'tur-trabzon', 'tur-izmit', 'tur-istanbul-gelb-blau', 'tur-bursa', 'tur-ankara-gelb-blau', 'tur-izmir-schwarz-weiss', 'tur-ankara-rot-schwarz', 'tur-gaziantep', 'tur-istanbul-sariyer', 'tur-kayseri-erciyes', 'tur-izmir-gruen-rot', 'tur-istanbul-bakirkoey', 'tur-aydin', 'tur-konya'],
    cup: 'tur-istanbul-gelb-rot', cupFinalist: 'tur-istanbul-schwarz-weiss',
    euro: { cwc: ['tur-trabzon'], uefa: ['tur-istanbul-gelb-rot', 'tur-istanbul-gelb-blau'], cl: ['tur-istanbul-schwarz-weiss'] },
  },
  1993: {
    t1: ['tur-istanbul-gelb-rot', 'tur-istanbul-gelb-blau', 'tur-trabzon', 'tur-istanbul-schwarz-weiss', 'tur-samsun', 'tur-izmit', 'tur-ankara-rot-schwarz', 'tur-gaziantep', 'tur-bursa', 'tur-izmir-schwarz-weiss', 'tur-ankara-gelb-blau', 'tur-kayseri-erciyes', 'tur-istanbul-zeytinburnu', 'tur-karabuek', 'tur-izmir-gruen-rot', 'tur-istanbul-sariyer'],
    cup: 'tur-istanbul-schwarz-weiss', cupFinalist: 'tur-istanbul-gelb-rot',
    euro: { cwc: ['tur-istanbul-schwarz-weiss'], uefa: ['tur-trabzon', 'tur-izmit'], cl: ['tur-istanbul-gelb-rot'] },
  },
  1994: {
    t1: ['tur-istanbul-schwarz-weiss', 'tur-trabzon', 'tur-istanbul-gelb-rot', 'tur-istanbul-gelb-blau', 'tur-ankara-rot-schwarz', 'tur-bursa', 'tur-gaziantep', 'tur-samsun', 'tur-izmit', 'tur-izmir-schwarz-weiss', 'tur-kayseri', 'tur-van', 'tur-antalya', 'tur-ankara-gelb-blau', 'tur-denizli', 'tur-istanbul-zeytinburnu', 'tur-ankara-petrol', 'tur-adana-blau'],
    cup: 'tur-trabzon', cupFinalist: 'tur-istanbul-gelb-rot',
    euro: { cwc: ['tur-istanbul-schwarz-weiss'], uefa: ['tur-trabzon', 'tur-istanbul-gelb-blau'], cl: ['tur-istanbul-gelb-rot'] },
  },
  1995: {
    t1: ['tur-istanbul-gelb-blau', 'tur-trabzon', 'tur-istanbul-schwarz-weiss', 'tur-istanbul-gelb-rot', 'tur-izmit', 'tur-gaziantep', 'tur-antalya', 'tur-samsun', 'tur-ankara-rot-schwarz', 'tur-bursa', 'tur-ankara-gelb-blau', 'tur-izmir-schwarz-weiss', 'tur-istanbul-gelb-schwarz', 'tur-van', 'tur-denizli', 'tur-eskisehir', 'tur-kayseri', 'tur-izmir-gruen-rot'],
    cup: 'tur-istanbul-gelb-rot', cupFinalist: 'tur-istanbul-gelb-blau',
    euro: { cwc: ['tur-trabzon'], uefa: ['tur-istanbul-gelb-blau', 'tur-istanbul-gelb-rot'], cl: ['tur-istanbul-schwarz-weiss'] },
  },
  1996: {
    t1: ['tur-istanbul-gelb-rot', 'tur-istanbul-schwarz-weiss', 'tur-istanbul-gelb-blau', 'tur-trabzon', 'tur-bursa', 'tur-istanbul-gelb-schwarz', 'tur-izmit', 'tur-gaziantep', 'tur-samsun', 'tur-antalya', 'tur-ankara-rot-schwarz', 'tur-ankara-gelb-blau', 'tur-van', 'tur-izmir-schwarz-weiss', 'tur-canakkale', 'tur-istanbul-sariyer', 'tur-denizli', 'tur-istanbul-zeytinburnu'],
    cup: 'tur-izmit', cupFinalist: 'tur-trabzon',
    euro: { cwc: ['tur-istanbul-gelb-rot'], uefa: ['tur-istanbul-schwarz-weiss', 'tur-trabzon'], cl: ['tur-istanbul-gelb-blau'] },
  },
  1997: {
    t1: ['tur-istanbul-gelb-rot', 'tur-istanbul-gelb-blau', 'tur-trabzon', 'tur-istanbul-gelb-schwarz', 'tur-samsun', 'tur-istanbul-schwarz-weiss', 'tur-izmir-schwarz-weiss', 'tur-bursa', 'tur-karabuek', 'tur-izmit', 'tur-ankara-gelb-blau', 'tur-canakkale', 'tur-antalya', 'tur-gaziantep', 'tur-kayseri', 'tur-ankara-rot-schwarz', 'tur-ankara-etimesgut', 'tur-van'],
    cup: 'tur-istanbul-schwarz-weiss', cupFinalist: 'tur-istanbul-gelb-rot',
    euro: { cwc: ['tur-izmit'], uefa: ['tur-istanbul-gelb-blau', 'tur-trabzon'], cl: ['tur-istanbul-gelb-rot', 'tur-istanbul-schwarz-weiss'] },
  },
  1998: {
    t1: ['tur-istanbul-gelb-rot', 'tur-istanbul-schwarz-weiss', 'tur-istanbul-gelb-blau', 'tur-trabzon', 'tur-izmit', 'tur-antalya', 'tur-gaziantep', 'tur-ankara-rot-schwarz', 'tur-istanbul-gelb-schwarz', 'tur-samsun', 'tur-izmir-schwarz-weiss', 'tur-bursa', 'tur-erzurum', 'tur-adana-orange', 'tur-ankara-gelb-blau', 'tur-adapazari', 'tur-canakkale', 'tur-karabuek'],
    cup: 'tur-istanbul-gelb-rot', cupFinalist: 'tur-istanbul-schwarz-weiss',
    euro: { cwc: ['tur-istanbul-schwarz-weiss'], uefa: ['tur-istanbul-gelb-blau', 'tur-trabzon', 'tur-istanbul-gelb-schwarz'], cl: ['tur-istanbul-gelb-rot'] },
  },
  1999: {
    t1: ['tur-istanbul-gelb-rot', 'tur-istanbul-schwarz-weiss', 'tur-gaziantep', 'tur-istanbul-gelb-blau', 'tur-ankara-rot-schwarz', 'tur-trabzon', 'tur-samsun', 'tur-denizli', 'tur-adana-orange', 'tur-bursa', 'tur-antalya', 'tur-izmit', 'tur-ankara-gelb-blau', 'tur-erzurum', 'tur-istanbul-gelb-schwarz', 'tur-izmir-schwarz-weiss', 'tur-izmir-gelb-rot', 'tur-van'],
    cup: 'tur-istanbul-gelb-rot', cupFinalist: 'tur-antalya',
    euro: { uefa: ['tur-istanbul-gelb-rot', 'tur-istanbul-gelb-blau', 'tur-ankara-gelb-blau'], cl: ['tur-istanbul-gelb-rot', 'tur-istanbul-schwarz-weiss'] },
  },
  2000: {
    t1: ['tur-istanbul-gelb-blau', 'tur-istanbul-gelb-rot', 'tur-gaziantep', 'tur-istanbul-schwarz-weiss', 'tur-trabzon', 'tur-ankara-gelb-blau', 'tur-yozgat', 'tur-samsun', 'tur-rize', 'tur-ankara-rot-schwarz', 'tur-denizli', 'tur-istanbul-gelb-schwarz', 'tur-izmit', 'tur-bursa', 'tur-antalya', 'tur-siirt', 'tur-erzurum', 'tur-adana-orange'],
    cup: 'tur-ankara-rot-schwarz', cupFinalist: 'tur-istanbul-gelb-blau',
    euro: { uefa: ['tur-gaziantep', 'tur-antalya'], cl: ['tur-istanbul-gelb-rot', 'tur-istanbul-schwarz-weiss'] },
  },
  2001: {
    t1: ['tur-istanbul-gelb-rot', 'tur-istanbul-gelb-blau', 'tur-istanbul-schwarz-weiss', 'tur-ankara-gelb-blau', 'tur-denizli', 'tur-gaziantep', 'tur-izmir-gelb-rot', 'tur-ankara-rot-schwarz', 'tur-istanbul-gelb-schwarz', 'tur-bursa', 'tur-izmit', 'tur-diyarbakir', 'tur-malatya', 'tur-trabzon', 'tur-samsun', 'tur-rize', 'tur-antalya', 'tur-yozgat'],
    cup: 'tur-izmit', cupFinalist: 'tur-istanbul-schwarz-weiss',
    euro: { uefa: ['tur-gaziantep', 'tur-ankara-rot-schwarz'], cl: ['tur-istanbul-gelb-rot', 'tur-istanbul-gelb-blau'] },
  },
  2002: {
    t1: ['tur-istanbul-schwarz-weiss', 'tur-istanbul-gelb-rot', 'tur-ankara-rot-schwarz', 'tur-gaziantep', 'tur-malatya', 'tur-istanbul-gelb-blau', 'tur-trabzon', 'tur-ankara-gelb-blau', 'tur-istanbul-gelb-schwarz', 'tur-denizli', 'tur-adana-orange', 'tur-samsun', 'tur-elazig', 'tur-diyarbakir', 'tur-bursa', 'tur-izmir-schwarz-weiss', 'tur-izmir-gelb-rot', 'tur-izmit'],
    cup: 'tur-trabzon', cupFinalist: 'tur-ankara-rot-schwarz',
    euro: { uefa: ['tur-istanbul-schwarz-weiss', 'tur-istanbul-gelb-blau', 'tur-ankara-gelb-blau', 'tur-denizli', 'tur-izmit'], cl: ['tur-istanbul-gelb-rot', 'tur-istanbul-gelb-blau'] },
  },
  2003: {
    t1: ['tur-istanbul-gelb-blau', 'tur-trabzon', 'tur-istanbul-schwarz-weiss', 'tur-gaziantep', 'tur-denizli', 'tur-istanbul-gelb-rot', 'tur-samsun', 'tur-malatya', 'tur-ankara-gelb-blau', 'tur-ankara-rot-schwarz', 'tur-konya', 'tur-diyarbakir', 'tur-akcaabat', 'tur-rize', 'tur-istanbul-gelb-schwarz', 'tur-bursa', 'tur-adana-orange', 'tur-elazig'],
    cup: 'tur-trabzon', cupFinalist: 'tur-ankara-rot-schwarz',
    euro: { uefa: ['tur-trabzon', 'tur-istanbul-schwarz-weiss', 'tur-gaziantep', 'tur-istanbul-gelb-rot', 'tur-malatya', 'tur-ankara-rot-schwarz'], cl: ['tur-istanbul-schwarz-weiss', 'tur-istanbul-gelb-rot'] },
  },
  2004: {
    t1: ['tur-istanbul-gelb-blau', 'tur-trabzon', 'tur-istanbul-gelb-rot', 'tur-istanbul-schwarz-weiss', 'tur-ankara-rot-schwarz', 'tur-denizli', 'tur-ankara-lila', 'tur-konya', 'tur-gaziantep', 'tur-rize', 'tur-malatya', 'tur-samsun', 'tur-ankara-gelb-blau', 'tur-kayseri', 'tur-diyarbakir', 'tur-adapazari', 'tur-istanbul-gelb-schwarz', 'tur-akcaabat'],
    cup: 'tur-istanbul-gelb-rot', cupFinalist: 'tur-istanbul-gelb-blau',
    euro: { uefa: ['tur-istanbul-gelb-blau', 'tur-trabzon', 'tur-istanbul-schwarz-weiss', 'tur-ankara-rot-schwarz'], cl: ['tur-istanbul-gelb-blau', 'tur-trabzon'] },
  },
  2005: {
    t1: ['tur-istanbul-gelb-rot', 'tur-istanbul-gelb-blau', 'tur-istanbul-schwarz-weiss', 'tur-trabzon', 'tur-kayseri', 'tur-ankara-rot-schwarz', 'tur-konya', 'tur-sivas', 'tur-rize', 'tur-kayseri-erciyes', 'tur-gaziantep', 'tur-manisa', 'tur-ankara-gelb-blau', 'tur-ankara-lila', 'tur-denizli', 'tur-malatya', 'tur-samsun', 'tur-diyarbakir'],
    cup: 'tur-istanbul-schwarz-weiss', cupFinalist: 'tur-istanbul-gelb-blau',
    euro: { uefa: ['tur-istanbul-gelb-rot', 'tur-istanbul-schwarz-weiss'], cl: ['tur-istanbul-gelb-blau', 'tur-trabzon'] },
  },
  2006: {
    t1: ['tur-istanbul-gelb-blau', 'tur-istanbul-schwarz-weiss', 'tur-istanbul-gelb-rot', 'tur-trabzon', 'tur-kayseri', 'tur-ankara-rot-schwarz', 'tur-sivas', 'tur-ankara-lila', 'tur-konya', 'tur-bursa', 'tur-gaziantep', 'tur-manisa', 'tur-ankara-gelb-blau', 'tur-denizli', 'tur-rize', 'tur-antalya', 'tur-kayseri-erciyes', 'tur-adapazari'],
    cup: 'tur-istanbul-schwarz-weiss', cupFinalist: 'tur-kayseri-erciyes',
    euro: { uefa: ['tur-istanbul-gelb-blau', 'tur-istanbul-schwarz-weiss', 'tur-trabzon', 'tur-kayseri'], cl: ['tur-istanbul-gelb-blau', 'tur-istanbul-gelb-rot'] },
  },
  2007: {
    t1: ['tur-istanbul-gelb-rot', 'tur-istanbul-gelb-blau', 'tur-istanbul-schwarz-weiss', 'tur-sivas', 'tur-kayseri', 'tur-trabzon', 'tur-denizli', 'tur-ankara-gelb-blau', 'tur-gaziantep', 'tur-ankara-lila', 'tur-ankara-hacettepe', 'tur-istanbul-basaksehir', 'tur-bursa', 'tur-konya', 'tur-ankara-rot-schwarz', 'tur-manisa', 'tur-rize', 'tur-istanbul-kasimpasa'],
    cup: 'tur-kayseri', cupFinalist: 'tur-ankara-rot-schwarz',
    euro: { uefa: ['tur-istanbul-gelb-rot', 'tur-kayseri-erciyes'], cl: ['tur-istanbul-gelb-blau', 'tur-istanbul-schwarz-weiss'] },
  },
  2008: {
    t1: ['tur-istanbul-schwarz-weiss', 'tur-sivas', 'tur-trabzon', 'tur-istanbul-gelb-blau', 'tur-istanbul-gelb-rot', 'tur-bursa', 'tur-kayseri', 'tur-gaziantep', 'tur-istanbul-basaksehir', 'tur-ankara-lila', 'tur-eskisehir', 'tur-antalya', 'tur-ankara-gelb-blau', 'tur-ankara-rot-schwarz', 'tur-denizli', 'tur-konya', 'tur-izmit', 'tur-ankara-hacettepe'],
    cup: 'tur-istanbul-schwarz-weiss', cupFinalist: 'tur-istanbul-gelb-blau',
    euro: { uefa: ['tur-istanbul-schwarz-weiss', 'tur-istanbul-gelb-rot', 'tur-kayseri'], cl: ['tur-istanbul-gelb-blau', 'tur-istanbul-gelb-rot'] },
  },
  2009: {
    t1: ['tur-bursa', 'tur-istanbul-gelb-blau', 'tur-istanbul-gelb-rot', 'tur-istanbul-schwarz-weiss', 'tur-trabzon', 'tur-istanbul-basaksehir', 'tur-eskisehir', 'tur-kayseri', 'tur-antalya', 'tur-ankara-rot-schwarz', 'tur-istanbul-kasimpasa', 'tur-ankara-gelb-blau', 'tur-gaziantep', 'tur-manisa', 'tur-sivas', 'tur-diyarbakir', 'tur-denizli', 'tur-ankara-lila'],
    cup: 'tur-trabzon', cupFinalist: 'tur-istanbul-gelb-blau',
    euro: { cl: ['tur-istanbul-schwarz-weiss', 'tur-sivas'], el: ['tur-istanbul-gelb-blau', 'tur-istanbul-gelb-rot', 'tur-trabzon', 'tur-sivas'] },
    note: 'Ankara Lila (Ankaraspor) vom Verband zwangsabgestiegen, alle Spiele gewertet (0 Punkte)',
  },
  2010: {
    t1: ['tur-istanbul-gelb-blau', 'tur-trabzon', 'tur-bursa', 'tur-gaziantep', 'tur-istanbul-schwarz-weiss', 'tur-kayseri', 'tur-eskisehir', 'tur-istanbul-gelb-rot', 'tur-karabuek', 'tur-manisa', 'tur-antalya', 'tur-istanbul-basaksehir', 'tur-ankara-gelb-blau', 'tur-ankara-rot-schwarz', 'tur-sivas', 'tur-izmir-buca', 'tur-konya', 'tur-istanbul-kasimpasa'],
    cup: 'tur-istanbul-schwarz-weiss', cupFinalist: 'tur-istanbul-basaksehir',
    euro: { cl: ['tur-istanbul-gelb-blau', 'tur-bursa'], el: ['tur-istanbul-gelb-blau', 'tur-trabzon', 'tur-istanbul-schwarz-weiss', 'tur-istanbul-gelb-rot'] },
  },
  2011: {
    t1: ['tur-istanbul-gelb-rot', 'tur-istanbul-gelb-blau', 'tur-trabzon', 'tur-istanbul-schwarz-weiss', 'tur-bursa', 'tur-eskisehir', 'tur-istanbul-basaksehir', 'tur-sivas', 'tur-ankara-rot-schwarz', 'tur-gaziantep', 'tur-kayseri', 'tur-karabuek', 'tur-mersin', 'tur-ordu', 'tur-antalya', 'tur-samsun', 'tur-manisa', 'tur-ankara-gelb-blau'],
    cup: 'tur-istanbul-gelb-blau', cupFinalist: 'tur-bursa',
    euro: { cl: ['tur-trabzon'], el: ['tur-trabzon', 'tur-istanbul-schwarz-weiss', 'tur-bursa', 'tur-gaziantep'] },
    note: 'Play-offs: Meisterrunde (Plätze 1–4) und Europa-Runde (5–8) mit halbierten Punkten',
  },
  2012: {
    t1: ['tur-istanbul-gelb-rot', 'tur-istanbul-gelb-blau', 'tur-istanbul-schwarz-weiss', 'tur-bursa', 'tur-kayseri', 'tur-istanbul-kasimpasa', 'tur-antalya', 'tur-eskisehir', 'tur-trabzon', 'tur-gaziantep', 'tur-ankara-rot-schwarz', 'tur-sivas', 'tur-elazig', 'tur-akhisar', 'tur-karabuek', 'tur-istanbul-basaksehir', 'tur-ordu', 'tur-mersin'],
    cup: 'tur-istanbul-gelb-blau', cupFinalist: 'tur-trabzon',
    euro: { cl: ['tur-istanbul-gelb-rot', 'tur-istanbul-gelb-blau'], el: ['tur-istanbul-gelb-blau', 'tur-bursa', 'tur-eskisehir', 'tur-trabzon'] },
  },
  2013: {
    t1: ['tur-istanbul-gelb-blau', 'tur-istanbul-gelb-rot', 'tur-istanbul-schwarz-weiss', 'tur-trabzon', 'tur-sivas', 'tur-istanbul-kasimpasa', 'tur-karabuek', 'tur-bursa', 'tur-ankara-rot-schwarz', 'tur-akhisar', 'tur-konya', 'tur-eskisehir', 'tur-rize', 'tur-kayseri-erciyes', 'tur-gaziantep', 'tur-elazig', 'tur-antalya', 'tur-kayseri'],
    cup: 'tur-istanbul-gelb-rot', cupFinalist: 'tur-eskisehir',
    euro: { cl: ['tur-istanbul-gelb-blau', 'tur-istanbul-gelb-rot'], el: ['tur-istanbul-schwarz-weiss', 'tur-trabzon', 'tur-bursa'] },
  },
  2014: {
    t1: ['tur-istanbul-gelb-rot', 'tur-istanbul-gelb-blau', 'tur-istanbul-schwarz-weiss', 'tur-istanbul-basaksehir', 'tur-trabzon', 'tur-bursa', 'tur-mersin', 'tur-konya', 'tur-ankara-rot-schwarz', 'tur-gaziantep', 'tur-eskisehir', 'tur-akhisar', 'tur-istanbul-kasimpasa', 'tur-rize', 'tur-sivas', 'tur-karabuek', 'tur-kayseri-erciyes', 'tur-balikesir'],
    cup: 'tur-istanbul-gelb-rot', cupFinalist: 'tur-bursa',
    euro: { cl: ['tur-istanbul-gelb-rot', 'tur-istanbul-schwarz-weiss'], el: ['tur-istanbul-schwarz-weiss', 'tur-trabzon', 'tur-bursa', 'tur-karabuek'] },
  },
  2015: {
    t1: ['tur-istanbul-schwarz-weiss', 'tur-istanbul-gelb-blau', 'tur-konya', 'tur-istanbul-basaksehir', 'tur-ankara-lila', 'tur-istanbul-gelb-rot', 'tur-istanbul-kasimpasa', 'tur-akhisar', 'tur-antalya', 'tur-ankara-rot-schwarz', 'tur-bursa', 'tur-trabzon', 'tur-rize', 'tur-gaziantep', 'tur-kayseri', 'tur-sivas', 'tur-eskisehir', 'tur-mersin'],
    cup: 'tur-istanbul-gelb-rot', cupFinalist: 'tur-istanbul-gelb-blau',
    euro: { cl: ['tur-istanbul-gelb-blau', 'tur-istanbul-gelb-rot'], el: ['tur-istanbul-schwarz-weiss', 'tur-istanbul-gelb-blau', 'tur-istanbul-basaksehir', 'tur-istanbul-gelb-rot', 'tur-trabzon'] },
  },
  2016: {
    t1: ['tur-istanbul-schwarz-weiss', 'tur-istanbul-basaksehir', 'tur-istanbul-gelb-blau', 'tur-istanbul-gelb-rot', 'tur-antalya', 'tur-trabzon', 'tur-akhisar', 'tur-ankara-rot-schwarz', 'tur-konya', 'tur-istanbul-kasimpasa', 'tur-karabuek', 'tur-alanya', 'tur-ankara-lila', 'tur-bursa', 'tur-kayseri', 'tur-rize', 'tur-gaziantep', 'tur-adana-orange'],
    cup: 'tur-konya', cupFinalist: 'tur-istanbul-basaksehir',
    euro: { cl: ['tur-istanbul-schwarz-weiss', 'tur-istanbul-gelb-blau'], el: ['tur-istanbul-schwarz-weiss', 'tur-istanbul-basaksehir', 'tur-istanbul-gelb-blau', 'tur-konya', 'tur-ankara-lila'] },
  },
  2017: {
    t1: ['tur-istanbul-gelb-rot', 'tur-istanbul-gelb-blau', 'tur-istanbul-basaksehir', 'tur-istanbul-schwarz-weiss', 'tur-trabzon', 'tur-izmir-gelb-rot', 'tur-sivas', 'tur-istanbul-kasimpasa', 'tur-kayseri', 'tur-malatya-gelb-schwarz', 'tur-akhisar', 'tur-alanya', 'tur-bursa', 'tur-antalya', 'tur-konya', 'tur-ankara-lila', 'tur-ankara-rot-schwarz', 'tur-karabuek'],
    cup: 'tur-akhisar', cupFinalist: 'tur-istanbul-gelb-blau',
    euro: { cl: ['tur-istanbul-basaksehir', 'tur-istanbul-schwarz-weiss'], el: ['tur-istanbul-gelb-rot', 'tur-istanbul-gelb-blau', 'tur-istanbul-basaksehir', 'tur-konya'] },
  },
  2018: {
    t1: ['tur-istanbul-gelb-rot', 'tur-istanbul-basaksehir', 'tur-istanbul-schwarz-weiss', 'tur-trabzon', 'tur-malatya-gelb-schwarz', 'tur-istanbul-gelb-blau', 'tur-antalya', 'tur-konya', 'tur-alanya', 'tur-kayseri', 'tur-rize', 'tur-sivas', 'tur-ankara-gelb-blau', 'tur-istanbul-kasimpasa', 'tur-izmir-gelb-rot', 'tur-bursa', 'tur-erzurum', 'tur-akhisar'],
    cup: 'tur-istanbul-gelb-rot', cupFinalist: 'tur-akhisar',
    euro: { cl: ['tur-istanbul-gelb-rot', 'tur-istanbul-gelb-blau'], el: ['tur-istanbul-gelb-rot', 'tur-istanbul-basaksehir', 'tur-istanbul-schwarz-weiss', 'tur-istanbul-gelb-blau', 'tur-akhisar'] },
  },
  2019: {
    t1: ['tur-istanbul-basaksehir', 'tur-trabzon', 'tur-istanbul-schwarz-weiss', 'tur-sivas', 'tur-alanya', 'tur-istanbul-gelb-rot', 'tur-istanbul-gelb-blau', 'tur-gaziantep-sahinbey', 'tur-antalya', 'tur-istanbul-kasimpasa', 'tur-izmir-gelb-rot', 'tur-ankara-rot-schwarz', 'tur-konya', 'tur-denizli', 'tur-rize', 'tur-malatya-gelb-schwarz', 'tur-ankara-gelb-blau', 'tur-kayseri'],
    cup: 'tur-trabzon', cupFinalist: 'tur-alanya',
    euro: { cl: ['tur-istanbul-basaksehir', 'tur-istanbul-gelb-rot'], el: ['tur-istanbul-basaksehir', 'tur-trabzon', 'tur-istanbul-schwarz-weiss', 'tur-malatya-gelb-schwarz'] },
    note: 'Saison wegen der Pandemie im Juni/Juli 2020 beendet',
  },
  2020: {
    t1: ['tur-istanbul-schwarz-weiss', 'tur-istanbul-gelb-rot', 'tur-istanbul-gelb-blau', 'tur-trabzon', 'tur-sivas', 'tur-antakya', 'tur-alanya', 'tur-istanbul-karaguemruek', 'tur-gaziantep-sahinbey', 'tur-izmir-gelb-rot', 'tur-konya', 'tur-istanbul-basaksehir', 'tur-rize', 'tur-istanbul-kasimpasa', 'tur-malatya-gelb-schwarz', 'tur-antalya', 'tur-kayseri', 'tur-erzurum', 'tur-ankara-gelb-blau', 'tur-ankara-rot-schwarz', 'tur-denizli'],
    cup: 'tur-istanbul-schwarz-weiss', cupFinalist: 'tur-antalya',
    euro: { cl: ['tur-istanbul-schwarz-weiss', 'tur-istanbul-basaksehir'], el: ['tur-istanbul-schwarz-weiss', 'tur-istanbul-gelb-rot', 'tur-sivas', 'tur-alanya'] },
  },
  2021: {
    t1: ['tur-trabzon', 'tur-istanbul-gelb-blau', 'tur-konya', 'tur-istanbul-basaksehir', 'tur-alanya', 'tur-istanbul-schwarz-weiss', 'tur-antalya', 'tur-istanbul-karaguemruek', 'tur-adana-blau', 'tur-sivas', 'tur-istanbul-kasimpasa', 'tur-antakya', 'tur-istanbul-gelb-rot', 'tur-kayseri', 'tur-gaziantep-sahinbey', 'tur-giresun', 'tur-rize', 'tur-izmir-schwarz-weiss', 'tur-izmir-gelb-rot', 'tur-malatya-gelb-schwarz'],
    cup: 'tur-sivas', cupFinalist: 'tur-kayseri',
    euro: { cl: ['tur-istanbul-schwarz-weiss', 'tur-istanbul-gelb-rot'], el: ['tur-istanbul-gelb-blau', 'tur-istanbul-gelb-rot'], ecl: ['tur-trabzon', 'tur-istanbul-gelb-blau', 'tur-sivas'] },
  },
  2022: {
    t1: ['tur-istanbul-gelb-rot', 'tur-istanbul-gelb-blau', 'tur-istanbul-schwarz-weiss', 'tur-adana-blau', 'tur-istanbul-basaksehir', 'tur-trabzon', 'tur-istanbul-karaguemruek', 'tur-konya', 'tur-kayseri', 'tur-istanbul-kasimpasa', 'tur-ankara-gelb-blau', 'tur-istanbul-gelb-schwarz', 'tur-antalya', 'tur-sivas', 'tur-alanya', 'tur-giresun', 'tur-istanbul-uemraniye', 'tur-gaziantep-sahinbey', 'tur-antakya'],
    cup: 'tur-istanbul-gelb-blau', cupFinalist: 'tur-istanbul-basaksehir',
    euro: { cl: ['tur-istanbul-gelb-blau', 'tur-trabzon'], el: ['tur-istanbul-gelb-blau', 'tur-trabzon', 'tur-sivas'], ecl: ['tur-istanbul-basaksehir', 'tur-trabzon', 'tur-konya', 'tur-sivas'] },
    note: 'Antakya und Gaziantep-Şahinbey nach dem Erdbeben im Februar 2023 zurückgezogen (Tabellenende)',
  },
  2023: {
    t1: ['tur-istanbul-gelb-rot', 'tur-istanbul-gelb-blau', 'tur-trabzon', 'tur-istanbul-basaksehir', 'tur-istanbul-kasimpasa', 'tur-istanbul-schwarz-weiss', 'tur-sivas', 'tur-alanya', 'tur-rize', 'tur-antalya', 'tur-kayseri', 'tur-gaziantep-sahinbey', 'tur-adana-blau', 'tur-samsun', 'tur-antakya', 'tur-konya', 'tur-ankara-gelb-blau', 'tur-istanbul-karaguemruek', 'tur-istanbul-pendik', 'tur-istanbul-gelb-schwarz'],
    cup: 'tur-istanbul-schwarz-weiss', cupFinalist: 'tur-trabzon',
    euro: { cl: ['tur-istanbul-gelb-rot'], el: ['tur-istanbul-gelb-rot'], ecl: ['tur-istanbul-gelb-blau', 'tur-istanbul-schwarz-weiss', 'tur-adana-blau'] },
  },
  2024: {
    t1: ['tur-istanbul-gelb-rot', 'tur-istanbul-gelb-blau', 'tur-samsun', 'tur-istanbul-schwarz-weiss', 'tur-istanbul-basaksehir', 'tur-istanbul-eyuep', 'tur-trabzon', 'tur-izmir-gelb-rot', 'tur-rize', 'tur-istanbul-kasimpasa', 'tur-konya', 'tur-alanya', 'tur-kayseri', 'tur-gaziantep-sahinbey', 'tur-antalya', 'tur-bodrum', 'tur-sivas', 'tur-antakya', 'tur-adana-blau'],
    cup: 'tur-istanbul-gelb-rot', cupFinalist: 'tur-trabzon',
    euro: { cl: ['tur-istanbul-gelb-rot', 'tur-istanbul-gelb-blau'], el: ['tur-istanbul-gelb-rot', 'tur-istanbul-gelb-blau', 'tur-istanbul-schwarz-weiss', 'tur-trabzon'], ecl: ['tur-istanbul-basaksehir', 'tur-trabzon'] },
  },
  2025: {
    t1: ['tur-istanbul-gelb-rot', 'tur-istanbul-gelb-blau', 'tur-samsun', 'tur-istanbul-schwarz-weiss', 'tur-istanbul-basaksehir', 'tur-istanbul-eyuep', 'tur-trabzon', 'tur-izmir-gelb-rot', 'tur-rize', 'tur-istanbul-kasimpasa', 'tur-konya', 'tur-alanya', 'tur-kayseri', 'tur-gaziantep-sahinbey', 'tur-antalya', 'tur-izmit', 'tur-ankara-rot-schwarz', 'tur-istanbul-karaguemruek'],
    euro: { cl: ['tur-istanbul-gelb-rot', 'tur-istanbul-gelb-blau'], el: ['tur-samsun', 'tur-istanbul-schwarz-weiss', 'tur-istanbul-gelb-blau'], ecl: ['tur-istanbul-schwarz-weiss', 'tur-istanbul-basaksehir', 'tur-samsun'] },
    note: 'Laufende Saison: Zusammensetzung zu Saisonbeginn (Reihenfolge = Vorjahresplatz, Aufsteiger hinten)',
  },
};
