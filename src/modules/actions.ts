import { config } from "../../package.json";
import { getString } from "../utils/locale";
import { copyToClipboard } from "./clipboard";
import { generateCitation } from "./citation";
import {
  ZettelkastenError,
  getNotePath,
  noteExists,
  readNote,
  splitFrontmatter,
  writeNoteBody,
  writeNoteFile,
} from "./fileWriter";
import { renderBody, renderNote } from "./template";

export interface MenuContext {
  items: Zotero.Item[];
}

export interface MenuShowingContext extends MenuContext {
  setEnabled: (enabled: boolean) => void;
}

interface BuiltNote {
  content: string;
  cite: string;
}

function getTargetItem(context: MenuContext): Zotero.Item | null {
  const items = context?.items ?? [];
  if (items.length !== 1 || !items[0].isRegularItem()) {
    return null;
  }
  return items[0];
}

function buildNote(item: Zotero.Item): BuiltNote {
  const { citation, cite } = generateCitation(item);
  return {
    content: renderNote(item, { citation, cite }),
    cite,
  };
}

export async function runCopy(context: MenuContext): Promise<void> {
  const item = getTargetItem(context);
  if (!item) {
    alert(getString("no-item-selected"));
    return;
  }

  try {
    const note = buildNote(item);
    copyToClipboard(note.content);
    notify(getString("copied"));
  } catch (error) {
    alert(getString("error-generic", { error: String(error) }));
  }
}

export async function runCreateFile(context: MenuContext): Promise<void> {
  const item = getTargetItem(context);
  if (!item) {
    alert(getString("no-item-selected"));
    return;
  }

  try {
    const note = buildNote(item);
    const path = await writeNoteFile(note.cite, note.content);
    notify(getString("file-created", { path }));
  } catch (error) {
    if (error instanceof ZettelkastenError) {
      if (error.code === "no-output-dir") {
        alert(getString("error-no-output-dir"));
        return;
      }
      if (error.code === "file-exists") {
        alert(getString("error-file-exists", { path: error.message }));
        return;
      }
    }
    alert(getString("error-generic", { error: String(error) }));
  }
}

export async function runUpdateAnnotations(context: MenuContext): Promise<void> {
  const item = getTargetItem(context);
  if (!item) {
    alert(getString("no-item-selected"));
    return;
  }

  try {
    const path = getNotePath(generateCitation(item).cite);
    if (!path || !(await noteExists(path))) {
      alert(getString("error-file-not-created"));
      return;
    }

    const body = renderBody(item);
    if (!body.trim()) {
      notify(getString("no-annotations"));
      return;
    }

    const win = Zotero.getMainWindow();
    const confirmed = Services.prompt.confirm(
      win as any,
      config.addonName,
      getString("confirm-update"),
    );
    if (!confirmed) {
      return;
    }

    const parts = splitFrontmatter(await readNote(path));
    if (!parts) {
      alert(getString("error-no-frontmatter"));
      return;
    }

    await writeNoteBody(path, parts.frontmatter, body);
    notify(getString("file-updated", { path }));
  } catch (error) {
    alert(getString("error-generic", { error: String(error) }));
  }
}

export async function hasNoteFile(item: Zotero.Item): Promise<boolean> {
  try {
    const path = getNotePath(generateCitation(item).cite);
    return !!path && (await noteExists(path));
  } catch (error) {
    Zotero.debug(`Zotero Zettelkasten: ${error}`);
    return false;
  }
}

function alert(message: string): void {
  const win = Zotero.getMainWindow();
  if (win) {
    Services.prompt.alert(win as any, config.addonName, message);
  } else {
    Zotero.debug(`Zotero Zettelkasten: ${message}`);
  }
}

function notify(message: string): void {
  try {
    const progressWindow = new (Zotero as any).ProgressWindow({ closeOnClick: true });
    progressWindow.changeHeadline(config.addonName);
    progressWindow.addDescription(message);
    progressWindow.show();
    progressWindow.startCloseTimer(4000);
  } catch (error) {
    Zotero.debug(`Zotero Zettelkasten: ${message} (${error})`);
  }
}
