import { config } from "../../package.json";
import { getString } from "../utils/locale";
import { setPref } from "../utils/prefs";

export async function registerPrefsPane(): Promise<void> {
  await Zotero.PreferencePanes.register({
    pluginID: config.addonID,
    label: "Zettelkasten",
    src: rootURI + "content/preferences.xhtml",
  });
}

export function onPrefsLoad(win: any): void {
  const doc = win?.document;
  if (!doc) {
    return;
  }

  const button = doc.getElementById(`${config.addonRef}-choose-folder`);
  if (button && !button.dataset.zettelkastenWired) {
    button.dataset.zettelkastenWired = "1";
    button.addEventListener("command", (event: Event) => chooseFolder(event));
  }
}

export async function chooseFolder(event: Event): Promise<void> {
  const target = event?.target as any;
  const win: any = target?.ownerGlobal ?? Zotero.getMainWindow();
  if (!win) {
    return;
  }

  const { FilePicker } = ChromeUtils.importESModule(
    "chrome://zotero/content/modules/filePicker.mjs",
  );

  const picker = new FilePicker();
  picker.init(win, getString("prefs-output-dir-label"), picker.modeGetFolder);
  const result = await picker.show();

  if (result !== picker.returnOK || !picker.file) {
    return;
  }

  const path: string = picker.file;
  setPref("outputDir", path);

  const input = win.document?.getElementById(`${config.addonRef}-output-dir`);
  if (input) {
    input.value = path;
  }
}
