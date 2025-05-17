import * as State from './state.js';
import * as DOM from './dom.js';
import * as Audio from './audio.js';
import * as Lyrics from './lyrics.js';
import * as Storage from './storage.js';
import * as UI from './ui/index.js';
import * as Theme from './theme/index.js';
import * as Playlist from './playlist.js';
import * as PlaylistIO from './playlistIO.js';
import * as Modal from './modal.js';
import * as MainImportExport from './importExport.js';
import * as Events from './events.js';
import * as Presentation from './presentation/index.js';

// Import HTML structure generators
import { createLeftSidebarHTML } from './ui/html/leftSidebar.js';
import { createMainContentHTML } from './ui/html/mainContent.js';
import { createRightSidebarHTML } from './ui/html/rightSidebar.js';
import { createModalsHTML } from './ui/html/modals.js';

/**
 * Injects the main HTML structure into the DOM.
 */
function initializeDOMStructure() {
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
        appContainer.innerHTML = `
            ${createLeftSidebarHTML()}
            ${createMainContentHTML()}
            ${createRightSidebarHTML()}
        `;
    } else {
        console.error("Fatal Error: '.app-container' not found in index.html. Cannot build UI.");
        return;
    }
    document.body.insertAdjacentHTML('beforeend', createModalsHTML());
}

// Initialize application
function init() {
    // 1. Build the main HTML structure from JS modules
    initializeDOMStructure();

    // 2. Initialize DOM element references now that HTML is in place
    DOM.initializeElements(); 
    
    // 3. Load data from local storage
    Storage.loadFromLocalStorage();
    
    // 4. Set up event listeners
    Events.setupEventListeners();
    
    // Main project import/export is set up lazily in events.js

    // 5. Update UI with current state (needs DOM elements and loaded state)
    UI.updateUI();

    // 6. Set up initial audio state if necessary
    Audio.setupInitialAudio();
    
    // 7. Initialize presentation mode
    Presentation.init();
}

// Entry point
document.addEventListener('DOMContentLoaded', init);