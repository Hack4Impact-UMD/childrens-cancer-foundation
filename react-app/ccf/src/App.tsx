import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./pages/login/login";
import "./App.css";
import AccountPageApplicants from "./pages/create-acc-applicants/CreateAccApplicant";
import AccountPageReviewers from "./pages/create-acc-reviewer/CreateAccReviewer";
import ApplicantUsersDashboard from "./pages/applicant-dashboard/ApplicantDashboard";

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
import AdminDashboardViewAllAccounts from "./pages/admin-dashboard/AdminDashboardViewAll";
import GrantAwards from './pages/grant-awards/GrantAwards';
import AdminSettings from "./pages/settings/AdminSettings";
import ApplicantSettings from "./pages/settings/ApplicantSettings";
import ReviewerSettings from "./pages/settings/ReviewerSettings";



import AdminEditInformation from "./pages/admin-edit-info/AdminEditInformation";

import AllApplications from './pages/reviewer-all-applications/AllApplications'

function App(): JSX.Element {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/Login" element={<Login />} />
        {/* 404 page */}
        <Route path="*" element={<></>} />
        <Route path="/forgot-password" element={<></>} />
        <Route path="/create-account-menu" element={<CreateAccMenu />} />
        {/* Need to change path to create-account after authentication */}
        <Route
          path="/"
          element={
              <DefaultRoute></DefaultRoute>
          } 
        />
        <Route path="/reviewer/dashboard" element={
            <ReviewerDashboard faqData={faq_data} email={"email@testing.org"} hours={"10am - 5pm weekdays"} phone={"111-222-3333"}></ReviewerDashboard>
        }>
        </Route>
        <Route	
                  path="/reviewer/dashboard/all-applications"
                  element={<AllApplications />}
        	
                />
        <Route
          path="/applicant/dashboard"
          element={
            <ApplicantProtectedRoute element={<ApplicantUsersDashboard />} />
          }
        />
        <Route
          path="*" 
          element={
            <ErrorPage type="404"/>
          }
        />

        <Route 
        path="/protected-page" 
        element={
          <ErrorPage type="401" />
        } 
        />          

        {/* Admin dashboard */}
        <Route path="/admin" element={<></>} />
        Need to change path to create-account after authentication
        <Route
          path="/applicant/dashboard" 
          element={
            <ApplicantUsersDashboard />
          } 
        />    
        {/* Admin View All Accounts Page*/}   
        <Route
          path="/admin/all-accounts" 
          element={
            <AdminProtectedRoute element={<AdminDashboardViewAllAccounts />} />
          } 
        />

<Route
          path="/admin/dashboard" 
          element={
            <AdminProtectedRoute element={<AdminDashboardViewAllAccounts />} />
          } 
        />
        Admin Edit Information Page
        <Route
          path="/admin/edit-information" 
          element={
            <AdminProtectedRoute element={<AdminEditInformation />} />
          } 
        />
        {/* Need to change path to create-account after authentication */}
        <Route
          path="/reviewer/create-account" 
          element={
            <AccountPageReviewers />
          } 
        />
        <Route
          path="/applicant/post-grant-report" 
          element={
            <PostGrantReport />
          }
        />         
        <Route
            path="/applicant/application-form/research"
            element={<ApplicationForm type="Research" />}
        />
        <Route
            path="/applicant/application-form/nextgen"
            element={<ApplicationForm type="NextGen" />}
        />
        <Route
            path="/applicant/application-form/nonresearch"
            element={<NRApplicationForm />}
        />
        {/* Admin dashboard */}
        <Route path="/admin" element={<></>} />
        Need to change path to create-account after authentication
        <Route
            path="/reviewer/create-account"
            element={<AccountPageReviewers />}
        />
        <Route
            path="/applicant/create-account"
            element={<AccountPageApplicants />}
        />
        <Route
          path="/admin/settings"
          element={<AdminProtectedRoute element={<AdminSettings />} />}
        />
        <Route
          path="/reviewer/settings"
          element={<ReviewerProtectedRoute element={<ReviewerSettings />} />}
        />
        <Route
          path="/applicant/settings"
          element={<ApplicantProtectedRoute element={<ApplicantSettings />} />}
        />
        
        <Route path="/reviewer-dashboard" element={
            <ReviewerDashboard faqData={faq_data} email={"email@testing.org"} hours={"10am - 5pm weekdays"} phone={"111-222-3333"}></ReviewerDashboard>
        }>
        </Route>
        <Route
            path="/grant-awards"
            element={<AdminProtectedRoute element={<GrantAwards />} />}
        />
      </Routes>

    </BrowserRouter>
  );
}

export default App;
