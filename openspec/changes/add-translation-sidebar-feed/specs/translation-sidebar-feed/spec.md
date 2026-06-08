## ADDED Requirements

### Requirement: Side feed displays recent translated subtitle lines
The extension SHALL render a persistent side feed while subtitles are enabled and SHALL append newly committed translated lines in chronological order.

#### Scenario: Feed is shown when subtitles are enabled
- **WHEN** the extension is enabled on a YouTube page with captions
- **THEN** a side feed is visible alongside the live subtitle overlay
- **AND** committed translated lines appear in oldest-to-newest order

### Requirement: Feed commit and dedupe reduce caption churn noise
The extension SHALL commit feed entries only from translation-ready subtitle text and SHALL deduplicate near-identical consecutive entries to avoid repeated fragment spam.

#### Scenario: Partial caption fragments do not spam the feed
- **WHEN** caption text updates rapidly with incremental fragments of the same spoken line
- **THEN** the feed commits at most one stable entry for that line segment
- **AND** near-identical consecutive translations are not appended as separate entries

### Requirement: Feed retention is bounded and configurable
The extension SHALL retain only the most recent configured number of feed entries and SHALL remove oldest entries when the limit is exceeded.

#### Scenario: Feed trims oldest entries at retention limit
- **WHEN** a new committed entry would exceed the configured retention count
- **THEN** the oldest feed entry is removed
- **AND** the feed continues to contain exactly the configured maximum number of entries

### Requirement: Feed auto-scroll respects reader interaction
The extension SHALL auto-scroll to newest entries only while the viewer is at the bottom of the feed and SHALL preserve manual reading position when the viewer scrolls up.

#### Scenario: Manual scroll-up pauses automatic jumping
- **WHEN** the viewer scrolls away from the bottom of the feed
- **THEN** new committed entries are added without forcing scroll to bottom
- **AND** automatic scrolling resumes once the viewer returns to the bottom
