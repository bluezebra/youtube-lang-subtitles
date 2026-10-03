importScripts("src/translationFetch.js");

const translateMessageType = "ytDualSubtitles.translate";
const googleTranslateEndpoint = "https://translate.googleapis.com/translate_a/single";
const translationFetcher = YtDualSubtitlesTranslationFetch.createTranslationFetcher();

function parseGoogleTranslateResponse(data) {
  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    return "";
  }

  return data[0]
    .map((segment) => {
      if (!Array.isArray(segment) || typeof segment[0] !== "string") {
        return "";
      }

      return segment[0];
    })
    .join("")
    .trim();
}

function requireNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${fieldName} must be a non-empty string.`);
  }

  return value.trim();
}

async function translateText(text, sourceLanguage, targetLanguage) {
  const normalizedText = requireNonEmptyString(text, "text");
  const normalizedSourceLanguage = requireNonEmptyString(sourceLanguage, "sourceLanguage");
  const normalizedTargetLanguage = requireNonEmptyString(targetLanguage, "targetLanguage");
  const url = new URL(googleTranslateEndpoint);

  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", normalizedSourceLanguage);
  url.searchParams.set("tl", normalizedTargetLanguage);
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", normalizedText);

  const response = await translationFetcher.fetchTranslationResponse(url);

  if (!response.ok) {
    throw new Error(`Google Translate request failed: ${response.status} ${response.statusText}`);
  }

  const translation = parseGoogleTranslateResponse(await response.json());

  if (!translation) {
    throw new Error("Google Translate response did not contain translated text.");
  }

  return translation;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) {
    return false;
  }

  if (message.type === translateMessageType) {
    translateText(message.text, message.sourceLanguage, message.targetLanguage)
      .then((translation) => {
        sendResponse({ ok: true, translation });
      })
      .catch((error) => {
        const messageText = error instanceof Error ? error.message : String(error);
        sendResponse({ ok: false, error: messageText });
      });

    return true;
  }

  if (message.type === "ytDualSubtitles.summarize") {
    // Basic summarization handler in background: expects message.history = [{targetText,...}, ...]
    try {
      const history = Array.isArray(message.history) ? message.history : [];
      // Very small footprint summarizer: take last up to 5 targetText lines and return an extractive join.
      const recent = history.slice(-5).map((h) => String(h.targetText || "").trim()).filter(Boolean);
      const summary = recent.join(' ');
      sendResponse({ ok: true, summary });
    } catch (error) {
      const messageText = error instanceof Error ? error.message : String(error);
      sendResponse({ ok: false, error: messageText });
    }

    return true;
  }

  return false;
});
