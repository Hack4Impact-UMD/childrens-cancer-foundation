import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./pages/login/login";
import "./App.css";
import AccountPageApplicants from "./pages/create-acc-applicants/CreateAccApplicant";
import AccountPageReviewers from "./pages/create-acc-reviewer/CreateAccReviewer";
import ApplicantUsersDashboard from "./pages/applicant-dashboard/ApplicantDashboard";

import Sidebar from "./components/sidebar/Sidebar";
import AdminProtectedRoute from './components/Routing/AdminProtectedRoute';
import AdminApplicationsDatabase from "./pages/admin-database/AdminDatabase";
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

//rolecheck ensures only correct users can access their page via their role
import {RoleCheck} from './context/RoleCheck'

function App(): JSX.Element {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/Login" element={<Login />} />
        {/* 404 page */}
        <Route path="*" element={<ErrorPage type="404"/>} />
        <Route path="/forgot-password" element={<></>} />
        <Route path="/create-account-menu" element={<CreateAccMenu />} />
        {/* Need to change path to create-account after authentication */}
        <Route
          path="/"
          element={
              <DefaultRoute></DefaultRoute>
          } 
        />
        
        {/* Reviewer Routes */}
        <Route path="/reviewer/dashboard" element={
            <RoleCheck role="reviewer">
              <ReviewerDashboard faqData={faq_data} email={"email@testing.org"} hours={"10am - 5pm weekdays"} phone={"111-222-3333"}></ReviewerDashboard>
            </RoleCheck>
        }/>
        
        <Route path="/reviewer/dashboard/all-applications" element={
            <RoleCheck role="reviewer">
              <AllApplications />
            </RoleCheck>
        }/>
        
        <Route
          path="/reviewer/settings"
          element={
            <RoleCheck role="reviewer">
              <ReviewerSettings />
            </RoleCheck>
          }
        />
        
        <Route
          path="/reviewer/create-account" 
          element={
            <AccountPageReviewers />
          } 
        />
        
        {/* Applicant Routes */}
        <Route
          path="/applicant/dashboard"
          element={
            <RoleCheck role="applicant">
              <ApplicantUsersDashboard />
            </RoleCheck>
          }
        />
        
        <Route
          path="/applicant/settings"
          element={
            <RoleCheck role="applicant">
              <ApplicantSettings />
            </RoleCheck>
          }
        />
        
        <Route
          path="/applicant/post-grant-report" 
          element={
            <RoleCheck role="applicant">
              <PostGrantReport />
            </RoleCheck>
          }
        />
        
        <Route
            path="/applicant/application-form/research"
            element={
              <RoleCheck role="applicant">
                <ApplicationForm type="Research" />
              </RoleCheck>
            }
        />
        
        <Route
          path="/applicant/application-form/nextgen"
          element={
            <RoleCheck role="applicant">
              <ApplicationForm type="NextGen" />
            </RoleCheck>
          }
        />
        
        <Route
          path="/applicant/application-form/nonresearch"
          element={
            <RoleCheck role="applicant">
              <NRApplicationForm />
            </RoleCheck>
          }
        />

        {/* Admin Routes */}
        <Route 
          path="/admin/dashboard" 
          element={
            <RoleCheck role="admin">
              <AdminDashboardViewAllAccounts />
            </RoleCheck>
          } 
        />
        
        <Route 
          path="/admin-database"
          element={
            <RoleCheck role="admin">
              <AdminApplicationsDatabase />
            </RoleCheck>
          }
        />
        
        <Route 
          path="/admin" 
          element={
            <RoleCheck role="admin">
              <AdminApplicationsDatabase />
            </RoleCheck>
          }
        />
        
        <Route
          path="/admin/all-accounts" 
          element={
            <RoleCheck role="admin">
              <AdminDashboardViewAllAccounts />
            </RoleCheck>
          } 
        />
        
        <Route
          path="/admin/edit-information" 
          element={
            <RoleCheck role="admin">
              <AdminEditInformation />
            </RoleCheck>
          } 
        />
        
        <Route
          path="/admin/settings"
          element={
            <RoleCheck role="admin">
              <AdminSettings />
            </RoleCheck>
          }
        />
        
        <Route
            path="/grant-awards"
            element={
              <RoleCheck role="admin">
                <GrantAwards />
              </RoleCheck>
            }
        />
        
        {/* Authentication Routes */}
        <Route
            path="/create-account-applicants"
            element={<AccountPageApplicants />}
        />
        
        <Route
          path="/protected-page" 
          element={
            <ErrorPage type="401" />
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;