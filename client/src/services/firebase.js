import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyAgjI58CyLTxxPkomoM9f4JeDq-8Xc_RP4",
    authDomain: "proiecttic-6d0c4.firebaseapp.com",
    projectId: "proiecttic-6d0c4",
    storageBucket: "proiecttic-6d0c4.firebasestorage.app",
    messagingSenderId: "642856701424",
    appId: "1:642856701424:web:d86e06365f3dc63edaa135",
    measurementId: "G-J5M53DZ50J"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
