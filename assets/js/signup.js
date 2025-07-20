// mindstack/assets/js/signup.js

// Import Firebase modules
import { 
    auth, 
    db, 
    collection, 
    setDoc, 
    doc, 
    createUserWithEmailAndPassword,
    firebaseConfig // <--- Import firebaseConfig here to access projectId
} from './firebase.js'; 

document.addEventListener('DOMContentLoaded', () => {
    // --- Elements for Signup Form ---
    const signupForm = document.getElementById('signupForm');
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const termsCheckbox = document.getElementById('terms');
    const createAccountBtn = document.getElementById('createAccountBtn');

    const fullNameError = document.getElementById('fullNameError');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');
    const confirmPasswordError = document.getElementById('confirmPasswordError');
    const termsError = document.getElementById('termsError');

    const recaptchaSection = document.getElementById('recaptchaSection');
    const recaptchaPlaceholder = document.getElementById('recaptchaPlaceholder');
    const spinner = recaptchaPlaceholder ? recaptchaPlaceholder.querySelector('.spinner') : null;
    const successIcon = recaptchaPlaceholder ? recaptchaPlaceholder.querySelector('.recaptcha-success-icon') : null;
    const recaptchaStatus = document.getElementById('recaptchaStatus');

    // Determine the correct appId for the Firestore path
    // Use __app_id if available (Canvas environment), otherwise use firebaseConfig.projectId
    const currentAppId = typeof __app_id !== 'undefined' ? __app_id : firebaseConfig.projectId; // <--- FIX IS HERE
    console.log("signup.js: Using currentAppId:", currentAppId); // DEBUG LOG - now should show mindstack-eba05

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

    // --- Validation functions (unchanged) ---
    function validateFullName() {
        if (fullNameInput && fullNameInput.value.trim() === '') {
            showError(fullNameError, 'Full Name is required.');
            return false;
        }
        if (fullNameError) hideError(fullNameError);
        return true;
    }

    function validateEmail() {
        const email = emailInput ? emailInput.value.trim() : '';
        if (email === '') {
            showError(emailError, 'Email Address is required.');
            return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showError(emailError, 'Please enter a valid email address.');
            return false;
        }
        if (emailError) hideError(emailError);
        return true;
    }

    function validatePassword() {
        const password = passwordInput ? passwordInput.value : '';
        if (password === '') {
            showError(passwordError, 'Password is required.');
            return false;
        }
        if (password.length < 6) {
            showError(passwordError, 'Password must be at least 6 characters.');
            return false;
        }
        if (passwordError) hideError(passwordError);
        return true;
    }

    function validateConfirmPassword() {
        const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';
        const password = passwordInput ? passwordInput.value : '';
        if (confirmPassword === '') {
            showError(confirmPasswordError, 'Confirm Password is required.');
            return false;
        }
        if (confirmPassword !== password) {
            showError(confirmPasswordError, 'Passwords do not match.');
            return false;
        }
        if (confirmPasswordError) hideError(confirmPasswordError);
        return true;
    }

    function validateTerms() {
        if (termsCheckbox && !termsCheckbox.checked) {
            showError(termsError, 'You must agree to the Terms and Privacy Policy.');
            return false;
        }
        if (termsError) hideError(termsError);
        return true;
    }

    // --- Event Listeners for real-time validation (on blur/input) ---
    if (fullNameInput) fullNameInput.addEventListener('blur', validateFullName);
    if (emailInput) emailInput.addEventListener('blur', validateEmail);
    if (passwordInput) passwordInput.addEventListener('blur', validatePassword);
    if (confirmPasswordInput) confirmPasswordInput.addEventListener('blur', validateConfirmPassword);
    if (passwordInput && confirmPasswordInput) {
        passwordInput.addEventListener('input', () => {
            if (confirmPasswordInput.value !== '') validateConfirmPassword();
        });
    }
    if (confirmPasswordInput) confirmPasswordInput.addEventListener('input', validateConfirmPassword);
    if (termsCheckbox) termsCheckbox.addEventListener('change', validateTerms);


    // --- Form Submission Handler (for Signup) ---
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 

            // Clear all previous errors
            hideError(fullNameError);
            hideError(emailError);
            hideError(passwordError);
            hideError(confirmPasswordError);
            hideError(termsError);
            if (recaptchaStatus) recaptchaStatus.textContent = ''; 

            // Run all validations
            const isFullNameValid = validateFullName();
            const isEmailValid = validateEmail();
            const isPasswordValid = validatePassword();
            const isConfirmPasswordValid = validateConfirmPassword();
            const areTermsValid = validateTerms();

            // If any validation fails, stop here
            if (!isFullNameValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid || !areTermsValid) {
                console.log("Form validation failed. Please check errors.");
                return;
            }

            // --- All validations passed, proceed with reCAPTCHA simulation ---
            createAccountBtn.textContent = 'Creating account...';
            createAccountBtn.disabled = true; 

            // Hide the form and show reCAPTCHA section
            if (signupForm) signupForm.style.display = 'none';
            if (recaptchaSection) recaptchaSection.classList.remove('hidden');
            if (recaptchaStatus) recaptchaStatus.textContent = 'Verifying...';
            if (spinner) spinner.style.display = 'block'; 
            if (successIcon) successIcon.classList.remove('show'); 

            // Simulate reCAPTCHA verification delay
            await new Promise(resolve => setTimeout(resolve, 2500)); 

            // Simulate reCAPTCHA success
            if (spinner) spinner.style.display = 'none'; 
            if (successIcon) successIcon.classList.add('show'); 
            if (recaptchaStatus) recaptchaStatus.textContent = 'Verification successful!';

            // Simulate final account creation delay
            await new Promise(resolve => setTimeout(resolve, 1500)); 

            // --- Firebase Account Creation ---
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            const fullName = fullNameInput.value.trim();

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                console.log("Firebase Auth user created:", user.uid); 

                // Save user data to Firestore
                const userDocRef = doc(db, `artifacts/${currentAppId}/users`, user.uid);
                await setDoc(userDocRef, {
                    fullName: fullName,
                    email: email,
                    role: 'student', 
                    createdAt: new Date(),
                    suspended: false
                });

                console.log("User data successfully saved to Firestore for UID:", user.uid); 
                // Redirect to login.html on successful account creation
                window.location.href = 'login.html';

            } catch (error) {
                console.error("Firebase signup error:", error); 
                let errorMessage = 'Account creation failed. Please try again.';

                switch (error.code) {
                    case 'auth/email-already-in-use':
                        errorMessage = 'This email is already in use. Try logging in or resetting your password.';
                        break;
                    case 'auth/invalid-email':
                        errorMessage = 'Invalid email address format.';
                        break;
                    case 'auth/weak-password':
                        errorMessage = 'Password is too weak. Please use at least 6 characters.';
                        break;
                    case 'permission-denied': 
                        errorMessage = 'Account created, but failed to save profile data due to permissions. Contact support.';
                        console.error("Firestore permission error during user profile save:", error);
                        break;
                    default:
                        errorMessage = `Account creation failed: ${error.message}`;
                }
                if (recaptchaStatus) {
                    recaptchaStatus.textContent = errorMessage;
                    recaptchaStatus.style.color = 'var(--color-red)'; 
                }
                
                // Re-show the form and reset button if there's an error
                if (signupForm) signupForm.style.display = 'block';
                if (recaptchaSection) recaptchaSection.classList.add('hidden');
                createAccountBtn.textContent = 'Create Account';
                createAccountBtn.disabled = false;
            }
        });
    }

});
