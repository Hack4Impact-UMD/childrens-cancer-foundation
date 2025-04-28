import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./ApplicationReview.css";
import Sidebar from "../../components/sidebar/Sidebar";
import logo from "../../assets/ccf-logo.png";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../..";

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
    const sidebarItems = [
        { name: "Home", path: "/" },
        { name: "Account Settings", path: "/settings" },
        { name: "Logout", path: "/login" },
    ];

    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const applicationId = searchParams.get("id");

    // Log the URL and extracted ID for debugging
    useEffect(() => {
        console.log("Current URL:", location.pathname + location.search);
        console.log("Extracted Application ID:", applicationId);
    }, [location, applicationId]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [application, setApplication] = useState<ApplicationData | null>(null);
    const [currentReviewType, setCurrentReviewType] = useState<'primary' | 'secondary'>('primary');
    const [primaryReviewer, setPrimaryReviewer] = useState<ReviewerInfo | null>(null);
    const [secondaryReviewer, setSecondaryReviewer] = useState<ReviewerInfo | null>(null);

    // Fetch application and reviewer data
    useEffect(() => {
        const fetchData = async () => {
            if (!applicationId) {
                setError("No application ID provided");
                setLoading(false);
                return;
            }

            console.log("Fetching data for application ID:", applicationId);

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

                const applicationData = applicationDoc.data() as ApplicationData;
                setApplication({
                    ...applicationData,
                    // Ensure feedback objects exist to prevent errors
                    primaryReviewFeedback: applicationData.primaryReviewFeedback || {
                        significance: "",
                        approach: "",
                        feasibility: "",
                        investigator: "",
                        summary: "",
                        internal: ""
                    },
                    secondaryReviewFeedback: applicationData.secondaryReviewFeedback || {
                        significance: "",
                        approach: "",
                        feasibility: "",
                        investigator: "",
                        summary: "",
                        internal: ""
                    }
                });

                // Fetch primary reviewer info if exists
                if (applicationData.primaryReviewer) {
                    const reviewerDoc = await getDoc(doc(db, "reviewers", applicationData.primaryReviewer));
                    if (reviewerDoc.exists()) {
                        const reviewerData = reviewerDoc.data();
                        setPrimaryReviewer({
                            id: reviewerDoc.id,
                            firstName: reviewerData.firstName || "",
                            lastName: reviewerData.lastName || "",
                            email: reviewerData.email || "",
                            affiliation: reviewerData.affiliation || ""
                        });
                    }
                }

                // Fetch secondary reviewer info if exists
                if (applicationData.secondaryReviewer) {
                    const reviewerDoc = await getDoc(doc(db, "reviewers", applicationData.secondaryReviewer));
                    if (reviewerDoc.exists()) {
                        const reviewerData = reviewerDoc.data();
                        setSecondaryReviewer({
                            id: reviewerDoc.id,
                            firstName: reviewerData.firstName || "",
                            lastName: reviewerData.lastName || "",
                            email: reviewerData.email || "",
                            affiliation: reviewerData.affiliation || ""
                        });
                    }
                }

                setLoading(false);
            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Failed to load application data");
                setLoading(false);
            }
        };

        fetchData();
    }, [applicationId]);

    const handleSwitchReviewer = (type: 'primary' | 'secondary') => {
        setCurrentReviewType(type);
    };

    const getCurrentFeedback = () => {
        if (!application) return null;

        return currentReviewType === 'primary'
            ? application.primaryReviewFeedback
            : application.secondaryReviewFeedback;
    };

    const getCurrentScore = () => {
        if (!application) return "N/A";

        const score = currentReviewType === 'primary'
            ? application.primaryReviewScore
            : application.secondaryReviewScore;

        return score !== undefined ? score : "Not scored";
    };

    const getCurrentReviewer = () => {
        return currentReviewType === 'primary' ? primaryReviewer : secondaryReviewer;
    };

    const getCurrentReviewStatus = () => {
        if (!application) return "unknown";

        return currentReviewType === 'primary'
            ? application.primaryReviewStatus
            : application.secondaryReviewStatus;
    };

    const openApplicationViewer = () => {
        if (application?.pdf) {
            window.open(application.pdf, '_blank');
        } else {
            alert("Application PDF not available");
        }
    };

    if (loading) {
        return (
            <div>
                <Sidebar links={sidebarItems} />
                <div className="dashboard-container">
                    <div className="dashboard-content">
                        <div className="dashboard-header-container">
                            <img src={logo} alt="Logo" className="dashboard-logo" />
                            <h1 className="dashboard-header">Review Summary</h1>
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
                            <h1 className="dashboard-header">Review Summary</h1>
                        </div>
                        <div className="applications-container">
                            <p className="error-message">{error}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const feedback = getCurrentFeedback();
    const currentReviewer = getCurrentReviewer();
    const reviewStatus = getCurrentReviewStatus();

    return (
        <div>
            <Sidebar links={sidebarItems} />

            <div className="dashboard-container">
                <div className="dashboard-content">
                    <div className="dashboard-header-container">
                        <img src={logo} alt="Logo" className="dashboard-logo" />
                        <h1 className="dashboard-header">Review Summary</h1>
                    </div>

                    <div className="applications-container">
                        {application && (
                            <div className="application-info">
                                <h2>Title: {application.title}</h2>
                                <p>{"\u00A0"} Applicant: {application.principalInvestigator}</p>
                                <p>{"\u00A0"} Type: {application.grantType}</p>
                                {application.finalScore && (
                                    <p className="final-score">Final Score: {application.finalScore.toFixed(1)}</p>
                                )}
                            </div>
                        )}

                        <div className="reviewer-toggle">
                            <button
                                className={`reviewer-toggle-btn ${currentReviewType === 'primary' ? 'active' : ''}`}
                                onClick={() => handleSwitchReviewer('primary')}
                                disabled={!primaryReviewer}
                            >
                                Primary Reviewer
                                {primaryReviewer && (
                                    <span className="reviewer-name">
                    ({primaryReviewer.firstName} {primaryReviewer.lastName})
                  </span>
                                )}
                            </button>
                            <button
                                className={`reviewer-toggle-btn ${currentReviewType === 'secondary' ? 'active' : ''}`}
                                onClick={() => handleSwitchReviewer('secondary')}
                                disabled={!secondaryReviewer}
                            >
                                Secondary Reviewer
                                {secondaryReviewer && (
                                    <span className="reviewer-name">
                    ({secondaryReviewer.firstName} {secondaryReviewer.lastName})
                  </span>
                                )}
                            </button>
                        </div>

                        <div className={`review-status-indicator ${reviewStatus}`}>
                            Review Status: {reviewStatus === 'completed' ? 'Completed' : reviewStatus === 'in-progress' ? 'In Progress' : 'Not Started'}
                        </div>

                        <p className="view-app-link" onClick={openApplicationViewer}>VIEW APPLICATION</p>

                        <div className="score-section">
                            <p className="score-label">
                                Overall score: (1 <em>exceptional</em> - 5{" "}
                                <em>poor quality, unrepairable</em>)
                            </p>
                            <div className="score-display">{getCurrentScore()}</div>
                        </div>

                        <p className="feedback-heading">
                            Feedback: <br />
                            <span className="red-text">
                ALL information inputted (unless otherwise noted) WILL be sent
                to applicant.
              </span>
                        </p>

                        {feedback && [
                            {
                                key: "significance",
                                label: "SIGNIFICANCE",
                                question:
                                    "How significant is the childhood cancer problem addressed by this proposal? How will the proposed study add to or enhance the currently available methods to prevent, treat or manage childhood cancer?",
                            },
                            {
                                key: "approach",
                                label: "APPROACH",
                                question:
                                    "Is the study hypothesis-driven? Is this a novel hypothesis or research question? How well do existing data support the current hypothesis? Are the aims and objectives appropriate for the hypothesis being tested? Are the methodology and evaluation component adequate to provide a convincing test of the hypothesis? Have the applicants adequately accounted for potential confounders? Are there any methodological weaknesses? If there are methodological weaknesses, how may they be corrected? Is the statistical analysis adequate?",
                            },
                            {
                                key: "feasibility",
                                label: "FEASIBILITY",
                                question:
                                    "Comment on how well the research team is to carry out the study. Is it feasible to carry out the project in the proposed location(s)? Can the project be accomplished within the proposed time period?",
                            },
                            {
                                key: "investigator",
                                label: "INVESTIGATOR",
                                question:
                                    "What has the productivity of the PI been over the past 3 years? If successful, does the track record of the PI indicate that future peer-reviewed funding will allow the project to continue? Are there adequate collaborations for work outside the PI's expertise?",
                            },
                            {
                                key: "summary",
                                label: "SUMMARY",
                                question:
                                    "Please provide any additional comments that would be helpful to the applicant, such as readability, grantsponsorship, etc., especially if the application does not score well.",
                            },
                        ].map(({ key, label, question }) => (
                            <div key={key} className="feedback-section">
                                <div className="feedback-header">
                                    <label>
                                        <strong>{label}:</strong> {question}
                                    </label>
                                </div>
                                <div className="feedback-content">
                                    <div className="feedback-text">
                                        {feedback[key as keyof FeedbackData] || "No feedback provided."}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {feedback && (
                            <div className="internal-section">
                                <div className="internal-header">
                                    <p className="internal-label">Internal Comments/Notes:</p>
                                </div>
                                <p className="internal-warning">
                                    <strong>
                                        Information entered in this textbox was NOT shared with
                                        the applicant.
                                    </strong>
                                    <br />
                                    It was reserved for reviewer to reference during review call.
                                </p>
                                <div className="feedback-text">{feedback.internal || "No internal comments provided."}</div>
                            </div>
                        )}
                    </div>

                    <div className="button-group">
                        <button
                            className="back-button"
                            onClick={() => window.history.back()}
                        >
                            Back to Applications
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ApplicationReviewReadOnly;