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
import { composeBody, splitBodyForUpdate } from "./manualContent";
import { mergeItemTags } from "./tags";
import {
  renderChildNotes,
  renderHighlights,
  renderNote,
  renderNotesAndHighlights,
} from "./template";

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

export async function runCopyNotes(context: MenuContext): Promise<void> {
  await copyBody(context, renderChildNotes, "no-notes", "copied-notes");
}

export async function runCopyHighlights(context: MenuContext): Promise<void> {
  await copyBody(context, renderHighlights, "no-highlights", "copied-highlights");
}

export async function runUpdateNotes(context: MenuContext): Promise<void> {
  await updateBody(context, renderChildNotes, "no-notes");
}

export async function runUpdateHighlights(context: MenuContext): Promise<void> {
  await updateBody(context, renderHighlights, "no-highlights");
}

export async function runUpdateNotesAndHighlights(context: MenuContext): Promise<void> {
  await updateBody(context, renderNotesAndHighlights, "no-content");
}

async function copyBody(
  context: MenuContext,
  getBody: (item: Zotero.Item) => Promise<string>,
  emptyKey: string,
  copiedKey: string,
): Promise<void> {
  const item = getTargetItem(context);
  if (!item) {
    alert(getString("no-item-selected"));
    return;
  }

  try {
    const body = await getBody(item);
    if (!body.trim()) {
      notify(getString(emptyKey));
      return;
    }
    copyToClipboard(body);
    notify(getString(copiedKey));
  } catch (error) {
    alert(getString("error-generic", { error: String(error) }));
  }
}

async function updateBody(
  context: MenuContext,
  getBody: (item: Zotero.Item) => Promise<string>,
  emptyKey: string,
): Promise<void> {
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

    const body = await getBody(item);
    if (!body.trim()) {
      notify(getString(emptyKey));
      return;
    }

    const parts = splitFrontmatter(await readNote(path));
    if (!parts) {
      alert(getString("error-no-frontmatter"));
      return;
    }

    const sections = splitBodyForUpdate(parts.body);

    const win = Zotero.getMainWindow();
    const confirmed = Services.prompt.confirm(
      win as any,
      config.addonName,
      getString(sections.hasEndMarker ? "confirm-update-marker" : "confirm-update"),
    );
    if (!confirmed) {
      return;
    }

    await writeNoteBody(path, mergeItemTags(parts.frontmatter, item), composeBody(body, sections));
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
