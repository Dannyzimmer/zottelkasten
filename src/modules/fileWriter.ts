import { getPref } from "../utils/prefs";

const INVALID_FILENAME_CHARS = /[\\/:*?"<>|]/g;

export class ZettelkastenError extends Error {
  constructor(
    public readonly code: string,
    message?: string,
  ) {
    super(message ?? code);
    this.name = "ZettelkastenError";
  }
}

export function sanitizeFileName(name: string): string {
  const cleaned = name.replace(INVALID_FILENAME_CHARS, "").replace(/\s+/g, " ").trim();
  return cleaned || "sin-titulo";
}

export function getOutputDir(): string {
  return String(getPref("outputDir") || "").trim();
}

/**
 * Resolve the note path for a given `cite` string, or null when no output
 * folder is configured.
 */
export function getNotePath(cite: string): string | null {
  const outputDir = getOutputDir();
  if (!outputDir) {
    return null;
  }
  return PathUtils.join(outputDir, `${sanitizeFileName(cite)}.md`);
}

export async function noteExists(path: string): Promise<boolean> {
  return IOUtils.exists(path);
}

export async function readNote(path: string): Promise<string> {
  return IOUtils.readUTF8(path);
}

export async function writeNoteFile(cite: string, content: string): Promise<string> {
  const path = getNotePath(cite);
  if (!path) {
    throw new ZettelkastenError("no-output-dir");
  }

  if (await IOUtils.exists(path)) {
    throw new ZettelkastenError("file-exists", path);
  }

  await IOUtils.writeUTF8(path, content);
  return path;
}

/**
 * Split a note into its YAML frontmatter (including the delimiters) and body.
 * Returns null when the file does not start with a `---` frontmatter block.
 */
export function splitFrontmatter(content: string): { frontmatter: string; body: string } | null {
  const lines = content.replace(/^\uFEFF/, "").split("\n");
  if (lines[0]?.trim() !== "---") {
    return null;
  }

  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      end = i;
      break;
    }
  }
  if (end === -1) {
    return null;
  }

  return {
    frontmatter: lines.slice(0, end + 1).join("\n"),
    body: lines.slice(end + 1).join("\n"),
  };
}

/**
 * Replace the body of a note, preserving its frontmatter.
 */
export async function writeNoteBody(
  path: string,
  frontmatter: string,
  body: string,
): Promise<void> {
  const trimmed = body.trim();
  const content = trimmed ? `${frontmatter}\n\n${trimmed}` : frontmatter;
  await IOUtils.writeUTF8(path, content);
}
