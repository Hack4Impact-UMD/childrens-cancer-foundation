import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Login from './pages/login';
import Signup from './pages/signup';
import './App.css';
import ApplicantUsersDashboard from './applicant-dashboard/ApplicantDashboard';

function App(): JSX.Element {
  return (
    <BrowserRouter>
        <Route
          path="/" 
          element={
            <></>
          } 
        />
        <Route
          path="/login" 
          element={
            <Login />
          } 
        />
        {/* 404 page */}
        <Route
          path="*" 
          element={
            <></>
          } 
        />
        <Route
          path="/forgot-password" 
          element={
            <></>
          } 
        />
        <Route
          path="/create-account" 
          element={
            <></>
          } 
        />        
        <Route
          path="/applicant-dashboard" 
          element={
            <ApplicantUsersDashboard />
          } 
        />        
        {/* Admin dashboard */}
        <Route
          path="/admin" 
          element={
            <></>
          } 
        />      
      </Routes>
    </BrowserRouter>
  );
}

export default App;