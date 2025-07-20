// mindstack/assets/js/firebase.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
// Import specific Firestore functions needed for real-time data, queries, and basic operations
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs,     
    query,       // For building queries
    onSnapshot,  // For real-time listeners
    orderBy,     // For ordering query results
    where,       // For filtering query results
    limit,       // For limiting query results
    doc,         // For document references
    getDoc,      // For getting a single document
    setDoc,      // For setting document data
    updateDoc,   // For updating specific fields in a document
    deleteDoc,
    serverTimestamp, // Corrected: Import serverTimestamp directly
    arrayUnion,      // Corrected: Import arrayUnion directly
    increment        // Corrected: Import increment directly
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
// Import specific Auth functions needed
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    signInAnonymously, 
    signInWithCustomToken, 
    sendPasswordResetEmail 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-analytics.js"; // Optional, if you want analytics

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAsmCjoIQDKatQDxUg3e1CvwwmaEAsqupc",
    authDomain: "mindstack-eba05.firebaseapp.com",
    projectId: "mindstack-eba05",
    storageBucket: "mindstack-eba05.firebasestorage.app",
    messagingSenderId: "207642624008",
    appId: "1:207642624008:web:ee26e410c65109591591bd",
    measurementId: "G-SRGDP8HWW0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app); // Initialize analytics if needed

// Get Firestore and Auth instances
const db = getFirestore(app);
const auth = getAuth(app);

// Export them for use in other JavaScript files
export { 
    db, 
    auth, 
    collection, 
    addDoc, 
    getDocs,     
    query, 
    onSnapshot, 
    orderBy, 
    where, 
    limit, 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    deleteDoc,
    serverTimestamp, // Export serverTimestamp
    arrayUnion,      // Export arrayUnion
    increment,       // Export increment
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword, 
    signOut,
    onAuthStateChanged,
    signInAnonymously,
    signInWithCustomToken,
    sendPasswordResetEmail, 
    firebaseConfig 
};
