import { loadColorThief } from 'color-thief';

// State management
const state = {
    audio: null,
    audioContext: null,
    currentSong: {
        title: '',
        artist: '',
        lyrics: [],
        timing: [],
        image: null,
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
    playlists: [],
    currentPlaylist: null,
    currentPlaylistIndex: -1,
    history: []
};

// DOM Elements
const elements = {
    // Audio player
    playBtn: document.getElementById('play-btn'),
    progressBar: document.getElementById('progress-bar'),
    progress: document.getElementById('progress'),
    timeDisplay: document.getElementById('time-display'),
    volumeSlider: document.getElementById('volume-slider'),
    
    // Song info
    songTitle: document.getElementById('song-title'),
    songArtist: document.getElementById('song-artist'),
    songImage: document.getElementById('song-image'),
    
    // Lyrics
    lyricsContainer: document.getElementById('lyrics-container'),
    
    // Upload controls
    uploadAudio: document.getElementById('upload-audio'),
    uploadImage: document.getElementById('upload-image'),
    uploadLyrics: document.getElementById('upload-lyrics'),
    
    // Timing controls
    nextLineBtn: document.getElementById('next-line-btn'),
    resetTimingBtn: document.getElementById('reset-timing-btn'),
    editTimingModeBtn: document.getElementById('edit-timing-mode-btn'),
    saveProjectBtn: document.getElementById('save-project-btn'),
    
    // Playlist controls
    prevSongBtn: document.getElementById('prev-song-btn'),
    nextSongBtn: document.getElementById('next-song-btn'),
    
    // Panels
    historyPanel: document.getElementById('history-panel'),
    playlistsPanel: document.getElementById('playlists-panel'),
    currentPlaylistPanel: document.getElementById('current-playlist-panel'),
    
    // Theme
    primaryColor: document.getElementById('primary-color'),
    secondaryColor: document.getElementById('secondary-color'),
    accentColor: document.getElementById('accent-color'),
    backgroundColor: document.getElementById('background-color'),
    textColor: document.getElementById('text-color'),
    fontSelector: document.getElementById('font-selector'),
    
    // Modal buttons
    importExportBtn: document.getElementById('import-export-btn'),
    editColorsBtn: document.getElementById('edit-colors-btn'),
    createPlaylistBtn: document.getElementById('create-playlist'),
    
    // Modals
    importExportModal: document.getElementById('import-export-modal'),
    colorEditModal: document.getElementById('color-edit-modal'),
    customFontModal: document.getElementById('custom-font-modal'),
    createPlaylistModal: document.getElementById('create-playlist-modal'),
    
    // Modal elements
    importJson: document.getElementById('import-json'),
    exportJson: document.getElementById('export-json'),
    copyJsonBtn: document.getElementById('copy-json-btn'),
    importBtn: document.getElementById('import-btn'),
    tabButtons: document.querySelectorAll('.tab-btn'),
    
    // Color inputs
    primaryColorInput: document.getElementById('primary-color-input'),
    secondaryColorInput: document.getElementById('secondary-color-input'),
    accentColorInput: document.getElementById('accent-color-input'),
    backgroundColorInput: document.getElementById('background-color-input'),
    textColorInput: document.getElementById('text-color-input'),
    applyColorsBtn: document.getElementById('apply-colors-btn'),
    extractColorsBtn: document.getElementById('extract-colors-btn'),
    
    // Font modal
    customFontInput: document.getElementById('custom-font-input'),
    applyFontBtn: document.getElementById('apply-font-btn'),
    
    // Playlist modal
    playlistNameInput: document.getElementById('playlist-name-input'),
    availableSongsList: document.getElementById('available-songs-list'),
    savePlaylistBtn: document.getElementById('save-playlist-btn')
};

// Initialize application
function init() {
    // Load data from local storage
    loadFromLocalStorage();
    
    // Set up event listeners
    setupEventListeners();
    
    // Update UI with current state
    updateUI();
}

// Set up all event listeners
function setupEventListeners() {
    // Audio player controls
    elements.playBtn.addEventListener('click', togglePlay);
    elements.progressBar.addEventListener('click', seekAudio);
    elements.volumeSlider.addEventListener('input', adjustVolume);
    
    // File uploads
    elements.uploadAudio.addEventListener('change', handleAudioUpload);
    elements.uploadImage.addEventListener('change', handleImageUpload);
    elements.uploadLyrics.addEventListener('change', handleLyricsUpload);
    
    // Timing controls
    elements.nextLineBtn.addEventListener('click', markNextLine);
    elements.resetTimingBtn.addEventListener('click', resetTiming);
    elements.editTimingModeBtn.addEventListener('click', toggleEditMode);
    elements.saveProjectBtn.addEventListener('click', saveProject);
    
    // Playlist controls
    elements.prevSongBtn.addEventListener('click', playPreviousSong);
    elements.nextSongBtn.addEventListener('click', playNextSong);
    
    // Song info
    elements.songTitle.addEventListener('input', updateSongTitle);
    elements.songArtist.addEventListener('input', updateSongArtist);
    
    // Modal triggers
    elements.importExportBtn.addEventListener('click', openImportExportModal);
    elements.editColorsBtn.addEventListener('click', openColorEditModal);
    elements.createPlaylistBtn.addEventListener('click', openCreatePlaylistModal);
    
    // Modal close buttons
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', closeModal);
    });
    
    // Tab switching
    elements.tabButtons.forEach(button => {
        button.addEventListener('click', switchTab);
    });
    
    // Import/Export actions
    elements.copyJsonBtn.addEventListener('click', copyJsonToClipboard);
    elements.importBtn.addEventListener('click', importProject);
    
    // Color theme actions
    elements.applyColorsBtn.addEventListener('click', applyCustomColors);
    elements.extractColorsBtn.addEventListener('click', extractColorsFromImage);
    
    // Font selector
    elements.fontSelector.addEventListener('change', handleFontSelection);
    elements.applyFontBtn.addEventListener('click', applyCustomFont);
    
    // Playlist actions
    elements.savePlaylistBtn.addEventListener('click', saveNewPlaylist);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Clicking outside modal closes it
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal();
        }
    });
}

