import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./pages/login/login";
import "./App.css";
import AccountPageApplicants from "./pages/create-acc-applicants/CreateAccApplicant";
import AccountPageReviewers from "./pages/create-acc-reviewer/CreateAccReviewer";
import ApplicantUsersDashboard from "./pages/applicant-dashboard/ApplicantDashboard";

import Sidebar from "./components/sidebar/Sidebar";
import CreateAccMenu from './pages/create-acc-menu/CreateAccMenu';
import ErrorPage from './pages/error/error';
import PostGrantReport from './post-grant-report/post-grant-report';
import DefaultRoute from './components/Routing/DefaultRoute'
import ReviewerDashboard from "./pages/reviewer-dashboard/ReviewerDashboard";
import faq_data from "./StaticData/FAQ-REVIEWER";
import ApplicationForm from "./pages/application-form/ApplicationForm";
import NRApplicationForm from "./pages/application-form/NRApplicationForm";
import AccountSettingsPage from "./pages/settings/settings";
import AdminDashboardViewAllAccounts from "./pages/admin-dashboard/AdminDashboardViewAll";
import GrantAwards from './pages/grant-awards/GrantAwards';
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
        <Route path="/reviewer-dashboard" element={
            <RoleCheck role = "reviewer">
              <ReviewerDashboard faqData={faq_data} email={"email@testing.org"} hours={"10am - 5pm weekdays"} phone={"111-222-3333"}></ReviewerDashboard>
            </RoleCheck>
            }>
        </Route>
        <Route path="/reviewer-dashboard/all-applications" element={
            <RoleCheck role = "reviewer">
              <AllApplications />
            </RoleCheck>}/>
        <Route
          path="/applicant-dashboard"
          element={
            <RoleCheck role = "applicant">
              <ApplicantUsersDashboard />
            </RoleCheck>
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

        <Route
            path="/application-form/research"
            element={<RoleCheck role = "applicant"><ApplicationForm type="Research" /></RoleCheck>}
        />
        <Route
          path="/application-form/nextgen"
          element={<RoleCheck role = "applicant"><ApplicationForm type="NextGen" /></RoleCheck>}
        />
        <Route
          path="/application-form/nonresearch"
          element={<RoleCheck role = "applicant"><NRApplicationForm /></RoleCheck>}
        />
        {/* Admin dashboard */}
        <Route path="/admin" element={<></>} />
        Need to change path to create-account after authentication
        
        {/* Admin View All Accounts Page*/}   
        <Route
          path="/admin-all-accounts" 
          element={
            <RoleCheck role = "admin"><AdminDashboardViewAllAccounts /></RoleCheck>
          } 
        />
        {/* Admin Edit Information Page */}
        <Route
          path="/admin-edit-information" 
          element={
            <RoleCheck role = "admin">
              <AdminEditInformation />
            </RoleCheck>
          } 
        />
        
        <Route
            path="/grant-awards"
            
            element={<RoleCheck role = "admin"><GrantAwards /></RoleCheck>}
        />
        
        
        {/* Need to change path to create-account after authentication */}
        <Route
          path="/create-account-reviewers" 
          element={
            <AccountPageReviewers />
          } 
        />
        
        <Route
            path="/create-account-applicants"
            element={<AccountPageApplicants />}
        />
        
        {/*dont know who gets access */}
        <Route
          path="/post-grant-report" 
          element={
            <PostGrantReport />
          }
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
