// mindstack/assets/js/pricing.js

// Import Firebase modules for Firestore
import { db, doc, getDoc, firebaseConfig } from './firebase.js';

document.addEventListener('DOMContentLoaded', async () => { // Made the function async
    // --- Mobile Navigation (Hamburger Menu) Toggle ---
    const mobileMenuToggle = document.getElementById('mobileMenuToggle'); // Your HTML uses this ID
    const mainNav = document.querySelector('.main-nav'); // Your HTML uses this class
    const closeMenuBtn = document.getElementById('closeMenuBtn'); // Your HTML uses this ID

    if (mobileMenuToggle && mainNav && closeMenuBtn) {
        mobileMenuToggle.addEventListener('click', () => {
            mainNav.classList.add('active'); // Add 'active' class to show the menu
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        });

        closeMenuBtn.addEventListener('click', () => {
            mainNav.classList.remove('active'); // Remove 'active' class to hide the menu
            document.body.style.overflow = ''; // Re-enable background scrolling
        });

        // Optional: Close menu if a nav link is clicked (good for UX)
        mainNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                // Check if the menu is active and if it's a mobile view
                if (mainNav.classList.contains('active') && window.innerWidth <= 768) {
                    mainNav.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        });

        // Optional: Close menu if clicking outside (for larger mobile screens/tablets)
        document.addEventListener('click', (e) => {
            // If the click is outside the nav and not on the toggle button, and the nav is active
            if (!mainNav.contains(e.target) && !mobileMenuToggle.contains(e.target) && mainNav.classList.contains('active')) {
                mainNav.classList.remove('active');
                document.body.style.overflow = '';
            }
        });

    } else {
        console.warn("Mobile menu toggle, main navigation, or close button not found. Mobile menu might not work.");
    }

    // --- Active Navbar Link Highlighting ---
    const currentPath = window.location.pathname.split('/').pop(); // Gets 'index.html', 'pricing.html', etc.
    const navLinks = document.querySelectorAll('.main-nav ul li a');

    navLinks.forEach(link => {
        const linkPath = link.href.split('/').pop();
        if (linkPath === currentPath || (currentPath === '' && linkPath === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active'); // Ensure only one is active
        }
    });


    // --- FAQ Accordion Logic ---
    const accordionHeaders = document.querySelectorAll('.faq-accordion .accordion-header');

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

    // --- Dynamic Premium Price Loading Logic ---
    const premiumPlanPriceElement = document.getElementById('premiumPlanPrice');
    
    // Determine the correct appId for the Firestore path
    const currentAppId = typeof __app_id !== 'undefined' ? __app_id : firebaseConfig.projectId;
    console.log("pricing.js: Using currentAppId:", currentAppId);

    // Reference to the platform settings document where premiumPrice is stored
    const settingsDocRef = doc(db, `artifacts/${currentAppId}/public/data/settings/platform_settings`);

    if (premiumPlanPriceElement) {
        try {
            const docSnap = await getDoc(settingsDocRef);

            if (docSnap.exists() && docSnap.data().premiumPrice !== undefined) {
                const premiumPrice = docSnap.data().premiumPrice;
                // Format the price for display (e.g., ₦12,000)
                premiumPlanPriceElement.textContent = premiumPrice.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' });
                premiumPlanPriceElement.innerHTML += ' <span>/ month</span>'; // Add the "/ month" span back
                console.log("Premium price loaded successfully:", premiumPrice);
            } else {
                premiumPlanPriceElement.textContent = 'Price not set';
                console.warn("Premium price not found in Firestore settings. Displaying placeholder.");
            }
        } catch (error) {
            console.error("Error fetching premium price:", error);
            premiumPlanPriceElement.textContent = 'Error loading price';
            premiumPlanPriceElement.style.color = 'var(--color-red)'; // Indicate error
        }
    } else {
        console.error("Element with ID 'premiumPlanPrice' not found on the page.");
    }

    // Handle "Upgrade to Premium" button on pricing page
    const upgradeToPremiumBtn = document.querySelector('.premium-plan .plan-cta-btn');
    if (upgradeToPremiumBtn) {
        upgradeToPremiumBtn.addEventListener('click', () => {
            // Just show a message about it being a demo
            alert('This is a demo. Real payment integration is coming soon!'); 
        });
    }
});
