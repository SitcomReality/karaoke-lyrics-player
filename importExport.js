// Import/Export functions
import { state, resetCurrentSong } from './state.js';
import { elements } from './dom.js';
import * as Storage from './storage.js';
import * as UI from './ui/index.js'; // Corrected import path
import * as Modal from './modal.js'; // Import Modal for closeModal

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
        elements.exportJson.setSelectionRange(0, 99999); // For mobile devices

        navigator.clipboard.writeText(elements.exportJson.value).then(() => {
            alert('Copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            // Fallback for older browsers or if Clipboard API fails (though execCommand is deprecated)
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
    if (!state.currentSong.title && !state.currentSong.artist && (!state.currentSong.lyrics || state.currentSong.lyrics.length === 0)) {
        elements.exportJson.value = JSON.stringify({
            error: "No substantial song data to export. Add title, artist, or lyrics."
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
        if (!jsonData.title && !jsonData.artist && (!jsonData.lyrics || jsonData.lyrics.length === 0)) {
            throw new Error("Invalid project data. Project must have a title, artist, or lyrics.");
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
        } else { // Ensure a default theme is applied if not present in JSON
            state.currentSong.theme = {
                primary: '#6200ea',
                secondary: '#3700b3',
                accent: '#03dac6',
                background: '#121212',
                text: '#e1e1e1'
            };
        }


        // Import font if present
        if (jsonData.font) {
            state.currentSong.font = jsonData.font;
        } else { // Ensure a default font is applied
            state.currentSong.font = 'Roboto';
        }
        
        // Ensure extractedPalette is reset (it's not imported)
        state.currentSong.extractedPalette = [];
        
        // Assign a new ID to the imported song to treat it as a new entity in history
        // unless an ID matching an existing history item is desired (which is not the case here).
        // For simplicity, let's always assign a new ID on import.
        state.currentSong.id = Date.now().toString();


        // Save imported data as the current song
        Storage.saveCurrentSongState();
        
        // Optionally, save the imported song to history immediately
        // Storage.saveProject(true); // true for silent save to history

        // Update UI
        UI.updateUI();

        // Close the modal
        Modal.closeModal(elements.importExportModal);

        alert('Project imported successfully!');
    } catch (error) {
        alert(`Import failed: ${error.message}`);
        console.error("Import error:", error);
    }
}