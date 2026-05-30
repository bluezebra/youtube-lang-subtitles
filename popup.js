const enabledStorageKey = "ytDualSubtitles.enabled";
const sourceLanguageStorageKey = "ytDualSubtitles.sourceLanguage";
const targetLanguageStorageKey = "ytDualSubtitles.targetLanguage";
const {
  defaultSourceLanguage,
  defaultTargetLanguage,
  languageNames,
  normalizeSourceLanguage,
  normalizeTargetLanguage,
  sourceLanguageOptions,
  targetLanguageOptions
} = YtDualSubtitlesLanguages;

const enabledCheckbox = document.getElementById("enabled");
const sourceLanguageSelect = document.getElementById("source-language");
const targetLanguageSelect = document.getElementById("target-language");
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

function populateLanguageSelect(select, options) {
  const optionElements = options.map((option) => {
    const optionElement = document.createElement("option");

    optionElement.value = option.code;
    optionElement.textContent = option.name;

    return optionElement;
  });

  select.replaceChildren(...optionElements);
}

populateLanguageSelect(sourceLanguageSelect, sourceLanguageOptions);
populateLanguageSelect(targetLanguageSelect, targetLanguageOptions);

chrome.storage.sync.get(
  {
    [enabledStorageKey]: true,
    [sourceLanguageStorageKey]: defaultSourceLanguage,
    [targetLanguageStorageKey]: defaultTargetLanguage
  },
  (items) => {
    const runtimeError = chrome.runtime.lastError;
    if (runtimeError) {
      enabledCheckbox.disabled = true;
      sourceLanguageSelect.disabled = true;
      targetLanguageSelect.disabled = true;
      setStatus(`Could not load setting: ${runtimeError.message}`);
      return;
    }

    setCheckboxEnabled(items[enabledStorageKey] !== false);
    setSourceLanguageSelectEnabled(items[sourceLanguageStorageKey]);
    setTargetLanguageSelectEnabled(items[targetLanguageStorageKey]);
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
    setStatus(`Source language set to ${languageNames[sourceLanguage]}.`);
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
    setStatus(`Target language set to ${languageNames[targetLanguage]}.`);
  });
});
