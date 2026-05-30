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
    const scheduleTimeout =
      (options && options.setTimeout) || ((callback, delay) => root.setTimeout(callback, delay));
    const clearScheduledTimeout =
      (options && options.clearTimeout) || ((timer) => root.clearTimeout(timer));
    const translationCache = new Map();
    const pendingTranslations = new Map();

    let isEnabled = !options || options.enabled !== false;
    let activeCaptionText = "";
    let requestedCaptionText = "";
    let lastTranslatedText = "";
    let activeTranslationRequestId = 0;
    let translationCacheGeneration = 0;
    let debounceTimer = null;

    function clearDebounceTimer() {
      if (!debounceTimer) {
        return;
      }

      clearScheduledTimeout(debounceTimer);
      debounceTimer = null;
    }

    function resetCaptionState() {
      clearDebounceTimer();
      activeCaptionText = "";
      requestedCaptionText = "";
      lastTranslatedText = "";
      activeTranslationRequestId += 1;
    }

    function clearTranslations() {
      clearDebounceTimer();
      translationCacheGeneration += 1;
      translationCache.clear();
      pendingTranslations.clear();
      requestedCaptionText = "";
      lastTranslatedText = "";
      activeTranslationRequestId += 1;
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

          if (handlers && typeof handlers.onError === "function") {
            handlers.onError(error, normalizedCaptionText);
          }
        });
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
        activeCaptionText = normalizedCaptionText;
        requestedCaptionText = "";
        activeTranslationRequestId += 1;
      }

      if (translationCache.has(normalizedCaptionText)) {
        lastTranslatedText = translationCache.get(normalizedCaptionText);

        return {
          visible: true,
          sourceText: normalizedCaptionText,
          targetText: lastTranslatedText,
          targetVisible: true,
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

      return {
        visible: true,
        sourceText: normalizedCaptionText,
        targetText: lastTranslatedText,
        targetVisible: Boolean(lastTranslatedText),
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
