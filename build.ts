/**
 * Builds the site into _site/: every page in pages/ is an HTML fragment with
 * a header comment (title, description, section, order), wrapped in the one
 * layout with the sidebar, the page's own table of contents and previous /
 * next links. The landing page (layout: home) skips the docs chrome.
 *
 *   bun build.ts           build once
 *   bun build.ts --serve   build, then serve _site on http://localhost:4321
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = import.meta.dir;
const OUT = path.join(ROOT, "_site");
const REPO = "https://github.com/ProjectChrysalis/projectchrysalis.github.io";
const ENGINE = "https://github.com/ProjectChrysalis/Chrysalis-Engine";
const DISCORD = "https://discord.gg/maFVqyeD4Q";

/** Sidebar sections, in order. */
const SECTIONS = ["Start here", "Using Chrysalis", "Apps", "Build", "How it works", "Help"];

interface Page {
  file: string;
  slug: string;
  title: string;
  description: string;
  section: string;
  order: number;
  layout: "docs" | "home";
  body: string;
}

function readPage(file: string): Page {
  const raw = fs.readFileSync(path.join(ROOT, "pages", file), "utf8");
  const header = /^<!--([\s\S]*?)-->\s*/.exec(raw);
  if (!header?.[1]) throw new Error(`${file}: missing header comment`);
  const meta: Record<string, string> = {};
  for (const line of header[1].split("\n")) {
    const m = /^\s*([a-z]+):\s*(.+?)\s*$/.exec(line);
    if (m?.[1] && m[2]) meta[m[1]] = m[2];
  }
  for (const key of ["title", "description"]) if (!meta[key]) throw new Error(`${file}: header needs ${key}`);
  const layout = meta.layout === "home" ? "home" : "docs";
  if (layout === "docs" && !SECTIONS.includes(meta.section ?? "")) throw new Error(`${file}: section must be one of ${SECTIONS.join(", ")}`);
  return {
    file,
    slug: file.replace(/\.html$/, ""),
    title: meta.title!,
    description: meta.description!,
    section: meta.section ?? "",
    order: Number(meta.order ?? 0),
    layout,
    body: raw.slice(header[0].length),
  };
}

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const href = (p: Page) => (p.slug === "index" ? "./" : `${p.slug}.html`);
const idOf = (text: string) =>
  text.replace(/<[^>]+>/g, "").toLowerCase().replace(/&[a-z]+;/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Give h2/h3 an id and a link, and collect the h2s for the page's contents. */
function anchorHeadings(body: string): { body: string; toc: { id: string; text: string }[] } {
  const toc: { id: string; text: string }[] = [];
  const seen = new Set<string>();
  const out = body.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_, level: string, inner: string) => {
    let id = idOf(inner) || "section";
    while (seen.has(id)) id += "-2";
    seen.add(id);
    if (level === "2") toc.push({ id, text: inner.replace(/<[^>]+>/g, "") });
    return `<h${level} id="${id}"><a class="anchor" href="#${id}" aria-label="Link to this section">#</a>${inner}</h${level}>`;
  });
  return { body: out, toc };
}

