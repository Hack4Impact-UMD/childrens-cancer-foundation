import './App.css';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AccountPageApplicants from './create-acc-pages/CreateAccApplicant';
import AccountPageReviewers from './create-acc-pages/create-acc-reviewer/CreateAccReviewer';

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
        {/* Need to change path to create-account after authentication */}
        <Route
          path="/create-account-applicants" 
          element={
            <AccountPageApplicants />
          } 
        />        
        <Route
          path="/applicant-dashboard" 
          element={
            <></>
          } 
        />        
        {/* Admin dashboard */}
        <Route
          path="/admin" 
          element={
            <></>
          } 
        />
        {/* Need to change path to create-account after authentication */}
        <Route
          path="/create-account-reviewers" 
          element={
            <AccountPageReviewers />
          } 
        />            
      </Routes>
    </BrowserRouter>
  );
}

export default App;
