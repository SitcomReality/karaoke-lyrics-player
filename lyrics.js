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
        renderLyrics(); // Render new lyrics
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
    const hasLyrics = state.currentSong.lyrics && state.currentSong.lyrics.length > 0;

    // Always clear the container first
    elements.lyricsContainer.innerHTML = '';

    if (hasLyrics) {
        // Hide placeholder message, show lyrics container content
        elements.lyricsPlaceholder.style.display = 'none';
        elements.lyricsContainer.style.display = 'block'; // Ensure container is visible

        state.currentSong.lyrics.forEach((line, index) => {
            const lineElement = document.createElement('div');
            lineElement.className = 'lyrics-line';
            lineElement.dataset.index = index;

            // Add timestamp indicator if timing exists
            const timestamp = state.currentSong.timing[index];
            let timePrefix = '';
            if (timestamp !== null && timestamp !== undefined) {
                const minutes = Math.floor(timestamp / 60);
                const seconds = Math.floor(timestamp % 60);
                const timeString = `[${minutes}:${seconds.toString().padStart(2, '0')}]`;
                const timeSpan = document.createElement('span');
                timeSpan.className = 'line-time';
                timeSpan.textContent = timeString;
                lineElement.appendChild(timeSpan);
                timePrefix = ' '; // Add space if time exists
            }

            // Add lyric text
            const textNode = document.createTextNode(`${timePrefix}${line}`);
            lineElement.appendChild(textNode);

            if (state.editMode) {
                lineElement.style.cursor = 'pointer';
                lineElement.title = 'Click to set timing for this line';
                lineElement.addEventListener('click', handleLyricLineClick);
            } else {
                lineElement.style.cursor = 'default';
                lineElement.title = '';
                // Ensure click listener is removed if not in edit mode (or handle within render)
                // Re-rendering clears old listeners, so this is okay.
            }

            // Highlight the current line
            if (index === state.currentLineIndex) {
                lineElement.classList.add('active');
            }

            elements.lyricsContainer.appendChild(lineElement);
        });

        scrollToActiveLine();

    } else {
        // Show placeholder message, hide lyrics container content
        elements.lyricsPlaceholder.style.display = 'flex'; // Use flex to center content
        elements.lyricsContainer.style.display = 'none'; // Hide container when placeholder is shown
    }
    // NOTE: The 'Upload Lyrics' and 'Edit Lyrics' buttons are always visible in their new location
    // Their visibility is no longer controlled by this function.
}

function handleLyricLineClick(event) {
    const lineElement = event.currentTarget;
    const index = parseInt(lineElement.dataset.index, 10);

    if (state.audio && state.editMode && !isNaN(index)) {
        const newTime = state.audio.currentTime;
        // Prevent setting time to exactly 0 unless it's the very start
        const adjustedTime = newTime < 0.1 ? 0 : newTime;
        state.currentSong.timing[index] = adjustedTime;

        // Optional: Sort timing array and lyrics if order changes?
        // For now, just update the clicked line's time.
        state.currentLineIndex = index; // Highlight the line just clicked
        Storage.saveCurrentSongState(); // Save changes
        renderLyrics(); // Re-render to show updated time and highlight
    }
}

export function updateHighlightedLyrics() {
    if (!state.audio || !state.currentSong.timing || !state.currentSong.timing.length || !state.isPlaying) {
        // If no timing, audio, not playing, or empty lyrics, ensure no line is highlighted
        if (state.currentLineIndex !== -1) {
            state.currentLineIndex = -1;
            renderLyrics(); // Re-render to remove highlight
        }
        return;
    }

    const currentTime = state.currentTime;
    let foundIndex = -1;

    // Find the last timing mark that is less than or equal to the current time
    // Iterate forwards for efficiency, find the first time > currentTime, then use index - 1
    let nextTimeIndex = -1;
    for (let i = 0; i < state.currentSong.timing.length; i++) {
        const time = state.currentSong.timing[i];
        // Skip null/undefined times
        if (time === null || time === undefined) continue;
        // Found the first line that starts *after* the current time
        if (time > currentTime) {
            nextTimeIndex = i;
            break;
        }
        // This line's time is <= currentTime, so it's a potential candidate
        foundIndex = i;
    }

    // If the first line starts after currentTime, no line should be active yet
    if (nextTimeIndex === 0) {
        foundIndex = -1;
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
            // Check if the element is already centered
            const containerRect = elements.lyricsContainer.getBoundingClientRect();
            const elementRect = activeElement.getBoundingClientRect();
            const desiredTop = containerRect.top + (containerRect.height / 2) - (elementRect.height / 2);

            // Only scroll if the element is not already reasonably centered
            if (Math.abs(elementRect.top - desiredTop) > elementRect.height) {
                activeElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                    inline: 'nearest'
                });
            }
        }
    }
}

