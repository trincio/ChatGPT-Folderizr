document.addEventListener('DOMContentLoaded', function () {
  // Check if Chrome or Firefox storage API can be used
  const isChrome = !!window.chrome && !!window.chrome.storage;
  const isFirefox = typeof browser !== 'undefined' && !!browser.storage;

  // Select the appropriate storage API
  const storage = isFirefox ? browser.storage.local : (isChrome ? chrome.storage.local : localStorage);

  if (storage) {
    // Load the current state from storage
    const CGPTFolderizr_EXT_enabled = JSON.parse(storage.getItem('CGPTFolderizr_EXT_enabled')) || false;
    const toggleButton = document.getElementById('toggleButton');

    // Set the button text based on the current state
    toggleButton.textContent = CGPTFolderizr_EXT_enabled ? 'Disable' : 'Enable';

    // Add a listener for the button click event
    toggleButton.addEventListener('click', function () {
      // Read the current state
      const CGPTFolderizr_EXT_enabled = JSON.parse(storage.getItem('CGPTFolderizr_EXT_enabled')) || false;

      // Toggle the state
      const newCGPTFolderizr_EXT_enabled = !CGPTFolderizr_EXT_enabled;

      // Store the new state
      storage.setItem('CGPTFolderizr_EXT_enabled', JSON.stringify(newCGPTFolderizr_EXT_enabled));

      // Update the button text
      toggleButton.textContent = newCGPTFolderizr_EXT_enabled ? 'Disable' : 'Enable';

      // Send a message to the content script
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'updateCGPTFolderizr_enabled', newValue: newCGPTFolderizr_EXT_enabled });
      });
    });
  }
  
  
 //GUI HANDLING


// Aggiungi un gestore per il pulsante di descrizione
const toggleDescriptionButton = document.getElementById('toggleDescription');
const descriptionContent = document.getElementById('description_content');

toggleDescriptionButton.addEventListener('click', () => {
  if (descriptionContent.style.display === 'none') {
    descriptionContent.style.display = 'block';
  } else {
    descriptionContent.style.display = 'none';
  }
});
 
  
  
});


