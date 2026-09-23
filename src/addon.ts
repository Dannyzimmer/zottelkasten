import { config, version } from "../package.json";
import hooks from "./hooks";

class Addon {
  readonly data = {
    initialized: false,
    id: config.addonID,
    version,
    rootURI,
    alive: true,
  };

  readonly hooks = hooks;

  log(message: string, ...args: unknown[]): void {
    const extra = args.length ? ` ${args.map((arg) => String(arg)).join(" ")}` : "";
    Zotero.debug(`[${config.addonName}] ${message}${extra}`);
  }
}

export default Addon;
