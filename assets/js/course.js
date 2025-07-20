// mindstack/assets/js/course.js

// Import Firebase modules
import { db, doc, getDoc, firebaseConfig } from './firebase.js'; // Import doc and getDoc

document.addEventListener('DOMContentLoaded', async () => {
    // --- UI Elements ---
    // Header elements (re-added mobile menu toggle logic)
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    const mainNav = document.getElementById('mainNav'); // Added ID in HTML
    const body = document.body;

    // Course Hero Section
    const courseMainTitle = document.getElementById('courseMainTitle');
    const courseCategoryTag = document.getElementById('courseCategoryTag');
    const courseAccessBadge = document.getElementById('courseAccessBadge');
    const courseVideoPlayer = document.getElementById('courseVideoPlayer');
    const lockedOverlay = document.getElementById('lockedOverlay');
    const lockMessage = document.getElementById('lockMessage');
    const accessCourseBtn = document.getElementById('accessCourseBtn');

    // Main Content - Description Section
    const courseLongDescription = document.getElementById('courseLongDescription');
    const whatYoullLearnList = document.getElementById('whatYoullLearnList');
    const whoThisIsForList = document.getElementById('whoThisIsForList');
    const prerequisitesList = document.getElementById('prerequisitesList');
    const estimatedTime = document.getElementById('estimatedTime');

    // Main Content - Lesson List Section
    const lessonAccordion = document.getElementById('lessonAccordion');

    // Sidebar Elements
    const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
    const courseSidebarSection = document.querySelector('.course-sidebar-section'); // Select by class
    const instructorAvatar = document.getElementById('instructorAvatar');
    const instructorName = document.getElementById('instructorName');
    const instructorBio = document.getElementById('instructorBio');
    const courseDuration = document.getElementById('courseDuration');
    const courseLevel = document.getElementById('courseLevel');
    const lessonsCount = document.getElementById('lessonsCount');
    const sidebarWhatYoullLearnList = document.getElementById('sidebarWhatYoullLearnList');
    const downloadsList = document.getElementById('downloadsList');

    // --- Mobile Menu Toggle Logic (Copied from main.js) ---
    const closeMobileMenu = () => {
        if (mainNav) mainNav.classList.remove('active');
        if (mobileMenuToggle) mobileMenuToggle.classList.remove('active');
        body.classList.remove('no-scroll');
    };

    const openMobileMenu = () => {
        if (mainNav) mainNav.classList.add('active');
        if (mobileMenuToggle) mobileMenuToggle.classList.add('active');
        body.classList.add('no-scroll');
    };

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', openMobileMenu);
    }

    if (closeMenuBtn) {
        closeMenuBtn.addEventListener('click', closeMobileMenu);
    }

    if (mainNav) {
        mainNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });
    }

    // --- Sidebar Toggle Logic ---
    if (toggleSidebarBtn && courseSidebarSection) {
        toggleSidebarBtn.addEventListener('click', () => {
            courseSidebarSection.classList.toggle('active');
            toggleSidebarBtn.classList.toggle('ri-arrow-left-s-line');
            toggleSidebarBtn.classList.toggle('ri-arrow-right-s-line');
        });
    }

    // --- Course Data Loading Logic ---
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('id');

    if (!courseId) {
        // Handle case where no course ID is provided in the URL
        console.error("No course ID provided in URL.");
        displayCourseNotFound();
        return;
    }

    // Determine the correct appId for the Firestore path
    const currentAppId = typeof __app_id !== 'undefined' ? __app_id : firebaseConfig.projectId;
    const courseDocRef = doc(db, `artifacts/${currentAppId}/public/data/courses`, courseId);

    try {
        const docSnap = await getDoc(courseDocRef);

        if (docSnap.exists()) {
            const course = { id: docSnap.id, ...docSnap.data() };
            console.log("Course data fetched:", course);
            populateCoursePage(course);
        } else {
            console.error("No such course document!");
            displayCourseNotFound();
        }
    } catch (error) {
        console.error("Error fetching course document:", error);
        displayCourseNotFound("Error loading course details. Please try again later.");
    }

    // --- Functions to Populate HTML Elements ---

    function populateCoursePage(course) {
        // Update page title
        document.title = `MindStack - ${course.title}`;

        // Hero Section
        if (courseCategoryTag) courseCategoryTag.textContent = course.category || 'Uncategorized';
        if (courseMainTitle) courseMainTitle.textContent = course.title || 'Course Title';
        if (courseAccessBadge) {
            courseAccessBadge.textContent = course.accessType ? course.accessType.toUpperCase() : 'N/A';
            courseAccessBadge.className = `course-access-badge ${course.accessType || 'default'}`;
        }
        
        // Video Player
        if (courseVideoPlayer && course.videoEmbedUrl) {
            courseVideoPlayer.innerHTML = `
                <iframe width="100%" height="100%" src="${course.videoEmbedUrl}" frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen></iframe>
            `;
        } else if (courseVideoPlayer) {
            courseVideoPlayer.innerHTML = '<p style="text-align: center; padding: 20px;">No video available for this course.</p>';
        }

        // Locked Overlay Logic (Simulated for now, will integrate Auth later)
        // For now, assume if it's premium, it's locked unless we "login"
        const isLoggedIn = false; // Simulate not logged in for testing lock
        const isEnrolled = false; // Simulate not enrolled for testing lock

        if (lockedOverlay) {
            if (course.accessType === 'premium' && !isLoggedIn) { // If premium and not logged in
                lockedOverlay.style.display = 'flex';
                if (lockMessage) lockMessage.textContent = 'Log in or enroll to access this premium content.';
                if (accessCourseBtn) {
                    accessCourseBtn.textContent = 'Log In / Enroll';
                    accessCourseBtn.onclick = () => {
                        console.log('Redirecting to login/enroll page for premium course...');
                        window.location.href = 'login.html'; // Or pricing.html
                    };
                }
            } else if (course.accessType === 'premium' && isLoggedIn && !isEnrolled) { // If premium, logged in, but not enrolled
                lockedOverlay.style.display = 'flex';
                if (lockMessage) lockMessage.textContent = 'Enroll to access this premium content.';
                if (accessCourseBtn) {
                    accessCourseBtn.textContent = 'Enroll Now';
                    accessCourseBtn.onclick = () => {
                        console.log('Redirecting to enrollment/payment for premium course...');
                        window.location.href = 'pricing.html'; // Or a specific enrollment page
                    };
                }
            } else { // Free course, or premium and logged in/enrolled
                lockedOverlay.style.display = 'none';
            }
        }


        // Main Content - Description Section
        if (courseLongDescription) courseLongDescription.innerHTML = course.longDescription || '<p>No detailed description available.</p>';
        
        populateList(whatYoullLearnList, course.whatYoullLearn, 'ri-check-line');
        populateList(whoThisIsForList, course.whoThisIsFor);
        populateList(prerequisitesList, course.prerequisites);
        if (estimatedTime) estimatedTime.innerHTML = `Approximately <strong>${course.estimatedTime || 'N/A'}</strong> of video content and exercises.`;

        // Lesson List Section (Curriculum)
        populateCurriculum(lessonAccordion, course.curriculum, course.accessType, isLoggedIn, isEnrolled);

        // Sidebar Elements
        if (instructorAvatar) instructorAvatar.src = course.instructor?.avatarUrl || 'https://placehold.co/80x80/E0F2F7/0ED2F7?text=NA';
        if (instructorName) instructorName.textContent = course.instructor?.name || 'N/A';
        if (instructorBio) instructorBio.textContent = course.instructor?.bio || 'No bio available.';
        if (courseDuration) courseDuration.textContent = course.courseMeta?.duration || 'N/A';
        if (courseLevel) courseLevel.textContent = course.courseMeta?.level || 'N/A';
        if (lessonsCount) lessonsCount.textContent = course.courseMeta?.lessonsCount || 'N/A';
        
        populateList(sidebarWhatYoullLearnList, course.whatYoullLearn); // Re-use whatYoullLearn for sidebar
        populateDownloads(downloadsList, course.downloads);

        // Initialize accordion functionality after content is loaded
        initAccordion();
    }

    function populateList(ulElement, items, iconClass = '') {
        if (ulElement) {
            ulElement.innerHTML = ''; // Clear existing
            if (items && Array.isArray(items) && items.length > 0) {
                items.forEach(item => {
                    const li = document.createElement('li');
                    li.innerHTML = iconClass ? `<i class="${iconClass}"></i> ${item}` : item;
                    ulElement.appendChild(li);
                });
            } else {
                ulElement.innerHTML = '<li>No items available.</li>';
            }
        }
    }

    function populateDownloads(ulElement, downloads) {
        if (ulElement) {
            ulElement.innerHTML = ''; // Clear existing
            if (downloads && Array.isArray(downloads) && downloads.length > 0) {
                downloads.forEach(item => {
                    const li = document.createElement('li');
                    li.innerHTML = `<a href="${item.url}" class="download-item"><i class="${item.icon || 'ri-file-line'}"></i> ${item.name}</a>`;
                    ulElement.appendChild(li);
                });
            } else {
                ulElement.innerHTML = '<li>No downloads available.</li>';
            }
        }
    }

    function populateCurriculum(accordionContainer, curriculum, courseAccessType, isLoggedIn, isEnrolled) {
        if (accordionContainer) {
            accordionContainer.innerHTML = ''; // Clear existing
            if (curriculum && Array.isArray(curriculum) && curriculum.length > 0) {
                curriculum.forEach((module, moduleIndex) => {
                    const accordionItem = document.createElement('div');
                    accordionItem.classList.add('accordion-item');
                    accordionItem.innerHTML = `
                        <button class="accordion-header">
                            ${module.moduleTitle}
                            <i class="ri-arrow-down-s-line accordion-icon"></i>
                        </button>
                        <div class="accordion-content">
                            <ul>
                                ${module.lessons.map(lesson => {
                                    const isLessonLocked = lesson.isLocked && (courseAccessType === 'premium' && (!isLoggedIn || !isEnrolled));
                                    const iconHtml = isLessonLocked ? '<i class="ri-lock-fill locked"></i>' : (lesson.status === 'completed' ? '<i class="ri-checkbox-circle-line completed"></i>' : '<i class="ri-checkbox-circle-line"></i>');
                                    return `<li>${iconHtml} ${lesson.title} (${lesson.duration})</li>`;
                                }).join('')}
                            </ul>
                        </div>
                    `;
                    accordionContainer.appendChild(accordionItem);
                });
            } else {
                accordionContainer.innerHTML = '<p>No curriculum available for this course.</p>';
            }
        }
    }

    // Function to initialize accordion functionality (re-applied after dynamic content)
    function initAccordion() {
        const accordionHeaders = document.querySelectorAll('.lesson-accordion .accordion-header');
        accordionHeaders.forEach(header => {
            header.removeEventListener('click', handleAccordionClick); // Prevent duplicate listeners
            header.addEventListener('click', handleAccordionClick);
        });
    }

    function handleAccordionClick() {
        const content = this.nextElementSibling;
        this.classList.toggle('active');
        if (content.style.maxHeight) {
            content.style.maxHeight = null;
            content.style.paddingTop = '0';
            content.style.paddingBottom = '0';
        } else {
            // Close others
            document.querySelectorAll('.lesson-accordion .accordion-header.active').forEach(otherHeader => {
                if (otherHeader !== this) {
                    otherHeader.classList.remove('active');
                    otherHeader.nextElementSibling.style.maxHeight = null;
                    otherHeader.nextElementSibling.style.paddingTop = '0';
                    otherHeader.nextElementSibling.style.paddingBottom = '0';
                }
            });
            // Open this one
            content.style.maxHeight = content.scrollHeight + 30 + 'px'; // 15px top + 15px bottom padding
            content.style.paddingTop = '15px';
            content.style.paddingBottom = '15px';
        }
    }

    function displayCourseNotFound(message = "The course you are looking for could not be found.") {
        // Clear main content and display an error message
        const mainContent = document.querySelector('.course-main-content');
        const sidebar = document.querySelector('.course-sidebar-section');
        const heroContent = document.querySelector('.course-hero-section .hero-content');

        if (mainContent) mainContent.innerHTML = `<section class="course-details-section"><h2 style="text-align: center; color: var(--color-red); margin-top: 50px;">${message}</h2><p style="text-align: center; margin-top: 20px;">Please check the URL or return to the <a href="courses.html" style="color: var(--color-teal); font-weight: 600;">All Courses</a> page.</p></section>`;
        if (sidebar) sidebar.style.display = 'none'; // Hide sidebar
        if (heroContent) heroContent.innerHTML = `<h1 style="text-align: center; color: var(--color-white); font-size: 3em;">Course Not Found</h1><p style="text-align: center; color: rgba(255,255,255,0.8); margin-top: 10px;">We couldn't find details for this course.</p>`;
        document.title = "MindStack - Course Not Found";
    }
});
