import { state } from './state.js';
import { elements } from './dom.js';
import * as Storage from './storage.js';
import * as UI from './ui/index.js';
import { loadAudioFileAsPromise } from './audio.js';
import { parseLyricsContent } from './lyrics/core.js';

const AUDIO_EXTENSIONS = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'];
const LYRICS_EXTENSIONS = ['txt', 'lrc'];

function getFileExtension(filename) {
    return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2).toLowerCase();
}

function getBaseName(filename) {
    return filename.slice(0, filename.lastIndexOf('.'));
}

function parseArtistTitle(filename) {
    const base = getBaseName(filename);
    const parts = base.split(' - ');
    if (parts.length > 1) {
        return { artist: parts[0].trim(), title: parts.slice(1).join(' - ').trim() };
    }
    return { artist: '', title: base.trim() };
}

async function loadLyricsFileContent(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error(`Failed to read lyrics file: ${file.name}`));
        reader.readAsText(file);
    });
}

async function processSingleSongFiles(audioFile, lyricsFile) {
    const songId = `song_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    let title = '';
    let artist = '';
    let audioData = null;
    let lyricsLines = [];

    if (audioFile) {
        const parsedName = parseArtistTitle(audioFile.name);
        title = parsedName.title;
        artist = parsedName.artist;
        try {
            audioData = await loadAudioFileAsPromise(audioFile);
        } catch (err) {
            console.warn(`Could not process audio file ${audioFile.name}:`, err);
            // continue without audio if it fails
        }
    }

    if (lyricsFile) {
        if (!title) { // If no audio file, get title from lyrics file
            const parsedName = parseArtistTitle(lyricsFile.name);
            title = parsedName.title;
            artist = parsedName.artist; // Keep artist consistent if audio also exists
        }
        try {
            const lyricsContent = await loadLyricsFileContent(lyricsFile);
            lyricsLines = parseLyricsContent(lyricsContent);
        } catch (err) {
            console.warn(`Could not process lyrics file ${lyricsFile.name}:`, err);
        }
    }
    
    if (!title && !artist && !audioData && lyricsLines.length === 0) {
        // Skip if completely empty (e.g. both audio and lyrics failed to load and names were non-descript)
        return null;
    }


    return {
        id: songId,
        title: title || 'Untitled Song',
        artist: artist || 'Unknown Artist',
        lyrics: lyricsLines,
        timing: Array(lyricsLines.length).fill(null),
        audioUrl: audioData ? audioData.audioUrl : null,
        audioFilename: audioData ? audioData.audioFilename : null,
        // Default theme and font will be applied when loaded
        theme: { ...state.currentSong.theme }, // Copy default theme
        font: state.currentSong.font || 'Roboto'
    };
}


export async function handleFolderFilesSelected(event) {
    const files = event.target.files;
    if (!files || files.length === 0) {
        alert("No folder or files selected.");
        return;
    }

    const playlistName = prompt("Enter a name for the new playlist:", "New Folder Playlist");
    if (!playlistName) {
        alert("Playlist creation cancelled.");
        elements.importFolderInput.value = ''; // Reset file input
        return;
    }

    elements.importFolderInput.disabled = true; // Disable input during processing
    const originalButtonText = elements.importPlaylistFromFolderBtn.innerHTML;
    elements.importPlaylistFromFolderBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    elements.importPlaylistFromFolderBtn.disabled = true;


    const fileMap = new Map();

    for (const file of files) {
        const ext = getFileExtension(file.name);
        const baseName = getBaseName(file.name);

        if (!fileMap.has(baseName)) {
            fileMap.set(baseName, { audio: null, lyrics: null });
        }

        const entry = fileMap.get(baseName);
        if (AUDIO_EXTENSIONS.includes(ext) && !entry.audio) { // Take first audio file found for a base name
            entry.audio = file;
        } else if (LYRICS_EXTENSIONS.includes(ext) && !entry.lyrics) { // Take first lyrics file
            entry.lyrics = file;
        }
    }

    const songPromises = [];
    for (const [baseName, files] of fileMap.entries()) {
        if (files.audio || files.lyrics) { // Only process if at least one relevant file type exists
            songPromises.push(processSingleSongFiles(files.audio, files.lyrics));
        }
    }

    try {
        const processedSongsNullable = await Promise.all(songPromises);
        const processedSongs = processedSongsNullable.filter(song => song !== null);


        if (processedSongs.length === 0) {
            alert("No valid song (audio/lyrics) files found in the selected folder.");
            return;
        }

        const newPlaylist = {
            id: `playlist_${Date.now()}_${Math.random().toString(16).slice(2)}`,
            name: playlistName,
            songs: []
        };

        processedSongs.forEach(song => {
            // Add/update in history
            const existingIndex = state.history.findIndex(s => s.id === song.id); // Unlikely to match new IDs
            if (existingIndex > -1) {
                state.history[existingIndex] = song;
            } else {
                state.history.push(song);
            }
            newPlaylist.songs.push(song.id);
        });

        state.playlists.push(newPlaylist);

        Storage.saveHistory();
        Storage.savePlaylists();
        UI.updateHistoryPanel();
        UI.updatePlaylistsPanel();

        alert(`Playlist "${playlistName}" created with ${processedSongs.length} song(s).`);

    } catch (error) {
        console.error("Error processing folder for playlist:", error);
        alert(`Failed to create playlist from folder: ${error.message}`);
    } finally {
        elements.importFolderInput.value = ''; // Reset file input
        elements.importFolderInput.disabled = false;
        elements.importPlaylistFromFolderBtn.innerHTML = originalButtonText;
        elements.importPlaylistFromFolderBtn.disabled = false;
    }
}

export function triggerFolderImport() {
    elements.importFolderInput.click();
}
