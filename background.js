const translateMessageType = "ytDualSubtitles.translate";
const googleTranslateEndpoint = "https://translate.googleapis.com/translate_a/single";
const translateRequestTimeoutMs = 2500;
const translateTimeoutErrorCode = "TRANSLATE_TIMEOUT";

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

function createTranslateTimeoutError() {
  const error = new Error("Google Translate request timed out.");
  error.code = translateTimeoutErrorCode;
  return error;
}

function isTranslateTimeoutError(error) {
  return Boolean(error && error.code === translateTimeoutErrorCode);
}

async function fetchTranslationResponse(url) {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort();
  }, translateRequestTimeoutMs);

  try {
    return await fetch(url.toString(), { signal: abortController.signal });
  } catch (error) {
    if (error && error.name === "AbortError") {
      throw createTranslateTimeoutError();
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
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

  let response;

  try {
    response = await fetchTranslationResponse(url);
  } catch (error) {
    if (isTranslateTimeoutError(error)) {
      response = await fetchTranslationResponse(url);
    } else {
      throw error;
    }
  }

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
  if (!message || message.type !== translateMessageType) {
    return false;
  }

  translateText(message.text, message.sourceLanguage, message.targetLanguage)
    .then((translation) => {
      sendResponse({ ok: true, translation });
    })
    .catch((error) => {
      const messageText = error instanceof Error ? error.message : String(error);
      sendResponse({ ok: false, error: messageText });
    });

  return true;
});