// Audio playback functions
function togglePlay() {
    if (!state.audio) {
        alert('Please upload an audio file first.');
        return;
    }
    
    if (state.isPlaying) {
        state.audio.pause();
        elements.playBtn.innerHTML = '<i class="fas fa-play"></i>';
    } else {
        state.audio.play();
        elements.playBtn.innerHTML = '<i class="fas fa-pause"></i>';
    }
    
    state.isPlaying = !state.isPlaying;
}

function seekAudio(e) {
    if (!state.audio) return;
    
    const bounds = elements.progressBar.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const width = bounds.width;
    const percentage = x / width;
    
    state.audio.currentTime = percentage * state.duration;
    updateProgressUI();
}

function adjustVolume() {
    if (!state.audio) return;
    
    const volume = parseFloat(elements.volumeSlider.value);
    state.audio.volume = volume;
}

function updateTimeDisplay() {
    if (!state.audio) return;
    
    state.currentTime = state.audio.currentTime;
    
    const currentMinutes = Math.floor(state.currentTime / 60);
    const currentSeconds = Math.floor(state.currentTime % 60);
    const durationMinutes = Math.floor(state.duration / 60);
    const durationSeconds = Math.floor(state.duration % 60);
    
    elements.timeDisplay.textContent = `${currentMinutes}:${currentSeconds.toString().padStart(2, '0')} / ${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`;
    
    updateHighlightedLyrics();
}

function updateProgressUI() {
    if (!state.audio) return;
    
    const percentage = (state.currentTime / state.duration) * 100;
    elements.progress.style.width = `${percentage}%`;
}

