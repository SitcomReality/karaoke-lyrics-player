// lyrics/core.js - Core lyric parsing logic and helpers
import { state } from '../state.js';

/**
 * Parses lyrics from plain text content.
 * Each non-empty line is considered a lyric line.
 * @param {string} content - Text content of the lyrics.
 * @returns {string[]} Array of parsed lyric lines.
 */
export function parseLyricsContent(content) {
    if (typeof content !== 'string') {
        console.warn("parseLyricsContent expects a string argument.");
        return [];
    }
    return content.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
}

/**
 * Applies an array of lyric lines to the current song state.
 * Resets timing and current line index.
 * @param {string[]} lines - Array of lyric lines.
 */
export function applyLyricsToCurrentSong(lines) {
    state.currentSong.lyrics = lines;
    state.currentSong.timing = Array(lines.length).fill(null);
    state.currentLineIndex = -1; // Reset highlight
}