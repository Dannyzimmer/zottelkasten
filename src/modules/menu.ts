import { config } from "../../package.json";
import { getLocaleID } from "../utils/locale";
import { type MenuContext, runCopy, runCreateFile } from "./actions";

export function registerMenu(): void {
  (Zotero as any).MenuManager.registerMenu({
    pluginID: config.addonID,
    target: "main/library/item",
    menus: [
      {
        menuType: "menuitem",
        l10nID: getLocaleID("menu-copy"),
        onCommand: (_event: Event, context: MenuContext) => runCopy(context),
      },
      {
        menuType: "menuitem",
        l10nID: getLocaleID("menu-create-file"),
        onCommand: (_event: Event, context: MenuContext) => runCreateFile(context),
      },
    ],
  });
}

export function unregisterMenu(): void {
  (Zotero as any).MenuManager.unregisterMenu(config.addonID);
}
