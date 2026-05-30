(function () {
  const overlayId = "yt-dual-subtitles-overlay";
  const nativeCaptionStyleId = "yt-dual-subtitles-hide-native-captions";
  const sourceLineId = "yt-dual-subtitles-source";
  const targetLineId = "yt-dual-subtitles-target";
  const translateMessageType = "ytDualSubtitles.translate";
  const enabledStorageKey = "ytDualSubtitles.enabled";
  const sourceLanguage = "auto";
  const targetLanguage = "en";
  const staleCaptionDelayMs = 1500;

  const translationCache = new Map();
  const pendingTranslations = new Map();

  let isEnabled = true;
  let activeCaptionText = "";
  let lastCaptionText = "";
  let lastCaptionSeenAt = 0;
  let requestedCaptionText = "";
  let activeTranslationRequestId = 0;
  let updateScheduled = false;

  function normalizeCaptionText(text) {
    return text.replace(/\s+/g, " ").trim();
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

  function resetCaptionState() {
    activeCaptionText = "";
    lastCaptionText = "";
    lastCaptionSeenAt = 0;
    requestedCaptionText = "";
    activeTranslationRequestId += 1;
  }

  function hideOverlay() {
    const overlay = document.getElementById(overlayId);

    if (overlay) {
      overlay.style.display = "none";
    }
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

  function createOverlay() {
    let overlay = document.getElementById(overlayId);

    if (overlay) {
      overlay.style.display = "flex";
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
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "4px",
      boxSizing: "border-box",
      height: "86px",
      minWidth: "min(640px, calc(100vw - 32px))",
      maxWidth: "min(900px, calc(100vw - 32px))",
      padding: "8px 18px",
      color: "rgba(255, 255, 255, 0.88)",
      background: "rgba(8, 8, 8, 0.68)",
      borderRadius: "10px",
      boxShadow: "0 4px 18px rgba(0, 0, 0, 0.45)",
      fontFamily: "Arial, sans-serif",
      pointerEvents: "none",
      textAlign: "center"
    });

    Object.assign(sourceLine.style, {
      color: "rgba(255, 255, 255, 0.88)",
      fontSize: "24px",
      fontWeight: "700",
      lineHeight: "1.25",
      width: "100%",
      minHeight: "30px",
      maxHeight: "30px",
      overflow: "hidden",
      textShadow: "0 2px 4px rgba(0, 0, 0, 0.8)"
    });

    Object.assign(targetLine.style, {
      color: "rgba(255, 255, 255, 0.88)",
      fontSize: "24px",
      fontWeight: "700",
      lineHeight: "1.25",
      width: "100%",
      minHeight: "30px",
      maxHeight: "30px",
      overflow: "hidden",
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

  function getTranslation(text) {
    if (translationCache.has(text)) {
      return Promise.resolve(translationCache.get(text));
    }

    if (pendingTranslations.has(text)) {
      return pendingTranslations.get(text);
    }

    const pendingTranslation = translateWithGoogle(text)
      .then((translation) => {
        translationCache.set(text, translation);
        return translation;
      })
      .finally(() => {
        pendingTranslations.delete(text);
      });

    pendingTranslations.set(text, pendingTranslation);
    return pendingTranslation;
  }

  function startTranslation(captionText, targetLine) {
    requestedCaptionText = captionText;
    const requestId = activeTranslationRequestId + 1;
    activeTranslationRequestId = requestId;

    getTranslation(captionText)
      .then((translation) => {
        if (!isEnabled || requestId !== activeTranslationRequestId || captionText !== activeCaptionText) {
          return;
        }

        setInvisible(targetLine, false);
        setText(targetLine, translation);
      })
      .catch((error) => {
        if (!isEnabled || requestId !== activeTranslationRequestId || captionText !== activeCaptionText) {
          return;
        }

        const message = error instanceof Error ? error.message : String(error);
        console.error("YouTube Dual Subtitles translation failed", error);
        setInvisible(targetLine, false);
        setText(targetLine, `Translation failed (${message})`);
      });
  }

  function updateOverlay() {
    if (!isEnabled) {
      setNativeCaptionsHidden(false);
      hideOverlay();
      return;
    }

    setNativeCaptionsHidden(true);

    const captionText = getCurrentOrRecentCaptionText();

    if (!captionText) {
      resetCaptionState();
      hideOverlay();
      return;
    }

    const overlay = createOverlay();
    const sourceLine = overlay.querySelector(`#${sourceLineId}`);
    const targetLine = overlay.querySelector(`#${targetLineId}`);

    if (!sourceLine || !targetLine) {
      throw new Error("Subtitle overlay was not created correctly.");
    }

    if (captionText !== activeCaptionText) {
      activeCaptionText = captionText;
      requestedCaptionText = "";
      activeTranslationRequestId += 1;
    }

    setText(sourceLine, captionText);

    if (translationCache.has(captionText)) {
      setInvisible(targetLine, false);
      setText(targetLine, translationCache.get(captionText));
      return;
    }

    setText(targetLine, "");
    setInvisible(targetLine, true);

    if (requestedCaptionText !== captionText) {
      startTranslation(captionText, targetLine);
    }
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

    if (!isEnabled) {
      resetCaptionState();
      setNativeCaptionsHidden(false);
      hideOverlay();
      return;
    }

    scheduleUpdate();
  }

  function readEnabledSetting() {
    return new Promise((resolve) => {
      chrome.storage.sync.get({ [enabledStorageKey]: true }, (items) => {
        const runtimeError = chrome.runtime.lastError;

        if (runtimeError) {
          console.error("YouTube Dual Subtitles could not read settings", runtimeError);
          resolve(true);
          return;
        }

        resolve(items[enabledStorageKey] !== false);
      });
    });
  }

  function watchEnabledSetting() {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      const enabledChange = changes[enabledStorageKey];

      if (areaName !== "sync" || !enabledChange) {
        return;
      }

      setEnabled(enabledChange.newValue !== false);
    });
  }

  async function startLiveTranslation() {
    isEnabled = await readEnabledSetting();
    watchEnabledSetting();
    updateOverlay();

    const observer = new MutationObserver(scheduleUpdate);
    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true
    });

    document.addEventListener("yt-navigate-finish", scheduleUpdate);
    window.setInterval(scheduleUpdate, 500);
  }

  if (document.body) {
    startLiveTranslation();
  } else {
    document.addEventListener("DOMContentLoaded", startLiveTranslation, { once: true });
  }
})();
