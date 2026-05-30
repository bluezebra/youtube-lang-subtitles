(function (root) {
  const defaultOverlayPosition = "bottom";
  const overlayPositionOptions = Object.freeze([
    Object.freeze({ value: "bottom", label: "Bottom" }),
    Object.freeze({ value: "middle", label: "Middle" }),
    Object.freeze({ value: "top", label: "Top" })
  ]);
  const overlayPositionValues = new Set(overlayPositionOptions.map((option) => option.value));
  const overlayPositionLabels = Object.freeze(
    overlayPositionOptions.reduce((labels, option) => {
      labels[option.value] = option.label;
      return labels;
    }, {})
  );

  function normalizeOverlayPosition(value) {
    const position = String(value || "");

    if (overlayPositionValues.has(position)) {
      return position;
    }

    return defaultOverlayPosition;
  }

  const api = {
    defaultOverlayPosition,
    normalizeOverlayPosition,
    overlayPositionLabels,
    overlayPositionOptions
  };

  root.YtDualSubtitlesOverlaySettings = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
