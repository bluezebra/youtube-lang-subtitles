# YouTube Dual Subtitles

A small Brave/Chrome extension for experimenting with dual subtitles on YouTube.

## Current step

Step 3 is implemented. On YouTube, the extension displays a test overlay with:

- Finnish: `Hei maailma`
- English: the Google Translate result for that phrase

Live YouTube captions are not translated yet. That is the next step.

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

Wire the translator to the live YouTube caption text so Finnish captions appear above their English translation.
