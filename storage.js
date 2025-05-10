// Local and Session Storage functions
import { state, resetCurrentSong } from './state.js';
import * as UI from './ui.js'; // To update UI after loading

const HISTORY_KEY = 'karaoke_history';
const PLAYLISTS_KEY = 'karaoke_playlists';
const CURRENT_SONG_KEY = 'karaoke_current_song_v2'; // Use versioning if structure changes
const CURRENT_PLAYLIST_KEY = 'karaoke_current_playlist_v2'; // Updated key version for new property

// --- Saving ---

export function saveCurrentSongState() {
    // Don't save default/empty song state over potentially useful loaded state
    if (!state.currentSong.title && !state.currentSong.artist && state.currentSong.lyrics.length === 0) {
        // console.log("Skipping save of empty current song state.");
        return;
    }
    try {
        // Store only serializable data for the current song
        const serializableSong = {
            id: state.currentSong.id,
            title: state.currentSong.title,
            artist: state.currentSong.artist,
            lyrics: state.currentSong.lyrics,
            timing: state.currentSong.timing,
            // Do not save image data URL or audio Object URL to localStorage
            theme: state.currentSong.theme,
            font: state.currentSong.font
            // Exclude extractedPalette, as it's derived UI state
        };
        localStorage.setItem(CURRENT_SONG_KEY, JSON.stringify(serializableSong));
    } catch (e) {
        console.error("Error saving current song state:", e);
        alert("Could not save current song progress. LocalStorage might be full.");
    }
}

export function saveHistory() {
    try {
        // Filter history to save only serializable data, similar to current song
         const serializableHistory = state.history.map(song => ({
            id: song.id,
            title: song.title,
            artist: song.artist,
            lyrics: song.lyrics,
            timing: song.timing,
            theme: song.theme,
            font: song.font
            // Exclude image/audio data and extractedPalette
        }));
        localStorage.setItem(HISTORY_KEY, JSON.stringify(serializableHistory));
    } catch (e) {
        console.error("Error saving history:", e);
    }
}

export function savePlaylists() {
    try {
        localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(state.playlists));
    } catch (e) {
        console.error("Error saving playlists:", e);
    }
}

export function saveCurrentPlaylistInfo() {
     if (state.currentPlaylistId) {
        localStorage.setItem(CURRENT_PLAYLIST_KEY, JSON.stringify({
            id: state.currentPlaylistId,
            index: state.currentPlaylistIndex,
            autoAdvance: state.autoAdvanceEnabled // Save auto-advance state
        }));
    } else {
        localStorage.removeItem(CURRENT_PLAYLIST_KEY); // Clear if no playlist is active
    }
}

// --- Loading ---

export function loadFromLocalStorage() {
    loadHistory();
    loadPlaylists();
    loadCurrentSong();
    loadCurrentPlaylistInfo();
}

function loadHistory() {
    const historyData = localStorage.getItem(HISTORY_KEY);
    if (historyData) {
        try {
            state.history = JSON.parse(historyData);
            // Ensure songs have IDs, assign if missing (for backward compatibility)
            state.history.forEach(song => {
                if (!song.id) song.id = `${song.title}_${song.artist}_${Math.random().toString(16).slice(2)}`;
            });
        } catch (e) {
            console.error("Error parsing history from localStorage:", e);
            state.history = [];
        }
    }
}

function loadPlaylists() {
    const playlistsData = localStorage.getItem(PLAYLISTS_KEY);
    if (playlistsData) {
        try {
            state.playlists = JSON.parse(playlistsData);
            // Basic validation/migration could go here if needed
        } catch (e) {
            console.error("Error parsing playlists from localStorage:", e);
            state.playlists = [];
        }
    }
}

