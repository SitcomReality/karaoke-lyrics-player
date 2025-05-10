// UI Update functions
import { state, getCurrentPlaylist } from '../state.js';
import { elements } from '../dom.js';
import * as Theme from '../theme.js';
import * as Lyrics from '../lyrics.js';
import * as Audio from '../audio.js';

import { updateSongInfo, updateSongImage, updateAudioFileInfo } from './ui-songInfo.js';
import { updateHistoryPanel, updatePlaylistsPanel, updateCurrentPlaylistPanel } from './ui-panels.js';
import { updatePlayerControls, updateProgressUI } from './ui-player.js';
import { updateExtractedPaletteDisplay } from './ui-themeElements.js';

// Re-export sub-ui module functions via index.js

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
    Lyrics.renderLyrics();

    // Theme section
    Theme.updateThemeUI();
    updateExtractedPaletteDisplay();

    // Panels section
    updateHistoryPanel();
    updatePlaylistsPanel();
    updateCurrentPlaylistPanel();

    // Player section
    updatePlayerControls();
    updateProgressUI();
    Audio.updateTimeDisplay();

    // Other UI elements
    updateAutoAdvanceButton();
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