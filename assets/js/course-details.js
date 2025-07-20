// mindstack/assets/js/course-details.js

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
    let currentUserRole = 'student'; // Default role
    let currentCourseId = null;

    // Determine the correct appId for the Firestore path
    const currentAppId = typeof __app_id !== 'undefined' ? __app_id : firebaseConfig.projectId;
    console.log("course-details.js: Using currentAppId:", currentAppId);

    // --- UI Elements ---
    const courseTitleHeader = document.getElementById('courseTitleHeader');
    const introVideoEmbed = document.getElementById('introVideoEmbed');
    const courseTitleOverview = document.getElementById('courseTitleOverview');
    const courseShortDescription = document.getElementById('courseShortDescription');
    const courseDuration = document.getElementById('courseDuration');
    const courseLevel = document.getElementById('courseLevel');
    const courseLessonsCount = document.getElementById('courseLessonsCount');
    const courseAccessTypeSpan = document.getElementById('courseAccessType');
    const courseActionButton = document.getElementById('courseActionButton');

    const courseLongDescription = document.getElementById('courseLongDescription');
    const whatYoullLearnList = document.getElementById('whatYoullLearnList');
    const curriculumContent = document.getElementById('curriculumContent');
    const noCurriculumMessage = document.getElementById('noCurriculumMessage');
    const instructorAvatar = document.getElementById('instructorAvatar');
    const instructorName = document.getElementById('instructorName');
    const instructorBio = document.getElementById('instructorBio');
    const downloadsSection = document.getElementById('downloadsSection');
    const downloadsList = document.getElementById('downloadsList');
    const noDownloadsMessage = document.getElementById('noDownloadsMessage');
    const prerequisitesSection = document.getElementById('prerequisitesSection');
    const prerequisitesList = document.getElementById('prerequisitesList');
    const noPrerequisitesMessage = document.getElementById('noPrerequisitesMessage');

    // Generic Message Modal Elements
    const messageModalOverlay = document.getElementById('messageModalOverlay');
    const messageModalTitle = document.getElementById('messageModalTitle');
    const messageModalText = document.getElementById('messageModalText');
    const messageModalCloseBtn = document.getElementById('messageModalCloseBtn'); // OK button
    const closeMessageModalBtnTop = document.querySelector('#messageModalOverlay .close-modal-btn'); // Top close button for generic message modal


    // --- Helper Functions ---
    function getCourseIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
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

    // --- Firebase Auth State and Data Fetching ---
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            currentUserId = user.uid;
            console.log("Course Details: User logged in:", user.email || user.uid);

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
                await fetchCourseDetails(currentCourseId);
            } else {
                showModal('Error', 'No course ID provided in the URL.', 'error');
                console.error("No course ID in URL.");
            }

        } else {
            currentUser = null;
            currentUserId = null;
            currentUserRole = 'student';
            console.log("Course Details: No user logged in. Redirecting to login.");
            showModal('Login Required', 'You need to be logged in to view course details.', 'info');
            setTimeout(() => {
                window.location.href = 'login.html'; // Redirect to login page
            }, 2000); // Give user time to read message
        }
    });

    async function fetchCourseDetails(courseId) {
        const courseDocRef = doc(db, `artifacts/${currentAppId}/public/data/courses`, courseId);
        try {
            const docSnap = await getDoc(courseDocRef);
            if (docSnap.exists()) {
                const course = docSnap.data();
                console.log("Course data fetched:", course);
                populateCourseDetails(course);
                setupCourseActionButton(course);
            } else {
                showModal('Course Not Found', 'The course you are looking for does not exist.', 'error');
                console.error("Course document not found for ID:", courseId);
                // Optionally redirect back to dashboard or courses list
                setTimeout(() => { window.location.href = 'dashboard.html'; }, 3000);
            }
        } catch (error) {
            console.error("Error fetching course details:", error);
            showModal('Error', `Failed to load course details: ${error.message}`, 'error');
        }
    }

    function populateCourseDetails(course) {
        // Basic Info
        if (courseTitleHeader) courseTitleHeader.textContent = course.title || 'Untitled Course';
        if (introVideoEmbed) introVideoEmbed.src = course.videoEmbedUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ'; // Fallback Rickroll
        if (courseTitleOverview) courseTitleOverview.textContent = course.title || 'Untitled Course';
        if (courseShortDescription) courseShortDescription.textContent = course.shortDescription || 'No description available.';

        // Meta Info
        if (courseDuration) courseDuration.textContent = course.courseMeta?.duration || 'N/A';
        if (courseLevel) courseLevel.textContent = course.courseMeta?.level ? course.courseMeta.level.charAt(0).toUpperCase() + course.courseMeta.level.slice(1) : 'N/A';
        if (courseLessonsCount) courseLessonsCount.textContent = course.courseMeta?.lessonsCount || '0';

        // Access Type Styling
        if (courseAccessTypeSpan) {
            courseAccessTypeSpan.textContent = course.accessType ? course.accessType.charAt(0).toUpperCase() + course.accessType.slice(1) : 'N/A';
            courseAccessTypeSpan.classList.remove('free', 'premium'); // Clear existing classes
            if (course.accessType) {
                courseAccessTypeSpan.classList.add(course.accessType);
            }
        }

        // Long Description
        if (courseLongDescription) courseLongDescription.textContent = course.longDescription || 'No detailed description provided for this course.';

        // What You'll Learn
        if (whatYoullLearnList) {
            whatYoullLearnList.innerHTML = '';
            if (course.whatYoullLearn && course.whatYoullLearn.length > 0) {
                course.whatYoullLearn.forEach(item => {
                    const li = document.createElement('li');
                    li.textContent = item;
                    whatYoullLearnList.appendChild(li);
                });
            } else {
                whatYoullLearnList.innerHTML = '<li>No specific learning outcomes listed.</li>';
            }
        }

        // Curriculum
        if (curriculumContent) {
            curriculumContent.innerHTML = '';
            if (course.curriculum && course.curriculum.length > 0) {
                noCurriculumMessage.style.display = 'none';
                course.curriculum.forEach(module => {
                    const moduleDiv = document.createElement('div');
                    moduleDiv.classList.add('curriculum-module');
                    moduleDiv.innerHTML = `
                        <div class="curriculum-module-header">
                            <span>${module.moduleTitle || 'Untitled Module'}</span>
                            <i class="ri-arrow-right-s-line"></i>
                        </div>
                        <div class="curriculum-lessons">
                            <!-- Lessons will be populated here -->
                        </div>
                    `;
                    const lessonsList = moduleDiv.querySelector('.curriculum-lessons');
                    if (module.lessons && module.lessons.length > 0) {
                        module.lessons.forEach(lesson => {
                            const lessonItem = document.createElement('div');
                            lessonItem.classList.add('curriculum-lesson-item');
                            const lockIcon = lesson.isLocked ? '<i class="ri-lock-fill lesson-locked"></i>' : '<i class="ri-play-circle-fill"></i>';
                            lessonItem.innerHTML = `
                                ${lockIcon}
                                <span class="lesson-title">${lesson.title || 'Untitled Lesson'}</span>
                                <span class="lesson-duration">${lesson.duration || ''}</span>
                            `;
                            lessonsList.appendChild(lessonItem);
                        });
                    } else {
                        lessonsList.innerHTML = '<div class="curriculum-lesson-item">No lessons in this module.</div>';
                    }

                    // Toggle functionality for modules
                    moduleDiv.querySelector('.curriculum-module-header').addEventListener('click', () => {
                        moduleDiv.classList.toggle('open');
                        // Adjust max-height for smooth transition
                        lessonsList.style.maxHeight = moduleDiv.classList.contains('open') ? lessonsList.scrollHeight + "px" : "0";
                    });

                    curriculumContent.appendChild(moduleDiv);
                });
            } else {
                noCurriculumMessage.style.display = 'block';
            }
        }

        // Instructor
        if (instructorAvatar) instructorAvatar.src = course.instructor?.avatarUrl || 'https://placehold.co/80x80/E0F2F7/0ED2F7?text=NA';
        if (instructorName) instructorName.textContent = course.instructor?.name || 'N/A';
        if (instructorBio) instructorBio.textContent = course.instructor?.bio || 'No biography provided.';

        // Downloads
        if (downloadsSection) {
            if (course.downloads && course.downloads.length > 0) {
                downloadsSection.style.display = 'block';
                downloadsList.innerHTML = '';
                noDownloadsMessage.style.display = 'none';
                course.downloads.forEach(download => {
                    const li = document.createElement('li');
                    li.innerHTML = `<a href="${download.url}" target="_blank" rel="noopener noreferrer"><i class="${download.icon || 'ri-download-2-line'}"></i> ${download.name || 'Download'}</a>`;
                    downloadsList.appendChild(li);
                });
            } else {
                downloadsSection.style.display = 'none';
            }
        }

        // Prerequisites
        if (prerequisitesSection) {
            if (course.prerequisites && course.prerequisites.length > 0) {
                prerequisitesSection.style.display = 'block';
                prerequisitesList.innerHTML = '';
                noPrerequisitesMessage.style.display = 'none';
                course.prerequisites.forEach(item => {
                    const li = document.createElement('li');
                    li.textContent = item;
                    prerequisitesList.appendChild(li);
                });
            } else {
                prerequisitesSection.style.display = 'none';
            }
        }
    }

    function setupCourseActionButton(course) {
        if (!courseActionButton) return;

        // For simplicity, we'll assume a premium user has access to premium courses for now.
        // A more robust system would check a user's 'enrolledCourses' subcollection.
        const hasAccessToPremium = currentUserRole === 'premium' || currentUserRole === 'admin'; // Assuming 'premium' is a role for premium access

        if (course.accessType === 'free') {
            courseActionButton.textContent = 'Start Course';
            courseActionButton.classList.remove('btn-secondary');
            courseActionButton.classList.add('btn-primary');
            courseActionButton.onclick = () => {
                // Redirect to a course player page for free content
                window.location.href = `course-player.html?courseId=${currentCourseId}`;
            };
        } else if (course.accessType === 'premium') {
            if (hasAccessToPremium) { // If user has a premium role (or is admin)
                courseActionButton.textContent = 'Continue Course';
                courseActionButton.classList.remove('btn-secondary');
                courseActionButton.classList.add('btn-primary');
                courseActionButton.onclick = () => {
                    // Redirect to a course player page for premium content
                    window.location.href = `course-player.html?courseId=${currentCourseId}`;
                };
            } else {
                courseActionButton.textContent = 'Enroll Now (Premium)';
                courseActionButton.classList.remove('btn-primary');
                courseActionButton.classList.add('btn-secondary');
                courseActionButton.onclick = () => {
                    // Show modal for enrollment/payment
                    showModal('Enroll in Premium Course', 'This is a premium course. Please upgrade your subscription to gain access!', 'info');
                    // In a real app, this would redirect to a payment/pricing page:
                    // window.location.href = 'pricing.html'; 
                };
            }
        } else {
            courseActionButton.textContent = 'Access Unavailable';
            courseActionButton.disabled = true;
            courseActionButton.classList.remove('btn-primary', 'btn-secondary');
        }
    }
});
