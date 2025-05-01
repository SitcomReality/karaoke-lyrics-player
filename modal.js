// Modal management functions
import { elements } from './dom.js';

export function openModal(modal) {
    // Close any open modals first
    closeAllModals();
    
    // Open the requested modal
    modal.style.display = 'block';
    
    // Setup close buttons
    const closeBtn = modal.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => closeModal(modal));
    }
    
    // Close when clicking outside the modal content
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal);
        }
    });
}

export function closeModal(modal) {
    modal.style.display = 'none';
}

export function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}

export function isAnyModalOpen() {
    const modals = document.querySelectorAll('.modal');
    return Array.from(modals).some(modal => modal.style.display === 'block');
}