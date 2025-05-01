// Event handlers and main event setup
import { state } from './state.js';
import { elements } from './dom.js';
import * as Audio from './audio.js';
import * as UI from './ui.js';
import * as Lyrics from './lyrics.js';
import * as Storage from './storage.js';
import * as Theme from './theme.js';
import * as Modal from './modal.js';
import * as ImportExport from './importExport.js';

export function setupEventListeners() {
    // Audio player controls
    elements.playBtn.addEventListener('click', Audio.togglePlay);
    elements.progressBar.addEventListener('click', Audio.seekAudio);
    elements.volumeSlider.addEventListener('input', Audio.adjustVolume);
    
    // Upload handlers
    elements.uploadAudio.addEventListener('change', Audio.handleAudioUpload);
    elements.uploadImage.addEventListener('change', handleImageUpload);
    elements.uploadLyrics.addEventListener('change', Lyrics.handleLyricsUpload);
    
    // Lyrics controls
    elements.nextLineBtn.addEventListener('click', Lyrics.markNextLine);
    elements.resetTimingBtn.addEventListener('click', Lyrics.resetTiming);
    elements.editTimingModeBtn.addEventListener('click', Lyrics.toggleEditMode);
    elements.saveProjectBtn.addEventListener('click', Storage.saveProject);
    
    // Song info editing
    elements.songTitle.addEventListener('input', handleSongInfoChange);
    elements.songArtist.addEventListener('input', handleSongInfoChange);
    
    // Modal buttons
    elements.importExportBtn.addEventListener('click', () => Modal.openModal(elements.importExportModal));
    elements.editColorsBtn.addEventListener('click', () => Modal.openModal(elements.colorEditModal));
    elements.createPlaylistBtn.addEventListener('click', () => Modal.openModal(elements.createPlaylistModal));
    
    // Modal content handlers can be added here...
    
    // Keyboard shortcut for marking next line
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !Modal.isAnyModalOpen()) {
            e.preventDefault(); // Prevent page scroll
            Lyrics.markNextLine();
        }
    });
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Create object URL for the image
    const imageUrl = URL.createObjectURL(file);
    state.currentSong.image = imageUrl;
    elements.songImage.src = imageUrl;
    
    // Optionally extract colors from image
    Theme.extractColorsFromImage(elements.songImage);
    
    // Save state
    Storage.saveCurrentSongState();
}

function handleSongInfoChange() {
    state.currentSong.title = elements.songTitle.value;
    state.currentSong.artist = elements.songArtist.value;
    Storage.saveCurrentSongState();
}