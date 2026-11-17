export const AUTO_START_MARKER = "<!-- zettelkasten:auto-start -->";
export const MANUAL_BELOW_MARKER = "<!-- zettelkasten:manual-below -->";

export interface BodySections {
  before: string;
  after: string;
  hasEndMarker: boolean;
}

interface MarkerLine {
  start: number;
  end: number;
}

/**
 * Find a marker that occupies a whole line, ignoring markers inside fenced
 * code blocks.
 */
function findMarkerLine(body: string, marker: string): MarkerLine | null {
  const lines = body.split("\n");
  let offset = 0;
  let fence: { char: string; length: number } | null = null;

  for (const line of lines) {
    const start = offset;
    const end = start + line.length;
    offset = end + 1;

    const trimmed = line.trim();
    const fenceMatch = trimmed.match(/^(`{3,}|~{3,})/);
    if (fenceMatch) {
      const char = fenceMatch[1][0];
      const length = fenceMatch[1].length;
      if (!fence) {
        fence = { char, length };
      } else if (fence.char === char && length >= fence.length) {
        fence = null;
      }
      continue;
    }

    if (fence) {
      continue;
    }

    if (trimmed === marker) {
      return { start, end };
    }
  }

  return null;
}

/**
 * Split a note body into the part managed by the plugin and the manual part
 * preserved below the end marker (and above an optional start marker).
 */
export function splitBodyForUpdate(body: string): BodySections {
  const end = findMarkerLine(body, MANUAL_BELOW_MARKER);
  if (!end) {
    return { before: "", after: "", hasEndMarker: false };
  }

  const start = findMarkerLine(body.slice(0, end.start), AUTO_START_MARKER);
  if (start) {
    return {
      before: body.slice(0, start.end),
      after: body.slice(end.start),
      hasEndMarker: true,
    };
  }

  return {
    before: "",
    after: body.slice(end.start),
    hasEndMarker: true,
  };
}

/**
 * Compose the new body with the preserved manual sections, separated by a
 * single blank line.
 */
export function composeBody(newBody: string, sections: BodySections): string {
  const incoming = newBody.trim();
  if (!sections.hasEndMarker) {
    return incoming;
  }

  return [sections.before.trim(), incoming, sections.after.trim()].filter(Boolean).join("\n\n");
}
