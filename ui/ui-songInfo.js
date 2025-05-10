// ui-songInfo.js - UI Updates for song information
import { state } from '../state.js';
import { elements } from '../dom.js';
import * as Storage from '../storage.js';

export function updateSongInfo() {
    elements.songTitle.value = state.currentSong.title || '';
    elements.songArtist.value = state.currentSong.artist || '';
}

export function updateSongImage() {
    if (state.currentSong.image && state.currentSong.image !== 'default-song-image.png') {
         if (state.currentSong.image.startsWith('blob:')) {
             elements.songImage.src = state.currentSong.image;
         } else {
             console.warn("Unhandled image source type:", state.currentSong.image);
             elements.songImage.src = 'default-song-image.png';
         }
    } else {
        elements.songImage.src = 'default-song-image.png';
    }
    elements.songImage.onerror = () => {
        console.warn("Failed to load song image, reverting to default.");
        elements.songImage.src = 'default-song-image.png';
        if (state.currentSong.image && state.currentSong.image.startsWith('blob:')) {
            state.currentSong.image = null;
            Storage.saveCurrentSongState();
        }
    };
}

export function updateAudioFileInfo() {
    if (state.currentSong.audioFilename) {
        elements.audioFileInfo.textContent = `Loaded: ${state.currentSong.audioFilename}`;
        elements.audioFileInfo.title = state.currentSong.audioFilename;
    } else {
        elements.audioFileInfo.textContent = 'No audio file loaded';
        elements.audioFileInfo.title = '';
    }
}