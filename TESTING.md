# Manual Test Plan

Use version `1.1.0` from the local branch `chore/v1.1-modernization`.

## Static Checks

- Validate `manifest.json` as JSON.
- Search for remote code, analytics, telemetry, tracking, affiliate links, private endpoint calls, and duplicated manifest keys.
- Confirm the only requested permission is `storage`.

## Firefox

1. Open `about:debugging#/runtime/this-firefox`.
2. Load the extension temporarily from `manifest.json`.
3. Open `https://chatgpt.com/`.
4. Confirm the popup opens and defaults to disabled unless previously enabled.
5. Enable Folderizr.
6. Confirm a chat titled `[Work] Project update` appears in a local `Folderizr` sidebar section under a `Work` visual folder as `Project update`.
7. Confirm a chat without a prefix remains outside folders.
8. Confirm multiple folders render separately, such as `[Work] ...` and `[Music] ...`.
9. Reload the page and confirm the enabled state is remembered.
10. Create or rename a conversation after page load and confirm grouping updates.
11. Disable Folderizr and confirm the page reloads and the original sidebar layout returns.
12. If reachable, repeat domain checks on `https://chat.openai.com/`.

## Chrome

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Load the extension unpacked.
4. Repeat the Firefox functional checks on `https://chatgpt.com/`.
5. If reachable, repeat domain checks on `https://chat.openai.com/`.

## Microsoft Edge

1. Open `edge://extensions`.
2. Enable Developer mode.
3. Load the extension unpacked.
4. Repeat the Firefox functional checks on `https://chatgpt.com/`.
5. If reachable, repeat domain checks on `https://chat.openai.com/`.

## Expected Results

- Folderizr only changes the local visual sidebar layout and creates its own local section above Chats when grouped items exist.
- The underlying ChatGPT conversation title is not changed by the extension.
- Native ChatGPT buttons remain visible and usable.
- Disabling Folderizr reloads the page and restores ChatGPT's own sidebar rendering.
- No data is collected or transmitted by Folderizr.

## FolderSearcher Experimental Checks

1. Enable Folderizr.
2. Confirm the detached `FolderSearcher` button appears.
3. Open FolderSearcher.
4. Click `Rescan chats`.
5. Confirm the status reports locally indexed chats.
6. Confirm a title like `[GRAFICA/vettoriale] Operazioni JS` appears as `GRAFICA > vettoriale > Operazioni JS`.
7. Type a search term and confirm folders without matching descendants disappear.
8. Open a result and confirm it navigates to the chat using its normal `/c/...` link.
9. Click `Export index` and confirm the JSON contains metadata only, not conversation contents.
10. Start another rescan and confirm `Stop scan` appears while scanning.
11. Click `Stop scan` and confirm the partial index is saved and remains searchable.
12. Run a complete scan with enough history to trigger lazy loading and confirm the indexed count grows progressively.
13. Confirm the sidebar returns to its original scroll position after a completed or stopped scan.
14. Navigate to another page during a scan and confirm FolderSearcher stops safely without losing the partial index.
15. Confirm `Rescan chats` is disabled while a scan is already running.
