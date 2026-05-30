(function () {
  const overlayId = "yt-dual-subtitles-overlay";
  const sourceLineId = "yt-dual-subtitles-source";
  const targetLineId = "yt-dual-subtitles-target";
  const statusLineId = "yt-dual-subtitles-status";
  const translateMessageType = "ytDualSubtitles.translate";
  const testPhrase = "Hei maailma";

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
    statusLine.textContent = "Testing Google Translate...";

    const sourceLine = document.createElement("div");
    sourceLine.id = sourceLineId;
    sourceLine.textContent = `Finnish: ${testPhrase}`;

    const targetLine = document.createElement("div");
    targetLine.id = targetLineId;
    targetLine.textContent = "English: Translating...";

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

  function translateWithGoogle(text, sourceLanguage, targetLanguage) {
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

  async function runTranslationTest() {
    const overlay = createOverlay();
    const sourceLine = overlay.querySelector(`#${sourceLineId}`);
    const targetLine = overlay.querySelector(`#${targetLineId}`);
    const statusLine = overlay.querySelector(`#${statusLineId}`);

    if (!sourceLine || !targetLine || !statusLine) {
      throw new Error("Translation overlay was not created correctly.");
    }

    setText(statusLine, "Testing Google Translate...");
    setText(sourceLine, `Finnish: ${testPhrase}`);
    setText(targetLine, "English: Translating...");

    try {
      const translation = await translateWithGoogle(testPhrase, "fi", "en");
      setText(statusLine, "Google Translate test complete");
      setText(targetLine, `English: ${translation}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("YouTube Dual Subtitles translation test failed", error);
      setText(statusLine, "Google Translate test failed");
      setText(targetLine, `English: Translation failed (${message})`);
    }
  }

  if (document.body) {
    runTranslationTest();
  } else {
    document.addEventListener("DOMContentLoaded", runTranslationTest, { once: true });
  }
})();
