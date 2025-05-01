// UI Update functions
import { state, getCurrentSong, getHistory, getCurrentPlaylist, getPlaylists } from './state.js';
import { elements } from './dom.js';
import * as Theme from './theme.js';
import * as Lyrics from './lyrics.js';
import * as Audio from './audio.js';
import * as Storage from './storage.js';
import * as Playlist from './playlist.js'; // Needed for loading songs from panels
import * as Modal from './modal.js'; // Needed for editing playlists

// Export functions that might be called directly from other modules
export { updateHistoryPanel, updatePlaylistsPanel, updateCurrentPlaylistPanel, updateUI, updateProgressUI, updatePlayerControls };

function updateUI() {
    updateSongInfo();
    updateSongImage();
    Lyrics.renderLyrics(); // Render lyrics based on current state
    Theme.updateThemeUI(); // Update theme display and apply styles
    updateHistoryPanel();
    updatePlaylistsPanel();
    updateCurrentPlaylistPanel();
    updatePlayerControls(); // Reflect play/pause state, volume etc.
    updateProgressUI(); // Add this line to ensure progress bar is updated initially
    Audio.updateTimeDisplay(); // Update time display
}

function updateSongInfo() {
    // Update song info
    elements.songTitle.value = state.currentSong.title || '';
    elements.songArtist.value = state.currentSong.artist || '';
}

function updateSongImage() {
    if (state.currentSong.image) {
        elements.songImage.src = state.currentSong.image;
    } else {
        elements.songImage.src = 'default-song-image.png';
    }
}

function updateHistoryPanel() {
    if (!state.history.length) {
        elements.historyPanel.innerHTML = '<p class="empty-message">No saved songs yet</p>';
        return;
    }

    elements.historyPanel.innerHTML = '';

    state.history.forEach((song, index) => {
        const item = document.createElement('div');
        item.className = 'history-item panel-item'; // Added common class

        // Check if this is the current song by ID
        if (state.currentSong.id === song.id) {
            item.classList.add('active');
        }

        item.innerHTML = `
            <div class="item-info">
                <div class="item-title">${song.title || 'Untitled Song'}</div>
                <div class="item-subtitle">${song.artist || 'Unknown Artist'}</div>
            </div>
            <div class="item-actions">
                <button class="action-btn delete-song" data-index="${index}" title="Delete Song">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        // Add click handler to load the song
        item.addEventListener('click', (e) => {
            // Don't trigger if clicking the delete button
            if (e.target.closest('.delete-song')) return;

            Playlist.loadSongFromHistory(index);
        });

        elements.historyPanel.appendChild(item);
    });

    // Add delete handlers
    elements.historyPanel.querySelectorAll('.delete-song').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            if (confirm('Are you sure you want to delete this song from history?')) {
                // Remove song from history
                const removedSongId = state.history[index].id;
                state.history.splice(index, 1);
                Storage.saveHistory();

                // Also remove the song from any playlists
                state.playlists.forEach(playlist => {
                    playlist.songs = playlist.songs.filter(id => id !== removedSongId);
                });
                Storage.savePlaylists();

                // If the deleted song was the current song, reset current song
                 if (state.currentSong.id === removedSongId) {
                    // Ideally, load next song or reset to default state
                    // For simplicity now, just reset
                    // Storage.resetCurrentSong(); // Need to import resetCurrentSong
                    console.warn("Deleted the currently loaded song. State might be inconsistent until a new song is loaded.");
                    // TODO: Implement a clearer reset or load-next logic here
                }

                // If the deleted song was in the current playlist, update playlist state
                 if (state.currentPlaylistId) {
                    const currentPlaylist = getCurrentPlaylist();
                    if (currentPlaylist && currentPlaylist.songs.includes(removedSongId)) {
                         // Re-render playlist panel which depends on history
                         updateCurrentPlaylistPanel();
                    }
                }

                updateHistoryPanel();
                updatePlaylistsPanel(); // Update playlist counts
            }
        });
    });
}


function updatePlaylistsPanel() {
    const playlists = getPlaylists(); // Use getter
    if (!playlists.length) {
        elements.playlistsPanel.innerHTML = '<p class="empty-message">No playlists yet</p>';
        return;
    }

    elements.playlistsPanel.innerHTML = '';

    playlists.forEach((playlist, index) => {
        const item = document.createElement('div');
        item.className = 'playlist-item panel-item'; // Added common class

        // Check if this is the current playlist
        if (state.currentPlaylistId === playlist.id) {
            item.classList.add('active');
        }

        const songCount = playlist.songs ? playlist.songs.length : 0;

        item.innerHTML = `
            <div class="item-info">
                <div class="item-title">${playlist.name}</div>
                <div class="item-subtitle">${songCount} song${songCount !== 1 ? 's' : ''}</div>
            </div>
            <div class="item-actions">
                <button class="action-btn edit-playlist" data-index="${index}" title="Edit Playlist">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-playlist" data-index="${index}" title="Delete Playlist">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        // Add click handler to load the playlist
        item.addEventListener('click', (e) => {
            // Don't trigger if clicking the action buttons
            if (e.target.closest('.item-actions')) return;

            state.currentPlaylistId = playlist.id; // Set the ID
            state.currentPlaylistIndex = 0; // Start at the first song
            Storage.saveCurrentPlaylistInfo(); // Save active playlist info

            updatePlaylistsPanel(); // Highlight the newly selected playlist
            updateCurrentPlaylistPanel(); // Update the current playlist panel

            // Load the first song if available
            if (playlist.songs && playlist.songs.length > 0) {
                Playlist.loadSongFromPlaylist(0);
            } else {
                 // If playlist is empty, maybe clear the main view or show a message
                 console.log("Selected playlist is empty.");
            }
        });

        elements.playlistsPanel.appendChild(item);
    });

    // Add action handlers
    elements.playlistsPanel.querySelectorAll('.edit-playlist').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            // Modal.editPlaylist(index); // Modal function needs implementation
            console.log("Edit playlist button clicked for index:", index);
            alert("Playlist editing not yet implemented.");
        });
    });

    elements.playlistsPanel.querySelectorAll('.delete-playlist').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            const playlistToDelete = state.playlists[index]; // Get ref before splicing

            if (confirm(`Are you sure you want to delete the playlist "${playlistToDelete.name}"?`)) {
                 // If this was the current playlist, clear current playlist state
                if (state.currentPlaylistId === playlistToDelete.id) {
                    state.currentPlaylistId = null;
                    state.currentPlaylistIndex = -1;
                    Storage.saveCurrentPlaylistInfo(); // Save the cleared state
                    updateCurrentPlaylistPanel(); // Clear the panel
                }

                state.playlists.splice(index, 1); // Remove from state
                Storage.savePlaylists(); // Save updated playlists
                updatePlaylistsPanel(); // Re-render the playlists panel
            }
        });
    });
}


