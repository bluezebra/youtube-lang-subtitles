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
  assert.equal(sourceLanguageOptions[1].code, "en");
  assert.equal(sourceLanguageOptions.some((option) => option.code === "fi"), true);
});

test("target languages include English and shared options", () => {
  assert.equal(defaultTargetLanguage, "en");
  assert.equal(targetLanguageOptions[0].code, "en");
  assert.equal(targetLanguageOptions.some((option) => option.code === "fi"), true);
  assert.equal(targetLanguageOptions.some((option) => option.code === "auto"), false);
});

test("normalizes source and target languages", () => {
  assert.equal(normalizeSourceLanguage("en"), "en");
  assert.equal(normalizeSourceLanguage("zh-CN"), "zh-CN");
  assert.equal(normalizeSourceLanguage(""), "auto");
  assert.equal(normalizeTargetLanguage("zh-TW"), "zh-TW");
  assert.equal(normalizeTargetLanguage("auto"), "en");
  assert.equal(normalizeTargetLanguage(""), "en");
});

test("provides labels for every popup option", () => {
  for (const option of sourceLanguageOptions.concat(targetLanguageOptions)) {
    assert.equal(languageNames[option.code], option.name);
  }
});
