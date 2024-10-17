import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";
//If this line says import not found then you need to set up firebase api on your machine
import firebaseConfig from "./firebase_config/FireConfig";
import './index.css';

//import the connections
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

// firebaseApps previously initialized using initializeApp()
const cong = initializeApp(firebaseConfig);
const storage = getStorage(cong);
// const analytics = getAnalytics(cong);


//database emulator connection
const db = getFirestore();
//cloud storage emulator connection
const storage = getStorage();
//authentication emulator connection
const auth = getAuth();


//flag for local testing
const useEmulator = process.env.LOCAL_TESTING === "true";

if (useEmulator) {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectStorageEmulator(storage, "127.0.0.1", 9199);
  connectAuthEmulator(auth, "http://127.0.0.1:9099");

}


const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

export { cong, storage };
