// UI Update functions
import { state, getCurrentPlaylist } from './state.js';
import { elements } from './dom.js';
import * as Theme from './theme.js';
import * as Lyrics from './lyrics.js';
import * as Audio from './audio.js';

// Import functions from sub-modules
import { updateSongInfo, updateSongImage, updateAudioFileInfo } from './ui-songInfo.js';
import { updateHistoryPanel, updatePlaylistsPanel, updateCurrentPlaylistPanel } from './ui-panels.js';
import { updatePlayerControls, updateProgressUI } from './ui-player.js';
import { updateExtractedPaletteDisplay } from './ui-themeElements.js';

// Re-export functions that might be called directly from other modules
// This maintains the existing API for other parts of the application
export {
    updateHistoryPanel,
    updatePlaylistsPanel,
    updateCurrentPlaylistPanel,
    updateUI,
    updateProgressUI,
    updatePlayerControls,
    updateExtractedPaletteDisplay,
    updateAutoAdvanceButton
};

function updateUI() {
    // Song Info section
    updateSongInfo();
    updateSongImage();
    updateAudioFileInfo();

    // Lyrics section
    Lyrics.renderLyrics(); // Render lyrics based on current state

    // Theme section
    Theme.updateThemeUI(); // Update theme display and apply styles
    updateExtractedPaletteDisplay(); // Update palette display

    // Panels section
    updateHistoryPanel();
    updatePlaylistsPanel();
    updateCurrentPlaylistPanel();

    // Player section
    updatePlayerControls(); // Reflect play/pause state, volume etc.
    updateProgressUI(); // Update progress bar
    Audio.updateTimeDisplay(); // Update time display

    // Other UI elements
    updateAutoAdvanceButton(); // Update auto-advance button state
}

function updateAutoAdvanceButton() {
    const btn = elements.toggleAutoAdvanceBtn;
    if (state.autoAdvanceEnabled) {
        btn.classList.add('active');
        btn.title = 'Auto-Advance On (Click to disable)';
        btn.innerHTML = '<i class="fas fa-forward"></i>';
    } else {
        btn.classList.remove('active');
        btn.title = 'Auto-Advance Off (Click to enable)';
        btn.innerHTML = '<i class="fas fa-forward"></i>';
    }
    const currentPlaylist = getCurrentPlaylist();
    btn.disabled = !currentPlaylist || !currentPlaylist.songs || currentPlaylist.songs.length === 0;
}