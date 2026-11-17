# Zotero Zettelkasten

A Zotero plugin that turns a selected library item into a Markdown note for
Obsidian/Zettelkasten. The note has a YAML frontmatter and, optionally, the
item's PDF/EPUB annotations and child notes.

## Features

- Copy a bibliography note to the clipboard or create a `.md` file.
- YAML frontmatter with title, date, full citation, short citation, type and
  tags.
- Optional annotations: highlight comments, highlighted text and child notes.
- Highlights are grouped under `## Chapter` headings when the PDF or EPUB has
  an outline/table of contents.
- Update the annotations of an existing note while keeping its YAML header.
- APA 7th edition by default, with a configurable CSL style.

## Requirements

- Zotero 7 or later (tested with Zotero 10).

## Install

1. Open the [latest release](https://github.com/Dannyzimmer/zottelkasten/releases/latest).
2. Download `zotero-zettelkasten.xpi`.
3. In Zotero, go to **Tools → Plugins** (in some versions, **Edit → Settings →
   Plugins**).
4. Click the gear icon and choose **Install Plugin From File…**.
5. Select the downloaded `.xpi` and restart Zotero if prompted.

You can also drag the `.xpi` file onto the Zotero window.

## Setup

Open **Edit → Settings → Zettelkasten**:

- **Output folder**: folder where the `.md` files are created. If empty, file
  creation shows a warning.
- **Citation style**: CSL style ID. Default:
  `http://www.zotero.org/styles/apa` (APA 7th edition).
- **Template**: frontmatter template. Supported placeholders: `title`,
  `citation`, `cite` and `date` (Moment.js format, e.g.
  `YYYY-MM-DDTHH:mm:ssZ`).

Default template:

```yaml
---
title: "{{title}}"
date: "{{date:YYYY-MM-DDTHH:mm:ssZ}}"
citation: "{{citation}}"
cite: "{{cite}}"
type: bibliography
tags:
---
```

## Usage

Select a single regular item, right-click it and open the **Zettelkasten**
submenu:

- **Copy bibliography note**: copies the YAML frontmatter only.
- **Copy notes**: copies only the item's Zotero child notes (Markdown body,
  without frontmatter).
- **Copy highlights**: copies each PDF/EPUB highlight as a quote, with its
  annotation comment below when present (Markdown body, without frontmatter).
- **Create bibliography note file**: creates the `.md` file with the YAML
  frontmatter only.
- **Update notes**: replaces the body of an existing note with the child notes.
- **Update highlights**: replaces the body of an existing note with the
  highlights and their annotation comments.
- **Update notes and highlights**: replaces the body with the child notes
  followed by the highlights and their annotation comments.

Notes:

- The file name is the `cite` field, e.g. `Hinton et al., 2015.md`.
- If the file already exists, **Create bibliography note file** shows a warning
  and does not overwrite it.
- **Update notes**, **Update highlights** and **Update notes and highlights**
  are only enabled when the note file exists. All ask for confirmation and
  replace everything after the YAML header; the header itself is preserved.
- If there are no child notes or highlights, the corresponding copy/update
  action shows a notice and does nothing.
- If the file does not start with a YAML header, the update actions abort to
  avoid data loss.
- PDF/EPUB note annotations without highlighted text are not included in either
  action.
- When the document has an outline/table of contents, highlights are grouped
  under `## Chapter` headings. Documents without an outline/TOC, or highlights
  before the first entry, are copied without a heading.

## Updates

The plugin can check the GitHub releases of this repository for updates.

## License

MIT © 2026 Daniel Pérez Rodríguez. See [LICENSE](LICENSE).
