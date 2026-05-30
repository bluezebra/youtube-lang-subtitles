# YouTube Dual Subtitles

A small Brave/Chrome extension for experimenting with dual subtitles on YouTube.

## Current step

Step 4 is implemented. On YouTube, the extension reads the currently displayed caption and shows:

- Finnish: the live YouTube caption text
- English: the Google Translate result for that caption

Translations are cached while the page is open so repeated caption text does not call Google Translate again.

## Load in Brave

1. Open `brave://extensions/`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this project folder: `C:\Dev_Personal\youtube-lang`.
5. After code changes, click **Update** on the extensions page.
6. Refresh YouTube.

## Files

- `manifest.json` - Manifest V3 extension definition.
- `content.js` - Runs on YouTube and renders the subtitle overlay.
- `background.js` - Calls Google Translate from the extension service worker.

## Planned next step

Improve controls, language selection, and positioning so the extension is easier to use across different videos.
