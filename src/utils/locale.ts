import { config } from "../../package.json";

let localization: any;

function getLocalization(): any {
  if (!localization) {
    const Ctor: any =
      typeof Localization !== "undefined"
        ? Localization
        : (Zotero.getMainWindow() as any)?.Localization;
    localization = new Ctor([`${config.addonRef}-addon.ftl`], true);
  }
  return localization;
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

export function getLocaleID(id: string): string {
  return `${config.addonRef}-${id}`;
}
