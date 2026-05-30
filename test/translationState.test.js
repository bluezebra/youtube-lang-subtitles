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

function createManualScheduler() {
  const timers = [];

  return {
    timers,
    setTimeout(callback, delay) {
      const timer = {
        callback,
        cleared: false,
        delay
      };

      timers.push(timer);
      return timer;
    },
    clearTimeout(timer) {
      timer.cleared = true;
    },
    runPending() {
      for (const timer of timers) {
        if (!timer.cleared) {
          timer.callback();
        }
      }
    }
  };
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

test("debounces rapid partial caption changes before translating the latest caption", async () => {
  const scheduler = createManualScheduler();
  const translatedTexts = [];
  const applied = [];
  const state = createTranslationState({
    debounceMs: 200,
    setTimeout: scheduler.setTimeout,
    clearTimeout: scheduler.clearTimeout,
    translate(text) {
      translatedTexts.push(text);
      return `${text} translated`;
    }
  });

  assert.deepEqual(
    state.updateCaption("hel", {
      onTranslation(translation, captionText) {
        applied.push({ translation, captionText });
      }
    }),
    {
      visible: true,
      sourceText: "hel",
      targetText: "",
      targetVisible: false,
      requestStarted: true
    }
  );
  assert.equal(scheduler.timers[0].delay, 200);
  assert.deepEqual(translatedTexts, []);

  assert.deepEqual(
    state.updateCaption("hello", {
      onTranslation(translation, captionText) {
        applied.push({ translation, captionText });
      }
    }),
    {
      visible: true,
      sourceText: "hello",
      targetText: "",
      targetVisible: false,
      requestStarted: true
    }
  );
  assert.equal(scheduler.timers[0].cleared, true);
  assert.equal(scheduler.timers[1].delay, 200);
  assert.deepEqual(translatedTexts, []);

  scheduler.runPending();
  await flushPromiseHandlers();

  assert.deepEqual(translatedTexts, ["hello"]);
  assert.deepEqual(applied, [
    { translation: "hello translated", captionText: "hello" }
  ]);
});

test("updates debounce delay for future caption requests", () => {
  const scheduler = createManualScheduler();
  const translatedTexts = [];
  const state = createTranslationState({
    debounceMs: 100,
    setTimeout: scheduler.setTimeout,
    clearTimeout: scheduler.clearTimeout,
    translate(text) {
      translatedTexts.push(text);
      return `${text} translated`;
    }
  });

  state.updateCaption("first");
  assert.equal(scheduler.timers[0].delay, 100);

  state.setDebounceMs(350);
  state.updateCaption("second");

  assert.equal(scheduler.timers[0].cleared, true);
  assert.equal(scheduler.timers[1].delay, 350);
  assert.deepEqual(translatedTexts, []);
});
