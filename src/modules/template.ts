import { formatNow } from "../utils/date";
import { getPref } from "../utils/prefs";
import { yamlQuote } from "../utils/yaml";
import { collectAnnotations, collectChildNotes } from "./annotations";

export interface RenderData {
  citation: string;
  cite: string;
}

export function renderNote(item: Zotero.Item, data: RenderData, body = ""): string {
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

  const trimmedBody = body.trim();
  if (trimmedBody) {
    output = `${output.replace(/\s*$/, "")}\n\n\n${trimmedBody}`;
  }

  return output;
}

/**
 * Body with only the item's Zotero child notes.
 */
export function renderChildNotes(item: Zotero.Item): string {
  return collectChildNotes(item).join("\n\n\n");
}

/**
 * Body with the item's PDF highlights. Each highlighted text is written as a
 * quote and, below it, the annotation comment when present.
 */
export function renderHighlights(item: Zotero.Item): string {
  const blocks: string[] = [];

  for (const annotation of collectAnnotations(item)) {
    if (!annotation.text) {
      continue;
    }
    const parts = [`> ${annotation.text.replace(/\r?\n/g, "\n> ")}`];
    if (annotation.comment) {
      parts.push(annotation.comment);
    }
    blocks.push(parts.join("\n\n"));
  }

  return blocks.join("\n\n\n");
}
