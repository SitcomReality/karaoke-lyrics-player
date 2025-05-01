// Application state management

export const state = {
    audio: null,
    audioContext: null,
    currentSong: {
        id: null, // Unique ID for the song
        title: '',
        artist: '',
        lyrics: [],
        timing: [],
        image: null, // Should store image URL or reference, not base64 if possible
        audioUrl: null, // Store URL for audio file if loaded via ObjectURL
        theme: {
            primary: '#6200ea',
            secondary: '#3700b3',
            accent: '#03dac6',
            background: '#121212',
            text: '#e1e1e1'
        },
        font: 'Roboto'
    },
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    currentLineIndex: -1,
    editMode: false,
    playlists: [], // Array of playlist objects { id, name, songs: [songId1, songId2] }
    currentPlaylistId: null,
    currentPlaylistIndex: -1, // Index within the current playlist
    history: [] // Array of song objects (or song IDs)
};

export function resetCurrentSong() {
    state.currentSong = {
        id: Date.now().toString(), // Assign a unique ID when resetting
        title: '',
        artist: '',
        lyrics: [],
        timing: [],
        image: null,
        audioUrl: null,
        theme: {
            primary: '#6200ea',
            secondary: '#3700b3',
            accent: '#03dac6',
            background: '#121212',
            text: '#e1e1e1'
        },
        font: 'Roboto'
    };
    state.audio = null;
    state.isPlaying = false;
    state.currentTime = 0;
    state.duration = 0;
    state.currentLineIndex = -1;
    state.editMode = false;
}

export function getCurrentSong() {
    return state.currentSong;
}

export function getHistory() {
    return state.history;
}

export function getPlaylists() {
    return state.playlists;
}

export function getCurrentPlaylist() {
    return state.playlists.find(p => p.id === state.currentPlaylistId) || null;
}