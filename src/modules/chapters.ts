import type { ItemAnnotation } from "./annotations";

export interface ChapterInfo {
  key: string;
  title: string;
}

interface PdfOutlineItem {
  title: string;
  pageIndex?: number;
  items: PdfOutlineItem[];
}

interface EpubTocEntry {
  title: string;
  spineIndex: number;
  key: string;
}

interface PdfCandidate {
  title: string;
  pageIndex: number;
  depth: number;
  key: string;
}

const pdfOutlineCache = new Map<number, Promise<PdfOutlineItem[] | null>>();
const epubTocCache = new Map<number, Promise<EpubTocEntry[] | null>>();

const PDFJS_URL = "resource://zotero/reader/pdf/build/pdf.mjs";
const PDFJS_WORKER_URL = "resource://zotero/reader/pdf/build/pdf.worker.mjs";

/**
 * Resolve the chapter/outline entry an annotation belongs to. Returns null when
 * the attachment has no outline/TOC or the annotation can't be mapped.
 */
export async function resolveChapter(annotation: ItemAnnotation): Promise<ChapterInfo | null> {
  try {
    if (annotation.attachmentType === "pdf" && annotation.pageIndex !== null) {
      const outline = await getPdfOutline(annotation.attachmentID);
      return outline ? resolvePdfChapter(outline, annotation.pageIndex) : null;
    }
    if (annotation.attachmentType === "epub" && annotation.cfi) {
      const toc = await getEpubToc(annotation.attachmentID);
      return toc ? resolveEpubChapter(toc, annotation.cfi) : null;
    }
  } catch (error) {
    Zotero.debug(`Zotero Zettelkasten: chapter lookup failed: ${error}`);
  }
  return null;
}

function normalizeTitle(value: unknown): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

//
// PDF outline
//

function getPdfOutline(attachmentID: number): Promise<PdfOutlineItem[] | null> {
  let promise = pdfOutlineCache.get(attachmentID);
  if (!promise) {
    promise = loadPdfOutline(attachmentID);
    pdfOutlineCache.set(attachmentID, promise);
  }
  return promise;
}

async function loadPdfOutline(attachmentID: number): Promise<PdfOutlineItem[] | null> {
  try {
    const attachment = Zotero.Items.get(attachmentID);
    if (!attachment || !attachment.isPDFAttachment()) {
      return null;
    }

    const path = await (attachment as any).getFilePathAsync?.();
    if (!path) {
      return null;
    }

    let pdfjs: any;
    try {
      pdfjs = await ChromeUtils.importESModule(PDFJS_URL);
      pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
    } catch (error) {
      Zotero.debug(`Zotero Zettelkasten: bundled PDF.js unavailable: ${error}`);
      return null;
    }

    const data = await IOUtils.read(path);
    let pdf: any;
    try {
      pdf = await pdfjs.getDocument({ data, isEvalSupported: false }).promise;
      const nativeOutline = await pdf.getOutline();
      if (!nativeOutline?.length) {
        return [];
      }

      let outline = await transformPdfOutline(pdf, nativeOutline);
      if (outline.length === 1 && outline[0].items.length > 1) {
        outline = outline[0].items;
      }
      return outline;
    } finally {
      if (pdf) {
        try {
          await pdf.destroy();
        } catch (error) {
          Zotero.debug(`Zotero Zettelkasten: failed to destroy PDF document: ${error}`);
        }
      }
    }
  } catch (error) {
    Zotero.debug(`Zotero Zettelkasten: could not read PDF outline: ${error}`);
    return null;
  }
}

async function transformPdfOutline(pdf: any, items: any[]): Promise<PdfOutlineItem[]> {
  const outline: PdfOutlineItem[] = [];

  for (const item of items) {
    const node: PdfOutlineItem = {
      title: normalizeTitle(item.title),
      items: await transformPdfOutline(pdf, item.items || []),
    };

    if (item.dest) {
      try {
        const dest =
          typeof item.dest === "string" ? await pdf.getDestination(item.dest) : item.dest;
        if (Array.isArray(dest) && dest.length) {
          const pageIndex = await pdf.getPageIndex(dest[0]);
          if (typeof pageIndex === "number") {
            node.pageIndex = pageIndex;
          }
        }
      } catch (error) {
        Zotero.debug(`Zotero Zettelkasten: could not resolve outline destination: ${error}`);
      }
    }

    outline.push(node);
  }

  return outline;
}

function isBetterPdfCandidate(candidate: PdfCandidate, best: PdfCandidate | null): boolean {
  if (!best) {
    return true;
  }
  if (candidate.pageIndex !== best.pageIndex) {
    return candidate.pageIndex > best.pageIndex;
  }
  return candidate.depth > best.depth;
}

