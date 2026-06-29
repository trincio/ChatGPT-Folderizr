const STORAGE_KEY = "folderizrEnabled";
const LEGACY_KEYS = ["CGPTFolderizr_enabled", "CGPTFolderizr_EXT_enabled"];
const api = globalThis.browser || globalThis.chrome;

function storageGet(keys) {
  return new Promise((resolve) => {
    const result = api.storage.local.get(keys, resolve);
    if (result && typeof result.then === "function") {
      result.then(resolve).catch(() => resolve({}));
    }
  });
}

function storageSet(values) {
  return new Promise((resolve) => {
    const result = api.storage.local.set(values, resolve);
    if (result && typeof result.then === "function") {
      result.then(resolve).catch(resolve);
    }
  });
}

async function getEnabledState() {
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

function updateUi(enabled) {
  document.getElementById("statusText").textContent = enabled ? "Folderizr is enabled." : "Folderizr is disabled.";
  document.getElementById("toggleButton").textContent = enabled ? "Disable" : "Enable";
}

document.addEventListener("DOMContentLoaded", async () => {
  const toggleButton = document.getElementById("toggleButton");
  const detailsButton = document.getElementById("toggleDetails");
  const details = document.getElementById("details");

  let enabled = await getEnabledState();
  updateUi(enabled);

  toggleButton.addEventListener("click", async () => {
    enabled = !enabled;
    await storageSet({ [STORAGE_KEY]: enabled });
    updateUi(enabled);
  });

  detailsButton.addEventListener("click", () => {
    const hidden = details.getAttribute("aria-hidden") !== "true";
    details.setAttribute("aria-hidden", String(hidden));
  });
});
