import { formatNow } from "../utils/date";
import { getPref } from "../utils/prefs";
import type { ItemAnnotation } from "./annotations";

export interface RenderData {
  citation: string;
  cite: string;
  annotations: ItemAnnotation[];
}

export function renderNote(item: Zotero.Item, data: RenderData): string {
  const template = getPref("template") || "";
  const title = String(item.getField("title") ?? "");

  let output = template
    .replace(/\{\{title\}\}/g, title)
    .replace(/\{\{citation\}\}/g, data.citation)
    .replace(/\{\{cite\}\}/g, data.cite)
    .replace(/\{\{date:([^}]+)\}\}/g, (_match, pattern: string) => formatNow(pattern));

  const blocks = buildAnnotationBlocks(data.annotations);
  if (blocks) {
    output = `${output.replace(/\s*$/, "")}\n\n\n${blocks}`;
  }

  return output;
}

function buildAnnotationBlocks(annotations: ItemAnnotation[]): string {
  const showComments = getPref("showComments");
  const showHighlights = getPref("showHighlights");
  const blocks: string[] = [];

  for (const annotation of annotations) {
    const parts: string[] = [];
    if (showComments && annotation.comment) {
      parts.push(annotation.comment);
    }
    if (showHighlights && annotation.text) {
      parts.push(`> ${annotation.text.replace(/\r?\n/g, "\n> ")}`);
    }
    if (parts.length) {
      blocks.push(parts.join("\n\n"));
    }
  }

  return blocks.join("\n\n\n");
}
