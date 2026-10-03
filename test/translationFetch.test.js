const test = require("node:test");
const assert = require("node:assert/strict");
const { createTranslationFetcher, isTimeoutError } = require("../src/translationFetch.js");

function createFakeClock() {
  let now = 0;
  let nextId = 1;
  const timers = new Map();

  return {
    setTimeout(callback, delay) {
      const id = nextId++;
      timers.set(id, { callback, at: now + delay });
      return id;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
    async advance(ms) {
      const target = now + ms;
      for (;;) {
        const due = [...timers.entries()]
          .filter(([, timer]) => timer.at <= target)
          .sort((a, b) => a[1].at - b[1].at)[0];
        if (!due) {
          break;
        }
        timers.delete(due[0]);
        now = due[1].at;
        due[1].callback();
        await flush();
      }
      now = target;
      await flush();
    }
  };
}

async function flush() {
  for (let i = 0; i < 10; i += 1) {
    await Promise.resolve();
  }
}

function createFakeFetch() {
  const calls = [];

  function fetch(url, { signal }) {
    return new Promise((resolve, reject) => {
      const call = { url, signal, resolve, reject };
      calls.push(call);
      signal.addEventListener("abort", () => {
        const error = new Error("aborted");
        error.name = "AbortError";
        reject(error);
      });
    });
  }

  return { fetch, calls };
}

function setup() {
  const clock = createFakeClock();
  const fakeFetch = createFakeFetch();
  const fetcher = createTranslationFetcher({
    fetch: fakeFetch.fetch,
    setTimeout: clock.setTimeout,
    clearTimeout: clock.clearTimeout,
    requestTimeoutMs: 1200,
    hedgeDelayMs: 600
  });
  return { clock, calls: fakeFetch.calls, fetcher };
}

test("returns the first response without hedging when it arrives quickly", async () => {
  const { clock, calls, fetcher } = setup();
  const result = fetcher.fetchTranslationResponse("https://example.test/t");

  await clock.advance(100);
  calls[0].resolve("first");

  assert.equal(await result, "first");
  await clock.advance(2000);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://example.test/t");
});

test("starts a hedge request after the delay and aborts the slower attempt", async () => {
  const { clock, calls, fetcher } = setup();
  const result = fetcher.fetchTranslationResponse("https://example.test/t");

  await clock.advance(600);
  assert.equal(calls.length, 2);

  calls[1].resolve("hedge");

  assert.equal(await result, "hedge");
  assert.equal(calls[0].signal.aborted, true);
  assert.equal(calls[1].signal.aborted, false);
});

test("rejects with the first error when every attempt fails", async () => {
  const { clock, calls, fetcher } = setup();
  const result = fetcher.fetchTranslationResponse("https://example.test/t");

  await clock.advance(600);
  calls[0].reject(new Error("first failure"));
  await flush();
  calls[1].reject(new Error("second failure"));

  await assert.rejects(result, /first failure/);
  assert.equal(calls.length, 2);
});

test("does not start a hedge request when the first attempt fails early", async () => {
  const { clock, calls, fetcher } = setup();
  const result = fetcher.fetchTranslationResponse("https://example.test/t");

  calls[0].reject(new Error("network down"));

  await assert.rejects(result, /network down/);
  await clock.advance(2000);
  assert.equal(calls.length, 1);
});

test("retries once after a timeout and returns the retry response", async () => {
  const { clock, calls, fetcher } = setup();
  const result = fetcher.fetchTranslationResponse("https://example.test/t");

  await clock.advance(1800);
  assert.equal(calls.length, 3);
  assert.equal(calls[0].signal.aborted, true);
  assert.equal(calls[1].signal.aborted, true);

  calls[2].resolve("retry");

  assert.equal(await result, "retry");
});

test("surfaces a timeout error when the retry also times out", async () => {
  const { clock, calls, fetcher } = setup();
  const result = fetcher.fetchTranslationResponse("https://example.test/t");
  const settled = result.catch((error) => error);

  await clock.advance(1800);
  await clock.advance(1800);

  const error = await settled;
  assert.equal(isTimeoutError(error), true);
  assert.equal(calls.length, 4);
});
