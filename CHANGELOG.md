# Changelog

## Unreleased

- Added an experimental detached FolderSearcher panel.
- Added manual `Rescan chats` for locally indexing visible normal sidebar Chats.
- Added folder tree navigation from title prefixes such as `[GRAFICA/vettoriale]`.
- Added search filtering that hides folder branches without matching descendants.
- Added JSON export for the local FolderSearcher index only.
- Added a local backup reminder after indexing.
- Improved detection of the actual scrollable ChatGPT history container.
- Added cancellable progressive scanning with a visible `Stop scan` action.
- Added per-round progress reporting and progressive local index saves.
- Added temporary mutation tracking, safe interruption handling, and scroll-position restoration.
- Replaced the short round-based completion rule with an 8-second activity quiet period at the bottom of the list.
- Extended the scan safety limit to 15 minutes for large histories.
- Added a passive scan probe with exportable numeric DOM, timing, mutation, and progress diagnostics.
- Fixed scanner fallback selection so FolderSearcher's own indexed tree cannot be mistaken for the native ChatGPT history.
- Made chat-history discovery independent from the localized `Chat history` accessibility label.
- Made scan completion adaptive to observed lazy-loading latency, with a 15-second minimum and 60-second maximum quiet period.

## 1.1.0

- Renamed the extension presentation to Folderizr, with ChatGPT mentioned only descriptively where needed.
- Added the required independent-project disclaimer to extension metadata and documentation.
- Added support for both `https://chatgpt.com/*` and `https://chat.openai.com/*`.
- Removed duplicate manifest keys and kept permissions minimal.
- Kept the `storage` permission because it is used only for the local enable/disable preference.
- Reworked sidebar grouping to use a `MutationObserver` instead of repeated aggressive polling.
- Preserved local-only visual grouping for normal Chats titles that start with `[FolderName]`.
- Added a dedicated local Folderizr sidebar section above Chats when grouped items are present.
- Stopped hiding or disabling native ChatGPT conversation buttons.
- Added a privacy policy, manual test plan, and store listing drafts.