// File handling functions
function handleAudioUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const audioUrl = URL.createObjectURL(file);
    
    if (state.audio) {
        state.audio.pause();
        state.audio.src = '';
    }
    
    state.audio = new Audio(audioUrl);
    state.audio.addEventListener('loadedmetadata', () => {
        state.duration = state.audio.duration;
        updateTimeDisplay();
    });
    
    state.audio.addEventListener('timeupdate', () => {
        state.currentTime = state.audio.currentTime;
        updateTimeDisplay();
        updateProgressUI();
    });
    
    state.audio.addEventListener('ended', () => {
        state.isPlaying = false;
        elements.playBtn.innerHTML = '<i class="fas fa-play"></i>';
        
        // Auto play next song if in playlist
        if (state.currentPlaylist && state.currentPlaylistIndex >= 0) {
            setTimeout(() => playNextSong(), 1500);
        }
    });
    
    // Try to extract song info from filename
    const filename = file.name.replace(/\.[^/.]+$/, ""); // remove extension
    
    if (!state.currentSong.title) {
        // Try to parse artist - title format
        const parts = filename.split(' - ');
        if (parts.length > 1) {
            state.currentSong.artist = parts[0];
            state.currentSong.title = parts.slice(1).join(' - ');
        } else {
            state.currentSong.title = filename;
        }
    }
    
    updateUI();
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        state.currentSong.image = event.target.result;
        elements.songImage.src = state.currentSong.image;
        
        // Try to extract colors from the image
        extractColorsFromImage();
    };
    reader.readAsDataURL(file);
}

function handleLyricsUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        const content = event.target.result;
        parseLyrics(content);
    };
    reader.readAsText(file);
}

function parseLyrics(content) {
    // Simple parsing - each line is a lyric
    const lines = content.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    
    state.currentSong.lyrics = lines;
    state.currentSong.timing = Array(lines.length).fill(null);
    
    renderLyrics();
}

