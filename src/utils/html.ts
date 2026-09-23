const TEXT_NODE = 3;
const ELEMENT_NODE = 1;

function renderChildren(element: Element): string {
  return Array.from(element.childNodes).map(renderNode).join("");
}

function renderList(element: Element, ordered: boolean): string {
  const items = Array.from(element.children).filter((child) => child.localName === "li");
  const lines = items.map((item, index) => {
    const content = renderChildren(item).replace(/\s+/g, " ").trim();
    return `${ordered ? `${index + 1}.` : "-"} ${content}`;
  });
  return `\n\n${lines.join("\n")}\n\n`;
}

function renderNode(node: Node | null): string {
  if (!node) {
    return "";
  }
  if (node.nodeType === TEXT_NODE) {
    return node.textContent ?? "";
  }
  if (node.nodeType !== ELEMENT_NODE) {
    return "";
  }

  const element = node as Element;
  const tag = element.localName.toLowerCase();

  switch (tag) {
    case "br":
      return "\n";
    case "p":
    case "div":
      return `\n\n${renderChildren(element).trim()}\n\n`;
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6":
      return `\n\n${"#".repeat(Number(tag[1]))} ${renderChildren(element).trim()}\n\n`;
    case "strong":
    case "b":
      return `**${renderChildren(element)}**`;
    case "em":
    case "i":
      return `*${renderChildren(element)}*`;
    case "code":
      return `\`${renderChildren(element)}\``;
    case "pre": {
      const code = (element.textContent ?? "").trim();
      return code ? `\n\n\`\`\`\n${code}\n\`\`\`\n\n` : "";
    }
    case "blockquote": {
      const inner = renderChildren(element).trim().replace(/\n/g, "\n> ");
      return `\n\n> ${inner}\n\n`;
    }
    case "ul":
      return renderList(element, false);
    case "ol":
      return renderList(element, true);
    case "a": {
      const href = element.getAttribute("href") ?? "";
      const text = renderChildren(element).trim();
      if (!href || href.startsWith("zotero://") || href === text) {
        return text || href;
      }
      return `[${text}](${href})`;
    }
    case "img": {
      const alt = element.getAttribute("alt") ?? "";
      return alt;
    }
    default:
      return renderChildren(element);
  }
}

/**
 * Convert a subset of Zotero note HTML into Markdown.
 */
export function htmlToMarkdown(html: string): string {
  if (!html) {
    return "";
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  const markdown = renderNode(doc.body ?? doc.documentElement);
  return markdown
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
