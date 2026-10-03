(function (root) {
  function normalizeCaptionText(text) {
    return String(text || "").replace(/\s+/g, " ").trim();
  }

  function normalizeDebounceMs(value) {
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  function splitIntoSentences(text) {
    return normalizeCaptionText(text)
      .split(/(?<=[.!?…])\s+/)
      .filter(Boolean);
  }

  function createTranslationState(options) {
    const translate = options && options.translate;

    if (typeof translate !== "function") {
      throw new Error("translate must be a function.");
    }

    let debounceMs = normalizeDebounceMs(options && options.debounceMs);
    let sourceDelayMs = normalizeDebounceMs(options && options.sourceDelayMs);
    let maxWaitMs = normalizeDebounceMs(options && options.maxWaitMs);
    const sentenceChunking = Boolean(options && options.sentenceChunking);
    const scheduleTimeout =
      (options && options.setTimeout) || ((callback, delay) => root.setTimeout(callback, delay));
    const clearScheduledTimeout =
      (options && options.clearTimeout) || ((timer) => root.clearTimeout(timer));
    const translationCache = new Map();
    const pendingTranslations = new Map();
    const committedHandlers = new Set();
 
    let isEnabled = !options || options.enabled !== false;
    let activeCaptionText = "";
    let requestedCaptionText = "";
    let displayedCaptionText = "";
    let lastTranslatedText = "";
    let lastTranslatedCaptionText = "";
    let activeTranslationRequestId = 0;
    let translationCacheGeneration = 0;
    let debounceTimer = null;
    let sourceDelayTimer = null;
    let sourceDelayCaptionText = "";
    let sourceDelayHandlers = null;
    let maxWaitTimer = null;
    let latestHandlers = null;

    function subscribeCommitted(handler) {
      if (typeof handler !== "function") {
        throw new Error("subscribeCommitted requires a function handler");
      }
      committedHandlers.add(handler);
      return () => committedHandlers.delete(handler);
    }

    function clearDebounceTimer() {
      if (!debounceTimer) {
        return;
      }

      clearScheduledTimeout(debounceTimer);
      debounceTimer = null;
    }

    function clearMaxWaitTimer() {
      if (!maxWaitTimer) {
        return;
      }

      clearScheduledTimeout(maxWaitTimer);
      maxWaitTimer = null;
    }

    // While auto-generated captions keep growing, the debounce timer is reset on every
    // change and no request would be sent. The max-wait timer forces a request for the
    // latest caption so the translation never falls more than maxWaitMs behind.
    function startMaxWaitTimer() {
      if (!maxWaitMs || maxWaitTimer) {
        return;
      }

      maxWaitTimer = scheduleTimeout(() => {
        maxWaitTimer = null;

        if (
          !isEnabled ||
          !activeCaptionText ||
          translationCache.has(activeCaptionText) ||
          (requestedCaptionText === activeCaptionText && !debounceTimer)
        ) {
          return;
        }

        clearDebounceTimer();
        requestedCaptionText = activeCaptionText;
        requestTranslation(activeCaptionText, activeTranslationRequestId, latestHandlers);
      }, maxWaitMs);
    }

    // A translation for an earlier, word-boundary prefix of the current caption is
    // still a useful (stale) preview while the full caption is being translated.
    function isUsefulPrefixTranslation(normalizedCaptionText) {
      if (!activeCaptionText.startsWith(`${normalizedCaptionText} `)) {
        return false;
      }

      return (
        !lastTranslatedCaptionText ||
        !activeCaptionText.startsWith(lastTranslatedCaptionText) ||
        normalizedCaptionText.length > lastTranslatedCaptionText.length
      );
    }

    function clearSourceDelayTimer() {
      if (!sourceDelayTimer) {
        sourceDelayCaptionText = "";
        sourceDelayHandlers = null;
        return;
      }

      clearScheduledTimeout(sourceDelayTimer);
      sourceDelayTimer = null;
      sourceDelayCaptionText = "";
      sourceDelayHandlers = null;
    }

    function resetCaptionState() {
      clearDebounceTimer();
      clearMaxWaitTimer();
      clearSourceDelayTimer();
      activeCaptionText = "";
      requestedCaptionText = "";
      displayedCaptionText = "";
      lastTranslatedText = "";
      lastTranslatedCaptionText = "";
      activeTranslationRequestId += 1;
    }

    function clearTranslations() {
      clearDebounceTimer();
      clearMaxWaitTimer();
      clearSourceDelayTimer();
      translationCacheGeneration += 1;
      translationCache.clear();
      pendingTranslations.clear();
      requestedCaptionText = "";
      lastTranslatedText = "";
      lastTranslatedCaptionText = "";
      activeTranslationRequestId += 1;
    }

    function revealSourceCaption(normalizedCaptionText) {
      clearSourceDelayTimer();
      displayedCaptionText = normalizedCaptionText;
    }

    function getTranslation(text) {
      const normalizedText = normalizeCaptionText(text);

      if (translationCache.has(normalizedText)) {
        return Promise.resolve(translationCache.get(normalizedText));
      }

      if (pendingTranslations.has(normalizedText)) {
        return pendingTranslations.get(normalizedText);
      }

      const cacheGeneration = translationCacheGeneration;
      const pendingTranslation = Promise.resolve(translate(normalizedText))
        .then((translation) => {
          if (cacheGeneration === translationCacheGeneration) {
            translationCache.set(normalizedText, translation);
          }

          return translation;
        })
        .finally(() => {
          if (cacheGeneration === translationCacheGeneration) {
            pendingTranslations.delete(normalizedText);
          }
        });

      pendingTranslations.set(normalizedText, pendingTranslation);
      return pendingTranslation;
    }

    // Translating completed sentences separately lets growing captions reuse cached
    // sentence translations, so only the unfinished tail needs a new request.
    function getChunkedTranslation(text) {
      const chunks = sentenceChunking ? splitIntoSentences(text) : [text];

      if (chunks.length < 2) {
        return getTranslation(text);
      }

      return Promise.all(chunks.map(getTranslation)).then((translations) =>
        translations.map(normalizeCaptionText).filter(Boolean).join(" ")
      );
    }

    function setEnabled(enabled) {
      const normalizedEnabled = enabled !== false;

      if (isEnabled === normalizedEnabled) {
        return;
      }

      isEnabled = normalizedEnabled;

      if (!isEnabled) {
        resetCaptionState();
      }
    }

    function setDebounceMs(value) {
      debounceMs = normalizeDebounceMs(value);
    }

    function setMaxWaitMs(value) {
      maxWaitMs = normalizeDebounceMs(value);

      if (!maxWaitMs) {
        clearMaxWaitTimer();
      }
    }

    function applyPrefixTranslation(translation, normalizedCaptionText, handlers) {
      lastTranslatedText = translation;
      lastTranslatedCaptionText = normalizedCaptionText;

      if (!displayedCaptionText) {
        revealSourceCaption(activeCaptionText);
      }

      if (handlers && typeof handlers.onStaleTranslation === "function") {
        handlers.onStaleTranslation(translation, normalizedCaptionText);
      }
    }

    function requestTranslation(normalizedCaptionText, requestId, handlers) {
      const cacheGeneration = translationCacheGeneration;

      getChunkedTranslation(normalizedCaptionText)
        .then((translation) => {
          if (
            !isEnabled ||
            requestId !== activeTranslationRequestId ||
            normalizedCaptionText !== activeCaptionText
          ) {
            if (
              isEnabled &&
              cacheGeneration === translationCacheGeneration &&
              isUsefulPrefixTranslation(normalizedCaptionText)
            ) {
              applyPrefixTranslation(translation, normalizedCaptionText, handlers);
            }

            return;
          }

          lastTranslatedText = translation;
          lastTranslatedCaptionText = normalizedCaptionText;
          revealSourceCaption(normalizedCaptionText);

          if (handlers && typeof handlers.onTranslation === "function") {
            handlers.onTranslation(translation, normalizedCaptionText);
          }

          // Notify committed handlers that a stable translation arrived.
          try {
            const committedEntry = {
              ts: Date.now(),
              sourceText: normalizedCaptionText,
              targetText: translation
            };

            for (const h of committedHandlers) {
              try {
                h(committedEntry);
              } catch (e) {
                // Swallow handler errors to avoid breaking translation flow
                /* eslint-disable no-console */
                console.error("committed handler error", e);
                /* eslint-enable no-console */
              }
            }
          } catch (e) {
            /* noop */
          }
        })
        .catch((error) => {
          if (
            !isEnabled ||
            requestId !== activeTranslationRequestId ||
            normalizedCaptionText !== activeCaptionText
          ) {
            return;
          }

          revealSourceCaption(normalizedCaptionText);

          if (handlers && typeof handlers.onError === "function") {
            handlers.onError(error, normalizedCaptionText);
          }
        });
    }

    function scheduleSourceReveal(normalizedCaptionText, requestId, handlers) {
      if (displayedCaptionText === normalizedCaptionText) {
        return;
      }

      if (!sourceDelayMs) {
        displayedCaptionText = normalizedCaptionText;
        return;
      }

      sourceDelayHandlers = handlers;

      if (sourceDelayTimer && sourceDelayCaptionText === normalizedCaptionText) {
        return;
      }

      clearSourceDelayTimer();
      sourceDelayCaptionText = normalizedCaptionText;
      sourceDelayHandlers = handlers;
      sourceDelayTimer = scheduleTimeout(() => {
        const captionTextToReveal = sourceDelayCaptionText;
        const handlersToNotify = sourceDelayHandlers;

        sourceDelayTimer = null;
        sourceDelayCaptionText = "";
        sourceDelayHandlers = null;

        if (
          !isEnabled ||
          requestId !== activeTranslationRequestId ||
          captionTextToReveal !== activeCaptionText
        ) {
          return;
        }

        displayedCaptionText = captionTextToReveal;

        if (handlersToNotify && typeof handlersToNotify.onSourceDelayElapsed === "function") {
          handlersToNotify.onSourceDelayElapsed(captionTextToReveal);
        }
      }, sourceDelayMs);
    }

    function scheduleTranslation(normalizedCaptionText, requestId, handlers) {
      clearDebounceTimer();

      if (!debounceMs) {
        requestTranslation(normalizedCaptionText, requestId, handlers);
        return;
      }

      debounceTimer = scheduleTimeout(() => {
        debounceTimer = null;
        clearMaxWaitTimer();

        if (
          !isEnabled ||
          requestId !== activeTranslationRequestId ||
          normalizedCaptionText !== activeCaptionText
        ) {
          return;
        }

        requestTranslation(normalizedCaptionText, requestId, handlers);
      }, debounceMs);
    }

    function updateCaption(captionText, handlers) {
      const normalizedCaptionText = normalizeCaptionText(captionText);

      if (!isEnabled) {
        return {
          visible: false,
          reason: "disabled"
        };
      }

      if (!normalizedCaptionText) {
        resetCaptionState();
        return {
          visible: false,
          reason: "empty"
        };
      }

      if (normalizedCaptionText !== activeCaptionText) {
        clearDebounceTimer();
        clearSourceDelayTimer();
        activeCaptionText = normalizedCaptionText;
        requestedCaptionText = "";
        activeTranslationRequestId += 1;
      }

      latestHandlers = handlers;

      if (translationCache.has(normalizedCaptionText)) {
        revealSourceCaption(normalizedCaptionText);
        lastTranslatedText = translationCache.get(normalizedCaptionText);
        lastTranslatedCaptionText = normalizedCaptionText;

        return {
          visible: true,
          sourceText: normalizedCaptionText,
          targetText: lastTranslatedText,
          targetVisible: true,
          targetStale: false,
          requestStarted: false
        };
      }

      let requestStarted = false;

      if (requestedCaptionText !== normalizedCaptionText) {
        requestStarted = true;
        requestedCaptionText = normalizedCaptionText;
        const requestId = activeTranslationRequestId;

        scheduleTranslation(normalizedCaptionText, requestId, handlers);

        if (debounceTimer) {
          startMaxWaitTimer();
        }
      }

      scheduleSourceReveal(normalizedCaptionText, activeTranslationRequestId, handlers);

      const targetText = displayedCaptionText ? lastTranslatedText : "";

      return {
        visible: true,
        sourceText: displayedCaptionText,
        targetText,
        targetVisible: Boolean(targetText),
        targetStale: Boolean(
          targetText && displayedCaptionText !== lastTranslatedCaptionText
        ),
        requestStarted
      };
    }

    return {
      clearTranslations,
      getTranslation,
      normalizeCaptionText,
      setDebounceMs,
      setMaxWaitMs,
      setEnabled,
      updateCaption,
      subscribeCommitted
    };
  }

  const api = {
    createTranslationState,
    normalizeDebounceMs,
    normalizeCaptionText
  };

  root.YtDualSubtitlesTranslationState = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
