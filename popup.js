const enabledStorageKey = "ytDualSubtitles.enabled";
const translationDelayStorageKey = "ytDualSubtitles.translationDelayMs";
const defaultTranslationDelayMs = 200;
const allowedTranslationDelayMs = new Set([100, 200, 350]);

const enabledCheckbox = document.getElementById("enabled");
const translationDelaySelect = document.getElementById("translation-delay");
const statusText = document.getElementById("status");

function setStatus(text) {
  statusText.textContent = text;
}

function setCheckboxEnabled(enabled) {
  enabledCheckbox.checked = enabled;
  enabledCheckbox.disabled = false;
}

function normalizeTranslationDelayMs(value) {
  const numericValue = Number(value);

  if (allowedTranslationDelayMs.has(numericValue)) {
    return numericValue;
  }

  return defaultTranslationDelayMs;
}

function setDelaySelectEnabled(delayMs) {
  translationDelaySelect.value = String(normalizeTranslationDelayMs(delayMs));
  translationDelaySelect.disabled = false;
}

chrome.storage.sync.get(
  {
    [enabledStorageKey]: true,
    [translationDelayStorageKey]: defaultTranslationDelayMs
  },
  (items) => {
    const runtimeError = chrome.runtime.lastError;

    if (runtimeError) {
      enabledCheckbox.disabled = true;
      translationDelaySelect.disabled = true;
      setStatus(`Could not load setting: ${runtimeError.message}`);
      return;
    }

    setCheckboxEnabled(items[enabledStorageKey] !== false);
    setDelaySelectEnabled(items[translationDelayStorageKey]);
    setStatus(enabledCheckbox.checked ? "Dual subtitles are enabled." : "Dual subtitles are disabled.");
  }
);

enabledCheckbox.addEventListener("change", () => {
  enabledCheckbox.disabled = true;
  const enabled = enabledCheckbox.checked;

  chrome.storage.sync.set({ [enabledStorageKey]: enabled }, () => {
    const runtimeError = chrome.runtime.lastError;

    if (runtimeError) {
      enabledCheckbox.checked = !enabled;
      enabledCheckbox.disabled = false;
      setStatus(`Could not save setting: ${runtimeError.message}`);
      return;
    }

    setCheckboxEnabled(enabled);
    setStatus(enabled ? "Dual subtitles are enabled." : "Dual subtitles are disabled.");
  });
});

translationDelaySelect.addEventListener("change", () => {
  translationDelaySelect.disabled = true;
  const translationDelayMs = normalizeTranslationDelayMs(translationDelaySelect.value);

  chrome.storage.sync.set({ [translationDelayStorageKey]: translationDelayMs }, () => {
    const runtimeError = chrome.runtime.lastError;

    if (runtimeError) {
      translationDelaySelect.disabled = false;
      setStatus(`Could not save delay: ${runtimeError.message}`);
      return;
    }

    setDelaySelectEnabled(translationDelayMs);
    setStatus(`Translation delay set to ${translationDelayMs}ms.`);
  });
});
