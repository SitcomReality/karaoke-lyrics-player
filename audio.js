// Audio playback and control functions
import { state } from './state.js';
import { elements } from './dom.js';
import * as UI from './ui/index.js';
import * as Playlist from './playlist.js';
import * as Lyrics from './lyrics.js';
import * as Storage from './storage.js';

export function setupInitialAudio() {
    if (state.currentSong && state.currentSong.audioUrl) {
        try {
            state.audio = new Audio(state.currentSong.audioUrl);
            setupAudioListeners();
        } catch (e) {
            console.warn("Could not reload audio from stored URL:", e);
            state.currentSong.audioUrl = null; 
            state.currentSong.audioFilename = null; 
            state.audio = null;
            UI.updateUI(); 
        }
    }
}

export function setupAudioListeners() {
    if (!state.audio) return;

    state.audio.addEventListener('loadedmetadata', () => {
        state.duration = state.audio.duration;
        updateTimeDisplay();
        UI.updateProgressUI(); 
    });

    state.audio.addEventListener('timeupdate', () => {
        state.currentTime = state.audio.currentTime;
        updateTimeDisplay();
        UI.updateProgressUI();
        Lyrics.updateHighlightedLyrics(); 
    });

    state.audio.addEventListener('ended', () => {
        state.isPlaying = false;
        elements.playBtn.innerHTML = '<i class="fas fa-play"></i>';
        state.currentTime = 0; 
        UI.updateProgressUI(); 
        state.currentLineIndex = -1; 
        Lyrics.renderLyrics();

        if (state.currentPlaylistId && state.autoAdvanceEnabled) {
            setTimeout(() => Playlist.playNextSong(), 1500);
        }
    });

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
    percentage = Math.max(0, Math.min(1, percentage)); 

    state.audio.currentTime = percentage * state.duration;
}

export function adjustVolume() {
    if (!state.audio) return;

    const volume = parseFloat(elements.volumeSlider.value);
    state.audio.volume = volume;
}

export function updateTimeDisplay() {
    if (!state.duration) { 
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
        URL.revokeObjectURL(state.audio.src); 
        state.audio = null;
    }

    const audioUrl = URL.createObjectURL(file);
    state.audio = new Audio(audioUrl);
    state.currentSong.audioUrl = audioUrl; 
    state.currentSong.audioFilename = file.name; 
    state.isPlaying = false;
    state.currentTime = 0;
    elements.playBtn.innerHTML = '<i class="fas fa-play"></i>';

    setupAudioListeners(); 

    const filename = file.name.replace(/\.[^/.]+$/, ""); 
    if (!state.currentSong.title && !state.currentSong.artist) {
        const parts = filename.split(' - ');
        if (parts.length > 1) {
            state.currentSong.artist = parts[0].trim();
            state.currentSong.title = parts.slice(1).join(' - ').trim();
        } else {
            state.currentSong.title = filename.trim();
            state.currentSong.artist = ''; 
        }
    }

    Storage.saveCurrentSongState(); 
    UI.updateUI(); 
}