(function (root) {
  const defaultSourceLanguage = "auto";
  const defaultTargetLanguage = "en";

  const sourceOnlyLanguageOptions = Object.freeze([
    Object.freeze({ code: "auto", name: "Auto-detect" })
  ]);
  const targetOnlyLanguageOptions = Object.freeze([
    Object.freeze({ code: "en", name: "English" })
  ]);
  const sharedLanguageOptions = Object.freeze([
    Object.freeze({ code: "ar", name: "Arabic" }),
    Object.freeze({ code: "zh-CN", name: "Chinese (Simplified)" }),
    Object.freeze({ code: "zh-TW", name: "Chinese (Traditional)" }),
    Object.freeze({ code: "nl", name: "Dutch" }),
    Object.freeze({ code: "fi", name: "Finnish" }),
    Object.freeze({ code: "fr", name: "French" }),
    Object.freeze({ code: "de", name: "German" }),
    Object.freeze({ code: "hi", name: "Hindi" }),
    Object.freeze({ code: "it", name: "Italian" }),
    Object.freeze({ code: "ja", name: "Japanese" }),
    Object.freeze({ code: "ko", name: "Korean" }),
    Object.freeze({ code: "no", name: "Norwegian" }),
    Object.freeze({ code: "pl", name: "Polish" }),
    Object.freeze({ code: "pt", name: "Portuguese" }),
    Object.freeze({ code: "ru", name: "Russian" }),
    Object.freeze({ code: "es", name: "Spanish" }),
    Object.freeze({ code: "sv", name: "Swedish" }),
    Object.freeze({ code: "tr", name: "Turkish" }),
    Object.freeze({ code: "uk", name: "Ukrainian" })
  ]);
  const sourceLanguageOptions = Object.freeze(sourceOnlyLanguageOptions.concat(sharedLanguageOptions));
  const targetLanguageOptions = Object.freeze(targetOnlyLanguageOptions.concat(sharedLanguageOptions));
  const sourceLanguageCodes = new Set(sourceLanguageOptions.map((option) => option.code));
  const targetLanguageCodes = new Set(targetLanguageOptions.map((option) => option.code));
  const languageNames = Object.freeze(
    sourceLanguageOptions.concat(targetLanguageOptions).reduce((names, option) => {
      names[option.code] = option.name;
      return names;
    }, {})
  );

  function normalizeSourceLanguage(value) {
    const language = String(value || "");

    if (sourceLanguageCodes.has(language)) {
      return language;
    }

    return defaultSourceLanguage;
  }

  function normalizeTargetLanguage(value) {
    const language = String(value || "");

    if (targetLanguageCodes.has(language)) {
      return language;
    }

    return defaultTargetLanguage;
  }

  const api = {
    defaultSourceLanguage,
    defaultTargetLanguage,
    languageNames,
    normalizeSourceLanguage,
    normalizeTargetLanguage,
    sourceLanguageOptions,
    targetLanguageOptions
  };

  root.YtDualSubtitlesLanguages = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
