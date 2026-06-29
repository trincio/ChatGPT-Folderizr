# Folderizr

Independent open-source browser extension. Not affiliated with, endorsed by, or sponsored by OpenAI.

Folderizr is a small browser extension that visually groups ChatGPT sidebar conversations by title prefix. It is designed for `https://chatgpt.com/*` and `https://chat.openai.com/*`.

## What It Does

Folderizr looks at the visible titles in the ChatGPT sidebar. If a title starts with a bracketed folder name, the extension groups that chat under a local visual folder.

Example:

```text
[Work] Project update
[Music] Synth setup
Unsorted idea
```

When enabled, the sidebar may display a local Folderizr section above the normal Chats section:

```text
Folderizr
  Work
    Project update
  Music
    Synth setup

Chats
Unsorted idea
```

The displayed chat title may hide the prefix visually, but Folderizr does not rename the underlying ChatGPT conversation and does not modify conversation data server-side.

## Privacy And Data Use

Folderizr does not collect, transmit, sell, share, track, profile, or analyze user data. It does not include ads, analytics, telemetry, affiliate links, remote logging, backend services, or remote code.

Stored values stay local in the browser. Folderizr stores the enable/disable preference and, if the user runs FolderSearcher, a local index of visible sidebar metadata: chat title, local chat URL, inferred folder path, and indexing timestamp.

FolderSearcher export downloads only this local index. It does not export conversation contents.

## Permissions

- `storage`: stores the local enable/disable preference.

Folderizr does not request permission to read data from arbitrary websites. Its content script is limited to:

- `https://chatgpt.com/*`
- `https://chat.openai.com/*`

## Browser Support

Folderizr targets Manifest V3 browsers:

- Firefox
- Google Chrome
- Microsoft Edge

The extension uses plain JavaScript, HTML, and CSS. There is no bundler, framework, analytics SDK, or backend.

## Usage

1. Install the extension as an unpacked or temporary extension in your browser.
2. Open ChatGPT at `https://chatgpt.com/` or, if reachable, `https://chat.openai.com/`.
3. Rename conversations manually in ChatGPT so the visible title starts with a folder prefix, such as `[Work] Project update`.
4. Open the Folderizr extension popup.
5. Click `Enable`.
6. Click `Disable` to turn Folderizr off. The page reloads so ChatGPT can restore its original sidebar layout.

## Known Limitations

Folderizr depends on ChatGPT's web UI. It may break or need updates if the ChatGPT sidebar markup changes.

Folderizr only performs local visual organization of the sidebar. It does not scrape, export, bulk-download, or programmatically extract ChatGPT conversations or outputs. It does not call private or undocumented OpenAI endpoints and does not bypass rate limits, protections, authentication, paywalls, or platform restrictions.

FolderSearcher currently indexes normal sidebar Chats only. Project chat indexing is not enabled by default and should remain a separate, explicit feature if added later.

## Files

- `manifest.json`: extension manifest and permissions.
- `content.js`: local visual grouping logic for the ChatGPT sidebar.
- `popup.html`: extension popup UI.
- `popup.js`: enable/disable preference handling.
- `privacy.md`: privacy policy.
- `STORE_LISTINGS.md`: draft store listing copy.
- `TESTING.md`: manual test checklist.
- `CHANGELOG.md`: release history.

## License

This project remains free and open source under the existing license.
