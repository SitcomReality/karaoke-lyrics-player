import * as State from './state.js';
import * as DOM from './dom.js';
import * as Audio from './audio.js';
import * as Lyrics from './lyrics.js';
import * as Storage from './storage.js';
import * as UI from './ui.js';
import * as Theme from './theme.js';
import * as Playlist from './playlist.js';
import * as Modal from './modal.js';
import * as ImportExport from './importExport.js';
import * as Events from './events.js';

// Import UI sub-modules if direct access to their specific functions were needed by app.js
// For now, app.js only uses UI.updateUI(), which is orchestrated by the main ui.js
// import * as SongInfoUI from './ui-songInfo.js';
// import * as PanelsUI from './ui-panels.js';
// import * as PlayerUI from './ui-player.js';
// import * as ThemeElementsUI from './ui-themeElements.js';


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
}

// Entry point
document.addEventListener('DOMContentLoaded', init);