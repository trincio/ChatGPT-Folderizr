(() => {
  const STORAGE_KEY = "folderizrEnabled";
  const LEGACY_KEYS = ["CGPTFolderizr_enabled", "CGPTFolderizr_EXT_enabled"];
  const FOLDER_ATTR = "data-folderizr-folder";
  const ITEM_ATTR = "data-folderizr-item";
  const api = globalThis.browser || globalThis.chrome;

  let enabled = false;
  let observer = null;
  let renderTimer = null;
  let rendering = false;

  const log = (...args) => console.info("Folderizr:", ...args);

  function storageGet(keys) {
    return new Promise((resolve) => {
      if (!api || !api.storage || !api.storage.local) {
        resolve({});
        return;
      }

      try {
        const result = api.storage.local.get(keys, resolve);
        if (result && typeof result.then === "function") {
          result.then(resolve).catch(() => resolve({}));
        }
      } catch (error) {
        resolve({});
      }
    });
  }

  function storageSet(values) {
    return new Promise((resolve) => {
      if (!api || !api.storage || !api.storage.local) {
        resolve();
        return;
      }

      try {
        const result = api.storage.local.set(values, resolve);
        if (result && typeof result.then === "function") {
          result.then(resolve).catch(resolve);
        }
      } catch (error) {
        resolve();
      }
    });
  }

  async function readEnabledState() {
    const values = await storageGet([STORAGE_KEY, ...LEGACY_KEYS]);
    if (typeof values[STORAGE_KEY] === "boolean") {
      return values[STORAGE_KEY];
    }

    const legacyValue = LEGACY_KEYS
      .map((key) => values[key])
      .find((value) => typeof value === "boolean");

    if (typeof legacyValue === "boolean") {
      await storageSet({ [STORAGE_KEY]: legacyValue });
      return legacyValue;
    }

    return false;
  }

  function injectStyles() {
    if (document.getElementById("folderizr-styles")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "folderizr-styles";
    style.textContent = `
      [${FOLDER_ATTR}] {
        margin: 2px 0;
      }

      [${FOLDER_ATTR}] > button {
        align-items: center;
        background: transparent;
        border: 0;
        border-radius: 6px;
        color: inherit;
        cursor: pointer;
        display: flex;
        font: inherit;
        gap: 6px;
        justify-content: space-between;
        min-height: 32px;
        padding: 6px 8px;
        text-align: left;
        width: 100%;
      }

      [${FOLDER_ATTR}] > button:hover,
      [${FOLDER_ATTR}] > button:focus-visible {
        background: color-mix(in srgb, currentColor 9%, transparent);
        outline: none;
      }

      [${FOLDER_ATTR}] [data-folderizr-name] {
        font-weight: 600;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      [${FOLDER_ATTR}] [data-folderizr-count] {
        opacity: 0.68;
      }

      [${FOLDER_ATTR}] [data-folderizr-list] {
        list-style: none;
        margin: 0;
        padding: 0 0 0 10px;
      }

      [${FOLDER_ATTR}][data-collapsed="true"] [data-folderizr-list] {
        display: none;
      }
    `;
    document.documentElement.appendChild(style);
  }

  function scheduleRender() {
    if (!enabled || rendering) {
      return;
    }

    clearTimeout(renderTimer);
    renderTimer = setTimeout(renderFolders, 120);
  }

  function getConversationItems() {
    const links = Array.from(document.querySelectorAll('a[href*="/c/"]'));
    const seen = new Set();

    return links
      .map((link) => {
        if (link.closest(`[${FOLDER_ATTR}]`)) {
          return null;
        }

        const item = link.closest("li") || link;
        if (!item || seen.has(item)) {
          return null;
        }

        seen.add(item);
        return { item, link };
      })
      .filter(Boolean);
  }

  function findTitleTextNode(link) {
    const walker = document.createTreeWalker(link, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return node.nodeValue.trim()
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      },
    });

    let bestNode = null;
    while (walker.nextNode()) {
      if (!bestNode || walker.currentNode.nodeValue.trim().length > bestNode.nodeValue.trim().length) {
        bestNode = walker.currentNode;
      }
    }

    return bestNode;
  }

  function parseFolderTitle(title) {
    const match = title.trim().match(/^\[([^\]\r\n]+)\]\s*(.+)$/);
    if (!match) {
      return null;
    }

    return {
      folderName: match[1].trim(),
      displayTitle: match[2].trim(),
    };
  }

  function restoreExistingFolders() {
    document.querySelectorAll(`[${FOLDER_ATTR}]`).forEach((folder) => {
      const parent = folder.parentElement;
      const list = folder.querySelector("[data-folderizr-list]");

      if (parent && list) {
        Array.from(list.children).forEach((child) => {
          parent.insertBefore(child, folder);
        });
      }

      folder.remove();
    });
  }

  function restoreVisibleTitles(root = document) {
    root.querySelectorAll(`[${ITEM_ATTR}]`).forEach((item) => {
      const link = item.querySelector('a[href*="/c/"]') || item;
      const titleNode = findTitleTextNode(link);
      if (titleNode && item.dataset.folderizrOriginalTitle) {
        titleNode.nodeValue = item.dataset.folderizrOriginalTitle;
      }
      delete item.dataset.folderizrOriginalTitle;
      item.removeAttribute(ITEM_ATTR);
    });
  }

  function createFolder(folderName) {
    const folder = document.createElement("li");
    folder.setAttribute(FOLDER_ATTR, "");
    folder.dataset.collapsed = "false";

    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-expanded", "true");

    const name = document.createElement("span");
    name.dataset.folderizrName = "";
    name.textContent = folderName;

    const count = document.createElement("span");
    count.dataset.folderizrCount = "";

    const list = document.createElement("ol");
    list.dataset.folderizrList = "";

    button.append(name, count);
    folder.append(button, list);

    button.addEventListener("click", () => {
      const collapsed = folder.dataset.collapsed !== "true";
      folder.dataset.collapsed = String(collapsed);
      button.setAttribute("aria-expanded", String(!collapsed));
    });

    return { folder, list, count };
  }

  function renderFolders() {
    if (!enabled || rendering || !document.body) {
      return;
    }

    rendering = true;
    if (observer) {
      observer.disconnect();
    }

    try {
      injectStyles();
      restoreExistingFolders();
      restoreVisibleTitles();

      const groups = new Map();

      getConversationItems().forEach(({ item, link }) => {
        const titleNode = findTitleTextNode(link);
        const title = titleNode ? titleNode.nodeValue.trim() : link.textContent.trim();
        const parsed = parseFolderTitle(title);

        if (!parsed || !parsed.folderName || !parsed.displayTitle) {
          return;
        }

        if (!groups.has(parsed.folderName)) {
          groups.set(parsed.folderName, []);
        }

        groups.get(parsed.folderName).push({ item, titleNode, title, displayTitle: parsed.displayTitle });
      });

      groups.forEach((entries, folderName) => {
        const firstItem = entries[0].item;
        const parent = firstItem.parentElement;
        if (!parent) {
          return;
        }

        const folder = createFolder(folderName);
        parent.insertBefore(folder.folder, firstItem);

        entries.forEach(({ item, titleNode, title, displayTitle }) => {
          item.setAttribute(ITEM_ATTR, "");
          item.dataset.folderizrOriginalTitle = title;
          if (titleNode) {
            titleNode.nodeValue = displayTitle;
          }
          folder.list.appendChild(item);
        });

        folder.count.textContent = String(entries.length);
      });
    } finally {
      rendering = false;
      if (observer && document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
      }
    }
  }

  function restoreSidebarAndReload() {
    enabled = false;
    clearTimeout(renderTimer);
    restoreExistingFolders();
    restoreVisibleTitles();
    location.reload();
  }

  function observePage() {
    if (observer || !document.body) {
      return;
    }

    observer = new MutationObserver(scheduleRender);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  async function initialize() {
    enabled = await readEnabledState();
    observePage();

    if (enabled) {
      renderFolders();
    } else {
      log("disabled. Enable Folderizr from the extension popup.");
    }

    if (api && api.storage && api.storage.onChanged) {
      api.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== "local" || !changes[STORAGE_KEY]) {
          return;
        }

        enabled = Boolean(changes[STORAGE_KEY].newValue);
        if (enabled) {
          renderFolders();
        } else {
          restoreSidebarAndReload();
        }
      });
    }

    if (api && api.runtime && api.runtime.onMessage) {
      api.runtime.onMessage.addListener((message) => {
        if (!message || message.action !== "folderizrStateChanged") {
          return;
        }

        enabled = Boolean(message.enabled);
        if (enabled) {
          renderFolders();
        } else {
          restoreSidebarAndReload();
        }
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
