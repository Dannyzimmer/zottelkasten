pref("outputDir", "");
pref("styleID", "http://www.zotero.org/styles/apa");
pref("noteLanguage", "auto");
pref("addTags", false);
pref(
  "template",
  `---
title: "{{title}}"
date: "{{date:YYYY-MM-DDTHH:mm:ssZ}}"
citation: "{{citation}}"
cite: "{{cite}}"
type: bibliography
tags:
---`,
);
