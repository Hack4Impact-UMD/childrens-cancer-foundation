import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Login from './pages/login/login';
import './App.css';
import AccountPageApplicants from './pages/create-acc-applicants/CreateAccApplicant';
import AccountPageReviewers from './pages/create-acc-reviewer/CreateAccReviewer';
import ApplicantUsersDashboard from './pages/applicant-dashboard/ApplicantDashboard';
import Sidebar from "./components/sidebar/Sidebar";
import AdminProtectedRoute from './components/Routing/AdminProtectedRoute';
import ApplicantProtectedRoute from './components/Routing/ApplicantProtectedRoute';
import ReviewerProtectedRoute from './components/Routing/ReviewerProtectedRoute';
import CreateAccMenu from './pages/create-acc-menu/CreateAccMenu';
import ErrorPage from './pages/error/error';
import PostGrantReport from './post-grant-report/post-grant-report';
import DefaultRoute from './components/Routing/DefaultRoute'
import ReviewerDashboard from "./pages/reviewer-dashboard/ReviewerDashboard";
import faq_data from "./StaticData/FAQ-REVIEWER";
import ApplicationForm from "./pages/application-form/ApplicationForm";
import NRApplicationForm from "./pages/application-form/NRApplicationForm";
import AccountSettingsPage from "./pages/settings/settings";

function App(): JSX.Element {
  return (
    <BrowserRouter>
    <Routes>
        <Route
          path="/"
          element={
              <DefaultRoute></DefaultRoute>
          } 
        />
        <Route path="/reviewer-dashboard" element={
            <ReviewerDashboard faqData={faq_data} email={"email@testing.org"} hours={"10am - 5pm weekdays"} phone={"111-222-3333"}></ReviewerDashboard>
        }>
        </Route>
        <Route
          path="/Login" 
          element={
            <Login />
          } 
        />
        {/* 404 page */}
        <Route
          path="*" 
          element={
            <ErrorPage type="404"/>
          } 
        />
        <Route
          path="/forgot-password" 
          element={
            <></>
          } 
        />

        <Route
          path="/create-account-menu" 
          element={
            <CreateAccMenu/>
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
        {/* Need to change path to create-account after authentication */}
        <Route
          path="/create-account-reviewers" 
          element={
            <AccountPageReviewers />
          } 
        />
        <Route
          path="/post-grant-report" 
          element={
            <PostGrantReport />
          }
        />         
        <Route
            path="/application-form/research"
            element={<ApplicationForm type="Research" />}
        />
        <Route
            path="/application-form/nextgen"
            element={<ApplicationForm type="NextGen" />}
        />
        <Route
            path="/application-form/nonresearch"
            element={<NRApplicationForm />}
        />
        {/* Admin dashboard */}
        <Route path="/admin" element={<></>} />
        Need to change path to create-account after authentication
        <Route
            path="/create-account-reviewers"
            element={<AccountPageReviewers />}
        />
        <Route
            path={"/settings"}
            element={<AccountSettingsPage/>}
        />
      </Routes>

    </BrowserRouter>
  );
}

export default App;