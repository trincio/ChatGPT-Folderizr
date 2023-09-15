// Function for organizing conversations into folders (include it here or you can keep the original code)
function organizeConversationsIntoFolders(org_enabled) {
  // Select all LI elements of conversations
  const conversations = document.querySelectorAll('.relative[data-projection-id] li.relative[data-projection-id]');
  
  // Create an object to store folders and their conversations
  const folders = {};

  // Identify existing folders in the DOM created earlier
  const existingFolders = document.querySelectorAll('.folder h2');

  existingFolders.forEach(folderH2 => {
    const folderName = folderH2.textContent;
    const conversationsOl = folderH2.nextElementSibling;

    folders[folderName] = {
      folderH2,
      conversationsOl,
    };
  });

  // Iterate through all conversations
  conversations.forEach(conversation => {
    // Find the text of the conversation name
    const conversationText = conversation.querySelector('.flex-1.text-ellipsis').textContent;

    // Search for the folder name within square brackets
    const matchFolder = conversationText.match(/\[(.*?)\]/);

    if (matchFolder) {
      // If a folder is present, extract the name
      const folderName = matchFolder[1];

      // If the folder doesn't exist yet, create it
      if (!folders[folderName]) {
        // Create a <div> element for the folder
        const folderDiv = document.createElement('div');
        folderDiv.className = 'folder';

        // Create an <h2> element for the folder name
        const folderNameH2 = document.createElement('h2');
        folderNameH2.textContent = folderName;

        // Create an <ol> element for conversations
        const conversationsOl = document.createElement('ol');

        // Add the folder name and conversation list to the folder div
        folderDiv.appendChild(folderNameH2);
        folderDiv.appendChild(conversationsOl);

        // Add the folder to the folders object
        folders[folderName] = {
          folderNameH2,
          conversationsOl,
        };

        // Insert the folder into the DOM
        const insertionPosition = conversation.parentElement;
        insertionPosition.insertBefore(folderDiv, conversation);
      }

      // Move the conversation under the current folder
      const currentFolder = folders[folderName];
      currentFolder.conversationsOl.appendChild(conversation);

      // Remove the folder name from the conversation text
      const newConversationText = conversationText.replace(`[${folderName}]`, '').trim();
      conversation.querySelector('.flex-1.text-ellipsis').textContent = newConversationText;

      // Disable and hide buttons in the conversations
      const conversationButtons = conversation.querySelectorAll('button'); // Update the selector
      conversationButtons.forEach(button => {
        button.style.visibility = 'hidden';
        button.disabled = true;
      });
	  

  // Get the current background color
  const currentBackgroundColor = window.getComputedStyle(conversation).backgroundColor;

  // Calculate a slightly greener shade
  const newBackgroundColor = calculateSlightlyGreenerColor(currentBackgroundColor);

  // Apply the new background color
  conversation.style.backgroundColor = newBackgroundColor;

  conversation.style.padding = '5px'; // Add some padding around the conversation to make it more noticeable
 
	  
    }
  });
  
  
// Aggiungi uno stile alle cartelle per renderle identificabili
Object.values(folders).forEach(folder => {
  //folder.folderNameH2.style.backgroundColor = 'lightblue'; // Modifica il colore a tuo piacimento
  folder.folderNameH2.style.padding = '5px'; // Aggiungi uno spazio intorno al testo per renderlo più evidente
});  
  

  // Periodically, check and reapply visibility and button enablement settings
  setInterval(() => {
    conversations.forEach(conversation => {
      const conversationButtons = conversation.querySelectorAll('button'); // Update the selector
      conversationButtons.forEach(button => {
        button.style.visibility = 'hidden';
        button.disabled = true;
      });
    });
  }, 300); // Check every second (you can adjust the value based on your needs)

  // Add CSS styles for expanding and collapsing folders
  const style = document.createElement('style');
  style.textContent = `
    .folder ol {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.2s ease-out;
    }

    .folder.expanded ol {
      max-height: 1000px; /* Set a high maximum value to allow full expansion */
      transition: max-height 0.2s ease-in;
    }
  `;

  document.head.appendChild(style);

  const allFolders = document.querySelectorAll('.folder');

  allFolders.forEach(folder => {
    const folderNameH2 = folder.querySelector('h2');
    folderNameH2.addEventListener('click', () => {
      // Check if the folder is expanded
      const isExpanded = folder.classList.contains('expanded');

      // If it's expanded, remove the 'expanded' class (close the folder), otherwise, add it (expand the folder)
      if (isExpanded) {
        folder.classList.remove('expanded');
        console.log("Folder closed");
      } else {
        folder.classList.add('expanded');
        console.log("Folder expanded");
      }
    });
  });
}

