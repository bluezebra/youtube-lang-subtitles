## 1. Feed state and commit pipeline

- [ ] 1.1 Add translation feed state structures and bounded retention handling in `src/translationState.js`.
- [ ] 1.2 Implement commit stabilization and consecutive dedupe rules for feed entries derived from translated captions.
- [ ] 1.3 Add configuration inputs for feed retention and auto-scroll behavior in shared state/settings flow.

## 2. Side feed UI rendering in content script

- [ ] 2.1 Add side feed container creation/styling and responsive placement logic in `content.js` while preserving the current live overlay.
- [ ] 2.2 Render committed entries into the side feed in chronological order and trim DOM nodes when retention is exceeded.
- [ ] 2.3 Implement auto-scroll behavior that follows new entries only when the user is at the bottom of the feed.

## 3. Settings integration

- [ ] 3.1 Add new storage keys/defaults for feed retention and auto-scroll behavior in popup/content settings plumbing.
- [ ] 3.2 Expose feed settings in popup UI with validation and persistence via `chrome.storage.sync`.
- [ ] 3.3 Ensure settings changes propagate live to the content script without page reload.

## 4. Verification

- [ ] 4.1 Extend `test/translationState.test.js` for feed commit, dedupe, and bounded retention scenarios.
- [ ] 4.2 Add/extend tests for feed settings normalization and defaults in shared modules.
- [ ] 4.3 Run `npm test` and confirm the new behavior is covered by deterministic tests.
