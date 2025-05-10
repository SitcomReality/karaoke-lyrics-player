import * as State from './state.js';
import * as DOM from './dom.js';
import * as Audio from './audio.js';
import * as Lyrics from './lyrics.js';
import * as Storage from './storage.js';
import * as UI from './ui/index.js';
import * as Theme from './theme/index.js';
import * as Playlist from './playlist.js';
import * as Modal from './modal.js';
import * as ImportExport from './importExport.js';
import * as Events from './events.js';
import * as Presentation from './presentation/index.js';

// Initialize application
function init() {
    // Load data from local storage
    Storage.loadFromLocalStorage();
    
    // Set up event listeners
    Events.setupEventListeners();
    
    // Set up import/export functionality
    ImportExport.setupImportExport();

    // Update UI with current state
    UI.updateUI();

    // Set up initial audio state if necessary
    Audio.setupInitialAudio();
    
    // Initialize presentation mode
    Presentation.init();
}

// Entry point
document.addEventListener('DOMContentLoaded', init);