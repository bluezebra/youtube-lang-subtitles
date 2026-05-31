const assert = require("node:assert/strict");
const test = require("node:test");

const {
  formatTranslationErrorForOverlay,
  isExtensionContextInvalidatedError
} = require("../src/translationErrors");

test("detects extension context invalidation errors", () => {
  assert.equal(isExtensionContextInvalidatedError(new Error("Extension context invalidated.")), true);
  assert.equal(isExtensionContextInvalidatedError("extension context invalidated"), true);
  assert.equal(isExtensionContextInvalidatedError(new Error("Network request failed.")), false);
});

test("uses a short refresh prompt for extension update errors", () => {
  assert.equal(
    formatTranslationErrorForOverlay(new Error("Extension context invalidated.")),
    "Refresh page to resume subtitles."
  );
});

test("keeps generic translation errors short", () => {
  assert.equal(
    formatTranslationErrorForOverlay(new Error("Google Translate request failed: 500 Internal Server Error")),
    "Translation failed."
  );
});
