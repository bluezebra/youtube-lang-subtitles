# YouTube Dual Subtitles

A small Brave/Chrome extension that shows dual subtitles on YouTube.

## What it does

On YouTube, the extension reads the currently displayed caption and shows:

- The live YouTube caption text on top
- The Google Translate result underneath, using popup-selected source and target languages

Translations are cached while the page is open so repeated caption text does not call Google Translate again. During fast captions, the previous translation stays visible until the new translation arrives, and rapid partial caption changes are debounced before sending a translation request.
The extension popup includes an **Enable dual subtitles** checkbox, expanded **Source language** and **Target language** selectors, and a **Position** selector for moving the overlay between bottom, middle, and top. Turning the extension off hides the overlay, restores YouTube's native captions, and stops new translation requests.
While enabled, YouTube's native caption layer is hidden so only the extension's borderless dual-subtitle overlay is visible. The overlay stays hidden when there is no caption text to translate, uses a stable width and height to reduce jumping, follows the YouTube player during resize/layout changes, and displays both subtitle lines in white.

## Load in Chrome or Brave

1. Open the extensions page:
   - Chrome: `chrome://extensions/`
   - Brave: `brave://extensions/`
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this project folder: `C:\Dev_Personal\youtube-lang`.
5. After code changes, click **Update** on the extensions page.
6. Refresh YouTube.
7. Click the extension icon to toggle dual subtitles on or off.

## Files

- `manifest.json` - Manifest V3 extension definition.
- `icons/` - Extension icons used by Chrome, Brave, and the Chrome Web Store listing.
- `content.js` - Runs on YouTube and renders the subtitle overlay.
- `src/languages.js` - Defines shared source and target language options.
- `src/overlaySettings.js` - Defines shared overlay display settings.
- `src/overlayPosition.js` - Calculates the overlay position relative to the YouTube player.
- `background.js` - Calls Google Translate from the extension service worker.
- `popup.html` - Extension popup UI.
- `popup.js` - Saves the on/off, source language, target language, and position settings.

## Tests

Run the Node unit tests with:

```powershell
npm test
```

## Privacy

See `PRIVACY.md` for details about what data the extension handles and how caption text is sent for translation.

## Support

If this extension is useful, you can support development here:

[Buy me a coffee](https://buymeacoffee.com/bluezebrafish)

## License

MIT License. See `LICENSE` for details.
