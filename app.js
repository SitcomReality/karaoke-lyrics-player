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

// Initialize application
function init() {
    // Load data from local storage
    Storage.loadFromLocalStorage();
    
    // Set up event listeners (this will also call PlaylistIO.setupPlaylistIOModal)
    Events.setupEventListeners();
    
    // Set up main project import/export functionality
    // Note: MainImportExport.setupImportExport() is now called lazily from events.js when the main I/E button is clicked.
    // This ensures that DOM elements for that modal are definitely ready.
    
    // Update UI with current state
    UI.updateUI();

    // Set up initial audio state if necessary
    Audio.setupInitialAudio();
    
    // Initialize presentation mode
    Presentation.init();
}

// Entry point
document.addEventListener('DOMContentLoaded', init);