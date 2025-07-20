// mindstack/assets/js/dashboard.js

// Import Firebase modules
import { 
    auth, 
    db, 
    doc, 
    getDoc, 
    updateDoc, 
    collection, 
    getDocs, 
    onSnapshot, // For real-time updates on user data
    signOut, 
    onAuthStateChanged,
    sendPasswordResetEmail, // For account settings password reset
    firebaseConfig, // To get projectId for Firestore paths
    serverTimestamp, // For setting timestamps
    arrayUnion,      // For adding to arrays (e.g., payment history)
    increment        // For incrementing numbers (e.g., earnings, if applicable)
} from './firebase.js'; // Ensure firebase.js exports these

document.addEventListener('DOMContentLoaded', async () => {
    // --- Global Variables ---
    let currentUser = null;
    let currentUserId = null;
    let currentUserRole = 'student'; // Default role
    let inactivityTimer; 
    const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

    // Determine the correct appId for the Firestore path
    const currentAppId = typeof __app_id !== 'undefined' ? __app_id : firebaseConfig.projectId;
    console.log("dashboard.js: Using currentAppId:", currentAppId);

    // Define Firestore collection/document references
    const usersCollectionRef = collection(db, `artifacts/${currentAppId}/users`); // Corrected to use collection from import
    const settingsDocRef = doc(db, `artifacts/${currentAppId}/public/data/settings/platform_settings`);


    // --- Dashboard UI Elements ---
    const sidebar = document.getElementById('sidebar');
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');
    const overlay = document.createElement('div'); // Mobile sidebar overlay
    overlay.classList.add('overlay');
    document.body.appendChild(overlay);

    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    const logoutBtn = document.getElementById('logoutBtn'); 

    // Logout Confirmation Modal Elements
    const logoutModalOverlay = document.getElementById('logoutModalOverlay');
    const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
    const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
    const cancelLogoutBtnTop = document.querySelector('#logoutModalOverlay .close-modal-btn'); 

    // Generic Message Modal Elements
    const messageModalOverlay = document.getElementById('messageModalOverlay');
    const messageModalTitle = document.getElementById('messageModalTitle');
    const messageModalText = document.getElementById('messageModalText');
    const messageModalCloseBtn = document.getElementById('messageModalCloseBtn'); // OK button
    const closeMessageModalBtnTop = document.querySelector('#messageModalOverlay .close-modal-btn'); // Top close button for generic message modal

    // Main Content Sections (mapped to data-section attributes)
    const contentSections = {
        'dashboard-overview-content': document.getElementById('dashboard-overview-content'),
        'my-courses-content': document.getElementById('my-courses-content'),
        'progress-content': document.getElementById('progress-content'),
        'affiliate-tools-content': document.getElementById('affiliate-tools-content'),
        'account-settings-content': document.getElementById('account-settings-content')
    };

    // Dashboard Overview Elements
    const userNameSpan = document.getElementById('userName');
    const welcomeMessageP = document.getElementById('welcomeMessage');
    const coursesEnrolledSpan = document.getElementById('coursesEnrolled');
    const certificatesEarnedSpan = document.getElementById('certificatesEarned');
    const completionRateSpan = document.getElementById('completionRate');
    const timeSpentSpan = document.getElementById('timeSpent');
    const enrolledCoursesContainer = document.getElementById('enrolledCoursesContainer');
    const noEnrolledCoursesMessage = document.getElementById('noEnrolledCoursesMessage');
    const notificationsList = document.getElementById('notificationsList');

    // NEW: Subscription Section Elements
    const currentPlanSpan = document.getElementById('currentPlan');
    const subscriptionEndDateDisplay = document.getElementById('subscriptionEndDateDisplay');
    const subscriptionEndDateSpan = document.getElementById('subscriptionEndDate');
    const upgradeSection = document.getElementById('upgradeSection');
    const premiumPriceDisplay = document.getElementById('premiumPriceDisplay');
    const upgradeToPremiumBtn = document.getElementById('upgradeToPremiumBtn');
    const upgradeMessageContainer = document.getElementById('upgradeMessage');
    const premiumFeaturesInfo = document.getElementById('premiumFeaturesInfo');
    const manageSubscriptionBtn = document.getElementById('manageSubscriptionBtn');


    // My Courses Elements
    const allAvailableCoursesContainer = document.getElementById('allAvailableCoursesContainer');
    const noAvailableCoursesMessage = document.getElementById('noAvailableCoursesMessage');

    // Affiliate Tools Elements
    const affiliateToolsNavItem = document.getElementById('affiliateToolsNavItem');
    const affiliateLinkSpan = document.getElementById('affiliateLink');
    const copyAffiliateLinkBtn = document.getElementById('copyAffiliateLinkBtn');
    const affiliateReferralsSpan = document.getElementById('affiliateReferrals');
    const affiliateEarningsSpan = document.getElementById('affiliateEarnings');

    // Account Settings Elements
    const accountSettingsForm = document.getElementById('accountSettingsForm');
    const settingsFullNameInput = document.getElementById('settingsFullName');
    const settingsEmailInput = document.getElementById('settingsEmail');
    const settingsRoleSpan = document.getElementById('settingsRole'); // New element to display role
    const saveAccountSettingsBtn = document.getElementById('saveAccountSettingsBtn');
    const resetPasswordBtn = document.getElementById('resetPasswordBtn');
    const accountSettingsMessageContainer = document.getElementById('accountSettingsMessage');


    // --- Helper Function for Form Messages ---
    function showFormMessage(container, message, type) {
        if (container) {
            container.textContent = message;
            container.className = 'message-container active'; 
            container.classList.add(type); 
            setTimeout(() => {
                container.classList.remove('active', 'error', 'success', 'info'); // Added 'info'
                container.textContent = '';
            }, 3000); 
        } else {
            console.warn("Message container not found:", container);
        }
    }

    // --- Session Timeout Logic ---
    function resetTimer() {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(logoutUser, INACTIVITY_TIMEOUT_MS);
    }

    async function logoutUser() {
        showModal('Session Expired', 'Your session has expired due to inactivity. Please log in again.');
        try {
            await signOut(auth);
            console.log("User logged out due to inactivity.");
            // onAuthStateChanged will handle redirection
        } catch (error) {
            console.error("Error logging out:", error);
        }
    }

    ['click', 'mousemove', 'keydown', 'scroll'].forEach(evt =>
        document.addEventListener(evt, resetTimer)
    );

    // --- Firebase Auth State and User Data Fetching ---
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            currentUserId = user.uid;
            console.log("User Dashboard: User logged in:", user.email || user.uid);

            // Fetch user profile from Firestore using onSnapshot for real-time updates
            const userDocRef = doc(db, `artifacts/${currentAppId}/users`, user.uid);
            onSnapshot(userDocRef, async (docSnap) => { // Made callback async
                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    currentUserRole = userData.role || 'student';
                    const fullName = userData.fullName || user.email; // Fallback to email if no full name
                    const isSuspended = userData.isSuspended || false; // Corrected from 'suspended' to 'isSuspended'

                    if (isSuspended) {
                        console.warn("User is suspended. Logging out.");
                        showModal('Account Suspended', 'Your account has been suspended. Please contact support.', 'error');
                        signOut(auth); // Force logout if suspended
                        return;
                    }

                    // --- Role-based Redirection (Crucial for Admin separation) ---
                    if (currentUserRole === 'admin') {
                        console.log("Admin user detected. Redirecting to admin dashboard.");
                        window.location.href = 'admin-dashboard.html';
                        return; // Stop further execution for admin
                    }

                    // Update UI with user data for non-admin roles
                    if (userNameSpan) userNameSpan.textContent = fullName.split(' ')[0]; // Show first name
                    if (welcomeMessageP) welcomeMessageP.textContent = `Let’s continue your learning journey, ${fullName.split(' ')[0]}.`;

                    // Populate Account Settings form
                    if (settingsFullNameInput) settingsFullNameInput.value = fullName;
                    if (settingsEmailInput) settingsEmailInput.value = user.email;
                    if (settingsRoleSpan) settingsRoleSpan.textContent = currentUserRole.charAt(0).toUpperCase() + currentUserRole.slice(1); // Capitalize first letter

                    // Show/hide Affiliate Tools based on role
                    if (affiliateToolsNavItem) {
                        if (currentUserRole === 'affiliate') {
                            affiliateToolsNavItem.style.display = 'list-item';
                            populateAffiliateTools(user.uid); // Load affiliate specific data
                        } else {
                            affiliateToolsNavItem.style.display = 'none';
                        }
                    }

                    // Load dashboard content and subscription status
                    await loadDashboardContent(); // Ensure this is awaited
                    displaySubscriptionStatus(userData); // Pass userData to display subscription

                    resetTimer(); // Reset inactivity timer on activity
                } else {
                    console.warn("User document not found in Firestore for UID:", user.uid);
                    // Create a basic user profile if it doesn't exist
                    await setDoc(userDocRef, { 
                        fullName: user.email, // Use email as fallback name
                        email: user.email, 
                        role: 'student', 
                        isPremium: false, // Default to not premium
                        createdAt: serverTimestamp(), // Use serverTimestamp
                        updatedAt: serverTimestamp(), // Use serverTimestamp
                        isSuspended: false 
                    }, { merge: true });
                    console.log("Basic user document created for new login.");
                    showModal('Welcome!', 'Your profile has been created. Enjoy your free courses!', 'info');
                    // onSnapshot listener will re-trigger with the new data
                }
            }, (error) => {
                console.error("Error fetching user profile from Firestore:", error);
                showModal('Error', 'Failed to load user profile. Please try again.', 'error');
                signOut(auth); // Log out on profile fetch error
            });

        } else {
            currentUser = null;
            currentUserId = null;
            currentUserRole = 'student';
            console.log("User Dashboard: No user logged in. Redirecting to login.");
            window.location.href = 'login.html'; // Redirect to general login page
        }
    });

    // --- Sidebar Functions ---
    function openSidebar() {
        if (sidebar) {
            sidebar.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden'; 
        }
    }

    function closeSidebar() {
        if (sidebar) {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = ''; 
        }
    }

    // --- Modal Functions (Generic Message Modal) ---
    function showModal(title, message, type = 'info') {
        if (messageModalTitle) messageModalTitle.textContent = title;
        if (messageModalText) messageModalText.textContent = message;
        if (messageModalOverlay) {
            messageModalOverlay.classList.add('active');
            messageModalOverlay.className = `modal-overlay active ${type}`; 
            document.body.style.overflow = 'hidden';
        }
    }

    function hideModal() {
        if (messageModalOverlay) {
            messageModalOverlay.classList.remove('active', 'success', 'error', 'info'); // Added 'info'
            document.body.classList.remove('no-scroll'); // Always remove no-scroll when a modal is hidden
        }
    }

    if (messageModalCloseBtn) messageModalCloseBtn.addEventListener('click', hideModal); // OK button
    if (closeMessageModalBtnTop) closeMessageModalBtnTop.addEventListener('click', hideModal); // Top close button for generic message modal
    if (messageModalOverlay) {
        messageModalOverlay.addEventListener('click', (e) => {
            if (e.target === messageModalOverlay) {
                hideModal();
            }
        });
    }

    // --- Logout Confirmation Modal Functions ---
    function showLogoutModal() {
        if (logoutModalOverlay) {
            logoutModalOverlay.classList.add('active');
            document.body.style.overflow = 'hidden'; 
        }
    }

    function hideLogoutModal() {
        if (logoutModalOverlay) {
            logoutModalOverlay.classList.remove('active');
            document.body.classList.remove('no-scroll'); // Always remove no-scroll when a modal is hidden
        }
    }

    // --- Event Listeners ---

    // Mobile sidebar toggle
    if (hamburgerMenu) hamburgerMenu.addEventListener('click', openSidebar);
    if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar); 

    // Navigation Item Click Handlers
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault(); 
            // Check if it's the logout button, handle separately
            if (e.currentTarget.id === 'logoutBtn') {
                showLogoutModal(); 
                return; 
            }

            // Remove 'active' class from all nav items
            navItems.forEach(nav => nav.classList.remove('active'));
            // Add 'active' class to the clicked item
            item.classList.add('active');

            const targetSectionId = item.dataset.section;
            if (targetSectionId && contentSections[targetSectionId]) {
                // Hide all content sections
                Object.values(contentSections).forEach(section => {
                    if (section) section.style.display = 'none';
                });
                // Show the target section
                contentSections[targetSectionId].style.display = 'block';
                console.log(`Navigating to: ${targetSectionId}`);

                // Update header welcome message based on section
                if (welcomeMessageP) {
                    const firstName = userNameSpan.textContent; // Get the already loaded first name
                    switch (targetSectionId) {
                        case 'dashboard-overview-content':
                            welcomeMessageP.textContent = `Let’s continue your learning journey, ${firstName}.`;
                            break;
                        case 'my-courses-content':
                            welcomeMessageP.textContent = 'Explore all courses available on MindStack.';
                            break;
                        case 'progress-content':
                            welcomeMessageP.textContent = 'Track your learning journey and achievements.';
                            break;
                        case 'affiliate-tools-content':
                            welcomeMessageP.textContent = 'Access your affiliate resources and earnings.';
                            break;
                        case 'account-settings-content':
                            welcomeMessageP.textContent = 'Manage your profile, password, and preferences.';
                            break;
                        default:
                            welcomeMessageP.textContent = 'Welcome to your dashboard.';
                    }
                }
            }

            // Close sidebar if on mobile
            if (window.innerWidth <= 768) {
                closeSidebar();
            }
        });
    });

    // Logout Button Click Handler
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault(); 
            showLogoutModal(); 
        });
    }

    // Confirm Logout Button Click Handler
    if (confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener('click', async () => {
            hideLogoutModal(); 
            try {
                await signOut(auth);
                console.log("User logged out successfully.");
                // onAuthStateChanged will handle redirection to login.html
            } catch (error) {
                console.error("Error logging out:", error);
                showModal('Logout Failed', 'There was an error logging out. Please try again.', 'error');
            }
        });
    }

    // Cancel Logout Button Click Handler
    if (cancelLogoutBtn) {
        cancelLogoutBtn.addEventListener('click', () => {
            hideLogoutModal(); 
        });
    }
    if (cancelLogoutBtnTop) { // Top close button for logout modal
        cancelLogoutBtnTop.addEventListener('click', hideLogoutModal);
    }

    // --- Dynamic Content Loading Functions ---

    // Load main dashboard overview data
    async function loadDashboardContent() {
        // Simulated Stats (for now) - these would come from user's progress data in a real app
        if (coursesEnrolledSpan) coursesEnrolledSpan.textContent = '5';
        if (certificatesEarnedSpan) certificatesEarnedSpan.textContent = '2';
        if (completionRateSpan) completionRateSpan.textContent = '60%';
        if (timeSpentSpan) timeSpentSpan.textContent = '3hr 20min';

        // Populate "Your Courses" (Dashboard)
        await populateCoursesInContainer(enrolledCoursesContainer, noEnrolledCoursesMessage, true); 

        // Populate "All Available Courses" (My Courses section)
        await populateCoursesInContainer(allAvailableCoursesContainer, noAvailableCoursesMessage, false); 
    }

    // Generic function to populate course cards in a given container
    async function populateCoursesInContainer(container, noMessageElement, showContinueButton) {
        if (!container) return;
        container.innerHTML = ''; // Clear existing content

        try {
            const coursesCollectionRef = collection(db, `artifacts/${currentAppId}/public/data/courses`);
            const querySnapshot = await getDocs(coursesCollectionRef);

            if (querySnapshot.empty) {
                if (noMessageElement) noMessageElement.style.display = 'block';
                return;
            }
            if (noMessageElement) noMessageElement.style.display = 'none';

            querySnapshot.forEach(doc => {
                const course = { id: doc.id, ...doc.data() }; // Include doc.id
                const courseCard = document.createElement('div');
                courseCard.classList.add('course-card');
                
                // Simulate progress only if showing continue button
                const simulatedProgress = showContinueButton ? Math.floor(Math.random() * 100) : null; 

                courseCard.innerHTML = `
                    <div class="course-thumbnail" style="background-image: url('${course.thumbnailUrl || 'https://placehold.co/300x180/E0F2F7/0ED2F7?text=Course'}');"></div>
                    <div class="course-info">
                        <h3 class="course-title">${course.title || 'Untitled Course'}</h3>
                        <p class="course-instructor">${course.instructor?.name || 'N/A'}</p>
                        <p class="course-description">${course.shortDescription || 'No description available.'}</p>
                        ${showContinueButton ? `
                            <div class="progress-bar-container">
                                <div class="progress-bar" style="width: ${simulatedProgress}%;"></div>
                            </div>
                            <span class="progress-text">${simulatedProgress}% Complete</span>
                            <button class="btn btn-primary continue-btn" data-course-id="${course.id}">Continue</button>
                        ` : `
                            <button class="btn btn-primary view-course-btn" data-course-id="${course.id}">View Course</button>
                        `}
                    </div>
                `;
                container.appendChild(courseCard);

                // Add event listener to the appropriate button
                if (showContinueButton) {
                    courseCard.querySelector('.continue-btn').addEventListener('click', (e) => {
                        const courseId = e.target.dataset.courseId;
                        window.location.href = `course-details.html?id=${courseId}`;
                    });
                } else {
                    courseCard.querySelector('.view-course-btn').addEventListener('click', (e) => {
                        const courseId = e.target.dataset.courseId;
                        window.location.href = `course-details.html?id=${courseId}`;
                    });
                }
            });
        } catch (error) {
            console.error("Error fetching courses:", error);
            showModal('Error', 'Failed to load courses. Please try again.', 'error');
        }
    }

    // NEW: Subscription Status Display Logic
    async function displaySubscriptionStatus(userData) {
        if (userData.isPremium) {
            currentPlanSpan.textContent = 'Premium';
            currentPlanSpan.style.color = 'var(--color-primary)'; // Highlight premium
            upgradeSection.style.display = 'none';
            premiumFeaturesInfo.style.display = 'block';

            // Display subscription end date if available
            if (userData.subscriptionEndDate) {
                let endDate = 'N/A';
                try {
                    const dateObj = typeof userData.subscriptionEndDate.toDate === 'function' ? userData.subscriptionEndDate.toDate() : new Date(userData.subscriptionEndDate);
                    if (!isNaN(dateObj.getTime())) {
                        endDate = dateObj.toLocaleDateString();
                    }
                } catch (e) {
                    console.warn("Could not parse subscriptionEndDate:", userData.subscriptionEndDate, e);
                    endDate = 'Invalid Date';
                }
                subscriptionEndDateSpan.textContent = endDate;
                subscriptionEndDateDisplay.style.display = 'block';
            } else {
                subscriptionEndDateDisplay.style.display = 'none';
            }

        } else {
            currentPlanSpan.textContent = 'Free';
            currentPlanSpan.style.color = 'var(--color-text-secondary)';
            upgradeSection.style.display = 'block';
            premiumFeaturesInfo.style.display = 'none';
            subscriptionEndDateDisplay.style.display = 'none';
            await fetchAndDisplayPremiumPrice(); // Fetch price for upgrade section
        }
    }

    // NEW: Fetch and Display Premium Price
    async function fetchAndDisplayPremiumPrice() {
        if (premiumPriceDisplay) {
            premiumPriceDisplay.textContent = 'Loading...';
            try {
                const docSnap = await getDoc(settingsDocRef);
                if (docSnap.exists() && docSnap.data().premiumPrice !== undefined) {
                    const premiumPrice = docSnap.data().premiumPrice;
                    premiumPriceDisplay.textContent = premiumPrice.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' });
                } else {
                    premiumPriceDisplay.textContent = 'Price not set';
                    console.warn("Premium price not found in Firestore settings.");
                }
            } catch (error) {
                console.error("Error fetching premium price for display:", error);
                premiumPriceDisplay.textContent = 'Error';
            }
        }
    }

    // NEW: Upgrade to Premium Logic (Simulated Payment)
    if (upgradeToPremiumBtn) {
        upgradeToPremiumBtn.addEventListener('click', async () => {
            if (!currentUser) {
                showModal('Authentication Required', 'Please log in to upgrade your plan.', 'info');
                return;
            }

            upgradeToPremiumBtn.textContent = 'Processing...';
            upgradeToPremiumBtn.disabled = true;
            showFormMessage(upgradeMessageContainer, 'Initiating upgrade...', 'info');

            try {
                const settingsSnap = await getDoc(settingsDocRef);
                const premiumPrice = settingsSnap.exists() ? settingsSnap.data().premiumPrice : 0;

                if (premiumPrice === 0 || premiumPrice === undefined) {
                    showFormMessage(upgradeMessageContainer, 'Premium price is not set by admin. Cannot upgrade.', 'error');
                    showModal('Upgrade Failed', 'Premium price is not configured. Please contact support.', 'error');
                    return;
                }

                // --- SIMULATED PAYMENT SUCCESS ---
                // In a real application, you would integrate Paystack here.
                // This block would contain the Paystack initialization and transaction verification.
                // For now, we simulate a successful payment.
                console.log(`Simulating payment of ${premiumPrice} for premium upgrade.`);
                await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay

                // Calculate subscription end date (e.g., 1 month from now)
                const now = new Date();
                const oneMonthLater = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

                // Update user's Firestore document
                const userDocRef = doc(db, `artifacts/${currentAppId}/users`, currentUser.uid);
                await updateDoc(userDocRef, {
                    isPremium: true,
                    subscriptionStartDate: serverTimestamp(),
                    subscriptionEndDate: oneMonthLater, // Store as Date object, Firestore will convert
                    lastPaymentAmount: premiumPrice,
                    paymentHistory: arrayUnion({
                        date: serverTimestamp(),
                        amount: premiumPrice,
                        plan: 'Premium',
                        status: 'completed',
                        transactionId: `SIM_TXN_${Date.now()}` // Simulated transaction ID
                    }),
                    updatedAt: serverTimestamp()
                });

                showFormMessage(upgradeMessageContainer, 'Upgrade successful! Welcome to Premium!', 'success');
                showModal('Upgrade Successful!', 'You are now a Premium member. Enjoy unlimited access!', 'success');
                
                // onSnapshot listener on userDocRef will automatically update the UI
                // so no need to manually re-fetch and call displaySubscriptionStatus here.

            } catch (error) {
                console.error("Error during premium upgrade simulation:", error);
                showFormMessage(upgradeMessageContainer, `Upgrade failed: ${error.message}`, 'error');
                showModal('Upgrade Failed', `There was an error upgrading your plan: ${error.message}`, 'error');
            } finally {
                upgradeToPremiumBtn.textContent = 'Upgrade to Premium';
                upgradeToPremiumBtn.disabled = false;
            }
        });
    }

    // NEW: Manage Subscription Button (Placeholder)
    if (manageSubscriptionBtn) {
        manageSubscriptionBtn.addEventListener('click', () => {
            showModal('Manage Subscription', 'This section will allow you to manage your Premium subscription (e.g., cancel, renew).', 'info');
        });
    }


    // Populate Affiliate Tools Section
    async function populateAffiliateTools(uid) {
        if (currentUserRole !== 'affiliate') return; // Only for affiliates

        // Simulate affiliate link generation
        if (affiliateLinkSpan) affiliateLinkSpan.textContent = `mindstack.com/refer?ref=${uid.substring(0, 8)}`; // Shortened UID

        // Simulated affiliate stats (these would come from backend in a real app)
        // Fetch actual affiliate earnings from user document
        const userDocRef = doc(db, `artifacts/${currentAppId}/users`, uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
            const userData = userSnap.data();
            if (affiliateReferralsSpan) affiliateReferralsSpan.textContent = userData.referralsCount || 0; 
            if (affiliateEarningsSpan) affiliateEarningsSpan.textContent = (userData.totalEarnings || 0).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' }); 
        } else {
            if (affiliateReferralsSpan) affiliateReferralsSpan.textContent = '0';
            if (affiliateEarningsSpan) affiliateEarningsSpan.textContent = '₦0';
        }


        if (copyAffiliateLinkBtn) {
            copyAffiliateLinkBtn.addEventListener('click', () => {
                const linkToCopy = affiliateLinkSpan.textContent;
                // Use document.execCommand('copy') for better iframe compatibility
                const tempInput = document.createElement('textarea');
                tempInput.value = linkToCopy;
                document.body.appendChild(tempInput);
                tempInput.select();
                try {
                    document.execCommand('copy');
                    showModal('Copied!', 'Affiliate link copied to clipboard.', 'success');
                } catch (err) {
                    console.error('Failed to copy text: ', err);
                    showModal('Error', 'Failed to copy link. Please copy manually.', 'error');
                }
                document.body.removeChild(tempInput);
            });
        }
    }

    // Account Settings Form Submission
    if (accountSettingsForm) {
        accountSettingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentUser || !currentUserId) {
                showFormMessage(accountSettingsMessageContainer, 'You must be logged in to save settings.', 'error');
                return;
            }

            const newFullName = settingsFullNameInput.value.trim();
            if (!newFullName) {
                showFormMessage(accountSettingsMessageContainer, 'Full Name cannot be empty.', 'error');
                return;
            }

            const userDocRef = doc(db, `artifacts/${currentAppId}/users`, currentUserId);
            try {
                await updateDoc(userDocRef, {
                    fullName: newFullName,
                    updatedAt: serverTimestamp() // Use serverTimestamp
                });
                showFormMessage(accountSettingsMessageContainer, 'Profile updated successfully!', 'success');
                // The onSnapshot listener will update the UI (userNameSpan, welcomeMessageP) automatically
            } catch (error) {
                console.error("Error updating profile:", error);
                showFormMessage(accountSettingsMessageContainer, `Failed to update profile: ${error.message}`, 'error');
            }
        });
    }

    // Reset Password Button
    if (resetPasswordBtn) {
        resetPasswordBtn.addEventListener('click', async () => {
            if (!currentUser || !currentUser.email) {
                showModal('Error', 'You must be logged in with an email to reset your password.', 'error');
                return;
            }
            try {
                await sendPasswordResetEmail(auth, currentUser.email);
                showModal('Password Reset', `A password reset link has been sent to ${currentUser.email}. Check your inbox or spam folder.`, 'success');
            } catch (error) {
                console.error("Error sending password reset email:", error);
                let errorMessage = 'Failed to send password reset email. Please try again.';
                if (error.code === 'auth/user-not-found') {
                    errorMessage = 'No account found with this email address.';
                }
                showModal('Error', errorMessage, 'error');
            }
        });
    }
});
