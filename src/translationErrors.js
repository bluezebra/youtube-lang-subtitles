(function (root) {
  const extensionContextInvalidatedPattern = /\bExtension context invalidated\b/i;

  function getErrorMessage(error) {
    if (error instanceof Error) {
      return error.message;
    }

    return String(error || "");
  }

  function isExtensionContextInvalidatedError(error) {
    return extensionContextInvalidatedPattern.test(getErrorMessage(error));
  }

  function formatTranslationErrorForOverlay(error) {
    if (isExtensionContextInvalidatedError(error)) {
      return "Refresh page to resume subtitles.";
    }

    return "Translation failed.";
  }

  const api = {
    formatTranslationErrorForOverlay,
    isExtensionContextInvalidatedError
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  root.YtDualSubtitlesTranslationErrors = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