export function markNextLine() {
    if (!state.audio) {
        alert('Please upload an audio file first.');
        return;
    }
    if (!state.currentSong.lyrics || state.currentSong.lyrics.length === 0) {
        alert('Please upload or add lyrics first.');
        return;
    }
    // Prevent marking time if audio is not playing? Maybe allow it.
    // if (!state.isPlaying) {
    //     alert('Audio must be playing to mark timing.');
    //     return;
    // }

    // Find the next line index to mark
    let targetIndex = -1;
    if (state.currentLineIndex >= 0 && state.currentLineIndex < state.currentSong.lyrics.length - 1) {
        // If a line is highlighted, mark the next one
        targetIndex = state.currentLineIndex + 1;
    } else if (state.currentLineIndex === -1) {
        // If no line is highlighted (e.g., at the start or after reset), mark the first line (index 0)
        targetIndex = 0;
    } else {
        // We are at the last line or beyond
        console.log("End of lyrics reached or no next line to mark.");
        // Potentially flash a message or do nothing
        elements.nextLineBtn.classList.add('flash');
        setTimeout(() => elements.nextLineBtn.classList.remove('flash'), 300);
        return; // Exit if no valid next line
    }

    // Set the timing for the target line
    if (targetIndex >= 0 && targetIndex < state.currentSong.lyrics.length) {
        const currentTime = state.audio.currentTime;
        // Prevent setting time to exactly 0 unless it's the very first line at the very start
        const adjustedTime = (currentTime < 0.1 && targetIndex === 0) ? 0 : (currentTime < 0.1 ? 0.1 : currentTime); // Ensure minimal time > 0 for later lines

        // Prevent setting a time earlier than the previous line's time
        const previousTime = targetIndex > 0 ? (state.currentSong.timing[targetIndex - 1] ?? -1) : -1;
        if (previousTime !== null && adjustedTime < previousTime) {
             console.warn(`Attempted to set time (${adjustedTime}) for line ${targetIndex} earlier than previous line (${previousTime}). Adjusting.`);
             // Option 1: Don't set the time
             // return;
             // Option 2: Set it slightly after the previous line
             state.currentSong.timing[targetIndex] = previousTime + 0.01;
        } else {
            state.currentSong.timing[targetIndex] = adjustedTime;
        }

        state.currentLineIndex = targetIndex; // Highlight the newly marked line

        Storage.saveCurrentSongState();
        renderLyrics(); // Re-render to show timestamp and highlight
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
    elements.editTimingModeBtn.classList.toggle('active', state.editMode);


    // Add/remove class to container for potential global styling hooks
    elements.lyricsContainer.classList.toggle('edit-mode', state.editMode);

    // Re-render lyrics to add/remove click listeners and update styles
    renderLyrics();
}

// Function to open the lyrics editor with current lyrics
export function openLyricsEditor() {
    // Populate the editor with current lyrics, even if empty
    const currentLyrics = state.currentSong.lyrics.join('\n');
    elements.lyricsEditor.value = currentLyrics;

    // Open the modal
    Modal.openModal(elements.lyricsEditorModal);
}

// Function to save lyrics from the editor
export function saveLyricsFromEditor() {
    const lyricsContent = elements.lyricsEditor.value;

    // Store the current timing data to handle remapping
    const oldLyrics = [...state.currentSong.lyrics];
    const oldTiming = [...state.currentSong.timing];

    // Parse the new lyrics (this resets timing)
    parseLyrics(lyricsContent);

    // Handle timing remapping (attempts to restore timing for matching lines)
    handleTimingAfterEdit(oldLyrics, oldTiming);

    // Close the modal
    Modal.closeModal(elements.lyricsEditorModal);

    // Save to storage
    Storage.saveCurrentSongState();

    // Update the UI
    renderLyrics(); // Re-render with new lyrics and remapped timing
}

// Helper function to handle timing after lyrics edit
function handleTimingAfterEdit(oldLyrics, oldTiming) {
    // If there were no previous lyrics or timing, or no old timing, nothing to remap
    if (!oldLyrics.length || !oldTiming.length || oldTiming.every(t => t === null || t === undefined)) {
        // Ensure timing array is correct length even if no remapping
        state.currentSong.timing = Array(state.currentSong.lyrics.length).fill(null);
        return;
    }

    const newTiming = Array(state.currentSong.lyrics.length).fill(null);

    // Try to match lines exactly to preserve timing
    const usedOldIndices = new Set();
    state.currentSong.lyrics.forEach((newLine, newIndex) => {
        // Find first matching old line that hasn't been used yet
        let foundMatch = false;
        for (let oldIndex = 0; oldIndex < oldLyrics.length; oldIndex++) {
            // Check if index not used, line text matches, and timing exists
            if (!usedOldIndices.has(oldIndex) &&
                oldLyrics[oldIndex] === newLine &&
                oldTiming[oldIndex] !== null && oldTiming[oldIndex] !== undefined)
            {
                newTiming[newIndex] = oldTiming[oldIndex];
                usedOldIndices.add(oldIndex);
                foundMatch = true;
                break; // Stop searching for this new line once a match is found
            }
        }
    });

    // More advanced diff/patch could be implemented here for better remapping
    // (e.g., using a library like diff-match-patch)
    // For now, only exact matches keep their timing.

    state.currentSong.timing = newTiming;
    state.currentLineIndex = -1; // Reset current line index after edit
}