function updateCurrentPlaylistPanel() {
    const currentPlaylist = getCurrentPlaylist(); // Use getter function
    if (!currentPlaylist || !currentPlaylist.songs || currentPlaylist.songs.length === 0) {
        elements.currentPlaylistPanel.innerHTML = `
            <h4>Current Playlist</h4>
            <p class="empty-message">${currentPlaylist ? 'Playlist is empty' : 'No active playlist'}</p>`;
        // Disable prev/next buttons if no playlist or empty
        elements.prevSongBtn.disabled = true;
        elements.nextSongBtn.disabled = true;
        return;
    }

    elements.currentPlaylistPanel.innerHTML = `
        <h4>${currentPlaylist.name}</h4>
        <div class="playlist-songs panel"></div>
    `; // Added 'panel' class for styling

    const songsContainer = elements.currentPlaylistPanel.querySelector('.playlist-songs');
    const history = getHistory(); // Use getter function

    currentPlaylist.songs.forEach((songId, index) => {
        // Find the song in history using its ID
        const song = history.find(item => item.id === songId);

        const item = document.createElement('div');
        item.className = 'playlist-item panel-item'; // Added common class

        if (!song) {
            console.warn('Song ID not found in history:', songId);
            item.classList.add('missing-song');
            item.innerHTML = `
                 <div class="item-info">
                     <div class="item-title">Missing Song</div>
                     <div class="item-subtitle">(ID: ${songId.substring(0, 8)}...)</div>
                 </div>
                 <div class="item-actions">
                     <i class="fas fa-exclamation-triangle" title="Song data missing from history"></i>
                 </div>`;
        } else {
             // Check if this is the current song
            if (index === state.currentPlaylistIndex) {
                item.classList.add('active');
            }

            // Determine if the song has complete data (e.g., timing exists)
             const hasTiming = song.timing && song.timing.length > 0 && song.timing.some(time => time !== null && time !== undefined);
             const statusClass = hasTiming ? 'status-complete' : 'status-incomplete';
             const statusText = hasTiming ? 'Timed' : 'Untimed';

            item.innerHTML = `
                <div class="item-info">
                    <div class="item-title">${song.title || 'Untitled Song'}</div>
                    <div class="item-subtitle">${song.artist || 'Unknown Artist'}
                        <span class="item-status ${statusClass}" title="${statusText}">${statusText}</span>
                    </div>
                </div>
            `;

            // Add click handler to load the song
            item.addEventListener('click', () => {
                Playlist.loadSongFromPlaylist(index);
            });
        }

        songsContainer.appendChild(item);
    });

    // Enable prev/next buttons if playlist has songs
    elements.prevSongBtn.disabled = currentPlaylist.songs.length <= 1;
    elements.nextSongBtn.disabled = currentPlaylist.songs.length <= 1;
}


function updatePlayerControls() {
    // Update audio controls based on current state
    if (state.isPlaying) {
        elements.playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        elements.playBtn.title = "Pause (Space)";
    } else {
        elements.playBtn.innerHTML = '<i class="fas fa-play"></i>';
         elements.playBtn.title = "Play (Space)";
    }

    // Volume - Check if state.audio exists before accessing volume
    if (state.audio) {
        elements.volumeSlider.value = state.audio.volume;
    } else {
        // If no audio object, set slider to default (e.g., 1 or stored preference)
        elements.volumeSlider.value = 1; // Default to max volume visually
    }
     // Disable play button if no audio is loaded
    elements.playBtn.disabled = !state.audio;
}


function updateProgressUI() {
    if (state.audio && state.duration > 0 && state.currentTime >= 0) {
        const percentage = (state.currentTime / state.duration) * 100;
        elements.progress.style.width = `${percentage}%`;
    } else {
        elements.progress.style.width = '0%'; // Reset if no duration or time
    }
}