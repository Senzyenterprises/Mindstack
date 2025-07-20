// mindstack/assets/js/courses.js

// Import Firebase modules
import { db, collection, query, onSnapshot, orderBy, firebaseConfig } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- UI Elements ---
    const courseGridContainer = document.getElementById('courseGrid'); // Changed to getElementById
    const loadMoreBtn = document.getElementById('loadMoreBtn'); // Changed to getElementById
    const searchInput = document.getElementById('searchInput'); // Changed to getElementById
    const typeFilterDropdown = document.getElementById('typeFilter'); // Changed to getElementById
    const categoryFilterDropdown = document.getElementById('categoryFilter'); // Changed to getElementById
    const levelFilterDropdown = document.getElementById('levelFilter'); // Already by ID
    const noResultsMessage = document.getElementById('noResultsMessage'); // Already by ID

    // --- State Variables ---
    let allCourses = []; // This will now be populated from Firestore
    let filteredAndSearchedCourses = []; // Stores the result of current filters/search
    let currentStartIndex = 0; // Index to start loading from
    const coursesPerPage = 6; // Number of courses to display per load

    // --- Helper Functions ---

    // Function to create a single course card HTML
    function createCourseCard(course) {
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('course-card');

        // Use course.accessType from Firestore for badge class and text
        const badgeClass = course.accessType === 'free' ? 'free' : 'premium';
        const badgeText = course.accessType.toUpperCase();

        cardDiv.innerHTML = `
            <div class="course-thumbnail" style="background-image: url('${course.thumbnailUrl}');"></div>
            <div class="card-content">
                <h3 class="course-title">${course.title}</h3>
                <p class="course-instructor">By ${course.instructor ? course.instructor.name : 'N/A'}</p> <!-- FIX: Access .name property -->
                <span class="course-badge ${badgeClass}">${badgeText}</span>
                <a href="course.html?id=${course.id}" class="btn btn-primary view-course-btn">View Course</a>
            </div>
        `;
        return cardDiv;
    }

    // Function to Render Courses
    function renderCourses(coursesToRender) {
        courseGridContainer.innerHTML = ''; // Always clear and re-render for consistency with filtering/search
        const fragment = document.createDocumentFragment();

        // Slice the courses to display only the current batch
        coursesToRender.slice(0, currentStartIndex + coursesPerPage).forEach(course => {
            fragment.appendChild(createCourseCard(course));
        });

        courseGridContainer.appendChild(fragment);
        updateLoadMoreButtonVisibility(coursesToRender); // Pass the full filtered array
        updateNoResultsMessage(coursesToRender);
    }

    // Function to Update Load More Button Visibility
    function updateLoadMoreButtonVisibility(currentSet) {
        if (currentStartIndex + coursesPerPage >= currentSet.length) {
            loadMoreBtn.style.display = 'none'; // Hide if all are loaded
        } else {
            loadMoreBtn.style.display = 'block'; // Show if more are available
        }
    }

    // Function to update no results message visibility
    function updateNoResultsMessage(currentSet) {
        if (noResultsMessage) {
            if (currentSet.length === 0) {
                noResultsMessage.style.display = 'block';
                noResultsMessage.textContent = "No courses found matching your criteria.";
            } else {
                noResultsMessage.style.display = 'none';
            }
        }
    }

    // Function to Apply Filters and Search
    function applyFiltersAndSearch() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const selectedType = typeFilterDropdown.value; // 'all', 'free', 'premium'
        const selectedCategory = categoryFilterDropdown.value; // 'all-categories', 'design', 'coding', etc.
        const selectedLevel = levelFilterDropdown ? levelFilterDropdown.value : 'all'; // 'all', 'beginner', 'intermediate', 'advanced'

        filteredAndSearchedCourses = allCourses.filter(course => {
            // Ensure course.shortDescription exists for search
            const courseDescription = course.shortDescription ? course.shortDescription.toLowerCase() : '';
            
            const matchesSearch = course.title.toLowerCase().includes(searchTerm) ||
                                  (course.instructor && course.instructor.name && course.instructor.name.toLowerCase().includes(searchTerm)) || // FIX: Access .name property for search
                                  courseDescription.includes(searchTerm);

            const matchesType = selectedType === 'all' || course.accessType === selectedType;
            
            const matchesCategory = selectedCategory === 'all-categories' || course.category === selectedCategory;

            // Ensure course.courseMeta and course.courseMeta.level exist for level filter
            const courseLevel = course.courseMeta && course.courseMeta.level ? course.courseMeta.level.toLowerCase() : '';
            const matchesLevel = selectedLevel === 'all' || courseLevel === selectedLevel;

            return matchesSearch && matchesType && matchesCategory && matchesLevel;
        });

        currentStartIndex = 0; // Reset index for new filter/search
        renderCourses(filteredAndSearchedCourses); // Render the initial batch of the filtered set
    }

    // --- Event Listener for Load More Button ---
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            currentStartIndex += coursesPerPage; // Increment index
            renderCourses(filteredAndSearchedCourses); // Re-render to show more
        });
    }

    // --- Event Listeners for Search Input and Filter Dropdowns ---
    if (searchInput) {
        searchInput.addEventListener('input', applyFiltersAndSearch);
    }

    if (typeFilterDropdown) {
        typeFilterDropdown.addEventListener('change', applyFiltersAndSearch);
    }

    if (categoryFilterDropdown) {
        categoryFilterDropdown.addEventListener('change', applyFiltersAndSearch);
    }

    if (levelFilterDropdown) { // Add listener for the new level filter
        levelFilterDropdown.addEventListener('change', applyFiltersAndSearch);
    }


    // --- Firebase Integration: Real-time Course Data ---

    // Determine the correct appId for the Firestore path
    // Use __app_id if available (Canvas environment), otherwise use firebaseConfig.projectId
    const currentAppId = typeof __app_id !== 'undefined' ? __app_id : firebaseConfig.projectId;
    const coursesCollectionRef = collection(db, `artifacts/${currentAppId}/public/data/courses`);

    // Set up a real-time listener for courses
    // Order by title for consistent display
    const q = query(coursesCollectionRef, orderBy('title'));

    onSnapshot(q, (snapshot) => {
        const fetchedCourses = [];
        snapshot.forEach((doc) => {
            // Get data and add the document ID (doc.id) to the course object
            fetchedCourses.push({ id: doc.id, ...doc.data() });
        });

        allCourses = fetchedCourses; // Update the main courses array
        applyFiltersAndSearch(); // Re-apply filters and display all courses
        console.log("Courses updated from Firestore:", allCourses);
    }, (error) => {
        console.error("Error fetching courses from Firestore:", error);
        if (noResultsMessage) {
            noResultsMessage.textContent = "Failed to load courses. Please try again later.";
            noResultsMessage.style.display = 'block';
        }
    });

    // Initial call to apply filters and display (will be updated by onSnapshot)
    applyFiltersAndSearch();
});
