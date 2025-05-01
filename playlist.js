// Playlist management functions
import { state } from './state.js';
import * as UI from './ui.js';
import * as Storage from './storage.js';

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