import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB6oiLD0zqVBzMFgvXiJZVuPKy1uOv0CmY",
  authDomain: "ataelqui-cfc94.firebaseapp.com",
  projectId: "ataelqui-cfc94",
  storageBucket: "ataelqui-cfc94.appspot.com",
  messagingSenderId: "645552894984",
  appId: "1:645552894984:web:67bb7165e3e42e5561cdbd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Cloud Storage and get a reference to the service
import { getStorage } from 'firebase/storage';
export const storage = getStorage(app);

export default app;
