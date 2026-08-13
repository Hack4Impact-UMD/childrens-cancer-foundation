import React, { useEffect, useState } from "react";
import { FaClipboardList, FaEnvelope } from "react-icons/fa";
import "./ReviewerDashboard.css";
import ContactUs from "../../components/contact/ContactUs";
import DashboardSection from "../../components/dashboard-layout/DashboardSection";
import RoleDashboardShell from "../../components/dashboard-layout/RoleDashboardShell";
import { getSidebarbyRole } from "../../types/sidebar-types";
import ApplicationBox, { type Application } from "../../components/applications/ApplicationBox";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { auth } from "../.."; // Adjust path as needed
import { db } from "../.."
import { getReviewsForReviewer, setReviewArchived } from "../../services/review-service";
import Review from "../../types/review-types";
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
    const [showArchived, setShowArchived] = useState<boolean>(false);
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

    // Visual-only archive: hides a completed review from this dashboard until the
    // "Show archived" toggle is on. Admin views are unaffected.
    const handleToggleArchive = async (application: Application) => {
        if (!application.id || !application.reviewId) return;
        const nextArchived = !(application.archived === true);
        try {
            await setReviewArchived(application.id, application.reviewId, nextArchived);
            setCompletedReviews((prev) =>
                prev.map((a) =>
                    a.reviewId === application.reviewId ? { ...a, archived: nextArchived } : a
                )
            );
        } catch (err) {
            console.error("Error updating review archive flag:", err);
        }
    };

    const isArchived = (application: Application) => application.archived === true;
    const visibleCompletedReviews = completedReviews.filter(
        (a) => showArchived || !isArchived(a)
    );
    const hasArchivedCompleted = completedReviews.some(isArchived);

    // Fetch reviewer's assigned applications from Firebase using the new review service
    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser) {
                setError("You are not signed in. Please log in again to view your reviews.");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            // Each stage below fails for a different reason, so each reports its
            // own message rather than one catch-all — that way the visible error
            // points at what actually broke.

            // 1) Current application cycle (needed for the reviewer deadline and
            //    to filter reviews to the active cycle).
            let updatedCycle: ApplicationCycle;
            try {
                const cycle = await getCurrentCycle();
                updatedCycle = await checkAndUpdateCycleStageIfNeeded(cycle);
                setAppCycle(updatedCycle);
            } catch (err) {
                console.error("Error loading current application cycle:", err);
                setError("Couldn't load the current application cycle. Please refresh and try again.");
                setLoading(false);
                return;
            }

            // 2) Reviewer profile (maps the signed-in email to a reviewer id).
            let reviewerId: string;
            try {
                const reviewersRef = collection(db, "reviewers");
                const reviewerQuery = query(
                    reviewersRef,
                    where("email", "==", currentUser.email)
                );
                const reviewerSnapshot = await getDocs(reviewerQuery);

                if (reviewerSnapshot.empty) {
                    setError("We couldn't find a reviewer profile for your account. Please contact CCF.");
                    setLoading(false);
                    return;
                }
                reviewerId = reviewerSnapshot.docs[0].id;
            } catch (err) {
                console.error("Error loading reviewer profile:", err);
                setError("Couldn't load your reviewer profile. Please refresh and try again.");
                setLoading(false);
                return;
            }

            // 3) The reviews assigned to this reviewer (collection-group query;
            //    a permissions/rules problem surfaces here, not as an app error).
            let reviews: Review[];
            try {
                reviews = await getReviewsForReviewer(reviewerId);
            } catch (err) {
                console.error("Error loading assigned reviews:", err);
                setError("Couldn't load your assigned reviews. Please refresh and try again, or contact CCF if this continues.");
                setLoading(false);
                return;
            }

            // 4) The application document behind each assigned review.
            try {
                // Only reviews for the current cycle (legacy reviews without a
                // cycle field are kept).
                const currentCycleReviews = reviews.filter(
                    (review) => !review.cycle || review.cycle === updatedCycle.id
                );

                // Format the reviewer deadline once for all rows.
                const dueDateStr = updatedCycle.reviewerDeadline
                    ? new Date(updatedCycle.reviewerDeadline).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })
                    : "No deadline";

                // Fetch every application in parallel rather than one-at-a-time.
                const reviewsWithApps = await Promise.all(
                    currentCycleReviews.map(async (review) => {
                        const appDoc = await getDoc(doc(db, "applications", review.applicationId));
                        return { review, appDoc };
                    })
                );

                // Arrays for different application status
                const notStarted: Application[] = [];
                const inProgress: Application[] = [];
                const completed: Application[] = [];

                for (const { review, appDoc } of reviewsWithApps) {
                    if (!appDoc.exists()) {
                        continue;
                    }

                    const appData = appDoc.data();

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
                            dueDate: `SUBMITTED: ${submittedDate}`,
                            reviewId: review.id,
                            archived: review.archived === true
                        });
                    } else if (review.status === "in-progress") {
                        inProgress.push(application);
                    } else {
                        notStarted.push(application);
                    }
                }

                // Update state with fetched applications
                setPendingReviews(notStarted);
                setInProgressReviews(inProgress);
                setCompletedReviews(completed);

                setLoading(false);
            } catch (err) {
                console.error("Error loading applications for assigned reviews:", err);
                setError("Failed to load the applications for your assigned reviews. Please refresh and try again.");
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
                            icon={<FaClipboardList className="dashboard-section-icon" />}
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
                                                    {hasArchivedCompleted && (
                                                        <label className="show-archived-toggle">
                                                            <input
                                                                type="checkbox"
                                                                checked={showArchived}
                                                                onChange={(e) => setShowArchived(e.target.checked)}
                                                            />
                                                            Show archived
                                                        </label>
                                                    )}
                                                    {visibleCompletedReviews.map((application, index) => (
                                                        <ApplicationBox
                                                            key={application.reviewId ?? index}
                                                            id={application.id}
                                                            applicationType={application.applicationType}
                                                            dueDate={application.dueDate}
                                                            title={application.title}
                                                            principalInvestigator={application.principalInvestigator}
                                                            onClick={() => handleDueDateClick(application.dueDate, application.id || '')}
                                                            onModalOpen={handleModalOpen}
                                                            archived={application.archived}
                                                            onToggleArchive={() => handleToggleArchive(application)}
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
                            icon={<FaEnvelope className="dashboard-section-icon" />}
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
