// mindstack/assets/js/404.js

document.addEventListener('DOMContentLoaded', () => {
    const notFoundContainer = document.getElementById('notFoundContainer');

    if (notFoundContainer) {
        // Add 'active' class to trigger CSS animation on load
        // Using a small timeout to ensure CSS transition applies
        setTimeout(() => {
            notFoundContainer.classList.add('active');
        }, 100); // Small delay for animation to be visible
    }
});
