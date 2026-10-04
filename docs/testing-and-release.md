# Testing and releasing

## 1. Automated tests

```powershell
npm test
```

All tests must pass before packaging a release.

## 2. Load the extension unpacked

1. Open `chrome://extensions/` (Brave: `brave://extensions/`).
2. Enable **Developer mode**.
3. Click **Load unpacked** and select this repository folder (the one containing `manifest.json`).
4. After code changes, click **Update** (or the reload icon on the extension card), then refresh YouTube.

If your managed browser blocks unpacked extensions, test in a separate browser profile or VM where extension policies do not apply.

## 3. Manual test checklist

Open a YouTube video with captions turned on (CC) and check:

- [ ] Enabling **Enable dual subtitles** shows the overlay and hides YouTube's native captions.
- [ ] Disabling it hides the overlay and restores native captions without a page reload.
- [ ] Changing **Source language** and **Target language** updates translations without a page reload.
- [ ] **Position** (bottom / middle / top) moves the overlay.
- [ ] The overlay follows the player in fullscreen, theater mode, and when resizing the window.
- [ ] Navigating to another video (YouTube SPA navigation) keeps the overlay working.
- [ ] On fast-changing captions, the translation keeps up and the previous translation stays visible until the new one arrives.
- [ ] Translation errors (for example, going offline) show a readable message in the overlay.
- [ ] Popup settings persist after closing and reopening the popup and the browser.
- [ ] No errors appear in the service worker console (`chrome://extensions/` → **Inspect views: service worker**) or the page console.

## 4. Package a release

1. Bump `version` in `manifest.json` (the Chrome Web Store rejects uploads that do not increase the version).
2. Run the tests, then build the ZIP:

   ```powershell
   npm test
   npm run package
   ```

   This writes `dist\youtube-dual-subtitles-<version>.zip` with `manifest.json` at the ZIP root. Only runtime files are included (`manifest.json`, `background.js`, `content.js`, `popup.html`, `popup.js`, `LICENSE`, `src/`, `icons/`, `assets/`). `dist/` is gitignored.

3. Optionally load the extracted ZIP as an unpacked extension to confirm the packaged build works.

## 5. Upload to the Chrome Web Store

1. Open the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
2. Select the existing item (or **New item** for a first release).
3. Go to **Package** → **Upload new package** and choose the ZIP from `dist\`.
4. Review **Store listing**, **Privacy practices**, and **Distribution** (see [`chrome-web-store-checklist.md`](chrome-web-store-checklist.md)).
5. Click **Submit for review**.
6. After publishing, tag the release:

   ```powershell
   git tag v<version>
   git push origin v<version>
   ```
