MindStack - Online Learning Platform
📚 Project Overview
MindStack is an online learning platform designed to offer a wide range of courses, from free introductory lessons to premium, in-depth programs. This project focuses on building a clean, modern, and highly responsive front-end user interface, laying the groundwork for future backend integration with Firebase.

The goal is to create an intuitive and engaging user experience, making learning accessible and enjoyable for everyone.

✨ Key Features (Currently Implemented Pages)
This repository contains the foundational HTML, CSS, and JavaScript for the following core pages:

index.html (Homepage): The main landing page, introducing MindStack, highlighting key features, popular courses, and a call to action.

courses.html (All Courses Page): Displays a grid of available courses with dynamic "Load More" functionality and live search/filtering capabilities.

course.html (Individual Course Page): Shows detailed information for a specific course, including video player, description, curriculum (with simulated locked content), instructor details, and downloadable resources. Content is dynamically loaded based on URL parameters.

pricing.html (Pricing Plans Page): Outlines the Free and Premium subscription tiers, compares features, includes an FAQ section, and testimonials.

affiliate.html (Affiliate Program Page): Explains how users can earn by referring MindStack, provides a simulated dashboard for tracking, and offers promotional tools (with content displayed in a custom modal).

contact.html (Contact Us Page): A dedicated page for users to send messages via a form, find other contact options (email, phone, social media), and view a map. Includes a success message modal for form submission.

admin-login.html (Admin Login Page): A secure, minimalist login interface for administrators to access the backend dashboard. Includes simulated login logic and error handling.

admin-dashboard.html (Admin Dashboard Page): The central management panel for administrators, featuring a responsive sidebar navigation, simulated statistics (users, courses, affiliates, revenue), and sections for managing courses, users, affiliates, and platform settings. Includes simulated auto-logout for security.

privacy-policy.html (Privacy Policy Page): A static, readable legal document outlining how user data is collected, used, and protected. Includes a clear "Back to Home" button with a subtle animation.

404.html (Page Not Found): A custom, user-friendly error page displayed when a requested URL is not found, guiding users back to relevant sections of the site.

🛠️ Technologies Used
HTML5: For structuring the web content.

CSS3: For styling and layout, including responsive design for various screen sizes.

JavaScript (ES6+): For interactive elements, dynamic content loading, form handling, and UI logic.

Remix Icons: A collection of open-source neutral-style system symbols for web projects.

Google Fonts (Poppins): For modern and legible typography.

Placehold.co: Used for placeholder images during development.

📂 Project Structure
The project follows a clear and organized directory structure:

mindstack/
├── index.html
├── courses.html
├── course.html
├── pricing.html
├── affiliate.html
├── contact.html
├── admin-login.html
├── admin-dashboard.html
├── privacy-policy.html
├── 404.html
├── README.md
└── assets/
    ├── css/
    │   ├── style.css             // Global 
    │   ├── courses.css
    │   ├── course.css
    │   ├── pricing.css
    │   ├── affiliate.css
    │   ├── contact.css
    │   ├── admin-login.css
    │   ├── admin-dashboard.css
    │   ├── privacy-policy.css
    │   └── 404.css
    ├── js/
    │   ├── main.js               // Global JS 
    │   ├── courses.js
    │   ├── course.js
    │   ├── pricing.js
    │   ├── affiliate.js
    │   ├── contact.js
    │   ├── admin-login.js
    │   ├── admin-dashboard.js
    │   └── privacy-policy.js
    └── images/
        └── logo/
            └── mindstack_logo__1_-removebg-preview.png // Placeholder logo
        └── (other images like 404 illustration, testimonials avatars, etc.)

🚀 How to Run Locally
To view and test the MindStack front-end pages on your local machine:

Clone the Repository (if applicable):
If this project is hosted on a Git repository, clone it to your local machine:

git clone <repository-url>
cd mindstack

If you received the files directly, ensure they are organized as shown in the "Project Structure" above.

Open in Browser:
Simply open any of the .html files (e.g., index.html, courses.html, admin-login.html) directly in your web browser. You can usually do this by double-clicking the HTML file.

For course.html: To see dynamic content, you can append ?id=web-design-basics (or any other course ID from assets/js/courses.js or assets/js/course.js) to the URL in your browser's address bar, e.g., file:///path/to/mindstack/course.html?id=advanced-python.

For admin-dashboard.html: To simulate a logged-in admin, you might need to temporarily change let isLoggedIn = false; to let isLoggedIn = true; and let isAdmin = false; to let isAdmin = true; at the top of assets/js/admin-dashboard.js.

Hard Refresh:
After making any changes to the HTML, CSS, or JavaScript files, perform a hard refresh in your browser (Ctrl + Shift + R on Windows/Linux, Cmd + Shift + R on Mac) to ensure the latest changes are loaded.

🔮 Future Enhancements (Firebase Integration Plan)
The current front-end is designed with future backend integration in mind, primarily using Firebase. Planned enhancements include:

Firebase Authentication:

User registration and login for students.

Admin login with role-based access control.

Password reset functionality.

Session management and auto-logout for security.

Firestore Database:

Storing and retrieving course data dynamically (instead of hardcoded JS arrays).

Managing user profiles, enrollment status, and progress.

Tracking affiliate data (clicks, signups, earnings).

Storing platform settings and content for the admin dashboard.

Firebase Storage:

Hosting course video files (if not using external embeds like YouTube/Vimeo).

Storing course thumbnails and downloadable resources.

Storing affiliate banners and promotional assets.

Firebase Functions:

Handling form submissions (e.g., contact form, new course creation).

Processing affiliate payouts.

Sending email notifications (e.g., welcome emails, password resets).

Payment Gateway Integration (e.g., Stripe):

Securely processing payments for premium courses and subscriptions.

Real-time Updates:

Using Firestore's real-time listeners for dynamic updates in the admin dashboard and user dashboards.

Enhanced Admin Features:

Full CRUD (Create, Read, Update, Delete) operations for courses, users, and affiliates.

Detailed analytics and reporting.

User suspension/activation.

Affiliate payout management.

✉️ Contact & Support
For any questions, issues, or collaboration inquiries related to this project, please contact:

Email: support@mindstack.com (placeholder)

Developer: Adeshina Ademuyiwa Attoe