// ui-panels.js - UI Updates for history, playlists, and current playlist panels
import { state, getHistory, getPlaylists, getCurrentPlaylist } from './state.js';
import { elements } from './dom.js';
import * as Storage from './storage.js';
import * as Playlist from './playlist.js';
import * as Modal from './modal.js'; // Though not directly used, Modal.editPlaylist was commented out. Keeping if needed.

export function updateHistoryPanel() {
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
                    console.warn("Deleted the currently loaded song. State might be inconsistent until a new song is loaded.");
                }

                // If the deleted song was in the current playlist, update playlist state
                 if (state.currentPlaylistId) {
                    const currentPlaylist = getCurrentPlaylist();
                    if (currentPlaylist && currentPlaylist.songs.includes(removedSongId)) {
                         updateCurrentPlaylistPanel();
                    }
                }

                updateHistoryPanel();
                updatePlaylistsPanel(); // Update playlist counts
            }
        });
    });
}

export function updatePlaylistsPanel() {
    const playlists = getPlaylists();
    if (!playlists.length) {
        elements.playlistsPanel.innerHTML = '<p class="empty-message">No playlists yet</p>';
        return;
    }

    elements.playlistsPanel.innerHTML = '';

    playlists.forEach((playlist, index) => {
        const item = document.createElement('div');
        item.className = 'playlist-item panel-item';

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

        item.addEventListener('click', (e) => {
            if (e.target.closest('.item-actions')) return;

            state.currentPlaylistId = playlist.id;
            state.currentPlaylistIndex = 0;
            Storage.saveCurrentPlaylistInfo();

            updatePlaylistsPanel();
            updateCurrentPlaylistPanel();

            if (playlist.songs && playlist.songs.length > 0) {
                Playlist.loadSongFromPlaylist(0);
            } else {
                 console.log("Selected playlist is empty.");
            }
        });

        elements.playlistsPanel.appendChild(item);
    });

    elements.playlistsPanel.querySelectorAll('.edit-playlist').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            console.log("Edit playlist button clicked for index:", index);
            alert("Playlist editing not yet implemented.");
        });
    });

    elements.playlistsPanel.querySelectorAll('.delete-playlist').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            const playlistToDelete = state.playlists[index];

            if (confirm(`Are you sure you want to delete the playlist "${playlistToDelete.name}"?`)) {
                if (state.currentPlaylistId === playlistToDelete.id) {
                    state.currentPlaylistId = null;
                    state.currentPlaylistIndex = -1;
                    Storage.saveCurrentPlaylistInfo();
                    updateCurrentPlaylistPanel();
                }

                state.playlists.splice(index, 1);
                Storage.savePlaylists();
                updatePlaylistsPanel();
            }
        });
    });
}

export function updateCurrentPlaylistPanel() {
    const currentPlaylist = getCurrentPlaylist();
    if (!currentPlaylist || !currentPlaylist.songs || currentPlaylist.songs.length === 0) {
        elements.currentPlaylistPanel.innerHTML = `
            <h4>Current Playlist</h4>
            <p class="empty-message">${currentPlaylist ? 'Playlist is empty' : 'No active playlist'}</p>`;
        elements.prevSongBtn.disabled = true;
        elements.nextSongBtn.disabled = true;
        elements.toggleAutoAdvanceBtn.disabled = true;
        return;
    }

    elements.currentPlaylistPanel.innerHTML = `
        <h4>${currentPlaylist.name}</h4>
        <div class="playlist-songs panel"></div>
    `;

    const songsContainer = elements.currentPlaylistPanel.querySelector('.playlist-songs');
    const history = getHistory();

    currentPlaylist.songs.forEach((songId, index) => {
        const song = history.find(item => item.id === songId);
        const item = document.createElement('div');
        item.className = 'playlist-item panel-item';

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
            if (index === state.currentPlaylistIndex) {
                item.classList.add('active');
            }

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

            item.addEventListener('click', () => {
                Playlist.loadSongFromPlaylist(index);
            });
        }
        songsContainer.appendChild(item);
    });

    const hasMultipleSongs = currentPlaylist.songs.length > 1;
    elements.prevSongBtn.disabled = !hasMultipleSongs;
    elements.nextSongBtn.disabled = !hasMultipleSongs;
    elements.toggleAutoAdvanceBtn.disabled = false;
    // updateAutoAdvanceButton(); // This will be called by the main updateUI
}