// Lyrics and timing functions
function renderLyrics() {
    if (!state.currentSong.lyrics.length) {
        elements.lyricsContainer.innerHTML = `
            <div class="lyrics-placeholder">
                <p>No lyrics uploaded yet. Upload audio and lyrics to begin.</p>
                <label for="upload-lyrics" class="upload-btn">
                    <i class="fas fa-file-alt"></i> Upload Lyrics
                </label>
            </div>
        `;
        return;
    }
    
    elements.lyricsContainer.innerHTML = '';
    
    state.currentSong.lyrics.forEach((line, index) => {
        const lineElement = document.createElement('div');
        lineElement.className = 'lyrics-line';
        lineElement.dataset.index = index;
        
        // If we're in edit mode, make the lines clickable
        if (state.editMode) {
            lineElement.addEventListener('click', () => {
                if (state.audio) {
                    state.currentSong.timing[index] = state.audio.currentTime;
                    saveToLocalStorage();
                    renderLyrics(); // Refresh to update visual state
                }
            });
        }
        
        // If this line has a timing set, add a timestamp indicator
        if (state.currentSong.timing[index] !== null) {
            const minutes = Math.floor(state.currentSong.timing[index] / 60);
            const seconds = Math.floor(state.currentSong.timing[index] % 60);
            lineElement.innerHTML = `
                <span class="line-time">[${minutes}:${seconds.toString().padStart(2, '0')}]</span>
                ${line}
            `;
        } else {
            lineElement.textContent = line;
        }
        
        // If this is the current line, highlight it
        if (index === state.currentLineIndex) {
            lineElement.classList.add('active');
        }
        
        elements.lyricsContainer.appendChild(lineElement);
    });
    
    // If we have a current line, scroll to it
    if (state.currentLineIndex >= 0) {
        const activeElement = elements.lyricsContainer.querySelector('.lyrics-line.active');
        if (activeElement) {
            activeElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }
}

function updateHighlightedLyrics() {
    if (!state.audio || !state.currentSong.timing.length) return;
    
    // Find which line should be highlighted based on current time
    let foundIndex = -1;
    
    for (let i = 0; i < state.currentSong.timing.length; i++) {
        const startTime = state.currentSong.timing[i];
        const nextStartTime = i < state.currentSong.timing.length - 1 ? 
            state.currentSong.timing[i + 1] : Infinity;
        
        if (startTime !== null && 
            state.currentTime >= startTime && 
            state.currentTime < nextStartTime) {
            foundIndex = i;
            break;
        }
    }
    
    // If the highlighted line has changed, update the UI
    if (foundIndex !== state.currentLineIndex) {
        state.currentLineIndex = foundIndex;
        renderLyrics();
    }
}

function markNextLine() {
    if (!state.audio) {
        alert('Please upload an audio file first.');
        return;
    }
    
    // Find the next unmarked line
    let nextLineIndex = 0;
    
    // If we're already playing, find the next line after the current one
    if (state.currentLineIndex >= 0) {
        nextLineIndex = state.currentLineIndex + 1;
    } else {
        // Find the first unmarked line
        for (let i = 0; i < state.currentSong.timing.length; i++) {
            if (state.currentSong.timing[i] === null) {
                nextLineIndex = i;
                break;
            }
        }
    }
    
    // Set the timing for the next line
    if (nextLineIndex < state.currentSong.lyrics.length) {
        state.currentSong.timing[nextLineIndex] = state.audio.currentTime;
        state.currentLineIndex = nextLineIndex;
        
        // Save changes
        saveToLocalStorage();
        
        // Update UI
        renderLyrics();
    }
}

function resetTiming() {
    if (!confirm("Are you sure you want to reset all timing information?")) return;
    
    if (state.currentSong.lyrics.length) {
        state.currentSong.timing = Array(state.currentSong.lyrics.length).fill(null);
        state.currentLineIndex = -1;
        
        // Save changes
        saveToLocalStorage();
        
        // Update UI
        renderLyrics();
    }
}

function toggleEditMode() {
    state.editMode = !state.editMode;
    
    // Update button text
    elements.editTimingModeBtn.innerHTML = state.editMode ? 
        '<i class="fas fa-check"></i> Done Editing' : 
        '<i class="fas fa-edit"></i> Edit Timing';
    
    // Render lyrics with new mode
    renderLyrics();
}

// Playlist functions
function loadSongFromHistory(index) {
    if (index < 0 || index >= state.history.length) return;
    
    const song = state.history[index];
    
    // Save current song if needed
    saveProject();
    
    // Load the selected song
    state.currentSong = JSON.parse(JSON.stringify(song));
    
    // Update UI
    updateUI();
    
    // Load audio if it exists in sessionStorage
    const audioData = sessionStorage.getItem(`audio_${song.title}_${song.artist}`);
    if (audioData) {
        const audio = new Audio(audioData);
        state.audio = audio;
        setupAudioListeners();
    } else {
        // Clear audio
        if (state.audio) {
            state.audio.pause();
            state.audio = null;
        }
    }
}

function playPreviousSong() {
    if (!state.currentPlaylist || state.currentPlaylistIndex <= 0) return;
    
    state.currentPlaylistIndex--;
    loadSongFromPlaylist(state.currentPlaylistIndex);
}

function playNextSong() {
    if (!state.currentPlaylist || state.currentPlaylistIndex >= state.currentPlaylist.songs.length - 1) return;
    
    state.currentPlaylistIndex++;
    loadSongFromPlaylist(state.currentPlaylistIndex);
}

function loadSongFromPlaylist(index) {
    if (!state.currentPlaylist || index < 0 || index >= state.currentPlaylist.songs.length) return;
    
    // Save current song if needed
    saveProject();
    
    // Set new index
    state.currentPlaylistIndex = index;
    
    // Load the song
    const songId = state.currentPlaylist.songs[index];
    const song = state.history.find(item => `${item.title}_${item.artist}` === songId);
    
    if (song) {
        state.currentSong = JSON.parse(JSON.stringify(song));
        updateUI();
    } else {
        console.error('Song not found in history:', songId);
    }
    
    // Update playlist UI to highlight current song
    updatePlaylistUI();
}

// Storage functions
function saveProject() {
    if (!state.currentSong.title) {
        alert('Please set a song title before saving.');
        return;
    }
    
    // Add or update in history
    const existingIndex = state.history.findIndex(item => 
        item.title === state.currentSong.title && item.artist === state.currentSong.artist
    );
    
    if (existingIndex >= 0) {
        state.history[existingIndex] = JSON.parse(JSON.stringify(state.currentSong));
    } else {
        state.history.push(JSON.parse(JSON.stringify(state.currentSong)));
    }
    
    // Save to session storage if we have an image or audio
    if (state.currentSong.image) {
        sessionStorage.setItem(`image_${state.currentSong.title}_${state.currentSong.artist}`, state.currentSong.image);
    }
    
    if (state.audio) {
        sessionStorage.setItem(`audio_${state.currentSong.title}_${state.currentSong.artist}`, state.audio.src);
    }
    
    // Save to local storage
    saveToLocalStorage();
    
    // Update UI
    updateHistoryPanel();
    
    alert('Project saved successfully!');
}

function saveToLocalStorage() {
    // Save history
    localStorage.setItem('karaoke_history', JSON.stringify(state.history));
    
    // Save playlists
    localStorage.setItem('karaoke_playlists', JSON.stringify(state.playlists));
    
    // Save current song
    localStorage.setItem('karaoke_current_song', JSON.stringify(state.currentSong));
    
    // Save current playlist info
    if (state.currentPlaylist) {
        localStorage.setItem('karaoke_current_playlist', JSON.stringify({
            id: state.currentPlaylist.id,
            index: state.currentPlaylistIndex
        }));
    }
}

function loadFromLocalStorage() {
    // Load history
    const historyData = localStorage.getItem('karaoke_history');
    if (historyData) {
        state.history = JSON.parse(historyData);
    }
    
    // Load playlists
    const playlistsData = localStorage.getItem('karaoke_playlists');
    if (playlistsData) {
        state.playlists = JSON.parse(playlistsData);
    }
    
    // Load current song
    const currentSongData = localStorage.getItem('karaoke_current_song');
    if (currentSongData) {
        state.currentSong = JSON.parse(currentSongData);
    }
    
    // Load current playlist
    const currentPlaylistData = localStorage.getItem('karaoke_current_playlist');
    if (currentPlaylistData) {
        const { id, index } = JSON.parse(currentPlaylistData);
        state.currentPlaylist = state.playlists.find(playlist => playlist.id === id) || null;
        state.currentPlaylistIndex = index;
    }
}

// UI update functions
function updateUI() {
    // Update song info
    elements.songTitle.value = state.currentSong.title || '';
    elements.songArtist.value = state.currentSong.artist || '';
    
    if (state.currentSong.image) {
        elements.songImage.src = state.currentSong.image;
    } else {
        elements.songImage.src = 'default-song-image.png';
    }
    
    // Update lyrics
    renderLyrics();
    
    // Update theme colors
    updateThemeColors();
    
    // Update history panel
    updateHistoryPanel();
    
    // Update playlists panel
    updatePlaylistsPanel();
    
    // Update current playlist panel
    updatePlaylistUI();
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
            
            loadSongFromHistory(index);
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
                saveToLocalStorage();
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
            saveToLocalStorage();
            updatePlaylistUI();
            
            // Load the first song if available
            if (playlist.songs.length > 0) {
                loadSongFromPlaylist(0);
            }
        });
        
        elements.playlistsPanel.appendChild(item);
    });
    
    // Add action handlers
    elements.playlistsPanel.querySelectorAll('.edit-playlist').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            editPlaylist(index);
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
                
                saveToLocalStorage();
                updatePlaylistsPanel();
                updatePlaylistUI();
            }
        });
    });
}

