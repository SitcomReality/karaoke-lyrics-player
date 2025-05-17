// Audio playback and control functions
import { state } from '../state.js';
import { elements } from '../dom.js';
import * as UI from './ui/index.js';
import * as Playlist from './playlist.js';
import * as Lyrics from './lyrics.js';
import * as Storage from './storage.js';
import * as AudioLocator from './audioLocator.js'; // Import AudioLocator for setupInitialAudio fallback

// Store listener function references to properly remove them
let currentLoadedMetadataListener = null;
let currentTimeUpdateListener = null;
let currentEndedListener = null;
let currentErrorListener = null; // Listener for persistent audio errors

export function cleanupOldAudio() {
    if (state.audio) {
        state.audio.pause();

        // Remove specific listeners if they were set
        if (currentLoadedMetadataListener) {
            state.audio.removeEventListener('loadedmetadata', currentLoadedMetadataListener);
            currentLoadedMetadataListener = null;
        }
        if (currentTimeUpdateListener) {
            state.audio.removeEventListener('timeupdate', currentTimeUpdateListener);
            currentTimeUpdateListener = null;
        }
        if (currentEndedListener) {
            state.audio.removeEventListener('ended', currentEndedListener);
            currentEndedListener = null;
        }
        if (currentErrorListener) {
            state.audio.removeEventListener('error', currentErrorListener);
            currentErrorListener = null;
        }
        
        // Revoke ObjectURL if it's a blob
        if (state.audio.src && state.audio.src.startsWith('blob:')) {
            URL.revokeObjectURL(state.audio.src);
        }
    }
    state.audio = null;
    state.isPlaying = false;
    state.currentTime = 0;
    state.duration = 0;
    state.audioAnalyser = null; // Also clear the analyser reference
}

export function setupInitialAudio() {
    if (state.audio) { // If audio object already exists (e.g. from a previous load during the session)
        return;
    }

    let audioUrlToTry = state.currentSong?.audioUrl;

    if (audioUrlToTry) {
        console.log("setupInitialAudio: Attempting to load persisted audio URL:", audioUrlToTry);
        const initialAudio = new Audio(audioUrlToTry); // Create a temporary audio element
        
        const tempOnLoadedMetadata = () => {
            initialAudio.removeEventListener('loadedmetadata', tempOnLoadedMetadata);
            initialAudio.removeEventListener('error', tempOnError);

            state.audio = initialAudio; // Assign to global state ONLY if successfully loaded
            setupAudioListeners();      // Then setup persistent listeners
            UI.updateUI();
            console.log("setupInitialAudio: Successfully loaded metadata for persisted audio.");
        };

        const tempOnError = (e) => {
            initialAudio.removeEventListener('loadedmetadata', tempOnLoadedMetadata);
            initialAudio.removeEventListener('error', tempOnError);

            console.warn(`setupInitialAudio: Persisted audioUrl ('${audioUrlToTry}') is invalid or inaccessible. Error: ${e?.target?.error?.message || 'Unknown error'}. Clearing URL.`);
            if (audioUrlToTry.startsWith('blob:')) {
                URL.revokeObjectURL(audioUrlToTry);
            }
            if (state.currentSong) state.currentSong.audioUrl = null;
            
            if (state.currentSong && state.currentSong.audioFilename) {
                console.log("setupInitialAudio: Persisted URL failed, attempting AudioLocator for:", state.currentSong.audioFilename);
                AudioLocator.findAndLoadAudio(state.currentSong).finally(() => UI.updateUI());
            } else {
                UI.updateUI();
            }
        };

        initialAudio.addEventListener('loadedmetadata', tempOnLoadedMetadata);
        initialAudio.addEventListener('error', tempOnError);
        // Some browsers might not fire 'error' for certain URL issues until src is set and load is attempted.
        // If initialAudio.src is not set by constructor for all URLs, ensure it's set or load() is called.
        // `new Audio(url)` typically sets src and starts loading.

    } else if (state.currentSong && state.currentSong.audioFilename) {
        console.log("setupInitialAudio: No persisted URL, attempting AudioLocator for:", state.currentSong.audioFilename);
        AudioLocator.findAndLoadAudio(state.currentSong).finally(() => UI.updateUI());
    }
}

