// mindstack/assets/js/privacy-policy.js

document.addEventListener('DOMContentLoaded', () => {
    const backToHomeBtn = document.getElementById('backToHomeBtn');

    if (backToHomeBtn) {
        // Add 'active' class to trigger CSS animation on load
        // Using a small timeout to ensure CSS transition applies
        setTimeout(() => {
            backToHomeBtn.classList.add('active');
        }, 100); // Small delay for animation to be visible

        // Event listener for redirection
        backToHomeBtn.addEventListener('click', (e) => {
            // Prevent default link behavior if you want a custom animation before redirect
            // e.preventDefault(); 
            console.log('Redirecting to index.html...');
            // window.location.href = 'index.html'; // This is handled by the <a> tag's href
        });
    }
});
