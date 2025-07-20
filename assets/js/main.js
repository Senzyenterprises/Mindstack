// mindstack/assets/js/main.js

// Import Firebase modules, including firebaseConfig
import { db, collection, addDoc, query, where, limit, onSnapshot, firebaseConfig } from './firebase.js'; // Added query, where, limit, onSnapshot

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Mobile Menu Toggle ---
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    const mainNav = document.querySelector('.main-nav');
    const body = document.body;

    const closeMobileMenu = () => {
        mainNav.classList.remove('active');
        mobileMenuToggle.classList.remove('active');
        body.classList.remove('no-scroll');
    };

    const openMobileMenu = () => {
        mainNav.classList.add('active');
        mobileMenuToggle.classList.add('active');
        body.classList.add('no-scroll');
    };

    if (mobileMenuToggle && mainNav) {
        mobileMenuToggle.addEventListener('click', openMobileMenu);
    }

    if (closeMenuBtn && mainNav) {
        closeMenuBtn.addEventListener('click', closeMobileMenu);
    }

    if (mainNav) {
        mainNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });
    }


    // --- 2. "Rolling Circles" Text Effect for Hero Headline ---
    const heroHeadline = document.querySelector('.hero-content h1');

    if (heroHeadline) {
        const originalText = heroHeadline.textContent;
        const wordToAnimate = 'Stack';
        
        if (originalText.includes(wordToAnimate)) {
            const animatedWordHTML = `<span class="animated-word">${wordToAnimate}</span>`;
            heroHeadline.innerHTML = originalText.replace(wordToAnimate, animatedWordHTML);

            const targetWordElement = heroHeadline.querySelector('.animated-word');

            if (targetWordElement) {
                const createDot = () => {
                    const dot = document.createElement('span');
                    dot.classList.add('rolling-dot');
                    
                    const xOffset = (Math.random() - 0.5) * 50;
                    const yOffset = (Math.random() - 0.5) * 30;

                    dot.style.setProperty('--x-offset', `${xOffset}px`);
                    dot.style.setProperty('--y-offset', `${yOffset}px`);
                    dot.style.setProperty('--animation-delay', `${Math.random() * 2}s`);

                    targetWordElement.appendChild(dot);

                    dot.addEventListener('animationend', () => {
                        dot.remove();
                    });
                };

                setInterval(createDot, 500);
            }
        }
    }

    // --- 3. Cookie Consent Banner Logic ---
    const cookieBanner = document.getElementById('cookieBanner');
    const acceptCookiesBtn = document.getElementById('acceptCookies');
    const declineCookiesBtn = document.getElementById('declineCookies');
    const manageCookiesBtn = document.getElementById('manageCookies');

    // Check localStorage for cookie consent status
    const cookieConsentStatus = localStorage.getItem('mindstackCookieConsent');

    // If no consent status is found, show the banner
    if (!cookieConsentStatus && cookieBanner) {
        // Use a slight delay to ensure CSS transitions apply
        setTimeout(() => {
            cookieBanner.classList.add('show');
        }, 500); // Delay of 0.5 seconds
    }

    // Event listener for "Accept" button
    if (acceptCookiesBtn && cookieBanner) {
        acceptCookiesBtn.addEventListener('click', () => {
            localStorage.setItem('mindstackCookieConsent', 'accepted');
            cookieBanner.classList.remove('show'); // Hide the banner
        });
    }

    // Event listener for "Decline" button
    if (declineCookiesBtn && cookieBanner) {
        declineCookiesBtn.addEventListener('click', () => {
            localStorage.setItem('mindstackCookieConsent', 'declined');
            cookieBanner.classList.remove('show'); // Hide the banner
            // In a real application, you would also disable non-essential cookies here
            console.log("Cookies declined. Non-essential cookies would be disabled.");
        });
    }

    // Event listener for "Manage Cookies" button
    if (manageCookiesBtn && cookieBanner) {
        manageCookiesBtn.addEventListener('click', () => {
            alert("To manage your cookie preferences, you can either accept/decline here, or clear your browser's site data for MindStack to reset your choice.");
        });
    }

    // --- 4. Newsletter Subscription with Firebase Firestore ---
    const newsletterForm = document.getElementById('newsletterForm');
    const newsletterEmailInput = document.getElementById('newsletterEmail');
    const newsletterMessage = document.getElementById('newsletterMessage');

    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent default form submission

            const email = newsletterEmailInput.value.trim();

            if (!email) {
                displayNewsletterMessage('Please enter your email address.', 'error');
                return;
            }

            // Basic email format validation
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                displayNewsletterMessage('Please enter a valid email address.', 'error');
                return;
            }

            try {
                // Determine the correct appId for the Firestore path
                const currentAppId = typeof __app_id !== 'undefined' ? __app_id : firebaseConfig.projectId;
                
                const newsletterCollectionRef = collection(db, `artifacts/${currentAppId}/public/data/newsletter_subscribers`);
                
                await addDoc(newsletterCollectionRef, {
                    email: email,
                    subscribedAt: new Date(),
                });

                displayNewsletterMessage('Thank you for subscribing!', 'success');
                newsletterForm.reset(); // Clear the form
            } catch (error) {
                console.error("Error adding document: ", error);
                displayNewsletterMessage('Subscription failed. Please try again later.', 'error');
            }
        });
    }

    function displayNewsletterMessage(message, type) {
        if (newsletterMessage) {
            newsletterMessage.textContent = message;
            newsletterMessage.className = `newsletter-message ${type}`; // Apply type class for styling
            newsletterMessage.style.display = 'block'; // Show the message

            setTimeout(() => {
                newsletterMessage.style.display = 'none'; // Hide after 5 seconds
                newsletterMessage.textContent = '';
                newsletterMessage.className = 'newsletter-message'; // Reset class
            }, 5000);
        }
    }

    // --- 5. Featured Courses from Firebase Firestore ---
    const featuredCourseGrid = document.getElementById('featuredCourseGrid');

    // Function to create a single featured course card HTML (matching index.html's structure)
    function createFeaturedCourseCard(course) {
        const cardAnchor = document.createElement('a');
        cardAnchor.href = `course.html?id=${course.id}`;
        cardAnchor.classList.add('course-card');

        // Use course.accessType from Firestore for badge class and text
        // Ensure the badge class matches your CSS (e.g., 'badge-free' vs 'free')
        const badgeClass = course.accessType === 'free' ? 'badge-free' : 'badge-premium';
        const badgeText = course.accessType.toUpperCase();

        cardAnchor.innerHTML = `
            <img src="${course.thumbnailUrl}" alt="${course.title} Thumbnail" class="course-thumbnail">
            <div class="course-info">
                <h3>${course.title}</h3>
                <p class="instructor">By ${course.instructor ? course.instructor.name : 'N/A'}</p> <!-- FIX: Access .name property -->
                <span class="badge ${badgeClass}">${badgeText}</span>
            </div>
        `;
        return cardAnchor;
    }

    if (featuredCourseGrid) {
        // Determine the correct appId for the Firestore path
        const currentAppId = typeof __app_id !== 'undefined' ? __app_id : firebaseConfig.projectId;
        const coursesCollectionRef = collection(db, `artifacts/${currentAppId}/public/data/courses`);

        // Query for featured courses (where isFeatured is true) and limit to 4
        // You might want to add orderBy('someField') here if you want consistent ordering
        const q = query(
            coursesCollectionRef,
            where('isFeatured', '==', true),
            limit(4) // Display up to 4 featured courses
        );

        onSnapshot(q, (snapshot) => {
            featuredCourseGrid.innerHTML = ''; // Clear existing cards
            if (snapshot.empty) {
                console.log("No featured courses found in Firestore.");
                // Optionally display a message like "No featured courses available right now."
                featuredCourseGrid.innerHTML = '<p style="text-align: center; color: var(--color-dark-gray); font-size: 1.1em; padding: 20px;">No featured courses available right now.</p>';
                return;
            }

            snapshot.forEach((doc) => {
                const courseData = { id: doc.id, ...doc.data() };
                featuredCourseGrid.appendChild(createFeaturedCourseCard(courseData));
            });
            console.log("Featured courses loaded from Firestore.");
        }, (error) => {
            console.error("Error fetching featured courses from Firestore:", error);
            // Optionally display an error message
            featuredCourseGrid.innerHTML = '<p style="text-align: center; color: var(--color-red); font-size: 1.1em; padding: 20px;">Failed to load featured courses. Please try again later.</p>';
        });
    }

});
