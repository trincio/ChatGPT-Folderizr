# Privacy Policy

Independent open-source browser extension. Not affiliated with, endorsed by, or sponsored by OpenAI.

Folderizr is a local browser extension that visually groups ChatGPT sidebar conversations by bracketed title prefix.

## Data Collection

Folderizr does not collect user data.

It does not collect personal information, ChatGPT conversations, prompts, outputs, browsing history, account details, identifiers, usage events, or diagnostics.

## Data Transmission

Folderizr does not transmit user data.

It has no backend service, no remote logging, no telemetry endpoint, no analytics service, no advertising service, and no affiliate tracking.

## Tracking And Profiling

Folderizr does not track users, profile users, fingerprint users, sell data, share data, or use analytics.

## Remote Code

Folderizr does not load or execute remote code. The extension runs from the files included in the extension package.

## Local Storage

Folderizr uses local browser extension storage to remember whether the extension is enabled or disabled.

If the user runs FolderSearcher, Folderizr also stores a local index of visible sidebar metadata: chat title, local chat URL, inferred folder path, and indexing timestamp.

These values stay in the user's browser storage and are not transmitted by Folderizr.

## ChatGPT Content

Folderizr does not scrape, export, bulk-download, or programmatically extract ChatGPT conversation contents or outputs. It does not call private or undocumented OpenAI endpoints and does not modify conversation data server-side.

Folderizr only changes the local visual layout of the ChatGPT sidebar while enabled.

FolderSearcher can export a JSON backup of its local index. This backup contains only indexed sidebar metadata and does not contain conversation contents.

## Permissions

Folderizr uses the `storage` permission to save the local enable/disable preference.

Its content script runs only on:

- `https://chatgpt.com/*`
- `https://chat.openai.com/*`

## Limitations

Folderizr depends on ChatGPT's web UI and may break if that UI changes.

## Contact

For questions, use the project's public repository channels.
