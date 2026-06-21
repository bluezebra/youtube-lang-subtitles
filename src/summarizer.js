(function (root) {
  // Simple local extractive summarizer suitable as a default provider.
  // Exposes providerList() and summarize(history, options).
  // history: array of { ts, sourceText, targetText }

  function providerList() {
    return [
      { id: "local-extractive", label: "Local extractive (no network)", requiresConsent: false },
      { id: "chatgpt-5-mini", label: "ChatGPT-5 mini (optional)", requiresConsent: true }
    ];
  }

  function summarizeLocalExtractive(history, options) {
    const maxLines = (options && Number(options.maxLines)) || 5;
    const lines = Array.isArray(history) ? history.slice(-maxLines) : [];

    // Naive extractive: pick last N targetText lines and join. If sentences are long,
    // return the first 2 short sentences from the concatenation.
    const joined = lines.map((l) => String(l.targetText || "").trim()).filter(Boolean).join(" ");

    if (!joined) {
      return "";
    }

    // Try to split into sentences (very naive) and return up to 2 sentences.
    const sentences = joined.split(/[\.\!\?]\s+/).map((s) => s.trim()).filter(Boolean);
    if (sentences.length === 0) return joined;

    return sentences.slice(0, 2).join('. ') + (sentences.slice(0, 2).length ? '.' : '');
  }

  async function summarize(history, options) {
    // options.provider may be specified; default to local-extractive
    const provider = (options && options.provider) || "local-extractive";

    if (provider === "local-extractive") {
      return { summary: summarizeLocalExtractive(history, options), provider };
    }

    // For remote providers we don't implement network calls here. Background will
    // proxy remote requests when enabled and consented. Fallback to local.
    return { summary: summarizeLocalExtractive(history, options), provider: "local-extractive-fallback" };
  }

  const api = { providerList, summarize };
  root.YtDualSubtitlesSummarizer = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
