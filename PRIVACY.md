# Privacy Policy

Effective date: 2026-05-30

YouTube Dual Subtitles is a browser extension that shows translated subtitles on YouTube.

## Data handled by the extension

The extension handles:

- Visible YouTube caption text, only while a YouTube page is open and captions are being displayed.
- Extension settings, including enabled/disabled state, source language, target language, and overlay position.

## How data is used

Visible caption text and selected language codes are sent over HTTPS to Google Translate at `translate.googleapis.com` so the extension can show translated subtitles. The extension developer does not receive, store, sell, or use this caption text for analytics, advertising, profiling, or any purpose other than providing the translation feature.

Extension settings are stored with Chrome extension storage so your preferences can be remembered by the browser.

## Data storage and retention

The extension does not persistently store caption text. Translations may be cached in memory while the page is open to avoid repeated translation requests for the same caption text. This cache is cleared when the page is closed or reloaded.

Extension settings may remain stored in browser-managed extension storage until you change them, reset them, or remove the extension.

## Data sharing

Caption text is shared with Google Translate only to provide the requested translation. No data is shared with the extension developer or developer-controlled servers.

## Contact

For privacy questions or issues, open an issue in the project repository:

https://github.com/bluezebra/youtube-lang-subtitles/issues
