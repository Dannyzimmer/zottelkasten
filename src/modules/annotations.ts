import { htmlToMarkdown } from "../utils/html";

export interface ItemAnnotation {
  comment: string;
  text: string;
}

export function collectAnnotations(item: Zotero.Item): ItemAnnotation[] {
  const result: ItemAnnotation[] = [];

  for (const attachmentID of item.getAttachments()) {
    const attachment = Zotero.Items.get(attachmentID);
    if (!attachment || !attachment.isPDFAttachment()) {
      continue;
    }

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

export function collectChildNotes(item: Zotero.Item): string[] {
  const notes: string[] = [];

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
