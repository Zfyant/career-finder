/*
 * Toast Notification Module
 * Handles the display of toast notifications for success and error messages.
 */

export const Toast = {
    /**
     * Shows a toast notification.
     * @param {string} message - The message to display.
     * @param {string} type - The type of toast ('success' or 'error').
     * @param {number} duration - The duration in milliseconds to show the toast.
     */
    show(message, type = 'success', duration = 3000) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        // Animate out and remove
        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => {
                toast.remove();
            });
        }, duration);
    }
};