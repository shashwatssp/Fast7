import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBV6uT9WvilgK8xpoSYmDH5s9ASqvm7PXI",
    authDomain: "dash-f4779.firebaseapp.com",
    projectId: "dash-f4779",
    storageBucket: "dash-f4779.firebasestorage.app",
    messagingSenderId: "758937236737",
    appId: "1:758937236737:web:949f83892cd512b78d9700",
    measurementId: "G-LV2883EP6T"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