const icons = {
  github:
    '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg>',
  discord:
    '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13.55 3.02A13.2 13.2 0 0 0 10.3 2a.05.05 0 0 0-.05.02c-.14.25-.3.58-.4.84a12.2 12.2 0 0 0-3.67 0 8.5 8.5 0 0 0-.41-.84.05.05 0 0 0-.05-.02c-1.14.2-2.23.54-3.25 1.02a.05.05 0 0 0-.02.02C.38 6.12-.18 9.13.1 12.1a.06.06 0 0 0 .02.04 13.3 13.3 0 0 0 4 2.02.05.05 0 0 0 .06-.02c.3-.42.58-.87.82-1.33a.05.05 0 0 0-.03-.07 8.7 8.7 0 0 1-1.25-.6.05.05 0 0 1 0-.08l.25-.2a.05.05 0 0 1 .05 0 9.5 9.5 0 0 0 8.06 0 .05.05 0 0 1 .05 0l.25.2a.05.05 0 0 1 0 .08c-.4.23-.82.43-1.25.6a.05.05 0 0 0-.03.07c.24.46.52.9.82 1.33a.05.05 0 0 0 .06.02 13.2 13.2 0 0 0 4-2.02.05.05 0 0 0 .03-.04c.33-3.43-.56-6.4-2.36-9.06a.04.04 0 0 0-.02-.02ZM5.35 10.3c-.79 0-1.44-.72-1.44-1.61 0-.89.64-1.61 1.44-1.61.8 0 1.45.73 1.44 1.61 0 .89-.64 1.61-1.44 1.61Zm5.3 0c-.79 0-1.44-.72-1.44-1.61 0-.89.64-1.61 1.44-1.61.8 0 1.45.73 1.44 1.61 0 .89-.63 1.61-1.44 1.61Z"/></svg>',
  theme:
    '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Zm0 1.5v10a5 5 0 0 1 0-10Z"/></svg>',
  menu: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 4h12v1.5H2zm0 3.25h12v1.5H2zm0 3.25h12V12H2z"/></svg>',
};

function topbar(active: "docs" | "home"): string {
  return `<header class="topbar">
  <a class="brand" href="./"><img src="assets/logo.png" alt="" width="24" height="24"><span>Chrysalis</span></a>
  <nav class="topnav">
    <a href="install.html"${active === "docs" ? ' aria-current="page"' : ""}>Docs</a>
    <a href="${ENGINE}/releases/latest">Download</a>
    <a class="icon-link" href="${ENGINE}" aria-label="GitHub">${icons.github}<span>GitHub</span></a>
    <a class="icon-link" href="${DISCORD}" aria-label="Discord">${icons.discord}<span>Discord</span></a>
    <button class="icon-button" type="button" data-theme-toggle aria-label="Switch light and dark">${icons.theme}</button>
  </nav>
</header>`;
}

function head(page: Page): string {
  const title = page.slug === "index" ? "Chrysalis: the AI frontend you can reshape just by asking" : `${page.title} · Chrysalis`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)}</title>
<meta name="description" content="${escape(page.description)}">
<meta property="og:title" content="${escape(title)}">
<meta property="og:description" content="${escape(page.description)}">
<meta property="og:image" content="assets/logo.png">
<link rel="icon" href="assets/logo.png">
<link rel="stylesheet" href="assets/site.css">
<script>try{const t=localStorage.getItem("chrysalis-docs-theme");if(t)document.documentElement.dataset.colorScheme=t}catch{}</script>
<script src="assets/site.js" defer></script>
</head>`;
}

function footer(): string {
  return `<footer class="site-footer">
  <span>Chrysalis is free software under the AGPL-3.0.</span>
  <a href="${ENGINE}">GitHub</a>
  <a href="${DISCORD}">Discord</a>
  <a href="${REPO}">Edit these docs</a>
</footer>`;
}

function renderDocs(page: Page, docs: Page[]): string {
  const { body, toc } = anchorHeadings(page.body);
  const index = docs.indexOf(page);
  const prev = docs[index - 1];
  const next = docs[index + 1];
  const sidebar = SECTIONS.map((section) => {
    const items = docs.filter((p) => p.section === section);
    if (!items.length) return "";
    return `<p class="side-label">${section}</p>
${items.map((p) => `<a class="side-link" href="${href(p)}"${p === page ? ' aria-current="page"' : ""}>${escape(p.title)}</a>`).join("\n")}`;
  }).join("\n");
  return `${head(page)}
<body class="docs">
${topbar("docs")}
<div class="shell">
  <button class="side-toggle" type="button" data-side-toggle aria-expanded="false">${icons.menu}<span>${escape(page.section)} / ${escape(page.title)}</span></button>
  <aside class="sidebar" data-sidebar>${sidebar}</aside>
  <main class="panel">
    <article class="prose">
