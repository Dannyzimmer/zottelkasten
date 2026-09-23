import { config } from "../../package.json";

type PluginPrefsMap = _ZoteroTypes.Prefs["PluginPrefsMap"];

const PREFIX = config.prefsPrefix;

export function getPref<K extends keyof PluginPrefsMap>(key: K): PluginPrefsMap[K] {
  return Zotero.Prefs.get(`${PREFIX}.${key}`, true) as PluginPrefsMap[K];
}

export function setPref<K extends keyof PluginPrefsMap>(key: K, value: PluginPrefsMap[K]) {
  Zotero.Prefs.set(`${PREFIX}.${key}`, value as string | number | boolean, true);
}