export function setupAudioListeners() {
    if (!state.audio) return;

    // Define new listener functions for the current state.audio
    currentLoadedMetadataListener = () => {
        state.duration = state.audio.duration;
        updateTimeDisplay();
        UI.updateProgressUI(); 
    };

    currentTimeUpdateListener = () => {
        // Guard against null audio or audio in an error state
        if (!state.audio || state.audio.error) { 
            if (state.audio && state.audio.error) {
                // This log can be noisy if errors are frequent, consider removing or making conditional
                // console.warn("Audio element in error state during timeupdate:", state.audio.error.code, state.audio.error.message);
            }
            return; 
        }
        state.currentTime = state.audio.currentTime;
        updateTimeDisplay();
        UI.updateProgressUI();
        Lyrics.updateHighlightedLyrics(); 
    };

    currentEndedListener = () => {
        state.isPlaying = false;
        UI.updatePlayerControls(); // Update button based on new state.isPlaying

        state.currentTime = 0; 
        UI.updateProgressUI(); 
        state.currentLineIndex = -1; 
        Lyrics.renderLyrics();

        if (state.currentPlaylistId && state.autoAdvanceEnabled) {
            setTimeout(() => Playlist.playNextSong(), 1500);
        }
    };

    currentErrorListener = (e) => {
        console.error("Error on persistent audio object:", e, state.audio?.error);
        // Perform cleanup similar to what would happen if audio failed to load initially
        if (state.audio && state.audio.src && state.audio.src.startsWith('blob:')) {
            URL.revokeObjectURL(state.audio.src);
        }
        state.audio = null;
        state.isPlaying = false;
        state.currentSong.audioUrl = null; // Clear the URL, as it's problematic
        // audioFilename remains, so AudioLocator can try again if user re-selects song.
        UI.updateUI(); // This will update player controls, reflect no audio, etc.
    };

    // Add the new listeners
    state.audio.addEventListener('loadedmetadata', currentLoadedMetadataListener);
    state.audio.addEventListener('timeupdate', currentTimeUpdateListener);
    state.audio.addEventListener('ended', currentEndedListener);
    state.audio.addEventListener('error', currentErrorListener);

    if (elements.volumeSlider) { // ensure elements are loaded
        state.audio.volume = parseFloat(elements.volumeSlider.value);
    } else {
        state.audio.volume = 1; // default if slider not found
    }

    // Set up audio analysis for visualization if Web Audio API is supported
    try {
        if (!state.audio) { 
            console.warn("setupAudioListeners: state.audio became null before visualizer setup. Skipping visualizer.");
            state.audioAnalyser = null;
            return;
        }
 
        if (!state.audioContext || state.audioContext.state === 'closed') {
            console.log("setupAudioListeners: Creating or recreating AudioContext.");
            state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
         
        if (state.audioContext && state.audioContext.state === 'suspended') {
            state.audioContext.resume().catch(e => console.warn("setupAudioListeners: Failed to resume audio context:", e));
        }
 
        if (state.audioContext && state.audioContext.state === 'running') {
            if (state.audioAnalyser) {
                console.warn("setupAudioListeners: audioAnalyser already exists. This might indicate incomplete cleanup or re-initialization.");
            }
             
            const source = state.audioContext.createMediaElementSource(state.audio);
            const analyser = state.audioContext.createAnalyser();
             
            source.connect(analyser);
            analyser.connect(state.audioContext.destination);
             
            analyser.fftSize = 256;
             
            state.audioAnalyser = analyser; 
        } else {
            console.warn("setupAudioListeners: AudioContext not running. Visualizer not set up. State:", state.audioContext?.state);
            state.audioAnalyser = null;
        }
    } catch (e) {
        console.warn('setupAudioListeners: Web Audio API not supported or error during visualizer setup:', e);
        state.audioAnalyser = null; 
    }
}

export async function processAudioFileAndUpdateState(file) {
    return new Promise((resolve, reject) => {
        cleanupOldAudio(); // Clean up previous audio instance and listeners

        const audioUrl = URL.createObjectURL(file);
        state.audio = new Audio(audioUrl); // Assign new audio object to state
        state.currentSong.audioUrl = audioUrl;
        state.currentSong.audioFilename = file.name;

        // Temporary listeners for this specific loading process
        const tempOnLoadedMetadata = () => {
            state.audio.removeEventListener('loadedmetadata', tempOnLoadedMetadata);
            state.audio.removeEventListener('error', tempOnError);

            setupAudioListeners(); // Set up persistent listeners for the new audio
            
            const filename = file.name.replace(/\.[^/.]+$/, "");
            if (!state.currentSong.title && !state.currentSong.artist) {
                const parts = filename.split(' - ');
                if (parts.length > 1) {
                    state.currentSong.artist = parts[0].trim();
                    state.currentSong.title = parts.slice(1).join(' - ').trim();
                } else {
                    state.currentSong.title = filename.trim();
                }
            }

            Storage.saveCurrentSongState();
            UI.updateUI(); 

            const audioReadyEvent = new CustomEvent('audioready', { detail: { audio: state.audio } });
            document.body.dispatchEvent(audioReadyEvent);
            resolve();
        };

        const tempOnError = (e) => {
            state.audio.removeEventListener('loadedmetadata', tempOnLoadedMetadata);
            state.audio.removeEventListener('error', tempOnError);

            const errorMsg = e?.target?.error?.message || "Unknown audio error";
            console.error("Error loading audio file:", errorMsg, e);
            URL.revokeObjectURL(audioUrl);
            state.currentSong.audioUrl = null; 
            state.currentSong.audioFilename = file.name; // Keep filename so user might locate it
            state.audio = null; 
            UI.updateUI(); 
            reject(new Error(`Failed to load audio: ${errorMsg}`));
        };
        
        state.audio.addEventListener('loadedmetadata', tempOnLoadedMetadata);
        state.audio.addEventListener('error', tempOnError);
        state.audio.load(); // Explicitly call load, though new Audio(src) usually starts it.
    });
}

export async function processAudioUrlAndUpdateState(url) {
    return new Promise((resolve, reject) => {
        cleanupOldAudio();

        state.audio = new Audio(url);
        state.currentSong.audioUrl = url;
        
        try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/');
            let filename = pathParts.pop() || pathParts.pop() || 'audio_from_url'; // Get last part of path
            filename = decodeURIComponent(filename);
            state.currentSong.audioFilename = filename;
        } catch (e) {
            console.warn("Could not parse URL to get filename:", e);
            state.currentSong.audioFilename = "audio_from_url.mp3"; // Fallback filename
        }


        const tempOnLoadedMetadata = () => {
            state.audio.removeEventListener('loadedmetadata', tempOnLoadedMetadata);
            state.audio.removeEventListener('error', tempOnError);

            setupAudioListeners();
            
            // If title/artist are blank, try to fill from derived filename
            if (!state.currentSong.title && !state.currentSong.artist && state.currentSong.audioFilename) {
                const filenameBase = state.currentSong.audioFilename.replace(/\.[^/.]+$/, "");
                const parts = filenameBase.split(' - ');
                if (parts.length > 1) {
                    state.currentSong.artist = parts[0].trim();
                    state.currentSong.title = parts.slice(1).join(' - ').trim();
                } else {
                    state.currentSong.title = filenameBase.trim();
                }
            }

            Storage.saveCurrentSongState();
            UI.updateUI();

            const audioReadyEvent = new CustomEvent('audioready', { detail: { audio: state.audio } });
            document.body.dispatchEvent(audioReadyEvent);
            resolve();
        };

        const tempOnError = (e) => {
            state.audio.removeEventListener('loadedmetadata', tempOnLoadedMetadata);
            state.audio.removeEventListener('error', tempOnError);
            
            const errorMsg = e?.target?.error?.message || "Unknown audio error";
            console.error("Error loading audio from URL:", errorMsg, e);
            state.currentSong.audioUrl = null; // Clear the problematic URL
            // state.currentSong.audioFilename might remain if derived, or be the fallback.
            state.audio = null;
            UI.updateUI();
            reject(new Error(`Failed to load audio from URL: ${errorMsg}. Check CORS policy and URL validity.`));
        };

        state.audio.addEventListener('loadedmetadata', tempOnLoadedMetadata);
        state.audio.addEventListener('error', tempOnError);
        state.audio.load(); // Explicitly call load.
    });
}

