const enabledStorageKey = "ytDualSubtitles.enabled";
const sourceLanguageStorageKey = "ytDualSubtitles.sourceLanguage";
const targetLanguageStorageKey = "ytDualSubtitles.targetLanguage";
const overlayPositionStorageKey = "ytDualSubtitles.overlayPosition";
const {
  defaultSourceLanguage,
  defaultTargetLanguage,
  filterLanguageOptions,
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
const sourceLanguageSearchInput = document.getElementById("source-language-search");
const sourceLanguageSelect = document.getElementById("source-language");
const targetLanguageSearchInput = document.getElementById("target-language-search");
const targetLanguageSelect = document.getElementById("target-language");
const overlayPositionSelect = document.getElementById("overlay-position");
const statusText = document.getElementById("status");
let selectedSourceLanguage = defaultSourceLanguage;
let selectedTargetLanguage = defaultTargetLanguage;

function setStatus(text) {
  statusText.textContent = text;
}

function clearStatus() {
  setStatus("");
}

function setCheckboxEnabled(enabled) {
  enabledCheckbox.checked = enabled;
  enabledCheckbox.disabled = false;
}

function setSourceLanguageSelectEnabled(language) {
  selectedSourceLanguage = normalizeSourceLanguage(language);
  renderSourceLanguageSelect();
  sourceLanguageSelect.disabled = false;
  sourceLanguageSearchInput.disabled = false;
}

function setTargetLanguageSelectEnabled(language) {
  selectedTargetLanguage = normalizeTargetLanguage(language);
  renderTargetLanguageSelect();
  targetLanguageSelect.disabled = false;
  targetLanguageSearchInput.disabled = false;
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

function createLanguageOption(option) {
  const optionElement = document.createElement("option");

  optionElement.value = option.code;
  optionElement.textContent = option.name;

  return optionElement;
}

function populateLanguageSelect(select, options, searchText, selectedValue, defaultValue) {
  const filteredOptions = filterLanguageOptions(options, searchText);
  const selectedOption = options.find((option) => option.code === selectedValue);
  const defaultOption = options.find((option) => option.code === defaultValue);
  const visibleLanguageOptions = filteredOptions.filter((option) => option.code !== defaultValue);
  const languageOptions = selectedOption &&
    selectedOption.code !== defaultValue &&
    !visibleLanguageOptions.some((option) => option.code === selectedValue)
    ? [selectedOption].concat(visibleLanguageOptions)
    : visibleLanguageOptions;
  const groups = [];

  if (defaultOption) {
    const defaultGroup = document.createElement("optgroup");
    defaultGroup.label = "Default";
    defaultGroup.append(createLanguageOption(defaultOption));
    groups.push(defaultGroup);
  }

  if (languageOptions.length > 0) {
    const languagesGroup = document.createElement("optgroup");
    languagesGroup.label = "Languages";
    languagesGroup.append(...languageOptions.map(createLanguageOption));
    groups.push(languagesGroup);
  }

  select.replaceChildren(...groups);
  select.value = selectedValue;
}

function renderSourceLanguageSelect() {
  populateLanguageSelect(
    sourceLanguageSelect,
    sourceLanguageOptions,
    sourceLanguageSearchInput.value,
    selectedSourceLanguage,
    defaultSourceLanguage
  );
}

function renderTargetLanguageSelect() {
  populateLanguageSelect(
    targetLanguageSelect,
    targetLanguageOptions,
    targetLanguageSearchInput.value,
    selectedTargetLanguage,
    defaultTargetLanguage
  );
}

renderSourceLanguageSelect();
renderTargetLanguageSelect();
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
      sourceLanguageSearchInput.disabled = true;
      sourceLanguageSelect.disabled = true;
      targetLanguageSearchInput.disabled = true;
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
  sourceLanguageSearchInput.disabled = true;
  sourceLanguageSelect.disabled = true;
  const sourceLanguage = normalizeSourceLanguage(sourceLanguageSelect.value);

  chrome.storage.sync.set({ [sourceLanguageStorageKey]: sourceLanguage }, () => {
    const runtimeError = chrome.runtime.lastError;

    if (runtimeError) {
      sourceLanguageSearchInput.disabled = false;
      sourceLanguageSelect.disabled = false;
      setStatus(`Could not save language: ${runtimeError.message}`);
      return;
    }

    setSourceLanguageSelectEnabled(sourceLanguage);
    clearStatus();
  });
});

targetLanguageSelect.addEventListener("change", () => {
  targetLanguageSearchInput.disabled = true;
  targetLanguageSelect.disabled = true;
  const targetLanguage = normalizeTargetLanguage(targetLanguageSelect.value);

  chrome.storage.sync.set({ [targetLanguageStorageKey]: targetLanguage }, () => {
    const runtimeError = chrome.runtime.lastError;

    if (runtimeError) {
      targetLanguageSearchInput.disabled = false;
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

sourceLanguageSearchInput.addEventListener("input", () => {
  renderSourceLanguageSelect();
});

targetLanguageSearchInput.addEventListener("input", () => {
  renderTargetLanguageSelect();
});
