## Context

The extension currently renders a two-line live overlay that prioritizes the newest subtitle text. This is effective for "now playing" context but can cause missed translations when captions update rapidly. The change introduces a second presentation surface: a persistent side feed for recently translated lines.

Constraints:
- Runs as a YouTube content script with no bundler.
- Translation is asynchronous and currently debounced with delayed source reveal.
- Existing live overlay behavior must remain available.

## Goals / Non-Goals

**Goals:**
- Add a persistent, scrollable side feed of recent translated subtitle lines.
- Reduce perceived jumpiness by retaining recently translated lines.
- Prevent feed noise from partial caption churn using commit and dedupe rules.
- Keep behavior configurable through extension settings.

**Non-Goals:**
- Replacing the live two-line overlay.
- Replacing the existing translation provider.
- Building cross-video or long-term transcript history persistence.

## Decisions

### 1. Use a dual-surface subtitle UI
- Decision: Keep the current live overlay and add a separate side feed.
- Rationale: Live overlay serves immediate focus, while the feed solves line loss and re-read needs.
- Alternative considered: Replace overlay entirely with feed-only UI. Rejected because it weakens immediate readability for active playback.

### 2. Introduce feed-entry commit stabilization
- Decision: Commit feed entries only after a line is translation-ready and stable enough to avoid frequent fragment updates.
- Rationale: YouTube captions often stream partial text; immediate commit would create noisy, hard-to-read feed entries.
- Alternative considered: Commit every translated fragment. Rejected due to high duplication and visual churn.

### 3. Add dedupe + bounded retention
- Decision: Deduplicate near-identical consecutive entries and retain only the most recent configured window of entries.
- Rationale: Prevents spam and bounds memory/DOM growth.
- Alternative considered: Unlimited history. Rejected due to performance and clutter risks.

### 4. Auto-scroll with user override
- Decision: Auto-scroll to newest entries when the viewer is at the bottom; pause auto-scroll when the viewer manually scrolls up.
- Rationale: Preserves "live" behavior while respecting manual review of earlier lines.
- Alternative considered: Always force-scroll. Rejected because it interrupts reading history.

## Risks / Trade-offs

- [Increased DOM work on caption-heavy videos] -> Keep feed item rendering lightweight and enforce bounded retention.
- [Entry commit timing may still feel delayed for some users] -> Expose settings for feed size and commit/scroll behavior; tune defaults from usage feedback.
- [Partial-phrase dedupe can hide meaningful updates] -> Restrict dedupe to near-identical consecutive lines and preserve clearly changed content.
- [Layout conflicts on narrow viewports] -> Define responsive fallback behavior for compact screens.

## Migration Plan

1. Add feed state and commit/dedupe logic in translation state handling.
2. Add side feed rendering and responsive layout behavior in content script UI layer.
3. Add settings keys and defaults for retention and auto-scroll behavior.
4. Update tests for feed commit, dedupe, retention, and scroll behavior.
5. Rollback strategy: disable feed feature gate/settings and fall back to existing live overlay behavior.

## Open Questions

- Should the feed panel be right-side only or support left/right placement from settings?
- Should entries keep source+target text pairs or target-only text by default?
- What default retention count best balances readability and compactness for typical laptop viewports?