export function togglePlay() {
    if (!state.audio) {
        alert('Please upload or load an audio file first.');
        return;
    }

    if (state.isPlaying) {
        state.audio.pause();
    } else {
        if (state.audioContext && state.audioContext.state === 'suspended') {
            state.audioContext.resume().catch(e => console.warn("Error resuming audio context:", e));
        }
        state.audio.play().catch(e => {
            console.error("Error playing audio:", e);
            alert(`Could not play audio: ${e.message}. This might be due to browser restrictions or an issue with the audio source.`);
            state.isPlaying = false; // Ensure state reflects failure
            UI.updatePlayerControls();
        });
    }
    state.isPlaying = !state.isPlaying;
    UI.updatePlayerControls();
}

export function seekAudio(e) {
    if (!state.audio || !state.duration) return;

    const bounds = elements.progressBar.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const width = bounds.width;
    let percentage = x / width;
    percentage = Math.max(0, Math.min(1, percentage)); 

    state.audio.currentTime = percentage * state.duration;
    // Time update event will handle UI update
}

export function adjustVolume() {
    if (!state.audio) return;

    const volume = parseFloat(elements.volumeSlider.value);
    state.audio.volume = volume;
}

export function updateTimeDisplay() {
    if (!state.duration && state.currentTime === 0) { // Check both to avoid NaN if duration becomes 0 during playback
        elements.timeDisplay.textContent = '0:00 / 0:00';
        return;
    }
    
    const current = isNaN(state.currentTime) ? 0 : state.currentTime;
    const duration = isNaN(state.duration) ? 0 : state.duration;


    const formatTime = (timeInSeconds) => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    elements.timeDisplay.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
}

export async function handleAudioUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
        await processAudioFileAndUpdateState(file);
    } catch (error) {
        // Error is already logged by processAudioFileAndUpdateState
        alert(`Could not load audio file: ${error.message}`);
    }
    e.target.value = ''; // Clear the input field
}

/**
 * Loads an audio file and returns a promise with its ObjectURL, duration, and filename.
 * Does not modify global state directly. Used by FolderPlaylistImport.
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
            // Do not revoke tempAudio.src (audioUrl) here, caller is responsible if it uses it.
            // For FolderPlaylistImport, this URL is stored in the song object.
        };

        tempAudio.onerror = (e) => {
            URL.revokeObjectURL(audioUrl); // Clean up ObjectURL on error
            const errorMsg = e?.target?.error?.message || "Unknown audio error";
            console.error("Error loading audio file for promise:", errorMsg, e);
            reject(new Error(`Failed to load audio file ${file.name}: ${errorMsg}`));
        };
        tempAudio.load();
    });
}