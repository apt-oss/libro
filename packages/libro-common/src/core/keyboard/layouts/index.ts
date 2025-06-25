
import en_US_mac_data from './en-US-mac.js';
import en_US_pc_data from './en-US-pc.js';

export const en_US_mac = en_US_mac_data as any;
export const en_US_pc = en_US_pc_data as any;

export const layoutRawDataLoader: Record<string, any> = {
  'en-US-pc': ()=>import('./en-US-pc.js'),
  'en-US-mac': ()=>import('./en-US-mac.js'),
  // 'en-Dvorak-pc': ()=>import('./en-Dvorak-pc.js'),
  // 'en-Dvorak-mac': ()=>import('./en-Dvorak-mac.js'),
  // 'en-Dvorak_Lefthanded-pc': ()=>import('./en-Dvorak_Lefthanded-pc.js'),
  // 'en-Dvorak_Lefthanded-mac': ()=>import('./en-Dvorak_Lefthanded-mac.js'),
  // 'en-Dvorak_Righthanded-pc': ()=>import('./en-Dvorak_Righthanded-pc.js'),
  // 'en-Dvorak_Righthanded-mac': ()=>import('./en-Dvorak_Righthanded-mac.js'),
  // 'en-Colemak-mac': ()=>import('./en-Colemak-mac.js'),
  // 'en-British-pc': ()=>import('./en-British-pc.js'),
  // 'en-British-mac': ()=>import('./en-British-mac.js'),
  // 'de-German-pc': ()=>import('./de-German-pc.js'),
  // 'de-German-mac': ()=>import('./de-German-mac.js'),
  // 'de-Swiss_German-pc': ()=>import('./de-Swiss_German-pc.js'),
  // 'de-Swiss_German-mac': ()=>import('./de-Swiss_German-mac.js'),
  // 'fr-French-pc': ()=>import('./fr-French-pc.js'),
  // 'fr-French-mac': ()=>import('./fr-French-mac.js'),
  // 'fr-Canadian_French-pc': ()=>import('./fr-Canadian_French-pc.js'),
  // 'fr-Canadian_French-mac': ()=>import('./fr-Canadian_French-mac.js'),
  // 'fr-Swiss_French-pc': ()=>import('./fr-Swiss_French-pc.js'),
  // 'fr-Swiss_French-mac': ()=>import('./fr-Swiss_French-mac.js'),
  // 'fr-Bepo-pc': ()=>import('./fr-Bepo-pc.js'),
  // 'pt-Portuguese-pc': ()=>import('./pt-Portuguese-pc.js'),
  // 'pt-Portuguese-mac': ()=>import('./pt-Portuguese-mac.js'),
  // 'pt-Brazilian-mac': ()=>import('./pt-Brazilian-mac.js'),
  // 'pl-Polish-pc': ()=>import('./pl-Polish-pc.js'),
  // 'pl-Polish-mac': ()=>import('./pl-Polish-mac.js'),
  // 'nl-Dutch-pc': ()=>import('./nl-Dutch-pc.js'),
  // 'nl-Dutch-mac': ()=>import('./nl-Dutch-mac.js'),
  // 'es-Spanish-pc': ()=>import('./es-Spanish-pc.js'),
  // 'es-Spanish-mac': ()=>import('./es-Spanish-mac.js'),
  // 'it-Italian-pc': ()=>import('./it-Italian-pc.js'),
  // 'it-Italian-mac': ()=>import('./it-Italian-mac.js'),
  // 'sv-Swedish-pc': ()=>import('./sv-Swedish-pc.js'),
  // 'sv-Swedish-mac': ()=>import('./sv-Swedish-mac.js'),
  // 'tr-Turkish_Q-pc': ()=>import('./tr-Turkish_Q-pc.js'),
  // 'tr-Turkish_Q-mac': ()=>import('./tr-Turkish_Q-mac.js'),
  // 'cs-Czech-pc': ()=>import('./cs-Czech-pc.js'),
  // 'cs-Czech-mac': ()=>import('./cs-Czech-mac.js'),
  // 'ro-Romanian-pc': ()=>import('./ro-Romanian-pc.js'),
  // 'ro-Romanian-mac': ()=>import('./ro-Romanian-mac.js'),
  // 'da-Danish-pc': ()=>import('./da-Danish-pc.js'),
  // 'da-Danish-mac': ()=>import('./da-Danish-mac.js'),
  // 'nb-Norwegian-pc': ()=>import('./nb-Norwegian-pc.js'),
  // 'nb-Norwegian-mac': ()=>import('./nb-Norwegian-mac.js'),
  // 'hu-Hungarian-pc': ()=>import('./hu-Hungarian-pc.js'),
  // 'hu-Hungarian-mac': ()=>import('./hu-Hungarian-mac.js'),
};



