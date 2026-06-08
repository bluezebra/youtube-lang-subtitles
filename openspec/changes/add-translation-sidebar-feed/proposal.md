## Why

The current two-line subtitle overlay favors the newest line, which makes translated text feel jumpy and easy to miss during fast speech. A persistent side feed is needed so users can keep reading recent translated lines without losing context.

## What Changes

- Add a side translation feed panel that keeps a rolling history of translated subtitle lines while playback continues.
- Keep the current live two-line overlay for "now playing" context, while the side feed provides recent history.
- Add feed behavior controls for maximum retained lines and auto-scroll behavior when new lines arrive.
- Define commit and deduplication rules so partial caption fragments do not spam the feed.

## Capabilities

### New Capabilities
- `translation-sidebar-feed`: Provides a persistent, scrollable side panel of recent translated subtitle lines with controlled commit, dedupe, and auto-scroll behavior.

### Modified Capabilities
- (none)

## Impact

- Affected code: `content.js`, `src/translationState.js`, and related overlay/state helpers.
- UI impact: additional on-page panel rendered on YouTube pages while extension is enabled.
- Storage/settings impact: new sync settings for feed size and scroll behavior.
- Test impact: expanded state and behavior tests for feed commit, dedupe, and retention logic.
