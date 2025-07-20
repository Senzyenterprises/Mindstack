// mindstack/assets/js/admin-dashboard.js

// Import Firebase modules
import { 
    db, 
    auth, 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy, 
    onSnapshot, 
    signInWithCustomToken, 
    signInAnonymously, 
    signOut, 
    onAuthStateChanged,
    firebaseConfig,
    serverTimestamp, // Corrected: Import serverTimestamp directly
    arrayUnion, // Import arrayUnion for payout history
    increment // Import increment for earnings
} from './firebase.js'; // Assuming firebase.js re-exports these from 'firebase/firestore'

document.addEventListener('DOMContentLoaded', async () => {
    // --- Global Variables (Declared at the top for proper scope and initialization) ---
    let currentUser = null;
    let currentUserId = null;
    let isAdmin = false; 
    let inactivityTimer; 
    const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

    // Determine the correct appId for the Firestore path
    const currentAppId = typeof __app_id !== 'undefined' ? __app_id : firebaseConfig.projectId;
    console.log("admin-dashboard.js: Using currentAppId:", currentAppId);

    // Define Firestore collection/document references
    const coursesCollectionRef = collection(db, `artifacts/${currentAppId}/public/data/courses`);
    const usersCollectionRef = collection(db, `artifacts/${currentAppId}/users`);
    const settingsDocRef = doc(db, `artifacts/${currentAppId}/public/data/settings/platform_settings`);

    // --- UI Elements ---
    const adminSidebar = document.getElementById('adminSidebar');
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    const contentSections = document.querySelectorAll('.content-section');
    const logoutBtn = document.getElementById('logoutBtn');

    // Logout Modal Elements
    const logoutModalOverlay = document.getElementById('logoutModalOverlay');
    const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
    const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
    const cancelLogoutBtnTop = document.getElementById('cancelLogoutBtnTop'); // Top close button for logout modal

    // Generic Message Modal Elements
    const messageModalOverlay = document.getElementById('messageModalOverlay');
    const messageModalTitle = document.getElementById('messageModalTitle');
    const messageModalText = document.getElementById('messageModalText');
    const messageModalCloseBtn = document.getElementById('messageModalCloseBtn'); // OK button
    const closeMessageModalBtnTop = document.getElementById('closeMessageModalBtnTop'); // Top close button for generic modal

    // Dashboard Overview Elements
    const totalUsersSpan = document.getElementById('totalUsers');
    const totalCoursesSpan = document.getElementById('totalCourses');
    const totalAffiliatesSpan = document.getElementById('totalAffiliates');
    const totalRevenueSpan = document.getElementById('totalRevenue');
    const recentActivityList = document.getElementById('recentActivityList');

    // Add Course Form Elements
    const addCourseForm = document.getElementById('addCourseForm');
    const addCourseMessageContainer = document.getElementById('addCourseMessage');
    const addWhatYoullLearnItemBtn = document.getElementById('addWhatYoullLearnItem');
    const whatYoullLearnContainer = document.getElementById('whatYoullLearnContainer');
    const addWhoThisIsForItemBtn = document.getElementById('addWhoThisIsForItem');
    const whoThisIsForContainer = document.getElementById('whoThisIsForContainer');
    const addPrerequisiteItemBtn = document.getElementById('addPrerequisiteItem');
    const prerequisitesContainer = document.getElementById('prerequisitesContainer');
    const addDownloadItemBtn = document.getElementById('addDownloadItem');
    const downloadsContainer = document.getElementById('downloadsContainer');
    const addModuleBtn = document.getElementById('addModuleBtn');
    const curriculumContainer = document.getElementById('curriculumContainer');
    const addCourseTitleInput = document.getElementById('addCourseTitle');
    const addInstructorNameInput = document.getElementById('addInstructorName');
    const addInstructorBioInput = document.getElementById('addInstructorBio');
    const addInstructorAvatarUrlInput = document.getElementById('addInstructorAvatarUrl');
    const addCourseCategorySelect = document.getElementById('addCourseCategory');
    const addCourseAccessTypeSelect = document.getElementById('addCourseAccessType');
    const addCourseThumbnailInput = document.getElementById('addCourseThumbnail');
    const addIntroVideoInput = document.getElementById('addIntroVideo');
    const addShortDescriptionInput = document.getElementById('addShortDescription');
    const addLongDescriptionInput = document.getElementById('addLongDescription');
    const addCourseDurationInput = document.getElementById('addCourseDuration');
    const addCourseLevelSelect = document.getElementById('addCourseLevel');
    const addLessonsCountInput = document.getElementById('addLessonsCount');
    const addIsFeaturedCheckbox = document.getElementById('addIsFeatured');


    // Manage Courses Table Elements
    const coursesTableBody = document.querySelector('#coursesTable tbody');
    const noCoursesMessage = document.getElementById('noCoursesMessage');

    // Edit Course Modal Elements
    const editCourseModalOverlay = document.getElementById('editCourseModalOverlay');
    const closeEditCourseModalBtn = document.getElementById('closeEditCourseModalBtn'); // Top close button for edit course modal
    const editCourseForm = document.getElementById('editCourseForm');
    const editCourseIdInput = document.getElementById('editCourseId');
    const editCourseMessageContainer = document.getElementById('editCourseMessage');
    const editAddWhatYoullLearnItemBtn = document.getElementById('editAddWhatYoullLearnItem');
    const editWhatYoullLearnContainer = document.getElementById('editWhatYoullLearnContainer');
    const editAddWhoThisIsForItemBtn = document.getElementById('editAddWhoThisIsForItem'); 
    const editWhoThisIsForContainer = document.getElementById('editWhoThisIsForContainer');
    const editAddPrerequisiteItemBtn = document.getElementById('editAddPrerequisiteItem');
    const editPrerequisitesContainer = document.getElementById('editPrerequisitesContainer');
    const editAddDownloadItemBtn = document.getElementById('editAddDownloadItem');
    const editDownloadsContainer = document.getElementById('editDownloadsContainer');
    const editAddModuleBtn = document.getElementById('editAddModuleBtn');
    const editCurriculumContainer = document.getElementById('editCurriculumContainer');
    const editCourseTitleInput = document.getElementById('editCourseTitle');
    const editInstructorNameInput = document.getElementById('editInstructorName');
    const editInstructorBioInput = document.getElementById('editInstructorBio');
    const editInstructorAvatarUrlInput = document.getElementById('editInstructorAvatarUrl');
    const editCourseCategorySelect = document.getElementById('editCourseCategory');
    const editCourseAccessTypeSelect = document.getElementById('editCourseAccessType');
    const editCourseThumbnailInput = document.getElementById('editCourseThumbnail');
    const editIntroVideoInput = document.getElementById('editIntroVideo');
    const editShortDescriptionInput = document.getElementById('editShortDescription');
    const editLongDescriptionInput = document.getElementById('editLongDescription');
    const editCourseDurationInput = document.getElementById('editCourseDuration');
    const editCourseLevelSelect = document.getElementById('editCourseLevel');
    const editLessonsCountInput = document.getElementById('editLessonsCount');
    const editIsFeaturedCheckbox = document.getElementById('editIsFeatured');


    // Delete Confirmation Modal Elements
    const deleteConfirmModalOverlay = document.getElementById('deleteConfirmModalOverlay');
    const deleteCourseTitleSpan = document.getElementById('deleteCourseTitle');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const cancelDeleteBtnTopDelete = document.getElementById('cancelDeleteBtnTop'); // Top close button for delete modal

    // Manage Users Table Elements
    const usersTableBody = document.querySelector('#usersTable tbody'); 
    const noUsersMessage = document.getElementById('noUsersMessage'); 

    // User Details Modal Elements (New)
    const viewUserModalOverlay = document.getElementById('viewUserModalOverlay');
    const closeViewUserModalBtn = document.getElementById('closeViewUserModalBtn'); // Top close button for view user modal
    const closeViewUserModalBtnBottom = document.getElementById('closeViewUserModalBtnBottom'); // Bottom close button for view user modal
    const viewUserFullName = document.getElementById('viewUserFullName');
    const viewUserEmail = document.getElementById('viewUserEmail');
    const viewUserRole = document.getElementById('viewUserRole'); 
    const viewUserRegistered = document.getElementById('viewUserRegistered');
    const viewUserStatus = document.getElementById('viewUserStatus');
    const viewUserUID = document.getElementById('viewUserUID');

    // Edit User Modal Elements (New)
    const editUserModalOverlay = document.getElementById('editUserModalOverlay');
    const closeEditUserModalBtn = document.getElementById('closeEditUserModalBtn'); // Top close button for edit user modal
    const editUserForm = document.getElementById('editUserForm');
    const editUserEmailSpan = document.getElementById('editUserEmailSpan');
    const editUserUID = document.getElementById('editUserUID');
    const editUserRoleSelect = document.getElementById('editUserRoleSelect');
    const editUserSuspended = document.getElementById('editUserSuspended');
    const saveUserChangesBtn = document.getElementById('saveUserChangesBtn');
    const cancelEditUserBtn = document.getElementById('cancelEditUserBtn');
    const editUserMessageContainer = document.getElementById('editUserMessageContainer');


    // Manage Affiliates Table Elements
    const affiliatesTableBody = document.querySelector('#affiliatesTable tbody'); 
    const noAffiliatesMessage = document.getElementById('noAffiliatesMessage'); // New: for affiliates table

    // View Affiliate Modal Elements (New)
    const viewAffiliateModalOverlay = document.getElementById('viewAffiliateModalOverlay');
    const closeViewAffiliateModalBtn = document.getElementById('closeViewAffiliateModalBtn');
    const closeViewAffiliateModalBtnBottom = document.getElementById('closeViewAffiliateModalBtnBottom');
    const viewAffiliateFullName = document.getElementById('viewAffiliateFullName');
    const viewAffiliateEmail = document.getElementById('viewAffiliateEmail');
    const viewAffiliateReferrals = document.getElementById('viewAffiliateReferrals');
    const viewAffiliateTotalEarnings = document.getElementById('viewAffiliateTotalEarnings');
    const viewAffiliatePendingEarnings = document.getElementById('viewAffiliatePendingEarnings');
    const viewAffiliatePaidEarnings = document.getElementById('viewAffiliatePaidEarnings');
    const viewAffiliatePayoutHistoryList = document.getElementById('viewAffiliatePayoutHistoryList');
    const viewAffiliateUID = document.getElementById('viewAffiliateUID');
    const viewAffiliateRegistered = document.getElementById('viewAffiliateRegistered');


    // Mark Paid Confirmation Modal Elements (New)
    const markPayoutModalOverlay = document.getElementById('markPayoutModalOverlay');
    const closeMarkPayoutModalBtn = document.getElementById('closeMarkPayoutModalBtn');
    const markPayoutAffiliateNameSpan = document.getElementById('markPayoutAffiliateName');
    const markPayoutPendingAmountSpan = document.getElementById('markPayoutPendingAmount');
    const markPayoutForm = document.getElementById('markPayoutForm');
    const markPayoutAffiliateIdInput = document.getElementById('markPayoutAffiliateId');
    const payoutAmountInput = document.getElementById('payoutAmount');
    const markPayoutMessageContainer = document.getElementById('markPayoutMessageContainer');
    const processPayoutBtn = document.getElementById('processPayoutBtn');
    const cancelMarkPayoutBtn = document.getElementById('cancelMarkPayoutBtn');

    // View Payout History Modal Elements (New)
    const payoutHistoryModalOverlay = document.getElementById('payoutHistoryModalOverlay');
    const closePayoutHistoryModalBtn = document.getElementById('closePayoutHistoryModalBtn');
    const payoutHistoryAffiliateNameSpan = document.getElementById('payoutHistoryAffiliateName');
    const payoutHistoryTableBody = document.querySelector('#payoutHistoryTable tbody');
    const noPayoutHistoryMessage = document.getElementById('noPayoutHistoryMessage');
    const closePayoutHistoryBtnBottom = document.getElementById('closePayoutHistoryBtnBottom');


    // Settings Elements
    const settingsForm = document.getElementById('settingsForm');
    const settingsMessageContainer = document.getElementById('settingsMessage');
    const platformNameInput = document.getElementById('platformName');
    const contactEmailInput = document.getElementById('contactEmail');
    const defaultCurrencyInput = document.getElementById('defaultCurrency'); 
    const enableAffiliateCheckbox = document.getElementById('enableAffiliate');
    const maintenanceModeCheckbox = document.getElementById('maintenanceMode');

    // Manage Pricing Elements (NEW)
    const premiumPriceInput = document.getElementById('premiumPriceInput');
    const savePremiumPriceBtn = document.getElementById('savePremiumPriceBtn');
    const pricingMessage = document.getElementById('pricingMessage');

    // --- Helper Function for Form Messages ---
    function showFormMessage(container, message, type) {
        if (container) {
            container.textContent = message;
            container.className = 'message-container active'; 
            container.classList.add(type); 
            setTimeout(() => {
                container.classList.remove('active', 'error', 'success', 'info');
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
        } catch (error) {
            console.error("Error logging out:", error);
        }
    }

    ['click', 'mousemove', 'keydown', 'scroll'].forEach(evt =>
        document.addEventListener(evt, resetTimer)
    );

    // --- Firebase Auth State and User Data ---
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            currentUserId = user.uid;
            console.log("Admin Dashboard: User logged in:", user.email || user.uid);

            // Fetch user role from Firestore to confirm admin status
            const userDocRef = doc(db, `artifacts/${currentAppId}/users`, user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists() && userDocSnap.data().role === 'admin') {
                isAdmin = true;
                console.log("Admin Dashboard: Admin access granted. Loading data...");
                loadDashboardData();
                // Initial section load is handled by default, but fetch data for active section
                const activeSectionId = document.querySelector('.content-section.active')?.id || 'dashboard-overview';
                if (activeSectionId === 'manage-courses') populateCoursesTable();
                else if (activeSectionId === 'manage-users') populateUsersTable();
                else if (activeSectionId === 'manage-affiliates') populateAffiliatesTable();
                else if (activeSectionId === 'manage-pricing') fetchPremiumPrice();
                else if (activeSectionId === 'platform-settings') loadSettings();
                
                resetTimer(); 
            } else {
                isAdmin = false;
                console.warn("Admin Dashboard: User is not an admin. Redirecting to login.");
                showModal('Access Denied', 'You do not have administrative privileges.', 'error');
                await signOut(auth); // Force sign out if not admin
                window.location.href = 'admin-login.html'; // Redirect to admin login
            }
        } else {
            currentUser = null;
            currentUserId = null;
            isAdmin = false;
            console.log("Admin Dashboard: No user logged in. Redirecting to login.");
            window.location.href = 'admin-login.html'; 
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
        console.log("Waiting for user authentication from admin-login.html or onAuthStateChanged.");
    }


    // --- Sidebar & Section Switching Logic ---
    function showSection(sectionId) {
        contentSections.forEach(section => {
            section.classList.remove('active');
        });
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.section === sectionId) {
                item.classList.add('active');
            }
        });

        if (window.innerWidth <= 992) {
            adminSidebar.classList.remove('active');
            document.body.classList.remove('no-scroll');
        }
    }

    if (hamburgerMenu) {
        hamburgerMenu.addEventListener('click', () => {
            adminSidebar.classList.add('active');
            document.body.classList.add('no-scroll'); 
        });
    }
    if (closeSidebarBtn) {
        closeSidebarBtn.addEventListener('click', () => {
            adminSidebar.classList.remove('active');
            document.body.classList.remove('no-scroll');
        });
    }

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = item.dataset.section;
            if (sectionId) { 
                showSection(sectionId);
                // Fetch data relevant to the section
                if (sectionId === 'dashboard-overview') {
                    loadDashboardData();
                } else if (sectionId === 'add-course') {
                    // No data to fetch, just show form
                } else if (sectionId === 'manage-courses') {
                    populateCoursesTable();
                } else if (sectionId === 'manage-users') {
                    populateUsersTable();
                } else if (sectionId === 'manage-affiliates') {
                    populateAffiliatesTable();
                } else if (sectionId === 'manage-pricing') {
                    fetchPremiumPrice();
                } else if (sectionId === 'platform-settings') {
                    loadSettings();
                }
            }
        });
    });

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showLogoutModal();
        });
    }

    // --- Logout Confirmation Modal ---
    function showLogoutModal() {
        logoutModalOverlay.classList.add('active');
        document.body.classList.add('no-scroll');
    }

    function hideLogoutModal() {
        logoutModalOverlay.classList.remove('active');
        document.body.classList.remove('no-scroll'); 
    }

    if (confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener('click', async () => {
            hideLogoutModal();
            try {
                await signOut(auth);
                console.log("User logged out manually.");
                window.location.href = 'admin-login.html'; 
            } catch (error) {
                console.error("Error logging out:", error);
                showModal('Logout Failed', 'There was an error logging out. Please try again.', 'error');
            }
        });
    }

    if (cancelLogoutBtn) {
        cancelLogoutBtn.addEventListener('click', hideLogoutModal);
    }
    if (cancelLogoutBtnTop) { // Top close button for logout modal
        cancelLogoutBtnTop.addEventListener('click', hideLogoutModal);
    }
    if (logoutModalOverlay) {
        logoutModalOverlay.addEventListener('click', (e) => {
            if (e.target === logoutModalOverlay) {
                hideLogoutModal();
            }
        });
    }

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
            messageModalOverlay.classList.remove('active', 'success', 'error', 'info');
            document.body.classList.remove('no-scroll'); 
        }
    }

    if (messageModalCloseBtn) { // OK button
        messageModalCloseBtn.addEventListener('click', hideModal);
    }
    
    // --- Event Delegation for Generic Message Modal Top Close Button and Overlay Click ---
    if (messageModalOverlay) {
        messageModalOverlay.addEventListener('click', (e) => {
            if (e.target === messageModalOverlay || e.target.id === 'closeMessageModalBtnTop' || e.target.closest('#closeMessageModalBtnTop')) {
                hideModal();
            }
        });
    } else {
        console.error("Error: messageModalOverlay element not found in the DOM. Cannot attach event listener for generic modal.");
    }

    // --- Dashboard Overview Data Loading (Firebase) ---
    async function loadDashboardData() {
        if (!isAdmin) return; 

        try {
            // Total Courses
            const coursesSnapshot = await getDocs(coursesCollectionRef);
            if (totalCoursesSpan) totalCoursesSpan.textContent = coursesSnapshot.size;

            // Total Users (Fetch from Firestore 'users' collection)
            const usersSnapshot = await getDocs(usersCollectionRef);
            if (totalUsersSpan) totalUsersSpan.textContent = usersSnapshot.size;
            
            // Total Affiliates (Filter from 'users' collection or dedicated 'affiliates' collection)
            const affiliatesCount = usersSnapshot.docs.filter(doc => doc.data().role === 'affiliate').length;
            if (totalAffiliatesSpan) totalAffiliatesSpan.textContent = affiliatesCount;

            // Total Revenue (Sum of paidEarnings from all users)
            let totalRevenue = 0;
            usersSnapshot.forEach(doc => {
                totalRevenue += doc.data().paidEarnings || 0;
            });
            if (totalRevenueSpan) totalRevenueSpan.textContent = totalRevenue.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' }); 

            // Recent Activity (Simulated)
            if (recentActivityList) {
                recentActivityList.innerHTML = `
                    <div class="activity-item">
                        <span class="activity-user">System:</span>
                        <span class="activity-action">Dashboard data refreshed</span>
                        <span class="activity-time">${new Date().toLocaleTimeString()}</span>
                    </div>
                    <div class="activity-item">
                        <span class="activity-user">User: John Doe</span>
                        <span class="activity-action">logged in</span>
                        <span class="activity-time">5 mins ago</span>
                    </div>
                    <div class="activity-item">
                        <span class="activity-user">User: Jane Smith</span>
                        <span class="activity-action">enrolled in "Web Design Basics"</span>
                        <span class="activity-time">1 hour ago</span>
                    </div>
                `;
            } else {
                console.warn("recentActivityList element not found.");
            }

        } catch (error) {
            console.error("Error loading dashboard data:", error);
            showModal('Error', 'Failed to load dashboard data.', 'error');
        }
    }

    // --- Dynamic Form Field Management (Add Course & Edit Course) ---
    function addListItem(container, inputName, initialValue = '') {
        if (!container) { console.error("Container for list item not found."); return; }
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('dynamic-list-item');
        itemDiv.innerHTML = `
            <input type="text" name="${inputName}" value="${initialValue}" placeholder="Enter item text" required>
            <button type="button" class="btn btn-danger btn-small remove-item-btn"><i class="ri-delete-bin-line"></i></button>
        `;
        container.appendChild(itemDiv);
        itemDiv.querySelector('.remove-item-btn').addEventListener('click', () => itemDiv.remove());
    }

    function addDownloadItem(container, download = {}) {
        if (!container) { console.error("Container for download item not found."); return; }
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('dynamic-list-item', 'download-item-fields');
        itemDiv.innerHTML = `
            <input type="text" name="downloadName" value="${download.name || ''}" placeholder="Download Name" required>
            <input type="url" name="downloadUrl" value="${download.url || ''}" placeholder="Download URL" required>
            <input type="text" name="downloadIcon" value="${download.icon || ''}" placeholder="Remix Icon Class (e.g., ri-file-text-line)">
            <button type="button" class="btn btn-danger btn-small remove-item-btn"><i class="ri-delete-bin-line"></i></button>
        `;
        container.appendChild(itemDiv);
        itemDiv.querySelector('.remove-item-btn').addEventListener('click', () => itemDiv.remove());
    }

    function addModule(container, module = {}) {
        if (!container) { console.error("Container for module not found."); return; }
        const moduleDiv = document.createElement('div');
        moduleDiv.classList.add('dynamic-module-item', 'card');
        
        moduleDiv.innerHTML = `
            <div class="module-header">
                <input type="text" name="moduleTitle" value="${module.moduleTitle || ''}" placeholder="Module Title" required>
                <button type="button" class="btn btn-danger btn-small remove-module-btn"><i class="ri-delete-bin-line"></i></button>
            </div>
            <div class="module-lessons-container">
                <h4>Lessons <button type="button" class="btn btn-secondary btn-small add-lesson-btn">Add Lesson</button></h4>
                <div class="lessons-list">
                    <!-- Lessons will go here -->
                </div>
            </div>
        `;
        container.appendChild(moduleDiv);

        moduleDiv.querySelector('.remove-module-btn').addEventListener('click', () => moduleDiv.remove());
        const lessonsListContainer = moduleDiv.querySelector('.lessons-list');
        if (lessonsListContainer) { // Ensure lessonsListContainer is found
            moduleDiv.querySelector('.add-lesson-btn').addEventListener('click', () => addLesson(lessonsListContainer));
        } else {
            console.error("Lessons list container not found within moduleDiv.");
        }

        if (module.lessons && Array.isArray(module.lessons)) {
            module.lessons.forEach(lesson => addLesson(lessonsListContainer, lesson));
        }
    }

    function addLesson(container, lesson = {}) {
        if (!container) { console.error("Container for lesson not found."); return; }
        const lessonDiv = document.createElement('div');
        lessonDiv.classList.add('dynamic-lesson-item');
        lessonDiv.innerHTML = `
            <input type="text" name="lessonTitle" value="${lesson.title || ''}" placeholder="Lesson Title" required>
            <input type="text" name="lessonDuration" value="${lesson.duration || ''}" placeholder="Duration (e.g., 5:30)">
            <input type="url" name="lessonVideoEmbedUrl" value="${lesson.videoEmbedUrl || ''}" placeholder="Lesson Video Embed URL (Optional)">
            <textarea name="lessonContent" rows="4" placeholder="Lesson Content (HTML allowed)" class="lesson-content-textarea">${lesson.content || ''}</textarea>
            <div class="checkbox-group">
                <input type="checkbox" name="lessonIsLocked" ${lesson.isLocked ? 'checked' : ''}>
                <label>Locked (Premium)</label>
            </div>
            <button type="button" class="btn btn-danger btn-small remove-item-btn"><i class="ri-delete-bin-line"></i></button>
        `;
        container.appendChild(lessonDiv);
        lessonDiv.querySelector('.remove-item-btn').addEventListener('click', () => lessonDiv.remove());
    }

    if (addWhatYoullLearnItemBtn) addWhatYoullLearnItemBtn.addEventListener('click', () => addListItem(whatYoullLearnContainer, 'whatYoullLearnItem'));
    if (addWhoThisIsForItemBtn) addWhoThisIsForItemBtn.addEventListener('click', () => addListItem(whoThisIsForContainer, 'whoThisIsForItem'));
    if (addPrerequisiteItemBtn) addPrerequisiteItemBtn.addEventListener('click', () => addListItem(prerequisitesContainer, 'prerequisiteItem'));
    if (addDownloadItemBtn) addDownloadItemBtn.addEventListener('click', () => addDownloadItem(downloadsContainer));
    if (addModuleBtn) addModuleBtn.addEventListener('click', () => addModule(curriculumContainer));


    // --- Add Course Form Submission (Firebase) ---
    if (addCourseForm) {
        addCourseForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!isAdmin) {
                showModal('Access Denied', 'You do not have permission to add courses.', 'error');
                return;
            }

            const submitBtn = addCourseForm.querySelector('button[type="submit"]');
            submitBtn.textContent = 'Adding...';
            submitBtn.disabled = true;

            const courseData = {};
            
            courseData.title = addCourseTitleInput.value.trim();
            courseData.category = addCourseCategorySelect.value;
            courseData.accessType = addCourseAccessTypeSelect.value;
            courseData.thumbnailUrl = addCourseThumbnailInput.value.trim();
            courseData.videoEmbedUrl = addIntroVideoInput.value.trim();
            courseData.shortDescription = addShortDescriptionInput.value.trim();
            courseData.longDescription = addLongDescriptionInput.value.trim();
            courseData.isFeatured = addIsFeaturedCheckbox.checked;
            courseData.estimatedTime = addCourseDurationInput.value.trim(); 

            courseData.instructor = {
                name: addInstructorNameInput.value.trim(),
                bio: addInstructorBioInput.value.trim(),
                avatarUrl: addInstructorAvatarUrlInput.value.trim() || 'https://placehold.co/80x80/E0F2F7/0ED2F7?text=NA'
            };

            courseData.courseMeta = {
                duration: courseData.estimatedTime, 
                level: addCourseLevelSelect.value,
                lessonsCount: parseInt(addLessonsCountInput.value) || 0
            };

            courseData.whatYoullLearn = Array.from(whatYoullLearnContainer.querySelectorAll('input[name="whatYoullLearnItem"]')).map(input => input.value.trim()).filter(Boolean);
            courseData.whoThisIsFor = Array.from(whoThisIsForContainer.querySelectorAll('input[name="whoThisIsForItem"]')).map(input => input.value.trim()).filter(Boolean);
            courseData.prerequisites = Array.from(prerequisitesContainer.querySelectorAll('input[name="prerequisiteItem"]')).map(input => input.value.trim()).filter(Boolean);

            courseData.downloads = [];
            downloadsContainer.querySelectorAll('.download-item-fields').forEach(itemDiv => {
                const name = itemDiv.querySelector('input[name="downloadName"]').value.trim();
                const url = itemDiv.querySelector('input[name="downloadUrl"]').value.trim();
                const icon = itemDiv.querySelector('input[name="downloadIcon"]').value.trim();
                if (name && url) {
                    courseData.downloads.push({ name, url, icon });
                }
            });

            courseData.curriculum = [];
            curriculumContainer.querySelectorAll('.dynamic-module-item').forEach(moduleDiv => {
                const moduleTitleInput = moduleDiv.querySelector('input[name="moduleTitle"]');
                const moduleTitle = moduleTitleInput ? moduleTitleInput.value.trim() : '';
                const lessons = [];
                moduleDiv.querySelectorAll('.dynamic-lesson-item').forEach(lessonDiv => {
                    const titleInput = lessonDiv.querySelector('input[name="lessonTitle"]');
                    const durationInput = lessonDiv.querySelector('input[name="lessonDuration"]');
                    const videoEmbedUrlInput = lessonDiv.querySelector('input[name="lessonVideoEmbedUrl"]');
                    const contentTextarea = lessonDiv.querySelector('textarea[name="lessonContent"]');
                    const isLockedCheckbox = lessonDiv.querySelector('input[name="lessonIsLocked"]');

                    const title = titleInput ? titleInput.value.trim() : '';
                    const duration = durationInput ? durationInput.value.trim() : '';
                    const videoEmbedUrl = videoEmbedUrlInput ? videoEmbedUrlInput.value.trim() : '';
                    const content = contentTextarea ? contentTextarea.value.trim() : '';
                    const isLocked = isLockedCheckbox ? isLockedCheckbox.checked : false;

                    if (title) {
                        lessons.push({ title, duration, videoEmbedUrl, content, isLocked, status: 'pending' }); 
                    }
                });
                if (moduleTitle) {
                    courseData.curriculum.push({ moduleTitle, lessons });
                }
            });

            if (!courseData.title || !courseData.instructor.name || !courseData.category || !courseData.thumbnailUrl || !courseData.videoEmbedUrl || !courseData.shortDescription) {
                showFormMessage(addCourseMessageContainer, 'Please fill in all required fields (Title, Instructor, Category, Thumbnail, Video, Short Description).', 'error');
                submitBtn.textContent = 'Add Course';
                submitBtn.disabled = false;
                return;
            }

            try {
                await addDoc(coursesCollectionRef, {
                    ...courseData,
                    createdAt: serverTimestamp(), // Corrected usage
                    updatedAt: serverTimestamp() // Corrected usage
                });
                showFormMessage(addCourseMessageContainer, 'Course added successfully!', 'success');
                addCourseForm.reset(); // Clear form
                whatYoullLearnContainer.innerHTML = ''; // Clear dynamic fields
                whoThisIsForContainer.innerHTML = '';
                prerequisitesContainer.innerHTML = '';
                downloadsContainer.innerHTML = '';
                curriculumContainer.innerHTML = '';
                populateCoursesTable(); // Refresh courses table
                loadDashboardData(); // Update stats
            } catch (error) {
                console.error("Error adding course:", error);
                showFormMessage(addCourseMessageContainer, `Error adding course: ${error.message}`, 'error');
            } finally {
                submitBtn.textContent = 'Add Course';
                submitBtn.disabled = false;
            }
        });
    }

    // --- Manage Courses Functions ---
    async function populateCoursesTable() {
        coursesTableBody.innerHTML = '<tr><td colspan="6" class="loading-cell">Loading courses...</td></tr>';
        noCoursesMessage.style.display = 'none';
        try {
            const q = query(coursesCollectionRef, orderBy('createdAt', 'desc')); // Order by creation date
            const querySnapshot = await getDocs(q);
            const courses = [];
            querySnapshot.forEach(doc => {
                courses.push({ id: doc.id, ...doc.data() });
            });
            renderCoursesTable(courses);
        } catch (error) {
            console.error("Error fetching courses:", error);
            coursesTableBody.innerHTML = '<tr><td colspan="6" class="error-cell">Error loading courses.</td></tr>';
            showModal('Error', 'Failed to load course data. Please try again.', 'error');
        }
    }

    function renderCoursesTable(coursesToRender) {
        coursesTableBody.innerHTML = '';
        if (coursesToRender.length === 0) {
            noCoursesMessage.style.display = 'table-row';
            return;
        }
        noCoursesMessage.style.display = 'none'; // Hide if courses are found

        coursesToRender.forEach(course => {
            const row = coursesTableBody.insertRow();
            row.insertCell().textContent = course.title || 'N/A';
            row.insertCell().textContent = course.instructor?.name || 'N/A';
            row.insertCell().textContent = course.category || 'N/A';
            row.insertCell().textContent = course.accessType || 'N/A';
            row.insertCell().innerHTML = course.isFeatured ? '<i class="ri-check-circle-fill" style="color: var(--color-green);"></i>' : '<i class="ri-close-circle-fill" style="color: var(--color-red);"></i>';
            
            const actionsCell = row.insertCell();
            
            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-action edit-btn';
            editBtn.innerHTML = '<i class="ri-edit-line"></i>';
            editBtn.title = 'Edit Course';
            editBtn.addEventListener('click', () => openEditCourseModal(course));
            actionsCell.appendChild(editBtn);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-action delete-btn';
            deleteBtn.innerHTML = '<i class="ri-delete-bin-line"></i>';
            deleteBtn.title = 'Delete Course';
            deleteBtn.addEventListener('click', () => openDeleteConfirmModal(course.id, course.title));
            actionsCell.appendChild(deleteBtn);
        });
    }

    // --- Edit Course Modal Logic ---
    function openEditCourseModal(course) {
        editCourseIdInput.value = course.id;
        editCourseForm.reset(); // Clear previous form data
        editCourseMessageContainer.classList.remove('active', 'error', 'success');

        editCourseTitleInput.value = course.title || '';
        editInstructorNameInput.value = course.instructor?.name || '';
        editInstructorBioInput.value = course.instructor?.bio || '';
        editInstructorAvatarUrlInput.value = course.instructor?.avatarUrl || '';
        editCourseCategorySelect.value = course.category || '';
        editCourseAccessTypeSelect.value = course.accessType || 'free';
        editCourseThumbnailInput.value = course.thumbnailUrl || '';
        editIntroVideoInput.value = course.videoEmbedUrl || '';
        editShortDescriptionInput.value = course.shortDescription || '';
        editLongDescriptionInput.value = course.longDescription || '';
        editCourseDurationInput.value = course.estimatedTime || '';
        editCourseLevelSelect.value = course.courseMeta?.level || '';
        editLessonsCountInput.value = course.courseMeta?.lessonsCount || 0;
        editIsFeaturedCheckbox.checked = course.isFeatured || false;

        // Populate dynamic lists
        editWhatYoullLearnContainer.innerHTML = '';
        (course.whatYoullLearn || []).forEach(item => addListItem(editWhatYoullLearnContainer, 'whatYoullLearnItem', item));
        
        editWhoThisIsForContainer.innerHTML = '';
        (course.whoThisIsFor || []).forEach(item => addListItem(editWhoThisIsForContainer, 'whoThisIsForItem', item));

        editPrerequisitesContainer.innerHTML = '';
        (course.prerequisites || []).forEach(item => addListItem(editPrerequisitesContainer, 'prerequisiteItem', item));

        editDownloadsContainer.innerHTML = '';
        (course.downloads || []).forEach(item => addDownloadItem(editDownloadsContainer, item));

        editCurriculumContainer.innerHTML = '';
        (course.curriculum || []).forEach(module => {
            addModule(editCurriculumContainer, module);
        });

        editCourseModalOverlay.classList.add('active');
        document.body.classList.add('no-scroll');
    }

    if (editAddWhatYoullLearnItemBtn) editAddWhatYoullLearnItemBtn.addEventListener('click', () => addListItem(editWhatYoullLearnContainer, 'whatYoullLearnItem'));
    if (editAddWhoThisIsForItemBtn) editAddWhoThisIsForItemBtn.addEventListener('click', () => addListItem(editWhoThisIsForContainer, 'whoThisIsForItem'));
    if (editAddPrerequisiteItemBtn) editAddPrerequisiteItemBtn.addEventListener('click', () => addListItem(editPrerequisitesContainer, 'prerequisiteItem'));
    if (editAddDownloadItemBtn) editAddDownloadItemBtn.addEventListener('click', () => addDownloadItem(editDownloadsContainer));
    if (editAddModuleBtn) editAddModuleBtn.addEventListener('click', () => addModule(editCurriculumContainer));

    if (closeEditCourseModalBtn) {
        closeEditCourseModalBtn.addEventListener('click', () => {
            editCourseModalOverlay.classList.remove('active');
            document.body.classList.remove('no-scroll');
        });
    }

    if (editCourseForm) {
        editCourseForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!isAdmin) {
                showModal('Access Denied', 'You do not have permission to edit courses.', 'error');
                return;
            }

            const submitBtn = editCourseForm.querySelector('button[type="submit"]');
            submitBtn.textContent = 'Saving...';
            submitBtn.disabled = true;

            const courseId = editCourseIdInput.value;
            const updatedCourseData = {};
            
            updatedCourseData.title = editCourseTitleInput.value.trim();
            updatedCourseData.category = editCourseCategorySelect.value;
            updatedCourseData.accessType = editCourseAccessTypeSelect.value;
            updatedCourseData.thumbnailUrl = editCourseThumbnailInput.value.trim();
            updatedCourseData.videoEmbedUrl = editIntroVideoInput.value.trim();
            updatedCourseData.shortDescription = editShortDescriptionInput.value.trim();
            updatedCourseData.longDescription = editLongDescriptionInput.value.trim();
            updatedCourseData.isFeatured = editIsFeaturedCheckbox.checked;
            updatedCourseData.estimatedTime = editCourseDurationInput.value.trim(); 

            updatedCourseData.instructor = {
                name: editInstructorNameInput.value.trim(),
                bio: editInstructorBioInput.value.trim(),
                avatarUrl: editInstructorAvatarUrlInput.value.trim() || 'https://placehold.co/80x80/E0F2F7/0ED2F7?text=NA'
            };

            updatedCourseData.courseMeta = {
                duration: updatedCourseData.estimatedTime, 
                level: editCourseLevelSelect.value,
                lessonsCount: parseInt(editLessonsCountInput.value) || 0
            };

            updatedCourseData.whatYoullLearn = Array.from(editWhatYoullLearnContainer.querySelectorAll('input[name="whatYoullLearnItem"]')).map(input => input.value.trim()).filter(Boolean);
            updatedCourseData.whoThisIsFor = Array.from(editWhoThisIsForContainer.querySelectorAll('input[name="whoThisIsForItem"]')).map(input => input.value.trim()).filter(Boolean);
            updatedCourseData.prerequisites = Array.from(editPrerequisitesContainer.querySelectorAll('input[name="prerequisiteItem"]')).map(input => input.value.trim()).filter(Boolean);

            updatedCourseData.downloads = [];
            editDownloadsContainer.querySelectorAll('.download-item-fields').forEach(itemDiv => {
                const name = itemDiv.querySelector('input[name="downloadName"]').value.trim();
                const url = itemDiv.querySelector('input[name="downloadUrl"]').value.trim();
                const icon = itemDiv.querySelector('input[name="downloadIcon"]').value.trim();
                if (name && url) {
                    updatedCourseData.downloads.push({ name, url, icon });
                }
            });

            updatedCourseData.curriculum = [];
            editCurriculumContainer.querySelectorAll('.dynamic-module-item').forEach(moduleDiv => {
                const moduleTitleInput = moduleDiv.querySelector('input[name="moduleTitle"]');
                const moduleTitle = moduleTitleInput ? moduleTitleInput.value.trim() : '';
                const lessons = [];
                moduleDiv.querySelectorAll('.dynamic-lesson-item').forEach(lessonDiv => {
                    const titleInput = lessonDiv.querySelector('input[name="lessonTitle"]');
                    const durationInput = lessonDiv.querySelector('input[name="lessonDuration"]');
                    const videoEmbedUrlInput = lessonDiv.querySelector('input[name="lessonVideoEmbedUrl"]');
                    const contentTextarea = lessonDiv.querySelector('textarea[name="lessonContent"]');
                    const isLockedCheckbox = lessonDiv.querySelector('input[name="lessonIsLocked"]');

                    const title = titleInput ? titleInput.value.trim() : '';
                    const duration = durationInput ? durationInput.value.trim() : '';
                    const videoEmbedUrl = videoEmbedUrlInput ? videoEmbedUrlInput.value.trim() : '';
                    const content = contentTextarea ? contentTextarea.value.trim() : '';
                    const isLocked = isLockedCheckbox ? isLockedCheckbox.checked : false;

                    if (title) {
                        lessons.push({ title, duration, videoEmbedUrl, content, isLocked, status: 'pending' }); 
                    }
                });
                if (moduleTitle) {
                    updatedCourseData.curriculum.push({ moduleTitle, lessons });
                }
            });

            if (!updatedCourseData.title || !updatedCourseData.instructor.name || !updatedCourseData.category || !updatedCourseData.thumbnailUrl || !updatedCourseData.videoEmbedUrl || !updatedCourseData.shortDescription) {
                showFormMessage(editCourseMessageContainer, 'Please fill in all required fields (Title, Instructor, Category, Thumbnail, Video, Short Description).', 'error');
                submitBtn.textContent = 'Save Changes';
                submitBtn.disabled = false;
                return;
            }

            try {
                const courseDocRef = doc(db, `artifacts/${currentAppId}/public/data/courses`, courseId);
                await updateDoc(courseDocRef, {
                    ...updatedCourseData,
                    updatedAt: serverTimestamp() // Corrected usage
                });
                showFormMessage(editCourseMessageContainer, 'Course updated successfully!', 'success');
                setTimeout(() => {
                    editCourseModalOverlay.classList.remove('active');
                    document.body.classList.remove('no-scroll');
                    populateCoursesTable(); // Refresh table
                }, 1000);
            } catch (error) {
                console.error("Error updating course:", error);
                showFormMessage(editCourseMessageContainer, `Error updating course: ${error.message}`, 'error');
            } finally {
                submitBtn.textContent = 'Save Changes';
                submitBtn.disabled = false;
            }
        });
    }

    // --- Delete Course Confirmation Modal Logic ---
    function openDeleteConfirmModal(courseId, courseTitle) {
        deleteCourseTitleSpan.textContent = courseTitle;
        confirmDeleteBtn.dataset.courseId = courseId; // Store ID on the button
        deleteConfirmModalOverlay.classList.add('active');
        document.body.classList.add('no-scroll');
    }

    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', () => {
            deleteConfirmModalOverlay.classList.remove('active');
            document.body.classList.remove('no-scroll');
        });
    }
    if (cancelDeleteBtnTopDelete) { // Top close button for delete modal
        cancelDeleteBtnTopDelete.addEventListener('click', () => {
            deleteConfirmModalOverlay.classList.remove('active');
            document.body.classList.remove('no-scroll');
        });
    }

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async () => {
            if (!isAdmin) {
                showModal('Access Denied', 'You do not have permission to delete courses.', 'error');
                return;
            }
            const courseIdToDelete = confirmDeleteBtn.dataset.courseId;
            confirmDeleteBtn.textContent = 'Deleting...';
            confirmDeleteBtn.disabled = true;
            try {
                await deleteDoc(doc(db, `artifacts/${currentAppId}/public/data/courses`, courseIdToDelete));
                showModal('Success', 'Course deleted successfully!', 'success');
                setTimeout(() => {
                    deleteConfirmModalOverlay.classList.remove('active');
                    document.body.classList.remove('no-scroll');
                    populateCoursesTable(); // Refresh table
                    loadDashboardData(); // Update stats
                }, 1000);
            } catch (error) {
                console.error("Error deleting course:", error);
                showModal('Error', `Failed to delete course: ${error.message}`, 'error');
            } finally {
                confirmDeleteBtn.textContent = 'Yes, Delete';
                confirmDeleteBtn.disabled = false;
            }
        });
    }

    // --- Manage Users Functions ---
    async function populateUsersTable() {
        usersTableBody.innerHTML = '<tr><td colspan="6" class="loading-cell">Loading users...</td></tr>';
        noUsersMessage.style.display = 'none';
        try {
            const q = query(usersCollectionRef, orderBy('createdAt', 'desc')); // Order by creation date
            const querySnapshot = await getDocs(q);
            const users = [];
            querySnapshot.forEach(doc => {
                users.push({ id: doc.id, ...doc.data() });
            });
            renderUsersTable(users);
        } catch (error) {
            console.error("Error fetching users:", error);
            usersTableBody.innerHTML = '<tr><td colspan="6" class="error-cell">Error loading users.</td></tr>';
            showModal('Error', 'Failed to load user data. Please try again.', 'error');
        }
    }

    function renderUsersTable(usersToRender) {
        usersTableBody.innerHTML = '';
        if (usersToRender.length === 0) {
            noUsersMessage.style.display = 'block';
            return;
        }
        noUsersMessage.style.display = 'none';

        usersToRender.forEach(user => {
            const row = usersTableBody.insertRow();
            row.insertCell().textContent = user.fullName || user.email || 'N/A';
            row.insertCell().textContent = user.email || 'N/A';
            row.insertCell().textContent = user.role || 'student';
            row.insertCell().textContent = user.isSuspended ? 'Suspended' : 'Active';
            
            // FIX: Handle date conversion robustly
            let registeredDate = 'N/A';
            if (user.createdAt) {
                try {
                    // If it's a Firestore Timestamp, toDate() will exist.
                    // If it's already a JS Date object, new Date() will handle it.
                    // If it's a string, new Date() will attempt to parse it.
                    const dateObj = typeof user.createdAt.toDate === 'function' ? user.createdAt.toDate() : new Date(user.createdAt);
                    if (!isNaN(dateObj.getTime())) { // Check if it's a valid date
                        registeredDate = dateObj.toLocaleDateString();
                    }
                } catch (e) {
                    console.warn("Could not parse user.createdAt date:", user.createdAt, e);
                    registeredDate = 'Invalid Date';
                }
            }
            row.insertCell().textContent = registeredDate;
            
            const actionsCell = row.insertCell();
            
            const viewBtn = document.createElement('button');
            viewBtn.className = 'btn btn-action view-btn';
            viewBtn.innerHTML = '<i class="ri-eye-line"></i>';
            viewBtn.title = 'View Details';
            viewBtn.addEventListener('click', () => openViewUserModal(user));
            actionsCell.appendChild(viewBtn);

            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-action edit-btn';
            editBtn.innerHTML = '<i class="ri-edit-line"></i>';
            editBtn.title = 'Edit User Role/Status';
            editBtn.addEventListener('click', () => openEditUserModal(user));
            actionsCell.appendChild(editBtn);
        });
    }

    // --- View User Details Modal Logic ---
    function openViewUserModal(user) {
        viewUserFullName.textContent = user.fullName || 'N/A';
        viewUserEmail.textContent = user.email || 'N/A';
        viewUserRole.textContent = user.role || 'student';
        
        let registeredDate = 'N/A';
        if (user.createdAt) {
            try {
                const dateObj = typeof user.createdAt.toDate === 'function' ? user.createdAt.toDate() : new Date(user.createdAt);
                if (!isNaN(dateObj.getTime())) {
                    registeredDate = dateObj.toLocaleDateString();
                }
            } catch (e) {
                console.warn("Could not parse viewUserRegistered date:", user.createdAt, e);
                registeredDate = 'Invalid Date';
            }
        }
        viewUserRegistered.textContent = registeredDate;

        viewUserStatus.textContent = user.isSuspended ? 'Suspended' : 'Active';
        viewUserUID.textContent = user.id; // Display full UID

        viewUserModalOverlay.classList.add('active');
        document.body.classList.add('no-scroll');
    }

    if (closeViewUserModalBtn) {
        closeViewUserModalBtn.addEventListener('click', () => {
            viewUserModalOverlay.classList.remove('active');
            document.body.classList.remove('no-scroll');
        });
    }
    if (closeViewUserModalBtnBottom) {
        closeViewUserModalBtnBottom.addEventListener('click', () => {
            viewUserModalOverlay.classList.remove('active');
            document.body.classList.remove('no-scroll');
        });
    }

    // --- Edit User Modal Logic ---
    function openEditUserModal(user) {
        editUserUID.value = user.id;
        editUserForm.reset();
        editUserMessageContainer.classList.remove('active', 'error', 'success');

        editUserEmailSpan.textContent = user.email || user.id;
        editUserRoleSelect.value = user.role || 'student';
        editUserSuspended.checked = user.isSuspended || false;

        editUserModalOverlay.classList.add('active');
        document.body.classList.add('no-scroll');
    }

    if (closeEditUserModalBtn) {
        closeEditUserModalBtn.addEventListener('click', () => {
            editUserModalOverlay.classList.remove('active');
            document.body.classList.remove('no-scroll');
        });
    }
    if (cancelEditUserBtn) {
        cancelEditUserBtn.addEventListener('click', () => {
            editUserModalOverlay.classList.remove('active');
            document.body.classList.remove('no-scroll');
        });
    }

    if (editUserForm) {
        editUserForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!isAdmin) {
                showModal('Access Denied', 'You do not have permission to edit users.', 'error');
                return;
            }
            saveUserChangesBtn.textContent = 'Saving...';
            saveUserChangesBtn.disabled = true;

            const userIdToUpdate = editUserUID.value;
            const newRole = editUserRoleSelect.value;
            const isSuspended = editUserSuspended.checked;

            try {
                const userDocRef = doc(db, `artifacts/${currentAppId}/users`, userIdToUpdate);
                await updateDoc(userDocRef, {
                    role: newRole,
                    isSuspended: isSuspended,
                    updatedAt: serverTimestamp() // Corrected usage
                });
                showFormMessage(editUserMessageContainer, 'User updated successfully!', 'success');
                setTimeout(() => {
                    editUserModalOverlay.classList.remove('active');
                    document.body.classList.remove('no-scroll');
                    populateUsersTable(); // Refresh users table
                    loadDashboardData(); // Update dashboard stats (if user count/role changed)
                }, 1000);
            } catch (error) {
                console.error("Error updating user:", error);
                showFormMessage(editUserMessageContainer, `Error updating user: ${error.message}`, 'error');
            } finally {
                saveUserChangesBtn.textContent = 'Save Changes';
                saveUserChangesBtn.disabled = false;
            }
        });
    }

    // --- Manage Affiliates Functions ---
    async function populateAffiliatesTable() {
        affiliatesTableBody.innerHTML = '<tr><td colspan="5" class="loading-cell">Loading affiliates...</td></tr>';
        noAffiliatesMessage.style.display = 'none';
        try {
            const q = query(usersCollectionRef, where('role', '==', 'affiliate'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const affiliates = [];
            querySnapshot.forEach(doc => {
                affiliates.push({ id: doc.id, ...doc.data() });
            });
            renderAffiliatesTable(affiliates);
        } catch (error) {
            console.error("Error fetching affiliates:", error);
            affiliatesTableBody.innerHTML = '<tr><td colspan="5" class="error-cell">Error loading affiliates.</td></tr>';
            showModal('Error', 'Failed to load affiliate data. Please try again.', 'error');
        }
    }

    function renderAffiliatesTable(affiliatesToRender) {
        affiliatesTableBody.innerHTML = '';
        if (affiliatesToRender.length === 0) {
            noAffiliatesMessage.style.display = 'table-row';
            return;
        }
        noAffiliatesMessage.style.display = 'none';

        affiliatesToRender.forEach(affiliate => {
            const row = affiliatesTableBody.insertRow();
            row.insertCell().textContent = affiliate.fullName || affiliate.email || 'N/A';
            row.insertCell().textContent = affiliate.referralsCount || 0;
            row.insertCell().textContent = (affiliate.totalEarnings || 0).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' });
            row.insertCell().textContent = affiliate.isSuspended ? 'Suspended' : 'Active'; 
            
            const actionsCell = row.insertCell();
            
            const viewBtn = document.createElement('button');
            viewBtn.className = 'btn btn-action view-btn';
            viewBtn.innerHTML = '<i class="ri-eye-line"></i>';
            viewBtn.title = 'View Details';
            viewBtn.addEventListener('click', () => openViewAffiliateModal(affiliate));
            actionsCell.appendChild(viewBtn);

            if ((affiliate.pendingEarnings || 0) > 0) {
                const markPaidBtn = document.createElement('button');
                markPaidBtn.className = 'btn btn-action mark-paid-btn';
                markPaidBtn.innerHTML = '<i class="ri-wallet-line"></i>';
                markPaidBtn.title = 'Mark Payout Paid';
                markPaidBtn.addEventListener('click', () => openMarkPayoutModal(affiliate));
                actionsCell.appendChild(markPaidBtn);
            }

            const historyBtn = document.createElement('button');
            historyBtn.className = 'btn btn-action history-btn';
            historyBtn.innerHTML = '<i class="ri-history-line"></i>';
            historyBtn.title = 'View Payout History';
            historyBtn.addEventListener('click', () => openPayoutHistoryModal(affiliate));
            actionsCell.appendChild(historyBtn);
        });
    }

    // --- View Affiliate Details Modal Logic ---
    function openViewAffiliateModal(affiliate) {
        viewAffiliateFullName.textContent = affiliate.fullName || 'N/A';
        viewAffiliateEmail.textContent = affiliate.email || 'N/A';
        viewAffiliateUID.textContent = affiliate.id;
        viewAffiliateReferrals.textContent = affiliate.referralsCount || 0;
        viewAffiliateTotalEarnings.textContent = (affiliate.totalEarnings || 0).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' });
        viewAffiliatePendingEarnings.textContent = (affiliate.pendingEarnings || 0).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' });
        viewAffiliatePaidEarnings.textContent = (affiliate.paidEarnings || 0).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' });
        
        let registeredDate = 'N/A';
        if (affiliate.createdAt) {
            try {
                const dateObj = typeof affiliate.createdAt.toDate === 'function' ? affiliate.createdAt.toDate() : new Date(affiliate.createdAt);
                if (!isNaN(dateObj.getTime())) {
                    registeredDate = dateObj.toLocaleDateString();
                }
            } catch (e) {
                console.warn("Could not parse affiliate.createdAt date:", affiliate.createdAt, e);
                registeredDate = 'Invalid Date';
            }
        }
        viewAffiliateRegistered.textContent = registeredDate;

        viewAffiliateModalOverlay.classList.add('active');
        document.body.classList.add('no-scroll');
    }

    if (closeViewAffiliateModalBtn) {
        closeViewAffiliateModalBtn.addEventListener('click', () => {
            viewAffiliateModalOverlay.classList.remove('active');
            document.body.classList.remove('no-scroll');
        });
    }
    if (closeViewAffiliateModalBtnBottom) {
        closeViewAffiliateModalBtnBottom.addEventListener('click', () => {
            viewAffiliateModalOverlay.classList.remove('active');
            document.body.classList.remove('no-scroll');
        });
    }

    // --- Mark Affiliate Payout Modal Logic ---
    function openMarkPayoutModal(affiliate) {
        markPayoutAffiliateIdInput.value = affiliate.id;
        markPayoutAffiliateNameSpan.textContent = affiliate.fullName || affiliate.email;
        markPayoutPendingAmountSpan.textContent = (affiliate.pendingEarnings || 0).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' });
        payoutAmountInput.value = affiliate.pendingEarnings || 0; // Pre-fill with pending amount
        markPayoutMessageContainer.classList.remove('active', 'error', 'success');
        markPayoutModalOverlay.classList.add('active');
        document.body.classList.add('no-scroll');
    }

    if (closeMarkPayoutModalBtn) {
        closeMarkPayoutModalBtn.addEventListener('click', () => {
            markPayoutModalOverlay.classList.remove('active');
            document.body.classList.remove('no-scroll');
        });
    }
    if (cancelMarkPayoutBtn) {
        cancelMarkPayoutBtn.addEventListener('click', () => {
            markPayoutModalOverlay.classList.remove('active');
            document.body.classList.remove('no-scroll');
        });
    }

    if (markPayoutForm) {
        markPayoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!isAdmin) {
                showModal('Access Denied', 'You do not have permission to process payouts.', 'error');
                return;
            }
            processPayoutBtn.textContent = 'Processing...';
            processPayoutBtn.disabled = true;

            const amountToPay = parseFloat(payoutAmountInput.value);
            if (isNaN(amountToPay) || amountToPay <= 0) {
                showFormMessage(markPayoutMessageContainer, 'Please enter a valid positive amount.', 'error');
                processPayoutBtn.textContent = 'Process Payout';
                processPayoutBtn.disabled = false;
                return;
            }

            try {
                const affiliateDocRef = doc(db, `artifacts/${currentAppId}/users`, markPayoutAffiliateIdInput.value);
                const affiliateSnap = await getDoc(affiliateDocRef);
                if (!affiliateSnap.exists) {
                    throw new Error("Affiliate not found.");
                }
                const currentPending = affiliateSnap.data().pendingEarnings || 0;

                if (amountToPay > currentPending) {
                    showFormMessage(markPayoutMessageContainer, 'Amount to pay exceeds pending earnings.', 'error');
                    processPayoutBtn.textContent = 'Process Payout';
                    processPayoutBtn.disabled = false;
                    return;
                }

                await updateDoc(affiliateDocRef, {
                    pendingEarnings: increment(-amountToPay), // Corrected usage
                    paidEarnings: increment(amountToPay),    // Corrected usage
                    payoutHistory: arrayUnion({              // Corrected usage
                        date: serverTimestamp(),             // Corrected usage
                        amount: amountToPay,
                        status: 'paid',
                        transactionId: `TXN_${Date.now()}` 
                    }),
                    updatedAt: serverTimestamp()             // Corrected usage
                });
                showFormMessage(markPayoutMessageContainer, 'Payout processed successfully!', 'success');
                setTimeout(() => {
                    markPayoutModalOverlay.classList.remove('active');
                    document.body.classList.remove('no-scroll');
                    populateAffiliatesTable(); // Refresh affiliates table
                    loadDashboardData(); // Update stats
                }, 1000);
            } catch (error) {
                console.error("Error processing payout:", error);
                showFormMessage(markPayoutMessageContainer, `Error: ${error.message}`, 'error');
            } finally {
                processPayoutBtn.textContent = 'Process Payout';
                processPayoutBtn.disabled = false;
            }
        });
    }

    // --- View Payout History Modal Logic ---
    function openPayoutHistoryModal(affiliate) {
        payoutHistoryAffiliateNameSpan.textContent = affiliate.fullName || affiliate.email;
        payoutHistoryTableBody.innerHTML = '';
        noPayoutHistoryMessage.style.display = 'none';

        const history = affiliate.payoutHistory || [];

        if (history.length === 0) {
            noPayoutHistoryMessage.style.display = 'table-row';
        } else {
            history.sort((a, b) => {
                const dateA = a.date ? (typeof a.date.toDate === 'function' ? a.date.toDate() : new Date(a.date)) : new Date(0);
                const dateB = b.date ? (typeof b.date.toDate === 'function' ? b.date.toDate() : new Date(b.date)) : new Date(0);
                return dateB.getTime() - dateA.getTime();
            });
            history.forEach(item => {
                const row = payoutHistoryTableBody.insertRow();
                let itemDate = 'N/A';
                if (item.date) {
                    try {
                        const dateObj = typeof item.date.toDate === 'function' ? item.date.toDate() : new Date(item.date);
                        if (!isNaN(dateObj.getTime())) {
                            itemDate = dateObj.toLocaleDateString();
                        }
                    } catch (e) {
                        console.warn("Could not parse payout history item date:", item.date, e);
                        itemDate = 'Invalid Date';
                    }
                }
                row.insertCell().textContent = itemDate;
                row.insertCell().textContent = (item.amount || 0).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' });
                row.insertCell().textContent = item.status || 'N/A';
                row.insertCell().textContent = item.transactionId || 'N/A';
            });
        }
        payoutHistoryModalOverlay.classList.add('active');
        document.body.classList.add('no-scroll');
    }

    if (closePayoutHistoryModalBtn) {
        closePayoutHistoryModalBtn.addEventListener('click', () => {
            payoutHistoryModalOverlay.classList.remove('active');
            document.body.classList.remove('no-scroll');
        });
    }
    if (closePayoutHistoryBtnBottom) {
        closePayoutHistoryBtnBottom.addEventListener('click', () => {
            payoutHistoryModalOverlay.classList.remove('active');
            document.body.classList.remove('no-scroll');
        });
    }

    // --- Platform Settings Functions ---
    async function loadSettings() {
        if (!isAdmin) return;
        settingsForm.querySelector('button[type="submit"]').disabled = true;
        settingsMessageContainer.classList.remove('active', 'error', 'success');
        settingsMessageContainer.textContent = 'Loading settings...';
        settingsMessageContainer.classList.add('active', 'info');

        try {
            const docSnap = await getDoc(settingsDocRef);
            if (docSnap.exists()) {
                const settings = docSnap.data();
                platformNameInput.value = settings.platformName || 'MindStack';
                contactEmailInput.value = settings.contactEmail || 'support@mindstack.com';
                defaultCurrencyInput.value = settings.defaultCurrency || '₦';
                enableAffiliateCheckbox.checked = settings.enableAffiliate !== undefined ? settings.enableAffiliate : true;
                maintenanceModeCheckbox.checked = settings.maintenanceMode || false;
                showFormMessage(settingsMessageContainer, 'Platform settings loaded.', 'success');
            } else {
                showFormMessage(settingsMessageContainer, 'No platform settings found. Using defaults.', 'info');
            }
        } catch (error) {
            console.error("Error fetching platform settings:", error);
            showFormMessage(settingsMessageContainer, `Error loading settings: ${error.message}`, 'error');
        } finally {
            settingsForm.querySelector('button[type="submit"]').disabled = false;
        }
    }

    if (settingsForm) {
        settingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!isAdmin) {
                showModal('Access Denied', 'You do not have permission to save settings.', 'error');
                return;
            }
            const submitBtn = settingsForm.querySelector('button[type="submit"]');
            submitBtn.textContent = 'Saving...';
            submitBtn.disabled = true;
            settingsMessageContainer.classList.remove('active', 'error', 'success', 'info');
            settingsMessageContainer.textContent = 'Saving settings...';
            settingsMessageContainer.classList.add('active', 'info');

            const updatedSettings = {
                platformName: platformNameInput.value.trim(),
                contactEmail: contactEmailInput.value.trim(),
                defaultCurrency: defaultCurrencyInput.value.trim(),
                enableAffiliate: enableAffiliateCheckbox.checked,
                maintenanceMode: maintenanceModeCheckbox.checked,
                updatedAt: serverTimestamp() // Corrected usage
            };

            try {
                await setDoc(settingsDocRef, updatedSettings, { merge: true });
                showFormMessage(settingsMessageContainer, 'Platform settings updated successfully!', 'success');
            } catch (error) {
                console.error("Error saving platform settings:", error);
                showFormMessage(settingsMessageContainer, `Error saving settings: ${error.message}`, 'error');
            } finally {
                submitBtn.textContent = 'Save Settings';
                submitBtn.disabled = false;
            }
        });
    }

    // --- Manage Pricing Functions (NEW) ---
    async function fetchPremiumPrice() {
        if (!isAdmin) return;
        premiumPriceInput.disabled = true;
        savePremiumPriceBtn.disabled = true;
        pricingMessage.classList.remove('active', 'error', 'success', 'info');
        pricingMessage.textContent = 'Loading price...';
        pricingMessage.classList.add('active', 'info');

        try {
            const docSnap = await getDoc(settingsDocRef);
            if (docSnap.exists() && docSnap.data().premiumPrice !== undefined) {
                premiumPriceInput.value = docSnap.data().premiumPrice;
                pricingMessage.textContent = 'Premium price loaded.';
                pricingMessage.classList.remove('info');
                pricingMessage.classList.add('success');
            } else {
                premiumPriceInput.value = 0; // Default to 0 if not found
                showFormMessage(pricingMessage, 'Premium price not set. Defaulting to 0. Please set it.', 'info');
            }
        } catch (error) {
            console.error("Error fetching premium price:", error);
            showFormMessage(pricingMessage, `Error loading price: ${error.message}`, 'error');
        } finally {
            premiumPriceInput.disabled = false;
            savePremiumPriceBtn.disabled = false;
        }
    }

    if (savePremiumPriceBtn) {
        savePremiumPriceBtn.addEventListener('click', async () => {
            if (!isAdmin) {
                showModal('Access Denied', 'You do not have permission to set pricing.', 'error');
                return;
            }
            const newPrice = parseFloat(premiumPriceInput.value);
            if (isNaN(newPrice) || newPrice < 0) {
                showFormMessage(pricingMessage, 'Please enter a valid positive number for the price.', 'error');
                return;
            }

            savePremiumPriceBtn.textContent = 'Saving...';
            savePremiumPriceBtn.disabled = true;
            pricingMessage.classList.remove('active', 'error', 'success', 'info');
            pricingMessage.textContent = 'Saving price...';
            pricingMessage.classList.add('active', 'info');

            try {
                await setDoc(settingsDocRef, { premiumPrice: newPrice, updatedAt: serverTimestamp() }, { merge: true }); // Corrected usage
                showFormMessage(pricingMessage, 'Premium price updated successfully!', 'success');
            } catch (error) {
                console.error("Error saving premium price:", error);
                showFormMessage(pricingMessage, `Error saving price: ${error.message}`, 'error');
            } finally {
                savePremiumPriceBtn.textContent = 'Save Premium Price';
                savePremiumPriceBtn.disabled = false;
            }
        });
    }

    // Initial load for the default section (Dashboard) - Handled by onAuthStateChanged
});
