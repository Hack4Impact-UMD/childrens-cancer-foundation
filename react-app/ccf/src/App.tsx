import './App.css';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ApplicantUsersDashboard from './applicant-dashboard/ApplicantDashboard';
import AdminProtectedRoute from './components/Routing/AdminProtectedRoute';
import ApplicantProtectedRoute from './components/Routing/ApplicantProtectedRoute';
import ReviewerProtectedRoute from './components/Routing/ReviewerProtectedRoute';

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
            <ApplicantProtectedRoute element={<ApplicantUsersDashboard />} />
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
