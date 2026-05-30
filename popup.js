const enabledStorageKey = "ytDualSubtitles.enabled";
const translationDelayStorageKey = "ytDualSubtitles.translationDelayMs";
const sourceLanguageStorageKey = "ytDualSubtitles.sourceLanguage";
const defaultTranslationDelayMs = 200;
const defaultSourceLanguage = "auto";
const allowedTranslationDelayMs = new Set([100, 200, 350]);
const allowedSourceLanguages = new Set([
  "auto",
  "ar",
  "zh-CN",
  "zh-TW",
  "nl",
  "fi",
  "fr",
  "de",
  "hi",
  "it",
  "ja",
  "ko",
  "no",
  "pl",
  "pt",
  "ru",
  "es",
  "sv",
  "tr",
  "uk"
]);
const sourceLanguageNames = {
  ar: "Arabic",
  auto: "Auto-detect",
  "zh-CN": "Chinese (Simplified)",
  "zh-TW": "Chinese (Traditional)",
  de: "German",
  nl: "Dutch",
  es: "Spanish",
  fi: "Finnish",
  fr: "French",
  hi: "Hindi",
  it: "Italian",
  ja: "Japanese",
  ko: "Korean",
  no: "Norwegian",
  pl: "Polish",
  pt: "Portuguese",
  ru: "Russian",
  sv: "Swedish",
  tr: "Turkish",
  uk: "Ukrainian"
};

const enabledCheckbox = document.getElementById("enabled");
const translationDelaySelect = document.getElementById("translation-delay");
const sourceLanguageSelect = document.getElementById("source-language");
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

function normalizeSourceLanguage(value) {
  const language = String(value || "");

  if (allowedSourceLanguages.has(language)) {
    return language;
  }

  return defaultSourceLanguage;
}

function setDelaySelectEnabled(delayMs) {
  translationDelaySelect.value = String(normalizeTranslationDelayMs(delayMs));
  translationDelaySelect.disabled = false;
}

function setSourceLanguageSelectEnabled(language) {
  sourceLanguageSelect.value = normalizeSourceLanguage(language);
  sourceLanguageSelect.disabled = false;
}

chrome.storage.sync.get(
  {
    [enabledStorageKey]: true,
    [translationDelayStorageKey]: defaultTranslationDelayMs,
    [sourceLanguageStorageKey]: defaultSourceLanguage
  },
  (items) => {
    const runtimeError = chrome.runtime.lastError;

    if (runtimeError) {
      enabledCheckbox.disabled = true;
      translationDelaySelect.disabled = true;
      sourceLanguageSelect.disabled = true;
      setStatus(`Could not load setting: ${runtimeError.message}`);
      return;
    }

    setCheckboxEnabled(items[enabledStorageKey] !== false);
    setSourceLanguageSelectEnabled(items[sourceLanguageStorageKey]);
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
    setStatus(`Source language set to ${sourceLanguageNames[sourceLanguage]}.`);
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
