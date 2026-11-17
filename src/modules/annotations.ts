import { htmlToMarkdown } from "../utils/html";

export type AttachmentType = "pdf" | "epub" | "other";

export interface ItemAnnotation {
  comment: string;
  text: string;
  attachmentID: number;
  attachmentType: AttachmentType;
  pageIndex: number | null;
  cfi: string | null;
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

    const attachmentType: AttachmentType = attachment.isPDFAttachment()
      ? "pdf"
      : (attachment as any).isEPUBAttachment?.()
        ? "epub"
        : "other";

    const annotations = attachment
      .getAnnotations()
      .slice()
      .sort((a, b) => {
        const left = (a as any).annotationSortIndex ?? "";
        const right = (b as any).annotationSortIndex ?? "";
        return String(left).localeCompare(String(right));
      });

    for (const annotation of annotations) {
      let position: any = null;
      try {
        position = JSON.parse((annotation as any).annotationPosition || "null");
      } catch (error) {
        Zotero.debug(`Zotero Zettelkasten: invalid annotation position: ${error}`);
      }

      const pageIndex = typeof position?.pageIndex === "number" ? position.pageIndex : null;
      const cfi =
        position?.type === "FragmentSelector" && typeof position?.value === "string"
          ? position.value
          : null;

      result.push({
        comment: String((annotation as any).annotationComment || "").trim(),
        text: String((annotation as any).annotationText || "").trim(),
        attachmentID,
        attachmentType,
        pageIndex,
        cfi,
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
