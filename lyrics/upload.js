// lyrics/upload.js - Handlers for uploading lyrics files
import { parseLyrics } from './lyrics.js';
import { renderLyrics } from './lyrics.js';
import * as Storage from '../storage.js';

/**
 * Handles the upload of a lyrics file (txt or lrc).
 * Parses, renders, and saves lyrics.
 * @param {Event} e
 */
export function handleLyricsUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const content = event.target.result;
        parseLyrics(content);
        renderLyrics();
        Storage.saveCurrentSongState();
    };
    reader.readAsText(file);
    e.target.value = '';
}