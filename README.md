# Zotero Zettelkasten

A Zotero plugin that turns a selected library item into a Markdown note for
Obsidian/Zettelkasten. The note has a YAML frontmatter and, optionally, the
item's PDF annotations and child notes.

## Features

- Copy a bibliography note to the clipboard or create a `.md` file.
- YAML frontmatter with title, date, full citation, short citation, type and
  tags.
- Optional annotations: highlight comments, highlighted text and child notes.
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

- **Copy bibliography note**: frontmatter only.
- **Copy note with annotations**: frontmatter plus PDF annotations (highlight
  comments and highlighted text) and child notes.
- **Create bibliography note file**: frontmatter only.
- **Create note file with annotations**: frontmatter plus annotations and child
  notes.
- **Update annotations**: replaces the body of an existing note.

Notes:

- The file name is the `cite` field, e.g. `Hinton et al., 2015.md`.
- If the file already exists, the create actions show a warning and do not
  overwrite it.
- **Update annotations** is only enabled when the note file exists. It asks for
  confirmation and replaces everything after the YAML header; the header itself
  is preserved.
- If the item has no annotations or child notes, the "with annotations" actions
  show a notice and do nothing, and **Update annotations** leaves the file
  untouched.
- If the file does not start with a YAML header, **Update annotations** aborts
  to avoid data loss.

## Updates

The plugin can check the GitHub releases of this repository for updates.

## License

MIT © 2026 Daniel Pérez Rodríguez. See [LICENSE](LICENSE).
