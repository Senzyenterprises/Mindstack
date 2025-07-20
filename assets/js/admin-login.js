// mindstack/assets/js/admin-login.js

// Import Firebase modules
// Ensure 'auth' and 'signInWithEmailAndPassword' are imported from your firebase.js
import { auth, signInWithEmailAndPassword } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {
    const adminLoginForm = document.getElementById('adminLoginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const messageContainer = document.getElementById('messageContainer'); // This ID is correct from your HTML
    const loginBtn = document.querySelector('.login-btn');

    // --- Function to Display Messages ---
    function showMessage(message, type) {
        if (messageContainer) { // Ensure messageContainer exists
            messageContainer.textContent = message;
            messageContainer.className = 'message-container active'; // Reset classes
            messageContainer.classList.add(type); // Add 'error' or 'success' class
            messageContainer.style.display = 'block'; // Make sure it's visible
        }
    }

    function clearMessage() {
        if (messageContainer) { // Ensure messageContainer exists
            messageContainer.classList.remove('active', 'error', 'success');
            messageContainer.textContent = '';
            messageContainer.style.display = 'none'; // Hide it
        }
    }

    // --- Form Submission Handler ---
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent default form submission

            clearMessage(); // Clear previous messages

            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();

            // Basic client-side validation
            if (!email || !password) {
                showMessage('Please enter both email and password.', 'error');
                return;
            }

            // Simulate loading state
            loginBtn.textContent = 'Logging In...';
            loginBtn.disabled = true;
            loginBtn.style.opacity = '0.7';

            try {
                // --- Firebase Authentication Call ---
                await signInWithEmailAndPassword(auth, email, password);

                showMessage('Login successful! Redirecting to admin dashboard...', 'success');
                setTimeout(() => {
                    window.location.href = 'admin-dashboard.html'; // Redirect to admin dashboard
                }, 1000); // Short delay for message visibility

            } catch (error) {
                console.error("Login error:", error);
                let errorMessage = 'Login failed. Please try again.';

                // Provide more specific error messages based on Firebase Auth error codes
                switch (error.code) {
                    case 'auth/invalid-email':
                        errorMessage = 'Invalid email format.';
                        break;
                    case 'auth/user-disabled':
                        errorMessage = 'Your account has been disabled.';
                        break;
                    case 'auth/user-not-found':
                    case 'auth/wrong-password':
                        errorMessage = 'Invalid email or password.';
                        break;
                    case 'auth/too-many-requests':
                        errorMessage = 'Too many login attempts. Please try again later.';
                        break;
                    default:
                        errorMessage = `Login failed: ${error.message}`; // Fallback for other errors
                }
                showMessage(errorMessage, 'error');

                // Reset button state
                loginBtn.textContent = 'Log In';
                loginBtn.disabled = false;
                loginBtn.style.opacity = '1';
            }
        });
    }

    // --- Forgot Password Link (Placeholder) ---
    const forgotPasswordLink = document.querySelector('.forgot-password');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            // In a real app, this would trigger Firebase's sendPasswordResetEmail
            // For now, a simple alert or modal
            alert('Forgot Password functionality will be implemented with Firebase later. Please contact support.');
        });
    }
});
