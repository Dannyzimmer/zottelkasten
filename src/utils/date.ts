function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 * Format the current date using a subset of Moment.js tokens, matching the
 * Obsidian/Templater `{{date:...}}` syntax (e.g. `YYYY-MM-DDTHH:mm:ssZ`).
 */
export function formatNow(pattern: string): string {
  const now = new Date();
  const offsetMinutes = -now.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absoluteOffset = Math.abs(offsetMinutes);
  const offset = `${sign}${pad(Math.floor(absoluteOffset / 60))}:${pad(absoluteOffset % 60)}`;

  const tokens: Record<string, string> = {
    YYYY: String(now.getFullYear()),
    MM: pad(now.getMonth() + 1),
    DD: pad(now.getDate()),
    HH: pad(now.getHours()),
    mm: pad(now.getMinutes()),
    ss: pad(now.getSeconds()),
    Z: offset,
  };

  return pattern.replace(/YYYY|MM|DD|HH|mm|ss|Z/g, (match) => tokens[match] ?? match);
}
