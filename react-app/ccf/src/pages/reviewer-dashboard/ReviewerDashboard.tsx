import React, { useEffect, useState } from "react";
import { FaFileAlt, FaArrowUp, FaArrowDown } from "react-icons/fa";
import logo from "../../assets/ccf-logo.png";
import Phone from '../../assets/call.png';
import Email from '../../assets/mail.png';
import document from '../../assets/documentIcon.png';
import "./ReviewerDashboard.css";
import Sidebar from "../../components/sidebar/Sidebar";
import FAQComponent from "../../components/faq/FaqComp";
import { getSidebarbyRole } from "../../types/sidebar-types";
import ApplicationBox, { type Application } from "../../components/applications/ApplicationBox";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { auth } from "../.."; // Adjust path as needed
import { db } from "../.."
interface FAQItem {
    question: string;
    answer: string;
}
//TODO alter this to use Revies collection

interface ReviewerProp {
    faqData: FAQItem[];
    email: string;
    phone: string;
    hours: string;
}

function ReviewerDashboard({ faqData, email, phone, hours }: ReviewerProp): JSX.Element {
    const sidebarItems = getSidebarbyRole('reviewer');
    // State for expandable sections
    const [isApplicationCollapsed, setApplicationCollapsed] = useState(false);
    const [isFAQCollapsed, setFAQCollapsed] = useState(true);
    const [isContactCollapsed, setContactCollapsed] = useState(false);

    // State for applications
    const [pendingReviews, setPendingReviews] = useState<Application[]>([]);
    const [inProgressReviews, setInProgressReviews] = useState<Application[]>([]);
    const [completedReviews, setCompletedReviews] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // State for FAQ
    const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(null);

    // Auth context for current user
    const { currentUser } = auth;

    // Toggle functions
    const toggleApplication = () => setApplicationCollapsed(!isApplicationCollapsed);
    const toggleFAQ = () => setFAQCollapsed(!isFAQCollapsed);
    const toggleContact = () => setContactCollapsed(!isContactCollapsed);
    const handleQuestionClick = (index: number) => {
        setOpenFAQIndex(openFAQIndex === index ? null : index);
    };

    const handleDueDateClick = (dueDate: string, applicationId: string) => {
        // Navigate to review page with application ID
        window.location.href = `/reviewer/review?id=${applicationId}`;
    };

    // Fetch reviewer's assigned applications from Firebase
    useEffect(() => {
        const fetchAssignedApplications = async () => {
            if (!currentUser) {
                setError("User not authenticated");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);

                // First, get the reviewer document to find assigned applications
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
                const reviewerData = reviewerDoc.data();
                const assignedApplications = reviewerData.assignedApplications || [];

                // Arrays for different application status
                const notStarted: Application[] = [];
                const inProgress: Application[] = [];
                const completed: Application[] = [];

                // Fetch each assigned application
                for (const appId of assignedApplications) {
                    const appDoc = await getDoc(doc(db, "applications", appId));

                    if (appDoc.exists()) {
                        const appData = appDoc.data();

                        // Create application object
                        const application: Application = {
                            id: appDoc.id,
                            applicationType: appData.grantType || "Application",
                            dueDate: appData.dueDate || "No due date specified",
                            status: appData.reviewStatus || "not-started",
                            title: appData.title || "Untitled Application",
                            principalInvestigator: appData.principalInvestigator || "Unknown"
                        };

                        // Determine which array to add to based on review status
                        const isPrimaryReviewer = appData.primaryReviewer === reviewerDoc.id;
                        const isSecondaryReviewer = appData.secondaryReviewer === reviewerDoc.id;

                        // Only include applications where this reviewer is assigned
                        if (isPrimaryReviewer || isSecondaryReviewer) {
                            // Track review progress for this specific reviewer
                            const reviewerSpecificStatus = isPrimaryReviewer
                                ? appData.primaryReviewStatus
                                : appData.secondaryReviewStatus;

                            // Format date for display
                            const dueDateStr = appData.dueDate
                                ? new Date(appData.dueDate).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })
                                : "No deadline";

                            if (reviewerSpecificStatus === "completed") {
                                // Format submission date
                                const submittedDate = appData.reviewSubmittedDate
                                    ? new Date(appData.reviewSubmittedDate).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })
                                    : "Recently";

                                completed.push({
                                    ...application,
                                    dueDate: `SUBMITTED: ${submittedDate}`
                                });
                            } else if (reviewerSpecificStatus === "in-progress") {
                                inProgress.push({
                                    ...application,
                                    dueDate: `DUE ${dueDateStr.toUpperCase()}`
                                });
                            } else {
                                notStarted.push({
                                    ...application,
                                    dueDate: `DUE ${dueDateStr.toUpperCase()}`
                                });
                            }
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
                setError("Failed to load applications. Please try again later.");
                setLoading(false);
            }
        };

        fetchAssignedApplications();
    }, [currentUser]);

    return (
        <div>
            <Sidebar links={sidebarItems} />
            <div className="dashboard-container">

                <div className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>

                    <div className="dashboard-header-container">
                        <img src={logo} alt="Logo" className="dashboard-logo" />
                        <h1 className="dashboard-header">Reviewer Dashboard</h1>
                    </div>

                    <div className="dashboard-sections-content" style={{ flexGrow: 1 }}>
                        <div className="dashboard-section">
                            <div className="section-header">
                                <div className="header-content">
                                    <img src={document} alt="Document Icon" className="section-icon" />
                                    <h2>Applications to Review</h2>
                                </div>
                                <button onClick={toggleApplication} className="expand-collapse-btn">
                                    {isApplicationCollapsed ? <FaArrowDown /> : <FaArrowUp />}
                                </button>
                            </div>

                            {!isApplicationCollapsed && (
                                <div className="applications-container">
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
                                                            applicationType={application.applicationType}
                                                            dueDate={application.dueDate}
                                                            title={application.title}
                                                            principalInvestigator={application.principalInvestigator}
                                                            onClick={() => handleDueDateClick(application.dueDate, application.id || '')}
                                                        />
                                                    ))}
                                                    <hr className="red-line" />
                                                </>
                                            )}

                                            {inProgressReviews.length > 0 && (
                                                <>
                                                    <h3>IN PROGRESS REVIEWS:</h3>
                                                    {inProgressReviews.map((application, index) => (
                                                        <ApplicationBox
                                                            key={index}
                                                            applicationType={application.applicationType}
                                                            dueDate={application.dueDate}
                                                            title={application.title}
                                                            principalInvestigator={application.principalInvestigator}
                                                            onClick={() => handleDueDateClick(application.dueDate, application.id || '')}
                                                        />
                                                    ))}
                                                    <hr className="red-line" />
                                                </>
                                            )}

                                            {completedReviews.length > 0 && (
                                                <>
                                                    <h3>COMPLETED REVIEWS:</h3>
                                                    {completedReviews.map((application, index) => (
                                                        <ApplicationBox
                                                            key={index}
                                                            applicationType={application.applicationType}
                                                            dueDate={application.dueDate}
                                                            title={application.title}
                                                            principalInvestigator={application.principalInvestigator}
                                                            onClick={() => handleDueDateClick(application.dueDate, application.id || '')}
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
                            )}
                        </div>

                        <div className="dashboard-section">
                            <div className="section-header">
                                <div className="header-content">
                                    <img src={document} alt="Document Icon" className="section-icon" />
                                    <h2>Frequently Asked Questions</h2>
                                </div>
                                <button onClick={toggleFAQ} className="expand-collapse-btn">
                                    {isFAQCollapsed ? <FaArrowDown /> : <FaArrowUp />}
                                </button>
                            </div>
                            {!isFAQCollapsed && (
                                <div className="faq-content-wrapper">
                                    <FAQComponent faqs={faqData} />
                                </div>
                            )}
                        </div>

                        <div className="dashboard-section">
                            <div className="section-header">
                                <div className="header-content">
                                    <img src={document} alt="Document Icon" className="section-icon" />
                                    <h2>Contact Us</h2>
                                </div>
                                <button onClick={toggleContact} className="expand-collapse-btn">
                                    {isContactCollapsed ? <FaArrowDown /> : <FaArrowUp />}
                                </button>
                            </div>
                            {!isContactCollapsed && (
                                <div className="contact-box">
                                    <div className="contact-method">
                                        <div className="contact-method-header">
                                            <img src={Email} alt="Email Icon" className="contact-icon" />
                                            <h2 className="contact-method-title">Email Support</h2>
                                        </div>
                                        <p className="contact-text">Email us and we'll get back to you as soon as possible.</p>
                                        <a href={`mailto:${email}`} className="contact-link">
                                            {email}
                                        </a>
                                    </div>

                                    <div className="contact-method">
                                        <div className="contact-method-header">
                                            <img src={Phone} alt="Phone Icon" className="contact-icon" />
                                            <h2 className="contact-method-title">Call Support</h2>
                                        </div>
                                        <p className="contact-text">Call us and we'll get back to you as soon as possible.</p>
                                        <a href={`tel:${phone}`} className="contact-link">
                                            {phone}
                                        </a>
                                        <p className="contact-hours">{hours}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ReviewerDashboard;