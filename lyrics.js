// Lyrics display, parsing, and timing functions
import { state } from './state.js';
import { elements } from './dom.js';
import * as Storage from './storage.js';
import * as UI from './ui.js'; // May need UI updates after actions
import * as Modal from './modal.js';

export function handleLyricsUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const content = event.target.result;
        parseLyrics(content);
        renderLyrics();
        Storage.saveCurrentSongState(); // Save new lyrics and reset timing
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset file input
}

export function parseLyrics(content) {
    // Simple parsing - each line is a lyric
    const lines = content.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    state.currentSong.lyrics = lines;
    // Reset timing when new lyrics are loaded
    state.currentSong.timing = Array(lines.length).fill(null);
    state.currentLineIndex = -1; // Reset highlight
}

export function renderLyrics() {
    if (!state.currentSong.lyrics || !state.currentSong.lyrics.length) {
        elements.lyricsContainer.innerHTML = ''; // Clear previous lyrics
        elements.lyricsPlaceholder.style.display = 'flex'; // Show placeholder
        return;
    }

    elements.lyricsPlaceholder.style.display = 'none'; // Hide placeholder
    elements.lyricsContainer.innerHTML = ''; // Clear previous lyrics

    state.currentSong.lyrics.forEach((line, index) => {
        const lineElement = document.createElement('div');
        lineElement.className = 'lyrics-line';
        lineElement.dataset.index = index;

        // Add timestamp indicator if timing exists
        const timestamp = state.currentSong.timing[index];
        if (timestamp !== null && timestamp !== undefined) {
            const minutes = Math.floor(timestamp / 60);
            const seconds = Math.floor(timestamp % 60);
            const timeString = `[${minutes}:${seconds.toString().padStart(2, '0')}]`;
            const timeSpan = document.createElement('span');
            timeSpan.className = 'line-time';
            timeSpan.textContent = timeString;
            lineElement.appendChild(timeSpan);
        }

        // Add lyric text
        const textNode = document.createTextNode(` ${line}`); // Add space after timestamp
        lineElement.appendChild(textNode);


        if (state.editMode) {
            lineElement.style.cursor = 'pointer';
            lineElement.title = 'Click to set timing for this line';
            lineElement.addEventListener('click', handleLyricLineClick);
        } else {
            lineElement.style.cursor = 'default';
            lineElement.title = '';
        }

        // Highlight the current line
        if (index === state.currentLineIndex) {
            lineElement.classList.add('active');
        }

        elements.lyricsContainer.appendChild(lineElement);
    });

    scrollToActiveLine();

    // Update edit lyrics button visibility
    if (state.currentSong.lyrics && state.currentSong.lyrics.length) {
        // Show edit button next to lyrics if they exist
        if (elements.editLyricsBtn) {
            elements.editLyricsBtn.style.display = 'inline-flex';
        }
    }
}

function handleLyricLineClick(event) {
    const lineElement = event.currentTarget;
    const index = parseInt(lineElement.dataset.index, 10);

    if (state.audio && state.editMode && !isNaN(index)) {
        const newTime = state.audio.currentTime;
        state.currentSong.timing[index] = newTime;

        // Optional: Sort timing array and lyrics if order changes?
        // For now, just update the clicked line's time.
        state.currentLineIndex = index; // Highlight the line just clicked
        Storage.saveCurrentSongState(); // Save changes
        renderLyrics(); // Re-render to show updated time and highlight
    }
}

export function updateHighlightedLyrics() {
    if (!state.audio || !state.currentSong.timing || !state.currentSong.timing.length) {
        // If no timing or audio, ensure no line is highlighted
        if (state.currentLineIndex !== -1) {
            state.currentLineIndex = -1;
            renderLyrics();
        }
        return;
    }

    const currentTime = state.currentTime;
    let foundIndex = -1;

    // Find the last timing mark that is less than or equal to the current time
    for (let i = state.currentSong.timing.length - 1; i >= 0; i--) {
        const time = state.currentSong.timing[i];
        if (time !== null && time !== undefined && currentTime >= time) {
            foundIndex = i;
            break;
        }
    }

    // If the highlighted line has changed, update the UI
    if (foundIndex !== state.currentLineIndex) {
        state.currentLineIndex = foundIndex;
        renderLyrics(); // Re-render will handle highlight and scroll
    }
}

