// mindstack/assets/js/login.js

// Import Firebase modules
import { 
    auth, 
    db, // Import db for Firestore operations
    doc, // Import doc for document referencing
    getDoc, // Import getDoc to fetch user data
    signInWithEmailAndPassword, 
    sendPasswordResetEmail 
} from './firebase.js'; 
// Ensure db, doc, getDoc, sendPasswordResetEmail are exported from firebase.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Elements for Login Form ---
    const loginView = document.getElementById('loginView');
    const loginForm = document.getElementById('loginForm');
    const loginEmailInput = document.getElementById('loginEmail');
    const loginPasswordInput = document.getElementById('loginPassword');
    const loginBtn = document.getElementById('loginBtn');
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');

    const loginEmailError = document.getElementById('loginEmailError');
    const loginPasswordError = document.getElementById('loginPasswordError');

    // --- Elements for Password Reset Form ---
    const resetPasswordView = document.getElementById('resetPasswordView');
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const resetEmailInput = document.getElementById('resetEmail');
    const sendInstructionsBtn = document.getElementById('sendInstructionsBtn');
    const backToLoginBtn = document.getElementById('backToLoginBtn');

    const resetEmailError = document.getElementById('resetEmailError');
    const resetStatusArea = document.getElementById('resetStatusArea');
    const resetMessage = document.getElementById('resetMessage');
    const countdownTimer = document.getElementById('countdownTimer');

    let countdownInterval; // To store the interval for the timer

    // Determine the correct appId for the Firestore path (needed for user data fetch)
    const currentAppId = typeof __app_id !== 'undefined' ? __app_id : 'mindstack-eba05'; // Use your actual project ID as fallback
    console.log("login.js: Using currentAppId:", currentAppId);

    // --- Helper function to display error messages ---
    function showError(element, message) {
        if (element) {
            element.textContent = message;
            element.style.display = 'block';
        }
    }

    // --- Helper function to hide error messages ---
    function hideError(element) {
        if (element) {
            element.textContent = '';
            element.style.display = 'none';
        }
    }

    // --- Validation functions ---
    function validateInput(inputElement, errorElement, errorMessage, regex = null) {
        if (!inputElement || !errorElement) return true;

        const value = inputElement.value.trim();
        if (value === '') {
            showError(errorElement, errorMessage.empty);
            return false;
        }
        if (regex && !regex.test(value)) {
            showError(errorElement, errorMessage.invalid);
            return false;
        }
        hideError(errorElement);
        return true;
    }

    function validateLoginEmail() {
        return validateInput(loginEmailInput, loginEmailError, { empty: 'Email Address is required.', invalid: 'Please enter a valid email address.' }, /^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    }

    function validateLoginPassword() {
        return validateInput(loginPasswordInput, loginPasswordError, { empty: 'Password is required.' });
    }

    function validateResetEmail() {
        return validateInput(resetEmailInput, resetEmailError, { empty: 'Email Address is required.', invalid: 'Please enter a valid email address.' }, /^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    }

    // --- View Transition Function ---
    function switchAuthView(showViewElement, hideViewElement) {
        if (!showViewElement || !hideViewElement) return;

        hideViewElement.style.opacity = '0';
        hideViewElement.style.transform = 'translateY(20px)';
        hideViewElement.style.pointerEvents = 'none';

        setTimeout(() => {
            hideViewElement.classList.add('hidden');
            hideViewElement.style.opacity = '';
            hideViewElement.style.transform = '';

            showViewElement.classList.remove('hidden');
            void showViewElement.offsetWidth; // Trigger reflow for transition
            showViewElement.style.opacity = '1';
            showViewElement.style.transform = 'translateY(0)';
            showViewElement.style.pointerEvents = 'auto';
        }, 400); // Matches CSS transition duration
    }

    // --- Initial View Display for Login Page ---
    if (loginView) {
        setTimeout(() => {
            loginView.classList.remove('hidden'); 
            void loginView.offsetWidth; 
            loginView.style.opacity = '1';
            loginView.style.transform = 'translateY(0)';
            loginView.style.pointerEvents = 'auto';
        }, 500); 
    }

    // --- Login Form Submission Handler ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const isEmailValid = validateLoginEmail();
            const isPasswordValid = validateLoginPassword();

            if (!isEmailValid || !isPasswordValid) {
                console.log("Login form validation failed. Please check errors.");
                return;
            }

            if (loginBtn) {
                loginBtn.textContent = 'Logging in...';
                loginBtn.disabled = true;
            }

            try {
                const userCredential = await signInWithEmailAndPassword(auth, loginEmailInput.value.trim(), loginPasswordInput.value.trim());
                const user = userCredential.user;
                console.log("User logged in successfully! UID:", user.uid);

                // --- Fetch user role from Firestore ---
                const userDocRef = doc(db, `artifacts/${currentAppId}/users`, user.uid);
                const userDocSnap = await getDoc(userDocRef);

                let userRole = 'student'; // Default role
                if (userDocSnap.exists()) {
                    userRole = userDocSnap.data().role || 'student';
                    console.log("User role from Firestore:", userRole);
                } else {
                    console.warn("User document not found in Firestore for UID:", user.uid, ". Defaulting to 'student' role.");
                    // Optionally, create a basic user document if it doesn't exist (e.g., if signed up via external provider)
                    await setDoc(userDocRef, { 
                        email: user.email, 
                        role: 'student', 
                        createdAt: new Date(), 
                        suspended: false 
                    }, { merge: true });
                }
                
                // --- Redirect based on role ---
                if (userRole === 'admin') {
                    window.location.href = 'admin-dashboard.html'; // Redirect admin to admin dashboard
                } else {
                    window.location.href = 'dashboard.html'; // Redirect student/affiliate to user dashboard
                }

            } catch (error) {
                console.error("Login error:", error);
                let errorMessage = 'Login failed. Please try again.';

                switch (error.code) {
                    case 'auth/invalid-email':
                    case 'auth/user-not-found':
                    case 'auth/wrong-password':
                        errorMessage = 'Invalid email or password.';
                        break;
                    case 'auth/user-disabled':
                        errorMessage = 'Your account has been disabled.';
                        break;
                    case 'auth/too-many-requests':
                        errorMessage = 'Too many login attempts. Please try again later.';
                        break;
                    default:
                        errorMessage = `Login failed: ${error.message}`;
                }
                showError(loginPasswordError, errorMessage); 

            } finally {
                if (loginBtn) {
                    loginBtn.textContent = 'Log In';
                    loginBtn.disabled = false;
                }
            }
        });

        if (loginEmailInput) loginEmailInput.addEventListener('blur', validateLoginEmail);
        if (loginPasswordInput) loginPasswordInput.addEventListener('blur', validateLoginPassword);
    }

    // --- Forgot Password Link Click Handler ---
    if (forgotPasswordLink && loginView && resetPasswordView) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            switchAuthView(resetPasswordView, loginView);
            hideError(resetEmailError);
            if (resetEmailInput) resetEmailInput.value = ''; 
            if (resetStatusArea) resetStatusArea.classList.add('hidden'); 
            clearInterval(countdownInterval); 
        });
    }

    // --- Back to Login Button Click Handler ---
    if (backToLoginBtn && loginView && resetPasswordView) {
        backToLoginBtn.addEventListener('click', () => {
            switchAuthView(loginView, resetPasswordView);
            hideError(loginEmailError);
            hideError(loginPasswordError);
            if (loginEmailInput) loginEmailInput.value = ''; 
            if (loginPasswordInput) loginPasswordInput.value = ''; 
            clearInterval(countdownInterval); 
        });
    }

    // --- Password Reset Form Submission Handler ---
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const isEmailValid = validateResetEmail();
            if (!isEmailValid) {
                console.log("Reset password form validation failed.");
                return;
            }

            if (sendInstructionsBtn) {
                sendInstructionsBtn.textContent = 'Sending reset link...';
                sendInstructionsBtn.disabled = true;
            }
            if (resetStatusArea) resetStatusArea.classList.remove('hidden'); 
            if (resetMessage) resetMessage.textContent = 'Sending reset link...';
            if (countdownTimer) countdownTimer.textContent = ''; 

            try {
                await sendPasswordResetEmail(auth, resetEmailInput.value.trim());

                if (resetMessage) resetMessage.textContent = 'Reset instructions have been sent. Check your email or spam folder.';
                startCountdown(300); 

            } catch (error) {
                console.error("Password reset error:", error);
                let errorMessage = 'Failed to send reset link. Please try again.';

                switch (error.code) {
                    case 'auth/invalid-email':
                    case 'auth/user-not-found':
                        errorMessage = 'No account found with this email.';
                        break;
                    case 'auth/too-many-requests':
                        errorMessage = 'Too many requests. Please try again later.';
                        break;
                    default:
                        errorMessage = `Failed to send reset link: ${error.message}`;
                }
                if (resetMessage) resetMessage.textContent = errorMessage;
                if (countdownTimer) countdownTimer.textContent = ''; 
            } finally {
                if (sendInstructionsBtn) {
                    sendInstructionsBtn.textContent = 'Send Me Instructions';
                    sendInstructionsBtn.disabled = false;
                }
            }
        });

        if (resetEmailInput) resetEmailInput.addEventListener('blur', validateResetEmail);
    }

    // --- Countdown Timer Function ---
    function startCountdown(durationInSeconds) {
        let timer = durationInSeconds;
        let minutes, seconds;

        clearInterval(countdownInterval); 

        countdownInterval = setInterval(() => {
            minutes = parseInt(timer / 60, 10);
            seconds = parseInt(timer % 60, 10);

            minutes = minutes < 10 ? "0" + minutes : minutes;
            seconds = seconds < 10 ? "0" + seconds : seconds;

            if (countdownTimer) countdownTimer.textContent = `This link will expire in ${minutes}:${seconds}`;

            if (--timer < 0) {
                clearInterval(countdownInterval);
                if (countdownTimer) countdownTimer.textContent = 'Link has expired. Please try again.';
                if (resetMessage) resetMessage.textContent = 'Your reset link has expired. Please request a new one.';
                if (sendInstructionsBtn) sendInstructionsBtn.disabled = false;
            }
        }, 1000);
    }
});
