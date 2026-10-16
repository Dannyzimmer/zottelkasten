/**
 * Serialize a value as a safe double-quoted YAML scalar, so that arbitrary
 * citation text (colons, quotes, backslashes, newlines) cannot break the
 * generated frontmatter.
 */
export function yamlQuote(value: string): string {
  const normalized = String(value)
    .replace(/\r\n?/g, "\n")
    .replace(/\n/g, " ")
    .replace(/[\u0000-\u001f\u007f]/g, "");
  const escaped = normalized.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${escaped}"`;
}
