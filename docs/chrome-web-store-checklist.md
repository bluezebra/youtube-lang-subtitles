---
title: Chrome Web Store Publishing Checklist
Copilot Session: 292adaa1-edad-49ae-b96c-b97409ec8ed0
---

# Chrome Web Store Publishing Checklist

**Copilot Session:** `292adaa1-edad-49ae-b96c-b97409ec8ed0`

## Developer account

- Register in the Chrome Web Store Developer Dashboard.
- Pay the one-time developer registration fee.
- Use an email address you check regularly for review and policy notifications.

## Package readiness

- Manifest `name`: `YouTube Dual Subtitles`
- Manifest `description`: `Show translated subtitles below YouTube captions with selectable languages and overlay position.`
- Manifest `version`: incremented for store-ready metadata and icon updates.
- Extension icons included:
  - `16x16`
  - `32x32`
  - `48x48`
  - `128x128` PNG, required for Chrome Web Store upload.
- Runtime support icon included:
  - `assets/coffee.svg`
- Create a ZIP with `manifest.json` at the ZIP root.

## Store listing draft

Short description:

> Show translated subtitles below YouTube captions with selectable languages and overlay position.

Detailed description:

> YouTube Dual Subtitles helps language learners and multilingual viewers read two subtitle lines at the same time on YouTube.
>
> When YouTube captions are visible, the extension reads the current caption text and displays a clean overlay with the original caption on top and a Google Translate result underneath. You can choose the source language, target language, and where the overlay appears on the video.
>
> Features:
>
> - Dual subtitle overlay for YouTube videos with captions.
> - Searchable source language selector using the Google Translate language list, including Auto-detect.
> - Searchable target language selector using the Google Translate language list.
> - Overlay position selector: Bottom, Middle, or Top.
> - Toggle to enable or disable the extension.
> - In-memory translation caching while the page is open.
>
> The extension does not use analytics, ads, accounts, or developer-controlled servers. Caption text is sent to Google Translate only to provide the subtitle translation.
>
> Optional support: If this extension is useful, you can support development at https://buymeacoffee.com/bluezebrafish.

Suggested category:

- Accessibility

Required listing assets:

- 128x128 extension icon.
- At least one screenshot, either `1280x800` or `640x400`.
- Small promotional image, `440x280`.

Optional listing assets:

- YouTube promo video.
- Marquee promotional image, `1400x560`.

## Privacy tab draft

Single purpose:

> Shows translated subtitles alongside YouTube captions so users can read the original caption and a translated line at the same time.

Permission justification:

| Permission | Justification |
| --- | --- |
| `storage` | Saves user preferences such as enabled state, source language, target language, and overlay position. |
| `https://translate.googleapis.com/*` | Sends visible caption text and selected language codes to Google Translate over HTTPS to retrieve translations. |

Remote code declaration:

> No. The extension calls Google Translate as a remote API, but it does not download or execute remote code.

Data usage disclosure:

> The extension handles visible YouTube caption text and user-selected settings. Caption text is sent to Google Translate only to provide translations. The extension developer does not receive, store, sell, or use caption text for analytics, advertising, profiling, or any unrelated purpose.

Privacy policy URL:

> https://github.com/bluezebra/youtube-lang-subtitles/blob/main/PRIVACY.md

## Distribution

Recommended first submission:

- Visibility: Unlisted or Private for initial review/testing, then Public once comfortable.
- Regions: All regions unless you want to restrict availability.

## Tip/support link

Use the same support link as the popup and README:

- Buy Me a Coffee: `https://buymeacoffee.com/bluezebrafish`

Use this as the store support/homepage link if the dashboard asks for one. Keep it clearly separate from core functionality:

- Do not gate subtitle translation behind payment.
- Do not collect or monetize caption data.
- Do not make donation prompts disruptive.
