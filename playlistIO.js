// playlistIO.js - Handles import/export of playlist data
import { state } from './state.js';
import { elements } from './dom.js';
import * as Storage from './storage.js';
import * as UI from './ui/index.js';
import * as Modal from './modal.js';

const PLAYLIST_EXPORT_VERSION = "1.0";
let playlistFileToImport = null;

export function setupPlaylistIOModal() {
    elements.playlistIoModalTabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            elements.playlistIoModal.querySelectorAll('.tab-content').forEach(tab => {
                tab.style.display = 'none';
            });
            elements.playlistIoModalTabButtons.forEach(btn => {
                btn.classList.remove('active');
            });
            document.getElementById(`${tabId}-tab`).style.display = 'block';
            button.classList.add('active');

            if (tabId === 'playlist-export') {
                populatePlaylistExportData();
            } else if (tabId === 'playlist-import') {
                // Reset import form
                elements.playlistImportJson.value = '';
                elements.uploadPlaylistJson.value = '';
                elements.playlistFileInfo.textContent = 'No file selected';
                playlistFileToImport = null;
            }
        });
    });

    elements.copyPlaylistJsonBtn.addEventListener('click', copyPlaylistJSON);
    elements.downloadPlaylistJsonBtn.addEventListener('click', downloadPlaylistJSON);
    elements.importPlaylistDataBtn.addEventListener('click', processImportPlaylistData);
    elements.uploadPlaylistJson.addEventListener('change', handlePlaylistFileUpload);
}

export function openExportPlaylistsModal() {
    populatePlaylistExportData();
    // Ensure export tab is active
    elements.playlistIoModalTabButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === 'playlist-export') btn.classList.add('active');
    });
    elements.playlistExportTab.style.display = 'block';
    elements.playlistImportTab.style.display = 'none';
    Modal.openModal(elements.playlistIoModal);
}

export function openImportPlaylistsModal() {
    elements.playlistImportJson.value = '';
    elements.uploadPlaylistJson.value = ''; // Clear file input
    elements.playlistFileInfo.textContent = 'No file selected';
    playlistFileToImport = null;
    // Ensure import tab is active
    elements.playlistIoModalTabButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === 'playlist-import') btn.classList.add('active');
    });
    elements.playlistImportTab.style.display = 'block';
    elements.playlistExportTab.style.display = 'none';
    Modal.openModal(elements.playlistIoModal);
}

function populatePlaylistExportData() {
    const exportData = {
        version: PLAYLIST_EXPORT_VERSION,
        playlists: state.playlists.map(playlist => ({
            id: playlist.id,
            name: playlist.name,
            songs: playlist.songs || [] // Ensure songs array exists
        }))
    };
    elements.playlistExportJson.value = JSON.stringify(exportData, null, 2);
}

function copyPlaylistJSON() {
    if (!elements.playlistExportJson.value) {
        alert("Nothing to copy.");
        return;
    }
    elements.playlistExportJson.select();
    elements.playlistExportJson.setSelectionRange(0, 99999); // For mobile devices
    navigator.clipboard.writeText(elements.playlistExportJson.value).then(() => {
        alert('Playlists JSON copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy playlists JSON: ', err);
        // Fallback for older browsers
        try {
            document.execCommand('copy');
            alert('Playlists JSON copied to clipboard (using fallback)!');
        } catch (e) {
            alert('Failed to copy. Please copy manually.');
            console.error('Fallback copy failed: ', e);
        }
    });
}

function downloadPlaylistJSON() {
    if (!elements.playlistExportJson.value) {
        alert("No playlist data to download.");
        return;
    }
    const jsonString = elements.playlistExportJson.value;
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'karaoke_playlists.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function handlePlaylistFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        if (file.type === "application/json") {
            playlistFileToImport = file;
            elements.playlistFileInfo.textContent = `Selected: ${file.name}`;
        } else {
            alert("Invalid file type. Please upload a .json file.");
            event.target.value = ''; // Clear the input
            playlistFileToImport = null;
            elements.playlistFileInfo.textContent = 'No file selected';
        }
    } else {
        playlistFileToImport = null;
        elements.playlistFileInfo.textContent = 'No file selected';
    }
}