function updatePlaylistUI() {
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
            loadSongFromPlaylist(index);
        });
        
        songsContainer.appendChild(item);
    });
}

// Theme functions
function updateThemeColors() {
    // Set CSS variables
    document.documentElement.style.setProperty('--primary-color', state.currentSong.theme.primary);
    document.documentElement.style.setProperty('--secondary-color', state.currentSong.theme.secondary);
    document.documentElement.style.setProperty('--accent-color', state.currentSong.theme.accent);
    document.documentElement.style.setProperty('--background-color', state.currentSong.theme.background);
    document.documentElement.style.setProperty('--on-background', state.currentSong.theme.text);
    
    // Update theme preview elements
    elements.primaryColor.style.backgroundColor = state.currentSong.theme.primary;
    elements.secondaryColor.style.backgroundColor = state.currentSong.theme.secondary;
    elements.accentColor.style.backgroundColor = state.currentSong.theme.accent;
    elements.backgroundColor.style.backgroundColor = state.currentSong.theme.background;
    elements.textColor.style.backgroundColor = state.currentSong.theme.text;
    
    // Update font
    document.documentElement.style.setProperty('--font-family', `'${state.currentSong.font}', sans-serif`);
    
    // Set selected font in dropdown
    const fontExists = Array.from(elements.fontSelector.options).some(option => {
        if (option.value === state.currentSong.font) {
            elements.fontSelector.value = state.currentSong.font;
            return true;
        }
        return false;
    });
    
    if (!fontExists && state.currentSong.font !== 'Roboto') {
        elements.fontSelector.value = 'custom';
    }
}

