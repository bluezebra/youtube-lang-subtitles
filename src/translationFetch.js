(function (root) {
  const timeoutErrorCode = "TRANSLATE_TIMEOUT";
  const defaultRequestTimeoutMs = 1200;
  const defaultHedgeDelayMs = 600;

  function createTimeoutError() {
    const error = new Error("Google Translate request timed out.");
    error.code = timeoutErrorCode;
    return error;
  }

  function isTimeoutError(error) {
    return Boolean(error && error.code === timeoutErrorCode);
  }

  function createTranslationFetcher(options = {}) {
    const fetchImpl = options.fetch || root.fetch.bind(root);
    const setTimer = options.setTimeout || root.setTimeout.bind(root);
    const clearTimer = options.clearTimeout || root.clearTimeout.bind(root);
    const AbortControllerImpl = options.AbortController || root.AbortController;
    const requestTimeoutMs = options.requestTimeoutMs ?? defaultRequestTimeoutMs;
    const hedgeDelayMs = options.hedgeDelayMs ?? defaultHedgeDelayMs;

    async function fetchAttempt(url, abortController) {
      const timeoutId = setTimer(() => abortController.abort(), requestTimeoutMs);

      try {
        return await fetchImpl(String(url), { signal: abortController.signal });
      } catch (error) {
        if (error && error.name === "AbortError") {
          throw createTimeoutError();
        }

        throw error;
      } finally {
        clearTimer(timeoutId);
      }
    }

    // Starts a second identical request if the first is slow; the first response wins and the other is aborted.
    function fetchHedged(url) {
      return new Promise((resolve, reject) => {
        const controllers = [];
        let settled = false;
        let pendingAttempts = 0;
        let firstError = null;
        let hedgeTimeoutId = null;

        const finish = (callback) => {
          settled = true;
          clearTimer(hedgeTimeoutId);
          callback();
        };

        const startAttempt = () => {
          const abortController = new AbortControllerImpl();
          controllers.push(abortController);
          pendingAttempts += 1;

          fetchAttempt(url, abortController).then(
            (response) => {
              if (settled) {
                return;
              }

              finish(() => {
                controllers
                  .filter((controller) => controller !== abortController)
                  .forEach((controller) => controller.abort());
                resolve(response);
              });
            },
            (error) => {
              pendingAttempts -= 1;
              firstError = firstError || error;

              if (!settled && pendingAttempts === 0) {
                finish(() => reject(firstError));
              }
            }
          );
        };

        startAttempt();
        hedgeTimeoutId = setTimer(() => {
          if (!settled) {
            startAttempt();
          }
        }, hedgeDelayMs);
      });
    }

    async function fetchTranslationResponse(url) {
      try {
        return await fetchHedged(url);
      } catch (error) {
        if (isTimeoutError(error)) {
          return fetchHedged(url);
        }

        throw error;
      }
    }

    return { fetchTranslationResponse };
  }

  const api = {
    createTranslationFetcher,
    isTimeoutError
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  root.YtDualSubtitlesTranslationFetch = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
