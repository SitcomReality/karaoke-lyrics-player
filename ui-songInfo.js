// ui-songInfo.js - UI Updates for song information
import { state } from './state.js';
import { elements } from './dom.js';
import * as Storage from './storage.js';

export function updateSongInfo() {
    // Update song info
    elements.songTitle.value = state.currentSong.title || '';
    elements.songArtist.value = state.currentSong.artist || '';
}

export function updateSongImage() {
    if (state.currentSong.image && state.currentSong.image !== 'default-song-image.png') {
         // Use Object URL if available and valid
         if (state.currentSong.image.startsWith('blob:')) {
             elements.songImage.src = state.currentSong.image;
         } else {
             // Handle potential non-blob string references if needed, otherwise default
             console.warn("Unhandled image source type:", state.currentSong.image);
             elements.songImage.src = 'default-song-image.png';
         }
    } else {
        elements.songImage.src = 'default-song-image.png';
    }
     // Handle potential errors loading the image (e.g., revoked Blob URL)
    elements.songImage.onerror = () => {
        console.warn("Failed to load song image, reverting to default.");
        elements.songImage.src = 'default-song-image.png';
        // Clear potentially invalid image state
        if (state.currentSong.image && state.currentSong.image.startsWith('blob:')) {
            state.currentSong.image = null;
            Storage.saveCurrentSongState(); // Save the cleared state
        }
    };
}

export function updateAudioFileInfo() {
    if (state.currentSong.audioFilename) {
        elements.audioFileInfo.textContent = `Loaded: ${state.currentSong.audioFilename}`;
        elements.audioFileInfo.title = state.currentSong.audioFilename; // Show full name on hover
    } else {
        elements.audioFileInfo.textContent = 'No audio file loaded';
        elements.audioFileInfo.title = '';
    }
}