function findPdfCandidate(
  items: PdfOutlineItem[],
  pageIndex: number,
  path: number[],
  depth: number,
): PdfCandidate | null {
  let best: PdfCandidate | null = null;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const currentPath = path.concat(i);

    if (typeof item.pageIndex === "number" && item.pageIndex <= pageIndex) {
      const candidate: PdfCandidate = {
        title: item.title,
        pageIndex: item.pageIndex,
        depth,
        key: currentPath.join("."),
      };
      if (isBetterPdfCandidate(candidate, best)) {
        best = candidate;
      }
    }

    if (item.items.length) {
      const child = findPdfCandidate(item.items, pageIndex, currentPath, depth + 1);
      if (child && isBetterPdfCandidate(child, best)) {
        best = child;
      }
    }
  }

  return best;
}

function resolvePdfChapter(outline: PdfOutlineItem[], pageIndex: number): ChapterInfo | null {
  const best = findPdfCandidate(outline, pageIndex, [], 1);
  if (!best) {
    return null;
  }
  const title = normalizeTitle(best.title);
  return title ? { key: best.key, title } : null;
}

//
// EPUB TOC
//

function getEpubToc(attachmentID: number): Promise<EpubTocEntry[] | null> {
  let promise = epubTocCache.get(attachmentID);
  if (!promise) {
    promise = loadEpubToc(attachmentID);
    epubTocCache.set(attachmentID, promise);
  }
  return promise;
}

function resolveHref(basePath: string, href: string): string {
  const clean = href.split("#")[0].split("?")[0];
  if (/^[a-z][a-z0-9+.-]*:/i.test(clean)) {
    return clean;
  }
  const baseDir = basePath.includes("/") ? basePath.slice(0, basePath.lastIndexOf("/") + 1) : "";
  const parts = (baseDir + clean).split("/");
  const out: string[] = [];

  for (const part of parts) {
    if (!part || part === ".") {
      continue;
    }
    if (part === "..") {
      out.pop();
    } else {
      out.push(part);
    }
  }

  return out.join("/");
}

function normalizeHref(href: string): string {
  try {
    return decodeURIComponent(href);
  } catch {
    return href;
  }
}

function parseXml(text: string, allowHtmlFallback = false): Document | null {
  try {
    const doc = new DOMParser().parseFromString(text, "application/xml");
    if (!doc.getElementsByTagName("parsererror").length) {
      return doc;
    }
  } catch (error) {
    Zotero.debug(`Zotero Zettelkasten: XML parse error: ${error}`);
  }

  if (allowHtmlFallback) {
    try {
      return new DOMParser().parseFromString(text, "text/html");
    } catch (error) {
      Zotero.debug(`Zotero Zettelkasten: HTML parse error: ${error}`);
    }
  }

  return null;
}

async function readZipText(zip: any, entry: string): Promise<string | null> {
  for (const candidate of [entry, normalizeHref(entry)]) {
    try {
      if (!zip.hasEntry(candidate)) {
        continue;
      }
      const stream = zip.getInputStream(candidate);
      const content = await (Zotero as any).File.getContentsAsync(stream);
      return typeof content === "string" ? content : null;
    } catch (error) {
      Zotero.debug(`Zotero Zettelkasten: could not read EPUB entry ${candidate}: ${error}`);
    }
  }
  return null;
}

