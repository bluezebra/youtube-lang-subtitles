# YouTube Dual Subtitles

A small Brave/Chrome extension for experimenting with dual subtitles on YouTube.

## Current step

Step 9 is implemented. On YouTube, the extension reads the currently displayed caption and shows:

- The live YouTube caption text on top
- The Google Translate result underneath, using source language auto-detect and English as the target language

Translations are cached while the page is open so repeated caption text does not call Google Translate again.
The extension popup includes an **Enable dual subtitles** checkbox. Turning it off hides the overlay, restores YouTube's native captions, and stops new translation requests.
While enabled, YouTube's native caption layer is hidden so only the extension's borderless dual-subtitle overlay is visible. The overlay stays hidden when there is no caption text to translate, uses a stable width and height to reduce jumping, and displays both subtitle lines in white.

## Load in Brave

1. Open `brave://extensions/`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this project folder: `C:\Dev_Personal\youtube-lang`.
5. After code changes, click **Update** on the extensions page.
6. Refresh YouTube.
7. Click the extension icon to toggle dual subtitles on or off.

## Files

- `manifest.json` - Manifest V3 extension definition.
- `content.js` - Runs on YouTube and renders the subtitle overlay.
- `background.js` - Calls Google Translate from the extension service worker.
- `popup.html` - Extension popup UI.
- `popup.js` - Saves the on/off setting.

## Tests

Run the Node unit tests with:

```powershell
npm test
```

## Planned next step

Improve fast-speech handling. Possible approaches:

1. Keep the previous English translation visible until the new translation arrives. This is the smallest improvement and avoids a blank second line during rapid captions.
2. Debounce caption changes so tiny rapid partial updates do not all trigger translation requests.
3. Batch short nearby captions before translating to reduce request churn.
4. Prefetch YouTube's caption track/transcript and translate upcoming captions before they appear. This is likely the best long-term result, but it is more complex.

After that, add language selection and positioning options so the extension is easier to use across different videos.
