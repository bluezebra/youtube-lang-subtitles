(function () {
  const overlayId = "yt-dual-subtitles-overlay";
  const sourceLineId = "yt-dual-subtitles-source";
  const statusLineId = "yt-dual-subtitles-status";

  let lastCaptionText = "";
  let lastCaptionSeenAt = 0;
  let updateScheduled = false;

  function normalizeCaptionText(text) {
    return text.replace(/\s+/g, " ").trim();
  }

  function setText(element, text) {
    if (element.textContent !== text) {
      element.textContent = text;
    }
  }

  function createOverlay() {
    let overlay = document.getElementById(overlayId);

    if (overlay) {
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
    sourceLine.textContent = "Turn on subtitles/CC in the YouTube player.";

    overlay.append(statusLine, sourceLine);
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

  function updateOverlay() {
    const overlay = createOverlay();
    const sourceLine = overlay.querySelector(`#${sourceLineId}`);
    const statusLine = overlay.querySelector(`#${statusLineId}`);
    const captionText = readYouTubeCaptionText();

    if (!sourceLine || !statusLine) {
      return;
    }

    if (captionText) {
      lastCaptionText = captionText;
      lastCaptionSeenAt = Date.now();
      setText(statusLine, "Mirrored YouTube caption");
      setText(sourceLine, captionText);
      return;
    }

    if (lastCaptionText && Date.now() - lastCaptionSeenAt < 1500) {
      setText(statusLine, "Mirrored YouTube caption");
      setText(sourceLine, lastCaptionText);
      return;
    }

    setText(statusLine, "Waiting for YouTube captions...");
    setText(sourceLine, "Turn on subtitles/CC in the YouTube player.");
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

  function startCaptionMirroring() {
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
    startCaptionMirroring();
  } else {
    document.addEventListener("DOMContentLoaded", startCaptionMirroring, { once: true });
  }
})();
