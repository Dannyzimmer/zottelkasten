import { config } from "../../package.json";
import { getLocaleID } from "../utils/locale";
import {
  type MenuContext,
  type MenuShowingContext,
  hasNoteFile,
  runCopy,
  runCreateFile,
  runUpdateAnnotations,
} from "./actions";

const MENU_ICON = rootURI + "content/icons/menu-16.png";

let registeredMenuID: string | false = false;

export function registerMenu(): void {
  registeredMenuID = (Zotero as any).MenuManager.registerMenu({
    menuID: "item-menu",
    pluginID: config.addonID,
    target: "main/library/item",
    menus: [
      {
        menuType: "menuitem",
        l10nID: getLocaleID("menu-copy"),
        icon: MENU_ICON,
        onCommand: (_event: Event, context: MenuContext) => runCopy(context),
      },
      {
        menuType: "menuitem",
        l10nID: getLocaleID("menu-create-file"),
        icon: MENU_ICON,
        onCommand: (_event: Event, context: MenuContext) => runCreateFile(context),
      },
      {
        menuType: "menuitem",
        l10nID: getLocaleID("menu-update"),
        icon: MENU_ICON,
        onShowing: (_event: Event, context: MenuShowingContext) => {
          const items = context.items ?? [];
          const item = items.length === 1 && items[0].isRegularItem() ? items[0] : null;
          if (!item) {
            context.setEnabled(false);
            return;
          }
          hasNoteFile(item)
            .then((exists) => context.setEnabled(!!exists))
            .catch(() => context.setEnabled(false));
        },
        onCommand: (_event: Event, context: MenuContext) => runUpdateAnnotations(context),
      },
    ],
  });
}

export function unregisterMenu(): void {
  if (registeredMenuID) {
    (Zotero as any).MenuManager.unregisterMenu(registeredMenuID);
    registeredMenuID = false;
  }
}
