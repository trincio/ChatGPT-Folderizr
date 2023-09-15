# ChatGPT Folderizr Extension

ChatGPT Folderizr is a browser extension that enhances the chat experience on chat.openai.com by organizing conversations into folders. This extension provides a convenient way to manage and categorize your chat conversations, making it easier to stay organized.

## Project Overview

ChatGPT Folderizr was developed as a browser extension (for Microsoft Edge in the current, first version) to add functionality to the chat.openai.com platform. It addresses the need for conversation organization, which is not natively supported on the platform. The extension adds a feature that allows users to create folders for their conversations and move chats into these folders based on specified naming conventions.

## Usage

Using ChatGPT Folderizr is simple and straightforward:

1. Install the extension using the local extension installation (**a marketplace link will be provided later on**).

2. Once the extension is installed, you will see its icon in your browser's toolbar.

3. Navigate to [chat.openai.com](https://chat.openai.com/) to access your chat conversations.

4. To enable the conversation organization feature, click on the ChatGPT Folderizr icon in the toolbar.

5. ChatGPT Folderizr will automatically organize your conversations into folders based on specified naming conventions. Conversations with folder names enclosed in square brackets, e.g., `[Work] Project Update`, will be categorized under the corresponding folder (e.g., "Work").

6. You can also disable the extension at any time by clicking the extension icon again.

## Example Conversation List

Here's an example of how your conversation list might look before and after enabling ChatGPT Folderizr:

### Before Enabling

- Chat 1
- Chat 2
- [Work] Project Update
- [Personal] Weekend Plans
- Chat 3
- [Work] Monthly Report

### After Enabling

- Chat 1
- Chat 2
- Work
  - Project Update
  - Monthly Report
- Personal
  - Weekend Plans
- Chat 3

Note: Conversations without square brackets remain unaffected by the folderization process.



## Architectural Choices

### Storage API Compatibility

One of the key architectural choices of ChatGPT Folderizr was to make it compatible with different browsers. The extension checks whether it is running in a Chrome-like, Firefox-like, or Edge-like environment to use the appropriate storage API (e.g., `localStorage`, `chrome.storage`, or `browser.storage`).

#### NOTE:
This compatibility ensures that the extension can work seamlessly across multiple browsers, once they support the newer versions of the manifest. At the moment, despite the efforts, it *runs only in Edge*.

### Content Script Execution Timing

To ensure that conversation organization is applied correctly, the extension waits for the DOM to fully load before executing its content script. This approach guarantees that the extension can access and manipulate chat conversations once they are available in the DOM.

### User Interaction through Popup

The extension provides user interaction through a popup, allowing users to enable or disable the conversation organization feature. The popup interface displays a brief description of the extension's functionality and offers a button to toggle the feature on or off.

### Dynamic Styling

The extension utilizes dynamic styling to visually enhance the chat interface. It introduces CSS rules that expand and hide conversation folders as needed, improving the user experience.

### Reloading for Consistency

Due to architectural constraints, renaming or deleting conversations while the extension is active can lead to unpredictable behavior. Therefore, the extension recommends disabling it before making any changes. Upon disabling the extension, it triggers a page reload to ensure consistency in the chat interface.

## File Descriptions

- `manifest.json`: The extension's manifest file, specifying permissions, scripts, and icons.
- `content.js`: The content script responsible for organizing conversations into folders.
- `popup.js`: The script for the extension's popup interface, enabling users to toggle the feature on or off.
- `popup.html`: The HTML file defining the content and layout of the popup interface.
- `images/`: A directory containing icons used by the extension.

## Development Considerations

- The extension may not function correctly if the structure of the chat.openai.com platform changes significantly in future updates.
- Renaming or deleting conversations while the extension is active can lead to unpredictable behavior, so it is recommended to disable the extension before making such changes.
- Compatibility with different browsers is ensured through the use of appropriate storage APIs.

## Conclusion

ChatGPT Folderizr enhances the chat experience on chat.openai.com by providing a user-friendly conversation organization feature. It offers compatibility with various browsers, employs dynamic styling for improved visuals, and recommends a page reload for consistency. While it enhances the user experience, it also acknowledges potential challenges arising from changes in the underlying chat platform.
