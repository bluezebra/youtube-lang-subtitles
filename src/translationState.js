(function (root) {
  function normalizeCaptionText(text) {
    return String(text || "").replace(/\s+/g, " ").trim();
  }

  function normalizeDebounceMs(value) {
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  function createTranslationState(options) {
    const translate = options && options.translate;

    if (typeof translate !== "function") {
      throw new Error("translate must be a function.");
    }

    let debounceMs = normalizeDebounceMs(options && options.debounceMs);
    let sourceDelayMs = normalizeDebounceMs(options && options.sourceDelayMs);
    const scheduleTimeout =
      (options && options.setTimeout) || ((callback, delay) => root.setTimeout(callback, delay));
    const clearScheduledTimeout =
      (options && options.clearTimeout) || ((timer) => root.clearTimeout(timer));
    const translationCache = new Map();
    const pendingTranslations = new Map();

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

    function clearDebounceTimer() {
      if (!debounceTimer) {
        return;
      }

      clearScheduledTimeout(debounceTimer);
      debounceTimer = null;
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

    function requestTranslation(normalizedCaptionText, requestId, handlers) {
      getTranslation(normalizedCaptionText)
        .then((translation) => {
          if (
            !isEnabled ||
            requestId !== activeTranslationRequestId ||
            normalizedCaptionText !== activeCaptionText
          ) {
            return;
          }

          lastTranslatedText = translation;
          lastTranslatedCaptionText = normalizedCaptionText;
          revealSourceCaption(normalizedCaptionText);

          if (handlers && typeof handlers.onTranslation === "function") {
            handlers.onTranslation(translation, normalizedCaptionText);
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
      setEnabled,
      updateCaption
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
