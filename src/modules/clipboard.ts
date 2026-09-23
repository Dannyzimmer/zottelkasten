export function copyToClipboard(text: string): void {
  (Zotero as any).Utilities.Internal.copyTextToClipboard(text);
}
