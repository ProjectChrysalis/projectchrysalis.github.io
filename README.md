# Chrysalis docs

The website and documentation for [Chrysalis](https://github.com/ProjectChrysalis/Chrysalis-Engine),
published at **https://projectchrysalis.github.io**.

## Editing

Every page is an HTML fragment in [`pages/`](pages) with a header naming its
title, description, sidebar section and order:

```html
<!--
title: Install
description: Download Chrysalis for Windows, macOS, Linux or Android.
section: Start here
order: 1
-->
<h1>Install</h1>
```

`build.ts` wraps each page in the site layout (sidebar, the page's contents,
previous and next links) and checks that every link between pages and every
`#section` link points somewhere real. The look comes from the Chrysalis
shell's own design tokens in [`assets/site.css`](assets/site.css).

```sh
bun build.ts            # build into _site/
bun build.ts --serve    # build and serve on http://localhost:4321
```

A push to `main` builds and publishes the site. Pull requests are built too,
so a broken link fails the check before it merges.

## Writing

- Say what to click and what happens, in as few words as possible.
- Name buttons and tabs exactly as they appear, in `<span class="ui">`.
- Every claim should match what Chrysalis actually does today.

## License

The text is licensed under the GNU Affero General Public License v3.0, like
Chrysalis itself. Inter and JetBrains Mono are under the SIL Open Font License 1.1.
