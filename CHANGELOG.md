# Changelog

## Unreleased

- Added an experimental detached FolderSearcher panel.
- Added manual `Rescan chats` for locally indexing visible normal sidebar Chats.
- Added folder tree navigation from title prefixes such as `[GRAFICA/vettoriale]`.
- Added search filtering that hides folder branches without matching descendants.
- Added JSON export for the local FolderSearcher index only.
- Added a local backup reminder after indexing.

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
