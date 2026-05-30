(function () {
  const overlayId = "yt-dual-subtitles-overlay";
  const sourceLineId = "yt-dual-subtitles-source";
  const targetLineId = "yt-dual-subtitles-target";
  const statusLineId = "yt-dual-subtitles-status";
  const translateMessageType = "ytDualSubtitles.translate";
  const enabledStorageKey = "ytDualSubtitles.enabled";
  const sourceLanguage = "fi";
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

    const statusLine = document.createElement("div");
    statusLine.id = statusLineId;
    statusLine.textContent = "Waiting for YouTube captions...";

    const sourceLine = document.createElement("div");
    sourceLine.id = sourceLineId;
    sourceLine.textContent = "Finnish: Turn on subtitles/CC in the YouTube player.";

    const targetLine = document.createElement("div");
    targetLine.id = targetLineId;
    targetLine.textContent = "English: Waiting...";

    overlay.append(statusLine, sourceLine, targetLine);
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
      gap: "6px",
      maxWidth: "min(900px, calc(100vw - 32px))",
      padding: "12px 18px",
      color: "#ffffff",
      background: "rgba(0, 0, 0, 0.82)",
      border: "2px solid #1a73e8",
      borderRadius: "10px",
      boxShadow: "0 4px 18px rgba(0, 0, 0, 0.45)",
      fontFamily: "Arial, sans-serif",
      pointerEvents: "none",
      textAlign: "center"
    });

    Object.assign(statusLine.style, {
      color: "#8ab4f8",
      fontSize: "12px",
      fontWeight: "700",
      letterSpacing: "0.02em",
      textTransform: "uppercase"
    });

    Object.assign(sourceLine.style, {
      color: "#ffffff",
      fontSize: "24px",
      fontWeight: "700",
      lineHeight: "1.25",
      textShadow: "0 2px 4px rgba(0, 0, 0, 0.8)"
    });

    Object.assign(targetLine.style, {
      color: "#ffd54f",
      fontSize: "24px",
      fontWeight: "700",
      lineHeight: "1.25",
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

  function setWaitingState(statusLine, sourceLine, targetLine) {
    activeCaptionText = "";
    requestedCaptionText = "";
    activeTranslationRequestId += 1;

    setText(statusLine, "Waiting for YouTube captions...");
    setText(sourceLine, "Finnish: Turn on subtitles/CC in the YouTube player.");
    setText(targetLine, "English: Waiting...");
  }

  function startTranslation(captionText, statusLine, targetLine) {
    requestedCaptionText = captionText;
    const requestId = activeTranslationRequestId + 1;
    activeTranslationRequestId = requestId;

    getTranslation(captionText)
      .then((translation) => {
        if (!isEnabled || requestId !== activeTranslationRequestId || captionText !== activeCaptionText) {
          return;
        }

        setText(statusLine, "Live caption translated");
        setText(targetLine, `English: ${translation}`);
      })
      .catch((error) => {
        if (!isEnabled || requestId !== activeTranslationRequestId || captionText !== activeCaptionText) {
          return;
        }

        const message = error instanceof Error ? error.message : String(error);
        console.error("YouTube Dual Subtitles translation failed", error);
        setText(statusLine, "Live caption translation failed");
        setText(targetLine, `English: Translation failed (${message})`);
      });
  }

  function updateOverlay() {
    if (!isEnabled) {
      hideOverlay();
      return;
    }

    const overlay = createOverlay();
    const sourceLine = overlay.querySelector(`#${sourceLineId}`);
    const targetLine = overlay.querySelector(`#${targetLineId}`);
    const statusLine = overlay.querySelector(`#${statusLineId}`);

    if (!sourceLine || !targetLine || !statusLine) {
      throw new Error("Subtitle overlay was not created correctly.");
    }

    const captionText = getCurrentOrRecentCaptionText();

    if (!captionText) {
      setWaitingState(statusLine, sourceLine, targetLine);
      return;
    }

    if (captionText !== activeCaptionText) {
      activeCaptionText = captionText;
      requestedCaptionText = "";
      activeTranslationRequestId += 1;
    }

    setText(statusLine, "Translating live caption...");
    setText(sourceLine, `Finnish: ${captionText}`);

    if (translationCache.has(captionText)) {
      setText(statusLine, "Live caption translated");
      setText(targetLine, `English: ${translationCache.get(captionText)}`);
      return;
    }

    setText(targetLine, "English: Translating...");

    if (requestedCaptionText !== captionText) {
      startTranslation(captionText, statusLine, targetLine);
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
