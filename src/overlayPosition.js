(function (root) {
  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function isUsableNumber(value) {
    return Number.isFinite(value) && value > 0;
  }

  function calculateDesiredBottom(playerRect, viewport, settings) {
    const edgeOffset = clamp(
      playerRect.height * settings.edgeRatio,
      settings.verticalMargin,
      settings.maxEdgeOffset
    );

    if (settings.verticalPosition === "top") {
      return viewport.height - playerRect.top - settings.overlayHeight;
    }

    if (settings.verticalPosition === "middle") {
      return viewport.height - playerRect.top - playerRect.height / 2 - settings.overlayHeight / 2;
    }

    return viewport.height - playerRect.bottom + (Number.isFinite(settings.bottomOffset) ? settings.bottomOffset : edgeOffset);
  }

  function calculateOverlayPosition(playerRect, viewport, options) {
    const optionsWithDefaults = options || {};
    const settings = {
      edgeRatio: optionsWithDefaults.edgeRatio || 0.1,
      horizontalMargin: optionsWithDefaults.horizontalMargin || 16,
      maxEdgeOffset: optionsWithDefaults.maxEdgeOffset || 72,
      maxWidth: optionsWithDefaults.maxWidth || 900,
      overlayHeight: optionsWithDefaults.overlayHeight || 86,
      verticalMargin: optionsWithDefaults.verticalMargin || 16,
      verticalPosition: optionsWithDefaults.verticalPosition || "bottom",
      bottomOffset: optionsWithDefaults.bottomOffset
    };

    if (
      !playerRect ||
      !viewport ||
      !isUsableNumber(playerRect.width) ||
      !isUsableNumber(playerRect.height) ||
      !isUsableNumber(viewport.width) ||
      !isUsableNumber(viewport.height)
    ) {
      return null;
    }

    const playerAvailableWidth = Math.max(0, playerRect.width - settings.horizontalMargin * 2);
    const viewportAvailableWidth = Math.max(0, viewport.width - settings.horizontalMargin * 2);
    const width = Math.min(settings.maxWidth, playerAvailableWidth, viewportAvailableWidth);

    if (!isUsableNumber(width)) {
      return null;
    }

    const minLeft = settings.horizontalMargin + width / 2;
    const maxLeft = viewport.width - settings.horizontalMargin - width / 2;
    const desiredLeft = playerRect.left + playerRect.width / 2;
    const left = clamp(desiredLeft, minLeft, Math.max(minLeft, maxLeft));
    const desiredBottom = calculateDesiredBottom(playerRect, viewport, settings);
    const minBottom = settings.verticalPosition === "top" ? 0 : settings.verticalMargin;
    const maxBottom = Math.max(
      minBottom,
      viewport.height -
        settings.overlayHeight -
        (settings.verticalPosition === "top" ? 0 : settings.verticalMargin)
    );
    const bottom = clamp(desiredBottom, minBottom, maxBottom);

    return {
      left,
      bottom,
      width
    };
  }

  const api = {
    calculateOverlayPosition
  };

  root.YtDualSubtitlesOverlayPosition = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
