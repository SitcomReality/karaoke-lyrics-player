// UI Update functions
import { state, getCurrentSong, getHistory, getCurrentPlaylist, getPlaylists } from './state.js';
import { elements } from './dom.js';
import * as Theme from './theme.js';
import * as Lyrics from './lyrics.js';
import * as Audio from './audio.js';
import * as Storage from './storage.js';
import * as Playlist from './playlist.js'; // Needed for loading songs from panels
import * as Modal from './modal.js'; // Needed for editing playlists

export function updateUI() {
    updateSongInfo();
    updateSongImage();
    Lyrics.renderLyrics(); // Render lyrics based on current state
    Theme.updateThemeUI(); // Update theme display and apply styles
    updateHistoryPanel();
    updatePlaylistsPanel();
    updateCurrentPlaylistPanel();
    updatePlayerControls(); // Reflect play/pause state, volume etc.
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
        item.className = 'history-item';
        
        // Check if this is the current song
        if (state.currentSong.title === song.title && state.currentSong.artist === song.artist) {
            item.classList.add('active');
        }
        
        item.innerHTML = `
            <div class="item-info">
                <div class="item-title">${song.title}</div>
                <div class="item-subtitle">${song.artist || 'Unknown Artist'}</div>
            </div>
            <div class="item-actions">
                <button class="action-btn delete-song" data-index="${index}">
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
            if (confirm('Are you sure you want to delete this song?')) {
                state.history.splice(index, 1);
                Storage.saveToLocalStorage();
                updateHistoryPanel();
            }
        });
    });
}

function updatePlaylistsPanel() {
    if (!state.playlists.length) {
        elements.playlistsPanel.innerHTML = '<p class="empty-message">No playlists yet</p>';
        return;
    }
    
    elements.playlistsPanel.innerHTML = '';
    
    state.playlists.forEach((playlist, index) => {
        const item = document.createElement('div');
        item.className = 'playlist-item';
        
        // Check if this is the current playlist
        if (state.currentPlaylist && state.currentPlaylist.id === playlist.id) {
            item.classList.add('active');
        }
        
        const songCount = playlist.songs.length;
        
        item.innerHTML = `
            <div class="item-info">
                <div class="item-title">${playlist.name}</div>
                <div class="item-subtitle">${songCount} songs</div>
            </div>
            <div class="item-actions">
                <button class="action-btn edit-playlist" data-index="${index}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-playlist" data-index="${index}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // Add click handler to load the playlist
        item.addEventListener('click', (e) => {
            // Don't trigger if clicking the action buttons
            if (e.target.closest('.item-actions')) return;
            
            state.currentPlaylist = playlist;
            state.currentPlaylistIndex = 0;
            Storage.saveToLocalStorage();
            updatePlaylistUI();
            
            // Load the first song if available
            if (playlist.songs.length > 0) {
                Playlist.loadSongFromPlaylist(0);
            }
        });
        
        elements.playlistsPanel.appendChild(item);
    });
    
    // Add action handlers
    elements.playlistsPanel.querySelectorAll('.edit-playlist').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            Modal.editPlaylist(index);
        });
    });
    
    elements.playlistsPanel.querySelectorAll('.delete-playlist').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            if (confirm('Are you sure you want to delete this playlist?')) {
                state.playlists.splice(index, 1);
                
                // If this was the current playlist, clear it
                if (state.currentPlaylist && state.currentPlaylist.id === state.playlists[index].id) {
                    state.currentPlaylist = null;
                    state.currentPlaylistIndex = -1;
                }
                
                Storage.saveToLocalStorage();
                updatePlaylistsPanel();
                updatePlaylistUI();
            }
        });
    });
}

function updateCurrentPlaylistPanel() {
    if (!state.currentPlaylist) {
        elements.currentPlaylistPanel.innerHTML = '<p class="empty-message">No active playlist</p>';
        return;
    }
    
    elements.currentPlaylistPanel.innerHTML = `
        <h4>${state.currentPlaylist.name}</h4>
        <div class="playlist-songs"></div>
    `;
    
    const songsContainer = elements.currentPlaylistPanel.querySelector('.playlist-songs');
    
    state.currentPlaylist.songs.forEach((songId, index) => {
        // Find the song in history
        const song = state.history.find(item => `${item.title}_${item.artist}` === songId);
        
        if (!song) {
            console.warn('Song not found in history:', songId);
            return;
        }
        
        const item = document.createElement('div');
        item.className = 'playlist-item';
        
        // Check if this is the current song
        if (index === state.currentPlaylistIndex) {
            item.classList.add('active');
        }
        
        // Determine if the song has complete data
        const hasComplete = song.timing && song.timing.some(time => time !== null);
        const statusClass = hasComplete ? 'status-complete' : 'status-incomplete';
        const statusText = hasComplete ? 'Complete' : 'Incomplete';
        
        item.innerHTML = `
            <div class="item-info">
                <div class="item-title">${song.title}</div>
                <div class="item-subtitle">${song.artist || 'Unknown Artist'}
                    <span class="item-status ${statusClass}">${statusText}</span>
                </div>
            </div>
        `;
        
        // Add click handler to load the song
        item.addEventListener('click', () => {
            Playlist.loadSongFromPlaylist(index);
        });
        
        songsContainer.appendChild(item);
    });
}

function updatePlayerControls() {
    // Update audio controls based on current state
    if (state.isPlaying) {
        elements.playBtn.innerHTML = '<i class="fas fa-pause"></i>';
    } else {
        elements.playBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
    
    // Volume
    elements.volumeSlider.value = state.audio.volume;
}
