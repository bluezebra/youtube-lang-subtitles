(function () {
  const overlayId = "yt-dual-subtitles-overlay";
  const nativeCaptionStyleId = "yt-dual-subtitles-hide-native-captions";
  const sourceLineId = "yt-dual-subtitles-source";
  const targetLineId = "yt-dual-subtitles-target";
  const translateMessageType = "ytDualSubtitles.translate";
  const enabledStorageKey = "ytDualSubtitles.enabled";
  const sourceLanguageStorageKey = "ytDualSubtitles.sourceLanguage";
  const targetLanguageStorageKey = "ytDualSubtitles.targetLanguage";
  const overlayPositionStorageKey = "ytDualSubtitles.overlayPosition";
  const {
    defaultSourceLanguage,
    defaultTargetLanguage,
    normalizeSourceLanguage,
    normalizeTargetLanguage
  } = YtDualSubtitlesLanguages;
  const {
    defaultOverlayPosition,
    normalizeOverlayPosition
  } = YtDualSubtitlesOverlaySettings;
  const {
    formatTranslationErrorForOverlay,
    isExtensionContextInvalidatedError
  } = YtDualSubtitlesTranslationErrors;
  const staleCaptionDelayMs = 1500;
  const minimumOverlayHeightPx = 86;
  const subtitleLineHeightPx = 30;
  const subtitleLineGapPx = 4;
  const maxSubtitleLineCount = 2;
  const defaultTranslationDelayMs = 200;
  const defaultSourceCaptionDelayMs = 300;
  const hiddenControlsBottomOffsetPx = 16;

  const translationState = YtDualSubtitlesTranslationState.createTranslationState({
    debounceMs: defaultTranslationDelayMs,
    sourceDelayMs: defaultSourceCaptionDelayMs,
    translate: translateWithGoogle
  });

  let isEnabled = true;
  let lastCaptionText = "";
  let lastCaptionSeenAt = 0;
  let sourceLanguage = defaultSourceLanguage;
  let targetLanguage = defaultTargetLanguage;
  let overlayVerticalPosition = defaultOverlayPosition;
  let updateScheduled = false;
  let pageRefreshRequired = false;

  function normalizeCaptionText(text) {
    return YtDualSubtitlesTranslationState.normalizeCaptionText(text);
  }

  function setText(element, text) {
    if (element.textContent !== text) {
      element.textContent = text;
    }
  }

  function setInvisible(element, invisible) {
    const visibility = invisible ? "hidden" : "visible";

    if (element.style.visibility !== visibility) {
      element.style.visibility = visibility;
    }
  }

  function setTargetLineStale(element, stale) {
    const opacity = stale ? "0.72" : "1";

    if (element.style.opacity !== opacity) {
      element.style.opacity = opacity;
    }
  }

  function resetCaptionState() {
    lastCaptionText = "";
    lastCaptionSeenAt = 0;
    translationState.updateCaption("");
  }

  function hideOverlay() {
    const overlay = document.getElementById(overlayId);

    if (overlay) {
      overlay.style.display = "none";
    }
  }

  function hasRenderedSubtitleText(overlay) {
    if (!overlay) {
      return false;
    }

    const sourceLine = overlay.querySelector(`#${sourceLineId}`);
    const targetLine = overlay.querySelector(`#${targetLineId}`);

    return Boolean(
      normalizeCaptionText(sourceLine && sourceLine.textContent) ||
        normalizeCaptionText(targetLine && targetLine.textContent)
    );
  }

  function renderRefreshRequiredOverlay() {
    const overlay = createOverlay();
    const sourceLine = overlay.querySelector(`#${sourceLineId}`);
    const targetLine = overlay.querySelector(`#${targetLineId}`);

    if (!sourceLine || !targetLine) {
      throw new Error("Subtitle overlay was not created correctly.");
    }

    setText(sourceLine, getCurrentOrRecentCaptionText() || "Extension updated");
    setText(targetLine, formatTranslationErrorForOverlay(new Error("Extension context invalidated.")));
    setInvisible(targetLine, false);
    setTargetLineStale(targetLine, false);
    positionOverlay(overlay);
  }

  function pauseTranslationsUntilRefresh(error) {
    if (pageRefreshRequired) {
      return;
    }

    pageRefreshRequired = true;
    translationState.setEnabled(false);
    console.error("YouTube Dual Subtitles requires a page refresh after extension update", error);
    renderRefreshRequiredOverlay();
  }

  function setNativeCaptionsHidden(hidden) {
    let style = document.getElementById(nativeCaptionStyleId);

    if (!hidden) {
      if (style) {
        style.remove();
      }

      return;
    }

    if (style) {
      return;
    }

    style = document.createElement("style");
    style.id = nativeCaptionStyleId;
    style.textContent = `
      .ytp-caption-window-container {
        opacity: 0 !important;
        visibility: hidden !important;
      }
    `;
    document.documentElement.appendChild(style);
  }

  function findPlayerElement() {
    return (
      document.querySelector(".html5-video-player") ||
      document.getElementById("movie_player") ||
      document.querySelector("ytd-player") ||
      document.querySelector("#player-container") ||
      document.querySelector("video")
    );
  }

  function getPlayerRect(playerElement) {
    if (!playerElement) {
      return null;
    }

    const rect = playerElement.getBoundingClientRect();

    return {
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height
    };
  }

  function arePlayerControlsVisible(playerElement) {
    if (!playerElement) {
      return true;
    }

    if (
      playerElement.classList.contains("ytp-autohide") ||
      playerElement.classList.contains("ytp-hide-controls")
    ) {
      return false;
    }

    const controls = playerElement.querySelector(".ytp-chrome-bottom");

    if (!controls) {
      return true;
    }

    const style = window.getComputedStyle(controls);

    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) {
      return false;
    }

    const rect = controls.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function getBottomOffset(playerElement) {
    if (overlayVerticalPosition !== "bottom" || arePlayerControlsVisible(playerElement)) {
      return undefined;
    }

    return hiddenControlsBottomOffsetPx;
  }

  function getViewportSize() {
    return {
      width: window.innerWidth || document.documentElement.clientWidth,
      height: window.innerHeight || document.documentElement.clientHeight
    };
  }

  function positionOverlay(overlay) {
    const playerElement = findPlayerElement();
    const options = {
      bottomOffset: getBottomOffset(playerElement),
      maxWidth: Number.POSITIVE_INFINITY,
      overlayHeight: minimumOverlayHeightPx,
      verticalPosition: overlayVerticalPosition
    };
    const preliminaryPosition = YtDualSubtitlesOverlayPosition.calculateOverlayPosition(
      getPlayerRect(playerElement),
      getViewportSize(),
      options
    );

    if (!preliminaryPosition) {
      Object.assign(overlay.style, {
        left: "50%",
        bottom: "12%",
        width: "calc(100vw - 32px)"
      });
      return;
    }

    Object.assign(overlay.style, {
      left: `${preliminaryPosition.left}px`,
      width: `${preliminaryPosition.width}px`
    });

    const measuredPosition = YtDualSubtitlesOverlayPosition.calculateOverlayPosition(
      getPlayerRect(playerElement),
      getViewportSize(),
      {
        ...options,
        overlayHeight: Math.max(minimumOverlayHeightPx, overlay.offsetHeight || minimumOverlayHeightPx)
      }
    );
    const position = measuredPosition || preliminaryPosition;

    Object.assign(overlay.style, {
      left: `${position.left}px`,
      bottom: `${position.bottom}px`,
      width: `${position.width}px`
    });
  }

  function createOverlay() {
    let overlay = document.getElementById(overlayId);

    if (overlay) {
      overlay.style.display = "grid";
      return overlay;
    }

    overlay = document.createElement("div");
    overlay.id = overlayId;
    overlay.setAttribute("role", "status");
    overlay.setAttribute("aria-live", "polite");

    const sourceLine = document.createElement("div");
    sourceLine.id = sourceLineId;

    const targetLine = document.createElement("div");
    targetLine.id = targetLineId;

    overlay.append(sourceLine, targetLine);
    document.documentElement.appendChild(overlay);

    Object.assign(overlay.style, {
      position: "fixed",
      left: "50%",
      bottom: "12%",
      transform: "translateX(-50%)",
      zIndex: "2147483647",
      display: "grid",
      gridTemplateRows: "auto auto",
      alignContent: "center",
      alignItems: "start",
      justifyItems: "stretch",
      rowGap: `${subtitleLineGapPx}px`,
      boxSizing: "border-box",
      minHeight: `${minimumOverlayHeightPx}px`,
      width: "calc(100vw - 32px)",
      padding: "8px 18px",
      color: "rgba(255, 255, 255, 0.88)",
      background: "rgba(8, 8, 8, 0.68)",
      borderRadius: "10px",
      boxShadow: "0 4px 18px rgba(0, 0, 0, 0.45)",
      fontFamily: "Arial, sans-serif",
      pointerEvents: "none",
      transition: "bottom 120ms ease-out",
      textAlign: "left"
    });

    Object.assign(sourceLine.style, {
      color: "rgba(255, 255, 255, 0.88)",
      fontSize: "24px",
      fontWeight: "700",
      lineHeight: `${subtitleLineHeightPx}px`,
      width: "100%",
      maxHeight: `${subtitleLineHeightPx * maxSubtitleLineCount}px`,
      overflow: "hidden",
      overflowWrap: "break-word",
      whiteSpace: "normal",
      display: "-webkit-box",
      WebkitBoxOrient: "vertical",
      WebkitLineClamp: String(maxSubtitleLineCount),
      textAlign: "left",
      textShadow: "0 2px 4px rgba(0, 0, 0, 0.8)"
    });

    Object.assign(targetLine.style, {
      color: "rgba(255, 255, 255, 0.88)",
      fontSize: "24px",
      fontWeight: "700",
      lineHeight: `${subtitleLineHeightPx}px`,
      width: "100%",
      maxHeight: `${subtitleLineHeightPx * maxSubtitleLineCount}px`,
      overflow: "hidden",
      overflowWrap: "break-word",
      whiteSpace: "normal",
      display: "-webkit-box",
      WebkitBoxOrient: "vertical",
      WebkitLineClamp: String(maxSubtitleLineCount),
      textAlign: "left",
      textShadow: "0 2px 4px rgba(0, 0, 0, 0.8)"
    });

    return overlay;
  }

  function readYouTubeCaptionText() {
    const container = document.querySelector(".ytp-caption-window-container");

    if (!container) {
      return "";
    }

    const segmentText = Array.from(
      container.querySelectorAll(".ytp-caption-segment")
    )
      .map((segment) => normalizeCaptionText(segment.textContent || ""))
      .filter(Boolean)
      .join(" ");

    if (segmentText) {
      return normalizeCaptionText(segmentText);
    }

    const windowText = Array.from(container.querySelectorAll(".caption-window"))
      .map((captionWindow) => normalizeCaptionText(captionWindow.textContent || ""))
      .filter(Boolean)
      .join(" ");

    return normalizeCaptionText(windowText);
  }

  function getCurrentOrRecentCaptionText() {
    const captionText = readYouTubeCaptionText();

    if (captionText) {
      lastCaptionText = captionText;
      lastCaptionSeenAt = Date.now();
      return captionText;
    }

    if (lastCaptionText && Date.now() - lastCaptionSeenAt < staleCaptionDelayMs) {
      return lastCaptionText;
    }

    return "";
  }

  function translateWithGoogle(text) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: translateMessageType,
          text,
          sourceLanguage,
          targetLanguage
        },
        (response) => {
          const runtimeError = chrome.runtime.lastError;

          if (runtimeError) {
            reject(new Error(runtimeError.message));
            return;
          }

          if (!response) {
            reject(new Error("No translation response received."));
            return;
          }

          if (!response.ok) {
            reject(new Error(response.error || "Translation failed."));
            return;
          }

          resolve(response.translation);
        }
      );
    });
  }

  function updateOverlay() {
    if (!isEnabled) {
      setNativeCaptionsHidden(false);
      hideOverlay();
      return;
    }

    setNativeCaptionsHidden(true);

    if (pageRefreshRequired) {
      renderRefreshRequiredOverlay();
      return;
    }

    const captionText = getCurrentOrRecentCaptionText();

    const captionState = translationState.updateCaption(captionText, {
      onSourceDelayElapsed() {
        scheduleUpdate();
      },
      onTranslation(translation, translatedCaptionText) {
        const overlay = createOverlay();

        const sourceLine = overlay.querySelector(`#${sourceLineId}`);
        const targetLine = overlay.querySelector(`#${targetLineId}`);

        if (!sourceLine || !targetLine) {
          throw new Error("Subtitle overlay was not created correctly.");
        }

        setText(sourceLine, translatedCaptionText);
        setInvisible(sourceLine, false);
        setInvisible(targetLine, false);
        setTargetLineStale(targetLine, false);
        setText(targetLine, translation);
        positionOverlay(overlay);
      },
      onError(error, failedCaptionText) {
        const overlay = createOverlay();

        const sourceLine = overlay.querySelector(`#${sourceLineId}`);
        const targetLine = overlay.querySelector(`#${targetLineId}`);

        if (!sourceLine || !targetLine) {
          throw new Error("Subtitle overlay was not created correctly.");
        }

        if (isExtensionContextInvalidatedError(error)) {
          pauseTranslationsUntilRefresh(error);
          return;
        }

        console.error("YouTube Dual Subtitles translation failed", error);
        setText(sourceLine, failedCaptionText);
        setInvisible(sourceLine, false);
        setInvisible(targetLine, false);
        setTargetLineStale(targetLine, false);
        setText(targetLine, formatTranslationErrorForOverlay(error));
        positionOverlay(overlay);
      }
    });

    if (!captionState.visible) {
      resetCaptionState();
      hideOverlay();
      return;
    }

    if (!captionState.sourceText && !captionState.targetVisible) {
      const existingOverlay = document.getElementById(overlayId);

      if (hasRenderedSubtitleText(existingOverlay)) {
        existingOverlay.style.display = "grid";
        positionOverlay(existingOverlay);
        return;
      }

      hideOverlay();
      return;
    }
    const overlay = createOverlay();

    const sourceLine = overlay.querySelector(`#${sourceLineId}`);
    const targetLine = overlay.querySelector(`#${targetLineId}`);

    if (!sourceLine || !targetLine) {
      throw new Error("Subtitle overlay was not created correctly.");
    }

    setText(sourceLine, captionState.sourceText);
    setInvisible(sourceLine, !captionState.sourceText);
    setText(targetLine, captionState.targetText);
    setInvisible(targetLine, !captionState.targetVisible);
    setTargetLineStale(targetLine, Boolean(captionState.targetStale));
    positionOverlay(overlay);
  }

  function scheduleUpdate() {
    if (updateScheduled) {
      return;
    }

    updateScheduled = true;
    requestAnimationFrame(() => {
      updateScheduled = false;
      updateOverlay();
    });
  }

  function setEnabled(enabled) {
    if (isEnabled === enabled) {
      return;
    }

    isEnabled = enabled;
    translationState.setEnabled(enabled);

    if (!isEnabled) {
      resetCaptionState();
      setNativeCaptionsHidden(false);
      hideOverlay();
      return;
    }

    scheduleUpdate();
  }

  function setSourceLanguage(value) {
    const normalizedLanguage = normalizeSourceLanguage(value);

    if (sourceLanguage === normalizedLanguage) {
      return;
    }

    sourceLanguage = normalizedLanguage;
    translationState.clearTranslations();
    scheduleUpdate();
  }

  function setTargetLanguage(value) {
    const normalizedLanguage = normalizeTargetLanguage(value);

    if (targetLanguage === normalizedLanguage) {
      return;
    }

    targetLanguage = normalizedLanguage;
    translationState.clearTranslations();
    scheduleUpdate();
  }

  function setOverlayPosition(value) {
    const normalizedPosition = normalizeOverlayPosition(value);

    if (overlayVerticalPosition === normalizedPosition) {
      return;
    }

    overlayVerticalPosition = normalizedPosition;
    scheduleUpdate();
  }

  function readSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(
        {
          [enabledStorageKey]: true,
          [sourceLanguageStorageKey]: defaultSourceLanguage,
          [targetLanguageStorageKey]: defaultTargetLanguage,
          [overlayPositionStorageKey]: defaultOverlayPosition
        },
        (items) => {
          const runtimeError = chrome.runtime.lastError;

          if (runtimeError) {
            console.error("YouTube Dual Subtitles could not read settings", runtimeError);
            resolve({
              enabled: true,
              sourceLanguage: defaultSourceLanguage,
              targetLanguage: defaultTargetLanguage,
              overlayPosition: defaultOverlayPosition
            });
            return;
          }

          resolve({
            enabled: items[enabledStorageKey] !== false,
            sourceLanguage: normalizeSourceLanguage(items[sourceLanguageStorageKey]),
            targetLanguage: normalizeTargetLanguage(items[targetLanguageStorageKey]),
            overlayPosition: normalizeOverlayPosition(items[overlayPositionStorageKey])
          });
        }
      );
    });
  }

  function watchSettings() {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      const enabledChange = changes[enabledStorageKey];
      const sourceLanguageChange = changes[sourceLanguageStorageKey];
      const targetLanguageChange = changes[targetLanguageStorageKey];
      const overlayPositionChange = changes[overlayPositionStorageKey];

      if (areaName !== "sync") {
        return;
      }

      if (enabledChange) {
        setEnabled(enabledChange.newValue !== false);
      }

      if (sourceLanguageChange) {
        setSourceLanguage(sourceLanguageChange.newValue);
      }

      if (targetLanguageChange) {
        setTargetLanguage(targetLanguageChange.newValue);
      }

      if (overlayPositionChange) {
        setOverlayPosition(overlayPositionChange.newValue);
      }
    });
  }

  async function startLiveTranslation() {
    const settings = await readSettings();

    isEnabled = settings.enabled;
    sourceLanguage = settings.sourceLanguage;
    targetLanguage = settings.targetLanguage;
    overlayVerticalPosition = settings.overlayPosition;
    translationState.setEnabled(isEnabled);
    watchSettings();
    updateOverlay();

    const observer = new MutationObserver(scheduleUpdate);
    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["class", "style"]
    });

    document.addEventListener("yt-navigate-finish", scheduleUpdate);
    document.addEventListener("fullscreenchange", scheduleUpdate);
    window.addEventListener("resize", scheduleUpdate, { passive: true });
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.setInterval(scheduleUpdate, 500);
  }

  if (document.body) {
    startLiveTranslation();
  } else {
    document.addEventListener("DOMContentLoaded", startLiveTranslation, { once: true });
  }
})();
