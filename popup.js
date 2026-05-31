const enabledStorageKey = "ytDualSubtitles.enabled";
const sourceLanguageStorageKey = "ytDualSubtitles.sourceLanguage";
const targetLanguageStorageKey = "ytDualSubtitles.targetLanguage";
const overlayPositionStorageKey = "ytDualSubtitles.overlayPosition";
const {
  defaultSourceLanguage,
  defaultTargetLanguage,
  normalizeSourceLanguage,
  normalizeTargetLanguage,
  sourceLanguageOptions,
  targetLanguageOptions
} = YtDualSubtitlesLanguages;
const {
  defaultOverlayPosition,
  normalizeOverlayPosition,
  overlayPositionOptions
} = YtDualSubtitlesOverlaySettings;

const enabledCheckbox = document.getElementById("enabled");
const sourceLanguageSelect = document.getElementById("source-language");
const targetLanguageSelect = document.getElementById("target-language");
const overlayPositionSelect = document.getElementById("overlay-position");
const statusText = document.getElementById("status");

function setStatus(text) {
  statusText.textContent = text;
}

function setCheckboxEnabled(enabled) {
  enabledCheckbox.checked = enabled;
  enabledCheckbox.disabled = false;
}

function setSourceLanguageSelectEnabled(language) {
  sourceLanguageSelect.value = normalizeSourceLanguage(language);
  sourceLanguageSelect.disabled = false;
}

function setTargetLanguageSelectEnabled(language) {
  targetLanguageSelect.value = normalizeTargetLanguage(language);
  targetLanguageSelect.disabled = false;
}

function setOverlayPositionSelectEnabled(position) {
  overlayPositionSelect.value = normalizeOverlayPosition(position);
  overlayPositionSelect.disabled = false;
}

function populateSelect(select, options, valueProperty, labelProperty) {
  const optionElements = options.map((option) => {
    const optionElement = document.createElement("option");

    optionElement.value = option[valueProperty];
    optionElement.textContent = option[labelProperty];

    return optionElement;
  });

  select.replaceChildren(...optionElements);
}

populateSelect(sourceLanguageSelect, sourceLanguageOptions, "code", "name");
populateSelect(targetLanguageSelect, targetLanguageOptions, "code", "name");
populateSelect(overlayPositionSelect, overlayPositionOptions, "value", "label");

chrome.storage.sync.get(
  {
    [enabledStorageKey]: true,
    [sourceLanguageStorageKey]: defaultSourceLanguage,
    [targetLanguageStorageKey]: defaultTargetLanguage,
    [overlayPositionStorageKey]: defaultOverlayPosition
  },
  (items) => {
    const runtimeError = chrome.runtime.lastError;
    if (runtimeError) {
      enabledCheckbox.disabled = true;
      sourceLanguageSelect.disabled = true;
      targetLanguageSelect.disabled = true;
      overlayPositionSelect.disabled = true;
      setStatus(`Could not load setting: ${runtimeError.message}`);
      return;
    }

    setCheckboxEnabled(items[enabledStorageKey] !== false);
    setSourceLanguageSelectEnabled(items[sourceLanguageStorageKey]);
    setTargetLanguageSelectEnabled(items[targetLanguageStorageKey]);
    setOverlayPositionSelectEnabled(items[overlayPositionStorageKey]);
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
  });
});

sourceLanguageSelect.addEventListener("change", () => {
  sourceLanguageSelect.disabled = true;
  const sourceLanguage = normalizeSourceLanguage(sourceLanguageSelect.value);

  chrome.storage.sync.set({ [sourceLanguageStorageKey]: sourceLanguage }, () => {
    const runtimeError = chrome.runtime.lastError;

    if (runtimeError) {
      sourceLanguageSelect.disabled = false;
      setStatus(`Could not save language: ${runtimeError.message}`);
      return;
    }

    setSourceLanguageSelectEnabled(sourceLanguage);
    clearStatus();
  });
});

targetLanguageSelect.addEventListener("change", () => {
  targetLanguageSelect.disabled = true;
  const targetLanguage = normalizeTargetLanguage(targetLanguageSelect.value);

  chrome.storage.sync.set({ [targetLanguageStorageKey]: targetLanguage }, () => {
    const runtimeError = chrome.runtime.lastError;

    if (runtimeError) {
      targetLanguageSelect.disabled = false;
      setStatus(`Could not save target language: ${runtimeError.message}`);
      return;
    }

    setTargetLanguageSelectEnabled(targetLanguage);
    clearStatus();
  });
});

overlayPositionSelect.addEventListener("change", () => {
  overlayPositionSelect.disabled = true;
  const overlayPosition = normalizeOverlayPosition(overlayPositionSelect.value);

  chrome.storage.sync.set({ [overlayPositionStorageKey]: overlayPosition }, () => {
    const runtimeError = chrome.runtime.lastError;

    if (runtimeError) {
      overlayPositionSelect.disabled = false;
      setStatus(`Could not save position: ${runtimeError.message}`);
      return;
    }

    setOverlayPositionSelectEnabled(overlayPosition);
    clearStatus();
  });
});
