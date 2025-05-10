// Playlist management functions
import { state, resetCurrentSong, getCurrentPlaylist } from './state.js'; 
import { elements } from './dom.js'; 
import * as UI from './ui/index.js';
import * as Storage from './storage.js';
import * as Modal from './modal.js'; 

export function loadSongFromHistory(index) {
    if (index < 0 || index >= state.history.length) return;
    
    // Load the song data from history
    const historySong = state.history[index];
    
    // Update current song with history data
    state.currentSong = {
        ...state.currentSong, 
        id: historySong.id,
        title: historySong.title,
        artist: historySong.artist,
        lyrics: [...historySong.lyrics],
        timing: [...historySong.timing],
        theme: { ...historySong.theme },
        font: historySong.font,
        audioUrl: state.currentSong.id === historySong.id ? state.currentSong.audioUrl : null,
        image: state.currentSong.id === historySong.id ? state.currentSong.image : null,
        audioFilename: state.currentSong.id === historySong.id ? state.currentSong.audioFilename : null,
    };
    
    // Reset playback state
    if (state.audio) {
        state.audio.pause();
        state.isPlaying = false;
        if (state.currentSong.audioUrl) {
            if (state.currentSong.id !== historySong.id) {
                URL.revokeObjectURL(state.currentSong.audioUrl); 
                state.currentSong.audioUrl = null;
                state.currentSong.audioFilename = null;
            }
        }
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
    
    const playlist = getCurrentPlaylist(); 
    if (!playlist || playlist.songs.length === 0) return;
    
    // Calculate next index, wrapping around if needed
    const nextIndex = (state.currentPlaylistIndex + 1) % playlist.songs.length;
    
    loadSongFromPlaylist(nextIndex);
}

export function playPreviousSong() {
    if (!state.currentPlaylistId) return;
    
    const playlist = getCurrentPlaylist(); 
    if (!playlist || playlist.songs.length === 0) return;
    
    // Calculate previous index, wrapping around if needed
    const prevIndex = (state.currentPlaylistIndex - 1 + playlist.songs.length) % playlist.songs.length;
    
    loadSongFromPlaylist(prevIndex);
}

export function loadSongFromPlaylist(index) {
    if (!state.currentPlaylistId) return;
    
    const playlist = getCurrentPlaylist(); 
    if (!playlist || index < 0 || index >= playlist.songs.length) return;
    
    // Update current index
    state.currentPlaylistIndex = index;
    
    // Get the song ID
    const songId = playlist.songs[index];
    
    // Find the song in history
    const historySong = state.history.find(s => s.id === songId);
    if (!historySong) {
        console.error("Song not found in history:", songId);
        UI.updateCurrentPlaylistPanel(); 
        return;
    }
    
    // Load the song using the same method as loading from history
    loadSongFromHistory(state.history.indexOf(historySong));
    
    // Save current playlist info
    Storage.saveCurrentPlaylistInfo();
}

// --- Playlist Creation ---

/**
 * Opens the "Create Playlist" modal and populates the available songs list.
 */
export function openCreatePlaylistModal() {
    populateAvailableSongsList();
    elements.playlistNameInput.value = ''; 
    Modal.openModal(elements.createPlaylistModal);
}

/**
 * Populates the checklist in the "Create Playlist" modal with songs from history.
 */
function populateAvailableSongsList() {
    const listContainer = elements.availableSongsList;
    listContainer.innerHTML = ''; 

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
        id: `playlist_${Date.now()}_${Math.random().toString(16).slice(2)}`, 
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
                           state.currentSong.audioFilename; 

    if (songIsNotEmpty) {
        const savedSuccessfully = Storage.saveProject();
        
        if (savedSuccessfully) {
            resetCurrentSong();
            UI.updateUI(); 
        } else {
            console.log("Current song not saved or save was cancelled. New song creation aborted.");
        }
    } else {
        resetCurrentSong();
        UI.updateUI(); 
    }
}

/**
 * Toggles the auto-advance feature for playlists.
 */
export function toggleAutoAdvance() {
    state.autoAdvanceEnabled = !state.autoAdvanceEnabled;
    UI.updateAutoAdvanceButton(); 
    Storage.saveCurrentPlaylistInfo(); 
}