(() => {
  const STORAGE_KEY = "folderizrEnabled";
  const INDEX_KEY = "folderizrChatIndex";
  const LAST_BACKUP_KEY = "folderizrLastIndexBackupAt";
  const LEGACY_KEYS = ["CGPTFolderizr_enabled", "CGPTFolderizr_EXT_enabled"];
  const SECTION_ATTR = "data-folderizr-section";
  const FOLDER_ATTR = "data-folderizr-folder";
  const ITEM_ATTR = "data-folderizr-item";
  const SEARCHER_ATTR = "data-folderizr-searcher";
  const SEARCHER_TOGGLE_ATTR = "data-folderizr-searcher-toggle";
  const api = globalThis.browser || globalThis.chrome;

  let enabled = false;
  let observer = null;
  let renderTimer = null;
  let rendering = false;
  let chatIndex = [];
  let lastIndexBackupAt = null;
  let scannerRunning = false;

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

  async function readIndexState() {
    const values = await storageGet([INDEX_KEY, LAST_BACKUP_KEY]);
    chatIndex = Array.isArray(values[INDEX_KEY]) ? values[INDEX_KEY] : [];
    lastIndexBackupAt = typeof values[LAST_BACKUP_KEY] === "string" ? values[LAST_BACKUP_KEY] : null;
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

      [${SECTION_ATTR}] {
        margin-bottom: var(--sidebar-expanded-section-margin-bottom, 12px);
      }

      [${SECTION_ATTR}] [data-folderizr-section-title] {
        color: var(--text-primary);
        font: inherit;
        font-weight: 600;
        margin: 0;
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

      [${SEARCHER_TOGGLE_ATTR}] {
        background: #0969da;
        border: 0;
        border-radius: 999px;
        bottom: 18px;
        box-shadow: 0 8px 28px rgba(0, 0, 0, 0.22);
        color: #fff;
        cursor: pointer;
        font: 600 13px Arial, sans-serif;
        padding: 10px 14px;
        position: fixed;
        right: 18px;
        z-index: 2147483646;
      }

      [${SEARCHER_ATTR}] {
        background: var(--main-surface-primary, Canvas);
        border: 1px solid color-mix(in srgb, currentColor 18%, transparent);
        border-radius: 8px;
        bottom: 64px;
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.26);
        color: var(--text-primary, CanvasText);
        display: flex;
        flex-direction: column;
        font: 13px Arial, sans-serif;
        max-height: min(720px, calc(100vh - 92px));
        min-height: 320px;
        position: fixed;
        right: 18px;
        width: min(440px, calc(100vw - 36px));
        z-index: 2147483647;
      }

      [${SEARCHER_ATTR}][hidden] {
        display: none;
      }

      [${SEARCHER_ATTR}] header {
        align-items: center;
        border-bottom: 1px solid color-mix(in srgb, currentColor 14%, transparent);
        display: flex;
        gap: 8px;
        justify-content: space-between;
        padding: 10px 12px;
      }

      [${SEARCHER_ATTR}] h2 {
        font-size: 15px;
        margin: 0;
      }

      [${SEARCHER_ATTR}] button {
        border: 1px solid color-mix(in srgb, currentColor 28%, transparent);
        border-radius: 6px;
        cursor: pointer;
        font: inherit;
        padding: 6px 8px;
      }

      [${SEARCHER_ATTR}] input {
        background: transparent;
        border: 1px solid color-mix(in srgb, currentColor 28%, transparent);
        border-radius: 6px;
        color: inherit;
        font: inherit;
        padding: 8px 10px;
        width: 100%;
      }

      [${SEARCHER_ATTR}] [data-folderizr-searcher-controls] {
        display: grid;
        gap: 8px;
        padding: 10px 12px;
      }

      [${SEARCHER_ATTR}] [data-folderizr-searcher-actions] {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      [${SEARCHER_ATTR}] [data-folderizr-searcher-status],
      [${SEARCHER_ATTR}] [data-folderizr-searcher-reminder] {
        color: var(--text-secondary, GrayText);
        line-height: 1.35;
      }

      [${SEARCHER_ATTR}] [data-folderizr-searcher-reminder] {
        border: 1px solid color-mix(in srgb, #b7791f 36%, transparent);
        border-radius: 6px;
        color: color-mix(in srgb, #b7791f 80%, currentColor);
        padding: 7px 8px;
      }

      [${SEARCHER_ATTR}] [data-folderizr-searcher-tree] {
        overflow: auto;
        padding: 0 8px 12px;
      }

      [${SEARCHER_ATTR}] ul {
        list-style: none;
        margin: 0;
        padding: 0 0 0 14px;
      }

      [${SEARCHER_ATTR}] [data-folderizr-tree-root] {
        padding-left: 0;
      }

      [${SEARCHER_ATTR}] [data-folderizr-tree-folder] {
        font-weight: 700;
        margin-top: 8px;
      }

      [${SEARCHER_ATTR}] a {
        border-radius: 6px;
        color: inherit;
        display: block;
        overflow: hidden;
        padding: 5px 7px;
        text-decoration: none;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      [${SEARCHER_ATTR}] a:hover,
      [${SEARCHER_ATTR}] a:focus-visible {
        background: color-mix(in srgb, currentColor 9%, transparent);
        outline: none;
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

  function findChatsList() {
    const headings = Array.from(document.querySelectorAll("h2"));
    const chatsHeading = headings.find((heading) => heading.textContent.trim().toLowerCase() === "chats");

    if (chatsHeading) {
      let current = chatsHeading.parentElement;
      while (current && current !== document.body) {
        const list = Array.from(current.children).find((child) => child.tagName === "UL");
        if (list && list.querySelector('a[href^="/c/"]')) {
          return list;
        }
        current = current.parentElement;
      }
    }

    return Array.from(document.querySelectorAll("ul"))
      .map((list) => ({
        list,
        count: list.querySelectorAll('a[href^="/c/"]').length,
      }))
      .sort((left, right) => right.count - left.count)[0]?.list || null;
  }

  function findSectionForList(list) {
    let current = list;
    while (current && current !== document.body) {
      if (current.querySelector(":scope > div h2") || current.querySelector(":scope > ul")) {
        const heading = current.querySelector("h2");
        if (heading) {
          return current;
        }
      }
      current = current.parentElement;
    }

    return list;
  }

  function getConversationItems(chatsList) {
    const links = Array.from(chatsList.querySelectorAll('a[href^="/c/"]'));
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

  function parseFolderPath(title) {
    const parsed = parseFolderTitle(title);
    if (!parsed) {
      return null;
    }

    const path = parsed.folderName
      .split("/")
      .map((part) => part.trim())
      .filter(Boolean);

    if (!path.length) {
      return null;
    }

    return {
      path,
      displayTitle: parsed.displayTitle,
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

  function restoreFolderizrSections(chatsList) {
    document.querySelectorAll(`[${SECTION_ATTR}]`).forEach((section) => {
      section.querySelectorAll(`[${FOLDER_ATTR}] [data-folderizr-list]`).forEach((list) => {
        Array.from(list.children).forEach((child) => chatsList.appendChild(child));
      });
      section.remove();
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

  function getConversationTitle(link) {
    const item = link.closest(`[${ITEM_ATTR}]`);
    if (item && item.dataset.folderizrOriginalTitle) {
      return item.dataset.folderizrOriginalTitle.trim();
    }

    const titleNode = findTitleTextNode(link);
    const text = titleNode ? titleNode.nodeValue.trim() : link.textContent.trim();
    return text || link.getAttribute("aria-label") || "";
  }

  function collectVisibleChatIndex() {
    const seen = new Set();
    const root = document.querySelector('nav[aria-label="Chat history"]') || document;
    return Array.from(root.querySelectorAll('a[href^="/c/"]'))
      .map((link) => {
        const href = link.getAttribute("href");
        if (!href || seen.has(href)) {
          return null;
        }

        seen.add(href);
        const title = getConversationTitle(link);
        const parsed = parseFolderPath(title);

        return {
          href,
          title,
          displayTitle: parsed ? parsed.displayTitle : title,
          path: parsed ? parsed.path : ["Unfiled"],
          indexedAt: new Date().toISOString(),
        };
      })
      .filter((item) => item && item.title);
  }

  function mergeIndexItems(existingItems, newItems) {
    const byHref = new Map(existingItems.map((item) => [item.href, item]));
    newItems.forEach((item) => byHref.set(item.href, item));
    return Array.from(byHref.values()).sort((left, right) => left.title.localeCompare(right.title));
  }

  function getChatScrollContainer() {
    const chatsList = findChatsList();
    return document.querySelector('nav[aria-label="Chat history"]')
      || (chatsList && chatsList.closest("nav"))
      || (chatsList && chatsList.parentElement)
      || null;
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function rescanChats(statusElement) {
    if (scannerRunning) {
      return;
    }

    scannerRunning = true;
    const scrollContainer = getChatScrollContainer();
    const originalScrollTop = scrollContainer ? scrollContainer.scrollTop : 0;
    let unchangedRounds = 0;
    let previousCount = 0;

    try {
      if (statusElement) {
        statusElement.textContent = "Scanning visible chats...";
      }

      chatIndex = mergeIndexItems(chatIndex, collectVisibleChatIndex());

      if (scrollContainer) {
        for (let round = 0; round < 80; round += 1) {
          const before = chatIndex.length;
          scrollContainer.scrollTop += Math.max(280, Math.floor(scrollContainer.clientHeight * 0.85));
          await wait(450);
          chatIndex = mergeIndexItems(chatIndex, collectVisibleChatIndex());

          const atBottom = scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight - 4;
          unchangedRounds = chatIndex.length === before || chatIndex.length === previousCount
            ? unchangedRounds + 1
            : 0;
          previousCount = chatIndex.length;

          if (statusElement) {
            statusElement.textContent = `Scanning... ${chatIndex.length} chats indexed`;
          }

          if (atBottom && unchangedRounds >= 2) {
            break;
          }
        }

        scrollContainer.scrollTop = originalScrollTop;
      }

      await storageSet({ [INDEX_KEY]: chatIndex });
      renderSearcherTree();
      if (statusElement) {
        statusElement.textContent = `Indexed ${chatIndex.length} chats locally.`;
      }
    } finally {
      scannerRunning = false;
    }
  }

  function shouldShowBackupReminder() {
    if (!chatIndex.length) {
      return false;
    }

    if (!lastIndexBackupAt) {
      return true;
    }

    return Date.now() - Date.parse(lastIndexBackupAt) > 24 * 60 * 60 * 1000;
  }

  async function exportIndexBackup() {
    const exportedAt = new Date().toISOString();
    const payload = {
      name: "Folderizr local chat index backup",
      exportedAt,
      note: "This file contains only locally indexed ChatGPT sidebar metadata: titles, local chat links, and inferred folders. It does not contain conversation contents.",
      items: chatIndex,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `folderizr-index-backup-${exportedAt.slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);

    lastIndexBackupAt = exportedAt;
    await storageSet({ [LAST_BACKUP_KEY]: exportedAt });
    renderSearcherTree();
  }

  function buildTree(items) {
    const root = { folders: new Map(), items: [] };
    items.forEach((item) => {
      let node = root;
      item.path.forEach((part) => {
        if (!node.folders.has(part)) {
          node.folders.set(part, { folders: new Map(), items: [] });
        }
        node = node.folders.get(part);
      });
      node.items.push(item);
    });
    return root;
  }

  function itemMatches(item, query) {
    if (!query) {
      return true;
    }

    const haystack = `${item.path.join(" ")} ${item.displayTitle} ${item.title}`.toLowerCase();
    return haystack.includes(query);
  }

  function subtreeHasMatches(node, query) {
    return node.items.some((item) => itemMatches(item, query))
      || Array.from(node.folders.values()).some((child) => subtreeHasMatches(child, query));
  }

  function createTreeItem(item) {
    const listItem = document.createElement("li");
    const link = document.createElement("a");
    link.href = item.href;
    link.textContent = item.displayTitle;
    link.title = item.title;
    listItem.appendChild(link);
    return listItem;
  }

  function appendTreeNode(parent, name, node, query) {
    const matchingItems = node.items.filter((item) => itemMatches(item, query));
    const folderEntries = Array.from(node.folders.entries())
      .map(([folderName, child]) => ({ folderName, child }))
      .filter(({ child }) => subtreeHasMatches(child, query));

    if (name) {
      const folderItem = document.createElement("li");
      const label = document.createElement("div");
      label.dataset.folderizrTreeFolder = "";
      label.textContent = name;
      folderItem.appendChild(label);

      const childList = document.createElement("ul");
      folderEntries.forEach(({ folderName, child }) => appendTreeNode(childList, folderName, child, query));
      matchingItems.forEach((item) => childList.appendChild(createTreeItem(item)));
      folderItem.appendChild(childList);
      parent.appendChild(folderItem);
      return;
    }

    folderEntries.forEach(({ folderName, child }) => appendTreeNode(parent, folderName, child, query));
    matchingItems.forEach((item) => parent.appendChild(createTreeItem(item)));
  }

  function renderSearcherTree() {
    const panel = document.querySelector(`[${SEARCHER_ATTR}]`);
    if (!panel) {
      return;
    }

    const treeContainer = panel.querySelector("[data-folderizr-searcher-tree]");
    const status = panel.querySelector("[data-folderizr-searcher-status]");
    const reminder = panel.querySelector("[data-folderizr-searcher-reminder]");
    const query = panel.querySelector("input").value.trim().toLowerCase();
    treeContainer.textContent = "";

    if (status && !scannerRunning) {
      status.textContent = chatIndex.length
        ? `${chatIndex.length} chats indexed locally.`
        : "No local index yet. Run Rescan chats.";
    }

    if (reminder) {
      reminder.hidden = !shouldShowBackupReminder();
      reminder.textContent = "Reminder: export a local backup of the Folderizr index after a substantial rescan.";
    }

    const matchingItems = chatIndex.filter((item) => itemMatches(item, query));
    if (!matchingItems.length) {
      const empty = document.createElement("div");
      empty.textContent = chatIndex.length ? "No matching chats." : "Run Rescan chats to build a local index.";
      treeContainer.appendChild(empty);
      return;
    }

    const rootList = document.createElement("ul");
    rootList.dataset.folderizrTreeRoot = "";
    appendTreeNode(rootList, "", buildTree(chatIndex), query);
    treeContainer.appendChild(rootList);
  }

  function openSearcher() {
    ensureSearcherUi();
    const panel = document.querySelector(`[${SEARCHER_ATTR}]`);
    if (panel) {
      panel.hidden = false;
      panel.querySelector("input").focus();
      renderSearcherTree();
    }
  }

  function ensureSearcherUi() {
    injectStyles();

    if (document.querySelector(`[${SEARCHER_TOGGLE_ATTR}]`)) {
      return;
    }

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.setAttribute(SEARCHER_TOGGLE_ATTR, "");
    toggle.textContent = "FolderSearcher";
    toggle.addEventListener("click", openSearcher);

    const panel = document.createElement("section");
    panel.setAttribute(SEARCHER_ATTR, "");
    panel.hidden = true;
    panel.innerHTML = `
      <header>
        <h2>FolderSearcher</h2>
        <button type="button" data-folderizr-searcher-close>Close</button>
      </header>
      <div data-folderizr-searcher-controls>
        <input type="search" placeholder="Search folders and chats">
        <div data-folderizr-searcher-actions>
          <button type="button" data-folderizr-searcher-rescan>Rescan chats</button>
          <button type="button" data-folderizr-searcher-export>Export index</button>
        </div>
        <div data-folderizr-searcher-status></div>
        <div data-folderizr-searcher-reminder hidden></div>
      </div>
      <div data-folderizr-searcher-tree></div>
    `;

    panel.querySelector("[data-folderizr-searcher-close]").addEventListener("click", () => {
      panel.hidden = true;
    });
    panel.querySelector("input").addEventListener("input", renderSearcherTree);
    panel.querySelector("[data-folderizr-searcher-rescan]").addEventListener("click", () => {
      rescanChats(panel.querySelector("[data-folderizr-searcher-status]"));
    });
    panel.querySelector("[data-folderizr-searcher-export]").addEventListener("click", exportIndexBackup);

    document.documentElement.append(toggle, panel);
    renderSearcherTree();
  }

  function cleanupSearcherUi() {
    document.querySelectorAll(`[${SEARCHER_TOGGLE_ATTR}], [${SEARCHER_ATTR}]`).forEach((node) => node.remove());
  }

  function createFolderizrSection() {
    const section = document.createElement("div");
    section.setAttribute(SECTION_ATTR, "");
    section.className = "group/sidebar-expando-section mb-[var(--sidebar-expanded-section-margin-bottom)]";

    const header = document.createElement("div");
    header.className = "group/sidebar-expando-section-header flex items-center justify-between pe-1.5";

    const headerButton = document.createElement("button");
    headerButton.type = "button";
    headerButton.className = "text-token-text-tertiary flex w-full items-center justify-start gap-0.5 px-4 py-1.5";
    headerButton.setAttribute("aria-expanded", "true");

    const heading = document.createElement("h2");
    heading.className = "__menu-label text-token-text-primary font-semibold";
    heading.dataset.folderizrSectionTitle = "";
    heading.dataset.noSpacing = "true";
    heading.textContent = "Folderizr";

    const list = document.createElement("ul");
    list.className = "m-0 list-none p-0";

    headerButton.appendChild(heading);
    header.appendChild(headerButton);
    section.append(header, list);

    return { section, list };
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
      const chatsList = findChatsList();
      if (!chatsList) {
        return;
      }

      restoreFolderizrSections(chatsList);
      restoreExistingFolders();
      restoreVisibleTitles();

      const groups = new Map();

      getConversationItems(chatsList).forEach(({ item, link }) => {
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

      if (!groups.size) {
        return;
      }

      const folderizrSection = createFolderizrSection();
      const chatsSection = findSectionForList(chatsList);
      chatsSection.parentElement.insertBefore(folderizrSection.section, chatsSection);

      groups.forEach((entries, folderName) => {
        const folder = createFolder(folderName);
        folderizrSection.list.appendChild(folder.folder);

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
    cleanupSearcherUi();
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
    await readIndexState();
    observePage();

    if (enabled) {
      ensureSearcherUi();
      renderFolders();
    } else {
      cleanupSearcherUi();
      log("disabled. Enable Folderizr from the extension popup.");
    }

    if (api && api.storage && api.storage.onChanged) {
      api.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== "local" || !changes[STORAGE_KEY]) {
          return;
        }

        enabled = Boolean(changes[STORAGE_KEY].newValue);
        if (enabled) {
          ensureSearcherUi();
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
          ensureSearcherUi();
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
