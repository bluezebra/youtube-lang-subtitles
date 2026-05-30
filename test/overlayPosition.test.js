const assert = require("node:assert/strict");
const test = require("node:test");

const { calculateOverlayPosition } = require("../src/overlayPosition");

test("centers the overlay over the YouTube player", () => {
  const position = calculateOverlayPosition(
    { left: 100, right: 1100, top: 100, bottom: 700, width: 1000, height: 600 },
    { width: 1200, height: 800 }
  );

  assert.deepEqual(position, {
    left: 600,
    bottom: 160,
    width: 900
  });
});

test("uses player width when the player is narrower than the maximum overlay width", () => {
  const position = calculateOverlayPosition(
    { left: 50, right: 550, top: 100, bottom: 450, width: 500, height: 350 },
    { width: 900, height: 600 }
  );

  assert.equal(position.width, 468);
  assert.equal(position.left, 300);
});

test("clamps the overlay center when the player is partly outside the viewport", () => {
  const position = calculateOverlayPosition(
    { left: -200, right: 600, top: 0, bottom: 500, width: 800, height: 500 },
    { width: 1000, height: 700 }
  );

  assert.equal(position.left, 400);
  assert.equal(position.width, 768);
});

test("returns null when player or viewport dimensions are not usable", () => {
  assert.equal(
    calculateOverlayPosition(
      { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 500 },
      { width: 1000, height: 700 }
    ),
    null
  );
  assert.equal(
    calculateOverlayPosition(
      { left: 0, right: 1000, top: 0, bottom: 500, width: 1000, height: 500 },
      { width: 0, height: 700 }
    ),
    null
  );
});