function processImportPlaylistData() {
    if (playlistFileToImport) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const fileContent = e.target.result;
                importPlaylistsFromJsonString(fileContent);
            } catch (error) {
                alert(`Error reading file: ${error.message}`);
                console.error("File read error:", error);
                resetImportForm();
            }
        };
        reader.onerror = () => {
             alert('Error reading the selected file.');
             console.error('FileReader error on playlist import.');
             resetImportForm();
        };
        reader.readAsText(playlistFileToImport);
    } else if (elements.playlistImportJson.value.trim()) {
        importPlaylistsFromJsonString(elements.playlistImportJson.value);
    } else {
        alert('No playlist data to import. Paste JSON or upload a file.');
    }
}

function importPlaylistsFromJsonString(jsonString) {
    try {
        const data = JSON.parse(jsonString);
        if (!data || typeof data !== 'object') {
            throw new Error("Invalid JSON data. Input must be an object containing a 'playlists' array.");
        }

        if (data.version !== PLAYLIST_EXPORT_VERSION) {
            console.warn(`Importing playlist data with version ${data.version}. Expected ${PLAYLIST_EXPORT_VERSION}.`);
            // Potentially add migration logic here if versions differ significantly in the future.
            // For now, we'll proceed but be mindful of structure.
        }

        if (!Array.isArray(data.playlists)) {
            throw new Error("Invalid playlist data structure. Root object must contain a 'playlists' array.");
        }

        const importedPlaylists = [];
        const validSongIdsFromHistory = new Set(state.history.map(s => s.id));

        data.playlists.forEach(p => {
            // Basic validation for each playlist object
            if (!p || typeof p.id !== 'string' || typeof p.name !== 'string' || !Array.isArray(p.songs)) {
                console.warn("Skipping invalid playlist entry during import (missing id, name, or songs array):", p);
                return;
            }
            // Filter song IDs to ensure they exist in the current history
            const filteredSongIds = p.songs.filter(songId => {
                if (typeof songId !== 'string') {
                    console.warn(`Invalid song ID type in playlist "${p.name}", song ID: ${songId}. Skipping.`);
                    return false;
                }
                const songExists = validSongIdsFromHistory.has(songId);
                if (!songExists) {
                     console.warn(`Song ID "${songId}" in imported playlist "${p.name}" not found in current history. It will be excluded.`);
                }
                return songExists;
            });
            
            importedPlaylists.push({
                id: p.id,
                name: p.name,
                songs: filteredSongIds
            });
        });
        
        const confirmed = confirm(`This will replace ALL current playlists with the imported ones. ${importedPlaylists.length} playlist(s) will be imported. Are you sure?`);
        if (!confirmed) {
            resetImportForm();
            return;
        }

        state.playlists = importedPlaylists;

        Storage.savePlaylists();
        UI.updatePlaylistsPanel();
        
        // If the current playlist was part of the replaced set and no longer exists, clear it.
        if (state.currentPlaylistId && !state.playlists.find(p => p.id === state.currentPlaylistId)) {
            state.currentPlaylistId = null;
            state.currentPlaylistIndex = -1;
            Storage.saveCurrentPlaylistInfo();
        }
        UI.updateCurrentPlaylistPanel();
        
        Modal.closeModal(elements.playlistIoModal);
        alert('Playlists imported successfully!');

    } catch (error) {
        alert(`Playlist import failed: ${error.message}`);
        console.error("Playlist import error:", error);
    } finally {
        resetImportForm();
    }
}

function resetImportForm() {
    elements.playlistImportJson.value = '';
    elements.uploadPlaylistJson.value = '';
    elements.playlistFileInfo.textContent = 'No file selected';
    playlistFileToImport = null;
}
