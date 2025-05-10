// Playlist management functions
import { state, resetCurrentSong, getCurrentPlaylist, getHistory } from './state.js';
import { elements } from './dom.js';
import * as UI from './ui/index.js';
import * as Storage from './storage.js';
import * as Modal from '../modal.js';

// Module-level variable to store song IDs for the playlist being edited in the modal
let tempEditingSongs = [];

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
    populateAvailableSongsList(elements.availableSongsList, []); // Pass empty array for songs to exclude
    elements.playlistNameInput.value = '';
    Modal.openModal(elements.createPlaylistModal);
}

/**
 * Populates a checklist in a modal with songs from history.
 * @param {HTMLElement} listContainer - The DOM element to populate.
 * @param {string[]} excludeSongIds - An array of song IDs to exclude from the list.
 */
function populateAvailableSongsList(listContainer, excludeSongIds = []) {
    listContainer.innerHTML = '';
    const history = getHistory();

    if (history.length === 0) {
        listContainer.innerHTML = '<p class="empty-message">No songs in history.</p>';
        return;
    }

    const songsToAdd = history.filter(song => !excludeSongIds.includes(song.id));

    if (songsToAdd.length === 0 && history.length > 0) {
        listContainer.innerHTML = '<p class="empty-message">All history songs are already in this playlist or no other songs in history.</p>';
        return;
    }
     if (songsToAdd.length === 0 && history.length === 0) { // Should be caught by above
        listContainer.innerHTML = '<p class="empty-message">No songs in history.</p>';
        return;
    }


    songsToAdd.forEach(song => {
        const item = document.createElement('div');
        item.className = 'checklist-item';
        item.innerHTML = `
            <input type="checkbox" id="song-check-${song.id}" value="${song.id}" data-song-id="${song.id}">
            <label for="song-check-${song.id}">${song.title || 'Untitled Song'} - ${song.artist || 'Unknown Artist'}</label>
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

// --- Playlist Editing ---

/**
 * Opens the "Edit Playlist" modal and populates it with the selected playlist's data.
 * @param {string} playlistId - The ID of the playlist to edit.
 */
export function openEditPlaylistModal(playlistId) {
    const playlist = state.playlists.find(p => p.id === playlistId);
    if (!playlist) {
        console.error("Playlist not found for editing:", playlistId);
        return;
    }

    state.editingPlaylistId = playlistId;
    tempEditingSongs = [...playlist.songs]; // Initialize temp list

    elements.editPlaylistNameInput.value = playlist.name;

    _renderSongsInEditingPlaylist();
    _renderAvailableSongsForEditingPlaylist();
    _updateAddCurrentSongButtonState();

    Modal.openModal(elements.editPlaylistModal);
}

/**
 * Renders the list of songs currently in the playlist being edited.
 * Each song has a "Remove" button.
 */
function _renderSongsInEditingPlaylist() {
    const listContainer = elements.songsInPlaylistList;
    listContainer.innerHTML = '';
    const history = getHistory();

    if (tempEditingSongs.length === 0) {
        listContainer.innerHTML = '<p class="empty-message">This playlist is empty. Add songs from history below.</p>';
        return;
    }

    tempEditingSongs.forEach(songId => {
        const song = history.find(s => s.id === songId);
        const songDisplay = song ? `${song.title || 'Untitled Song'} - ${song.artist || 'Unknown Artist'}` : 'Missing Song Data';
        
        const item = document.createElement('div');
        item.className = 'editable-song-item';
        item.innerHTML = `
            <span>${songDisplay}</span>
            <button class="action-btn remove-song-from-playlist" data-song-id="${songId}" title="Remove from playlist">
                <i class="fas fa-times-circle"></i>
            </button>
        `;
        item.querySelector('.remove-song-from-playlist').addEventListener('click', () => {
            _handleRemoveSongFromTempList(songId);
        });
        listContainer.appendChild(item);
    });
}

/**
 * Handles removing a song from the temporary list for the playlist being edited.
 * @param {string} songId - The ID of the song to remove.
 */
function _handleRemoveSongFromTempList(songId) {
    tempEditingSongs = tempEditingSongs.filter(id => id !== songId);
    _renderSongsInEditingPlaylist();
    _renderAvailableSongsForEditingPlaylist(); // Available songs might change
    _updateAddCurrentSongButtonState();
}

/**
 * Renders the checklist of available songs from history that can be added to the playlist.
 */
function _renderAvailableSongsForEditingPlaylist() {
    populateAvailableSongsList(elements.editPlaylistAvailableSongsList, tempEditingSongs);
}

/**
 * Updates the state (enabled/disabled, text) of the "Add Currently Loaded Song" button.
 */
function _updateAddCurrentSongButtonState() {
    const btn = elements.addCurrentSongToPlaylistBtn;
    const currentSongId = state.currentSong.id;

    if (!currentSongId || !state.currentSong.title) { // Require a saved song (ID and title)
        btn.disabled = true;
        btn.title = "Save the current song (give it a title/artist) to add it to playlists.";
        return;
    }

    const songInHistory = getHistory().find(s => s.id === currentSongId);
    if (!songInHistory) {
         btn.disabled = true;
         btn.title = "Current song is not saved in history. Save it first.";
         return;
    }

    if (tempEditingSongs.includes(currentSongId)) {
        btn.disabled = true;
        btn.title = "Currently loaded song is already in this playlist.";
    } else {
        btn.disabled = false;
        btn.title = "Add the currently loaded song to this playlist.";
    }
}

/**
 * Adds the currently loaded song to the temporary list for the playlist being edited.
 */
export function handleAddCurrentlyLoadedSongToPlaylist() {
    const currentSongId = state.currentSong.id;

    if (!currentSongId || tempEditingSongs.includes(currentSongId)) {
        _updateAddCurrentSongButtonState(); // Should already be disabled, but good to refresh
        return;
    }

    // Ensure the current song is actually saved in history.
    // If it has an ID, we assume it's either already in history or a recent save attempt was made.
    // A more robust check might involve trying to save it silently.
    const songInHistory = getHistory().find(s => s.id === currentSongId);
    if (!songInHistory) {
        const saveSuccess = Storage.saveProject(true); // Attempt silent save
        if (!saveSuccess) {
            alert("Could not save the current song to history. Please ensure it has a title/artist.");
            _updateAddCurrentSongButtonState();
            return;
        }
        // If save was successful, it should now be in history, refresh history reference.
        // This implicit update of history might be problematic if saveProject doesn't immediately update getHistory()'s source.
        // For now, assume saveProject updates state.history correctly.
    }
    
    tempEditingSongs.push(currentSongId);
    _renderSongsInEditingPlaylist();
    _renderAvailableSongsForEditingPlaylist();
    _updateAddCurrentSongButtonState(); // Disable the button
}

/**
 * Saves the changes made to the playlist in the edit modal.
 */
export function handleSavePlaylistChanges() {
    if (!state.editingPlaylistId) return;

    const playlistIndex = state.playlists.findIndex(p => p.id === state.editingPlaylistId);
    if (playlistIndex === -1) {
        console.error("Could not find playlist to save changes:", state.editingPlaylistId);
        Modal.closeModal(elements.editPlaylistModal);
        return;
    }

    const newName = elements.editPlaylistNameInput.value.trim();
    if (!newName) {
        alert("Playlist name cannot be empty.");
        return;
    }

    // Combine songs kept (from tempEditingSongs) and newly checked songs
    const finalSongIds = [...tempEditingSongs];
    const selectedSongCheckboxes = elements.editPlaylistAvailableSongsList.querySelectorAll('input[type="checkbox"]:checked');
    selectedSongCheckboxes.forEach(checkbox => {
        const songId = checkbox.value;
        if (!finalSongIds.includes(songId)) {
            finalSongIds.push(songId);
        }
    });

    state.playlists[playlistIndex].name = newName;
    state.playlists[playlistIndex].songs = finalSongIds;

    Storage.savePlaylists();
    UI.updatePlaylistsPanel();
    if (state.currentPlaylistId === state.editingPlaylistId) {
        UI.updateCurrentPlaylistPanel(); // Refresh current playlist if it was the one edited
    }
    
    Modal.closeModal(elements.editPlaylistModal);
    state.editingPlaylistId = null;
    tempEditingSongs = [];
}