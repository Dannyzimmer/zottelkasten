import { config } from "../package.json";
import { registerMenu, unregisterMenu } from "./modules/menu";
import { chooseFolder, onPrefsLoad, registerPrefsPane } from "./modules/preferences";
import { initLocale } from "./utils/locale";

const hooks = {
  async onStartup(): Promise<void> {
    await Promise.all([Zotero.initializationPromise, Zotero.uiReadyPromise]);

    initLocale();
    await registerPrefsPane();
    registerMenu();

    (Zotero as any)[config.addonInstance].data.initialized = true;
  },

  onMainWindowLoad(win: Window): void {
    (win as any).MozXULElement?.insertFTLIfNeeded(`${config.addonRef}-mainWindow.ftl`);
  },

  onMainWindowUnload(_win: Window): void {},

  onShutdown(): void {
    unregisterMenu();
    const zotero = Zotero as any;
    if (zotero[config.addonInstance]) {
      zotero[config.addonInstance].data.alive = false;
    }
    delete zotero[config.addonInstance];
  },

  chooseFolder,
  onPrefsLoad,
};

export default hooks;