function scrollToActiveLine() {
    if (state.currentLineIndex >= 0) {
        const activeElement = elements.lyricsContainer.querySelector(`.lyrics-line[data-index="${state.currentLineIndex}"]`);
        if (activeElement) {
            activeElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }
}

export function markNextLine() {
    if (!state.audio) {
        alert('Please upload an audio file first.');
        return;
    }
    if (!state.currentSong.lyrics || state.currentSong.lyrics.length === 0) {
        alert('Please upload lyrics first.');
        return;
    }

    // Find the next line without timing OR the line after the current one
    let targetIndex = -1;
    if (state.currentLineIndex >= 0 && state.currentLineIndex < state.currentSong.lyrics.length - 1) {
        // If a line is highlighted, mark the next one
        targetIndex = state.currentLineIndex + 1;
    } else {
        // Otherwise, find the first line without timing
        targetIndex = state.currentSong.timing.findIndex(t => t === null || t === undefined);
        if (targetIndex === -1) {
            // If all lines have timing, maybe mark the first one again? Or do nothing?
            // Let's default to marking the first line if none are highlighted and all have times.
             targetIndex = 0;
        }
    }


    if (targetIndex >= 0 && targetIndex < state.currentSong.lyrics.length) {
        state.currentSong.timing[targetIndex] = state.audio.currentTime;
        state.currentLineIndex = targetIndex; // Highlight the newly marked line

        Storage.saveCurrentSongState();
        renderLyrics(); // Re-render to show timestamp and highlight
    } else if (targetIndex >= state.currentSong.lyrics.length) {
        console.log("End of lyrics reached.");
        // Optionally provide feedback to the user
    }
}

export function resetTiming() {
    if (!state.currentSong.lyrics || state.currentSong.lyrics.length === 0) {
        alert('No lyrics to reset timing for.');
        return;
    }
    if (!confirm("Are you sure you want to reset all timing information for this song?")) {
        return;
    }

    state.currentSong.timing = Array(state.currentSong.lyrics.length).fill(null);
    state.currentLineIndex = -1;

    Storage.saveCurrentSongState();
    renderLyrics(); // Re-render without timestamps and highlight
}

export function toggleEditMode() {
    state.editMode = !state.editMode;

    // Update button text/icon
    elements.editTimingModeBtn.innerHTML = state.editMode ?
        '<i class="fas fa-check"></i> Done Editing' :
        '<i class="fas fa-edit"></i> Edit Timing';

    // Add/remove class to container for potential global styling hooks
    elements.lyricsContainer.classList.toggle('edit-mode', state.editMode);

    // Re-render lyrics to add/remove click listeners and update styles
    renderLyrics();
}

// New function to save lyrics from the editor
export function saveLyricsFromEditor() {
    const lyricsContent = elements.lyricsEditor.value;
    
    // Store the current timing data to handle remapping
    const oldLyrics = [...state.currentSong.lyrics];
    const oldTiming = [...state.currentSong.timing];
    
    // Parse the new lyrics
    parseLyrics(lyricsContent);
    
    // Handle timing remapping - if number of lines has changed
    handleTimingAfterEdit(oldLyrics, oldTiming);
    
    // Close the modal
    Modal.closeModal(elements.lyricsEditorModal);
    
    // Save to storage
    Storage.saveCurrentSongState();
    
    // Update the UI
    renderLyrics();
}

// Helper function to handle timing after lyrics edit
function handleTimingAfterEdit(oldLyrics, oldTiming) {
    // If there were no previous lyrics or timing, nothing to do
    if (!oldLyrics.length || !oldTiming.length) return;
    
    // If the number of lines is the same, keep the timing as is
    if (oldLyrics.length === state.currentSong.lyrics.length) return;
    
    // Otherwise, we need to remap timing
    // This is a simple implementation - keep timing for lines that match exactly
    const newTiming = Array(state.currentSong.lyrics.length).fill(null);
    
    state.currentSong.lyrics.forEach((line, index) => {
        const oldIndex = oldLyrics.indexOf(line);
        if (oldIndex !== -1 && oldIndex < oldTiming.length) {
            newTiming[index] = oldTiming[oldIndex];
        }
    });
    
    state.currentSong.timing = newTiming;
    state.currentLineIndex = -1; // Reset current line index after edit
}