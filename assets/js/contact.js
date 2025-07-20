// mindstack/assets/js/contact.js

document.addEventListener('DOMContentLoaded', () => {
    // --- UI Elements ---
    const contactForm = document.getElementById('contactForm');
    const successModalOverlay = document.getElementById('successModalOverlay');
    const closeSuccessModalBtn = document.getElementById('closeSuccessModalBtn');
    const successModalOkBtn = document.getElementById('successModalOkBtn');

    // FAQ Accordion elements
    const accordionHeaders = document.querySelectorAll('.faq-accordion .accordion-header');

    // --- Success Modal Functions ---
    function showSuccessModal() {
        if (successModalOverlay) {
            successModalOverlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent body scroll
        }
    }

    function hideSuccessModal() {
        if (successModalOverlay) {
            successModalOverlay.classList.remove('active');
            document.body.style.overflow = ''; // Re-enable body scroll
        }
    }

    // --- Contact Form Submission Handler ---
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Prevent default form submission

            // Simulate form data collection
            const formData = {
                fullName: document.getElementById('fullName').value,
                emailAddress: document.getElementById('emailAddress').value,
                subject: document.getElementById('subject').value,
                message: document.getElementById('message').value
            };

            console.log('Form Submitted:', formData);

            // --- Simulate Backend Call ---
            // In a real application, you would send this data to a backend (e.g., Firebase Cloud Function, EmailJS, Formspree)
            // For now, we'll just simulate success after a short delay.
            setTimeout(() => {
                showSuccessModal(); // Show success modal
                contactForm.reset(); // Clear the form
            }, 500); // Simulate network delay
        });
    }

    // --- Success Modal Button Handlers ---
    if (closeSuccessModalBtn) {
        closeSuccessModalBtn.addEventListener('click', hideSuccessModal);
    }
    if (successModalOkBtn) {
        successModalOkBtn.addEventListener('click', hideSuccessModal);
    }
    if (successModalOverlay) {
        successModalOverlay.addEventListener('click', (e) => {
            if (e.target === successModalOverlay) { // Only close if clicking the overlay itself
                hideSuccessModal();
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
});
