// Playlist management functions
import { state, resetCurrentSong } from './state.js';
import { elements } from './dom.js'; // Need DOM elements
import * as UI from './ui.js';
import * as Storage from './storage.js';
import * as Modal from './modal.js'; // Need Modal functions

export function loadSongFromHistory(index) {
    if (index < 0 || index >= state.history.length) return;
    
    // Load the song data from history
    const historySong = state.history[index];
    
    // Update current song with history data
    state.currentSong = {
        ...state.currentSong, // Keep current non-serializable data like image/audioUrl
        id: historySong.id,
        title: historySong.title,
        artist: historySong.artist,
        lyrics: [...historySong.lyrics],
        timing: [...historySong.timing],
        theme: { ...historySong.theme },
        font: historySong.font
    };
    
    // Reset playback state
    if (state.audio) {
        state.audio.pause();
        state.isPlaying = false;
    }
    state.currentTime = 0;
    state.currentLineIndex = -1;
    
    // Update UI
    UI.updateUI();
    
    // Save current state
    Storage.saveCurrentSongState();
}

export function playNextSong() {
    if (!state.currentPlaylistId) return;
    
    const playlist = state.playlists.find(p => p.id === state.currentPlaylistId);
    if (!playlist || playlist.songs.length === 0) return;
    
    // Calculate next index, wrapping around if needed
    const nextIndex = (state.currentPlaylistIndex + 1) % playlist.songs.length;
    
    loadSongFromPlaylist(nextIndex);
}

export function playPreviousSong() {
    if (!state.currentPlaylistId) return;
    
    const playlist = state.playlists.find(p => p.id === state.currentPlaylistId);
    if (!playlist || playlist.songs.length === 0) return;
    
    // Calculate previous index, wrapping around if needed
    const prevIndex = (state.currentPlaylistIndex - 1 + playlist.songs.length) % playlist.songs.length;
    
    loadSongFromPlaylist(prevIndex);
}

export function loadSongFromPlaylist(index) {
    if (!state.currentPlaylistId) return;
    
    const playlist = state.playlists.find(p => p.id === state.currentPlaylistId);
    if (!playlist || index < 0 || index >= playlist.songs.length) return;
    
    // Update current index
    state.currentPlaylistIndex = index;
    
    // Get the song ID
    const songId = playlist.songs[index];
    
    // Find the song in history
    const historySong = state.history.find(s => s.id === songId);
    if (!historySong) {
        console.error("Song not found in history:", songId);
        return;
    }
    
    // Load the song using the same method as loading from history
    loadSongFromHistory(state.history.indexOf(historySong));
    
    // Update playlist UI to show current song
    UI.updateCurrentPlaylistPanel();
    
    // Save current playlist info
    Storage.saveCurrentPlaylistInfo();
}

// --- Playlist Creation ---

/**
 * Opens the "Create Playlist" modal and populates the available songs list.
 */
export function openCreatePlaylistModal() {
    populateAvailableSongsList();
    elements.playlistNameInput.value = ''; // Clear previous name
    Modal.openModal(elements.createPlaylistModal);
}

/**
 * Populates the checklist in the "Create Playlist" modal with songs from history.
 */
function populateAvailableSongsList() {
    const listContainer = elements.availableSongsList;
    listContainer.innerHTML = ''; // Clear previous items

    if (state.history.length === 0) {
        listContainer.innerHTML = '<p class="empty-message">No songs in history to add.</p>';
        return;
    }

    state.history.forEach(song => {
        const item = document.createElement('div');
        item.className = 'checklist-item';
        item.innerHTML = `
            <input type="checkbox" id="song-${song.id}" value="${song.id}">
            <label for="song-${song.id}">${song.title || 'Untitled Song'} - ${song.artist || 'Unknown Artist'}</label>
        `;
        listContainer.appendChild(item);
    });
}

/**
 * Saves a new playlist based on the data entered in the modal.
 */
export function saveNewPlaylist() {
    const playlistName = elements.playlistNameInput.value.trim();
    if (!playlistName) {
        alert('Please enter a name for the playlist.');
        return;
    }

    const selectedSongCheckboxes = elements.availableSongsList.querySelectorAll('input[type="checkbox"]:checked');
    const selectedSongIds = Array.from(selectedSongCheckboxes).map(checkbox => checkbox.value);

    // Create new playlist object
    const newPlaylist = {
        id: `playlist_${Date.now()}_${Math.random().toString(16).slice(2)}`, // Simple unique ID
        name: playlistName,
        songs: selectedSongIds
    };

    // Add to state
    state.playlists.push(newPlaylist);

    // Save playlists to storage
    Storage.savePlaylists();

    // Update the UI panel
    UI.updatePlaylistsPanel();

    // Close the modal
    Modal.closeModal(elements.createPlaylistModal);

    // Optional: Select the newly created playlist automatically?
    // state.currentPlaylistId = newPlaylist.id;
    // state.currentPlaylistIndex = 0;
    // Storage.saveCurrentPlaylistInfo();
    // UI.updateCurrentPlaylistPanel();
    // if (newPlaylist.songs.length > 0) loadSongFromPlaylist(0);
}

/**
 * Handles the creation of a new song project.
 * If the current song has content, it attempts to save it first.
 * Then, resets the application to a new, blank song state.
 */
export function createNewSong() {
    const songIsNotEmpty = state.currentSong.title || 
                           state.currentSong.artist || 
                           (state.currentSong.lyrics && state.currentSong.lyrics.length > 0) ||
                           state.currentSong.audioFilename; // Consider audio as content too

    if (songIsNotEmpty) {
        // Attempt to save the current song.
        // Storage.saveProject() will alert if title/artist are missing and are required for saving.
        // If saveProject determines the song can be saved (or user provides missing info), it returns true.
        const savedSuccessfully = Storage.saveProject();
        
        if (savedSuccessfully) {
            // If saved successfully, then reset to a new song state.
            resetCurrentSong();
            UI.updateUI(); // Update all UI elements to reflect the new state
        } else {
            // Save was not successful (e.g., validation failed within saveProject, or user cancelled when prompted for info).
            // In this case, do not proceed to reset. The user needs to resolve the save issue or explicitly clear.
            console.log("Current song not saved or save was cancelled. New song creation aborted.");
            // Optionally, you could offer a "Discard changes and create new song?" confirmation here
            // but for now, it's a strict save-first (if content exists) policy.
        }
    } else {
        // Current song is already effectively empty or considered new, so just reset.
        resetCurrentSong();
        UI.updateUI(); // Update all UI elements
    }
}

/**
 * Toggles the auto-advance feature for playlists.
 */
export function toggleAutoAdvance() {
    state.autoAdvanceEnabled = !state.autoAdvanceEnabled;
    UI.updateAutoAdvanceButton(); // Update button's visual state
    Storage.saveCurrentPlaylistInfo(); // Save the new setting
}