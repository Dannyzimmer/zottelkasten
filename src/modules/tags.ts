import { getPref } from "../utils/prefs";
import { yamlQuote } from "../utils/yaml";

const SAFE_TAG = /^[A-Za-z0-9_./-]+$/;

function normalizeTag(value: string): string {
  return value.replace(/^#+/, "").trim();
}

function stripQuotes(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).replace(/\\(["\\])/g, "$1");
  }
  return trimmed;
}

function parseScalarList(text: string): string[] {
  const items: string[] = [];
  let current = "";
  let quote: string | null = null;
  let escaped = false;

  for (const ch of text) {
    if (escaped) {
      current += ch;
      escaped = false;
      continue;
    }
    if (quote) {
      if (ch === "\\" && quote === '"') {
        escaped = true;
        current += ch;
        continue;
      }
      if (ch === quote) {
        quote = null;
        current += ch;
        continue;
      }
      current += ch;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
      continue;
    }
    if (ch === ",") {
      items.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  items.push(current);

  return items.map(stripQuotes).map(normalizeTag).filter(Boolean);
}

function mergeTagList(existing: string[], incoming: string[]): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  for (const tag of [...existing, ...incoming]) {
    const value = normalizeTag(tag);
    const key = value.toLocaleLowerCase();
    if (!value || seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(value);
  }

  return result;
}

function formatTag(tag: string): string {
  return SAFE_TAG.test(tag) ? tag : yamlQuote(tag);
}

export function getManualTags(item: Zotero.Item): string[] {
  const tags: string[] = [];
  for (const tag of item.getTags()) {
    // Zotero omits `type` for manual tags; only automatic tags have type 1.
    if (tag.type === 1) {
      continue;
    }
    const value = normalizeTag(tag.tag);
    if (value) {
      tags.push(value);
    }
  }
  return tags;
}

export function mergeItemTags(frontmatter: string, item: Zotero.Item): string {
  if (!getPref("addTags")) {
    return frontmatter;
  }
  return mergeTagsIntoFrontmatter(frontmatter, getManualTags(item));
}

/**
 * Merge tags into the `tags` entry of a YAML frontmatter block, preserving
 * existing tags and avoiding duplicates. Only the tags entry is rewritten.
 */
export function mergeTagsIntoFrontmatter(frontmatter: string, tags: string[]): string {
  const incoming = mergeTagList([], tags);
  if (!incoming.length) {
    return frontmatter;
  }

  const lines = frontmatter.split("\n");
  if (lines[0]?.trim() !== "---") {
    return frontmatter;
  }

  let close = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      close = i;
      break;
    }
  }
  if (close === -1) {
    return frontmatter;
  }

  let tagsIndex = -1;
  for (let i = 1; i < close; i++) {
    if (/^tags\s*:/i.test(lines[i])) {
      tagsIndex = i;
      break;
    }
  }

  const block = (values: string[]) => ["tags:", ...values.map((tag) => `  - ${formatTag(tag)}`)];

  if (tagsIndex === -1) {
    lines.splice(close, 0, ...block(incoming));
    return lines.join("\n");
  }

  const rest = lines[tagsIndex].replace(/^tags\s*:/i, "").trim();
  let endIndex = tagsIndex;
  let existing: string[] = [];

  if (rest && !/^(null|~)$/i.test(rest)) {
    const inner = rest.startsWith("[") && rest.endsWith("]") ? rest.slice(1, -1) : rest;
    existing = parseScalarList(inner);
  } else if (!rest) {
    let i = tagsIndex + 1;
    while (i < close) {
      const match = lines[i].match(/^\s*-\s+(.*)$/);
      if (!match) {
        break;
      }
      existing.push(stripQuotes(match[1]));
      endIndex = i;
      i++;
    }
  }

  const merged = mergeTagList(existing, incoming);
  lines.splice(tagsIndex, endIndex - tagsIndex + 1, ...block(merged));
  return lines.join("\n");
}
