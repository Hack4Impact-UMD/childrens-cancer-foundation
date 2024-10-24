import './App.css';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ApplicantUsersDashboard from './applicant-dashboard/ApplicantDashboard';
import ApplicationForm from './application-form/ApplicationForm';

function App(): JSX.Element {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default/Login page */}
        <Route
          path="/" 
          element={
            <></>
          } 
        />
        <Route
          path="/login" 
          element={
            <></>
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
        <Route 
          path="/application-form"
          element={
            <ApplicationForm />
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
