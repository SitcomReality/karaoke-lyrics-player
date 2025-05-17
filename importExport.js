// Import/Export functions
import { state, resetCurrentSong } from './state.js';
import { elements } from './dom.js';
import * as Storage from './storage.js';
import * as UI from './ui/index.js';
import * as Modal from './modal.js';

const CURRENT_EXPORT_VERSION = "1.1";

export function setupImportExport() {
    // Set up tab switching
    elements.tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.style.display = 'none';
            });
            elements.tabButtons.forEach(btn => {
                btn.classList.remove('active');
            });
            document.getElementById(`${tabId}-tab`).style.display = 'block';
            button.classList.add('active');
            if (tabId === 'export') {
                generateExportJSON();
            }
        });
    });
    
    elements.importBtn.addEventListener('click', importProjectData);
    
    elements.copyJsonBtn.addEventListener('click', () => {
        elements.exportJson.select();
        elements.exportJson.setSelectionRange(0, 99999); 

        navigator.clipboard.writeText(elements.exportJson.value).then(() => {
            alert('Copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            try {
                document.execCommand('copy');
                alert('Copied to clipboard (using fallback)!');
            } catch (e) {
                alert('Failed to copy. Please copy manually.');
                console.error('Fallback copy failed: ', e);
            }
        });
    });
}

function generateExportJSON() {
    if (state.history.length === 0 && state.playlists.length === 0) {
        elements.exportJson.value = JSON.stringify({
            version: CURRENT_EXPORT_VERSION,
            message: "No songs in history and no playlists to export.",
            history: [],
            playlists: []
        }, null, 2);
        return;
    }

    const exportData = {
        version: CURRENT_EXPORT_VERSION,
        history: state.history.map(song => ({
            id: song.id,
            title: song.title || '',
            artist: song.artist || '',
            lyrics: song.lyrics || [],
            timing: song.timing || [],
            theme: song.theme || { primary: '#6200ea', secondary: '#3700b3', accent: '#03dac6', background: '#121212', text: '#e1e1e1' },
            font: song.font || 'Roboto'
        })),
        playlists: state.playlists.map(playlist => ({
            id: playlist.id,
            name: playlist.name,
            songs: playlist.songs || []
        }))
    };

    elements.exportJson.value = JSON.stringify(exportData, null, 2);
}

