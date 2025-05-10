// lyrics/editor.js - Lyrics editing and remapping timing
import { state } from '../state.js';
import { elements } from '../dom.js';
import * as Modal from '../modal.js';
import * as Storage from '../storage.js';
import { renderLyrics } from './render.js';

/**
 * Opens the modal editor for editing lyrics.
 * Pre-fills current lyrics.
 */
export function openLyricsEditor() {
    const currentLyrics = state.currentSong.lyrics.join('\n');
    elements.lyricsEditor.value = currentLyrics;
    Modal.openModal(elements.lyricsEditorModal);
}

/**
 * Saves new/edited lyrics from the editor.
 * If line count remains the same, timing is preserved.
 * Otherwise, timing is reset and remapped.
 * Updates UI and closes editor.
 */
export function saveLyricsFromEditor() {
    const lyricsContent = elements.lyricsEditor.value;

    // Store current lyric and timing data for potential remapping or preservation
    const oldLyrics = [...state.currentSong.lyrics];
    const oldTiming = [...state.currentSong.timing];

    // Parse the new lyrics from the editor
    const newParsedLines = lyricsContent.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    if (newParsedLines.length === oldLyrics.length) {
        // Line count is the same, update lyrics but preserve timing
        state.currentSong.lyrics = newParsedLines;
        // state.currentSong.timing remains unchanged from its value before this function call
        state.currentLineIndex = -1; // Reset highlight after any edit
    } else {
        // Line count changed. Update lyrics, reset timing, then attempt remapping.
        state.currentSong.lyrics = newParsedLines; 
        state.currentSong.timing = Array(newParsedLines.length).fill(null); // Reset timing array
        
        // Attempt to remap timing from old lyrics to new lyrics based on text match
        handleTimingAfterEdit(oldLyrics, oldTiming); 
        
        state.currentLineIndex = -1; // Reset highlight
    }
    
    renderLyrics(); // Render lyrics after parsing/timing changes
    Modal.closeModal(elements.lyricsEditorModal);
    Storage.saveCurrentSongState();

    // Auto-save to history if title/artist and lyrics exist
    if ((state.currentSong.title || state.currentSong.artist) && state.currentSong.lyrics && state.currentSong.lyrics.length > 0) {
        Storage.saveProject(true); // true for silent save
    }
}

/**
 * Attempts to remap the timing array to newly edited lyrics,
 * preserving timing wherever line text matches exactly.
 * This function is called when the number of lyric lines changes.
 * @param {string[]} oldLyrics
 * @param {any[]} oldTiming
 */
export function handleTimingAfterEdit(oldLyrics, oldTiming) {
    // If there were no old lyrics or no old timing, new timing is already reset (array of nulls)
    if (!oldLyrics.length || !oldTiming.length || oldTiming.every(t => t === null || t === undefined)) {
        // Ensure timing array matches current lyrics length, filled with nulls.
        // This is already handled by the caller when line count differs, but good for safety.
        if (state.currentSong.timing.length !== state.currentSong.lyrics.length) {
             state.currentSong.timing = Array(state.currentSong.lyrics.length).fill(null);
        }
        return;
    }

    const newTiming = Array(state.currentSong.lyrics.length).fill(null);
    const usedOldIndices = new Set();

    state.currentSong.lyrics.forEach((newLine, newIndex) => {
        for (let oldIndex = 0; oldIndex < oldLyrics.length; oldIndex++) {
            if (!usedOldIndices.has(oldIndex) &&
                oldLyrics[oldIndex] === newLine &&
                oldTiming[oldIndex] !== null && oldTiming[oldIndex] !== undefined)
            {
                newTiming[newIndex] = oldTiming[oldIndex];
                usedOldIndices.add(oldIndex);
                break; 
            }
        }
    });

    state.currentSong.timing = newTiming;
    // currentLineIndex is typically reset by the caller (saveLyricsFromEditor)
}