import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./ApplicationReview.css";
import Sidebar from "../../components/sidebar/Sidebar";
import logo from "../../assets/ccf-logo.png";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../..";
import { getSidebarbyRole } from "../../types/sidebar-types";

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
    internal: string;
}

interface ApplicationData {
    title: string;
    principalInvestigator: string;
    grantType: string;
    pdf?: string;
    primaryReviewer?: string;
    secondaryReviewer?: string;
    primaryReviewFeedback?: FeedbackData;
    secondaryReviewFeedback?: FeedbackData;
    primaryReviewScore?: string | number;
    secondaryReviewScore?: string | number;
    primaryReviewStatus?: string;
    secondaryReviewStatus?: string;
    finalScore?: number;
}

function ApplicationReviewReadOnly(): JSX.Element {
    const sidebarItems = getSidebarbyRole("reviewer");

    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const applicationId = searchParams.get("id");

    // Log the URL and extracted ID for debugging
    useEffect(() => {
        console.log("Current URL:", location.pathname + location.search);
        console.log("Extracted Application ID:", applicationId);
    }, [location, applicationId]);

    const [application, setApplication] = useState<ApplicationData | null>(null);
    const [primaryReviewer, setPrimaryReviewer] = useState<ReviewerInfo | null>(null);
    const [secondaryReviewer, setSecondaryReviewer] = useState<ReviewerInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeReviewer, setActiveReviewer] = useState<'primary' | 'secondary'>('primary');

    // Fetch application data and reviewer information
    useEffect(() => {
        const fetchApplicationData = async () => {
            if (!applicationId) {
                setError("No application ID provided");
                setLoading(false);
                return;
            }

            try {
                console.log("Fetching application data for ID:", applicationId);

                // Get application document
                const applicationRef = doc(db, "applications", applicationId);
                const applicationDoc = await getDoc(applicationRef);

                if (!applicationDoc.exists()) {
                    setError("Application not found");
                    setLoading(false);
                    return;
                }

                const applicationData = applicationDoc.data() as ApplicationData;
                console.log("Application data:", applicationData);
                setApplication(applicationData);

                // Fetch primary reviewer info if available
                if (applicationData.primaryReviewer) {
                    const primaryReviewerRef = doc(db, "reviewers", applicationData.primaryReviewer);
                    const primaryReviewerDoc = await getDoc(primaryReviewerRef);
                    if (primaryReviewerDoc.exists()) {
                        setPrimaryReviewer({
                            id: primaryReviewerDoc.id,
                            ...primaryReviewerDoc.data()
                        } as ReviewerInfo);
                    }
                }

                // Fetch secondary reviewer info if available
                if (applicationData.secondaryReviewer) {
                    const secondaryReviewerRef = doc(db, "reviewers", applicationData.secondaryReviewer);
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
        if (application?.pdf) {
            window.open(application.pdf, '_blank');
        } else {
            alert("Application PDF not available");
        }
    };

    const getCurrentFeedback = (): FeedbackData | null => {
        if (activeReviewer === 'primary') {
            return application?.primaryReviewFeedback || null;
        } else {
            return application?.secondaryReviewFeedback || null;
        }
    };

    const getCurrentScore = (): string | number | null => {
        if (activeReviewer === 'primary') {
            return application?.primaryReviewScore || null;
        } else {
            return application?.secondaryReviewScore || null;
        }
    };

    const getCurrentStatus = (): string => {
        if (activeReviewer === 'primary') {
            return application?.primaryReviewStatus || 'not-started';
        } else {
            return application?.secondaryReviewStatus || 'not-started';
        }
    };

    const getReviewerName = (reviewer: ReviewerInfo | null): string => {
        if (!reviewer) return 'Not Assigned';
        return `${reviewer.firstName} ${reviewer.lastName}`;
    };

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
                                <p>Applicant: {application.principalInvestigator}</p>
                                <p>Type: {application.grantType}</p>
                            </div>
                        )}

                        <p className="view-app-link" onClick={openApplicationViewer}>VIEW APPLICATION</p>

                        {/* Reviewer Toggle */}
                        <div className="reviewer-toggle">
                            <button
                                className={`reviewer-toggle-btn ${activeReviewer === 'primary' ? 'active' : ''}`}
                                onClick={() => setActiveReviewer('primary')}
                                disabled={!application?.primaryReviewer}
                            >
                                <div>Primary Reviewer</div>
                                <div className="reviewer-name">
                                    {getReviewerName(primaryReviewer)}
                                </div>
                            </button>
                            <button
                                className={`reviewer-toggle-btn ${activeReviewer === 'secondary' ? 'active' : ''}`}
                                onClick={() => setActiveReviewer('secondary')}
                                disabled={!application?.secondaryReviewer}
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
                        {application?.finalScore && (
                            <div className="final-score">
                                Final Score: <span className="score-display">{application.finalScore}</span>
                                <span className="red-text">
                                    (Average of both reviewer scores)
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ApplicationReviewReadOnly;