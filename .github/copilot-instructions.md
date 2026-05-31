# Copilot instructions for YouTube Dual Subtitles

## Build, test, and lint commands

- Run the full test suite: `npm test`
- Run one test file: `node --test test\languages.test.js`
- Run one named test: `node --test --test-name-pattern "normalizes source and target languages" test\languages.test.js`

The extension is loaded directly from the repository as an unpacked Chrome/Brave extension. There is no bundler step; `manifest.json` lists the source files that the browser loads.

## High-level architecture

This is a Manifest V3 browser extension for YouTube dual subtitles. `manifest.json` wires `background.js` as the service worker, `popup.html`/`popup.js` as the action popup, and the YouTube content script chain in this order: `src/languages.js`, `src/overlaySettings.js`, `src/translationState.js`, `src/overlayPosition.js`, then `content.js`.

`content.js` owns the YouTube page behavior: it reads YouTube caption DOM text, hides native YouTube captions while enabled, renders a fixed two-line overlay, listens for YouTube navigation/fullscreen/resize/scroll/caption mutations, and sends translation requests to the background service worker. It delegates translation caching, stale-result handling, and debouncing to `src/translationState.js`, and player-relative overlay placement to `src/overlayPosition.js`.

`background.js` is the only code that calls Google Translate. It listens for `ytDualSubtitles.translate` messages, validates non-empty text/source/target strings, calls `https://translate.googleapis.com/translate_a/single`, parses the response, and returns `{ ok, translation }` or `{ ok, error }` to the content script.

`popup.js` owns user preferences. It loads language and overlay options from shared `src/` modules, reads/writes `chrome.storage.sync`, and content scripts react to those storage changes without page reload. The stored keys are duplicated in popup/content/background-facing flows, so keep names synchronized when changing settings.

## Key conventions

- Shared `src/` modules use the browser-global plus CommonJS pattern: assign `root.YtDualSubtitles...` for extension runtime and `module.exports` for Node tests.
- If adding a shared runtime module, update both `manifest.json` content script order and any HTML script tags that need it.
- Language defaults and validation live in `src/languages.js`: source languages include `auto`, target languages do not, target options put English first, and alias normalization maps Google-compatible legacy codes such as `he -> iw`, `fil -> tl`, and `zh -> zh-CN`.
- Overlay position defaults and labels live in `src/overlaySettings.js`; geometry calculations live in `src/overlayPosition.js`; visual dimensions used by content runtime must stay compatible with overlay positioning tests.
- Translation state intentionally keeps the previous translation visible while a new caption is pending, marks it stale, deduplicates concurrent requests, and clears cache/pending work when languages change.
- Chrome extension API callbacks should check `chrome.runtime.lastError` and surface errors in the popup status text, overlay text, or console consistently with existing files.
- Tests use `node:test` and `node:assert/strict` with direct `require("../src/...")`; prefer testing shared `src/` logic rather than browser-only DOM behavior when possible.
