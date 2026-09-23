import { config } from "../package.json";
import Addon from "./addon";

const zotero = Zotero as any;

if (!zotero[config.addonInstance]) {
  zotero[config.addonInstance] = new Addon();
  _globalThis.addon = zotero[config.addonInstance];
}

export default zotero[config.addonInstance];
