// Audio playback and control functions
import { state } from './state.js';
import { elements } from './dom.js';
import * as UI from './ui.js';
import * as Playlist from './playlist.js';
import * as Lyrics from './lyrics.js';
import * as Storage from './storage.js';

export function setupInitialAudio() {
    // Initial audio setup logic remains the same,
    // audioFilename will be null initially or after page load, which is correct.
    if (state.currentSong && state.currentSong.audioUrl) {
        // If there's an audio URL stored in the current song state (e.g., from session storage)
        // We need to be careful here, as Blob URLs might not persist across page loads
        // A better approach might be needed for persistent audio without re-upload
        try {
            state.audio = new Audio(state.currentSong.audioUrl);
            setupAudioListeners();
        } catch (e) {
            console.warn("Could not reload audio from stored URL:", e);
            state.currentSong.audioUrl = null; // Clear invalid URL
            state.currentSong.audioFilename = null; // Clear filename too
            state.audio = null;
            UI.updateUI(); // Update UI to reflect cleared audio state
        }
    }
}

export function setupAudioListeners() {
    if (!state.audio) return;

    state.audio.addEventListener('loadedmetadata', () => {
        state.duration = state.audio.duration;
        updateTimeDisplay();
        UI.updateProgressUI(); // Update progress bar to show duration
    });

    state.audio.addEventListener('timeupdate', () => {
        state.currentTime = state.audio.currentTime;
        updateTimeDisplay();
        UI.updateProgressUI();
        Lyrics.updateHighlightedLyrics(); // Sync lyrics
    });

    state.audio.addEventListener('ended', () => {
        state.isPlaying = false;
        elements.playBtn.innerHTML = '<i class="fas fa-play"></i>';
        state.currentTime = 0; // Reset time
        UI.updateProgressUI(); // Reset progress bar visually
        state.currentLineIndex = -1; // Reset lyrics highlight
        Lyrics.renderLyrics();

        // Auto play next song if in playlist
        if (state.currentPlaylistId) {
            setTimeout(() => Playlist.playNextSong(), 1500);
        }
    });

    // Apply initial volume
    state.audio.volume = parseFloat(elements.volumeSlider.value);
}

export function togglePlay() {
    if (!state.audio) {
        alert('Please upload an audio file first.');
        return;
    }

    if (state.isPlaying) {
        state.audio.pause();
        elements.playBtn.innerHTML = '<i class="fas fa-play"></i>';
    } else {
        // Check if context needs resuming (required after user interaction)
        if (state.audioContext && state.audioContext.state === 'suspended') {
            state.audioContext.resume();
        }
        state.audio.play().catch(e => console.error("Error playing audio:", e));
        elements.playBtn.innerHTML = '<i class="fas fa-pause"></i>';
    }

    state.isPlaying = !state.isPlaying;
}

export function seekAudio(e) {
    if (!state.audio || !state.duration) return;

    const bounds = elements.progressBar.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const width = bounds.width;
    let percentage = x / width;
    percentage = Math.max(0, Math.min(1, percentage)); // Clamp between 0 and 1

    state.audio.currentTime = percentage * state.duration;
    // The 'timeupdate' event will handle UI updates
}

export function adjustVolume() {
    if (!state.audio) return;

    const volume = parseFloat(elements.volumeSlider.value);
    state.audio.volume = volume;
}

export function updateTimeDisplay() {
    if (!state.duration) { // Use duration to check if audio is loaded
        elements.timeDisplay.textContent = '0:00 / 0:00';
        return;
    }

    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    elements.timeDisplay.textContent = `${formatTime(state.currentTime)} / ${formatTime(state.duration)}`;
}

export function handleAudioUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (state.audio) {
        state.audio.pause();
        URL.revokeObjectURL(state.audio.src); // Clean up old object URL
        state.audio = null;
    }

    const audioUrl = URL.createObjectURL(file);
    state.audio = new Audio(audioUrl);
    state.currentSong.audioUrl = audioUrl; // Store the URL
    state.currentSong.audioFilename = file.name; // Store the filename
    state.isPlaying = false;
    state.currentTime = 0;
    elements.playBtn.innerHTML = '<i class="fas fa-play"></i>';

    setupAudioListeners(); // Add listeners to the new audio object

    // Try to extract song info from filename if not already set
    const filename = file.name.replace(/\.[^/.]+$/, ""); // remove extension
    if (!state.currentSong.title && !state.currentSong.artist) {
        const parts = filename.split(' - ');
        if (parts.length > 1) {
            state.currentSong.artist = parts[0].trim();
            state.currentSong.title = parts.slice(1).join(' - ').trim();
        } else {
            state.currentSong.title = filename.trim();
            state.currentSong.artist = ''; // Reset artist if only title is parsed
        }
    }

    Storage.saveCurrentSongState(); // Save potentially updated title/artist and audioUrl
    UI.updateUI(); // Update the entire UI, which includes song info fields and the new audio filename
}