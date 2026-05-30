(function (root) {
  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function isUsableNumber(value) {
    return Number.isFinite(value) && value > 0;
  }

  function calculateOverlayPosition(playerRect, viewport, options) {
    const settings = options || {};
    const horizontalMargin = settings.horizontalMargin || 16;
    const verticalMargin = settings.verticalMargin || 16;
    const maxWidth = settings.maxWidth || 900;
    const overlayHeight = settings.overlayHeight || 86;
    const bottomRatio = settings.bottomRatio || 0.1;
    const maxBottomOffset = settings.maxBottomOffset || 72;

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

    const playerAvailableWidth = Math.max(0, playerRect.width - horizontalMargin * 2);
    const viewportAvailableWidth = Math.max(0, viewport.width - horizontalMargin * 2);
    const width = Math.min(maxWidth, playerAvailableWidth, viewportAvailableWidth);

    if (!isUsableNumber(width)) {
      return null;
    }

    const minLeft = horizontalMargin + width / 2;
    const maxLeft = viewport.width - horizontalMargin - width / 2;
    const desiredLeft = playerRect.left + playerRect.width / 2;
    const left = clamp(desiredLeft, minLeft, Math.max(minLeft, maxLeft));
    const bottomInsidePlayer = clamp(
      playerRect.height * bottomRatio,
      verticalMargin,
      maxBottomOffset
    );
    const desiredBottom = viewport.height - playerRect.bottom + bottomInsidePlayer;
    const maxBottom = Math.max(verticalMargin, viewport.height - overlayHeight - verticalMargin);
    const bottom = clamp(desiredBottom, verticalMargin, maxBottom);

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
