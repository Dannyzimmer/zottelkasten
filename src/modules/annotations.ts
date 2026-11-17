import { htmlToMarkdown } from "../utils/html";

export interface ItemAnnotation {
  comment: string;
  text: string;
}

/**
 * Make sure `childItems` data (attachments, notes and annotations) is loaded
 * for an item. Library items don't always have it loaded, and without it
 * `getAttachments()`, `getNotes()` and `getAnnotations()` return nothing.
 */
async function ensureChildItems(item: Zotero.Item): Promise<void> {
  try {
    await (item as any).loadDataType("childItems");
  } catch (error) {
    Zotero.debug(`Zotero Zettelkasten: could not load child items for ${item.id}: ${error}`);
  }
}

export async function collectAnnotations(item: Zotero.Item): Promise<ItemAnnotation[]> {
  const result: ItemAnnotation[] = [];

  await ensureChildItems(item);

  for (const attachmentID of item.getAttachments()) {
    const attachment = Zotero.Items.get(attachmentID);
    if (!attachment || !attachment.isFileAttachment()) {
      continue;
    }

    await ensureChildItems(attachment);

    const annotations = attachment
      .getAnnotations()
      .slice()
      .sort((a, b) => {
        const left = (a as any).annotationSortIndex ?? "";
        const right = (b as any).annotationSortIndex ?? "";
        return String(left).localeCompare(String(right));
      });

    for (const annotation of annotations) {
      result.push({
        comment: String((annotation as any).annotationComment || "").trim(),
        text: String((annotation as any).annotationText || "").trim(),
      });
    }
  }

  return result;
}

export async function collectChildNotes(item: Zotero.Item): Promise<string[]> {
  const notes: string[] = [];

  await ensureChildItems(item);

  for (const noteID of item.getNotes()) {
    const note = Zotero.Items.get(noteID);
    if (!note || !note.isNote()) {
      continue;
    }
    const markdown = htmlToMarkdown(note.getNote()).trim();
    if (markdown) {
      notes.push(markdown);
    }
  }

  return notes;
}
