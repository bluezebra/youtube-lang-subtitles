const enabledStorageKey = "ytDualSubtitles.enabled";

const enabledCheckbox = document.getElementById("enabled");
const statusText = document.getElementById("status");

function setStatus(text) {
  statusText.textContent = text;
}

function setCheckboxEnabled(enabled) {
  enabledCheckbox.checked = enabled;
  enabledCheckbox.disabled = false;
}

chrome.storage.sync.get({ [enabledStorageKey]: true }, (items) => {
  const runtimeError = chrome.runtime.lastError;

  if (runtimeError) {
    enabledCheckbox.disabled = true;
    setStatus(`Could not load setting: ${runtimeError.message}`);
    return;
  }

  setCheckboxEnabled(items[enabledStorageKey] !== false);
  setStatus(enabledCheckbox.checked ? "Dual subtitles are enabled." : "Dual subtitles are disabled.");
});

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