function loadCurrentSong() {
    const currentSongData = localStorage.getItem(CURRENT_SONG_KEY);
    if (currentSongData) {
        try {
            const loadedSong = JSON.parse(currentSongData);
            // Merge loaded data with defaults to ensure all properties exist
             state.currentSong = {
                ...state.currentSong, // Start with defaults (including empty extractedPalette)
                ...loadedSong, // Overwrite with loaded data
                image: null, // Reset non-serializable fields
                audioUrl: null, // Reset non-serializable fields
                extractedPalette: [] // Explicitly ensure palette is reset on load
            };
             // Ensure the loaded song has an ID
            if (!state.currentSong.id) {
                state.currentSong.id = Date.now().toString();
            }

        } catch (e) {
            console.error("Error parsing current song from localStorage:", e);
            resetCurrentSong(); // Reset to default if loading fails
        }
    } else {
        // If no saved song, ensure the default one has an ID
        if (!state.currentSong.id) {
            state.currentSong.id = Date.now().toString();
        }
        // Ensure palette is empty for a new/default song
        state.currentSong.extractedPalette = [];
    }
}

function loadCurrentPlaylistInfo() {
    const currentPlaylistData = localStorage.getItem(CURRENT_PLAYLIST_KEY);
    if (currentPlaylistData) {
        try {
            const { id, index, autoAdvance } = JSON.parse(currentPlaylistData);
            // Verify the playlist ID still exists in the loaded playlists
            if (state.playlists.some(p => p.id === id)) {
                state.currentPlaylistId = id;
                state.currentPlaylistIndex = index;
                state.autoAdvanceEnabled = typeof autoAdvance === 'boolean' ? autoAdvance : true; // Load auto-advance, default to true
            } else {
                 state.currentPlaylistId = null;
                 state.currentPlaylistIndex = -1;
                 state.autoAdvanceEnabled = true; // Default if playlist no longer exists
            }
        } catch (e) {
            console.error("Error parsing current playlist info:", e);
            state.currentPlaylistId = null;
            state.currentPlaylistIndex = -1;
            state.autoAdvanceEnabled = true; // Default on error
        }
    } else {
        // If no saved playlist info, ensure autoAdvance is default
        state.autoAdvanceEnabled = true;
    }
}

// --- Project Saving (Adding/Updating History) ---

export function saveProject() {
    const currentSong = state.currentSong;
    if (!currentSong.title && !currentSong.artist) {
        alert('Please set a song title or artist before saving.');
        return false; // Indicate failure
    }
    if (!currentSong.id) {
        currentSong.id = Date.now().toString(); // Ensure ID exists
    }

    const existingIndex = state.history.findIndex(item => item.id === currentSong.id);

     // Create a clean copy for history (without image/audio data)
    const songForHistory = {
        id: currentSong.id,
        title: currentSong.title,
        artist: currentSong.artist,
        lyrics: [...currentSong.lyrics],
        timing: [...currentSong.timing],
        theme: { ...currentSong.theme },
        font: currentSong.font
    };


    if (existingIndex >= 0) {
        state.history[existingIndex] = songForHistory;
    } else {
        state.history.push(songForHistory);
    }

    // Save history and the current (potentially modified) song state
    saveHistory();
    saveCurrentSongState(); // Save current state separately

    // Update history panel in UI
    UI.updateHistoryPanel();

    alert('Project saved successfully!');
    return true; // Indicate success
}

// --- Session Storage for volatile data (Optional - currently unused) ---
// Session storage could be used for temporary storage of image/audio URLs
// but Object URLs don't persist across sessions reliably anyway.
// Keeping Blob data in memory (state.currentSong.image, state.audio) is simpler for now.

// export function saveSessionData() {
//     if (state.currentSong.image) {
//         sessionStorage.setItem(`image_${state.currentSong.id}`, state.currentSong.image);
//     }
//     if (state.audio && state.audio.src.startsWith('blob:')) {
//          sessionStorage.setItem(`audio_${state.currentSong.id}`, state.audio.src);
//     }
// }

// export function loadSessionData(songId) {
//     const imageData = sessionStorage.getItem(`image_${songId}`);
//     const audioData = sessionStorage.getItem(`audio_${songId}`);
//     return { imageData, audioData };
// }