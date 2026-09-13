// Theme toggle, the phone sidebar, copy buttons on code, and wide tables that
// scroll inside their own box.
(() => {
  const root = document.documentElement;
  const KEY = "chrysalis-docs-theme";

  if (!root.dataset.colorScheme && window.matchMedia("(prefers-color-scheme: light)").matches) {
    root.dataset.colorScheme = "light";
  }

  document.querySelector("[data-theme-toggle]")?.addEventListener("click", () => {
    const next = root.dataset.colorScheme === "light" ? "dark" : "light";
    root.dataset.colorScheme = next;
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // private mode: the choice lasts for this page only
    }
  });

  const toggle = document.querySelector("[data-side-toggle]");
  const sidebar = document.querySelector("[data-sidebar]");
  toggle?.addEventListener("click", () => {
    const open = !sidebar.hasAttribute("data-open");
    sidebar.toggleAttribute("data-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  });

  for (const pre of document.querySelectorAll(".prose pre")) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "copy";
    button.textContent = "Copy";
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(pre.querySelector("code")?.innerText ?? pre.innerText);
        button.textContent = "Copied";
      } catch {
        button.textContent = "Select and copy";
      }
      setTimeout(() => {
        button.textContent = "Copy";
      }, 1600);
    });
    pre.appendChild(button);
  }

  for (const table of document.querySelectorAll(".prose table")) {
    if (table.parentElement?.classList.contains("table-wrap")) continue;
    const wrap = document.createElement("div");
    wrap.className = "table-wrap";
    table.replaceWith(wrap);
    wrap.appendChild(table);
  }
})();
