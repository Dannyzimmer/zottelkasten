import { formatNow } from "../utils/date";
import { getPref } from "../utils/prefs";
import { yamlQuote } from "../utils/yaml";
import { collectAnnotations, collectChildNotes, type ItemAnnotation } from "./annotations";

export interface RenderData {
  citation: string;
  cite: string;
}

export function renderNote(item: Zotero.Item, data: RenderData): string {
  const template = getPref("template") || "";
  const title = String(item.getField("title") ?? "");

  // Values are emitted as YAML-quoted scalars. Both `"{{x}}"` and `{{x}}` are
  // accepted, so existing templates with or without quotes stay valid.
  let output = template
    .replace(/"\{\{title\}\}"/g, yamlQuote(title))
    .replace(/\{\{title\}\}/g, yamlQuote(title))
    .replace(/"\{\{citation\}\}"/g, yamlQuote(data.citation))
    .replace(/\{\{citation\}\}/g, yamlQuote(data.citation))
    .replace(/"\{\{cite\}\}"/g, yamlQuote(data.cite))
    .replace(/\{\{cite\}\}/g, yamlQuote(data.cite))
    .replace(/\{\{date:([^}]+)\}\}/g, (_match, pattern: string) => formatNow(pattern));

  const body = renderBody(item);
  if (body) {
    output = `${output.replace(/\s*$/, "")}\n\n\n${body}`;
  }

  return output;
}

/**
 * Build the note body from the item's PDF annotations and child notes.
 * Always re-collected, so it can be reused to refresh an existing file.
 */
export function renderBody(item: Zotero.Item): string {
  const blocks: string[] = [];
  blocks.push(...buildAnnotationBlocks(collectAnnotations(item)));
  blocks.push(...collectChildNotes(item));
  return blocks.join("\n\n\n");
}

function buildAnnotationBlocks(annotations: ItemAnnotation[]): string[] {
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

  return blocks;
}