async function loadEpubToc(attachmentID: number): Promise<EpubTocEntry[] | null> {
  const attachment = Zotero.Items.get(attachmentID);
  if (!attachment || !(attachment as any).isEPUBAttachment?.()) {
    return null;
  }

  const path = await (attachment as any).getFilePathAsync?.();
  if (!path) {
    return null;
  }

  let zip: any;
  try {
    const ZipReader = (Components as any).Constructor(
      "@mozilla.org/libjar/zip-reader;1",
      "nsIZipReader",
      "open",
    );
    zip = new ZipReader((Zotero as any).File.pathToFile(path));

    const containerXml = await readZipText(zip, "META-INF/container.xml");
    if (!containerXml) {
      return null;
    }
    const containerDoc = parseXml(containerXml);
    const rootfile = containerDoc?.getElementsByTagNameNS("*", "rootfile")[0];
    const opfPath = rootfile?.getAttribute("full-path");
    if (!opfPath) {
      return null;
    }

    const opfXml = await readZipText(zip, opfPath);
    if (!opfXml) {
      return null;
    }
    const opfDoc = parseXml(opfXml);
    if (!opfDoc) {
      return null;
    }

    const manifest = new Map<string, string>();
    const items = Array.from(opfDoc.getElementsByTagNameNS("*", "item"));
    for (const item of items) {
      const id = item.getAttribute("id");
      const href = item.getAttribute("href");
      if (id && href) {
        manifest.set(id, resolveHref(opfPath, href));
      }
    }

    const spine: string[] = [];
    for (const itemref of Array.from(opfDoc.getElementsByTagNameNS("*", "itemref"))) {
      const idref = itemref.getAttribute("idref");
      const href = idref ? manifest.get(idref) : undefined;
      if (href) {
        spine.push(href);
      }
    }

    const spineIndexByHref = new Map<string, number>();
    spine.forEach((href, index) => spineIndexByHref.set(normalizeHref(href), index));

    let navPath: string | null = null;
    let ncxPath: string | null = null;
    for (const item of items) {
      const href = item.getAttribute("href");
      if (!href) {
        continue;
      }
      if ((item.getAttribute("properties") || "").split(/\s+/).includes("nav")) {
        navPath = resolveHref(opfPath, href);
      }
      if (item.getAttribute("media-type") === "application/x-dtbncx+xml") {
        ncxPath = resolveHref(opfPath, href);
      }
    }

    if (!navPath) {
      const spineEl = opfDoc.getElementsByTagNameNS("*", "spine")[0];
      const tocID = spineEl?.getAttribute("toc");
      if (tocID) {
        const ncxItem = items.find((item) => item.getAttribute("id") === tocID);
        const href = ncxItem?.getAttribute("href");
        if (href) {
          ncxPath = resolveHref(opfPath, href);
        }
      }
    }

    const entries: EpubTocEntry[] = [];

    const addEntry = (label: string | null | undefined, href: string | null, basePath: string) => {
      if (!href) {
        return;
      }
      const resolved = normalizeHref(resolveHref(basePath, href));
      const spineIndex = spineIndexByHref.get(resolved);
      if (spineIndex === undefined) {
        return;
      }
      const title = normalizeTitle(label);
      if (!title) {
        return;
      }
      entries.push({ title, spineIndex, key: resolved });
    };

    if (navPath) {
      const navXml = await readZipText(zip, navPath);
      const navDoc = navXml ? parseXml(navXml, true) : null;
      if (navDoc) {
        const navElements = Array.from(navDoc.getElementsByTagNameNS("*", "nav"));
        const tocNav =
          navElements.find((nav) => {
            const type =
              nav.getAttribute("epub:type") ||
              nav.getAttributeNS("http://www.idpf.org/2007/ops", "type");
            return type === "toc";
          }) || navElements[0];
        if (tocNav) {
          for (const anchor of Array.from(tocNav.getElementsByTagNameNS("*", "a"))) {
            addEntry(anchor.textContent, anchor.getAttribute("href"), navPath);
          }
        }
      }
    } else if (ncxPath) {
      const ncxXml = await readZipText(zip, ncxPath);
      const ncxDoc = ncxXml ? parseXml(ncxXml) : null;
      if (ncxDoc) {
        for (const navPoint of Array.from(ncxDoc.getElementsByTagNameNS("*", "navPoint"))) {
          const label = navPoint.getElementsByTagNameNS("*", "text")[0]?.textContent;
          const src = navPoint.getElementsByTagNameNS("*", "content")[0]?.getAttribute("src");
          addEntry(label, src, ncxPath);
        }
      }
    }

    entries.sort((a, b) => a.spineIndex - b.spineIndex);

    // Keep the first TOC entry for each spine item, which is usually the
    // chapter heading rather than one of its subsections.
    const deduped: EpubTocEntry[] = [];
    for (const entry of entries) {
      if (!deduped.length || deduped[deduped.length - 1].spineIndex !== entry.spineIndex) {
        deduped.push(entry);
      }
    }

    return deduped;
  } catch (error) {
    Zotero.debug(`Zotero Zettelkasten: could not read EPUB TOC: ${error}`);
    return null;
  } finally {
    if (zip) {
      try {
        zip.close();
      } catch (error) {
        Zotero.debug(`Zotero Zettelkasten: failed to close EPUB: ${error}`);
      }
    }
  }
}

function getCfiSpineIndex(cfi: string): number | null {
  const match = cfi.match(/^epubcfi\(\s*\/6\/(\d+)/);
  if (!match) {
    return null;
  }
  const step = Number(match[1]);
  if (!Number.isFinite(step) || step < 2 || step % 2 !== 0) {
    return null;
  }
  return step / 2 - 1;
}

function resolveEpubChapter(toc: EpubTocEntry[], cfi: string): ChapterInfo | null {
  const spineIndex = getCfiSpineIndex(cfi);
  if (spineIndex === null) {
    return null;
  }

  let best: EpubTocEntry | null = null;
  for (const entry of toc) {
    if (entry.spineIndex > spineIndex) {
      break;
    }
    if (!best || entry.spineIndex > best.spineIndex) {
      best = entry;
    }
  }

  return best ? { key: best.key, title: best.title } : null;
}
