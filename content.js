(() => {
  const STORAGE_KEY = "folderizrEnabled";
  const INDEX_KEY = "folderizrChatIndex";
  const LAST_BACKUP_KEY = "folderizrLastIndexBackupAt";
  const DIAGNOSTICS_KEY = "folderizrLastScanDiagnostics";
  const SCAN_QUIET_PERIOD_MS = 8000;
  const MAX_SCAN_DURATION_MS = 15 * 60 * 1000;
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
  let lastScanDiagnostics = null;
  let scannerRunning = false;
  let scannerAbortRequested = false;

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
    const values = await storageGet([INDEX_KEY, LAST_BACKUP_KEY, DIAGNOSTICS_KEY]);
    chatIndex = Array.isArray(values[INDEX_KEY]) ? values[INDEX_KEY] : [];
    lastIndexBackupAt = typeof values[LAST_BACKUP_KEY] === "string" ? values[LAST_BACKUP_KEY] : null;
    lastScanDiagnostics = values[DIAGNOSTICS_KEY] && typeof values[DIAGNOSTICS_KEY] === "object"
      ? values[DIAGNOSTICS_KEY]
      : null;
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

  function isScrollableElement(element) {
    if (!element || element.clientHeight <= 0 || element.scrollHeight <= element.clientHeight + 8) {
      return false;
    }

    const overflowY = getComputedStyle(element).overflowY;
    return overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay";
  }

  function hasScrollableRange(element) {
    return Boolean(
      element
      && element.clientHeight > 0
      && element.scrollHeight > element.clientHeight + 8,
    );
  }

  function getChatScrollContainer() {
    const chatsList = findChatsList();
    const chatNav = document.querySelector('nav[aria-label="Chat history"]')
      || (chatsList && chatsList.closest("nav"));
    const candidates = [];
    const fallbackCandidates = [];

    function addCandidate(element) {
      if (hasScrollableRange(element) && !fallbackCandidates.includes(element)) {
        fallbackCandidates.push(element);
      }
      if (isScrollableElement(element) && !candidates.includes(element)) {
        candidates.push(element);
      }
    }

    let current = chatsList;
    while (current && current !== document.body) {
      addCandidate(current);
      if (current === chatNav) {
        break;
      }
      current = current.parentElement;
    }

    if (chatNav) {
      addCandidate(chatNav);

      chatNav.querySelectorAll("*").forEach((element) => {
        if (element.querySelector('a[href^="/c/"]')) {
          addCandidate(element);
        }
      });
    }

    const rankByScrollableRange = (left, right) => {
      const leftRange = left.scrollHeight - left.clientHeight;
      const rightRange = right.scrollHeight - right.clientHeight;
      return rightRange - leftRange;
    };

    return candidates.sort(rankByScrollableRange)[0]
      || fallbackCandidates.sort(rankByScrollableRange)[0]
      || null;
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function createScanProbe(scrollContainer) {
    const startedAtMs = Date.now();
    let mutationBatches = 0;
    let mutatedNodes = 0;
    let lastMutationAt = null;

    const session = {
      schemaVersion: 1,
      startedAt: new Date(startedAtMs).toISOString(),
      settings: {
        quietPeriodMs: SCAN_QUIET_PERIOD_MS,
        maxDurationMs: MAX_SCAN_DURATION_MS,
      },
      container: {
        tagName: scrollContainer.tagName,
        id: scrollContainer.id || null,
        className: typeof scrollContainer.className === "string"
          ? scrollContainer.className.slice(0, 500)
          : null,
        overflowY: getComputedStyle(scrollContainer).overflowY,
      },
      samples: [],
    };

    const probeObserver = new MutationObserver((mutations) => {
      mutationBatches += 1;
      mutatedNodes += mutations.reduce(
        (total, mutation) => total + mutation.addedNodes.length + mutation.removedNodes.length,
        0,
      );
      lastMutationAt = new Date().toISOString();
    });
    probeObserver.observe(scrollContainer, { childList: true, subtree: true });

    return {
      sample(event, details = {}) {
        if (session.samples.length >= 2000) {
          return;
        }

        session.samples.push({
          event,
          elapsedMs: Date.now() - startedAtMs,
          scrollTop: Math.round(scrollContainer.scrollTop),
          clientHeight: scrollContainer.clientHeight,
          scrollHeight: scrollContainer.scrollHeight,
          renderedChatLinks: document.querySelectorAll(
            'nav[aria-label="Chat history"] a[href^="/c/"]',
          ).length,
          mutationBatches,
          mutatedNodes,
          lastMutationAt,
          ...details,
        });
      },
      stop(outcome) {
        probeObserver.disconnect();
        session.completedAt = new Date().toISOString();
        session.durationMs = Date.now() - startedAtMs;
        session.outcome = outcome;
        session.totalMutationBatches = mutationBatches;
        session.totalMutatedNodes = mutatedNodes;
        return session;
      },
    };
  }

  function updateScannerControls() {
    const panel = document.querySelector(`[${SEARCHER_ATTR}]`);
    if (!panel) {
      return;
    }

    const rescanButton = panel.querySelector("[data-folderizr-searcher-rescan]");
    const stopButton = panel.querySelector("[data-folderizr-searcher-stop]");
    if (rescanButton) {
      rescanButton.disabled = scannerRunning;
    }
    if (stopButton) {
      stopButton.hidden = !scannerRunning;
      stopButton.disabled = !scannerRunning;
    }
  }

  async function rescanChats(statusElement) {
    if (scannerRunning) {
      return;
    }

    scannerRunning = true;
    scannerAbortRequested = false;
    updateScannerControls();

    const scrollContainer = getChatScrollContainer();
    const originalScrollTop = scrollContainer ? scrollContainer.scrollTop : 0;
    let scannerObserver = null;
    let scanProbe = null;
    let mutationObserved = false;
    let previousScrollHeight = scrollContainer ? scrollContainer.scrollHeight : 0;
    let lastActivityAt = Date.now();
    let finalStatus = "";

    clearTimeout(renderTimer);
    if (observer) {
      observer.disconnect();
    }

    try {
      if (statusElement) {
        statusElement.textContent = "Preparing local scan...";
      }

      chatIndex = mergeIndexItems(chatIndex, collectVisibleChatIndex());
      await storageSet({ [INDEX_KEY]: chatIndex });

      if (!scrollContainer) {
        finalStatus = `Indexed ${chatIndex.length} visible chats. Scrollable chat list not found.`;
        return;
      }

      scannerObserver = new MutationObserver(() => {
        mutationObserved = true;
        lastActivityAt = Date.now();
      });
      scannerObserver.observe(scrollContainer, { childList: true, subtree: true });
      scanProbe = createScanProbe(scrollContainer);
      scanProbe.sample("scan-start", { indexedTotal: chatIndex.length });

      scrollContainer.scrollTop = 0;
      scrollContainer.dispatchEvent(new Event("scroll", { bubbles: true }));
      await wait(250);

      const scanStartedAt = Date.now();
      let round = 0;
      while (Date.now() - scanStartedAt < MAX_SCAN_DURATION_MS) {
        round += 1;
        if (scannerAbortRequested) {
          finalStatus = `Scan stopped. ${chatIndex.length} chats saved locally.`;
          break;
        }

        if (!scrollContainer.isConnected) {
          finalStatus = `Scan interrupted by a page change. ${chatIndex.length} chats saved locally.`;
          break;
        }

        const knownHrefs = new Set(chatIndex.map((item) => item.href));
        const collectedItems = collectVisibleChatIndex();
        const newCount = collectedItems.filter((item) => !knownHrefs.has(item.href)).length;
        chatIndex = mergeIndexItems(chatIndex, collectedItems);

        if (newCount > 0) {
          lastActivityAt = Date.now();
          await storageSet({ [INDEX_KEY]: chatIndex });
        }

        const currentScrollHeight = scrollContainer.scrollHeight;
        if (currentScrollHeight !== previousScrollHeight) {
          lastActivityAt = Date.now();
        }
        previousScrollHeight = currentScrollHeight;

        const atBottom = scrollContainer.scrollTop + scrollContainer.clientHeight
          >= currentScrollHeight - 8;
        const quietForMs = Date.now() - lastActivityAt;

        scanProbe.sample("round", {
          round,
          indexedTotal: chatIndex.length,
          collectedVisible: collectedItems.length,
          newCount,
          atBottom,
          quietForMs,
          scannerMutationObserved: mutationObserved,
        });

        if (statusElement) {
          const waitMessage = atBottom
            ? `, waiting ${Math.max(0, Math.ceil((SCAN_QUIET_PERIOD_MS - quietForMs) / 1000))}s for lazy loading`
            : "";
          statusElement.textContent = `Scanning round ${round}: ${chatIndex.length} indexed, ${newCount} new${waitMessage}`;
        }

        if (atBottom && quietForMs >= SCAN_QUIET_PERIOD_MS) {
          finalStatus = `Scan complete. ${chatIndex.length} chats indexed locally.`;
          break;
        }

        mutationObserved = false;
        const scrollStep = Math.max(280, Math.floor(scrollContainer.clientHeight * 0.8));
        scrollContainer.scrollTop = Math.min(
          scrollContainer.scrollTop + scrollStep,
          Math.max(0, currentScrollHeight - scrollContainer.clientHeight),
        );
        scrollContainer.dispatchEvent(new Event("scroll", { bubbles: true }));
        await wait(500);
      }

      if (!finalStatus) {
        finalStatus = `15-minute scan limit reached. ${chatIndex.length} chats saved locally.`;
      }
    } catch (error) {
      log("scan failed", error);
      finalStatus = `Scan failed safely. ${chatIndex.length} chats remain saved locally.`;
    } finally {
      if (scannerObserver) {
        scannerObserver.disconnect();
      }
      if (scanProbe) {
        scanProbe.sample("scan-end", { indexedTotal: chatIndex.length, finalStatus });
        lastScanDiagnostics = scanProbe.stop(finalStatus || "Scan ended without a status.");
        await storageSet({ [DIAGNOSTICS_KEY]: lastScanDiagnostics });
      }
      if (scrollContainer && scrollContainer.isConnected) {
        scrollContainer.scrollTop = originalScrollTop;
      }
      await storageSet({ [INDEX_KEY]: chatIndex });
      scannerRunning = false;
      scannerAbortRequested = false;
      updateScannerControls();
      renderSearcherTree();

      const liveStatus = document.querySelector(`[${SEARCHER_ATTR}] [data-folderizr-searcher-status]`);
      if (liveStatus && finalStatus) {
        liveStatus.textContent = finalStatus;
      }

      if (observer && document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
        scheduleRender();
      }
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

  function exportScanDiagnostics() {
    if (!lastScanDiagnostics) {
      return;
    }

    const exportedAt = new Date().toISOString();
    const payload = {
      name: "Folderizr scan probe diagnostics",
      exportedAt,
      privacy: "Numeric DOM, timing, mutation, and scan counters only. No chat titles, URLs, or conversation contents.",
      session: lastScanDiagnostics,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `folderizr-scan-probe-${exportedAt.replace(/[:.]/g, "-")}.json`;
    link.click();
    URL.revokeObjectURL(url);
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
    const diagnosticsButton = panel.querySelector("[data-folderizr-searcher-diagnostics]");
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

    if (diagnosticsButton) {
      diagnosticsButton.disabled = !lastScanDiagnostics;
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
          <button type="button" data-folderizr-searcher-stop hidden>Stop scan</button>
          <button type="button" data-folderizr-searcher-export>Export index</button>
          <button type="button" data-folderizr-searcher-diagnostics disabled>Export scan probe</button>
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
    panel.querySelector("[data-folderizr-searcher-stop]").addEventListener("click", () => {
      scannerAbortRequested = true;
      const status = panel.querySelector("[data-folderizr-searcher-status]");
      if (status) {
        status.textContent = "Stopping scan and saving the partial index...";
      }
    });
    panel.querySelector("[data-folderizr-searcher-export]").addEventListener("click", exportIndexBackup);
    panel.querySelector("[data-folderizr-searcher-diagnostics]").addEventListener("click", exportScanDiagnostics);

    document.documentElement.append(toggle, panel);
    renderSearcherTree();
  }

  function cleanupSearcherUi() {
    scannerAbortRequested = true;
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