// MAIN: Preliminary check
 
// Check if Chrome or Firefox storage API can be used
const isChrome = !!window.chrome && !!window.chrome.storage;
const isFirefox = typeof browser !== 'undefined' && !!browser.storage;
const isEdge = typeof window.msBrowser !== 'undefined' && typeof window.chrome !== 'undefined' && !!window.chrome.storage && !isFirefox;

// Select the appropriate storage API
const storage = isFirefox ? browser.storage.local : (isChrome ? chrome.storage.local : localStorage);

// Display the detected browser type
var browserType = "'other'";
if (isChrome) browserType = "'Chrome-like'";
if (isFirefox) browserType = "'Firefox-like'";
if (isEdge) browserType = "'Edge-like'";
console.log("Folderizr: Storage browser found. Browser type: " + browserType);

function waitForConversationsToLoad(org_enabled) {
  const conversations = document.querySelectorAll('.relative[data-projection-id] li.relative[data-projection-id]');

  if (conversations.length === 0) {
    console.log("ChatGPT Folderizr: Conversations not found, still loading or the DOM structure may have been modified by chatGPT developers. ChatGPT Folderizr will retry later.");
    // Periodically, retry waitForConversationsToLoad
    setTimeout(() => {
      waitForConversationsToLoad(org_enabled);
    }, 1000); // Retry every second (adjust the value as needed)
  } else {
    console.log("ChatGPT Folderizr: Conversations loaded, organizing now.");
    organizeConversationsIntoFolders(org_enabled);
  }
}

document.addEventListener('DOMContentLoaded', function () {
  // Load the current state from storage and execute conversation organization if enabled
  if (isEdge || !isChrome && !isFirefox) {
    const CGPTFolderizr_enabled = JSON.parse(localStorage.getItem('CGPTFolderizr_enabled')) || false;

    if (CGPTFolderizr_enabled) {
      console.log("ChatGPT Folderizr: set up the folders.");
      // Wait for conversations to load and then execute organization
      waitForConversationsToLoad(CGPTFolderizr_enabled);
    } else {
      console.log("ChatGPT Folderizr: Extension option disabled. Go to the extension icon and popup to enable the folderizer feature.");
    }
  } else {
    storage.get('CGPTFolderizr_enabled', function (result) {
      const CGPTFolderizr_enabled = result.CGPTFolderizr_enabled || false;

      if (CGPTFolderizr_enabled) {
        console.log("ChatGPT Folderizr: set up the folders.");
        // Wait for conversations to load and then execute organization
        waitForConversationsToLoad(CGPTFolderizr_enabled);
      } else {
        console.log("ChatGPT Folderizr: Extension option disabled. Go to the extension icon and popup to enable the folderizer feature.");
      }
    });
  }
});

// Listen for messages from the popup script
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'updateCGPTFolderizr_enabled') {
    // Here, you can update the variable in the webpage script
    // using request.newValue or as needed.
    console.log('ChatGPT Folderizr: Received new action updateCGPTFolderizr_enabled with value:', request.newValue);

    // Update the data
    if (isEdge || !isChrome && !isFirefox) {
      localStorage.setItem('CGPTFolderizr_enabled', JSON.stringify(request.newValue));
    } else {
      storage.set({ 'CGPTFolderizr_enabled': request.newValue });
    }

    if (request.newValue) {
      // Execute conversation organization if enabled
      waitForConversationsToLoad(request.newValue);
    } else {
      alert("Once the ChatGPT Folderizr Extension activities are disabled, it is needed to reload the page for the standard ChatGPT folder setup. when the page is reloaded, you will find the conversation names with their original names, and you can modify or delete them.");
      // Reload the current page
      location.reload();
    }
  }
});



//helper functions

// calculates a slightly green color
function calculateSlightlyGreenerColor(color) {
  //get the rgb
  const match = color.match(/\d+/g);
  const red = parseInt(match[0]);
  const green = parseInt(match[1]);
  const blue = parseInt(match[2]);

  //  increases the green
  const newGreen = Math.min(green + 20, 255);

  // creates and returns the color
  const newColor = `rgb(${red}, ${newGreen}, ${blue})`;

  return newColor;
}