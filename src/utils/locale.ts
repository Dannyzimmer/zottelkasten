import { config } from "../../package.json";
import { getPref } from "./prefs";

let localization: any;
const noteLocalizations = new Map<string, any>();

const NOTE_STRING_FALLBACKS: Record<string, Record<string, string>> = {
  "en-US": {
    "notes-heading": "Notes",
    "annotations-heading": "Annotations",
  },
  "es-ES": {
    "notes-heading": "Notas",
    "annotations-heading": "Anotaciones",
  },
};

function getLocalizationCtor(): any {
  return typeof Localization !== "undefined"
    ? Localization
    : (Zotero.getMainWindow() as any)?.Localization;
}

function getLocalization(): any {
  if (!localization) {
    localization = new (getLocalizationCtor())([`${config.addonRef}-addon.ftl`], true);
  }
  return localization;
}

function getNoteLocalization(lang: string): any {
  let l10n = noteLocalizations.get(lang);
  if (!l10n) {
    l10n = new (getLocalizationCtor())([`${config.addonRef}-addon.ftl`], true, undefined, [lang]);
    noteLocalizations.set(lang, l10n);
  }
  return l10n;
}

export function initLocale(): void {
  getLocalization();
}

export function getString(id: string, args?: Record<string, unknown>): string {
  const fullId = `${config.addonRef}-${id}`;
  try {
    return getLocalization().formatValueSync(fullId, args) || fullId;
  } catch (e) {
    Zotero.debug(`Zotero Zettelkasten: Failed to localize '${fullId}': ${e}`);
    return fullId;
  }
}

/**
 * Localized string for the generated note body, honoring the note-language
 * preference. Defaults to Zotero's language when set to "auto".
 */
export function getNoteString(id: string, args?: Record<string, unknown>): string {
  const lang = String(getPref("noteLanguage") || "auto");
  if (!lang || lang === "auto") {
    return getString(id, args);
  }

  const fullId = `${config.addonRef}-${id}`;
  try {
    const value = getNoteLocalization(lang).formatValueSync(fullId, args);
    if (value && value !== fullId) {
      return value;
    }
  } catch (e) {
    Zotero.debug(`Zotero Zettelkasten: Failed to localize '${fullId}' for '${lang}': ${e}`);
  }

  return NOTE_STRING_FALLBACKS[lang]?.[id] ?? getString(id, args);
}

export function getLocaleID(id: string): string {
  return `${config.addonRef}-${id}`;
}
