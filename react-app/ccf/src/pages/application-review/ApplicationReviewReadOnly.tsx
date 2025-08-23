import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./ApplicationReview.css";
import Sidebar from "../../components/sidebar/Sidebar";
import logo from "../../assets/ccf-logo.png";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../..";
import { getSidebarbyRole } from "../../types/sidebar-types";
import { getReviewsForApplicationAdmin } from "../../services/review-service";
import Review, { ReviewSummary } from "../../types/review-types";
import { Application, NonResearchApplication, ResearchApplication } from "../../types/application-types";
import CoverPageModal from "../../components/applications/CoverPageModal";

const PencilIcon = () => (
    <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ marginRight: "4px" }}
    >
        <path
            d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM21.41 6.34l-3.75-3.75-2.53 2.54 3.75 3.75 2.53-2.54z"
            fill="currentColor"
        />
    </svg>
);

interface ReviewerInfo {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    affiliation: string;
}

interface FeedbackData {
    significance: string;
    approach: string;
    feasibility: string;
    investigator: string;
    summary: string;
    internal?: string;
}

function ApplicationReviewReadOnly(): JSX.Element {
    const sidebarItems = getSidebarbyRole("admin");
    const location = useLocation();

    // Extract application ID from URL query params
    const searchParams = new URLSearchParams(location.search);
    const applicationId = searchParams.get("id");

    const [application, setApplication] = useState<Application | null>(null);
    const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [primaryReviewer, setPrimaryReviewer] = useState<ReviewerInfo | null>(null);
    const [secondaryReviewer, setSecondaryReviewer] = useState<ReviewerInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeReviewer, setActiveReviewer] = useState<'primary' | 'secondary'>('primary');

    useEffect(() => {
        const fetchApplicationData = async () => {
            if (!applicationId) {
                setError("Application ID not provided");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);

                // Fetch application data
                const applicationRef = doc(db, "applications", applicationId);
                const applicationDoc = await getDoc(applicationRef);

                if (!applicationDoc.exists()) {
                    setError("Application not found");
                    setLoading(false);
                    return;
                }

                const applicationData = applicationDoc.data() as Application;
                setApplication(applicationData);

                // Fetch review data using the new service
                const reviews = await getReviewsForApplicationAdmin(applicationId);
                setReviewSummary(reviews);

                // Fetch reviewer information
                if (reviews.primaryReview?.reviewerId) {
                    const primaryReviewerRef = doc(db, "reviewers", reviews.primaryReview.reviewerId);
                    const primaryReviewerDoc = await getDoc(primaryReviewerRef);
                    if (primaryReviewerDoc.exists()) {
                        setPrimaryReviewer({
                            id: primaryReviewerDoc.id,
                            ...primaryReviewerDoc.data()
                        } as ReviewerInfo);
                    }
                }

                if (reviews.secondaryReview?.reviewerId) {
                    const secondaryReviewerRef = doc(db, "reviewers", reviews.secondaryReview.reviewerId);
                    const secondaryReviewerDoc = await getDoc(secondaryReviewerRef);
                    if (secondaryReviewerDoc.exists()) {
                        setSecondaryReviewer({
                            id: secondaryReviewerDoc.id,
                            ...secondaryReviewerDoc.data()
                        } as ReviewerInfo);
                    }
                }

                setLoading(false);
            } catch (err) {
                console.error("Error fetching application data:", err);
                setError("Failed to load application data");
                setLoading(false);
            }
        };

        fetchApplicationData();
    }, [applicationId]);

    const openApplicationViewer = () => {
        if (application?.file) {
            window.open(application.file, '_blank');
        }
    };

    const getCurrentFeedback = (): FeedbackData | null => {
        if (activeReviewer === 'primary') {
            return reviewSummary?.primaryReview?.feedback || null;
        } else {
            return reviewSummary?.secondaryReview?.feedback || null;
        }
    };

    const getCurrentScore = (): string | number | null => {
        if (activeReviewer === 'primary') {
            return reviewSummary?.primaryReview?.score || null;
        } else {
            return reviewSummary?.secondaryReview?.score || null;
        }
    };

    const getCurrentStatus = (): string => {
        if (activeReviewer === 'primary') {
            return reviewSummary?.primaryReview?.status || 'not-started';
        } else {
            return reviewSummary?.secondaryReview?.status || 'not-started';
        }
    };

    const getReviewerName = (reviewer: ReviewerInfo | null): string => {
        if (!reviewer) return 'Not Assigned';
        return `${reviewer.firstName} ${reviewer.lastName}`;
    };

    const closeModal = () => {
        setModalOpen(false)
    }

    const feedbackLabels = {
        significance: 'Significance',
        approach: 'Approach',
        feasibility: 'Feasibility',
        investigator: 'Investigator(s)',
        summary: 'Summary',
    };

    if (loading) {
        return (
            <div>
                <Sidebar links={sidebarItems} />
                <div className="dashboard-container">
                    <div className="dashboard-content">
                        <div className="dashboard-header-container">
                            <img src={logo} alt="Logo" className="dashboard-logo" />
                            <h1 className="dashboard-header">Application Review</h1>
                        </div>
                        <div className="applications-container">
                            <p>Loading application data...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <Sidebar links={sidebarItems} />
                <div className="dashboard-container">
                    <div className="dashboard-content">
                        <div className="dashboard-header-container">
                            <img src={logo} alt="Logo" className="dashboard-logo" />
                            <h1 className="dashboard-header">Application Review</h1>
                        </div>
                        <div className="applications-container">
                            <p className="error-message">{error}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!application) {
        return (
            <div>
                <Sidebar links={sidebarItems} />
                <div className="dashboard-container">
                    <div className="dashboard-content">
                        <div className="dashboard-header-container">
                            <img src={logo} alt="Logo" className="dashboard-logo" />
                            <h1 className="dashboard-header">Application Review</h1>
                        </div>
                        <div className="applications-container">
                            <p>No application data available</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const currentFeedback = getCurrentFeedback();
    const currentScore = getCurrentScore();
    const currentStatus = getCurrentStatus();

    return (
        <div>
            <Sidebar links={sidebarItems} />
            <div className="dashboard-container">
                <div className="dashboard-content">
                    <div className="internal-header">
                        <div className="dashboard-header-container">
                            <img src={logo} alt="Logo" className="dashboard-logo" />
                            <h1 className="dashboard-header">Application Review - Read Only</h1>
                        </div>
                        <button
                            className="back-button"
                            onClick={() => window.history.back()}
                        >
                            Back
                        </button>
                    </div>

                    <div className="applications-container">
                        {application && (
                            <div className="application-info">
                                <h2>Title: {application.title}</h2>
                                <p>Applicant: {application.grantType == "nonresearch" ? (application as NonResearchApplication).requestor : (application as ResearchApplication).principalInvestigator}</p>
                                <p>Type: {application.grantType}</p>
                            </div>
                        )}

                        <p className="view-app-link" onClick={() => setModalOpen(true)}>VIEW APPLICATION</p>

                        {/* Reviewer Toggle */}
                        <div className="reviewer-toggle">
                            <button
                                className={`reviewer-toggle-btn ${activeReviewer === 'primary' ? 'active' : ''}`}
                                onClick={() => setActiveReviewer('primary')}
                                disabled={!reviewSummary?.primaryReview}
                            >
                                <div>Primary Reviewer</div>
                                <div className="reviewer-name">
                                    {getReviewerName(primaryReviewer)}
                                </div>
                            </button>
                            <button
                                className={`reviewer-toggle-btn ${activeReviewer === 'secondary' ? 'active' : ''}`}
                                onClick={() => setActiveReviewer('secondary')}
                                disabled={!reviewSummary?.secondaryReview}
                            >
                                <div>Secondary Reviewer</div>
                                <div className="reviewer-name">
                                    {getReviewerName(secondaryReviewer)}
                                </div>
                            </button>
                        </div>

                        {/* Review Status Indicator */}
                        <div className={`review-status-indicator ${currentStatus}`}>
                            {currentStatus === 'completed' && 'Review Completed'}
                            {currentStatus === 'in-progress' && 'Review In Progress'}
                            {currentStatus === 'not-started' && 'Review Not Started'}
                        </div>

                        {/* Overall Score */}
                        {currentScore && (
                            <div className="score-section">
                                <p className="score-label">
                                    Overall score: (1 <em>exceptional</em> - 5{" "}
                                    <em>poor quality, unrepairable</em>)
                                </p>
                                <div className="score-display">{currentScore}</div>
                            </div>
                        )}

                        {/* Feedback Display */}
                        {currentFeedback && (
                            <div className="feedback-container">
                                {Object.entries(feedbackLabels).map(([key, label]) => (
                                    <div key={key} className="feedback-section">
                                        <div className="feedback-header">
                                            <PencilIcon />
                                            <strong>{label}:</strong>
                                        </div>
                                        <div className="feedback-text">
                                            {currentFeedback[key as keyof FeedbackData] || 'No feedback provided'}
                                        </div>
                                    </div>
                                ))}

                                <div className="feedback-section">
                                    <div className="feedback-header">
                                        <PencilIcon />
                                        <strong>Internal Comments:</strong>
                                    </div>
                                    <div className="feedback-text">
                                        {currentFeedback.internal || 'No internal comments provided'}
                                    </div>
                                </div>
                            </div>
                        )}

                        {!currentFeedback && currentStatus === 'not-started' && (
                            <div className="no-review-message">
                                <p>No review has been submitted yet by this reviewer.</p>
                            </div>
                        )}

                        {/* Final Score if both reviews are completed */}
                        {reviewSummary?.primaryReview?.status === 'completed' &&
                            reviewSummary?.secondaryReview?.status === 'completed' && (
                                <div className="final-score">
                                    Final Score: <span className="score-display">
                                        {((reviewSummary.primaryReview.score || 0) + (reviewSummary.secondaryReview.score || 0)) / 2}
                                    </span>
                                    <span className="red-text">
                                        (Average of both reviewer scores)
                                    </span>
                                </div>
                            )}
                    </div>
                </div>
                {application ? <CoverPageModal onClose={closeModal} isOpen={modalOpen} application={application}></CoverPageModal> : ""}
            </div>
        </div>
    );
}

export default ApplicationReviewReadOnly;