const assert = require("node:assert/strict");
const test = require("node:test");

const {
  defaultSourceLanguage,
  defaultTargetLanguage,
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
});

test("target languages include English and shared options", () => {
  assert.equal(defaultTargetLanguage, "en");
  assert.equal(targetLanguageOptions[0].code, "en");
  assert.equal(targetLanguageOptions.some((option) => option.code === "fi"), true);
  assert.equal(targetLanguageOptions.some((option) => option.code === "auto"), false);
});

test("orders language options for convenient defaults", () => {
  const sourceCodes = sourceLanguageOptions.map((option) => option.code);
  const targetCodes = targetLanguageOptions.map((option) => option.code);

  assert.deepEqual(sourceCodes.slice(0, 4), ["auto", "ar", "bn", "zh-CN"]);
  assert.equal(sourceCodes.filter((code) => code === "en").length, 1);
  assert.equal(targetCodes[0], "en");
  assert.equal(targetCodes.filter((code) => code === "en").length, 1);
});

test("normalizes source and target languages", () => {
  assert.equal(normalizeSourceLanguage("en"), "en");
  assert.equal(normalizeSourceLanguage("zh-CN"), "zh-CN");
  assert.equal(normalizeSourceLanguage("id"), "id");
  assert.equal(normalizeSourceLanguage("fa"), "fa");
  assert.equal(normalizeSourceLanguage(""), "auto");
  assert.equal(normalizeTargetLanguage("zh-TW"), "zh-TW");
  assert.equal(normalizeTargetLanguage("he"), "he");
  assert.equal(normalizeTargetLanguage("ur"), "ur");
  assert.equal(normalizeTargetLanguage("auto"), "en");
  assert.equal(normalizeTargetLanguage(""), "en");
});

test("includes popular additional language options", () => {
  const expectedLanguages = [
    ["bn", "Bengali"],
    ["cs", "Czech"],
    ["da", "Danish"],
    ["el", "Greek"],
    ["fa", "Persian"],
    ["he", "Hebrew"],
    ["hu", "Hungarian"],
    ["id", "Indonesian"],
    ["ms", "Malay"],
    ["ro", "Romanian"],
    ["th", "Thai"],
    ["ur", "Urdu"],
    ["vi", "Vietnamese"]
  ];

  for (const [code, name] of expectedLanguages) {
    assert.equal(sourceLanguageOptions.some((option) => option.code === code && option.name === name), true);
    assert.equal(targetLanguageOptions.some((option) => option.code === code && option.name === name), true);
  }
});

test("provides labels for every popup option", () => {
  for (const option of sourceLanguageOptions.concat(targetLanguageOptions)) {
    assert.equal(languageNames[option.code], option.name);
  }
});
