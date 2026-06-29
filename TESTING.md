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
