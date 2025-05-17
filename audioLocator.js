// audioLocator.js - Handles locating and loading missing audio files
import { state } from './state.js';
import { elements } from './dom.js';
import * as Audio from './audio.js';
import * as Modal from './modal.js';

let lastAttemptedFolderFiles = null; // FileList from the most recent directory selection in the current session
let currentResolveFn = null;
let currentRejectFn = null;

/**
 * Tries to find and load the audio for a given song.
 * First checks a session-cached folder, then prompts the user if not found.
 * @param {object} song - The song object, must have at least audioFilename.
 * @returns {Promise<boolean>} True if audio was successfully loaded, false otherwise.
 */
export async function findAndLoadAudio(song) {
    if (!song || !song.audioFilename) {
        console.warn("AudioLocator: Song or song.audioFilename is missing.", song);
        return false;
    }

    // 1. Try to find in last attempted folder (if any)
    if (lastAttemptedFolderFiles) {
        const foundFile = Array.from(lastAttemptedFolderFiles).find(file => file.name === song.audioFilename);
        if (foundFile) {
            console.log(`AudioLocator: Found '${song.audioFilename}' in cached folder.`);
            await Audio.processAudioFileAndUpdateState(foundFile); // This is async due to audio loading
            return true;
        }
        console.log(`AudioLocator: '${song.audioFilename}' not in cached folder. Prompting user.`);
    }

    // 2. Prompt user for folder
    try {
        return await promptAndSearchForFile(song);
    } catch (error) {
        console.error(`AudioLocator: Error during prompt/search for ${song.audioFilename}:`, error);
        return false;
    }
}

/**
 * Opens a modal to prompt the user to select a folder and searches for the song's audio file.
 * @param {object} song - The song object.
 * @returns {Promise<boolean>} True if audio was successfully loaded, false otherwise.
 */
function promptAndSearchForFile(song) {
    return new Promise((resolve, reject) => {
        currentResolveFn = resolve;
        currentRejectFn = reject; // Though not explicitly used for rejection path yet.

        elements.missingFilenameDisplay.textContent = song.audioFilename;
        elements.missingSongTitleDisplay.textContent = song.title || 'this song';
        elements.audioLocatorStatus.textContent = ''; // Clear previous status
        elements.audioSourceFolderInput.value = ''; // Reset file input

        Modal.openModal(elements.locateAudioModal);
        // Event listeners for this modal are set up in events.js
    });
}

export function handleAudioFolderSelected(event) {
    const files = event.target.files;
    if (!files || files.length === 0) {
        elements.audioLocatorStatus.textContent = 'No folder selected.';
        if (currentResolveFn) currentResolveFn(false); // Or keep modal open? For now, resolve.
        return;
    }

    lastAttemptedFolderFiles = files; // Cache the FileList for this session

    const songToFind = state.currentSong; // Assume this is for the current song
    if (!songToFind || !songToFind.audioFilename) {
        elements.audioLocatorStatus.textContent = 'Error: No current song context for search.';
        Modal.closeModal(elements.locateAudioModal);
        if (currentResolveFn) currentResolveFn(false);
        return;
    }

    elements.audioLocatorStatus.textContent = `Searching for '${songToFind.audioFilename}'...`;

    const foundFile = Array.from(files).find(file => file.name === songToFind.audioFilename);

    if (foundFile) {
        elements.audioLocatorStatus.textContent = `Found '${foundFile.name}'. Loading...`;
        Audio.processAudioFileAndUpdateState(foundFile)
            .then(() => {
                Modal.closeModal(elements.locateAudioModal);
                if (currentResolveFn) currentResolveFn(true);
            })
            .catch(err => {
                console.error("Error processing found audio file:", err);
                elements.audioLocatorStatus.textContent = `Error loading '${foundFile.name}'.`;
                // Do not close modal, let user try again or skip.
                // if (currentResolveFn) currentResolveFn(false); // Or allow another try
            });
    } else {
        elements.audioLocatorStatus.textContent = `'${songToFind.audioFilename}' not found in the selected folder. Try another folder or skip.`;
        // Keep modal open for another try or skip.
    }
}

export function handleSkipLocatingAudio() {
    Modal.closeModal(elements.locateAudioModal);
    if (currentResolveFn) {
        currentResolveFn(false);
    }
    lastAttemptedFolderFiles = null; // Clear cache if user skips, to force prompt next time.
}

// Call this when the modal's 'x' is clicked
export function handleLocateAudioModalClosed() {
    if (currentResolveFn) {
        currentResolveFn(false); // Treat close as skip
    }
}