function importProjectData() {
    try {
        const jsonData = JSON.parse(elements.importJson.value);

        if (!jsonData || typeof jsonData !== 'object') {
            throw new Error("Invalid JSON data. Input must be an object.");
        }
        if (jsonData.version !== CURRENT_EXPORT_VERSION && jsonData.version !== "1.0") { // Allow older version for partial import
             // For version 1.0, it only contains a single song for the current song.
            if (jsonData.version === "1.0" && (jsonData.title || jsonData.artist || (jsonData.lyrics && jsonData.lyrics.length > 0))) {
                 // Handle old format as importing a single song
                importSingleSongLegacy(jsonData);
                alert('Legacy project (single song) imported successfully!');
                Modal.closeModal(elements.importExportModal);
                UI.updateUI();
                return;
            }
            // console.warn(`Importing data with version ${jsonData.version}. Current version is ${CURRENT_EXPORT_VERSION}. Some features might not be available or data might be migrated.`);
             // For now, we'll be somewhat lenient with versions or specific structures
        }


        // Validate presence of history and playlists arrays if it's a full export
        if (!Array.isArray(jsonData.history) || !Array.isArray(jsonData.playlists)) {
            // If not full export, check if it's a single song legacy format again
            if (jsonData.title || jsonData.artist || (jsonData.lyrics && jsonData.lyrics.length > 0)) {
                 importSingleSongLegacy(jsonData);
                 alert('Legacy project (single song) imported successfully!');
                 Modal.closeModal(elements.importExportModal);
                 UI.updateUI();
                 return;
            }
            throw new Error("Invalid project data structure. Expected 'history' and 'playlists' arrays.");
        }


        // --- Import History (Songs) ---
        const existingSongsMap = new Map(state.history.map(s => [s.id, s]));
        const newHistory = [];

        jsonData.history.forEach(importedSong => {
            if (!importedSong || typeof importedSong.id !== 'string') {
                console.warn("Skipping invalid song entry in import:", importedSong);
                return;
            }
            const cleanImportedSong = {
                id: importedSong.id,
                title: importedSong.title || '',
                artist: importedSong.artist || '',
                lyrics: Array.isArray(importedSong.lyrics) ? importedSong.lyrics : [],
                timing: Array.isArray(importedSong.timing) ? importedSong.timing : [],
                theme: importedSong.theme && typeof importedSong.theme === 'object' ? importedSong.theme : { primary: '#6200ea', secondary: '#3700b3', accent: '#03dac6', background: '#121212', text: '#e1e1e1' },
                font: importedSong.font || 'Roboto'
            };
             // Ensure timing array matches lyrics length
            if (cleanImportedSong.timing.length !== cleanImportedSong.lyrics.length) {
                cleanImportedSong.timing = Array(cleanImportedSong.lyrics.length).fill(null);
            }

            if (existingSongsMap.has(cleanImportedSong.id)) {
                // Replace existing song: find its original position to maintain order if desired,
                // or just build a new list and replace state.history entirely.
                // For simplicity, let's build a new list for now.
                // This could be optimized by updating in place if order preservation is critical
                // and jsonData.history is not necessarily a complete replacement.
                // However, standard import/export implies replacing with the imported dataset.
            }
            newHistory.push(cleanImportedSong);
            existingSongsMap.set(cleanImportedSong.id, cleanImportedSong); // Update map for playlist song ID validation
        });
        state.history = newHistory; // Replace existing history

        // --- Import Playlists ---
        const validSongIds = new Set(state.history.map(s => s.id));
        const existingPlaylistsMap = new Map(state.playlists.map(p => [p.id, p]));
        const newPlaylists = [];

        jsonData.playlists.forEach(importedPlaylist => {
            if (!importedPlaylist || typeof importedPlaylist.id !== 'string') {
                console.warn("Skipping invalid playlist entry in import:", importedPlaylist);
                return;
            }
            const filteredSongIds = Array.isArray(importedPlaylist.songs) ?
                importedPlaylist.songs.filter(songId => typeof songId === 'string' && validSongIds.has(songId)) : [];
            
            const playlistToStore = {
                id: importedPlaylist.id,
                name: importedPlaylist.name || 'Untitled Playlist',
                songs: filteredSongIds
            };

            newPlaylists.push(playlistToStore);
        });
        state.playlists = newPlaylists; // Replace existing playlists

        Storage.saveHistory();
        Storage.savePlaylists();
        
        // Reset current song to a clean state as the library has changed.
        // The user can then select a song from the newly imported history/playlists.
        resetCurrentSong(); 
        Storage.saveCurrentSongState(); // Save the reset state

        UI.updateUI();
        Modal.closeModal(elements.importExportModal);
        alert('Project data imported successfully!');

    } catch (error) {
        alert(`Import failed: ${error.message}`);
        console.error("Import error:", error);
    }
}


// Helper for importing old single-song format
function importSingleSongLegacy(jsonData) {
    resetCurrentSong(); // Start fresh for the current song

    state.currentSong.title = jsonData.title || '';
    state.currentSong.artist = jsonData.artist || '';
    state.currentSong.lyrics = Array.isArray(jsonData.lyrics) ? jsonData.lyrics : [];
    state.currentSong.timing = Array.isArray(jsonData.timing) ? jsonData.timing : [];

    if (state.currentSong.timing.length !== state.currentSong.lyrics.length) {
        state.currentSong.timing = Array(state.currentSong.lyrics.length).fill(null);
    }

    state.currentSong.theme = {
        primary: jsonData.theme?.primary || '#6200ea',
        secondary: jsonData.theme?.secondary || '#3700b3',
        accent: jsonData.theme?.accent || '#03dac6',
        background: jsonData.theme?.background || '#121212',
        text: jsonData.theme?.text || '#e1e1e1'
    };
    state.currentSong.font = jsonData.font || 'Roboto';
    state.currentSong.extractedPalette = [];
    state.currentSong.id = Date.now().toString(); // Give it a new ID

    Storage.saveCurrentSongState(); // Save as current
    Storage.saveProject(true); // Silently add/update in history
}