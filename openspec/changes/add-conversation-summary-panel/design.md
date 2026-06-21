## Context

The extension is a Manifest V3 content-script driven extension with a background service worker. There is no bundler; shared modules under `src/` are loaded into the content context and exported for Node tests. Changes must fit that pattern and keep runtime DOM/CPU work small since content.js runs on arbitrary YouTube pages.

Constraints
- No bundler; add any new shared modules under `src/` and include them in `manifest.json` content script order where necessary.
- Network calls must be performed from `background.js` (service worker) and proxied via chrome.runtime messaging from content.js to avoid CORS/permission issues and to centralize provider credentials.
- Remote provider use requires explicit opt-in and a clear explanation in the popup UI. Default behavior should not send caption text off-device.

## Goals / Non-goals

Goals:
- Provide an opt-in right-hand conversation summary panel in the selected target language.
- Keep summary generation configurable (frequency, manual refresh, retention window).
- Offer a provider abstraction so the implementation can use a light local summarizer first and optionally call external summarizers (ChatGPT-5 mini) when enabled.

Non-Goals:
- Do not store long-term transcripts across videos.
- Do not enable remote summarization without explicit user consent.

## Decisions

1) Provider abstraction
- Interface (browser-global module `src/summarizer.js`) exposes:
  - summarize(history, options) -> Promise<{ summary: string, provider: string }>
  - providerList() -> [ { id, label, requiresConsent, host, note } ]
- Built-in providers:
  - `local-extractive` (default): run a lightweight extractive algorithm in content.js or background context—no network.
  - `chatgpt-5-mini` (optional): background.js calls provider endpoint after user opt-in.

2) Data collection and commit rules
- translationState will expose a commit callback when a translation is considered "stable" (reuse existing commit stabilization from the sidebar feed change): these committed entries are appended to a rolling in-memory buffer limited by retention size (default 50 lines).
- Each buffer item: { ts, sourceText, targetText, videoId (optional) } — videoId helps avoid mixing across videos.

3) Summarization triggers
- Periodic (default: every 30s) when the panel is open.
- On-demand: user clicks "Summarize now".
- On significant content drift (N new committed lines) auto-suggest a summary.

4) UI placement and behavior
- Panel is fixed to the right of the player with responsive fallback (collapses on narrow viewports).
- Panel sections: Header (title, provider & settings summary, manual refresh button), Recent lines (source/target pairs), Generated summary (target language), Error/consent notices.
- Respect pointer-events and z-indexing so the panel doesn't block video controls; pointer-events: auto within panel, pointer-events: none outside.

5) Privacy and consent
- Popup must include a provider toggle and an explicit consent checkbox/confirm step for remote summarizers.
- Provider credentials (if needed) are stored only after user confirmation. The extension must show an inline privacy note explaining what is sent and how often.

## Dataflow (ASCII)

Content script (content.js)
  ├─ translationState (committed entries) ──▶ summarizer buffer (content or background)
  ├─ user opens panel / periodic timer ──▶ request summary
  └─ UI renders recent lines and summary

Background service worker (background.js)
  ├─ receives summarize request via chrome.runtime message
  ├─ if remote provider selected & consented: call external API (rate-limited, cached)
  └─ return { ok, summary } or { ok: false, error }

## Error handling & fallback
- If remote provider fails, surface a clear error and fall back to local-extractive summarizer.
- If background service worker becomes invalidated (extension update), surface a refresh notice in panel similar to overlay.

## Performance
- Keep the extractive summarizer O(n) on retained lines and run in background context where possible.
- Cache recent summaries keyed by a short fingerprint (last N lines hash + provider + language) to avoid redundant remote calls.

## Developer notes
- Add `src/summarizer.js` with provider interface. Export for Node tests.
- Add unit tests for local summarizer behavior and provider selector logic. Add integration tests that mock background provider calls.
- Add popup UI hooks and storage keys:
  - `ytDualSubtitles.summary.enabled` (bool)
  - `ytDualSubtitles.summary.provider` (string)
  - `ytDualSubtitles.summary.intervalSec` (number)
  - `ytDualSubtitles.summary.retentionCount` (number)
  - `ytDualSubtitles.summary.providerConsent` (bool)


