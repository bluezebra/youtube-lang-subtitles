(function (root) {
  function normalizeCaptionText(text) {
    return String(text || "").replace(/\s+/g, " ").trim();
  }

  function createTranslationState(options) {
    const translate = options && options.translate;

    if (typeof translate !== "function") {
      throw new Error("translate must be a function.");
    }

    const translationCache = new Map();
    const pendingTranslations = new Map();

    let isEnabled = !options || options.enabled !== false;
    let activeCaptionText = "";
    let requestedCaptionText = "";
    let lastTranslatedText = "";
    let activeTranslationRequestId = 0;

    function resetCaptionState() {
      activeCaptionText = "";
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

      const pendingTranslation = Promise.resolve(translate(normalizedText))
        .then((translation) => {
          translationCache.set(normalizedText, translation);
          return translation;
        })
        .finally(() => {
          pendingTranslations.delete(normalizedText);
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

      return {
        visible: true,
        sourceText: normalizedCaptionText,
        targetText: lastTranslatedText,
        targetVisible: Boolean(lastTranslatedText),
        requestStarted
      };
    }

    return {
      getTranslation,
      normalizeCaptionText,
      setEnabled,
      updateCaption
    };
  }

  const api = {
    createTranslationState,
    normalizeCaptionText
  };

  root.YtDualSubtitlesTranslationState = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
