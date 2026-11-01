// =============================================================================
// SPONSORING 2.0 — fiktive, epochentypische Firmen je Branche und Herkunftsland.
// Bewusst keine echten Marken. `from`/`to` = Jahre, in denen die Firma auftritt.
// =============================================================================
import type { SponsorIndustry } from '../types/sponsor';

export interface SponsorFirm { name: string; country: string; from?: number; to?: number }

const F = (name: string, country = 'DE', from?: number, to?: number): SponsorFirm => ({ name, country, from, to });

export const SPONSOR_FIRMS: Record<SponsorIndustry, SponsorFirm[]> = {
  spirituosen: [F('Hubertus Kräuterlikör'), F('Alt-Hansa Korn'), F('Kapitänsbitter'), F('Doppelkorn Westfalia'), F('Amaro Vesuvio', 'IT'), F('Weinbrand Rheingold')],
  brauerei: [F('Bavaria Bräu'), F('Rheinperle Pils'), F('Sonnen-Brauerei'), F('Hanse Bräu'), F('Klosterquell'), F('Bergbräu'), F('Lindenhof Export'), F('Oranje Bier', 'NL')],
  tabak: [F('Kapitän Zigaretten'), F('Ambassador Tabak'), F('Golden Mile'), F('Pfeifenhaus Nordtabak')],
  versicherung: [F('Nordsee Versicherung'), F('Hanse Leben'), F('Merkur Assekuranz'), F('Rheinland Versicherungen'), F('Alpina Rück', 'CH'), F('Securitas Mutuelle', 'FR'), F('Atlantis Insurance', 'GB')],
  bank: [F('Merkur Bank'), F('Volkskasse'), F('Rheinische Hypo'), F('Stadtsparkasse'), F('Helvetia Privatbank', 'CH'), F('Bosporus Bank', 'TR'), F('Pearl Gulf Bank', 'QA'), F('Oranje Bank', 'NL')],
  auto: [F('Adler Automobile'), F('Kronwagen'), F('Ruhrwagen'), F('Sternmobil Autohäuser'), F('Turino Motori', 'IT'), F('Lumière Automobiles', 'FR'), F('Hayashi Motors', 'JP'), F('Hanmoo Motors', 'KR'), F('Dragon Auto', 'CN', 2015)],
  elektronik: [F('Hansa Elektro'), F('Telefunk-Werke'), F('Nordmende Radio'), F('Kaiyo Denki', 'JP', 1978), F('Shinrai Electronics', 'JP', 1978), F('Asahina Audio', 'JP', 1978), F('Atlas Computers', 'US', 1980, 1995), F('Orion Micro', 'US', 1982, 2000), F('Philtron', 'NL'), F('Hanbit Electronics', 'KR', 1995), F('Huaxing Electronics', 'CN', 2012)],
  handel: [F('Allmarkt'), F('Kaufring'), F('Union Möbel'), F('Bauhaus Weber'), F('Elektro-Discount Blitz', 'DE', 1990), F('Anadolu Market', 'TR')],
  bau: [F('Ruhr-Bau'), F('Rheinland Immobilien'), F('Hochtief Weser'), F('Al-Nahda Construction', 'AE')],
  chemie: [F('Phoenix Chemie'), F('Rheinmetallwerke'), F('Ruhrkohle Werke', 'DE', 1975, 2005), F('Continental Gummi')],
  lebensmittel: [F('Sonnen Molkerei'), F('Weltmarke Kaffee'), F('Nordland Fisch'), F('Schoko Lindau'), F('Pasta Fiorentina', 'IT'), F('Alpenmilch', 'CH'), F('Golden Cola', 'US')],
  pharma: [F('Rhein-Pharma'), F('Medivita'), F('Alpenapotheke Pharma', 'CH')],
  sportartikel: [F('Gepard Sport'), F('Nordstern Sportswear'), F('Herzog Sport'), F('Linea Atletica', 'IT'), F('Vantor Athletics', 'US', 1985), F('Coq Bleu', 'FR')],
  logistik: [F('Paketblitz', 'DE', 1990), F('Hanse Logistik'), F('Nordkurier Express'), F('Speedline Cargo', 'NL')],
  telekom: [F('Telenova', 'DE', 1992), F('Funknetz D-Plus', 'DE', 1992), F('Mobilis', 'DE', 1996), F('Kabelwelt', 'DE', 1996), F('Hanbit Mobile', 'KR', 2000), F('Huaxing Mobile', 'CN', 2012)],
  energie: [F('Rheinstrom', 'DE', 1998), F('Lumen Energie', 'DE', 1998), F('Nordgas', 'DE', 1998), F('Stadtwerke Plus', 'DE', 1998), F('Uralgas Export', 'RU', 2006, 2021), F('Pearl Energy', 'QA', 2011), F('Desert Petroleum', 'SA', 2023)],
  tech: [F('Netzwerk AG', 'DE', 1998), F('Datawerk', 'DE', 2000), F('Cloudhaven', 'US', 2008), F('Bytestream', 'US', 2010), F('Longyuan Tech', 'CN', 2012), F('Kaiyo Digital', 'JP', 2010), F('Hanbit Cloud', 'KR', 2012)],
  online: [F('Klickhaus.de', 'DE', 1999), F('Fanbox24', 'DE', 2005), F('Modeplatz', 'DE', 2010), F('Shopwelt', 'US', 2008), F('Dragon Mall', 'CN', 2014), F('Bitmarkt Online', 'NL', 2008)],
  airline: [F('Hansa Charter', 'DE', 2000), F('Sky Alpin', 'DE', 2000), F('Al-Sahra Airways', 'AE', 2004), F('Gulf Crown Air', 'AE', 2004), F('Doha Pearl Airways', 'QA', 2011), F('Anadolu Air', 'TR', 2005), F('Desert Wings', 'SA', 2023)],
  staatsfonds: [F('Discover Doha', 'QA', 2011), F('Pearl Investment Authority', 'QA', 2011), F('Visit Al-Ain', 'AE', 2011), F('Desert Vision Fund', 'SA', 2023), F('Invest Rheinland', 'DE', 2011)],
  wetten: [F('Topwette', 'DE', 2005), F('Bet-Arena', 'MT', 2005), F('Valletta Bet', 'MT', 2005), F('Quotenkönig', 'DE', 2012), F('Royal Odds', 'GB', 2012)],
  krypto: [F('CoinVault', 'US', 2021), F('BitArena', 'MT', 2021), F('Nexchange', 'US', 2021), F('FanToken Hub', 'MT', 2021)],
};
