// Audio playback and control functions
import { state } from '../state.js';
import { elements } from '../dom.js';
import * as UI from './ui/index.js';
import * as Playlist from './playlist.js';
import * as Lyrics from './lyrics.js';
import * as Storage from './storage.js';

export function setupInitialAudio() {
    if (state.currentSong && state.currentSong.audioUrl && state.currentSong.audioUrl.startsWith('blob:')) {
        // This indicates a potential persisted blob URL from session restore or similar.
        // Verify it's still valid by trying to create an Audio object.
        try {
            // Temporarily create to check. If it throws, URL is likely invalid.
            const tempAudio = new Audio(state.currentSong.audioUrl);
            tempAudio.onerror = () => { // If it errors on creation/loading
                 console.warn("Stored audioUrl seems invalid, clearing:", state.currentSong.audioUrl);
                 URL.revokeObjectURL(state.currentSong.audioUrl); // Attempt cleanup
                 state.currentSong.audioUrl = null;
                 // state.audio remains null, locator logic will trigger if audioFilename exists
                 UI.updateUI();
            };
             // If it doesn't error immediately, we assume it might be valid.
             // Actual loading will happen if user tries to play, or if findAndLoadAudio is called.
             // For now, if audioUrl exists, we assume it's valid until proven otherwise.
             // The `loadSongFromHistory` already nulls out `audioUrl` for different songs,
             // so this path is mainly for initial load of the app.
             if(!state.audio) { // If state.audio isn't already set up from a previous action
                state.audio = new Audio(state.currentSong.audioUrl);
                setupAudioListeners();
             }

        } catch (e) {
            console.warn("Could not create audio from stored URL, clearing:", e);
            if (state.currentSong.audioUrl.startsWith('blob:')) URL.revokeObjectURL(state.currentSong.audioUrl);
            state.currentSong.audioUrl = null;
            state.audio = null;
            UI.updateUI();
        }
    } else if (state.currentSong && state.currentSong.audioUrl && !state.currentSong.audioUrl.startsWith('blob:')) {
        // Potentially a persistent URL (e.g. http). Try to load it.
        if(!state.audio) {
            state.audio = new Audio(state.currentSong.audioUrl);
            setupAudioListeners();
        }
    }
    // If audioUrl is null, but audioFilename exists, loadSongFromHistory will trigger AudioLocator
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

    // Set up audio analysis for visualization if Web Audio API is supported
    try {
        if (!state.audioContext) {
            state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // Connect audio to analyzer
        const source = state.audioContext.createMediaElementSource(state.audio);
        const analyser = state.audioContext.createAnalyser();
        
        source.connect(analyser);
        analyser.connect(state.audioContext.destination);
        
        // Configure analyzer
        analyser.fftSize = 256;
        
        // Store analyzer for visualization
        state.audioAnalyser = analyser;
    } catch (e) {
        console.warn('Web Audio API not supported for visualization:', e);
    }
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
    processAudioFileAndUpdateState(file); // This function is now async
    e.target.value = ''; // Clear the input field
}

/**
 * Processes an audio file, updates the state, and UI.
 * Can be called from file input or programmatically.
 * @param {File} file The audio file to process.
 * @returns {Promise<void>}
 */
export async function processAudioFileAndUpdateState(file) {
    return new Promise((resolve, reject) => {
        if (state.audio) {
            state.audio.pause();
            if (state.audio.src && state.audio.src.startsWith('blob:')) {
                URL.revokeObjectURL(state.audio.src);
            }
            state.audio = null;
        }

        const audioUrl = URL.createObjectURL(file);
        state.audio = new Audio(audioUrl);
        state.currentSong.audioUrl = audioUrl;
        state.currentSong.audioFilename = file.name;
        state.isPlaying = false;
        state.currentTime = 0;
        if (elements.playBtn) elements.playBtn.innerHTML = '<i class="fas fa-play"></i>';

        // Event listener for when metadata is loaded to resolve the promise
        state.audio.onloadedmetadata = () => {
            setupAudioListeners(); // Sets up core listeners, analyser, and duration related UI
            
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

            const audioReadyEvent = new CustomEvent('audioready', { detail: { audio: state.audio } });
            document.body.dispatchEvent(audioReadyEvent);
            resolve();
        };

        state.audio.onerror = (e) => {
            console.error("Error loading audio:", e);
            URL.revokeObjectURL(audioUrl); // Clean up blob URL
            state.currentSong.audioUrl = null; // Clear from state
            // state.currentSong.audioFilename remains, so user could try to locate again.
            state.audio = null;
            UI.updateUI(); // Reflect that audio failed to load
            reject(new Error("Failed to load audio."));
        };
    });
}

/**
 * Loads an audio file and returns a promise with its ObjectURL, duration, and filename.
 * Does not modify global state directly.
 * @param {File} file The audio file to load.
 * @returns {Promise<{audioUrl: string, duration: number, audioFilename: string}>}
 */
export function loadAudioFileAsPromise(file) {
    return new Promise((resolve, reject) => {
        if (!file || !file.type.startsWith('audio/')) {
            reject(new Error("Invalid audio file provided."));
            return;
        }

        const audioUrl = URL.createObjectURL(file);
        const tempAudio = new Audio(audioUrl);

        tempAudio.onloadedmetadata = () => {
            resolve({
                audioUrl: audioUrl,
                duration: tempAudio.duration,
                audioFilename: file.name
            });
        };

        tempAudio.onerror = (e) => {
            URL.revokeObjectURL(audioUrl); // Clean up ObjectURL on error
            console.error("Error loading audio file:", e);
            reject(new Error(`Failed to load audio file: ${file.name}`));
        };
    });
}