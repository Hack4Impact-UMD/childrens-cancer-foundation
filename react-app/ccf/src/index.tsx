import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
//If this line says import not found then you need to set up firebase api on your machine
import firebaseConfig from "./firebase_config/FireConfig";
import './index.css';

//import the connections
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

// firebaseApps previously initialized using initializeApp()
const cong = initializeApp(firebaseConfig);
// const analytics = getAnalytics(cong);


// firestore database connection
const db = getFirestore();
// cloud storage connection
const storage = getStorage();
// auth connection
const auth = getAuth();
// functions connection
const functions = getFunctions();


//flag for local testing
// change to true to run using emulator
const useEmulator = false

if (useEmulator) {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectStorageEmulator(storage, "127.0.0.1", 9199);
  connectAuthEmulator(auth, "http://127.0.0.1:9099");
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
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

export { cong, storage, functions, auth, db };
