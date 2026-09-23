import { getPref } from "../utils/prefs";

export const DEFAULT_STYLE_ID = "http://www.zotero.org/styles/apa";

export interface CitationData {
  citation: string;
  cite: string;
}

export function generateCitation(item: Zotero.Item): CitationData {
  const configuredStyle = getPref("styleID");
  const style =
    (configuredStyle && Zotero.Styles.get(configuredStyle)) || Zotero.Styles.get(DEFAULT_STYLE_ID);

  if (!style) {
    throw new Error("No citation style available");
  }

  const locale = Zotero.locale || "en-US";
  const citeModule = (Zotero as any).Cite;

  const bibliographyEngine = style.getCiteProc(locale, "text");
  const citation = String(
    citeModule.makeFormattedBibliographyOrCitationList(bibliographyEngine, [item], "text", false),
  ).trim();

  const citationEngine = style.getCiteProc(locale, "text");
  const cite = cleanInTextCitation(
    citeModule.makeFormattedBibliographyOrCitationList(citationEngine, [item], "text", true),
  );

  return { citation, cite };
}

function cleanInTextCitation(value: string): string {
  return String(value)
    .replace(/\r?\n/g, " ")
    .trim()
    .replace(/^[(\[]\s*/, "")
    .replace(/\s*[)\]]$/, "")
    .trim();
}
