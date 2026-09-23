var chromeHandle;

function log(msg) {
  Zotero.debug(`Zotero Zettelkasten: ${msg}`);
}

function install() {
  log("Installed");
}

async function startup({ id, version, rootURI }, reason) {
  log("Starting");

  var aomStartup = Components.classes["@mozilla.org/addons/addon-manager-startup;1"].getService(
    Components.interfaces.amIAddonManagerStartup,
  );
  var manifestURI = Services.io.newURI(rootURI + "manifest.json");
  chromeHandle = aomStartup.registerChrome(manifestURI, [
    ["content", "__addonRef__", rootURI + "content/"],
  ]);

  const ctx = { rootURI };
  ctx._globalThis = ctx;

  Services.scriptloader.loadSubScript(`${rootURI}content/scripts/__addonRef__.js`, ctx);
  await Zotero.__addonInstance__.hooks.onStartup();
}

async function onMainWindowLoad({ window }, reason) {
  await Zotero.__addonInstance__?.hooks.onMainWindowLoad(window);
}

async function onMainWindowUnload({ window }, reason) {
  await Zotero.__addonInstance__?.hooks.onMainWindowUnload(window);
}

async function shutdown({ id, version, rootURI }, reason) {
  if (reason === APP_SHUTDOWN) {
    return;
  }

  await Zotero.__addonInstance__?.hooks.onShutdown();

  if (chromeHandle) {
    chromeHandle.destruct();
    chromeHandle = null;
  }
}

function uninstall() {
  log("Uninstalled");
}
