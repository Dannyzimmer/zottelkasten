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

export async function writeNoteFile(cite: string, content: string): Promise<string> {
  const outputDir = String(getPref("outputDir") || "").trim();
  if (!outputDir) {
    throw new ZettelkastenError("no-output-dir");
  }

  const filename = `${sanitizeFileName(cite)}.md`;
  const path = PathUtils.join(outputDir, filename);

  if (await IOUtils.exists(path)) {
    throw new ZettelkastenError("file-exists", path);
  }

  await IOUtils.writeUTF8(path, content);
  return path;
}
