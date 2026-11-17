import { formatNow } from "../utils/date";
import { getNoteString } from "../utils/locale";
import { getPref } from "../utils/prefs";
import { yamlQuote } from "../utils/yaml";
import { type ItemAnnotation, collectAnnotations, collectChildNotes } from "./annotations";
import { resolveChapter } from "./chapters";

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
export async function renderChildNotes(item: Zotero.Item): Promise<string> {
  const notes = await collectChildNotes(item);
  if (!notes.length) {
    return "";
  }
  return `# ${getNoteString("notes-heading")}\n\n${notes.join("\n\n\n")}`;
}

/**
 * Body with the item's PDF highlights. Each highlighted text is written as a
 * quote and, below it, the annotation comment when present.
 */
export async function renderHighlights(item: Zotero.Item): Promise<string> {
  const noChapter: string[] = [];
  const groups = new Map<string, { title: string; blocks: string[] }>();
  const order: string[] = [];

  for (const annotation of await collectAnnotations(item)) {
    if (!annotation.text) {
      continue;
    }

    const block = formatHighlight(annotation);
    const chapter = await resolveChapter(annotation);
    if (!chapter) {
      noChapter.push(block);
      continue;
    }

    const key = `${annotation.attachmentID}:${chapter.key}`;
    let group = groups.get(key);
    if (!group) {
      group = { title: chapter.title, blocks: [] };
      groups.set(key, group);
      order.push(key);
    }
    group.blocks.push(block);
  }

  const sections: string[] = [];
  if (noChapter.length) {
    sections.push(noChapter.join("\n\n\n"));
  }
  for (const key of order) {
    const group = groups.get(key);
    if (group) {
      sections.push(`## ${group.title}\n\n${group.blocks.join("\n\n\n")}`);
    }
  }

  if (!sections.length) {
    return "";
  }
  return `# ${getNoteString("annotations-heading")}\n\n${sections.join("\n\n\n")}`;
}

function formatHighlight(annotation: ItemAnnotation): string {
  const parts = [`> ${annotation.text.replace(/\r?\n/g, "\n> ")}`];
  if (annotation.comment) {
    parts.push(annotation.comment);
  }
  return parts.join("\n\n");
}

/**
 * Body combining child notes and highlights, child notes first.
 */
export async function renderNotesAndHighlights(item: Zotero.Item): Promise<string> {
  const parts: string[] = [];
  const notes = await renderChildNotes(item);
  if (notes.trim()) {
    parts.push(notes);
  }
  const highlights = await renderHighlights(item);
  if (highlights.trim()) {
    parts.push(highlights);
  }
  return parts.join("\n\n\n");
}
