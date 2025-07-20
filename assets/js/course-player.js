// mindstack/assets/js/course-player.js

import {
    auth,
    db,
    doc,
    getDoc,
    onAuthStateChanged,
    firebaseConfig
} from './firebase.js';

document.addEventListener('DOMContentLoaded', async () => {
    // --- Global Variables ---
    let currentUser = null;
    let currentUserId = null;
    let currentUserRole = 'student';
    let currentCourseId = null;
    let courseData = null;
    let currentModuleIndex = 0;
    let currentLessonIndex = 0;

    // Determine the correct appId for the Firestore path
    const currentAppId = typeof __app_id !== 'undefined' ? __app_id : firebaseConfig.projectId;
    console.log("course-player.js: Using currentAppId:", currentAppId);

    // --- UI Elements ---
    const curriculumSidebar = document.getElementById('curriculumSidebar');
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');
    const sidebarCourseTitle = document.getElementById('sidebarCourseTitle');
    const curriculumList = document.getElementById('curriculumList');
    const currentLessonTitle = document.getElementById('currentLessonTitle');
    const lessonVideoEmbed = document.getElementById('lessonVideoEmbed');
    const markCompleteBtn = document.getElementById('markCompleteBtn');
    const nextLessonBtn = document.getElementById('nextLessonBtn');
    const lessonContentDiv = document.getElementById('lessonContent');
    const downloadsSection = document.getElementById('downloadsSection');
    const downloadsList = document.getElementById('downloadsList');
    const noDownloadsMessage = document.getElementById('noDownloadsMessage');

    // Generic Message Modal Elements
    const messageModalOverlay = document.getElementById('messageModalOverlay');
    const messageModalTitle = document.getElementById('messageModalTitle');
    const messageModalText = document.getElementById('messageModalText');
    const messageModalCloseBtn = document.getElementById('messageModalCloseBtn');
    const closeMessageModalBtnTop = document.querySelector('#messageModalOverlay .close-modal-btn');

    // --- Helper Functions ---
    function getCourseIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('courseId');
    }

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
            messageModalOverlay.classList.remove('active', 'success', 'error');
            document.body.style.overflow = '';
        }
    }

    if (messageModalCloseBtn) messageModalCloseBtn.addEventListener('click', hideModal);
    if (closeMessageModalBtnTop) closeMessageModalBtnTop.addEventListener('click', hideModal);
    if (messageModalOverlay) {
        messageModalOverlay.addEventListener('click', (e) => {
            if (e.target === messageModalOverlay) {
                hideModal();
            }
        });
    }

    // --- Sidebar Toggle for Mobile ---
    if (hamburgerMenu) {
        hamburgerMenu.addEventListener('click', () => {
            curriculumSidebar.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
    if (closeSidebarBtn) {
        closeSidebarBtn.addEventListener('click', () => {
            curriculumSidebar.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    // --- Firebase Auth State and Course Data Fetching ---
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            currentUserId = user.uid;
            console.log("Course Player: User logged in:", user.email || user.uid);

            // Fetch user role from Firestore
            const userDocRef = doc(db, `artifacts/${currentAppId}/users`, user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                currentUserRole = userDocSnap.data().role || 'student';
            } else {
                console.warn("User document not found for current user. Defaulting role to student.");
            }

            currentCourseId = getCourseIdFromUrl();
            if (currentCourseId) {
                await fetchCourseData(currentCourseId);
            } else {
                showModal('Error', 'No course ID provided in the URL. Redirecting to dashboard.', 'error');
                console.error("No course ID in URL.");
                setTimeout(() => { window.location.href = 'dashboard.html'; }, 2000);
            }

        } else {
            currentUser = null;
            currentUserId = null;
            currentUserRole = 'student';
            console.log("Course Player: No user logged in. Redirecting to login.");
            showModal('Login Required', 'You need to be logged in to access the course player.', 'info');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        }
    });

    async function fetchCourseData(courseId) {
        const courseDocRef = doc(db, `artifacts/${currentAppId}/public/data/courses`, courseId);
        try {
            const docSnap = await getDoc(courseDocRef);
            if (docSnap.exists()) {
                courseData = docSnap.data();
                console.log("Course data fetched:", courseData);

                // Check access permissions
                const hasAccessToPremium = currentUserRole === 'premium' || currentUserRole === 'admin';
                if (courseData.accessType === 'premium' && !hasAccessToPremium) {
                    showModal('Access Denied', 'This is a premium course. Please upgrade your subscription to access its content.', 'error');
                    setTimeout(() => { window.location.href = `course-details.html?id=${courseId}`; }, 3000);
                    return;
                }

                // Populate sidebar title
                if (sidebarCourseTitle) sidebarCourseTitle.textContent = courseData.title || 'Course';

                // Populate curriculum and load first lesson
                populateCurriculum(courseData.curriculum);
                loadLesson(currentModuleIndex, currentLessonIndex);

            } else {
                showModal('Course Not Found', 'The course you are looking for does not exist. Redirecting to dashboard.', 'error');
                console.error("Course document not found for ID:", courseId);
                setTimeout(() => { window.location.href = 'dashboard.html'; }, 3000);
            }
        } catch (error) {
            console.error("Error fetching course data:", error);
            showModal('Error', `Failed to load course: ${error.message}`, 'error');
            setTimeout(() => { window.location.href = 'dashboard.html'; }, 3000);
        }
    }

    function populateCurriculum(curriculum) {
        if (!curriculumList) return;
        curriculumList.innerHTML = ''; // Clear loading message

        if (!curriculum || curriculum.length === 0) {
            curriculumList.innerHTML = '<p class="loading-message">No curriculum available for this course.</p>';
            return;
        }

        curriculum.forEach((module, modIdx) => {
            const moduleDiv = document.createElement('div');
            moduleDiv.classList.add('curriculum-module-item');
            if (modIdx === currentModuleIndex) { // Open first module by default
                moduleDiv.classList.add('open');
            }

            moduleDiv.innerHTML = `
                <div class="curriculum-module-header">
                    <span>${module.moduleTitle || `Module ${modIdx + 1}`}</span>
                    <i class="ri-arrow-right-s-line"></i>
                </div>
                <div class="curriculum-lessons-list">
                    <!-- Lessons will be populated here -->
                </div>
            `;
            const lessonsListContainer = moduleDiv.querySelector('.curriculum-lessons-list');

            if (module.lessons && module.lessons.length > 0) {
                module.lessons.forEach((lesson, lesIdx) => {
                    const lessonItem = document.createElement('div');
                    lessonItem.classList.add('curriculum-lesson-item');
                    lessonItem.dataset.moduleIndex = modIdx;
                    lessonItem.dataset.lessonIndex = lesIdx;

                    const isLocked = lesson.isLocked && courseData.accessType === 'premium' && currentUserRole === 'student'; // Only locked for students on premium courses
                    lessonItem.classList.toggle('locked', isLocked);

                    const iconClass = isLocked ? 'ri-lock-fill' : 'ri-play-circle-fill';

                    lessonItem.innerHTML = `
                        <i class="${iconClass}"></i>
                        <span class="lesson-title">${lesson.title || `Lesson ${lesIdx + 1}`}</span>
                        <span class="lesson-duration">${lesson.duration || ''}</span>
                    `;
                    lessonsListContainer.appendChild(lessonItem);

                    lessonItem.addEventListener('click', () => {
                        if (isLocked) {
                            showModal('Premium Content', 'This lesson is part of a premium course. Please upgrade your subscription to access it.', 'info');
                            return;
                        }
                        loadLesson(modIdx, lesIdx);
                        if (window.innerWidth <= 992) { // Close sidebar on mobile after selection
                            curriculumSidebar.classList.remove('active');
                            document.body.style.overflow = '';
                        }
                    });
                });
            } else {
                lessonsListContainer.innerHTML = '<div class="curriculum-lesson-item">No lessons in this module.</div>';
            }

            // Toggle module open/close
            moduleDiv.querySelector('.curriculum-module-header').addEventListener('click', () => {
                moduleDiv.classList.toggle('open');
                // Set max-height for smooth transition
                lessonsListContainer.style.maxHeight = moduleDiv.classList.contains('open') ? lessonsListContainer.scrollHeight + "px" : "0";
            });

            curriculumList.appendChild(moduleDiv);

            // Set initial max-height for the first module if it's open
            if (modIdx === currentModuleIndex) {
                lessonsListContainer.style.maxHeight = lessonsListContainer.scrollHeight + "px";
            }
        });
    }

    function loadLesson(modIdx, lesIdx) {
        if (!courseData || !courseData.curriculum || !courseData.curriculum[modIdx] || !courseData.curriculum[modIdx].lessons || !courseData.curriculum[modIdx].lessons[lesIdx]) {
            console.error("Invalid module or lesson index.");
            showModal('Error', 'Could not load lesson. Please try again.', 'error');
            return;
        }

        const lesson = courseData.curriculum[modIdx].lessons[lesIdx];
        const isLocked = lesson.isLocked && courseData.accessType === 'premium' && currentUserRole === 'student';

        if (isLocked) {
            showModal('Premium Content', 'This lesson is locked. Please upgrade your subscription to access it.', 'info');
            return;
        }

        currentModuleIndex = modIdx;
        currentLessonIndex = lesIdx;

        // Update main content area
        currentLessonTitle.textContent = lesson.title || 'Untitled Lesson';
        lessonVideoEmbed.src = lesson.videoEmbedUrl || courseData.videoEmbedUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ'; // Use lesson video, fallback to course intro, then rickroll
        lessonContentDiv.innerHTML = `<p>${lesson.content || 'No detailed content provided for this lesson.'}</p>`; // Assuming 'content' field for lesson details

        // Populate downloads (if any for this lesson/course)
        populateDownloads(lesson.downloads || courseData.downloads); // Lesson specific downloads first, then course-wide

        // Highlight active lesson in sidebar
        document.querySelectorAll('.curriculum-lesson-item').forEach(item => item.classList.remove('active'));
        const activeLessonElement = document.querySelector(`.curriculum-lesson-item[data-module-index="${modIdx}"][data-lesson-index="${lesIdx}"]`);
        if (activeLessonElement) {
            activeLessonElement.classList.add('active');
            // Ensure its parent module is open
            const parentModule = activeLessonElement.closest('.curriculum-module-item');
            if (parentModule && !parentModule.classList.contains('open')) {
                parentModule.classList.add('open');
                const lessonsListContainer = parentModule.querySelector('.curriculum-lessons-list');
                if (lessonsListContainer) {
                    lessonsListContainer.style.maxHeight = lessonsListContainer.scrollHeight + "px";
                }
            }
            // Scroll active lesson into view if needed
            activeLessonElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        // Update Mark Complete / Next Lesson button states
        updateLessonNavigationButtons();
    }

    function populateDownloads(downloads) {
        if (!downloadsSection || !downloadsList || !noDownloadsMessage) return;

        downloadsList.innerHTML = '';
        if (downloads && downloads.length > 0) {
            downloadsSection.style.display = 'block';
            noDownloadsMessage.style.display = 'none';
            downloads.forEach(download => {
                const li = document.createElement('li');
                li.innerHTML = `<a href="${download.url}" target="_blank" rel="noopener noreferrer"><i class="${download.icon || 'ri-download-2-line'}"></i> ${download.name || 'Download'}</a>`;
                downloadsList.appendChild(li);
            });
        } else {
            downloadsSection.style.display = 'none';
            noDownloadsMessage.style.display = 'none'; // Keep hidden if no downloads
        }
    }

    function updateLessonNavigationButtons() {
        if (!markCompleteBtn || !nextLessonBtn) return;

        markCompleteBtn.onclick = () => {
            showModal('Lesson Complete!', `You marked "${courseData.curriculum[currentModuleIndex].lessons[currentLessonIndex].title}" as complete.`, 'success');
            // In a real app, this would update user's progress in Firestore
            // updateLessonProgress(currentCourseId, currentModuleIndex, currentLessonIndex, 'completed');
        };

        // Determine if there's a next lesson
        const currentModule = courseData.curriculum[currentModuleIndex];
        const nextLessonIdx = currentLessonIndex + 1;
        let nextModuleIdx = currentModuleIndex;
        let hasNextLesson = false;

        if (nextLessonIdx < currentModule.lessons.length) {
            hasNextLesson = true;
        } else {
            // Check next module
            nextModuleIdx++;
            if (nextModuleIdx < courseData.curriculum.length) {
                if (courseData.curriculum[nextModuleIdx].lessons && courseData.curriculum[nextModuleIdx].lessons.length > 0) {
                    hasNextLesson = true;
                }
            }
        }

        if (hasNextLesson) {
            nextLessonBtn.style.display = 'inline-flex';
            nextLessonBtn.onclick = () => {
                let targetModIdx = currentModuleIndex;
                let targetLesIdx = currentLessonIndex + 1;

                if (targetLesIdx >= currentModule.lessons.length) {
                    targetModIdx++;
                    targetLesIdx = 0;
                }
                loadLesson(targetModIdx, targetLesIdx);
            };
        } else {
            nextLessonBtn.style.display = 'none';
            // Optionally show a "Course Complete" button or redirect
            markCompleteBtn.textContent = 'Course Finished!';
            markCompleteBtn.classList.add('btn-primary');
            markCompleteBtn.classList.remove('btn-secondary');
            markCompleteBtn.onclick = () => {
                showModal('Course Finished!', 'Congratulations! You have completed all lessons in this course.', 'success');
                // Redirect to dashboard or certificate page
                // setTimeout(() => { window.location.href = 'dashboard.html'; }, 3000);
            };
        }
    }
});
