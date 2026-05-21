import React, { useEffect, useState } from "react";
import document from '../../assets/documentIcon.png';
import "./ReviewerDashboard.css";
import ContactUs from "../../components/contact/ContactUs";
import DashboardSection from "../../components/dashboard-layout/DashboardSection";
import RoleDashboardShell from "../../components/dashboard-layout/RoleDashboardShell";
import { getSidebarbyRole } from "../../types/sidebar-types";
import ApplicationBox, { type Application } from "../../components/applications/ApplicationBox";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { auth } from "../.."; // Adjust path as needed
import { db } from "../.."
import { getReviewsForReviewer } from "../../services/review-service";
import ApplicationCycle from "../../types/applicationCycle-types";
import { getCurrentCycle, checkAndUpdateCycleStageIfNeeded, getDaysUntilDeadline } from "../../backend/application-cycle";
import Banner from "../../components/banner/Banner";
import CoverPageModal from "../../components/applications/CoverPageModal";

interface ReviewerProp {
    email: string;
    phone: string;
    hours: string;
}

function ReviewerDashboard({ email, phone, hours }: ReviewerProp): JSX.Element {
    const sidebarItems = getSidebarbyRole('reviewer');

    // State for applications
    const [pendingReviews, setPendingReviews] = useState<Application[]>([]);
    const [inProgressReviews, setInProgressReviews] = useState<Application[]>([]);
    const [completedReviews, setCompletedReviews] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [appCycle, setAppCycle] = useState<ApplicationCycle>();

    // State for modal
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [currentModalApplication, setCurrentModalApplication] = useState<any>(null);

    // Auth context for current user
    const { currentUser } = auth;

    const handleDueDateClick = (dueDate: string, applicationId: string) => {
        // Navigate to review page with application ID
        window.location.href = `/reviewer/review?id=${applicationId}`;
    };

    const handleModalOpen = async (applicationId: string) => {
        try {
            const applicationRef = doc(db, "applications", applicationId);
            const applicationDoc = await getDoc(applicationRef);

            if (applicationDoc.exists()) {
                const applicationData = applicationDoc.data();
                setCurrentModalApplication(applicationData);
                setModalOpen(true);
            } else {
                console.error("Application not found");
            }
        } catch (error) {
            console.error("Error fetching application:", error);
        }
    };

    const closeModal = () => {
        setModalOpen(false);
        setCurrentModalApplication(null);
    };

    // Fetch reviewer's assigned applications from Firebase using the new review service
    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser) {
                setError("User not authenticated");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);

                // Fetch cycle first so reviewerDeadline is available when building application list
                const cycle = await getCurrentCycle();
                const updatedCycle = await checkAndUpdateCycleStageIfNeeded(cycle);
                setAppCycle(updatedCycle);

                // First, get the reviewer document
                const reviewersRef = collection(db, "reviewers");
                const reviewerQuery = query(
                    reviewersRef,
                    where("email", "==", currentUser.email)
                );

                const reviewerSnapshot = await getDocs(reviewerQuery);

                if (reviewerSnapshot.empty) {
                    setError("Reviewer profile not found");
                    setLoading(false);
                    return;
                }

                const reviewerDoc = reviewerSnapshot.docs[0];
                const reviewerId = reviewerDoc.id;

                // Get all reviews assigned to this reviewer
                const reviews = await getReviewsForReviewer(reviewerId);

                // Arrays for different application status
                const notStarted: Application[] = [];
                const inProgress: Application[] = [];
                const completed: Application[] = [];

                // Process each review
                for (const review of reviews) {
                    // skip reviews from past cycles
                    if (review.cycle && review.cycle !== updatedCycle.id) {
                        continue;
                    }

                    // Fetch application data for each review
                    const appDoc = await getDoc(doc(db, "applications", review.applicationId));

                    if (appDoc.exists()) {
                        const appData = appDoc.data();

                        // Format date for display using local cycle variable, not stale state
                        const dueDateStr = updatedCycle.reviewerDeadline
                            ? new Date(updatedCycle.reviewerDeadline).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })
                            : "No deadline";

                        const application: Application = {
                            id: review.applicationId,
                            applicationType: appData.grantType || "Application",
                            title: appData.title || "Untitled Application",
                            principalInvestigator: appData.principalInvestigator || "Unknown",
                            status: review.status,
                            dueDate: `DUE ${dueDateStr.toUpperCase()}`
                        };

                        // Categorize based on review status
                        if (review.status === "completed") {
                            // Format submission date
                            const submittedDate = review.submittedDate
                                ? new Date(review.submittedDate).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })
                                : "Recently";

                            completed.push({
                                ...application,
                                dueDate: `SUBMITTED: ${submittedDate}`
                            });
                        } else if (review.status === "in-progress") {
                            inProgress.push(application);
                        } else {
                            notStarted.push(application);
                        }
                    }
                }

                // Update state with fetched applications
                setPendingReviews(notStarted);
                setInProgressReviews(inProgress);
                setCompletedReviews(completed);

                setLoading(false);
            } catch (err) {
                console.error("Error fetching assigned applications:", err);
                setError("Failed to load assigned applications");
                setLoading(false);
            }
        };

        fetchData();

        // Refetch cycle every 30 seconds to detect admin changes or deadline progression
        const cycleRefreshInterval = setInterval(async () => {
            try {
                const cycle = await getCurrentCycle();
                const updatedCycle = await checkAndUpdateCycleStageIfNeeded(cycle);
                setAppCycle(updatedCycle);
            } catch (error) {
                console.error('Error refetching cycle:', error);
            }
        }, 30000);

        return () => clearInterval(cycleRefreshInterval);
    }, [currentUser]);

    return (
        <>
            <RoleDashboardShell
                sidebarItems={sidebarItems}
                title="Reviewer Dashboard"
                stackClassName="ReviewerDashboard"
            >
                    {appCycle?.stage === "Applications Open" && (
                            <Banner>Awaiting Review Period to Begin</Banner>
                        )}
                        {appCycle?.stage === "Review" && appCycle.reviewerDeadline && (
                            <Banner>{`REMINDER: Reviews due in ${getDaysUntilDeadline(appCycle.reviewerDeadline)} days on ${appCycle.reviewerDeadline.toLocaleDateString()}`}</Banner>
                        )}
                        {appCycle?.stage === "Deliberations" && (
                            <Banner>Reviews are now locked. Deliberations are underway.</Banner>
                        )}
                        {appCycle?.stage === "Release Decisions" && (
                            <Banner>Review Period Complete - Release Decisions are being made</Banner>
                        )}
                        {appCycle?.stage === "Applications Closed" && (
                            <Banner>Awaiting Review Period to Begin</Banner>
                        )}

                    <div className="dashboard-sections-content">
                        <DashboardSection
                            title="Applications to Review"
                            icon={<img src={document} alt="" aria-hidden="true" className="dashboard-section-icon" />}
                        >
                            <div className="ReviewerDashboard-applications-container">
                                    {loading ? (
                                        <div className="loading-message">Loading your assigned applications...</div>
                                    ) : error ? (
                                        <div className="error-message">{error}</div>
                                    ) : (
                                        <>
                                            {pendingReviews.length > 0 && (
                                                <>
                                                    <h3>NOT STARTED REVIEWS:</h3>
                                                    {pendingReviews.map((application, index) => (
                                                        <ApplicationBox
                                                            key={index}
                                                            id={application.id}
                                                            applicationType={application.applicationType}
                                                            dueDate={application.dueDate}
                                                            title={application.title}
                                                            principalInvestigator={application.principalInvestigator}
                                                            onClick={() => handleDueDateClick(application.dueDate, application.id || '')}
                                                            onModalOpen={handleModalOpen}
                                                        />
                                                    ))}
                                                    <hr className="dashboard-section-divider" />
                                                </>
                                            )}

                                            {inProgressReviews.length > 0 && (
                                                <>
                                                    <h3>IN PROGRESS REVIEWS:</h3>
                                                    {inProgressReviews.map((application, index) => (
                                                        <ApplicationBox
                                                            key={index}
                                                            id={application.id}
                                                            applicationType={application.applicationType}
                                                            dueDate={application.dueDate}
                                                            title={application.title}
                                                            principalInvestigator={application.principalInvestigator}
                                                            onClick={() => handleDueDateClick(application.dueDate, application.id || '')}
                                                            onModalOpen={handleModalOpen}
                                                        />
                                                    ))}
                                                    <hr className="dashboard-section-divider" />
                                                </>
                                            )}

                                            {completedReviews.length > 0 && (
                                                <>
                                                    <h3>COMPLETED REVIEWS:</h3>
                                                    {completedReviews.map((application, index) => (
                                                        <ApplicationBox
                                                            key={index}
                                                            id={application.id}
                                                            applicationType={application.applicationType}
                                                            dueDate={application.dueDate}
                                                            title={application.title}
                                                            principalInvestigator={application.principalInvestigator}
                                                            onClick={() => handleDueDateClick(application.dueDate, application.id || '')}
                                                            onModalOpen={handleModalOpen}
                                                        />
                                                    ))}
                                                </>
                                            )}

                                            {pendingReviews.length === 0 &&
                                                inProgressReviews.length === 0 &&
                                                completedReviews.length === 0 && (
                                                    <div className="no-applications">
                                                        You don't have any assigned applications to review at this time.
                                                    </div>
                                                )}
                                        </>
                                    )}
                                </div>
                        </DashboardSection>

                        <DashboardSection
                            title="Contact Us"
                            icon={<img src={document} alt="" aria-hidden="true" className="dashboard-section-icon" />}
                        >
                            <ContactUs email={email} phone={phone} hours={hours} />
                        </DashboardSection>
                    </div>
            </RoleDashboardShell>
            {currentModalApplication && (
                <CoverPageModal
                    onClose={closeModal}
                    isOpen={modalOpen}
                    application={currentModalApplication}
                />
            )}
        </>
    );
}

export default ReviewerDashboard;
