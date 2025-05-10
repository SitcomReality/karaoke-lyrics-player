// lyrics/editor.js - Lyrics editing and remapping timing
import { state } from '../state.js';
import { elements } from '../dom.js';
import * as Modal from '../modal.js';
import * as Storage from '../storage.js';
import { parseLyrics } from './core.js';
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
 * Attempts to remap timing for matching lines.
 * Updates UI and closes editor.
 */
export function saveLyricsFromEditor() {
    const lyricsContent = elements.lyricsEditor.value;

    // Store current timing data to handle remapping
    const oldLyrics = [...state.currentSong.lyrics];
    const oldTiming = [...state.currentSong.timing];

    parseLyrics(lyricsContent); // This resets timing

    // Remap timing by matching lines
    handleTimingAfterEdit(oldLyrics, oldTiming);
    
    renderLyrics(); // Render lyrics after parsing and timing remapping
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
 * @param {string[]} oldLyrics
 * @param {any[]} oldTiming
 */
export function handleTimingAfterEdit(oldLyrics, oldTiming) {
    // If nothing to remap, ensure timing arrays match
    if (!oldLyrics.length || !oldTiming.length || oldTiming.every(t => t === null || t === undefined)) {
        state.currentSong.timing = Array(state.currentSong.lyrics.length).fill(null);
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
    state.currentLineIndex = -1;
}