${body}
    </article>
    <nav class="pager">
      ${prev ? `<a class="pager-link" href="${href(prev)}"><small>Previous</small>${escape(prev.title)}</a>` : "<span></span>"}
      ${next ? `<a class="pager-link next" href="${href(next)}"><small>Next</small>${escape(next.title)}</a>` : "<span></span>"}
    </nav>
    <p class="edit"><a href="${REPO}/blob/main/pages/${page.file}">Edit this page on GitHub</a></p>
  </main>
  ${toc.length > 1 ? `<nav class="toc" aria-label="On this page"><p class="side-label">On this page</p>${toc.map((t) => `<a href="#${t.id}">${escape(t.text)}</a>`).join("")}</nav>` : ""}
</div>
${footer()}
</body>
</html>
`;
}

function renderHome(page: Page): string {
  return `${head(page)}
<body class="home">
${topbar("home")}
${page.body}
${footer()}
</body>
</html>
`;
}

function build(): void {
  const pages = fs.readdirSync(path.join(ROOT, "pages")).filter((f) => f.endsWith(".html")).map(readPage);
  const docs = pages
    .filter((p) => p.layout === "docs")
    .sort((a, b) => SECTIONS.indexOf(a.section) - SECTIONS.indexOf(b.section) || a.order - b.order);
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  fs.cpSync(path.join(ROOT, "assets"), path.join(OUT, "assets"), { recursive: true });
  for (const page of pages) {
    const html = page.layout === "home" ? renderHome(page) : renderDocs(page, docs);
    fs.writeFileSync(path.join(OUT, `${page.slug}.html`), html);
  }
  // a missing page gets the docs home rather than GitHub's
  const notFound = pages.find((p) => p.slug === "404");
  if (!notFound) fs.copyFileSync(path.join(OUT, "index.html"), path.join(OUT, "404.html"));
  // Pages must serve assets/ and files starting with an underscore as they are
  fs.writeFileSync(path.join(OUT, ".nojekyll"), "");
  checkLinks(pages);
  console.log(`built ${pages.length} pages into _site/`);
}

/** Every relative link must reach a page, and every #anchor a heading. */
function checkLinks(pages: Page[]): void {
  const problems: string[] = [];
  const ids = new Map<string, Set<string>>();
  for (const p of pages) {
    const html = fs.readFileSync(path.join(OUT, `${p.slug}.html`), "utf8");
    ids.set(`${p.slug}.html`, new Set([...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]!)));
  }
  ids.set("./", ids.get("index.html")!);
  for (const p of pages) {
    const html = fs.readFileSync(path.join(OUT, `${p.slug}.html`), "utf8");
    for (const m of html.matchAll(/href="([^"]+)"/g)) {
      const link = m[1]!;
      if (/^(https?:|mailto:)/.test(link)) continue;
      const [file, anchor] = link.split("#");
      const target = file === "" ? `${p.slug}.html` : file!;
      if (target.startsWith("assets/")) {
        if (!fs.existsSync(path.join(OUT, target))) problems.push(`${p.file}: ${link}`);
        continue;
      }
      const known = ids.get(target);
      if (!known) problems.push(`${p.file}: ${link} (no such page)`);
      else if (anchor && !known.has(anchor)) problems.push(`${p.file}: ${link} (no such heading)`);
    }
  }
  if (problems.length) throw new Error(`broken links:\n  ${problems.join("\n  ")}`);
}

build();

if (process.argv.includes("--serve")) {
  const server = Bun.serve({
    port: 4321,
    fetch(req) {
      const url = new URL(req.url);
      const rel = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
      const file = path.join(OUT, path.normalize(rel));
      if (!file.startsWith(OUT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return new Response(Bun.file(path.join(OUT, "404.html")), { status: 404 });
      return new Response(Bun.file(file));
    },
  });
  console.log(`serving on ${server.url}`);
}
