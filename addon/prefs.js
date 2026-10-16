pref("outputDir", "");
pref("styleID", "http://www.zotero.org/styles/apa");
pref("showComments", true);
pref("showHighlights", true);
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
