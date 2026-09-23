import { config } from "../package.json";
import { registerMenu, unregisterMenu } from "./modules/menu";
import { chooseFolder, onPrefsLoad, registerPrefsPane } from "./modules/preferences";
import { initLocale } from "./utils/locale";

function onMainWindowLoad(win: _ZoteroTypes.MainWindow): void {
  win.MozXULElement?.insertFTLIfNeeded(`${config.addonRef}-mainWindow.ftl`);
}

const hooks = {
  async onStartup(): Promise<void> {
    await Promise.all([Zotero.initializationPromise, Zotero.uiReadyPromise]);

    initLocale();
    await registerPrefsPane();
    registerMenu();

    // Zotero only calls window hooks for windows opened after startup, so load
    // the window resources into any already-open main window ourselves.
    for (const win of Zotero.getMainWindows()) {
      onMainWindowLoad(win);
    }

    (Zotero as any)[config.addonInstance].data.initialized = true;
  },

  onMainWindowLoad,

  onMainWindowUnload(_win: _ZoteroTypes.MainWindow): void {},

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
