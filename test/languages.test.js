const assert = require("node:assert/strict");
const test = require("node:test");

const {
  defaultSourceLanguage,
  defaultTargetLanguage,
  filterLanguageOptions,
  languageNames,
  normalizeSourceLanguage,
  normalizeTargetLanguage,
  sourceLanguageOptions,
  targetLanguageOptions
} = require("../src/languages");

test("source languages include auto-detect and shared options", () => {
  assert.equal(defaultSourceLanguage, "auto");
  assert.equal(sourceLanguageOptions[0].code, "auto");
  assert.equal(sourceLanguageOptions.some((option) => option.code === "fi"), true);
  assert.equal(sourceLanguageOptions.some((option) => option.code === "en"), true);
  assert.equal(sourceLanguageOptions.length > 240, true);
});

test("target languages include English and shared options", () => {
  assert.equal(defaultTargetLanguage, "en");
  assert.equal(targetLanguageOptions[0].code, "en");
  assert.equal(targetLanguageOptions.some((option) => option.code === "fi"), true);
  assert.equal(targetLanguageOptions.some((option) => option.code === "auto"), false);
  assert.equal(targetLanguageOptions.length > 240, true);
});

test("orders language options for convenient defaults", () => {
  const sourceCodes = sourceLanguageOptions.map((option) => option.code);
  const targetCodes = targetLanguageOptions.map((option) => option.code);

  assert.deepEqual(sourceCodes.slice(0, 4), ["auto", "ab", "ace", "ach"]);
  assert.equal(sourceCodes.filter((code) => code === "en").length, 1);
  assert.deepEqual(targetCodes.slice(0, 4), ["en", "ab", "ace", "ach"]);
  assert.equal(targetCodes.filter((code) => code === "en").length, 1);
});

test("normalizes source and target languages", () => {
  assert.equal(normalizeSourceLanguage("en"), "en");
  assert.equal(normalizeSourceLanguage("zh-CN"), "zh-CN");
  assert.equal(normalizeSourceLanguage("id"), "id");
  assert.equal(normalizeSourceLanguage("fa"), "fa");
  assert.equal(normalizeSourceLanguage("he"), "iw");
  assert.equal(normalizeSourceLanguage("fil"), "tl");
  assert.equal(normalizeSourceLanguage("zh"), "zh-CN");
  assert.equal(normalizeSourceLanguage(""), "auto");
  assert.equal(normalizeTargetLanguage("zh-TW"), "zh-TW");
  assert.equal(normalizeTargetLanguage("he"), "iw");
  assert.equal(normalizeTargetLanguage("iw"), "iw");
  assert.equal(normalizeTargetLanguage("fil"), "tl");
  assert.equal(normalizeTargetLanguage("ur"), "ur");
  assert.equal(normalizeTargetLanguage("auto"), "en");
  assert.equal(normalizeTargetLanguage(""), "en");
});

test("includes broad Google Translate language options", () => {
  const expectedLanguages = [
    ["ab", "Abkhaz"],
    ["af", "Afrikaans"],
    ["bn", "Bengali"],
    ["cs", "Czech"],
    ["da", "Danish"],
    ["el", "Greek"],
    ["fa", "Persian"],
    ["iw", "Hebrew"],
    ["hu", "Hungarian"],
    ["id", "Indonesian"],
    ["jw", "Javanese"],
    ["kn", "Kannada"],
    ["ms", "Malay"],
    ["pt-PT", "Portuguese (Portugal)"],
    ["ro", "Romanian"],
    ["sw", "Swahili"],
    ["ta", "Tamil"],
    ["te", "Telugu"],
    ["th", "Thai"],
    ["tl", "Filipino"],
    ["ur", "Urdu"],
    ["vi", "Vietnamese"],
    ["zu", "Zulu"]
  ];

  for (const [code, name] of expectedLanguages) {
    assert.equal(sourceLanguageOptions.some((option) => option.code === code && option.name === name), true);
    assert.equal(targetLanguageOptions.some((option) => option.code === code && option.name === name), true);
  }
});

test("filters language options by name or code", () => {
  assert.deepEqual(
    filterLanguageOptions(targetLanguageOptions, "indo").map((option) => option.code),
    ["id"]
  );
  assert.deepEqual(
    filterLanguageOptions(targetLanguageOptions, "persian").map((option) => option.code),
    ["fa"]
  );
  assert.deepEqual(
    filterLanguageOptions(targetLanguageOptions, "hebrew").map((option) => option.code),
    ["iw"]
  );
  assert.deepEqual(
    filterLanguageOptions(targetLanguageOptions, "ZH").map((option) => option.code),
    ["zh-CN", "zh-TW"]
  );
  assert.equal(filterLanguageOptions(targetLanguageOptions, "").length, targetLanguageOptions.length);
});

test("provides labels for every popup option", () => {
  for (const option of sourceLanguageOptions.concat(targetLanguageOptions)) {
    assert.equal(languageNames[option.code], option.name);
  }
});