async function extractColorsFromImage() {
    if (!state.currentSong.image) {
        alert('Please upload an image first.');
        return;
    }
    
    try {
        const colorThief = new ColorThief();
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = state.currentSong.image;
        
        img.onload = () => {
            try {
                const palette = colorThief.getPalette(img, 5);
                
                // Convert to hex and assign to theme
                state.currentSong.theme.primary = rgbToHex(palette[0][0], palette[0][1], palette[0][2]);
                state.currentSong.theme.secondary = rgbToHex(palette[1][0], palette[1][1], palette[1][2]);
                state.currentSong.theme.accent = rgbToHex(palette[2][0], palette[2][1], palette[2][2]);
                
                // Choose a dark or light background based on the palette
                const brightness = calculateBrightness(palette[0]);
                if (brightness > 128) {
                    // If primary color is light, use a dark background
                    state.currentSong.theme.background = '#121212';
                    state.currentSong.theme.text = '#e1e1e1';
                } else {
                    // If primary color is dark, use a light background
                    state.currentSong.theme.background = '#f5f5f5';
                    state.currentSong.theme.text = '#121212';
                }
                
                // Update UI
                updateThemeColors();
                saveToLocalStorage();
                
                if (elements.colorEditModal.style.display === 'block') {
                    updateColorInputs();
                }
            } catch (error) {
                console.error('Error extracting colors:', error);
                alert('Failed to extract colors from image.');
            }
        };
    } catch (error) {
        console.error('Error loading color thief:', error);
        alert('Failed to extract colors from image.');
    }
}

