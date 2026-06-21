## 1. Planning & scaffolding

- [ ] 1.1 Create change directory and OpenSpec metadata (.openspec.yaml) for the new change.
- [ ] 1.2 Add high-level proposal.md and design.md (this change) and tasks.md to the change folder.

## 2. Translation state & commit pipeline

- [ ] 2.1 Extend `src/translationState.js` to emit committed translation events (reuse stabilization rules from sidebar feed). Add an API to subscribe to committed entries.
- [ ] 2.2 Add in-memory rolling buffer for committed entries keyed by video id and bounded by `retentionCount` setting.
- [ ] 2.3 Add simple hashing/fingerprint for buffer snapshot to support caching of generated summaries.

## 3. Summarizer provider & background plumbing

- [ ] 3.1 Add `src/summarizer.js` (provider abstraction) and export for tests. Implement `local-extractive` summarizer here.
- [ ] 3.2 Add background message handler in `background.js` to accept `ytDualSubtitles.summarize` messages and invoke the selected provider. Implement rate-limiting and caching. Respect `providerConsent` before forwarding text to external hosts.
- [ ] 3.3 (Optional provider) Add remote provider implementation wiring for `chatgpt-5-mini` behind opt-in. Document required host permissions and user consent flow. Do not enable by default.

## 4. UI panel & popup settings

- [ ] 4.1 Implement right-hand conversation summary panel creation and rendering in `content.js` (or a new `src/summaryPanel.js` shared module). Ensure responsive behavior and non-blocking of player controls.
- [ ] 4.2 Render recent committed entries and show generated summary in target language. Include "Summarize now" manual button and status indicator.
- [ ] 4.3 Add popup UI controls for summary enablement, provider selection, frequency, retentionCount, and provider consent toggles.
- [ ] 4.4 Ensure `chrome.storage.sync` keys are read on startup and watched via `chrome.storage.onChanged` so updates propagate without page reload.

## 5. Tests & verification

- [ ] 5.1 Unit tests: `test/summarizer.local.test.js` for the local extractive summarizer.
- [ ] 5.2 Unit tests: extend `test/translationState.test.js` to assert committed-entry emission and retention trimming.
- [ ] 5.3 Integration tests: mock background summarizer responses and assert UI panel updates.
- [ ] 5.4 Run `npm test` and fix any regressions.

## 6. Documentation & privacy

- [ ] 6.1 Update README.md and popup UI copy to explain remote summarization privacy implications.
- [ ] 6.2 Add a short privacy note in `PRIVACY.md` describing what text is sent when remote summarization is enabled.

## 7. Rollout & fallback

- [ ] 7.1 Default to local summarizer and summary panel disabled. Make the feature discoverable in the popup.
- [ ] 7.2 Add telemetry-style logs (console only) for debugging; do not send telemetry externally.
- [ ] 7.3 Provide clear rollback: if provider fails or user disables summary, panel collapses and no remote calls are made.


## Implementation order (minimal apply-ready set)

1. 1.1, 1.2 (scaffold)
2. 2.1, 2.2 (commit pipeline & buffer)
3. 3.1, 4.1 (local summarizer + UI panel read-only)
4. 4.3, 4.4 (popup integration and settings propagation)
5. 5.1, 5.2 (tests for summarizer and state)
6. Optional: 3.3 (remote provider wiring) only after privacy review and UI consent flow

