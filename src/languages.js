(function (root) {
  const defaultSourceLanguage = "auto";
  const defaultTargetLanguage = "en";

  const sourceOnlyLanguageOptions = Object.freeze([
    Object.freeze({ code: "auto", name: "Auto-detect" })
  ]);
  const concreteLanguageOptions = Object.freeze([
    Object.freeze({ code: "ar", name: "Arabic" }),
    Object.freeze({ code: "bn", name: "Bengali" }),
    Object.freeze({ code: "zh-CN", name: "Chinese (Simplified)" }),
    Object.freeze({ code: "zh-TW", name: "Chinese (Traditional)" }),
    Object.freeze({ code: "cs", name: "Czech" }),
    Object.freeze({ code: "da", name: "Danish" }),
    Object.freeze({ code: "nl", name: "Dutch" }),
    Object.freeze({ code: "en", name: "English" }),
    Object.freeze({ code: "fi", name: "Finnish" }),
    Object.freeze({ code: "fr", name: "French" }),
    Object.freeze({ code: "de", name: "German" }),
    Object.freeze({ code: "el", name: "Greek" }),
    Object.freeze({ code: "he", name: "Hebrew" }),
    Object.freeze({ code: "hi", name: "Hindi" }),
    Object.freeze({ code: "hu", name: "Hungarian" }),
    Object.freeze({ code: "id", name: "Indonesian" }),
    Object.freeze({ code: "it", name: "Italian" }),
    Object.freeze({ code: "ja", name: "Japanese" }),
    Object.freeze({ code: "ko", name: "Korean" }),
    Object.freeze({ code: "ms", name: "Malay" }),
    Object.freeze({ code: "no", name: "Norwegian" }),
    Object.freeze({ code: "fa", name: "Persian" }),
    Object.freeze({ code: "pl", name: "Polish" }),
    Object.freeze({ code: "pt", name: "Portuguese" }),
    Object.freeze({ code: "ro", name: "Romanian" }),
    Object.freeze({ code: "ru", name: "Russian" }),
    Object.freeze({ code: "es", name: "Spanish" }),
    Object.freeze({ code: "sv", name: "Swedish" }),
    Object.freeze({ code: "th", name: "Thai" }),
    Object.freeze({ code: "tr", name: "Turkish" }),
    Object.freeze({ code: "uk", name: "Ukrainian" }),
    Object.freeze({ code: "ur", name: "Urdu" }),
    Object.freeze({ code: "vi", name: "Vietnamese" })
  ]);
  const sourceLanguageOptions = Object.freeze(sourceOnlyLanguageOptions.concat(concreteLanguageOptions));
  const targetLanguageOptions = Object.freeze(
    concreteLanguageOptions
      .filter((option) => option.code === defaultTargetLanguage)
      .concat(concreteLanguageOptions.filter((option) => option.code !== defaultTargetLanguage))
  );
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

  function filterLanguageOptions(options, query) {
    const searchText = String(query || "").trim().toLowerCase();

    if (!searchText) {
      return options.slice();
    }

    return options.filter((option) =>
      option.code.toLowerCase().includes(searchText) ||
      option.name.toLowerCase().includes(searchText)
    );
  }

  const api = {
    defaultSourceLanguage,
    defaultTargetLanguage,
    filterLanguageOptions,
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
