// Import/Export functions
import { state, resetCurrentSong } from './state.js';
import { elements } from './dom.js';
import * as Storage from './storage.js';
import * as UI from './ui.js';

export function setupImportExport() {
    // Set up tab switching
    elements.tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Get the tab to show
            const tabId = button.dataset.tab;
            
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.style.display = 'none';
            });
            
            // Remove active class from all buttons
            elements.tabButtons.forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Show the selected tab
            document.getElementById(`${tabId}-tab`).style.display = 'block';
            
            // Mark button as active
            button.classList.add('active');
            
            // If export tab, generate export JSON
            if (tabId === 'export') {
                generateExportJSON();
            }
        });
    });
    
    // Set up import button
    elements.importBtn.addEventListener('click', importProject);
    
    // Set up copy button
    elements.copyJsonBtn.addEventListener('click', () => {
        elements.exportJson.select();
        document.execCommand('copy');
        alert('Copied to clipboard!');
    });
}

function generateExportJSON() {
    if (!state.currentSong.title && !state.currentSong.artist) {
        elements.exportJson.value = JSON.stringify({
            error: "No song data to export. Please save a song first."
        }, null, 2);
        return;
    }

    // Create exportable version of current song
    const exportData = {
        title: state.currentSong.title,
        artist: state.currentSong.artist,
        lyrics: state.currentSong.lyrics,
        timing: state.currentSong.timing,
        theme: state.currentSong.theme,
        font: state.currentSong.font
        // Do not export extractedPalette
    };

    elements.exportJson.value = JSON.stringify(exportData, null, 2);
}

function importProject() {
    try {
        // Parse the JSON input
        const jsonData = JSON.parse(elements.importJson.value);

        // Validate the imported data
        if (!jsonData.title && !jsonData.lyrics) {
            throw new Error("Invalid project data. Missing required fields.");
        }

        // Reset current song to defaults first
        resetCurrentSong();

        // Import data fields
        state.currentSong.title = jsonData.title || '';
        state.currentSong.artist = jsonData.artist || '';
        state.currentSong.lyrics = Array.isArray(jsonData.lyrics) ? jsonData.lyrics : [];
        state.currentSong.timing = Array.isArray(jsonData.timing) ? jsonData.timing : [];

        // Ensure timing array matches lyrics length
        if (state.currentSong.timing.length !== state.currentSong.lyrics.length) {
            state.currentSong.timing = Array(state.currentSong.lyrics.length).fill(null);
        }

        // Import theme if present
        if (jsonData.theme) {
            state.currentSong.theme = {
                primary: jsonData.theme.primary || '#6200ea',
                secondary: jsonData.theme.secondary || '#3700b3',
                accent: jsonData.theme.accent || '#03dac6',
                background: jsonData.theme.background || '#121212',
                text: jsonData.theme.text || '#e1e1e1'
            };
        }

        // Import font if present
        if (jsonData.font) {
            state.currentSong.font = jsonData.font;
        }
        
        // Ensure extractedPalette is reset (it's not imported)
        state.currentSong.extractedPalette = [];

        // Save imported data
        Storage.saveCurrentSongState();

        // Update UI
        UI.updateUI();

        // Close the modal
        const modal = elements.importExportModal;
        if (modal) {
            modal.style.display = 'none';
        }

        alert('Project imported successfully!');
    } catch (error) {
        alert(`Import failed: ${error.message}`);
        console.error("Import error:", error);
    }
}