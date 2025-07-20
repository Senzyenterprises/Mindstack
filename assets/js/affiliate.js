// mindstack/assets/js/affiliate.js

// Import Firebase modules
import { 
    db, 
    auth, 
    doc, 
    getDoc, 
    updateDoc, 
    onAuthStateChanged,
    signInAnonymously,
    signInWithCustomToken,
    firebaseConfig
} from './firebase.js'; // Assuming firebase.js is in the same directory

document.addEventListener('DOMContentLoaded', async () => {
    // --- Global Variables ---
    let currentUser = null;
    let currentAffiliateData = null;
    const MIN_PAYOUT_AMOUNT = 5000; // Example minimum payout in NGN

    // Determine the correct appId for the Firestore path
    const currentAppId = typeof __app_id !== 'undefined' ? __app_id : firebaseConfig.projectId;
    console.log("affiliate.js: Using currentAppId:", currentAppId);

    // --- UI Elements ---
    const heroCtaBtn = document.getElementById('heroCtaBtn');
    const affiliateDashboardSection = document.getElementById('affiliateDashboard');
    const referralLinkSpan = document.getElementById('referralLink');
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    const payoutMessage = document.getElementById('payoutMessage');
    const requestPayoutBtn = document.getElementById('requestPayoutBtn');

    // Stats elements
    const totalClicksSpan = document.getElementById('totalClicks');
    const totalSignupsSpan = document.getElementById('totalSignups');
    const totalConversionsSpan = document.getElementById('totalConversions');
    const totalEarningsSpan = document.getElementById('totalEarnings');

    // FAQ Accordion elements
    const accordionHeaders = document.querySelectorAll('.faq-accordion .accordion-header');

    // Generic Message Modal Elements
    const messageModalOverlay = document.getElementById('messageModalOverlay');
    const messageModalTitle = document.getElementById('messageModalTitle');
    const messageModalText = document.getElementById('messageModalText');
    const messageModalCloseBtn = document.getElementById('messageModalCloseBtn');
    const closeMessageModalBtnTop = document.getElementById('closeMessageModalBtnTop'); // Top close button for generic modal

    // Tips & Tools Buttons
    const viewCaptionsBtn = document.getElementById('viewCaptionsBtn');
    const downloadAssetsBtn = document.getElementById('downloadAssetsBtn');
    const getTemplatesBtn = document.getElementById('getTemplatesBtn');

    // Tips & Tools Modals
    const socialMediaCaptionsModalOverlay = document.getElementById('socialMediaCaptionsModalOverlay');
    const closeCaptionsModalBtn = document.getElementById('closeCaptionsModalBtn');
    const captionsModalCloseBtnBottom = document.getElementById('captionsModalCloseBtnBottom');
    const copyCaptionBtns = document.querySelectorAll('.copy-caption-btn'); // For copying individual captions

    const bannersLogosModalOverlay = document.getElementById('bannersLogosModalOverlay');
    const closeBannersModalBtn = document.getElementById('closeBannersModalBtn');
    const bannersModalCloseBtnBottom = document.getElementById('bannersModalCloseBtnBottom');

    const emailTemplatesModalOverlay = document.getElementById('emailTemplatesModalOverlay');
    const closeEmailTemplatesModalBtn = document.getElementById('closeEmailTemplatesModalBtn');
    const emailTemplatesModalCloseBtnBottom = document.getElementById('emailTemplatesModalCloseBtnBottom');
    const copyEmailBtns = document.querySelectorAll('.copy-email-btn'); // For copying individual email templates


    // --- Generic Message Modal Functions ---
    function showModal(title, message, type = 'info') {
        if (messageModalTitle) messageModalTitle.textContent = title;
        if (messageModalText) messageModalText.textContent = message;
        
        if (messageModalOverlay) {
            messageModalOverlay.classList.add('active');
            messageModalOverlay.className = `modal-overlay active ${type}`; 
            document.body.classList.add('no-scroll');
        } else {
            console.error("Critical Error: messageModalOverlay is null in showModal(). Cannot display message.");
        }
    }

    function hideModal() {
        if (messageModalOverlay) {
            messageModalOverlay.classList.remove('active', 'success', 'error');
            document.body.classList.remove('no-scroll'); 
        }
    }

    if (messageModalCloseBtn) { // OK button
        messageModalCloseBtn.addEventListener('click', hideModal);
    }
    if (closeMessageModalBtnTop) { // Top close button for generic modal
        closeMessageModalBtnTop.addEventListener('click', hideModal);
    }
    if (messageModalOverlay) {
        messageModalOverlay.addEventListener('click', (e) => {
            if (e.target === messageModalOverlay) {
                hideModal();
            }
        });
    }

    // --- Firebase Auth State and User Data ---
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            console.log("Affiliate Page: User logged in:", user.email || user.uid);
            // Fetch user role and affiliate data
            await fetchAffiliateData(user.uid);
        } else {
            currentUser = null;
            currentAffiliateData = null;
            console.log("Affiliate Page: No user logged in.");
            updateDashboardVisibility(false); // Hide dashboard if not logged in
        }
    });

    // Initial sign-in logic (only if no user is currently authenticated and in Canvas env)
    if (!auth.currentUser && typeof __initial_auth_token !== 'undefined') {
        try {
            await signInWithCustomToken(auth, __initial_auth_token);
            console.log("Signed in with custom token (Canvas environment).");
        } catch (error) {
            console.error("Error signing in with custom token:", error);
            if (error.code !== 'auth/admin-restricted-operation') {
                try {
                    await signInAnonymously(auth);
                    console.log("Signed in anonymously as fallback (Canvas environment).");
                } catch (anonError) {
                    console.error("Error signing in anonymously:", anonError);
                }
            }
        }
    } else if (!auth.currentUser) {
        console.log("Waiting for user authentication from login.html or onAuthStateChanged.");
        updateDashboardVisibility(false); // Ensure dashboard is hidden if not authenticated
    }


    // --- Function to Fetch Affiliate Data from Firestore ---
    async function fetchAffiliateData(uid) {
        const userDocRef = doc(db, `artifacts/${currentAppId}/users`, uid);
        try {
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists() && docSnap.data().role === 'affiliate') {
                currentAffiliateData = docSnap.data();
                updateDashboardVisibility(true); // Show dashboard
            } else {
                currentAffiliateData = null;
                updateDashboardVisibility(false); // Hide dashboard if not an affiliate
                showModal('Access Denied', 'You are not registered as an affiliate. Please contact support or sign up for the program.', 'error');
                // Optionally redirect to a non-affiliate page or signup
            }
        } catch (error) {
            console.error("Error fetching affiliate data:", error);
            currentAffiliateData = null;
            updateDashboardVisibility(false); // Hide dashboard on error
            showModal('Error', 'Failed to load affiliate data. Please try again later.', 'error');
        }
    }

    // --- Function to Update Affiliate Dashboard Visibility and Data ---
    function updateDashboardVisibility(isAffiliateLoggedIn) {
        if (isAffiliateLoggedIn && currentAffiliateData) {
            affiliateDashboardSection.classList.add('active');
            heroCtaBtn.textContent = 'Go to Dashboard';
            heroCtaBtn.onclick = () => {
                affiliateDashboardSection.scrollIntoView({ behavior: 'smooth' });
            };

            // Populate real data from Firestore
            const userId = currentUser.uid; // Use actual UID
            referralLinkSpan.textContent = `mindstack.com/?ref=${userId}`;
            totalClicksSpan.textContent = currentAffiliateData.clicks || 0;
            totalSignupsSpan.textContent = currentAffiliateData.signups || 0;
            totalConversionsSpan.textContent = currentAffiliateData.conversions || 0;
            
            const currentEarnings = currentAffiliateData.pendingEarnings || 0; // Show pending earnings as current balance
            totalEarningsSpan.textContent = currentEarnings.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' });

            // Payout logic
            if (currentEarnings >= MIN_PAYOUT_AMOUNT) {
                requestPayoutBtn.disabled = false;
                payoutMessage.textContent = `You are eligible for payout! Current balance: ${currentEarnings.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}`;
            } else {
                requestPayoutBtn.disabled = true;
                payoutMessage.textContent = `Minimum payout is ${MIN_PAYOUT_AMOUNT.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}. Current balance: ${currentEarnings.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}`;
            }

        } else {
            affiliateDashboardSection.classList.remove('active');
            heroCtaBtn.textContent = 'Log in to Get Started';
            heroCtaBtn.onclick = () => {
                window.location.href = 'login.html'; // Redirect to login page
            };
        }
    }

    // --- "Copy Link" Button Functionality ---
    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', () => {
            const linkToCopy = referralLinkSpan.textContent;
            // Use execCommand for broader compatibility in iframes
            const tempInput = document.createElement('textarea');
            tempInput.value = linkToCopy;
            document.body.appendChild(tempInput);
            tempInput.select();
            try {
                document.execCommand('copy');
                const originalText = copyLinkBtn.textContent;
                copyLinkBtn.textContent = 'Copied!';
                setTimeout(() => {
                    copyLinkBtn.textContent = originalText;
                }, 2000);
                showModal('Success', 'Referral link copied to clipboard!', 'success');
            } catch (err) {
                console.error('Failed to copy link:', err);
                showModal('Error', 'Failed to copy link. Please select and copy it manually.', 'error');
            } finally {
                document.body.removeChild(tempInput);
            }
        });
    }

    // --- FAQ Accordion Logic ---
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling; // Get the accordion-content div
            
            // Toggle 'active' class on header
            header.classList.toggle('active');

            // Toggle 'active' class on content to control max-height
            if (content.classList.contains('active')) {
                content.classList.remove('active');
                content.style.maxHeight = '0';
                content.style.paddingTop = '0';
                content.style.paddingBottom = '0';
            } else {
                // Close all other open accordions before opening this one
                accordionHeaders.forEach(otherHeader => {
                    if (otherHeader !== header && otherHeader.classList.contains('active')) {
                        otherHeader.classList.remove('active');
                        otherHeader.nextElementSibling.classList.remove('active');
                        otherHeader.nextElementSibling.style.maxHeight = '0';
                        otherHeader.nextElementSibling.style.paddingTop = '0';
                        otherHeader.nextElementSibling.style.paddingBottom = '0';
                    }
                });
                content.classList.add('active');
                // Set max-height to scrollHeight for smooth transition, plus current padding
                content.style.maxHeight = content.scrollHeight + 30 + 'px'; // 15px top + 15px bottom padding
                content.style.paddingTop = '15px';
                content.style.paddingBottom = '15px';
            }
        });
    });

    // --- Request Payout Button Functionality ---
    if (requestPayoutBtn) {
        requestPayoutBtn.addEventListener('click', async () => {
            if (!currentUser || !currentAffiliateData || currentAffiliateData.pendingEarnings < MIN_PAYOUT_AMOUNT) {
                showModal('Payout Not Available', 'You do not meet the minimum payout threshold or are not logged in as an affiliate.', 'info');
                return;
            }

            // In a real application, this would send a request to a backend server
            // to process the payout securely. For this demo, we'll simulate it
            // by updating Firestore and showing a success message.
            try {
                const userDocRef = doc(db, `artifacts/${currentAppId}/users`, currentUser.uid);
                await updateDoc(userDocRef, {
                    // Move pending earnings to a 'requestedPayouts' array or similar,
                    // and reset pendingEarnings.
                    // For simplicity, we'll just set pendingEarnings to 0 and add to history.
                    // A real system would have a more robust payout processing flow.
                    pendingEarnings: 0,
                    lastPayoutRequestDate: new Date(),
                    payoutHistory: [...(currentAffiliateData.payoutHistory || []), {
                        date: new Date(),
                        amount: currentAffiliateData.pendingEarnings,
                        type: 'requested',
                        status: 'pending'
                    }]
                });
                showModal('Payout Request Submitted', `Your payout request for ${currentAffiliateData.pendingEarnings.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })} has been submitted! We will process it shortly.`, 'success');
                // Re-fetch data to update dashboard immediately
                await fetchAffiliateData(currentUser.uid); 
            } catch (error) {
                console.error("Error submitting payout request:", error);
                showModal('Payout Request Failed', `There was an error submitting your payout request: ${error.message}`, 'error');
            }
        });
    }

    // --- Modals for Tips & Tools Functionality ---

    // Social Media Captions Modal
    function showCaptionsModal() {
        if (socialMediaCaptionsModalOverlay) {
            socialMediaCaptionsModalOverlay.classList.add('active');
            document.body.classList.add('no-scroll');
        }
    }
    function hideCaptionsModal() {
        if (socialMediaCaptionsModalOverlay) {
            socialMediaCaptionsModalOverlay.classList.remove('active');
            document.body.classList.remove('no-scroll');
        }
    }
    if (viewCaptionsBtn) viewCaptionsBtn.addEventListener('click', showCaptionsModal);
    if (closeCaptionsModalBtn) closeCaptionsModalBtn.addEventListener('click', hideCaptionsModal);
    if (captionsModalCloseBtnBottom) captionsModalCloseBtnBottom.addEventListener('click', hideCaptionsModal);
    if (socialMediaCaptionsModalOverlay) {
        socialMediaCaptionsModalOverlay.addEventListener('click', (e) => {
            if (e.target === socialMediaCaptionsModalOverlay) {
                hideCaptionsModal();
            }
        });
    }
    // Copy individual captions
    copyCaptionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const captionText = btn.previousElementSibling.textContent;
            const tempInput = document.createElement('textarea');
            tempInput.value = captionText;
            document.body.appendChild(tempInput);
            tempInput.select();
            try {
                document.execCommand('copy');
                const originalText = btn.textContent;
                btn.textContent = 'Copied!';
                setTimeout(() => {
                    btn.textContent = originalText;
                }, 2000);
                showModal('Success', 'Caption copied to clipboard!', 'success');
            } catch (err) {
                console.error('Failed to copy caption:', err);
                showModal('Error', 'Failed to copy caption. Please select and copy it manually.', 'error');
            } finally {
                document.body.removeChild(tempInput);
            }
        });
    });


    // Banners & Logos Modal
    function showBannersModal() {
        if (bannersLogosModalOverlay) {
            bannersLogosModalOverlay.classList.add('active');
            document.body.classList.add('no-scroll');
        }
    }
    function hideBannersModal() {
        if (bannersLogosModalOverlay) {
            bannersLogosModalOverlay.classList.remove('active');
            document.body.classList.remove('no-scroll');
        }
    }
    if (downloadAssetsBtn) downloadAssetsBtn.addEventListener('click', showBannersModal);
    if (closeBannersModalBtn) closeBannersModalBtn.addEventListener('click', hideBannersModal);
    if (bannersModalCloseBtnBottom) bannersModalCloseBtnBottom.addEventListener('click', hideBannersModal);
    if (bannersLogosModalOverlay) {
        bannersLogosModalOverlay.addEventListener('click', (e) => {
            if (e.target === bannersLogosModalOverlay) {
                hideBannersModal();
            }
        });
    }

    // Email Templates Modal
    function showEmailTemplatesModal() {
        if (emailTemplatesModalOverlay) {
            emailTemplatesModalOverlay.classList.add('active');
            document.body.classList.add('no-scroll');
        }
    }
    function hideEmailTemplatesModal() {
        if (emailTemplatesModalOverlay) {
            emailTemplatesModalOverlay.classList.remove('active');
            document.body.classList.remove('no-scroll');
        }
    }
    if (getTemplatesBtn) getTemplatesBtn.addEventListener('click', showEmailTemplatesModal);
    if (closeEmailTemplatesModalBtn) closeEmailTemplatesModalBtn.addEventListener('click', hideEmailTemplatesModal);
    if (emailTemplatesModalCloseBtnBottom) emailTemplatesModalCloseBtnBottom.addEventListener('click', hideEmailTemplatesModal);
    if (emailTemplatesModalOverlay) {
        emailTemplatesModalOverlay.addEventListener('click', (e) => {
            if (e.target === emailTemplatesModalOverlay) {
                hideEmailTemplatesModal();
            }
        });
    }
    // Copy individual email templates
    copyEmailBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const emailText = btn.previousElementSibling.textContent; // Gets content from <pre>
            const tempInput = document.createElement('textarea');
            tempInput.value = emailText;
            document.body.appendChild(tempInput);
            tempInput.select();
            try {
                document.execCommand('copy');
                const originalText = btn.textContent;
                btn.textContent = 'Copied!';
                setTimeout(() => {
                    btn.textContent = originalText;
                }, 2000);
                showModal('Success', 'Email template copied to clipboard!', 'success');
            } catch (err) {
                console.error('Failed to copy email template:', err);
                showModal('Error', 'Failed to copy email template. Please select and copy it manually.', 'error');
            } finally {
                document.body.removeChild(tempInput);
            }
        });
    });


    // --- Initial Load ---
    // The initial dashboard visibility will now be handled by onAuthStateChanged
    // and fetchAffiliateData, ensuring it only shows for authenticated affiliates.
});
