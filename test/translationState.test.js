const assert = require("node:assert/strict");
const test = require("node:test");

const { createTranslationState } = require("../src/translationState");

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, resolve, reject };
}

async function flushPromiseHandlers() {
  await new Promise((resolve) => setImmediate(resolve));
}

test("translation cache returns cached results without calling translator again", async () => {
  let calls = 0;
  const state = createTranslationState({
    translate(text) {
      calls += 1;
      return `${text} translated`;
    }
  });

  assert.equal(await state.getTranslation("hola"), "hola translated");
  assert.equal(await state.getTranslation("hola"), "hola translated");
  assert.equal(calls, 1);
});

test("concurrent duplicate translation requests reuse the pending Promise", async () => {
  const translation = deferred();
  let calls = 0;
  const state = createTranslationState({
    translate() {
      calls += 1;
      return translation.promise;
    }
  });

  const firstRequest = state.getTranslation("bonjour");
  const secondRequest = state.getTranslation("bonjour");

  assert.equal(firstRequest, secondRequest);
  assert.equal(calls, 1);

  translation.resolve("hello");

  assert.equal(await firstRequest, "hello");
  assert.equal(await secondRequest, "hello");
});

test("stale translation responses are ignored when the active caption changes", async () => {
  const firstTranslation = deferred();
  const secondTranslation = deferred();
  const translations = {
    first: firstTranslation,
    second: secondTranslation
  };
  const applied = [];
  const state = createTranslationState({
    translate(text) {
      return translations[text].promise;
    }
  });

  state.updateCaption("first", {
    onTranslation(translation, captionText) {
      applied.push({ translation, captionText });
    }
  });
  state.updateCaption("second", {
    onTranslation(translation, captionText) {
      applied.push({ translation, captionText });
    }
  });

  firstTranslation.resolve("stale");
  await firstTranslation.promise;
  await flushPromiseHandlers();

  assert.deepEqual(applied, []);

  secondTranslation.resolve("current");
  await secondTranslation.promise;
  await flushPromiseHandlers();

  assert.deepEqual(applied, [{ translation: "current", captionText: "second" }]);
});

test("disabled state prevents applying translation results", async () => {
  const translation = deferred();
  const applied = [];
  const state = createTranslationState({
    translate() {
      return translation.promise;
    }
  });

  state.updateCaption("hola", {
    onTranslation(result) {
      applied.push(result);
    }
  });
  state.setEnabled(false);

  translation.resolve("hello");
  await translation.promise;
  await flushPromiseHandlers();

  assert.deepEqual(applied, []);
});

test("empty or no caption state indicates overlay should be hidden", () => {
  const state = createTranslationState({
    translate() {
      throw new Error("Translator should not be called for empty captions.");
    }
  });

  assert.deepEqual(state.updateCaption(""), {
    visible: false,
    reason: "empty"
  });
  assert.deepEqual(state.updateCaption("   \n\t  "), {
    visible: false,
    reason: "empty"
  });
});

test("keeps previous translation visible while a new caption is translating", async () => {
  const firstTranslation = deferred();
  const secondTranslation = deferred();
  const translations = {
    first: firstTranslation,
    second: secondTranslation
  };
  const applied = [];
  const state = createTranslationState({
    translate(text) {
      return translations[text].promise;
    }
  });

  assert.deepEqual(
    state.updateCaption("first", {
      onTranslation(translation, captionText) {
        applied.push({ translation, captionText });
      }
    }),
    {
      visible: true,
      sourceText: "first",
      targetText: "",
      targetVisible: false,
      requestStarted: true
    }
  );

  firstTranslation.resolve("first translated");
  await firstTranslation.promise;
  await flushPromiseHandlers();

  assert.deepEqual(applied, [
    { translation: "first translated", captionText: "first" }
  ]);
  assert.deepEqual(
    state.updateCaption("second", {
      onTranslation(translation, captionText) {
        applied.push({ translation, captionText });
      }
    }),
    {
      visible: true,
      sourceText: "second",
      targetText: "first translated",
      targetVisible: true,
      requestStarted: true
    }
  );

  secondTranslation.resolve("second translated");
  await secondTranslation.promise;
  await flushPromiseHandlers();

  assert.deepEqual(applied, [
    { translation: "first translated", captionText: "first" },
    { translation: "second translated", captionText: "second" }
  ]);
});