function rgbToHex(r, g, b) {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function calculateBrightness(rgb) {
    return (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
}

// Modal functions
function openImportExportModal() {
    elements.importExportModal.style.display = 'block';
    
    // Set up export data
    const exportData = {
        title: state.currentSong.title,
        artist: state.currentSong.artist,
        lyrics: state.currentSong.lyrics,
        timing: state.currentSong.timing,
        theme: state.currentSong.theme,
        font: state.currentSong.font
    };
    
    elements.exportJson.value = JSON.stringify(exportData, null, 2);
}

function openColorEditModal() {
    elements.colorEditModal.style.display = 'block';
    updateColorInputs();
}

function updateColorInputs() {
    elements.primaryColorInput.value = state.currentSong.theme.primary;
    elements.secondaryColorInput.value = state.currentSong.theme.secondary;
    elements.accentColorInput.value = state.currentSong.theme.accent;
    elements.backgroundColorInput.value = state.currentSong.theme.background;
    elements.textColorInput.value = state.currentSong.theme.text;
}

function openCreatePlaylistModal() {
    elements.createPlaylistModal.style.display = 'block';
    elements.playlistNameInput.value = '';
    
    // Populate available songs
    elements.availableSongsList.innerHTML = '';
    
    if (!state.history.length) {
        elements.availableSongsList.innerHTML = '<p class="empty-message">No songs available</p>';
        return;
    }
    
    state.history.forEach(song => {
        const item = document.createElement('div');
        item.className = 'checklist-item';
        
        item.innerHTML = `
            <input type="checkbox" id="song_${song.title}_${song.artist}" value="${song.title}_${song.artist}">
            <label for="song_${song.title}_${song.artist}">${song.title} - ${song.artist || 'Unknown'}</label>
        `;
        
        elements.availableSongsList.appendChild(item);
    });
}

function closeModal() {
    elements.importExportModal.style.display = 'none';
    elements.colorEditModal.style.display = 'none';
    elements.customFontModal.style.display = 'none';
    elements.createPlaylistModal.style.display = 'none';
}

function switchTab(e) {
    const tabName = e.target.dataset.tab;
    
    // Update active tab button
    elements.tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Show the correct tab content
    document.getElementById('import-tab').style.display = tabName === 'import' ? 'block' : 'none';
    document.getElementById('export-tab').style.display = tabName === 'export' ? 'block' : 'none';
}

function copyJsonToClipboard() {
    elements.exportJson.select();
    document.execCommand('copy');
    alert('Copied to clipboard!');
}

function importProject() {
    try {
        const jsonData = elements.importJson.value;
        if (!jsonData) {
            alert('Please paste JSON data to import.');
            return;
        }
        
        const importedData = JSON.parse(jsonData);
        
        // Validate required fields
        if (!importedData.title) {
            alert('Invalid project data: Missing title');
            return;
        }
        
        // Update current song with imported data
        state.currentSong = {
            ...state.currentSong,
            title: importedData.title,
            artist: importedData.artist || '',
            lyrics: importedData.lyrics || [],
            timing: importedData.timing || [],
            theme: importedData.theme || state.currentSong.theme,
            font: importedData.font || state.currentSong.font
        };
        
        // Update UI
        updateUI();
        saveToLocalStorage();
        closeModal();
        
        alert('Project imported successfully!');
    } catch (error) {
        console.error('Import error:', error);
        alert('Failed to import project. Please check the JSON format.');
    }
}

function applyCustomColors() {
    state.currentSong.theme.primary = elements.primaryColorInput.value;
    state.currentSong.theme.secondary = elements.secondaryColorInput.value;
    state.currentSong.theme.accent = elements.accentColorInput.value;
    state.currentSong.theme.background = elements.backgroundColorInput.value;
    state.currentSong.theme.text = elements.textColorInput.value;
    
    updateThemeColors();
    saveToLocalStorage();
    closeModal();
}

function handleFontSelection() {
    const selectedFont = elements.fontSelector.value;
    
    if (selectedFont === 'custom') {
        // Show custom font modal
        elements.customFontModal.style.display = 'block';
    } else {
        // Apply the selected font
        state.currentSong.font = selectedFont;
        updateThemeColors();
        saveToLocalStorage();
    }
}

function applyCustomFont() {
    const customFont = elements.customFontInput.value.trim();
    
    if (!customFont) {
        alert('Please enter a font name.');
        return;
    }
    
    // Load the font from Google Fonts
    const fontLink = document.createElement('link');
    fontLink.href = `https://fonts.googleapis.com/css2?family=${customFont.replace(' ', '+')}&display=swap`;
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);
    
    // Set the font
    state.currentSong.font = customFont;
    updateThemeColors();
    saveToLocalStorage();
    closeModal();
}

function saveNewPlaylist() {
    const playlistName = elements.playlistNameInput.value.trim();
    
    if (!playlistName) {
        alert('Please enter a playlist name.');
        return;
    }
    
    // Get selected songs
    const selectedSongs = [];
    elements.availableSongsList.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
        selectedSongs.push(checkbox.value);
    });
    
    if (!selectedSongs.length) {
        alert('Please select at least one song.');
        return;
    }
    
    // Create new playlist
    const newPlaylist = {
        id: Date.now().toString(),
        name: playlistName,
        songs: selectedSongs
    };
    
    state.playlists.push(newPlaylist);
    saveToLocalStorage();
    
    // Update UI
    updatePlaylistsPanel();
    closeModal();
    
    alert('Playlist created successfully!');
}

function handleKeyboardShortcuts(e) {
    // Space key to mark next line
    if (e.code === 'Space' && !e.target.matches('input, textarea')) {
        e.preventDefault();
        markNextLine();
    }
}

// Entry point
document.addEventListener('DOMContentLoaded', init);

