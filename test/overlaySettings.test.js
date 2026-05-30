const assert = require("node:assert/strict");
const test = require("node:test");

const {
  defaultOverlayPosition,
  normalizeOverlayPosition,
  overlayPositionLabels,
  overlayPositionOptions
} = require("../src/overlaySettings");

test("defines bottom as the default overlay position", () => {
  assert.equal(defaultOverlayPosition, "bottom");
  assert.equal(overlayPositionOptions[0].value, "bottom");
});

test("normalizes overlay position values", () => {
  assert.equal(normalizeOverlayPosition("bottom"), "bottom");
  assert.equal(normalizeOverlayPosition("middle"), "middle");
  assert.equal(normalizeOverlayPosition("top"), "top");
  assert.equal(normalizeOverlayPosition(""), "bottom");
  assert.equal(normalizeOverlayPosition("left"), "bottom");
});

test("provides labels for every overlay position option", () => {
  for (const option of overlayPositionOptions) {
    assert.equal(overlayPositionLabels[option.value], option.label);
  }
});
