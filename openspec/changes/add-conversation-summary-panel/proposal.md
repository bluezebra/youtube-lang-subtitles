## Why

Long videos and rapid caption updates make it hard to follow the conversation and reorient after interruptions. A right-hand conversation summary panel, rendered in the selected target language, gives viewers a compact, persistent overview of "what's been said" so they can quickly scan or catch up without rewinding.

The user suggested optionally leveraging a GitHub Marketplace "ChatGPT-5 mini" summarization provider (free tier) as an external summarizer. This proposal treats marketplace summarization as an optional provider behind an explicit opt-in and config in the popup.

## What changes

- Add a conversation summary panel anchored to the right side of the YouTube player that shows periodic summaries (and an on-demand summary) of recently translated caption lines in the currently selected target language.
- Capture a short rolling history of translated caption lines (bounded window) and surface them as source+target pairs and as automatic condensed summaries (target-language) in the panel.
- Introduce a provider abstraction for summarization with two built-in options: 1) lightweight local extractive summarizer (no remote calls), 2) optional external summarizer (e.g., ChatGPT-5 mini) invoked from background.js when the user enables and consents. The UI must make the distinction clear and require opt-in for remote summarization.
- Add popup settings: enable/disable panel, summary frequency (periodic interval or manual), retention window size, provider selection, and provider-specific config (API key or OAuth if required by provider). Default to local summarizer offloading network calls unless user enables the provider.
- Update background.js to broker summarization requests and handle provider responses; ensure privacy consent, rate-limits, caching, and error handling.

## Capabilities

### New capabilities
- `conversation-summary-panel`: UI component that displays recent translated lines and generated summaries in the target language.
- `summarizer-provider`: Abstraction to call summarization providers (local or remote) and return normalized summaries.

### Modified capabilities
- `translation-state`: emit committed history events/callbacks suitable for summarization.

## Impact

- Affected code: `content.js`, `src/translationState.js`, `background.js`, `popup.js`, `manifest.json` (possible host permission addition only if a provider requires external hosts), new `src/summarizer.js` and tests.
- Privacy: Remote summarization requires explicit opt-in and clear UX explaining that caption text will be sent to third-party provider. Provide an explicit consent toggle in popup and avoid storing provider credentials in plaintext without user intent.
- Tests: Add unit tests for summary generation, provider plumbing, and UI rendering logic.
- UX: Keep unchanged default behavior (two-line overlay) and make the panel opt-in by default.

## Recommendation

Start with a local extractive summarizer and the UI + settings plumbing. Make the external provider integration optional behind a clear setting and consent flow so users can try summarization without exposing captions to remote services.