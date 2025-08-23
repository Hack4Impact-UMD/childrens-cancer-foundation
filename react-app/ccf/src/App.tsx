import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from "./pages/login/login";
import "./App.css";
import AccountPageApplicants from "./pages/create-acc-applicants/CreateAccApplicant";
import AccountPageReviewers from "./pages/create-acc-reviewer/CreateAccReviewer";
import ApplicantUsersDashboard from "./pages/applicant-dashboard/ApplicantDashboard";
import ApplicantDecisions from "./pages/applicant-decisions/ApplicantDecisions";


import Sidebar from "./components/sidebar/Sidebar";
import AdminProtectedRoute from './components/Routing/AdminProtectedRoute';
import AdminApplicationsDatabase from "./pages/admin-database/AdminDatabase";
import ApplicantProtectedRoute from './components/Routing/ApplicantProtectedRoute';
import ReviewerProtectedRoute from './components/Routing/ReviewerProtectedRoute';
import CreateAccMenu from './pages/create-acc-menu/CreateAccMenu';
import ErrorPage from './pages/error/error';
import PostGrantReport from './post-grant-report/post-grant-report';
import PostGrantReportPage from './pages/post-grant-report/PostGrantReportPage';
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

import ResultsPage from "./pages/applicant_results/ResultsPage";


import AdminEditInformation from "./pages/admin-edit-info/AdminEditInformation";

import AllApplications from './pages/reviewer-all-applications/AllApplications'
import ApplicationReview from "./pages/application-review/ApplicationReview";
import ApplicationReviewReadOnly from "./pages/application-review/ApplicationReviewReadOnly";
import AssignReviewers from "./pages/assign-reviewers-page/AssignReviewers";
import AdminWhitelistReviewers from "./pages/admin-whitelist/AdminWhitelistReviewers";
import AdminPostGrantReports from "./pages/admin-post-grant-reports/AdminPostGrantReports";

// import AssignReviewersPage from "./pages/assign-reviewers-page/AssignReviewers";

function App(): JSX.Element {
  return (
    <BrowserRouter>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <Routes>
        <Route path="/Login" element={<Login />} />
        {/* 404 page */}
        <Route path="*" element={<ErrorPage type={"404"}></ErrorPage>} />
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
          <ReviewerProtectedRoute element={<ReviewerDashboard faqData={faq_data} email={"email@testing.org"} hours={"10am - 5pm weekdays"} phone={"111-222-3333"}></ReviewerDashboard>} />
        }>
        </Route>
        <Route
          path="/reviewer/dashboard/all-applications"
          element={
            <ReviewerProtectedRoute element={<AllApplications />} />
          }

        />
        <Route
          path="/reviewer/review"
          element={<ReviewerProtectedRoute element={<ApplicationReview />} />}
        />
        <Route
          path="/reviewer/review-application"
          element={<ApplicationReviewReadOnly />}
        />
        <Route
          path="/applicant/dashboard"
          element={
            <ApplicantProtectedRoute element={<ApplicantUsersDashboard />} />
          }
        />
        <Route
          path="/applicant/decisions"
          element={
            <ApplicantProtectedRoute element={<ApplicantDecisions />} />
          }
        />

        <Route
          path="/applicant/results"
          element={
            <ApplicantProtectedRoute element={<ResultsPage />} />
          }
        />

        <Route
          path="/protected-page"
          element={
            <ErrorPage type="401" />
          }
        />

        {/* Admin dashboard */}
        <Route
          path="/admin"
          element={<AdminProtectedRoute element={<AdminApplicationsDatabase></AdminApplicationsDatabase>} />}
        />
        {/* Need to change path to create-account after authentication */}
        <Route
          path="/admin-database"
          element={<AdminProtectedRoute element={<AdminApplicationsDatabase />} />}
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
            <AdminProtectedRoute element={<AdminApplicationsDatabase />} />
          }
        />
        {/* Admin Edit Information Page */}
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
            <ReviewerProtectedRoute element={<AccountPageReviewers />} />
          }
        />
        <Route
          path="/applicant/post-grant-report"
          element={
            <ApplicantProtectedRoute element={<PostGrantReport />} />
          }
        />
        <Route
          path="/applicant/post-grant-report/:applicationId"
          element={
            <ApplicantProtectedRoute element={<PostGrantReportPage />} />
          }
        />
        <Route
          path="/applicant/application-form/research"
          element={<ApplicantProtectedRoute element={<ApplicationForm type="Research" />} />}
        />
        <Route
          path="/applicant/application-form/nextgen"
          element={<ApplicantProtectedRoute element={<ApplicationForm type="NextGen" />} />}
        />
        <Route
          path="/applicant/application-form/nonresearch"
          element={<ApplicantProtectedRoute element={<NRApplicationForm />} />}
        />
        {/* Admin dashboard */}
        <Route path="/admin" element={<></>} />
        {/* Need to change path to create-account after authentication */}
        <Route
          path="/create-account-reviewers"
          element={<AccountPageReviewers />}
        />
        <Route
          path="/create-account-applicants"
          element={<AccountPageApplicants />}
        />
        <Route
          path="/admin/settings"
          element={<AdminProtectedRoute element={<AdminSettings />} />}
        />
        <Route
          path={"/admin/assign-reviewers"}
          element={<AssignReviewers />}
        />
        <Route
          path={"/admin/whitelist-reviewers"}
          element={<AdminProtectedRoute element={<AdminWhitelistReviewers />} />}
        />

        <Route
          path={"/admin/post-grant-reports"}
          element={<AdminProtectedRoute element={<AdminPostGrantReports />} />}
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
          <ReviewerProtectedRoute element={<ReviewerDashboard faqData={faq_data} email={"email@testing.org"} hours={"10am - 5pm weekdays"} phone={"111-222-3333"}></ReviewerDashboard>} />
        }>
        </Route>
        <Route
          path="/admin/grant-awards"
          element={<AdminProtectedRoute element={<GrantAwards />} />}
        />

        {/* Catch-all route for 404 errors - must be last */}
        <Route
          path="*"
          element={
            <ErrorPage type="404" />
          }
        />
      </Routes>

    </BrowserRouter>
  );
}

export default App;
