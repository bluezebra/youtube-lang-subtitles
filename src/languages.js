(function (root) {
  const defaultSourceLanguage = "auto";
  const defaultTargetLanguage = "en";

  const sourceOnlyLanguageOptions = Object.freeze([
    Object.freeze({ code: "auto", name: "Auto-detect" })
  ]);
  const languageCodeAliases = Object.freeze({
    fil: "tl",
    he: "iw",
    jv: "jw",
    nb: "no",
    zh: "zh-CN"
  });
  const concreteLanguageOptions = Object.freeze([
    Object.freeze({ code: "ab", name: "Abkhaz" }),
    Object.freeze({ code: "ace", name: "Acehnese" }),
    Object.freeze({ code: "ach", name: "Acholi" }),
    Object.freeze({ code: "aa", name: "Afar" }),
    Object.freeze({ code: "af", name: "Afrikaans" }),
    Object.freeze({ code: "sq", name: "Albanian" }),
    Object.freeze({ code: "alz", name: "Alur" }),
    Object.freeze({ code: "am", name: "Amharic" }),
    Object.freeze({ code: "ar", name: "Arabic" }),
    Object.freeze({ code: "hy", name: "Armenian" }),
    Object.freeze({ code: "as", name: "Assamese" }),
    Object.freeze({ code: "av", name: "Avar" }),
    Object.freeze({ code: "awa", name: "Awadhi" }),
    Object.freeze({ code: "ay", name: "Aymara" }),
    Object.freeze({ code: "az", name: "Azerbaijani" }),
    Object.freeze({ code: "ban", name: "Balinese" }),
    Object.freeze({ code: "bal", name: "Baluchi" }),
    Object.freeze({ code: "bm", name: "Bambara" }),
    Object.freeze({ code: "bci", name: "Baoulé" }),
    Object.freeze({ code: "ba", name: "Bashkir" }),
    Object.freeze({ code: "eu", name: "Basque" }),
    Object.freeze({ code: "btx", name: "Batak Karo" }),
    Object.freeze({ code: "bts", name: "Batak Simalungun" }),
    Object.freeze({ code: "bbc", name: "Batak Toba" }),
    Object.freeze({ code: "be", name: "Belarusian" }),
    Object.freeze({ code: "bem", name: "Bemba" }),
    Object.freeze({ code: "bn", name: "Bengali" }),
    Object.freeze({ code: "bew", name: "Betawi" }),
    Object.freeze({ code: "bho", name: "Bhojpuri" }),
    Object.freeze({ code: "bik", name: "Bikol" }),
    Object.freeze({ code: "bs", name: "Bosnian" }),
    Object.freeze({ code: "br", name: "Breton" }),
    Object.freeze({ code: "bg", name: "Bulgarian" }),
    Object.freeze({ code: "bua", name: "Buryat" }),
    Object.freeze({ code: "yue", name: "Cantonese" }),
    Object.freeze({ code: "ca", name: "Catalan" }),
    Object.freeze({ code: "ceb", name: "Cebuano" }),
    Object.freeze({ code: "ch", name: "Chamorro" }),
    Object.freeze({ code: "ce", name: "Chechen" }),
    Object.freeze({ code: "ny", name: "Chichewa" }),
    Object.freeze({ code: "zh-CN", name: "Chinese (Simplified)" }),
    Object.freeze({ code: "zh-TW", name: "Chinese (Traditional)" }),
    Object.freeze({ code: "chk", name: "Chuukese" }),
    Object.freeze({ code: "cv", name: "Chuvash" }),
    Object.freeze({ code: "co", name: "Corsican" }),
    Object.freeze({ code: "crh", name: "Crimean Tatar (Cyrillic)" }),
    Object.freeze({ code: "crh-Latn", name: "Crimean Tatar (Latin)" }),
    Object.freeze({ code: "hr", name: "Croatian" }),
    Object.freeze({ code: "cs", name: "Czech" }),
    Object.freeze({ code: "da", name: "Danish" }),
    Object.freeze({ code: "fa-AF", name: "Dari" }),
    Object.freeze({ code: "dv", name: "Dhivehi" }),
    Object.freeze({ code: "din", name: "Dinka" }),
    Object.freeze({ code: "doi", name: "Dogri" }),
    Object.freeze({ code: "dov", name: "Dombe" }),
    Object.freeze({ code: "nl", name: "Dutch" }),
    Object.freeze({ code: "dyu", name: "Dyula" }),
    Object.freeze({ code: "dz", name: "Dzongkha" }),
    Object.freeze({ code: "en", name: "English" }),
    Object.freeze({ code: "eo", name: "Esperanto" }),
    Object.freeze({ code: "et", name: "Estonian" }),
    Object.freeze({ code: "ee", name: "Ewe" }),
    Object.freeze({ code: "fo", name: "Faroese" }),
    Object.freeze({ code: "fj", name: "Fijian" }),
    Object.freeze({ code: "tl", name: "Filipino" }),
    Object.freeze({ code: "fi", name: "Finnish" }),
    Object.freeze({ code: "fon", name: "Fon" }),
    Object.freeze({ code: "fr", name: "French" }),
    Object.freeze({ code: "fr-CA", name: "French (Canada)" }),
    Object.freeze({ code: "fy", name: "Frisian" }),
    Object.freeze({ code: "fur", name: "Friulian" }),
    Object.freeze({ code: "ff", name: "Fulani" }),
    Object.freeze({ code: "gaa", name: "Ga" }),
    Object.freeze({ code: "gl", name: "Galician" }),
    Object.freeze({ code: "ka", name: "Georgian" }),
    Object.freeze({ code: "de", name: "German" }),
    Object.freeze({ code: "el", name: "Greek" }),
    Object.freeze({ code: "gn", name: "Guarani" }),
    Object.freeze({ code: "gu", name: "Gujarati" }),
    Object.freeze({ code: "ht", name: "Haitian Creole" }),
    Object.freeze({ code: "cnh", name: "Hakha Chin" }),
    Object.freeze({ code: "ha", name: "Hausa" }),
    Object.freeze({ code: "haw", name: "Hawaiian" }),
    Object.freeze({ code: "iw", name: "Hebrew" }),
    Object.freeze({ code: "hil", name: "Hiligaynon" }),
    Object.freeze({ code: "hi", name: "Hindi" }),
    Object.freeze({ code: "hmn", name: "Hmong" }),
    Object.freeze({ code: "hu", name: "Hungarian" }),
    Object.freeze({ code: "hrx", name: "Hunsrik" }),
    Object.freeze({ code: "iba", name: "Iban" }),
    Object.freeze({ code: "is", name: "Icelandic" }),
    Object.freeze({ code: "ig", name: "Igbo" }),
    Object.freeze({ code: "ilo", name: "Ilocano" }),
    Object.freeze({ code: "id", name: "Indonesian" }),
    Object.freeze({ code: "iu-Latn", name: "Inuktut (Latin)" }),
    Object.freeze({ code: "iu", name: "Inuktut (Syllabics)" }),
    Object.freeze({ code: "ga", name: "Irish" }),
    Object.freeze({ code: "it", name: "Italian" }),
    Object.freeze({ code: "jam", name: "Jamaican Patois" }),
    Object.freeze({ code: "ja", name: "Japanese" }),
    Object.freeze({ code: "jw", name: "Javanese" }),
    Object.freeze({ code: "kac", name: "Jingpo" }),
    Object.freeze({ code: "kl", name: "Kalaallisut" }),
    Object.freeze({ code: "kn", name: "Kannada" }),
    Object.freeze({ code: "kr", name: "Kanuri" }),
    Object.freeze({ code: "pam", name: "Kapampangan" }),
    Object.freeze({ code: "kk", name: "Kazakh" }),
    Object.freeze({ code: "kha", name: "Khasi" }),
    Object.freeze({ code: "km", name: "Khmer" }),
    Object.freeze({ code: "cgg", name: "Kiga" }),
    Object.freeze({ code: "kg", name: "Kikongo" }),
    Object.freeze({ code: "rw", name: "Kinyarwanda" }),
    Object.freeze({ code: "ktu", name: "Kituba" }),
    Object.freeze({ code: "trp", name: "Kokborok" }),
    Object.freeze({ code: "kv", name: "Komi" }),
    Object.freeze({ code: "gom", name: "Konkani" }),
    Object.freeze({ code: "ko", name: "Korean" }),
    Object.freeze({ code: "kri", name: "Krio" }),
    Object.freeze({ code: "ku", name: "Kurdish (Kurmanji)" }),
    Object.freeze({ code: "ckb", name: "Kurdish (Sorani)" }),
    Object.freeze({ code: "ky", name: "Kyrgyz" }),
    Object.freeze({ code: "lo", name: "Lao" }),
    Object.freeze({ code: "ltg", name: "Latgalian" }),
    Object.freeze({ code: "la", name: "Latin" }),
    Object.freeze({ code: "lv", name: "Latvian" }),
    Object.freeze({ code: "lij", name: "Ligurian" }),
    Object.freeze({ code: "li", name: "Limburgish" }),
    Object.freeze({ code: "ln", name: "Lingala" }),
    Object.freeze({ code: "lt", name: "Lithuanian" }),
    Object.freeze({ code: "lmo", name: "Lombard" }),
    Object.freeze({ code: "lg", name: "Luganda" }),
    Object.freeze({ code: "luo", name: "Luo" }),
    Object.freeze({ code: "lb", name: "Luxembourgish" }),
    Object.freeze({ code: "mk", name: "Macedonian" }),
    Object.freeze({ code: "mad", name: "Madurese" }),
    Object.freeze({ code: "mai", name: "Maithili" }),
    Object.freeze({ code: "mak", name: "Makassar" }),
    Object.freeze({ code: "mg", name: "Malagasy" }),
    Object.freeze({ code: "ms", name: "Malay" }),
    Object.freeze({ code: "ms-Arab", name: "Malay (Jawi)" }),
    Object.freeze({ code: "ml", name: "Malayalam" }),
    Object.freeze({ code: "mt", name: "Maltese" }),
    Object.freeze({ code: "mam", name: "Mam" }),
    Object.freeze({ code: "gv", name: "Manx" }),
    Object.freeze({ code: "mi", name: "Maori" }),
    Object.freeze({ code: "mr", name: "Marathi" }),
    Object.freeze({ code: "mh", name: "Marshallese" }),
    Object.freeze({ code: "mwr", name: "Marwadi" }),
    Object.freeze({ code: "mfe", name: "Mauritian Creole" }),
    Object.freeze({ code: "chm", name: "Meadow Mari" }),
    Object.freeze({ code: "mni-Mtei", name: "Meiteilon (Manipuri)" }),
    Object.freeze({ code: "min", name: "Minang" }),
    Object.freeze({ code: "lus", name: "Mizo" }),
    Object.freeze({ code: "mn", name: "Mongolian" }),
    Object.freeze({ code: "my", name: "Myanmar (Burmese)" }),
    Object.freeze({ code: "nhe", name: "Nahuatl (Eastern Huasteca)" }),
    Object.freeze({ code: "ndc-ZW", name: "Ndau" }),
    Object.freeze({ code: "nr", name: "Ndebele (South)" }),
    Object.freeze({ code: "new", name: "Nepalbhasa (Newari)" }),
    Object.freeze({ code: "ne", name: "Nepali" }),
    Object.freeze({ code: "bm-Nkoo", name: "NKo" }),
    Object.freeze({ code: "no", name: "Norwegian" }),
    Object.freeze({ code: "nus", name: "Nuer" }),
    Object.freeze({ code: "oc", name: "Occitan" }),
    Object.freeze({ code: "or", name: "Odia (Oriya)" }),
    Object.freeze({ code: "om", name: "Oromo" }),
    Object.freeze({ code: "os", name: "Ossetian" }),
    Object.freeze({ code: "pag", name: "Pangasinan" }),
    Object.freeze({ code: "pap", name: "Papiamento" }),
    Object.freeze({ code: "ps", name: "Pashto" }),
    Object.freeze({ code: "fa", name: "Persian" }),
    Object.freeze({ code: "pl", name: "Polish" }),
    Object.freeze({ code: "pt", name: "Portuguese (Brazil)" }),
    Object.freeze({ code: "pt-PT", name: "Portuguese (Portugal)" }),
    Object.freeze({ code: "pa", name: "Punjabi (Gurmukhi)" }),
    Object.freeze({ code: "pa-Arab", name: "Punjabi (Shahmukhi)" }),
    Object.freeze({ code: "qu", name: "Quechua" }),
    Object.freeze({ code: "kek", name: "Qʼeqchiʼ" }),
    Object.freeze({ code: "rom", name: "Romani" }),
    Object.freeze({ code: "ro", name: "Romanian" }),
    Object.freeze({ code: "rn", name: "Rundi" }),
    Object.freeze({ code: "ru", name: "Russian" }),
    Object.freeze({ code: "se", name: "Sami (North)" }),
    Object.freeze({ code: "sm", name: "Samoan" }),
    Object.freeze({ code: "sg", name: "Sango" }),
    Object.freeze({ code: "sa", name: "Sanskrit" }),
    Object.freeze({ code: "sat-Latn", name: "Santali (Latin)" }),
    Object.freeze({ code: "sat", name: "Santali (Ol Chiki)" }),
    Object.freeze({ code: "gd", name: "Scots Gaelic" }),
    Object.freeze({ code: "nso", name: "Sepedi" }),
    Object.freeze({ code: "sr", name: "Serbian" }),
    Object.freeze({ code: "st", name: "Sesotho" }),
    Object.freeze({ code: "crs", name: "Seychellois Creole" }),
    Object.freeze({ code: "shn", name: "Shan" }),
    Object.freeze({ code: "sn", name: "Shona" }),
    Object.freeze({ code: "scn", name: "Sicilian" }),
    Object.freeze({ code: "szl", name: "Silesian" }),
    Object.freeze({ code: "sd", name: "Sindhi" }),
    Object.freeze({ code: "si", name: "Sinhala" }),
    Object.freeze({ code: "sk", name: "Slovak" }),
    Object.freeze({ code: "sl", name: "Slovenian" }),
    Object.freeze({ code: "so", name: "Somali" }),
    Object.freeze({ code: "es", name: "Spanish" }),
    Object.freeze({ code: "su", name: "Sundanese" }),
    Object.freeze({ code: "sus", name: "Susu" }),
    Object.freeze({ code: "sw", name: "Swahili" }),
    Object.freeze({ code: "ss", name: "Swati" }),
    Object.freeze({ code: "sv", name: "Swedish" }),
    Object.freeze({ code: "ty", name: "Tahitian" }),
    Object.freeze({ code: "tg", name: "Tajik" }),
    Object.freeze({ code: "ber-Latn", name: "Tamazight" }),
    Object.freeze({ code: "ber", name: "Tamazight (Tifinagh)" }),
    Object.freeze({ code: "ta", name: "Tamil" }),
    Object.freeze({ code: "tt", name: "Tatar" }),
    Object.freeze({ code: "te", name: "Telugu" }),
    Object.freeze({ code: "tet", name: "Tetum" }),
    Object.freeze({ code: "th", name: "Thai" }),
    Object.freeze({ code: "bo", name: "Tibetan" }),
    Object.freeze({ code: "ti", name: "Tigrinya" }),
    Object.freeze({ code: "tiv", name: "Tiv" }),
    Object.freeze({ code: "tpi", name: "Tok Pisin" }),
    Object.freeze({ code: "to", name: "Tongan" }),
    Object.freeze({ code: "lua", name: "Tshiluba" }),
    Object.freeze({ code: "ts", name: "Tsonga" }),
    Object.freeze({ code: "tn", name: "Tswana" }),
    Object.freeze({ code: "tcy", name: "Tulu" }),
    Object.freeze({ code: "tum", name: "Tumbuka" }),
    Object.freeze({ code: "tr", name: "Turkish" }),
    Object.freeze({ code: "tk", name: "Turkmen" }),
    Object.freeze({ code: "tyv", name: "Tuvan" }),
    Object.freeze({ code: "ak", name: "Twi" }),
    Object.freeze({ code: "udm", name: "Udmurt" }),
    Object.freeze({ code: "uk", name: "Ukrainian" }),
    Object.freeze({ code: "ur", name: "Urdu" }),
    Object.freeze({ code: "ug", name: "Uyghur" }),
    Object.freeze({ code: "uz", name: "Uzbek" }),
    Object.freeze({ code: "ve", name: "Venda" }),
    Object.freeze({ code: "vec", name: "Venetian" }),
    Object.freeze({ code: "vi", name: "Vietnamese" }),
    Object.freeze({ code: "war", name: "Waray" }),
    Object.freeze({ code: "cy", name: "Welsh" }),
    Object.freeze({ code: "wo", name: "Wolof" }),
    Object.freeze({ code: "xh", name: "Xhosa" }),
    Object.freeze({ code: "sah", name: "Yakut" }),
    Object.freeze({ code: "yi", name: "Yiddish" }),
    Object.freeze({ code: "yo", name: "Yoruba" }),
    Object.freeze({ code: "yua", name: "Yucatec Maya" }),
    Object.freeze({ code: "zap", name: "Zapotec" }),
    Object.freeze({ code: "zu", name: "Zulu" })
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

  function canonicalizeLanguageCode(value) {
    const language = String(value || "");

    return languageCodeAliases[language] || language;
  }

  function normalizeSourceLanguage(value) {
    const language = canonicalizeLanguageCode(value);

    if (sourceLanguageCodes.has(language)) {
      return language;
    }

    return defaultSourceLanguage;
  }

  function normalizeTargetLanguage(value) {
    const language = canonicalizeLanguageCode(value);

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
